import { Suspense } from 'react';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { MainLayout } from '@/components/templates';
import { getEventInstanceBySlugAndDate, getVenueEventData } from '@/lib/api/events';
import { 
  EventDetailHero,
  EventInfoSection,
  EventGallery,
  EventBookingIntegration,
  SocialProofSection 
} from '@/components/organisms';
import type { 
  DJProfile, 
  TableAvailabilityInfo, 
  VenueImage, 
  EventReview 
} from '@/types/components';

interface EventDetailPageProps {
  params: {
    slug: string;
  };
  searchParams: {
    date?: string;
  };
}

export async function generateMetadata({ params }: EventDetailPageProps): Promise<Metadata> {
  const eventInstance = await getEventInstanceBySlugAndDate(params.slug);
  
  if (!eventInstance) {
    return {
      title: 'Event Not Found | The Backroom Leeds',
      description: 'The requested event could not be found.',
    };
  }

  const { event } = eventInstance;
  const eventDate = new Intl.DateTimeFormat('en-GB', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(eventInstance.date);

  return {
    title: `${event.name} - ${eventDate} | The Backroom Leeds`,
    description: `Experience ${event.name} at The Backroom Leeds on ${eventDate}. ${event.description}`,
    keywords: [
      'The Backroom Leeds',
      event.name,
      'speakeasy events',
      'Leeds nightlife',
      ...(event.music_genres || []),
      ...(event.dj_lineup || []),
    ],
    openGraph: {
      title: `${event.name} - ${eventDate}`,
      description: event.description || '',
      type: 'event',
      images: [
        {
          url: event.image_url || '/images/events-og.jpg',
          width: 1200,
          height: 630,
          alt: `${event.name} at The Backroom Leeds`,
        },
      ],
      locale: 'en_GB',
      siteName: 'The Backroom Leeds',
    },
    twitter: {
      card: 'summary_large_image',
      title: `${event.name} - ${eventDate}`,
      description: event.description || '',
      images: [event.image_url || '/images/events-og.jpg'],
    },
  };
}

/**
 * Generate static params for all available event slugs
 * This enables static generation for known event pages
 */
export async function generateStaticParams() {
  // For now, return the three main events
  // TODO: Fetch from database when available
  return [
    { slug: 'la-fiesta' },
    { slug: 'shhh' },
    { slug: 'nostalgia' },
  ];
}

/**
 * EventDetail Server Component
 * Fetches comprehensive event data and renders the detail page
 */
async function EventDetailContent({ params, searchParams }: EventDetailPageProps) {
  const eventInstance = await getEventInstanceBySlugAndDate(params.slug, searchParams.date);
  
  if (!eventInstance) {
    notFound();
  }

  // Get additional event data
  const [allEvents, djProfiles, tableAvailability, venueImages, reviews] = await Promise.all([
    getVenueEventData(),
    getMockDJProfiles(eventInstance.event.slug),
    getMockTableAvailability(),
    getMockVenueImages(eventInstance.event.slug),
    getMockEventReviews(eventInstance.event.slug),
  ]);

  // Filter similar events (same type, different dates)
  const similarEvents = allEvents.filter(
    event => event.event.slug === eventInstance.event.slug && 
             event.id !== eventInstance.id
  ).slice(0, 3);

  // Get upcoming dates for this event type
  const upcomingDates = allEvents
    .filter(event => event.event.slug === eventInstance.event.slug)
    .map(event => event.date)
    .slice(0, 4);

  const handleBookingClick = () => {
    // This will be handled by client-side navigation
    console.log('Booking clicked for:', eventInstance.id);
  };

  return (
    <MainLayout>
      <div className="min-h-screen bg-luxury-noir">
        {/* Event Hero Section */}
        <EventDetailHero
          event={eventInstance.event}
          eventDate={eventInstance.date}
          heroImage={eventInstance.event.image_url}
          soldOut={eventInstance.soldOut}
          onBookingClick={handleBookingClick}
        />

        {/* Main Content */}
        <div className="container mx-auto px-4 py-16 space-y-16">
          {/* Event Information Section */}
          <EventInfoSection
            event={eventInstance.event}
            eventDate={eventInstance.date}
            djProfiles={djProfiles}
            tableAvailability={tableAvailability}
          />

          {/* Event Gallery */}
          {venueImages.length > 0 && (
            <EventGallery
              images={venueImages}
              eventType={getEventTypeFromSlug(eventInstance.event.slug)}
              autoplay={false}
            />
          )}

          {/* Table Booking Integration */}
          <EventBookingIntegration
            eventId={eventInstance.id}
            eventDate={eventInstance.date}
            availableTables={tableAvailability}
          />

          {/* Social Proof Section */}
          <SocialProofSection
            reviews={reviews}
            eventType={getEventTypeFromSlug(eventInstance.event.slug)}
          />

          {/* Upcoming Dates */}
          {upcomingDates.length > 1 && (
            <section className="luxury-event-card p-8">
              <h2 className="text-3xl font-futura text-luxury-copper mb-6 tracking-wide">
                UPCOMING {eventInstance.event.name} DATES
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {upcomingDates.slice(1).map((date, index) => (
                  <Link
                    key={index}
                    href={`/events/${eventInstance.event.slug}?date=${date.toISOString().split('T')[0]}`}
                    className="group p-4 bg-luxury-noir/30 rounded-lg border border-luxury-copper/20 hover:border-luxury-copper/40 transition-all duration-300 hover:bg-luxury-copper/5"
                  >
                    <div className="text-luxury-champagne font-crimson text-lg">
                      {new Intl.DateTimeFormat('en-GB', {
                        weekday: 'long',
                        month: 'long',
                        day: 'numeric',
                      }).format(date)}
                    </div>
                    <div className="text-luxury-smoke/80 text-sm mt-1">
                      {eventInstance.event.start_time} - {eventInstance.event.end_time}
                    </div>
                    <div className="text-luxury-copper text-sm mt-2 group-hover:text-luxury-gold transition-colors">
                      Book Now →
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* Similar Events */}
          {similarEvents.length === 0 && allEvents.length > 0 && (
            <section className="luxury-event-card p-8">
              <h2 className="text-3xl font-futura text-luxury-copper mb-6 tracking-wide">
                OTHER EXPERIENCES
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {allEvents
                  .filter(event => event.event.slug !== eventInstance.event.slug)
                  .slice(0, 3)
                  .map((event) => (
                    <Link
                      key={event.id}
                      href={`/events/${event.event.slug}`}
                      className="group luxury-event-card p-6 hover:shadow-luxury transition-all duration-300"
                    >
                      <h3 className="text-xl font-futura text-luxury-copper mb-2 tracking-wide">
                        {event.event.name}
                      </h3>
                      <p className="text-luxury-champagne/80 text-sm mb-4 font-crimson italic">
                        {event.event.description}
                      </p>
                      <div className="text-luxury-gold text-sm">
                        {new Intl.DateTimeFormat('en-GB', {
                          weekday: 'long',
                        }).format(event.date)}s at {event.event.start_time}
                      </div>
                    </Link>
                  ))}
              </div>
            </section>
          )}

          {/* Call to Action */}
          <section className="text-center">
            <div className="luxury-event-card p-12">
              <h2 className="text-4xl font-futura text-luxury-copper mb-6 tracking-wide">
                SECURE YOUR TABLE
              </h2>
              <p className="text-luxury-champagne/80 text-lg mb-8 font-crimson italic max-w-2xl mx-auto">
                Reserve your spot at Leeds&apos; most exclusive speakeasy experience. 
                Tables are limited and book up quickly.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                <Link
                  href={`/book/${eventInstance.id}`}
                  className="luxury-cta-primary px-8 py-4 text-lg font-medium min-w-[200px]"
                >
                  Book Table
                </Link>
                {eventInstance.event.ticket_url && (
                  <a
                    href={eventInstance.event.ticket_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="luxury-cta-secondary px-8 py-4 text-lg font-medium min-w-[200px]"
                  >
                    Entry Tickets
                  </a>
                )}
              </div>
            </div>
          </section>
        </div>
      </div>
    </MainLayout>
  );
}

/**
 * Event Detail Page - Main Export
 */
export default function EventDetailPage({ params, searchParams }: EventDetailPageProps) {
  return (
    <Suspense fallback={
      <MainLayout>
        <div className="min-h-screen bg-luxury-noir flex items-center justify-center">
          <div className="text-center">
            <div className="w-12 h-12 mx-auto mb-4 animate-spin">
              <div className="w-full h-full border-4 border-luxury-copper/20 border-t-luxury-copper rounded-full"></div>
            </div>
            <p className="text-luxury-champagne/80 font-crimson italic">Loading event details...</p>
          </div>
        </div>
      </MainLayout>
    }>
      <EventDetailContent params={params} searchParams={searchParams} />
    </Suspense>
  );
}

// Helper Functions

function getEventTypeFromSlug(slug: string) {
  const eventTypeMap = {
    'la-fiesta': 'LA_FIESTA' as const,
    'shhh': 'SHHH' as const,
    'nostalgia': 'NOSTALGIA' as const,
  };
  return eventTypeMap[slug as keyof typeof eventTypeMap];
}

async function getMockDJProfiles(eventSlug: string): Promise<DJProfile[]> {
  const djData = {
    'la-fiesta': [
      {
        id: 'dj-rodriguez',
        name: 'DJ Rodriguez',
        bio: 'Bringing authentic Latin beats with 15+ years of experience across Europe\'s top venues.',
        imageUrl: '/images/djs/dj-rodriguez.jpg',
        instagramUrl: 'https://instagram.com/djrodriguez',
        soundcloudUrl: 'https://soundcloud.com/djrodriguez',
        genres: ['Reggaeton', 'Latin House', 'Salsa'],
        isHeadliner: true,
        setTime: '01:00 - 03:00',
      },
      {
        id: 'latin-collective',
        name: 'Latin Collective',
        bio: 'A dynamic duo specializing in modern Latin fusion and crowd-pleasing bachata.',
        imageUrl: '/images/djs/latin-collective.jpg',
        instagramUrl: 'https://instagram.com/latincollective',
        genres: ['Bachata', 'Merengue', 'Latin Pop'],
        isHeadliner: false,
        setTime: '23:00 - 01:00',
      },
    ],
    'shhh': [
      {
        id: 'luna-beats',
        name: 'Luna Beats',
        bio: 'Deep house connoisseur known for ethereal soundscapes and underground gems.',
        imageUrl: '/images/djs/luna-beats.jpg',
        soundcloudUrl: 'https://soundcloud.com/lunabeats',
        spotifyUrl: 'https://open.spotify.com/artist/lunabeats',
        genres: ['Deep House', 'Progressive', 'Minimal'],
        isHeadliner: true,
        setTime: '02:00 - 04:00',
      },
      {
        id: 'underground-collective',
        name: 'Underground Collective',
        bio: 'Curators of the finest underground electronic music, setting the perfect tone.',
        imageUrl: '/images/djs/underground-collective.jpg',
        genres: ['Tech House', 'Underground', 'Deep House'],
        isHeadliner: false,
        setTime: '23:00 - 02:00',
      },
    ],
    'nostalgia': [
      {
        id: 'vintage-vibes',
        name: 'Vintage Vibes',
        bio: 'Masters of nostalgia, spinning the classics that defined generations.',
        imageUrl: '/images/djs/vintage-vibes.jpg',
        instagramUrl: 'https://instagram.com/vintagevibes',
        genres: ['Classic Hits', 'Vintage Soul', '90s Dance'],
        isHeadliner: true,
        setTime: '00:00 - 02:30',
      },
      {
        id: 'classic-collective',
        name: 'Classic Collective',
        bio: 'Bringing back the golden age of music with carefully curated classic sets.',
        imageUrl: '/images/djs/classic-collective.jpg',
        genres: ['Retro Pop', '80s New Wave', 'Classic Hits'],
        isHeadliner: false,
        setTime: '23:00 - 00:00',
      },
    ],
  };

  return djData[eventSlug as keyof typeof djData] || [];
}

async function getMockTableAvailability(): Promise<TableAvailabilityInfo[]> {
  return [
    {
      tableNumber: 1,
      capacity: 4,
      location: 'upstairs',
      priceRange: 'basic',
      available: true,
      features: ['Great view', 'Easy bar access'],
    },
    {
      tableNumber: 3,
      capacity: 6,
      location: 'upstairs',
      priceRange: 'premium',
      available: true,
      features: ['VIP area', 'Bottle service', 'Reserved seating'],
    },
    {
      tableNumber: 8,
      capacity: 8,
      location: 'downstairs',
      priceRange: 'premium',
      available: false,
      features: ['Dance floor view', 'Premium sound', 'Dedicated service'],
    },
  ];
}

async function getMockVenueImages(eventSlug: string): Promise<VenueImage[]> {
  const baseImages = [
    {
      id: 'venue-upstairs',
      url: '/images/venue/upstairs-area.jpg',
      alt: 'The Backroom Leeds upstairs seating area',
      category: 'venue' as const,
    },
    {
      id: 'venue-downstairs',
      url: '/images/venue/downstairs-dancefloor.jpg',
      alt: 'The Backroom Leeds downstairs dance floor',
      category: 'venue' as const,
    },
    {
      id: 'atmosphere-1',
      url: `/images/events/${eventSlug}/atmosphere-1.jpg`,
      alt: `${eventSlug} event atmosphere`,
      category: 'atmosphere' as const,
      eventType: getEventTypeFromSlug(eventSlug),
    },
    {
      id: 'drinks-premium',
      url: '/images/venue/premium-cocktails.jpg',
      alt: 'Premium cocktails and bottle service',
      category: 'food_drink' as const,
    },
  ];

  return baseImages;
}

async function getMockEventReviews(eventSlug: string): Promise<EventReview[]> {
  const reviewsData = {
    'la-fiesta': [
      {
        id: 'review-1',
        customerName: 'Sarah M.',
        rating: 5,
        comment: 'Incredible Latin night! The energy was amazing and DJ Rodriguez was absolutely fantastic. Will definitely be back!',
        date: new Date('2024-01-15'),
        eventType: 'LA_FIESTA' as const,
        verified: true,
      },
      {
        id: 'review-2',
        customerName: 'Miguel R.',
        rating: 5,
        comment: 'Best Latin music venue in Leeds! Authentic atmosphere and great drinks. Perfect for dancing the night away.',
        date: new Date('2024-01-08'),
        eventType: 'LA_FIESTA' as const,
        verified: true,
      },
    ],
    'shhh': [
      {
        id: 'review-3',
        customerName: 'Alex K.',
        rating: 5,
        comment: 'Luna Beats delivered an incredible deep house set. The sound system is world-class and the intimate setting is perfect.',
        date: new Date('2024-01-13'),
        eventType: 'SHHH' as const,
        verified: true,
      },
    ],
    'nostalgia': [
      {
        id: 'review-4',
        customerName: 'Emma L.',
        rating: 4,
        comment: 'Loved the throwback music! Great atmosphere and everyone was singing along. Perfect Sunday night out.',
        date: new Date('2024-01-14'),
        eventType: 'NOSTALGIA' as const,
        verified: true,
      },
    ],
  };

  return reviewsData[eventSlug as keyof typeof reviewsData] || [];
}