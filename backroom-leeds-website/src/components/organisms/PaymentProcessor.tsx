'use client';

import { useState, useEffect } from 'react';
import { loadStripe, Stripe, StripeElements } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

import { Button } from '@/components/atoms/Button';
import { LoadingSpinner } from '@/components/atoms/LoadingSpinner';
import { cn } from '@/lib/utils';

// Initialize Stripe
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

export interface PaymentProcessorProps {
  clientSecret: string;
  bookingRef: string;
  amount: number; // Amount in pence
  customerEmail: string;
  onSuccess?: (paymentIntent: any) => void;
  onError?: (error: string) => void;
  className?: string;
}

// Card element styling
const cardElementOptions = {
  style: {
    base: {
      fontSize: '16px',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      color: '#424770',
      '::placeholder': {
        color: '#aab7c4',
      },
      padding: '16px',
    },
    invalid: {
      color: '#9e2146',
    },
  },
  hidePostalCode: true, // UK bookings don't typically require postal code for cards
};

// Internal payment form component
function PaymentForm({ 
  clientSecret, 
  bookingRef, 
  amount, 
  customerEmail,
  onSuccess,
  onError 
}: Omit<PaymentProcessorProps, 'className'>) {
  const stripe = useStripe();
  const elements = useElements();
  const router = useRouter();

  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cardComplete, setCardComplete] = useState(false);
  const [saveCard, setSaveCard] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements) {
      setError('Payment processing not ready. Please try again.');
      return;
    }

    const cardElement = elements.getElement(CardElement);
    if (!cardElement) {
      setError('Card details not found. Please refresh and try again.');
      return;
    }

    setProcessing(true);
    setError(null);

    try {
      // Confirm payment with card element
      const { error: confirmError, paymentIntent } = await stripe.confirmCardPayment(
        clientSecret,
        {
          payment_method: {
            card: cardElement,
            billing_details: {
              email: customerEmail,
            },
          },
          setup_future_usage: saveCard ? 'off_session' : undefined,
        }
      );

      if (confirmError) {
        console.error('Payment confirmation error:', confirmError);
        
        // Handle different error types
        let errorMessage = confirmError.message || 'Payment failed';
        
        switch (confirmError.type) {
          case 'card_error':
            if (confirmError.decline_code) {
              errorMessage = getDeclineMessage(confirmError.decline_code);
            }
            break;
          case 'validation_error':
            errorMessage = 'Please check your card details and try again';
            break;
        }

        setError(errorMessage);
        onError?.(errorMessage);
        toast.error(errorMessage);

      } else if (paymentIntent) {
        // Payment successful
        console.log('Payment successful:', paymentIntent);
        
        toast.success('Payment successful! Redirecting to confirmation...');
        
        onSuccess?.(paymentIntent);
        
        // Redirect to confirmation page
        router.push(`/book/confirmation/${bookingRef}`);
      }

    } catch (err: any) {
      console.error('Payment processing error:', err);
      const errorMessage = err.message || 'An unexpected error occurred';
      setError(errorMessage);
      onError?.(errorMessage);
      toast.error(errorMessage);
    } finally {
      setProcessing(false);
    }
  };

  const handleCardChange = (event: any) => {
    setCardComplete(event.complete);
    
    if (event.error) {
      setError(event.error.message);
    } else {
      setError(null);
    }
  };

  const canSubmit = stripe && elements && cardComplete && !processing;

  return (
    <div className="max-w-md mx-auto bg-white rounded-lg border border-gray-200 p-6">
      <div className="mb-6 text-center">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Complete Your Payment
        </h3>
        <p className="text-gray-600">
          Secure payment of £{(amount / 100).toFixed(2)} deposit
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Card Element */}
        <div className="space-y-2">
          <label htmlFor="card-element" className="block text-sm font-medium text-gray-700">
            Card Details *
          </label>
          <div className="border border-gray-300 rounded-lg p-4 bg-white focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500">
            <CardElement
              id="card-element"
              options={cardElementOptions}
              onChange={handleCardChange}
            />
          </div>
          
          {error && (
            <div className="text-sm text-red-600 flex items-start gap-1">
              <span className="text-red-500 mt-0.5 flex-shrink-0">⚠</span>
              <span>{error}</span>
            </div>
          )}
        </div>

        {/* Save card option */}
        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            id="save-card"
            checked={saveCard}
            onChange={(e) => setSaveCard(e.target.checked)}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <label htmlFor="save-card" className="text-sm text-gray-700">
            Save card for future bookings (optional)
          </label>
        </div>

        {/* Security notice */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-sm">
          <div className="flex items-start gap-2">
            <div className="text-green-600 mt-0.5">🔒</div>
            <div className="text-green-800">
              <p className="font-medium mb-1">Your payment is secure</p>
              <ul className="text-xs space-y-1 text-green-700">
                <li>• Card details are encrypted and processed by Stripe</li>
                <li>• We never store your full card information</li>
                <li>• 3D Secure authentication may be required</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Submit button */}
        <Button
          type="submit"
          disabled={!canSubmit}
          className={cn(
            'w-full py-4 text-lg font-semibold',
            {
              'bg-blue-600 hover:bg-blue-700 text-white': canSubmit,
              'bg-gray-300 text-gray-500 cursor-not-allowed': !canSubmit
            }
          )}
        >
          {processing ? (
            <span className="flex items-center justify-center gap-3">
              <LoadingSpinner size="sm" />
              Processing Payment...
            </span>
          ) : (
            `Pay £${(amount / 100).toFixed(2)} Deposit`
          )}
        </Button>
      </form>

      {/* Help text */}
      <div className="mt-6 text-center text-xs text-gray-500">
        <p>
          Problems with payment? <a href="/contact" className="text-blue-600 hover:text-blue-700">Contact us</a>
        </p>
      </div>
    </div>
  );
}

