import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import QRCode from 'qrcode';
import jwt from 'jsonwebtoken';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const bookingId = params.id;
    
    if (!bookingId) {
      return NextResponse.json({ error: 'Booking ID is required' }, { status: 400 });
    }

    const supabase = await createServerSupabaseClient();

    // Get booking information
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .select(`
        id,
        booking_ref,
        customer_name,
        customer_phone,
        party_size,
        arrival_time,
        booking_date,
        table_ids,
        status
      `)
      .eq('id', bookingId)
      .single();

    if (bookingError || !booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    // Only generate QR codes for confirmed bookings
    if (booking.status !== 'confirmed') {
      return NextResponse.json({ 
        error: 'QR code can only be generated for confirmed bookings' 
      }, { status: 400 });
    }

    // Get table information
    const { data: tables, error: tablesError } = await supabase
      .from('venue_tables')
      .select('id, table_number, floor')
      .in('id', booking.table_ids);

    if (tablesError) {
      console.warn('Could not fetch table information:', tablesError);
    }

    // Create JWT token for secure QR code data
    const checkInToken = jwt.sign({
      bookingId: booking.id,
      tableNumbers: tables?.map(t => t.table_number) || [],
      guestName: booking.customer_name,
      eventDate: booking.booking_date,
      partySize: booking.party_size,
      venueId: 'backroom-leeds'
    }, process.env.NEXTAUTH_SECRET!, { 
      expiresIn: '48h', // Valid for 48 hours (covers booking day + buffer)
      issuer: 'The Backroom Leeds',
      audience: 'booking-checkin'
    });

    // Create QR code data in two formats for backward compatibility
    const legacyQRData = {
      ref: booking.booking_ref,
      table: tables?.[0]?.table_number || 0,
      time: booking.arrival_time,
      size: booking.party_size,
      name: booking.customer_name,
      date: booking.booking_date
    };

    const modernQRData = {
      bookingId: booking.id,
      token: checkInToken,
      venue: 'The Backroom Leeds',
      checkInUrl: `${process.env.NEXTAUTH_URL}/check-in/${checkInToken}`
    };

    // Generate QR code with modern format (JWT-based)
    const qrDataString = JSON.stringify(modernQRData);
    
    const qrOptions = {
      errorCorrectionLevel: 'H' as const, // High correction for busy environments
      type: 'image/png' as const,
      quality: 0.95,
      margin: 3,
      color: {
        dark: '#8B5A2B',      // Speakeasy brown
        light: '#F5F5DC'      // Beige background
      },
      width: 300
    };

    const qrDataURL = await QRCode.toDataURL(qrDataString, qrOptions);

    // Also generate legacy format for fallback
    const legacyQRDataURL = await QRCode.toDataURL(
      JSON.stringify(legacyQRData), 
      qrOptions
    );

    return NextResponse.json({
      success: true,
      qrCode: qrDataURL,
      legacyQrCode: legacyQRDataURL,
      booking: {
        id: booking.id,
        ref: booking.booking_ref,
        customerName: booking.customer_name,
        partySize: booking.party_size,
        arrivalTime: booking.arrival_time,
        bookingDate: booking.booking_date,
        tables: tables || []
      },
      expiresAt: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(), // 48 hours from now
      generatedAt: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error generating QR code:', error);
    
    // Handle JWT errors specifically
    if (error instanceof Error && error.message.includes('secret')) {
      return NextResponse.json({ 
        error: 'Configuration error. Please contact support.' 
      }, { status: 500 });
    }

    return NextResponse.json(
      { error: 'Failed to generate QR code' },
      { status: 500 }
    );
  }
}