import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

import type { Database } from '@/types/database.types';

interface RouteContext {
  params: Promise<{ id: string }>;
}

// GET: Retrieve specific booking
export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const supabase = createRouteHandlerClient<Database>({ cookies });
    const params = await context.params;
    const { id } = params;

    // Try to find by ID first, then by booking reference
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
        stripe_payment_intent_id,
        created_at,
        updated_at,
        checked_in_at,
        cancelled_at,
        refund_eligible
      `);

    // Check if ID is a UUID (booking ID) or booking reference
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
    
    if (isUUID) {
      query = query.eq('id', id);
    } else {
      query = query.eq('booking_ref', id.toUpperCase());
    }

    const { data: booking, error } = await query.single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Booking not found' },
          { status: 404 }
        );
      }
      console.error('Booking retrieval error:', error);
      return NextResponse.json(
        { error: 'Failed to retrieve booking' },
        { status: 500 }
      );
    }

    return NextResponse.json({ booking });

  } catch (error) {
    console.error('Booking retrieval error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT: Update booking
export async function PUT(request: NextRequest, context: RouteContext) {
  try {
    const body = await request.json();
    const supabase = createRouteHandlerClient<Database>({ cookies });
    const params = await context.params;
    const { id } = params;

    // Validate booking exists
    const { data: existingBooking, error: findError } = await supabase
      .from('bookings')
      .select('id, booking_ref, status, booking_date')
      .eq('booking_ref', id.toUpperCase())
      .single();

    if (findError || !existingBooking) {
      return NextResponse.json(
        { error: 'Booking not found' },
        { status: 404 }
      );
    }

    // Check if booking can be modified
    if (existingBooking.status === 'cancelled') {
      return NextResponse.json(
        { error: 'Cannot modify cancelled booking' },
        { status: 400 }
      );
    }

    const eventDate = new Date(existingBooking.booking_date);
    const now = new Date();
    if (eventDate.getTime() <= now.getTime()) {
      return NextResponse.json(
        { error: 'Cannot modify booking for past events' },
        { status: 400 }
      );
    }

    // Prepare update data
    const updateData: any = {
      updated_at: new Date().toISOString()
    };

    // Handle specific update types
    if (body.status) {
      updateData.status = body.status;
    }

    if (body.checked_in_at) {
      updateData.checked_in_at = body.checked_in_at;
      updateData.status = 'arrived';
    }

    if (body.special_requests !== undefined) {
      updateData.special_requests = body.special_requests;
    }

    // Update booking
    const { data: updatedBooking, error: updateError } = await supabase
      .from('bookings')
      .update(updateData)
      .eq('id', existingBooking.id)
      .select()
      .single();

    if (updateError) {
      console.error('Booking update error:', updateError);
      return NextResponse.json(
        { error: 'Failed to update booking' },
        { status: 500 }
      );
    }

    return NextResponse.json({ booking: updatedBooking });

  } catch (error) {
    console.error('Booking update error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE: Cancel booking (implemented as status update)
export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    const supabase = createRouteHandlerClient<Database>({ cookies });
    const params = await context.params;
    const { id } = params;

    // Find booking
    const { data: booking, error: findError } = await supabase
      .from('bookings')
      .select('id, booking_ref, status, booking_date, deposit_amount, stripe_payment_intent_id')
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

    // Check cancellation eligibility
    const eventDate = new Date(booking.booking_date);
    const now = new Date();
    const hoursUntilEvent = (eventDate.getTime() - now.getTime()) / (1000 * 60 * 60);

    if (eventDate.getTime() <= now.getTime()) {
      return NextResponse.json(
        { error: 'Cannot cancel booking for past events' },
        { status: 400 }
      );
    }

    // Calculate refund eligibility
    let refundEligible = false;
    let refundAmount = 0;

    if (hoursUntilEvent >= 48) {
      refundEligible = true;
      refundAmount = booking.deposit_amount;
    } else if (hoursUntilEvent >= 24) {
      refundEligible = true;
      refundAmount = Math.floor(booking.deposit_amount * 0.5);
    }

    // Update booking status
    const { data: cancelledBooking, error: cancelError } = await supabase
      .from('bookings')
      .update({
        status: 'cancelled',
        cancelled_at: new Date().toISOString(),
        refund_eligible: refundEligible,
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

    // TODO: Process refund if eligible (integrate with Stripe refunds)
    // TODO: Send cancellation confirmation email
    // TODO: Release table availability

    return NextResponse.json({
      booking: cancelledBooking,
      refund: {
        eligible: refundEligible,
        amount: refundAmount,
        processingTime: refundEligible ? '3-5 business days' : null
      }
    });

  } catch (error) {
    console.error('Booking cancellation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}