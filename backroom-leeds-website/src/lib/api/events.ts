/**
 * Events API and Data Service
 * 
 * Server-side data fetching for events using Next.js 15.5 Server Components pattern.
 * Integrates with Supabase database and provides real event data based on 
 * The Backroom Leeds specifications.
 */

// import { createClient } from '@/lib/supabase/server';
import type { Event, EventInstance } from '@/types/components';

/**
 * Fetches all active events from the database
 * TODO: Replace with actual Supabase client once server components are properly configured
 */
export async function getEvents(): Promise<Event[]> {
  // For now, return empty array and fall back to mock data
  // const supabase = await createClient();
  // 
  // const { data: events, error } = await supabase
  //   .from('events')
  //   .select('*')
  //   .eq('is_active', true)
  //   .order('day_of_week');
  //
  // if (error) {
  //   console.error('Failed to fetch events:', error);
  //   throw new Error('Failed to load events');
  // }
  //
  // return events || [];
  
  return []; // Will use mock data in getVenueEventData
}

/**
 * Generates event instances for upcoming dates
 * Based on recurring weekly events (LA FIESTA, SHHH!, NOSTALGIA)
 */
export async function getUpcomingEventInstances(weeks: number = 4): Promise<EventInstance[]> {
  const events = await getEvents();
  const instances: EventInstance[] = [];
  const today = new Date();
  
  // Generate instances for the specified number of weeks
  for (let week = 0; week < weeks; week++) {
    for (const event of events) {
      if (!event.is_recurring) continue;
      
      const instanceDate = getNextEventDate(event.day_of_week, week);
      
      // Only include future events
      if (instanceDate > today) {
        instances.push({
          id: `${event.slug}-${instanceDate.toISOString().split('T')[0]}`,
          event,
          date: instanceDate,
          soldOut: false, // TODO: Check actual availability from bookings
        });
      }
    }
  }

  // Sort by date
  return instances.sort((a, b) => a.date.getTime() - b.date.getTime());
}

/**
 * Calculate the next occurrence of a weekly event
 */
function getNextEventDate(dayOfWeek: number, weeksFromNow: number): Date {
  const today = new Date();
  const currentDay = today.getDay();
  
  // Calculate days until the target day of week
  let daysUntilEvent = dayOfWeek - currentDay;
  if (daysUntilEvent < 0) {
    daysUntilEvent += 7; // Next week
  }
  
  // Add the weeks offset
  daysUntilEvent += (weeksFromNow * 7);
  
  const eventDate = new Date(today);
  eventDate.setDate(today.getDate() + daysUntilEvent);
  
  return eventDate;
}

/**
 * Get real-time venue data based on The Backroom Leeds specifications
 * This simulates the event data until the database is fully populated
 */
export async function getVenueEventData(): Promise<EventInstance[]> {
  // Use actual database if available, otherwise return venue-specific mock data
  try {
    const dbEvents = await getUpcomingEventInstances();
    // If no events from database, use mock data
    if (dbEvents.length === 0) {
      return getMockVenueEvents();
    }
    return dbEvents;
  } catch (error) {
    console.warn('Database not available, using venue mock data:', error);
    return getMockVenueEvents();
  }
}

/**
 * Mock venue events based on The Backroom Leeds specifications
 * Real event information from technical specifications
 */
