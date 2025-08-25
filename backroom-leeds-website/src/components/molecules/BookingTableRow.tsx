'use client';

import { useState } from 'react';
import { Button, Text, LoadingSpinner } from '@/components/atoms';
import { cn } from '@/lib/utils';

interface Booking {
  id: string;
  booking_ref: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  party_size: number;
  booking_date: string;
  arrival_time: string;
  table_ids: number[];
  status: 'pending' | 'confirmed' | 'cancelled' | 'arrived' | 'no_show';
  special_requests?: Record<string, unknown>;
  deposit_amount: number;
  package_amount?: number;
  remaining_balance: number;
  checked_in_at?: string;
  created_at: string;
  payment_status?: 'paid' | 'partial' | 'pending' | 'refunded';
  notes?: string;
}

interface BookingTableRowProps {
  booking: Booking;
  isSelected: boolean;
  onSelect: (bookingId: string, selected: boolean) => void;
  onAction: (action: string, bookingId: string) => Promise<void>;
  userPermissions: {
    canModifyBookings?: boolean;
    canCheckInCustomers?: boolean;
    canViewPayments?: boolean;
  };
  processingAction?: string | null;
}

export const BookingTableRow = ({
  booking,
  isSelected,
  onSelect,
  onAction,
  userPermissions,
  processingAction,
}: BookingTableRowProps) => {
  const [showDetails, setShowDetails] = useState(false);
  const [localProcessing, setLocalProcessing] = useState<string | null>(null);

  const handleAction = async (action: string) => {
    setLocalProcessing(action);
    try {
      await onAction(action, booking.id);
    } finally {
      setLocalProcessing(null);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'bg-blue-500/20 text-blue-400';
      case 'pending': return 'bg-yellow-500/20 text-yellow-400';
      case 'arrived': return 'bg-green-500/20 text-green-400';
      case 'no_show': return 'bg-red-500/20 text-red-400';
      case 'cancelled': return 'bg-gray-500/20 text-gray-400';
      default: return 'bg-speakeasy-gold/20 text-speakeasy-gold';
    }
  };

  const getPaymentStatusColor = (status?: string) => {
    switch (status) {
      case 'paid': return 'bg-green-500/20 text-green-400';
      case 'partial': return 'bg-yellow-500/20 text-yellow-400';
      case 'pending': return 'bg-red-500/20 text-red-400';
      case 'refunded': return 'bg-gray-500/20 text-gray-400';
      default: return 'bg-speakeasy-gold/20 text-speakeasy-gold';
    }
  };

  const getActionButtons = () => {
    const buttons = [];

    // Check-in button
    if (booking.status === 'confirmed' && userPermissions.canCheckInCustomers) {
      buttons.push(
        <Button
          key="checkin"
          size="sm"
          variant="outline"
          onClick={() => handleAction('check_in')}
          disabled={localProcessing !== null || processingAction !== null}
          className="text-green-400 border-green-400/20 hover:bg-green-400/10"
        >
          {(localProcessing === 'check_in' || processingAction === 'check_in') ? (
            <LoadingSpinner size="sm" color="current" />
          ) : (
            '✅ Check In'
          )}
        </Button>
      );
    }

    // Confirm button
    if (booking.status === 'pending' && userPermissions.canModifyBookings) {
      buttons.push(
        <Button
          key="confirm"
          size="sm"
          variant="outline"
          onClick={() => handleAction('confirm')}
          disabled={localProcessing !== null || processingAction !== null}
          className="text-blue-400 border-blue-400/20 hover:bg-blue-400/10"
        >
          {(localProcessing === 'confirm' || processingAction === 'confirm') ? (
            <LoadingSpinner size="sm" color="current" />
          ) : (
            '✓ Confirm'
          )}
        </Button>
      );
    }

    // No Show button
    if (booking.status === 'confirmed' && userPermissions.canModifyBookings) {
      buttons.push(
        <Button
          key="no_show"
          size="sm"
          variant="outline"
          onClick={() => handleAction('no_show')}
          disabled={localProcessing !== null || processingAction !== null}
          className="text-red-400 border-red-400/20 hover:bg-red-400/10"
        >
          {(localProcessing === 'no_show' || processingAction === 'no_show') ? (
            <LoadingSpinner size="sm" color="current" />
          ) : (
            '🚫 No Show'
          )}
        </Button>
      );
    }

    return buttons;
  };

  const getTotalAmount = () => {
    return booking.deposit_amount + (booking.package_amount || 0);
  };

  return (
    <>
      <tr 
        className={cn(
          'border-b border-speakeasy-gold/10 hover:bg-speakeasy-noir/20 transition-colors',
          isSelected && 'bg-speakeasy-gold/5 border-speakeasy-gold/30'
        )}
      >
        {/* Selection Checkbox */}
        <td className="p-4">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={(e) => onSelect(booking.id, e.target.checked)}
            className="w-4 h-4 rounded border-speakeasy-gold/20 bg-speakeasy-noir/50 text-speakeasy-gold focus:ring-speakeasy-gold focus:ring-offset-0"
          />
        </td>

        {/* Booking Reference */}
        <td className="p-4">
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="text-left group"
          >
            <Text className="text-speakeasy-champagne font-mono text-sm group-hover:text-speakeasy-gold transition-colors">
              {booking.booking_ref}
            </Text>
            {booking.checked_in_at && (
              <Text className="text-green-400 text-xs block">
                Checked in {new Date(booking.checked_in_at).toLocaleTimeString()}
              </Text>
            )}
            {booking.notes && (
              <Text className="text-speakeasy-copper text-xs">
                📝 Has notes
              </Text>
            )}
          </button>
        </td>

        {/* Customer Info */}
        <td className="p-4">
          <div className="space-y-1">
            <Text className="text-speakeasy-champagne font-medium">
              {booking.customer_name}
            </Text>
            <Text className="text-speakeasy-champagne/60 text-xs">
              {booking.customer_email}
            </Text>
            <Text className="text-speakeasy-champagne/60 text-xs">
              {booking.customer_phone}
            </Text>
          </div>
        </td>

        {/* Tables */}
        <td className="p-4">
          <div className="flex flex-wrap gap-1">
            {booking.table_ids.map(tableId => (
              <span 
                key={tableId} 
                className="inline-block px-2 py-1 bg-speakeasy-gold/20 text-speakeasy-gold rounded text-xs font-medium"
              >
                {tableId}
              </span>
            ))}
          </div>
        </td>

        {/* Date & Time */}
        <td className="p-4">
          <div className="space-y-1">
            <Text className="text-speakeasy-champagne text-sm">
              {new Date(booking.booking_date).toLocaleDateString()}
            </Text>
            <Text className="text-speakeasy-champagne/60 text-xs">
              {booking.arrival_time}
            </Text>
          </div>
        </td>

        {/* Party Size */}
        <td className="p-4">
          <Text className="text-speakeasy-champagne font-medium">
            {booking.party_size}
          </Text>
        </td>

        {/* Status */}
        <td className="p-4">
          <span className={cn(
            'inline-block px-2 py-1 rounded-full text-xs capitalize font-medium',
            getStatusColor(booking.status)
          )}>
            {booking.status.replace('_', ' ')}
          </span>
        </td>

        {/* Payment */}
        <td className="p-4">
          <div className="space-y-1">
            <Text className="text-speakeasy-champagne font-medium">
              £{getTotalAmount().toFixed(2)}
            </Text>
            {userPermissions.canViewPayments && booking.payment_status && (
              <span className={cn(
                'inline-block px-2 py-1 rounded-full text-xs font-medium',
                getPaymentStatusColor(booking.payment_status)
              )}>
                {booking.payment_status}
              </span>
            )}
            {booking.remaining_balance > 0 && (
              <Text className="text-speakeasy-copper text-xs">
                £{booking.remaining_balance} due
              </Text>
            )}
          </div>
        </td>

        {/* Actions */}
        <td className="p-4">
          <div className="flex flex-wrap gap-1">
            {getActionButtons()}
            {userPermissions.canModifyBookings && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setShowDetails(!showDetails)}
                className="text-speakeasy-champagne/60 hover:text-speakeasy-gold"
              >
                {showDetails ? '⬆️' : '⬇️'}
              </Button>
            )}
          </div>
        </td>
      </tr>

      {/* Expanded Details Row */}
      {showDetails && (
        <tr className="bg-speakeasy-noir/30 border-b border-speakeasy-gold/10">
          <td colSpan={9} className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Customer Details */}
              <div className="space-y-3">
                <Text className="text-speakeasy-gold font-bebas text-sm">
                  Customer Details
                </Text>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-speakeasy-champagne/60">Name:</span>
                    <span className="text-speakeasy-champagne">{booking.customer_name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-speakeasy-champagne/60">Email:</span>
                    <span className="text-speakeasy-champagne">{booking.customer_email}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-speakeasy-champagne/60">Phone:</span>
                    <span className="text-speakeasy-champagne">{booking.customer_phone}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-speakeasy-champagne/60">Party Size:</span>
                    <span className="text-speakeasy-champagne">{booking.party_size} guests</span>
                  </div>
                </div>
              </div>

              {/* Booking Details */}
              <div className="space-y-3">
                <Text className="text-speakeasy-gold font-bebas text-sm">
                  Booking Details
                </Text>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-speakeasy-champagne/60">Reference:</span>
                    <span className="text-speakeasy-champagne font-mono">{booking.booking_ref}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-speakeasy-champagne/60">Created:</span>
                    <span className="text-speakeasy-champagne">
                      {new Date(booking.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-speakeasy-champagne/60">Tables:</span>
                    <span className="text-speakeasy-champagne">
                      {booking.table_ids.join(', ')}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-speakeasy-champagne/60">Status:</span>
                    <span className={cn(
                      'px-2 py-1 rounded text-xs capitalize',
                      getStatusColor(booking.status)
                    )}>
                      {booking.status.replace('_', ' ')}
                    </span>
                  </div>
                </div>
              </div>

              {/* Special Requests & Notes */}
              <div className="space-y-3">
                <Text className="text-speakeasy-gold font-bebas text-sm">
                  Special Requests & Notes
                </Text>
                <div className="space-y-2">
                  {booking.special_requests && Object.keys(booking.special_requests).length > 0 ? (
                    <div className="text-sm">
                      <Text className="text-speakeasy-champagne">
                        {JSON.stringify(booking.special_requests, null, 2)}
                      </Text>
                    </div>
                  ) : (
                    <Text className="text-speakeasy-champagne/50 text-sm italic">
                      No special requests
                    </Text>
                  )}
                  
                  {booking.notes && (
                    <div className="mt-3 p-3 bg-speakeasy-noir/50 rounded border-l-4 border-speakeasy-copper">
                      <Text className="text-speakeasy-champagne text-sm">
                        {booking.notes}
                      </Text>
                    </div>
                  )}
                </div>

                {/* Admin Actions */}
                {userPermissions.canModifyBookings && (
                  <div className="mt-4 pt-4 border-t border-speakeasy-gold/20">
                    <div className="flex flex-wrap gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleAction('edit')}
                        className="text-speakeasy-copper border-speakeasy-copper/20"
                      >
                        ✏️ Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleAction('contact')}
                        className="text-speakeasy-gold border-speakeasy-gold/20"
                      >
                        📧 Contact
                      </Button>
                      {booking.status !== 'cancelled' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleAction('cancel')}
                          className="text-red-400 border-red-400/20"
                        >
                          ❌ Cancel
                        </Button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
};

export default BookingTableRow;