import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { authOptions } from '@/lib/auth';
import { z } from 'zod';

const searchSchema = z.object({
  query: z.string().min(1, 'Search query is required'),
  searchType: z.enum(['booking_ref', 'name', 'phone', 'all']).default('all'),
  date: z.string().optional() // ISO date string, defaults to today
});

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

    const { searchParams } = new URL(request.url);
    const query = searchParams.get('query');
    const searchType = searchParams.get('searchType') || 'all';
    const date = searchParams.get('date') || new Date().toISOString().split('T')[0];

    const validation = searchSchema.safeParse({
      query,
      searchType,
      date
    });

    if (!validation.success) {
      return NextResponse.json({ 
        error: 'Invalid search parameters',
        details: validation.error.errors
      }, { status: 400 });
    }

    const { query: searchQuery, searchType: type, date: searchDate } = validation.data;
    const supabase = await createServerSupabaseClient();

    let queryBuilder = supabase
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
      .eq('booking_date', searchDate)
      .in('status', ['confirmed', 'arrived']);

    // Apply search filters based on search type
    switch (type) {
      case 'booking_ref':
        queryBuilder = queryBuilder.ilike('booking_ref', `%${searchQuery}%`);
        break;
      
      case 'name':
        queryBuilder = queryBuilder.ilike('customer_name', `%${searchQuery}%`);
        break;
      
      case 'phone':
        queryBuilder = queryBuilder.ilike('customer_phone', `%${searchQuery}%`);
        break;
      
      case 'all':
      default:
        queryBuilder = queryBuilder.or(
          `booking_ref.ilike.%${searchQuery}%,` +
          `customer_name.ilike.%${searchQuery}%,` +
          `customer_phone.ilike.%${searchQuery}%`
        );
        break;
    }

    const { data: bookings, error } = await queryBuilder
      .order('arrival_time', { ascending: true })
      .limit(50); // Limit results to prevent excessive data

    if (error) {
      console.error('Error searching bookings:', error);
      return NextResponse.json(
        { error: 'Failed to search bookings' },
        { status: 500 }
      );
    }

    if (!bookings || bookings.length === 0) {
      return NextResponse.json({
        bookings: [],
        total: 0,
        message: 'No bookings found matching your search criteria'
      });
    }

    // Get table information for the found bookings
    const allTableIds = [...new Set(bookings.flatMap(booking => booking.table_ids))];
    const { data: tables, error: tablesError } = await supabase
      .from('venue_tables')
      .select('id, table_number, floor, capacity_min, capacity_max')
      .in('id', allTableIds);

    if (tablesError) {
      console.error('Error fetching table information:', tablesError);
      // Continue without table info rather than failing entirely
    }

    // Enhance bookings with table information and status flags
    const enhancedBookings = bookings.map(booking => {
      const bookingTables = tables?.filter(table => 
        booking.table_ids.includes(table.id)
      ) || [];

      return {
        ...booking,
        tables: bookingTables,
        isLate: !booking.checked_in_at && new Date(`${booking.booking_date}T${booking.arrival_time}`) < new Date(Date.now() - 30 * 60 * 1000), // 30 minutes late
        hasSpecialRequests: booking.special_requests && Object.keys(booking.special_requests).length > 0,
        isDrinksPackage: booking.drinks_package && Object.keys(booking.drinks_package).length > 0,
        canCheckIn: booking.status === 'confirmed' && !booking.checked_in_at
      };
    });

    return NextResponse.json({
      bookings: enhancedBookings,
      total: enhancedBookings.length,
      searchQuery,
      searchType: type,
      searchDate,
      lastUpdated: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error in search API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}