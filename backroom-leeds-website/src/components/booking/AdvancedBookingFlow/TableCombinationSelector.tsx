'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Users, ArrowRight, AlertCircle, CheckCircle } from 'lucide-react';
import { Badge } from '@/components/atoms/Badge';
import { Button } from '@/components/atoms/Button';
import { LoadingSpinner } from '@/components/atoms/LoadingSpinner';
import { TableCombination, CombinationCheckResult, TableLayoutPosition } from '@/types/advanced-booking.types';

interface TableCombinationSelectorProps {
  partySize: number;
  selectedDate: string;
  selectedTime: string;
  onCombinationSelect: (combination: CombinationCheckResult | null) => void;
  className?: string;
}

interface VisualTable {
  id: number;
  tableNumber: number;
  position: TableLayoutPosition;
  capacity: { min: number; max: number };
  isAvailable: boolean;
  isSelected: boolean;
  isCombined: boolean;
  combinationGroup?: string;
}

// Mock table layout data - would come from API in real implementation
const MOCK_TABLES: VisualTable[] = [
  // Tables 15 & 16 (combinable pair)
  {
    id: 15,
    tableNumber: 15,
    position: { tableNumber: 15, positionX: 300, positionY: 100, rotation: 0, shape: 'rectangle', width: 120, height: 80, floor: 'downstairs' },
    capacity: { min: 2, max: 6 },
    isAvailable: true,
    isSelected: false,
    isCombined: false,
    combinationGroup: 'bar-combination'
  },
  {
    id: 16,
    tableNumber: 16,
    position: { tableNumber: 16, positionX: 350, positionY: 100, rotation: 0, shape: 'rectangle', width: 120, height: 80, floor: 'downstairs' },
    capacity: { min: 4, max: 8 },
    isAvailable: true,
    isSelected: false,
    isCombined: false,
    combinationGroup: 'bar-combination'
  }
];

const COMBINATION_THRESHOLD = 7; // Auto-suggest combination for 7+ people

