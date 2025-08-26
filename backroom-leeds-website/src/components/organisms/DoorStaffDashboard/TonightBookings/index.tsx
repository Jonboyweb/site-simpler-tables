'use client';

import { useState } from 'react';
import { BookingsList } from './BookingsList';
import { BookingSearch } from './BookingSearch';
import { TableLayout } from './TableLayout';
import { Heading } from '@/components/atoms';

interface TonightBookingsProps {
  lastUpdated: string;
}

export const TonightBookings = ({ lastUpdated }: TonightBookingsProps) => {
  const [viewMode, setViewMode] = useState<'list' | 'layout'>('list');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchType, setSearchType] = useState<'all' | 'booking_ref' | 'name' | 'phone'>('all');

  return (
    <div className="space-y-6">
      {/* Header with View Toggle */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <Heading level={2} variant="bebas" className="text-speakeasy-gold">
          Tonight's Bookings
        </Heading>
        
        <div className="flex items-center gap-3">
          <div className="flex bg-speakeasy-noir/50 rounded-sm p-1 border border-speakeasy-gold/20">
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-1 rounded-sm text-xs font-bebas tracking-wider transition-all ${
                viewMode === 'list'
                  ? 'bg-speakeasy-gold text-speakeasy-noir'
                  : 'text-speakeasy-champagne hover:text-speakeasy-gold'
              }`}
            >
              📋 List View
            </button>
            <button
              onClick={() => setViewMode('layout')}
              className={`px-3 py-1 rounded-sm text-xs font-bebas tracking-wider transition-all ${
                viewMode === 'layout'
                  ? 'bg-speakeasy-gold text-speakeasy-noir'
                  : 'text-speakeasy-champagne hover:text-speakeasy-gold'
              }`}
            >
              🏗️ Floor Plan
            </button>
          </div>
        </div>
      </div>

      {/* Search Interface */}
      <BookingSearch
        searchQuery={searchQuery}
        onSearchQueryChange={setSearchQuery}
        searchType={searchType}
        onSearchTypeChange={setSearchType}
      />

      {/* Content Area */}
      {viewMode === 'list' ? (
        <BookingsList 
          lastUpdated={lastUpdated} 
          searchQuery={searchQuery}
          searchType={searchType}
        />
      ) : (
        <TableLayout 
          lastUpdated={lastUpdated} 
        />
      )}
    </div>
  );
};