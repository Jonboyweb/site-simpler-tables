'use client';

import { useState, useEffect } from 'react';
import { Text, Button, LoadingSpinner } from '@/components/atoms';
import { Card, Modal } from '@/components/molecules';
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
  status: 'pending' | 'confirmed' | 'arrived' | 'no_show' | 'cancelled' | 'waitlist';
  table_ids: number[];
  drinks_package_id?: string;
  drinks_package_name?: string;
  special_requests?: string;
  deposit_amount: number;
  total_amount: number;
  created_at: string;
  notes?: string;
}

interface BookingsListProps {
  filters: any;
  selectedBookings: string[];
  onSelectionChange: (bookingIds: string[], selectAll?: boolean) => void;
  onBookingUpdate: () => void;
}

export function BookingsList({ 
  filters, 
  selectedBookings, 
  onSelectionChange,
  onBookingUpdate 
}: BookingsListProps) {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const supabase = createClient();
  const itemsPerPage = 25;

  useEffect(() => {
    fetchBookings();
  }, [filters, currentPage]);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      setError(null);

      let query = supabase
        .from('bookings')
        .select(`
          id, booking_ref, customer_name, customer_email, customer_phone,
          party_size, booking_date, arrival_time, status, table_ids,
          drinks_package_id, special_requests, deposit_amount, total_amount,
          created_at, notes,
          drinks_packages(name)
        `, { count: 'exact' });

      // Apply date range filter
      if (filters.dateRange.startDate) {
        query = query.gte('booking_date', filters.dateRange.startDate);
      }
      if (filters.dateRange.endDate) {
        query = query.lte('booking_date', filters.dateRange.endDate);
      }

      // Apply status filter
      if (filters.status.length > 0) {
        query = query.in('status', filters.status);
      }

      // Apply search filter
      if (filters.searchTerm.trim()) {
        const searchTerm = filters.searchTerm.trim();
        query = query.or(
          `customer_name.ilike.%${searchTerm}%,` +
          `customer_email.ilike.%${searchTerm}%,` +
          `booking_ref.ilike.%${searchTerm}%,` +
          `customer_phone.ilike.%${searchTerm}%`
        );
      }

      // Apply table filter
      if (filters.tableNumbers.length > 0) {
        // For PostgreSQL array contains any
        query = query.overlaps('table_ids', filters.tableNumbers);
      }

      // Apply party size filter
      if (filters.partySize.min > 1) {
        query = query.gte('party_size', filters.partySize.min);
      }
      if (filters.partySize.max < 20) {
        query = query.lte('party_size', filters.partySize.max);
      }

      // Apply sorting
      query = query.order(filters.sortBy, { ascending: filters.sortOrder === 'asc' });

      // Apply pagination
      const from = (currentPage - 1) * itemsPerPage;
      const to = from + itemsPerPage - 1;
      query = query.range(from, to);

      const { data, error: fetchError, count } = await query;

      if (fetchError) throw fetchError;

      // Transform data to include drinks package names
      const transformedBookings = data?.map((booking: any) => ({
        ...booking,
        drinks_package_name: booking.drinks_packages?.name || null
      })) || [];

      setBookings(transformedBookings);
      setTotalCount(count || 0);
      setTotalPages(Math.ceil((count || 0) / itemsPerPage));

    } catch (err) {
      console.error('Error fetching bookings:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch bookings');
    } finally {
      setLoading(false);
    }
  };

  const handleBookingSelect = (bookingId: string, checked: boolean) => {
    let newSelection: string[];
    if (checked) {
      newSelection = [...selectedBookings, bookingId];
    } else {
      newSelection = selectedBookings.filter(id => id !== bookingId);
    }
    onSelectionChange(newSelection);
  };

  const handleSelectAll = (checked: boolean) => {
    const allBookingIds = bookings.map(booking => booking.id);
    onSelectionChange(allBookingIds, checked);
  };

  const handleBookingClick = (booking: Booking) => {
    setSelectedBooking(booking);
    setShowDetails(true);
  };

  const handleStatusUpdate = async (bookingId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('bookings')
        .update({ 
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', bookingId);

      if (error) throw error;

      // Refresh bookings list
      await fetchBookings();
      onBookingUpdate();
      
      // Close modal if open
      setShowDetails(false);
    } catch (err) {
      console.error('Error updating booking status:', err);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'text-green-400 bg-green-900/20';
      case 'pending': return 'text-yellow-400 bg-yellow-900/20';
      case 'arrived': return 'text-blue-400 bg-blue-900/20';
      case 'no_show': return 'text-red-400 bg-red-900/20';
      case 'cancelled': return 'text-gray-400 bg-gray-900/20';
      case 'waitlist': return 'text-purple-400 bg-purple-900/20';
      default: return 'text-speakeasy-champagne bg-speakeasy-burgundy/20';
    }
  };

  const formatTime = (timeString: string) => {
    return timeString?.slice(0, 5) || '';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      weekday: 'short',
      day: 'numeric',
      month: 'short'
    });
  };

  if (loading && bookings.length === 0) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center py-8">
          <LoadingSpinner size="md" color="gold" />
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="border-red-400/20 bg-red-900/20 p-6">
        <Text className="text-red-300">Error: {error}</Text>
        <Button variant="ghost" size="sm" onClick={fetchBookings} className="mt-2">
          Retry
        </Button>
      </Card>
    );
  }

  return (
    <>
      <Card className="overflow-hidden">
        {/* Table Header with Select All */}
        <div className="bg-speakeasy-noir/50 px-6 py-3 border-b border-speakeasy-gold/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={selectedBookings.length === bookings.length && bookings.length > 0}
                  onChange={(e) => handleSelectAll(e.target.checked)}
                  className="form-checkbox text-speakeasy-gold"
                />
                <Text variant="caption" className="text-speakeasy-copper">
                  Select All ({bookings.length})
                </Text>
              </label>
            </div>
            
            <Text variant="caption" className="text-speakeasy-champagne/60">
              {totalCount} total • Page {currentPage} of {totalPages}
            </Text>
          </div>
        </div>

        {/* Bookings Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-speakeasy-noir/30">
              <tr>
                <th className="text-left p-3 text-xs font-medium text-speakeasy-copper uppercase tracking-wide">Select</th>
                <th className="text-left p-3 text-xs font-medium text-speakeasy-copper uppercase tracking-wide">Reference</th>
                <th className="text-left p-3 text-xs font-medium text-speakeasy-copper uppercase tracking-wide">Customer</th>
                <th className="text-left p-3 text-xs font-medium text-speakeasy-copper uppercase tracking-wide">Date/Time</th>
                <th className="text-left p-3 text-xs font-medium text-speakeasy-copper uppercase tracking-wide">Party/Tables</th>
                <th className="text-left p-3 text-xs font-medium text-speakeasy-copper uppercase tracking-wide">Status</th>
                <th className="text-left p-3 text-xs font-medium text-speakeasy-copper uppercase tracking-wide">Value</th>
                <th className="text-left p-3 text-xs font-medium text-speakeasy-copper uppercase tracking-wide">Actions</th>
              </tr>
            </thead>
            <tbody>
              {bookings.length > 0 ? bookings.map((booking) => (
                <tr 
                  key={booking.id} 
                  className="border-t border-speakeasy-gold/10 hover:bg-speakeasy-noir/20 transition-colors"
                >
                  <td className="p-3">
                    <input
                      type="checkbox"
                      checked={selectedBookings.includes(booking.id)}
                      onChange={(e) => handleBookingSelect(booking.id, e.target.checked)}
                      className="form-checkbox text-speakeasy-gold"
                    />
                  </td>
                  
                  <td className="p-3">
                    <button
                      onClick={() => handleBookingClick(booking)}
                      className="text-speakeasy-champagne font-mono text-sm hover:text-speakeasy-gold transition-colors"
                    >
                      {booking.booking_ref}
                    </button>
                  </td>
                  
                  <td className="p-3">
                    <div>
                      <Text className="text-speakeasy-champagne font-medium text-sm">
                        {booking.customer_name}
                      </Text>
                      <Text variant="caption" className="text-speakeasy-champagne/60">
                        {booking.customer_email}
                      </Text>
                      {booking.customer_phone && (
                        <Text variant="caption" className="text-speakeasy-champagne/60 block">
                          {booking.customer_phone}
                        </Text>
                      )}
                    </div>
                  </td>
                  
                  <td className="p-3">
                    <div>
                      <Text className="text-speakeasy-champagne text-sm">
                        {formatDate(booking.booking_date)}
                      </Text>
                      <Text variant="caption" className="text-speakeasy-gold">
                        {formatTime(booking.arrival_time)}
                      </Text>
                    </div>
                  </td>
                  
                  <td className="p-3">
                    <div>
                      <Text className="text-speakeasy-champagne text-sm">
                        {booking.party_size} guests
                      </Text>
                      <Text variant="caption" className="text-speakeasy-gold">
                        Tables {booking.table_ids?.join(', ') || 'TBD'}
                      </Text>
                    </div>
                  </td>
                  
                  <td className="p-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(booking.status)}`}>
                      {booking.status.replace('_', ' ').toUpperCase()}
                    </span>
                  </td>
                  
                  <td className="p-3">
                    <div>
                      <Text className="text-speakeasy-champagne text-sm">
                        £{booking.total_amount?.toLocaleString() || '0'}
                      </Text>
                      {booking.drinks_package_name && (
                        <Text variant="caption" className="text-speakeasy-gold">
                          {booking.drinks_package_name}
                        </Text>
                      )}
                    </div>
                  </td>
                  
                  <td className="p-3">
                    <div className="flex items-center gap-1">
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleBookingClick(booking)}
                        className="text-xs"
                      >
                        View
                      </Button>
                      {booking.status === 'pending' && (
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleStatusUpdate(booking.id, 'confirmed')}
                          className="text-xs text-green-400 hover:text-green-300"
                        >
                          Confirm
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={8} className="p-8 text-center">
                    <Text className="text-speakeasy-champagne/60">
                      No bookings found matching the current filters
                    </Text>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="bg-speakeasy-noir/50 px-6 py-3 border-t border-speakeasy-gold/20">
            <div className="flex items-center justify-between">
              <Text variant="caption" className="text-speakeasy-champagne/60">
                Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, totalCount)} of {totalCount}
              </Text>
              
              <div className="flex items-center gap-2">
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                >
                  Previous
                </Button>
                
                <Text variant="caption" className="text-speakeasy-champagne px-3">
                  {currentPage} / {totalPages}
                </Text>
                
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          </div>
        )}
      </Card>

      {/* Booking Details Modal */}
      {showDetails && selectedBooking && (
        <Modal
          isOpen={showDetails}
          onClose={() => setShowDetails(false)}
          title={`Booking Details - ${selectedBooking.booking_ref}`}
          className="max-w-2xl"
        >
          <div className="space-y-6">
            {/* Customer Information */}
            <div>
              <Text className="text-speakeasy-gold font-medium mb-3">Customer Information</Text>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Text variant="caption" className="text-speakeasy-copper">Name</Text>
                  <Text className="text-speakeasy-champagne">{selectedBooking.customer_name}</Text>
                </div>
                <div>
                  <Text variant="caption" className="text-speakeasy-copper">Email</Text>
                  <Text className="text-speakeasy-champagne">{selectedBooking.customer_email}</Text>
                </div>
                <div>
                  <Text variant="caption" className="text-speakeasy-copper">Phone</Text>
                  <Text className="text-speakeasy-champagne">{selectedBooking.customer_phone || 'Not provided'}</Text>
                </div>
                <div>
                  <Text variant="caption" className="text-speakeasy-copper">Party Size</Text>
                  <Text className="text-speakeasy-champagne">{selectedBooking.party_size} guests</Text>
                </div>
              </div>
            </div>

            {/* Booking Details */}
            <div>
              <Text className="text-speakeasy-gold font-medium mb-3">Booking Details</Text>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Text variant="caption" className="text-speakeasy-copper">Date</Text>
                  <Text className="text-speakeasy-champagne">{formatDate(selectedBooking.booking_date)}</Text>
                </div>
                <div>
                  <Text variant="caption" className="text-speakeasy-copper">Arrival Time</Text>
                  <Text className="text-speakeasy-champagne">{formatTime(selectedBooking.arrival_time)}</Text>
                </div>
                <div>
                  <Text variant="caption" className="text-speakeasy-copper">Tables</Text>
                  <Text className="text-speakeasy-champagne">
                    {selectedBooking.table_ids?.join(', ') || 'To be assigned'}
                  </Text>
                </div>
                <div>
                  <Text variant="caption" className="text-speakeasy-copper">Status</Text>
                  <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(selectedBooking.status)}`}>
                    {selectedBooking.status.replace('_', ' ').toUpperCase()}
                  </span>
                </div>
              </div>
            </div>

            {/* Financial Information */}
            <div>
              <Text className="text-speakeasy-gold font-medium mb-3">Financial Information</Text>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Text variant="caption" className="text-speakeasy-copper">Deposit</Text>
                  <Text className="text-speakeasy-champagne">£{selectedBooking.deposit_amount || 0}</Text>
                </div>
                <div>
                  <Text variant="caption" className="text-speakeasy-copper">Total Amount</Text>
                  <Text className="text-speakeasy-champagne">£{selectedBooking.total_amount || 0}</Text>
                </div>
                {selectedBooking.drinks_package_name && (
                  <div className="md:col-span-2">
                    <Text variant="caption" className="text-speakeasy-copper">Drinks Package</Text>
                    <Text className="text-speakeasy-gold">{selectedBooking.drinks_package_name}</Text>
                  </div>
                )}
              </div>
            </div>

            {/* Special Requests */}
            {selectedBooking.special_requests && (
              <div>
                <Text className="text-speakeasy-gold font-medium mb-3">Special Requests</Text>
                <Text className="text-speakeasy-champagne/80 italic">
                  {selectedBooking.special_requests}
                </Text>
              </div>
            )}

            {/* Notes */}
            {selectedBooking.notes && (
              <div>
                <Text className="text-speakeasy-gold font-medium mb-3">Internal Notes</Text>
                <Text className="text-speakeasy-champagne/80">
                  {selectedBooking.notes}
                </Text>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4 border-t border-speakeasy-gold/20">
              <Button 
                variant="primary"
                href={`/admin/bookings/${selectedBooking.id}/edit`}
              >
                Edit Booking
              </Button>
              
              {selectedBooking.status === 'pending' && (
                <Button 
                  variant="outline"
                  onClick={() => handleStatusUpdate(selectedBooking.id, 'confirmed')}
                >
                  Confirm Booking
                </Button>
              )}
              
              {selectedBooking.status === 'confirmed' && (
                <Button 
                  variant="outline"
                  onClick={() => handleStatusUpdate(selectedBooking.id, 'arrived')}
                >
                  Mark as Arrived
                </Button>
              )}
              
              <Button 
                variant="ghost"
                onClick={() => setShowDetails(false)}
              >
                Close
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
}