// Main PaymentProcessor component with Elements provider
export function PaymentProcessor(props: PaymentProcessorProps) {
  const [stripe, setStripe] = useState<Stripe | null>(null);
  const [elementsOptions, setElementsOptions] = useState<any>(null);

  useEffect(() => {
    const initializeStripe = async () => {
      const stripeInstance = await stripePromise;
      setStripe(stripeInstance);
      
      setElementsOptions({
        clientSecret: props.clientSecret,
        appearance: {
          theme: 'stripe' as const,
          variables: {
            colorPrimary: '#2563eb',
            colorBackground: '#ffffff',
            colorText: '#374151',
            colorDanger: '#dc2626',
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
            borderRadius: '8px',
          },
        },
        loader: 'auto',
      });
    };

    initializeStripe();
  }, [props.clientSecret]);

  if (!stripe || !elementsOptions) {
    return (
      <div className={cn('flex items-center justify-center py-12', props.className)}>
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-gray-600">Loading payment form...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={props.className}>
      <Elements stripe={stripe} options={elementsOptions}>
        <PaymentForm {...props} />
      </Elements>
    </div>
  );
}

// Helper function for decline code messages
function getDeclineMessage(declineCode: string): string {
  const messages: Record<string, string> = {
    insufficient_funds: 'Insufficient funds. Please try a different card or contact your bank.',
    expired_card: 'Your card has expired. Please try a different card.',
    incorrect_cvc: 'Your card\'s security code (CVC) is incorrect. Please check and try again.',
    processing_error: 'A processing error occurred. Please try again.',
    lost_card: 'This card has been reported as lost. Please use a different card.',
    stolen_card: 'This card has been reported as stolen. Please use a different card.',
    generic_decline: 'Your card was declined. Please try a different card.',
    fraudulent: 'This payment was declined due to suspected fraud. Please contact your bank.',
  };

  return messages[declineCode] || 'Your card was declined. Please try a different card.';
}