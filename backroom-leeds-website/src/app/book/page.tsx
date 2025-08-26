'use client';

import { Suspense, useState } from 'react';
import { useRouter } from 'next/navigation';
import { BookingLayout } from '@/components/templates';
import { TableBookingForm } from '@/components/organisms';
import { submitBooking, buildConfirmationUrl } from '@/lib/booking-api';
import type { BookingFormData } from '@/types/components';

export default function BookPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string>('');

  const handleBookingSubmit = async (formData: BookingFormData) => {
    // Basic validation - ensure required fields are present
    if (!formData.customerName || !formData.customerEmail || !formData.customerPhone || !formData.date || !formData.time) {
      setError('Please fill in all required fields');
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.customerEmail)) {
      setError('Please enter a valid email address');
      return;
    }

    // Validate party size
    if (formData.partySize < 1 || formData.partySize > 12) {
      setError('Party size must be between 1 and 12 guests');
      return;
    }

    // Clear any previous errors
    setError('');
    setIsSubmitting(true);

    try {
      const result = await submitBooking(formData);
      
      if (result.success && result.data) {
        // Success - redirect to confirmation page
        const confirmationUrl = buildConfirmationUrl(result.data, formData);
        router.push(confirmationUrl);
      } else {
        // Handle API error
        setError(result.error || 'An unexpected error occurred while processing your booking');
      }
    } catch (err) {
      console.error('Booking submission error:', err);
      setError('Unable to submit booking. Please check your connection and try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <BookingLayout currentStep={1} totalSteps={3}>
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-5xl md:text-6xl font-bebas text-speakeasy-gold mb-4">
              Reserve Your Table
            </h1>
            <p className="text-lg text-speakeasy-champagne max-w-2xl mx-auto font-playfair mb-8">
              Secure your spot at Leeds&apos; most exclusive speakeasy. Choose from our selection of premium tables 
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

          {/* Error Display */}
          {error && (
            <div className="mb-8 max-w-2xl mx-auto">
              <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-4">
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            </div>
          )}
          
          <Suspense fallback={
            <div className="animate-pulse">
              <div className="bg-speakeasy-burgundy/30 rounded-lg h-96"></div>
            </div>
          }>
            <TableBookingForm 
              onSubmit={handleBookingSubmit}
              availableTables={[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16]} // Mock available tables for now
              loading={isSubmitting}
            />
          </Suspense>

          {/* Loading Overlay */}
          {isSubmitting && (
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
              <div className="bg-speakeasy-burgundy/90 rounded-lg p-8 text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-speakeasy-gold mx-auto mb-4"></div>
                <p className="text-speakeasy-champagne">Processing your booking...</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </BookingLayout>
  );
}