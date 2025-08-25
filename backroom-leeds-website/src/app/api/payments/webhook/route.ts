import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { headers } from 'next/headers';

import { verifyWebhookSignature } from '@/lib/payments/stripe';
import { requireValidEnvironment } from '@/lib/utils/environment';
import type { Database } from '@/types/database.types';

// Stripe webhook types
interface StripeEvent {
  id: string;
  type: string;
  data: {
    object: StripePaymentIntent | StripeCharge | Record<string, unknown>;
  };
}

interface StripePaymentIntent {
  id: string;
  amount: number;
  metadata: {
    booking_id?: string;
    [key: string]: string | undefined;
  };
  last_payment_error?: {
    message?: string;
  };
}

interface StripeCharge {
  id: string;
  payment_intent?: string;
}

type SupabaseClient = ReturnType<typeof createRouteHandlerClient<Database>>;

// Webhook event tracking for deduplication
const processedEvents = new Map<string, { timestamp: number; status: string }>();
const EVENT_CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

function isEventProcessed(eventId: string): boolean {
  const cached = processedEvents.get(eventId);
  if (!cached) return false;
  
  // Clean up old entries
  if (Date.now() - cached.timestamp > EVENT_CACHE_DURATION) {
    processedEvents.delete(eventId);
    return false;
  }
  
  return cached.status === 'processed';
}

function markEventProcessed(eventId: string): void {
  processedEvents.set(eventId, {
    timestamp: Date.now(),
    status: 'processed'
  });
}

function logWebhookError(eventId: string, error: unknown, context: string): void {
  const errorMessage = error instanceof Error ? error.message : String(error);
  const errorStack = error instanceof Error ? error.stack : undefined;
  console.error(`Webhook error [${eventId}] in ${context}:`, {
    error: errorMessage,
    stack: errorStack,
    timestamp: new Date().toISOString(),
    context
  });
}

// POST: Handle Stripe webhooks
export async function POST(request: NextRequest) {
  const startTime = Date.now();
  let eventId = 'unknown';
  
  try {
    // Validate environment
    requireValidEnvironment(['stripe', 'supabase']);

    const body = await request.text();
    const signature = headers().get('stripe-signature');

    if (!signature) {
      console.error('Missing stripe-signature header');
      return NextResponse.json(
        { error: 'Missing signature' },
        { status: 400 }
      );
    }

    // Verify webhook signature
    const event = verifyWebhookSignature(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );

    if (!event) {
      console.error('Invalid webhook signature verification failed');
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 401 }
      );
    }

    eventId = event.id;

    // Check for duplicate event processing
    if (isEventProcessed(eventId)) {
      console.log(`Duplicate webhook event ignored: ${eventId}`);
      return NextResponse.json({ 
        received: true, 
        message: 'Event already processed' 
      });
    }

    console.log(`Processing Stripe webhook [${eventId}]: ${event.type}`);

    // Process the webhook event with timeout and retry logic
    const processingStartTime = Date.now();
    const PROCESSING_TIMEOUT = 25000; // 25 seconds (Stripe timeout is 30s)
    
    const processingPromise = handleWebhookEvent(event);
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Webhook processing timeout')), PROCESSING_TIMEOUT)
    );

    await Promise.race([processingPromise, timeoutPromise]);
    
    const processingDuration = Date.now() - processingStartTime;
    
    // Mark event as processed
    markEventProcessed(eventId);
    
    console.log(`Webhook [${eventId}] processed successfully in ${processingDuration}ms`);
    
    return NextResponse.json({ 
      received: true,
      eventId,
      eventType: event.type,
      processingTime: Date.now() - startTime
    });

  } catch (error: unknown) {
    const processingDuration = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    logWebhookError(eventId, error, 'main_handler');
    
    // Handle different error types with appropriate responses
    if (errorMessage?.includes('Environment validation failed')) {
      return NextResponse.json(
        { error: 'Service configuration error' },
        { status: 503 }
      );
    }
    
    if (errorMessage?.includes('timeout')) {
      // For timeout errors, don't mark as processed to allow retry
      console.error(`Webhook [${eventId}] timed out after ${processingDuration}ms`);
      return NextResponse.json(
        { error: 'Processing timeout' },
        { status: 408 }
      );
    }
    
    // For other errors, return 500 to trigger Stripe retry
    return NextResponse.json(
      { 
        error: 'Webhook processing failed',
        eventId,
        message: 'Internal server error - event will be retried'
      },
      { status: 500 }
    );
  }
}

