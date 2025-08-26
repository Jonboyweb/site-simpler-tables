import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { authOptions } from '@/lib/auth';
import { generateBookingQR, generateLegacyBookingQR, validateBookingForQR } from '@/lib/qr-generation';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verify admin authentication
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!['super_admin', 'manager'].includes(session.user.role)) {
      return NextResponse.json({ 
        error: 'Access denied. Admin privileges required.' 
      }, { status: 403 });
    }

    const bookingId = params.id;
    
    if (!bookingId) {
      return NextResponse.json({ error: 'Booking ID is required' }, { status: 400 });
    }

    const body = await request.json();
    const { format = 'full', includeLegacy = false, useCase = 'email' } = body;

    const supabase = await createServerSupabaseClient();

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
        status
      `)
      .eq('id', bookingId)
      .single();

    if (bookingError || !booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    // Validate booking can have QR code generated
    if (!validateBookingForQR(booking)) {
      return NextResponse.json({ 
        error: 'Booking is not eligible for QR code generation. Must be confirmed with valid details.' 
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

    // Generate QR codes
    const results: any = {
      success: true,
      booking: {
        id: booking.id,
        ref: booking.booking_ref,
        customerName: booking.customer_name,
        partySize: booking.party_size,
        arrivalTime: booking.arrival_time,
        bookingDate: booking.booking_date,
        tables: tables || []
      },
      generatedAt: new Date().toISOString()
    };

    try {
      // Generate modern QR code (JWT-based)
      results.qrCode = await generateBookingQR(booking, tables, format);
      results.format = 'modern';

      // Generate legacy QR code if requested
      if (includeLegacy) {
        results.legacyQrCode = await generateLegacyBookingQR(booking, tables, format);
      }

    } catch (qrError) {
      console.error('QR generation error:', qrError);
      return NextResponse.json({ 
        error: 'Failed to generate QR code', 
        details: qrError instanceof Error ? qrError.message : 'Unknown error'
      }, { status: 500 });
    }

    // Log the QR generation for audit purposes
    try {
      await supabase.from('audit_log').insert({
        action: 'QR_CODE_GENERATED',
        table_name: 'bookings',
        record_id: bookingId,
        admin_user_id: session.user.id,
        new_values: { 
          format,
          useCase,
          includeLegacy,
          generated_at: results.generatedAt
        },
        ip_address: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
        user_agent: request.headers.get('user-agent')
      });
    } catch (auditError) {
      // Don't fail the request if audit logging fails
      console.warn('Failed to log QR generation audit:', auditError);
    }

    return NextResponse.json(results);

  } catch (error) {
    console.error('Error in QR generation API:', error);
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}