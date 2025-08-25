'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { Button } from '@/components/atoms/Button';
import { LoadingSpinner } from '@/components/atoms/LoadingSpinner';
import { PaymentResult, PaymentMethodType } from '@/types/payment';

// Apple Pay types
interface ApplePayPaymentRequest {
  countryCode: string;
  currencyCode: string;
  total: {
    label: string;
    amount: string;
    type?: 'final' | 'pending';
  };
  lineItems?: Array<{
    label: string;
    amount: string;
    type?: 'final' | 'pending';
  }>;
  merchantCapabilities: string[];
  supportedNetworks: string[];
  requiredBillingContactFields?: string[];
  requiredShippingContactFields?: string[];
}

interface ApplePayPaymentToken {
  paymentData: {
    data: string;
    header: {
      applicationData?: string;
      ephemeralPublicKey: string;
      publicKeyHash: string;
      transactionId: string;
    };
    signature: string;
    version: string;
  };
  paymentMethod: {
    displayName: string;
    network: string;
    type: string;
  };
  transactionIdentifier: string;
}

// Google Pay types
interface GooglePayPaymentDataRequest {
  apiVersion: number;
  apiVersionMinor: number;
  allowedPaymentMethods: Array<{
    type: string;
    parameters: {
      allowedAuthMethods: string[];
      allowedCardNetworks: string[];
      billingAddressRequired?: boolean;
      billingAddressParameters?: {
        format: string;
        phoneNumberRequired?: boolean;
      };
    };
    tokenizationSpecification: {
      type: string;
      parameters: {
        gateway: string;
        gatewayMerchantId: string;
      };
    };
  }>;
  transactionInfo: {
    totalPriceStatus: string;
    totalPrice: string;
    currencyCode: string;
    displayItems?: Array<{
      label: string;
      type: string;
      price: string;
    }>;
  };
  merchantInfo: {
    merchantId: string;
    merchantName: string;
  };
}

interface DigitalWalletPaymentProps {
  method: 'apple_pay' | 'google_pay';
  amount: number;
  currency: string;
  description: string;
  customerEmail: string;
  bookingRef: string;
  clientSecret?: string;
  onSuccess?: (result: PaymentResult) => void;
  onError?: (error: string) => void;
  className?: string;
  disabled?: boolean;
}

declare global {
  interface Window {
    ApplePaySession?: any;
    google?: {
      payments?: {
        api?: {
          PaymentsClient: any;
        };
      };
    };
  }
}