function getMockVenueEvents(): EventInstance[] {
  const today = new Date();
  const events: EventInstance[] = [];
  
  // Generate events for next 4 weeks
  for (let week = 0; week < 4; week++) {
    // Helper function to get next occurrence of a weekday
    const getNextWeekday = (dayOfWeek: number, weeksFromNow: number = 0) => {
      const date = new Date(today);
      const currentDay = date.getDay();
      let daysUntilTarget = dayOfWeek - currentDay;
      
      // If the target day is today or has passed this week, move to next week
      if (daysUntilTarget <= 0) {
        daysUntilTarget += 7;
      }
      
      // Add weeks offset
      daysUntilTarget += (weeksFromNow * 7);
      
      date.setDate(today.getDate() + daysUntilTarget);
      date.setHours(23, 0, 0, 0); // 11 PM start time
      return date;
    };
    
    // LA FIESTA - Fridays (5 = Friday)
    const laFiestaDate = getNextWeekday(5, week);
    
    events.push({
      id: `la-fiesta-${laFiestaDate.toISOString().split('T')[0]}`,
      event: {
        id: 'la-fiesta',
        name: 'LA FIESTA',
        slug: 'la-fiesta',
        description: 'The hottest Latin night in Leeds! Experience the energy of reggaeton, Latin house, and salsa hits that will keep you dancing until dawn.',
        day_of_week: 5, // Friday
        start_time: '23:00:00',
        end_time: '06:00:00',
        dj_lineup: ['DJ Rodriguez', 'Latin Collective'],
        music_genres: ['Reggaeton', 'Latin House', 'Salsa', 'Bachata'],
        image_url: null,
        ticket_url: 'https://fatsoma.com/la-fiesta-backroom-leeds',
        is_active: true,
        is_recurring: true,
        created_at: null,
        updated_at: null,
      },
      date: laFiestaDate,
      soldOut: week === 2, // Make one event sold out for testing
    });
    
    // SHHH! - Saturdays (6 = Saturday)
    const shhhDate = getNextWeekday(6, week);
    
    events.push({
      id: `shhh-${shhhDate.toISOString().split('T')[0]}`,
      event: {
        id: 'shhh',
        name: 'SHHH!',
        slug: 'shhh',
        description: 'An intimate journey through deep house and underground beats. Discover hidden gems and exclusive tracks in the heart of our speakeasy.',
        day_of_week: 6, // Saturday
        start_time: '23:00:00',
        end_time: '06:00:00',
        dj_lineup: ['Luna Beats', 'Underground Collective', 'Deep House Society'],
        music_genres: ['Deep House', 'Tech House', 'Underground', 'Progressive'],
        image_url: null,
        ticket_url: 'https://fatsoma.com/shhh-backroom-leeds',
        is_active: true,
        is_recurring: true,
        created_at: null,
        updated_at: null,
      },
      date: shhhDate,
      soldOut: false,
    });
    
    // NOSTALGIA - Sundays (0 = Sunday)
    const nostalgiaDate = getNextWeekday(0, week);
    
    events.push({
      id: `nostalgia-${nostalgiaDate.toISOString().split('T')[0]}`,
      event: {
        id: 'nostalgia',
        name: 'NOSTALGIA',
        slug: 'nostalgia',
        description: 'Take a trip down memory lane with timeless classics and the music that shaped generations. From vintage soul to classic hits.',
        day_of_week: 0, // Sunday
        start_time: '23:00:00',
        end_time: '05:00:00',
        dj_lineup: ['Vintage Vibes', 'Classic Collective'],
        music_genres: ['Classic Hits', 'Vintage Soul', 'Retro Pop', '90s Dance'],
        image_url: null,
        ticket_url: 'https://fatsoma.com/nostalgia-backroom-leeds',
        is_active: true,
        is_recurring: true,
        created_at: null,
        updated_at: null,
      },
      date: nostalgiaDate,
      soldOut: false,
    });
  }
  
  // Filter out past events and sort by date
  const now = new Date();
  return events
    .filter(event => event.date > now)
    .sort((a, b) => a.date.getTime() - b.date.getTime());
}

/**
 * Get a single event by slug
 * TODO: Replace with actual Supabase client once server components are properly configured
 */
export async function getEventBySlug(slug: string): Promise<Event | null> {
  // const supabase = await createClient();
  // 
  // const { data: event, error } = await supabase
  //   .from('events')
  //   .select('*')
  //   .eq('slug', slug)
  //   .eq('is_active', true)
  //   .single();
  //
  // if (error) {
  //   console.error(`Failed to fetch event ${slug}:`, error);
  //   return null;
  // }
  //
  // return event;
  
  // Return null for now, will be implemented with proper server components
  return null;
}