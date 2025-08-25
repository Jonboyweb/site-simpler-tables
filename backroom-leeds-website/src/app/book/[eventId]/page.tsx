import { Suspense } from 'react';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { BookingLayout } from '@/components/templates';
import { EventBookingWrapper } from '@/components/organisms';

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
        <Suspense fallback={
          <div className="space-y-6 animate-pulse">
            <div className="bg-speakeasy-burgundy/30 rounded-lg h-48 max-w-4xl mx-auto"></div>
            <div className="bg-speakeasy-burgundy/20 rounded-lg h-96 max-w-5xl mx-auto"></div>
          </div>
        }>
          <EventBookingWrapper eventId={eventId} className="max-w-6xl mx-auto" />
        </Suspense>
      </div>
    </BookingLayout>
  );
}

export async function generateStaticParams() {
  // In a real application, this would fetch all event IDs from the database
  // For now, return empty array to enable dynamic generation
  return [];
}