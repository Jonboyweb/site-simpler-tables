import type { Metadata } from 'next';
import { ReactNode } from 'react';

export const metadata: Metadata = {
  title: 'Book a Table | The Backroom Leeds',
  description: 'Reserve your table at The Backroom Leeds. Choose from 16 exclusive tables across two floors with premium drinks packages.',
  keywords: ['book table Leeds', 'The Backroom Leeds booking', 'speakeasy table reservation', 'Leeds nightclub booking'],
  openGraph: {
    title: 'Book a Table | The Backroom Leeds',
    description: 'Reserve your exclusive table at Leeds\' premier speakeasy',
    type: 'website',
  },
};

interface BookLayoutProps {
  children: ReactNode;
}

export default function BookLayout({ children }: BookLayoutProps) {
  return <>{children}</>;
}