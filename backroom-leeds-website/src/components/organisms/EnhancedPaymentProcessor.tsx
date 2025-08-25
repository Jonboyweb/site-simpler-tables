'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';

import { cn } from '@/lib/utils';
import { LoadingSpinner } from '@/components/atoms/LoadingSpinner';
import { PaymentMethodSelector } from '@/components/organisms/PaymentMethodSelector';
import { PaymentProcessor } from '@/components/organisms/PaymentProcessor';
import { DigitalWalletPayment, DigitalWalletWrapper } from '@/components/organisms/DigitalWalletPayment';
import { BNPLPayment } from '@/components/organisms/BNPLPayment';
import { BankTransferPayment } from '@/components/organisms/BankTransferPayment';

import { 
  PaymentMethodType, 
  PaymentResult, 
  EnhancedPaymentData,
  PaymentState,
  formatPaymentAmount 
} from '@/types/payment';

// Initialize Stripe
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

interface EnhancedPaymentProcessorProps {
  amount: number;
  currency?: string;
  region?: string;
  description: string;
  customerEmail: string;
  customerName: string;
  bookingRef: string;
  billingAddress?: {
    line1: string;
    line2?: string;
    city: string;
    postcode: string;
    country: string;
  };
  onSuccess?: (result: PaymentResult) => void;
  onError?: (error: string) => void;
  onStateChange?: (state: PaymentState) => void;
  className?: string;
  disabled?: boolean;
}

