import { z } from 'zod';

// Payment method types
export type PaymentMethodType = 
  | 'card' 
  | 'apple_pay' 
  | 'google_pay' 
  | 'paypal'
  | 'klarna'
  | 'clearpay'
  | 'bank_transfer'
  | 'open_banking'
  | 'bacs_direct_debit';

// Payment timing options
export type PaymentTiming = 'immediate' | 'deposit_only' | 'full_payment' | 'scheduled';

// Enhanced payment method configuration
export interface PaymentMethod {
  id: PaymentMethodType;
  name: string;
  displayName: string;
  description: string;
  icon: string; // Icon identifier for UI
  fees?: {
    percentage?: number;
    fixed?: number; // in pence
    description?: string;
  };
  limits?: {
    min?: number; // in pence
    max?: number; // in pence
  };
  availability: {
    desktop: boolean;
    mobile: boolean;
    regions: string[]; // ISO country codes
    currencies: string[]; // ISO currency codes
  };
  requires3DS?: boolean;
  processingTime?: string; // e.g., "Instant", "1-3 business days"
  features: string[];
  order: number; // For UI ordering
}

// Available payment methods configuration
export const PAYMENT_METHODS: PaymentMethod[] = [
  {
    id: 'card',
    name: 'Card Payment',
    displayName: 'Debit/Credit Card',
    description: 'Pay securely with your debit or credit card',
    icon: 'credit-card',
    fees: {
      percentage: 2.9,
      fixed: 30,
      description: 'Standard card processing fee'
    },
    limits: {
      min: 100, // £1.00
      max: 10000000 // £100,000
    },
    availability: {
      desktop: true,
      mobile: true,
      regions: ['GB', 'IE', 'US', 'CA', 'AU'],
      currencies: ['GBP', 'EUR', 'USD']
    },
    requires3DS: true,
    processingTime: 'Instant',
    features: ['Instant confirmation', '3D Secure protection', 'Save for future use'],
    order: 1
  },
  {
    id: 'apple_pay',
    name: 'Apple Pay',
    displayName: 'Apple Pay',
    description: 'Pay quickly and securely with Apple Pay',
    icon: 'apple-pay',
    fees: {
      percentage: 2.9,
      fixed: 30,
      description: 'Same as card payment'
    },
    availability: {
      desktop: false,
      mobile: true,
      regions: ['GB', 'IE', 'US', 'CA', 'AU'],
      currencies: ['GBP', 'EUR', 'USD']
    },
    processingTime: 'Instant',
    features: ['Touch/Face ID authentication', 'No card details needed', 'Ultra-fast checkout'],
    order: 2
  },
  {
    id: 'google_pay',
    name: 'Google Pay',
    displayName: 'Google Pay',
    description: 'Pay quickly with your Google account',
    icon: 'google-pay',
    fees: {
      percentage: 2.9,
      fixed: 30,
      description: 'Same as card payment'
    },
    availability: {
      desktop: true,
      mobile: true,
      regions: ['GB', 'IE', 'US', 'CA', 'AU'],
      currencies: ['GBP', 'EUR', 'USD']
    },
    processingTime: 'Instant',
    features: ['Fingerprint authentication', 'Secure and fast', 'No card details needed'],
    order: 3
  },
  {
    id: 'paypal',
    name: 'PayPal',
    displayName: 'PayPal',
    description: 'Pay with your PayPal account',
    icon: 'paypal',
    fees: {
      percentage: 3.4,
      fixed: 30,
      description: 'PayPal processing fee'
    },
    availability: {
      desktop: true,
      mobile: true,
      regions: ['GB', 'IE', 'US', 'CA', 'AU', 'DE', 'FR', 'ES', 'IT'],
      currencies: ['GBP', 'EUR', 'USD']
    },
    processingTime: 'Instant',
    features: ['PayPal Buyer Protection', 'Pay with PayPal balance', 'No card details shared'],
    order: 4
  },
  {
    id: 'klarna',
    name: 'Klarna',
    displayName: 'Klarna - Pay in 3',
    description: 'Split your payment into 3 interest-free instalments',
    icon: 'klarna',
    fees: {
      description: 'No fees for customers'
    },
    limits: {
      min: 3500, // £35.00
      max: 100000 // £1,000
    },
    availability: {
      desktop: true,
      mobile: true,
      regions: ['GB', 'DE', 'AT', 'NL', 'BE', 'DK', 'FI', 'NO', 'SE'],
      currencies: ['GBP', 'EUR']
    },
    processingTime: 'Instant',
    features: ['No interest charges', 'Spread over 3 payments', 'No impact on credit score'],
    order: 5
  },
  {
    id: 'clearpay',
    name: 'Clearpay',
    displayName: 'Clearpay - Buy now, pay later',
    description: 'Pay in 4 interest-free instalments every 2 weeks',
    icon: 'clearpay',
    fees: {
      description: 'No fees for customers'
    },
    limits: {
      min: 100, // £1.00
      max: 200000 // £2,000
    },
    availability: {
      desktop: true,
      mobile: true,
      regions: ['GB', 'AU', 'NZ'],
      currencies: ['GBP', 'AUD', 'NZD']
    },
    processingTime: 'Instant',
    features: ['No interest or hidden fees', '4 equal payments', 'Automatic payments'],
    order: 6
  },
  {
    id: 'bank_transfer',
    name: 'Bank Transfer',
    displayName: 'UK Bank Transfer',
    description: 'Pay directly from your UK bank account',
    icon: 'bank',
    fees: {
      description: 'No fees'
    },
    availability: {
      desktop: true,
      mobile: true,
      regions: ['GB'],
      currencies: ['GBP']
    },
    processingTime: 'Instant with Open Banking',
    features: ['No card needed', 'Bank-level security', 'Instant verification'],
    order: 7
  },
  {
    id: 'open_banking',
    name: 'Open Banking',
    displayName: 'Pay by Bank',
    description: 'Secure instant bank payment via Open Banking',
    icon: 'open-banking',
    fees: {
      description: 'Lower fees than cards'
    },
    availability: {
      desktop: true,
      mobile: true,
      regions: ['GB'],
      currencies: ['GBP']
    },
    processingTime: 'Instant',
    features: ['FCA regulated', 'Instant confirmation', 'Bank-level security'],
    order: 8
  },
  {
    id: 'bacs_direct_debit',
    name: 'Direct Debit',
    displayName: 'BACS Direct Debit',
    description: 'Set up a Direct Debit for recurring payments',
    icon: 'direct-debit',
    fees: {
      description: 'Lower processing fees'
    },
    availability: {
      desktop: true,
      mobile: true,
      regions: ['GB'],
      currencies: ['GBP']
    },
    processingTime: '3-5 business days',
    features: ['Lower fees', 'Direct Debit guarantee', 'Recurring payments'],
    order: 9
  }
];

