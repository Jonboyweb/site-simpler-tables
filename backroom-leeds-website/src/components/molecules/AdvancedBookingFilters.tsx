'use client';

import { useState, useCallback } from 'react';
import { Button, Text } from '@/components/atoms';
import { Card } from '@/components/molecules';
import { cn } from '@/lib/utils';

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

interface AdvancedBookingFiltersProps {
  filters: BookingFilters;
  onFiltersChange: (filters: BookingFilters) => void;
  onReset: () => void;
  isExpanded: boolean;
  onToggleExpanded: () => void;
  totalBookings: number;
  filteredBookings: number;
  className?: string;
}

export const AdvancedBookingFilters = ({
  filters,
  onFiltersChange,
  onReset,
  isExpanded,
  onToggleExpanded,
  totalBookings,
  filteredBookings,
  className,
}: AdvancedBookingFiltersProps) => {
  const [localFilters, setLocalFilters] = useState(filters);

  const updateFilters = useCallback((updates: Partial<BookingFilters>) => {
    const newFilters = { ...localFilters, ...updates };
    setLocalFilters(newFilters);
    onFiltersChange(newFilters);
  }, [localFilters, onFiltersChange]);

  const handleStatusToggle = (status: string) => {
    const currentStatuses = localFilters.status;
    const newStatuses = currentStatuses.includes(status)
      ? currentStatuses.filter(s => s !== status)
      : [...currentStatuses, status];
    
    updateFilters({ status: newStatuses });
  };

  const handlePaymentStatusToggle = (status: string) => {
    const currentStatuses = localFilters.paymentStatus;
    const newStatuses = currentStatuses.includes(status)
      ? currentStatuses.filter(s => s !== status)
      : [...currentStatuses, status];
    
    updateFilters({ paymentStatus: newStatuses });
  };

  const handleTableToggle = (tableNumber: number) => {
    const currentTables = localFilters.tables;
    const newTables = currentTables.includes(tableNumber)
      ? currentTables.filter(t => t !== tableNumber)
      : [...currentTables, tableNumber];
    
    updateFilters({ tables: newTables });
  };

  const statusOptions = [
    { value: 'pending', label: 'Pending', color: 'bg-yellow-500/20 text-yellow-400' },
    { value: 'confirmed', label: 'Confirmed', color: 'bg-blue-500/20 text-blue-400' },
    { value: 'arrived', label: 'Arrived', color: 'bg-green-500/20 text-green-400' },
    { value: 'no_show', label: 'No Show', color: 'bg-red-500/20 text-red-400' },
    { value: 'cancelled', label: 'Cancelled', color: 'bg-gray-500/20 text-gray-400' },
  ];

  const paymentStatusOptions = [
    { value: 'paid', label: 'Deposit Paid', color: 'bg-green-500/20 text-green-400' },
    { value: 'partial', label: 'Partial Payment', color: 'bg-yellow-500/20 text-yellow-400' },
    { value: 'pending', label: 'Payment Pending', color: 'bg-red-500/20 text-red-400' },
    { value: 'refunded', label: 'Refunded', color: 'bg-gray-500/20 text-gray-400' },
  ];

  const eventTypes = [
    { value: 'la_fiesta', label: 'LA FIESTA (Friday)' },
    { value: 'shhh', label: 'SHHH! (Saturday)' },
    { value: 'nostalgia', label: 'NOSTALGIA (Sunday)' },
    { value: 'private', label: 'Private Event' },
    { value: 'walk_in', label: 'Walk-in' },
  ];

  const arrivalTimes = [
    '11:00 PM', '11:30 PM', '12:00 AM', '12:30 AM', '1:00 AM'
  ];

  const sortOptions = [
    { value: 'booking_date', label: 'Date' },
    { value: 'arrival_time', label: 'Arrival Time' },
    { value: 'customer_name', label: 'Customer Name' },
    { value: 'party_size', label: 'Party Size' },
    { value: 'created_at', label: 'Booking Created' },
    { value: 'deposit_amount', label: 'Deposit Amount' },
  ];

  return (
    <Card className={cn('overflow-hidden', className)}>
      {/* Filter Header */}
      <div className="p-4 border-b border-speakeasy-gold/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={onToggleExpanded}
              className="text-speakeasy-gold hover:bg-speakeasy-gold/10"
            >
              <span className={cn(
                "transform transition-transform duration-200",
                isExpanded ? "rotate-90" : "rotate-0"
              )}>
                ▶️
              </span>
              <Text className="font-bebas tracking-wider ml-2">
                Advanced Filters
              </Text>
            </Button>
            <div className="flex items-center gap-2">
              <Text className="text-speakeasy-champagne/60 text-sm">
                {filteredBookings} of {totalBookings} bookings
              </Text>
              {(filteredBookings !== totalBookings) && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onReset}
                  className="text-speakeasy-copper hover:text-speakeasy-gold text-xs"
                >
                  Clear All
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Quick Filters (Always Visible) */}
        <div className="mt-4 grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-speakeasy-champagne mb-2">
              Date From
            </label>
            <input
              type="date"
              value={localFilters.dateRange.from}
              onChange={(e) => updateFilters({
                dateRange: { ...localFilters.dateRange, from: e.target.value }
              })}
              className="w-full px-3 py-2 bg-speakeasy-noir/50 border border-speakeasy-gold/20 rounded text-speakeasy-champagne focus:outline-none focus:border-speakeasy-gold"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-speakeasy-champagne mb-2">
              Date To
            </label>
            <input
              type="date"
              value={localFilters.dateRange.to}
              onChange={(e) => updateFilters({
                dateRange: { ...localFilters.dateRange, to: e.target.value }
              })}
              className="w-full px-3 py-2 bg-speakeasy-noir/50 border border-speakeasy-gold/20 rounded text-speakeasy-champagne focus:outline-none focus:border-speakeasy-gold"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-speakeasy-champagne mb-2">
              Search
            </label>
            <input
              type="text"
              placeholder="Name, email, reference..."
              value={localFilters.searchTerm}
              onChange={(e) => updateFilters({ searchTerm: e.target.value })}
              className="w-full px-3 py-2 bg-speakeasy-noir/50 border border-speakeasy-gold/20 rounded text-speakeasy-champagne focus:outline-none focus:border-speakeasy-gold"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-speakeasy-champagne mb-2">
              Sort By
            </label>
            <div className="flex gap-2">
              <select
                value={localFilters.sortBy}
                onChange={(e) => updateFilters({ sortBy: e.target.value })}
                className="flex-1 px-3 py-2 bg-speakeasy-noir/50 border border-speakeasy-gold/20 rounded text-speakeasy-champagne focus:outline-none focus:border-speakeasy-gold"
              >
                {sortOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <Button
                size="sm"
                variant="outline"
                onClick={() => updateFilters({ 
                  sortOrder: localFilters.sortOrder === 'asc' ? 'desc' : 'asc' 
                })}
                className="px-3 text-speakeasy-champagne border-speakeasy-gold/20"
              >
                {localFilters.sortOrder === 'asc' ? '↑' : '↓'}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Expanded Filters */}
      {isExpanded && (
        <div className="p-4 space-y-6 bg-speakeasy-noir/20">
          {/* Booking Status */}
          <div>
            <Text className="text-speakeasy-gold font-bebas text-sm mb-3">
              Booking Status
            </Text>
            <div className="flex flex-wrap gap-2">
              {statusOptions.map(status => (
                <button
                  key={status.value}
                  onClick={() => handleStatusToggle(status.value)}
                  className={cn(
                    'px-3 py-1 rounded-full text-xs font-medium transition-all',
                    localFilters.status.includes(status.value)
                      ? status.color
                      : 'bg-speakeasy-noir/50 text-speakeasy-champagne/60 border border-speakeasy-gold/20'
                  )}
                >
                  {status.label}
                </button>
              ))}
            </div>
          </div>

          {/* Payment Status */}
          <div>
            <Text className="text-speakeasy-gold font-bebas text-sm mb-3">
              Payment Status
            </Text>
            <div className="flex flex-wrap gap-2">
              {paymentStatusOptions.map(status => (
                <button
                  key={status.value}
                  onClick={() => handlePaymentStatusToggle(status.value)}
                  className={cn(
                    'px-3 py-1 rounded-full text-xs font-medium transition-all',
                    localFilters.paymentStatus.includes(status.value)
                      ? status.color
                      : 'bg-speakeasy-noir/50 text-speakeasy-champagne/60 border border-speakeasy-gold/20'
                  )}
                >
                  {status.label}
                </button>
              ))}
            </div>
          </div>

          {/* Tables */}
          <div>
            <Text className="text-speakeasy-gold font-bebas text-sm mb-3">
              Table Numbers
            </Text>
            <div className="grid grid-cols-8 gap-2">
              {Array.from({ length: 16 }, (_, i) => i + 1).map(tableNumber => (
                <button
                  key={tableNumber}
                  onClick={() => handleTableToggle(tableNumber)}
                  className={cn(
                    'aspect-square rounded-lg text-sm font-medium transition-all',
                    'border hover:border-speakeasy-gold',
                    localFilters.tables.includes(tableNumber)
                      ? 'bg-speakeasy-gold/20 text-speakeasy-gold border-speakeasy-gold'
                      : 'bg-speakeasy-noir/50 text-speakeasy-champagne/60 border-speakeasy-gold/20'
                  )}
                >
                  {tableNumber}
                </button>
              ))}
            </div>
          </div>

          {/* Event Type & Time */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Text className="text-speakeasy-gold font-bebas text-sm mb-3">
                Event Type
              </Text>
              <select
                value={localFilters.eventType}
                onChange={(e) => updateFilters({ eventType: e.target.value })}
                className="w-full px-3 py-2 bg-speakeasy-noir/50 border border-speakeasy-gold/20 rounded text-speakeasy-champagne focus:outline-none focus:border-speakeasy-gold"
              >
                <option value="">All Events</option>
                {eventTypes.map(event => (
                  <option key={event.value} value={event.value}>
                    {event.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <Text className="text-speakeasy-gold font-bebas text-sm mb-3">
                Arrival Time
              </Text>
              <select
                value={localFilters.arrivalTime}
                onChange={(e) => updateFilters({ arrivalTime: e.target.value })}
                className="w-full px-3 py-2 bg-speakeasy-noir/50 border border-speakeasy-gold/20 rounded text-speakeasy-champagne focus:outline-none focus:border-speakeasy-gold"
              >
                <option value="">All Times</option>
                {arrivalTimes.map(time => (
                  <option key={time} value={time}>
                    {time}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Party Size Range */}
          <div>
            <Text className="text-speakeasy-gold font-bebas text-sm mb-3">
              Party Size Range
            </Text>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-speakeasy-champagne/60 mb-1">
                  Minimum
                </label>
                <input
                  type="number"
                  min="1"
                  max="12"
                  value={localFilters.partySize.min}
                  onChange={(e) => updateFilters({
                    partySize: { ...localFilters.partySize, min: parseInt(e.target.value) || 1 }
                  })}
                  className="w-full px-3 py-2 bg-speakeasy-noir/50 border border-speakeasy-gold/20 rounded text-speakeasy-champagne focus:outline-none focus:border-speakeasy-gold"
                />
              </div>
              <div>
                <label className="block text-xs text-speakeasy-champagne/60 mb-1">
                  Maximum
                </label>
                <input
                  type="number"
                  min="1"
                  max="12"
                  value={localFilters.partySize.max}
                  onChange={(e) => updateFilters({
                    partySize: { ...localFilters.partySize, max: parseInt(e.target.value) || 12 }
                  })}
                  className="w-full px-3 py-2 bg-speakeasy-noir/50 border border-speakeasy-gold/20 rounded text-speakeasy-champagne focus:outline-none focus:border-speakeasy-gold"
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
};

export default AdvancedBookingFilters;