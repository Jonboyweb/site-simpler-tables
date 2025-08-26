'use client';

import { useEffect } from 'react';
import { Card } from '@/components/molecules';
import { Heading, Text, Button } from '@/components/atoms';

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

interface CheckInConfirmationProps {
  result: CheckInResult;
  onDismiss: () => void;
}

export const CheckInConfirmation = ({ result, onDismiss }: CheckInConfirmationProps) => {
  // Auto-dismiss after 10 seconds if not manually dismissed
  useEffect(() => {
    const timer = setTimeout(() => {
      onDismiss();
    }, 10000);

    return () => clearTimeout(timer);
  }, [onDismiss]);

  const formatTime = (isoString: string) => {
    return new Date(isoString).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <Card className="max-w-md w-full p-8 text-center relative animate-in slide-in-from-bottom duration-300">
        {/* Success Animation */}
        <div className="mb-6">
          <div className="w-20 h-20 mx-auto mb-4 relative">
            <div className="w-20 h-20 border-4 border-green-400 rounded-full flex items-center justify-center animate-in zoom-in duration-500">
              <span className="text-4xl animate-in zoom-in duration-700 delay-200">✅</span>
            </div>
            <div className="absolute inset-0 border-4 border-green-400 rounded-full animate-ping opacity-30"></div>
          </div>
          
          <Heading level={2} variant="bebas" className="text-green-400 mb-2">
            Check-In Successful!
          </Heading>
          
          <Text className="text-speakeasy-champagne/80">
            Guest has been successfully checked in
          </Text>
        </div>

        {/* Booking Details */}
        <div className="space-y-3 mb-6 text-left bg-speakeasy-noir/30 p-4 rounded-sm border border-green-400/20">
          <div className="flex justify-between">
            <Text className="text-speakeasy-copper">Customer:</Text>
            <Text className="text-speakeasy-champagne font-medium">
              {result.booking.customerName}
            </Text>
          </div>
          
          <div className="flex justify-between">
            <Text className="text-speakeasy-copper">Booking Ref:</Text>
            <Text className="text-speakeasy-champagne font-mono text-sm">
              {result.booking.bookingRef}
            </Text>
          </div>
          
          <div className="flex justify-between">
            <Text className="text-speakeasy-copper">Party Size:</Text>
            <Text className="text-speakeasy-champagne">
              {result.booking.partySize} guests
            </Text>
          </div>
          
          <div className="flex justify-between">
            <Text className="text-speakeasy-copper">Table(s):</Text>
            <Text className="text-speakeasy-champagne">
              {result.booking.tables.map(t => 
                `${t.table_number} (${t.floor})`
              ).join(', ')}
            </Text>
          </div>
          
          <div className="flex justify-between">
            <Text className="text-speakeasy-copper">Check-in Time:</Text>
            <Text className="text-green-400 font-medium">
              {formatTime(result.checkedInAt)}
            </Text>
          </div>
          
          <div className="flex justify-between">
            <Text className="text-speakeasy-copper">Method:</Text>
            <Text className="text-speakeasy-champagne">
              {result.method === 'qr' ? '📱 QR Code' : '🔍 Manual Search'}
            </Text>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <Button
            onClick={onDismiss}
            className="flex-1 bg-speakeasy-gold text-speakeasy-noir hover:bg-speakeasy-champagne"
          >
            Continue
          </Button>
        </div>

        {/* Auto-dismiss indicator */}
        <div className="mt-4">
          <Text variant="caption" className="text-speakeasy-copper/60">
            This confirmation will auto-close in a few seconds
          </Text>
        </div>

        {/* Close button */}
        <button
          onClick={onDismiss}
          className="absolute top-4 right-4 text-speakeasy-copper hover:text-speakeasy-gold transition-colors"
          aria-label="Close confirmation"
        >
          ✕
        </button>
      </Card>
    </div>
  );
};