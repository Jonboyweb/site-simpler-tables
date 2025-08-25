/**
 * Payment monitoring and logging utilities
 * Provides comprehensive logging and monitoring for payment processing
 */

import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import type { Database } from '@/types/database.types';

// Payment event types for monitoring
export type PaymentEventType = 
  | 'PAYMENT_INTENT_CREATED'
  | 'PAYMENT_INTENT_SUCCEEDED'
  | 'PAYMENT_INTENT_FAILED'
  | 'PAYMENT_INTENT_CANCELED'
  | 'PAYMENT_REQUIRES_ACTION'
  | 'PAYMENT_PROCESSING'
  | 'CHARGE_DISPUTE'
  | 'REFUND_CREATED'
  | 'WEBHOOK_RECEIVED'
  | 'WEBHOOK_PROCESSED'
  | 'WEBHOOK_FAILED';

export type PaymentEventSeverity = 'info' | 'warning' | 'error' | 'critical';

export interface PaymentLogData {
  bookingId?: string;
  bookingRef?: string;
  customerId?: string;
  customerEmail?: string;
  paymentIntentId?: string;
  amount?: number;
  currency?: string;
  eventId?: string;
  errorCode?: string;
  errorMessage?: string;
  metadata?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
}

export interface PaymentMetrics {
  totalAttempts: number;
  successfulPayments: number;
  failedPayments: number;
  successRate: number;
  averageAmount: number;
  totalVolume: number;
  disputeCount: number;
  refundCount: number;
}

/**
 * Log payment events with structured data
 */
export async function logPaymentEvent(
  eventType: PaymentEventType,
  severity: PaymentEventSeverity,
  data: PaymentLogData,
  context?: string
) {
  const timestamp = new Date().toISOString();
  
  try {
    // Console logging with structured format
    const logLevel = severity === 'critical' ? 'error' : 
                    severity === 'error' ? 'error' :
                    severity === 'warning' ? 'warn' : 'log';

    const logMessage = `[PAYMENT] ${eventType} - ${severity.toUpperCase()}`;
    const logData = {
      timestamp,
      eventType,
      severity,
      context,
      ...data
    };

    console[logLevel](logMessage, logData);

    // Database logging (if available)
    if (process.env.NODE_ENV !== 'test') {
      try {
        const supabase = createRouteHandlerClient<Database>({ cookies });
        
        await supabase
          .from('payment_event_logs')
          .insert({
            event_type: eventType,
            severity,
            booking_id: data.bookingId,
            payment_intent_id: data.paymentIntentId,
            customer_email: data.customerEmail,
            amount: data.amount,
            currency: data.currency,
            error_code: data.errorCode,
            error_message: data.errorMessage,
            metadata: data.metadata || {},
            context,
            ip_address: data.ipAddress,
            user_agent: data.userAgent,
            created_at: timestamp
          });
      } catch (dbError) {
        // Don't throw - logging should not break payment processing
        console.error('Failed to save payment log to database:', dbError);
      }
    }

    // Critical events: additional alerting
    if (severity === 'critical') {
      await handleCriticalPaymentEvent(eventType, data, context);
    }

  } catch (error) {
    console.error('Payment logging failed:', error);
  }
}

/**
 * Handle critical payment events that need immediate attention
 */
async function handleCriticalPaymentEvent(
  eventType: PaymentEventType,
  data: PaymentLogData,
  context?: string
) {
  try {
    // Log critical event for manual review
    console.error(`🚨 CRITICAL PAYMENT EVENT: ${eventType}`, {
      bookingId: data.bookingId,
      paymentIntentId: data.paymentIntentId,
      customerEmail: data.customerEmail,
      errorMessage: data.errorMessage,
      context,
      timestamp: new Date().toISOString()
    });

    // In production, you could send alerts to Slack, email, or monitoring service
    if (process.env.NODE_ENV === 'production') {
      // Example: Send to monitoring service
      // await sendMonitoringAlert({
      //   level: 'critical',
      //   service: 'payments',
      //   event: eventType,
      //   data
      // });
    }

  } catch (error) {
    console.error('Failed to handle critical payment event:', error);
  }
}

/**
 * Log payment processing performance metrics
 */
export async function logPaymentPerformance(
  operation: string,
  duration: number,
  success: boolean,
  additionalData?: Record<string, any>
) {
  const performanceData = {
    operation,
    duration,
    success,
    timestamp: new Date().toISOString(),
    ...additionalData
  };

  console.log(`[PAYMENT_PERFORMANCE] ${operation}:`, performanceData);

  // Track slow operations
  if (duration > 5000) { // 5 seconds
    await logPaymentEvent(
      'PAYMENT_PROCESSING',
      'warning',
      {
        errorMessage: `Slow payment operation: ${operation} took ${duration}ms`,
        metadata: performanceData
      },
      'performance_monitoring'
    );
  }
}

/**
 * Generate payment metrics for monitoring dashboard
 */
