'use client';

import { useState } from 'react';
import { QRScanner } from './QRScanner';
import { ManualCheckIn } from './ManualCheckIn';
import { CheckInConfirmation } from './CheckInConfirmation';
import { Heading } from '@/components/atoms';

interface CheckInSystemProps {
  onCheckInComplete: () => void;
}

type CheckInMode = 'qr' | 'manual';

interface CheckInResult {
  success: boolean;
  booking: {
    id: string;
    bookingRef: string;
    customerName: string;
    partySize: number;
    tableIds: number[];
    tables: Array<{
      table_number: number;
      floor: string;
    }>;
  };
  checkedInAt: string;
  method: 'qr' | 'manual';
}

export const CheckInSystem = ({ onCheckInComplete }: CheckInSystemProps) => {
  const [checkInMode, setCheckInMode] = useState<CheckInMode>('qr');
  const [lastCheckIn, setLastCheckIn] = useState<CheckInResult | null>(null);
  const [showConfirmation, setShowConfirmation] = useState(false);

  const handleCheckInSuccess = (result: CheckInResult) => {
    setLastCheckIn(result);
    setShowConfirmation(true);
    onCheckInComplete();

    // Auto-hide confirmation after 5 seconds
    setTimeout(() => {
      setShowConfirmation(false);
      setLastCheckIn(null);
    }, 5000);
  };

  const handleDismissConfirmation = () => {
    setShowConfirmation(false);
    setLastCheckIn(null);
  };

  return (
    <div className="space-y-6">
      {/* Header with Mode Toggle */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <Heading level={2} variant="bebas" className="text-speakeasy-gold">
            Guest Check-In System
          </Heading>
          <p className="text-speakeasy-champagne/80 text-sm">
            Scan QR codes or manually search and verify guests
          </p>
        </div>
        
        <div className="flex bg-speakeasy-noir/50 rounded-sm p-1 border border-speakeasy-gold/20">
          <button
            onClick={() => setCheckInMode('qr')}
            className={`px-4 py-2 rounded-sm text-sm font-bebas tracking-wider transition-all ${
              checkInMode === 'qr'
                ? 'bg-speakeasy-gold text-speakeasy-noir'
                : 'text-speakeasy-champagne hover:text-speakeasy-gold'
            }`}
          >
            📱 QR Scanner
          </button>
          <button
            onClick={() => setCheckInMode('manual')}
            className={`px-4 py-2 rounded-sm text-sm font-bebas tracking-wider transition-all ${
              checkInMode === 'manual'
                ? 'bg-speakeasy-gold text-speakeasy-noir'
                : 'text-speakeasy-champagne hover:text-speakeasy-gold'
            }`}
          >
            🔍 Manual Search
          </button>
        </div>
      </div>

      {/* Check-In Success Confirmation */}
      {showConfirmation && lastCheckIn && (
        <CheckInConfirmation
          result={lastCheckIn}
          onDismiss={handleDismissConfirmation}
        />
      )}

      {/* Check-In Interface */}
      {checkInMode === 'qr' ? (
        <QRScanner onCheckInSuccess={handleCheckInSuccess} />
      ) : (
        <ManualCheckIn onCheckInSuccess={handleCheckInSuccess} />
      )}
    </div>
  );
};