export function DigitalWalletPayment({
  method,
  amount,
  currency,
  description,
  customerEmail,
  bookingRef,
  clientSecret,
  onSuccess,
  onError,
  className = '',
  disabled = false
}: DigitalWalletPaymentProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isAvailable, setIsAvailable] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check digital wallet availability
  useEffect(() => {
    checkAvailability();
  }, [method]);

  const checkAvailability = useCallback(async () => {
    try {
      if (method === 'apple_pay') {
        // Check if Apple Pay is available
        if (window.ApplePaySession && window.ApplePaySession.canMakePayments) {
          const canMakePayments = await window.ApplePaySession.canMakePayments();
          setIsAvailable(canMakePayments);
        } else {
          setIsAvailable(false);
        }
      } else if (method === 'google_pay') {
        // Check if Google Pay is available
        if (window.google?.payments?.api) {
          const paymentsClient = new window.google.payments.api.PaymentsClient({
            environment: process.env.NODE_ENV === 'production' ? 'PRODUCTION' : 'TEST'
          });

          const isReadyToPay = await paymentsClient.isReadyToPay({
            apiVersion: 2,
            apiVersionMinor: 0,
            allowedPaymentMethods: [{
              type: 'CARD',
              parameters: {
                allowedAuthMethods: ['PAN_ONLY', 'CRYPTOGRAM_3DS'],
                allowedCardNetworks: ['MASTERCARD', 'VISA', 'AMEX']
              }
            }]
          });

          setIsAvailable(isReadyToPay.result);
        } else {
          setIsAvailable(false);
        }
      }
    } catch (err) {
      console.error(`Error checking ${method} availability:`, err);
      setIsAvailable(false);
    }
  }, [method]);

  const processApplePayPayment = async () => {
    if (!window.ApplePaySession) {
      throw new Error('Apple Pay is not available');
    }

    setIsLoading(true);
    setError(null);

    try {
      const paymentRequest: ApplePayPaymentRequest = {
        countryCode: 'GB',
        currencyCode: currency.toUpperCase(),
        total: {
          label: 'The Backroom Leeds - Table Booking',
          amount: (amount / 100).toFixed(2),
          type: 'final'
        },
        lineItems: [
          {
            label: description,
            amount: (amount / 100).toFixed(2),
            type: 'final'
          }
        ],
        merchantCapabilities: ['supports3DS'],
        supportedNetworks: ['visa', 'masterCard', 'amex'],
        requiredBillingContactFields: ['postalAddress', 'email']
      };

      const session = new window.ApplePaySession(3, paymentRequest);

      session.onvalidatemerchant = async (event: any) => {
        try {
          // Call your backend to validate the merchant
          const response = await fetch('/api/payments/apple-pay/validate-merchant', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              validationURL: event.validationURL,
              displayName: 'The Backroom Leeds'
            })
          });

          const merchantSession = await response.json();
          session.completeMerchantValidation(merchantSession);
        } catch (err) {
          console.error('Merchant validation failed:', err);
          session.abort();
          setError('Apple Pay setup failed. Please try another payment method.');
        }
      };

      session.onpaymentauthorized = async (event: any) => {
        try {
          // Process the payment with your backend
          const response = await fetch('/api/payments/apple-pay/process', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              paymentToken: event.payment.token,
              amount,
              currency,
              bookingRef,
              customerEmail,
              clientSecret
            })
          });

          const result = await response.json();

          if (result.success) {
            session.completePayment(window.ApplePaySession.STATUS_SUCCESS);
            
            toast.success('Payment successful!');
            onSuccess?.(result);
            router.push(`/book/confirmation/${bookingRef}`);
          } else {
            session.completePayment(window.ApplePaySession.STATUS_FAILURE);
            setError(result.error || 'Payment failed');
            onError?.(result.error);
          }
        } catch (err) {
          console.error('Apple Pay processing failed:', err);
          session.completePayment(window.ApplePaySession.STATUS_FAILURE);
          setError('Payment processing failed. Please try again.');
          onError?.('Payment processing failed');
        }
      };

      session.oncancel = () => {
        setIsLoading(false);
        setError('Payment was cancelled');
      };

      session.begin();
    } catch (err) {
      setIsLoading(false);
      console.error('Apple Pay error:', err);
      setError('Apple Pay is not available. Please try another payment method.');
      onError?.('Apple Pay failed');
    }
  };

  const processGooglePayPayment = async () => {
    if (!window.google?.payments?.api) {
      throw new Error('Google Pay is not available');
    }

    setIsLoading(true);
    setError(null);

    try {
      const paymentsClient = new window.google.payments.api.PaymentsClient({
        environment: process.env.NODE_ENV === 'production' ? 'PRODUCTION' : 'TEST'
      });

      const paymentDataRequest: GooglePayPaymentDataRequest = {
        apiVersion: 2,
        apiVersionMinor: 0,
        allowedPaymentMethods: [{
          type: 'CARD',
          parameters: {
            allowedAuthMethods: ['PAN_ONLY', 'CRYPTOGRAM_3DS'],
            allowedCardNetworks: ['MASTERCARD', 'VISA', 'AMEX'],
            billingAddressRequired: true,
            billingAddressParameters: {
              format: 'FULL',
              phoneNumberRequired: true
            }
          },
          tokenizationSpecification: {
            type: 'PAYMENT_GATEWAY',
            parameters: {
              gateway: 'stripe',
              gatewayMerchantId: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || ''
            }
          }
        }],
        transactionInfo: {
          totalPriceStatus: 'FINAL',
          totalPrice: (amount / 100).toFixed(2),
          currencyCode: currency.toUpperCase(),
          displayItems: [{
            label: description,
            type: 'LINE_ITEM',
            price: (amount / 100).toFixed(2)
          }]
        },
        merchantInfo: {
          merchantId: process.env.NEXT_PUBLIC_GOOGLE_PAY_MERCHANT_ID || '',
          merchantName: 'The Backroom Leeds'
        }
      };

      const paymentData = await paymentsClient.loadPaymentData(paymentDataRequest);

      // Process the payment with your backend
      const response = await fetch('/api/payments/google-pay/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paymentData,
          amount,
          currency,
          bookingRef,
          customerEmail,
          clientSecret
        })
      });

      const result = await response.json();

      if (result.success) {
        toast.success('Payment successful!');
        onSuccess?.(result);
        router.push(`/book/confirmation/${bookingRef}`);
      } else {
        setError(result.error || 'Payment failed');
        onError?.(result.error);
      }
    } catch (err: any) {
      console.error('Google Pay error:', err);
      
      if (err.statusCode === 'CANCELED') {
        setError('Payment was cancelled');
      } else if (err.statusCode === 'DEVELOPER_ERROR') {
        setError('Google Pay configuration error. Please try another payment method.');
      } else {
        setError('Google Pay is not available. Please try another payment method.');
      }
      
      onError?.('Google Pay failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePayment = async () => {
    if (disabled || isLoading) return;

    try {
      if (method === 'apple_pay') {
        await processApplePayPayment();
      } else if (method === 'google_pay') {
        await processGooglePayPayment();
      }
    } catch (err) {
      console.error(`${method} payment error:`, err);
      setIsLoading(false);
      setError(`${method === 'apple_pay' ? 'Apple' : 'Google'} Pay failed. Please try another payment method.`);
    }
  };

  const getButtonText = () => {
    if (isLoading) return 'Processing...';
    if (method === 'apple_pay') return 'Pay with Apple Pay';
    if (method === 'google_pay') return 'Pay with Google Pay';
    return 'Pay Now';
  };

  const getButtonIcon = () => {
    if (method === 'apple_pay') return '🍎';
    if (method === 'google_pay') return '🔵';
    return '💳';
  };

  if (!isAvailable) {
    return (
      <div className={cn('p-4 bg-gray-50 border border-gray-200 rounded-lg', className)}>
        <div className="text-center text-gray-600">
          <p className="text-sm">
            {method === 'apple_pay' ? 'Apple Pay' : 'Google Pay'} is not available on this device.
          </p>
          <p className="text-xs mt-1">
            Please choose another payment method.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn('space-y-4', className)}>
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

      <div className="text-center space-y-4">
        <div className="text-sm text-gray-600">
          <p>Pay securely with {method === 'apple_pay' ? 'Touch ID, Face ID, or your passcode' : 'your fingerprint, PIN, or pattern'}</p>
          <p className="font-medium text-gray-900 mt-1">
            Total: £{(amount / 100).toFixed(2)}
          </p>
        </div>

        <Button
          onClick={handlePayment}
          disabled={disabled || isLoading}
          className={cn(
            'w-full py-4 text-lg font-semibold transition-all',
            {
              'bg-black text-white hover:bg-gray-800': method === 'apple_pay',
              'bg-blue-600 text-white hover:bg-blue-700': method === 'google_pay',
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
              <span className="text-xl">{getButtonIcon()}</span>
              {getButtonText()}
            </span>
          )}
        </Button>

        <div className="text-xs text-gray-500">
          <p>
            Your payment information is processed securely. We don't store your
            {method === 'apple_pay' ? ' Touch ID, Face ID, or device' : ' biometric'} information.
          </p>
        </div>
      </div>
    </div>
  );
}

// Wrapper component that loads the appropriate digital wallet scripts
export function DigitalWalletWrapper({ children }: { children: React.ReactNode }) {
  const [scriptsLoaded, setScriptsLoaded] = useState(false);

  useEffect(() => {
    const loadGooglePayScript = () => {
      return new Promise((resolve, reject) => {
        if (window.google?.payments?.api) {
          resolve(true);
          return;
        }

        const script = document.createElement('script');
        script.src = 'https://pay.google.com/gp/p/js/pay.js';
        script.async = true;
        script.onload = () => resolve(true);
        script.onerror = () => reject(new Error('Failed to load Google Pay script'));
        document.head.appendChild(script);
      });
    };

    // Apple Pay doesn't need external scripts, it's part of Safari
    const loadScripts = async () => {
      try {
        await loadGooglePayScript();
        setScriptsLoaded(true);
      } catch (error) {
        console.error('Failed to load payment scripts:', error);
        setScriptsLoaded(true); // Still render, just without Google Pay
      }
    };

    loadScripts();
  }, []);

  if (!scriptsLoaded) {
    return (
      <div className="flex items-center justify-center py-8">
        <LoadingSpinner size="md" />
        <span className="ml-3 text-gray-600">Loading payment methods...</span>
      </div>
    );
  }

  return <>{children}</>;
}