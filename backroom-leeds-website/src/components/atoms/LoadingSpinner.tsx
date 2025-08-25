'use client';

import { cn } from '@/lib/utils';
import type { LoadingSpinnerProps } from '@/types/components';

const spinnerSizes = {
  sm: 'w-4 h-4',
  md: 'w-6 h-6',
  lg: 'w-8 h-8',
};

const spinnerColors = {
  gold: 'border-speakeasy-gold',
  copper: 'border-speakeasy-copper',
  champagne: 'border-speakeasy-champagne',
};

export const LoadingSpinner = ({ size = 'md', color = 'gold', className, ...props }: LoadingSpinnerProps) => {
  return (
    <div
      className={cn(
        'animate-spin rounded-full border-2 border-transparent border-t-current',
        spinnerSizes[size],
        spinnerColors[color],
        className
      )}
      role="status"
      aria-label="Loading"
      {...props}
    >
      <span className="sr-only">Loading...</span>
    </div>
  );
};