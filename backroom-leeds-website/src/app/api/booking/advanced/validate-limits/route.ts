import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { BookingLimits } from '@/types/advanced-booking.types';
import { BOOKING_LIMITS } from '@/types/advanced-booking.types';

// Request validation schema
const limitsValidationSchema = z.object({
  customerEmail: z.string().email(),
  customerPhone: z.string().optional(),
  bookingDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  requestedTables: z.number().min(1).max(4),
  requestedGuests: z.number().min(1).max(20),
  paymentMethodId: z.string().optional(),
  existingBookingId: z.string().optional() // For modifications
});

interface LimitValidationResult {
  isValid: boolean;
  currentLimits: BookingLimits;
  violations: Array<{
    type: 'booking_count' | 'table_count' | 'party_size' | 'duplicate_risk' | 'fraud_risk';
    severity: 'error' | 'warning' | 'info';
    message: string;
    canOverride: boolean;
    details?: Record<string, any>;
  }>;
  recommendations: string[];
  riskScore: number; // 0-100, higher = more risky
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate request
    const validation = limitsValidationSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request parameters', details: validation.error.errors },
        { status: 400 }
      );
    }

    const { 
      customerEmail, 
      customerPhone, 
      bookingDate, 
      requestedTables, 
      requestedGuests,
      paymentMethodId,
      existingBookingId
    } = validation.data;

    // Fetch customer booking history
    const customerLimits = await fetchCustomerLimits(customerEmail, customerPhone, bookingDate, existingBookingId);
    
    // Validate against limits
    const validationResult = await validateBookingLimits(
      customerLimits,
      requestedTables,
      requestedGuests,
      paymentMethodId
    );

    return NextResponse.json(validationResult);

  } catch (error) {
    console.error('Error validating booking limits:', error);
    return NextResponse.json(
      { error: 'Failed to validate booking limits' },
      { status: 500 }
    );
  }
}

async function fetchCustomerLimits(
  customerEmail: string, 
  customerPhone: string | undefined, 
  bookingDate: string,
  existingBookingId?: string
): Promise<BookingLimits> {
  // Mock database query - would be real implementation with Supabase
  try {
    await new Promise(resolve => setTimeout(resolve, 300)); // Simulate DB query

    // Mock customer data based on email hash
    const emailHash = customerEmail.split('').reduce((a, b) => {
      a = ((a << 5) - a) + b.charCodeAt(0);
      return a & a;
    }, 0);
    
    const mockCustomerId = `customer-${Math.abs(emailHash)}`;
    
    // Generate mock booking history
    const existingBookingsCount = Math.abs(emailHash) % 3; // 0-2 existing bookings
    const existingTables = Array.from(
      { length: existingBookingsCount }, 
      (_, i) => Math.abs(emailHash + i) % 16 + 1
    );

    // Check for suspicious patterns
    const attemptedExcessBookings = customerEmail.includes('test') ? 1 : 0;
    const isVipCustomer = customerEmail.includes('vip') || customerEmail.includes('premium');

    return {
      customerId: mockCustomerId,
      customerEmail,
      bookingDate: new Date(bookingDate),
      bookingsCount: existingBookingsCount,
      tablesReserved: existingTables,
      totalGuests: existingBookingsCount * 6, // Assume 6 guests per booking average
      attemptedExcessBookings,
      firstBookingId: existingBookingsCount > 0 ? `booking-${mockCustomerId}-1` : undefined,
      secondBookingId: existingBookingsCount > 1 ? `booking-${mockCustomerId}-2` : undefined,
      isVipCustomer,
      loyaltyTier: isVipCustomer ? 'GOLD' : 'BRONZE',
      riskFlags: [] as string[]
    };

  } catch (error) {
    console.error('Error fetching customer limits:', error);
    throw error;
  }
}

