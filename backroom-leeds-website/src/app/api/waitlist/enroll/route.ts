import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { WaitlistEntry, WaitlistStatus, BookingSource } from '@/types/advanced-booking.types';
import { WAITLIST_LIMITS } from '@/types/advanced-booking.types';

// Validation schema for waitlist enrollment
const waitlistEnrollmentSchema = z.object({
  customerEmail: z.string().email('Valid email address required'),
  customerName: z.string().min(1, 'Name is required'),
  customerPhone: z.string().min(10, 'Valid phone number required'),
  bookingDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Valid date required (YYYY-MM-DD)'),
  preferredArrivalTime: z.string().regex(/^\d{2}:\d{2}$/, 'Valid time required (HH:MM)'),
  alternativeArrivalTimes: z.array(z.string()).max(6, 'Maximum 6 alternative times').default([]),
  partySize: z.number().min(1).max(20),
  flexiblePartySize: z.boolean().default(false),
  minPartySize: z.number().optional(),
  maxPartySize: z.number().optional(),
  tablePreferences: z.array(z.number().min(1).max(16)).max(8).default([]),
  floorPreference: z.enum(['upstairs', 'downstairs']).optional(),
  acceptsAnyTable: z.boolean().default(true),
  acceptsCombination: z.boolean().default(true),
  notificationMethods: z.array(z.enum(['email', 'sms', 'phone'])).min(1, 'At least one notification method required'),
  notificationLeadTime: z.number().min(30).max(720).default(120),
  maxNotifications: z.number().min(1).max(5).default(3),
  specialOccasion: z.string().optional(),
  notes: z.string().max(500).optional()
});

interface WaitlistEnrollmentResult {
  waitlistEntry: WaitlistEntry;
  positionInQueue: number;
  estimatedWaitTime: string;
  priorityScore: number;
  notifications: {
    confirmationSent: boolean;
    methods: string[];
  };
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate request
    const validation = waitlistEnrollmentSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid enrollment data', details: validation.error.errors },
        { status: 400 }
      );
    }

    const enrollmentData = validation.data;

    // Check if customer already has too many waitlist entries
    const existingEntries = await checkExistingWaitlistEntries(enrollmentData.customerEmail);
    if (existingEntries >= WAITLIST_LIMITS.MAX_WAITLIST_ENTRIES_PER_CUSTOMER) {
      return NextResponse.json(
        { 
          error: `Maximum ${WAITLIST_LIMITS.MAX_WAITLIST_ENTRIES_PER_CUSTOMER} waitlist entries per customer exceeded`,
          existingEntries 
        },
        { status: 409 }
      );
    }

    // Calculate priority score
    const priorityScore = calculatePriorityScore(enrollmentData);
    
    // Determine position in queue
    const positionInQueue = await calculateQueuePosition(
      enrollmentData.bookingDate,
      enrollmentData.preferredArrivalTime,
      priorityScore
    );

    // Generate waitlist entry
    const waitlistEntry = await createWaitlistEntry(
      enrollmentData,
      priorityScore,
      positionInQueue
    );

    // Estimate wait time
    const estimatedWaitTime = calculateEstimatedWaitTime(positionInQueue, enrollmentData.bookingDate);

    // Send notifications
    const notifications = await sendWaitlistConfirmation(waitlistEntry);

    // Log enrollment for analytics
    await logWaitlistEnrollment(waitlistEntry, enrollmentData);

    const result: WaitlistEnrollmentResult = {
      waitlistEntry,
      positionInQueue,
      estimatedWaitTime,
      priorityScore,
      notifications
    };

    return NextResponse.json(result, { status: 201 });

  } catch (error) {
    console.error('Error enrolling in waitlist:', error);
    return NextResponse.json(
      { error: 'Failed to enroll in waitlist' },
      { status: 500 }
    );
  }
}

async function checkExistingWaitlistEntries(customerEmail: string): Promise<number> {
  // Mock database query - would check active waitlist entries for customer
  try {
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Mock: most customers have 0-1 existing entries
    return Math.random() > 0.8 ? 1 : 0;

  } catch (error) {
    console.error('Error checking existing waitlist entries:', error);
    return 0;
  }
}

