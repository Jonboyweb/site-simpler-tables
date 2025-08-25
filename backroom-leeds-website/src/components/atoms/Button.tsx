'use client';

import { forwardRef } from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import type { ButtonProps } from '@/types/components';
import { LoadingSpinner } from './LoadingSpinner';

const buttonVariants = {
  primary: 'bg-speakeasy-gold text-speakeasy-noir hover:bg-speakeasy-copper shadow-lg',
  secondary: 'bg-speakeasy-burgundy text-speakeasy-champagne hover:bg-opacity-80',
  ghost: 'bg-transparent text-speakeasy-gold hover:bg-speakeasy-gold/10 border border-speakeasy-gold',
  danger: 'bg-red-700 text-white hover:bg-red-800',
  gold: 'bg-gradient-to-r from-speakeasy-gold to-speakeasy-copper text-speakeasy-noir hover:from-speakeasy-copper hover:to-speakeasy-gold',
  copper: 'bg-speakeasy-copper text-speakeasy-champagne hover:bg-opacity-90',
};

const buttonSizes = {
  xs: 'px-2 py-1 text-xs',
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2 text-base',
  lg: 'px-6 py-3 text-lg',
  xl: 'px-8 py-4 text-xl',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = 'primary',
      size = 'md',
      loading = false,
      disabled = false,
      icon,
      iconPosition = 'left',
      fullWidth = false,
      artDeco = false,
      href,
      children,
      ...props
    },
    ref
  ) => {
    const baseClasses = cn(
      'inline-flex items-center justify-center gap-2',
      'font-bebas tracking-wider uppercase',
      'rounded-sm transition-all duration-300',
      'focus:outline-none focus:ring-2 focus:ring-speakeasy-gold focus:ring-offset-2 focus:ring-offset-speakeasy-noir',
      'disabled:opacity-50 disabled:cursor-not-allowed',
      buttonVariants[variant],
      buttonSizes[size],
      fullWidth && 'w-full',
      artDeco && 'art-deco-border',
      !disabled && !loading && 'vintage-hover',
      className
    );

    const content = loading ? (
      <>
        <LoadingSpinner size="sm" color={variant === 'primary' ? 'gold' : 'champagne'} />
        <span>Loading...</span>
      </>
    ) : (
      <>
        {icon && iconPosition === 'left' && icon}
        {children}
        {icon && iconPosition === 'right' && icon}
      </>
    );

    if (href) {
      return (
        <Link href={href} className={baseClasses}>
          {content}
        </Link>
      );
    }

    return (
      <button
        ref={ref}
        className={baseClasses}
        disabled={disabled || loading}
        {...props}
      >
        {content}
      </button>
    );
  }
);

Button.displayName = 'Button';