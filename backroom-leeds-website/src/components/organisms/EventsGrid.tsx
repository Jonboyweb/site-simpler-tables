'use client';

import { useEffect, useState } from 'react';
import { EventCard } from './EventCard';
import { LoadingSpinner } from '@/components/atoms';

interface Event {
  id: string;
  title: string;
  date: Date;
  image?: string;
  description?: string;
  artists?: string[];
  ticketLink?: string;
  soldOut?: boolean;
}

export const EventsGrid = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Simulate loading events data
    // In Phase 3, this will fetch from the API
    const fetchEvents = async () => {
      try {
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Mock events data based on technical specifications
        const mockEvents: Event[] = [
          {
            id: 'la-fiesta-2025-01-31',
            title: 'LA FIESTA',
            date: new Date('2025-01-31T22:00:00'),
            description: 'The hottest Latin night in Leeds with DJ Rodriguez spinning the finest reggaeton, Latin house, and salsa hits.',
            artists: ['DJ Rodriguez'],
            ticketLink: 'https://fatsoma.com/la-fiesta-backroom-leeds',
            soldOut: false
          },
          {
            id: 'shhh-2025-02-01',
            title: 'SHHH!',
            date: new Date('2025-02-01T21:00:00'),
            description: 'An intimate evening of deep house and underground beats in the heart of our speakeasy.',
            artists: ['Luna Beats'],
            ticketLink: 'https://fatsoma.com/shhh-backroom-leeds',
            soldOut: false
          },
          {
            id: 'nostalgia-2025-02-02',
            title: 'NOSTALGIA',
            date: new Date('2025-02-02T20:30:00'),
            description: 'Journey through time with classic hits and timeless favorites that defined generations.',
            artists: ['Vintage Vibes'],
            ticketLink: 'https://fatsoma.com/nostalgia-backroom-leeds',
            soldOut: false
          },
          {
            id: 'la-fiesta-2025-02-07',
            title: 'LA FIESTA',
            date: new Date('2025-02-07T22:00:00'),
            description: 'Weekly return of our most popular Latin night featuring fresh beats and familiar favorites.',
            artists: ['DJ Rodriguez', 'Special Guest'],
            ticketLink: 'https://fatsoma.com/la-fiesta-backroom-leeds',
            soldOut: false
          },
          {
            id: 'shhh-2025-02-08',
            title: 'SHHH!',
            date: new Date('2025-02-08T21:00:00'),
            description: 'Deep house sessions continue with underground artists and exclusive tracks.',
            artists: ['Luna Beats', 'Underground Collective'],
            ticketLink: 'https://fatsoma.com/shhh-backroom-leeds',
            soldOut: true
          },
          {
            id: 'nostalgia-2025-02-09',
            title: 'NOSTALGIA',
            date: new Date('2025-02-09T20:30:00'),
            description: 'Another trip down memory lane with the music that shaped our lives.',
            artists: ['Vintage Vibes'],
            ticketLink: 'https://fatsoma.com/nostalgia-backroom-leeds',
            soldOut: false
          }
        ];

        setEvents(mockEvents);
        setLoading(false);
      } catch (err) {
        setError('Failed to load events');
        setLoading(false);
      }
    };

    fetchEvents();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <LoadingSpinner size="lg" className="text-speakeasy-gold" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-16">
        <div className="w-16 h-16 mx-auto mb-4 bg-red-500/20 rounded-full flex items-center justify-center">
          <svg className="w-8 h-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <p className="text-speakeasy-champagne/80 mb-4">{error}</p>
        <button 
          onClick={() => window.location.reload()} 
          className="px-4 py-2 bg-speakeasy-gold/20 text-speakeasy-gold rounded hover:bg-speakeasy-gold/30 transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="w-16 h-16 mx-auto mb-4 bg-speakeasy-gold/20 rounded-full flex items-center justify-center">
          <svg className="w-8 h-8 text-speakeasy-gold" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>
        <p className="text-speakeasy-champagne/80">No events currently scheduled. Check back soon for upcoming shows!</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {events.map((event) => (
        <EventCard
          key={event.id}
          id={event.id}
          title={event.title}
          date={event.date}
          image={event.image}
          description={event.description}
          artists={event.artists}
          ticketLink={event.ticketLink}
          soldOut={event.soldOut}
        />
      ))}
    </div>
  );
};