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
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {events.map((eventInstance) => (
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
        />
      ))}
    </div>
  );
}