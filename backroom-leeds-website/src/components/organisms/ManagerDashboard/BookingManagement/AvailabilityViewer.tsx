'use client';

import { useState, useEffect } from 'react';
import { Heading, Text, Button, LoadingSpinner } from '@/components/atoms';
import { Card } from '@/components/molecules';
import { createClient } from '@/lib/supabase/client';

interface AvailabilityViewerProps {
  dateRange: {
    startDate: string;
    endDate: string;
  };
}

interface TableAvailability {
  table_number: number;
  floor: 'upstairs' | 'downstairs';
  capacity: number;
  bookings: {
    [date: string]: {
      arrival_time: string;
      departure_time?: string;
      booking_ref: string;
      customer_name: string;
      party_size: number;
      status: string;
    }[];
  };
}

export function AvailabilityViewer({ dateRange }: AvailabilityViewerProps) {
  const [availability, setAvailability] = useState<TableAvailability[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState(dateRange.startDate);
  
  const supabase = createClient();

  useEffect(() => {
    fetchAvailability();
  }, [dateRange, selectedDate]);

  const fetchAvailability = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get all tables with their bookings for the selected date range
      const { data: tablesData, error: tablesError } = await supabase
        .from('venue_tables')
        .select('*')
        .order('table_number');

      if (tablesError) throw tablesError;

      // Get bookings for the date range
      const { data: bookingsData, error: bookingsError } = await supabase
        .from('bookings')
        .select(`
          id, booking_ref, customer_name, party_size, 
          booking_date, arrival_time, status, table_ids
        `)
        .gte('booking_date', dateRange.startDate)
        .lte('booking_date', dateRange.endDate)
        .in('status', ['confirmed', 'arrived', 'pending']);

      if (bookingsError) throw bookingsError;

      // Transform data into availability format
      const availabilityData: TableAvailability[] = tablesData?.map(table => {
        const tableBookings: { [date: string]: any[] } = {};
        
        // Group bookings by date for this table
        bookingsData?.forEach(booking => {
          if (booking.table_ids?.includes(table.table_number)) {
            const date = booking.booking_date;
            if (!tableBookings[date]) {
              tableBookings[date] = [];
            }
            tableBookings[date].push({
              arrival_time: booking.arrival_time,
              departure_time: calculateDepartureTime(booking.arrival_time),
              booking_ref: booking.booking_ref,
              customer_name: booking.customer_name,
              party_size: booking.party_size,
              status: booking.status
            });
          }
        });

        return {
          table_number: table.table_number,
          floor: table.floor as 'upstairs' | 'downstairs',
          capacity: table.capacity,
          bookings: tableBookings
        };
      }) || [];

      setAvailability(availabilityData);
    } catch (err) {
      console.error('Error fetching availability:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch availability');
    } finally {
      setLoading(false);
    }
  };

  const calculateDepartureTime = (arrivalTime: string): string => {
    // Estimate 4 hours duration for each booking
    const [hours, minutes] = arrivalTime.split(':').map(Number);
    const departureHours = (hours + 4) % 24;
    return `${departureHours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  };

  const getDatesBetween = (startDate: string, endDate: string): string[] => {
    const dates = [];
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    while (start <= end) {
      dates.push(start.toISOString().split('T')[0]);
      start.setDate(start.getDate() + 1);
    }
    
    return dates;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      weekday: 'short',
      day: 'numeric',
      month: 'short'
    });
  };

  const isTableAvailable = (table: TableAvailability, date: string, time: string): boolean => {
    const bookings = table.bookings[date] || [];
    const checkTime = parseInt(time.replace(':', ''));
    
    return !bookings.some(booking => {
      const arrivalTime = parseInt(booking.arrival_time.replace(':', ''));
      const departureTime = parseInt(booking.departure_time?.replace(':', '') || '2359');
      
      return checkTime >= arrivalTime && checkTime < departureTime;
    });
  };

  const getTableStatusForDate = (table: TableAvailability, date: string) => {
    const bookings = table.bookings[date] || [];
    if (bookings.length === 0) return 'available';
    
    const hasConfirmed = bookings.some(b => b.status === 'confirmed' || b.status === 'arrived');
    const hasPending = bookings.some(b => b.status === 'pending');
    
    if (hasConfirmed) return 'booked';
    if (hasPending) return 'pending';
    return 'available';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available': return 'bg-green-900/20 border-green-400/20 text-green-300';
      case 'booked': return 'bg-red-900/20 border-red-400/20 text-red-300';
      case 'pending': return 'bg-yellow-900/20 border-yellow-400/20 text-yellow-300';
      default: return 'bg-speakeasy-burgundy/20 border-speakeasy-gold/20 text-speakeasy-champagne';
    }
  };

  const dates = getDatesBetween(dateRange.startDate, dateRange.endDate);
  const upstairsTables = availability.filter(t => t.floor === 'upstairs');
  const downstairsTables = availability.filter(t => t.floor === 'downstairs');

  if (loading) {
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
        <Button variant="ghost" size="sm" onClick={fetchAvailability} className="mt-2">
          Retry
        </Button>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <Heading level={3} className="text-speakeasy-gold">
            Table Availability Overview
          </Heading>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-sm">
              <div className="w-3 h-3 rounded bg-green-900/40 border border-green-400/40" />
              <Text variant="caption">Available</Text>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <div className="w-3 h-3 rounded bg-yellow-900/40 border border-yellow-400/40" />
              <Text variant="caption">Pending</Text>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <div className="w-3 h-3 rounded bg-red-900/40 border border-red-400/40" />
              <Text variant="caption">Booked</Text>
            </div>
          </div>
        </div>

        {/* Date Navigation */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {dates.map(date => (
            <Button
              key={date}
              variant={selectedDate === date ? 'primary' : 'ghost'}
              size="sm"
              onClick={() => setSelectedDate(date)}
              className="whitespace-nowrap"
            >
              {formatDate(date)}
            </Button>
          ))}
        </div>

        {/* Upstairs Tables */}
        <div className="mb-8">
          <Text className="text-speakeasy-gold font-medium mb-4">Upstairs Tables</Text>
          <div className="grid grid-cols-4 md:grid-cols-8 gap-3">
            {upstairsTables.map(table => {
              const status = getTableStatusForDate(table, selectedDate);
              const bookings = table.bookings[selectedDate] || [];
              
              return (
                <div
                  key={table.table_number}
                  className={`p-3 rounded-lg border text-center hover:scale-105 transition-transform ${getStatusColor(status)}`}
                >
                  <Text className="font-bebas text-lg">
                    T{table.table_number}
                  </Text>
                  <Text variant="caption" className="opacity-80">
                    Cap: {table.capacity}
                  </Text>
                  {bookings.length > 0 && (
                    <div className="mt-2 space-y-1">
                      {bookings.slice(0, 1).map((booking, index) => (
                        <div key={index} className="text-xs opacity-90">
                          {booking.arrival_time.slice(0, 5)}
                        </div>
                      ))}
                      {bookings.length > 1 && (
                        <Text variant="caption" className="opacity-70">
                          +{bookings.length - 1} more
                        </Text>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Downstairs Tables */}
        <div>
          <Text className="text-speakeasy-gold font-medium mb-4">Downstairs Tables</Text>
          <div className="grid grid-cols-4 md:grid-cols-8 gap-3">
            {downstairsTables.map(table => {
              const status = getTableStatusForDate(table, selectedDate);
              const bookings = table.bookings[selectedDate] || [];
              
              return (
                <div
                  key={table.table_number}
                  className={`p-3 rounded-lg border text-center hover:scale-105 transition-transform ${getStatusColor(status)}`}
                >
                  <Text className="font-bebas text-lg">
                    T{table.table_number}
                  </Text>
                  <Text variant="caption" className="opacity-80">
                    Cap: {table.capacity}
                  </Text>
                  {bookings.length > 0 && (
                    <div className="mt-2 space-y-1">
                      {bookings.slice(0, 1).map((booking, index) => (
                        <div key={index} className="text-xs opacity-90">
                          {booking.arrival_time.slice(0, 5)}
                        </div>
                      ))}
                      {bookings.length > 1 && (
                        <Text variant="caption" className="opacity-70">
                          +{bookings.length - 1} more
                        </Text>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Selected Date Bookings Details */}
        {selectedDate && (
          <div className="mt-8 pt-6 border-t border-speakeasy-gold/20">
            <Text className="text-speakeasy-gold font-medium mb-4">
              Bookings for {formatDate(selectedDate)}
            </Text>
            
            <div className="space-y-3 max-h-60 overflow-y-auto">
              {availability
                .filter(table => table.bookings[selectedDate]?.length > 0)
                .map(table => (
                  <div key={table.table_number} className="border border-speakeasy-gold/20 rounded-lg p-3">
                    <Text className="font-medium text-speakeasy-champagne mb-2">
                      Table {table.table_number} ({table.floor})
                    </Text>
                    <div className="space-y-2">
                      {table.bookings[selectedDate]?.map((booking, index) => (
                        <div key={index} className="flex items-center justify-between text-sm">
                          <div>
                            <span className="text-speakeasy-gold">{booking.arrival_time.slice(0, 5)}</span>
                            <span className="text-speakeasy-champagne ml-2">{booking.customer_name}</span>
                            <span className="text-speakeasy-champagne/60 ml-1">({booking.party_size})</span>
                          </div>
                          <div>
                            <span className="text-speakeasy-copper text-xs">{booking.booking_ref}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              
              {availability.filter(table => table.bookings[selectedDate]?.length > 0).length === 0 && (
                <Text className="text-speakeasy-champagne/60 text-center py-4">
                  No bookings for this date
                </Text>
              )}
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}