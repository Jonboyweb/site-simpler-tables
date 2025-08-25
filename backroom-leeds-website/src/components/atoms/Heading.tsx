'use client';

import { createElement } from 'react';
import { cn } from '@/lib/utils';
import type { HeadingProps } from '@/types/components';

const headingVariants = {
  bebas: 'font-bebas tracking-wider uppercase',
  playfair: 'font-playfair',
  'great-vibes': 'font-great-vibes italic',
};

const headingSizes = {
  1: 'text-5xl md:text-6xl lg:text-7xl',
  2: 'text-4xl md:text-5xl lg:text-6xl',
  3: 'text-3xl md:text-4xl lg:text-5xl',
  4: 'text-2xl md:text-3xl lg:text-4xl',
  5: 'text-xl md:text-2xl lg:text-3xl',
  6: 'text-lg md:text-xl lg:text-2xl',
};

export const Heading = ({
  level,
  variant = 'bebas',
  gold = true,
  shadow = false,
  className,
  children,
  ...props
}: HeadingProps) => {
  const Tag = `h${level}` as const;

  return createElement(
    Tag,
    {
      className: cn(
        'font-bold leading-tight',
        headingVariants[variant],
        headingSizes[level],
        gold && 'text-speakeasy-gold',
        shadow && 'text-shadow-lg',
        className
      ),
      ...props,
    },
    children
  );
};