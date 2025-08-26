'use client';

import { useState, useEffect } from 'react';
import { Heading, Text, LoadingSpinner } from '@/components/atoms';
import { Card } from '@/components/molecules';
import { createClient } from '@/lib/supabase/client';

interface ActivityItem {
  id: string;
  type: 'booking_created' | 'booking_modified' | 'booking_cancelled' | 'booking_checkin' | 'event_created' | 'event_modified' | 'payment_processed' | 'system_alert';
  title: string;
  description: string;
  user_name?: string;
  user_role?: string;
  timestamp: string;
  metadata?: {
    booking_ref?: string;
    customer_name?: string;
    table_numbers?: number[];
    amount?: number;
    old_status?: string;
    new_status?: string;
    event_name?: string;
    [key: string]: any;
  };
}

export function RecentActivity() {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();

  useEffect(() => {
    fetchRecentActivity();
    
    // Set up real-time subscription for activity updates
    const subscription = supabase
      .channel('recent_activity')
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'admin_activity_log'
      }, (payload) => {
        // Add new activity to the top of the list
        const newActivity = transformActivityLog(payload.new);
        if (newActivity) {
          setActivities(prev => [newActivity, ...prev.slice(0, 19)]); // Keep only 20 items
        }
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const fetchRecentActivity = async () => {
    try {
      setError(null);
      
      // Fetch recent activity from admin_activity_log
      const { data: activityData, error: activityError } = await supabase
        .from('admin_activity_log')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);

      if (activityError) throw activityError;

      // Transform activity logs into display format
      const transformedActivities: ActivityItem[] = activityData?.map(transformActivityLog).filter(Boolean) || [];
      
      setActivities(transformedActivities);
    } catch (err) {
      console.error('Error fetching recent activity:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch recent activity');
    } finally {
      setLoading(false);
    }
  };

  const transformActivityLog = (log: any): ActivityItem | null => {
    if (!log) return null;

    const baseActivity: Partial<ActivityItem> = {
      id: log.id,
      user_name: log.user_email?.split('@')[0] || 'System',
      user_role: log.user_role,
      timestamp: log.created_at,
      metadata: log.metadata || {}
    };

    switch (log.action) {
      case 'booking_created':
        return {
          ...baseActivity,
          type: 'booking_created',
          title: 'New Booking Created',
          description: `${log.metadata?.customer_name || 'Customer'} booked ${log.metadata?.table_numbers?.length || 1} table(s) for party of ${log.metadata?.party_size || 0}`,
        } as ActivityItem;

      case 'booking_modified':
        return {
          ...baseActivity,
          type: 'booking_modified',
          title: 'Booking Modified',
          description: `${log.metadata?.booking_ref || 'Booking'} updated: ${log.metadata?.old_status} → ${log.metadata?.new_status}`,
        } as ActivityItem;

      case 'booking_cancelled':
        return {
          ...baseActivity,
          type: 'booking_cancelled',
          title: 'Booking Cancelled',
          description: `${log.metadata?.customer_name || 'Customer'} cancelled booking ${log.metadata?.booking_ref || ''}`,
        } as ActivityItem;

      case 'booking_checkin':
        return {
          ...baseActivity,
          type: 'booking_checkin',
          title: 'Customer Checked In',
          description: `${log.metadata?.customer_name || 'Customer'} checked in for ${log.metadata?.booking_ref || 'booking'}`,
        } as ActivityItem;

      case 'event_created':
        return {
          ...baseActivity,
          type: 'event_created',
          title: 'New Event Created',
          description: `Created event: ${log.metadata?.event_name || 'Untitled Event'}`,
        } as ActivityItem;

      case 'event_modified':
        return {
          ...baseActivity,
          type: 'event_modified',
          title: 'Event Modified',
          description: `Updated event: ${log.metadata?.event_name || 'Event'}`,
        } as ActivityItem;

      case 'login':
        return {
          ...baseActivity,
          type: 'system_alert',
          title: 'Staff Login',
          description: `${baseActivity.user_role?.replace('_', ' ').toUpperCase()} logged in`,
        } as ActivityItem;

      case 'login_failed':
        return {
          ...baseActivity,
          type: 'system_alert',
          title: 'Failed Login Attempt',
          description: `Failed login for ${log.user_email || 'unknown user'}`,
        } as ActivityItem;

      default:
        // Skip unrecognized activity types
        return null;
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'booking_created': return '📅';
      case 'booking_modified': return '✏️';
      case 'booking_cancelled': return '❌';
      case 'booking_checkin': return '✅';
      case 'event_created': return '🎉';
      case 'event_modified': return '🎭';
      case 'payment_processed': return '💳';
      case 'system_alert': return '🔔';
      default: return '📝';
    }
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'booking_created': return 'text-green-400';
      case 'booking_modified': return 'text-blue-400';
      case 'booking_cancelled': return 'text-red-400';
      case 'booking_checkin': return 'text-speakeasy-gold';
      case 'event_created': return 'text-purple-400';
      case 'event_modified': return 'text-purple-300';
      case 'payment_processed': return 'text-green-400';
      case 'system_alert': return 'text-yellow-400';
      default: return 'text-speakeasy-champagne';
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    
    return date.toLocaleDateString();
  };

  if (loading) {
    return (
      <Card className="p-6">
        <Heading level={3} className="text-speakeasy-gold mb-4">
          Recent Activity
        </Heading>
        <div className="flex items-center justify-center py-8">
          <LoadingSpinner size="md" color="gold" />
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="border-red-400/20 bg-red-900/20 p-6">
        <Heading level={3} className="text-red-300 mb-4">
          Recent Activity
        </Heading>
        <Text className="text-red-300">Error: {error}</Text>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <Heading level={3} className="text-speakeasy-gold">
          Recent Activity
        </Heading>
        <Text variant="caption" className="text-speakeasy-champagne/60">
          Last 20 activities
        </Text>
      </div>

      {activities.length > 0 ? (
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {activities.map((activity) => (
            <div 
              key={activity.id}
              className="flex items-start gap-3 p-3 rounded-lg bg-speakeasy-noir/30 hover:bg-speakeasy-noir/50 transition-colors"
            >
              <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full bg-speakeasy-burgundy/20">
                <span className="text-sm">{getActivityIcon(activity.type)}</span>
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <Text className={`font-medium text-sm ${getActivityColor(activity.type)}`}>
                      {activity.title}
                    </Text>
                    <Text className="text-sm text-speakeasy-champagne/70 mt-1">
                      {activity.description}
                    </Text>
                  </div>
                  <div className="flex-shrink-0 text-right ml-3">
                    <Text variant="caption" className="text-speakeasy-champagne/50">
                      {formatTimestamp(activity.timestamp)}
                    </Text>
                    {activity.user_name && (
                      <Text variant="caption" className="text-speakeasy-copper text-xs block">
                        {activity.user_name}
                      </Text>
                    )}
                  </div>
                </div>
                
                {/* Additional metadata display */}
                {activity.metadata?.booking_ref && (
                  <div className="mt-2">
                    <Text variant="caption" className="text-speakeasy-gold/60 font-mono">
                      {activity.metadata.booking_ref}
                    </Text>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8">
          <Text className="text-speakeasy-champagne/60">
            No recent activity to display
          </Text>
        </div>
      )}
    </Card>
  );
}