'use client';

/**
 * EventsFilter Component
 * 
 * Luxury speakeasy-themed filtering component for events.
 * Features Art Deco styling with glass morphism effects and copper accents.
 * Supports all filtering options: event types, dates, availability, price ranges, etc.
 */

import { useState, useCallback } from 'react';
import { 
  EventFilters, 
  EventSortConfig, 
  EventsFilterProps,
  EventType,
  EventFilterDateRange,
  EventAvailabilityFilter,
  EventPriceRange,
  EventDayOfWeek,
  EventMusicGenre,
  EventTableAvailability
} from '@/types/components';

export function EventsFilter({
  filters,
  sortConfig,
  onFiltersChange,
  onSortChange,
  onClearFilters,
  isLoading = false,
  resultCount
}: EventsFilterProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [searchQuery, setSearchQuery] = useState(filters.searchQuery || '');

  // Handle search input with debouncing
  const handleSearchChange = useCallback((query: string) => {
    setSearchQuery(query);
    // Debounce the search query update
    const timeoutId = setTimeout(() => {
      onFiltersChange({ searchQuery: query });
    }, 300);
    
    return () => clearTimeout(timeoutId);
  }, [onFiltersChange]);

  // Handle checkbox group changes
  const handleEventTypeToggle = (eventType: EventType) => {
    const newTypes = filters.eventTypes.includes(eventType)
      ? filters.eventTypes.filter(type => type !== eventType)
      : [...filters.eventTypes, eventType];
    onFiltersChange({ eventTypes: newTypes });
  };

  const handleAvailabilityToggle = (availability: EventAvailabilityFilter) => {
    const newAvailability = filters.availability.includes(availability)
      ? filters.availability.filter(a => a !== availability)
      : [...filters.availability, availability];
    onFiltersChange({ availability: newAvailability });
  };

  const handleDayToggle = (day: EventDayOfWeek) => {
    const newDays = filters.daysOfWeek.includes(day)
      ? filters.daysOfWeek.filter(d => d !== day)
      : [...filters.daysOfWeek, day];
    onFiltersChange({ daysOfWeek: newDays });
  };

  const handleGenreToggle = (genre: EventMusicGenre) => {
    const newGenres = filters.musicGenres.includes(genre)
      ? filters.musicGenres.filter(g => g !== genre)
      : [...filters.musicGenres, genre];
    onFiltersChange({ musicGenres: newGenres });
  };

  // Get active filter count for badge
  const getActiveFilterCount = () => {
    let count = 0;
    if (filters.eventTypes.length > 0) count++;
    if (filters.dateRange !== 'all') count++;
    if (filters.availability.length > 0) count++;
    if (filters.priceRange !== 'all') count++;
    if (filters.daysOfWeek.length > 0) count++;
    if (filters.musicGenres.length > 0) count++;
    if (filters.minPartySize) count++;
    if (filters.searchQuery) count++;
    return count;
  };

  const activeFilters = getActiveFilterCount();

  return (
    <div className="luxury-events-filter mb-8">
      {/* Search Bar */}
      <div className="mb-6">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg 
              className="w-5 h-5 text-luxury-copper/60" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
              aria-hidden="true"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" 
              />
            </svg>
          </div>
          <input
            type="text"
            placeholder="Search events, artists, or music genres..."
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="luxury-search-input w-full pl-10 pr-4 py-3 bg-luxury-dark/60 border border-luxury-copper/20 rounded-lg text-luxury-champagne placeholder-luxury-smoke/60 focus:border-luxury-copper focus:ring-2 focus:ring-luxury-copper/20 focus:outline-none backdrop-blur-sm transition-all duration-300"
            aria-label="Search events"
          />
        </div>
      </div>

      {/* Filter Toggle & Results Count */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="luxury-filter-toggle flex items-center gap-2 px-4 py-2 bg-luxury-dark/40 border border-luxury-copper/30 rounded-lg text-luxury-champagne hover:bg-luxury-copper/10 hover:border-luxury-copper transition-all duration-300 backdrop-blur-sm"
            aria-expanded={isExpanded}
            aria-label="Toggle filters"
          >
            <svg 
              className={`w-4 h-4 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
            <span className="font-futura text-sm uppercase tracking-wide">
              Filters {activeFilters > 0 && `(${activeFilters})`}
            </span>
          </button>

          {/* Quick Filter Chips */}
          <div className="hidden md:flex items-center gap-2">
            {['this_week', 'available', 'la_fiesta'].map((quickFilter) => (
              <button
                key={quickFilter}
                onClick={() => {
                  switch(quickFilter) {
                    case 'this_week':
                      onFiltersChange({ dateRange: 'this_week' as EventFilterDateRange });
                      break;
                    case 'available':
                      onFiltersChange({ availability: ['available'] });
                      break;
                    case 'la_fiesta':
                      onFiltersChange({ eventTypes: ['LA_FIESTA'] });
                      break;
                  }
                }}
                className="luxury-filter-chip px-3 py-1 text-xs font-futura uppercase tracking-wide bg-luxury-copper/20 text-luxury-copper border border-luxury-copper/30 rounded-full hover:bg-luxury-copper/30 transition-all duration-300"
              >
                {quickFilter.replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* Results Count */}
          <span className="text-sm text-luxury-smoke/80 font-raleway">
            {isLoading ? (
              <span className="inline-flex items-center gap-2">
                <div className="w-3 h-3 border border-luxury-copper/30 border-t-luxury-copper rounded-full animate-spin"></div>
                Loading...
              </span>
            ) : (
              `${resultCount} ${resultCount === 1 ? 'event' : 'events'} found`
            )}
          </span>

          {/* Clear Filters */}
          {activeFilters > 0 && (
            <button
              onClick={onClearFilters}
              className="text-sm text-luxury-copper hover:text-luxury-gold transition-colors duration-300 font-raleway underline underline-offset-2"
            >
              Clear all
            </button>
          )}
        </div>
      </div>

      {/* Expandable Filter Panel */}
      <div className={`luxury-filter-panel overflow-hidden transition-all duration-500 ${isExpanded ? 'max-h-screen opacity-100 mb-8' : 'max-h-0 opacity-0'}`}>
        <div className="p-6 bg-luxury-dark/20 border border-luxury-copper/20 rounded-lg backdrop-blur-sm">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            
            {/* Event Types */}
            <div className="luxury-filter-group">
              <h3 className="luxury-filter-title text-sm font-futura uppercase tracking-wide text-luxury-copper mb-3">
                Event Types
              </h3>
              <div className="space-y-2">
                {[
                  { key: 'LA_FIESTA', label: 'LA FIESTA', description: 'Latin Night' },
                  { key: 'SHHH', label: 'SHHH!', description: 'Deep House' },
                  { key: 'NOSTALGIA', label: 'NOSTALGIA', description: 'Classic Hits' }
                ].map(({ key, label, description }) => (
                  <label key={key} className="luxury-checkbox-label flex items-center gap-3 cursor-pointer group">
                    <div className="relative">
                      <input
                        type="checkbox"
                        checked={filters.eventTypes.includes(key as EventType)}
                        onChange={() => handleEventTypeToggle(key as EventType)}
                        className="sr-only"
                      />
                      <div className={`w-4 h-4 border border-luxury-copper/40 rounded transition-all duration-300 ${filters.eventTypes.includes(key as EventType) ? 'bg-luxury-copper border-luxury-copper' : 'group-hover:border-luxury-copper/60'}`}>
                        {filters.eventTypes.includes(key as EventType) && (
                          <svg className="w-3 h-3 text-luxury-dark m-0.5" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        )}
                      </div>
                    </div>
                    <div>
                      <span className="text-luxury-champagne font-raleway text-sm">{label}</span>
                      <span className="block text-luxury-smoke/70 text-xs">{description}</span>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Date Range */}
            <div className="luxury-filter-group">
              <h3 className="luxury-filter-title text-sm font-futura uppercase tracking-wide text-luxury-copper mb-3">
                Date Range
              </h3>
              <div className="space-y-2">
                {[
                  { key: 'all', label: 'All Dates' },
                  { key: 'this_week', label: 'This Week' },
                  { key: 'next_week', label: 'Next Week' },
                  { key: 'this_month', label: 'This Month' },
                  { key: 'custom', label: 'Custom Range' }
                ].map(({ key, label }) => (
                  <label key={key} className="luxury-radio-label flex items-center gap-3 cursor-pointer group">
                    <div className="relative">
                      <input
                        type="radio"
                        name="dateRange"
                        checked={filters.dateRange === key}
                        onChange={() => onFiltersChange({ dateRange: key as EventFilterDateRange })}
                        className="sr-only"
                      />
                      <div className={`w-4 h-4 border border-luxury-copper/40 rounded-full transition-all duration-300 ${filters.dateRange === key ? 'border-luxury-copper' : 'group-hover:border-luxury-copper/60'}`}>
                        {filters.dateRange === key && (
                          <div className="w-2 h-2 bg-luxury-copper rounded-full m-1"></div>
                        )}
                      </div>
                    </div>
                    <span className="text-luxury-champagne font-raleway text-sm">{label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Availability */}
            <div className="luxury-filter-group">
              <h3 className="luxury-filter-title text-sm font-futura uppercase tracking-wide text-luxury-copper mb-3">
                Availability
              </h3>
              <div className="space-y-2">
                {[
                  { key: 'available', label: 'Available Tables', icon: '✓' },
                  { key: 'sold_out', label: 'Sold Out', icon: '×' },
                  { key: 'waitlist', label: 'Waitlist Available', icon: '⌛' }
                ].map(({ key, label, icon }) => (
                  <label key={key} className="luxury-checkbox-label flex items-center gap-3 cursor-pointer group">
                    <div className="relative">
                      <input
                        type="checkbox"
                        checked={filters.availability.includes(key as EventAvailabilityFilter)}
                        onChange={() => handleAvailabilityToggle(key as EventAvailabilityFilter)}
                        className="sr-only"
                      />
                      <div className={`w-4 h-4 border border-luxury-copper/40 rounded transition-all duration-300 ${filters.availability.includes(key as EventAvailabilityFilter) ? 'bg-luxury-copper border-luxury-copper' : 'group-hover:border-luxury-copper/60'}`}>
                        {filters.availability.includes(key as EventAvailabilityFilter) && (
                          <svg className="w-3 h-3 text-luxury-dark m-0.5" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-luxury-champagne font-raleway text-sm">{label}</span>
                      <span className="text-luxury-copper text-xs">{icon}</span>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Price Range */}
            <div className="luxury-filter-group">
              <h3 className="luxury-filter-title text-sm font-futura uppercase tracking-wide text-luxury-copper mb-3">
                Price Range
              </h3>
              <div className="space-y-2">
                {[
                  { key: 'basic', label: 'Basic (£170-£320)', range: '£170-£320' },
                  { key: 'premium', label: 'Premium (£320-£580)', range: '£320-£580' },
                  { key: 'all', label: 'All Packages', range: 'All' }
                ].map(({ key, label, range }) => (
                  <label key={key} className="luxury-radio-label flex items-center gap-3 cursor-pointer group">
                    <div className="relative">
                      <input
                        type="radio"
                        name="priceRange"
                        checked={filters.priceRange === key}
                        onChange={() => onFiltersChange({ priceRange: key as EventPriceRange })}
                        className="sr-only"
                      />
                      <div className={`w-4 h-4 border border-luxury-copper/40 rounded-full transition-all duration-300 ${filters.priceRange === key ? 'border-luxury-copper' : 'group-hover:border-luxury-copper/60'}`}>
                        {filters.priceRange === key && (
                          <div className="w-2 h-2 bg-luxury-copper rounded-full m-1"></div>
                        )}
                      </div>
                    </div>
                    <div>
                      <span className="text-luxury-champagne font-raleway text-sm">{label}</span>
                      <span className="block text-luxury-smoke/70 text-xs">{range}</span>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Days of Week */}
            <div className="luxury-filter-group">
              <h3 className="luxury-filter-title text-sm font-futura uppercase tracking-wide text-luxury-copper mb-3">
                Days
              </h3>
              <div className="space-y-2">
                {[
                  { key: 'friday', label: 'Friday', event: 'LA FIESTA' },
                  { key: 'saturday', label: 'Saturday', event: 'SHHH!' },
                  { key: 'sunday', label: 'Sunday', event: 'NOSTALGIA' }
                ].map(({ key, label, event }) => (
                  <label key={key} className="luxury-checkbox-label flex items-center gap-3 cursor-pointer group">
                    <div className="relative">
                      <input
                        type="checkbox"
                        checked={filters.daysOfWeek.includes(key as EventDayOfWeek)}
                        onChange={() => handleDayToggle(key as EventDayOfWeek)}
                        className="sr-only"
                      />
                      <div className={`w-4 h-4 border border-luxury-copper/40 rounded transition-all duration-300 ${filters.daysOfWeek.includes(key as EventDayOfWeek) ? 'bg-luxury-copper border-luxury-copper' : 'group-hover:border-luxury-copper/60'}`}>
                        {filters.daysOfWeek.includes(key as EventDayOfWeek) && (
                          <svg className="w-3 h-3 text-luxury-dark m-0.5" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        )}
                      </div>
                    </div>
                    <div>
                      <span className="text-luxury-champagne font-raleway text-sm">{label}</span>
                      <span className="block text-luxury-smoke/70 text-xs">{event}</span>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Music Genres */}
            <div className="luxury-filter-group">
              <h3 className="luxury-filter-title text-sm font-futura uppercase tracking-wide text-luxury-copper mb-3">
                Music Genres
              </h3>
              <div className="space-y-2">
                {[
                  { key: 'latin', label: 'Latin & Reggaeton' },
                  { key: 'deep_house', label: 'Deep House' },
                  { key: 'classic_hits', label: 'Classic Hits' },
                  { key: 'all', label: 'All Genres' }
                ].map(({ key, label }) => (
                  <label key={key} className="luxury-checkbox-label flex items-center gap-3 cursor-pointer group">
                    <div className="relative">
                      <input
                        type="checkbox"
                        checked={filters.musicGenres.includes(key as EventMusicGenre)}
                        onChange={() => handleGenreToggle(key as EventMusicGenre)}
                        className="sr-only"
                      />
                      <div className={`w-4 h-4 border border-luxury-copper/40 rounded transition-all duration-300 ${filters.musicGenres.includes(key as EventMusicGenre) ? 'bg-luxury-copper border-luxury-copper' : 'group-hover:border-luxury-copper/60'}`}>
                        {filters.musicGenres.includes(key as EventMusicGenre) && (
                          <svg className="w-3 h-3 text-luxury-dark m-0.5" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        )}
                      </div>
                    </div>
                    <span className="text-luxury-champagne font-raleway text-sm">{label}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}