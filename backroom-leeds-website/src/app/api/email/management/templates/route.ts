/**
 * Email Template Management API Route
 * 
 * Handles email template management, versioning, and rendering.
 */

import { NextRequest, NextResponse } from 'next/server';
import { render } from '@react-email/render';
import { z } from 'zod';

// Import templates
import BookingConfirmationTemplate from '@/lib/email/templates/booking/BookingConfirmationTemplate';
import BookingReminderTemplate from '@/lib/email/templates/booking/BookingReminderTemplate';
import CancellationConfirmationTemplate from '@/lib/email/templates/booking/CancellationConfirmationTemplate';
import PaymentConfirmationTemplate from '@/lib/email/templates/payment/PaymentConfirmationTemplate';
import PaymentFailureTemplate from '@/lib/email/templates/payment/PaymentFailureTemplate';
import WaitlistNotificationTemplate from '@/lib/email/templates/waitlist/WaitlistNotificationTemplate';

// ============================================================================
// Template Registry
// ============================================================================

const TEMPLATE_REGISTRY = {
  'booking_confirmation': {
    component: BookingConfirmationTemplate,
    name: 'Booking Confirmation',
    description: 'Confirmation email for new bookings with QR code and details',
    category: 'booking',
    requiredFields: ['customerName', 'booking', 'qrCodeUrl']
  },
  'booking_reminder': {
    component: BookingReminderTemplate,
    name: 'Booking Reminder',
    description: 'Pre-arrival reminder emails with booking details and checklist',
    category: 'booking',
    requiredFields: ['customerName', 'booking', 'reminderType', 'qrCodeUrl']
  },
  'cancellation_confirmation': {
    component: CancellationConfirmationTemplate,
    name: 'Cancellation Confirmation',
    description: 'Confirmation email for booking cancellations with refund information',
    category: 'booking',
    requiredFields: ['customerName', 'booking', 'refund', 'cancellation']
  },
  'payment_confirmation': {
    component: PaymentConfirmationTemplate,
    name: 'Payment Confirmation',
    description: 'Confirmation email for successful payments',
    category: 'payment',
    requiredFields: ['customerName', 'booking', 'payment', 'totals']
  },
  'payment_failure': {
    component: PaymentFailureTemplate,
    name: 'Payment Failure',
    description: 'Notification email for failed payments with retry instructions',
    category: 'payment',
    requiredFields: ['customerName', 'booking', 'payment', 'totals', 'urgency']
  },
  'waitlist_notification': {
    component: WaitlistNotificationTemplate,
    name: 'Waitlist Notification',
    description: 'Notification email when a waitlist spot becomes available',
    category: 'waitlist',
    requiredFields: ['customerName', 'waitlistEntry', 'availableSlot', 'booking']
  }
};

// ============================================================================
// Request Validation Schemas
// ============================================================================

const RenderTemplateSchema = z.object({
  templateId: z.string().refine(id => id in TEMPLATE_REGISTRY, {
    message: 'Invalid template ID'
  }),
  data: z.record(z.any()),
  format: z.enum(['html', 'text', 'both']).default('html')
});

const PreviewTemplateSchema = z.object({
  templateId: z.string().refine(id => id in TEMPLATE_REGISTRY, {
    message: 'Invalid template ID'
  }),
  sampleData: z.record(z.any()).optional()
});

// ============================================================================
// Sample Data for Templates
// ============================================================================

