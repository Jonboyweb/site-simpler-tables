import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { createClient } from '@/lib/supabase/server';
import { permissionManager, Permission } from '@/lib/permissions';

interface RouteContext {
  params: { id: string };
}

/**
 * POST /api/admin/bookings/[id]/check-in
 * Check in a customer for their booking
 */
export async function POST(request: NextRequest, { params }: RouteContext) {
  try {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
    
    if (!token?.sub) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const bookingId = params.id;

    // Check permissions
    const permissionCheck = await permissionManager.validateResourceAccess(
      token.sub,
      'booking',
      bookingId,
      Permission.CHECK_IN_CUSTOMERS
    );

    if (!permissionCheck.hasPermission) {
      return NextResponse.json(
        { error: 'Insufficient permissions', reason: permissionCheck.reason },
        { status: 403 }
      );
    }

    const supabase = createClient();

    // Get booking details
    const { data: booking, error: fetchError } = await supabase
      .from('bookings')
      .select('*')
      .eq('id', bookingId)
      .single();

    if (fetchError || !booking) {
      return NextResponse.json(
        { error: 'Booking not found' },
        { status: 404 }
      );
    }

    // Validate booking status
    if (booking.status === 'arrived') {
      return NextResponse.json(
        { error: 'Customer is already checked in' },
        { status: 400 }
      );
    }

    if (booking.status === 'cancelled') {
      return NextResponse.json(
        { error: 'Cannot check in a cancelled booking' },
        { status: 400 }
      );
    }

    if (booking.status === 'no_show') {
      return NextResponse.json(
        { error: 'Booking was marked as no-show' },
        { status: 400 }
      );
    }

    // Check if booking is for today
    const today = new Date().toISOString().split('T')[0];
    if (booking.booking_date !== today) {
      return NextResponse.json(
        { error: 'Can only check in bookings for today' },
        { status: 400 }
      );
    }

    // Update booking status to checked in
    const { data: updatedBooking, error: updateError } = await supabase
      .from('bookings')
      .update({
        status: 'arrived',
        checked_in_at: new Date().toISOString(),
      })
      .eq('id', bookingId)
      .select('*')
      .single();

    if (updateError) {
      console.error('Database update error:', updateError);
      return NextResponse.json(
        { error: 'Failed to check in customer' },
        { status: 500 }
      );
    }

    // Log the check-in action
    await supabase
      .from('audit_log')
      .insert({
        admin_user_id: token.sub,
        action: 'customer_check_in',
        table_name: 'bookings',
        record_id: bookingId,
        old_values: {
          status: booking.status,
          checked_in_at: booking.checked_in_at,
        },
        new_values: {
          status: 'arrived',
          checked_in_at: updatedBooking.checked_in_at,
        },
      });

    // Create success notification email (optional)
    try {
      await supabase
        .from('email_notifications')
        .insert({
          booking_id: bookingId,
          type: 'booking_confirmation',
          recipient_email: booking.customer_email,
          subject: `Checked In - ${booking.booking_ref}`,
          body_text: `Welcome to The Backroom Leeds! You have been successfully checked in.`,
          template_data: {
            customer_name: booking.customer_name,
            booking_ref: booking.booking_ref,
            table_info: `Table(s) ${booking.table_ids.join(', ')}`,
            checked_in_at: updatedBooking.checked_in_at,
            staff_member: token.email,
          },
        });
    } catch (emailError) {
      // Log email error but don't fail the check-in
      console.error('Failed to create check-in notification:', emailError);
    }

    return NextResponse.json({
      message: 'Customer checked in successfully',
      booking: {
        id: updatedBooking.id,
        booking_ref: updatedBooking.booking_ref,
        customer_name: updatedBooking.customer_name,
        status: updatedBooking.status,
        checked_in_at: updatedBooking.checked_in_at,
        table_ids: updatedBooking.table_ids,
        party_size: updatedBooking.party_size,
      },
      checked_in_by: {
        staff_id: token.sub,
        staff_email: token.email,
        timestamp: new Date().toISOString(),
      },
    });

  } catch (error) {
    console.error('Check-in error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}