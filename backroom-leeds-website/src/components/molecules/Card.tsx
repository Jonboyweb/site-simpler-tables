'use client';

import { forwardRef } from 'react';
import { cn } from '@/lib/utils';
import type { CardProps } from '@/types/components';

const cardVariants = {
  default: 'bg-speakeasy-noir/80 backdrop-blur-sm border border-speakeasy-gold/20',
  elevated: 'bg-speakeasy-noir/90 shadow-xl shadow-speakeasy-noir/50',
  bordered: 'bg-transparent border-2 border-speakeasy-gold',
  vintage: 'bg-gradient-to-br from-speakeasy-noir via-speakeasy-burgundy/10 to-speakeasy-noir',
};

const cardPadding = {
  none: '',
  sm: 'p-4',
  md: 'p-6',
  lg: 'p-8',
};

export const Card = forwardRef<HTMLDivElement, CardProps>(
  (
    {
      variant = 'default',
      hover = false,
      grain = false,
      padding = 'md',
      className,
      children,
      ...props
    },
    ref
  ) => {
    return (
      <div
        ref={ref}
        className={cn(
          'rounded-sm',
          cardVariants[variant],
          cardPadding[padding],
          hover && 'vintage-hover cursor-pointer',
          grain && 'vintage-grain',
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Card.displayName = 'Card';