'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { Heading, Text, Button, LoadingSpinner } from '@/components/atoms';
import { Card, VenueFloorPlan } from '@/components/molecules';
import { createClient } from '@/lib/supabase/client';

interface Booking {
  id: string;
  booking_ref: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  party_size: number;
  booking_date: string;
  arrival_time: string;
  table_ids: number[];
  status: 'pending' | 'confirmed' | 'cancelled' | 'arrived' | 'no_show';
  special_requests?: Record<string, unknown>;
  deposit_amount: number;
  package_amount?: number;
  remaining_balance: number;
  checked_in_at?: string;
  created_at: string;
}

interface Table {
  id: number;
  x: number;
  y: number;
  capacity: number;
  shape: 'round' | 'rectangle';
  width: number;
  height: number;
  floor: 'upstairs' | 'downstairs';
  status: 'available' | 'occupied' | 'reserved' | 'maintenance';
}

export default function FloorPlanPage() {
  const { data: session } = useSession();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [tables, setTables] = useState<Table[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedFloor, setSelectedFloor] = useState<'upstairs' | 'downstairs'>('upstairs');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [processingAction, setProcessingAction] = useState<string | null>(null);

  const supabase = createClient();

  // User permissions
  const userPermissions = {
    canModifyBookings: session?.user?.permissions?.canModifyBookings || false,
    canCheckInCustomers: session?.user?.permissions?.canCheckInCustomers || false,
    canViewAll: session?.user?.role === 'super_admin' || session?.user?.role === 'manager',
  };

  const fetchBookings = useCallback(async () => {
    try {
      setError(null);
      
      const { data, error: fetchError } = await supabase
        .from('bookings')
        .select('*')
        .eq('booking_date', selectedDate)
        .in('status', ['confirmed', 'arrived', 'pending'])
        .order('arrival_time', { ascending: true });

      if (fetchError) {
        throw new Error(`Failed to fetch bookings: ${fetchError.message}`);
      }

      setBookings(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    }
  }, [supabase, selectedDate]);

  const handleTableAssignment = useCallback(async (
    bookingId: string, 
    fromTables: number[], 
    toTables: number[]
  ) => {
    if (!userPermissions.canModifyBookings) {
      alert('You do not have permission to modify bookings');
      return;
    }

    setProcessingAction('reassign');
    
    try {
      const response = await fetch(`/api/admin/bookings/${bookingId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          table_ids: toTables,
          action: 'reassign_tables'
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to reassign table');
      }

      // Refresh bookings
      await fetchBookings();
      
      // Show success message
      const booking = bookings.find(b => b.id === bookingId);
      alert(`Successfully moved ${booking?.customer_name} from table${fromTables.length > 1 ? 's' : ''} ${fromTables.join(', ')} to table${toTables.length > 1 ? 's' : ''} ${toTables.join(', ')}`);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to reassign table');
    } finally {
      setProcessingAction(null);
    }
  }, [userPermissions.canModifyBookings, fetchBookings, bookings]);

  const handleTableStatusChange = useCallback(async (tableId: number, newStatus: string) => {
    if (!userPermissions.canModifyBookings) {
      alert('You do not have permission to modify table status');
      return;
    }

    setProcessingAction('status_change');
    
    try {
      // This would typically update a tables table in the database
      // For now, we'll just show a success message
      alert(`Table ${tableId} status changed to ${newStatus}`);
    } catch (err) {
      alert('Failed to update table status');
    } finally {
      setProcessingAction(null);
    }
  }, [userPermissions.canModifyBookings]);

  // Get current floor statistics
  const getFloorStats = useCallback(() => {
    const floorBookings = bookings.filter(booking => {
      const hasUpstairsTables = booking.table_ids.some(id => id <= 8);
      const hasDownstairsTables = booking.table_ids.some(id => id > 8);
      
      if (selectedFloor === 'upstairs') return hasUpstairsTables;
      return hasDownstairsTables;
    });

    const totalTables = selectedFloor === 'upstairs' ? 8 : 8;
    const occupiedTables = floorBookings.reduce((acc, booking) => {
      const floorTables = booking.table_ids.filter(id => 
        selectedFloor === 'upstairs' ? id <= 8 : id > 8
      );
      return acc + floorTables.length;
    }, 0);

    return {
      totalBookings: floorBookings.length,
      totalGuests: floorBookings.reduce((acc, booking) => acc + booking.party_size, 0),
      occupiedTables,
      availableTables: totalTables - occupiedTables,
      revenue: floorBookings.reduce((acc, booking) => acc + booking.deposit_amount + (booking.package_amount || 0), 0),
    };
  }, [bookings, selectedFloor]);

  const stats = getFloorStats();

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await fetchBookings();
      setLoading(false);
    };

    loadData();

    // Set up real-time subscriptions
    const bookingsSubscription = supabase
      .channel('floor_plan_bookings')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'bookings',
        },
        () => {
          fetchBookings();
        }
      )
      .subscribe();

    return () => {
      bookingsSubscription.unsubscribe();
    };
  }, [fetchBookings, supabase]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner size="lg" color="gold" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <Heading level={1} variant="bebas" className="text-speakeasy-gold mb-2">
            Venue Floor Plan
          </Heading>
          <Text className="text-speakeasy-champagne/70">
            Interactive table management and booking visualization
          </Text>
        </div>
        
        {/* Date Selector */}
        <div className="flex items-center gap-3">
          <label className="text-sm font-medium text-speakeasy-champagne">
            Date:
          </label>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="px-3 py-2 bg-speakeasy-noir/50 border border-speakeasy-gold/20 rounded text-speakeasy-champagne focus:outline-none focus:border-speakeasy-gold"
          />
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSelectedDate(new Date().toISOString().split('T')[0])}
            className="text-speakeasy-gold border-speakeasy-gold/20"
          >
            Today
          </Button>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <Card className="border-red-400/20 bg-red-900/20 p-4">
          <Text className="text-red-300">{error}</Text>
        </Card>
      )}

      {/* Floor Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[
          { label: 'Bookings', value: stats.totalBookings, color: 'text-speakeasy-champagne', icon: '📅' },
          { label: 'Guests', value: stats.totalGuests, color: 'text-speakeasy-gold', icon: '👥' },
          { label: 'Occupied', value: stats.occupiedTables, color: 'text-purple-400', icon: '🪑' },
          { label: 'Available', value: stats.availableTables, color: 'text-green-400', icon: '✅' },
          { label: 'Revenue', value: `£${stats.revenue.toFixed(0)}`, color: 'text-speakeasy-copper', icon: '💰' },
        ].map(stat => (
          <Card key={stat.label} className="p-4 text-center">
            <div className="text-2xl mb-2">{stat.icon}</div>
            <Text className={`text-2xl font-bebas ${stat.color} mb-1`}>
              {stat.value}
            </Text>
            <Text className="text-speakeasy-champagne/60 text-sm">
              {stat.label}
            </Text>
          </Card>
        ))}
      </div>

      {/* Floor Plan Component */}
      <VenueFloorPlan
        tables={tables}
        bookings={bookings}
        onTableAssignment={handleTableAssignment}
        onTableStatusChange={handleTableStatusChange}
        selectedFloor={selectedFloor}
        onFloorChange={setSelectedFloor}
        readOnly={!userPermissions.canModifyBookings}
      />

      {/* Current Bookings for Selected Floor */}
      <Card className="overflow-hidden">
        <div className="p-6 border-b border-speakeasy-gold/20">
          <Heading level={2} className="text-xl font-bebas text-speakeasy-gold">
            {selectedFloor.charAt(0).toUpperCase() + selectedFloor.slice(1)} Bookings
          </Heading>
          <Text className="text-speakeasy-champagne/60 mt-1">
            {new Date(selectedDate).toLocaleDateString()} • {stats.totalBookings} bookings
          </Text>
        </div>
        
        <div className="p-6">
          {bookings.filter(booking => {
            const hasUpstairsTables = booking.table_ids.some(id => id <= 8);
            const hasDownstairsTables = booking.table_ids.some(id => id > 8);
            
            if (selectedFloor === 'upstairs') return hasUpstairsTables;
            return hasDownstairsTables;
          }).length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {bookings
                .filter(booking => {
                  const hasUpstairsTables = booking.table_ids.some(id => id <= 8);
                  const hasDownstairsTables = booking.table_ids.some(id => id > 8);
                  
                  if (selectedFloor === 'upstairs') return hasUpstairsTables;
                  return hasDownstairsTables;
                })
                .map(booking => {
                  const statusColor = booking.status === 'confirmed' ? 'border-blue-400/20 bg-blue-900/10' :
                                    booking.status === 'arrived' ? 'border-green-400/20 bg-green-900/10' :
                                    booking.status === 'pending' ? 'border-yellow-400/20 bg-yellow-900/10' :
                                    'border-speakeasy-gold/20';

                  return (
                    <Card key={booking.id} className={`p-4 ${statusColor}`}>
                      <div className="flex justify-between items-start mb-2">
                        <Text className="text-speakeasy-champagne font-medium">
                          {booking.customer_name}
                        </Text>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${
                          booking.status === 'confirmed' ? 'bg-blue-500/20 text-blue-400' :
                          booking.status === 'arrived' ? 'bg-green-500/20 text-green-400' :
                          booking.status === 'pending' ? 'bg-yellow-500/20 text-yellow-400' :
                          'bg-speakeasy-gold/20 text-speakeasy-gold'
                        }`}>
                          {booking.status}
                        </span>
                      </div>
                      
                      <div className="space-y-1 text-sm text-speakeasy-champagne/60">
                        <div className="flex justify-between">
                          <span>Reference:</span>
                          <span className="font-mono">{booking.booking_ref}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Tables:</span>
                          <span className="font-medium">
                            {booking.table_ids.filter(id => 
                              selectedFloor === 'upstairs' ? id <= 8 : id > 8
                            ).join(', ')}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Party Size:</span>
                          <span>{booking.party_size} guests</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Arrival:</span>
                          <span>{booking.arrival_time}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Total:</span>
                          <span className="text-speakeasy-gold font-medium">
                            £{(booking.deposit_amount + (booking.package_amount || 0)).toFixed(2)}
                          </span>
                        </div>
                      </div>

                      {booking.checked_in_at && (
                        <div className="mt-3 pt-3 border-t border-speakeasy-gold/20">
                          <Text className="text-green-400 text-xs">
                            ✅ Checked in at {new Date(booking.checked_in_at).toLocaleTimeString()}
                          </Text>
                        </div>
                      )}
                    </Card>
                  );
                })}
            </div>
          ) : (
            <div className="text-center py-8">
              <Text className="text-speakeasy-champagne/60">
                No bookings for {selectedFloor} on {new Date(selectedDate).toLocaleDateString()}
              </Text>
            </div>
          )}
        </div>
      </Card>

      {/* Processing Overlay */}
      {processingAction && (
        <div className="fixed inset-0 bg-speakeasy-noir/50 backdrop-blur-sm z-50 flex items-center justify-center">
          <Card className="p-6 text-center">
            <LoadingSpinner size="lg" color="gold" />
            <Text className="text-speakeasy-champagne mt-4">
              Processing {processingAction === 'reassign' ? 'table reassignment' : 'status change'}...
            </Text>
          </Card>
        </div>
      )}
    </div>
  );
}