const SAMPLE_DATA = {
  booking_confirmation: {
    customerName: 'Sarah Johnson',
    booking: {
      id: 'BK-2024-001234',
      date: new Date('2024-12-31'),
      timeSlot: '21:00',
      tableName: 'VIP-3',
      floor: 'Upstairs',
      partySize: 4,
      specialRequests: 'Birthday celebration - please include sparklers',
      totalAmount: 200,
      depositPaid: 50,
      remainingBalance: 150
    },
    qrCodeUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==',
    drinksPackage: {
      name: 'Premium Bottle Service',
      price: 350,
      description: 'Premium bottle service with mixers and garnishes',
      includes: ['Grey Goose Vodka 70cl', 'Fresh mixers', 'Ice and garnishes', 'VIP table service']
    },
    eventInfo: {
      name: 'New Year\'s Eve Spectacular',
      type: 'special_event',
      djLineup: ['DJ Shadow', 'MC Voltage', 'The Underground Collective']
    }
  },
  
  booking_reminder: {
    customerName: 'Sarah Johnson',
    booking: {
      id: 'BK-2024-001234',
      date: new Date('2024-12-31'),
      timeSlot: '21:00',
      tableName: 'VIP-3',
      floor: 'Upstairs',
      partySize: 4,
      specialRequests: 'Birthday celebration',
      remainingBalance: 150
    },
    qrCodeUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==',
    reminderType: 'day_before' as const,
    eventInfo: {
      name: 'New Year\'s Eve Spectacular',
      type: 'special_event',
      djLineup: ['DJ Shadow', 'MC Voltage']
    }
  },

  cancellation_confirmation: {
    customerName: 'Sarah Johnson',
    booking: {
      id: 'BK-2024-001234',
      date: new Date('2024-12-31'),
      timeSlot: '21:00',
      tableName: 'VIP-3',
      floor: 'Upstairs',
      partySize: 4,
      originalAmount: 200,
      depositPaid: 50
    },
    refund: {
      eligible: true,
      amount: 50,
      processedAt: new Date(),
      estimatedRefundDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
      refundReference: 'REF-BK240001'
    },
    cancellation: {
      cancelledAt: new Date(),
      hoursBeforeEvent: 72,
      reason: 'Change of plans'
    }
  },

  payment_confirmation: {
    customerName: 'Sarah Johnson',
    booking: {
      id: 'BK-2024-001234',
      date: new Date('2024-12-31'),
      timeSlot: '21:00',
      tableName: 'VIP-3',
      floor: 'Upstairs',
      partySize: 4
    },
    payment: {
      id: 'pi_3ABC123def456',
      type: 'deposit' as const,
      amount: 50,
      currency: 'gbp',
      method: 'card',
      last4: '4242',
      processedAt: new Date(),
      transactionId: 'txn_ABC123DEF456',
      receiptUrl: 'https://stripe.com/receipts/123'
    },
    totals: {
      originalAmount: 200,
      totalPaid: 50,
      remainingBalance: 150
    }
  },

  payment_failure: {
    customerName: 'Sarah Johnson',
    booking: {
      id: 'BK-2024-001234',
      date: new Date('2024-12-31'),
      timeSlot: '21:00',
      tableName: 'VIP-3',
      floor: 'Upstairs',
      partySize: 4
    },
    payment: {
      id: 'pi_3ABC123def456',
      type: 'deposit' as const,
      attemptedAmount: 50,
      currency: 'gbp',
      method: 'card',
      last4: '4242',
      failedAt: new Date(),
      errorCode: 'card_declined',
      errorMessage: 'Your card was declined',
      retryUrl: 'https://backroomleeds.com/bookings/BK-2024-001234/payment'
    },
    totals: {
      originalAmount: 200,
      totalPaid: 0,
      remainingBalance: 200
    },
    urgency: {
      isUrgent: true,
      hoursUntilBooking: 18,
      riskLevel: 'high' as const
    }
  },

  waitlist_notification: {
    customerName: 'Sarah Johnson',
    waitlistEntry: {
      id: 'WL-2024-5678',
      createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      preferences: {
        preferredDate: new Date('2024-12-31'),
        preferredTime: '21:00',
        partySize: 4,
        floor: 'upstairs' as const
      }
    },
    availableSlot: {
      date: new Date('2024-12-31'),
      timeSlot: '21:00',
      tableName: 'VIP-3',
      floor: 'Upstairs',
      capacity: 6,
      price: 50,
      availability: {
        totalTables: 16,
        availableTables: 3
      }
    },
    booking: {
      reservationWindow: 30,
      expiresAt: new Date(Date.now() + 30 * 60 * 1000),
      bookingUrl: 'https://backroomleeds.com/book/waitlist/WL-2024-5678',
      priority: 5
    },
    eventInfo: {
      name: 'New Year\'s Eve Spectacular',
      type: 'special_event',
      djLineup: ['DJ Shadow', 'MC Voltage']
    }
  }
};

