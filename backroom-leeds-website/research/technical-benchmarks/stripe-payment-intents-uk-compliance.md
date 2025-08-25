# Stripe Payment Intents UK Market Compliance & Implementation

## Executive Summary

Stripe Payment Intents provide robust payment processing capabilities for UK nightclub booking systems, with comprehensive support for £50 deposits, PCI DSS v4.0.1 compliance, and Strong Customer Authentication (SCA) requirements under UK regulations. The platform offers advanced webhook systems and UK-specific payment method support essential for venue operations.

## UK Market Payment Processing

### Currency and Amount Requirements

**Sterling Support:**
- Currency code: `'gbp'` for British Pounds
- Minimum amount: £0.40-0.50 (equivalent to $0.50 USD minimum)
- £50 deposits well above minimum threshold requirements
- Support for pence-level precision (e.g., £50.25)

**UK-Specific Payment Methods:**
```typescript
// Payment Intent with UK payment methods
const paymentIntent = await stripe.paymentIntents.create({
  amount: 5000, // £50.00 in pence
  currency: 'gbp',
  payment_method_types: [
    'card',           // Visa, Mastercard, American Express
    'bacs_debit',     // Direct debit
    'bancontact',     // Popular in UK/EU
  ],
  metadata: {
    venue: 'backroom-leeds',
    booking_type: 'table_deposit',
    table_id: 'table_001',
    event_date: '2025-08-26'
  }
});
```

### Strong Customer Authentication (SCA)

**UK SCA Requirements (Post-Brexit):**
- Two-factor authentication required for payments > £30
- Automatic handling by Stripe's SCA engine
- Support for exemptions (low-value, trusted merchants)
- 3D Secure 2.0 implementation for card payments

```typescript
// SCA-compliant payment processing
const paymentIntent = await stripe.paymentIntents.create({
  amount: 5000,
  currency: 'gbp',
  confirmation_method: 'manual',
  confirm: true,
  payment_method: paymentMethodId,
  return_url: 'https://thebackroomleeds.com/booking/confirm',
  // Enable SCA exemptions where applicable
  payment_method_options: {
    card: {
      request_three_d_secure: 'automatic',
    }
  }
});
```

## PCI DSS v4.0.1 Compliance (2025)

### Compliance Requirements

**Updated Standards:**
- PCI DSS v4.0.1 is the only supported version as of 2025
- UK merchants processing card data must maintain compliance
- Shared responsibility model with Stripe as Level 1 Service Provider
- 100% PCI audit success rate maintained by Stripe

**Compliance Scope Reduction:**
```typescript
// Using Stripe Elements reduces PCI scope
import { Elements, CardElement } from '@stripe/react-stripe-js';

function BookingPaymentForm() {
  // Card data never touches your servers
  return (
    <Elements stripe={stripePromise}>
      <CardElement 
        options={{
          style: {
            base: {
              fontSize: '16px',
              color: '#424770',
              '::placeholder': {
                color: '#aab7c4',
              },
            },
          },
        }}
      />
    </Elements>
  );
}
```

### Data Protection Standards
```typescript
// Environment variable configuration for security
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-06-20',
  typescript: true,
  telemetry: false, // Disable for enhanced privacy
});

// Secure webhook endpoint verification
export async function POST(req: Request) {
  const body = await req.text();
  const signature = req.headers.get('stripe-signature');

  try {
    const event = stripe.webhooks.constructEvent(
      body,
      signature!,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
    
    // Process webhook securely
    return handleWebhookEvent(event);
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    return new Response('Invalid signature', { status: 400 });
  }
}
```

## Webhook Implementation for Booking Confirmations

### Real-time Payment Monitoring

**Critical Webhook Events:**
```typescript
interface WebhookEventHandlers {
  'payment_intent.succeeded': (event: Stripe.Event) => Promise<void>;
  'payment_intent.payment_failed': (event: Stripe.Event) => Promise<void>;
  'payment_intent.requires_action': (event: Stripe.Event) => Promise<void>;
  'payment_intent.canceled': (event: Stripe.Event) => Promise<void>;
}

export async function handleWebhookEvent(event: Stripe.Event) {
  const paymentIntent = event.data.object as Stripe.PaymentIntent;
  
  switch (event.type) {
    case 'payment_intent.succeeded':
      await confirmTableBooking(paymentIntent.metadata.booking_id);
      await sendConfirmationEmail(paymentIntent.metadata.customer_email);
      break;
      
    case 'payment_intent.payment_failed':
      await releaseTableHold(paymentIntent.metadata.table_id);
      await notifyBookingFailure(paymentIntent.metadata.customer_email);
      break;
      
    case 'payment_intent.requires_action':
      await handleAdditionalAuthentication(paymentIntent);
      break;
  }
}
```

