'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { Heading, Text, LoadingSpinner, Button } from '@/components/atoms';
import { Card } from '@/components/molecules';
import { createClient } from '@/lib/supabase/client';
import { AdminRole } from '@/types/authentication.types';

// Manager-specific components
import { ManagerDashboard } from '@/components/organisms/ManagerDashboard/Dashboard';
import { SuperAdminDashboard } from '@/components/organisms/SuperAdminDashboard';

interface DashboardStats {
  total_bookings_today: number;
  confirmed_today: number;
  pending_today: number;
  arrived_today: number;
  no_show_today: number;
  total_guests_today: number;
  tables_occupied_today: number;
  current_waitlist_count: number;
  pending_notifications: number;
}

interface RecentBooking {
  id: string;
  booking_ref: string;
  customer_name: string;
  party_size: number;
  arrival_time: string;
  status: string;
  table_ids: number[];
  created_at: string;
}

interface SystemAlert {
  id: string;
  type: 'error' | 'warning' | 'info';
  message: string;
  timestamp: string;
  action_required: boolean;
}

export default function AdminDashboardPage() {
  const { data: session, status } = useSession();

  // Show loading while session is being fetched
  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner size="lg" color="gold" />
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (status === 'unauthenticated' || !session?.user) {
    return (
      <div className="flex items-center justify-center py-12">
        <Card className="p-8 text-center">
          <Text className="text-speakeasy-champagne mb-4">Access denied. Please log in.</Text>
          <Button href="/admin/login" variant="primary">
            Go to Login
          </Button>
        </Card>
      </div>
    );
  }

  const userRole = session.user.role as AdminRole;

  // Route to appropriate dashboard based on role
  switch (userRole) {
    case AdminRole.SUPER_ADMIN:
      return <SuperAdminDashboard />;
    case AdminRole.MANAGER:
      return <ManagerDashboard />;
    case AdminRole.DOOR_STAFF:
      return <DoorStaffDashboard />;
    default:
      return (
        <div className="flex items-center justify-center py-12">
          <Card className="p-8 text-center">
            <Text className="text-speakeasy-champagne mb-4">
              Unknown user role: {userRole}
            </Text>
            <Button href="/admin/login" variant="secondary">
              Logout and Try Again
            </Button>
          </Card>
        </div>
      );
  }
}

// Simple Door Staff Dashboard (placeholder for now)
function DoorStaffDashboard() {
  const { data: session } = useSession();
  
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <Heading level={1} variant="bebas" className="text-speakeasy-gold mb-2">
            Check-In Dashboard
          </Heading>
          <Text className="text-speakeasy-champagne/70">
            Welcome back, {session?.user?.email?.split('@')[0]}
          </Text>
        </div>
      </div>

      <Card className="p-8 text-center">
        <Heading level={2} className="text-speakeasy-gold mb-4">
          Door Staff Features Coming Soon
        </Heading>
        <Text className="text-speakeasy-champagne/70 mb-6">
          Quick access to tonight&apos;s bookings and check-in functionality will be available here.
        </Text>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Button variant="outline" href="/admin/bookings">
            View Tonight&apos;s Bookings
          </Button>
          <Button variant="outline" href="/admin/check-in">
            Customer Check-In
          </Button>
        </div>
      </Card>
    </div>
  );
}