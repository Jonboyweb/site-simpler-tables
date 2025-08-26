/**
 * The Backroom Leeds - Report Subscription API
 * Version: 1.0.0
 * Phase: 3, Step 3.5
 * 
 * API endpoints for managing report subscriptions
 */

import { NextRequest, NextResponse } from 'next/server';
import { getRecipientManager } from '@/lib/reporting/distribution/RecipientManager';
import { ReportFormat, DeliveryChannel, type SubscribeToReportRequest } from '@/types/reporting';

// ============================================================================
// POST: Subscribe to Report
// ============================================================================

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const {
      recipientEmail,
      templateId,
      deliveryFormat,
      deliveryChannels,
      customSchedule,
      filters
    } = body as SubscribeToReportRequest;

    // Validate required fields
    if (!recipientEmail || !recipientEmail.includes('@')) {
      return NextResponse.json(
        { error: 'Valid recipient email is required' },
        { status: 400 }
      );
    }

    if (!templateId) {
      return NextResponse.json(
        { error: 'Template ID is required' },
        { status: 400 }
      );
    }

    if (!deliveryFormat || !Object.values(ReportFormat).includes(deliveryFormat)) {
      return NextResponse.json(
        { error: 'Valid delivery format is required' },
        { status: 400 }
      );
    }

    if (!deliveryChannels || !Array.isArray(deliveryChannels) || deliveryChannels.length === 0) {
      return NextResponse.json(
        { error: 'At least one delivery channel is required' },
        { status: 400 }
      );
    }

    // Validate delivery channels
    const invalidChannels = deliveryChannels.filter(
      channel => !Object.values(DeliveryChannel).includes(channel)
    );
    if (invalidChannels.length > 0) {
      return NextResponse.json(
        { error: `Invalid delivery channels: ${invalidChannels.join(', ')}` },
        { status: 400 }
      );
    }

    // Validate template exists
    const { createClient } = await import('@/lib/supabase/server');
    const supabase = createClient();

    const { data: template, error: templateError } = await supabase
      .from('report_templates')
      .select('id, name, report_type, is_active')
      .eq('id', templateId)
      .single();

    if (templateError || !template) {
      return NextResponse.json(
        { error: 'Report template not found' },
        { status: 404 }
      );
    }

    if (!template.is_active) {
      return NextResponse.json(
        { error: 'Report template is not active' },
        { status: 400 }
      );
    }

    // Create subscription
    const manager = getRecipientManager();
    
    const subscriptionResponse = await manager.subscribeToReport({
      recipientEmail: recipientEmail.toLowerCase().trim(),
      templateId,
      deliveryFormat,
      deliveryChannels,
      customSchedule,
      filters
    });

    // Get additional info for response
    const subscription = await manager.getSubscription(subscriptionResponse.subscriptionId);

    return NextResponse.json({
      success: true,
      subscription: {
        id: subscriptionResponse.subscriptionId,
        status: subscriptionResponse.status,
        nextDeliveryAt: subscriptionResponse.nextDeliveryAt,
        template: {
          id: template.id,
          name: template.name,
          reportType: template.report_type
        },
        deliveryFormat,
        deliveryChannels,
        customSchedule
      },
      message: subscriptionResponse.status === 'pending_verification' 
        ? 'Subscription created. Please check your email to verify your address.'
        : 'Subscription created successfully.'
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating subscription:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const statusCode = errorMessage.includes('already exists') ? 409 : 500;
    
    return NextResponse.json(
      {
        error: 'Failed to create subscription',
        details: errorMessage
      },
      { status: statusCode }
    );
  }
}

