'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { DoorStaffDashboard } from '@/components/organisms';

export default function CheckInPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === 'loading') return;

    if (!session) {
      router.push('/admin/login');
      return;
    }

    if (session.user?.role !== 'door_staff') {
      router.push('/admin/dashboard');
      return;
    }

    setLoading(false);
  }, [session, status, router]);

  if (loading || status === 'loading') {
    return (
      <div className="min-h-screen bg-speakeasy-noir flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-8 h-8 border-4 border-speakeasy-gold border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-speakeasy-champagne font-bebas tracking-wider">
            Loading Check-in System...
          </p>
        </div>
      </div>
    );
  }

  if (!session || session.user?.role !== 'door_staff') {
    return null;
  }

  return <DoorStaffDashboard />;
}