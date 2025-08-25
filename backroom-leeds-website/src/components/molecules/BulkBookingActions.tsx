'use client';

import { useState, useEffect } from 'react';
import { Button, Text, LoadingSpinner } from '@/components/atoms';
import { Card } from '@/components/molecules';
import { cn } from '@/lib/utils';

interface BulkBookingActionsProps {
  selectedBookings: string[];
  onBulkAction: (action: string, bookingIds: string[]) => Promise<void>;
  userPermissions: {
    canModifyBookings?: boolean;
    canCheckInCustomers?: boolean;
    canProcessPayments?: boolean;
  };
  className?: string;
}

export const BulkBookingActions = ({
  selectedBookings,
  onBulkAction,
  userPermissions,
  className,
}: BulkBookingActionsProps) => {
  const [processing, setProcessing] = useState<string | null>(null);
  const [showConfirmation, setShowConfirmation] = useState<string | null>(null);

  // Reset confirmation dialog when selection changes
  useEffect(() => {
    setShowConfirmation(null);
  }, [selectedBookings.length]);

  const handleBulkAction = async (action: string) => {
    if (!selectedBookings.length) return;

    // Show confirmation for destructive actions
    if (['cancel', 'no_show', 'delete'].includes(action)) {
      setShowConfirmation(action);
      return;
    }

    await executeBulkAction(action);
  };

  const executeBulkAction = async (action: string) => {
    setProcessing(action);
    try {
      await onBulkAction(action, selectedBookings);
      setShowConfirmation(null);
    } catch (error) {
      console.error('Bulk action failed:', error);
    } finally {
      setProcessing(null);
    }
  };

  const getActionLabel = (action: string) => {
    const labels = {
      confirm: 'Confirm All',
      check_in: 'Check In All',
      cancel: 'Cancel All',
      no_show: 'Mark as No Show',
      send_reminder: 'Send Reminders',
      export: 'Export Selected',
      print: 'Print List',
      delete: 'Delete All',
    };
    return labels[action as keyof typeof labels] || action;
  };

  const getActionIcon = (action: string) => {
    const icons = {
      confirm: '✅',
      check_in: '🎫',
      cancel: '❌',
      no_show: '🚫',
      send_reminder: '📧',
      export: '📊',
      print: '🖨️',
      delete: '🗑️',
    };
    return icons[action as keyof typeof icons] || '⚡';
  };

  const availableActions = [
    ...(userPermissions.canModifyBookings ? [
      'confirm',
      'cancel', 
      'no_show',
      'send_reminder',
    ] : []),
    ...(userPermissions.canCheckInCustomers ? ['check_in'] : []),
    'export',
    'print',
    ...(userPermissions.canModifyBookings ? ['delete'] : []),
  ];

  if (selectedBookings.length === 0) {
    return null;
  }

  return (
    <Card className={cn('p-4 border-speakeasy-copper/20', className)}>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <Text className="text-speakeasy-gold font-bebas text-lg">
            Bulk Actions
          </Text>
          <Text className="text-speakeasy-champagne/60 text-sm">
            {selectedBookings.length} booking{selectedBookings.length !== 1 ? 's' : ''} selected
          </Text>
        </div>

        {/* Confirmation Dialog */}
        {showConfirmation && (
          <div className="bg-speakeasy-burgundy/20 border border-speakeasy-burgundy/40 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <span className="text-2xl">⚠️</span>
              <div className="flex-1">
                <Text className="text-speakeasy-champagne font-medium mb-2">
                  Confirm Bulk Action
                </Text>
                <Text className="text-speakeasy-champagne/80 text-sm mb-4">
                  Are you sure you want to {getActionLabel(showConfirmation).toLowerCase()} {selectedBookings.length} booking{selectedBookings.length !== 1 ? 's' : ''}?
                  {showConfirmation === 'delete' && (
                    <span className="block mt-2 text-red-400 font-medium">
                      This action cannot be undone.
                    </span>
                  )}
                </Text>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setShowConfirmation(null)}
                    className="text-speakeasy-champagne border-speakeasy-champagne/20"
                  >
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    variant="primary"
                    onClick={() => executeBulkAction(showConfirmation)}
                    disabled={processing !== null}
                    className="bg-speakeasy-burgundy hover:bg-speakeasy-burgundy/80"
                  >
                    {processing === showConfirmation ? (
                      <>
                        <LoadingSpinner size="sm" color="white" />
                        Processing...
                      </>
                    ) : (
                      `Confirm ${getActionLabel(showConfirmation)}`
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2">
          {availableActions.map((action) => (
            <Button
              key={action}
              size="sm"
              variant="outline"
              onClick={() => handleBulkAction(action)}
              disabled={processing !== null}
              className={cn(
                'flex items-center gap-2 justify-center',
                'text-speakeasy-champagne border-speakeasy-gold/20',
                'hover:bg-speakeasy-gold/10 hover:border-speakeasy-gold',
                ['cancel', 'no_show', 'delete'].includes(action) && 
                'border-red-400/20 text-red-400 hover:bg-red-400/10 hover:border-red-400'
              )}
            >
              {processing === action ? (
                <LoadingSpinner size="sm" color="current" />
              ) : (
                <span className="text-sm">{getActionIcon(action)}</span>
              )}
              <span className="text-xs font-bebas tracking-wider">
                {getActionLabel(action)}
              </span>
            </Button>
          ))}
        </div>

        {/* Quick Stats */}
        <div className="pt-3 border-t border-speakeasy-gold/20">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <Text className="text-speakeasy-gold font-bebas text-lg">
                {selectedBookings.length}
              </Text>
              <Text className="text-speakeasy-champagne/60 text-xs">
                Selected
              </Text>
            </div>
            <div>
              <Text className="text-speakeasy-copper font-bebas text-lg">
                {processing ? '...' : '0'}
              </Text>
              <Text className="text-speakeasy-champagne/60 text-xs">
                Processing
              </Text>
            </div>
            <div>
              <Text className="text-green-400 font-bebas text-lg">
                {processing ? '...' : '0'}
              </Text>
              <Text className="text-speakeasy-champagne/60 text-xs">
                Completed
              </Text>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default BulkBookingActions;