// ============================================================================
// GET: List Subscriptions
// ============================================================================

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Parse filters
    const recipientId = searchParams.get('recipientId') || undefined;
    const templateId = searchParams.get('templateId') || undefined;
    const isActive = searchParams.get('active') ? searchParams.get('active') === 'true' : undefined;
    const recipientEmail = searchParams.get('email') || undefined;
    
    // Parse pagination
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = Math.min(parseInt(searchParams.get('pageSize') || '25'), 100);
    
    if (page < 1 || pageSize < 1) {
      return NextResponse.json(
        { error: 'Page and pageSize must be positive integers' },
        { status: 400 }
      );
    }

    const manager = getRecipientManager();
    
    // If filtering by email, get recipient ID first
    let actualRecipientId = recipientId;
    if (recipientEmail && !recipientId) {
      const recipient = await manager.getRecipientByEmail(recipientEmail.toLowerCase().trim());
      actualRecipientId = recipient?.id;
    }

    const result = await manager.listSubscriptions(
      { 
        recipientId: actualRecipientId, 
        templateId, 
        isActive 
      },
      { page, pageSize }
    );

    // Get subscription statistics
    const { createClient } = await import('@/lib/supabase/server');
    const supabase = createClient();

    const { data: stats } = await supabase
      .from('report_subscriptions')
      .select('is_active, delivery_format, delivery_channels')
      .then(result => {
        if (!result.data) return { data: null };
        
        const stats = result.data.reduce((acc: any, sub: any) => {
          acc.total++;
          if (sub.is_active) acc.active++;
          
          // Count by format
          if (sub.delivery_format) {
            acc.byFormat[sub.delivery_format] = (acc.byFormat[sub.delivery_format] || 0) + 1;
          }
          
          // Count by channels
          if (sub.delivery_channels) {
            sub.delivery_channels.forEach((channel: string) => {
              acc.byChannel[channel] = (acc.byChannel[channel] || 0) + 1;
            });
          }
          
          return acc;
        }, {
          total: 0,
          active: 0,
          byFormat: {},
          byChannel: {}
        });
        
        return { data: stats };
      });

    return NextResponse.json({
      subscriptions: result.subscriptions,
      pagination: {
        page: result.page,
        pageSize,
        totalCount: result.totalCount,
        totalPages: result.totalPages,
        hasNextPage: result.page < result.totalPages,
        hasPreviousPage: result.page > 1
      },
      statistics: stats || {
        total: 0,
        active: 0,
        byFormat: {},
        byChannel: {}
      }
    });

  } catch (error) {
    console.error('Error listing subscriptions:', error);
    
    return NextResponse.json(
      {
        error: 'Failed to list subscriptions',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// ============================================================================
// PUT: Update Subscription
// ============================================================================

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      subscriptionId, 
      deliveryFormat,
      deliveryChannels,
      customSchedule,
      filters,
      pauseUntil
    } = body;

    if (!subscriptionId) {
      return NextResponse.json(
        { error: 'Subscription ID is required' },
        { status: 400 }
      );
    }

    // Validate delivery format if provided
    if (deliveryFormat && !Object.values(ReportFormat).includes(deliveryFormat)) {
      return NextResponse.json(
        { error: 'Invalid delivery format' },
        { status: 400 }
      );
    }

    // Validate delivery channels if provided
    if (deliveryChannels) {
      if (!Array.isArray(deliveryChannels) || deliveryChannels.length === 0) {
        return NextResponse.json(
          { error: 'At least one delivery channel is required' },
          { status: 400 }
        );
      }

      const invalidChannels = deliveryChannels.filter(
        channel => !Object.values(DeliveryChannel).includes(channel)
      );
      if (invalidChannels.length > 0) {
        return NextResponse.json(
          { error: `Invalid delivery channels: ${invalidChannels.join(', ')}` },
          { status: 400 }
        );
      }
    }

    const manager = getRecipientManager();
    
    // Check if subscription exists
    const existingSubscription = await manager.getSubscription(subscriptionId);
    if (!existingSubscription) {
      return NextResponse.json(
        { error: 'Subscription not found' },
        { status: 404 }
      );
    }

    // Handle pause/resume
    if (pauseUntil !== undefined) {
      if (pauseUntil === null) {
        // Resume subscription
        await manager.resumeSubscription(subscriptionId);
      } else {
        // Pause subscription
        const pauseDate = new Date(pauseUntil);
        if (isNaN(pauseDate.getTime())) {
          return NextResponse.json(
            { error: 'Invalid pause until date' },
            { status: 400 }
          );
        }
        await manager.pauseSubscription(subscriptionId, pauseDate);
      }
    }

    // Update subscription settings
    const { createClient } = await import('@/lib/supabase/server');
    const supabase = createClient();

    const updates: any = {
      updated_at: new Date().toISOString()
    };

    if (deliveryFormat) updates.delivery_format = deliveryFormat;
    if (deliveryChannels) updates.delivery_channels = deliveryChannels;
    if (customSchedule !== undefined) updates.custom_schedule = customSchedule;
    if (filters !== undefined) updates.filter_config = filters;

    const { error } = await supabase
      .from('report_subscriptions')
      .update(updates)
      .eq('id', subscriptionId);

    if (error) {
      throw new Error(`Failed to update subscription: ${error.message}`);
    }

    // Get updated subscription
    const updatedSubscription = await manager.getSubscription(subscriptionId);

    return NextResponse.json({
      success: true,
      subscription: updatedSubscription,
      message: 'Subscription updated successfully'
    });

  } catch (error) {
    console.error('Error updating subscription:', error);
    
    return NextResponse.json(
      {
        error: 'Failed to update subscription',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// ============================================================================
// DELETE: Unsubscribe
// ============================================================================

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const subscriptionId = searchParams.get('subscriptionId');
    const email = searchParams.get('email');
    const templateId = searchParams.get('templateId');

    // Either subscriptionId OR (email + optional templateId) is required
    if (!subscriptionId && !email) {
      return NextResponse.json(
        { error: 'Either subscription ID or email is required' },
        { status: 400 }
      );
    }

    const manager = getRecipientManager();
    
    let success = false;
    let message = '';

    if (subscriptionId) {
      // Unsubscribe specific subscription
      success = await manager.unsubscribeFromReport(subscriptionId);
      message = success 
        ? 'Successfully unsubscribed from report'
        : 'Failed to unsubscribe from report';
    } else if (email) {
      // Unsubscribe by email (optionally for specific template)
      success = await manager.unsubscribeByEmail(email.toLowerCase().trim(), templateId || undefined);
      message = success 
        ? templateId 
          ? 'Successfully unsubscribed from specific report'
          : 'Successfully unsubscribed from all reports'
        : 'Failed to unsubscribe';
    }

    if (!success) {
      return NextResponse.json(
        { error: message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message
    });

  } catch (error) {
    console.error('Error unsubscribing:', error);
    
    return NextResponse.json(
      {
        error: 'Failed to unsubscribe',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}