function calculatePriorityScore(data: z.infer<typeof waitlistEnrollmentSchema>): number {
  let score = WAITLIST_LIMITS.PRIORITY_SCORE_RANGE.min; // Base score of 0

  // Flexibility bonuses
  if (data.alternativeArrivalTimes.length > 0) {
    score += data.alternativeArrivalTimes.length * 25; // +25 per alternative time
  }

  if (data.flexiblePartySize) {
    score += 50; // +50 for flexible party size
  }

  if (data.acceptsAnyTable) {
    score += 30; // +30 for accepting any table
  }

  if (data.acceptsCombination) {
    score += 40; // +40 for accepting table combinations
  }

  // Floor preference bonus (more flexible = higher score)
  if (!data.floorPreference) {
    score += 20; // +20 for no floor preference
  }

  // Table preference penalty (specific preferences = lower score)
  if (data.tablePreferences.length === 0) {
    score += 25; // +25 for no specific table preferences
  } else {
    score -= Math.min(data.tablePreferences.length * 5, 20); // -5 per specific table, max -20
  }

  // Special occasion bonus
  if (data.specialOccasion && data.specialOccasion !== '') {
    score += 15; // +15 for special occasions
  }

  // Advanced notification bonus
  if (data.notificationLeadTime >= 240) { // 4+ hours notice
    score += 30;
  } else if (data.notificationLeadTime >= 120) { // 2+ hours notice
    score += 15;
  }

  // Multi-method notification bonus
  if (data.notificationMethods.length > 1) {
    score += 20;
  }

  // Party size considerations
  if (data.partySize >= 8) {
    score -= 10; // Slightly lower priority for larger parties (harder to accommodate)
  } else if (data.partySize <= 3) {
    score += 10; // Higher priority for smaller parties (easier to accommodate)
  }

  // Ensure score is within bounds
  return Math.min(
    WAITLIST_LIMITS.PRIORITY_SCORE_RANGE.max,
    Math.max(WAITLIST_LIMITS.PRIORITY_SCORE_RANGE.min, score)
  );
}

async function calculateQueuePosition(
  bookingDate: string,
  preferredTime: string,
  priorityScore: number
): Promise<number> {
  // Mock queue position calculation
  try {
    await new Promise(resolve => setTimeout(resolve, 200));

    // Simulate existing queue based on date/time popularity
    const date = new Date(bookingDate);
    const isWeekend = date.getDay() >= 5;
    const isPeakTime = preferredTime >= '19:00' && preferredTime <= '21:30';

    let baseQueueLength = 2; // Minimum queue
    if (isWeekend) baseQueueLength += 3;
    if (isPeakTime) baseQueueLength += 2;

    // Random variation
    baseQueueLength += Math.floor(Math.random() * 4);

    // Priority score affects position
    const priorityAdjustment = Math.floor(priorityScore / 100); // Every 100 points moves up 1 position
    const position = Math.max(1, baseQueueLength - priorityAdjustment);

    return position;

  } catch (error) {
    console.error('Error calculating queue position:', error);
    return 5; // Default position
  }
}

