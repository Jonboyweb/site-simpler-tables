import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { z } from 'zod';

import { createPaymentIntent } from '@/lib/payments/stripe';
import type { Database } from '@/types/database.types';
import {
  customerDetailsSchema,
  tableSelectionSchema,
  paymentSchema,
  type CreateBookingRequest,
  type BookingResponse,
  DRINKS_PACKAGES
} from '@/types/booking';

// Request validation schema
const createBookingSchema = z.object({
  eventDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format'),
  customerDetails: customerDetailsSchema,
  tableSelection: tableSelectionSchema,
  payment: paymentSchema
});

// Generate unique booking reference
function generateBookingRef(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return `BRL-${timestamp}-${random}`.toUpperCase();
}

// Validate table availability
async function validateTableAvailability(
  supabase: any,
  eventDate: string,
  tableIds: number[]
): Promise<{ valid: boolean; message?: string }> {
  try {
    // Check if tables exist and are active
    const { data: tables, error: tablesError } = await supabase
      .from('venue_tables')
      .select('id, table_number, capacity_min, capacity_max, is_active')
      .in('id', tableIds);

    if (tablesError) {
      console.error('Table validation error:', tablesError);
      return { valid: false, message: 'Error validating tables' };
    }

    if (!tables || tables.length !== tableIds.length) {
      return { valid: false, message: 'One or more selected tables do not exist' };
    }

    // Check if all tables are active
    const inactiveTables = tables.filter(t => !t.is_active);
    if (inactiveTables.length > 0) {
      return {
        valid: false,
        message: `Tables ${inactiveTables.map(t => t.table_number).join(', ')} are not available`
      };
    }

    // Check for existing bookings on the same date
    const { data: existingBookings, error: bookingsError } = await supabase
      .from('bookings')
      .select('table_ids, status')
      .eq('booking_date', eventDate)
      .in('status', ['confirmed', 'pending', 'arrived']);

    if (bookingsError) {
      console.error('Existing bookings check error:', bookingsError);
      return { valid: false, message: 'Error checking table availability' };
    }

    // Check for conflicts
    const bookedTableIds = new Set();
    existingBookings?.forEach((booking: any) => {
      booking.table_ids?.forEach((id: number) => bookedTableIds.add(id));
    });

    const conflictingTables = tableIds.filter(id => bookedTableIds.has(id));
    if (conflictingTables.length > 0) {
      const conflictingTableNumbers = tables
        .filter(t => conflictingTables.includes(t.id))
        .map(t => t.table_number);
      
      return {
        valid: false,
        message: `Tables ${conflictingTableNumbers.join(', ')} are already booked for this date`
      };
    }

    return { valid: true };

  } catch (error) {
    console.error('Table availability validation error:', error);
    return { valid: false, message: 'Error validating table availability' };
  }
}

