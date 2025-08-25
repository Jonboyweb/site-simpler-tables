'use client';

import { forwardRef, SelectHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';
import { ChevronDownIcon } from '@/components/atoms';

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  hint?: string;
  options: Array<{ value: string; label: string }>;
  artDeco?: boolean;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, error, hint, options, artDeco = false, id, ...props }, ref) => {
    const selectId = id || label?.toLowerCase().replace(/\s+/g, '-');

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={selectId}
            className="block text-sm font-playfair text-speakeasy-gold mb-1.5"
          >
            {label}
            {props.required && <span className="text-speakeasy-copper ml-1">*</span>}
          </label>
        )}
        <div className="relative">
          <select
            ref={ref}
            id={selectId}
            className={cn(
              'w-full px-4 py-2.5 pr-10 rounded-sm appearance-none',
              'bg-speakeasy-noir/50 backdrop-blur-sm',
              'border border-speakeasy-gold/30',
              'text-speakeasy-champagne',
              'focus:outline-none focus:border-speakeasy-gold focus:ring-1 focus:ring-speakeasy-gold',
              'transition-all duration-200',
              'disabled:opacity-50 disabled:cursor-not-allowed',
              error && 'border-red-500 focus:border-red-500 focus:ring-red-500',
              artDeco && 'art-deco-border',
              className
            )}
            aria-invalid={!!error}
            aria-describedby={error ? `${selectId}-error` : hint ? `${selectId}-hint` : undefined}
            {...props}
          >
            <option value="" className="bg-speakeasy-noir">
              Select an option
            </option>
            {options.map((option) => (
              <option key={option.value} value={option.value} className="bg-speakeasy-noir">
                {option.label}
              </option>
            ))}
          </select>
          <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-speakeasy-gold/60">
            <ChevronDownIcon size="sm" />
          </div>
        </div>
        {error && (
          <p id={`${selectId}-error`} className="mt-1.5 text-sm text-red-400" role="alert">
            {error}
          </p>
        )}
        {hint && !error && (
          <p id={`${selectId}-hint`} className="mt-1.5 text-sm text-speakeasy-champagne/60">
            {hint}
          </p>
        )}
      </div>
    );
  }
);

Select.displayName = 'Select';