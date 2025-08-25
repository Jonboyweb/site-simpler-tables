/**
 * Event Filtering and Sorting Utilities
 * 
 * Comprehensive utilities for filtering and sorting events based on multiple criteria.
 * Implements search, date filtering, availability checks, and smart sorting algorithms.
 */

import { 
  EventInstance, 
  FilteredEventInstance, 
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

/**
 * Enhanced event instance with filtering metadata
 */
function enrichEventInstance(eventInstance: EventInstance): FilteredEventInstance {
  // Use provided availableTables or calculate deterministically
  const availableTables = eventInstance.availableTables !== undefined 
    ? eventInstance.availableTables
    : (eventInstance.soldOut ? 0 : 16); // Default fallback without randomness
  
  // Determine price range based on event type
  let priceRange: 'basic' | 'premium' = 'basic';
  const eventName = eventInstance.event.name.toUpperCase();
  if (eventName.includes('LA FIESTA')) {
    priceRange = 'premium'; // LA FIESTA is typically higher demand
  }

  return {
    ...eventInstance,
    availableTables,
    priceRange,
    matchScore: 1 // Default match score
  };
}

/**
 * Get event type from event name
 */
function getEventType(eventName: string): EventType | undefined {
  const name = eventName.toUpperCase();
  if (name.includes('LA FIESTA')) return 'LA_FIESTA';
  if (name.includes('SHHH')) return 'SHHH';
  if (name.includes('NOSTALGIA')) return 'NOSTALGIA';
  return undefined;
}

/**
 * Get day of week from event date
 */
function getEventDayOfWeek(date: Date): EventDayOfWeek | undefined {
  const dayOfWeek = date.getDay();
  switch (dayOfWeek) {
    case 5: return 'friday';    // LA FIESTA
    case 6: return 'saturday';  // SHHH!
    case 0: return 'sunday';    // NOSTALGIA
    default: return undefined;
  }
}

/**
 * Get music genres for an event
 */
function getEventMusicGenres(eventInstance: EventInstance): EventMusicGenre[] {
  const genres: EventMusicGenre[] = [];
  const eventType = getEventType(eventInstance.event.name);
  
  switch (eventType) {
    case 'LA_FIESTA':
      genres.push('latin');
      break;
    case 'SHHH':
      genres.push('deep_house');
      break;
    case 'NOSTALGIA':
      genres.push('classic_hits');
      break;
  }
  
  return genres;
}

/**
 * Check if event matches date range filter
 */
function matchesDateRange(eventDate: Date, dateRange: EventFilterDateRange, customStart?: Date, customEnd?: Date): boolean {
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  
  switch (dateRange) {
    case 'all':
      return true; // Show all upcoming events
    case 'this_week': {
      const endOfWeek = new Date(startOfToday);
      endOfWeek.setDate(startOfToday.getDate() + (7 - startOfToday.getDay()));
      return eventDate >= startOfToday && eventDate <= endOfWeek;
    }
    case 'next_week': {
      const startOfNextWeek = new Date(startOfToday);
      startOfNextWeek.setDate(startOfToday.getDate() + (7 - startOfToday.getDay()) + 1);
      const endOfNextWeek = new Date(startOfNextWeek);
      endOfNextWeek.setDate(startOfNextWeek.getDate() + 6);
      return eventDate >= startOfNextWeek && eventDate <= endOfNextWeek;
    }
    case 'this_month': {
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      return eventDate >= startOfMonth && eventDate <= endOfMonth;
    }
    case 'custom': {
      if (!customStart || !customEnd) return true;
      return eventDate >= customStart && eventDate <= customEnd;
    }
    default:
      return true;
  }
}

/**
 * Check if event matches availability filter
 */
function matchesAvailability(event: FilteredEventInstance, availabilityFilters: EventAvailabilityFilter[]): boolean {
  if (availabilityFilters.length === 0) return true;
  
  return availabilityFilters.some(filter => {
    switch (filter) {
      case 'available':
        return !event.soldOut && event.availableTables > 0;
      case 'sold_out':
        return event.soldOut || event.availableTables === 0;
      case 'waitlist':
        // Assume waitlist is available for sold out events
        return event.soldOut && event.availableTables === 0;
      default:
        return false;
    }
  });
}

/**
 * Check if event matches price range filter
 */
function matchesPriceRange(event: FilteredEventInstance, priceRange: EventPriceRange): boolean {
  if (priceRange === 'all') return true;
  return event.priceRange === priceRange;
}

/**
 * Calculate search match score
 */
function calculateSearchScore(event: FilteredEventInstance, searchQuery: string): number {
  if (!searchQuery) return 1;
  
  const query = searchQuery.toLowerCase();
  let score = 0;
  
  // Event name match (highest priority)
  if (event.event.name.toLowerCase().includes(query)) {
    score += 10;
  }
  
  // Description match
  if (event.event.description?.toLowerCase().includes(query)) {
    score += 5;
  }
  
  // DJ lineup match
  if (event.event.dj_lineup?.some(dj => dj.toLowerCase().includes(query))) {
    score += 7;
  }
  
  // Music genres match
  if (event.event.music_genres?.some(genre => genre.toLowerCase().includes(query))) {
    score += 6;
  }
  
  return score;
}

/**
 * Apply all filters to events
 */
export function filterEvents(events: EventInstance[], filters: EventFilters): FilteredEventInstance[] {
  const enrichedEvents = events.map(enrichEventInstance);
  
  return enrichedEvents.filter(event => {
    // Event type filter
    if (filters.eventTypes.length > 0) {
      const eventType = getEventType(event.event.name);
      if (!eventType || !filters.eventTypes.includes(eventType)) {
        return false;
      }
    }
    
    // Date range filter
    if (!matchesDateRange(event.date, filters.dateRange, filters.customDateStart, filters.customDateEnd)) {
      return false;
    }
    
    // Availability filter
    if (!matchesAvailability(event, filters.availability)) {
      return false;
    }
    
    // Price range filter
    if (!matchesPriceRange(event, filters.priceRange)) {
      return false;
    }
    
    // Day of week filter
    if (filters.daysOfWeek.length > 0) {
      const eventDay = getEventDayOfWeek(event.date);
      if (!eventDay || !filters.daysOfWeek.includes(eventDay)) {
        return false;
      }
    }
    
    // Music genre filter
    if (filters.musicGenres.length > 0 && !filters.musicGenres.includes('all')) {
      const eventGenres = getEventMusicGenres(event);
      if (!filters.musicGenres.some(genre => eventGenres.includes(genre))) {
        return false;
      }
    }
    
    // Party size filter (table availability)
    if (filters.minPartySize) {
      const requiredCapacity = parseInt(filters.minPartySize.split('_')[0]);
      // This is a simplified check - in real implementation would check actual table capacities
      if (event.availableTables < Math.ceil(requiredCapacity / 8)) {
        return false;
      }
    }
    
    // Search query filter
    if (filters.searchQuery) {
      const matchScore = calculateSearchScore(event, filters.searchQuery);
      if (matchScore === 0) {
        return false;
      }
      event.matchScore = matchScore;
    }
    
    return true;
  });
}

/**
 * Sort filtered events based on sort configuration
 */
export function sortEvents(events: FilteredEventInstance[], sortConfig: EventSortConfig): FilteredEventInstance[] {
  const sortedEvents = [...events];
  
  sortedEvents.sort((a, b) => {
    // Primary sort
    let primaryComparison = compareBySortOption(a, b, sortConfig.sortBy);
    
    // If primary sort is equal and secondary sort is specified
    if (primaryComparison === 0 && sortConfig.secondarySort) {
      primaryComparison = compareBySortOption(a, b, sortConfig.secondarySort);
    }
    
    return primaryComparison;
  });
  
  return sortedEvents;
}

/**
 * Compare two events by a specific sort option
 */
function compareBySortOption(a: FilteredEventInstance, b: FilteredEventInstance, sortOption: EventSortOption): number {
  switch (sortOption) {
    case 'date_asc':
      return a.date.getTime() - b.date.getTime();
      
    case 'date_desc':
      return b.date.getTime() - a.date.getTime();
      
    case 'popularity':
      // Simulate popularity based on event type and available tables
      const aPopularity = getEventPopularity(a);
      const bPopularity = getEventPopularity(b);
      return bPopularity - aPopularity;
      
    case 'availability':
      return b.availableTables - a.availableTables;
      
    case 'price_asc':
      const aPriceValue = a.priceRange === 'basic' ? 1 : 2;
      const bPriceValue = b.priceRange === 'basic' ? 1 : 2;
      return aPriceValue - bPriceValue;
      
    case 'price_desc':
      const aPriceValueDesc = a.priceRange === 'basic' ? 1 : 2;
      const bPriceValueDesc = b.priceRange === 'basic' ? 1 : 2;
      return bPriceValueDesc - aPriceValueDesc;
      
    case 'event_type':
      return a.event.name.localeCompare(b.event.name);
      
    case 'recently_added':
      // Simulate based on event creation (in real app would use actual creation date)
      const aCreated = a.event.created_at ? new Date(a.event.created_at) : a.date;
      const bCreated = b.event.created_at ? new Date(b.event.created_at) : b.date;
      return bCreated.getTime() - aCreated.getTime();
      
    default:
      return 0;
  }
}

/**
 * Get event popularity score
 */
function getEventPopularity(event: FilteredEventInstance): number {
  const eventType = getEventType(event.event.name);
  let popularity = 50; // Base popularity
  
  // LA FIESTA is typically most popular
  if (eventType === 'LA_FIESTA') popularity += 30;
  else if (eventType === 'SHHH') popularity += 20;
  else if (eventType === 'NOSTALGIA') popularity += 10;
  
  // Less available tables might indicate higher demand
  popularity += (16 - event.availableTables) * 2;
  
  return popularity;
}

/**
 * Get default filters
 */
export function getDefaultFilters(): EventFilters {
  return {
    eventTypes: [],
    dateRange: 'all', // Changed from 'this_month' to show all upcoming events
    availability: [],
    priceRange: 'all',
    daysOfWeek: [],
    musicGenres: [],
    searchQuery: ''
  };
}

/**
 * Get default sort configuration
 */
export function getDefaultSortConfig(): EventSortConfig {
  return {
    sortBy: 'date_asc'
  };
}

/**
 * Check if filters have any active selections
 */
export function hasActiveFilters(filters: EventFilters): boolean {
  return (
    filters.eventTypes.length > 0 ||
    filters.dateRange !== 'all' ||
    filters.availability.length > 0 ||
    filters.priceRange !== 'all' ||
    filters.daysOfWeek.length > 0 ||
    filters.musicGenres.length > 0 ||
    (filters.searchQuery && filters.searchQuery.trim().length > 0) ||
    Boolean(filters.minPartySize)
  );
}