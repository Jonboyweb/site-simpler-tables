'use client';

/**
 * EventsWithFilters Component
 * 
 * Client-side wrapper that provides URL state synchronization for events filtering and sorting.
 * Manages browser history integration and bookmarkable filter states.
 */

import { useEffect, useState, useCallback } from 'react';
import { useSearchParams, usePathname } from 'next/navigation';
import { EventsList } from './EventsList';
import { EventInstance, EventFilters, EventSortConfig } from '@/types/components';
import { 
  parseEventUrl, 
  createDebouncedUrlUpdate,
  hasUrlState,
  getShareableUrl
} from '@/lib/utils/urlState';
import { getDefaultFilters, getDefaultSortConfig } from '@/lib/utils/eventFiltering';

interface EventsWithFiltersProps {
  events: EventInstance[];
}

export function EventsWithFilters({ events }: EventsWithFiltersProps) {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  
  // Initialize state from URL or defaults
  const [initialState] = useState(() => {
    if (hasUrlState(searchParams)) {
      return parseEventUrl(searchParams);
    }
    return {
      filters: getDefaultFilters(),
      sortConfig: getDefaultSortConfig()
    };
  });

  const [filters, setFilters] = useState<EventFilters>(initialState.filters);
  const [sortConfig, setSortConfig] = useState<EventSortConfig>(initialState.sortConfig);
  const [isInitialized, setIsInitialized] = useState(false);

  // Create debounced URL update function
  const debouncedUrlUpdate = useCallback(
    createDebouncedUrlUpdate(300),
    []
  );

  // Update URL when filters or sort changes (but not on initial load)
  useEffect(() => {
    if (!isInitialized) {
      setIsInitialized(true);
      return;
    }

    debouncedUrlUpdate(pathname, filters, sortConfig, true);
  }, [filters, sortConfig, pathname, debouncedUrlUpdate, isInitialized]);

  // Handle browser back/forward navigation
  useEffect(() => {
    const handlePopState = () => {
      const currentSearchParams = new URLSearchParams(window.location.search);
      if (hasUrlState(currentSearchParams)) {
        const { filters: newFilters, sortConfig: newSortConfig } = parseEventUrl(currentSearchParams);
        setFilters(newFilters);
        setSortConfig(newSortConfig);
      } else {
        setFilters(getDefaultFilters());
        setSortConfig(getDefaultSortConfig());
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Handle filter changes
  const handleFiltersChange = useCallback((newFilters: Partial<EventFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  }, []);

  // Handle sort changes
  const handleSortChange = useCallback((newSortConfig: EventSortConfig) => {
    setSortConfig(newSortConfig);
  }, []);

  // Clear all filters and reset URL
  const handleClearFilters = useCallback(() => {
    setFilters(getDefaultFilters());
    setSortConfig(getDefaultSortConfig());
    
    // Clear URL parameters
    if (typeof window !== 'undefined') {
      window.history.replaceState(null, '', pathname);
    }
  }, [pathname]);

  // Share current filter state
  const handleShareFilters = useCallback(() => {
    if (typeof window === 'undefined') return;
    
    const shareUrl = getShareableUrl(window.location.href, filters, sortConfig);
    
    // Try to use native sharing if available
    if (navigator.share) {
      navigator.share({
        title: 'The Backroom Leeds Events',
        text: 'Check out these events at The Backroom Leeds',
        url: shareUrl
      }).catch(console.error);
    } else {
      // Fallback to clipboard
      navigator.clipboard.writeText(shareUrl).then(() => {
        // Could show a toast notification here
        console.log('Share URL copied to clipboard');
      }).catch(console.error);
    }
  }, [filters, sortConfig]);

  return (
    <div className="events-with-filters">
      {/* Share/Bookmark Actions - Hidden for now but available for future use */}
      <div className="hidden">
        <button
          onClick={handleShareFilters}
          className="luxury-cta-secondary px-4 py-2 text-sm rounded"
          aria-label="Share current filter settings"
        >
          Share Filters
        </button>
      </div>

      {/* Events List with Filtering */}
      <EventsList
        events={events}
        initialFilters={filters}
        initialSort={sortConfig}
        showFilters={true}
        showSorter={true}
        compact={false}
      />

      {/* SEO-friendly filter summary (hidden but helps with indexing) */}
      <div className="sr-only">
        <p>
          Showing events for The Backroom Leeds. 
          {filters.eventTypes.length > 0 && ` Event types: ${filters.eventTypes.join(', ')}.`}
          {filters.searchQuery && ` Searching for: ${filters.searchQuery}.`}
          {filters.dateRange !== 'this_month' && ` Date filter: ${filters.dateRange.replace('_', ' ')}.`}
          {filters.availability.length > 0 && ` Availability: ${filters.availability.join(', ')}.`}
          {sortConfig.sortBy !== 'date_asc' && ` Sorted by: ${sortConfig.sortBy.replace('_', ' ')}.`}
        </p>
      </div>
    </div>
  );
}