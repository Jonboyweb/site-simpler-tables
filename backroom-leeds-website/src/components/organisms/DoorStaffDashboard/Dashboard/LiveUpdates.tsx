'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/molecules';
import { Heading, Text } from '@/components/atoms';

interface RecentUpdate {
  id: string;
  type: 'check_in' | 'late' | 'no_show' | 'special_request';
  message: string;
  timestamp: string;
  bookingRef?: string;
  customerName?: string;
  icon: string;
  color: string;
}

interface LiveUpdatesProps {
  lastUpdated: string;
}

export const LiveUpdates = ({ lastUpdated }: LiveUpdatesProps) => {
  const [updates, setUpdates] = useState<RecentUpdate[]>([]);
  const [loading, setLoading] = useState(true);

  // Simulated real-time updates - in production, this would connect to WebSocket or Server-Sent Events
  const fetchRecentUpdates = async () => {
    try {
      // For now, we'll simulate recent updates based on booking data
      const response = await fetch('/api/door-staff/tonight-bookings');
      
      if (response.ok) {
        const data = await response.json();
        const recentUpdates: RecentUpdate[] = [];
        
        // Generate simulated updates from recent check-ins
        data.bookings?.slice(0, 8).forEach((booking: any, index: number) => {
          if (booking.status === 'arrived' && booking.checked_in_at) {
            const checkInTime = new Date(booking.checked_in_at);
            const now = new Date();
            const minutesAgo = Math.floor((now.getTime() - checkInTime.getTime()) / (1000 * 60));
            
            if (minutesAgo <= 60) { // Only show updates from last hour
              recentUpdates.push({
                id: `checkin-${booking.id}`,
                type: 'check_in',
                message: `${booking.customer_name} checked in (Table ${booking.tables?.[0]?.table_number || 'TBD'})`,
                timestamp: booking.checked_in_at,
                bookingRef: booking.booking_ref,
                customerName: booking.customer_name,
                icon: '✅',
                color: 'text-green-400'
              });
            }
          }
          
          if (booking.isLate && booking.status === 'confirmed') {
            recentUpdates.push({
              id: `late-${booking.id}`,
              type: 'late',
              message: `${booking.customer_name} is running late (${booking.arrival_time})`,
              timestamp: new Date().toISOString(),
              bookingRef: booking.booking_ref,
              customerName: booking.customer_name,
              icon: '⏰',
              color: 'text-orange-400'
            });
          }
          
          if (booking.hasSpecialRequests) {
            recentUpdates.push({
              id: `special-${booking.id}`,
              type: 'special_request',
              message: `${booking.customer_name} has special requirements`,
              timestamp: new Date().toISOString(),
              bookingRef: booking.booking_ref,
              customerName: booking.customer_name,
              icon: '⭐',
              color: 'text-speakeasy-gold'
            });
          }
        });
        
        // Sort by timestamp descending and limit to 8 most recent
        setUpdates(recentUpdates.sort((a, b) => 
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        ).slice(0, 8));
      }
    } catch (error) {
      console.error('Error fetching live updates:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecentUpdates();
  }, [lastUpdated]);

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffMs = now.getTime() - time.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    
    if (diffMins < 1) return 'Just now';
    if (diffMins === 1) return '1 min ago';
    if (diffMins < 60) return `${diffMins} mins ago`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours === 1) return '1 hour ago';
    if (diffHours < 24) return `${diffHours} hours ago`;
    
    return time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <Heading level={3} variant="bebas" className="text-speakeasy-gold">
          Live Updates
        </Heading>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
          <Text variant="caption" className="text-speakeasy-champagne/60">
            Real-time
          </Text>
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="flex items-center gap-3 p-3 bg-speakeasy-noir/30 rounded-sm">
                <div className="w-8 h-8 bg-speakeasy-gold/20 rounded"></div>
                <div className="flex-1">
                  <div className="h-4 bg-speakeasy-gold/20 rounded mb-1"></div>
                  <div className="h-3 bg-speakeasy-gold/10 rounded w-2/3"></div>
                </div>
                <div className="h-3 bg-speakeasy-gold/10 rounded w-16"></div>
              </div>
            </div>
          ))}
        </div>
      ) : updates.length > 0 ? (
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {updates.map((update) => (
            <div
              key={update.id}
              className="flex items-start gap-3 p-3 bg-speakeasy-noir/30 rounded-sm border border-speakeasy-gold/10 hover:bg-speakeasy-noir/40 transition-colors"
            >
              <span className="text-lg">{update.icon}</span>
              <div className="flex-1 min-w-0">
                <Text className={`${update.color} text-sm`}>
                  {update.message}
                </Text>
                {update.bookingRef && (
                  <Text variant="caption" className="text-speakeasy-champagne/50">
                    Ref: {update.bookingRef}
                  </Text>
                )}
              </div>
              <Text variant="caption" className="text-speakeasy-copper whitespace-nowrap">
                {formatTimeAgo(update.timestamp)}
              </Text>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8">
          <div className="text-4xl mb-2">📡</div>
          <Text className="text-speakeasy-champagne/60">
            No recent activity
          </Text>
          <Text variant="caption" className="text-speakeasy-copper">
            Updates will appear here as guests arrive
          </Text>
        </div>
      )}

      {/* Update Frequency Info */}
      <div className="mt-4 pt-4 border-t border-speakeasy-gold/10">
        <Text variant="caption" className="text-speakeasy-champagne/50 text-center">
          Updates refresh every 30 seconds • Last update: {new Date(lastUpdated).toLocaleTimeString()}
        </Text>
      </div>
    </Card>
  );
};