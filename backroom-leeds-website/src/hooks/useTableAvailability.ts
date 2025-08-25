'use client';

import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import type { Database } from '@/types/database.types';

export interface TableStatus {
  id: number;
  table_number: number;
  capacity_min: number;
  capacity_max: number;
  floor: 'upstairs' | 'downstairs';
  status: 'available' | 'booked' | 'pending';
  description?: string;
  features?: string[];
  can_combine_with?: number[];
  is_active: boolean;
}

export interface UseTableAvailabilityOptions {
  eventDate?: string;
  partySize?: number;
  refreshInterval?: number;
}

export function useTableAvailability(options: UseTableAvailabilityOptions = {}) {
  const [tables, setTables] = useState<TableStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClientComponentClient<Database>();

  const { eventDate, partySize, refreshInterval = 30000 } = options;

  useEffect(() => {
    let subscription: ReturnType<typeof supabase.channel> | null = null;
    let refreshTimer: NodeJS.Timeout | null = null;

    // Check if we're in development mode and should use mock data
    const isDevelopment = process.env.NODE_ENV === 'development';
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const isLocalSupabase = supabaseUrl?.includes('127.0.0.1') || supabaseUrl?.includes('localhost');

    const getMockTableData = (): TableStatus[] => {
      // Mock data for development when Supabase is not available
      const mockTables: TableStatus[] = [
        { id: 1, table_number: 1, capacity_min: 2, capacity_max: 4, floor: 'upstairs', status: 'available', is_active: true, features: ['Window view'] },
        { id: 2, table_number: 2, capacity_min: 4, capacity_max: 6, floor: 'upstairs', status: 'available', is_active: true, features: ['Premium seating'] },
        { id: 3, table_number: 3, capacity_min: 2, capacity_max: 4, floor: 'upstairs', status: 'booked', is_active: true },
        { id: 4, table_number: 4, capacity_min: 6, capacity_max: 8, floor: 'upstairs', status: 'available', is_active: true, features: ['VIP section'] },
        { id: 5, table_number: 5, capacity_min: 2, capacity_max: 4, floor: 'downstairs', status: 'available', is_active: true },
        { id: 6, table_number: 6, capacity_min: 4, capacity_max: 6, floor: 'downstairs', status: 'available', is_active: true },
        { id: 7, table_number: 7, capacity_min: 6, capacity_max: 8, floor: 'downstairs', status: 'booked', is_active: true },
        { id: 8, table_number: 8, capacity_min: 8, capacity_max: 10, floor: 'downstairs', status: 'available', is_active: true, features: ['Dance floor adjacent'] },
      ];

      // Filter by party size if provided
      if (partySize) {
        return mockTables.filter(table => 
          table.capacity_min <= partySize && table.capacity_max >= partySize
        );
      }

      return mockTables;
    };

    const fetchTableAvailability = async () => {
      try {
        setError(null);
        
        // Use mock data in development if Supabase is not accessible
        if (isDevelopment && isLocalSupabase) {
          try {
            // Test Supabase connection first
            const { error: testError } = await supabase.from('venue_tables').select('id').limit(1);
            if (testError) {
              // Supabase not available, use mock data
              console.warn('Supabase not available, using mock data for table availability');
              setTables(getMockTableData());
              setLoading(false);
              return;
            }
          } catch (connectionError) {
            // Connection failed, use mock data
            console.warn('Supabase connection failed, using mock data for table availability');
            setTables(getMockTableData());
            setLoading(false);
            return;
          }
        }
        
        if (eventDate && partySize) {
          // Use the check_table_availability function for specific date and party size
          const { data, error: functionError } = await supabase.rpc(
            'check_table_availability',
            {
              check_date: eventDate,
              party_size_param: partySize
            }
          );

          if (functionError) throw functionError;

          const tableStatuses: TableStatus[] = (data || []).map((table: Record<string, unknown>) => ({
            id: table.table_number as number, // Using table_number as ID for consistency
            table_number: table.table_number as number,
            capacity_min: table.capacity_min as number,
            capacity_max: table.capacity_max as number,
            floor: table.floor as 'upstairs' | 'downstairs',
            status: (table.is_available as boolean) ? 'available' : 'booked',
            description: table.description as string | undefined,
            features: (table.features as string[]) || [],
            is_active: true
          }));

          setTables(tableStatuses);
        } else {
          // Fallback to venue_tables with availability view
          const { data, error: queryError } = await supabase
            .from('available_tables')
            .select('*')
            .eq('is_active', true)
            .order('table_number', { ascending: true });

          if (queryError) throw queryError;

          const tableStatuses: TableStatus[] = (data || []).map((table: Record<string, unknown>) => ({
            id: (table.id as number) || (table.table_number as number),
            table_number: table.table_number as number,
            capacity_min: table.capacity_min as number,
            capacity_max: table.capacity_max as number,
            floor: table.floor as 'upstairs' | 'downstairs',
            status: (table.is_available as boolean) ? 'available' : 'booked',
            description: table.description as string | undefined,
            features: (table.features as string[]) || [],
            can_combine_with: (table.can_combine_with as number[]) || [],
            is_active: table.is_active as boolean
          }));

          setTables(tableStatuses);
        }
      } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to load table availability';
        console.error('Failed to fetch table availability:', err);
        
        // In development, fall back to mock data on error
        if (isDevelopment) {
          console.warn('Falling back to mock data due to error:', errorMessage);
          setTables(getMockTableData());
        } else {
          setError(errorMessage);
        }
      } finally {
        setLoading(false);
      }
    };

    const setupRealtimeSubscription = () => {
      // Skip real-time subscriptions in development if using local Supabase that's not available
      if (isDevelopment && isLocalSupabase) {
        console.log('Skipping real-time subscription in development mode');
        return;
      }

      // Subscribe to bookings changes to update table availability in real-time
      subscription = supabase
        .channel('table-availability-updates')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'bookings',
            filter: eventDate ? `booking_date=eq.${eventDate}` : undefined
          },
          (payload) => {
            console.log('Booking change detected:', payload);
            // Refresh availability when bookings change
            fetchTableAvailability();
          }
        )
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'venue_tables'
          },
          (payload) => {
            console.log('Table configuration change detected:', payload);
            // Refresh availability when table config changes
            fetchTableAvailability();
          }
        )
        .subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            console.log('Real-time subscription established for table availability');
          } else if (status === 'CHANNEL_ERROR') {
            console.warn('Real-time subscription error - falling back to polling');
            // Don't set error state, just fall back to polling
            if (refreshInterval > 0) {
              setupRefreshTimer();
            }
          }
        });
    };

    const setupRefreshTimer = () => {
      if (refreshInterval > 0) {
        refreshTimer = setInterval(() => {
          console.log('Refreshing table availability...');
          fetchTableAvailability();
        }, refreshInterval);
      }
    };

    // Initial fetch
    fetchTableAvailability();
    
    // Setup real-time subscription (will be skipped in development)
    setupRealtimeSubscription();
    
    // Setup periodic refresh as backup
    if (!isDevelopment || !isLocalSupabase) {
      setupRefreshTimer();
    }

    // Cleanup function
    return () => {
      if (subscription) {
        subscription.unsubscribe();
      }
      if (refreshTimer) {
        clearInterval(refreshTimer);
      }
    };
  }, [eventDate, partySize, refreshInterval, supabase]);

  const refreshAvailability = async () => {
    setLoading(true);
    
    try {
      // Check if we're in development mode and should use mock data
      const isDevelopment = process.env.NODE_ENV === 'development';
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const isLocalSupabase = supabaseUrl?.includes('127.0.0.1') || supabaseUrl?.includes('localhost');

      const getMockTableData = (): TableStatus[] => {
        // Mock data for development when Supabase is not available
        const mockTables: TableStatus[] = [
          { id: 1, table_number: 1, capacity_min: 2, capacity_max: 4, floor: 'upstairs', status: 'available', is_active: true, features: ['Window view'] },
          { id: 2, table_number: 2, capacity_min: 4, capacity_max: 6, floor: 'upstairs', status: 'available', is_active: true, features: ['Premium seating'] },
          { id: 3, table_number: 3, capacity_min: 2, capacity_max: 4, floor: 'upstairs', status: 'booked', is_active: true },
          { id: 4, table_number: 4, capacity_min: 6, capacity_max: 8, floor: 'upstairs', status: 'available', is_active: true, features: ['VIP section'] },
          { id: 5, table_number: 5, capacity_min: 2, capacity_max: 4, floor: 'downstairs', status: 'available', is_active: true },
          { id: 6, table_number: 6, capacity_min: 4, capacity_max: 6, floor: 'downstairs', status: 'available', is_active: true },
          { id: 7, table_number: 7, capacity_min: 6, capacity_max: 8, floor: 'downstairs', status: 'booked', is_active: true },
          { id: 8, table_number: 8, capacity_min: 8, capacity_max: 10, floor: 'downstairs', status: 'available', is_active: true, features: ['Dance floor adjacent'] },
        ];

        // Filter by party size if provided
        if (partySize) {
          return mockTables.filter(table => 
            table.capacity_min <= partySize && table.capacity_max >= partySize
          );
        }

        return mockTables;
      };

      // Use mock data in development if Supabase is not accessible
      if (isDevelopment && isLocalSupabase) {
        try {
          // Test Supabase connection first
          const { error: testError } = await supabase.from('venue_tables').select('id').limit(1);
          if (testError) {
            // Supabase not available, use mock data
            console.warn('Supabase not available during refresh, using mock data');
            setTables(getMockTableData());
            setLoading(false);
            return;
          }
        } catch (connectionError) {
          // Connection failed, use mock data
          console.warn('Supabase connection failed during refresh, using mock data');
          setTables(getMockTableData());
          setLoading(false);
          return;
        }
      }
      
      if (eventDate && partySize) {
        const { data, error } = await supabase.rpc(
          'check_table_availability',
          {
            check_date: eventDate,
            party_size_param: partySize
          }
        );

        if (error) throw error;

        const tableStatuses: TableStatus[] = (data || []).map((table: Record<string, unknown>) => ({
          id: table.table_number as number,
          table_number: table.table_number as number,
          capacity_min: table.capacity_min as number,
          capacity_max: table.capacity_max as number,
          floor: table.floor as 'upstairs' | 'downstairs',
          status: (table.is_available as boolean) ? 'available' : 'booked',
          description: table.description as string | undefined,
          features: (table.features as string[]) || [],
          is_active: true
        }));

        setTables(tableStatuses);
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to refresh availability';
      console.error('Failed to refresh table availability:', err);
      
      // In development, fall back to mock data on error
      const isDevelopment = process.env.NODE_ENV === 'development';
      if (isDevelopment) {
        console.warn('Falling back to mock data due to refresh error:', errorMessage);
        // Reuse the mock data logic
        const getMockTableData = (): TableStatus[] => {
          const mockTables: TableStatus[] = [
            { id: 1, table_number: 1, capacity_min: 2, capacity_max: 4, floor: 'upstairs', status: 'available', is_active: true, features: ['Window view'] },
            { id: 2, table_number: 2, capacity_min: 4, capacity_max: 6, floor: 'upstairs', status: 'available', is_active: true, features: ['Premium seating'] },
            { id: 3, table_number: 3, capacity_min: 2, capacity_max: 4, floor: 'upstairs', status: 'booked', is_active: true },
            { id: 4, table_number: 4, capacity_min: 6, capacity_max: 8, floor: 'upstairs', status: 'available', is_active: true, features: ['VIP section'] },
            { id: 5, table_number: 5, capacity_min: 2, capacity_max: 4, floor: 'downstairs', status: 'available', is_active: true },
            { id: 6, table_number: 6, capacity_min: 4, capacity_max: 6, floor: 'downstairs', status: 'available', is_active: true },
            { id: 7, table_number: 7, capacity_min: 6, capacity_max: 8, floor: 'downstairs', status: 'booked', is_active: true },
            { id: 8, table_number: 8, capacity_min: 8, capacity_max: 10, floor: 'downstairs', status: 'available', is_active: true, features: ['Dance floor adjacent'] },
          ];
          if (partySize) {
            return mockTables.filter(table => 
              table.capacity_min <= partySize && table.capacity_max >= partySize
            );
          }
          return mockTables;
        };
        setTables(getMockTableData());
      } else {
        setError(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  const getAvailableTablesForPartySize = (requestedPartySize: number) => {
    return tables.filter(table => 
      table.status === 'available' && 
      table.capacity_min <= requestedPartySize && 
      table.capacity_max >= requestedPartySize &&
      table.is_active
    );
  };

  const getTableCombinations = (requestedPartySize: number) => {
    // Find tables that can accommodate the party size through combination
    const availableTables = tables.filter(t => t.status === 'available' && t.is_active);
    const combinations: TableStatus[][] = [];

    // Single table solutions
    const singleTableOptions = availableTables.filter(table => 
      table.capacity_min <= requestedPartySize && table.capacity_max >= requestedPartySize
    );
    
    singleTableOptions.forEach(table => combinations.push([table]));

    // Two table combinations (if needed)
    if (requestedPartySize > 8 && singleTableOptions.length === 0) {
      for (let i = 0; i < availableTables.length; i++) {
        for (let j = i + 1; j < availableTables.length; j++) {
          const table1 = availableTables[i];
          const table2 = availableTables[j];
          
          // Check if tables can be combined and accommodate party size
          const canCombine = table1.can_combine_with?.includes(table2.table_number) ||
                           table2.can_combine_with?.includes(table1.table_number);
          
          if (canCombine) {
            const totalCapacity = table1.capacity_max + table2.capacity_max;
            if (totalCapacity >= requestedPartySize) {
              combinations.push([table1, table2]);
            }
          }
        }
      }
    }

    return combinations;
  };

  return {
    tables,
    loading,
    error,
    refreshAvailability,
    getAvailableTablesForPartySize,
    getTableCombinations,
    // Computed properties
    availableTables: tables.filter(t => t.status === 'available' && t.is_active),
    bookedTables: tables.filter(t => t.status === 'booked'),
    upstairsTables: tables.filter(t => t.floor === 'upstairs'),
    downstairsTables: tables.filter(t => t.floor === 'downstairs')
  };
}