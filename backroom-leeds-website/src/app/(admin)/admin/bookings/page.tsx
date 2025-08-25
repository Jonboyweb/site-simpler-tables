'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { Heading, Text, Button, LoadingSpinner } from '@/components/atoms';
import { Card } from '@/components/molecules';
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

interface BookingFilters {
  date: string;
  status: string;
  table: string;
  searchTerm: string;
}

export default function AdminBookingsPage() {
  const { data: session } = useSession();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [filteredBookings, setFilteredBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<BookingFilters>({
    date: new Date().toISOString().split('T')[0],
    status: 'all',
    table: '',
    searchTerm: '',
  });
  const [processingCheckIn, setProcessingCheckIn] = useState<string | null>(null);
  const [manualCheckInRef, setManualCheckInRef] = useState('');

  const supabase = createClient();

  const fetchBookings = useCallback(async () => {
    try {
      setError(null);
      
      const { data, error: fetchError } = await supabase
        .from('bookings')
        .select('*')
        .gte('booking_date', filters.date)
        .lte('booking_date', filters.date)
        .order('arrival_time', { ascending: true });

      if (fetchError) {
        throw new Error(`Failed to fetch bookings: ${fetchError.message}`);
      }

      setBookings(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    } finally {
      setLoading(false);
    }
  }, [supabase, filters.date]);

  const applyFilters = useCallback(() => {
    let filtered = [...bookings];

    // Status filter
    if (filters.status !== 'all') {
      filtered = filtered.filter(booking => booking.status === filters.status);
    }

    // Table filter
    if (filters.table) {
      const tableNumber = parseInt(filters.table);
      filtered = filtered.filter(booking => 
        booking.table_ids.includes(tableNumber)
      );
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

  const handleCheckIn = async (bookingId: string, bookingRef: string) => {
    if (!session?.user?.permissions?.canCheckInCustomers) {
      alert('You do not have permission to check in customers');
      return;
    }

    setProcessingCheckIn(bookingId);
    
    try {
      const response = await fetch(`/api/admin/bookings/${bookingId}/check-in`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to check in customer');
      }

      // Refresh bookings
      await fetchBookings();
      alert(`Successfully checked in ${bookingRef}`);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to check in customer');
    } finally {
      setProcessingCheckIn(null);
    }
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

    await handleCheckIn(booking.id, booking.booking_ref);
    setManualCheckInRef('');
  };

  const updateBookingStatus = async (bookingId: string, newStatus: string) => {
    if (!session?.user?.permissions?.canModifyBookings) {
      alert('You do not have permission to modify bookings');
      return;
    }

    try {
      const response = await fetch(`/api/admin/bookings/${bookingId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update booking');
      }

      // Refresh bookings
      await fetchBookings();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to update booking');
    }
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
  }, [filters.date, fetchBookings, supabase]);

  useEffect(() => {
    applyFilters();
  }, [applyFilters]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'bg-blue-500/20 text-blue-400';
      case 'pending': return 'bg-yellow-500/20 text-yellow-400';
      case 'arrived': return 'bg-green-500/20 text-green-400';
      case 'no_show': return 'bg-red-500/20 text-red-400';
      case 'cancelled': return 'bg-gray-500/20 text-gray-400';
      default: return 'bg-speakeasy-gold/20 text-speakeasy-gold';
    }
  };

  const getActionButtons = (booking: Booking) => {
    const buttons = [];

    if (booking.status === 'confirmed' && session?.user?.permissions?.canCheckInCustomers) {
      buttons.push(
        <Button
          key="checkin"
          size="sm"
          variant="outline"
          onClick={() => handleCheckIn(booking.id, booking.booking_ref)}
          disabled={processingCheckIn === booking.id}
          className="text-green-400 border-green-400/20 hover:bg-green-400/10"
        >
          {processingCheckIn === booking.id ? 'Checking In...' : 'Check In'}
        </Button>
      );
    }

    if (booking.status === 'pending' && session?.user?.permissions?.canModifyBookings) {
      buttons.push(
        <Button
          key="confirm"
          size="sm"
          variant="outline"
          onClick={() => updateBookingStatus(booking.id, 'confirmed')}
          className="text-blue-400 border-blue-400/20 hover:bg-blue-400/10"
        >
          Confirm
        </Button>
      );
    }

    if (booking.status === 'confirmed' && session?.user?.permissions?.canModifyBookings) {
      buttons.push(
        <Button
          key="noshow"
          size="sm"
          variant="outline"
          onClick={() => updateBookingStatus(booking.id, 'no_show')}
          className="text-red-400 border-red-400/20 hover:bg-red-400/10"
        >
          No Show
        </Button>
      );
    }

    return buttons;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner size="lg" color="gold" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
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
          <Button 
            variant="primary" 
            size="sm"
            href="/admin/bookings/new"
            disabled={!session?.user?.permissions?.canModifyBookings}
          >
            New Booking
          </Button>
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

      {/* Filters */}
      <Card className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div>
            <label className="block text-sm font-medium text-speakeasy-champagne mb-2">
              Date
            </label>
            <input
              type="date"
              value={filters.date}
              onChange={(e) => setFilters(prev => ({ ...prev, date: e.target.value }))}
              className="w-full px-3 py-2 bg-speakeasy-noir/50 border border-speakeasy-gold/20 rounded text-speakeasy-champagne focus:outline-none focus:border-speakeasy-gold"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-speakeasy-champagne mb-2">
              Status
            </label>
            <select
              value={filters.status}
              onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
              className="w-full px-3 py-2 bg-speakeasy-noir/50 border border-speakeasy-gold/20 rounded text-speakeasy-champagne focus:outline-none focus:border-speakeasy-gold"
            >
              <option value="all">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="confirmed">Confirmed</option>
              <option value="arrived">Arrived</option>
              <option value="no_show">No Show</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-speakeasy-champagne mb-2">
              Table
            </label>
            <input
              type="number"
              min="1"
              max="16"
              placeholder="1-16"
              value={filters.table}
              onChange={(e) => setFilters(prev => ({ ...prev, table: e.target.value }))}
              className="w-full px-3 py-2 bg-speakeasy-noir/50 border border-speakeasy-gold/20 rounded text-speakeasy-champagne focus:outline-none focus:border-speakeasy-gold"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-speakeasy-champagne mb-2">
              Search
            </label>
            <input
              type="text"
              placeholder="Name, email, or reference"
              value={filters.searchTerm}
              onChange={(e) => setFilters(prev => ({ ...prev, searchTerm: e.target.value }))}
              className="w-full px-3 py-2 bg-speakeasy-noir/50 border border-speakeasy-gold/20 rounded text-speakeasy-champagne focus:outline-none focus:border-speakeasy-gold"
            />
          </div>
          <div className="flex items-end">
            <Text className="text-sm text-speakeasy-champagne/60">
              {filteredBookings.length} of {bookings.length} bookings
            </Text>
          </div>
        </div>
      </Card>

      {/* Bookings Table */}
      <Card className="overflow-hidden">
        <div className="p-6 border-b border-speakeasy-gold/20">
          <div className="flex items-center justify-between">
            <Heading level={2} className="text-xl font-bebas text-speakeasy-gold">
              Bookings for {new Date(filters.date).toLocaleDateString()}
            </Heading>
            <Text className="text-sm text-speakeasy-champagne/60">
              {filteredBookings.length} bookings
            </Text>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-speakeasy-noir/30">
              <tr>
                <th className="text-left p-4 text-speakeasy-gold font-bebas">Reference</th>
                <th className="text-left p-4 text-speakeasy-gold font-bebas">Customer</th>
                <th className="text-left p-4 text-speakeasy-gold font-bebas">Tables</th>
                <th className="text-left p-4 text-speakeasy-gold font-bebas">Time</th>
                <th className="text-left p-4 text-speakeasy-gold font-bebas">Party</th>
                <th className="text-left p-4 text-speakeasy-gold font-bebas">Status</th>
                <th className="text-left p-4 text-speakeasy-gold font-bebas">Amount</th>
                <th className="text-left p-4 text-speakeasy-gold font-bebas">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredBookings.length > 0 ? filteredBookings.map(booking => (
                <tr key={booking.id} className="border-b border-speakeasy-gold/10 hover:bg-speakeasy-noir/20">
                  <td className="p-4">
                    <Text className="text-speakeasy-champagne font-mono text-sm">
                      {booking.booking_ref}
                    </Text>
                    {booking.checked_in_at && (
                      <Text className="text-green-400 text-xs">
                        Checked in at {new Date(booking.checked_in_at).toLocaleTimeString()}
                      </Text>
                    )}
                  </td>
                  <td className="p-4">
                    <div>
                      <Text className="text-speakeasy-champagne font-medium">{booking.customer_name}</Text>
                      <Text className="text-speakeasy-champagne/60 text-xs">{booking.customer_email}</Text>
                      <Text className="text-speakeasy-champagne/60 text-xs">{booking.customer_phone}</Text>
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex flex-wrap gap-1">
                      {booking.table_ids.map(tableId => (
                        <span key={tableId} className="inline-block px-2 py-1 bg-speakeasy-gold/20 text-speakeasy-gold rounded text-xs">
                          {tableId}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="p-4">
                    <Text className="text-speakeasy-champagne">{booking.arrival_time}</Text>
                  </td>
                  <td className="p-4">
                    <Text className="text-speakeasy-champagne">{booking.party_size}</Text>
                  </td>
                  <td className="p-4">
                    <span className={`inline-block px-2 py-1 rounded text-xs capitalize ${getStatusColor(booking.status)}`}>
                      {booking.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="p-4">
                    <div className="text-sm">
                      <Text className="text-speakeasy-champagne">
                        £{booking.deposit_amount}
                      </Text>
                      {booking.package_amount && (
                        <Text className="text-speakeasy-champagne/60 text-xs">
                          +£{booking.package_amount} pkg
                        </Text>
                      )}
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex flex-wrap gap-1">
                      {getActionButtons(booking)}
                    </div>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-speakeasy-champagne/60">
                    No bookings found for the selected filters
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Quick Check-in Section */}
      {session?.user?.permissions?.canCheckInCustomers && (
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
                  className="w-full px-3 py-2 bg-speakeasy-noir/50 border border-speakeasy-gold/20 rounded text-speakeasy-champagne focus:outline-none focus:border-speakeasy-gold font-mono"
                  onKeyPress={(e) => e.key === 'Enter' && handleManualCheckIn()}
                />
              </div>
              <Button 
                variant="primary" 
                size="sm" 
                className="w-full" 
                onClick={handleManualCheckIn}
                disabled={!manualCheckInRef.trim() || processingCheckIn !== null}
              >
                Check In by Reference
              </Button>
            </div>

            <div className="mt-6 pt-6 border-t border-speakeasy-gold/20">
              <Text className="text-speakeasy-champagne/80 text-sm font-medium mb-3">
                Recent Check-ins
              </Text>
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {filteredBookings
                  .filter(b => b.status === 'arrived' && b.checked_in_at)
                  .sort((a, b) => new Date(b.checked_in_at!).getTime() - new Date(a.checked_in_at!).getTime())
                  .slice(0, 5)
                  .map(booking => (
                    <div key={booking.id} className="text-sm text-speakeasy-champagne/60 flex justify-between">
                      <span>
                        Tables {booking.table_ids.join(', ')} - {booking.customer_name}
                      </span>
                      <span>
                        {booking.checked_in_at && new Date(booking.checked_in_at).toLocaleTimeString()}
                      </span>
                    </div>
                  ))}
                {filteredBookings.filter(b => b.status === 'arrived').length === 0 && (
                  <Text className="text-speakeasy-champagne/50 text-sm">No recent check-ins today</Text>
                )}
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Stats Summary */}
      <Card className="p-6">
        <Heading level={2} className="text-xl font-bebas text-speakeasy-gold mb-4">
          Today&apos;s Summary
        </Heading>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {[
            { label: 'Total', value: filteredBookings.length, color: 'text-speakeasy-champagne' },
            { label: 'Confirmed', value: filteredBookings.filter(b => b.status === 'confirmed').length, color: 'text-blue-400' },
            { label: 'Arrived', value: filteredBookings.filter(b => b.status === 'arrived').length, color: 'text-green-400' },
            { label: 'No Shows', value: filteredBookings.filter(b => b.status === 'no_show').length, color: 'text-red-400' },
            { label: 'Cancelled', value: filteredBookings.filter(b => b.status === 'cancelled').length, color: 'text-gray-400' },
          ].map(stat => (
            <div key={stat.label} className="text-center">
              <Text className={`text-2xl font-bebas ${stat.color}`}>{stat.value}</Text>
              <Text className="text-speakeasy-champagne/60 text-sm">{stat.label}</Text>
            </div>
          ))}
        </div>
        <div className="mt-4 pt-4 border-t border-speakeasy-gold/20">
          <div className="flex justify-between items-center">
            <Text className="text-speakeasy-champagne/80 text-sm">
              Total Revenue (Deposits + Packages):
            </Text>
            <Text className="text-speakeasy-gold font-bebas text-lg">
              £{filteredBookings
                .filter(b => b.status !== 'cancelled')
                .reduce((sum, b) => sum + b.deposit_amount + (b.package_amount || 0), 0)
                .toFixed(2)
              }
            </Text>
          </div>
        </div>
      </Card>
    </div>
  );
}