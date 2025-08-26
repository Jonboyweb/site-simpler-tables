import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { authOptions } from '@/lib/auth';
import { z } from 'zod';
import jwt from 'jsonwebtoken';

const qrVerifySchema = z.object({
  qrData: z.string().min(1, 'QR data is required')
});

interface QRCodeData {
  ref: string;           // BRL-2025-XXXXX
  table: number;         
  time: string;         // "23:00"
  size: number;         // party size
  name: string;         // customer name
  date: string;         // booking date
}

interface BookingQRData {
  bookingId: string;
  token: string;
  venue: string;
  checkInUrl: string;
}

export async function POST(request: NextRequest) {
  try {
    // Get session and verify door staff role
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (session.user.role !== 'door_staff') {
      return NextResponse.json({ error: 'Access denied. Door staff role required.' }, { status: 403 });
    }

    const body = await request.json();
    const validation = qrVerifySchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ 
        error: 'Invalid QR data',
        details: validation.error.errors
      }, { status: 400 });
    }

    const { qrData } = validation.data;
    const supabase = await createServerSupabaseClient();

    let parsedData: QRCodeData | BookingQRData;
    let bookingId: string;

    try {
      // Try parsing as JSON (new format with JWT token)
      const jsonData = JSON.parse(qrData) as BookingQRData;
      
      if (jsonData.token && jsonData.bookingId) {
        // Verify JWT token
        const decoded = jwt.verify(jsonData.token, process.env.NEXTAUTH_SECRET!);
        
        if (typeof decoded === 'object' && decoded.bookingId) {
          bookingId = decoded.bookingId;
          parsedData = jsonData;
        } else {
          throw new Error('Invalid token payload');
        }
      } else {
        throw new Error('Invalid JSON structure');
      }
    } catch (jsonError) {
      try {
        // Try parsing as simple QR data (legacy format)
        const simpleData = JSON.parse(qrData) as QRCodeData;
        
        if (simpleData.ref && simpleData.name && simpleData.date) {
          // Find booking by reference and details
          const { data: bookingByRef, error: refError } = await supabase
            .from('bookings')
            .select('id')
            .eq('booking_ref', simpleData.ref)
            .eq('booking_date', simpleData.date)
            .single();

          if (refError || !bookingByRef) {
            return NextResponse.json({ 
              error: 'Booking not found for QR code data' 
            }, { status: 404 });
          }

          bookingId = bookingByRef.id;
          parsedData = simpleData;
        } else {
          throw new Error('Invalid QR data format');
        }
      } catch (simpleError) {
        return NextResponse.json({ 
          error: 'Invalid QR code format. Please use a valid booking QR code.' 
        }, { status: 400 });
      }
    }

    // Get booking information
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .select(`
        id,
        booking_ref,
        customer_name,
        customer_phone,
        customer_email,
        party_size,
        arrival_time,
        booking_date,
        table_ids,
        status,
        checked_in_at,
        special_requests,
        drinks_package
      `)
      .eq('id', bookingId)
      .single();

    if (bookingError || !booking) {
      return NextResponse.json({ 
        error: 'Booking not found' 
      }, { status: 404 });
    }

    // Verify QR data matches booking (for legacy format)
    if ('ref' in parsedData) {
      if (booking.booking_ref !== parsedData.ref) {
        return NextResponse.json({ 
          error: 'QR code booking reference does not match' 
        }, { status: 400 });
      }

      if (booking.customer_name.toLowerCase() !== parsedData.name.toLowerCase()) {
        return NextResponse.json({ 
          error: 'QR code customer name does not match' 
        }, { status: 400 });
      }

      if (booking.booking_date !== parsedData.date) {
        return NextResponse.json({ 
          error: 'QR code date does not match' 
        }, { status: 400 });
      }
    }

    // Verify booking is for today
    const today = new Date().toISOString().split('T')[0];
    if (booking.booking_date !== today) {
      return NextResponse.json({ 
        error: 'QR code is not valid for today' 
      }, { status: 400 });
    }

    // Check if already checked in
    if (booking.status === 'arrived' || booking.checked_in_at) {
      return NextResponse.json({ 
        error: 'Customer already checked in',
        checkedInAt: booking.checked_in_at,
        booking: {
          bookingRef: booking.booking_ref,
          customerName: booking.customer_name,
          partySize: booking.party_size,
          status: booking.status
        }
      }, { status: 409 });
    }

    // Verify booking status is confirmed
    if (booking.status !== 'confirmed') {
      return NextResponse.json({ 
        error: `Cannot check in booking with status: ${booking.status}` 
      }, { status: 400 });
    }

    // Get table information
    const { data: tables, error: tablesError } = await supabase
      .from('venue_tables')
      .select('id, table_number, floor, capacity_min, capacity_max')
      .in('id', booking.table_ids);

    if (tablesError) {
      console.warn('Could not fetch table information:', tablesError);
    }

    // Return verified booking data for check-in confirmation
    return NextResponse.json({
      success: true,
      verified: true,
      booking: {
        id: booking.id,
        bookingRef: booking.booking_ref,
        customerName: booking.customer_name,
        customerPhone: booking.customer_phone,
        customerEmail: booking.customer_email,
        partySize: booking.party_size,
        arrivalTime: booking.arrival_time,
        tableIds: booking.table_ids,
        tables: tables || [],
        hasSpecialRequests: booking.special_requests && Object.keys(booking.special_requests).length > 0,
        isDrinksPackage: booking.drinks_package && Object.keys(booking.drinks_package).length > 0,
        specialRequests: booking.special_requests,
        drinksPackage: booking.drinks_package
      },
      qrFormat: 'ref' in parsedData ? 'legacy' : 'jwt',
      message: 'QR code verified successfully. Ready for check-in.'
    });

  } catch (error) {
    console.error('Error in QR verify API:', error);
    
    // Handle JWT errors specifically
    if (error instanceof jwt.JsonWebTokenError) {
      return NextResponse.json({ 
        error: 'Invalid or expired QR code token' 
      }, { status: 400 });
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}