export async function getPaymentMetrics(
  startDate: Date,
  endDate: Date
): Promise<PaymentMetrics> {
  try {
    const supabase = createRouteHandlerClient<Database>({ cookies });

    // Get payment attempts
    const { data: attempts, error: attemptsError } = await supabase
      .from('payment_event_logs')
      .select('event_type, amount, currency')
      .in('event_type', ['PAYMENT_INTENT_CREATED', 'PAYMENT_INTENT_SUCCEEDED', 'PAYMENT_INTENT_FAILED'])
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString());

    if (attemptsError) {
      throw new Error(`Failed to fetch payment attempts: ${attemptsError.message}`);
    }

    const totalAttempts = attempts?.length || 0;
    const successfulPayments = attempts?.filter(a => a.event_type === 'PAYMENT_INTENT_SUCCEEDED').length || 0;
    const failedPayments = attempts?.filter(a => a.event_type === 'PAYMENT_INTENT_FAILED').length || 0;
    const successRate = totalAttempts > 0 ? (successfulPayments / totalAttempts) * 100 : 0;

    const successfulAmounts = attempts
      ?.filter(a => a.event_type === 'PAYMENT_INTENT_SUCCEEDED' && a.amount)
      .map(a => a.amount!) || [];
    
    const totalVolume = successfulAmounts.reduce((sum, amount) => sum + amount, 0);
    const averageAmount = successfulAmounts.length > 0 ? totalVolume / successfulAmounts.length : 0;

    // Get dispute count
    const { data: disputes } = await supabase
      .from('payment_event_logs')
      .select('id')
      .eq('event_type', 'CHARGE_DISPUTE')
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString());

    // Get refund count
    const { data: refunds } = await supabase
      .from('payment_event_logs')
      .select('id')
      .eq('event_type', 'REFUND_CREATED')
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString());

    return {
      totalAttempts,
      successfulPayments,
      failedPayments,
      successRate,
      averageAmount,
      totalVolume,
      disputeCount: disputes?.length || 0,
      refundCount: refunds?.length || 0
    };

  } catch (error) {
    console.error('Failed to generate payment metrics:', error);
    return {
      totalAttempts: 0,
      successfulPayments: 0,
      failedPayments: 0,
      successRate: 0,
      averageAmount: 0,
      totalVolume: 0,
      disputeCount: 0,
      refundCount: 0
    };
  }
}

/**
 * Track payment errors for analysis
 */
export async function trackPaymentError(
  errorType: string,
  errorMessage: string,
  data: PaymentLogData,
  context?: string
) {
  await logPaymentEvent(
    'PAYMENT_INTENT_FAILED',
    'error',
    {
      ...data,
      errorCode: errorType,
      errorMessage
    },
    context
  );

  // Additional error categorization
  const errorCategories = {
    'card_declined': 'CARD_ISSUE',
    'insufficient_funds': 'CARD_ISSUE',
    'expired_card': 'CARD_ISSUE',
    'incorrect_cvc': 'CARD_ISSUE',
    'processing_error': 'SYSTEM_ERROR',
    'authentication_required': 'SCA_REQUIRED',
    'rate_limit_error': 'RATE_LIMIT',
    'api_connection_error': 'SYSTEM_ERROR',
    'api_error': 'SYSTEM_ERROR'
  };

  const category = errorCategories[errorType as keyof typeof errorCategories] || 'UNKNOWN';
  
  console.warn(`[PAYMENT_ERROR_CATEGORY] ${category}: ${errorType} - ${errorMessage}`, {
    category,
    errorType,
    errorMessage,
    bookingId: data.bookingId,
    paymentIntentId: data.paymentIntentId,
    context
  });
}

/**
 * Security monitoring for payment endpoints
 */
export async function trackSecurityEvent(
  eventType: 'RATE_LIMIT_EXCEEDED' | 'INVALID_SIGNATURE' | 'SUSPICIOUS_REQUEST' | 'UNAUTHORIZED_ACCESS',
  severity: PaymentEventSeverity,
  data: {
    ipAddress?: string;
    userAgent?: string;
    endpoint?: string;
    reason?: string;
    metadata?: Record<string, any>;
  }
) {
  await logPaymentEvent(
    'WEBHOOK_FAILED', // Reusing existing type for security events
    severity,
    {
      errorCode: eventType,
      errorMessage: data.reason || `Security event: ${eventType}`,
      ipAddress: data.ipAddress,
      userAgent: data.userAgent,
      metadata: {
        endpoint: data.endpoint,
        ...data.metadata
      }
    },
    'security_monitoring'
  );

  // Critical security events need immediate attention
  if (severity === 'critical') {
    console.error(`🔒 PAYMENT SECURITY ALERT: ${eventType}`, data);
  }
}

/**
 * Validate payment processing environment in production
 */
export async function validatePaymentSecurity(): Promise<{ secure: boolean; issues: string[] }> {
  const issues: string[] = [];

  try {
    // Check environment variables
    if (process.env.NODE_ENV === 'production') {
      if (process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY?.includes('pk_test_')) {
        issues.push('Using test Stripe publishable key in production');
      }
      
      if (process.env.STRIPE_SECRET_KEY?.includes('sk_test_')) {
        issues.push('Using test Stripe secret key in production');
      }

      if (process.env.NEXT_PUBLIC_ENABLE_MOCK_PAYMENTS === 'true') {
        issues.push('Mock payments enabled in production');
      }
    }

    // Check HTTPS requirement
    if (process.env.NEXT_PUBLIC_APP_URL?.startsWith('http://') && process.env.NODE_ENV === 'production') {
      issues.push('Production environment using HTTP instead of HTTPS');
    }

    return {
      secure: issues.length === 0,
      issues
    };

  } catch (error) {
    console.error('Security validation failed:', error);
    return {
      secure: false,
      issues: ['Security validation error']
    };
  }
}