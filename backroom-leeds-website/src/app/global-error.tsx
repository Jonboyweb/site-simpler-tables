'use client';

import { useEffect } from 'react';
import Link from 'next/link';

interface GlobalErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function GlobalError({ error, reset }: GlobalErrorProps) {
  useEffect(() => {
    console.error('Global application error:', error);
  }, [error]);

  return (
    <html lang="en" className="min-h-screen">
      <body className="min-h-screen bg-speakeasy-noir text-speakeasy-champagne font-inter antialiased">
        <div className="min-h-screen flex items-center justify-center px-4">
          <div className="text-center max-w-md mx-auto">
            <div className="mb-6">
              <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-red-500/20 flex items-center justify-center">
                <svg 
                  className="w-12 h-12 text-red-400" 
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
              <h1 className="text-3xl font-bebas text-speakeasy-gold mb-2">
                Something Went Wrong
              </h1>
              <p className="text-speakeasy-champagne/80 mb-6">
                We've encountered an unexpected error. Our team has been notified and is working on a fix.
              </p>
            </div>
            
            <div className="space-y-4">
              <button 
                onClick={reset}
                className="w-full px-6 py-3 bg-speakeasy-gold text-speakeasy-noir rounded-sm font-bebas text-lg tracking-wider hover:bg-speakeasy-gold/90 transition-colors"
              >
                Try Again
              </button>
              <Link 
                href="/"
                className="block w-full px-6 py-3 bg-transparent border-2 border-speakeasy-gold text-speakeasy-gold rounded-sm font-bebas text-lg tracking-wider hover:bg-speakeasy-gold hover:text-speakeasy-noir transition-all"
              >
                Return Home
              </Link>
            </div>

            <div className="mt-8 pt-6 border-t border-speakeasy-gold/20">
              <p className="text-speakeasy-champagne/60 text-sm">
                If this problem persists, please contact us at{' '}
                <a 
                  href="mailto:info@backroomleeds.co.uk" 
                  className="text-speakeasy-gold hover:underline"
                >
                  info@backroomleeds.co.uk
                </a>
              </p>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}