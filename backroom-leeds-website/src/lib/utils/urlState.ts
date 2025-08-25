/**
 * URL State Management Utilities
 * 
 * Utilities for synchronizing filter and sort state with URL parameters.
 * Enables bookmarkable filter combinations and browser history navigation.
 */

import { 
  EventFilters, 
  EventSortConfig,
  EventType,
  EventFilterDateRange,
  EventAvailabilityFilter,
  EventPriceRange,
  EventDayOfWeek,
  EventMusicGenre,
  EventTableAvailability,
  EventSortOption
} from '@/types/components';
import { getDefaultFilters, getDefaultSortConfig } from './eventFiltering';

/**
 * Convert filters to URL search parameters
 */
export function filtersToSearchParams(filters: EventFilters): URLSearchParams {
  const params = new URLSearchParams();
  
  // Event types
  if (filters.eventTypes.length > 0) {
    params.set('events', filters.eventTypes.join(','));
  }
  
  // Date range
  if (filters.dateRange !== 'this_month') {
    params.set('date', filters.dateRange);
  }
  
  // Custom date range
  if (filters.customDateStart && filters.customDateEnd) {
    params.set('from', filters.customDateStart.toISOString().split('T')[0]);
    params.set('to', filters.customDateEnd.toISOString().split('T')[0]);
  }
  
  // Availability
  if (filters.availability.length > 0) {
    params.set('availability', filters.availability.join(','));
  }
  
  // Price range
  if (filters.priceRange !== 'all') {
    params.set('price', filters.priceRange);
  }
  
  // Days of week
  if (filters.daysOfWeek.length > 0) {
    params.set('days', filters.daysOfWeek.join(','));
  }
  
  // Music genres
  if (filters.musicGenres.length > 0) {
    params.set('genres', filters.musicGenres.join(','));
  }
  
  // Minimum party size
  if (filters.minPartySize) {
    params.set('party_size', filters.minPartySize);
  }
  
  // Search query
  if (filters.searchQuery) {
    params.set('q', filters.searchQuery);
  }
  
  return params;
}

/**
 * Convert URL search parameters to filters
 */
export function searchParamsToFilters(searchParams: URLSearchParams): EventFilters {
  const defaults = getDefaultFilters();
  
  return {
    eventTypes: parseStringArray(searchParams.get('events')) as EventType[],
    dateRange: (searchParams.get('date') as EventFilterDateRange) || defaults.dateRange,
    customDateStart: searchParams.get('from') ? new Date(searchParams.get('from')!) : undefined,
    customDateEnd: searchParams.get('to') ? new Date(searchParams.get('to')!) : undefined,
    availability: parseStringArray(searchParams.get('availability')) as EventAvailabilityFilter[],
    priceRange: (searchParams.get('price') as EventPriceRange) || defaults.priceRange,
    daysOfWeek: parseStringArray(searchParams.get('days')) as EventDayOfWeek[],
    musicGenres: parseStringArray(searchParams.get('genres')) as EventMusicGenre[],
    minPartySize: (searchParams.get('party_size') as EventTableAvailability) || undefined,
    searchQuery: searchParams.get('q') || undefined,
  };
}

/**
 * Convert sort configuration to URL search parameters
 */
export function sortConfigToSearchParams(sortConfig: EventSortConfig): URLSearchParams {
  const params = new URLSearchParams();
  
  if (sortConfig.sortBy !== 'date_asc') {
    params.set('sort', sortConfig.sortBy);
  }
  
  if (sortConfig.secondarySort) {
    params.set('sort2', sortConfig.secondarySort);
  }
  
  return params;
}

/**
 * Convert URL search parameters to sort configuration
 */
export function searchParamsToSortConfig(searchParams: URLSearchParams): EventSortConfig {
  const defaults = getDefaultSortConfig();
  
  return {
    sortBy: (searchParams.get('sort') as EventSortOption) || defaults.sortBy,
    secondarySort: (searchParams.get('sort2') as EventSortOption) || undefined,
  };
}

