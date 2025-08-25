'use client';

import { useState, useId } from 'react';
import { useTableAvailability, type TableStatus } from '@/hooks/useTableAvailability';
import { LoadingSpinner } from '@/components/atoms/LoadingSpinner';
import { Button } from '@/components/atoms/Button';
import { cn } from '@/lib/utils';

export interface TableAvailabilityProps {
  eventDate?: string;
  partySize?: number;
  selectedTables?: number[];
  maxTables?: number;
  onTableSelect?: (tableId: number) => void;
  onTableDeselect?: (tableId: number) => void;
  className?: string;
}

interface TableButtonProps {
  table: TableStatus;
  isSelected: boolean;
  isOptimisticUpdate: boolean;
  canSelect: boolean;
  onSelect: () => void;
  onDeselect: () => void;
}

function TableButton({ 
  table, 
  isSelected, 
  isOptimisticUpdate, 
  canSelect, 
  onSelect, 
  onDeselect 
}: TableButtonProps) {
  const buttonId = useId();
  const isAvailable = table.status === 'available' && table.is_active;
  const isDisabled = !isAvailable || (!canSelect && !isSelected);

  const handleClick = () => {
    if (isDisabled) return;
    
    if (isSelected) {
      onDeselect();
    } else {
      onSelect();
    }
  };

  const getStatusLabel = () => {
    if (isOptimisticUpdate) return 'Selecting...';
    if (isSelected) return 'Selected';
    if (!isAvailable) return 'Unavailable';
    return 'Available';
  };

  const getAriaLabel = () => {
    const baseLabel = `Table ${table.table_number}, ${table.floor} floor, capacity ${table.capacity_min}-${table.capacity_max} people`;
    const statusLabel = getStatusLabel();
    const featuresLabel = table.features?.length ? `, features: ${table.features.join(', ')}` : '';
    
    return `${baseLabel}, ${statusLabel}${featuresLabel}`;
  };

  return (
    <button
      id={buttonId}
      type="button"
      className={cn(
        'table-button relative flex flex-col items-center justify-center p-4 rounded-lg border-2 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500',
        'min-h-[100px] min-w-[120px]',
        {
          // Available state
          'border-green-300 bg-green-50 hover:bg-green-100 hover:border-green-400 text-green-800': 
            isAvailable && !isSelected,
          
          // Selected state
          'border-blue-500 bg-blue-100 text-blue-800 ring-2 ring-blue-200': 
            isSelected && !isOptimisticUpdate,
          
          // Optimistic update state
          'border-yellow-400 bg-yellow-50 text-yellow-800': 
            isOptimisticUpdate,
          
          // Unavailable state
          'border-gray-300 bg-gray-100 text-gray-500 cursor-not-allowed': 
            !isAvailable,
          
          // Disabled state (max tables reached)
          'opacity-50 cursor-not-allowed': 
            isDisabled
        }
      )}
      onClick={handleClick}
      disabled={isDisabled}
      aria-label={getAriaLabel()}
      aria-pressed={isSelected}
      aria-describedby={table.description ? `${buttonId}-description` : undefined}
    >
      {/* Table number */}
      <div className="text-2xl font-bold mb-1">
        {table.table_number}
      </div>
      
      {/* Capacity */}
      <div className="text-sm font-medium mb-2">
        {table.capacity_min === table.capacity_max 
          ? `${table.capacity_max} seats` 
          : `${table.capacity_min}-${table.capacity_max} seats`
        }
      </div>
      
      {/* Status indicator */}
      <div className="flex items-center gap-1 text-xs">
        {isOptimisticUpdate && <LoadingSpinner size="sm" />}
        <span>{getStatusLabel()}</span>
      </div>
      
      {/* Features indicator */}
      {table.features && table.features.length > 0 && (
        <div className="absolute top-2 right-2">
          <span 
            className="text-xs bg-black/20 rounded-full px-2 py-1"
            title={`Features: ${table.features.join(', ')}`}
          >
            ✨
          </span>
        </div>
      )}
      
      {/* Hidden description for screen readers */}
      {table.description && (
        <div 
          id={`${buttonId}-description`} 
          className="sr-only"
        >
          {table.description}
        </div>
      )}
    </button>
  );
}

interface FloorSectionProps {
  title: string;
  tables: TableStatus[];
  selectedTables: number[];
  optimisticUpdates: Record<number, boolean>;
  canSelectMore: boolean;
  onTableSelect: (tableId: number) => void;
  onTableDeselect: (tableId: number) => void;
}

function FloorSection({ 
  title, 
  tables, 
  selectedTables, 
  optimisticUpdates, 
  canSelectMore,
  onTableSelect, 
  onTableDeselect 
}: FloorSectionProps) {
  const headingId = useId();
  
  if (tables.length === 0) return null;

  return (
    <section className="mb-8">
      <h3 
        id={headingId} 
        className="text-xl font-semibold mb-4 text-center"
      >
        {title}
      </h3>
      <div 
        className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 justify-items-center"
        role="grid"
        aria-labelledby={headingId}
      >
        {tables.map((table) => {
          const isSelected = selectedTables.includes(table.table_number);
          const isOptimisticUpdate = optimisticUpdates[table.table_number];
          const canSelect = canSelectMore || isSelected;

          return (
            <TableButton
              key={table.table_number}
              table={table}
              isSelected={isSelected}
              isOptimisticUpdate={isOptimisticUpdate}
              canSelect={canSelect}
              onSelect={() => onTableSelect(table.table_number)}
              onDeselect={() => onTableDeselect(table.table_number)}
            />
          );
        })}
      </div>
    </section>
  );
}

