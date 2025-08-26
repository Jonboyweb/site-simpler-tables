'use client';

import { Card } from '@/components/molecules';
import { Heading, Text } from '@/components/atoms';

interface DashboardStats {
  totalExpected: number;
  arrived: number;
  pending: number;
  late: number;
  totalGuests: number;
  arrivedGuests: number;
}

interface ArrivalTrackingProps {
  stats: DashboardStats;
}

export const ArrivalTracking = ({ stats }: ArrivalTrackingProps) => {
  const currentHour = new Date().getHours();
  const isEveningRush = currentHour >= 21 && currentHour <= 23;
  const isLateNight = currentHour >= 0 && currentHour <= 2;

  const getShiftStatus = () => {
    if (isEveningRush) {
      return { status: 'Peak Hours', color: 'text-red-400', icon: '🔥' };
    } else if (isLateNight) {
      return { status: 'Late Night', color: 'text-purple-400', icon: '🌙' };
    } else if (currentHour >= 18) {
      return { status: 'Evening Service', color: 'text-speakeasy-gold', icon: '🍸' };
    } else {
      return { status: 'Pre-Service', color: 'text-blue-400', icon: '🕒' };
    }
  };

  const shift = getShiftStatus();

  return (
    <Card className="p-6">
      <Heading level={3} variant="bebas" className="text-speakeasy-gold mb-4">
        Arrival Flow Tracking
      </Heading>
      
      <div className="space-y-4">
        {/* Current Shift Status */}
        <div className="flex items-center justify-between p-3 bg-speakeasy-noir/30 rounded-sm border border-speakeasy-gold/10">
          <div className="flex items-center gap-2">
            <span className="text-2xl">{shift.icon}</span>
            <div>
              <Text className={shift.color} variant="body">
                {shift.status}
              </Text>
              <Text variant="caption" className="text-speakeasy-champagne/60">
                {new Date().toLocaleTimeString()} 
              </Text>
            </div>
          </div>
        </div>

        {/* Arrival Progress */}
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <Text className="text-speakeasy-champagne">Booking Completion:</Text>
            <Text className="text-speakeasy-gold font-bebas">
              {stats.totalExpected > 0 ? Math.round((stats.arrived / stats.totalExpected) * 100) : 0}%
            </Text>
          </div>
          
          <div className="bg-speakeasy-noir/50 rounded-full h-2 overflow-hidden">
            <div 
              className="bg-speakeasy-gold h-full transition-all duration-500"
              style={{ 
                width: `${stats.totalExpected > 0 ? (stats.arrived / stats.totalExpected) * 100 : 0}%` 
              }}
            />
          </div>
        </div>

        {/* Quick Actions */}
        <div className="pt-4 border-t border-speakeasy-gold/10">
          <Text variant="caption" className="text-speakeasy-champagne/70 uppercase tracking-wider mb-2">
            Quick Status Checks
          </Text>
          
          <div className="grid grid-cols-2 gap-2">
            <div className="text-center p-2 bg-green-900/20 rounded border border-green-400/20">
              <div className="text-green-400 font-bebas text-lg">{stats.arrived}</div>
              <div className="text-green-200 text-xs">Checked In</div>
            </div>
            
            <div className="text-center p-2 bg-blue-900/20 rounded border border-blue-400/20">
              <div className="text-blue-400 font-bebas text-lg">{stats.pending}</div>
              <div className="text-blue-200 text-xs">Still Expected</div>
            </div>
          </div>

          {stats.late > 0 && (
            <div className="mt-2 p-2 bg-red-900/20 rounded border border-red-400/20 text-center">
              <div className="text-red-400 font-bebas text-lg">{stats.late}</div>
              <div className="text-red-200 text-xs">Running Late</div>
            </div>
          )}
        </div>

        {/* Performance Indicator */}
        <div className="pt-4 border-t border-speakeasy-gold/10">
          <Text variant="caption" className="text-speakeasy-champagne/70 uppercase tracking-wider mb-2">
            Performance Status
          </Text>
          
          {(() => {
            const arrivalRate = stats.totalExpected > 0 ? (stats.arrived / stats.totalExpected) * 100 : 0;
            
            if (arrivalRate >= 80) {
              return (
                <div className="flex items-center gap-2 p-2 bg-green-900/20 rounded border border-green-400/20">
                  <span className="text-green-400">🎯</span>
                  <Text className="text-green-200 text-sm">Excellent arrival rate</Text>
                </div>
              );
            } else if (arrivalRate >= 60) {
              return (
                <div className="flex items-center gap-2 p-2 bg-yellow-900/20 rounded border border-yellow-400/20">
                  <span className="text-yellow-400">📈</span>
                  <Text className="text-yellow-200 text-sm">Good arrival progress</Text>
                </div>
              );
            } else if (stats.totalExpected > 0) {
              return (
                <div className="flex items-center gap-2 p-2 bg-orange-900/20 rounded border border-orange-400/20">
                  <span className="text-orange-400">⏰</span>
                  <Text className="text-orange-200 text-sm">Monitoring arrivals</Text>
                </div>
              );
            } else {
              return (
                <div className="flex items-center gap-2 p-2 bg-speakeasy-noir/30 rounded border border-speakeasy-gold/10">
                  <span className="text-speakeasy-gold">📋</span>
                  <Text className="text-speakeasy-champagne text-sm">No bookings tonight</Text>
                </div>
              );
            }
          })()}
        </div>
      </div>
    </Card>
  );
};