// ============================================================================
// GET - List Available Templates
// ============================================================================

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');

    let templates = Object.entries(TEMPLATE_REGISTRY);
    
    // Filter by category if specified
    if (category) {
      templates = templates.filter(([_, template]) => template.category === category);
    }

    const templateList = templates.map(([id, template]) => ({
      id,
      name: template.name,
      description: template.description,
      category: template.category,
      requiredFields: template.requiredFields,
      hasSampleData: id in SAMPLE_DATA
    }));

    return NextResponse.json({
      templates: templateList,
      categories: [...new Set(Object.values(TEMPLATE_REGISTRY).map(t => t.category))],
      totalCount: templateList.length
    });

  } catch (error) {
    console.error('List templates error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// ============================================================================
// POST - Render Template
// ============================================================================

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = RenderTemplateSchema.parse(body);

    const { templateId, data, format } = validatedData;
    const template = TEMPLATE_REGISTRY[templateId];

    if (!template) {
      return NextResponse.json(
        { error: 'Template not found' },
        { status: 404 }
      );
    }

    // Validate required fields
    const missingFields = template.requiredFields.filter(field => !(field in data));
    if (missingFields.length > 0) {
      return NextResponse.json(
        {
          error: 'Missing required fields',
          missingFields,
          requiredFields: template.requiredFields
        },
        { status: 400 }
      );
    }

    // Render the template
    const TemplateComponent = template.component;
    
    try {
      const rendered = {
        templateId,
        renderedAt: new Date().toISOString()
      };

      if (format === 'html' || format === 'both') {
        rendered.html = render(TemplateComponent(data));
      }

      if (format === 'text' || format === 'both') {
        rendered.text = render(TemplateComponent(data), {
          plainText: true
        });
      }

      return NextResponse.json(rendered);

    } catch (renderError) {
      console.error('Template rendering error:', renderError);
      return NextResponse.json(
        {
          error: 'Template rendering failed',
          details: renderError.message
        },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('Render template error:', error);

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
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// ============================================================================
// PUT - Preview Template with Sample Data
// ============================================================================

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = PreviewTemplateSchema.parse(body);

    const { templateId, sampleData } = validatedData;
    const template = TEMPLATE_REGISTRY[templateId];

    if (!template) {
      return NextResponse.json(
        { error: 'Template not found' },
        { status: 404 }
      );
    }

    // Use provided sample data or default sample data
    const dataToUse = sampleData || SAMPLE_DATA[templateId];

    if (!dataToUse) {
      return NextResponse.json(
        {
          error: 'No sample data available for this template',
          templateId,
          requiredFields: template.requiredFields
        },
        { status: 400 }
      );
    }

    // Render the template with sample data
    const TemplateComponent = template.component;
    
    try {
      const html = render(TemplateComponent(dataToUse));
      const text = render(TemplateComponent(dataToUse), {
        plainText: true
      });

      return NextResponse.json({
        templateId,
        templateName: template.name,
        html,
        text,
        sampleData: dataToUse,
        previewedAt: new Date().toISOString()
      });

    } catch (renderError) {
      console.error('Template preview rendering error:', renderError);
      return NextResponse.json(
        {
          error: 'Template preview rendering failed',
          details: renderError.message
        },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('Preview template error:', error);

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
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}