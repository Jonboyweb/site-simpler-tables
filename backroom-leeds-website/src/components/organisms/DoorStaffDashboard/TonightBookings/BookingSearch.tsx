'use client';

import { useState } from 'react';
import { Input } from '@/components/atoms';
import { Select } from '@/components/molecules';

interface BookingSearchProps {
  searchQuery: string;
  onSearchQueryChange: (query: string) => void;
  searchType: 'all' | 'booking_ref' | 'name' | 'phone';
  onSearchTypeChange: (type: 'all' | 'booking_ref' | 'name' | 'phone') => void;
}

export const BookingSearch = ({
  searchQuery,
  onSearchQueryChange,
  searchType,
  onSearchTypeChange
}: BookingSearchProps) => {
  const [isFocused, setIsFocused] = useState(false);

  const searchTypeOptions = [
    { value: 'all', label: '🔍 All Fields' },
    { value: 'booking_ref', label: '📄 Booking Ref' },
    { value: 'name', label: '👤 Customer Name' },
    { value: 'phone', label: '📞 Phone Number' }
  ];

  const getPlaceholder = () => {
    switch (searchType) {
      case 'booking_ref':
        return 'Enter booking reference (BRL-2025-...)';
      case 'name':
        return 'Enter customer name';
      case 'phone':
        return 'Enter phone number';
      default:
        return 'Search bookings by name, reference, or phone...';
    }
  };

  return (
    <div className="bg-speakeasy-noir/30 p-4 rounded-sm border border-speakeasy-gold/20">
      <div className="flex flex-col md:flex-row gap-4">
        {/* Search Type Selector */}
        <div className="md:w-48">
          <Select
            options={searchTypeOptions}
            value={searchType}
            onChange={onSearchTypeChange}
            placeholder="Search Type"
            className="bg-speakeasy-noir/50 border-speakeasy-gold/30 text-speakeasy-champagne"
          />
        </div>

        {/* Search Input */}
        <div className="flex-1 relative">
          <div className={`relative transition-all duration-200 ${
            isFocused ? 'transform scale-[1.01]' : ''
          }`}>
            <Input
              type="text"
              placeholder={getPlaceholder()}
              value={searchQuery}
              onChange={(e) => onSearchQueryChange(e.target.value)}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              className="w-full pl-12 pr-12 py-3 bg-speakeasy-noir/50 border-speakeasy-gold/30 text-speakeasy-champagne placeholder-speakeasy-copper focus:border-speakeasy-gold focus:ring-speakeasy-gold/20"
            />
            
            {/* Search Icon */}
            <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-speakeasy-copper">
              🔍
            </div>
            
            {/* Clear Button */}
            {searchQuery && (
              <button
                onClick={() => onSearchQueryChange('')}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 text-speakeasy-copper hover:text-speakeasy-gold transition-colors"
                title="Clear search"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Quick Search Buttons */}
        <div className="flex gap-2">
          <button
            onClick={() => {
              onSearchTypeChange('name');
              onSearchQueryChange('');
            }}
            className={`px-3 py-2 rounded-sm text-xs font-bebas tracking-wider border transition-all ${
              searchType === 'name'
                ? 'bg-speakeasy-gold/20 text-speakeasy-gold border-speakeasy-gold/50'
                : 'bg-speakeasy-noir/30 text-speakeasy-champagne border-speakeasy-gold/20 hover:bg-speakeasy-gold/10'
            }`}
          >
            👤 Name
          </button>
          <button
            onClick={() => {
              onSearchTypeChange('booking_ref');
              onSearchQueryChange('');
            }}
            className={`px-3 py-2 rounded-sm text-xs font-bebas tracking-wider border transition-all ${
              searchType === 'booking_ref'
                ? 'bg-speakeasy-gold/20 text-speakeasy-gold border-speakeasy-gold/50'
                : 'bg-speakeasy-noir/30 text-speakeasy-champagne border-speakeasy-gold/20 hover:bg-speakeasy-gold/10'
            }`}
          >
            📄 Ref
          </button>
        </div>
      </div>

      {/* Search Tips */}
      {searchQuery === '' && !isFocused && (
        <div className="mt-3 text-xs text-speakeasy-copper/70">
          <div className="flex flex-wrap gap-4">
            <span>💡 Quick tips:</span>
            <span>• Use booking ref format: BRL-2025-XXXXX</span>
            <span>• Search by first or last name</span>
            <span>• Phone numbers with or without spaces</span>
          </div>
        </div>
      )}

      {/* Active Search Indicator */}
      {searchQuery && (
        <div className="mt-3 flex items-center gap-2 text-xs">
          <span className="text-speakeasy-gold">🔍 Active search:</span>
          <span className="text-speakeasy-champagne">
            "{searchQuery}" in {searchTypeOptions.find(o => o.value === searchType)?.label.substring(2)}
          </span>
          <button
            onClick={() => onSearchQueryChange('')}
            className="text-speakeasy-copper hover:text-speakeasy-gold transition-colors"
          >
            Clear
          </button>
        </div>
      )}
    </div>
  );
};