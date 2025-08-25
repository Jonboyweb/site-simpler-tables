'use client';

import { useEffect } from 'react';
import { Button, Heading, Text } from '@/components/atoms';
import { BookingLayout } from '@/components/templates';

interface BookingErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function BookingError({ error, reset }: BookingErrorProps) {
  useEffect(() => {
    console.error('Booking page error:', error);
  }, [error]);

  return (
    <BookingLayout currentStep={1} totalSteps={3}>
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="mb-6">
            <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-speakeasy-burgundy/20 flex items-center justify-center">
              <svg 
                className="w-12 h-12 text-speakeasy-copper" 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16c-.77.833.192 2.5 1.732 2.5z" 
                />
              </svg>
            </div>
            <Heading level={2} className="text-speakeasy-gold mb-2">
              Booking System Unavailable
            </Heading>
            <Text className="text-speakeasy-champagne/80 mb-6">
              We&apos;re experiencing technical difficulties with our booking system. 
              Please try again or contact us directly to make your reservation.
            </Text>
          </div>
          
          <div className="space-y-4">
            <Button 
              onClick={reset}
              variant="primary"
              size="lg"
              className="w-full"
            >
              Try Again
            </Button>
            <Button 
              href="/contact"
              variant="secondary"
              size="lg"
              className="w-full"
            >
              Contact Us
            </Button>
            <Button 
              href="/"
              variant="ghost"
              size="lg"
              className="w-full"
            >
              Return Home
            </Button>
          </div>
        </div>
      </div>
    </BookingLayout>
  );
}