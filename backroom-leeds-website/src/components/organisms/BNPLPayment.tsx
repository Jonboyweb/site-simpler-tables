'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { Button } from '@/components/atoms/Button';
import { LoadingSpinner } from '@/components/atoms/LoadingSpinner';
import { PaymentResult } from '@/types/payment';

type BNPLMethod = 'klarna' | 'clearpay';

interface BNPLPaymentProps {
  method: BNPLMethod;
  amount: number;
  currency: string;
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
  className?: string;
  disabled?: boolean;
}

interface InstallmentBreakdown {
  installments: Array<{
    amount: number;
    dueDate: string;
    description: string;
  }>;
  totalAmount: number;
  fees: number;
  interestRate: number;
}

// Klarna configuration
declare global {
  interface Window {
    Klarna?: {
      Payments: {
        init: (options: any) => void;
        load: (options: any, callback: (res: any) => void) => void;
        authorize: (options: any, callback: (res: any) => void) => void;
      };
    };
    Square?: any; // Clearpay is now part of Square
  }
}

export function BNPLPayment({
  method,
  amount,
  currency,
  description,
  customerEmail,
  customerName,
  bookingRef,
  billingAddress,
  onSuccess,
  onError,
  className = '',
  disabled = false
}: BNPLPaymentProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isEligible, setIsEligible] = useState<boolean | null>(null);
  const [installmentPlan, setInstallmentPlan] = useState<InstallmentBreakdown | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [widgetLoaded, setWidgetLoaded] = useState(false);

  // Check BNPL eligibility and calculate installments
  useEffect(() => {
    checkEligibility();
    loadPaymentWidget();
  }, [method, amount, currency]);

  const checkEligibility = async () => {
    try {
      const response = await fetch('/api/payments/bnpl/eligibility', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          method,
          amount,
          currency,
          customerEmail,
          region: billingAddress?.country || 'GB'
        })
      });

      const result = await response.json();
      
      if (result.eligible) {
        setIsEligible(true);
        setInstallmentPlan(calculateInstallments(method, amount));
      } else {
        setIsEligible(false);
        setError(result.reason || 'Not eligible for this payment method');
      }
    } catch (err) {
      console.error('BNPL eligibility check failed:', err);
      setIsEligible(false);
      setError('Unable to check eligibility. Please try another payment method.');
    }
  };

  const calculateInstallments = (method: BNPLMethod, amount: number): InstallmentBreakdown => {
    const now = new Date();

    if (method === 'klarna') {
      const installmentAmount = Math.round(amount / 3);
      const finalAmount = amount - (2 * installmentAmount);

      return {
        installments: [
          {
            amount: installmentAmount,
            dueDate: now.toISOString(),
            description: 'Due today'
          },
          {
            amount: installmentAmount,
            dueDate: new Date(now.getTime() + (30 * 24 * 60 * 60 * 1000)).toISOString(),
            description: 'Due in 30 days'
          },
          {
            amount: finalAmount,
            dueDate: new Date(now.getTime() + (60 * 24 * 60 * 60 * 1000)).toISOString(),
            description: 'Due in 60 days'
          }
        ],
        totalAmount: amount,
        fees: 0,
        interestRate: 0
      };
    } else { // clearpay
      const installmentAmount = Math.round(amount / 4);
      const finalAmount = amount - (3 * installmentAmount);

      return {
        installments: [
          {
            amount: installmentAmount,
            dueDate: now.toISOString(),
            description: 'Due today'
          },
          {
            amount: installmentAmount,
            dueDate: new Date(now.getTime() + (14 * 24 * 60 * 60 * 1000)).toISOString(),
            description: 'Due in 2 weeks'
          },
          {
            amount: installmentAmount,
            dueDate: new Date(now.getTime() + (28 * 24 * 60 * 60 * 1000)).toISOString(),
            description: 'Due in 4 weeks'
          },
          {
            amount: finalAmount,
            dueDate: new Date(now.getTime() + (42 * 24 * 60 * 60 * 1000)).toISOString(),
            description: 'Due in 6 weeks'
          }
        ],
        totalAmount: amount,
        fees: 0,
        interestRate: 0
      };
    }
  };

  const loadPaymentWidget = async () => {
    try {
      if (method === 'klarna') {
        await loadKlarnaWidget();
      } else if (method === 'clearpay') {
        await loadClearpayWidget();
      }
      setWidgetLoaded(true);
    } catch (err) {
      console.error(`Failed to load ${method} widget:`, err);
      setError(`Failed to load ${method}. Please try another payment method.`);
    }
  };

  const loadKlarnaWidget = (): Promise<void> => {
    return new Promise((resolve, reject) => {
      if (window.Klarna?.Payments) {
        resolve();
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://x.klarnacdn.net/kp/lib/v1/api.js';
      script.async = true;
      script.onload = () => {
        if (window.Klarna?.Payments) {
          // Initialize Klarna
          window.Klarna.Payments.init({
            client_token: process.env.NEXT_PUBLIC_KLARNA_CLIENT_TOKEN
          });
          resolve();
        } else {
          reject(new Error('Klarna failed to initialize'));
        }
      };
      script.onerror = () => reject(new Error('Failed to load Klarna script'));
      document.head.appendChild(script);
    });
  };

  const loadClearpayWidget = (): Promise<void> => {
    return new Promise((resolve, reject) => {
      if (window.Square) {
        resolve();
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://js.afterpay.com/afterpay-1.x.js';
      script.async = true;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('Failed to load Clearpay script'));
      document.head.appendChild(script);
    });
  };

  const processKlarnaPayment = async () => {
    if (!window.Klarna?.Payments) {
      throw new Error('Klarna is not available');
    }

    setIsLoading(true);
    setError(null);

    try {
      // Create payment session
      const sessionResponse = await fetch('/api/payments/klarna/create-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount,
          currency,
          description,
          customerEmail,
          customerName,
          bookingRef,
          billingAddress
        })
      });

      const session = await sessionResponse.json();

      if (!session.success) {
        throw new Error(session.error || 'Failed to create Klarna session');
      }

      // Load Klarna payment form
      window.Klarna.Payments.load(
        {
          container: '#klarna-payments-container',
          payment_method_category: 'pay_in_parts'
        },
        (res: any) => {
          if (res.show_form) {
            // Payment form loaded successfully
            console.log('Klarna payment form loaded');
          } else {
            setError('Klarna payment form could not be loaded');
            setIsLoading(false);
          }
        }
      );

    } catch (err: any) {
      console.error('Klarna payment error:', err);
      setError(err.message || 'Klarna payment failed');
      setIsLoading(false);
      onError?.(err.message);
    }
  };

  const authorizeBNPLPayment = async () => {
    if (method === 'klarna') {
      await authorizeKlarnaPayment();
    } else if (method === 'clearpay') {
      await authorizeClearpayPayment();
    }
  };

  const authorizeKlarnaPayment = async () => {
    if (!window.Klarna?.Payments) return;

    window.Klarna.Payments.authorize(
      {
        payment_method_category: 'pay_in_parts'
      },
      async (res: any) => {
        if (res.approved) {
          // Process the authorized payment
          try {
            const response = await fetch('/api/payments/klarna/confirm', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                authorizationToken: res.authorization_token,
                amount,
                currency,
                bookingRef,
                customerEmail
              })
            });

            const result = await response.json();

            if (result.success) {
              toast.success('Klarna payment successful!');
              onSuccess?.(result);
              router.push(`/book/confirmation/${bookingRef}`);
            } else {
              setError(result.error || 'Payment confirmation failed');
              onError?.(result.error);
            }
          } catch (err: any) {
            console.error('Klarna confirmation error:', err);
            setError('Payment confirmation failed');
            onError?.(err.message);
          }
        } else {
          setError('Klarna payment was not approved');
          if (onError) {
            onError('Payment not approved');
          }
        }
        setIsLoading(false);
      }
    );
  };

  const authorizeClearpayPayment = async () => {
    try {
      const response = await fetch('/api/payments/clearpay/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount,
          currency,
          description,
          customerEmail,
          customerName,
          bookingRef,
          billingAddress
        })
      });

      const result = await response.json();

      if (result.success && result.redirectUrl) {
        // Redirect to Clearpay checkout
        window.location.href = result.redirectUrl;
      } else {
        setError(result.error || 'Failed to create Clearpay checkout');
        onError?.(result.error);
      }
    } catch (err: any) {
      console.error('Clearpay payment error:', err);
      setError('Clearpay payment failed');
      onError?.(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePayment = async () => {
    if (disabled || isLoading) return;

    try {
      if (method === 'klarna') {
        await processKlarnaPayment();
      } else {
        await authorizeBNPLPayment();
      }
    } catch (err: any) {
      console.error('BNPL payment error:', err);
      setError(err.message || 'Payment failed');
      onError?.(err.message);
      setIsLoading(false);
    }
  };

  if (isEligible === null) {
    return (
      <div className={cn('flex items-center justify-center py-8', className)}>
        <LoadingSpinner size="md" />
        <span className="ml-3 text-gray-600">Checking eligibility...</span>
      </div>
    );
  }

  if (!isEligible) {
    return (
      <div className={cn('p-4 bg-yellow-50 border border-yellow-200 rounded-lg', className)}>
        <div className="text-center text-yellow-800">
          <p className="font-medium">
            {method === 'klarna' ? 'Klarna' : 'Clearpay'} Not Available
          </p>
          <p className="text-sm mt-1">
            {error || 'This payment method is not available for your purchase.'}
          </p>
          <p className="text-sm mt-2">Please choose another payment method.</p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn('space-y-6', className)}>
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-start gap-2">
            <span className="text-red-500 text-sm">⚠</span>
            <div className="text-sm text-red-700">
              <p className="font-medium">Payment Error</p>
              <p>{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Installment breakdown */}
      {installmentPlan && (
        <div className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-lg p-6">
          <div className="text-center mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              {method === 'klarna' ? 'Pay in 3 with Klarna' : 'Pay in 4 with Clearpay'}
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              {method === 'klarna' 
                ? 'Split your payment into 3 interest-free instalments'
                : 'Split your payment into 4 interest-free instalments'
              }
            </p>
          </div>

          <div className="grid gap-3">
            {installmentPlan.installments.map((installment, index) => (
              <div 
                key={index}
                className={cn(
                  'flex justify-between items-center p-3 rounded-lg',
                  {
                    'bg-white border border-purple-200': index === 0,
                    'bg-purple-50': index > 0
                  }
                )}
              >
                <div>
                  <span className="font-medium text-gray-900">
                    Payment {index + 1}
                  </span>
                  <p className="text-sm text-gray-600">{installment.description}</p>
                </div>
                <div className="text-right">
                  <span className="font-semibold text-lg">
                    £{(installment.amount / 100).toFixed(2)}
                  </span>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 pt-4 border-t border-purple-200">
            <div className="flex justify-between items-center">
              <span className="font-medium text-gray-900">Total</span>
              <span className="font-bold text-lg">£{(amount / 100).toFixed(2)}</span>
            </div>
            <p className="text-xs text-gray-600 mt-1">
              No interest, no fees, no impact on your credit score
            </p>
          </div>
        </div>
      )}

      {/* Klarna payment container */}
      {method === 'klarna' && widgetLoaded && (
        <div id="klarna-payments-container" className="min-h-[200px]" />
      )}

      {/* Payment button */}
      <div className="text-center">
        <Button
          onClick={method === 'klarna' ? authorizeBNPLPayment : handlePayment}
          disabled={disabled || isLoading}
          className={cn(
            'w-full py-4 text-lg font-semibold transition-all',
            {
              'bg-pink-500 text-white hover:bg-pink-600': method === 'klarna',
              'bg-green-600 text-white hover:bg-green-700': method === 'clearpay',
              'opacity-50 cursor-not-allowed': disabled || isLoading
            }
          )}
        >
          {isLoading ? (
            <span className="flex items-center justify-center gap-3">
              <LoadingSpinner size="sm" />
              Processing...
            </span>
          ) : (
            <span className="flex items-center justify-center gap-3">
              {method === 'klarna' && <span>🛒</span>}
              {method === 'clearpay' && <span>⏰</span>}
              {method === 'klarna' ? 'Continue with Klarna' : 'Continue with Clearpay'}
            </span>
          )}
        </Button>
      </div>

      {/* Terms and conditions */}
      <div className="text-xs text-gray-500 text-center">
        <p>
          By continuing, you agree to {method === 'klarna' ? 'Klarna' : 'Clearpay'}'s{' '}
          <a 
            href={method === 'klarna' 
              ? 'https://www.klarna.com/uk/terms-and-conditions/' 
              : 'https://www.clearpay.co.uk/terms-of-service'
            }
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:text-blue-700 underline"
          >
            Terms & Conditions
          </a>
        </p>
      </div>
    </div>
  );
}