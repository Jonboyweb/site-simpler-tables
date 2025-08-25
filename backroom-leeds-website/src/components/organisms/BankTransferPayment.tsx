'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { Button } from '@/components/atoms/Button';
import { LoadingSpinner } from '@/components/atoms/LoadingSpinner';
import { Input } from '@/components/atoms/Input';
import { PaymentResult } from '@/types/payment';

type BankTransferMethod = 'bank_transfer' | 'open_banking' | 'bacs_direct_debit';

interface BankTransferPaymentProps {
  method: BankTransferMethod;
  amount: number;
  currency: string;
  description: string;
  customerEmail: string;
  customerName: string;
  bookingRef: string;
  onSuccess?: (result: PaymentResult) => void;
  onError?: (error: string) => void;
  className?: string;
  disabled?: boolean;
}

interface BankAccount {
  accountNumber: string;
  sortCode: string;
  accountHolderName: string;
  bankName?: string;
}

interface OpenBankingProvider {
  id: string;
  name: string;
  icon: string;
  supported: boolean;
}

// UK Open Banking providers
const OPEN_BANKING_PROVIDERS: OpenBankingProvider[] = [
  { id: 'lloyds', name: 'Lloyds Bank', icon: '🏦', supported: true },
  { id: 'hsbc', name: 'HSBC', icon: '🔴', supported: true },
  { id: 'barclays', name: 'Barclays', icon: '🔷', supported: true },
  { id: 'natwest', name: 'NatWest', icon: '💜', supported: true },
  { id: 'santander', name: 'Santander', icon: '🔺', supported: true },
  { id: 'halifax', name: 'Halifax', icon: '❌', supported: true },
  { id: 'nationwide', name: 'Nationwide', icon: '🏠', supported: true },
  { id: 'monzo', name: 'Monzo', icon: '🌡️', supported: true },
  { id: 'starling', name: 'Starling Bank', icon: '⭐', supported: true },
  { id: 'revolut', name: 'Revolut', icon: '🔄', supported: true }
];

declare global {
  interface Window {
    TrueLayer?: any; // Open Banking provider
    Plaid?: any; // Alternative Open Banking provider
  }
}

