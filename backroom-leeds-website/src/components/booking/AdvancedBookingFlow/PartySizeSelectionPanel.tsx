'use client';

import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Users, Sparkles, AlertTriangle, Info } from 'lucide-react';
import { Badge } from '@/components/atoms/Badge';
import { Button } from '@/components/atoms/Button';

interface PartySizeSelectionPanelProps {
  value: number;
  onChange: (partySize: number) => void;
  maxPartySize?: number;
  onCombinationHint?: (shouldCombine: boolean) => void;
  className?: string;
}

interface PartySizeOption {
  size: number;
  label: string;
  description: string;
  icon: string;
  recommendedTables: string;
  requiresCombination: boolean;
  isPremium: boolean;
}

const PARTY_SIZE_OPTIONS: PartySizeOption[] = [
  {
    size: 2,
    label: 'Intimate',
    description: 'Perfect for couples',
    icon: '👫',
    recommendedTables: 'Any table',
    requiresCombination: false,
    isPremium: false
  },
  {
    size: 4,
    label: 'Small Group',
    description: 'Friends night out',
    icon: '👥',
    recommendedTables: 'Tables 1-16',
    requiresCombination: false,
    isPremium: false
  },
  {
    size: 6,
    label: 'Party Group',
    description: 'Celebration ready',
    icon: '🎉',
    recommendedTables: 'Larger tables',
    requiresCombination: false,
    isPremium: false
  },
  {
    size: 8,
    label: 'Large Party',
    description: 'Special occasion',
    icon: '🥳',
    recommendedTables: 'Premium tables',
    requiresCombination: true,
    isPremium: true
  },
  {
    size: 10,
    label: 'Big Group',
    description: 'Major celebration',
    icon: '🎊',
    recommendedTables: 'Combined tables',
    requiresCombination: true,
    isPremium: true
  },
  {
    size: 12,
    label: 'Extra Large',
    description: 'Ultimate party',
    icon: '🎆',
    recommendedTables: 'Combined premium',
    requiresCombination: true,
    isPremium: true
  }
];

const COMBINATION_THRESHOLD = 7;

