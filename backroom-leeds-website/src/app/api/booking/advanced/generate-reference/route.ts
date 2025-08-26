import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import crypto from 'crypto';

// Request validation schema
const referenceGenerationSchema = z.object({
  customerId: z.string().min(1),
  bookingDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  partySize: z.number().min(1).max(20),
  tableCount: z.number().min(1).max(4).optional(),
  isVip: z.boolean().optional(),
  eventType: z.enum(['regular', 'special_event', 'private_hire']).optional()
});

interface BookingReference {
  bookingRef: string;
  checkInCode: string;
  qrData: {
    bookingRef: string;
    checkInCode: string;
    customerId: string;
    partySize: number;
    generatedAt: string;
    validUntil: string;
    encryptedSignature: string;
  };
  isUnique: boolean;
  generationAttempts: number;
}

const REFERENCE_FORMAT = 'BRL-YYYY-NNNNN'; // BRL-2025-12345
const CHECKIN_CODE_LENGTH = 6;
const MAX_GENERATION_ATTEMPTS = 50;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate request
    const validation = referenceGenerationSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request parameters', details: validation.error.errors },
        { status: 400 }
      );
    }

    const { 
      customerId, 
      bookingDate, 
      partySize, 
      tableCount, 
      isVip, 
      eventType 
    } = validation.data;

    // Generate unique booking reference
    const referenceResult = await generateUniqueBookingReference(
      bookingDate, 
      customerId, 
      isVip || false
    );

    if (!referenceResult.isUnique) {
      return NextResponse.json(
        { error: 'Failed to generate unique booking reference after maximum attempts' },
        { status: 500 }
      );
    }

    // Generate check-in code
    const checkInCode = generateCheckInCode(customerId, referenceResult.bookingRef);

    // Create QR code data with signature
    const qrData = createQRCodeData(
      referenceResult.bookingRef,
      checkInCode,
      customerId,
      partySize,
      bookingDate
    );

    const result: BookingReference = {
      bookingRef: referenceResult.bookingRef,
      checkInCode,
      qrData,
      isUnique: true,
      generationAttempts: referenceResult.generationAttempts
    };

    // Log reference generation for audit
    await logReferenceGeneration(result, {
      customerId,
      bookingDate,
      partySize,
      tableCount,
      isVip,
      eventType
    });

    return NextResponse.json(result);

  } catch (error) {
    console.error('Error generating booking reference:', error);
    return NextResponse.json(
      { error: 'Failed to generate booking reference' },
      { status: 500 }
    );
  }
}

async function generateUniqueBookingReference(
  bookingDate: string, 
  customerId: string, 
  isVip: boolean
): Promise<{ bookingRef: string; isUnique: boolean; generationAttempts: number }> {
  const year = new Date(bookingDate).getFullYear();
  let attempts = 0;

  while (attempts < MAX_GENERATION_ATTEMPTS) {
    attempts++;
    
    // Generate 5-digit number
    let number: number;
    
    if (isVip) {
      // VIP references use higher numbers (80000-99999)
      number = Math.floor(Math.random() * 20000) + 80000;
    } else {
      // Regular references use lower numbers (10000-79999)  
      number = Math.floor(Math.random() * 70000) + 10000;
    }

    const bookingRef = `BRL-${year}-${number.toString().padStart(5, '0')}`;

    // Check uniqueness against database
    const isUnique = await checkReferenceUniqueness(bookingRef);
    
    if (isUnique) {
      return { bookingRef, isUnique: true, generationAttempts: attempts };
    }
  }

  return { bookingRef: '', isUnique: false, generationAttempts: attempts };
}

async function checkReferenceUniqueness(bookingRef: string): Promise<boolean> {
  // Mock database check - would be real Supabase query
  try {
    // Simulate database query delay
    await new Promise(resolve => setTimeout(resolve, 50));

    // Mock: very low chance of collision for demonstration
    const isCollision = Math.random() < 0.001; // 0.1% chance
    return !isCollision;

  } catch (error) {
    console.error('Error checking reference uniqueness:', error);
    return false;
  }
}

function generateCheckInCode(customerId: string, bookingRef: string): string {
  // Create deterministic but secure check-in code
  const combined = `${customerId}-${bookingRef}-${process.env.CHECKIN_SECRET || 'default-secret'}`;
  const hash = crypto.createHash('sha256').update(combined).digest('hex');
  
  // Extract 6 characters and ensure they're alphanumeric (avoiding confusing characters)
  const chars = 'ABCDEFGHIJKLMNPQRSTUVWXYZ123456789'; // Removed O, 0 for clarity
  let code = '';
  
  for (let i = 0; i < CHECKIN_CODE_LENGTH; i++) {
    const index = parseInt(hash.substr(i * 2, 2), 16) % chars.length;
    code += chars[index];
  }
  
  return code;
}