/**
 * Create complete URL with filters and sort state
 */
export function createEventUrl(
  basePath: string, 
  filters: EventFilters, 
  sortConfig: EventSortConfig
): string {
  const filterParams = filtersToSearchParams(filters);
  const sortParams = sortConfigToSearchParams(sortConfig);
  
  // Combine all parameters
  const allParams = new URLSearchParams();
  
  // Add filter params
  for (const [key, value] of filterParams.entries()) {
    allParams.set(key, value);
  }
  
  // Add sort params
  for (const [key, value] of sortParams.entries()) {
    allParams.set(key, value);
  }
  
  const queryString = allParams.toString();
  return queryString ? `${basePath}?${queryString}` : basePath;
}

/**
 * Parse URL search parameters to get complete state
 */
export function parseEventUrl(searchParams: URLSearchParams): {
  filters: EventFilters;
  sortConfig: EventSortConfig;
} {
  return {
    filters: searchParamsToFilters(searchParams),
    sortConfig: searchParamsToSortConfig(searchParams),
  };
}

/**
 * Helper to parse comma-separated string to array
 */
function parseStringArray(value: string | null): string[] {
  if (!value) return [];
  return value.split(',').filter(Boolean);
}

/**
 * Check if current URL has any filter or sort parameters
 */
export function hasUrlState(searchParams: URLSearchParams): boolean {
  const relevantParams = [
    'events', 'date', 'from', 'to', 'availability', 'price', 
    'days', 'genres', 'party_size', 'q', 'sort', 'sort2'
  ];
  
  return relevantParams.some(param => searchParams.has(param));
}

/**
 * Get share URL for current filter/sort state
 */
export function getShareableUrl(
  currentUrl: string,
  filters: EventFilters,
  sortConfig: EventSortConfig
): string {
  try {
    const url = new URL(currentUrl);
    const eventUrl = createEventUrl(url.pathname, filters, sortConfig);
    return `${url.origin}${eventUrl}`;
  } catch (error) {
    console.error('Error creating shareable URL:', error);
    return currentUrl;
  }
}

/**
 * Create filter preset URLs
 */
export const FILTER_PRESETS = {
  thisWeekend: (basePath: string) => createEventUrl(basePath, {
    ...getDefaultFilters(),
    dateRange: 'this_week',
    daysOfWeek: ['friday', 'saturday', 'sunday']
  }, getDefaultSortConfig()),
  
  availableNow: (basePath: string) => createEventUrl(basePath, {
    ...getDefaultFilters(),
    availability: ['available']
  }, { sortBy: 'availability' }),
  
  laFiesta: (basePath: string) => createEventUrl(basePath, {
    ...getDefaultFilters(),
    eventTypes: ['LA_FIESTA']
  }, getDefaultSortConfig()),
  
  deepHouse: (basePath: string) => createEventUrl(basePath, {
    ...getDefaultFilters(),
    eventTypes: ['SHHH'],
    musicGenres: ['deep_house']
  }, getDefaultSortConfig()),
  
  mostPopular: (basePath: string) => createEventUrl(basePath, 
    getDefaultFilters(),
    { sortBy: 'popularity' }
  ),
  
  cheapestFirst: (basePath: string) => createEventUrl(basePath, {
    ...getDefaultFilters(),
    priceRange: 'basic'
  }, { sortBy: 'price_asc' })
};

/**
 * Debounced URL update function
 */
export function createDebouncedUrlUpdate(delay: number = 300) {
  let timeoutId: NodeJS.Timeout | null = null;
  
  return (
    path: string,
    filters: EventFilters,
    sortConfig: EventSortConfig,
    replace: boolean = true
  ) => {
    if (timeoutId) clearTimeout(timeoutId);
    
    timeoutId = setTimeout(() => {
      const url = createEventUrl(path, filters, sortConfig);
      if (typeof window !== 'undefined') {
        const method = replace ? 'replaceState' : 'pushState';
        window.history[method](null, '', url);
      }
    }, delay);
  };
}