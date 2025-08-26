import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { authOptions } from '@/lib/auth';
import { z } from 'zod';

const checkInSchema = z.object({
  bookingId: z.string().uuid('Invalid booking ID format'),
  method: z.enum(['qr', 'manual']),
  qrToken: z.string().optional(),
  verificationData: z.object({
    customerName: z.string(),
    partySize: z.number(),
    arrivalTime: z.string()
  }).optional()
});

export async function POST(request: NextRequest) {
  try {
    // Get session and verify door staff role
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (session.user.role !== 'door_staff') {
      return NextResponse.json({ error: 'Access denied. Door staff role required.' }, { status: 403 });
    }

    const body = await request.json();
    const validation = checkInSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ 
        error: 'Invalid request data',
        details: validation.error.errors
      }, { status: 400 });
    }

    const { bookingId, method, qrToken, verificationData } = validation.data;
    const supabase = await createServerSupabaseClient();

    // Get booking information
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .select(`
        id,
        booking_ref,
        customer_name,
        customer_phone,
        party_size,
        arrival_time,
        booking_date,
        table_ids,
        status,
        checked_in_at
      `)
      .eq('id', bookingId)
      .single();

    if (bookingError || !booking) {
      return NextResponse.json({ 
        error: 'Booking not found' 
      }, { status: 404 });
    }

    // Verify booking is for today
    const today = new Date().toISOString().split('T')[0];
    if (booking.booking_date !== today) {
      return NextResponse.json({ 
        error: 'Booking is not for today' 
      }, { status: 400 });
    }

    // Check if already checked in
    if (booking.status === 'arrived' || booking.checked_in_at) {
      return NextResponse.json({ 
        error: 'Customer already checked in',
        checkedInAt: booking.checked_in_at
      }, { status: 409 });
    }

    // Verify booking status is confirmed
    if (booking.status !== 'confirmed') {
      return NextResponse.json({ 
        error: `Cannot check in booking with status: ${booking.status}` 
      }, { status: 400 });
    }

    // For manual check-in, verify customer details
    if (method === 'manual' && verificationData) {
      const { customerName, partySize, arrivalTime } = verificationData;
      
      if (booking.customer_name.toLowerCase() !== customerName.toLowerCase()) {
        return NextResponse.json({ 
          error: 'Customer name does not match booking' 
        }, { status: 400 });
      }

      if (booking.party_size !== partySize) {
        return NextResponse.json({ 
          error: 'Party size does not match booking' 
        }, { status: 400 });
      }

      if (booking.arrival_time !== arrivalTime) {
        return NextResponse.json({ 
          error: 'Arrival time does not match booking' 
        }, { status: 400 });
      }
    }

    // For QR check-in, validate token (if provided)
    if (method === 'qr' && qrToken) {
      // QR token validation would go here
      // For now, we'll assume the QR code was valid if it reaches this point
    }

    // Update booking status to arrived
    const now = new Date().toISOString();
    const { data: updatedBooking, error: updateError } = await supabase
      .from('bookings')
      .update({
        status: 'arrived',
        checked_in_at: now,
        updated_at: now
      })
      .eq('id', bookingId)
      .select(`
        id,
        booking_ref,
        customer_name,
        customer_phone,
        party_size,
        arrival_time,
        table_ids,
        status,
        checked_in_at
      `)
      .single();

    if (updateError) {
      console.error('Error updating booking check-in:', updateError);
      return NextResponse.json({ 
        error: 'Failed to complete check-in' 
      }, { status: 500 });
    }

    // Log the check-in action for audit purposes
    try {
      await supabase.from('audit_log').insert({
        action: 'BOOKING_CHECKED_IN',
        table_name: 'bookings',
        record_id: bookingId,
        admin_user_id: session.user.id,
        new_values: { 
          status: 'arrived', 
          checked_in_at: now,
          check_in_method: method 
        },
        old_values: { 
          status: booking.status, 
          checked_in_at: booking.checked_in_at 
        },
        ip_address: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
        user_agent: request.headers.get('user-agent')
      });
    } catch (auditError) {
      // Don't fail the check-in if audit logging fails
      console.warn('Failed to log check-in audit:', auditError);
    }

    return NextResponse.json({
      success: true,
      booking: updatedBooking,
      checkedInAt: now,
      method,
      message: 'Customer successfully checked in'
    });

  } catch (error) {
    console.error('Error in check-in API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}