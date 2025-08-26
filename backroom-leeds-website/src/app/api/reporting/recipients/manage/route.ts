/**
 * The Backroom Leeds - Recipient Management API
 * Version: 1.0.0
 * Phase: 3, Step 3.5
 * 
 * API endpoints for managing report recipients
 */

import { NextRequest, NextResponse } from 'next/server';
import { getRecipientManager } from '@/lib/reporting/distribution/RecipientManager';
import { ReportFormat, DeliveryChannel } from '@/types/reporting';

// ============================================================================
// POST: Create New Recipient
// ============================================================================

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const {
      userId,
      email,
      name,
      phone,
      role,
      timezone,
      languageCode,
      preferredChannels,
      preferredFormat
    } = body;

    // Validate required fields
    if (!email || !email.includes('@')) {
      return NextResponse.json(
        { error: 'Valid email address is required' },
        { status: 400 }
      );
    }

    // Validate enum values
    if (preferredFormat && !Object.values(ReportFormat).includes(preferredFormat)) {
      return NextResponse.json(
        { error: 'Invalid preferred format' },
        { status: 400 }
      );
    }

    if (preferredChannels && !Array.isArray(preferredChannels)) {
      return NextResponse.json(
        { error: 'Preferred channels must be an array' },
        { status: 400 }
      );
    }

    if (preferredChannels) {
      const invalidChannels = preferredChannels.filter(
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
    
    const recipientId = await manager.createRecipient({
      userId,
      email: email.toLowerCase().trim(),
      name: name?.trim(),
      phone: phone?.trim(),
      role: role || 'stakeholder',
      timezone: timezone || 'Europe/London',
      languageCode: languageCode || 'en',
      preferredChannels: preferredChannels || [DeliveryChannel.EMAIL],
      preferredFormat: preferredFormat || ReportFormat.PDF
    });

    if (!recipientId) {
      throw new Error('Failed to create recipient');
    }

    const newRecipient = await manager.getRecipient(recipientId);

    return NextResponse.json({
      success: true,
      recipient: newRecipient,
      message: 'Recipient created successfully. Verification email sent.'
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating recipient:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const statusCode = errorMessage.includes('already exists') ? 409 : 500;
    
    return NextResponse.json(
      {
        error: 'Failed to create recipient',
        details: errorMessage
      },
      { status: statusCode }
    );
  }
}

// ============================================================================
// GET: List Recipients
// ============================================================================

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Parse filters
    const role = searchParams.get('role') || undefined;
    const isActive = searchParams.get('active') ? searchParams.get('active') === 'true' : undefined;
    const emailVerified = searchParams.get('verified') ? searchParams.get('verified') === 'true' : undefined;
    
    // Parse pagination
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = Math.min(parseInt(searchParams.get('pageSize') || '25'), 100); // Max 100 per page
    
    if (page < 1 || pageSize < 1) {
      return NextResponse.json(
        { error: 'Page and pageSize must be positive integers' },
        { status: 400 }
      );
    }

    const manager = getRecipientManager();
    
    const result = await manager.listRecipients(
      { role, isActive, emailVerified },
      { page, pageSize }
    );

    // Add summary statistics
    const { createClient } = await import('@/lib/supabase/server');
    const supabase = createClient();

    const { data: stats } = await supabase
      .from('report_recipients')
      .select('is_active, email_verified, role')
      .then(result => {
        if (!result.data) return { data: null };
        
        const stats = result.data.reduce((acc: any, recipient: any) => {
          acc.total++;
          if (recipient.is_active) acc.active++;
          if (recipient.email_verified) acc.verified++;
          acc.byRole[recipient.role] = (acc.byRole[recipient.role] || 0) + 1;
          return acc;
        }, {
          total: 0,
          active: 0,
          verified: 0,
          byRole: {}
        });
        
        return { data: stats };
      });

    return NextResponse.json({
      recipients: result.recipients,
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
        verified: 0,
        byRole: {}
      }
    });

  } catch (error) {
    console.error('Error listing recipients:', error);
    
    return NextResponse.json(
      {
        error: 'Failed to list recipients',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// ============================================================================
// PUT: Update Recipient
// ============================================================================

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { recipientId, ...updates } = body;

    if (!recipientId) {
      return NextResponse.json(
        { error: 'Recipient ID is required' },
        { status: 400 }
      );
    }

    // Validate email if being updated
    if (updates.email && !updates.email.includes('@')) {
      return NextResponse.json(
        { error: 'Valid email address is required' },
        { status: 400 }
      );
    }

    // Validate enum values
    if (updates.preferredFormat && !Object.values(ReportFormat).includes(updates.preferredFormat)) {
      return NextResponse.json(
        { error: 'Invalid preferred format' },
        { status: 400 }
      );
    }

    if (updates.preferredChannels) {
      if (!Array.isArray(updates.preferredChannels)) {
        return NextResponse.json(
          { error: 'Preferred channels must be an array' },
          { status: 400 }
        );
      }
      
      const invalidChannels = updates.preferredChannels.filter(
        channel => !Object.values(DeliveryChannel).includes(channel)
      );
      if (invalidChannels.length > 0) {
        return NextResponse.json(
          { error: `Invalid delivery channels: ${invalidChannels.join(', ')}` },
          { status: 400 }
        );
      }
    }

    // Clean up the updates object
    const cleanUpdates = { ...updates };
    delete cleanUpdates.recipientId;
    
    // Normalize email
    if (cleanUpdates.email) {
      cleanUpdates.email = cleanUpdates.email.toLowerCase().trim();
    }

    const manager = getRecipientManager();
    
    const success = await manager.updateRecipient(recipientId, cleanUpdates);
    
    if (!success) {
      return NextResponse.json(
        { error: 'Failed to update recipient' },
        { status: 500 }
      );
    }

    const updatedRecipient = await manager.getRecipient(recipientId);

    return NextResponse.json({
      success: true,
      recipient: updatedRecipient,
      message: 'Recipient updated successfully'
    });

  } catch (error) {
    console.error('Error updating recipient:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const statusCode = errorMessage.includes('not found') ? 404 : 500;
    
    return NextResponse.json(
      {
        error: 'Failed to update recipient',
        details: errorMessage
      },
      { status: statusCode }
    );
  }
}

// ============================================================================
// DELETE: Deactivate Recipient
// ============================================================================

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const recipientId = searchParams.get('recipientId');

    if (!recipientId) {
      return NextResponse.json(
        { error: 'Recipient ID is required' },
        { status: 400 }
      );
    }

    const manager = getRecipientManager();
    
    const success = await manager.deactivateRecipient(recipientId);
    
    if (!success) {
      return NextResponse.json(
        { error: 'Failed to deactivate recipient' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      recipientId,
      message: 'Recipient deactivated successfully. All active subscriptions have been cancelled.'
    });

  } catch (error) {
    console.error('Error deactivating recipient:', error);
    
    return NextResponse.json(
      {
        error: 'Failed to deactivate recipient',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}