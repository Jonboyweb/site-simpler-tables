import QRCode from 'qrcode';
import jwt from 'jsonwebtoken';

// QR Code data interfaces
export interface QRCodeData {
  ref: string;           // BRL-2025-XXXXX
  table: number;         
  time: string;         // "23:00"
  size: number;         // party size
  name: string;         // customer name
  date: string;         // booking date
}

export interface BookingQRData {
  bookingId: string;
  token: string;
  venue: string;
  checkInUrl: string;
}

export interface BookingInfo {
  id: string;
  booking_ref: string;
  customer_name: string;
  party_size: number;
  arrival_time: string;
  booking_date: string;
  table_ids: number[];
  status: string;
}

export interface TableInfo {
  id: number;
  table_number: number;
  floor: 'upstairs' | 'downstairs';
}

// QR Code generation options
const QR_OPTIONS = {
  BOOKING: {
    errorCorrectionLevel: 'H' as const, // High correction for busy environments
    type: 'image/png' as const,
    quality: 0.95,
    margin: 3,
    color: {
      dark: '#8B5A2B',      // Speakeasy brown
      light: '#F5F5DC'      // Beige background
    },
    width: 300
  },
  COMPACT: {
    errorCorrectionLevel: 'M' as const,
    type: 'image/png' as const,
    quality: 0.92,
    margin: 2,
    color: {
      dark: '#1a1a1a',
      light: '#ffffff'
    },
    width: 200
  }
};

/**
 * Generate a secure booking QR code with JWT token
 */
export const generateBookingQR = async (
  booking: BookingInfo,
  tables?: TableInfo[],
  format: 'full' | 'compact' = 'full'
): Promise<string> => {
  try {
    if (!process.env.NEXTAUTH_SECRET) {
      throw new Error('JWT secret not configured');
    }

    // Create secure JWT token
    const checkInToken = jwt.sign({
      bookingId: booking.id,
      tableNumbers: tables?.map(t => t.table_number) || [],
      guestName: booking.customer_name,
      eventDate: booking.booking_date,
      partySize: booking.party_size,
      arrivalTime: booking.arrival_time,
      venueId: 'backroom-leeds'
    }, process.env.NEXTAUTH_SECRET, { 
      expiresIn: '48h', // Valid for 48 hours
      issuer: 'The Backroom Leeds',
      audience: 'booking-checkin'
    });

    // Create QR code data
    const qrData: BookingQRData = {
      bookingId: booking.id,
      token: checkInToken,
      venue: 'The Backroom Leeds',
      checkInUrl: `${process.env.NEXTAUTH_URL || 'https://backroomleeds.co.uk'}/check-in/${checkInToken}`
    };

    const qrDataString = JSON.stringify(qrData);
    const options = format === 'compact' ? QR_OPTIONS.COMPACT : QR_OPTIONS.BOOKING;

    const qrDataURL = await QRCode.toDataURL(qrDataString, options);
    return qrDataURL;

  } catch (error) {
    console.error('Error generating booking QR code:', error);
    throw new Error('Failed to generate QR code');
  }
};

/**
 * Generate a legacy format QR code for backward compatibility
 */
export const generateLegacyBookingQR = async (
  booking: BookingInfo,
  tables?: TableInfo[],
  format: 'full' | 'compact' = 'full'
): Promise<string> => {
  try {
    const legacyData: QRCodeData = {
      ref: booking.booking_ref,
      table: tables?.[0]?.table_number || 0,
      time: booking.arrival_time,
      size: booking.party_size,
      name: booking.customer_name,
      date: booking.booking_date
    };

    const qrDataString = JSON.stringify(legacyData);
    const options = format === 'compact' ? QR_OPTIONS.COMPACT : QR_OPTIONS.BOOKING;

    const qrDataURL = await QRCode.toDataURL(qrDataString, options);
    return qrDataURL;

  } catch (error) {
    console.error('Error generating legacy QR code:', error);
    throw new Error('Failed to generate legacy QR code');
  }
};

/**
 * Verify and decode a booking QR code token
 */
export const verifyBookingQRToken = (token: string): any => {
  try {
    if (!process.env.NEXTAUTH_SECRET) {
      throw new Error('JWT secret not configured');
    }

    const decoded = jwt.verify(token, process.env.NEXTAUTH_SECRET, {
      issuer: 'The Backroom Leeds',
      audience: 'booking-checkin'
    });

    return decoded;

  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new Error('QR code has expired');
    } else if (error instanceof jwt.JsonWebTokenError) {
      throw new Error('Invalid QR code');
    } else {
      console.error('QR token verification error:', error);
      throw new Error('Failed to verify QR code');
    }
  }
};

/**
 * Parse QR code data (handles both modern and legacy formats)
 */
export const parseQRCodeData = (qrData: string): QRCodeData | BookingQRData => {
  try {
    const parsed = JSON.parse(qrData);
    
    // Check if it's modern format (has token)
    if (parsed.token && parsed.bookingId) {
      return parsed as BookingQRData;
    }
    
    // Check if it's legacy format (has ref)
    if (parsed.ref && parsed.name && parsed.date) {
      return parsed as QRCodeData;
    }
    
    throw new Error('Unknown QR code format');

  } catch (error) {
    console.error('Error parsing QR code data:', error);
    throw new Error('Invalid QR code format');
  }
};

/**
 * Generate QR code for email inclusion (Base64 embedded)
 */
export const generateEmailQR = async (
  booking: BookingInfo,
  tables?: TableInfo[]
): Promise<string> => {
  const qrDataURL = await generateBookingQR(booking, tables, 'compact');
  
  // Return data URL suitable for email embedding
  return qrDataURL;
};

/**
 * Generate QR code options for different use cases
 */
export const getQROptions = (useCase: 'email' | 'print' | 'mobile' | 'display') => {
  switch (useCase) {
    case 'email':
      return {
        ...QR_OPTIONS.COMPACT,
        width: 200,
        margin: 2
      };
    
    case 'print':
      return {
        ...QR_OPTIONS.BOOKING,
        width: 400,
        margin: 4,
        quality: 1.0
      };
    
    case 'mobile':
      return {
        ...QR_OPTIONS.COMPACT,
        width: 250,
        margin: 2
      };
    
    case 'display':
    default:
      return QR_OPTIONS.BOOKING;
  }
};

/**
 * Cache key generator for QR codes
 */
export const generateQRCacheKey = (
  bookingId: string, 
  format: string = 'full',
  version: number = 1
): string => {
  return `qr:booking:${bookingId}:${format}:v${version}`;
};

/**
 * Validate booking data before QR generation
 */
export const validateBookingForQR = (booking: BookingInfo): boolean => {
  return !!(
    booking.id &&
    booking.booking_ref &&
    booking.customer_name &&
    booking.party_size > 0 &&
    booking.arrival_time &&
    booking.booking_date &&
    booking.status === 'confirmed'
  );
};

export default {
  generateBookingQR,
  generateLegacyBookingQR,
  verifyBookingQRToken,
  parseQRCodeData,
  generateEmailQR,
  getQROptions,
  generateQRCacheKey,
  validateBookingForQR
};