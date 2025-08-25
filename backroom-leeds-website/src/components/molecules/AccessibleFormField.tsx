'use client';

import { useId, forwardRef, ReactNode } from 'react';
import { FieldError } from 'react-hook-form';
import { cn } from '@/lib/utils';

interface AccessibleFormFieldProps {
  label: string;
  required?: boolean;
  instructions?: string;
  error?: FieldError;
  type?: 'text' | 'email' | 'tel' | 'number' | 'password' | 'textarea' | 'select';
  placeholder?: string;
  className?: string;
  children?: ReactNode;
}

export const AccessibleFormField = forwardRef<
  HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement,
  AccessibleFormFieldProps & React.InputHTMLAttributes<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
>(({
  label,
  required = false,
  instructions,
  error,
  type = 'text',
  placeholder,
  className = '',
  children,
  ...props
}, ref) => {
  const fieldId = useId();
  const instructionId = `${fieldId}-instructions`;
  const errorId = `${fieldId}-error`;
  const hasError = Boolean(error);

  // Build aria-describedby
  const describedBy = [
    instructions ? instructionId : '',
    hasError ? errorId : ''
  ].filter(Boolean).join(' ');

  const baseInputClasses = cn(
    'w-full px-4 py-3 border rounded-lg transition-colors duration-200',
    'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500',
    'disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed',
    {
      'border-red-300 bg-red-50 focus:ring-red-500': hasError,
      'border-gray-300 focus:border-blue-500': !hasError
    }
  );

  const renderInput = () => {
    if (children) {
      return children;
    }

    const inputProps = {
      ref: ref as any,
      id: fieldId,
      placeholder,
      'aria-describedby': describedBy || undefined,
      'aria-invalid': hasError,
      'aria-required': required,
      className: baseInputClasses,
      ...props
    };

    switch (type) {
      case 'textarea':
        return (
          <textarea
            {...inputProps}
            rows={4}
            className={cn(baseInputClasses, 'resize-vertical min-h-[100px]')}
          />
        );
      
      case 'select':
        return (
          <select
            {...inputProps}
            className={cn(baseInputClasses, 'cursor-pointer')}
          >
            {/* Options should be provided as children */}
          </select>
        );
      
      default:
        return (
          <input
            {...inputProps}
            type={type}
          />
        );
    }
  };

  return (
    <div className={cn('form-field space-y-2', className)}>
      <label htmlFor={fieldId} className="form-label block text-sm font-medium text-gray-700">
        {label}
        {required && (
          <span className="required-indicator ml-1 text-red-500" aria-label="required">
            <span aria-hidden="true">*</span>
          </span>
        )}
      </label>
      
      {instructions && (
        <div id={instructionId} className="form-instructions text-sm text-gray-600">
          {instructions}
        </div>
      )}
      
      {renderInput()}
      
      {hasError && (
        <div 
          id={errorId} 
          className="form-error text-sm text-red-600" 
          role="alert" 
          aria-live="polite"
        >
          <span className="flex items-start gap-1">
            <span className="text-red-500 mt-0.5 flex-shrink-0" aria-hidden="true">⚠</span>
            <span>{error.message}</span>
          </span>
        </div>
      )}
    </div>
  );
});

AccessibleFormField.displayName = 'AccessibleFormField';