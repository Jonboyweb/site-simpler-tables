import { Suspense } from 'react';
import type { Metadata } from 'next';
import { BookingLayout } from '@/components/templates';
import { TableBookingForm } from '@/components/organisms';

export const metadata: Metadata = {
  title: 'Book a Table | The Backroom Leeds',
  description: 'Reserve your table at The Backroom Leeds. Choose from 16 exclusive tables across two floors with premium drinks packages.',
  keywords: ['book table Leeds', 'The Backroom Leeds booking', 'speakeasy table reservation', 'Leeds nightclub booking'],
  openGraph: {
    title: 'Book a Table | The Backroom Leeds',
    description: 'Reserve your exclusive table at Leeds\' premier speakeasy',
    type: 'website',
  },
};

export default function BookPage() {
  return (
    <BookingLayout currentStep={1} totalSteps={3}>
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-5xl md:text-6xl font-bebas text-speakeasy-gold mb-4">
              Reserve Your Table
            </h1>
            <p className="text-lg text-speakeasy-champagne max-w-2xl mx-auto font-playfair mb-8">
              Secure your spot at Leeds' most exclusive speakeasy. Choose from our selection of premium tables 
              across two atmospheric floors, each with curated drinks packages.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
              <div className="bg-speakeasy-burgundy/20 rounded-lg p-6 border border-speakeasy-gold/20">
                <h3 className="text-xl font-bebas text-speakeasy-gold mb-2">16 Premium Tables</h3>
                <p className="text-speakeasy-champagne/80 text-sm">Upstairs & downstairs seating options</p>
              </div>
              <div className="bg-speakeasy-burgundy/20 rounded-lg p-6 border border-speakeasy-gold/20">
                <h3 className="text-xl font-bebas text-speakeasy-gold mb-2">£50 Deposit</h3>
                <p className="text-speakeasy-champagne/80 text-sm">Secure your booking with instant confirmation</p>
              </div>
              <div className="bg-speakeasy-burgundy/20 rounded-lg p-6 border border-speakeasy-gold/20">
                <h3 className="text-xl font-bebas text-speakeasy-gold mb-2">Premium Packages</h3>
                <p className="text-speakeasy-champagne/80 text-sm">From £170 to £580 drinks packages</p>
              </div>
            </div>
          </div>
          
          <Suspense fallback={
            <div className="animate-pulse">
              <div className="bg-speakeasy-burgundy/30 rounded-lg h-96"></div>
            </div>
          }>
            <TableBookingForm />
          </Suspense>
        </div>
      </div>
    </BookingLayout>
  );
}