async function handleWebhookEvent(event: StripeEvent) {
  const supabase = createRouteHandlerClient<Database>({ cookies });
  const eventId = event.id;
  const eventType = event.type;

  try {
    switch (eventType) {
      case 'payment_intent.succeeded':
        await handlePaymentSucceeded(event.data.object, supabase, eventId);
        break;

      case 'payment_intent.payment_failed':
        await handlePaymentFailed(event.data.object, supabase, eventId);
        break;

      case 'payment_intent.requires_action':
        await handlePaymentRequiresAction(event.data.object, supabase, eventId);
        break;

      case 'payment_intent.processing':
        await handlePaymentProcessing(event.data.object, supabase, eventId);
        break;

      case 'charge.dispute.created':
        await handleChargeDispute(event.data.object, supabase, eventId);
        break;

      case 'payment_intent.canceled':
        await handlePaymentCanceled(event.data.object, supabase, eventId);
        break;

      default:
        console.log(`Unhandled event type: ${eventType} [${eventId}]`);
        // Log unhandled events for monitoring
        await createWebhookEventLog(supabase, eventId, eventType, 'unhandled', null, { 
          message: 'Event type not implemented' 
        });
    }

    // Log successful processing
    await createWebhookEventLog(supabase, eventId, eventType, 'processed', event.data.object, null);
    
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : undefined;
    
    logWebhookError(eventId, error, `event_handler_${eventType}`);
    
    // Log failed processing
    await createWebhookEventLog(supabase, eventId, eventType, 'failed', event.data.object, {
      error: errorMessage,
      stack: errorStack
    });
    
    throw error; // Re-throw to trigger retry at main handler level
  }
}

