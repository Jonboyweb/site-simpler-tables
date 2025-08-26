'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/molecules';
import { Heading, Text } from '@/components/atoms';
import { LiveUpdates } from './LiveUpdates';
import { ArrivalTracking } from './ArrivalTracking';
import { SpecialRequests } from './SpecialRequests';

interface DashboardStats {
  totalExpected: number;
  arrived: number;
  pending: number;
  late: number;
  totalGuests: number;
  arrivedGuests: number;
}

interface DashboardOverviewProps {
  lastUpdated: string;
}

export const DashboardOverview = ({ lastUpdated }: DashboardOverviewProps) => {
  const [stats, setStats] = useState<DashboardStats>({
    totalExpected: 0,
    arrived: 0,
    pending: 0,
    late: 0,
    totalGuests: 0,
    arrivedGuests: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch dashboard statistics
  const fetchStats = async () => {
    try {
      setError(null);
      const response = await fetch('/api/door-staff/tonight-bookings', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch tonight\'s statistics');
      }

      const data = await response.json();
      setStats(data.stats || {
        totalExpected: 0,
        arrived: 0,
        pending: 0,
        late: 0,
        totalGuests: 0,
        arrivedGuests: 0
      });
    } catch (err) {
      console.error('Error fetching dashboard stats:', err);
      setError(err instanceof Error ? err.message : 'Failed to load statistics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [lastUpdated]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="p-6 animate-pulse">
              <div className="h-4 bg-speakeasy-gold/20 rounded mb-2"></div>
              <div className="h-8 bg-speakeasy-gold/10 rounded"></div>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-red-400 mb-4">
          <span className="text-4xl">⚠️</span>
        </div>
        <Heading level={3} className="text-speakeasy-champagne mb-2">
          Error Loading Dashboard
        </Heading>
        <Text className="text-speakeasy-copper mb-4">
          {error}
        </Text>
        <button
          onClick={fetchStats}
          className="px-4 py-2 bg-speakeasy-gold text-speakeasy-noir rounded-sm hover:bg-speakeasy-champagne transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  const arrivalRate = stats.totalExpected > 0 ? (stats.arrived / stats.totalExpected) * 100 : 0;
  const guestArrivalRate = stats.totalGuests > 0 ? (stats.arrivedGuests / stats.totalGuests) * 100 : 0;

  return (
    <div className="space-y-6">
      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-6 bg-gradient-to-br from-speakeasy-gold/10 to-speakeasy-copper/10 border-speakeasy-gold/20">
          <div className="flex items-center justify-between">
            <div>
              <Text variant="caption" className="text-speakeasy-champagne/70 uppercase tracking-wider">
                Total Bookings
              </Text>
              <Heading level={2} variant="bebas" className="text-speakeasy-gold text-3xl">
                {stats.totalExpected}
              </Heading>
            </div>
            <span className="text-3xl">📅</span>
          </div>
        </Card>

        <Card className="p-6 bg-gradient-to-br from-green-900/20 to-green-800/10 border-green-400/20">
          <div className="flex items-center justify-between">
            <div>
              <Text variant="caption" className="text-green-200/70 uppercase tracking-wider">
                Arrived
              </Text>
              <Heading level={2} variant="bebas" className="text-green-400 text-3xl">
                {stats.arrived}
              </Heading>
              <Text variant="caption" className="text-green-200/50">
                {arrivalRate.toFixed(0)}% arrival rate
              </Text>
            </div>
            <span className="text-3xl">✅</span>
          </div>
        </Card>

        <Card className="p-6 bg-gradient-to-br from-blue-900/20 to-blue-800/10 border-blue-400/20">
          <div className="flex items-center justify-between">
            <div>
              <Text variant="caption" className="text-blue-200/70 uppercase tracking-wider">
                Pending
              </Text>
              <Heading level={2} variant="bebas" className="text-blue-400 text-3xl">
                {stats.pending}
              </Heading>
              <Text variant="caption" className="text-blue-200/50">
                Expected tonight
              </Text>
            </div>
            <span className="text-3xl">⏳</span>
          </div>
        </Card>

        <Card className="p-6 bg-gradient-to-br from-red-900/20 to-red-800/10 border-red-400/20">
          <div className="flex items-center justify-between">
            <div>
              <Text variant="caption" className="text-red-200/70 uppercase tracking-wider">
                Running Late
              </Text>
              <Heading level={2} variant="bebas" className="text-red-400 text-3xl">
                {stats.late}
              </Heading>
              <Text variant="caption" className="text-red-200/50">
                30+ min overdue
              </Text>
            </div>
            <span className="text-3xl">⚠️</span>
          </div>
        </Card>
      </div>

      {/* Guest Tracking */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <Heading level={3} variant="bebas" className="text-speakeasy-gold mb-4">
            Guest Count Tracking
          </Heading>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <Text className="text-speakeasy-champagne">Total Expected Guests:</Text>
              <span className="text-speakeasy-gold font-bebas text-xl">
                {stats.totalGuests}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <Text className="text-speakeasy-champagne">Guests Arrived:</Text>
              <span className="text-green-400 font-bebas text-xl">
                {stats.arrivedGuests}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <Text className="text-speakeasy-champagne">Still Expected:</Text>
              <span className="text-blue-400 font-bebas text-xl">
                {stats.totalGuests - stats.arrivedGuests}
              </span>
            </div>
            <div className="bg-speakeasy-noir/50 rounded-full h-3 overflow-hidden">
              <div 
                className="bg-green-400 h-full transition-all duration-500"
                style={{ width: `${guestArrivalRate}%` }}
              />
            </div>
            <Text variant="caption" className="text-speakeasy-copper text-center">
              {guestArrivalRate.toFixed(1)}% of expected guests have arrived
            </Text>
          </div>
        </Card>

        <ArrivalTracking stats={stats} />
      </div>

      {/* Real-time Updates and Special Requests */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <LiveUpdates lastUpdated={lastUpdated} />
        <SpecialRequests />
      </div>
    </div>
  );
};