// Component type definitions for The Backroom Leeds
// Following atomic design principles with prohibition-themed styling

import { ButtonHTMLAttributes, InputHTMLAttributes, HTMLAttributes, ReactNode } from 'react';

// Base variant types for theming
export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'gold' | 'copper';
export type ButtonSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

// Atom component props
export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  icon?: ReactNode;
  iconPosition?: 'left' | 'right';
  fullWidth?: boolean;
  artDeco?: boolean;
  href?: string;
}

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  icon?: ReactNode;
  artDeco?: boolean;
}

export interface HeadingProps extends HTMLAttributes<HTMLHeadingElement> {
  level: 1 | 2 | 3 | 4 | 5 | 6;
  variant?: 'bebas' | 'playfair' | 'great-vibes';
  gold?: boolean;
  shadow?: boolean;
}

export interface TextProps extends HTMLAttributes<HTMLParagraphElement> {
  variant?: 'body' | 'caption' | 'small';
  champagne?: boolean;
}

// Molecule component props
export interface FormFieldProps {
  name: string;
  label: string;
  type?: string;
  placeholder?: string;
  required?: boolean;
  error?: string;
  hint?: string;
  value?: string | number;
  onChange?: (value: string) => void;
  artDeco?: boolean;
}

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'elevated' | 'bordered' | 'vintage';
  hover?: boolean;
  grain?: boolean;
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

export interface NavigationItemProps {
  href: string;
  label: string;
  active?: boolean;
  icon?: ReactNode;
  onClick?: () => void;
}

// Organism component props
export interface NavigationHeaderProps {
  transparent?: boolean;
  fixed?: boolean;
  hideOnScroll?: boolean;
}

// Event related types based on database schema
export interface Event {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  day_of_week: number;
  start_time: string;
  end_time: string;
  dj_lineup: string[] | null;
  music_genres: string[] | null;
  image_url: string | null;
  ticket_url: string | null;
  is_active: boolean | null;
  is_recurring: boolean | null;
  created_at: string | null;
  updated_at: string | null;
}

// Event instance type for specific dates
export interface EventInstance {
  id: string;
  event: Event;
  date: Date;
  soldOut?: boolean;
}

export interface EventCardProps {
  id: string;
  title: string;
  date: Date;
  image?: string;
  description?: string;
  artists?: string[];
  ticketLink?: string;
  soldOut?: boolean;
}

export interface TableBookingFormProps {
  availableTables?: number[];
  onSubmit?: (data: BookingFormData) => void;
  step?: number;
  eventId?: string;
}

export interface BookingFormData {
  date: string;
  time: string;
  tableNumber?: number;
  partySize: number;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  specialRequests?: string;
  drinkPackage?: string;
}

// Template component props
export interface MainLayoutProps {
  children: ReactNode;
  showHeader?: boolean;
  showFooter?: boolean;
  transparentHeader?: boolean;
}

export interface AdminLayoutProps {
  children: ReactNode;
  sidebarOpen?: boolean;
  userRole?: 'super_admin' | 'manager' | 'door_staff';
}

export interface BookingLayoutProps {
  children: ReactNode;
  currentStep: number;
  totalSteps: number;
  onBack?: () => void;
  onNext?: () => void;
}

// Utility types
export interface IconProps extends HTMLAttributes<SVGElement> {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  color?: string;
}

export interface LoadingSpinnerProps extends HTMLAttributes<HTMLDivElement> {
  size?: 'sm' | 'md' | 'lg';
  color?: 'gold' | 'copper' | 'champagne';
}

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info';
  size?: 'sm' | 'md';
}