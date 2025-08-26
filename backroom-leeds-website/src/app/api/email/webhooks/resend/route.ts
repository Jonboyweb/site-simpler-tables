/**
 * Resend Webhook Handler
 * 
 * Processes webhook events from Resend email provider for delivery tracking.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getEmailDeliveryTracker } from '@/lib/email/tracking/DeliveryTracker';
import crypto from 'crypto';

// ============================================================================
// Types
// ============================================================================

interface ResendWebhookEvent {
  type: 'email.sent' | 'email.delivered' | 'email.delivery_delayed' | 'email.bounced' | 'email.complained' | 'email.opened' | 'email.clicked';
  created_at: string;
  data: {
    email_id: string;
    message_id?: string;
    from: string;
    to: string[];
    subject: string;
    created_at: string;
    sent_at?: string;
    delivered_at?: string;
    opened_at?: string;
    clicked_at?: string;
    bounce?: {
      type: 'hard' | 'soft';
      reason: string;
    };
    complaint?: {
      type: string;
      reason: string;
    };
    click?: {
      url: string;
      timestamp: string;
    };
    open?: {
      timestamp: string;
      user_agent?: string;
      ip?: string;
    };
  };
}

// ============================================================================
// Webhook Signature Verification
// ============================================================================

function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  try {
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(payload, 'utf8')
      .digest('hex');

    return crypto.timingSafeEqual(
      Buffer.from(signature, 'hex'),
      Buffer.from(expectedSignature, 'hex')
    );
  } catch (error) {
    console.error('Webhook signature verification error:', error);
    return false;
  }
}

// ============================================================================
// Event Processing
// ============================================================================

async function processResendEvent(event: ResendWebhookEvent): Promise<void> {
  const tracker = getEmailDeliveryTracker();
  const { type, data, created_at } = event;

  // Extract message ID (Resend uses email_id)
  const messageId = data.message_id || data.email_id;
  const recipient = Array.isArray(data.to) ? data.to[0] : data.to;

  // Get customer consent for tracking
  const consent = await tracker.getCustomerConsent(recipient);
  const trackingConsent = consent?.trackingConsent.openTracking || false;

  try {
    switch (type) {
      case 'email.sent':
        await tracker.trackDeliveryStatus({
          messageId,
          jobId: data.email_id, // Use email_id as job reference
          recipient,
          subject: data.subject,
          status: 'sent',
          provider: 'resend',
          sentAt: data.sent_at ? new Date(data.sent_at) : new Date(created_at),
          trackingConsent,
          consentTimestamp: consent?.consentTimestamp || new Date()
        });

        await tracker.recordTrackingEvent({
          messageId,
          eventType: 'sent',
          timestamp: data.sent_at ? new Date(data.sent_at) : new Date(created_at),
          consentGiven: trackingConsent
        });
        break;

      case 'email.delivered':
        await tracker.trackDeliveryStatus({
          messageId,
          jobId: data.email_id,
          recipient,
          subject: data.subject,
          status: 'delivered',
          provider: 'resend',
          sentAt: data.sent_at ? new Date(data.sent_at) : undefined,
          deliveredAt: data.delivered_at ? new Date(data.delivered_at) : new Date(created_at),
          trackingConsent,
          consentTimestamp: consent?.consentTimestamp || new Date()
        });

        await tracker.recordTrackingEvent({
          messageId,
          eventType: 'delivered',
          timestamp: data.delivered_at ? new Date(data.delivered_at) : new Date(created_at),
          consentGiven: trackingConsent
        });
        break;

      case 'email.bounced':
        await tracker.trackDeliveryStatus({
          messageId,
          jobId: data.email_id,
          recipient,
          subject: data.subject,
          status: 'bounced',
          provider: 'resend',
          sentAt: data.sent_at ? new Date(data.sent_at) : undefined,
          bouncedAt: new Date(created_at),
          bounceReason: data.bounce?.reason,
          trackingConsent,
          consentTimestamp: consent?.consentTimestamp || new Date()
        });

        await tracker.recordTrackingEvent({
          messageId,
          eventType: 'bounced',
          timestamp: new Date(created_at),
          data: {
            bounceType: data.bounce?.type,
            reason: data.bounce?.reason
          },
          consentGiven: true // Bounces are technical, not user-initiated
        });
        break;

      case 'email.complained':
        await tracker.trackDeliveryStatus({
          messageId,
          jobId: data.email_id,
          recipient,
          subject: data.subject,
          status: 'complained',
          provider: 'resend',
          sentAt: data.sent_at ? new Date(data.sent_at) : undefined,
          complainedAt: new Date(created_at),
          complaintReason: data.complaint?.reason,
          trackingConsent,
          consentTimestamp: consent?.consentTimestamp || new Date()
        });

        await tracker.recordTrackingEvent({
          messageId,
          eventType: 'complained',
          timestamp: new Date(created_at),
          data: {
            complaintType: data.complaint?.type,
            reason: data.complaint?.reason
          },
          consentGiven: true // Complaints are technical, not user-initiated
        });

        // Update unsubscribe status for complaints
        await tracker.updateUnsubscribeStatus(recipient, true, 'Spam complaint');
        break;

      case 'email.opened':
        // Only track opens with explicit consent
        if (trackingConsent && data.open) {
          await tracker.trackDeliveryStatus({
            messageId,
            jobId: data.email_id,
            recipient,
            subject: data.subject,
            status: 'opened',
            provider: 'resend',
            sentAt: data.sent_at ? new Date(data.sent_at) : undefined,
            openedAt: data.opened_at ? new Date(data.opened_at) : new Date(created_at),
            ipAddress: data.open.ip,
            userAgent: data.open.user_agent,
            trackingConsent: true,
            consentTimestamp: consent?.consentTimestamp || new Date()
          });

          await tracker.recordTrackingEvent({
            messageId,
            eventType: 'opened',
            timestamp: data.opened_at ? new Date(data.opened_at) : new Date(created_at),
            ipAddress: data.open.ip,
            userAgent: data.open.user_agent,
            consentGiven: true
          });
        }
        break;

      case 'email.clicked':
        // Only track clicks with explicit consent
        if (trackingConsent && data.click) {
          await tracker.trackDeliveryStatus({
            messageId,
            jobId: data.email_id,
            recipient,
            subject: data.subject,
            status: 'clicked',
            provider: 'resend',
            sentAt: data.sent_at ? new Date(data.sent_at) : undefined,
            clickedAt: new Date(data.click.timestamp),
            trackingConsent: true,
            consentTimestamp: consent?.consentTimestamp || new Date()
          });

          await tracker.recordTrackingEvent({
            messageId,
            eventType: 'clicked',
            timestamp: new Date(data.click.timestamp),
            data: {
              url: data.click.url
            },
            consentGiven: true
          });
        }
        break;

      default:
        console.warn(`Unknown Resend webhook event type: ${type}`);
    }

    console.log(`Processed Resend webhook event: ${type} for ${messageId}`);
  } catch (error) {
    console.error(`Failed to process Resend webhook event ${type}:`, error);
    throw error;
  }
}

// ============================================================================
// API Handler
// ============================================================================

export async function POST(request: NextRequest) {
  try {
    // Get webhook signature
    const signature = request.headers.get('resend-signature');
    if (!signature) {
      return NextResponse.json(
        { error: 'Missing webhook signature' },
        { status: 401 }
      );
    }

    // Get raw payload for signature verification
    const payload = await request.text();
    
    // Verify webhook signature
    const webhookSecret = process.env.RESEND_WEBHOOK_SECRET;
    if (!webhookSecret) {
      console.error('RESEND_WEBHOOK_SECRET environment variable not set');
      return NextResponse.json(
        { error: 'Webhook secret not configured' },
        { status: 500 }
      );
    }

    const isValidSignature = verifyWebhookSignature(payload, signature, webhookSecret);
    if (!isValidSignature) {
      console.error('Invalid Resend webhook signature');
      return NextResponse.json(
        { error: 'Invalid webhook signature' },
        { status: 401 }
      );
    }

    // Parse the event
    const event: ResendWebhookEvent = JSON.parse(payload);

    // Validate event structure
    if (!event.type || !event.data || !event.data.email_id) {
      return NextResponse.json(
        { error: 'Invalid webhook event structure' },
        { status: 400 }
      );
    }

    // Process the event
    await processResendEvent(event);

    // Return success response
    return NextResponse.json({
      success: true,
      eventType: event.type,
      messageId: event.data.message_id || event.data.email_id,
      processedAt: new Date().toISOString()
    });

  } catch (error) {
    console.error('Resend webhook processing error:', error);
    
    return NextResponse.json(
      {
        error: 'Webhook processing failed',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}

// ============================================================================
// GET handler for webhook verification (if needed)
// ============================================================================

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const challenge = searchParams.get('challenge');

  if (challenge) {
    // Echo back the challenge for webhook verification
    return NextResponse.json({ challenge });
  }

  return NextResponse.json({
    webhook: 'resend',
    status: 'active',
    supportedEvents: [
      'email.sent',
      'email.delivered', 
      'email.delivery_delayed',
      'email.bounced',
      'email.complained',
      'email.opened',
      'email.clicked'
    ]
  });
}