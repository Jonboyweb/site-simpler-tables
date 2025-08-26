'use client';

import { useState } from 'react';
import { Button, Text, Input } from '@/components/atoms';
import { Card, Select } from '@/components/molecules';

interface BookingFiltersProps {
  filters: {
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
  };
  onChange: (filters: any) => void;
  onReset: () => void;
}

export function BookingFilters({ filters, onChange, onReset }: BookingFiltersProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const statusOptions = [
    { value: 'pending', label: 'Pending' },
    { value: 'confirmed', label: 'Confirmed' },
    { value: 'arrived', label: 'Arrived' },
    { value: 'no_show', label: 'No Show' },
    { value: 'cancelled', label: 'Cancelled' },
    { value: 'waitlist', label: 'Waitlist' }
  ];

  const sortOptions = [
    { value: 'booking_date', label: 'Booking Date' },
    { value: 'arrival_time', label: 'Arrival Time' },
    { value: 'created_at', label: 'Created Date' },
    { value: 'customer_name', label: 'Customer Name' }
  ];

  const tableNumbers = Array.from({ length: 16 }, (_, i) => i + 1);

  const quickDateRanges = [
    {
      label: 'Today',
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date().toISOString().split('T')[0]
    },
    {
      label: 'Tomorrow',
      startDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      endDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    },
    {
      label: 'This Week',
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    },
    {
      label: 'Next Week',
      startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      endDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    }
  ];

  const handleStatusToggle = (status: string) => {
    const newStatus = filters.status.includes(status)
      ? filters.status.filter(s => s !== status)
      : [...filters.status, status];
    
    onChange({ status: newStatus });
  };

  const handleTableToggle = (tableNumber: number) => {
    const newTables = filters.tableNumbers.includes(tableNumber)
      ? filters.tableNumbers.filter(t => t !== tableNumber)
      : [...filters.tableNumbers, tableNumber];
    
    onChange({ tableNumbers: newTables });
  };

  const handleDateRangeSelect = (range: { startDate: string; endDate: string }) => {
    onChange({
      dateRange: range
    });
  };

  const getActiveFiltersCount = () => {
    let count = 0;
    if (filters.status.length > 0) count++;
    if (filters.tableNumbers.length > 0) count++;
    if (filters.searchTerm.trim()) count++;
    if (filters.partySize.min > 1 || filters.partySize.max < 20) count++;
    return count;
  };

  const activeFiltersCount = getActiveFiltersCount();

  return (
    <Card className="p-4">
      <div className="space-y-4">
        {/* Basic Filters - Always Visible */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search */}
          <div>
            <Text variant="caption" className="text-speakeasy-copper mb-2">Search</Text>
            <Input
              type="text"
              placeholder="Customer name, booking ref..."
              value={filters.searchTerm}
              onChange={(e) => onChange({ searchTerm: e.target.value })}
              className="w-full"
            />
          </div>

          {/* Date Range Start */}
          <div>
            <Text variant="caption" className="text-speakeasy-copper mb-2">From Date</Text>
            <Input
              type="date"
              value={filters.dateRange.startDate}
              onChange={(e) => onChange({
                dateRange: { ...filters.dateRange, startDate: e.target.value }
              })}
              className="w-full"
            />
          </div>

          {/* Date Range End */}
          <div>
            <Text variant="caption" className="text-speakeasy-copper mb-2">To Date</Text>
            <Input
              type="date"
              value={filters.dateRange.endDate}
              onChange={(e) => onChange({
                dateRange: { ...filters.dateRange, endDate: e.target.value }
              })}
              className="w-full"
            />
          </div>

          {/* Sort */}
          <div>
            <Text variant="caption" className="text-speakeasy-copper mb-2">Sort By</Text>
            <div className="flex gap-2">
              <Select
                value={filters.sortBy}
                onValueChange={(value) => onChange({ sortBy: value })}
                options={sortOptions}
                className="flex-1"
              />
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onChange({ 
                  sortOrder: filters.sortOrder === 'asc' ? 'desc' : 'asc' 
                })}
                className="px-3"
              >
                {filters.sortOrder === 'asc' ? '↑' : '↓'}
              </Button>
            </div>
          </div>
        </div>

        {/* Quick Date Range Buttons */}
        <div className="flex flex-wrap gap-2">
          <Text variant="caption" className="text-speakeasy-copper mr-2 self-center">Quick:</Text>
          {quickDateRanges.map((range) => (
            <Button
              key={range.label}
              variant="ghost"
              size="sm"
              onClick={() => handleDateRangeSelect(range)}
              className="text-xs"
            >
              {range.label}
            </Button>
          ))}
        </div>

        {/* Advanced Filters Toggle */}
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-2"
          >
            <span>{isExpanded ? '△' : '▽'}</span>
            Advanced Filters
            {activeFiltersCount > 0 && (
              <span className="px-2 py-1 bg-speakeasy-gold/20 text-speakeasy-gold rounded-full text-xs">
                {activeFiltersCount}
              </span>
            )}
          </Button>
          
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={onReset}>
              Clear All
            </Button>
          </div>
        </div>

        {/* Advanced Filters - Collapsible */}
        {isExpanded && (
          <div className="space-y-6 pt-4 border-t border-speakeasy-gold/20">
            {/* Status Filters */}
            <div>
              <Text variant="caption" className="text-speakeasy-copper mb-3">Status</Text>
              <div className="flex flex-wrap gap-2">
                {statusOptions.map((option) => (
                  <Button
                    key={option.value}
                    variant={filters.status.includes(option.value) ? 'primary' : 'ghost'}
                    size="sm"
                    onClick={() => handleStatusToggle(option.value)}
                    className="text-xs"
                  >
                    {option.label}
                  </Button>
                ))}
              </div>
            </div>

            {/* Table Number Filters */}
            <div>
              <Text variant="caption" className="text-speakeasy-copper mb-3">Table Numbers</Text>
              <div className="grid grid-cols-8 gap-2">
                {tableNumbers.map((tableNum) => (
                  <Button
                    key={tableNum}
                    variant={filters.tableNumbers.includes(tableNum) ? 'primary' : 'ghost'}
                    size="sm"
                    onClick={() => handleTableToggle(tableNum)}
                    className="aspect-square text-xs"
                  >
                    {tableNum}
                  </Button>
                ))}
              </div>
              {filters.tableNumbers.length > 0 && (
                <div className="mt-2">
                  <Text variant="caption" className="text-speakeasy-champagne/60">
                    Selected: {filters.tableNumbers.sort((a, b) => a - b).join(', ')}
                  </Text>
                </div>
              )}
            </div>

            {/* Party Size Range */}
            <div>
              <Text variant="caption" className="text-speakeasy-copper mb-3">Party Size Range</Text>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Text variant="caption" className="text-speakeasy-champagne/60 mb-1">Min</Text>
                  <Input
                    type="number"
                    min="1"
                    max="20"
                    value={filters.partySize.min}
                    onChange={(e) => onChange({
                      partySize: { ...filters.partySize, min: parseInt(e.target.value) || 1 }
                    })}
                  />
                </div>
                <div>
                  <Text variant="caption" className="text-speakeasy-champagne/60 mb-1">Max</Text>
                  <Input
                    type="number"
                    min="1"
                    max="20"
                    value={filters.partySize.max}
                    onChange={(e) => onChange({
                      partySize: { ...filters.partySize, max: parseInt(e.target.value) || 20 }
                    })}
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}