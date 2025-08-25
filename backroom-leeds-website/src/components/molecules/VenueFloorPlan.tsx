'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { Text, Button } from '@/components/atoms';
import { Card } from '@/components/molecules';
import { cn } from '@/lib/utils';

interface Table {
  id: number;
  x: number;
  y: number;
  capacity: number;
  shape: 'round' | 'rectangle';
  width: number;
  height: number;
  floor: 'upstairs' | 'downstairs';
  status: 'available' | 'occupied' | 'reserved' | 'maintenance';
  bookingRef?: string;
  customerName?: string;
  partySize?: number;
  arrivalTime?: string;
}

interface Booking {
  id: string;
  booking_ref: string;
  customer_name: string;
  table_ids: number[];
  party_size: number;
  arrival_time: string;
  status: string;
}

interface VenueFloorPlanProps {
  tables: Table[];
  bookings: Booking[];
  onTableAssignment: (bookingId: string, fromTables: number[], toTables: number[]) => Promise<void>;
  onTableStatusChange: (tableId: number, newStatus: string) => Promise<void>;
  selectedFloor: 'upstairs' | 'downstairs';
  onFloorChange: (floor: 'upstairs' | 'downstairs') => void;
  readOnly?: boolean;
  className?: string;
}

interface DragState {
  isDragging: boolean;
  draggedBooking: string | null;
  dragOffset: { x: number; y: number };
  draggedFromTables: number[];
}

