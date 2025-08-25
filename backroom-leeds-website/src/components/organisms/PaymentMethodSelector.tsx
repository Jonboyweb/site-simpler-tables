'use client';

import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Icon } from '@/components/atoms/Icon';
import { Button } from '@/components/atoms/Button';
import { LoadingSpinner } from '@/components/atoms/LoadingSpinner';
import { 
  PaymentMethod, 
  PaymentMethodType, 
  DeviceCapabilities,
  getAvailablePaymentMethods,
  getRecommendedPaymentMethod,
  formatPaymentAmount,
  getPaymentMethodFees,
  PAYMENT_METHODS 
} from '@/types/payment';

interface PaymentMethodSelectorProps {
  amount: number;
  currency?: string;
  region?: string;
  selectedMethod?: PaymentMethodType;
  onMethodSelect: (method: PaymentMethodType) => void;
  onPaymentOptionsChange?: (options: { timing: string; installments?: boolean }) => void;
  className?: string;
  showRecommended?: boolean;
  disabled?: boolean;
}

// Device capability detection
function detectDeviceCapabilities(): DeviceCapabilities {
  if (typeof window === 'undefined') {
    return {
      hasApplePay: false,
      hasGooglePay: false,
      isMobile: false,
      isTablet: false,
      supportsWebAuthn: false,
      supportsBiometric: false
    };
  }

  const userAgent = navigator.userAgent;
  const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
  const isTablet = /iPad|Android(?!.*Mobile)/i.test(userAgent);
  const isAppleDevice = /iPhone|iPad|iPod|Mac/i.test(userAgent);
  const supportsWebAuthn = 'credentials' in navigator && 'create' in navigator.credentials;

  return {
    hasApplePay: isAppleDevice && 'ApplePaySession' in window,
    hasGooglePay: 'google' in window && 'payments' in (window as any).google,
    isMobile,
    isTablet,
    supportsWebAuthn,
    supportsBiometric: supportsWebAuthn && (isMobile || isTablet)
  };
}

// Payment method icons mapping
const PAYMENT_ICONS: Record<string, string> = {
  'credit-card': '💳',
  'apple-pay': '🍎',
  'google-pay': '🔵',
  'paypal': '🅿️',
  'klarna': '🛒',
  'clearpay': '⏰',
  'bank': '🏦',
  'open-banking': '🔓',
  'direct-debit': '📋'
};

