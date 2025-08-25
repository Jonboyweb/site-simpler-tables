'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { Heading, Text, Button, LoadingSpinner } from '@/components/atoms';
import { Card, BulkBookingActions, AdvancedBookingFilters, BookingTableRow } from '@/components/molecules';
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
  payment_status?: 'paid' | 'partial' | 'pending' | 'refunded';
  notes?: string;
}

interface BookingFilters {
  dateRange: {
    from: string;
    to: string;
  };
  status: string[];
  paymentStatus: string[];
  tables: number[];
  eventType: string;
  arrivalTime: string;
  partySize: {
    min: number;
    max: number;
  };
  searchTerm: string;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
}

export default function AdminBookingsPage() {
  const { data: session } = useSession();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [filteredBookings, setFilteredBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<BookingFilters>({
    dateRange: {
      from: new Date().toISOString().split('T')[0],
      to: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    },
    status: [],
    paymentStatus: [],
    tables: [],
    eventType: '',
    arrivalTime: '',
    partySize: { min: 1, max: 12 },
    searchTerm: '',
    sortBy: 'booking_date',
    sortOrder: 'asc',
  });
  const [processingCheckIn, setProcessingCheckIn] = useState<string | null>(null);
  const [manualCheckInRef, setManualCheckInRef] = useState('');
  const [selectedBookings, setSelectedBookings] = useState<string[]>([]);
  const [filtersExpanded, setFiltersExpanded] = useState(false);
  const [processingAction, setProcessingAction] = useState<string | null>(null);

  const supabase = createClient();

  // User permissions
  const userPermissions = {
    canModifyBookings: session?.user?.permissions?.canModifyBookings || false,
    canCheckInCustomers: session?.user?.permissions?.canCheckInCustomers || false,
    canViewPayments: session?.user?.role === 'super_admin' || session?.user?.role === 'manager',
    canProcessPayments: session?.user?.role === 'super_admin' || session?.user?.role === 'manager',
  };

  const fetchBookings = useCallback(async () => {
    try {
      setError(null);
      setLoading(true);
      
      let query = supabase
        .from('bookings')
        .select('*');

      // Apply date range filter
      if (filters.dateRange.from) {
        query = query.gte('booking_date', filters.dateRange.from);
      }
      if (filters.dateRange.to) {
        query = query.lte('booking_date', filters.dateRange.to);
      }

      // Apply sorting
      query = query.order(filters.sortBy, { ascending: filters.sortOrder === 'asc' });

      const { data, error: fetchError } = await query;

      if (fetchError) {
        throw new Error(`Failed to fetch bookings: ${fetchError.message}`);
      }

      setBookings(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    } finally {
      setLoading(false);
    }
  }, [supabase, filters.dateRange, filters.sortBy, filters.sortOrder]);

  const applyFilters = useCallback(() => {
    let filtered = [...bookings];

    // Status filter
    if (filters.status.length > 0) {
      filtered = filtered.filter(booking => filters.status.includes(booking.status));
    }

    // Payment status filter
    if (filters.paymentStatus.length > 0) {
      filtered = filtered.filter(booking => 
        booking.payment_status && filters.paymentStatus.includes(booking.payment_status)
      );
    }

    // Table filter
    if (filters.tables.length > 0) {
      filtered = filtered.filter(booking => 
        booking.table_ids.some(tableId => filters.tables.includes(tableId))
      );
    }

    // Party size filter
    filtered = filtered.filter(booking => 
      booking.party_size >= filters.partySize.min && 
      booking.party_size <= filters.partySize.max
    );

    // Arrival time filter
    if (filters.arrivalTime) {
      filtered = filtered.filter(booking => booking.arrival_time === filters.arrivalTime);
    }

    // Search term filter
    if (filters.searchTerm) {
      const searchLower = filters.searchTerm.toLowerCase();
      filtered = filtered.filter(booking =>
        booking.customer_name.toLowerCase().includes(searchLower) ||
        booking.customer_email.toLowerCase().includes(searchLower) ||
        booking.booking_ref.toLowerCase().includes(searchLower) ||
        booking.customer_phone.includes(filters.searchTerm)
      );
    }

    setFilteredBookings(filtered);
  }, [bookings, filters]);

  const handleBulkAction = async (action: string, bookingIds: string[]) => {
    setProcessingAction(action);
    
    try {
      const promises = bookingIds.map(async (id) => {
        const response = await fetch(`/api/admin/bookings/${id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            action: action,
            status: action === 'confirm' ? 'confirmed' : 
                   action === 'cancel' ? 'cancelled' : 
                   action === 'no_show' ? 'no_show' : 
                   action === 'check_in' ? 'arrived' : undefined
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || `Failed to ${action} booking ${id}`);
        }

        return response.json();
      });

      await Promise.all(promises);
      
      // Clear selections and refresh
      setSelectedBookings([]);
      await fetchBookings();
      
      alert(`Successfully ${action}ed ${bookingIds.length} booking${bookingIds.length !== 1 ? 's' : ''}`);
    } catch (err) {
      alert(err instanceof Error ? err.message : `Failed to ${action} bookings`);
    } finally {
      setProcessingAction(null);
    }
  };

  const handleBookingAction = async (action: string, bookingId: string) => {
    setProcessingAction(action);
    
    try {
      let endpoint = `/api/admin/bookings/${bookingId}`;
      let method = 'PATCH';
      let body: any = { action };

      // Special handling for different actions
      if (action === 'check_in') {
        endpoint = `/api/admin/bookings/${bookingId}/check-in`;
        method = 'POST';
        body = {};
      } else if (action === 'confirm') {
        body.status = 'confirmed';
      } else if (action === 'cancel') {
        body.status = 'cancelled';
      } else if (action === 'no_show') {
        body.status = 'no_show';
      }

      const response = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to ${action} booking`);
      }

      // Refresh bookings
      await fetchBookings();
    } catch (err) {
      alert(err instanceof Error ? err.message : `Failed to ${action} booking`);
    } finally {
      setProcessingAction(null);
    }
  };

  const handleBookingSelection = (bookingId: string, selected: boolean) => {
    setSelectedBookings(prev => 
      selected 
        ? [...prev, bookingId]
        : prev.filter(id => id !== bookingId)
    );
  };

  const handleSelectAll = () => {
    if (selectedBookings.length === filteredBookings.length) {
      setSelectedBookings([]);
    } else {
      setSelectedBookings(filteredBookings.map(b => b.id));
    }
  };

  const resetFilters = () => {
    setFilters({
      dateRange: {
        from: new Date().toISOString().split('T')[0],
        to: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      },
      status: [],
      paymentStatus: [],
      tables: [],
      eventType: '',
      arrivalTime: '',
      partySize: { min: 1, max: 12 },
      searchTerm: '',
      sortBy: 'booking_date',
      sortOrder: 'asc',
    });
    setSelectedBookings([]);
  };

  const handleManualCheckIn = async () => {
    if (!manualCheckInRef.trim()) return;

    const booking = bookings.find(b => 
      b.booking_ref.toLowerCase() === manualCheckInRef.toLowerCase()
    );

    if (!booking) {
      alert('Booking not found');
      return;
    }

    if (booking.status === 'arrived') {
      alert('Customer is already checked in');
      return;
    }

    await handleBookingAction('check_in', booking.id);
    setManualCheckInRef('');
  };

  useEffect(() => {
    fetchBookings();

    // Set up real-time subscriptions
    const bookingsSubscription = supabase
      .channel('admin_bookings')
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

  useEffect(() => {
    applyFilters();
  }, [applyFilters]);

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
      <div className="flex items-center justify-between">
        <div>
          <Heading level={1} variant="bebas" className="text-speakeasy-gold mb-2">
            Bookings Management
          </Heading>
          <Text className="text-speakeasy-champagne/70">
            Manage table reservations, check-ins, and booking modifications
          </Text>
        </div>
        <div className="flex gap-3">
          {userPermissions.canModifyBookings && (
            <Button 
              variant="primary" 
              size="sm"
              href="/admin/bookings/new"
            >
              New Booking
            </Button>
          )}
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => window.print()}
          >
            Print List
          </Button>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <Card className="border-red-400/20 bg-red-900/20 p-4">
          <Text className="text-red-300">{error}</Text>
        </Card>
      )}

      {/* Advanced Filters */}
      <AdvancedBookingFilters
        filters={filters}
        onFiltersChange={setFilters}
        onReset={resetFilters}
        isExpanded={filtersExpanded}
        onToggleExpanded={() => setFiltersExpanded(!filtersExpanded)}
        totalBookings={bookings.length}
        filteredBookings={filteredBookings.length}
      />

      {/* Bulk Actions */}
      {selectedBookings.length > 0 && (
        <BulkBookingActions
          selectedBookings={selectedBookings}
          onBulkAction={handleBulkAction}
          userPermissions={userPermissions}
        />
      )}

      {/* Bookings Table */}
      <Card className="overflow-hidden">
        <div className="p-6 border-b border-speakeasy-gold/20">
          <div className="flex items-center justify-between">
            <Heading level={2} className="text-xl font-bebas text-speakeasy-gold">
              Bookings List
            </Heading>
            <div className="flex items-center gap-4">
              <Text className="text-sm text-speakeasy-champagne/60">
                {filteredBookings.length} of {bookings.length} bookings
              </Text>
              {filteredBookings.length > 0 && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleSelectAll}
                  className="text-speakeasy-gold border-speakeasy-gold/20"
                >
                  {selectedBookings.length === filteredBookings.length ? 'Deselect All' : 'Select All'}
                </Button>
              )}
            </div>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-speakeasy-noir/30">
              <tr>
                <th className="text-left p-4 text-speakeasy-gold font-bebas">
                  <input
                    type="checkbox"
                    checked={selectedBookings.length === filteredBookings.length && filteredBookings.length > 0}
                    onChange={handleSelectAll}
                    className="w-4 h-4 rounded border-speakeasy-gold/20 bg-speakeasy-noir/50 text-speakeasy-gold"
                  />
                </th>
                <th className="text-left p-4 text-speakeasy-gold font-bebas">Reference</th>
                <th className="text-left p-4 text-speakeasy-gold font-bebas">Customer</th>
                <th className="text-left p-4 text-speakeasy-gold font-bebas">Tables</th>
                <th className="text-left p-4 text-speakeasy-gold font-bebas">Date/Time</th>
                <th className="text-left p-4 text-speakeasy-gold font-bebas">Party</th>
                <th className="text-left p-4 text-speakeasy-gold font-bebas">Status</th>
                <th className="text-left p-4 text-speakeasy-gold font-bebas">Payment</th>
                <th className="text-left p-4 text-speakeasy-gold font-bebas">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredBookings.length > 0 ? filteredBookings.map(booking => (
                <BookingTableRow
                  key={booking.id}
                  booking={booking}
                  isSelected={selectedBookings.includes(booking.id)}
                  onSelect={handleBookingSelection}
                  onAction={handleBookingAction}
                  userPermissions={userPermissions}
                  processingAction={processingAction}
                />
              )) : (
                <tr>
                  <td colSpan={9} className="p-8 text-center text-speakeasy-champagne/60">
                    No bookings found for the selected filters
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Quick Check-in Section - Mobile Optimized for Door Staff */}
      {userPermissions.canCheckInCustomers && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="p-6">
            <Heading level={2} className="text-xl font-bebas text-speakeasy-gold mb-4">
              QR Code Check-in
            </Heading>
            <div className="aspect-square bg-speakeasy-noir/30 rounded-lg border-2 border-dashed border-speakeasy-gold/20 flex items-center justify-center mb-4">
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-2 bg-speakeasy-gold/20 rounded-full flex items-center justify-center">
                  <span className="text-speakeasy-gold text-2xl">📱</span>
                </div>
                <Text className="text-speakeasy-champagne/70 text-sm">QR Scanner Coming Soon</Text>
                <Text className="text-speakeasy-champagne/50 text-xs mt-1">
                  Mobile camera integration for instant check-ins
                </Text>
              </div>
            </div>
            <Button variant="outline" size="sm" className="w-full" disabled>
              Start QR Scanner
            </Button>
          </Card>

          <Card className="p-6">
            <Heading level={2} className="text-xl font-bebas text-speakeasy-gold mb-4">
              Manual Check-in
            </Heading>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-speakeasy-champagne mb-2">
                  Booking Reference
                </label>
                <input
                  type="text"
                  placeholder="BRL-2025-XXXXX"
                  value={manualCheckInRef}
                  onChange={(e) => setManualCheckInRef(e.target.value.toUpperCase())}
                  className="w-full px-4 py-3 bg-speakeasy-noir/50 border border-speakeasy-gold/20 rounded text-speakeasy-champagne focus:outline-none focus:border-speakeasy-gold font-mono text-lg"
                  onKeyPress={(e) => e.key === 'Enter' && handleManualCheckIn()}
                />
              </div>
              <Button 
                variant="primary" 
                size="lg" 
                className="w-full" 
                onClick={handleManualCheckIn}
                disabled={!manualCheckInRef.trim() || processingAction !== null}
              >
                {processingAction ? (
                  <>
                    <LoadingSpinner size="sm" color="white" />
                    Processing...
                  </>
                ) : (
                  'Check In by Reference'
                )}
              </Button>
            </div>

            <div className="mt-6 pt-6 border-t border-speakeasy-gold/20">
              <Text className="text-speakeasy-champagne/80 text-sm font-medium mb-3">
                Recent Check-ins Today
              </Text>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {filteredBookings
                  .filter(b => b.status === 'arrived' && b.checked_in_at)
                  .sort((a, b) => new Date(b.checked_in_at!).getTime() - new Date(a.checked_in_at!).getTime())
                  .slice(0, 8)
                  .map(booking => (
                    <div key={booking.id} className="flex justify-between items-center p-2 bg-speakeasy-noir/30 rounded text-sm">
                      <div>
                        <Text className="text-speakeasy-champagne font-medium">
                          {booking.customer_name}
                        </Text>
                        <Text className="text-speakeasy-champagne/60 text-xs">
                          Tables {booking.table_ids.join(', ')} • {booking.party_size} guests
                        </Text>
                      </div>
                      <Text className="text-green-400 text-xs">
                        {booking.checked_in_at && new Date(booking.checked_in_at).toLocaleTimeString()}
                      </Text>
                    </div>
                  ))}
                {filteredBookings.filter(b => b.status === 'arrived').length === 0 && (
                  <Text className="text-speakeasy-champagne/50 text-sm">No check-ins yet today</Text>
                )}
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Enhanced Stats Summary */}
      <Card className="p-6">
        <Heading level={2} className="text-xl font-bebas text-speakeasy-gold mb-6">
          Today&apos;s Summary
        </Heading>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
          {[
            { label: 'Total', value: filteredBookings.length, color: 'text-speakeasy-champagne', icon: '📊' },
            { label: 'Confirmed', value: filteredBookings.filter(b => b.status === 'confirmed').length, color: 'text-blue-400', icon: '✅' },
            { label: 'Arrived', value: filteredBookings.filter(b => b.status === 'arrived').length, color: 'text-green-400', icon: '🎫' },
            { label: 'No Shows', value: filteredBookings.filter(b => b.status === 'no_show').length, color: 'text-red-400', icon: '🚫' },
            { label: 'Cancelled', value: filteredBookings.filter(b => b.status === 'cancelled').length, color: 'text-gray-400', icon: '❌' },
            { label: 'Pending', value: filteredBookings.filter(b => b.status === 'pending').length, color: 'text-yellow-400', icon: '⏳' },
          ].map(stat => (
            <div key={stat.label} className="text-center p-4 bg-speakeasy-noir/20 rounded-lg">
              <div className="text-2xl mb-2">{stat.icon}</div>
              <Text className={`text-3xl font-bebas ${stat.color} mb-1`}>{stat.value}</Text>
              <Text className="text-speakeasy-champagne/60 text-sm">{stat.label}</Text>
            </div>
          ))}
        </div>
        
        {userPermissions.canViewPayments && (
          <div className="mt-6 pt-6 border-t border-speakeasy-gold/20">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <Text className="text-speakeasy-gold font-bebas text-2xl">
                  £{filteredBookings
                    .filter(b => b.status !== 'cancelled')
                    .reduce((sum, b) => sum + b.deposit_amount, 0)
                    .toFixed(2)
                  }
                </Text>
                <Text className="text-speakeasy-champagne/60 text-sm">Deposits Collected</Text>
              </div>
              <div className="text-center">
                <Text className="text-speakeasy-copper font-bebas text-2xl">
                  £{filteredBookings
                    .filter(b => b.status !== 'cancelled')
                    .reduce((sum, b) => sum + (b.package_amount || 0), 0)
                    .toFixed(2)
                  }
                </Text>
                <Text className="text-speakeasy-champagne/60 text-sm">Package Revenue</Text>
              </div>
              <div className="text-center">
                <Text className="text-green-400 font-bebas text-2xl">
                  £{filteredBookings
                    .filter(b => b.status !== 'cancelled')
                    .reduce((sum, b) => sum + b.deposit_amount + (b.package_amount || 0), 0)
                    .toFixed(2)
                  }
                </Text>
                <Text className="text-speakeasy-champagne/60 text-sm">Total Revenue</Text>
              </div>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}