export const VenueFloorPlan = ({
  tables,
  bookings,
  onTableAssignment,
  onTableStatusChange,
  selectedFloor,
  onFloorChange,
  readOnly = false,
  className,
}: VenueFloorPlanProps) => {
  const [dragState, setDragState] = useState<DragState>({
    isDragging: false,
    draggedBooking: null,
    dragOffset: { x: 0, y: 0 },
    draggedFromTables: [],
  });
  const [hoveredTable, setHoveredTable] = useState<number | null>(null);
  const [selectedTables, setSelectedTables] = useState<number[]>([]);
  const [showTableDetails, setShowTableDetails] = useState<number | null>(null);
  const floorPlanRef = useRef<HTMLDivElement>(null);

  // Floor dimensions (scaled down for display)
  const FLOOR_WIDTH = 800;
  const FLOOR_HEIGHT = 600;
  const SCALE = 0.8;

  // Initialize table positions based on actual venue layout
  const getDefaultTablePositions = useCallback((): Table[] => {
    const defaultTables: Table[] = [
      // Upstairs tables (1-8)
      { id: 1, x: 100, y: 100, capacity: 8, shape: 'round', width: 80, height: 80, floor: 'upstairs', status: 'available' },
      { id: 2, x: 250, y: 100, capacity: 8, shape: 'round', width: 80, height: 80, floor: 'upstairs', status: 'available' },
      { id: 3, x: 400, y: 100, capacity: 6, shape: 'round', width: 70, height: 70, floor: 'upstairs', status: 'available' },
      { id: 4, x: 550, y: 100, capacity: 6, shape: 'round', width: 70, height: 70, floor: 'upstairs', status: 'available' },
      { id: 5, x: 100, y: 250, capacity: 4, shape: 'round', width: 60, height: 60, floor: 'upstairs', status: 'available' },
      { id: 6, x: 250, y: 250, capacity: 4, shape: 'round', width: 60, height: 60, floor: 'upstairs', status: 'available' },
      { id: 7, x: 400, y: 250, capacity: 4, shape: 'round', width: 60, height: 60, floor: 'upstairs', status: 'available' },
      { id: 8, x: 550, y: 250, capacity: 4, shape: 'round', width: 60, height: 60, floor: 'upstairs', status: 'available' },

      // Downstairs tables (9-16)
      { id: 9, x: 120, y: 80, capacity: 6, shape: 'rectangle', width: 90, height: 60, floor: 'downstairs', status: 'available' },
      { id: 10, x: 280, y: 80, capacity: 6, shape: 'rectangle', width: 90, height: 60, floor: 'downstairs', status: 'available' },
      { id: 11, x: 440, y: 80, capacity: 8, shape: 'rectangle', width: 100, height: 70, floor: 'downstairs', status: 'available' },
      { id: 12, x: 120, y: 200, capacity: 4, shape: 'round', width: 60, height: 60, floor: 'downstairs', status: 'available' },
      { id: 13, x: 280, y: 200, capacity: 4, shape: 'round', width: 60, height: 60, floor: 'downstairs', status: 'available' },
      { id: 14, x: 440, y: 200, capacity: 6, shape: 'round', width: 70, height: 70, floor: 'downstairs', status: 'available' },
      // Special combined tables for large parties
      { id: 15, x: 150, y: 350, capacity: 10, shape: 'rectangle', width: 120, height: 80, floor: 'downstairs', status: 'available' },
      { id: 16, x: 350, y: 350, capacity: 10, shape: 'rectangle', width: 120, height: 80, floor: 'downstairs', status: 'available' },
    ];

    return defaultTables;
  }, []);

  // Merge table positions with current booking data
  const floorTables = tables.length > 0 ? tables : getDefaultTablePositions();
  const currentFloorTables = floorTables.filter(table => table.floor === selectedFloor);

  // Get booking assignment for table
  const getTableBooking = useCallback((tableId: number) => {
    return bookings.find(booking => booking.table_ids.includes(tableId));
  }, [bookings]);

  // Handle drag start
  const handleDragStart = useCallback((e: React.MouseEvent, booking: Booking) => {
    if (readOnly) return;
    
    const rect = floorPlanRef.current?.getBoundingClientRect();
    if (!rect) return;

    setDragState({
      isDragging: true,
      draggedBooking: booking.id,
      dragOffset: {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      },
      draggedFromTables: booking.table_ids,
    });
  }, [readOnly]);

  // Handle drag over
  const handleDragOver = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    
    const rect = floorPlanRef.current?.getBoundingClientRect();
    if (!rect || !dragState.isDragging) return;

    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Find table under cursor
    const tableUnder = currentFloorTables.find(table => 
      x >= table.x && x <= table.x + table.width &&
      y >= table.y && y <= table.y + table.height
    );

    setHoveredTable(tableUnder?.id || null);
  }, [currentFloorTables, dragState.isDragging]);

  // Handle drop
  const handleDrop = useCallback(async (e: React.MouseEvent) => {
    e.preventDefault();
    
    if (!dragState.isDragging || !dragState.draggedBooking || !hoveredTable) {
      setDragState({
        isDragging: false,
        draggedBooking: null,
        dragOffset: { x: 0, y: 0 },
        draggedFromTables: [],
      });
      setHoveredTable(null);
      return;
    }

    try {
      await onTableAssignment(
        dragState.draggedBooking,
        dragState.draggedFromTables,
        [hoveredTable]
      );
    } catch (error) {
      console.error('Failed to reassign table:', error);
    }

    setDragState({
      isDragging: false,
      draggedBooking: null,
      dragOffset: { x: 0, y: 0 },
      draggedFromTables: [],
    });
    setHoveredTable(null);
  }, [dragState, hoveredTable, onTableAssignment]);

  // Get table status based on bookings
  const getTableStatus = useCallback((table: Table): { status: string; booking?: Booking } => {
    const booking = getTableBooking(table.id);
    if (!booking) {
      return { status: table.status };
    }

    const status = booking.status === 'confirmed' ? 'reserved' : 
                  booking.status === 'arrived' ? 'occupied' :
                  booking.status === 'pending' ? 'pending' : 'available';
    
    return { status, booking };
  }, [getTableBooking]);

  // Get table color based on status
  const getTableColor = useCallback((status: string, isHovered: boolean, isDragTarget: boolean) => {
    const baseClasses = 'transition-all duration-200 cursor-pointer';
    
    if (isDragTarget) {
      return `${baseClasses} border-speakeasy-gold border-2 bg-speakeasy-gold/30`;
    }
    
    if (isHovered && !readOnly) {
      return `${baseClasses} border-speakeasy-gold border-2 transform scale-105`;
    }

    switch (status) {
      case 'available':
        return `${baseClasses} bg-green-500/20 border-green-500/40 text-green-400 border`;
      case 'reserved':
        return `${baseClasses} bg-blue-500/20 border-blue-500/40 text-blue-400 border`;
      case 'occupied':
        return `${baseClasses} bg-purple-500/20 border-purple-500/40 text-purple-400 border`;
      case 'pending':
        return `${baseClasses} bg-yellow-500/20 border-yellow-500/40 text-yellow-400 border`;
      case 'maintenance':
        return `${baseClasses} bg-red-500/20 border-red-500/40 text-red-400 border`;
      default:
        return `${baseClasses} bg-speakeasy-noir/20 border-speakeasy-gold/20 text-speakeasy-champagne border`;
    }
  }, [readOnly]);

  const handleTableClick = useCallback((tableId: number) => {
    if (readOnly) {
      setShowTableDetails(tableId);
      return;
    }

    if (selectedTables.includes(tableId)) {
      setSelectedTables(selectedTables.filter(id => id !== tableId));
    } else {
      setSelectedTables([...selectedTables, tableId]);
    }
  }, [readOnly, selectedTables]);

  const handleBulkTableAction = useCallback(async (action: string) => {
    if (selectedTables.length === 0) return;
    
    try {
      await Promise.all(
        selectedTables.map(tableId => onTableStatusChange(tableId, action))
      );
      setSelectedTables([]);
    } catch (error) {
      console.error('Failed to update table status:', error);
    }
  }, [selectedTables, onTableStatusChange]);

  return (
    <Card className={cn('overflow-hidden', className)}>
      {/* Floor Selection Header */}
      <div className="p-4 border-b border-speakeasy-gold/20">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <Text className="text-speakeasy-gold font-bebas text-lg">
              Venue Floor Plan
            </Text>
            <div className="flex bg-speakeasy-noir/30 rounded-lg p-1">
              <button
                onClick={() => onFloorChange('upstairs')}
                className={cn(
                  'px-4 py-2 rounded-md transition-all font-bebas text-sm',
                  selectedFloor === 'upstairs'
                    ? 'bg-speakeasy-gold text-speakeasy-noir'
                    : 'text-speakeasy-champagne hover:bg-speakeasy-gold/20'
                )}
              >
                UPSTAIRS
              </button>
              <button
                onClick={() => onFloorChange('downstairs')}
                className={cn(
                  'px-4 py-2 rounded-md transition-all font-bebas text-sm',
                  selectedFloor === 'downstairs'
                    ? 'bg-speakeasy-gold text-speakeasy-noir'
                    : 'text-speakeasy-champagne hover:bg-speakeasy-gold/20'
                )}
              >
                DOWNSTAIRS
              </button>
            </div>
          </div>
          
          {!readOnly && selectedTables.length > 0 && (
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleBulkTableAction('available')}
                className="text-green-400 border-green-400/20"
              >
                Mark Available
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleBulkTableAction('maintenance')}
                className="text-red-400 border-red-400/20"
              >
                Mark Maintenance
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setSelectedTables([])}
                className="text-speakeasy-champagne/60"
              >
                Clear ({selectedTables.length})
              </Button>
            </div>
          )}
        </div>

        {/* Legend */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-2 text-xs">
          {[
            { status: 'available', label: 'Available', color: 'bg-green-500/20 text-green-400' },
            { status: 'reserved', label: 'Reserved', color: 'bg-blue-500/20 text-blue-400' },
            { status: 'occupied', label: 'Occupied', color: 'bg-purple-500/20 text-purple-400' },
            { status: 'pending', label: 'Pending', color: 'bg-yellow-500/20 text-yellow-400' },
            { status: 'maintenance', label: 'Maintenance', color: 'bg-red-500/20 text-red-400' },
          ].map(item => (
            <div key={item.status} className="flex items-center gap-2">
              <div className={cn('w-3 h-3 rounded border', item.color)} />
              <span className="text-speakeasy-champagne/70">{item.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Floor Plan */}
      <div className="p-6 bg-speakeasy-noir/10">
        <div
          ref={floorPlanRef}
          className="relative mx-auto border-2 border-speakeasy-gold/20 rounded-lg overflow-hidden"
          style={{ 
            width: FLOOR_WIDTH * SCALE, 
            height: FLOOR_HEIGHT * SCALE,
            backgroundImage: 'radial-gradient(circle at 25px 25px, rgba(218, 165, 32, 0.1) 2px, transparent 0)',
            backgroundSize: '50px 50px'
          }}
          onMouseMove={handleDragOver}
          onMouseUp={handleDrop}
          onMouseLeave={() => {
            setHoveredTable(null);
            if (dragState.isDragging) {
              setDragState({
                isDragging: false,
                draggedBooking: null,
                dragOffset: { x: 0, y: 0 },
                draggedFromTables: [],
              });
            }
          }}
        >
          {/* Floor Labels */}
          <div className="absolute top-4 left-4">
            <Text className="text-speakeasy-gold font-bebas text-lg opacity-60">
              {selectedFloor.toUpperCase()}
            </Text>
          </div>

          {/* Tables */}
          {currentFloorTables.map(table => {
            const { status, booking } = getTableStatus(table);
            const isHovered = hoveredTable === table.id;
            const isDragTarget = dragState.isDragging && isHovered;
            const isSelected = selectedTables.includes(table.id);
            
            return (
              <div
                key={table.id}
                className={cn(
                  'absolute flex items-center justify-center text-xs font-medium select-none',
                  getTableColor(status, isHovered, isDragTarget),
                  isSelected && 'ring-2 ring-speakeasy-gold',
                  table.shape === 'round' ? 'rounded-full' : 'rounded-lg'
                )}
                style={{
                  left: table.x * SCALE,
                  top: table.y * SCALE,
                  width: table.width * SCALE,
                  height: table.height * SCALE,
                }}
                onClick={() => handleTableClick(table.id)}
                onMouseDown={(e) => booking && handleDragStart(e, booking)}
              >
                <div className="text-center">
                  <div className="font-bold">{table.id}</div>
                  <div className="text-xs opacity-80">{table.capacity}</div>
                  {booking && (
                    <div className="text-xs opacity-90 mt-1">
                      <div className="truncate w-16" title={booking.customer_name}>
                        {booking.customer_name.split(' ')[0]}
                      </div>
                      <div>{booking.party_size}p</div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {/* Drag Preview */}
          {dragState.isDragging && (
            <div
              className="absolute pointer-events-none bg-speakeasy-gold/30 border-2 border-speakeasy-gold rounded-lg"
              style={{
                left: dragState.dragOffset.x - 40,
                top: dragState.dragOffset.y - 20,
                width: 80,
                height: 40,
              }}
            >
              <div className="flex items-center justify-center h-full text-speakeasy-gold font-medium">
                Moving...
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Table Details Modal */}
      {showTableDetails && (
        <div className="fixed inset-0 bg-speakeasy-noir/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-md">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <Text className="text-speakeasy-gold font-bebas text-lg">
                  Table {showTableDetails} Details
                </Text>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowTableDetails(null)}
                  className="text-speakeasy-champagne/60 hover:text-speakeasy-gold"
                >
                  ✕
                </Button>
              </div>
              
              {(() => {
                const table = currentFloorTables.find(t => t.id === showTableDetails);
                const { status, booking } = getTableStatus(table!);
                
                return (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <Text className="text-speakeasy-champagne/60">Capacity:</Text>
                        <Text className="text-speakeasy-champagne">{table?.capacity} guests</Text>
                      </div>
                      <div>
                        <Text className="text-speakeasy-champagne/60">Status:</Text>
                        <span className={cn(
                          'px-2 py-1 rounded text-xs capitalize',
                          getTableColor(status, false, false).split(' ').slice(3).join(' ')
                        )}>
                          {status}
                        </span>
                      </div>
                    </div>
                    
                    {booking && (
                      <div className="pt-4 border-t border-speakeasy-gold/20">
                        <Text className="text-speakeasy-gold font-medium mb-2">
                          Current Booking
                        </Text>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-speakeasy-champagne/60">Customer:</span>
                            <span className="text-speakeasy-champagne">{booking.customer_name}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-speakeasy-champagne/60">Reference:</span>
                            <span className="text-speakeasy-champagne font-mono">{booking.booking_ref}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-speakeasy-champagne/60">Party Size:</span>
                            <span className="text-speakeasy-champagne">{booking.party_size} guests</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-speakeasy-champagne/60">Arrival Time:</span>
                            <span className="text-speakeasy-champagne">{booking.arrival_time}</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>
          </Card>
        </div>
      )}
    </Card>
  );
};

export default VenueFloorPlan;