'use client';

/**
 * EventsSorter Component
 * 
 * Luxury speakeasy-themed sorting component for events.
 * Features elegant dropdown with Art Deco styling and smooth animations.
 * Supports primary and secondary sort options.
 */

import { useState, useRef, useEffect } from 'react';
import { EventSortConfig, EventsSorterProps, EventSortOption } from '@/types/components';

const SORT_OPTIONS: Array<{ value: EventSortOption; label: string; description: string }> = [
  { value: 'date_asc', label: 'Date (Earliest First)', description: 'Upcoming events first' },
  { value: 'date_desc', label: 'Date (Latest First)', description: 'Latest events first' },
  { value: 'popularity', label: 'Most Popular', description: 'Based on booking volume' },
  { value: 'availability', label: 'Most Available', description: 'Most tables available first' },
  { value: 'price_asc', label: 'Price (Low to High)', description: 'Cheapest packages first' },
  { value: 'price_desc', label: 'Price (High to Low)', description: 'Premium packages first' },
  { value: 'event_type', label: 'Event Type', description: 'Alphabetical by event name' },
  { value: 'recently_added', label: 'Recently Added', description: 'Newest events first' }
];

export function EventsSorter({
  sortConfig,
  onSortChange,
  options = SORT_OPTIONS.map(opt => opt.value),
  compact = false
}: EventsSorterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [showSecondarySort, setShowSecondarySort] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter available options
  const availableOptions = SORT_OPTIONS.filter(option => options.includes(option.value));

  // Get label for current sort
  const getCurrentSortLabel = (sortBy: EventSortOption) => {
    const option = availableOptions.find(opt => opt.value === sortBy);
    return option?.label || 'Custom Sort';
  };

  const handleSortSelect = (newSortBy: EventSortOption) => {
    onSortChange({ 
      sortBy: newSortBy,
      secondarySort: sortConfig.secondarySort 
    });
    setIsOpen(false);
  };

  const handleSecondarySortSelect = (newSecondarySort: EventSortOption) => {
    onSortChange({
      sortBy: sortConfig.sortBy,
      secondarySort: newSecondarySort
    });
    setShowSecondarySort(false);
  };

  const clearSecondarySort = () => {
    onSortChange({
      sortBy: sortConfig.sortBy,
      secondarySort: undefined
    });
  };

  return (
    <div className="luxury-events-sorter" ref={dropdownRef}>
      <div className="flex items-center gap-4">
        {/* Primary Sort Dropdown */}
        <div className="relative">
          <button
            onClick={() => setIsOpen(!isOpen)}
            className={`luxury-sort-trigger flex items-center gap-2 px-4 py-2 bg-luxury-dark/40 border border-luxury-copper/30 rounded-lg text-luxury-champagne hover:bg-luxury-copper/10 hover:border-luxury-copper transition-all duration-300 backdrop-blur-sm ${compact ? 'text-sm' : ''}`}
            aria-expanded={isOpen}
            aria-label="Sort events"
          >
            <svg 
              className="w-4 h-4 text-luxury-copper" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h9m5-4v12m0 0l-4-4m4 4l4-4" />
            </svg>
            <span className={`font-futura uppercase tracking-wide ${compact ? 'text-xs' : 'text-sm'}`}>
              Sort: {getCurrentSortLabel(sortConfig.sortBy)}
            </span>
            <svg 
              className={`w-4 h-4 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {/* Dropdown Menu */}
          {isOpen && (
            <div className="luxury-sort-dropdown absolute top-full left-0 mt-2 w-72 bg-luxury-dark/95 border border-luxury-copper/30 rounded-lg shadow-2xl backdrop-blur-lg z-50 overflow-hidden">
              <div className="p-2">
                <div className="mb-2 px-3 py-2">
                  <span className="text-xs font-futura uppercase tracking-wider text-luxury-copper">
                    Sort Options
                  </span>
                </div>
                
                {availableOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => handleSortSelect(option.value)}
                    className={`luxury-sort-option w-full text-left px-3 py-3 rounded-lg transition-all duration-200 ${
                      sortConfig.sortBy === option.value
                        ? 'bg-luxury-copper/20 text-luxury-copper border border-luxury-copper/30'
                        : 'text-luxury-champagne hover:bg-luxury-copper/10 hover:text-luxury-copper'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <div className={`font-raleway ${compact ? 'text-sm' : 'text-base'}`}>
                          {option.label}
                        </div>
                        <div className="text-xs text-luxury-smoke/70 mt-1">
                          {option.description}
                        </div>
                      </div>
                      {sortConfig.sortBy === option.value && (
                        <svg className="w-4 h-4 text-luxury-copper mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      )}
                    </div>
                  </button>
                ))}
              </div>

              {/* Secondary Sort Option */}
              <div className="border-t border-luxury-copper/20 p-2">
                <div className="px-3 py-2">
                  <span className="text-xs font-futura uppercase tracking-wider text-luxury-copper">
                    Secondary Sort
                  </span>
                </div>
                
                {sortConfig.secondarySort ? (
                  <div className="flex items-center justify-between px-3 py-2 bg-luxury-copper/10 rounded-lg">
                    <div>
                      <span className="text-sm text-luxury-champagne font-raleway">
                        {getCurrentSortLabel(sortConfig.secondarySort)}
                      </span>
                      <span className="block text-xs text-luxury-smoke/70">
                        Secondary criteria
                      </span>
                    </div>
                    <button
                      onClick={clearSecondarySort}
                      className="text-luxury-copper hover:text-luxury-gold transition-colors duration-200"
                      aria-label="Remove secondary sort"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setShowSecondarySort(true)}
                    className="w-full text-left px-3 py-2 text-luxury-smoke/70 hover:text-luxury-copper hover:bg-luxury-copper/5 rounded-lg transition-all duration-200 text-sm"
                  >
                    + Add secondary sort
                  </button>
                )}

                {showSecondarySort && !sortConfig.secondarySort && (
                  <div className="mt-2 max-h-40 overflow-y-auto">
                    {availableOptions
                      .filter(opt => opt.value !== sortConfig.sortBy)
                      .map((option) => (
                        <button
                          key={option.value}
                          onClick={() => handleSecondarySortSelect(option.value)}
                          className="w-full text-left px-3 py-2 text-luxury-champagne hover:bg-luxury-copper/10 hover:text-luxury-copper rounded-lg transition-all duration-200 text-sm"
                        >
                          {option.label}
                        </button>
                      ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Sort Direction Indicator */}
        {!compact && (
          <div className="flex items-center gap-2 text-luxury-smoke/60">
            <span className="text-xs font-raleway">
              {sortConfig.sortBy.includes('asc') ? '↑' : 
               sortConfig.sortBy.includes('desc') ? '↓' : 
               '⟷'}
            </span>
            {sortConfig.secondarySort && (
              <>
                <span className="text-xs">then</span>
                <span className="text-xs font-raleway">
                  {getCurrentSortLabel(sortConfig.secondarySort)}
                </span>
              </>
            )}
          </div>
        )}
      </div>

      {/* Mobile Sort Quick Actions */}
      <div className="md:hidden mt-3 flex gap-2 overflow-x-auto pb-2">
        {['date_asc', 'popularity', 'availability'].map((quickSort) => (
          <button
            key={quickSort}
            onClick={() => handleSortSelect(quickSort as EventSortOption)}
            className={`flex-shrink-0 px-3 py-1 text-xs font-futura uppercase tracking-wide rounded-full border transition-all duration-300 ${
              sortConfig.sortBy === quickSort
                ? 'bg-luxury-copper text-luxury-dark border-luxury-copper'
                : 'bg-luxury-copper/20 text-luxury-copper border-luxury-copper/30 hover:bg-luxury-copper/30'
            }`}
          >
            {quickSort === 'date_asc' ? 'Date' : 
             quickSort === 'popularity' ? 'Popular' : 'Available'}
          </button>
        ))}
      </div>
    </div>
  );
}