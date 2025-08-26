import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { CombinationCheckResult } from '@/types/advanced-booking.types';

// Request validation schema
const combinationCheckSchema = z.object({
  partySize: z.number().min(1).max(20),
  bookingDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  arrivalTime: z.string().regex(/^\d{2}:\d{2}$/),
  preferredTables: z.array(z.number()).optional(),
  floorPreference: z.enum(['upstairs', 'downstairs']).optional()
});

// Table combination configurations
const TABLE_COMBINATIONS = {
  'combo-tables-15-16': {
    id: 'combo-tables-15-16',
    tables: [15, 16],
    minCapacity: 7,
    maxCapacity: 14,
    name: 'Bar-Side Combination',
    description: 'Premium bar-side seating with optimal views',
    setupTimeMinutes: 15,
    combinationFee: 25.00,
    features: ['bar_view', 'premium_location', 'enhanced_service']
  }
} as const;

const COMBINATION_THRESHOLD = 7;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate request
    const validation = combinationCheckSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request parameters', details: validation.error.errors },
        { status: 400 }
      );
    }

    const { partySize, bookingDate, arrivalTime, preferredTables, floorPreference } = validation.data;

    // Check if party size warrants combination
    if (partySize < COMBINATION_THRESHOLD) {
      const result: CombinationCheckResult = {
        shouldCombine: false,
        tables: [],
        totalCapacity: 0,
        notes: `Party size of ${partySize} doesn't require table combination. Individual tables recommended.`
      };
      
      return NextResponse.json(result);
    }

    // Check availability of combinable tables
    const availableCombo = await checkCombinationAvailability(bookingDate, arrivalTime, preferredTables, floorPreference);
    
    if (availableCombo) {
      const result: CombinationCheckResult = {
        shouldCombine: true,
        combinationId: availableCombo.id,
        tables: availableCombo.tables,
        totalCapacity: availableCombo.maxCapacity,
        notes: `${availableCombo.name}: ${availableCombo.description}. Perfect for ${partySize} guests with enhanced seating arrangement.`,
        pricing: {
          basePrice: calculateBasePrice(availableCombo.tables),
          combinationFee: availableCombo.combinationFee,
          totalPrice: calculateBasePrice(availableCombo.tables) + availableCombo.combinationFee
        },
        features: availableCombo.features,
        setupRequired: availableCombo.setupTimeMinutes > 0,
        setupTimeMinutes: availableCombo.setupTimeMinutes
      };
      
      return NextResponse.json(result);
    }

    // No combination available
    const result: CombinationCheckResult = {
      shouldCombine: false,
      tables: [],
      totalCapacity: 0,
      notes: `No suitable table combinations available for ${partySize} guests on ${bookingDate} at ${arrivalTime}. Consider alternative times or individual table booking.`
    };
    
    return NextResponse.json(result);

  } catch (error) {
    console.error('Error checking table combination:', error);
    return NextResponse.json(
      { error: 'Failed to check table combination availability' },
      { status: 500 }
    );
  }
}

async function checkCombinationAvailability(
  bookingDate: string, 
  arrivalTime: string, 
  preferredTables?: number[], 
  floorPreference?: string
) {
  // Mock availability check - would query real database
  try {
    // Simulate database query delay
    await new Promise(resolve => setTimeout(resolve, 500));

    // Check if preferred tables include combinable ones
    const combo = TABLE_COMBINATIONS['combo-tables-15-16'];
    
    // If floor preference is specified and doesn't match, return null
    if (floorPreference === 'upstairs') {
      return null; // Tables 15&16 are downstairs
    }

    // If specific tables are preferred and don't include combinable ones, return null
    if (preferredTables && preferredTables.length > 0) {
      const hasComboTables = combo.tables.some(table => preferredTables.includes(table));
      if (!hasComboTables) {
        return null;
      }
    }

    // Mock availability check based on date/time
    const isWeekend = new Date(bookingDate).getDay() >= 5;
    const isPeakTime = arrivalTime >= '19:00' && arrivalTime <= '21:30';
    
    // Higher chance of unavailability during peak times
    const unavailabilityChance = isPeakTime && isWeekend ? 0.3 : 0.1;
    const isAvailable = Math.random() > unavailabilityChance;

    return isAvailable ? combo : null;

  } catch (error) {
    console.error('Error checking combination availability:', error);
    return null;
  }
}

function calculateBasePrice(tables: number[]): number {
  // Mock pricing calculation based on table numbers
  const baseTablePrice = 50.00; // Base price per table
  const premiumMultiplier = tables.some(t => [13, 14, 15, 16].includes(t)) ? 1.2 : 1.0;
  
  return tables.length * baseTablePrice * premiumMultiplier;
}

export async function GET(request: NextRequest) {
  // Get all available combinations for informational purposes
  try {
    const combinations = Object.values(TABLE_COMBINATIONS).map(combo => ({
      id: combo.id,
      name: combo.name,
      description: combo.description,
      tables: combo.tables,
      capacity: {
        min: combo.minCapacity,
        max: combo.maxCapacity
      },
      features: combo.features,
      setupTimeMinutes: combo.setupTimeMinutes,
      combinationFee: combo.combinationFee
    }));

    return NextResponse.json({
      combinations,
      threshold: COMBINATION_THRESHOLD,
      totalAvailable: combinations.length
    });

  } catch (error) {
    console.error('Error fetching combinations:', error);
    return NextResponse.json(
      { error: 'Failed to fetch combination information' },
      { status: 500 }
    );
  }
}