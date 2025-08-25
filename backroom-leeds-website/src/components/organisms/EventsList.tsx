'use client';

/**
 * EventsList Client Component
 * 
 * Client-side component that renders the list of events.
 * Receives event data from the server component and handles client-side interactions.
 */

import { EventCard } from './EventCard';
import type { EventInstance } from '@/types/components';

interface EventsListProps {
  events: EventInstance[];
}

export function EventsList({ events }: EventsListProps) {
  // Helper function to determine event type from name
  const getEventType = (eventName: string) => {
    const name = eventName.toUpperCase();
    if (name.includes('LA FIESTA')) return 'LA_FIESTA';
    if (name.includes('SHHH')) return 'SHHH';
    if (name.includes('NOSTALGIA')) return 'NOSTALGIA';
    return undefined;
  };

  // Helper function to get random available tables (simulation)
  const getAvailableTables = (eventInstance: EventInstance) => {
    // In a real app, this would fetch from API
    // For now, simulate based on event type and date
    const baseAvailability = eventInstance.soldOut ? 0 : Math.floor(Math.random() * 16) + 1;
    
    // LA FIESTA (popular) typically has fewer tables
    if (getEventType(eventInstance.event.name) === 'LA_FIESTA') {
      return Math.min(baseAvailability, 8);
    }
    
    return baseAvailability;
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {events.map((eventInstance) => {
        const eventType = getEventType(eventInstance.event.name);
        const availableTables = getAvailableTables(eventInstance);
        
        return (
          <EventCard
            key={eventInstance.id}
            id={eventInstance.id}
            title={eventInstance.event.name}
            date={eventInstance.date}
            image={eventInstance.event.image_url || undefined}
            description={eventInstance.event.description || undefined}
            artists={eventInstance.event.dj_lineup || undefined}
            ticketLink={eventInstance.event.ticket_url || undefined}
            soldOut={eventInstance.soldOut}
            availableTables={availableTables}
            showBookingCTA={true}
            eventType={eventType}
          />
        );
      })}
    </div>
  );
}