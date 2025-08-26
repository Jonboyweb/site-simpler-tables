/**
 * Email Delivery Status API Route
 * 
 * Provides real-time delivery status for email messages with GDPR compliance.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getEmailDeliveryTracker } from '@/lib/email/tracking/DeliveryTracker';
import { z } from 'zod';

// ============================================================================
// Request Validation Schemas
// ============================================================================

const GetDeliveryStatusSchema = z.object({
  messageId: z.string().min(1, 'Message ID is required')
});

const BatchDeliveryStatusSchema = z.object({
  messageIds: z.array(z.string()).min(1, 'At least one message ID is required').max(100, 'Maximum 100 message IDs allowed'),
  includeEvents: z.boolean().default(false)
});

// ============================================================================
// GET - Single Message Delivery Status
// ============================================================================

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const messageId = searchParams.get('messageId');
    const includeEvents = searchParams.get('includeEvents') === 'true';

    if (!messageId) {
      return NextResponse.json(
        { error: 'Message ID is required' },
        { status: 400 }
      );
    }

    const validatedData = GetDeliveryStatusSchema.parse({ messageId });
    const tracker = getEmailDeliveryTracker();

    // Get delivery status
    const deliveryStatus = await tracker.getDeliveryStatus(validatedData.messageId);

    if (!deliveryStatus) {
      return NextResponse.json(
        { 
          error: 'Delivery status not found',
          messageId: validatedData.messageId
        },
        { status: 404 }
      );
    }

    // Check if tracking consent was given
    if (!deliveryStatus.trackingConsent) {
      return NextResponse.json({
        messageId: validatedData.messageId,
        status: 'sent', // Only basic status without detailed tracking
        consentGiven: false,
        message: 'Detailed tracking not available - customer consent not provided'
      });
    }

    let trackingEvents = [];
    if (includeEvents) {
      trackingEvents = await tracker.getTrackingEvents(validatedData.messageId);
    }

    // Prepare response with GDPR-compliant data
    const response = {
      messageId: deliveryStatus.messageId,
      recipient: deliveryStatus.recipient,
      subject: deliveryStatus.subject,
      status: deliveryStatus.status,
      provider: deliveryStatus.provider,
      sentAt: deliveryStatus.sentAt,
      deliveredAt: deliveryStatus.deliveredAt,
      openedAt: deliveryStatus.openedAt,
      clickedAt: deliveryStatus.clickedAt,
      bouncedAt: deliveryStatus.bouncedAt,
      complainedAt: deliveryStatus.complainedAt,
      unsubscribedAt: deliveryStatus.unsubscribedAt,
      bounceReason: deliveryStatus.bounceReason,
      complaintReason: deliveryStatus.complaintReason,
      trackingConsent: deliveryStatus.trackingConsent,
      consentTimestamp: deliveryStatus.consentTimestamp,
      // Only include detailed tracking data if consent was given
      ...(deliveryStatus.trackingConsent && {
        ipAddress: deliveryStatus.ipAddress,
        userAgent: deliveryStatus.userAgent,
        location: deliveryStatus.location,
        device: deliveryStatus.device
      }),
      ...(includeEvents && { trackingEvents })
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Get delivery status error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          error: 'Invalid request parameters',
          details: error.errors
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}

// ============================================================================
// POST - Batch Delivery Status
// ============================================================================

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = BatchDeliveryStatusSchema.parse(body);

    const tracker = getEmailDeliveryTracker();
    const results = [];

    // Process each message ID
    for (const messageId of validatedData.messageIds) {
      try {
        const deliveryStatus = await tracker.getDeliveryStatus(messageId);
        
        if (!deliveryStatus) {
          results.push({
            messageId,
            status: 'not_found',
            error: 'Delivery status not found'
          });
          continue;
        }

        // Check tracking consent
        if (!deliveryStatus.trackingConsent) {
          results.push({
            messageId,
            status: 'sent',
            consentGiven: false,
            message: 'Limited data - no tracking consent'
          });
          continue;
        }

        let trackingEvents = [];
        if (validatedData.includeEvents) {
          trackingEvents = await tracker.getTrackingEvents(messageId);
        }

        // Add to results with GDPR-compliant data
        results.push({
          messageId: deliveryStatus.messageId,
          recipient: deliveryStatus.recipient,
          subject: deliveryStatus.subject,
          status: deliveryStatus.status,
          provider: deliveryStatus.provider,
          sentAt: deliveryStatus.sentAt,
          deliveredAt: deliveryStatus.deliveredAt,
          openedAt: deliveryStatus.openedAt,
          clickedAt: deliveryStatus.clickedAt,
          bouncedAt: deliveryStatus.bouncedAt,
          complainedAt: deliveryStatus.complainedAt,
          unsubscribedAt: deliveryStatus.unsubscribedAt,
          bounceReason: deliveryStatus.bounceReason,
          complaintReason: deliveryStatus.complaintReason,
          trackingConsent: deliveryStatus.trackingConsent,
          consentTimestamp: deliveryStatus.consentTimestamp,
          // Only include detailed tracking data if consent was given
          ...(deliveryStatus.trackingConsent && {
            ipAddress: deliveryStatus.ipAddress,
            userAgent: deliveryStatus.userAgent,
            location: deliveryStatus.location,
            device: deliveryStatus.device
          }),
          ...(validatedData.includeEvents && { trackingEvents })
        });

      } catch (error) {
        console.error(`Error processing message ${messageId}:`, error);
        results.push({
          messageId,
          status: 'error',
          error: 'Failed to retrieve delivery status'
        });
      }
    }

    return NextResponse.json({
      results,
      totalRequested: validatedData.messageIds.length,
      totalProcessed: results.length,
      processedAt: new Date().toISOString()
    });

  } catch (error) {
    console.error('Batch delivery status error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          error: 'Invalid request data',
          details: error.errors
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}

// ============================================================================
// PUT - Update Delivery Status (for manual updates)
// ============================================================================

export async function PUT(request: NextRequest) {
  try {
    const UpdateDeliveryStatusSchema = z.object({
      messageId: z.string().min(1),
      status: z.enum(['queued', 'sent', 'delivered', 'bounced', 'complained', 'opened', 'clicked', 'unsubscribed']),
      timestamp: z.string().datetime().optional(),
      reason: z.string().optional(),
      ipAddress: z.string().optional(),
      userAgent: z.string().optional(),
      location: z.object({
        country: z.string().optional(),
        region: z.string().optional(),
        city: z.string().optional()
      }).optional()
    });

    const body = await request.json();
    const validatedData = UpdateDeliveryStatusSchema.parse(body);

    const tracker = getEmailDeliveryTracker();

    // Get existing delivery status to check consent
    const existingStatus = await tracker.getDeliveryStatus(validatedData.messageId);
    if (!existingStatus) {
      return NextResponse.json(
        { error: 'Message not found' },
        { status: 404 }
      );
    }

    // Prepare update data
    const updateData: any = {
      messageId: validatedData.messageId,
      status: validatedData.status,
      trackingConsent: existingStatus.trackingConsent,
      consentTimestamp: existingStatus.consentTimestamp
    };

    const timestamp = validatedData.timestamp ? new Date(validatedData.timestamp) : new Date();

    // Set appropriate timestamp fields based on status
    switch (validatedData.status) {
      case 'sent':
        updateData.sentAt = timestamp;
        break;
      case 'delivered':
        updateData.deliveredAt = timestamp;
        break;
      case 'bounced':
        updateData.bouncedAt = timestamp;
        updateData.bounceReason = validatedData.reason;
        break;
      case 'complained':
        updateData.complainedAt = timestamp;
        updateData.complaintReason = validatedData.reason;
        break;
      case 'opened':
        if (existingStatus.trackingConsent) {
          updateData.openedAt = timestamp;
          updateData.ipAddress = validatedData.ipAddress;
          updateData.userAgent = validatedData.userAgent;
          updateData.location = validatedData.location;
        }
        break;
      case 'clicked':
        if (existingStatus.trackingConsent) {
          updateData.clickedAt = timestamp;
          updateData.ipAddress = validatedData.ipAddress;
          updateData.userAgent = validatedData.userAgent;
          updateData.location = validatedData.location;
        }
        break;
      case 'unsubscribed':
        updateData.unsubscribedAt = timestamp;
        break;
    }

    // Update delivery status
    await tracker.trackDeliveryStatus(updateData);

    // Record tracking event if consent given
    if (existingStatus.trackingConsent || ['bounced', 'complained'].includes(validatedData.status)) {
      await tracker.recordTrackingEvent({
        messageId: validatedData.messageId,
        eventType: validatedData.status as any,
        timestamp,
        ipAddress: validatedData.ipAddress,
        userAgent: validatedData.userAgent,
        location: validatedData.location,
        data: validatedData.reason ? { reason: validatedData.reason } : undefined,
        consentGiven: existingStatus.trackingConsent || ['bounced', 'complained'].includes(validatedData.status)
      });
    }

    return NextResponse.json({
      success: true,
      messageId: validatedData.messageId,
      status: validatedData.status,
      updatedAt: timestamp.toISOString()
    });

  } catch (error) {
    console.error('Update delivery status error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          error: 'Invalid request data',
          details: error.errors
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}