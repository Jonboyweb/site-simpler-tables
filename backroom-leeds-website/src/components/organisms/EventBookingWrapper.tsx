'use client';

import { useState, useEffect } from 'react';
import { notFound } from 'next/navigation';
import { BookingForm } from './BookingForm';
import { Card } from '@/components/molecules';
import { Heading, Text, Badge } from '@/components/atoms';
import type { EventInstance } from '@/types/components';

interface EventBookingWrapperProps {
  eventId: string;
  className?: string;
}

export function EventBookingWrapper({ eventId, className = '' }: EventBookingWrapperProps) {
  const [eventInstance, setEventInstance] = useState<EventInstance | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Helper function to determine event type from name
  const getEventType = (eventName: string) => {
    const name = eventName.toUpperCase();
    if (name.includes('LA FIESTA')) return 'LA_FIESTA';
    if (name.includes('SHHH')) return 'SHHH';
    if (name.includes('NOSTALGIA')) return 'NOSTALGIA';
    return undefined;
  };

  // Fetch event instance data
  useEffect(() => {
    const fetchEventInstance = async () => {
      try {
        setLoading(true);
        // In a real application, this would fetch from the API
        // For now, we'll simulate the API call
        const response = await fetch(`/api/events/${eventId}`);
        
        if (!response.ok) {
          if (response.status === 404) {
            notFound();
          }
          throw new Error('Failed to fetch event data');
        }

        const data = await response.json();
        // Convert date string back to Date object
        if (data.date) {
          data.date = new Date(data.date);
        }
        setEventInstance(data);
      } catch (err) {
        console.error('Error fetching event instance:', err);
        setError(err instanceof Error ? err.message : 'Failed to load event');
      } finally {
        setLoading(false);
      }
    };

    if (eventId) {
      fetchEventInstance();
    }
  }, [eventId]);

  // Loading state
  if (loading) {
    return (
      <div className={`space-y-6 ${className}`}>
        <Card variant="elevated" padding="lg" className="animate-pulse">
          <div className="space-y-4">
            <div className="h-6 bg-speakeasy-burgundy/30 rounded-sm"></div>
            <div className="h-4 bg-speakeasy-burgundy/20 rounded-sm"></div>
            <div className="h-4 bg-speakeasy-burgundy/20 rounded-sm w-2/3"></div>
          </div>
        </Card>
        <div className="h-96 bg-speakeasy-burgundy/20 rounded-lg animate-pulse"></div>
      </div>
    );
  }

  // Error state
  if (error || !eventInstance) {
    return (
      <Card variant="bordered" padding="lg" className="text-center">
        <Heading level={3} variant="bebas" className="text-speakeasy-gold mb-4">
          Event Not Found
        </Heading>
        <Text variant="body" className="mb-4">
          {error || 'The requested event could not be found.'}
        </Text>
        <Text variant="caption">
          Please check the event URL or return to the events page.
        </Text>
      </Card>
    );
  }

  const eventType = getEventType(eventInstance.event.name);
  const eventDate = eventInstance.date.toISOString().split('T')[0];
  
  // Check if event is sold out
  if (eventInstance.soldOut) {
    return (
      <div className={`space-y-6 ${className}`}>
        <Card variant="elevated" padding="lg" className="text-center">
          <div className="mb-4">
            <Badge variant="danger" size="md" className="text-xl px-6 py-3">
              Event Sold Out
            </Badge>
          </div>
          <Heading level={2} variant="bebas" className="mb-4">
            {eventInstance.event.name}
          </Heading>
          <Text variant="body" className="mb-4">
            Unfortunately, this event is completely sold out. Tables and entry tickets are no longer available.
          </Text>
          <div className="bg-speakeasy-burgundy/20 rounded-lg p-4 border border-speakeasy-gold/20">
            <Text variant="caption" className="text-speakeasy-gold">
              Event Date: {new Intl.DateTimeFormat('en-GB', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              }).format(eventInstance.date)}
            </Text>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Event Information Header */}
      <Card variant="elevated" padding="lg">
        <div className="text-center space-y-4">
          <div className="flex justify-center">
            <Badge variant="default" className="bg-speakeasy-burgundy/30 text-speakeasy-gold border border-speakeasy-gold/20">
              Event Booking
            </Badge>
          </div>
          
          <div>
            <Heading level={2} variant="bebas" className="mb-2">
              {eventInstance.event.name}
            </Heading>
            <Text variant="body" className="text-speakeasy-champagne/80">
              {new Intl.DateTimeFormat('en-GB', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              }).format(eventInstance.date)}
            </Text>
          </div>

          {eventInstance.event.description && (
            <div className="bg-speakeasy-burgundy/10 rounded-lg p-4 border border-speakeasy-gold/20">
              <Text variant="body">
                {eventInstance.event.description}
              </Text>
            </div>
          )}

          {/* DJ Lineup */}
          {eventInstance.event.dj_lineup && eventInstance.event.dj_lineup.length > 0 && (
            <div className="space-y-2">
              <Text variant="caption" className="text-speakeasy-gold">
                Tonight's Lineup:
              </Text>
              <div className="flex flex-wrap justify-center gap-2">
                {eventInstance.event.dj_lineup.map((dj) => (
                  <Badge key={dj} variant="default" size="sm">
                    {dj}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Event-specific information */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
            <div className="bg-speakeasy-burgundy/20 rounded-lg p-4 border border-speakeasy-gold/20">
              <Heading level={5} variant="bebas" className="text-speakeasy-gold mb-1">
                Table Service
              </Heading>
              <Text variant="caption">
                Premium drinks packages available
              </Text>
            </div>
            <div className="bg-speakeasy-burgundy/20 rounded-lg p-4 border border-speakeasy-gold/20">
              <Heading level={5} variant="bebas" className="text-speakeasy-gold mb-1">
                £50 Deposit
              </Heading>
              <Text variant="caption">
                Secure your table now
              </Text>
            </div>
            <div className="bg-speakeasy-burgundy/20 rounded-lg p-4 border border-speakeasy-gold/20">
              <Heading level={5} variant="bebas" className="text-speakeasy-gold mb-1">
                Event Experience
              </Heading>
              <Text variant="caption">
                Exclusive {eventInstance.event.name} atmosphere
              </Text>
            </div>
          </div>
        </div>
      </Card>

      {/* Booking Form */}
      <BookingForm
        eventDate={eventDate}
        eventId={eventId}
        eventInstanceId={eventInstance.id}
        eventType={eventType}
        eventTitle={eventInstance.event.name}
        className="max-w-5xl mx-auto"
      />
    </div>
  );
}