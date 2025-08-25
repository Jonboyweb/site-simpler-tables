import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

import { createPaymentIntent, type CreatePaymentIntentOptions } from '@/lib/payments/stripe';
import { requireValidEnvironment } from '@/lib/utils/environment';
import type { Database } from '@/types/database.types';

// Rate limiting: Track payment requests per IP
const requestTracker = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 10; // Max 10 payment requests per hour per IP
const RATE_WINDOW = 60 * 60 * 1000; // 1 hour in milliseconds

function getRateLimitStatus(clientIP: string): { allowed: boolean; remaining: number; resetAt: number } {
  const now = Date.now();
  const tracker = requestTracker.get(clientIP);
  
  if (!tracker || now > tracker.resetAt) {
    // Reset or initialize tracker
    const resetAt = now + RATE_WINDOW;
    requestTracker.set(clientIP, { count: 1, resetAt });
    return { allowed: true, remaining: RATE_LIMIT - 1, resetAt };
  }
  
  if (tracker.count >= RATE_LIMIT) {
    return { allowed: false, remaining: 0, resetAt: tracker.resetAt };
  }
  
  tracker.count++;
  return { allowed: true, remaining: RATE_LIMIT - tracker.count, resetAt: tracker.resetAt };
}

function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const realIP = request.headers.get('x-real-ip');
  
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  
  if (realIP) {
    return realIP;
  }
  
  return 'unknown';
}

// POST: Create payment intent for table booking deposit
export async function POST(request: NextRequest) {
  try {
    // Validate environment configuration
    requireValidEnvironment(['stripe', 'supabase']);

    // Rate limiting
    const clientIP = getClientIP(request);
    const rateLimitStatus = getRateLimitStatus(clientIP);
    
    if (!rateLimitStatus.allowed) {
      console.warn(`Rate limit exceeded for IP: ${clientIP}`);
      return NextResponse.json(
        { 
          error: 'Rate limit exceeded',
          message: 'Too many payment requests. Please try again later.',
          retryAfter: Math.ceil((rateLimitStatus.resetAt - Date.now()) / 1000)
        },
        { 
          status: 429,
          headers: {
            'Retry-After': Math.ceil((rateLimitStatus.resetAt - Date.now()) / 1000).toString(),
            'X-RateLimit-Limit': RATE_LIMIT.toString(),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': rateLimitStatus.resetAt.toString()
          }
        }
      );
    }

    const body = await request.json();
    
    // Validate required fields for payment processing
    const requiredFields = ['bookingId', 'customerEmail', 'customerName'];
    const missingFields = requiredFields.filter(field => !body[field]);
    
    if (missingFields.length > 0) {
      return NextResponse.json(
        {
          error: 'Missing required fields',
          missingFields,
          message: 'Booking ID, customer email, and customer name are required'
        },
        { status: 400 }
      );
    }

    // Initialize Supabase client
    const supabase = createRouteHandlerClient<Database>({ cookies });

    // Verify booking exists and is in valid state for payment
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .select(`
        id,
        booking_ref,
        status,
        customer_email,
        customer_name,
        booking_date,
        table_ids,
        drinks_package,
        total_amount,
        deposit_amount,
        stripe_payment_intent_id
      `)
      .eq('id', body.bookingId)
      .single();

    if (bookingError || !booking) {
      console.error('Booking not found:', bookingError);
      return NextResponse.json(
        { error: 'Booking not found', message: 'The specified booking does not exist' },
        { status: 404 }
      );
    }

    // Check booking status - only allow payment for pending bookings
    if (booking.status !== 'pending') {
      return NextResponse.json(
        { 
          error: 'Invalid booking status',
          message: `Cannot process payment for booking with status: ${booking.status}`,
          currentStatus: booking.status
        },
        { status: 400 }
      );
    }

    // Check if payment intent already exists
    if (booking.stripe_payment_intent_id) {
      console.log(`Payment intent already exists for booking ${booking.id}: ${booking.stripe_payment_intent_id}`);
      return NextResponse.json(
        {
          error: 'Payment already initiated',
          message: 'A payment has already been started for this booking',
          existingPaymentIntentId: booking.stripe_payment_intent_id
        },
        { status: 400 }
      );
    }

    // Verify customer details match
    if (booking.customer_email !== body.customerEmail) {
      return NextResponse.json(
        { error: 'Customer mismatch', message: 'Customer email does not match booking' },
        { status: 400 }
      );
    }

    // Calculate deposit amount (£50 standard deposit)
    const depositAmount = booking.deposit_amount || 5000; // £50 in pence
    
    // Prepare payment intent metadata
    const metadata = {
      booking_id: booking.id,
      booking_ref: booking.booking_ref,
      customer_id: body.customerId || '',
      event_date: booking.booking_date,
      table_ids: Array.isArray(booking.table_ids) ? booking.table_ids.join(',') : booking.table_ids.toString(),
      venue: 'The Backroom Leeds',
      customer_email: booking.customer_email,
      customer_name: booking.customer_name,
      drinks_package: booking.drinks_package?.name || 'None'
    };

    // Create payment intent options
    const paymentIntentOptions: CreatePaymentIntentOptions = {
      amount: depositAmount,
      currency: 'gbp',
      metadata,
      customerEmail: booking.customer_email,
      description: `Table booking deposit - The Backroom Leeds - ${booking.booking_ref}`
    };

    console.log(`Creating payment intent for booking ${booking.booking_ref}, amount: £${depositAmount / 100}`);

    // Create payment intent with Stripe
    const paymentResult = await createPaymentIntent(paymentIntentOptions);

    if (!paymentResult.success || !paymentResult.paymentIntent) {
      console.error('Failed to create payment intent:', paymentResult.error);
      return NextResponse.json(
        {
          error: 'Payment processing error',
          message: paymentResult.error || 'Failed to initialize payment',
          alternativeMethods: paymentResult.alternativeMethods
        },
        { status: 500 }
      );
    }

    // Update booking with payment intent ID
    const { error: updateError } = await supabase
      .from('bookings')
      .update({
        stripe_payment_intent_id: paymentResult.paymentIntent.id,
        updated_at: new Date().toISOString()
      })
      .eq('id', booking.id);

    if (updateError) {
      console.error('Failed to update booking with payment intent ID:', updateError);
      // Note: Payment intent was created but booking not updated - needs manual reconciliation
    }

    // Log successful payment intent creation
    console.log(`Payment intent created successfully: ${paymentResult.paymentIntent.id} for booking ${booking.booking_ref}`);

    return NextResponse.json(
      {
        success: true,
        clientSecret: paymentResult.clientSecret,
        paymentIntentId: paymentResult.paymentIntent.id,
        amount: depositAmount,
        currency: 'gbp',
        bookingRef: booking.booking_ref
      },
      { 
        status: 200,
        headers: {
          'X-RateLimit-Limit': RATE_LIMIT.toString(),
          'X-RateLimit-Remaining': rateLimitStatus.remaining.toString(),
          'X-RateLimit-Reset': rateLimitStatus.resetAt.toString()
        }
      }
    );

  } catch (error: unknown) {
    console.error('Payment API error:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    // Handle environment validation errors
    if (errorMessage?.includes('Environment validation failed')) {
      return NextResponse.json(
        {
          error: 'Configuration error',
          message: 'Payment processing is not properly configured'
        },
        { status: 503 }
      );
    }
    
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: 'An unexpected error occurred while processing your request'
      },
      { status: 500 }
    );
  }
}

