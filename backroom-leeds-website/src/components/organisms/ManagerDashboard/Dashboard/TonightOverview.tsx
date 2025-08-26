'use client';

import { useState, useEffect } from 'react';
import { Heading, Text, LoadingSpinner, Button } from '@/components/atoms';
import { Card } from '@/components/molecules';
import { createClient } from '@/lib/supabase/client';

interface TonightStats {
  total_bookings: number;
  confirmed_arrivals: number;
  pending_arrivals: number;
  current_occupancy: number;
  waitlist_count: number;
  no_shows: number;
  cancellations: number;
  total_guests: number;
  revenue_booked: number;
  average_party_size: number;
}

interface BookingSummary {
  id: string;
  booking_ref: string;
  customer_name: string;
  party_size: number;
  arrival_time: string;
  table_numbers: number[];
  status: string;
  drinks_package?: string;
  special_requests?: string;
  phone: string;
}

export function TonightOverview() {
  const [stats, setStats] = useState<TonightStats | null>(null);
  const [urgentBookings, setUrgentBookings] = useState<BookingSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();

  useEffect(() => {
    fetchTonightData();
    
    // Refresh every 30 seconds for live operations
    const interval = setInterval(fetchTonightData, 30000);
    
    // Set up real-time subscription for tonight's bookings
    const subscription = supabase
      .channel('tonight_overview')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'bookings',
        filter: `booking_date=eq.${new Date().toISOString().split('T')[0]}`
      }, fetchTonightData)
      .subscribe();

    return () => {
      clearInterval(interval);
      subscription.unsubscribe();
    };
  }, []);

  const fetchTonightData = async () => {
    try {
      setError(null);
      const today = new Date().toISOString().split('T')[0];
      
      // Fetch tonight's comprehensive stats
      const { data: statsData, error: statsError } = await supabase
        .rpc('get_tonight_stats', { 
          target_date: today 
        });

      if (statsError) throw statsError;
      setStats(statsData[0] || getDefaultStats());

      // Fetch urgent bookings (arriving in next 2 hours)
      const twoHoursFromNow = new Date();
      twoHoursFromNow.setHours(twoHoursFromNow.getHours() + 2);
      
      const { data: urgentData, error: urgentError } = await supabase
        .from('bookings')
        .select(`
          id, booking_ref, customer_name, party_size, 
          arrival_time, table_ids, status, 
          drinks_package_id, special_requests, customer_phone
        `)
        .eq('booking_date', today)
        .in('status', ['confirmed', 'pending'])
        .lte('arrival_time', twoHoursFromNow.toTimeString().slice(0, 8))
        .gte('arrival_time', new Date().toTimeString().slice(0, 8))
        .order('arrival_time');

      if (urgentError) throw urgentError;
      
      setUrgentBookings(urgentData?.map(booking => ({
        ...booking,
        table_numbers: booking.table_ids || [],
        phone: booking.customer_phone || 'Not provided'
      })) || []);

    } catch (err) {
      console.error('Error fetching tonight data:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch tonight\'s data');
    } finally {
      setLoading(false);
    }
  };

  const getDefaultStats = (): TonightStats => ({
    total_bookings: 0,
    confirmed_arrivals: 0,
    pending_arrivals: 0,
    current_occupancy: 0,
    waitlist_count: 0,
    no_shows: 0,
    cancellations: 0,
    total_guests: 0,
    revenue_booked: 0,
    average_party_size: 0
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'text-green-400';
      case 'pending': return 'text-yellow-400';
      case 'arrived': return 'text-blue-400';
      case 'no_show': return 'text-red-400';
      case 'cancelled': return 'text-gray-400';
      default: return 'text-speakeasy-champagne';
    }
  };

  if (loading) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center py-8">
          <LoadingSpinner size="md" color="gold" />
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="border-red-400/20 bg-red-900/20 p-6">
        <Text className="text-red-300">Error loading tonight's overview: {error}</Text>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={fetchTonightData}
          className="mt-2 text-red-300 hover:text-red-200"
        >
          Retry
        </Button>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Tonight's Key Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 bg-gradient-to-br from-speakeasy-burgundy/20 to-speakeasy-noir/20">
          <Text className="text-xs text-speakeasy-copper uppercase tracking-wide">Total Bookings</Text>
          <Text className="text-2xl font-bebas text-speakeasy-gold mt-1">
            {stats?.total_bookings || 0}
          </Text>
          <Text className="text-xs text-speakeasy-champagne/60">
            {stats?.confirmed_arrivals || 0} confirmed
          </Text>
        </Card>

        <Card className="p-4 bg-gradient-to-br from-speakeasy-gold/10 to-speakeasy-copper/10">
          <Text className="text-xs text-speakeasy-copper uppercase tracking-wide">Total Guests</Text>
          <Text className="text-2xl font-bebas text-speakeasy-gold mt-1">
            {stats?.total_guests || 0}
          </Text>
          <Text className="text-xs text-speakeasy-champagne/60">
            Avg {stats?.average_party_size?.toFixed(1) || 0} per table
          </Text>
        </Card>

        <Card className="p-4 bg-gradient-to-br from-green-900/20 to-speakeasy-noir/20">
          <Text className="text-xs text-speakeasy-copper uppercase tracking-wide">Occupancy</Text>
          <Text className="text-2xl font-bebas text-green-400 mt-1">
            {stats?.current_occupancy || 0}/16
          </Text>
          <Text className="text-xs text-speakeasy-champagne/60">
            {((stats?.current_occupancy || 0) / 16 * 100).toFixed(0)}% full
          </Text>
        </Card>

        <Card className="p-4 bg-gradient-to-br from-speakeasy-burgundy/20 to-speakeasy-gold/10">
          <Text className="text-xs text-speakeasy-copper uppercase tracking-wide">Revenue</Text>
          <Text className="text-2xl font-bebas text-speakeasy-gold mt-1">
            £{(stats?.revenue_booked || 0).toLocaleString()}
          </Text>
          <Text className="text-xs text-speakeasy-champagne/60">
            Booked tonight
          </Text>
        </Card>
      </div>

      {/* Issues & Alerts */}
      {((stats?.waitlist_count || 0) > 0 || (stats?.no_shows || 0) > 0 || (stats?.cancellations || 0) > 3) && (
        <Card className="border-yellow-400/20 bg-yellow-900/10 p-4">
          <Heading level={4} className="text-yellow-400 mb-3">
            Tonight's Alerts
          </Heading>
          <div className="space-y-2">
            {(stats?.waitlist_count || 0) > 0 && (
              <div className="flex items-center justify-between text-sm">
                <Text className="text-yellow-300">
                  {stats?.waitlist_count} customers on waitlist
                </Text>
                <Button variant="ghost" size="sm" href="/admin/bookings?view=waitlist">
                  Manage
                </Button>
              </div>
            )}
            {(stats?.no_shows || 0) > 0 && (
              <div className="flex items-center justify-between text-sm">
                <Text className="text-red-300">
                  {stats?.no_shows} no-shows tonight
                </Text>
                <Button variant="ghost" size="sm" href="/admin/bookings?status=no_show">
                  Review
                </Button>
              </div>
            )}
            {(stats?.cancellations || 0) > 3 && (
              <div className="flex items-center justify-between text-sm">
                <Text className="text-orange-300">
                  {stats?.cancellations} cancellations tonight
                </Text>
                <Button variant="ghost" size="sm" href="/admin/reports?view=cancellations">
                  Analyze
                </Button>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Urgent Arrivals */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <Heading level={3} className="text-speakeasy-gold">
            Arriving Soon (Next 2 Hours)
          </Heading>
          <Button variant="ghost" size="sm" href="/admin/bookings?view=tonight">
            View All Tonight
          </Button>
        </div>

        {urgentBookings.length > 0 ? (
          <div className="space-y-3">
            {urgentBookings.map((booking) => (
              <Card key={booking.id} className="p-4 hover:border-speakeasy-gold/40 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-4">
                      <Text className="font-bebas text-lg text-speakeasy-champagne">
                        {booking.arrival_time.slice(0, 5)}
                      </Text>
                      <div>
                        <Text className="text-speakeasy-champagne font-medium">
                          {booking.customer_name}
                        </Text>
                        <Text className="text-sm text-speakeasy-champagne/60">
                          {booking.booking_ref} • Party of {booking.party_size} • 
                          Tables {booking.table_numbers.join(', ')}
                        </Text>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`text-sm capitalize ${getStatusColor(booking.status)}`}>
                      {booking.status}
                    </span>
                    <Button variant="ghost" size="sm" href={`/admin/bookings/${booking.id}`}>
                      Details
                    </Button>
                  </div>
                </div>
                {booking.special_requests && (
                  <Text className="text-sm text-speakeasy-gold/70 mt-2 italic">
                    Special: {booking.special_requests}
                  </Text>
                )}
              </Card>
            ))}
          </div>
        ) : (
          <Card className="p-6 text-center">
            <Text className="text-speakeasy-champagne/60">
              No bookings arriving in the next 2 hours
            </Text>
          </Card>
        )}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Button variant="outline" href="/admin/bookings/create" className="p-4 h-auto">
          <div className="text-center">
            <div className="text-2xl mb-2">➕</div>
            <Text className="text-sm">Create Walk-in Booking</Text>
          </div>
        </Button>
        
        <Button variant="outline" href="/admin/floor-plan" className="p-4 h-auto">
          <div className="text-center">
            <div className="text-2xl mb-2">🗺️</div>
            <Text className="text-sm">View Floor Plan</Text>
          </div>
        </Button>
        
        <Button variant="outline" href="/admin/reports/tonight" className="p-4 h-auto">
          <div className="text-center">
            <div className="text-2xl mb-2">📊</div>
            <Text className="text-sm">Tonight's Report</Text>
          </div>
        </Button>
      </div>
    </div>
  );
}