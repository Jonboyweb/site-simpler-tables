import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { createClient } from '@/lib/supabase/server';
import { permissionManager, Permission } from '@/lib/permissions';
import { z } from 'zod';

const updateBookingSchema = z.object({
  status: z.enum(['pending', 'confirmed', 'cancelled', 'arrived', 'no_show']).optional(),
  customer_name: z.string().min(1).optional(),
  customer_email: z.string().email().optional(),
  customer_phone: z.string().optional(),
  party_size: z.number().min(1).max(20).optional(),
  arrival_time: z.string().optional(),
  table_ids: z.array(z.number().min(1).max(16)).optional(),
  special_requests: z.any().optional(),
  package_amount: z.number().min(0).optional(),
});

interface RouteContext {
  params: { id: string };
}

/**
 * GET /api/admin/bookings/[id]
 * Get booking details
 */
export async function GET(request: NextRequest, { params }: RouteContext) {
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
      Permission.VIEW_BOOKINGS
    );

    if (!permissionCheck.hasPermission) {
      return NextResponse.json(
        { error: 'Insufficient permissions', reason: permissionCheck.reason },
        { status: 403 }
      );
    }

    const supabase = createClient();

    const { data: booking, error } = await supabase
      .from('bookings')
      .select('*')
      .eq('id', bookingId)
      .single();

    if (error || !booking) {
      return NextResponse.json(
        { error: 'Booking not found' },
        { status: 404 }
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

/**
 * PATCH /api/admin/bookings/[id]
 * Update booking details
 */
export async function PATCH(request: NextRequest, { params }: RouteContext) {
  try {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
    
    if (!token?.sub) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const bookingId = params.id;
    const body = await request.json();
    const validation = updateBookingSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { 
          error: 'Validation failed', 
          details: validation.error.errors 
        },
        { status: 400 }
      );
    }

    const updateData = validation.data;

    // Check permissions
    const permissionCheck = await permissionManager.validateResourceAccess(
      token.sub,
      'booking',
      bookingId,
      Permission.MODIFY_BOOKINGS
    );

    if (!permissionCheck.hasPermission) {
      return NextResponse.json(
        { error: 'Insufficient permissions', reason: permissionCheck.reason },
        { status: 403 }
      );
    }

    const supabase = createClient();

    // Get current booking data
    const { data: currentBooking, error: fetchError } = await supabase
      .from('bookings')
      .select('*')
      .eq('id', bookingId)
      .single();

    if (fetchError || !currentBooking) {
      return NextResponse.json(
        { error: 'Booking not found' },
        { status: 404 }
      );
    }

    // Prepare update object
    const dbUpdate: any = { ...updateData };

    // Handle status changes with special logic
    if (updateData.status && updateData.status !== currentBooking.status) {
      switch (updateData.status) {
        case 'cancelled':
          dbUpdate.cancelled_at = new Date().toISOString();
          // Check refund eligibility (48-hour rule)
          const bookingDateTime = new Date(`${currentBooking.booking_date}T${currentBooking.arrival_time}`);
          const now = new Date();
          const hoursUntilBooking = (bookingDateTime.getTime() - now.getTime()) / (1000 * 60 * 60);
          dbUpdate.refund_eligible = hoursUntilBooking >= 48;
          break;
        
        case 'arrived':
          dbUpdate.checked_in_at = new Date().toISOString();
          break;
        
        case 'confirmed':
          // Reset any previous cancellation data
          dbUpdate.cancelled_at = null;
          dbUpdate.refund_eligible = true;
          break;
      }
    }

    // Validate table availability if tables are being changed
    if (updateData.table_ids && JSON.stringify(updateData.table_ids) !== JSON.stringify(currentBooking.table_ids)) {
      const { data: conflictingBookings } = await supabase
        .from('bookings')
        .select('id, booking_ref, table_ids')
        .eq('booking_date', currentBooking.booking_date)
        .in('status', ['confirmed', 'pending', 'arrived'])
        .neq('id', bookingId);

      if (conflictingBookings) {
        for (const conflictBooking of conflictingBookings) {
          const hasConflict = updateData.table_ids.some(tableId => 
            conflictBooking.table_ids.includes(tableId)
          );
          if (hasConflict) {
            return NextResponse.json(
              { 
                error: `Table conflict with booking ${conflictBooking.booking_ref}`,
                conflicting_tables: updateData.table_ids.filter(tableId => 
                  conflictBooking.table_ids.includes(tableId)
                )
              },
              { status: 409 }
            );
          }
        }
      }
    }

    // Update the booking
    const { data: updatedBooking, error: updateError } = await supabase
      .from('bookings')
      .update(dbUpdate)
      .eq('id', bookingId)
      .select('*')
      .single();

    if (updateError) {
      console.error('Database update error:', updateError);
      return NextResponse.json(
        { error: 'Failed to update booking' },
        { status: 500 }
      );
    }

    // Log the update
    await supabase
      .from('audit_log')
      .insert({
        admin_user_id: token.sub,
        action: 'update_booking',
        table_name: 'bookings',
        record_id: bookingId,
        old_values: {
          status: currentBooking.status,
          customer_name: currentBooking.customer_name,
          customer_email: currentBooking.customer_email,
          party_size: currentBooking.party_size,
          table_ids: currentBooking.table_ids,
        },
        new_values: {
          status: updatedBooking.status,
          customer_name: updatedBooking.customer_name,
          customer_email: updatedBooking.customer_email,
          party_size: updatedBooking.party_size,
          table_ids: updatedBooking.table_ids,
          updated_by: token.email,
        },
      });

    // Create notification if status changed significantly
    if (updateData.status && updateData.status !== currentBooking.status) {
      const notificationTypes = {
        'confirmed': 'booking_confirmation',
        'cancelled': 'cancellation_confirmation',
      };

      const notificationType = notificationTypes[updateData.status as keyof typeof notificationTypes];
      if (notificationType) {
        try {
          await supabase
            .from('email_notifications')
            .insert({
              booking_id: bookingId,
              type: notificationType,
              recipient_email: updatedBooking.customer_email,
              subject: `Booking ${updateData.status === 'confirmed' ? 'Confirmed' : 'Cancelled'} - ${updatedBooking.booking_ref}`,
              body_text: `Your booking status has been updated to ${updateData.status}.`,
              template_data: {
                customer_name: updatedBooking.customer_name,
                booking_ref: updatedBooking.booking_ref,
                status: updateData.status,
                updated_by_staff: token.email,
                updated_at: new Date().toISOString(),
              },
            });
        } catch (emailError) {
          console.error('Failed to create status notification:', emailError);
        }
      }
    }

    return NextResponse.json({
      message: 'Booking updated successfully',
      booking: updatedBooking,
      changes_applied: Object.keys(dbUpdate),
      updated_by: {
        staff_id: token.sub,
        staff_email: token.email,
        timestamp: new Date().toISOString(),
      },
    });

  } catch (error) {
    console.error('Booking update error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/bookings/[id]
 * Cancel booking (soft delete)
 */
export async function DELETE(request: NextRequest, { params }: RouteContext) {
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
      Permission.CANCEL_BOOKINGS
    );

    if (!permissionCheck.hasPermission) {
      return NextResponse.json(
        { error: 'Insufficient permissions', reason: permissionCheck.reason },
        { status: 403 }
      );
    }

    // Use PATCH method to cancel the booking
    return PATCH(request, { params });

  } catch (error) {
    console.error('Booking cancellation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}