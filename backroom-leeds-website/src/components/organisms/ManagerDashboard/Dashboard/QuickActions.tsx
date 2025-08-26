'use client';

import { useState } from 'react';
import { Button, Heading, Text } from '@/components/atoms';
import { Card, Modal } from '@/components/molecules';

export function QuickActions() {
  const [showCreateBookingModal, setShowCreateBookingModal] = useState(false);

  const quickActionItems = [
    {
      id: 'create-booking',
      icon: '➕',
      title: 'Quick Booking',
      description: 'Walk-in or phone booking',
      action: () => setShowCreateBookingModal(true),
      variant: 'primary' as const
    },
    {
      id: 'floor-plan',
      icon: '🗺️',
      title: 'Floor Plan',
      description: 'Live table status',
      href: '/admin/floor-plan',
      variant: 'outline' as const
    },
    {
      id: 'waitlist',
      icon: '📝',
      title: 'Waitlist',
      description: 'Manage waiting customers',
      href: '/admin/bookings?view=waitlist',
      variant: 'outline' as const
    },
    {
      id: 'reports',
      icon: '📊',
      title: 'Reports',
      description: 'Tonight\'s analytics',
      href: '/admin/reports/tonight',
      variant: 'outline' as const
    },
    {
      id: 'events',
      icon: '🎉',
      title: 'Events',
      description: 'Manage events',
      href: '/admin/events',
      variant: 'outline' as const
    },
    {
      id: 'staff-check',
      icon: '👥',
      title: 'Staff Status',
      description: 'Who\'s working tonight',
      href: '/admin/staff/tonight',
      variant: 'ghost' as const
    },
    {
      id: 'emergency',
      icon: '🚨',
      title: 'Emergency',
      description: 'Quick escalation',
      href: '/admin/emergency',
      variant: 'ghost' as const
    },
    {
      id: 'export',
      icon: '📤',
      title: 'Export Data',
      description: 'Tonight\'s bookings',
      href: '/admin/reports/export?type=tonight',
      variant: 'ghost' as const
    }
  ];

  return (
    <>
      <Card className="p-6">
        <Heading level={3} className="text-speakeasy-gold mb-4">
          Quick Actions
        </Heading>
        
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {quickActionItems.map((item) => (
            <div key={item.id}>
              {item.href ? (
                <Button
                  variant={item.variant}
                  href={item.href}
                  className="w-full h-auto p-4 flex-col space-y-2 text-center hover:scale-105 transition-transform"
                >
                  <div className="text-2xl">{item.icon}</div>
                  <div>
                    <Text className="font-bebas text-sm tracking-wider">
                      {item.title}
                    </Text>
                    <Text variant="caption" className="text-speakeasy-champagne/60 mt-1">
                      {item.description}
                    </Text>
                  </div>
                </Button>
              ) : (
                <Button
                  variant={item.variant}
                  onClick={item.action}
                  className="w-full h-auto p-4 flex-col space-y-2 text-center hover:scale-105 transition-transform"
                >
                  <div className="text-2xl">{item.icon}</div>
                  <div>
                    <Text className="font-bebas text-sm tracking-wider">
                      {item.title}
                    </Text>
                    <Text variant="caption" className="text-speakeasy-champagne/60 mt-1">
                      {item.description}
                    </Text>
                  </div>
                </Button>
              )}
            </div>
          ))}
        </div>

        {/* Manager-specific features */}
        <div className="mt-6 pt-6 border-t border-speakeasy-gold/20">
          <Text variant="caption" className="text-speakeasy-copper uppercase tracking-wide mb-3">
            Manager Tools
          </Text>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Button variant="ghost" href="/admin/artists" className="justify-start">
              <span className="mr-2">🎵</span>
              DJ/Artist Management
            </Button>
            <Button variant="ghost" href="/admin/revenue" className="justify-start">
              <span className="mr-2">💰</span>
              Revenue Analytics
            </Button>
            <Button variant="ghost" href="/admin/customer-insights" className="justify-start">
              <span className="mr-2">📈</span>
              Customer Insights
            </Button>
            <Button variant="ghost" href="/admin/settings/venue" className="justify-start">
              <span className="mr-2">⚙️</span>
              Venue Settings
            </Button>
          </div>
        </div>
      </Card>

      {/* Quick Booking Modal */}
      <Modal
        isOpen={showCreateBookingModal}
        onClose={() => setShowCreateBookingModal(false)}
        title="Create Quick Booking"
      >
        <div className="space-y-4">
          <Text className="text-speakeasy-champagne/70">
            Choose how to create this booking:
          </Text>
          
          <div className="grid grid-cols-1 gap-3">
            <Button 
              variant="primary" 
              href="/admin/bookings/create?type=walkin"
              className="p-4 justify-start"
            >
              <span className="mr-3 text-xl">🚶</span>
              <div className="text-left">
                <Text className="font-medium">Walk-in Customer</Text>
                <Text variant="caption" className="text-speakeasy-champagne/60">
                  Customer is here now
                </Text>
              </div>
            </Button>
            
            <Button 
              variant="outline" 
              href="/admin/bookings/create?type=phone"
              className="p-4 justify-start"
            >
              <span className="mr-3 text-xl">📞</span>
              <div className="text-left">
                <Text className="font-medium">Phone Booking</Text>
                <Text variant="caption" className="text-speakeasy-champagne/60">
                  Customer called to book
                </Text>
              </div>
            </Button>
            
            <Button 
              variant="ghost" 
              href="/admin/bookings/create"
              className="p-4 justify-start"
            >
              <span className="mr-3 text-xl">📝</span>
              <div className="text-left">
                <Text className="font-medium">Full Booking Form</Text>
                <Text variant="caption" className="text-speakeasy-champagne/60">
                  Complete booking details
                </Text>
              </div>
            </Button>
          </div>

          <div className="pt-4 border-t border-speakeasy-gold/20">
            <Button 
              variant="ghost" 
              onClick={() => setShowCreateBookingModal(false)}
              className="w-full"
            >
              Cancel
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}