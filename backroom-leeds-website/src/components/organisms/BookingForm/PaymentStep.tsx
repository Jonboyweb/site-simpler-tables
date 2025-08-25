'use client';

import { useState } from 'react';
import { useFormContext } from 'react-hook-form';
import { AccessibleFormField } from '@/components/molecules/AccessibleFormField';
import { LoadingSpinner } from '@/components/atoms/LoadingSpinner';
import { EnhancedPaymentProcessor } from '@/components/organisms/EnhancedPaymentProcessor';
import { cn } from '@/lib/utils';
import type { PaymentData, CustomerDetailsData, TableSelectionData } from '@/types/booking';
import type { PaymentResult, PaymentState } from '@/types/payment';
import { DRINKS_PACKAGES, ARRIVAL_TIMES } from '@/types/booking';

interface PaymentStepProps {
  eventDate: string;
  onSubmit?: (data: Record<string, unknown>) => void;
  isSubmitting?: boolean;
  className?: string;
}

export function PaymentStep({ 
  eventDate, 
  onSubmit, 
  isSubmitting = false, 
  className = '' 
}: PaymentStepProps) {
  const {
    register,
    formState: { errors },
    watch,
    handleSubmit,
    setValue
  } = useFormContext<PaymentData & CustomerDetailsData & TableSelectionData>();

  const [showFullTerms, setShowFullTerms] = useState(false);
  const [showPaymentProcessor, setShowPaymentProcessor] = useState(false);
  const [paymentState, setPaymentState] = useState<PaymentState>('idle');
  
  // Watch form values for summary
  const formData = watch();
  const selectedPackage = DRINKS_PACKAGES.find(pkg => pkg.id === formData.drinksPackage);
  const selectedArrivalTime = ARRIVAL_TIMES.find(time => time.value === formData.arrivalTime);
  
  const depositAmount = 50;
  const totalAmount = selectedPackage?.price || 0;
  const remainingBalance = totalAmount - depositAmount;

  const termsAccepted = watch('termsAccepted');
  const privacyAccepted = watch('privacyPolicyAccepted');

  const canProceedToPayment = termsAccepted && privacyAccepted && !isSubmitting;

  const handleFormSubmit = (data: Record<string, unknown>) => {
    if (canProceedToPayment && !showPaymentProcessor) {
      // Show the payment processor instead of submitting immediately
      setShowPaymentProcessor(true);
    }
  };

  const handlePaymentSuccess = (result: PaymentResult) => {
    // Payment successful, now submit the form with payment data
    const formDataWithPayment = {
      ...formData,
      paymentResult: result,
      paymentIntentId: result.paymentIntent?.id,
      paymentMethod: result.paymentIntent?.paymentMethod,
      paymentStatus: 'completed'
    };
    
    onSubmit?.(formDataWithPayment);
  };

  const handlePaymentError = (error: string) => {
    console.error('Payment error:', error);
    // Keep the payment processor open so user can try again
  };

  const handlePaymentStateChange = (state: PaymentState) => {
    setPaymentState(state);
  };

  return (
    <div className={`space-y-8 ${className}`}>
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Review & Confirm Your Booking
        </h2>
        <p className="text-gray-600">
          Please review your booking details and confirm to proceed with payment
        </p>
      </div>

      {/* Booking Summary */}
      <section className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-6">
        <h3 className="text-xl font-semibold mb-6 text-center text-blue-900">
          Your Booking Summary
        </h3>
        
        <div className="grid gap-6 md:grid-cols-2">
          {/* Customer Details */}
          <div className="space-y-3">
            <h4 className="font-medium text-gray-900 border-b pb-2">Customer Details</h4>
            <div className="text-sm space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Name:</span>
                <span className="font-medium">{formData.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Email:</span>
                <span className="font-medium">{formData.email}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Phone:</span>
                <span className="font-medium">{formData.phone}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Party Size:</span>
                <span className="font-medium">{formData.partySize} people</span>
              </div>
              {formData.specialRequests && (
                <div className="pt-2 border-t">
                  <span className="text-gray-600 text-xs">Special Requests:</span>
                  <p className="text-sm mt-1">{formData.specialRequests}</p>
                </div>
              )}
            </div>
          </div>

          {/* Booking Details */}
          <div className="space-y-3">
            <h4 className="font-medium text-gray-900 border-b pb-2">Booking Details</h4>
            <div className="text-sm space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Date:</span>
                <span className="font-medium">
                  {new Date(eventDate).toLocaleDateString('en-GB', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Arrival Time:</span>
                <span className="font-medium">{selectedArrivalTime?.label}</span>
              </div>
              {formData.tableIds && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Tables:</span>
                  <span className="font-medium">
                    {formData.tableIds.length === 1 
                      ? `Table ${formData.tableIds[0]}` 
                      : `Tables ${formData.tableIds.join(', ')}`
                    }
                  </span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-gray-600">Package:</span>
                <span className="font-medium">{selectedPackage?.name}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Payment Breakdown */}
        <div className="mt-6 pt-4 border-t border-blue-200">
          <h4 className="font-medium text-gray-900 mb-3">Payment Breakdown</h4>
          <div className="bg-white rounded-lg p-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <span>Package Total:</span>
              <span className="font-medium">£{totalAmount}</span>
            </div>
            <div className="flex justify-between text-blue-600">
              <span>Deposit (due today):</span>
              <span className="font-semibold">£{depositAmount}</span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>Balance (due on arrival):</span>
              <span>£{remainingBalance}</span>
            </div>
          </div>
        </div>
      </section>

      {/* Terms and Conditions */}
      <section className="space-y-4">
        <h3 className="text-lg font-semibold">Terms & Conditions</h3>
        
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="space-y-4">
            {/* Terms summary */}
            <div className="text-sm text-gray-700 space-y-2">
              <p><strong>Key Terms:</strong></p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>£{depositAmount} deposit required to secure booking</li>
                <li>Remaining £{remainingBalance} due on arrival</li>
                <li>Free cancellation up to 48 hours before your booking</li>
                <li>Maximum 2 tables per booking</li>
                <li>Valid ID required for entry (18+ venue)</li>
                <li>Smart casual dress code enforced</li>
              </ul>
            </div>

            {/* Full terms toggle */}
            <button
              type="button"
              onClick={() => setShowFullTerms(!showFullTerms)}
              className="text-blue-600 hover:text-blue-700 text-sm font-medium"
            >
              {showFullTerms ? '- Hide' : '+ Read'} full terms and conditions
            </button>

            {showFullTerms && (
              <div className="mt-4 p-4 bg-gray-50 rounded-lg text-sm text-gray-700 space-y-3 max-h-60 overflow-y-auto">
                <h5 className="font-medium">Full Terms and Conditions</h5>
                <div className="space-y-2">
                  <p><strong>Booking Policy:</strong> All bookings require a £50 deposit. The remaining balance is due on arrival and can be paid by card or cash.</p>
                  <p><strong>Cancellation Policy:</strong> Free cancellation up to 48 hours before your booking. Cancellations within 48 hours forfeit the deposit unless in exceptional circumstances.</p>
                  <p><strong>Age Policy:</strong> The Backroom Leeds is an 18+ venue. Valid photo ID is required for entry.</p>
                  <p><strong>Dress Code:</strong> Smart casual dress code is enforced. No sportswear, flip-flops, or offensive clothing.</p>
                  <p><strong>Table Policy:</strong> Tables are reserved for the duration of the event. Maximum 2 tables per booking. Tables cannot be transferred between parties.</p>
                  <p><strong>Drinks Policy:</strong> Outside drinks are not permitted. All drinks must be purchased through the venue.</p>
                  <p><strong>Behavior Policy:</strong> Management reserves the right to refuse entry or remove customers for inappropriate behavior without refund.</p>
                  <p><strong>Liability:</strong> The venue is not liable for lost, stolen, or damaged personal items.</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Consent checkboxes */}
        <div className="space-y-4">
          {/* Terms acceptance */}
          <AccessibleFormField
            label=""
            error={errors.termsAccepted}
          >
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                {...register('termsAccepted', { 
                  required: 'You must accept the terms and conditions' 
                })}
              />
              <span className="text-sm text-gray-700">
                I accept the <strong>terms and conditions</strong> outlined above. *
              </span>
            </label>
          </AccessibleFormField>

          {/* Privacy policy */}
          <AccessibleFormField
            label=""
            error={errors.privacyPolicyAccepted}
          >
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                {...register('privacyPolicyAccepted', { 
                  required: 'You must accept the privacy policy' 
                })}
              />
              <span className="text-sm text-gray-700">
                I accept the <strong>privacy policy</strong> and consent to my data being processed for this booking. *
              </span>
            </label>
          </AccessibleFormField>

          {/* Marketing consent (optional) */}
          <AccessibleFormField
            label=""
          >
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                {...register('marketingConsent')}
              />
              <span className="text-sm text-gray-700">
                I'd like to receive marketing emails about future events and offers (optional)
              </span>
            </label>
          </AccessibleFormField>
        </div>
      </section>

      {/* Enhanced Payment Processor or Continue Button */}
      {showPaymentProcessor ? (
        <section className="space-y-6">
          <div className="text-center">
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Complete Your Payment
            </h3>
            <p className="text-gray-600">
              Choose your preferred payment method to secure your booking
            </p>
          </div>
          
          <EnhancedPaymentProcessor
            amount={totalAmount * 100} // Convert to pence
            currency="GBP"
            region="GB"
            description={`The Backroom Leeds - Table Booking - ${selectedPackage?.name}`}
            customerEmail={formData.email}
            customerName={formData.name}
            bookingRef={`TBL-${Date.now()}`} // This should come from the booking creation
            billingAddress={{
              line1: 'Address Line 1', // You might want to collect this in customer details
              city: 'Leeds',
              postcode: 'LS1 1AA',
              country: 'GB'
            }}
            onSuccess={handlePaymentSuccess}
            onError={handlePaymentError}
            onStateChange={handlePaymentStateChange}
            disabled={isSubmitting || paymentState === 'processing'}
            className="max-w-none"
          />
          
          {/* Back to terms button */}
          <div className="text-center pt-4">
            <button
              type="button"
              onClick={() => setShowPaymentProcessor(false)}
              disabled={paymentState === 'processing' || paymentState === 'succeeded'}
              className="text-blue-600 hover:text-blue-700 text-sm font-medium"
            >
              ← Back to booking details
            </button>
          </div>
        </section>
      ) : (
        <section className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <div className="text-yellow-600 mt-1">🔒</div>
            <div className="text-sm text-yellow-800">
              <h4 className="font-medium mb-1">Multiple Payment Options Available</h4>
              <p>
                We accept cards, digital wallets (Apple Pay, Google Pay), buy-now-pay-later options (Klarna, Clearpay), 
                and UK bank transfers. All payments are processed securely with industry-leading encryption.
              </p>
            </div>
          </div>
        </section>
      )}

      {/* Continue to Payment Button (only show when not in payment processor) */}
      {!showPaymentProcessor && (
        <div className="text-center pt-4">
          <button
            type="button"
            disabled={!canProceedToPayment}
            onClick={handleSubmit(handleFormSubmit)}
            className={cn(
              'w-full max-w-md px-8 py-4 rounded-lg font-semibold text-lg transition-all duration-200',
              'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500',
              {
                'bg-blue-600 text-white hover:bg-blue-700 shadow-lg hover:shadow-xl': canProceedToPayment && !isSubmitting,
                'bg-gray-300 text-gray-500 cursor-not-allowed': !canProceedToPayment || isSubmitting
              }
            )}
            aria-describedby="continue-button-description"
          >
            {isSubmitting ? (
              <span className="flex items-center justify-center gap-3">
                <LoadingSpinner size="sm" />
                Please wait...
              </span>
            ) : (
              'Continue to Payment Options →'
            )}
          </button>
          
          <div id="continue-button-description" className="mt-2 text-sm text-gray-600">
            {!canProceedToPayment && !isSubmitting && 'Please accept the terms and privacy policy to continue'}
            {canProceedToPayment && !isSubmitting && 'Choose from multiple secure payment options'}
          </div>
        </div>
      )}
    </div>
  );
}