'use client';

import { forwardRef } from 'react';
import { cn } from '@/lib/utils';
import type { TextProps } from '@/types/components';

const textVariants = {
  body: 'text-base leading-relaxed',
  caption: 'text-sm leading-normal',
  small: 'text-xs leading-tight',
};

export const Text = forwardRef<HTMLParagraphElement, TextProps>(
  ({ variant = 'body', champagne = true, className, children, ...props }, ref) => {
    return (
      <p
        ref={ref}
        className={cn(
          'font-sans',
          textVariants[variant],
          champagne ? 'text-speakeasy-champagne' : 'text-current',
          className
        )}
        {...props}
      >
        {children}
      </p>
    );
  }
);

Text.displayName = 'Text';