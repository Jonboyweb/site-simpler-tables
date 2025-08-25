'use client';

/**
 * Events Page Error Boundary
 * 
 * Handles errors in the events page using Next.js 15.5 error boundary pattern.
 * Provides graceful error handling with speakeasy-themed styling.
 */

import { useEffect } from 'react';
import { Button, Heading, Text } from '@/components/atoms';
import { MainLayout } from '@/components/templates';

interface EventsErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function EventsError({ error, reset }: EventsErrorProps) {
  useEffect(() => {
    // Log the error for debugging and monitoring
    console.error('Events page error:', error);
    
    // Optional: Report error to monitoring service
    // reportError(error);
  }, [error]);

  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-12">
        {/* Page Header */}
        <header className="text-center mb-12">
          <h1 className="text-5xl md:text-6xl font-bebas text-speakeasy-gold mb-4 tracking-wider">
            Upcoming Events
          </h1>
          <div className="mt-6 h-px bg-gradient-to-r from-transparent via-speakeasy-gold/30 to-transparent max-w-md mx-auto"></div>
        </header>

        <div className="max-w-2xl mx-auto text-center">
          <div className="bg-gradient-to-br from-speakeasy-burgundy/20 to-speakeasy-noir/20 rounded-lg p-12 border border-red-500/20">
            {/* Error Icon */}
            <div className="w-20 h-20 mx-auto mb-6 bg-red-500/20 rounded-full flex items-center justify-center">
              <svg 
                className="w-10 h-10 text-red-400" 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
                aria-hidden="true"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" 
                />
              </svg>
            </div>

            <Heading level={2} variant="bebas" className="text-speakeasy-gold mb-4 tracking-wide">
              Something Went Wrong
            </Heading>
            <Text className="text-speakeasy-champagne/80 mb-8 font-playfair leading-relaxed">
              We're having trouble loading our upcoming events. Our prohibition-era staff are working 
              to fix this issue. Please try again in a moment.
            </Text>

            {/* Error Details (development only) */}
            {process.env.NODE_ENV === 'development' && (
              <details className="mb-8 text-left bg-speakeasy-noir/20 rounded p-4 border border-speakeasy-champagne/10">
                <summary className="text-speakeasy-gold cursor-pointer mb-2 text-sm">
                  Error Details (Development)
                </summary>
                <pre className="text-xs text-speakeasy-champagne/60 overflow-auto">
                  {error.message}
                  {error.stack && '\n\n' + error.stack}
                </pre>
              </details>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                variant="gold"
                size="lg"
                onClick={reset}
                className="min-w-[140px]"
              >
                Try Again
              </Button>
              <Button
                variant="ghost"
                size="lg"
                href="/"
                className="min-w-[140px]"
              >
                Return Home
              </Button>
            </div>
          </div>

          {/* Fallback Event Information */}
          <div className="mt-12 bg-speakeasy-burgundy/10 rounded-lg p-8 border border-speakeasy-gold/20">
            <Heading level={3} variant="bebas" className="text-speakeasy-gold mb-4 tracking-wide">
              Our Weekly Events
            </Heading>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
              <div className="text-center">
                <h4 className="font-semibold text-speakeasy-gold mb-2 font-bebas tracking-wider">LA FIESTA</h4>
                <Text variant="caption" className="text-speakeasy-champagne/80 block">Fridays • 11PM-6AM</Text>
                <Text variant="caption" className="text-speakeasy-champagne/60">Latin & Reggaeton</Text>
              </div>
              <div className="text-center">
                <h4 className="font-semibold text-speakeasy-gold mb-2 font-bebas tracking-wider">SHHH!</h4>
                <Text variant="caption" className="text-speakeasy-champagne/80 block">Saturdays • 11PM-6AM</Text>
                <Text variant="caption" className="text-speakeasy-champagne/60">Deep House & Underground</Text>
              </div>
              <div className="text-center">
                <h4 className="font-semibold text-speakeasy-gold mb-2 font-bebas tracking-wider">NOSTALGIA</h4>
                <Text variant="caption" className="text-speakeasy-champagne/80 block">Sundays • 11PM-5AM</Text>
                <Text variant="caption" className="text-speakeasy-champagne/60">Classic Hits & Throwbacks</Text>
              </div>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}