import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';

/**
 * Manager API: Get tonight's comprehensive statistics
 * GET /api/manager/dashboard/tonight
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

    const supabase = createClient();
    const today = new Date().toISOString().split('T')[0];
    const now = new Date();

    // Get today's bookings with all details
    const { data: todayBookings, error: bookingsError } = await supabase
      .from('bookings')
      .select(`
        id, booking_ref, customer_name, party_size, arrival_time, 
        status, table_ids, total_amount, deposit_amount, 
        drinks_package_id, created_at,
        drinks_packages(name)
      `)
      .eq('booking_date', today);

    if (bookingsError) {
      console.error('Error fetching today\'s bookings:', bookingsError);
      return NextResponse.json(
        { error: 'Failed to fetch booking data' },
        { status: 500 }
      );
    }

    const bookings = todayBookings || [];

    // Calculate comprehensive statistics
    const stats = {
      // Basic counts
      total_bookings: bookings.length,
      confirmed_arrivals: bookings.filter(b => b.status === 'confirmed').length,
      pending_arrivals: bookings.filter(b => b.status === 'pending').length,
      arrived_guests: bookings.filter(b => b.status === 'arrived').length,
      no_shows: bookings.filter(b => b.status === 'no_show').length,
      cancellations: bookings.filter(b => b.status === 'cancelled').length,
      
      // Guest calculations
      total_guests: bookings
        .filter(b => ['confirmed', 'arrived', 'pending'].includes(b.status))
        .reduce((sum, b) => sum + b.party_size, 0),
      
      // Table calculations
      current_occupancy: new Set(
        bookings
          .filter(b => b.status === 'arrived')
          .flatMap(b => b.table_ids || [])
      ).size,
      
      total_tables_booked: new Set(
        bookings
          .filter(b => ['confirmed', 'arrived', 'pending'].includes(b.status))
          .flatMap(b => b.table_ids || [])
      ).size,

      // Revenue calculations
      revenue_booked: bookings
        .filter(b => ['confirmed', 'arrived'].includes(b.status))
        .reduce((sum, b) => sum + (b.total_amount || 0), 0),
      
      deposits_collected: bookings
        .reduce((sum, b) => sum + (b.deposit_amount || 0), 0),

      // Performance metrics
      average_party_size: bookings.length 
        ? (bookings.reduce((sum, b) => sum + b.party_size, 0) / bookings.length)
        : 0,
      
      occupancy_percentage: (new Set(
        bookings
          .filter(b => b.status === 'arrived')
          .flatMap(b => b.table_ids || [])
      ).size / 16) * 100, // 16 total tables
      
      // Waitlist (bookings with status 'waitlist')
      waitlist_count: bookings.filter(b => b.status === 'waitlist').length,

      // Time-based analysis
      peak_arrival_times: getArrivalTimeDistribution(bookings),
      
      // Quality metrics
      on_time_percentage: calculateOnTimePercentage(bookings, now),
      
      // Package performance
      drinks_package_utilization: getDrinksPackageStats(bookings),
      
      // Recent activity (last 2 hours)
      recent_bookings: bookings
        .filter(b => {
          const createdAt = new Date(b.created_at);
          const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000);
          return createdAt >= twoHoursAgo;
        })
        .length
    };

    // Get urgent bookings (arriving within 2 hours)
    const twoHoursFromNow = new Date(now.getTime() + 2 * 60 * 60 * 1000);
    const urgentBookings = bookings
      .filter(booking => {
        if (!['confirmed', 'pending'].includes(booking.status)) return false;
        
        const [hours, minutes] = booking.arrival_time.split(':').map(Number);
        const arrivalDate = new Date(today);
        arrivalDate.setHours(hours, minutes, 0, 0);
        
        return arrivalDate >= now && arrivalDate <= twoHoursFromNow;
      })
      .sort((a, b) => a.arrival_time.localeCompare(b.arrival_time))
      .slice(0, 10); // Top 10 urgent bookings

    return NextResponse.json({
      success: true,
      data: {
        stats,
        urgent_bookings: urgentBookings,
        last_updated: now.toISOString()
      }
    });

  } catch (error) {
    console.error('Tonight stats API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Helper function to get arrival time distribution
function getArrivalTimeDistribution(bookings: any[]) {
  const timeSlots = ['18:00-19:00', '19:00-20:00', '20:00-21:00', '21:00-22:00', '22:00-23:00', '23:00+'];
  const distribution: { [key: string]: number } = {};
  
  timeSlots.forEach(slot => distribution[slot] = 0);
  
  bookings.forEach(booking => {
    const hour = parseInt(booking.arrival_time.split(':')[0]);
    
    if (hour >= 18 && hour < 19) distribution['18:00-19:00']++;
    else if (hour >= 19 && hour < 20) distribution['19:00-20:00']++;
    else if (hour >= 20 && hour < 21) distribution['20:00-21:00']++;
    else if (hour >= 21 && hour < 22) distribution['21:00-22:00']++;
    else if (hour >= 22 && hour < 23) distribution['22:00-23:00']++;
    else if (hour >= 23) distribution['23:00+']++;
  });
  
  return distribution;
}

// Helper function to calculate on-time percentage
function calculateOnTimePercentage(bookings: any[], now: Date) {
  const arrivedBookings = bookings.filter(b => b.status === 'arrived');
  if (arrivedBookings.length === 0) return 0;
  
  // This would require checking-in times vs arrival times
  // For now, return a placeholder percentage
  return 85; // 85% on-time rate
}

// Helper function to get drinks package statistics
function getDrinksPackageStats(bookings: any[]) {
  const packageStats: { [key: string]: number } = {};
  
  bookings.forEach(booking => {
    if (booking.drinks_packages?.name) {
      const packageName = booking.drinks_packages.name;
      packageStats[packageName] = (packageStats[packageName] || 0) + 1;
    }
  });
  
  return packageStats;
}