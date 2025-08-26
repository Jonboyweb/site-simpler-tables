'use client';

import { useState, useEffect } from 'react';
import { Heading, Text, Button, LoadingSpinner } from '@/components/atoms';
import { Card } from '@/components/molecules';
import { createClient } from '@/lib/supabase/client';

// Import event management components
import { EventsList } from './EventsList';
import { EventCalendar } from './EventCalendar';
import { EventAnalytics } from './EventAnalytics';

interface EventSummary {
  total_events: number;
  upcoming_events: number;
  events_this_month: number;
  total_bookings_from_events: number;
  average_event_capacity: number;
  top_performing_event: string;
  next_event_date: string;
  next_event_name: string;
}

export function ManagerEventOverview() {
  const [summary, setSummary] = useState<EventSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'list' | 'calendar' | 'analytics'>('list');
  
  const supabase = createClient();

  useEffect(() => {
    fetchEventSummary();
  }, []);

  const fetchEventSummary = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get event summary statistics
      const { data: summaryData, error: summaryError } = await supabase
        .rpc('get_event_summary');

      if (summaryError) throw summaryError;

      // Get next upcoming event
      const { data: nextEventData } = await supabase
        .from('events')
        .select('name, event_date, event_time')
        .gte('event_date', new Date().toISOString().split('T')[0])
        .order('event_date', { ascending: true })
        .limit(1);

      const nextEvent = nextEventData?.[0];

      setSummary({
        ...(summaryData?.[0] || {
          total_events: 0,
          upcoming_events: 0,
          events_this_month: 0,
          total_bookings_from_events: 0,
          average_event_capacity: 0,
          top_performing_event: 'No events yet'
        }),
        next_event_date: nextEvent?.event_date || '',
        next_event_name: nextEvent?.name || 'No upcoming events'
      });

    } catch (err) {
      console.error('Error fetching event summary:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch event summary');
    } finally {
      setLoading(false);
    }
  };

  const tabOptions = [
    { key: 'list', label: 'Events List', icon: '📋' },
    { key: 'calendar', label: 'Calendar', icon: '📅' },
    { key: 'analytics', label: 'Analytics', icon: '📊' }
  ] as const;

  if (loading && !summary) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner size="lg" color="gold" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Heading level={2} className="text-speakeasy-gold mb-2">
            Event Management
          </Heading>
          <Text className="text-speakeasy-champagne/70">
            Comprehensive event planning and management
          </Text>
        </div>
        
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" href="/admin/artists">
            🎵 Manage Artists
          </Button>
          <Button variant="primary" href="/admin/events/create">
            ➕ Create Event
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="p-4 bg-gradient-to-br from-speakeasy-burgundy/20 to-speakeasy-noir/20">
            <Text className="text-xs text-speakeasy-copper uppercase tracking-wide">Total Events</Text>
            <Text className="text-2xl font-bebas text-speakeasy-champagne mt-1">
              {summary.total_events}
            </Text>
            <Text className="text-xs text-speakeasy-champagne/60">
              {summary.upcoming_events} upcoming
            </Text>
          </Card>

          <Card className="p-4 bg-gradient-to-br from-purple-900/20 to-speakeasy-noir/20">
            <Text className="text-xs text-speakeasy-copper uppercase tracking-wide">This Month</Text>
            <Text className="text-2xl font-bebas text-purple-400 mt-1">
              {summary.events_this_month}
            </Text>
            <Text className="text-xs text-speakeasy-champagne/60">
              Events scheduled
            </Text>
          </Card>

          <Card className="p-4 bg-gradient-to-br from-green-900/20 to-speakeasy-noir/20">
            <Text className="text-xs text-speakeasy-copper uppercase tracking-wide">Event Bookings</Text>
            <Text className="text-2xl font-bebas text-green-400 mt-1">
              {summary.total_bookings_from_events}
            </Text>
            <Text className="text-xs text-speakeasy-champagne/60">
              Generated bookings
            </Text>
          </Card>

          <Card className="p-4 bg-gradient-to-br from-speakeasy-gold/20 to-speakeasy-copper/20">
            <Text className="text-xs text-speakeasy-copper uppercase tracking-wide">Avg Capacity</Text>
            <Text className="text-2xl font-bebas text-speakeasy-gold mt-1">
              {Math.round(summary.average_event_capacity || 0)}%
            </Text>
            <Text className="text-xs text-speakeasy-champagne/60">
              Capacity utilization
            </Text>
          </Card>
        </div>
      )}

      {/* Next Event Alert */}
      {summary?.next_event_date && (
        <Card className="border-speakeasy-gold/20 bg-gradient-to-r from-speakeasy-gold/10 to-speakeasy-copper/10 p-4">
          <div className="flex items-center justify-between">
            <div>
              <Text className="text-speakeasy-gold font-medium mb-1">
                Next Event: {summary.next_event_name}
              </Text>
              <Text className="text-speakeasy-champagne/80 text-sm">
                {new Date(summary.next_event_date).toLocaleDateString('en-GB', {
                  weekday: 'long',
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric'
                })}
              </Text>
            </div>
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" href={`/admin/events?date=${summary.next_event_date}`}>
                View Details
              </Button>
              <Button variant="outline" size="sm" href="/admin/events/setup">
                Setup Checklist
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Weekly Events Status */}
      <Card className="p-6">
        <Heading level={3} className="text-speakeasy-gold mb-4">
          Weekly Events Status
        </Heading>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Friday - LA FIESTA */}
          <div className="p-4 bg-gradient-to-br from-pink-900/20 to-red-900/20 rounded-lg border border-pink-400/20">
            <div className="flex items-center justify-between mb-2">
              <Text className="text-pink-400 font-bebas text-lg">LA FIESTA</Text>
              <Text variant="caption" className="text-pink-300">FRIDAY</Text>
            </div>
            <Text className="text-speakeasy-champagne/70 text-sm mb-3">
              Latin vibes with live DJs and cocktails
            </Text>
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" href="/admin/events/la-fiesta">
                Manage
              </Button>
              <Button variant="ghost" size="sm" href="/admin/bookings?event=la-fiesta">
                Bookings
              </Button>
            </div>
          </div>

          {/* Saturday - SHHH! */}
          <div className="p-4 bg-gradient-to-br from-yellow-900/20 to-orange-900/20 rounded-lg border border-yellow-400/20">
            <div className="flex items-center justify-between mb-2">
              <Text className="text-yellow-400 font-bebas text-lg">SHHH!</Text>
              <Text variant="caption" className="text-yellow-300">SATURDAY</Text>
            </div>
            <Text className="text-speakeasy-champagne/70 text-sm mb-3">
              Underground house & techno experience
            </Text>
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" href="/admin/events/shhh">
                Manage
              </Button>
              <Button variant="ghost" size="sm" href="/admin/bookings?event=shhh">
                Bookings
              </Button>
            </div>
          </div>

          {/* Sunday - NOSTALGIA */}
          <div className="p-4 bg-gradient-to-br from-blue-900/20 to-purple-900/20 rounded-lg border border-blue-400/20">
            <div className="flex items-center justify-between mb-2">
              <Text className="text-blue-400 font-bebas text-lg">NOSTALGIA</Text>
              <Text variant="caption" className="text-blue-300">SUNDAY</Text>
            </div>
            <Text className="text-speakeasy-champagne/70 text-sm mb-3">
              Classic hits and throwback anthems
            </Text>
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" href="/admin/events/nostalgia">
                Manage
              </Button>
              <Button variant="ghost" size="sm" href="/admin/bookings?event=nostalgia">
                Bookings
              </Button>
            </div>
          </div>
        </div>
      </Card>

      {/* Tab Navigation */}
      <Card className="p-1">
        <div className="flex gap-1">
          {tabOptions.map((option) => (
            <Button
              key={option.key}
              variant={activeTab === option.key ? 'primary' : 'ghost'}
              size="sm"
              onClick={() => setActiveTab(option.key)}
              className="flex items-center gap-2"
            >
              <span>{option.icon}</span>
              {option.label}
            </Button>
          ))}
        </div>
      </Card>

      {/* Tab Content */}
      <div className="min-h-[400px]">
        {activeTab === 'list' && (
          <EventsList onEventUpdate={fetchEventSummary} />
        )}
        
        {activeTab === 'calendar' && (
          <EventCalendar />
        )}
        
        {activeTab === 'analytics' && (
          <EventAnalytics />
        )}
      </div>

      {error && (
        <Card className="border-red-400/20 bg-red-900/20 p-4">
          <Text className="text-red-300">Error: {error}</Text>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={fetchEventSummary}
            className="mt-2 text-red-300 hover:text-red-200"
          >
            Retry
          </Button>
        </Card>
      )}
    </div>
  );
}