'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/molecules';
import { Heading, Text, Badge } from '@/components/atoms';

interface SpecialRequest {
  id: string;
  bookingRef: string;
  customerName: string;
  type: 'birthday' | 'anniversary' | 'dietary' | 'accessibility' | 'vip' | 'other';
  description: string;
  priority: 'high' | 'medium' | 'low';
  status: 'pending' | 'acknowledged' | 'completed';
  arrivalTime: string;
  tableNumbers: number[];
}

export const SpecialRequests = () => {
  const [requests, setRequests] = useState<SpecialRequest[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSpecialRequests = async () => {
    try {
      const response = await fetch('/api/door-staff/tonight-bookings');
      
      if (response.ok) {
        const data = await response.json();
        const specialRequests: SpecialRequest[] = [];
        
        // Process bookings to extract special requests
        data.bookings?.forEach((booking: any) => {
          if (booking.hasSpecialRequests || booking.isDrinksPackage) {
            const requests = booking.special_requests || {};
            const drinksPackage = booking.drinks_package || {};
            
            // Birthday celebrations
            if (requests.celebration_type === 'birthday') {
              specialRequests.push({
                id: `birthday-${booking.id}`,
                bookingRef: booking.booking_ref,
                customerName: booking.customer_name,
                type: 'birthday',
                description: `Birthday celebration${requests.guest_of_honor ? ` for ${requests.guest_of_honor}` : ''}`,
                priority: 'high',
                status: 'pending',
                arrivalTime: booking.arrival_time,
                tableNumbers: booking.tables?.map((t: any) => t.table_number) || []
              });
            }
            
            // Anniversary celebrations
            if (requests.celebration_type === 'anniversary') {
              specialRequests.push({
                id: `anniversary-${booking.id}`,
                bookingRef: booking.booking_ref,
                customerName: booking.customer_name,
                type: 'anniversary',
                description: `Anniversary celebration${requests.anniversary_years ? ` (${requests.anniversary_years} years)` : ''}`,
                priority: 'high',
                status: 'pending',
                arrivalTime: booking.arrival_time,
                tableNumbers: booking.tables?.map((t: any) => t.table_number) || []
              });
            }
            
            // Dietary requirements
            if (requests.dietary_requirements && requests.dietary_requirements.length > 0) {
              specialRequests.push({
                id: `dietary-${booking.id}`,
                bookingRef: booking.booking_ref,
                customerName: booking.customer_name,
                type: 'dietary',
                description: `Dietary requirements: ${requests.dietary_requirements.join(', ')}`,
                priority: 'medium',
                status: 'pending',
                arrivalTime: booking.arrival_time,
                tableNumbers: booking.tables?.map((t: any) => t.table_number) || []
              });
            }
            
            // Accessibility requirements
            if (requests.accessibility_needs) {
              specialRequests.push({
                id: `accessibility-${booking.id}`,
                bookingRef: booking.booking_ref,
                customerName: booking.customer_name,
                type: 'accessibility',
                description: requests.accessibility_needs,
                priority: 'high',
                status: 'pending',
                arrivalTime: booking.arrival_time,
                tableNumbers: booking.tables?.map((t: any) => t.table_number) || []
              });
            }
            
            // Premium drinks packages
            if (booking.isDrinksPackage && drinksPackage.level === 'premium') {
              specialRequests.push({
                id: `vip-${booking.id}`,
                bookingRef: booking.booking_ref,
                customerName: booking.customer_name,
                type: 'vip',
                description: `Premium package (${drinksPackage.name || 'VIP service'})`,
                priority: 'high',
                status: 'pending',
                arrivalTime: booking.arrival_time,
                tableNumbers: booking.tables?.map((t: any) => t.table_number) || []
              });
            }
            
            // Other special notes
            if (requests.special_notes) {
              specialRequests.push({
                id: `other-${booking.id}`,
                bookingRef: booking.booking_ref,
                customerName: booking.customer_name,
                type: 'other',
                description: requests.special_notes,
                priority: 'medium',
                status: 'pending',
                arrivalTime: booking.arrival_time,
                tableNumbers: booking.tables?.map((t: any) => t.table_number) || []
              });
            }
          }
        });
        
        // Sort by priority and arrival time
        const priorityOrder = { high: 3, medium: 2, low: 1 };
        setRequests(specialRequests.sort((a, b) => {
          const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
          if (priorityDiff !== 0) return priorityDiff;
          
          return a.arrivalTime.localeCompare(b.arrivalTime);
        }));
      }
    } catch (error) {
      console.error('Error fetching special requests:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSpecialRequests();
  }, []);

  const getRequestIcon = (type: SpecialRequest['type']) => {
    switch (type) {
      case 'birthday': return '🎂';
      case 'anniversary': return '💕';
      case 'dietary': return '🥗';
      case 'accessibility': return '♿';
      case 'vip': return '👑';
      default: return '📝';
    }
  };

  const getPriorityColor = (priority: SpecialRequest['priority']) => {
    switch (priority) {
      case 'high': return 'text-red-400';
      case 'medium': return 'text-yellow-400';
      case 'low': return 'text-green-400';
    }
  };

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <Heading level={3} variant="bebas" className="text-speakeasy-gold">
          Special Requests & VIP
        </Heading>
        {requests.length > 0 && (
          <Badge variant="secondary" className="bg-speakeasy-gold/20 text-speakeasy-gold">
            {requests.length} active
          </Badge>
        )}
      </div>

      {loading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="flex items-center gap-3 p-3 bg-speakeasy-noir/30 rounded-sm">
                <div className="w-8 h-8 bg-speakeasy-gold/20 rounded"></div>
                <div className="flex-1">
                  <div className="h-4 bg-speakeasy-gold/20 rounded mb-1"></div>
                  <div className="h-3 bg-speakeasy-gold/10 rounded w-3/4"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : requests.length > 0 ? (
        <div className="space-y-3 max-h-80 overflow-y-auto">
          {requests.map((request) => (
            <div
              key={request.id}
              className="p-3 bg-speakeasy-noir/30 rounded-sm border border-speakeasy-gold/10"
            >
              <div className="flex items-start gap-3">
                <span className="text-xl">{getRequestIcon(request.type)}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Text className="font-medium text-speakeasy-champagne">
                      {request.customerName}
                    </Text>
                    <Badge 
                      variant="outline" 
                      className={`text-xs ${getPriorityColor(request.priority)} border-current`}
                    >
                      {request.priority}
                    </Badge>
                  </div>
                  
                  <Text className="text-speakeasy-champagne/80 text-sm mb-2">
                    {request.description}
                  </Text>
                  
                  <div className="flex items-center gap-4 text-xs">
                    <Text variant="caption" className="text-speakeasy-copper">
                      Ref: {request.bookingRef}
                    </Text>
                    <Text variant="caption" className="text-speakeasy-copper">
                      {request.arrivalTime}
                    </Text>
                    {request.tableNumbers.length > 0 && (
                      <Text variant="caption" className="text-speakeasy-copper">
                        Table{request.tableNumbers.length > 1 ? 's' : ''}: {request.tableNumbers.join(', ')}
                      </Text>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8">
          <div className="text-4xl mb-2">✨</div>
          <Text className="text-speakeasy-champagne/60">
            No special requests tonight
          </Text>
          <Text variant="caption" className="text-speakeasy-copper">
            VIP services and special requirements will appear here
          </Text>
        </div>
      )}

      {/* Legend */}
      {requests.length > 0 && (
        <div className="mt-4 pt-4 border-t border-speakeasy-gold/10">
          <Text variant="caption" className="text-speakeasy-champagne/50 mb-2">
            Priority levels:
          </Text>
          <div className="flex gap-4 text-xs">
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-red-400 rounded-full"></div>
              <span className="text-speakeasy-champagne/60">High</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
              <span className="text-speakeasy-champagne/60">Medium</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-green-400 rounded-full"></div>
              <span className="text-speakeasy-champagne/60">Low</span>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
};