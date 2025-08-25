import type { Metadata } from 'next';
import { Heading, Text, Button } from '@/components/atoms';

export const metadata: Metadata = {
  title: 'Dashboard | The Backroom Leeds Admin',
  description: 'Main dashboard for venue management and bookings overview',
  robots: {
    index: false,
    follow: false,
  },
};

export default function AdminDashboardPage() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <Heading level={1} className="text-4xl font-bebas text-speakeasy-gold mb-2">
            Dashboard
          </Heading>
          <Text className="text-speakeasy-champagne/80">
            Overview of today's operations and venue status
          </Text>
        </div>
        <div className="flex gap-3">
          <Button href="/admin/bookings" variant="primary">
            View Bookings
          </Button>
          <Button href="/admin/events" variant="secondary">
            Manage Events
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-speakeasy-burgundy/20 rounded-lg p-6 border border-speakeasy-gold/20">
          <div className="flex items-center justify-between">
            <div>
              <Text className="text-speakeasy-champagne/70 text-sm font-medium">Today's Bookings</Text>
              <Heading level={3} className="text-2xl font-bebas text-speakeasy-gold">24</Heading>
            </div>
            <div className="w-10 h-10 bg-speakeasy-gold/20 rounded-full flex items-center justify-center">
              <svg className="w-5 h-5 text-speakeasy-gold" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-speakeasy-burgundy/20 rounded-lg p-6 border border-speakeasy-gold/20">
          <div className="flex items-center justify-between">
            <div>
              <Text className="text-speakeasy-champagne/70 text-sm font-medium">Tables Occupied</Text>
              <Heading level={3} className="text-2xl font-bebas text-speakeasy-gold">12/16</Heading>
            </div>
            <div className="w-10 h-10 bg-speakeasy-copper/20 rounded-full flex items-center justify-center">
              <svg className="w-5 h-5 text-speakeasy-copper" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-speakeasy-burgundy/20 rounded-lg p-6 border border-speakeasy-gold/20">
          <div className="flex items-center justify-between">
            <div>
              <Text className="text-speakeasy-champagne/70 text-sm font-medium">Revenue Today</Text>
              <Heading level={3} className="text-2xl font-bebas text-speakeasy-gold">£1,200</Heading>
            </div>
            <div className="w-10 h-10 bg-speakeasy-champagne/20 rounded-full flex items-center justify-center">
              <svg className="w-5 h-5 text-speakeasy-champagne" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-speakeasy-burgundy/20 rounded-lg p-6 border border-speakeasy-gold/20">
          <div className="flex items-center justify-between">
            <div>
              <Text className="text-speakeasy-champagne/70 text-sm font-medium">Checked In</Text>
              <Heading level={3} className="text-2xl font-bebas text-speakeasy-gold">18/24</Heading>
            </div>
            <div className="w-10 h-10 bg-green-500/20 rounded-full flex items-center justify-center">
              <svg className="w-5 h-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Bookings */}
        <div className="bg-speakeasy-burgundy/20 rounded-lg border border-speakeasy-gold/20">
          <div className="p-6 border-b border-speakeasy-gold/20">
            <Heading level={2} className="text-xl font-bebas text-speakeasy-gold">Recent Bookings</Heading>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {/* Sample booking entries */}
              {[...Array(3)].map((_, i) => (
                <div key={i} className="flex items-center justify-between p-3 bg-speakeasy-noir/30 rounded border border-speakeasy-gold/10">
                  <div>
                    <Text className="text-speakeasy-champagne font-medium">Table {8 + i}</Text>
                    <Text className="text-speakeasy-champagne/70 text-sm">John Doe - Party of 4</Text>
                  </div>
                  <div className="text-right">
                    <Text className="text-speakeasy-gold text-sm">11:{30 + (i * 30)} PM</Text>
                    <span className="inline-block px-2 py-1 bg-green-500/20 text-green-400 text-xs rounded">
                      Confirmed
                    </span>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 pt-4 border-t border-speakeasy-gold/20">
              <Button href="/admin/bookings" variant="ghost" size="sm" className="w-full">
                View All Bookings
              </Button>
            </div>
          </div>
        </div>

        {/* Upcoming Events */}
        <div className="bg-speakeasy-burgundy/20 rounded-lg border border-speakeasy-gold/20">
          <div className="p-6 border-b border-speakeasy-gold/20">
            <Heading level={2} className="text-xl font-bebas text-speakeasy-gold">Upcoming Events</Heading>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {/* Sample event entries */}
              <div className="p-3 bg-speakeasy-noir/30 rounded border border-speakeasy-gold/10">
                <Text className="text-speakeasy-champagne font-medium">LA FIESTA</Text>
                <Text className="text-speakeasy-champagne/70 text-sm">Friday, 8:00 PM</Text>
                <Text className="text-speakeasy-gold text-sm">15 bookings confirmed</Text>
              </div>
              <div className="p-3 bg-speakeasy-noir/30 rounded border border-speakeasy-gold/10">
                <Text className="text-speakeasy-champagne font-medium">SHHH!</Text>
                <Text className="text-speakeasy-champagne/70 text-sm">Saturday, 9:00 PM</Text>
                <Text className="text-speakeasy-gold text-sm">12 bookings confirmed</Text>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-speakeasy-gold/20">
              <Button href="/admin/events" variant="ghost" size="sm" className="w-full">
                Manage Events
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Development Notice */}
      <div className="bg-speakeasy-burgundy/10 border border-speakeasy-gold/20 rounded-lg p-6">
        <div className="flex items-start gap-3">
          <div className="w-6 h-6 bg-speakeasy-gold/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
            <svg className="w-4 h-4 text-speakeasy-gold" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <Heading level={3} className="text-lg font-bebas text-speakeasy-gold mb-2">
              Development Status
            </Heading>
            <Text className="text-speakeasy-champagne/80 text-sm leading-relaxed">
              This admin dashboard is currently in development. Full functionality including real-time booking management, 
              event CRUD operations, and user management will be implemented in Phase 3. 
              Currently showing placeholder data for demonstration purposes.
            </Text>
          </div>
        </div>
      </div>
    </div>
  );
}