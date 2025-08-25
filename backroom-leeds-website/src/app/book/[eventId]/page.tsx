import { Suspense } from 'react';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { BookingLayout } from '@/components/templates';
import { TableBookingForm } from '@/components/organisms';

interface BookEventPageProps {
  params: Promise<{
    eventId: string;
  }>;
}

export async function generateMetadata({ params }: BookEventPageProps): Promise<Metadata> {
  // This would typically fetch event data from the database
  const { eventId } = await params;
  
  return {
    title: `Book for Event ${eventId} | The Backroom Leeds`,
    description: `Reserve your table for this exclusive event at The Backroom Leeds.`,
    keywords: ['book table Leeds', 'The Backroom Leeds booking', 'event booking', 'speakeasy reservation'],
    openGraph: {
      title: `Book for Event ${eventId} | The Backroom Leeds`,
      description: 'Reserve your table for this exclusive event at Leeds\' premier speakeasy',
      type: 'website',
    },
  };
}

export default async function BookEventPage({ params }: BookEventPageProps) {
  const { eventId } = await params;

  // Basic validation - in a real app, this would fetch from database
  if (!eventId || eventId.length < 3) {
    notFound();
  }

  return (
    <BookingLayout currentStep={1} totalSteps={3}>
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <div className="mb-6">
              <span className="inline-block px-4 py-2 bg-speakeasy-burgundy/30 rounded-full text-speakeasy-gold text-sm font-bebas tracking-wider border border-speakeasy-gold/20">
                Event Booking: {eventId.toUpperCase()}
              </span>
            </div>
            
            <h1 className="text-5xl md:text-6xl font-bebas text-speakeasy-gold mb-4">
              Book for This Event
            </h1>
            <p className="text-lg text-speakeasy-champagne max-w-2xl mx-auto font-playfair mb-8">
              Reserve your table for this exclusive event at The Backroom Leeds. 
              Premium table service with curated drinks packages available.
            </p>
            
            <div className="bg-speakeasy-burgundy/10 rounded-lg p-6 border border-speakeasy-gold/20 mb-8">
              <h3 className="text-xl font-bebas text-speakeasy-gold mb-2">Event Information</h3>
              <p className="text-speakeasy-champagne/80">
                Event details will be loaded dynamically. This includes date, time, 
                special requirements, and available table configurations.
              </p>
            </div>
          </div>
          
          <Suspense fallback={
            <div className="animate-pulse">
              <div className="bg-speakeasy-burgundy/30 rounded-lg h-96"></div>
            </div>
          }>
            <TableBookingForm eventId={eventId} />
          </Suspense>
        </div>
      </div>
    </BookingLayout>
  );
}

export async function generateStaticParams() {
  // In a real application, this would fetch all event IDs from the database
  // For now, return empty array to enable dynamic generation
  return [];
}