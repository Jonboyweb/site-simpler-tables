import { Suspense } from 'react';
import type { Metadata } from 'next';
import { MainLayout } from '@/components/templates';
import { EventsGrid } from '@/components/organisms';

export const metadata: Metadata = {
  title: 'Events | The Backroom Leeds',
  description: 'Discover weekly events at The Backroom Leeds - LA FIESTA, SHHH!, and NOSTALGIA nights with top DJs',
  keywords: ['Leeds events', 'nightclub events', 'The Backroom Leeds', 'LA FIESTA', 'SHHH', 'NOSTALGIA'],
  openGraph: {
    title: 'Events | The Backroom Leeds',
    description: 'Weekly events at Leeds\' premier speakeasy venue',
    type: 'website',
  },
};

export default function EventsPage() {
  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h1 className="text-5xl md:text-6xl font-bebas text-speakeasy-gold mb-4">
            Upcoming Events
          </h1>
          <p className="text-lg text-speakeasy-champagne max-w-2xl mx-auto font-playfair">
            Experience the finest entertainment at Leeds' most exclusive speakeasy. 
            From LA FIESTA's vibrant nights to SHHH!'s intimate sessions and NOSTALGIA's timeless classics.
          </p>
        </div>
        
        <Suspense fallback={
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="bg-speakeasy-burgundy/30 rounded-lg h-96"></div>
              </div>
            ))}
          </div>
        }>
          <EventsGrid />
        </Suspense>
      </div>
    </MainLayout>
  );
}