export function BankTransferPayment({
  method,
  amount,
  currency,
  description,
  customerEmail,
  customerName,
  bookingRef,
  onSuccess,
  onError,
  className = '',
  disabled = false
}: BankTransferPaymentProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [bankAccount, setBankAccount] = useState<BankAccount>({
    accountNumber: '',
    sortCode: '',
    accountHolderName: customerName || ''
  });
  const [selectedProvider, setSelectedProvider] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [paymentInstructions, setPaymentInstructions] = useState<string | null>(null);
  const [mandateId, setMandateId] = useState<string | null>(null);

  useEffect(() => {
    if (method === 'open_banking') {
      loadOpenBankingProvider();
    }
  }, [method]);

  const loadOpenBankingProvider = async () => {
    // Load TrueLayer or similar Open Banking provider
    try {
      // This would typically load the Open Banking provider's SDK
      console.log('Loading Open Banking provider...');
    } catch (err) {
      console.error('Failed to load Open Banking provider:', err);
    }
  };

  const validateUKBankDetails = (account: BankAccount): boolean => {
    const sortCodeRegex = /^\d{6}$/;
    const accountNumberRegex = /^\d{8}$/;
    
    if (!sortCodeRegex.test(account.sortCode.replace(/\D/g, ''))) {
      setError('Sort code must be 6 digits');
      return false;
    }
    
    if (!accountNumberRegex.test(account.accountNumber)) {
      setError('Account number must be 8 digits');
      return false;
    }
    
    if (account.accountHolderName.length < 2) {
      setError('Account holder name is required');
      return false;
    }
    
    return true;
  };

  const formatSortCode = (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, 6);
    return digits.replace(/(\d{2})(\d{2})(\d{2})/, '$1-$2-$3').slice(0, 8);
  };

  const handleBankAccountChange = (field: keyof BankAccount, value: string) => {
    setBankAccount(prev => ({
      ...prev,
      [field]: field === 'sortCode' ? formatSortCode(value) : value
    }));
    setError(null);
  };

  const processTraditionalBankTransfer = async () => {
    if (!validateUKBankDetails(bankAccount)) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/payments/bank-transfer/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount,
          currency,
          description,
          customerEmail,
          customerName,
          bookingRef,
          bankAccount
        })
      });

      const result = await response.json();

      if (result.success) {
        setPaymentInstructions(result.instructions);
        
        // Bank transfer is typically not instant, so we create a pending payment
        const paymentResult: PaymentResult = {
          success: true,
          paymentIntent: {
            id: result.transferId,
            status: 'pending',
            amount,
            currency,
            paymentMethod: 'bank_transfer'
          }
        };

        toast.success('Bank transfer instructions sent to your email');
        onSuccess?.(paymentResult);
        
        // Don't redirect immediately, show instructions first
      } else {
        setError(result.error || 'Failed to set up bank transfer');
        onError?.(result.error);
      }
    } catch (err: any) {
      console.error('Bank transfer error:', err);
      setError('Failed to set up bank transfer. Please try again.');
      onError?.(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const processOpenBankingPayment = async () => {
    if (!selectedProvider) {
      setError('Please select your bank');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/payments/open-banking/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider: selectedProvider,
          amount,
          currency,
          description,
          customerEmail,
          customerName,
          bookingRef
        })
      });

      const result = await response.json();

      if (result.success && result.authUrl) {
        // Redirect to bank for authentication
        window.location.href = result.authUrl;
      } else {
        setError(result.error || 'Failed to initiate Open Banking payment');
        onError?.(result.error);
      }
    } catch (err: any) {
      console.error('Open Banking error:', err);
      setError('Failed to process Open Banking payment');
      onError?.(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const processDirectDebitSetup = async () => {
    if (!validateUKBankDetails(bankAccount)) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/payments/direct-debit/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount,
          currency,
          description,
          customerEmail,
          customerName,
          bookingRef,
          bankAccount
        })
      });

      const result = await response.json();

      if (result.success) {
        setMandateId(result.mandateId);
        
        const paymentResult: PaymentResult = {
          success: true,
          paymentIntent: {
            id: result.mandateId,
            status: 'setup_pending',
            amount,
            currency,
            paymentMethod: 'bacs_direct_debit'
          }
        };

        toast.success('Direct Debit mandate created successfully');
        onSuccess?.(paymentResult);
        
        // Show confirmation that Direct Debit is set up
      } else {
        setError(result.error || 'Failed to set up Direct Debit');
        onError?.(result.error);
      }
    } catch (err: any) {
      console.error('Direct Debit setup error:', err);
      setError('Failed to set up Direct Debit. Please try again.');
      onError?.(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePayment = async () => {
    if (disabled || isLoading) return;

    switch (method) {
      case 'bank_transfer':
        await processTraditionalBankTransfer();
        break;
      case 'open_banking':
        await processOpenBankingPayment();
        break;
      case 'bacs_direct_debit':
        await processDirectDebitSetup();
        break;
    }
  };

  const getMethodTitle = () => {
    switch (method) {
      case 'bank_transfer': return 'UK Bank Transfer';
      case 'open_banking': return 'Pay by Bank (Open Banking)';
      case 'bacs_direct_debit': return 'BACS Direct Debit';
      default: return 'Bank Payment';
    }
  };

  const getMethodDescription = () => {
    switch (method) {
      case 'bank_transfer':
        return 'Transfer money directly from your bank account using your online banking or mobile app';
      case 'open_banking':
        return 'Pay directly from your bank account with instant confirmation via Open Banking';
      case 'bacs_direct_debit':
        return 'Set up a Direct Debit for secure, automatic payments with the Direct Debit Guarantee';
      default:
        return '';
    }
  };

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

      <div className="text-center space-y-2">
        <h3 className="text-lg font-semibold text-gray-900">{getMethodTitle()}</h3>
        <p className="text-sm text-gray-600">{getMethodDescription()}</p>
        <p className="font-medium text-gray-900">
          Amount: £{(amount / 100).toFixed(2)}
        </p>
      </div>

      {/* Open Banking provider selection */}
      {method === 'open_banking' && (
        <div className="space-y-4">
          <h4 className="font-medium text-gray-900">Select your bank</h4>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {OPEN_BANKING_PROVIDERS.filter(p => p.supported).map((provider) => (
              <button
                key={provider.id}
                type="button"
                onClick={() => setSelectedProvider(provider.id)}
                disabled={disabled || isLoading}
                className={cn(
                  'p-3 border rounded-lg text-left transition-all',
                  'hover:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-500',
                  {
                    'border-blue-500 bg-blue-50': selectedProvider === provider.id,
                    'border-gray-200': selectedProvider !== provider.id,
                    'opacity-50 cursor-not-allowed': disabled || isLoading
                  }
                )}
              >
                <div className="flex items-center gap-3">
                  <span className="text-xl">{provider.icon}</span>
                  <span className="font-medium text-sm">{provider.name}</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Bank account details form (for traditional bank transfer and Direct Debit) */}
      {(method === 'bank_transfer' || method === 'bacs_direct_debit') && (
        <div className="space-y-4">
          <h4 className="font-medium text-gray-900">Bank Account Details</h4>
          
          <div className="grid gap-4">
            <div>
              <label htmlFor="account-holder-name" className="block text-sm font-medium text-gray-700 mb-1">
                Account Holder Name *
              </label>
              <Input
                id="account-holder-name"
                type="text"
                value={bankAccount.accountHolderName}
                onChange={(e) => handleBankAccountChange('accountHolderName', e.target.value)}
                placeholder="John Smith"
                disabled={disabled || isLoading}
                className="w-full"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="sort-code" className="block text-sm font-medium text-gray-700 mb-1">
                  Sort Code *
                </label>
                <Input
                  id="sort-code"
                  type="text"
                  value={bankAccount.sortCode}
                  onChange={(e) => handleBankAccountChange('sortCode', e.target.value)}
                  placeholder="12-34-56"
                  maxLength={8}
                  disabled={disabled || isLoading}
                  className="w-full"
                />
              </div>

              <div>
                <label htmlFor="account-number" className="block text-sm font-medium text-gray-700 mb-1">
                  Account Number *
                </label>
                <Input
                  id="account-number"
                  type="text"
                  value={bankAccount.accountNumber}
                  onChange={(e) => handleBankAccountChange('accountNumber', e.target.value)}
                  placeholder="12345678"
                  maxLength={8}
                  disabled={disabled || isLoading}
                  className="w-full"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Payment instructions (shown after traditional bank transfer setup) */}
      {paymentInstructions && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-medium text-blue-900 mb-3">Payment Instructions</h4>
          <div className="text-sm text-blue-800 space-y-2">
            <p>Please transfer the amount to the following account:</p>
            <div className="bg-white p-3 rounded border">
              <p><strong>Account Name:</strong> The Backroom Leeds Ltd</p>
              <p><strong>Sort Code:</strong> 12-34-56</p>
              <p><strong>Account Number:</strong> 87654321</p>
              <p><strong>Reference:</strong> {bookingRef}</p>
              <p><strong>Amount:</strong> £{(amount / 100).toFixed(2)}</p>
            </div>
            <p className="text-xs">
              Please use the reference number exactly as shown. Your booking will be confirmed once payment is received.
            </p>
          </div>
        </div>
      )}

      {/* Direct Debit mandate confirmation */}
      {mandateId && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <h4 className="font-medium text-green-900 mb-3">Direct Debit Set Up</h4>
          <div className="text-sm text-green-800 space-y-2">
            <p>Your Direct Debit mandate has been created successfully.</p>
            <p><strong>Mandate ID:</strong> {mandateId}</p>
            <p><strong>Amount:</strong> £{(amount / 100).toFixed(2)} will be collected in 3-5 business days</p>
            <div className="bg-white p-3 rounded border text-xs">
              <p className="font-medium mb-1">Direct Debit Guarantee</p>
              <p>
                This Guarantee is offered by all banks and building societies that accept instructions to pay 
                Direct Debits. If there are any changes to the amount, date or frequency of your Direct Debit 
                The Backroom Leeds will notify you 10 working days in advance of your account being debited.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Processing information */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <div className="text-gray-600 text-lg">ℹ️</div>
          <div className="text-sm text-gray-700">
            <p className="font-medium mb-1">Processing Time</p>
            {method === 'open_banking' && (
              <p>Open Banking payments are processed instantly with immediate confirmation.</p>
            )}
            {method === 'bank_transfer' && (
              <p>Bank transfers typically take 1-3 business days to process. We'll email you once received.</p>
            )}
            {method === 'bacs_direct_debit' && (
              <p>Direct Debit payments take 3-5 business days to process. Lower fees apply.</p>
            )}
          </div>
        </div>
      </div>

      {/* Payment button */}
      <div className="text-center">
        <Button
          onClick={handlePayment}
          disabled={disabled || isLoading}
          className={cn(
            'w-full py-4 text-lg font-semibold transition-all',
            'bg-blue-600 text-white hover:bg-blue-700',
            {
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
              🏦
              {method === 'open_banking' && 'Continue to Your Bank'}
              {method === 'bank_transfer' && 'Get Payment Instructions'}
              {method === 'bacs_direct_debit' && 'Set Up Direct Debit'}
            </span>
          )}
        </Button>
      </div>

      {/* Security and compliance information */}
      <div className="text-xs text-gray-500 text-center space-y-1">
        {method === 'open_banking' && (
          <p>Open Banking is regulated by the FCA. Your bank details are never shared with us.</p>
        )}
        {method === 'bacs_direct_debit' && (
          <p>Protected by the Direct Debit Guarantee. Cancel anytime.</p>
        )}
        <p>All payments are secured with bank-level encryption.</p>
      </div>
    </div>
  );
}