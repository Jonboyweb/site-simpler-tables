'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { Heading, Text, Button } from '@/components/atoms';
import { Card } from '@/components/molecules';

// Dashboard components
import { TonightOverview } from './TonightOverview';
import { RecentActivity } from './RecentActivity';
import { QuickActions } from './QuickActions';
import { NotificationCenter } from './NotificationCenter';

// Manager feature components
import { ManagerBookingOverview } from '../BookingManagement/ManagerBookingOverview';
import { ManagerEventOverview } from '../EventManagement/ManagerEventOverview';
import { ManagerReportingSummary } from '../Reporting/ManagerReportingSummary';

export { ManagerDashboard };

function ManagerDashboard() {
  const { data: session } = useSession();
  const [activeView, setActiveView] = useState<'overview' | 'bookings' | 'events' | 'reports'>('overview');

  const viewOptions = [
    { key: 'overview', label: 'Tonight Overview', icon: '🌙' },
    { key: 'bookings', label: 'Booking Management', icon: '📅' },
    { key: 'events', label: 'Event Management', icon: '🎉' },
    { key: 'reports', label: 'Reports & Analytics', icon: '📊' }
  ] as const;

  const renderActiveView = () => {
    switch (activeView) {
      case 'bookings':
        return <ManagerBookingOverview />;
      case 'events':
        return <ManagerEventOverview />;
      case 'reports':
        return <ManagerReportingSummary />;
      default:
        return (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - Main Overview */}
            <div className="lg:col-span-2 space-y-6">
              <TonightOverview />
              <RecentActivity />
            </div>

            {/* Right Column - Actions & Notifications */}
            <div className="space-y-6">
              <QuickActions />
              <NotificationCenter />
            </div>
          </div>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <Heading level={1} variant="bebas" className="text-speakeasy-gold mb-2">
            Manager Dashboard
          </Heading>
          <Text className="text-speakeasy-champagne/70">
            Welcome back, {session?.user?.email?.split('@')[0]} • Venue Operations Central
          </Text>
        </div>
        
        <div className="flex items-center gap-2">
          <Text variant="caption" className="text-speakeasy-copper">
            The Backroom Leeds
          </Text>
          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" title="System Online" />
        </div>
      </div>

      {/* View Navigation */}
      <Card className="p-1">
        <div className="flex flex-wrap gap-1">
          {viewOptions.map((option) => (
            <Button
              key={option.key}
              variant={activeView === option.key ? 'primary' : 'ghost'}
              size="sm"
              onClick={() => setActiveView(option.key)}
              className="flex items-center gap-2"
            >
              <span>{option.icon}</span>
              <span className="hidden sm:inline">{option.label}</span>
            </Button>
          ))}
        </div>
      </Card>

      {/* Active View Content */}
      <div className="min-h-[600px]">
        {renderActiveView()}
      </div>

      {/* Manager Status Bar */}
      <Card className="p-4 bg-gradient-to-r from-speakeasy-burgundy/10 to-speakeasy-noir/10">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-6">
            <div>
              <Text variant="caption" className="text-speakeasy-copper">Role</Text>
              <Text className="text-speakeasy-champagne font-bebas">MANAGER</Text>
            </div>
            <div>
              <Text variant="caption" className="text-speakeasy-copper">Access Level</Text>
              <Text className="text-speakeasy-gold">Full Venue Operations</Text>
            </div>
            <div>
              <Text variant="caption" className="text-speakeasy-copper">Session</Text>
              <Text className="text-green-400">Active</Text>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" href="/admin/help">
              Help
            </Button>
            <Button variant="ghost" size="sm" href="/admin/feedback">
              Feedback
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}