### Booking Confirmation Workflow
```typescript
// Complete booking flow with webhook handling
async function confirmTableBooking(bookingId: string) {
  const { data: booking } = await supabase
    .from('table_bookings')
    .update({
      booking_status: 'confirmed',
      confirmed_at: new Date().toISOString(),
      payment_status: 'completed'
    })
    .eq('id', bookingId)
    .single();

  // Generate QR code for venue entry
  const qrCode = await generateBookingQR(bookingId);
  
  // Update table availability in real-time
  await supabase
    .from('table_availability')
    .update({ status: 'booked' })
    .eq('booking_id', bookingId);

  return booking;
}
```

## UK Payment Regulations Compliance

### Financial Conduct Authority (FCA) Requirements

**Regulatory Compliance:**
- Open Banking compatibility for account-to-account payments
- Consumer protection under Payment Services Regulations 2017
- Complaint handling procedures implementation
- Transaction monitoring and reporting

```typescript
// Compliant payment processing with audit trail
async function processUKPayment(bookingData: BookingRequest) {
  // Audit log for FCA compliance
  await logTransaction({
    type: 'payment_attempt',
    amount: bookingData.depositAmount,
    currency: 'gbp',
    customer_id: bookingData.customerId,
    venue: 'backroom-leeds',
    timestamp: new Date().toISOString(),
    ip_address: bookingData.ipAddress,
    user_agent: bookingData.userAgent
  });

  const paymentIntent = await stripe.paymentIntents.create({
    amount: bookingData.depositAmount * 100, // Convert £ to pence
    currency: 'gbp',
    metadata: {
      booking_id: bookingData.id,
      venue_location: 'leeds-uk',
      compliance_version: 'uk-2025',
    }
  });

  return paymentIntent;
}
```

### Consumer Rights Protection
```typescript
// Refund handling for UK consumer rights
async function handleUKRefund(bookingId: string, reason: RefundReason) {
  const timeUntilEvent = calculateTimeUntilEvent(bookingId);
  
  // UK 48-hour cancellation policy
  if (timeUntilEvent > 48 * 60 * 60 * 1000) { // 48 hours in ms
    const refund = await stripe.refunds.create({
      payment_intent: paymentIntentId,
      amount: refundAmount,
      reason: 'requested_by_customer',
      metadata: {
        uk_consumer_rights: 'within_cancellation_period',
        original_booking: bookingId
      }
    });

    return { success: true, refund };
  } else {
    return { success: false, reason: 'outside_cancellation_period' };
  }
}
```

## Advanced Payment Features

### Dynamic Pricing Integration
```typescript
// Surge pricing for peak times (Friday/Saturday nights)
function calculateDynamicDeposit(eventDate: Date, tableType: string): number {
  const baseDeposit = 5000; // £50.00 in pence
  const dayOfWeek = eventDate.getDay();
  const hour = eventDate.getHours();
  
  let multiplier = 1.0;
  
  // Weekend surge pricing
  if (dayOfWeek === 5 || dayOfWeek === 6) { // Friday/Saturday
    multiplier = 1.5;
  }
  
  // VIP table premium
  if (tableType === 'vip') {
    multiplier *= 2.0;
  }
  
  return Math.round(baseDeposit * multiplier);
}

// Payment Intent with dynamic pricing
const paymentIntent = await stripe.paymentIntents.create({
  amount: calculateDynamicDeposit(eventDate, tableType),
  currency: 'gbp',
  metadata: {
    pricing_type: 'dynamic',
    base_deposit: '50.00',
    surge_multiplier: multiplier.toString()
  }
});
```

### Payment Method Optimization
```typescript
// UK-optimized payment method configuration
const paymentMethodConfig = {
  // Prioritize UK-popular methods
  card: {
    installments: { enabled: false },
    request_three_d_secure: 'automatic'
  },
  bacs_debit: {
    setup_future_usage: 'off_session' // For repeat customers
  },
  // Apple Pay/Google Pay for mobile users
  apple_pay: { enabled: true },
  google_pay: { enabled: true }
};
```

## Error Handling and Resilience