export function TableAvailability({
  eventDate,
  partySize,
  selectedTables = [],
  maxTables = 2,
  onTableSelect,
  onTableDeselect,
  className = ''
}: TableAvailabilityProps) {
  const [optimisticUpdates, setOptimisticUpdates] = useState<Record<number, boolean>>({});
  
  const {
    tables,
    loading,
    error,
    refreshAvailability,
    upstairsTables,
    downstairsTables,
    availableTables
  } = useTableAvailability({ 
    eventDate, 
    partySize,
    refreshInterval: 30000 // Refresh every 30 seconds
  });

  const canSelectMore = selectedTables.length < maxTables;

  const handleTableSelect = async (tableId: number) => {
    if (!canSelectMore) return;

    // Optimistic update
    setOptimisticUpdates(prev => ({ ...prev, [tableId]: true }));

    try {
      onTableSelect?.(tableId);
    } catch (error) {
      console.error('Table selection failed:', error);
      // Revert optimistic update
      setOptimisticUpdates(prev => {
        const newUpdates = { ...prev };
        delete newUpdates[tableId];
        return newUpdates;
      });
    } finally {
      // Clear optimistic update after a short delay
      setTimeout(() => {
        setOptimisticUpdates(prev => {
          const newUpdates = { ...prev };
          delete newUpdates[tableId];
          return newUpdates;
        });
      }, 1000);
    }
  };

  const handleTableDeselect = (tableId: number) => {
    onTableDeselect?.(tableId);
  };

  if (loading) {
    return (
      <div 
        className={cn('flex items-center justify-center py-12', className)}
        role="status" 
        aria-label="Loading table availability"
      >
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-gray-600">Loading table availability...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div 
        className={cn('py-8 text-center', className)}
        role="alert"
        aria-live="polite"
      >
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md mx-auto">
          <h3 className="text-lg font-medium text-red-800 mb-2">
            Unable to Load Tables
          </h3>
          <p className="text-red-600 mb-4">{error}</p>
          <Button
            onClick={refreshAvailability}
            variant="outline"
            size="sm"
            className="border-red-300 text-red-700 hover:bg-red-50"
          >
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  if (tables.length === 0) {
    return (
      <div 
        className={cn('py-8 text-center', className)}
        role="status"
      >
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 max-w-md mx-auto">
          <h3 className="text-lg font-medium text-gray-800 mb-2">
            No Tables Available
          </h3>
          <p className="text-gray-600 mb-4">
            {partySize 
              ? `No tables available for ${partySize} people on ${eventDate}.`
              : 'No tables are currently available.'
            }
          </p>
          <Button
            onClick={refreshAvailability}
            variant="outline"
            size="sm"
          >
            Refresh Availability
          </Button>
        </div>
      </div>
    );
  }

  const availableCount = availableTables.length;
  const totalTables = tables.length;

  return (
    <div 
      className={cn('table-availability', className)}
      role="main"
      aria-label="Table availability and selection"
    >
      {/* Header with summary */}
      <div className="mb-6 text-center">
        <h2 className="text-2xl font-bold mb-2">
          Select Your Table{selectedTables.length > 1 ? 's' : ''}
        </h2>
        <p className="text-gray-600 mb-2">
          {availableCount} of {totalTables} tables available
          {partySize && ` for ${partySize} people`}
          {eventDate && ` on ${new Date(eventDate).toLocaleDateString()}`}
        </p>
        {maxTables > 1 && (
          <p className="text-sm text-gray-500">
            You can select up to {maxTables} tables. 
            Selected: {selectedTables.length}/{maxTables}
          </p>
        )}
        <Button
          onClick={refreshAvailability}
          variant="ghost"
          size="sm"
          className="mt-2"
          aria-label="Refresh table availability"
        >
          🔄 Refresh
        </Button>
      </div>

      {/* Table grid by floor */}
      <div className="space-y-8">
        <FloorSection
          title="Upstairs Tables"
          tables={upstairsTables}
          selectedTables={selectedTables}
          optimisticUpdates={optimisticUpdates}
          canSelectMore={canSelectMore}
          onTableSelect={handleTableSelect}
          onTableDeselect={handleTableDeselect}
        />
        
        <FloorSection
          title="Downstairs Tables"
          tables={downstairsTables}
          selectedTables={selectedTables}
          optimisticUpdates={optimisticUpdates}
          canSelectMore={canSelectMore}
          onTableSelect={handleTableSelect}
          onTableDeselect={handleTableDeselect}
        />
      </div>

      {/* Legend */}
      <div className="mt-8 bg-gray-50 border border-gray-200 rounded-lg p-4">
        <h4 className="font-medium mb-3 text-center">Legend</h4>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-green-100 border border-green-300 rounded"></div>
            <span>Available</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-blue-100 border border-blue-500 rounded"></div>
            <span>Selected</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-gray-100 border border-gray-300 rounded"></div>
            <span>Unavailable</span>
          </div>
          <div className="flex items-center gap-2">
            <span>✨</span>
            <span>Special Features</span>
          </div>
        </div>
      </div>
    </div>
  );
}