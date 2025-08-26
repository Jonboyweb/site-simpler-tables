'use client';

import { useState, useEffect } from 'react';
import { Heading, Text, LoadingSpinner, Button } from '@/components/atoms';
import { Card } from '@/components/molecules';
import { createClient } from '@/lib/supabase/client';

interface Notification {
  id: string;
  type: 'info' | 'warning' | 'error' | 'success';
  title: string;
  message: string;
  action_required: boolean;
  action_label?: string;
  action_url?: string;
  metadata?: {
    booking_id?: string;
    event_id?: string;
    customer_email?: string;
    [key: string]: any;
  };
  created_at: string;
  read: boolean;
  dismissed: boolean;
}

export function NotificationCenter() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAll, setShowAll] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    fetchNotifications();
    generateSystemNotifications();
    
    // Refresh notifications every 2 minutes
    const interval = setInterval(() => {
      fetchNotifications();
      generateSystemNotifications();
    }, 120000);

    return () => clearInterval(interval);
  }, []);

  const fetchNotifications = async () => {
    try {
      setError(null);
      
      // This would fetch from a notifications table when implemented
      // For now, we'll generate notifications based on current system state
      setNotifications([]);
      
    } catch (err) {
      console.error('Error fetching notifications:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch notifications');
    }
  };

  const generateSystemNotifications = async () => {
    try {
      const currentNotifications: Notification[] = [];
      const now = new Date();
      
      // Check for today's bookings that need attention
      const today = now.toISOString().split('T')[0];
      
      // High waitlist notification
      const { data: waitlistData } = await supabase
        .from('bookings')
        .select('id')
        .eq('status', 'waitlist')
        .eq('booking_date', today);
      
      if (waitlistData && waitlistData.length > 5) {
        currentNotifications.push({
          id: 'high-waitlist',
          type: 'warning',
          title: 'High Waitlist Volume',
          message: `${waitlistData.length} customers are currently on the waitlist for tonight.`,
          action_required: true,
          action_label: 'Manage Waitlist',
          action_url: '/admin/bookings?view=waitlist',
          created_at: now.toISOString(),
          read: false,
          dismissed: false
        });
      }

      // Check for bookings arriving soon without confirmation
      const twoHoursFromNow = new Date(now.getTime() + 2 * 60 * 60 * 1000);
      const { data: unconfirmedData } = await supabase
        .from('bookings')
        .select('id, customer_name, arrival_time')
        .eq('booking_date', today)
        .eq('status', 'pending')
        .lte('arrival_time', twoHoursFromNow.toTimeString().slice(0, 8))
        .gte('arrival_time', now.toTimeString().slice(0, 8));

      if (unconfirmedData && unconfirmedData.length > 0) {
        currentNotifications.push({
          id: 'unconfirmed-arrivals',
          type: 'warning',
          title: 'Unconfirmed Arrivals Soon',
          message: `${unconfirmedData.length} bookings arriving within 2 hours are still pending confirmation.`,
          action_required: true,
          action_label: 'Review Bookings',
          action_url: '/admin/bookings?status=pending&arriving=soon',
          created_at: now.toISOString(),
          read: false,
          dismissed: false
        });
      }

      // Check for no-shows from earlier today
      const { data: noShowData } = await supabase
        .from('bookings')
        .select('id, customer_name, arrival_time')
        .eq('booking_date', today)
        .eq('status', 'no_show');

      if (noShowData && noShowData.length > 3) {
        currentNotifications.push({
          id: 'high-no-shows',
          type: 'error',
          title: 'High No-Show Rate',
          message: `${noShowData.length} no-shows recorded today. Consider review and follow-up.`,
          action_required: true,
          action_label: 'Review No-Shows',
          action_url: '/admin/bookings?status=no_show',
          created_at: now.toISOString(),
          read: false,
          dismissed: false
        });
      }

      // Check for events happening soon without proper setup
      const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      const { data: upcomingEvents } = await supabase
        .from('events')
        .select('id, name, event_date, setup_complete')
        .in('event_date', [today, tomorrow])
        .eq('setup_complete', false);

      if (upcomingEvents && upcomingEvents.length > 0) {
        upcomingEvents.forEach(event => {
          const isToday = event.event_date === today;
          currentNotifications.push({
            id: `event-setup-${event.id}`,
            type: isToday ? 'error' : 'warning',
            title: `Event Setup Required`,
            message: `"${event.name}" ${isToday ? 'today' : 'tomorrow'} needs setup completion.`,
            action_required: true,
            action_label: 'Complete Setup',
            action_url: `/admin/events/${event.id}?tab=setup`,
            metadata: { event_id: event.id },
            created_at: now.toISOString(),
            read: false,
            dismissed: false
          });
        });
      }

      // System maintenance notifications (example)
      const maintenanceHour = 4; // 4 AM
      if (now.getHours() === maintenanceHour - 1 && now.getMinutes() < 15) {
        currentNotifications.push({
          id: 'maintenance-warning',
          type: 'info',
          title: 'Scheduled Maintenance',
          message: 'System maintenance will begin in approximately 1 hour (4:00 AM). Save your work.',
          action_required: false,
          created_at: now.toISOString(),
          read: false,
          dismissed: false
        });
      }

      // Success notifications for good performance
      const { data: todayConfirmed } = await supabase
        .from('bookings')
        .select('id')
        .eq('booking_date', today)
        .eq('status', 'confirmed');

      if (todayConfirmed && todayConfirmed.length >= 20) {
        currentNotifications.push({
          id: 'good-booking-day',
          type: 'success',
          title: 'Strong Booking Performance',
          message: `Excellent! ${todayConfirmed.length} confirmed bookings for tonight.`,
          action_required: false,
          created_at: now.toISOString(),
          read: false,
          dismissed: false
        });
      }

      setNotifications(currentNotifications);
    } catch (err) {
      console.error('Error generating system notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  const dismissNotification = (notificationId: string) => {
    setNotifications(prev => 
      prev.map(n => 
        n.id === notificationId 
          ? { ...n, dismissed: true }
          : n
      )
    );
  };

  const markAsRead = (notificationId: string) => {
    setNotifications(prev => 
      prev.map(n => 
        n.id === notificationId 
          ? { ...n, read: true }
          : n
      )
    );
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'error': return '🚨';
      case 'warning': return '⚠️';
      case 'success': return '✅';
      case 'info': return 'ℹ️';
      default: return '🔔';
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'error': return 'border-red-400/20 bg-red-900/10 text-red-300';
      case 'warning': return 'border-yellow-400/20 bg-yellow-900/10 text-yellow-300';
      case 'success': return 'border-green-400/20 bg-green-900/10 text-green-300';
      case 'info': return 'border-blue-400/20 bg-blue-900/10 text-blue-300';
      default: return 'border-speakeasy-gold/20 bg-speakeasy-burgundy/10 text-speakeasy-champagne';
    }
  };

  const activeNotifications = notifications.filter(n => !n.dismissed);
  const displayedNotifications = showAll ? activeNotifications : activeNotifications.slice(0, 5);
  const urgentNotifications = activeNotifications.filter(n => n.action_required && (n.type === 'error' || n.type === 'warning'));

  if (loading) {
    return (
      <Card className="p-6">
        <Heading level={3} className="text-speakeasy-gold mb-4">
          Notifications
        </Heading>
        <div className="flex items-center justify-center py-4">
          <LoadingSpinner size="sm" color="gold" />
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Heading level={3} className="text-speakeasy-gold">
            Notifications
          </Heading>
          {urgentNotifications.length > 0 && (
            <div className="px-2 py-1 bg-red-900/20 border border-red-400/20 rounded-full">
              <Text variant="caption" className="text-red-300">
                {urgentNotifications.length} urgent
              </Text>
            </div>
          )}
        </div>
        {activeNotifications.length > 5 && (
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => setShowAll(!showAll)}
          >
            {showAll ? 'Show Less' : `Show All (${activeNotifications.length})`}
          </Button>
        )}
      </div>

      {error && (
        <div className="mb-4 p-3 border border-red-400/20 bg-red-900/20 rounded">
          <Text className="text-red-300 text-sm">Error: {error}</Text>
        </div>
      )}

      {displayedNotifications.length > 0 ? (
        <div className="space-y-3">
          {displayedNotifications.map((notification) => (
            <div 
              key={notification.id}
              className={`p-4 rounded-lg border ${getNotificationColor(notification.type)} ${!notification.read ? 'font-medium' : ''}`}
            >
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 text-lg">
                  {getNotificationIcon(notification.type)}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <Text className="font-medium text-sm">
                        {notification.title}
                      </Text>
                      <Text className="text-sm mt-1 opacity-90">
                        {notification.message}
                      </Text>
                    </div>
                    
                    <div className="flex items-center gap-2 ml-3">
                      {!notification.read && (
                        <button
                          onClick={() => markAsRead(notification.id)}
                          className="text-xs opacity-60 hover:opacity-100 transition-opacity"
                        >
                          Mark Read
                        </button>
                      )}
                      <button
                        onClick={() => dismissNotification(notification.id)}
                        className="text-xs opacity-60 hover:opacity-100 transition-opacity"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                  
                  {notification.action_required && notification.action_url && (
                    <div className="mt-3">
                      <Button 
                        variant="ghost" 
                        size="sm"
                        href={notification.action_url}
                        className="text-xs"
                      >
                        {notification.action_label || 'Take Action'}
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-6">
          <div className="text-4xl mb-2">🔔</div>
          <Text className="text-speakeasy-champagne/60">
            All caught up! No notifications at the moment.
          </Text>
        </div>
      )}
    </Card>
  );
}