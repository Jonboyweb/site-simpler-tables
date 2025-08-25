'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

import { Button } from '@/components/atoms/Button';
import { LoadingSpinner } from '@/components/atoms/LoadingSpinner';
import { AccessibleFormField } from '@/components/molecules/AccessibleFormField';
import { cn } from '@/lib/utils';

export interface CancellationHandlerProps {
  bookingRef: string;
  bookingDetails: {
    customerName: string;
    eventDate: string;
    arrivalTime: string;
    tableNumbers: number[];
    packageName: string;
    totalAmount: number;
    depositPaid: number;
    remainingBalance: number;
    status: string;
    createdAt: string;
  };
  className?: string;
  onCancellationComplete?: (result: CancellationResult) => void;
}

export interface CancellationResult {
  success: boolean;
  refundEligible: boolean;
  refundAmount?: number;
  refundProcessingTime?: string;
  cancellationRef?: string;
  error?: string;
}

interface CancellationPolicy {
  isEligible: boolean;
  refundAmount: number;
  refundPercentage: number;
  reason: string;
  processingTime: string;
}

export function CancellationHandler({
  bookingRef,
  bookingDetails,
  className = '',
  onCancellationComplete
}: CancellationHandlerProps) {
  const [cancellationReason, setCancellationReason] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [policy, setPolicy] = useState<CancellationPolicy | null>(null);
  
  const router = useRouter();

  // Calculate cancellation policy based on booking date
  const calculateCancellationPolicy = (): CancellationPolicy => {
    const eventDate = new Date(bookingDetails.eventDate);
    const now = new Date();
    const hoursUntilEvent = (eventDate.getTime() - now.getTime()) / (1000 * 60 * 60);

    // 48-hour cancellation policy
    if (hoursUntilEvent >= 48) {
      return {
        isEligible: true,
        refundAmount: bookingDetails.depositPaid,
        refundPercentage: 100,
        reason: 'Free cancellation (48+ hours notice)',
        processingTime: '3-5 business days'
      };
    } else if (hoursUntilEvent >= 24) {
      return {
        isEligible: true,
        refundAmount: Math.floor(bookingDetails.depositPaid * 0.5),
        refundPercentage: 50,
        reason: 'Partial refund (24-48 hours notice)',
        processingTime: '3-5 business days'
      };
    } else {
      return {
        isEligible: false,
        refundAmount: 0,
        refundPercentage: 0,
        reason: 'No refund (less than 24 hours notice)',
        processingTime: 'N/A'
      };
    }
  };

  const handleInitiateCancellation = () => {
    const calculatedPolicy = calculateCancellationPolicy();
    setPolicy(calculatedPolicy);
    setShowConfirmation(true);
  };

  const handleConfirmCancellation = async () => {
    if (!policy) return;

    setIsProcessing(true);

    try {
      const response = await fetch(`/api/bookings/${bookingRef}/cancel`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          reason: cancellationReason || 'Customer requested cancellation',
          refund_eligible: policy.isEligible,
          refund_amount: policy.refundAmount,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Cancellation failed');
      }

      const result = await response.json();

      const cancellationResult: CancellationResult = {
        success: true,
        refundEligible: policy.isEligible,
        refundAmount: policy.refundAmount,
        refundProcessingTime: policy.processingTime,
        cancellationRef: result.cancellationRef
      };

      onCancellationComplete?.(cancellationResult);

      toast.success('Booking cancelled successfully');
      
      // Redirect to cancellation confirmation page
      router.push(`/book/cancelled/${result.cancellationRef}`);

    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Cancellation failed';
      console.error('Cancellation failed:', error);
      
      const cancellationResult: CancellationResult = {
        success: false,
        refundEligible: false,
        error: errorMessage
      };

      onCancellationComplete?.(cancellationResult);
      toast.error(errorMessage || 'Cancellation failed. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleBackToBooking = () => {
    setShowConfirmation(false);
    setPolicy(null);
  };

  const eventDate = new Date(bookingDetails.eventDate);
  const isEventInPast = eventDate.getTime() < Date.now();
  const hoursUntilEvent = Math.max(0, (eventDate.getTime() - Date.now()) / (1000 * 60 * 60));

  if (isEventInPast) {
    return (
      <div className={cn('max-w-2xl mx-auto', className)}>
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Event Has Passed
          </h3>
          <p className="text-gray-600 mb-4">
            This booking is for an event that has already occurred and cannot be cancelled.
          </p>
          <Button
            onClick={() => router.back()}
            variant="outline"
          >
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  if (bookingDetails.status === 'cancelled') {
    return (
      <div className={cn('max-w-2xl mx-auto', className)}>
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
          <h3 className="text-lg font-semibold text-yellow-900 mb-2">
            Booking Already Cancelled
          </h3>
          <p className="text-yellow-700 mb-4">
            This booking has already been cancelled. If you have questions about your refund, please contact us.
          </p>
          <Button
            onClick={() => router.push('/contact')}
            variant="outline"
          >
            Contact Support
          </Button>
        </div>
      </div>
    );
  }

  if (!showConfirmation) {
    return (
      <div className={cn('max-w-2xl mx-auto space-y-6', className)}>
        {/* Booking Summary */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">
            Cancel Booking: {bookingRef}
          </h3>
          
          <div className="grid gap-4 md:grid-cols-2 mb-6">
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Booking Details</h4>
              <div className="text-sm space-y-1 text-gray-600">
                <div>Customer: {bookingDetails.customerName}</div>
                <div>Date: {eventDate.toLocaleDateString('en-GB', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}</div>
                <div>Time: {bookingDetails.arrivalTime}</div>
                <div>Tables: {bookingDetails.tableNumbers.join(', ')}</div>
                <div>Package: {bookingDetails.packageName}</div>
              </div>
            </div>
            
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Payment Details</h4>
              <div className="text-sm space-y-1 text-gray-600">
                <div>Total Amount: £{bookingDetails.totalAmount}</div>
                <div>Deposit Paid: £{bookingDetails.depositPaid}</div>
                <div>Remaining Balance: £{bookingDetails.remainingBalance}</div>
              </div>
            </div>
          </div>

          {/* Time Warning */}
          <div className={cn(
            'p-4 rounded-lg mb-6',
            {
              'bg-green-50 border border-green-200': hoursUntilEvent >= 48,
              'bg-yellow-50 border border-yellow-200': hoursUntilEvent >= 24 && hoursUntilEvent < 48,
              'bg-red-50 border border-red-200': hoursUntilEvent < 24
            }
          )}>
            <div className="flex items-start gap-3">
              <div className={cn(
                'mt-1',
                {
                  'text-green-600': hoursUntilEvent >= 48,
                  'text-yellow-600': hoursUntilEvent >= 24 && hoursUntilEvent < 48,
                  'text-red-600': hoursUntilEvent < 24
                }
              )}>
                {hoursUntilEvent >= 48 ? '✓' : hoursUntilEvent >= 24 ? '⚠' : '❌'}
              </div>
              <div>
                <h4 className={cn(
                  'font-medium mb-1',
                  {
                    'text-green-800': hoursUntilEvent >= 48,
                    'text-yellow-800': hoursUntilEvent >= 24 && hoursUntilEvent < 48,
                    'text-red-800': hoursUntilEvent < 24
                  }
                )}>
                  {Math.floor(hoursUntilEvent)} hours until event
                </h4>
                <p className={cn(
                  'text-sm',
                  {
                    'text-green-700': hoursUntilEvent >= 48,
                    'text-yellow-700': hoursUntilEvent >= 24 && hoursUntilEvent < 48,
                    'text-red-700': hoursUntilEvent < 24
                  }
                )}>
                  {hoursUntilEvent >= 48 
                    ? 'Free cancellation available (full deposit refund)'
                    : hoursUntilEvent >= 24
                    ? 'Partial refund available (50% of deposit)'
                    : 'No refund available due to short notice'
                  }
                </p>
              </div>
            </div>
          </div>

          {/* Cancellation Reason */}
          <AccessibleFormField
            label="Reason for Cancellation"
            type="textarea"
            instructions="Please let us know why you need to cancel (optional)"
            placeholder="e.g., Change of plans, illness, emergency, etc."
            value={cancellationReason}
            onChange={(e) => setCancellationReason(e.target.value)}
            maxLength={500}
            className="mb-6"
          />

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 justify-end">
            <Button
              variant="outline"
              onClick={() => router.back()}
              className="sm:w-auto"
            >
              Keep Booking
            </Button>
            <Button
              onClick={handleInitiateCancellation}
              className="bg-red-600 hover:bg-red-700 text-white sm:w-auto"
            >
              Continue with Cancellation
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Confirmation step
  return (
    <div className={cn('max-w-2xl mx-auto space-y-6', className)}>
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-xl font-semibold text-red-800 mb-4">
          Confirm Cancellation
        </h3>
        
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <h4 className="font-medium text-red-900 mb-2">
            ⚠ This action cannot be undone
          </h4>
          <p className="text-red-800 text-sm">
            Once confirmed, your booking will be cancelled immediately. 
            Please review the refund details below carefully.
          </p>
        </div>

        {/* Refund Summary */}
        {policy && (
          <div className="border border-gray-200 rounded-lg p-4 mb-6">
            <h4 className="font-medium text-gray-900 mb-3">Refund Summary</h4>
            
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Original Deposit:</span>
                <span>£{bookingDetails.depositPaid}</span>
              </div>
              
              <div className="flex justify-between">
                <span>Policy:</span>
                <span>{policy.reason}</span>
              </div>
              
              <div className="flex justify-between font-medium">
                <span>Refund Amount:</span>
                <span className={policy.refundAmount > 0 ? 'text-green-600' : 'text-red-600'}>
                  £{policy.refundAmount} ({policy.refundPercentage}%)
                </span>
              </div>
              
              {policy.isEligible && (
                <div className="flex justify-between text-gray-600">
                  <span>Processing Time:</span>
                  <span>{policy.processingTime}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Final Confirmation */}
        <div className="space-y-4">
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <h5 className="font-medium text-gray-900 mb-2">What happens next:</h5>
            <ul className="text-sm text-gray-700 space-y-1">
              <li>• Your booking will be cancelled immediately</li>
              <li>• Your table(s) will be released for other guests</li>
              {policy?.isEligible && policy.refundAmount > 0 ? (
                <>
                  <li>• Refund of £{policy.refundAmount} will be processed automatically</li>
                  <li>• You'll receive email confirmation of the cancellation</li>
                  <li>• Refund will appear in your account within {policy.processingTime}</li>
                </>
              ) : (
                <li>• No refund will be processed due to our cancellation policy</li>
              )}
            </ul>
          </div>

          {/* Final Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 justify-end">
            <Button
              variant="outline"
              onClick={handleBackToBooking}
              disabled={isProcessing}
              className="sm:w-auto"
            >
              Go Back
            </Button>
            <Button
              onClick={handleConfirmCancellation}
              disabled={isProcessing}
              className="bg-red-600 hover:bg-red-700 text-white sm:w-auto"
            >
              {isProcessing ? (
                <span className="flex items-center gap-2">
                  <LoadingSpinner size="sm" />
                  Processing Cancellation...
                </span>
              ) : (
                'Confirm Cancellation'
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}