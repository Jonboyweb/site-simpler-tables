'use client';

import { forwardRef } from 'react';
import { cn } from '@/lib/utils';
import type { InputProps } from '@/types/components';

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, hint, icon, artDeco = false, id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-sm font-playfair text-speakeasy-gold mb-1.5"
          >
            {label}
            {props.required && <span className="text-speakeasy-copper ml-1">*</span>}
          </label>
        )}
        <div className="relative">
          {icon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-speakeasy-gold/60">
              {icon}
            </div>
          )}
          <input
            ref={ref}
            id={inputId}
            className={cn(
              'w-full px-4 py-2.5 rounded-sm',
              'bg-speakeasy-noir/50 backdrop-blur-sm',
              'border border-speakeasy-gold/30',
              'text-speakeasy-champagne placeholder-speakeasy-champagne/40',
              'focus:outline-none focus:border-speakeasy-gold focus:ring-1 focus:ring-speakeasy-gold',
              'transition-all duration-200',
              'disabled:opacity-50 disabled:cursor-not-allowed',
              icon && 'pl-10',
              error && 'border-red-500 focus:border-red-500 focus:ring-red-500',
              artDeco && 'art-deco-border',
              className
            )}
            aria-invalid={!!error}
            aria-describedby={error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined}
            {...props}
          />
        </div>
        {error && (
          <p id={`${inputId}-error`} className="mt-1.5 text-sm text-red-400" role="alert">
            {error}
          </p>
        )}
        {hint && !error && (
          <p id={`${inputId}-hint`} className="mt-1.5 text-sm text-speakeasy-champagne/60">
            {hint}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';