async function createWaitlistEntry(
  data: z.infer<typeof waitlistEnrollmentSchema>,
  priorityScore: number,
  positionInQueue: number
): Promise<WaitlistEntry> {
  const now = new Date();
  const expiryHours = WAITLIST_LIMITS.DEFAULT_EXPIRY_HOURS;
  const expiresAt = new Date(now.getTime() + expiryHours * 60 * 60 * 1000);

  // Estimate when availability might occur
  const estimatedAvailability = new Date(data.bookingDate);
  if (positionInQueue <= 2) {
    // High priority - might get something same day
    estimatedAvailability.setHours(estimatedAvailability.getHours() + 2);
  } else {
    // Lower priority - might be later in evening
    estimatedAvailability.setHours(20, 0, 0, 0); // Default to 8 PM
  }

  const waitlistEntry: WaitlistEntry = {
    id: `waitlist-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    customerEmail: data.customerEmail,
    customerName: data.customerName,
    customerPhone: data.customerPhone,
    bookingDate: new Date(data.bookingDate),
    preferredArrivalTime: data.preferredArrivalTime,
    alternativeArrivalTimes: data.alternativeArrivalTimes,
    partySize: data.partySize,
    flexiblePartySize: data.flexiblePartySize,
    minPartySize: data.minPartySize,
    maxPartySize: data.maxPartySize,
    tablePreferences: data.tablePreferences,
    floorPreference: data.floorPreference,
    acceptsAnyTable: data.acceptsAnyTable,
    acceptsCombination: data.acceptsCombination,
    status: WaitlistStatus.ACTIVE,
    priorityScore,
    positionInQueue,
    estimatedAvailability,
    notificationMethods: data.notificationMethods,
    notificationLeadTime: data.notificationLeadTime,
    maxNotifications: data.maxNotifications,
    notificationsSent: 0,
    convertedToBookingId: undefined,
    convertedAt: undefined,
    declinedOffers: 0,
    source: BookingSource.WEBSITE,
    specialOccasion: data.specialOccasion,
    notes: data.notes,
    expiresAt,
    createdAt: now,
    updatedAt: now
  };

  // Mock database insertion
  await new Promise(resolve => setTimeout(resolve, 100));
  console.log('Waitlist entry created:', waitlistEntry.id);

  return waitlistEntry;
}

function calculateEstimatedWaitTime(positionInQueue: number, bookingDate: string): string {
  const date = new Date(bookingDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  date.setHours(0, 0, 0, 0);
  
  const isToday = date.getTime() === today.getTime();
  
  if (isToday) {
    if (positionInQueue <= 2) {
      return '30-90 minutes';
    } else if (positionInQueue <= 4) {
      return '1-3 hours';
    } else {
      return 'Later this evening';
    }
  } else {
    if (positionInQueue <= 2) {
      return 'Within 2 hours of your preferred time';
    } else if (positionInQueue <= 4) {
      return 'Same day, alternative time likely';
    } else {
      return 'Alternative time or date may be needed';
    }
  }
}

async function sendWaitlistConfirmation(waitlistEntry: WaitlistEntry) {
  // Mock notification sending
  try {
    await new Promise(resolve => setTimeout(resolve, 300));

    const notifications = {
      confirmationSent: true,
      methods: waitlistEntry.notificationMethods,
      sentAt: new Date().toISOString()
    };

    // In real implementation, would integrate with email/SMS services
    console.log(`Waitlist confirmation sent to ${waitlistEntry.customerEmail}`, notifications);

    return notifications;

  } catch (error) {
    console.error('Error sending waitlist confirmation:', error);
    return {
      confirmationSent: false,
      methods: [],
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

async function logWaitlistEnrollment(
  waitlistEntry: WaitlistEntry,
  originalData: z.infer<typeof waitlistEnrollmentSchema>
): Promise<void> {
  try {
    const logEntry = {
      action: 'waitlist_enrollment',
      waitlistId: waitlistEntry.id,
      customerEmail: waitlistEntry.customerEmail,
      bookingDate: waitlistEntry.bookingDate,
      priorityScore: waitlistEntry.priorityScore,
      positionInQueue: waitlistEntry.positionInQueue,
      flexibilityFactors: {
        alternativeTimesCount: originalData.alternativeArrivalTimes.length,
        flexiblePartySize: originalData.flexiblePartySize,
        acceptsAnyTable: originalData.acceptsAnyTable,
        acceptsCombination: originalData.acceptsCombination,
        floorPreference: originalData.floorPreference || 'none'
      },
      enrolledAt: new Date().toISOString(),
      ipAddress: 'system', // Would extract from request headers
      userAgent: 'booking-api'
    };

    // In real implementation, would insert to analytics/audit table
    console.log('Waitlist enrollment logged:', logEntry);

  } catch (error) {
    // Don't fail the main operation if logging fails
    console.error('Failed to log waitlist enrollment:', error);
  }
}

// GET endpoint to check waitlist status
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');
    const phone = searchParams.get('phone');
    const waitlistId = searchParams.get('id');

    if (!email && !phone && !waitlistId) {
      return NextResponse.json(
        { error: 'Email, phone, or waitlist ID required' },
        { status: 400 }
      );
    }

    // Mock status check
    const waitlistEntries = await getCustomerWaitlistEntries(email, phone, waitlistId);

    return NextResponse.json({
      entries: waitlistEntries,
      totalActive: waitlistEntries.filter(e => e.status === WaitlistStatus.ACTIVE).length,
      totalNotified: waitlistEntries.filter(e => e.status === WaitlistStatus.NOTIFIED).length,
      totalConverted: waitlistEntries.filter(e => e.status === WaitlistStatus.CONVERTED).length
    });

  } catch (error) {
    console.error('Error checking waitlist status:', error);
    return NextResponse.json(
      { error: 'Failed to check waitlist status' },
      { status: 500 }
    );
  }
}

async function getCustomerWaitlistEntries(
  email?: string | null,
  phone?: string | null,
  waitlistId?: string | null
): Promise<Partial<WaitlistEntry>[]> {
  // Mock database query
  await new Promise(resolve => setTimeout(resolve, 200));

  // Return mock entries
  if (waitlistId) {
    return [{
      id: waitlistId,
      customerEmail: email || 'customer@example.com',
      status: WaitlistStatus.ACTIVE,
      positionInQueue: 3,
      bookingDate: new Date('2025-01-15'),
      preferredArrivalTime: '20:00',
      priorityScore: 450,
      createdAt: new Date()
    }];
  }

  return [];
}