import { NextRequest, NextResponse } from 'next/server';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// Mock event data for development/demonstration
const mockEvents = {
  'la-fiesta-2025-01-31': {
    id: 'la-fiesta-2025-01-31',
    event: {
      id: 'la-fiesta',
      name: 'LA FIESTA',
      slug: 'la-fiesta',
      description: 'The ultimate Latin party experience with vibrant beats, tropical cocktails, and electric atmosphere. Dance the night away to reggaeton, bachata, and Latin house music.',
      day_of_week: 5, // Friday
      start_time: '23:00',
      end_time: '03:00',
      dj_lineup: ['DJ Carlos Rodriguez', 'MC Latina', 'DJ Tropical'],
      music_genres: ['Reggaeton', 'Bachata', 'Latin House', 'Merengue'],
      image_url: '/images/events/la-fiesta.jpg',
      ticket_url: 'https://fatsoma.com/the-backroom-la-fiesta',
      is_active: true,
      is_recurring: true,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-15T00:00:00Z'
    },
    date: new Date('2025-01-31T23:00:00Z'),
    soldOut: false
  },
  'shhh-2025-02-01': {
    id: 'shhh-2025-02-01',
    event: {
      id: 'shhh',
      name: 'SHHH!',
      slug: 'shhh',
      description: 'An intimate underground experience featuring deep house, techno, and progressive beats. Premium cocktails and sophisticated atmosphere for the discerning music lover.',
      day_of_week: 6, // Saturday
      start_time: '23:30',
      end_time: '03:30',
      dj_lineup: ['Deep House Dan', 'Techno Tom', 'Progressive Pete'],
      music_genres: ['Deep House', 'Techno', 'Progressive House'],
      image_url: '/images/events/shhh.jpg',
      ticket_url: 'https://fatsoma.com/the-backroom-shhh',
      is_active: true,
      is_recurring: true,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-15T00:00:00Z'
    },
    date: new Date('2025-02-01T23:30:00Z'),
    soldOut: false
  },
  'nostalgia-2025-02-02': {
    id: 'nostalgia-2025-02-02',
    event: {
      id: 'nostalgia',
      name: 'NOSTALGIA',
      slug: 'nostalgia',
      description: 'A journey through time with classic hits from the 80s, 90s, and 2000s. Vintage cocktails and retro vibes in our authentic speakeasy setting.',
      day_of_week: 0, // Sunday
      start_time: '22:00',
      end_time: '02:00',
      dj_lineup: ['Retro Rick', 'Classic Claire', 'Vintage Vince'],
      music_genres: ['80s Hits', '90s Classics', '2000s Anthems', 'Disco'],
      image_url: '/images/events/nostalgia.jpg',
      ticket_url: 'https://fatsoma.com/the-backroom-nostalgia',
      is_active: true,
      is_recurring: true,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-15T00:00:00Z'
    },
    date: new Date('2025-02-02T22:00:00Z'),
    soldOut: false
  }
};

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    // Validate the event ID
    if (!id) {
      return NextResponse.json(
        { error: 'Event ID is required' },
        { status: 400 }
      );
    }

    // Mock database lookup
    const eventInstance = mockEvents[id as keyof typeof mockEvents];

    if (!eventInstance) {
      return NextResponse.json(
        { error: 'Event not found' },
        { status: 404 }
      );
    }

    // Simulate API response delay (remove in production)
    await new Promise(resolve => setTimeout(resolve, 500));

    return NextResponse.json(eventInstance);

  } catch (error) {
    console.error('Error fetching event:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// For development - list available mock events
export async function OPTIONS() {
  return NextResponse.json({
    available_events: Object.keys(mockEvents),
    note: 'This is a mock API for development. In production, this would connect to the Supabase database.'
  });
}