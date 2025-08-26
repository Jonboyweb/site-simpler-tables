/**
 * Booking Confirmation Email API Route
 * 
 * Handles sending booking confirmation emails through the email workflow system.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getBookingEmailWorkflow } from '@/lib/email/workflows/BookingWorkflow';
import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';

// ============================================================================
// Request Validation Schema
// ============================================================================

const BookingConfirmationRequestSchema = z.object({
  bookingId: z.string().min(1, 'Booking ID is required'),
  customerId: z.string().min(1, 'Customer ID is required'),
  includeQRCode: z.boolean().default(true),
  priority: z.enum(['critical', 'high', 'normal', 'low']).default('high'),
  scheduleAt: z.string().datetime().optional(),
  templateOverrides: z.record(z.any()).optional()
});

type BookingConfirmationRequest = z.infer<typeof BookingConfirmationRequestSchema>;

// ============================================================================
// API Handler
// ============================================================================

export async function POST(request: NextRequest) {
  try {
    // Parse and validate request
    const body = await request.json();
    const validatedData = BookingConfirmationRequestSchema.parse(body);

    const { bookingId, customerId, includeQRCode, priority, scheduleAt, templateOverrides } = validatedData;

    // Initialize Supabase client
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Fetch booking details with customer information
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .select(`
        *,
        customer:customers!bookings_customer_id_fkey (*),
        event:events!bookings_event_id_fkey (*)
      `)
      .eq('id', bookingId)
      .single();

    if (bookingError || !booking) {
      return NextResponse.json(
        { 
          error: 'Booking not found',
          details: bookingError?.message 
        },
        { status: 404 }
      );
    }

    // Verify customer ownership
    if (booking.customer_id !== customerId) {
      return NextResponse.json(
        { error: 'Customer ID does not match booking' },
        { status: 403 }
      );
    }

    // Generate QR code if requested
    let qrCode: any = undefined;
    if (includeQRCode) {
      try {
        const qrResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/bookings/${bookingId}/generate-qr`, {
          method: 'POST',
          headers: {
            'Authorization': request.headers.get('Authorization') || '',
            'Content-Type': 'application/json'
          }
        });

        if (qrResponse.ok) {
          qrCode = await qrResponse.json();
        }
      } catch (error) {
        console.warn('Failed to generate QR code for booking confirmation:', error);
      }
    }

    // Fetch drinks package if applicable
    let drinksPackage: any = undefined;
    if (booking.drinks_package_id) {
      const { data: packageData } = await supabase
        .from('drinks_packages')
        .select('*')
        .eq('id', booking.drinks_package_id)
        .single();
      
      if (packageData) {
        drinksPackage = {
          name: packageData.name,
          price: packageData.price,
          description: packageData.description,
          includes: packageData.items || []
        };
      }
    }

    // Prepare email context
    const emailContext = {
      booking: {
        id: booking.id,
        customerId: booking.customer_id,
        customerName: booking.customer.name,
        customerEmail: booking.customer.email,
        date: new Date(booking.date),
        timeSlot: booking.time_slot,
        tableName: booking.table_name,
        floor: booking.floor,
        partySize: booking.party_size,
        specialRequests: booking.special_requests,
        totalAmount: booking.total_amount,
        depositPaid: booking.deposit_paid,
        remainingBalance: booking.total_amount - booking.deposit_paid,
        status: booking.status,
        createdAt: new Date(booking.created_at),
        updatedAt: new Date(booking.updated_at)
      },
      customer: {
        id: booking.customer.id,
        name: booking.customer.name,
        email: booking.customer.email,
        phone: booking.customer.phone,
        preferences: {
          emailNotifications: booking.customer.email_notifications ?? true,
          smsNotifications: booking.customer.sms_notifications ?? false,
          marketingEmails: booking.customer.marketing_emails ?? false
        }
      },
      venue: {
        name: 'The Backroom Leeds',
        address: 'Lower Briggate, Leeds LS1 6LY',
        phone: '0113 245 1234',
        email: 'bookings@backroomleeds.com',
        policies: [
          'Smart casual dress code (no sportswear or trainers)',
          'Tables are held for 15 minutes past booking time',
          'Cancellations must be made 48 hours in advance for refund eligibility',
          'Challenge 21 policy - please bring valid ID'
        ]
      },
      eventInfo: booking.event ? {
        name: booking.event.name,
        type: booking.event.type,
        djLineup: booking.event.dj_lineup || [],
        specialNotes: booking.event.special_notes
      } : undefined,
      drinksPackage,
      qrCode: qrCode ? {
        dataUrl: qrCode.qrCodeUrl,
        checkInCode: qrCode.checkInCode
      } : undefined
    };

    // Get email workflow
    const workflow = getBookingEmailWorkflow();

    // Process workflow trigger
    await workflow.processWorkflowTrigger({
      event: 'booking_confirmed',
      context: emailContext,
      metadata: {
        triggeredBy: 'api',
        triggeredAt: new Date(),
        scheduleAt: scheduleAt ? new Date(scheduleAt) : undefined,
        priority,
        templateOverrides
      }
    });

    // Return success response
    return NextResponse.json({
      success: true,
      message: 'Booking confirmation email queued successfully',
      bookingId: booking.id,
      recipient: booking.customer.email,
      scheduledFor: scheduleAt || 'immediate'
    });

  } catch (error) {
    console.error('Booking confirmation email API error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          error: 'Invalid request data',
          details: error.errors
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}

// ============================================================================
// GET handler for retrieving booking confirmation status
// ============================================================================

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const bookingId = searchParams.get('bookingId');

    if (!bookingId) {
      return NextResponse.json(
        { error: 'Booking ID is required' },
        { status: 400 }
      );
    }

    // Get workflow to check scheduled jobs
    const workflow = getBookingEmailWorkflow();
    const scheduledJobs = workflow.getScheduledJobs(bookingId);

    // Filter for confirmation emails
    const confirmationJobs = scheduledJobs.filter(job => job.emailType === 'confirmation');

    return NextResponse.json({
      bookingId,
      confirmationEmails: confirmationJobs.map(job => ({
        id: job.id,
        scheduledFor: job.scheduledFor,
        status: job.status,
        attempts: job.attempts,
        lastAttempt: job.lastAttempt
      }))
    });

  } catch (error) {
    console.error('Get booking confirmation status error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}