// GET: Retrieve bookings
export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient<Database>({ cookies });
    const { searchParams } = new URL(request.url);
    
    const date = searchParams.get('date');
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    let query = supabase
      .from('bookings')
      .select(`
        id,
        booking_ref,
        booking_date,
        arrival_time,
        customer_name,
        customer_email,
        customer_phone,
        party_size,
        table_ids,
        status,
        deposit_amount,
        package_amount,
        remaining_balance,
        drinks_package,
        special_requests,
        created_at,
        updated_at,
        checked_in_at,
        cancelled_at
      `)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    // Apply filters
    if (date) {
      query = query.eq('booking_date', date);
    }
    if (status) {
      query = query.eq('status', status);
    }

    const { data: bookings, error, count } = await query;

    if (error) {
      console.error('Bookings retrieval error:', error);
      return NextResponse.json(
        { error: 'Failed to retrieve bookings' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      bookings: bookings || [],
      pagination: {
        total: count || 0,
        limit,
        offset,
        hasMore: (count || 0) > offset + limit
      }
    });

  } catch (error) {
    console.error('Bookings API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST: Create new booking
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate request body
    const validationResult = createBookingSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: 'Invalid booking data',
          details: validationResult.error.errors
        },
        { status: 400 }
      );
    }

    const bookingRequest: CreateBookingRequest = validationResult.data;
    const supabase = createRouteHandlerClient<Database>({ cookies });

    // Validate table availability
    const availabilityCheck = await validateTableAvailability(
      supabase,
      bookingRequest.eventDate,
      bookingRequest.tableSelection.tableIds
    );

    if (!availabilityCheck.valid) {
      return NextResponse.json(
        { error: availabilityCheck.message },
        { status: 409 }
      );
    }

    // Get drinks package details
    const selectedPackage = DRINKS_PACKAGES.find(
      pkg => pkg.id === bookingRequest.tableSelection.drinksPackage
    );

    if (!selectedPackage) {
      return NextResponse.json(
        { error: 'Invalid drinks package selected' },
        { status: 400 }
      );
    }

    // Calculate amounts
    const packageAmount = selectedPackage.price;
    const depositAmount = 50; // £50 deposit
    const remainingBalance = packageAmount - depositAmount;

    // Generate booking reference
    const bookingRef = generateBookingRef();

    // Create booking record
    const bookingData = {
      booking_ref: bookingRef,
      booking_date: bookingRequest.eventDate,
      arrival_time: bookingRequest.tableSelection.arrivalTime,
      customer_name: bookingRequest.customerDetails.name,
      customer_email: bookingRequest.customerDetails.email,
      customer_phone: bookingRequest.customerDetails.phone,
      party_size: bookingRequest.customerDetails.partySize,
      table_ids: bookingRequest.tableSelection.tableIds,
      deposit_amount: depositAmount,
      package_amount: packageAmount,
      remaining_balance: remainingBalance,
      drinks_package: {
        id: selectedPackage.id,
        name: selectedPackage.name,
        price: selectedPackage.price,
        description: selectedPackage.description
      },
      special_requests: bookingRequest.customerDetails.specialRequests ? {
        text: bookingRequest.customerDetails.specialRequests,
        marketing_consent: bookingRequest.payment.marketingConsent
      } : null,
      status: 'pending' as const
    };

    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .insert(bookingData)
      .select()
      .single();

    if (bookingError) {
      console.error('Booking creation error:', bookingError);
      return NextResponse.json(
        { error: 'Failed to create booking' },
        { status: 500 }
      );
    }

    // Create Stripe Payment Intent
    const paymentResult = await createPaymentIntent({
      amount: depositAmount * 100, // Convert to pence
      metadata: {
        booking_id: booking.id,
        event_date: bookingRequest.eventDate,
        table_ids: bookingRequest.tableSelection.tableIds.join(','),
        venue: 'backroom-leeds',
        customer_email: bookingRequest.customerDetails.email,
        customer_name: bookingRequest.customerDetails.name
      },
      customerEmail: bookingRequest.customerDetails.email,
      description: `Table booking deposit - ${bookingRef}`
    });

    if (!paymentResult.success) {
      // Delete the booking if payment intent creation failed
      await supabase
        .from('bookings')
        .delete()
        .eq('id', booking.id);

      return NextResponse.json(
        { error: paymentResult.error || 'Payment processing failed' },
        { status: 500 }
      );
    }

    // Update booking with payment intent ID
    const { error: updateError } = await supabase
      .from('bookings')
      .update({
        stripe_payment_intent_id: paymentResult.paymentIntent!.id
      })
      .eq('id', booking.id);

    if (updateError) {
      console.error('Booking payment intent update error:', updateError);
      // Continue anyway as the booking exists and payment intent is created
    }

    // Prepare response
    const response: BookingResponse = {
      id: booking.id,
      bookingRef: booking.booking_ref,
      status: booking.status,
      paymentIntent: {
        id: paymentResult.paymentIntent!.id,
        clientSecret: paymentResult.clientSecret!,
        amount: depositAmount * 100
      },
      totalAmount: packageAmount,
      depositAmount,
      remainingBalance,
      createdAt: booking.created_at
    };

    return NextResponse.json(response, { status: 201 });

  } catch (error) {
    console.error('Booking creation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}