export function PartySizeSelectionPanel({
  value,
  onChange,
  maxPartySize = 20,
  onCombinationHint,
  className = ''
}: PartySizeSelectionPanelProps) {
  const [customSize, setCustomSize] = useState<string>('');
  const [showCustomInput, setShowCustomInput] = useState(false);

  // Filter options based on max party size
  const availableOptions = useMemo(() => {
    return PARTY_SIZE_OPTIONS.filter(option => option.size <= maxPartySize);
  }, [maxPartySize]);

  // Combination hint logic
  const combinationHint = useMemo(() => {
    if (value >= COMBINATION_THRESHOLD) {
      return {
        show: true,
        message: value >= 10 
          ? 'Premium table combination recommended for optimal experience'
          : 'Table combination available for enhanced seating',
        type: value >= 10 ? 'premium' : 'standard'
      };
    }
    return { show: false, message: '', type: 'none' };
  }, [value]);

  // Update combination hint when party size changes
  React.useEffect(() => {
    if (onCombinationHint) {
      onCombinationHint(value >= COMBINATION_THRESHOLD);
    }
  }, [value, onCombinationHint]);

  const handleOptionSelect = (size: number) => {
    onChange(size);
    setShowCustomInput(false);
    setCustomSize('');
  };

  const handleCustomSizeSubmit = () => {
    const size = parseInt(customSize);
    if (size >= 1 && size <= maxPartySize) {
      onChange(size);
      setShowCustomInput(false);
      setCustomSize('');
    }
  };

  const handleCustomInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    if (inputValue === '' || (/^\d+$/.test(inputValue) && parseInt(inputValue) <= maxPartySize)) {
      setCustomSize(inputValue);
    }
  };

  return (
    <div className={`party-size-selection-panel ${className}`}>
      {/* Header */}
      <div className="mb-6">
        <h3 className="text-xl font-semibold text-gray-900 mb-2 flex items-center">
          <Users className="w-5 h-5 mr-2 text-amber-600" />
          Party Size
        </h3>
        <p className="text-gray-600">
          How many guests will be joining you for the evening?
        </p>
      </div>

      {/* Quick Selection Options */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
        {availableOptions.map((option) => (
          <motion.button
            key={option.size}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => handleOptionSelect(option.size)}
            className={`
              relative p-4 rounded-xl border-2 transition-all duration-200
              ${value === option.size 
                ? 'border-amber-500 bg-amber-50 shadow-md' 
                : 'border-gray-200 hover:border-amber-300 hover:bg-amber-25'
              }
              ${option.isPremium ? 'ring-2 ring-amber-200' : ''}
            `}
          >
            {/* Premium badge */}
            {option.isPremium && (
              <div className="absolute -top-2 -right-2">
                <Badge variant="secondary" className="bg-amber-100 text-amber-800 text-xs">
                  <Sparkles className="w-3 h-3 mr-1" />
                  Premium
                </Badge>
              </div>
            )}

            {/* Content */}
            <div className="text-center">
              <div className="text-2xl mb-2">{option.icon}</div>
              <div className="font-semibold text-gray-900">{option.size} Guests</div>
              <div className="text-sm text-amber-600 font-medium mt-1">{option.label}</div>
              <div className="text-xs text-gray-500 mt-1">{option.description}</div>
              
              {/* Table recommendation */}
              <div className="text-xs text-gray-400 mt-2 border-t pt-2">
                {option.recommendedTables}
              </div>

              {/* Combination indicator */}
              {option.requiresCombination && (
                <div className="flex items-center justify-center mt-2 text-xs text-amber-600">
                  <Sparkles className="w-3 h-3 mr-1" />
                  Combination
                </div>
              )}
            </div>
          </motion.button>
        ))}
      </div>

      {/* Custom Size Input */}
      {!showCustomInput ? (
        <Button
          variant="outline"
          onClick={() => setShowCustomInput(true)}
          className="w-full mb-6 border-dashed border-2 border-gray-300 hover:border-amber-300"
        >
          <Users className="w-4 h-4 mr-2" />
          Custom Party Size
        </Button>
      ) : (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="mb-6 p-4 border-2 border-amber-200 rounded-xl bg-amber-50"
        >
          <label htmlFor="customPartySize" className="block text-sm font-medium text-gray-700 mb-2">
            Enter custom party size (1-{maxPartySize} guests)
          </label>
          
          <div className="flex space-x-2">
            <input
              id="customPartySize"
              type="number"
              min="1"
              max={maxPartySize}
              value={customSize}
              onChange={handleCustomInputChange}
              className="flex-1 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              placeholder="e.g. 15"
              autoFocus
            />
            
            <Button
              onClick={handleCustomSizeSubmit}
              disabled={!customSize || parseInt(customSize) < 1}
              className="px-6"
            >
              Set Size
            </Button>
          </div>
          
          <Button
            variant="ghost"
            onClick={() => {
              setShowCustomInput(false);
              setCustomSize('');
            }}
            className="mt-2 text-sm text-gray-500 hover:text-gray-700"
          >
            Cancel
          </Button>
        </motion.div>
      )}

      {/* Current Selection Display */}
      {value > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white border border-gray-200 rounded-lg p-4 mb-6"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center">
                <Users className="w-6 h-6 text-amber-600" />
              </div>
              
              <div>
                <div className="font-semibold text-gray-900">
                  {value} Guest{value !== 1 ? 's' : ''}
                </div>
                <div className="text-sm text-gray-500">
                  {value <= 6 ? 'Standard seating' : 'Premium seating recommended'}
                </div>
              </div>
            </div>
            
            <Button
              variant="ghost"
              onClick={() => onChange(0)}
              className="text-gray-400 hover:text-gray-600"
            >
              Clear
            </Button>
          </div>
        </motion.div>
      )}

      {/* Combination Hint */}
      {combinationHint.show && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`
            p-4 rounded-xl border-l-4 mb-6
            ${combinationHint.type === 'premium' 
              ? 'bg-gradient-to-r from-amber-50 to-yellow-50 border-amber-400' 
              : 'bg-blue-50 border-blue-400'
            }
          `}
        >
          <div className="flex items-start space-x-3">
            <div className={`
              flex-shrink-0 p-2 rounded-full
              ${combinationHint.type === 'premium' ? 'bg-amber-100' : 'bg-blue-100'}
            `}>
              {combinationHint.type === 'premium' ? (
                <Sparkles className="w-4 h-4 text-amber-600" />
              ) : (
                <Info className="w-4 h-4 text-blue-600" />
              )}
            </div>
            
            <div className="flex-1">
              <h4 className={`
                font-medium mb-1
                ${combinationHint.type === 'premium' ? 'text-amber-900' : 'text-blue-900'}
              `}>
                {combinationHint.type === 'premium' ? 'Premium Experience Available' : 'Table Combination Suggested'}
              </h4>
              
              <p className={`
                text-sm
                ${combinationHint.type === 'premium' ? 'text-amber-800' : 'text-blue-800'}
              `}>
                {combinationHint.message}
              </p>
              
              <div className="flex flex-wrap gap-2 mt-2">
                <Badge variant="secondary" className={
                  combinationHint.type === 'premium' 
                    ? 'bg-amber-100 text-amber-800' 
                    : 'bg-blue-100 text-blue-800'
                }>
                  Enhanced Seating
                </Badge>
                
                {combinationHint.type === 'premium' && (
                  <Badge variant="secondary" className="bg-amber-100 text-amber-800">
                    VIP Experience
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Large Party Warning */}
      {value > maxPartySize * 0.8 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-6"
        >
          <div className="flex items-center space-x-2">
            <AlertTriangle className="w-5 h-5 text-orange-600" />
            <h4 className="font-medium text-orange-900">Large Party Notice</h4>
          </div>
          
          <p className="text-orange-800 text-sm mt-2">
            For parties of {Math.floor(maxPartySize * 0.8)}+ guests, we recommend contacting us directly 
            to ensure the best possible experience and seating arrangement.
          </p>
          
          <Button
            variant="outline"
            size="sm"
            className="mt-3 border-orange-300 text-orange-700 hover:bg-orange-50"
          >
            Contact Us
          </Button>
        </motion.div>
      )}

      {/* Capacity Limits Info */}
      <div className="bg-gray-50 rounded-lg p-4 text-center">
        <p className="text-xs text-gray-500">
          Maximum party size: {maxPartySize} guests • Table combinations available for 7+ guests
        </p>
      </div>
    </div>
  );
}