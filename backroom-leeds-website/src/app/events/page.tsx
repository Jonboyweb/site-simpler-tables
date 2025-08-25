import { Suspense } from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { MainLayout } from '@/components/templates';
import { EventsGridSkeleton } from '@/components/molecules';
import { getVenueEventData } from '@/lib/api/events';
import { EventsList } from '@/components/organisms';

export const metadata: Metadata = {
  title: 'Events | The Backroom Leeds',
  description: 'Discover weekly events at The Backroom Leeds - LA FIESTA, SHHH!, and NOSTALGIA nights with top DJs and exclusive speakeasy experiences',
  keywords: ['Leeds events', 'nightclub events', 'The Backroom Leeds', 'LA FIESTA', 'SHHH', 'NOSTALGIA', 'speakeasy events', 'prohibition themed nights'],
  openGraph: {
    title: 'Events | The Backroom Leeds',
    description: 'Weekly events at Leeds\' premier speakeasy venue - LA FIESTA, SHHH!, and NOSTALGIA',
    type: 'website',
    images: [
      {
        url: '/images/events-og.jpg',
        width: 1200,
        height: 630,
        alt: 'The Backroom Leeds Events',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Events | The Backroom Leeds',
    description: 'Weekly events at Leeds\' premier speakeasy venue',
  },
};

/**
 * EventsContainer Server Component
 * Server Component that fetches events and handles empty states
 */
async function EventsContainer() {
  try {
    const events = await getVenueEventData();
    
    if (events.length === 0) {
      return (
        <div className="text-center py-16">
          <div className="w-16 h-16 mx-auto mb-4 bg-luxury-copper/20 rounded-full flex items-center justify-center">
            <svg 
              className="w-8 h-8 text-luxury-copper" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
              aria-hidden="true"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" 
              />
            </svg>
          </div>
          <p className="text-luxury-champagne/80 text-lg font-crimson italic">
            No events currently scheduled
          </p>
          <p className="text-luxury-smoke/80 text-sm mt-2 font-raleway">
            Check back soon for upcoming shows and exclusive speakeasy experiences!
          </p>
        </div>
      );
    }
    
    return <EventsList events={events} />;
  } catch (error) {
    console.error('EventsContainer error:', error);
    // Re-throw to let error boundary handle it
    throw new Error('Failed to load events. Please try again later.');
  }
}

/**
 * Events Page - Server Component
 * 
 * Displays upcoming events using Next.js 15.5 Server Components pattern.
 * Implements proper Suspense boundaries and streaming for optimal performance.
 */
export default function EventsPage() {
  return (
    <MainLayout>
      <div className="luxury-events-section">
        {/* Page Header */}
        <header className="luxury-events-header">
          <h1 className="luxury-events-title">
            Upcoming Events
          </h1>
          <p className="luxury-events-subtitle">
            Experience the finest entertainment at Leeds&apos; most exclusive speakeasy. 
            From <span className="text-luxury-copper font-semibold">LA FIESTA&apos;s</span> vibrant Latin nights to{' '}
            <span className="text-luxury-copper font-semibold">SHHH!&apos;s</span> intimate deep house sessions and{' '}
            <span className="text-luxury-copper font-semibold">NOSTALGIA&apos;s</span> timeless classics.
          </p>
        </header>
        
        {/* Events Grid with Suspense */}
        <main>
          <Suspense fallback={<EventsGridSkeleton />}>
            <EventsContainer />
          </Suspense>
        </main>
        
        {/* Call to Action */}
        <section className="mt-16 text-center">
          <div className="luxury-event-card p-8">
            <h2 className="text-2xl font-futura text-luxury-copper mb-4 tracking-wide uppercase">
              Reserve Your Table
            </h2>
            <p className="text-luxury-champagne/80 mb-6 font-crimson italic">
              Secure your spot at Leeds&apos; most exclusive speakeasy experience
            </p>
            <Link
              href="/book"
              className="luxury-cta-primary px-8 py-3 rounded font-medium"
              aria-label="Book a table at The Backroom Leeds"
            >
              Book Now
            </Link>
          </div>
        </section>
      </div>
    </MainLayout>
  );
}