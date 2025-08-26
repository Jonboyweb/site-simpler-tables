'use client';

import { useState, useEffect } from 'react';
import { TonightBookings } from './TonightBookings';
import { CheckInSystem } from './CheckInSystem';
import { DashboardOverview } from './Dashboard';
import { Heading, Button } from '@/components/atoms';

export type DashboardTab = 'overview' | 'tonight' | 'checkin';

export const DoorStaffDashboard = () => {
  const [activeTab, setActiveTab] = useState<DashboardTab>('overview');
  const [lastUpdated, setLastUpdated] = useState<string>(new Date().toISOString());

  // Refresh data every 30 seconds for real-time updates
  useEffect(() => {
    const interval = setInterval(() => {
      setLastUpdated(new Date().toISOString());
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, []);

  const tabs = [
    { id: 'overview' as const, label: 'Overview', icon: '📊' },
    { id: 'tonight' as const, label: 'Tonight\'s Bookings', icon: '📅' },
    { id: 'checkin' as const, label: 'Check-In', icon: '✅' }
  ];

  const handleRefresh = () => {
    setLastUpdated(new Date().toISOString());
  };

  return (
    <div className="min-h-screen bg-speakeasy-noir">
      {/* Header */}
      <div className="bg-speakeasy-noir/95 backdrop-blur-sm border-b border-speakeasy-gold/20 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <Heading level={2} variant="bebas" className="text-speakeasy-gold">
                Door Staff Check-In System
              </Heading>
              <p className="text-speakeasy-champagne/80 text-sm">
                Real-time guest arrival management
              </p>
            </div>
            
            <div className="flex items-center gap-3">
              <span className="text-speakeasy-champagne/60 text-xs">
                Last updated: {new Date(lastUpdated).toLocaleTimeString()}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleRefresh}
                className="text-speakeasy-gold hover:bg-speakeasy-gold/10"
              >
                🔄 Refresh
              </Button>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="flex space-x-1 mt-4">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  flex items-center gap-2 px-4 py-2 rounded-t-sm transition-all duration-200
                  ${activeTab === tab.id
                    ? 'bg-speakeasy-gold/20 text-speakeasy-gold border-b-2 border-speakeasy-gold'
                    : 'bg-speakeasy-noir/50 text-speakeasy-champagne hover:bg-speakeasy-gold/10'
                  }
                `}
              >
                <span className="text-lg">{tab.icon}</span>
                <span className="font-bebas tracking-wider text-sm uppercase">
                  {tab.label}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        {activeTab === 'overview' && (
          <DashboardOverview lastUpdated={lastUpdated} />
        )}
        
        {activeTab === 'tonight' && (
          <TonightBookings lastUpdated={lastUpdated} />
        )}
        
        {activeTab === 'checkin' && (
          <CheckInSystem onCheckInComplete={handleRefresh} />
        )}
      </div>
    </div>
  );
};