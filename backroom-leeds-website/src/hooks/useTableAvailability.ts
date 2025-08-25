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
    let subscription: any = null;
    let refreshTimer: NodeJS.Timeout | null = null;

    const fetchTableAvailability = async () => {
      try {
        setError(null);
        
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

          const tableStatuses: TableStatus[] = (data || []).map((table: any) => ({
            id: table.table_number, // Using table_number as ID for consistency
            table_number: table.table_number,
            capacity_min: table.capacity_min,
            capacity_max: table.capacity_max,
            floor: table.floor,
            status: table.is_available ? 'available' : 'booked',
            description: table.description,
            features: table.features || [],
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

          const tableStatuses: TableStatus[] = (data || []).map((table: any) => ({
            id: table.id || table.table_number,
            table_number: table.table_number,
            capacity_min: table.capacity_min,
            capacity_max: table.capacity_max,
            floor: table.floor,
            status: table.is_available ? 'available' : 'booked',
            description: table.description,
            features: table.features || [],
            can_combine_with: table.can_combine_with || [],
            is_active: table.is_active
          }));

          setTables(tableStatuses);
        }
      } catch (err: any) {
        console.error('Failed to fetch table availability:', err);
        setError(err.message || 'Failed to load table availability');
      } finally {
        setLoading(false);
      }
    };

    const setupRealtimeSubscription = () => {
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
            console.error('Real-time subscription error');
            setError('Real-time updates unavailable');
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
    
    // Setup real-time subscription
    setupRealtimeSubscription();
    
    // Setup periodic refresh as backup
    setupRefreshTimer();

    // Cleanup function
    return () => {
      if (subscription) {
        subscription.unsubscribe();
      }
      if (refreshTimer) {
        clearInterval(refreshTimer);
      }
    };
  }, [eventDate, partySize, refreshInterval]);

  const refreshAvailability = async () => {
    setLoading(true);
    
    try {
      if (eventDate && partySize) {
        const { data, error } = await supabase.rpc(
          'check_table_availability',
          {
            check_date: eventDate,
            party_size_param: partySize
          }
        );

        if (error) throw error;

        const tableStatuses: TableStatus[] = (data || []).map((table: any) => ({
          id: table.table_number,
          table_number: table.table_number,
          capacity_min: table.capacity_min,
          capacity_max: table.capacity_max,
          floor: table.floor,
          status: table.is_available ? 'available' : 'booked',
          description: table.description,
          features: table.features || [],
          is_active: true
        }));

        setTables(tableStatuses);
      }
    } catch (err: any) {
      console.error('Failed to refresh table availability:', err);
      setError(err.message || 'Failed to refresh availability');
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