// GET: Retrieve payment intent status
export async function GET(request: NextRequest) {
  try {
    requireValidEnvironment(['stripe', 'supabase']);

    const { searchParams } = new URL(request.url);
    const paymentIntentId = searchParams.get('payment_intent_id');
    const bookingId = searchParams.get('booking_id');

    if (!paymentIntentId && !bookingId) {
      return NextResponse.json(
        { error: 'Missing parameter', message: 'Either payment_intent_id or booking_id is required' },
        { status: 400 }
      );
    }

    const supabase = createRouteHandlerClient<Database>({ cookies });

    let booking;
    if (bookingId) {
      const { data, error } = await supabase
        .from('bookings')
        .select('stripe_payment_intent_id, booking_ref, status')
        .eq('id', bookingId)
        .single();
      
      if (error || !data) {
        return NextResponse.json(
          { error: 'Booking not found' },
          { status: 404 }
        );
      }
      
      booking = data;
    }

    const intentId = paymentIntentId || booking?.stripe_payment_intent_id;
    
    if (!intentId) {
      return NextResponse.json(
        { error: 'No payment intent found for this booking' },
        { status: 404 }
      );
    }

    // Retrieve payment intent from Stripe
    const { retrievePaymentIntent } = await import('@/lib/payments/stripe');
    const result = await retrievePaymentIntent(intentId);

    if (!result.success) {
      return NextResponse.json(
        { error: 'Failed to retrieve payment status', message: result.error },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      paymentIntent: {
        id: result.paymentIntent!.id,
        status: result.paymentIntent!.status,
        amount: result.paymentIntent!.amount,
        currency: result.paymentIntent!.currency,
        clientSecret: result.clientSecret
      },
      bookingRef: booking?.booking_ref
    });

  } catch (error: unknown) {
    console.error('Payment status retrieval error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}