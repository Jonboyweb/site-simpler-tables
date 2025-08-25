'use client';

import { useEffect } from 'react';
import { Button, Heading, Text } from '@/components/atoms';

interface AdminErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function AdminError({ error, reset }: AdminErrorProps) {
  useEffect(() => {
    console.error('Admin system error:', error);
  }, [error]);

  return (
    <div className="min-h-screen bg-speakeasy-noir flex items-center justify-center px-4">
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
          <Heading level={2} className="text-speakeasy-gold mb-2">
            System Error
          </Heading>
          <Text className="text-speakeasy-champagne/80 mb-6">
            The admin system encountered an unexpected error. This has been logged automatically. 
            Please try again or contact the system administrator if the problem persists.
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
            href="/admin/login"
            variant="secondary"
            size="lg"
            className="w-full"
          >
            Return to Login
          </Button>
        </div>

        {process.env.NODE_ENV === 'development' && (
          <div className="mt-6 p-4 bg-red-500/10 border border-red-500/20 rounded text-left">
            <Text className="text-red-400 text-sm font-mono">
              <strong>Development Error:</strong><br />
              {error.message}
            </Text>
          </div>
        )}
      </div>
    </div>
  );
}