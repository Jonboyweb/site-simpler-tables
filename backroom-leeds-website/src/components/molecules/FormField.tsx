'use client';

import { Input } from '@/components/atoms';
import type { FormFieldProps } from '@/types/components';

export const FormField = ({
  name,
  label,
  type = 'text',
  placeholder,
  required = false,
  error,
  hint,
  value,
  onChange,
  artDeco = false,
}: FormFieldProps) => {
  return (
    <Input
      name={name}
      label={label}
      type={type}
      placeholder={placeholder}
      required={required}
      error={error}
      hint={hint}
      value={value}
      onChange={(e) => onChange?.(e.target.value)}
      artDeco={artDeco}
    />
  );
};