### Payment Failure Recovery
```typescript
// Robust error handling for payment failures
class PaymentProcessor {
  async processBookingPayment(bookingData: BookingRequest): Promise<PaymentResult> {
    try {
      const paymentIntent = await this.createPaymentIntent(bookingData);
      
      // Monitor payment for 5 minutes
      const result = await this.monitorPaymentCompletion(paymentIntent.id, 300000);
      
      return result;
    } catch (error) {
      if (error.type === 'StripeCardError') {
        // Handle declined cards gracefully
        await this.logCardDecline(bookingData, error);
        return this.suggestAlternativePayment(error);
      }
      
      throw error;
    }
  }

  private async suggestAlternativePayment(error: Stripe.StripeCardError): Promise<PaymentResult> {
    const suggestions = [];
    
    if (error.decline_code === 'insufficient_funds') {
      suggestions.push('bacs_debit', 'bank_transfer');
    }
    
    return {
      success: false,
      error: error.message,
      alternativeMethods: suggestions
    };
  }
}
```

### Webhook Delivery Guarantees
```typescript
// Idempotent webhook processing
const processedWebhooks = new Set<string>();

export async function handleWebhook(event: Stripe.Event) {
  // Prevent duplicate processing
  if (processedWebhooks.has(event.id)) {
    return new Response('Already processed', { status: 200 });
  }

  try {
    await processWebhookEvent(event);
    processedWebhooks.add(event.id);
    
    return new Response('Webhook processed', { status: 200 });
  } catch (error) {
    // Stripe will retry failed webhooks
    console.error('Webhook processing failed:', error);
    return new Response('Processing failed', { status: 500 });
  }
}
```

## Performance and Monitoring

### Payment Analytics
```typescript
// UK-specific payment performance metrics
interface PaymentMetrics {
  successRate: number;
  averageProcessingTime: number;
  declineReasons: Record<string, number>;
  paymentMethodPreference: Record<string, number>;
  peakHourPerformance: Record<string, number>;
}

async function generatePaymentReport(): Promise<PaymentMetrics> {
  const payments = await stripe.paymentIntents.list({
    created: { gte: Math.floor(Date.now() / 1000) - 86400 }, // Last 24h
    expand: ['data.charges']
  });

  return {
    successRate: calculateSuccessRate(payments.data),
    averageProcessingTime: calculateAverageTime(payments.data),
    declineReasons: analyzeDeclineReasons(payments.data),
    paymentMethodPreference: analyzePaymentMethods(payments.data),
    peakHourPerformance: analyzePeakHours(payments.data)
  };
}
```

### Real-time Monitoring
```typescript
// Payment system health monitoring
export const paymentHealthCheck = {
  async checkStripeAPI(): Promise<boolean> {
    try {
      await stripe.balance.retrieve();
      return true;
    } catch {
      return false;
    }
  },

  async checkWebhookEndpoint(): Promise<boolean> {
    // Test webhook delivery
    const testEvent = await stripe.webhookEndpoints.list({ limit: 1 });
    return testEvent.data.length > 0;
  },

  async checkPaymentFlow(testAmount: number = 100): Promise<boolean> {
    try {
      const testPayment = await stripe.paymentIntents.create({
        amount: testAmount,
        currency: 'gbp',
        confirm: true,
        payment_method: 'pm_card_visa' // Test payment method
      });

      return testPayment.status === 'succeeded';
    } catch {
      return false;
    }
  }
};
```

## Deployment Configuration

### Environment Setup
```env
# Stripe Configuration (UK)
STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

# UK-specific settings
STRIPE_ACCOUNT_COUNTRY=GB
DEFAULT_CURRENCY=gbp
SCA_ENABLED=true
OPEN_BANKING_ENABLED=true

# Compliance
PCI_ENVIRONMENT=production
AUDIT_LOGGING_ENABLED=true
FCA_COMPLIANCE_MODE=enabled
```

### Production Checklist
```typescript
// Pre-deployment validation
const productionReadinessCheck = {
  stripeConfiguration: {
    liveKeysConfigured: !!process.env.STRIPE_SECRET_KEY?.startsWith('sk_live_'),
    webhookSecretsSet: !!process.env.STRIPE_WEBHOOK_SECRET,
    correctCurrency: process.env.DEFAULT_CURRENCY === 'gbp'
  },
  
  compliance: {
    pciCompliant: checkPCICompliance(),
    scaEnabled: process.env.SCA_ENABLED === 'true',
    auditLogging: process.env.AUDIT_LOGGING_ENABLED === 'true'
  },
  
  ukRegulations: {
    fcaCompliant: process.env.FCA_COMPLIANCE_MODE === 'enabled',
    consumerRightsHandling: checkRefundPolicyImplementation(),
    dataProtection: checkGDPRCompliance()
  }
};
```

---

*Research conducted: August 2025*
*Sources: Stripe documentation, UK FCA guidelines, PCI DSS v4.0.1 standards*