async function validateBookingLimits(
  customerLimits: BookingLimits & { isVipCustomer?: boolean; loyaltyTier?: string; riskFlags?: string[] },
  requestedTables: number,
  requestedGuests: number,
  paymentMethodId?: string
): Promise<LimitValidationResult> {
  const violations = [];
  const recommendations = [];
  let riskScore = 0;

  // Check booking count limits
  const maxBookings = customerLimits.isVipCustomer 
    ? BOOKING_LIMITS.MAX_BOOKINGS_PER_CUSTOMER_PER_DAY + 1 // VIP gets +1
    : BOOKING_LIMITS.MAX_BOOKINGS_PER_CUSTOMER_PER_DAY;

  if (customerLimits.bookingsCount >= maxBookings) {
    violations.push({
      type: 'booking_count' as const,
      severity: 'error' as const,
      message: `Maximum ${maxBookings} bookings per day exceeded (current: ${customerLimits.bookingsCount})`,
      canOverride: customerLimits.loyaltyTier === 'GOLD' || customerLimits.loyaltyTier === 'PLATINUM',
      details: { 
        current: customerLimits.bookingsCount, 
        limit: maxBookings, 
        isVip: customerLimits.isVipCustomer 
      }
    });
    riskScore += 30;
  } else if (customerLimits.bookingsCount === maxBookings - 1) {
    violations.push({
      type: 'booking_count' as const,
      severity: 'warning' as const,
      message: 'This will be your final booking for today',
      canOverride: true,
      details: { current: customerLimits.bookingsCount, limit: maxBookings }
    });
    riskScore += 10;
  }

  // Check table count limits
  const totalTablesAfter = customerLimits.tablesReserved.length + requestedTables;
  const maxTables = customerLimits.isVipCustomer ? 3 : BOOKING_LIMITS.MAX_TABLES_PER_BOOKING;

  if (totalTablesAfter > maxTables) {
    violations.push({
      type: 'table_count' as const,
      severity: 'error' as const,
      message: `Maximum ${maxTables} tables per customer exceeded (requesting ${requestedTables}, already have ${customerLimits.tablesReserved.length})`,
      canOverride: customerLimits.loyaltyTier === 'PLATINUM',
      details: { 
        existing: customerLimits.tablesReserved.length,
        requested: requestedTables,
        total: totalTablesAfter,
        limit: maxTables
      }
    });
    riskScore += 25;
  }

  // Check party size reasonableness
  if (requestedGuests > BOOKING_LIMITS.MAX_PARTY_SIZE) {
    violations.push({
      type: 'party_size' as const,
      severity: 'error' as const,
      message: `Party size of ${requestedGuests} exceeds maximum of ${BOOKING_LIMITS.MAX_PARTY_SIZE}`,
      canOverride: false,
      details: { partySize: requestedGuests, limit: BOOKING_LIMITS.MAX_PARTY_SIZE }
    });
    riskScore += 40;
  } else if (requestedGuests > 15) {
    violations.push({
      type: 'party_size' as const,
      severity: 'warning' as const,
      message: 'Large party size may require special arrangements',
      canOverride: true,
      details: { partySize: requestedGuests }
    });
    riskScore += 15;
  }

  // Check for duplicate booking patterns
  if (paymentMethodId) {
    // Mock duplicate detection
    const duplicateRisk = Math.random() > 0.85; // 15% chance
    if (duplicateRisk) {
      violations.push({
        type: 'duplicate_risk' as const,
        severity: 'warning' as const,
        message: 'Multiple payment methods or similar bookings detected',
        canOverride: true,
        details: { paymentMethodId, riskFactors: ['similar_timing', 'payment_pattern'] }
      });
      riskScore += 20;
    }
  }

  // Check fraud risk based on historical behavior
  if (customerLimits.attemptedExcessBookings > 0) {
    violations.push({
      type: 'fraud_risk' as const,
      severity: 'warning' as const,
      message: `Previous attempts to exceed limits detected (${customerLimits.attemptedExcessBookings} attempts)`,
      canOverride: customerLimits.attemptedExcessBookings < 3,
      details: { attempts: customerLimits.attemptedExcessBookings }
    });
    riskScore += customerLimits.attemptedExcessBookings * 15;
  }

  // Risk-based additional checks
  if (customerLimits.riskFlags && customerLimits.riskFlags.length > 0) {
    violations.push({
      type: 'fraud_risk' as const,
      severity: 'info' as const,
      message: 'Customer has risk flags that may require review',
      canOverride: true,
      details: { riskFlags: customerLimits.riskFlags }
    });
    riskScore += customerLimits.riskFlags.length * 10;
  }

  // Generate recommendations
  if (violations.length === 0) {
    recommendations.push('All booking limits satisfied - can proceed normally');
  } else {
    const hasErrors = violations.some(v => v.severity === 'error');
    
    if (hasErrors) {
      recommendations.push('Manual review required due to limit violations');
      recommendations.push('Consider contacting customer to discuss alternatives');
      
      const canOverrideAny = violations.some(v => v.severity === 'error' && v.canOverride);
      if (canOverrideAny) {
        recommendations.push('Manager override possible for some violations');
      }
    } else {
      recommendations.push('Warnings detected but booking can proceed');
      recommendations.push('Monitor for patterns if this is a repeat customer');
    }
  }

  // VIP specific recommendations
  if (customerLimits.isVipCustomer) {
    recommendations.push('VIP customer - enhanced service protocols apply');
  }

  // Risk-based recommendations
  if (riskScore > 50) {
    recommendations.push('High risk score - consider additional verification');
  } else if (riskScore > 25) {
    recommendations.push('Moderate risk - standard verification recommended');
  }

  const isValid = violations.every(v => v.severity !== 'error' || v.canOverride);

  return {
    isValid,
    currentLimits: customerLimits,
    violations,
    recommendations,
    riskScore: Math.min(100, Math.max(0, riskScore))
  };
}

// GET endpoint for limit information
export async function GET() {
  try {
    return NextResponse.json({
      limits: {
        maxBookingsPerDay: BOOKING_LIMITS.MAX_BOOKINGS_PER_CUSTOMER_PER_DAY,
        maxTablesPerBooking: BOOKING_LIMITS.MAX_TABLES_PER_BOOKING,
        maxPartySize: BOOKING_LIMITS.MAX_PARTY_SIZE,
        vipBonuses: {
          extraBookings: 1,
          extraTables: 1
        }
      },
      riskThresholds: {
        low: 25,
        medium: 50,
        high: 75
      }
    });

  } catch (error) {
    console.error('Error fetching limit information:', error);
    return NextResponse.json(
      { error: 'Failed to fetch limit information' },
      { status: 500 }
    );
  }
}