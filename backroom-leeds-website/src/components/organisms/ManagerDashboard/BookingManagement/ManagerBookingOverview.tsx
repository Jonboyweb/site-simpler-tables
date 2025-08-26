'use client';

import { useState, useEffect } from 'react';
import { Heading, Text, Button, LoadingSpinner } from '@/components/atoms';
import { Card } from '@/components/molecules';
import { createClient } from '@/lib/supabase/client';

// Import booking management components
import { BookingsList } from './BookingsList';
import { AvailabilityViewer } from './AvailabilityViewer';
import { BookingFilters } from './BookingFilters';
import { BulkOperations } from './BulkOperations';

interface BookingSummary {
  total_bookings: number;
  confirmed_bookings: number;
  pending_bookings: number;
  cancelled_bookings: number;
  no_shows: number;
  total_revenue: number;
  average_party_size: number;
  tables_booked: number;
}

interface BookingFiltersState {
  dateRange: {
    startDate: string;
    endDate: string;
  };
  status: string[];
  tableNumbers: number[];
  partySize: {
    min: number;
    max: number;
  };
  searchTerm: string;
  sortBy: 'created_at' | 'booking_date' | 'arrival_time' | 'customer_name';
  sortOrder: 'asc' | 'desc';
}

export function ManagerBookingOverview() {
  const [summary, setSummary] = useState<BookingSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedBookings, setSelectedBookings] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<'list' | 'availability' | 'analytics'>('list');
  
  // Filter states
  const [filters, setFilters] = useState<BookingFiltersState>({
    dateRange: {
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    },
    status: [],
    tableNumbers: [],
    partySize: { min: 1, max: 20 },
    searchTerm: '',
    sortBy: 'booking_date',
    sortOrder: 'desc'
  });

  const supabase = createClient();

  useEffect(() => {
    fetchBookingSummary();
  }, [filters]);

  const fetchBookingSummary = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch booking summary based on current filters
      const { data, error: summaryError } = await supabase
        .rpc('get_booking_summary', {
          start_date: filters.dateRange.startDate,
          end_date: filters.dateRange.endDate,
          status_filter: filters.status.length > 0 ? filters.status : null,
          table_filter: filters.tableNumbers.length > 0 ? filters.tableNumbers : null
        });

      if (summaryError) throw summaryError;

      setSummary(data[0] || {
        total_bookings: 0,
        confirmed_bookings: 0,
        pending_bookings: 0,
        cancelled_bookings: 0,
        no_shows: 0,
        total_revenue: 0,
        average_party_size: 0,
        tables_booked: 0
      });
    } catch (err) {
      console.error('Error fetching booking summary:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch booking summary');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (newFilters: Partial<BookingFiltersState>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  };

  const handleBookingSelection = (bookingIds: string[], selectAll?: boolean) => {
    if (selectAll !== undefined) {
      // Handle select all/none
      setSelectedBookings(selectAll ? bookingIds : []);
    } else {
      setSelectedBookings(bookingIds);
    }
  };

  const tabOptions = [
    { key: 'list', label: 'Bookings List', icon: '📋' },
    { key: 'availability', label: 'Availability', icon: '📅' },
    { key: 'analytics', label: 'Analytics', icon: '📊' }
  ] as const;

  if (loading && !summary) {
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
          <Heading level={2} className="text-speakeasy-gold mb-2">
            Booking Management
          </Heading>
          <Text className="text-speakeasy-champagne/70">
            Comprehensive booking operations and analytics
          </Text>
        </div>
        
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" href="/admin/bookings/export">
            📤 Export Data
          </Button>
          <Button variant="primary" href="/admin/bookings/create">
            ➕ New Booking
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="p-4 bg-gradient-to-br from-speakeasy-burgundy/20 to-speakeasy-noir/20">
            <Text className="text-xs text-speakeasy-copper uppercase tracking-wide">Total Bookings</Text>
            <Text className="text-2xl font-bebas text-speakeasy-champagne mt-1">
              {summary.total_bookings}
            </Text>
            <Text className="text-xs text-speakeasy-champagne/60">
              {summary.confirmed_bookings} confirmed
            </Text>
          </Card>

          <Card className="p-4 bg-gradient-to-br from-green-900/20 to-speakeasy-noir/20">
            <Text className="text-xs text-speakeasy-copper uppercase tracking-wide">Revenue</Text>
            <Text className="text-2xl font-bebas text-green-400 mt-1">
              £{summary.total_revenue?.toLocaleString() || 0}
            </Text>
            <Text className="text-xs text-speakeasy-champagne/60">
              Confirmed bookings
            </Text>
          </Card>

          <Card className="p-4 bg-gradient-to-br from-blue-900/20 to-speakeasy-noir/20">
            <Text className="text-xs text-speakeasy-copper uppercase tracking-wide">Tables Booked</Text>
            <Text className="text-2xl font-bebas text-blue-400 mt-1">
              {summary.tables_booked}/16
            </Text>
            <Text className="text-xs text-speakeasy-champagne/60">
              {((summary.tables_booked / 16) * 100).toFixed(0)}% utilization
            </Text>
          </Card>

          <Card className="p-4 bg-gradient-to-br from-speakeasy-gold/20 to-speakeasy-copper/20">
            <Text className="text-xs text-speakeasy-copper uppercase tracking-wide">Avg Party Size</Text>
            <Text className="text-2xl font-bebas text-speakeasy-gold mt-1">
              {summary.average_party_size?.toFixed(1) || '0.0'}
            </Text>
            <Text className="text-xs text-speakeasy-champagne/60">
              Guests per booking
            </Text>
          </Card>
        </div>
      )}

      {/* Issues Alert */}
      {summary && (summary.pending_bookings > 10 || summary.no_shows > 3) && (
        <Card className="border-yellow-400/20 bg-yellow-900/10 p-4">
          <div className="flex items-center justify-between">
            <div>
              <Text className="text-yellow-400 font-medium mb-1">
                Attention Required
              </Text>
              <Text className="text-yellow-300 text-sm">
                {summary.pending_bookings > 10 && `${summary.pending_bookings} pending confirmations • `}
                {summary.no_shows > 3 && `${summary.no_shows} no-shows need follow-up`}
              </Text>
            </div>
            <div className="flex gap-2">
              {summary.pending_bookings > 10 && (
                <Button variant="ghost" size="sm" href="/admin/bookings?status=pending">
                  Review Pending
                </Button>
              )}
              {summary.no_shows > 3 && (
                <Button variant="ghost" size="sm" href="/admin/bookings?status=no_show">
                  Review No-Shows
                </Button>
              )}
            </div>
          </div>
        </Card>
      )}

      {/* Tab Navigation */}
      <Card className="p-1">
        <div className="flex gap-1">
          {tabOptions.map((option) => (
            <Button
              key={option.key}
              variant={activeTab === option.key ? 'primary' : 'ghost'}
              size="sm"
              onClick={() => setActiveTab(option.key)}
              className="flex items-center gap-2"
            >
              <span>{option.icon}</span>
              {option.label}
            </Button>
          ))}
        </div>
      </Card>

      {/* Filters */}
      <BookingFilters 
        filters={filters}
        onChange={handleFilterChange}
        onReset={() => setFilters({
          dateRange: {
            startDate: new Date().toISOString().split('T')[0],
            endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
          },
          status: [],
          tableNumbers: [],
          partySize: { min: 1, max: 20 },
          searchTerm: '',
          sortBy: 'booking_date',
          sortOrder: 'desc'
        })}
      />

      {/* Bulk Operations */}
      {selectedBookings.length > 0 && (
        <BulkOperations 
          selectedBookings={selectedBookings}
          onComplete={() => {
            setSelectedBookings([]);
            fetchBookingSummary();
          }}
        />
      )}

      {/* Tab Content */}
      <div className="min-h-[400px]">
        {activeTab === 'list' && (
          <BookingsList 
            filters={filters}
            selectedBookings={selectedBookings}
            onSelectionChange={handleBookingSelection}
            onBookingUpdate={fetchBookingSummary}
          />
        )}
        
        {activeTab === 'availability' && (
          <AvailabilityViewer 
            dateRange={filters.dateRange}
          />
        )}
        
        {activeTab === 'analytics' && (
          <Card className="p-8 text-center">
            <Heading level={3} className="text-speakeasy-gold mb-4">
              Booking Analytics
            </Heading>
            <Text className="text-speakeasy-champagne/70">
              Advanced booking analytics and insights coming soon.
            </Text>
            <Button variant="outline" className="mt-4" href="/admin/reports">
              View Reports Section
            </Button>
          </Card>
        )}
      </div>

      {error && (
        <Card className="border-red-400/20 bg-red-900/20 p-4">
          <Text className="text-red-300">Error: {error}</Text>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={fetchBookingSummary}
            className="mt-2 text-red-300 hover:text-red-200"
          >
            Retry
          </Button>
        </Card>
      )}
    </div>
  );
}