export function EnhancedPaymentProcessor({
  amount,
  currency = 'GBP',
  region = 'GB',
  description,
  customerEmail,
  customerName,
  bookingRef,
  billingAddress,
  onSuccess,
  onError,
  onStateChange,
  className = '',
  disabled = false
}: EnhancedPaymentProcessorProps) {
  const router = useRouter();
  
  // Payment state management
  const [paymentState, setPaymentState] = useState<PaymentState>('idle');
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethodType | null>(null);
  const [paymentOptions, setPaymentOptions] = useState<{ timing: string; installments?: boolean }>({
    timing: 'deposit_only'
  });
  
  // Stripe-specific state
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [paymentIntent, setPaymentIntent] = useState<any>(null);
  
  // Error handling
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  // Update parent component about state changes
  useEffect(() => {
    onStateChange?.(paymentState);
  }, [paymentState, onStateChange]);

  // Calculate final payment amount based on options
  const getFinalPaymentAmount = () => {
    switch (paymentOptions.timing) {
      case 'full_payment':
        return amount;
      case 'deposit_only':
      default:
        return 5000; // £50 deposit
    }
  };

  // Handle payment method selection
  const handleMethodSelect = async (method: PaymentMethodType) => {
    setSelectedMethod(method);
    setError(null);
    setPaymentState('selecting_method');

    // For Stripe-based payments, create payment intent
    if (['card', 'apple_pay', 'google_pay', 'paypal'].includes(method)) {
      await createPaymentIntent(method);
    }
  };

  // Create Stripe payment intent
  const createPaymentIntent = async (method: PaymentMethodType) => {
    setPaymentState('processing');
    
    try {
      const response = await fetch('/api/payments/create-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: getFinalPaymentAmount(),
          currency,
          paymentMethod: method,
          customerEmail,
          customerName,
          bookingRef,
          description,
          billingAddress,
          metadata: {
            booking_ref: bookingRef,
            payment_timing: paymentOptions.timing,
            installments: paymentOptions.installments || false
          }
        })
      });

      const result = await response.json();

      if (result.success) {
        setClientSecret(result.clientSecret);
        setPaymentIntent(result.paymentIntent);
        setPaymentState('requires_action');
      } else {
        throw new Error(result.error || 'Failed to create payment intent');
      }
    } catch (err: any) {
      console.error('Payment intent creation failed:', err);
      setError(err.message);
      setPaymentState('failed');
      onError?.(err.message);
    }
  };

  // Handle successful payments
  const handlePaymentSuccess = (result: PaymentResult) => {
    setPaymentState('succeeded');
    toast.success('Payment successful!');
    
    // Track payment analytics
    trackPaymentAnalytics({
      method: selectedMethod!,
      amount: getFinalPaymentAmount(),
      currency,
      success: true,
      duration: Date.now() - (paymentIntent?.created * 1000 || Date.now()),
      attempts: retryCount + 1
    });

    onSuccess?.(result);
    
    // Redirect to confirmation
    setTimeout(() => {
      router.push(`/book/confirmation/${bookingRef}`);
    }, 1500);
  };

  // Handle payment errors
  const handlePaymentError = (errorMessage: string) => {
    setError(errorMessage);
    setPaymentState('failed');
    setRetryCount(prev => prev + 1);
    
    // Track payment analytics
    if (selectedMethod) {
      trackPaymentAnalytics({
        method: selectedMethod,
        amount: getFinalPaymentAmount(),
        currency,
        success: false,
        duration: Date.now() - (paymentIntent?.created * 1000 || Date.now()),
        attempts: retryCount + 1,
        errorCode: errorMessage
      });
    }

    toast.error(errorMessage);
    onError?.(errorMessage);
  };

  // Track payment analytics
  const trackPaymentAnalytics = async (data: any) => {
    try {
      await fetch('/api/analytics/payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          timestamp: Date.now(),
          userAgent: navigator.userAgent,
          bookingRef
        })
      });
    } catch (err) {
      console.error('Failed to track payment analytics:', err);
    }
  };

  // Handle payment options change
  const handlePaymentOptionsChange = (options: { timing: string; installments?: boolean }) => {
    setPaymentOptions(options);
    
    // If method is already selected and it's Stripe-based, recreate payment intent
    if (selectedMethod && ['card', 'apple_pay', 'google_pay', 'paypal'].includes(selectedMethod)) {
      createPaymentIntent(selectedMethod);
    }
  };

  // Retry payment
  const retryPayment = () => {
    setError(null);
    setPaymentState('idle');
    if (selectedMethod) {
      handleMethodSelect(selectedMethod);
    }
  };

  // Render appropriate payment component based on selected method
  const renderPaymentComponent = () => {
    if (!selectedMethod) return null;

    const commonProps = {
      amount: getFinalPaymentAmount(),
      currency,
      description,
      customerEmail,
      customerName,
      bookingRef,
      billingAddress,
      onSuccess: handlePaymentSuccess,
      onError: handlePaymentError,
      disabled: disabled || paymentState === 'processing'
    };

    switch (selectedMethod) {
      case 'card':
        if (!clientSecret) return <LoadingSpinner size="lg" />;
        return (
          <Elements stripe={stripePromise} options={{ clientSecret }}>
            <PaymentProcessor
              clientSecret={clientSecret}
              {...commonProps}
            />
          </Elements>
        );

      case 'apple_pay':
      case 'google_pay':
        return (
          <DigitalWalletWrapper>
            <DigitalWalletPayment
              method={selectedMethod}
              clientSecret={clientSecret}
              {...commonProps}
            />
          </DigitalWalletWrapper>
        );

      case 'klarna':
      case 'clearpay':
        return (
          <BNPLPayment
            method={selectedMethod}
            {...commonProps}
          />
        );

      case 'paypal':
        // PayPal would be handled similarly to card payments through Stripe
        if (!clientSecret) return <LoadingSpinner size="lg" />;
        return (
          <Elements stripe={stripePromise} options={{ clientSecret }}>
            <div className="text-center py-8">
              <p className="text-gray-600 mb-4">Redirecting to PayPal...</p>
              <LoadingSpinner size="lg" />
            </div>
          </Elements>
        );

      case 'bank_transfer':
      case 'open_banking':
      case 'bacs_direct_debit':
        return (
          <BankTransferPayment
            method={selectedMethod}
            {...commonProps}
          />
        );

      default:
        return (
          <div className="text-center py-8 text-gray-500">
            <p>Payment method not yet implemented</p>
            <button
              onClick={() => setSelectedMethod(null)}
              className="mt-2 text-blue-600 hover:text-blue-700 text-sm"
            >
              Choose another method
            </button>
          </div>
        );
    }
  };

  return (
    <div className={cn('max-w-2xl mx-auto space-y-8', className)}>
      {/* Payment amount summary */}
      <div className="text-center bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Complete Your Payment
        </h2>
        <div className="text-lg">
          <span className="text-gray-600">Total: </span>
          <span className="font-semibold text-blue-600">
            {formatPaymentAmount(getFinalPaymentAmount(), currency)}
          </span>
        </div>
        {paymentOptions.timing === 'deposit_only' && amount > getFinalPaymentAmount() && (
          <p className="text-sm text-gray-600 mt-2">
            Remaining {formatPaymentAmount(amount - getFinalPaymentAmount(), currency)} due on arrival
          </p>
        )}
      </div>

      {/* Error display */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-start gap-3">
            <span className="text-red-500 text-lg">⚠️</span>
            <div className="flex-1">
              <p className="font-medium text-red-800">Payment Error</p>
              <p className="text-red-700 text-sm mt-1">{error}</p>
              {retryCount < 3 && (
                <button
                  onClick={retryPayment}
                  className="mt-3 px-4 py-2 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 transition-colors"
                >
                  Try Again
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Payment method selector */}
      {(!selectedMethod || paymentState === 'idle') && (
        <PaymentMethodSelector
          amount={getFinalPaymentAmount()}
          currency={currency}
          region={region}
          selectedMethod={selectedMethod}
          onMethodSelect={handleMethodSelect}
          onPaymentOptionsChange={handlePaymentOptionsChange}
          disabled={disabled}
          showRecommended={true}
        />
      )}

      {/* Selected payment method component */}
      {selectedMethod && paymentState !== 'idle' && (
        <div className="space-y-4">
          {/* Payment method header */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-3">
              <span className="text-lg">
                {selectedMethod === 'card' && '💳'}
                {selectedMethod === 'apple_pay' && '🍎'}
                {selectedMethod === 'google_pay' && '🔵'}
                {selectedMethod === 'paypal' && '🅿️'}
                {selectedMethod === 'klarna' && '🛒'}
                {selectedMethod === 'clearpay' && '⏰'}
                {['bank_transfer', 'open_banking', 'bacs_direct_debit'].includes(selectedMethod) && '🏦'}
              </span>
              <div>
                <p className="font-medium text-gray-900">
                  {selectedMethod.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </p>
                <p className="text-sm text-gray-600">
                  {formatPaymentAmount(getFinalPaymentAmount(), currency)}
                </p>
              </div>
            </div>
            
            {paymentState !== 'processing' && paymentState !== 'succeeded' && (
              <button
                onClick={() => {
                  setSelectedMethod(null);
                  setPaymentState('idle');
                  setError(null);
                }}
                className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                disabled={disabled}
              >
                Change Method
              </button>
            )}
          </div>

          {/* Payment component */}
          <div className="border border-gray-200 rounded-xl p-6">
            {renderPaymentComponent()}
          </div>
        </div>
      )}

      {/* Payment state indicators */}
      {paymentState === 'processing' && (
        <div className="text-center py-4">
          <LoadingSpinner size="lg" />
          <p className="text-gray-600 mt-2">Processing your payment...</p>
        </div>
      )}

      {paymentState === 'succeeded' && (
        <div className="text-center py-8 bg-green-50 border border-green-200 rounded-xl">
          <div className="text-green-600 text-4xl mb-4">✅</div>
          <h3 className="text-xl font-semibold text-green-800 mb-2">Payment Successful!</h3>
          <p className="text-green-700">Redirecting to confirmation page...</p>
        </div>
      )}

      {/* Security notice */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <div className="text-green-600 text-lg">🔒</div>
          <div className="text-sm text-green-800">
            <p className="font-medium mb-1">Secure Payment Processing</p>
            <p>
              Your payment is protected by industry-leading security measures. All payment information 
              is encrypted and processed securely. We are PCI DSS compliant and follow strict data 
              protection standards.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}