function createQRCodeData(
  bookingRef: string,
  checkInCode: string,
  customerId: string,
  partySize: number,
  bookingDate: string
) {
  const now = new Date();
  const validUntil = new Date(bookingDate);
  validUntil.setDate(validUntil.getDate() + 1); // Valid until day after booking

  // Create data to be signed
  const dataToSign = {
    bookingRef,
    checkInCode,
    customerId,
    partySize,
    generatedAt: now.toISOString(),
    validUntil: validUntil.toISOString()
  };

  // Create encrypted signature
  const signature = createEncryptedSignature(dataToSign);

  return {
    ...dataToSign,
    encryptedSignature: signature
  };
}

function createEncryptedSignature(data: Record<string, any>): string {
  const secret = process.env.QR_SIGNING_SECRET || 'default-qr-secret';
  const dataString = JSON.stringify(data);
  
  return crypto
    .createHmac('sha256', secret)
    .update(dataString)
    .digest('hex')
    .substring(0, 16); // Truncate for QR code efficiency
}

async function logReferenceGeneration(
  reference: BookingReference,
  bookingDetails: Record<string, any>
): Promise<void> {
  try {
    // Mock audit logging - would be real database insert
    const logEntry = {
      bookingRef: reference.bookingRef,
      checkInCode: reference.checkInCode,
      customerId: bookingDetails.customerId,
      generationAttempts: reference.generationAttempts,
      generatedAt: new Date().toISOString(),
      bookingDetails,
      ipAddress: 'system', // Would extract from request in real implementation
      userAgent: 'booking-api'
    };

    // In real implementation, would insert to audit_log table
    console.log('Reference generated:', logEntry);

  } catch (error) {
    // Don't fail the main operation if logging fails
    console.error('Failed to log reference generation:', error);
  }
}

// GET endpoint to validate a booking reference
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const bookingRef = searchParams.get('ref');
    const checkInCode = searchParams.get('code');

    if (!bookingRef) {
      return NextResponse.json(
        { error: 'Booking reference is required' },
        { status: 400 }
      );
    }

    // Validate reference format
    if (!bookingRef.match(/^BRL-\d{4}-\d{5}$/)) {
      return NextResponse.json({
        isValid: false,
        error: 'Invalid booking reference format'
      });
    }

    // Mock validation - would check against database
    const isValid = await validateBookingReference(bookingRef, checkInCode);
    
    return NextResponse.json({
      isValid,
      bookingRef,
      checkInCode: checkInCode || null,
      validatedAt: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error validating booking reference:', error);
    return NextResponse.json(
      { error: 'Failed to validate booking reference' },
      { status: 500 }
    );
  }
}

async function validateBookingReference(
  bookingRef: string, 
  checkInCode?: string | null
): Promise<boolean> {
  try {
    // Simulate database lookup
    await new Promise(resolve => setTimeout(resolve, 200));

    // Mock validation logic
    // In real implementation, would query bookings table
    
    // Basic format validation passed, assume valid for demo
    // Check-in code validation if provided
    if (checkInCode) {
      // Would validate check-in code matches booking
      return checkInCode.length === CHECKIN_CODE_LENGTH;
    }

    return true;

  } catch (error) {
    console.error('Error in reference validation:', error);
    return false;
  }
}

// PUT endpoint to regenerate reference (for customer service)
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { originalRef, reason, authorizedBy } = body;

    if (!originalRef || !reason || !authorizedBy) {
      return NextResponse.json(
        { error: 'Original reference, reason, and authorized by are required' },
        { status: 400 }
      );
    }

    // Mock regeneration - would update database
    const newRef = await regenerateBookingReference(originalRef, reason, authorizedBy);

    return NextResponse.json({
      originalRef,
      newRef: newRef.bookingRef,
      newCheckInCode: newRef.checkInCode,
      reason,
      authorizedBy,
      regeneratedAt: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error regenerating booking reference:', error);
    return NextResponse.json(
      { error: 'Failed to regenerate booking reference' },
      { status: 500 }
    );
  }
}

async function regenerateBookingReference(
  originalRef: string, 
  reason: string, 
  authorizedBy: string
) {
  // Mock regeneration logic
  const year = new Date().getFullYear();
  const number = Math.floor(Math.random() * 90000) + 10000;
  const newBookingRef = `BRL-${year}-${number}`;
  const newCheckInCode = generateCheckInCode('regenerated', newBookingRef);

  // Log regeneration for audit
  console.log(`Reference regenerated: ${originalRef} -> ${newBookingRef}`, {
    reason,
    authorizedBy,
    timestamp: new Date().toISOString()
  });

  return {
    bookingRef: newBookingRef,
    checkInCode: newCheckInCode
  };
}