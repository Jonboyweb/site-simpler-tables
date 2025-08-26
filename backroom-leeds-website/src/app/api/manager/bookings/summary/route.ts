import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { AdminRole } from '@/types/authentication.types';

/**
 * Manager API: Get booking summary statistics
 * GET /api/manager/bookings/summary?start_date=YYYY-MM-DD&end_date=YYYY-MM-DD&status=status1,status2&tables=1,2,3
 */
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    // Verify manager-level access
    if (!session?.user?.role || !['super_admin', 'manager'].includes(session.user.role)) {
      return NextResponse.json(
        { error: 'Insufficient permissions. Manager access required.' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('start_date') || new Date().toISOString().split('T')[0];
    const endDate = searchParams.get('end_date') || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const statusFilter = searchParams.get('status')?.split(',') || null;
    const tableFilter = searchParams.get('tables')?.split(',').map(t => parseInt(t)) || null;

    const supabase = createClient();

    // Build base query
    let query = supabase
      .from('bookings')
      .select('id, status, party_size, total_amount, deposit_amount, table_ids, created_at')
      .gte('booking_date', startDate)
      .lte('booking_date', endDate);

    // Apply filters
    if (statusFilter && statusFilter.length > 0) {
      query = query.in('status', statusFilter);
    }

    const { data: bookings, error } = await query;

    if (error) {
      console.error('Error fetching bookings:', error);
      return NextResponse.json(
        { error: 'Failed to fetch booking data' },
        { status: 500 }
      );
    }

    // Apply table filter manually (PostgreSQL array operations)
    const filteredBookings = tableFilter 
      ? bookings?.filter(booking => 
          booking.table_ids?.some(tableId => tableFilter.includes(tableId))
        ) 
      : bookings;

    // Calculate summary statistics
    const summary = {
      total_bookings: filteredBookings?.length || 0,
      confirmed_bookings: filteredBookings?.filter(b => b.status === 'confirmed').length || 0,
      pending_bookings: filteredBookings?.filter(b => b.status === 'pending').length || 0,
      cancelled_bookings: filteredBookings?.filter(b => b.status === 'cancelled').length || 0,
      no_shows: filteredBookings?.filter(b => b.status === 'no_show').length || 0,
      total_revenue: filteredBookings?.reduce((sum, b) => sum + (b.total_amount || 0), 0) || 0,
      total_deposits: filteredBookings?.reduce((sum, b) => sum + (b.deposit_amount || 0), 0) || 0,
      average_party_size: filteredBookings?.length 
        ? (filteredBookings.reduce((sum, b) => sum + b.party_size, 0) / filteredBookings.length)
        : 0,
      tables_booked: new Set(
        filteredBookings?.flatMap(b => b.table_ids || [])
      ).size,
      date_range: { start_date: startDate, end_date: endDate }
    };

    return NextResponse.json({ success: true, data: summary });

  } catch (error) {
    console.error('Manager bookings summary API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Manager API: Update booking summary settings
 * POST /api/manager/bookings/summary
 */
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    // Verify manager-level access
    if (!session?.user?.role || !['super_admin', 'manager'].includes(session.user.role)) {
      return NextResponse.json(
        { error: 'Insufficient permissions. Manager access required.' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { settings } = body;

    // Here you would save manager preferences for dashboard settings
    // For now, we'll just return success
    return NextResponse.json({ 
      success: true, 
      message: 'Dashboard settings updated',
      data: settings
    });

  } catch (error) {
    console.error('Manager bookings summary settings API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}