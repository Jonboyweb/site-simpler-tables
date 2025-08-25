import { NextRequest, NextResponse } from 'next/server';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// Event templates for dynamic generation
const eventTemplates = {
  'la-fiesta': {
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
  'shhh': {
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
  'nostalgia': {
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
  }
};

/**
 * Parse event ID to extract slug and date
 * Format: "la-fiesta-2025-08-29" -> { slug: "la-fiesta", dateStr: "2025-08-29" }
 */
function parseEventId(eventId: string): { slug: string; dateStr: string } | null {
  // Split by hyphen and rejoin - the format is: slug-YYYY-MM-DD
  const parts = eventId.split('-');
  
  if (parts.length < 4) return null;
  
  // The last 3 parts should be year, month, day
  const dateStr = parts.slice(-3).join('-');
  const slug = parts.slice(0, -3).join('-');
  
  // Validate date format
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return null;
  
  return { slug, dateStr };
}

/**
 * Generate event instance from template and date
 */
function generateEventInstance(slug: string, dateStr: string) {
  const template = eventTemplates[slug as keyof typeof eventTemplates];
  if (!template) return null;
  
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return null;
  
  // Set the time based on event template
  const [hours, minutes] = template.start_time.split(':').map(Number);
  date.setHours(hours, minutes, 0, 0);
  
  return {
    id: `${slug}-${dateStr}`,
    event: template,
    date,
    soldOut: false, // In real app, this would be checked against bookings
  };
}

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

    // Parse the event ID to extract slug and date
    const parsed = parseEventId(id);
    if (!parsed) {
      return NextResponse.json(
        { error: 'Invalid event ID format. Expected format: slug-YYYY-MM-DD' },
        { status: 400 }
      );
    }

    // Generate event instance from template
    const eventInstance = generateEventInstance(parsed.slug, parsed.dateStr);
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

// For development - list available event templates
export async function OPTIONS() {
  return NextResponse.json({
    available_event_templates: Object.keys(eventTemplates),
    id_format: 'slug-YYYY-MM-DD (e.g., la-fiesta-2025-08-29)',
    note: 'This is a mock API for development. In production, this would connect to the Supabase database.'
  });
}