async function handlePaymentSucceeded(paymentIntent: StripePaymentIntent, supabase: SupabaseClient, eventId: string) {
  const bookingId = paymentIntent.metadata.booking_id;

  if (!bookingId) {
    throw new Error(`No booking ID in payment intent metadata for event ${eventId}`);
  }

  console.log(`Processing successful payment for booking ${bookingId} [${eventId}]`);

  try {
    // Update booking status to confirmed
    const { data: updatedBooking, error: bookingError } = await supabase
      .from('bookings')
      .update({
        status: 'confirmed',
        confirmed_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', bookingId)
      .select(`
        id,
        booking_ref,
        customer_name,
        customer_email,
        booking_date,
        arrival_time,
        table_ids,
        drinks_package
      `)
      .single();

    if (bookingError) {
      console.error('Failed to update booking status:', bookingError);
      await flagForManualReview(
        bookingId, 
        'payment_success_booking_update_failed',
        paymentIntent.id,
        supabase
      );
      return;
    }

    // Create confirmation email notification
    if (updatedBooking.customer_email) {
      await createEmailNotification(
        supabase,
        bookingId,
        'booking_confirmation',
        updatedBooking.customer_email,
        `Booking Confirmation - ${updatedBooking.booking_ref}`,
        {
          booking_ref: updatedBooking.booking_ref,
          customer_name: updatedBooking.customer_name,
          event_date: updatedBooking.booking_date,
          arrival_time: updatedBooking.arrival_time,
          table_numbers: updatedBooking.table_ids,
          package_name: updatedBooking.drinks_package?.name,
          payment_amount: paymentIntent.amount / 100,
          confirmation_url: `${process.env.NEXT_PUBLIC_SITE_URL}/book/confirmation/${updatedBooking.booking_ref}`
        }
      );
    }

    // Create audit log
    await createAuditLog(
      supabase,
      'bookings',
      'PAYMENT_SUCCESS',
      bookingId,
      { status: 'pending' },
      { 
        status: 'confirmed',
        payment_intent_id: paymentIntent.id,
        payment_amount: paymentIntent.amount
      }
    );

    console.log(`Booking ${bookingId} confirmed after successful payment`);

  } catch (error) {
    console.error(`Failed to process successful payment for booking ${bookingId}:`, error);
    await flagForManualReview(
      bookingId, 
      'payment_success_processing_failed',
      paymentIntent.id,
      supabase
    );
  }
}

async function handlePaymentFailed(paymentIntent: StripePaymentIntent, supabase: SupabaseClient, eventId: string) {
  const bookingId = paymentIntent.metadata.booking_id;

  if (!bookingId) {
    throw new Error(`No booking ID in payment intent metadata for failed payment [${eventId}]`);
  }

  console.log(`Processing failed payment for booking ${bookingId} [${eventId}]`);

  try {
    const failureReason = paymentIntent.last_payment_error?.message || 'Payment failed';

    // Update booking status to payment_failed
    const { data: updatedBooking, error: bookingError } = await supabase
      .from('bookings')
      .update({
        status: 'cancelled', // Cancel booking on payment failure
        cancelled_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', bookingId)
      .select('booking_ref, customer_email, customer_name, table_ids')
      .single();

    if (bookingError) {
      console.error('Failed to update booking after payment failure:', bookingError);
      return;
    }

    // Send payment failure notification email
    if (updatedBooking.customer_email) {
      await createEmailNotification(
        supabase,
        bookingId,
        'payment_failed',
        updatedBooking.customer_email,
        `Payment Failed - ${updatedBooking.booking_ref}`,
        {
          booking_ref: updatedBooking.booking_ref,
          customer_name: updatedBooking.customer_name,
          failure_reason: failureReason,
          retry_url: `${process.env.NEXT_PUBLIC_SITE_URL}/book/retry-payment/${updatedBooking.booking_ref}`
        }
      );
    }

    // Create audit log
    await createAuditLog(
      supabase,
      'bookings',
      'PAYMENT_FAILED',
      bookingId,
      { status: 'pending' },
      { 
        status: 'cancelled',
        failure_reason: failureReason,
        payment_intent_id: paymentIntent.id
      }
    );

    console.log(`Booking ${bookingId} cancelled after payment failure`);

  } catch (error) {
    console.error(`Failed to process payment failure for booking ${bookingId}:`, error);
    await flagForManualReview(
      bookingId,
      'payment_failure_processing_failed',
      paymentIntent.id,
      supabase
    );
  }
}

async function handlePaymentRequiresAction(paymentIntent: StripePaymentIntent, supabase: SupabaseClient, eventId: string) {
  const bookingId = paymentIntent.metadata.booking_id;

  if (!bookingId) {
    console.warn(`No booking ID in payment intent metadata for requires action [${eventId}]`);
    return;
  }

  console.log(`Payment requires action for booking ${bookingId} [${eventId}]`);

  try {
    // Update booking to indicate additional authentication required
    await supabase
      .from('bookings')
      .update({
        updated_at: new Date().toISOString()
      })
      .eq('id', bookingId);

    // Create audit log
    await createAuditLog(
      supabase,
      'bookings',
      'PAYMENT_REQUIRES_ACTION',
      bookingId,
      {},
      { 
        requires_action: true,
        payment_intent_id: paymentIntent.id
      }
    );

  } catch (error) {
    console.error(`Failed to process payment requires action for booking ${bookingId}:`, error);
  }
}

async function handlePaymentProcessing(paymentIntent: StripePaymentIntent, supabase: SupabaseClient, eventId: string) {
  const bookingId = paymentIntent.metadata.booking_id;

  if (!bookingId) {
    return;
  }

  console.log(`Payment processing for booking ${bookingId} [${eventId}]`);

  try {
    // Create audit log for processing state
    await createAuditLog(
      supabase,
      'bookings',
      'PAYMENT_PROCESSING',
      bookingId,
      {},
      { 
        processing: true,
        payment_intent_id: paymentIntent.id
      }
    );
  } catch (error) {
    console.error(`Failed to log payment processing for booking ${bookingId}:`, error);
  }
}

async function handleChargeDispute(charge: StripeCharge, supabase: SupabaseClient, eventId: string) {
  console.log(`Charge dispute created for charge ${charge.id} [${eventId}]`);

  try {
    // Find related booking through payment intent
    const paymentIntentId = charge.payment_intent;
    
    if (paymentIntentId) {
      const { data: booking } = await supabase
        .from('bookings')
        .select('id, booking_ref, customer_email')
        .eq('stripe_payment_intent_id', paymentIntentId)
        .single();

      if (booking) {
        // Flag for urgent manual review
        await flagForManualReview(
          booking.id,
          'charge_dispute_created',
          charge.id,
          supabase,
          'urgent'
        );

        console.log(`Booking ${booking.booking_ref} flagged for dispute review`);
      }
    }
  } catch (error) {
    console.error('Failed to process charge dispute:', error);
  }
}

// Helper functions
async function createEmailNotification(
  supabase: SupabaseClient,
  bookingId: string,
  type: string,
  recipientEmail: string,
  subject: string,
  templateData: Record<string, unknown>
) {
  try {
    await supabase
      .from('email_notifications')
      .insert({
        booking_id: bookingId,
        type,
        recipient_email: recipientEmail,
        subject,
        template_data: templateData,
        status: 'pending'
      });
  } catch (error) {
    console.error('Failed to create email notification:', error);
  }
}

async function createAuditLog(
  supabase: SupabaseClient,
  tableName: string,
  action: string,
  recordId: string,
  oldValues: Record<string, unknown>,
  newValues: Record<string, unknown>
) {
  try {
    await supabase
      .from('audit_log')
      .insert({
        table_name: tableName,
        action,
        record_id: recordId,
        old_values: oldValues,
        new_values: newValues
      });
  } catch (error) {
    console.error('Failed to create audit log:', error);
  }
}

async function flagForManualReview(
  bookingId: string,
  reason: string,
  paymentIntentId: string,
  supabase: SupabaseClient,
  priority: string = 'normal'
) {
  try {
    // Create manual review record (assuming we have such a table)
    await createAuditLog(
      supabase,
      'bookings',
      'FLAG_FOR_REVIEW',
      bookingId,
      {},
      {
        reason,
        payment_intent_id: paymentIntentId,
        priority,
        flagged_at: new Date().toISOString()
      }
    );

    console.log(`Booking ${bookingId} flagged for manual review: ${reason}`);
  } catch (error) {
    console.error('Failed to flag booking for manual review:', error);
  }
}

// New payment canceled handler
async function handlePaymentCanceled(paymentIntent: StripePaymentIntent, supabase: SupabaseClient, eventId: string) {
  const bookingId = paymentIntent.metadata.booking_id;

  if (!bookingId) {
    console.warn(`No booking ID in payment intent metadata for canceled payment [${eventId}]`);
    return;
  }

  console.log(`Processing canceled payment for booking ${bookingId} [${eventId}]`);

  try {
    // Update booking status to cancelled
    const { error: bookingError } = await supabase
      .from('bookings')
      .update({
        status: 'cancelled',
        cancelled_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', bookingId);

    if (bookingError) {
      throw new Error(`Failed to update booking after payment cancellation: ${bookingError.message}`);
    }

    // Create audit log
    await createAuditLog(
      supabase,
      'bookings',
      'PAYMENT_CANCELED',
      bookingId,
      { status: 'pending' },
      { 
        status: 'cancelled',
        payment_intent_id: paymentIntent.id,
        canceled_at: new Date().toISOString()
      }
    );

    console.log(`Booking ${bookingId} cancelled after payment cancellation [${eventId}]`);

  } catch (error: unknown) {
    logWebhookError(eventId, error, 'payment_canceled');
    throw error;
  }
}

// Webhook event logging for monitoring and debugging
async function createWebhookEventLog(
  supabase: SupabaseClient,
  eventId: string,
  eventType: string,
  status: 'processed' | 'failed' | 'unhandled',
  eventData: Record<string, unknown>,
  errorDetails?: Record<string, unknown>
) {
  try {
    // Create a webhook event log entry
    await createAuditLog(
      supabase,
      'webhook_events',
      'WEBHOOK_PROCESSED',
      eventId,
      {},
      {
        event_id: eventId,
        event_type: eventType,
        status,
        event_data: eventData,
        error_details: errorDetails,
        processed_at: new Date().toISOString()
      }
    );
  } catch (error) {
    // Don't throw here to avoid breaking webhook processing
    console.error('Failed to create webhook event log:', error);
  }
}