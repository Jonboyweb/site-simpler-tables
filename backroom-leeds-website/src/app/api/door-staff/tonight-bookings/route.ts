import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { authOptions } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    // Get session and verify door staff role
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (session.user.role !== 'door_staff') {
      return NextResponse.json({ error: 'Access denied. Door staff role required.' }, { status: 403 });
    }

    const supabase = await createServerSupabaseClient();
    const today = new Date().toISOString().split('T')[0];

    // Get tonight's bookings with check-in status
    const { data: bookings, error } = await supabase
      .from('bookings')
      .select(`
        id,
        booking_ref,
        customer_name,
        customer_phone,
        customer_email,
        party_size,
        arrival_time,
        booking_date,
        table_ids,
        status,
        checked_in_at,
        special_requests,
        drinks_package
      `)
      .eq('booking_date', today)
      .in('status', ['confirmed', 'arrived'])
      .order('arrival_time', { ascending: true });

    if (error) {
      console.error('Error fetching tonight\'s bookings:', error);
      return NextResponse.json(
        { error: 'Failed to fetch tonight\'s bookings' },
        { status: 500 }
      );
    }

    // Get table information
    const { data: tables, error: tablesError } = await supabase
      .from('venue_tables')
      .select('id, table_number, floor, capacity_min, capacity_max')
      .order('table_number', { ascending: true });

    if (tablesError) {
      console.error('Error fetching table information:', tablesError);
      return NextResponse.json(
        { error: 'Failed to fetch table information' },
        { status: 500 }
      );
    }

    // Enhance bookings with table information
    const enhancedBookings = bookings?.map(booking => {
      const bookingTables = tables?.filter(table => 
        booking.table_ids.includes(table.id)
      ) || [];

      return {
        ...booking,
        tables: bookingTables,
        isLate: !booking.checked_in_at && new Date(`${booking.booking_date}T${booking.arrival_time}`) < new Date(Date.now() - 30 * 60 * 1000), // 30 minutes late
        hasSpecialRequests: booking.special_requests && Object.keys(booking.special_requests).length > 0,
        isDrinksPackage: booking.drinks_package && Object.keys(booking.drinks_package).length > 0
      };
    }) || [];

    // Calculate statistics
    const stats = {
      totalExpected: enhancedBookings.length,
      arrived: enhancedBookings.filter(b => b.status === 'arrived').length,
      pending: enhancedBookings.filter(b => b.status === 'confirmed').length,
      late: enhancedBookings.filter(b => b.isLate).length,
      totalGuests: enhancedBookings.reduce((sum, b) => sum + b.party_size, 0),
      arrivedGuests: enhancedBookings.filter(b => b.status === 'arrived').reduce((sum, b) => sum + b.party_size, 0)
    };

    return NextResponse.json({
      bookings: enhancedBookings,
      stats,
      lastUpdated: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error in tonight-bookings API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}