export function PaymentMethodSelector({
  amount,
  currency = 'GBP',
  region = 'GB',
  selectedMethod,
  onMethodSelect,
  onPaymentOptionsChange,
  className = '',
  showRecommended = true,
  disabled = false
}: PaymentMethodSelectorProps) {
  const [deviceCapabilities, setDeviceCapabilities] = useState<DeviceCapabilities | null>(null);
  const [availableMethods, setAvailableMethods] = useState<PaymentMethod[]>([]);
  const [recommendedMethod, setRecommendedMethod] = useState<PaymentMethodType | null>(null);
  const [paymentTiming, setPaymentTiming] = useState<'deposit_only' | 'full_payment'>('deposit_only');
  const [showInstallments, setShowInstallments] = useState(false);

  // Initialize device capabilities and available methods
  useEffect(() => {
    const capabilities = detectDeviceCapabilities();
    setDeviceCapabilities(capabilities);

    const methods = getAvailablePaymentMethods({
      region,
      currency,
      amount,
      userAgent: navigator.userAgent
    });

    setAvailableMethods(methods);

    const recommended = getRecommendedPaymentMethod(methods, capabilities);
    setRecommendedMethod(recommended);

    // Auto-select recommended method if none selected
    if (!selectedMethod && recommended) {
      onMethodSelect(recommended);
    }
  }, [amount, currency, region, selectedMethod, onMethodSelect]);

  // Handle payment timing changes
  useEffect(() => {
    onPaymentOptionsChange?.({
      timing: paymentTiming,
      installments: showInstallments
    });
  }, [paymentTiming, showInstallments, onPaymentOptionsChange]);

  const handleMethodSelect = (method: PaymentMethodType) => {
    if (disabled) return;
    onMethodSelect(method);

    // Show installments option for BNPL methods
    const selectedPaymentMethod = PAYMENT_METHODS.find(m => m.id === method);
    setShowInstallments(['klarna', 'clearpay'].includes(method));
  };

  const getMethodDescription = (method: PaymentMethod) => {
    const fees = getPaymentMethodFees(method.id, amount);
    let description = method.description;

    if (fees.total > 0) {
      description += ` • Fee: ${formatPaymentAmount(fees.total, currency)}`;
    } else if (method.fees?.description === 'No fees for customers') {
      description += ' • No fees';
    }

    if (method.processingTime) {
      description += ` • ${method.processingTime}`;
    }

    return description;
  };

  if (!deviceCapabilities) {
    return (
      <div className={cn('flex items-center justify-center py-8', className)}>
        <LoadingSpinner size="md" />
        <span className="ml-3 text-gray-600">Loading payment methods...</span>
      </div>
    );
  }

  return (
    <div className={cn('space-y-6', className)}>
      {/* Payment timing options */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">Payment Options</h3>
        
        <div className="grid gap-3 sm:grid-cols-2">
          <button
            type="button"
            onClick={() => setPaymentTiming('deposit_only')}
            disabled={disabled}
            className={cn(
              'p-4 border rounded-lg text-left transition-all',
              'hover:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-500',
              {
                'border-blue-500 bg-blue-50 text-blue-900': paymentTiming === 'deposit_only',
                'border-gray-200 text-gray-700': paymentTiming !== 'deposit_only',
                'opacity-50 cursor-not-allowed': disabled
              }
            )}
          >
            <div className="font-medium text-sm">Pay Deposit Only</div>
            <div className="text-sm text-gray-600 mt-1">
              {formatPaymentAmount(5000, currency)} deposit today, remaining balance on arrival
            </div>
          </button>

          <button
            type="button"
            onClick={() => setPaymentTiming('full_payment')}
            disabled={disabled}
            className={cn(
              'p-4 border rounded-lg text-left transition-all',
              'hover:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-500',
              {
                'border-blue-500 bg-blue-50 text-blue-900': paymentTiming === 'full_payment',
                'border-gray-200 text-gray-700': paymentTiming !== 'full_payment',
                'opacity-50 cursor-not-allowed': disabled
              }
            )}
          >
            <div className="font-medium text-sm">Pay Full Amount</div>
            <div className="text-sm text-gray-600 mt-1">
              {formatPaymentAmount(amount, currency)} total - nothing to pay on arrival
            </div>
          </button>
        </div>
      </div>

      {/* Payment method selection */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">Choose Payment Method</h3>
        
        {availableMethods.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p>No payment methods available for your region.</p>
            <p className="text-sm mt-2">Please contact us for assistance.</p>
          </div>
        ) : (
          <div className="grid gap-3">
            {availableMethods.map((method) => (
              <button
                key={method.id}
                type="button"
                onClick={() => handleMethodSelect(method.id)}
                disabled={disabled}
                className={cn(
                  'p-4 border rounded-lg text-left transition-all relative',
                  'hover:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-500',
                  {
                    'border-blue-500 bg-blue-50': selectedMethod === method.id,
                    'border-gray-200': selectedMethod !== method.id,
                    'opacity-50 cursor-not-allowed': disabled
                  }
                )}
              >
                {/* Recommended badge */}
                {showRecommended && recommendedMethod === method.id && (
                  <div className="absolute -top-2 -right-2 bg-blue-600 text-white text-xs px-2 py-1 rounded-full">
                    Recommended
                  </div>
                )}

                <div className="flex items-start gap-4">
                  {/* Payment method icon */}
                  <div className="text-2xl flex-shrink-0 mt-1">
                    {PAYMENT_ICONS[method.icon] || '💳'}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-gray-900">{method.displayName}</span>
                      {selectedMethod === method.id && (
                        <Icon name="check" className="w-4 h-4 text-blue-600" />
                      )}
                    </div>
                    
                    <p className="text-sm text-gray-600 mb-2">
                      {getMethodDescription(method)}
                    </p>

                    {/* Payment method features */}
                    {method.features.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {method.features.slice(0, 3).map((feature, index) => (
                          <span
                            key={index}
                            className="inline-block bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded"
                          >
                            {feature}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Device-specific availability indicators */}
                  <div className="flex flex-col gap-1 text-xs text-gray-500">
                    {deviceCapabilities.isMobile && method.availability.mobile && (
                      <span className="flex items-center gap-1">
                        📱 Mobile
                      </span>
                    )}
                    {!deviceCapabilities.isMobile && method.availability.desktop && (
                      <span className="flex items-center gap-1">
                        💻 Desktop
                      </span>
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Installment options for BNPL methods */}
      {showInstallments && selectedMethod && ['klarna', 'clearpay'].includes(selectedMethod) && (
        <div className="space-y-4 bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-lg p-4">
          <h4 className="font-medium text-gray-900">Installment Plan</h4>
          
          {selectedMethod === 'klarna' && (
            <div className="text-sm text-gray-700">
              <p className="font-medium mb-2">Pay in 3 interest-free instalments:</p>
              <div className="space-y-1">
                <div>• Today: {formatPaymentAmount(Math.round(amount / 3), currency)}</div>
                <div>• 30 days: {formatPaymentAmount(Math.round(amount / 3), currency)}</div>
                <div>• 60 days: {formatPaymentAmount(amount - 2 * Math.round(amount / 3), currency)}</div>
              </div>
            </div>
          )}

          {selectedMethod === 'clearpay' && (
            <div className="text-sm text-gray-700">
              <p className="font-medium mb-2">Pay in 4 interest-free instalments:</p>
              <div className="space-y-1">
                <div>• Today: {formatPaymentAmount(Math.round(amount / 4), currency)}</div>
                <div>• 2 weeks: {formatPaymentAmount(Math.round(amount / 4), currency)}</div>
                <div>• 4 weeks: {formatPaymentAmount(Math.round(amount / 4), currency)}</div>
                <div>• 6 weeks: {formatPaymentAmount(amount - 3 * Math.round(amount / 4), currency)}</div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Payment security notice */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <div className="text-green-600 text-lg">🔒</div>
          <div className="text-sm text-green-800">
            <p className="font-medium mb-1">Secure Payment Processing</p>
            <p>
              All payments are processed securely. Your financial information is encrypted and protected. 
              We are PCI DSS compliant and follow industry security standards.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}