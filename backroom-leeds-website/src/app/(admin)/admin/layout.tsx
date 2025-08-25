import type { Metadata } from 'next';
import { AdminLayout } from '@/components/templates';

export const metadata: Metadata = {
  title: 'Admin Dashboard | The Backroom Leeds',
  description: 'Administrative dashboard for The Backroom Leeds venue management',
  robots: {
    index: false,
    follow: false,
  },
};

export default function AdminRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AdminLayout>{children}</AdminLayout>;
}