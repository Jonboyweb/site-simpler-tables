'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/molecules';
import { Heading, Text, Badge } from '@/components/atoms';

interface Table {
  id: number;
  table_number: number;
  floor: 'upstairs' | 'downstairs';
  capacity_min: number;
  capacity_max: number;
  booking?: {
    id: string;
    booking_ref: string;
    customer_name: string;
    party_size: number;
    arrival_time: string;
    status: 'confirmed' | 'arrived';
    checked_in_at?: string;
    isLate: boolean;
    hasSpecialRequests: boolean;
  };
}

interface TableLayoutProps {
  lastUpdated: string;
}

export const TableLayout = ({ lastUpdated }: TableLayoutProps) => {
  const [upstairsTables, setUpstairsTables] = useState<Table[]>([]);
  const [downstairsTables, setDownstairsTables] = useState<Table[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTable, setSelectedTable] = useState<Table | null>(null);

  const fetchTableLayout = async () => {
    try {
      setError(null);
      
      // Get tonight's bookings with table information
      const bookingsResponse = await fetch('/api/door-staff/tonight-bookings');
      if (!bookingsResponse.ok) {
        throw new Error('Failed to fetch booking data');
      }
      
      const bookingsData = await bookingsResponse.json();
      const bookings = bookingsData.bookings || [];
      
      // Create map of table bookings
      const tableBookings = new Map();
      bookings.forEach((booking: any) => {
        booking.tables?.forEach((table: any) => {
          tableBookings.set(table.id, {
            id: booking.id,
            booking_ref: booking.booking_ref,
            customer_name: booking.customer_name,
            party_size: booking.party_size,
            arrival_time: booking.arrival_time,
            status: booking.status,
            checked_in_at: booking.checked_in_at,
            isLate: booking.isLate,
            hasSpecialRequests: booking.hasSpecialRequests
          });
        });
      });
      
      // Generate table layout (16 tables as per venue spec)
      const allTables: Table[] = [];
      
      // Upstairs tables (1-8)
      for (let i = 1; i <= 8; i++) {
        allTables.push({
          id: i,
          table_number: i,
          floor: 'upstairs',
          capacity_min: i <= 4 ? 4 : 6,
          capacity_max: i <= 4 ? 6 : 8,
          booking: tableBookings.get(i)
        });
      }
      
      // Downstairs tables (9-16)
      for (let i = 9; i <= 16; i++) {
        allTables.push({
          id: i,
          table_number: i,
          floor: 'downstairs',
          capacity_min: i <= 12 ? 4 : 6,
          capacity_max: i <= 12 ? 6 : 10,
          booking: tableBookings.get(i)
        });
      }
      
      setUpstairsTables(allTables.filter(t => t.floor === 'upstairs'));
      setDownstairsTables(allTables.filter(t => t.floor === 'downstairs'));
      
    } catch (err) {
      console.error('Error fetching table layout:', err);
      setError(err instanceof Error ? err.message : 'Failed to load table layout');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTableLayout();
  }, [lastUpdated]);

  const getTableStatus = (table: Table) => {
    if (!table.booking) {
      return { status: 'available', color: 'bg-gray-700 border-gray-600', textColor: 'text-gray-300' };
    }
    
    if (table.booking.status === 'arrived') {
      return { status: 'arrived', color: 'bg-green-900/50 border-green-400/50', textColor: 'text-green-400' };
    }
    
    if (table.booking.isLate) {
      return { status: 'late', color: 'bg-red-900/50 border-red-400/50', textColor: 'text-red-400' };
    }
    
    return { status: 'booked', color: 'bg-blue-900/50 border-blue-400/50', textColor: 'text-blue-400' };
  };

  const renderTable = (table: Table) => {
    const { color, textColor } = getTableStatus(table);
    
    return (
      <div
        key={table.id}
        onClick={() => setSelectedTable(table)}
        className={`
          relative p-3 rounded-sm border-2 cursor-pointer transition-all duration-200 min-h-[80px]
          ${color} hover:scale-105 hover:shadow-lg
        `}
      >
        <div className="text-center">
          <div className={`font-bebas text-lg ${textColor}`}>
            {table.table_number}
          </div>
          <div className="text-xs text-gray-400 mb-1">
            {table.capacity_min}-{table.capacity_max} guests
          </div>
          
          {table.booking ? (
            <div className="space-y-1">
              <div className={`text-xs ${textColor} truncate max-w-[80px] mx-auto`}>
                {table.booking.customer_name}
              </div>
              <div className="text-xs text-gray-400">
                {table.booking.arrival_time}
              </div>
              <div className="flex justify-center">
                {table.booking.hasSpecialRequests && (
                  <span className="text-speakeasy-gold text-xs">⭐</span>
                )}
              </div>
            </div>
          ) : (
            <div className="text-xs text-gray-500">Available</div>
          )}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="h-20 bg-speakeasy-noir/30 rounded-sm animate-pulse"></div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="p-8 text-center">
        <div className="text-red-400 mb-4">
          <span className="text-4xl">⚠️</span>
        </div>
        <Heading level={3} className="text-speakeasy-champagne mb-2">
          Error Loading Floor Plan
        </Heading>
        <Text className="text-speakeasy-copper mb-4">
          {error}
        </Text>
        <button
          onClick={fetchTableLayout}
          className="px-4 py-2 bg-speakeasy-gold text-speakeasy-noir rounded-sm hover:bg-speakeasy-champagne transition-colors"
        >
          Retry
        </button>
      </Card>
    );
  }

  const occupiedTables = [...upstairsTables, ...downstairsTables].filter(t => t.booking).length;
  const totalTables = upstairsTables.length + downstairsTables.length;

  return (
    <div className="space-y-6">
      {/* Status Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4 text-center">
          <div className="text-2xl font-bebas text-speakeasy-gold">
            {occupiedTables}/{totalTables}
          </div>
          <Text variant="caption" className="text-speakeasy-champagne/70">
            Tables Booked
          </Text>
        </Card>
        
        <Card className="p-4 text-center">
          <div className="text-2xl font-bebas text-green-400">
            {[...upstairsTables, ...downstairsTables].filter(t => t.booking?.status === 'arrived').length}
          </div>
          <Text variant="caption" className="text-speakeasy-champagne/70">
            Arrived
          </Text>
        </Card>
        
        <Card className="p-4 text-center">
          <div className="text-2xl font-bebas text-blue-400">
            {[...upstairsTables, ...downstairsTables].filter(t => t.booking?.status === 'confirmed').length}
          </div>
          <Text variant="caption" className="text-speakeasy-champagne/70">
            Expected
          </Text>
        </Card>
        
        <Card className="p-4 text-center">
          <div className="text-2xl font-bebas text-red-400">
            {[...upstairsTables, ...downstairsTables].filter(t => t.booking?.isLate).length}
          </div>
          <Text variant="caption" className="text-speakeasy-champagne/70">
            Running Late
          </Text>
        </Card>
      </div>

      {/* Legend */}
      <Card className="p-4">
        <div className="flex flex-wrap items-center justify-center gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-gray-700 border border-gray-600 rounded"></div>
            <span className="text-gray-300">Available</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-blue-900/50 border border-blue-400/50 rounded"></div>
            <span className="text-blue-400">Booked</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-green-900/50 border border-green-400/50 rounded"></div>
            <span className="text-green-400">Arrived</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-red-900/50 border border-red-400/50 rounded"></div>
            <span className="text-red-400">Late</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-speakeasy-gold">⭐</span>
            <span className="text-speakeasy-gold">Special Requests</span>
          </div>
        </div>
      </Card>

      {/* Floor Plans */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upstairs */}
        <Card className="p-6">
          <Heading level={3} variant="bebas" className="text-speakeasy-gold mb-4 text-center">
            🔺 Upstairs Floor
          </Heading>
          <div className="grid grid-cols-4 gap-3">
            {upstairsTables.map(renderTable)}
          </div>
          <div className="mt-4 text-center text-xs text-speakeasy-copper">
            Tables 1-8 • Main bar area
          </div>
        </Card>

        {/* Downstairs */}
        <Card className="p-6">
          <Heading level={3} variant="bebas" className="text-speakeasy-gold mb-4 text-center">
            🔻 Downstairs Floor
          </Heading>
          <div className="grid grid-cols-4 gap-3">
            {downstairsTables.map(renderTable)}
          </div>
          <div className="mt-4 text-center text-xs text-speakeasy-copper">
            Tables 9-16 • VIP lounge area
          </div>
        </Card>
      </div>

      {/* Table Details Modal */}
      {selectedTable && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="max-w-md w-full p-6 relative">
            <button
              onClick={() => setSelectedTable(null)}
              className="absolute top-4 right-4 text-speakeasy-copper hover:text-speakeasy-gold"
            >
              ✕
            </button>
            
            <Heading level={3} variant="bebas" className="text-speakeasy-gold mb-4">
              Table {selectedTable.table_number} ({selectedTable.floor})
            </Heading>
            
            <div className="space-y-3">
              <div className="flex justify-between">
                <Text className="text-speakeasy-copper">Capacity:</Text>
                <Text className="text-speakeasy-champagne">
                  {selectedTable.capacity_min}-{selectedTable.capacity_max} guests
                </Text>
              </div>
              
              {selectedTable.booking ? (
                <>
                  <div className="flex justify-between">
                    <Text className="text-speakeasy-copper">Customer:</Text>
                    <Text className="text-speakeasy-champagne">
                      {selectedTable.booking.customer_name}
                    </Text>
                  </div>
                  
                  <div className="flex justify-between">
                    <Text className="text-speakeasy-copper">Booking Ref:</Text>
                    <Text className="text-speakeasy-champagne font-mono">
                      {selectedTable.booking.booking_ref}
                    </Text>
                  </div>
                  
                  <div className="flex justify-between">
                    <Text className="text-speakeasy-copper">Party Size:</Text>
                    <Text className="text-speakeasy-champagne">
                      {selectedTable.booking.party_size} guests
                    </Text>
                  </div>
                  
                  <div className="flex justify-between">
                    <Text className="text-speakeasy-copper">Arrival Time:</Text>
                    <Text className="text-speakeasy-champagne">
                      {selectedTable.booking.arrival_time}
                    </Text>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <Text className="text-speakeasy-copper">Status:</Text>
                    <div>
                      {selectedTable.booking.status === 'arrived' ? (
                        <Badge className="bg-green-900/30 text-green-400 border-green-400/30">
                          ✅ Arrived
                        </Badge>
                      ) : selectedTable.booking.isLate ? (
                        <Badge className="bg-red-900/30 text-red-400 border-red-400/30">
                          ⏰ Late
                        </Badge>
                      ) : (
                        <Badge className="bg-blue-900/30 text-blue-400 border-blue-400/30">
                          ⏳ Expected
                        </Badge>
                      )}
                    </div>
                  </div>
                  
                  {selectedTable.booking.checked_in_at && (
                    <div className="flex justify-between">
                      <Text className="text-speakeasy-copper">Checked In:</Text>
                      <Text className="text-green-400">
                        {new Date(selectedTable.booking.checked_in_at).toLocaleTimeString()}
                      </Text>
                    </div>
                  )}
                  
                  {selectedTable.booking.hasSpecialRequests && (
                    <div className="pt-2 border-t border-speakeasy-gold/20">
                      <div className="flex items-center gap-2">
                        <span className="text-speakeasy-gold">⭐</span>
                        <Text className="text-speakeasy-gold">Special requests noted</Text>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-4">
                  <div className="text-4xl mb-2">🪑</div>
                  <Text className="text-speakeasy-champagne/60">
                    Table is available tonight
                  </Text>
                </div>
              )}
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};