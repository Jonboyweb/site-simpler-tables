'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/molecules';
import { Heading, Text, Badge, Button } from '@/components/atoms';

interface Booking {
  id: string;
  booking_ref: string;
  customer_name: string;
  customer_phone: string;
  customer_email: string;
  party_size: number;
  arrival_time: string;
  table_ids: number[];
  status: 'confirmed' | 'arrived';
  checked_in_at?: string;
  tables?: Array<{
    id: number;
    table_number: number;
    floor: 'upstairs' | 'downstairs';
  }>;
  isLate: boolean;
  hasSpecialRequests: boolean;
  isDrinksPackage: boolean;
}

interface BookingsListProps {
  lastUpdated: string;
  searchQuery: string;
  searchType: 'all' | 'booking_ref' | 'name' | 'phone';
}

export const BookingsList = ({ lastUpdated, searchQuery, searchType }: BookingsListProps) => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [filteredBookings, setFilteredBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'arrival_time' | 'status' | 'customer_name'>('arrival_time');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // Fetch all tonight's bookings
  const fetchBookings = async () => {
    try {
      setError(null);
      const response = await fetch('/api/door-staff/tonight-bookings');

      if (!response.ok) {
        throw new Error('Failed to fetch tonight\'s bookings');
      }

      const data = await response.json();
      setBookings(data.bookings || []);
    } catch (err) {
      console.error('Error fetching bookings:', err);
      setError(err instanceof Error ? err.message : 'Failed to load bookings');
    } finally {
      setLoading(false);
    }
  };

  // Filter bookings based on search
  useEffect(() => {
    let filtered = [...bookings];

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      
      filtered = bookings.filter(booking => {
        switch (searchType) {
          case 'booking_ref':
            return booking.booking_ref.toLowerCase().includes(query);
          case 'name':
            return booking.customer_name.toLowerCase().includes(query);
          case 'phone':
            return booking.customer_phone.replace(/\s/g, '').includes(query.replace(/\s/g, ''));
          case 'all':
          default:
            return (
              booking.booking_ref.toLowerCase().includes(query) ||
              booking.customer_name.toLowerCase().includes(query) ||
              booking.customer_phone.replace(/\s/g, '').includes(query.replace(/\s/g, ''))
            );
        }
      });
    }

    // Sort filtered results
    filtered.sort((a, b) => {
      let compareValue = 0;
      
      switch (sortBy) {
        case 'arrival_time':
          compareValue = a.arrival_time.localeCompare(b.arrival_time);
          break;
        case 'status':
          const statusOrder = { 'confirmed': 0, 'arrived': 1 };
          compareValue = statusOrder[a.status] - statusOrder[b.status];
          break;
        case 'customer_name':
          compareValue = a.customer_name.localeCompare(b.customer_name);
          break;
      }
      
      return sortOrder === 'asc' ? compareValue : -compareValue;
    });

    setFilteredBookings(filtered);
  }, [bookings, searchQuery, searchType, sortBy, sortOrder]);

  useEffect(() => {
    fetchBookings();
  }, [lastUpdated]);

  const getStatusBadge = (booking: Booking) => {
    if (booking.status === 'arrived') {
      return (
        <Badge className="bg-green-900/30 text-green-400 border-green-400/30">
          ✅ Arrived
        </Badge>
      );
    }
    
    if (booking.isLate) {
      return (
        <Badge className="bg-red-900/30 text-red-400 border-red-400/30">
          ⏰ Late
        </Badge>
      );
    }
    
    return (
      <Badge className="bg-blue-900/30 text-blue-400 border-blue-400/30">
        ⏳ Expected
      </Badge>
    );
  };

  const formatTime = (timeString: string) => {
    return new Date(`2000-01-01T${timeString}`).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleSort = (field: typeof sortBy) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <Card key={i} className="p-6 animate-pulse">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="h-4 bg-speakeasy-gold/20 rounded mb-2 w-1/4"></div>
                <div className="h-3 bg-speakeasy-gold/10 rounded mb-1 w-1/2"></div>
                <div className="h-3 bg-speakeasy-gold/10 rounded w-1/3"></div>
              </div>
              <div className="h-8 bg-speakeasy-gold/10 rounded w-20"></div>
            </div>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <Card className="p-8 text-center">
        <div className="text-red-400 mb-4">
          <span className="text-4xl">⚠️</span>
        </div>
        <Heading level={3} className="text-speakeasy-champagne mb-2">
          Error Loading Bookings
        </Heading>
        <Text className="text-speakeasy-copper mb-4">
          {error}
        </Text>
        <Button
          variant="secondary"
          onClick={fetchBookings}
          className="bg-speakeasy-gold text-speakeasy-noir hover:bg-speakeasy-champagne"
        >
          Retry
        </Button>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Sort Controls */}
      <div className="flex flex-wrap gap-2 items-center">
        <Text variant="caption" className="text-speakeasy-champagne/70">
          Sort by:
        </Text>
        
        {[
          { key: 'arrival_time' as const, label: '🕒 Arrival Time' },
          { key: 'status' as const, label: '📊 Status' },
          { key: 'customer_name' as const, label: '👤 Name' }
        ].map(({ key, label }) => (
          <button
            key={key}
            onClick={() => handleSort(key)}
            className={`px-3 py-1 rounded-sm text-xs font-bebas tracking-wider border transition-all ${
              sortBy === key
                ? 'bg-speakeasy-gold/20 text-speakeasy-gold border-speakeasy-gold/50'
                : 'bg-speakeasy-noir/30 text-speakeasy-champagne border-speakeasy-gold/20 hover:bg-speakeasy-gold/10'
            }`}
          >
            {label}
            {sortBy === key && (
              <span className="ml-1">
                {sortOrder === 'asc' ? '↑' : '↓'}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Results Summary */}
      <div className="flex items-center justify-between text-sm">
        <Text className="text-speakeasy-champagne/80">
          {searchQuery ? `Found ${filteredBookings.length} matching bookings` : `${filteredBookings.length} bookings tonight`}
        </Text>
        <Text variant="caption" className="text-speakeasy-copper">
          Last updated: {new Date(lastUpdated).toLocaleTimeString()}
        </Text>
      </div>

      {/* Bookings List */}
      {filteredBookings.length === 0 ? (
        <Card className="p-12 text-center">
          <div className="text-6xl mb-4">
            {searchQuery ? '🔍' : '📅'}
          </div>
          <Heading level={3} className="text-speakeasy-champagne mb-2">
            {searchQuery ? 'No Matching Bookings' : 'No Bookings Tonight'}
          </Heading>
          <Text className="text-speakeasy-copper">
            {searchQuery 
              ? 'Try adjusting your search criteria or search type'
              : 'No bookings scheduled for tonight'
            }
          </Text>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredBookings.map((booking) => (
            <Card key={booking.id} className="p-4 hover:bg-speakeasy-noir/40 transition-colors">
              <div className="flex items-center justify-between">
                {/* Booking Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2">
                    <Heading level={4} className="text-speakeasy-champagne">
                      {booking.customer_name}
                    </Heading>
                    {getStatusBadge(booking)}
                    
                    {/* Special Indicators */}
                    <div className="flex gap-1">
                      {booking.hasSpecialRequests && (
                        <span title="Special requests" className="text-speakeasy-gold">⭐</span>
                      )}
                      {booking.isDrinksPackage && (
                        <span title="Drinks package" className="text-speakeasy-gold">🍾</span>
                      )}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <Text variant="caption" className="text-speakeasy-copper">Ref:</Text>
                      <Text className="text-speakeasy-champagne font-mono">
                        {booking.booking_ref}
                      </Text>
                    </div>
                    
                    <div>
                      <Text variant="caption" className="text-speakeasy-copper">Time:</Text>
                      <Text className="text-speakeasy-champagne">
                        {formatTime(booking.arrival_time)}
                      </Text>
                    </div>
                    
                    <div>
                      <Text variant="caption" className="text-speakeasy-copper">Party:</Text>
                      <Text className="text-speakeasy-champagne">
                        {booking.party_size} guests
                      </Text>
                    </div>
                    
                    <div>
                      <Text variant="caption" className="text-speakeasy-copper">Table:</Text>
                      <Text className="text-speakeasy-champagne">
                        {booking.tables?.map(t => t.table_number).join(', ') || 'TBD'}
                      </Text>
                    </div>
                  </div>

                  <div className="mt-2 text-sm">
                    <Text variant="caption" className="text-speakeasy-copper">Phone:</Text>
                    <Text className="text-speakeasy-champagne ml-2">
                      {booking.customer_phone}
                    </Text>
                  </div>

                  {booking.checked_in_at && (
                    <div className="mt-2 text-sm">
                      <Text variant="caption" className="text-green-400">
                        ✅ Checked in at {new Date(booking.checked_in_at).toLocaleTimeString()}
                      </Text>
                    </div>
                  )}
                </div>

                {/* Table & Floor Info */}
                {booking.tables && booking.tables.length > 0 && (
                  <div className="text-right ml-4">
                    {booking.tables.map((table, index) => (
                      <div key={table.id} className="mb-1">
                        <Badge 
                          variant="outline" 
                          className="text-xs border-speakeasy-gold/30 text-speakeasy-gold"
                        >
                          Table {table.table_number} ({table.floor})
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};