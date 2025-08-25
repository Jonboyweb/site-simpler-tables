import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { z } from 'zod';

import { createRefund } from '@/lib/payments/stripe';
import type { Database } from '@/types/database.types';

interface RouteContext {
  params: Promise<{ id: string }>;
}

// Cancel booking request schema
const cancelBookingSchema = z.object({
  reason: z.string().min(1, 'Cancellation reason is required').max(500, 'Reason too long'),
  refund_eligible: z.boolean().optional(),
  refund_amount: z.number().min(0).optional()
});

// POST: Cancel booking with refund processing
export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const body = await request.json();
    const supabase = createRouteHandlerClient<Database>({ cookies });
    const params = await context.params;
    const { id } = params;

    // Validate request body
    const validationResult = cancelBookingSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: 'Invalid cancellation data',
          details: validationResult.error.errors
        },
        { status: 400 }
      );
    }

    const { reason, refund_eligible, refund_amount } = validationResult.data;

    // Find booking
    const { data: booking, error: findError } = await supabase
      .from('bookings')
      .select(`
        id, 
        booking_ref, 
        status, 
        booking_date, 
        deposit_amount, 
        stripe_payment_intent_id,
        customer_name,
        customer_email,
        table_ids
      `)
      .eq('booking_ref', id.toUpperCase())
      .single();

    if (findError || !booking) {
      return NextResponse.json(
        { error: 'Booking not found' },
        { status: 404 }
      );
    }

    if (booking.status === 'cancelled') {
      return NextResponse.json(
        { error: 'Booking already cancelled' },
        { status: 400 }
      );
    }

    // Check if booking is for a past event
    const eventDate = new Date(booking.booking_date);
    const now = new Date();
    
    if (eventDate.getTime() <= now.getTime()) {
      return NextResponse.json(
        { error: 'Cannot cancel booking for past events' },
        { status: 400 }
      );
    }

    // Calculate refund eligibility if not provided
    let finalRefundEligible = refund_eligible;
    let finalRefundAmount = refund_amount;

    if (finalRefundEligible === undefined || finalRefundAmount === undefined) {
      const hoursUntilEvent = (eventDate.getTime() - now.getTime()) / (1000 * 60 * 60);

      if (hoursUntilEvent >= 48) {
        finalRefundEligible = true;
        finalRefundAmount = booking.deposit_amount;
      } else if (hoursUntilEvent >= 24) {
        finalRefundEligible = true;
        finalRefundAmount = Math.floor(booking.deposit_amount * 0.5);
      } else {
        finalRefundEligible = false;
        finalRefundAmount = 0;
      }
    }

    // Generate cancellation reference
    const cancellationRef = `CXL-${Date.now().toString(36).toUpperCase()}`;

    // Update booking status
    const { data: cancelledBooking, error: cancelError } = await supabase
      .from('bookings')
      .update({
        status: 'cancelled',
        cancelled_at: new Date().toISOString(),
        refund_eligible: finalRefundEligible,
        updated_at: new Date().toISOString()
      })
      .eq('id', booking.id)
      .select()
      .single();

    if (cancelError) {
      console.error('Booking cancellation error:', cancelError);
      return NextResponse.json(
        { error: 'Failed to cancel booking' },
        { status: 500 }
      );
    }

    let refundResult = null;

    // Process refund if eligible and payment intent exists
    if (finalRefundEligible && finalRefundAmount && finalRefundAmount > 0 && booking.stripe_payment_intent_id) {
      try {
        refundResult = await createRefund(
          booking.stripe_payment_intent_id,
          finalRefundAmount * 100, // Convert to pence
          'requested_by_customer'
        );

        if (!refundResult.success) {
          console.error('Refund processing failed:', refundResult.error);
          // Don't fail the cancellation, but log the refund failure
        }
      } catch (error) {
        console.error('Refund processing error:', error);
        // Continue with cancellation even if refund fails
      }
    }

    // Create cancellation email notification record
    if (booking.customer_email) {
      try {
        await supabase
          .from('email_notifications')
          .insert({
            booking_id: booking.id,
            type: 'cancellation_confirmation',
            recipient_email: booking.customer_email,
            subject: `Booking Cancellation Confirmation - ${booking.booking_ref}`,
            template_data: {
              booking_ref: booking.booking_ref,
              customer_name: booking.customer_name,
              event_date: booking.booking_date,
              cancellation_ref: cancellationRef,
              cancellation_reason: reason,
              refund_eligible: finalRefundEligible,
              refund_amount: finalRefundAmount,
              refund_processing_time: finalRefundEligible ? '3-5 business days' : null
            },
            status: 'pending'
          });
      } catch (error) {
        console.error('Failed to create email notification:', error);
        // Continue as cancellation is more important than email
      }
    }

    // Create audit log entry
    try {
      await supabase
        .from('audit_log')
        .insert({
          table_name: 'bookings',
          action: 'CANCEL',
          record_id: booking.id,
          old_values: { status: booking.status },
          new_values: { 
            status: 'cancelled',
            cancellation_reason: reason,
            refund_eligible: finalRefundEligible,
            refund_amount: finalRefundAmount
          }
        });
    } catch (error) {
      console.error('Failed to create audit log:', error);
      // Continue as cancellation is complete
    }

    // Return cancellation result
    return NextResponse.json({
      success: true,
      booking: cancelledBooking,
      cancellationRef,
      refund: {
        eligible: finalRefundEligible,
        amount: finalRefundAmount,
        processed: refundResult?.success || false,
        processingTime: finalRefundEligible ? '3-5 business days' : null,
        refundId: refundResult?.paymentIntent?.id
      },
      message: finalRefundEligible 
        ? `Booking cancelled successfully. ${finalRefundAmount > 0 ? `Refund of £${finalRefundAmount} will be processed within 3-5 business days.` : ''}` 
        : 'Booking cancelled successfully. No refund is available due to our cancellation policy.'
    });

  } catch (error) {
    console.error('Booking cancellation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}