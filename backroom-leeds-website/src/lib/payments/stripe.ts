import Stripe from 'stripe';

// Server-side Stripe instance
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-06-20',
  typescript: true,
});

export default stripe;

// Client-side Stripe configuration
export const stripePublishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!;

// Payment intent creation options
export interface CreatePaymentIntentOptions {
  amount: number; // Amount in pence (£50 = 5000)
  currency?: 'gbp';
  metadata: {
    booking_id: string;
    customer_id?: string;
    event_date: string;
    table_ids: string;
    venue: string;
    customer_email: string;
    customer_name: string;
  };
  customerEmail: string;
  description?: string;
}

// Payment result interface
export interface PaymentResult {
  success: boolean;
  paymentIntent?: Stripe.PaymentIntent;
  error?: string;
  alternativeMethods?: string[];
  clientSecret?: string;
  requiresAction?: boolean;
}

// Enhanced error handling for different Stripe error types
export function handleStripeError(error: unknown): PaymentResult {
  console.error('Stripe error:', error);

  if (error instanceof Stripe.errors.StripeError) {
    switch (error.type) {
      case 'StripeCardError':
        // Card-specific errors
        const alternatives = getAlternativePaymentMethods(error.decline_code);
        return {
          success: false,
          error: error.message || 'Your card was declined',
          alternativeMethods: alternatives
        };

      case 'StripeRateLimitError':
        return {
          success: false,
          error: 'Too many requests. Please wait a moment and try again.'
        };

      case 'StripeInvalidRequestError':
        return {
          success: false,
          error: 'Invalid payment request. Please check your details and try again.'
        };

      case 'StripeAPIError':
        return {
          success: false,
          error: 'Payment processing temporarily unavailable. Please try again.'
        };

      case 'StripeConnectionError':
        return {
          success: false,
          error: 'Network error. Please check your connection and try again.'
        };

      case 'StripeAuthenticationError':
        return {
          success: false,
          error: 'Payment authentication failed. Please try again.'
        };

      default:
        return {
          success: false,
          error: 'Payment processing error. Please try again.'
        };
    }
  }

  return {
    success: false,
    error: error.message || 'An unexpected error occurred. Please try again.'
  };
}

// Suggest alternative payment methods based on decline reason
function getAlternativePaymentMethods(declineCode?: string): string[] {
  const alternatives: string[] = [];

  switch (declineCode) {
    case 'insufficient_funds':
      alternatives.push('Try a different card', 'Bank transfer', 'Contact your bank');
      break;
    case 'expired_card':
      alternatives.push('Update card expiry date', 'Try a different card');
      break;
    case 'incorrect_cvc':
      alternatives.push('Check your CVC code', 'Try a different card');
      break;
    case 'processing_error':
      alternatives.push('Try again in a moment', 'Try a different card');
      break;
    case 'lost_card':
    case 'stolen_card':
      alternatives.push('Contact your bank', 'Try a different card');
      break;
    default:
      alternatives.push('Try a different card', 'Contact your bank');
  }

  return alternatives;
}

// Create payment intent with UK-specific settings
export async function createPaymentIntent(options: CreatePaymentIntentOptions): Promise<PaymentResult> {
  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: options.amount,
      currency: options.currency || 'gbp',
      confirmation_method: 'manual',
      payment_method_types: ['card', 'bacs_debit'],
      payment_method_options: {
        card: {
          request_three_d_secure: 'automatic', // Required for SCA compliance
        },
        bacs_debit: {
          setup_future_usage: 'off_session'
        }
      },
      metadata: options.metadata,
      receipt_email: options.customerEmail,
      description: options.description || `Table booking deposit - The Backroom Leeds`
    });

    return {
      success: true,
      paymentIntent,
      clientSecret: paymentIntent.client_secret || undefined
    };

  } catch (error) {
    return handleStripeError(error);
  }
}

// Confirm payment intent
export async function confirmPaymentIntent(paymentIntentId: string): Promise<PaymentResult> {
  try {
    const paymentIntent = await stripe.paymentIntents.confirm(paymentIntentId);

    if (paymentIntent.status === 'succeeded') {
      return {
        success: true,
        paymentIntent
      };
    } else if (paymentIntent.status === 'requires_action') {
      return {
        success: false,
        error: 'Additional authentication required',
        clientSecret: paymentIntent.client_secret || undefined,
        requiresAction: true
      };
    } else if (paymentIntent.status === 'requires_payment_method') {
      return {
        success: false,
        error: 'Payment method failed. Please try a different payment method.'
      };
    }

    return {
      success: false,
      error: `Payment ${paymentIntent.status}. Please try again.`
    };

  } catch (error) {
    return handleStripeError(error);
  }
}

// Retrieve payment intent
export async function retrievePaymentIntent(paymentIntentId: string): Promise<PaymentResult> {
  try {
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    
    return {
      success: true,
      paymentIntent,
      clientSecret: paymentIntent.client_secret || undefined
    };

  } catch (error) {
    return handleStripeError(error);
  }
}

// Cancel payment intent
export async function cancelPaymentIntent(paymentIntentId: string): Promise<PaymentResult> {
  try {
    const paymentIntent = await stripe.paymentIntents.cancel(paymentIntentId);
    
    return {
      success: true,
      paymentIntent
    };

  } catch (error) {
    return handleStripeError(error);
  }
}

// Create refund for booking cancellation
export async function createRefund(
  paymentIntentId: string, 
  amount?: number,
  reason?: 'duplicate' | 'fraudulent' | 'requested_by_customer'
): Promise<PaymentResult> {
  try {
    const refund = await stripe.refunds.create({
      payment_intent: paymentIntentId,
      amount, // If not specified, refund the full amount
      reason: reason || 'requested_by_customer',
      metadata: {
        refund_reason: 'booking_cancellation',
        processed_at: new Date().toISOString()
      }
    });

    return {
      success: true,
      // Return refund data in similar format
      paymentIntent: {
        id: refund.id,
        amount: refund.amount,
        status: refund.status,
        created: refund.created
      } as Record<string, unknown>
    };

  } catch (error) {
    return handleStripeError(error);
  }
}

// Webhook signature verification
export function verifyWebhookSignature(
  body: string,
  signature: string,
  endpointSecret: string
): Stripe.Event | null {
  try {
    return stripe.webhooks.constructEvent(body, signature, endpointSecret);
  } catch (error) {
    console.error('Webhook signature verification failed:', error);
    return null;
  }
}