// Payment options for different scenarios
export interface PaymentOption {
  method: PaymentMethodType;
  timing: PaymentTiming;
  amount: number; // in pence
  description: string;
  recommended?: boolean;
}

// Enhanced payment data schema
export const enhancedPaymentSchema = z.object({
  // Existing payment data
  termsAccepted: z.boolean().refine(val => val === true, "You must accept the terms and conditions"),
  marketingConsent: z.boolean().optional(),
  privacyPolicyAccepted: z.boolean().refine(val => val === true, "You must accept the privacy policy"),
  
  // New payment method fields
  paymentMethod: z.enum(['card', 'apple_pay', 'google_pay', 'paypal', 'klarna', 'clearpay', 'bank_transfer', 'open_banking', 'bacs_direct_debit']),
  paymentTiming: z.enum(['immediate', 'deposit_only', 'full_payment', 'scheduled']).default('deposit_only'),
  
  // Payment method specific options
  savePaymentMethod: z.boolean().optional(),
  allowFuturePayments: z.boolean().optional(),
  installmentPlan: z.object({
    enabled: z.boolean(),
    frequency: z.enum(['weekly', 'biweekly', 'monthly']).optional(),
    numberOfPayments: z.number().min(2).max(12).optional()
  }).optional(),
  
  // Bank transfer specific
  bankAccount: z.object({
    accountNumber: z.string().optional(),
    sortCode: z.string().optional(),
    accountHolderName: z.string().optional()
  }).optional(),
  
  // Corporate payment fields
  corporateBooking: z.boolean().optional(),
  purchaseOrderNumber: z.string().optional(),
  billingAddress: z.object({
    line1: z.string(),
    line2: z.string().optional(),
    city: z.string(),
    postcode: z.string(),
    country: z.string().default('GB')
  }).optional()
});

export type EnhancedPaymentData = z.infer<typeof enhancedPaymentSchema>;

// Payment processing states
export type PaymentState = 
  | 'idle'
  | 'selecting_method'
  | 'processing'
  | 'requires_action'
  | 'succeeded'
  | 'failed'
  | 'cancelled';