export function TableCombinationSelector({
  partySize,
  selectedDate,
  selectedTime,
  onCombinationSelect,
  className = ''
}: TableCombinationSelectorProps) {
  const [tables, setTables] = useState<VisualTable[]>(MOCK_TABLES);
  const [isLoading, setIsLoading] = useState(false);
  const [combinationResult, setCombinationResult] = useState<CombinationCheckResult | null>(null);
  const [showCombinationSuggestion, setShowCombinationSuggestion] = useState(false);

  // Check if combination should be suggested
  const shouldSuggestCombination = useMemo(() => {
    return partySize >= COMBINATION_THRESHOLD;
  }, [partySize]);

  // Check combination availability
  const checkCombinationAvailability = async () => {
    if (!shouldSuggestCombination) return;

    setIsLoading(true);
    try {
      // Mock API call - would check real availability
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const combinableTables = tables.filter(t => t.combinationGroup === 'bar-combination');
      const allAvailable = combinableTables.every(t => t.isAvailable);
      
      if (allAvailable && combinableTables.length >= 2) {
        const result: CombinationCheckResult = {
          shouldCombine: true,
          combinationId: 'combo-tables-15-16',
          tables: [15, 16],
          totalCapacity: 14, // Combined max capacity
          notes: `Perfect for ${partySize} guests! Combined seating at bar-side tables with optimal view.`
        };
        
        setCombinationResult(result);
        setShowCombinationSuggestion(true);
      } else {
        setCombinationResult({
          shouldCombine: false,
          tables: [],
          totalCapacity: 0,
          notes: 'No suitable table combinations available for this party size.'
        });
      }
    } catch (error) {
      console.error('Failed to check combination availability:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    checkCombinationAvailability();
  }, [partySize, selectedDate, selectedTime, shouldSuggestCombination]);

  const handleCombinationAccept = () => {
    if (combinationResult) {
      // Update table visual state
      setTables(prev => prev.map(table => ({
        ...table,
        isSelected: combinationResult.tables.includes(table.tableNumber),
        isCombined: combinationResult.tables.includes(table.tableNumber)
      })));
      
      onCombinationSelect(combinationResult);
      setShowCombinationSuggestion(false);
    }
  };

  const handleCombinationDecline = () => {
    setShowCombinationSuggestion(false);
    onCombinationSelect(null);
  };

  const handleTableClick = (tableId: number) => {
    // Handle individual table selection (fallback option)
    setTables(prev => prev.map(table => ({
      ...table,
      isSelected: table.id === tableId ? !table.isSelected : false,
      isCombined: false
    })));
    
    const selectedTable = tables.find(t => t.id === tableId);
    if (selectedTable) {
      onCombinationSelect({
        shouldCombine: false,
        tables: [selectedTable.tableNumber],
        totalCapacity: selectedTable.capacity.max,
        notes: `Individual table booking for ${partySize} guests.`
      });
    }
  };

  return (
    <div className={`table-combination-selector ${className}`}>
      {/* Header */}
      <div className="mb-6">
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          Table Selection for {partySize} Guests
        </h3>
        <p className="text-gray-600">
          {shouldSuggestCombination 
            ? 'We recommend combining tables for your larger party size.' 
            : 'Select from our available tables below.'}
        </p>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center p-8">
          <LoadingSpinner size="lg" />
          <span className="ml-3 text-gray-600">Checking table combinations...</span>
        </div>
      )}

      {/* Combination Suggestion */}
      <AnimatePresence>
        {showCombinationSuggestion && combinationResult?.shouldCombine && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-200 rounded-xl p-6 mb-6"
          >
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0">
                <Sparkles className="w-6 h-6 text-amber-600" />
              </div>
              
              <div className="flex-1">
                <h4 className="text-lg font-semibold text-amber-900 mb-2">
                  Perfect Combination Available!
                </h4>
                
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Users className="w-4 h-4 text-amber-600" />
                    <span className="text-amber-800">
                      Tables {combinationResult.tables.join(' & ')} - Combined capacity up to {combinationResult.totalCapacity} guests
                    </span>
                  </div>
                  
                  <p className="text-amber-800">{combinationResult.notes}</p>
                  
                  <div className="flex items-center space-x-2">
                    <Badge variant="secondary" className="bg-amber-100 text-amber-800">
                      Premium Setup
                    </Badge>
                    <Badge variant="secondary" className="bg-amber-100 text-amber-800">
                      Bar View
                    </Badge>
                  </div>
                </div>
                
                <div className="flex space-x-3 mt-4">
                  <Button
                    onClick={handleCombinationAccept}
                    className="bg-amber-600 hover:bg-amber-700 text-white"
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Accept Combination
                  </Button>
                  
                  <Button
                    variant="outline"
                    onClick={handleCombinationDecline}
                    className="border-amber-300 text-amber-700 hover:bg-amber-50"
                  >
                    Choose Individual Tables
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Visual Table Layout */}
      <div className="bg-gray-900 rounded-xl p-8 mb-6">
        <div className="text-center mb-6">
          <h4 className="text-lg font-medium text-white mb-2">Downstairs Layout</h4>
          <p className="text-gray-400">Tables 15 & 16 - Bar Area</p>
        </div>
        
        <div className="relative max-w-2xl mx-auto" style={{ height: '300px' }}>
          {/* Background elements */}
          <div className="absolute inset-0 bg-gradient-to-b from-gray-800 to-gray-900 rounded-lg"></div>
          
          {/* Bar representation */}
          <div className="absolute top-4 left-8 right-8 h-12 bg-amber-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-medium">Bar</span>
          </div>
          
          {/* Tables */}
          {tables.map((table) => (
            <motion.div
              key={table.id}
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={`
                absolute cursor-pointer transition-all duration-300
                ${table.isSelected || table.isCombined 
                  ? 'bg-amber-500 shadow-xl shadow-amber-500/30' 
                  : table.isAvailable 
                    ? 'bg-green-500 hover:bg-green-400' 
                    : 'bg-red-500 cursor-not-allowed'
                }
                rounded-lg flex items-center justify-center text-white font-semibold
              `}
              style={{
                left: `${(table.position.positionX / 500) * 100}%`,
                top: `${(table.position.positionY / 200) * 100 + 80}px`,
                width: `${table.position.width}px`,
                height: `${table.position.height}px`
              }}
              onClick={() => table.isAvailable && handleTableClick(table.id)}
            >
              <div className="text-center">
                <div className="text-lg font-bold">T{table.tableNumber}</div>
                <div className="text-xs opacity-90">
                  {table.capacity.min}-{table.capacity.max}
                </div>
              </div>
              
              {/* Combination indicator */}
              {table.isCombined && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute -top-2 -right-2 w-6 h-6 bg-amber-600 rounded-full flex items-center justify-center"
                >
                  <Sparkles className="w-3 h-3 text-white" />
                </motion.div>
              )}
            </motion.div>
          ))}
          
          {/* Combination connection line */}
          {combinationResult?.shouldCombine && tables.some(t => t.isCombined) && (
            <motion.svg
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="absolute inset-0 pointer-events-none"
              width="100%"
              height="100%"
            >
              <defs>
                <linearGradient id="connectionGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#f59e0b" />
                  <stop offset="100%" stopColor="#d97706" />
                </linearGradient>
              </defs>
              
              <motion.line
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 0.8, ease: "easeInOut" }}
                x1="360"
                y1="160"
                x2="410"
                y2="160"
                stroke="url(#connectionGradient)"
                strokeWidth="3"
                strokeDasharray="5,5"
              />
            </motion.svg>
          )}
        </div>
        
        {/* Legend */}
        <div className="flex justify-center space-x-6 mt-6">
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-green-500 rounded"></div>
            <span className="text-white text-sm">Available</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-amber-500 rounded"></div>
            <span className="text-white text-sm">Selected</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-red-500 rounded"></div>
            <span className="text-white text-sm">Unavailable</span>
          </div>
        </div>
      </div>

      {/* Selection Summary */}
      {(combinationResult || tables.some(t => t.isSelected)) && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-green-50 border border-green-200 rounded-lg p-4"
        >
          <div className="flex items-center space-x-2">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <h5 className="font-medium text-green-900">Selection Confirmed</h5>
          </div>
          
          <div className="mt-2 text-green-800">
            {combinationResult?.shouldCombine ? (
              <p>
                <strong>Combined Tables:</strong> {combinationResult.tables.join(' & ')} 
                <br />
                <strong>Total Capacity:</strong> Up to {combinationResult.totalCapacity} guests
                <br />
                <strong>Features:</strong> Premium bar-side seating with optimal views
              </p>
            ) : (
              <p>Individual table selected - perfect for your party size</p>
            )}
          </div>
        </motion.div>
      )}

      {/* Capacity Warning */}
      {partySize > (combinationResult?.totalCapacity || 0) && combinationResult && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-red-50 border border-red-200 rounded-lg p-4 mt-4"
        >
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-5 h-5 text-red-600" />
            <h5 className="font-medium text-red-900">Capacity Notice</h5>
          </div>
          
          <p className="mt-2 text-red-800">
            Your party size ({partySize}) exceeds the maximum capacity of the selected tables. 
            Please contact us directly for larger group arrangements.
          </p>
        </motion.div>
      )}
    </div>
  );
}