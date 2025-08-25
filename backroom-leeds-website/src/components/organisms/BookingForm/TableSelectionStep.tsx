'use client';

import { useState } from 'react';
import { useFormContext } from 'react-hook-form';
import { AccessibleFormField } from '@/components/molecules/AccessibleFormField';
import { TableAvailability } from '@/components/organisms/TableAvailability';
import { cn } from '@/lib/utils';
import type { TableSelectionData, CustomerDetailsData } from '@/types/booking';
import { DRINKS_PACKAGES, ARRIVAL_TIMES, type DrinksPackage } from '@/types/booking';

interface TableSelectionStepProps {
  eventDate: string;
  className?: string;
}

interface PackageCardProps {
  package: DrinksPackage;
  isSelected: boolean;
  onSelect: () => void;
}

function PackageCard({ package: pkg, isSelected, onSelect }: PackageCardProps) {
  return (
    <div
      className={cn(
        'border-2 rounded-lg p-4 cursor-pointer transition-all duration-200',
        'hover:shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500',
        {
          'border-blue-500 bg-blue-50 shadow-md': isSelected,
          'border-gray-200 hover:border-gray-300': !isSelected
        }
      )}
      role="button"
      tabIndex={0}
      aria-pressed={isSelected}
      onClick={onSelect}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelect();
        }
      }}
    >
      <div className="flex justify-between items-start mb-2">
        <h3 className={cn(
          'font-semibold text-lg',
          isSelected ? 'text-blue-900' : 'text-gray-900'
        )}>
          {pkg.name}
        </h3>
        <div className={cn(
          'text-xl font-bold',
          isSelected ? 'text-blue-600' : 'text-gray-700'
        )}>
          £{pkg.price}
        </div>
      </div>
      
      <p className="text-gray-600 mb-3">{pkg.description}</p>
      
      <div className="space-y-2">
        {pkg.bottles && (
          <div className="text-sm">
            <span className="font-medium">Bottles: </span>
            {pkg.bottles} premium bottle{pkg.bottles > 1 ? 's' : ''}
          </div>
        )}
        
        {pkg.mixers && (
          <div className="text-sm">
            <span className="font-medium">Mixers: </span>
            {pkg.mixers.join(', ')}
          </div>
        )}
        
        {pkg.features && pkg.features.length > 0 && (
          <div className="mt-3">
            <div className="text-sm font-medium mb-1">Includes:</div>
            <ul className="text-sm text-gray-600 space-y-1">
              {pkg.features.map((feature, index) => (
                <li key={index} className="flex items-start gap-1">
                  <span className="text-green-500 mt-0.5 flex-shrink-0">✓</span>
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
      
      {isSelected && (
        <div className="mt-3 text-sm text-blue-700 font-medium">
          ✓ Selected
        </div>
      )}
    </div>
  );
}

export function TableSelectionStep({ eventDate, className = '' }: TableSelectionStepProps) {
  const {
    register,
    formState: { errors },
    watch,
    setValue,
    trigger
  } = useFormContext<TableSelectionData & CustomerDetailsData>();

  const [selectedTables, setSelectedTables] = useState<number[]>([]);
  
  const partySize = watch('partySize');
  const selectedArrivalTime = watch('arrivalTime');
  const selectedPackage = watch('drinksPackage');

  const handleTableSelect = (tableId: number) => {
    const newSelection = [...selectedTables, tableId];
    setSelectedTables(newSelection);
    setValue('tableIds', newSelection);
    trigger('tableIds');
  };

  const handleTableDeselect = (tableId: number) => {
    const newSelection = selectedTables.filter(id => id !== tableId);
    setSelectedTables(newSelection);
    setValue('tableIds', newSelection);
    trigger('tableIds');
  };

  const handlePackageSelect = (packageId: string) => {
    setValue('drinksPackage', packageId);
    trigger('drinksPackage');
  };

  const selectedPackageData = DRINKS_PACKAGES.find(pkg => pkg.id === selectedPackage);
  const depositAmount = 50; // £50 deposit
  const totalAmount = selectedPackageData ? selectedPackageData.price : 0;
  const remainingBalance = totalAmount - depositAmount;

  return (
    <div className={`space-y-8 ${className}`}>
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Choose Your Table & Package
        </h2>
        <p className="text-gray-600">
          Select your preferred table and drinks package for your party of {partySize}
        </p>
      </div>

      {/* Table Selection */}
      <section>
        <h3 className="text-xl font-semibold mb-4">Select Your Table</h3>
        
        {/* Validation error for table selection */}
        {errors.tableIds && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <div className="text-red-600 text-sm font-medium">
              ⚠ {errors.tableIds.message}
            </div>
          </div>
        )}

        <TableAvailability
          eventDate={eventDate}
          partySize={partySize}
          selectedTables={selectedTables}
          maxTables={2}
          onTableSelect={handleTableSelect}
          onTableDeselect={handleTableDeselect}
        />
        
        {/* Hidden input to register tableIds for validation */}
        <input
          type="hidden"
          {...register('tableIds', { required: 'Please select at least one table' })}
        />
      </section>

      {/* Arrival Time Selection */}
      <section>
        <AccessibleFormField
          label="Arrival Time"
          required
          instructions="Choose when you'd like to arrive"
          error={errors.arrivalTime}
          type="select"
          {...register('arrivalTime')}
        >
          <option value="">Select arrival time...</option>
          {ARRIVAL_TIMES.map((time) => (
            <option key={time.value} value={time.value}>
              {time.label} - {time.description}
            </option>
          ))}
        </AccessibleFormField>
      </section>

      {/* Drinks Package Selection */}
      <section>
        <h3 className="text-xl font-semibold mb-4">Choose Your Drinks Package</h3>
        
        {/* Validation error for package selection */}
        {errors.drinksPackage && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <div className="text-red-600 text-sm font-medium">
              ⚠ {errors.drinksPackage.message}
            </div>
          </div>
        )}

        <div className="grid gap-4 md:grid-cols-3">
          {DRINKS_PACKAGES.map((pkg) => (
            <PackageCard
              key={pkg.id}
              package={pkg}
              isSelected={selectedPackage === pkg.id}
              onSelect={() => handlePackageSelect(pkg.id)}
            />
          ))}
        </div>
        
        {/* Hidden input to register drinksPackage for validation */}
        <input
          type="hidden"
          {...register('drinksPackage', { required: 'Please select a drinks package' })}
        />
      </section>

      {/* Booking Summary */}
      {selectedPackageData && (
        <section className="bg-gray-50 border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4">Booking Summary</h3>
          
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span>Party Size:</span>
              <span className="font-medium">{partySize} people</span>
            </div>
            
            {selectedTables.length > 0 && (
              <div className="flex justify-between">
                <span>Selected Tables:</span>
                <span className="font-medium">
                  {selectedTables.length === 1 
                    ? `Table ${selectedTables[0]}` 
                    : `Tables ${selectedTables.join(', ')}`
                  }
                </span>
              </div>
            )}
            
            {selectedArrivalTime && (
              <div className="flex justify-between">
                <span>Arrival Time:</span>
                <span className="font-medium">
                  {ARRIVAL_TIMES.find(t => t.value === selectedArrivalTime)?.label}
                </span>
              </div>
            )}
            
            <div className="flex justify-between">
              <span>Drinks Package:</span>
              <span className="font-medium">{selectedPackageData.name}</span>
            </div>
            
            <div className="border-t pt-3 mt-3">
              <div className="flex justify-between text-base">
                <span>Package Total:</span>
                <span className="font-semibold">£{totalAmount}</span>
              </div>
              <div className="flex justify-between text-sm text-gray-600 mt-1">
                <span>Deposit Today:</span>
                <span>£{depositAmount}</span>
              </div>
              <div className="flex justify-between text-sm text-gray-600">
                <span>Remaining Balance (pay on arrival):</span>
                <span>£{remainingBalance}</span>
              </div>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}