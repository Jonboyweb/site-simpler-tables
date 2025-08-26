import type { Metadata } from 'next';
import { ReactNode } from 'react';

export const metadata: Metadata = {
  title: 'Booking Confirmed | The Backroom Leeds',
  description: 'Your table booking has been confirmed at The Backroom Leeds. Check your booking details and prepare for an unforgettable night.',
  keywords: ['booking confirmed', 'The Backroom Leeds', 'table reservation confirmed', 'Leeds speakeasy'],
  openGraph: {
    title: 'Booking Confirmed | The Backroom Leeds',
    description: 'Your reservation is confirmed at Leeds\' premier speakeasy',
    type: 'website',
  },
  robots: {
    index: false, // Don't index confirmation pages
    follow: true,
  },
};

interface ConfirmationLayoutProps {
  children: ReactNode;
}

export default function ConfirmationLayout({ children }: ConfirmationLayoutProps) {
  return <>{children}</>;
}