// Payment result interface
export interface PaymentResult {
  success: boolean;
  paymentIntent?: {
    id: string;
    status: string;
    clientSecret?: string;
    amount: number;
    currency: string;
    paymentMethod: PaymentMethodType;
  };
  error?: {
    code: string;
    message: string;
    type: 'card_error' | 'validation_error' | 'api_error' | 'authentication_error';
    alternativeMethods?: PaymentMethodType[];
  };
  requiresAction?: boolean;
  redirectUrl?: string; // For bank transfers, PayPal, etc.
  metadata?: Record<string, unknown>;
}

// Payment method availability checker
export interface PaymentMethodAvailabilityOptions {
  userAgent?: string;
  region: string;
  currency: string;
  amount: number;
  isRecurring?: boolean;
}

// Device detection for payment method availability
export interface DeviceCapabilities {
  hasApplePay: boolean;
  hasGooglePay: boolean;
  isMobile: boolean;
  isTablet: boolean;
  supportsWebAuthn: boolean;
  supportsBiometric: boolean;
}

// Payment analytics data
export interface PaymentAnalytics {
  method: PaymentMethodType;
  amount: number;
  currency: string;
  duration: number; // time to complete payment in ms
  attempts: number;
  success: boolean;
  errorCode?: string;
  userAgent: string;
  timestamp: number;
}

// Installment plan options
export interface InstallmentPlan {
  id: string;
  name: string;
  description: string;
  numberOfPayments: number;
  frequency: 'weekly' | 'biweekly' | 'monthly';
  interestRate: number;
  fees: number;
  eligibleMethods: PaymentMethodType[];
}

// Default installment plans
export const INSTALLMENT_PLANS: InstallmentPlan[] = [
  {
    id: 'klarna_pay_in_3',
    name: 'Pay in 3',
    description: 'Split into 3 interest-free payments',
    numberOfPayments: 3,
    frequency: 'monthly',
    interestRate: 0,
    fees: 0,
    eligibleMethods: ['klarna']
  },
  {
    id: 'clearpay_pay_in_4',
    name: 'Pay in 4',
    description: 'Split into 4 payments every 2 weeks',
    numberOfPayments: 4,
    frequency: 'biweekly',
    interestRate: 0,
    fees: 0,
    eligibleMethods: ['clearpay']
  }
];

// Utility functions for payment methods
export function getAvailablePaymentMethods(
  options: PaymentMethodAvailabilityOptions
): PaymentMethod[] {
  return PAYMENT_METHODS.filter(method => {
    // Check region availability
    if (!method.availability.regions.includes(options.region)) {
      return false;
    }

    // Check currency support
    if (!method.availability.currencies.includes(options.currency)) {
      return false;
    }

    // Check amount limits
    if (method.limits) {
      if (method.limits.min && options.amount < method.limits.min) {
        return false;
      }
      if (method.limits.max && options.amount > method.limits.max) {
        return false;
      }
    }

    // Device-specific availability
    const isMobile = options.userAgent?.includes('Mobile') || false;
    if (isMobile && !method.availability.mobile) {
      return false;
    }
    if (!isMobile && !method.availability.desktop) {
      return false;
    }

    return true;
  }).sort((a, b) => a.order - b.order);
}

export function getRecommendedPaymentMethod(
  availableMethods: PaymentMethod[],
  deviceCapabilities: DeviceCapabilities
): PaymentMethodType | null {
  // Prioritize digital wallets on mobile
  if (deviceCapabilities.isMobile) {
    if (deviceCapabilities.hasApplePay && availableMethods.find(m => m.id === 'apple_pay')) {
      return 'apple_pay';
    }
    if (deviceCapabilities.hasGooglePay && availableMethods.find(m => m.id === 'google_pay')) {
      return 'google_pay';
    }
  }

  // Fallback to card payment
  return availableMethods.find(m => m.id === 'card')?.id || null;
}

export function formatPaymentAmount(amount: number, currency: string = 'GBP'): string {
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2
  }).format(amount / 100);
}

export function getPaymentMethodFees(
  method: PaymentMethodType,
  amount: number
): { percentage: number; fixed: number; total: number } {
  const paymentMethod = PAYMENT_METHODS.find(m => m.id === method);
  
  if (!paymentMethod?.fees) {
    return { percentage: 0, fixed: 0, total: 0 };
  }

  const percentageFee = (paymentMethod.fees.percentage || 0) / 100 * amount;
  const fixedFee = paymentMethod.fees.fixed || 0;
  const total = percentageFee + fixedFee;

  return {
    percentage: percentageFee,
    fixed: fixedFee,
    total: Math.round(total)
  };
}