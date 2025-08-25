'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Heading, Text, LoadingSpinner, Button } from '@/components/atoms';
import { Card } from '@/components/molecules';
import { createClient } from '@/lib/supabase/client';
import type { Database } from '@/types/database.types';

interface DashboardStats {
  total_bookings_today: number;
  confirmed_today: number;
  pending_today: number;
  arrived_today: number;
  no_show_today: number;
  total_guests_today: number;
  tables_occupied_today: number;
  current_waitlist_count: number;
  pending_notifications: number;
}

interface RecentBooking {
  id: string;
  booking_ref: string;
  customer_name: string;
  party_size: number;
  arrival_time: string;
  status: string;
  table_ids: number[];
  created_at: string;
}

interface SystemAlert {
  id: string;
  type: 'error' | 'warning' | 'info';
  message: string;
  timestamp: string;
  action_required: boolean;
}

export default function AdminDashboardPage() {
  const { data: session } = useSession();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentBookings, setRecentBookings] = useState<RecentBooking[]>([]);
  const [alerts, setAlerts] = useState<SystemAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  const supabase = createClient();

  const fetchDashboardData = async () => {
    try {
      setError(null);

      // Fetch dashboard stats
      const { data: statsData, error: statsError } = await supabase
        .from('booking_dashboard_stats')
        .select('*')
        .single();

      if (statsError) {
        console.error('Stats fetch error:', statsError);
        throw new Error('Failed to fetch dashboard statistics');
      }

      setStats(statsData);

      // Fetch recent bookings (last 10)
      const { data: bookingsData, error: bookingsError } = await supabase
        .from('bookings')
        .select(`
          id,
          booking_ref,
          customer_name,
          party_size,
          arrival_time,
          status,
          table_ids,
          created_at
        `)
        .eq('booking_date', new Date().toISOString().split('T')[0])
        .order('created_at', { ascending: false })
        .limit(10);

      if (bookingsError) {
        console.error('Bookings fetch error:', bookingsError);
      } else {
        setRecentBookings(bookingsData || []);
      }

      // Generate system alerts based on data
      const newAlerts: SystemAlert[] = [];
      
      if (statsData) {
        if (statsData.pending_notifications > 0) {
          newAlerts.push({
            id: 'pending-emails',
            type: 'warning',
            message: `${statsData.pending_notifications} emails pending delivery`,
            timestamp: new Date().toISOString(),
            action_required: true,
          });
        }

        if (statsData.current_waitlist_count > 5) {
          newAlerts.push({
            id: 'high-waitlist',
            type: 'info',
            message: `${statsData.current_waitlist_count} customers on waitlist`,
            timestamp: new Date().toISOString(),
            action_required: false,
          });
        }

        if (statsData.no_show_today > 3) {
          newAlerts.push({
            id: 'high-no-shows',
            type: 'error',
            message: `${statsData.no_show_today} no-shows today - consider follow-up`,
            timestamp: new Date().toISOString(),
            action_required: true,
          });
        }
      }

      setAlerts(newAlerts);
      setLastUpdated(new Date());

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();

    // Set up real-time subscriptions
    const bookingsSubscription = supabase
      .channel('dashboard_bookings')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'bookings',
        },
        () => {
          fetchDashboardData();
        }
      )
      .subscribe();

    // Refresh data every 30 seconds
    const refreshInterval = setInterval(fetchDashboardData, 30000);

    return () => {
      bookingsSubscription.unsubscribe();
      clearInterval(refreshInterval);
    };
  }, []);

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

  const getAlertColor = (type: string) => {
    switch (type) {
      case 'error': return 'border-red-400/20 bg-red-900/20 text-red-300';
      case 'warning': return 'border-yellow-400/20 bg-yellow-900/20 text-yellow-300';
      case 'info': return 'border-blue-400/20 bg-blue-900/20 text-blue-300';
      default: return 'border-speakeasy-gold/20 bg-speakeasy-burgundy/20 text-speakeasy-champagne';
    }
  };

  if (loading && !stats) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner size="lg" color="gold" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Heading level={1} variant="bebas" className="text-speakeasy-gold mb-2">
            Dashboard Overview
          </Heading>
          <Text className="text-speakeasy-champagne/70">
            Welcome back, {session?.user?.email?.split('@')[0]}
          </Text>
        </div>
        <div className="text-right">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={fetchDashboardData}
            disabled={loading}
            className="text-speakeasy-champagne hover:text-speakeasy-gold"
          >
            {loading ? 'Updating...' : 'Refresh'}
          </Button>
          <Text className="text-xs text-speakeasy-champagne/50 mt-1">
            Last updated: {lastUpdated.toLocaleTimeString()}
          </Text>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <Card className="border-red-400/20 bg-red-900/20 p-4">
          <Text className="text-red-300">{error}</Text>
        </Card>
      )}

      {/* System Alerts */}
      {alerts.length > 0 && (
        <div className="space-y-2">
          <Heading level={3} className="text-speakeasy-gold">System Alerts</Heading>
          {alerts.map(alert => (
            <div 
              key={alert.id} 
              className={`p-3 rounded-lg border ${getAlertColor(alert.type)}`}
            >
              <div className="flex items-center justify-between">
                <Text className="text-sm">{alert.message}</Text>
                {alert.action_required && (
                  <span className="text-xs px-2 py-1 bg-speakeasy-gold/20 text-speakeasy-gold rounded">
                    Action Required
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Key Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-6 bg-speakeasy-burgundy/20 border-speakeasy-gold/20">
          <Text className="text-sm text-speakeasy-copper mb-2">Today's Bookings</Text>
          <Text className="text-3xl font-bebas text-speakeasy-champagne">
            {stats?.total_bookings_today || 0}
          </Text>
          <Text className="text-xs text-speakeasy-champagne/60">
            {stats?.confirmed_today || 0} confirmed, {stats?.pending_today || 0} pending
          </Text>
        </Card>

        <Card className="p-6 bg-speakeasy-burgundy/20 border-speakeasy-gold/20">
          <Text className="text-sm text-speakeasy-copper mb-2">Total Guests</Text>
          <Text className="text-3xl font-bebas text-speakeasy-champagne">
            {stats?.total_guests_today || 0}
          </Text>
          <Text className="text-xs text-speakeasy-champagne/60">
            {stats?.arrived_today || 0} arrived, {stats?.no_show_today || 0} no-shows
          </Text>
        </Card>

        <Card className="p-6 bg-speakeasy-burgundy/20 border-speakeasy-gold/20">
          <Text className="text-sm text-speakeasy-copper mb-2">Tables Occupied</Text>
          <Text className="text-3xl font-bebas text-speakeasy-champagne">
            {stats?.tables_occupied_today || 0}
          </Text>
          <Text className="text-xs text-speakeasy-champagne/60">
            of 16 total tables
          </Text>
        </Card>

        <Card className="p-6 bg-speakeasy-burgundy/20 border-speakeasy-gold/20">
          <Text className="text-sm text-speakeasy-copper mb-2">Waitlist</Text>
          <Text className="text-3xl font-bebas text-speakeasy-champagne">
            {stats?.current_waitlist_count || 0}
          </Text>
          <Text className="text-xs text-speakeasy-champagne/60">
            customers waiting
          </Text>
        </Card>
      </div>

      {/* Recent Bookings */}
      <div>
        <Heading level={2} className="text-speakeasy-gold mb-4">
          Recent Bookings
        </Heading>
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-speakeasy-noir/50">
                <tr>
                  <th className="text-left p-3 text-sm font-medium text-speakeasy-copper">Reference</th>
                  <th className="text-left p-3 text-sm font-medium text-speakeasy-copper">Customer</th>
                  <th className="text-left p-3 text-sm font-medium text-speakeasy-copper">Party</th>
                  <th className="text-left p-3 text-sm font-medium text-speakeasy-copper">Time</th>
                  <th className="text-left p-3 text-sm font-medium text-speakeasy-copper">Tables</th>
                  <th className="text-left p-3 text-sm font-medium text-speakeasy-copper">Status</th>
                </tr>
              </thead>
              <tbody>
                {recentBookings.length > 0 ? recentBookings.map(booking => (
                  <tr key={booking.id} className="border-t border-speakeasy-gold/10">
                    <td className="p-3 text-sm text-speakeasy-champagne font-mono">
                      {booking.booking_ref}
                    </td>
                    <td className="p-3 text-sm text-speakeasy-champagne">
                      {booking.customer_name}
                    </td>
                    <td className="p-3 text-sm text-speakeasy-champagne">
                      {booking.party_size}
                    </td>
                    <td className="p-3 text-sm text-speakeasy-champagne">
                      {booking.arrival_time}
                    </td>
                    <td className="p-3 text-sm text-speakeasy-champagne">
                      {booking.table_ids.join(', ')}
                    </td>
                    <td className="p-3 text-sm">
                      <span className={`capitalize ${getStatusColor(booking.status)}`}>
                        {booking.status.replace('_', ' ')}
                      </span>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={6} className="p-6 text-center text-speakeasy-champagne/60">
                      No bookings found for today
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      {/* Quick Actions */}
      <div>
        <Heading level={2} className="text-speakeasy-gold mb-4">
          Quick Actions
        </Heading>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Button 
            variant="outline" 
            className="p-6 h-auto flex-col space-y-2 text-center"
            href="/admin/bookings"
          >
            <span className="text-2xl">📅</span>
            <span>Manage Bookings</span>
          </Button>
          
          <Button 
            variant="outline" 
            className="p-6 h-auto flex-col space-y-2 text-center"
            href="/admin/events"
          >
            <span className="text-2xl">🎉</span>
            <span>Events</span>
          </Button>
          
          {session?.user?.permissions?.canViewFinancials && (
            <Button 
              variant="outline" 
              className="p-6 h-auto flex-col space-y-2 text-center"
              href="/admin/finance"
            >
              <span className="text-2xl">💰</span>
              <span>Finance</span>
            </Button>
          )}
          
          {session?.user?.permissions?.canManageStaff && (
            <Button 
              variant="outline" 
              className="p-6 h-auto flex-col space-y-2 text-center"
              href="/admin/staff"
            >
              <span className="text-2xl">👤</span>
              <span>Staff</span>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}