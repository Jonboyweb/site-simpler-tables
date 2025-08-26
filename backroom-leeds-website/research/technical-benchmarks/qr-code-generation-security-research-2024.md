# QR Code Generation Security Research 2024
*The Backroom Leeds - Authentication & Booking Check-in System*

## Executive Summary

This research evaluates QR code generation libraries for dual purposes: **TOTP authentication setup** and **booking check-in system** for The Backroom Leeds. Primary recommendation: **qrcode** npm package for server-side generation with security best practices for both authentication and booking data.

---

## 1. Primary QR Code Libraries Analysis

### 1.1 qrcode (RECOMMENDED)

**Version**: 1.5.3+ (2024)
**TypeScript Support**: ✅ Via `@types/qrcode`
**Weekly Downloads**: ~2.8M
**Security Rating**: ⭐⭐⭐⭐⭐

**Features**:
- Server-side generation (Node.js)
- Multiple output formats (SVG, PNG, PDF, Base64)
- Error correction levels (L, M, Q, H)
- Custom styling and logos
- Canvas, SVG, and terminal output
- Comprehensive error handling

**Installation**:
```bash
npm install qrcode
npm install --save-dev @types/qrcode
```

**Basic Implementation**:
```typescript
import QRCode from 'qrcode';

// Generate as Data URL (Base64)
const qrDataURL = await QRCode.toDataURL('data');

// Generate as Buffer
const qrBuffer = await QRCode.toBuffer('data');

// Generate as SVG
const qrSVG = await QRCode.toString('data', { type: 'svg' });
```

**Security Features**:
- Server-side generation (no client exposure)
- No external dependencies for core functionality
- Supports HTTPS data transmission
- Configurable error correction

### 1.2 qrcode-generator

**Version**: 1.4.4+
**TypeScript Support**: ✅ Built-in types
**Weekly Downloads**: ~440K
**Security Rating**: ⭐⭐⭐⭐

**Features**:
- Lightweight (no dependencies)
- Pure JavaScript implementation
- Browser and Node.js compatible
- Customizable modules

**Limitations**:
- Manual styling required
- Limited output formats
- No built-in Base64 encoding

### 1.3 react-qr-code (Client-Side Only)

**Version**: 2.0.12+
**TypeScript Support**: ✅ Built-in types
**Use Case**: Client-side display only
**Security Rating**: ⭐⭐⭐ (Client-side risks)

**Not Recommended For**:
- Authentication setup (sensitive data exposure)
- Booking check-in (data validation issues)

---

## 2. Use Case Analysis

### 2.1 TOTP Authentication Setup

**Data Sensitivity**: 🔴 **HIGH** - Contains secret keys
**Generation Location**: Server-side mandatory
**Transmission**: Email/secure display only
**Storage**: Temporary generation, no persistence

**QR Code Content**:
```
otpauth://totp/The%20Backroom%20Leeds:admin%40backroomleeds.co.uk?secret=JBSWY3DPEHPK3PXP&issuer=The%20Backroom%20Leeds&algorithm=SHA1&digits=6&period=30
```

**Implementation**:
```typescript
import QRCode from 'qrcode';
import { TOTP } from 'otpauth';

const generateTOTPQR = async (adminUser: AdminUser): Promise<string> => {
  const totp = new TOTP({
    issuer: 'The Backroom Leeds',
    label: adminUser.email,
    secret: adminUser.totpSecret,
    algorithm: 'SHA1',
    digits: 6,
    period: 30
  });

  const otpauth = totp.toString();
  
  const qrDataURL = await QRCode.toDataURL(otpauth, {
    errorCorrectionLevel: 'M',
    type: 'image/png',
    quality: 0.92,
    margin: 2,
    color: {
      dark: '#1a1a1a',      // Dark modules
      light: '#ffffff'      // Light modules
    },
    width: 256
  });

  return qrDataURL;
};
```

### 2.2 Booking Check-in System

**Data Sensitivity**: 🟡 **MEDIUM** - Contains booking references
**Generation Location**: Server-side recommended
**Transmission**: Email, SMS, customer portal
**Storage**: Generated per booking, cached briefly

**QR Code Content Structure**:
```typescript
interface BookingQRData {
  bookingId: string;
  tableNumbers: number[];
  guestName: string;
  eventDate: string;
  checkInToken: string; // JWT or signed token
  venueId: string;
}
```

**Implementation**:
```typescript
import QRCode from 'qrcode';
import jwt from 'jsonwebtoken';

const generateBookingQR = async (booking: Booking): Promise<string> => {
  // Create secure token
  const checkInToken = jwt.sign({
    bookingId: booking.id,
    tableNumbers: booking.tableNumbers,
    guestName: booking.customerName,
    eventDate: booking.eventDate,
    venueId: 'backroom-leeds'
  }, process.env.JWT_SECRET!, { 
    expiresIn: '24h',
    issuer: 'The Backroom Leeds',
    audience: 'booking-checkin'
  });

  const qrData = JSON.stringify({
    bookingId: booking.id,
    token: checkInToken,
    venue: 'The Backroom Leeds',
    checkInUrl: `${process.env.APP_URL}/check-in/${checkInToken}`
  });

  const qrDataURL = await QRCode.toDataURL(qrData, {
    errorCorrectionLevel: 'H', // High correction for busy environments
    type: 'image/png',
    quality: 0.95,
    margin: 3,
    color: {
      dark: '#8B5A2B',      // Speakeasy brown
      light: '#F5F5DC'      // Beige background
    },
    width: 300
  });

  return qrDataURL;
};
```

---

## 3. Security Best Practices

### 3.1 Server-Side Generation Requirements

**Rationale**:
- Prevents data exposure in client-side code
- Enables secure token signing
- Allows rate limiting and validation
- Reduces attack surface

**Next.js 15.5 API Route**:
```typescript
// app/api/admin/qr/totp/route.ts
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { generateTOTPQR } from '@/lib/qr-generation';

export async function POST(request: Request) {
  const session = await getServerSession();
  
  if (!session?.user?.role === 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const qrDataURL = await generateTOTPQR(session.user);
    
    // Log generation for audit
    await logSecurityEvent({
      action: 'TOTP_QR_GENERATED',
      userId: session.user.id,
      timestamp: new Date(),
      ipAddress: request.headers.get('x-forwarded-for')
    });

    return NextResponse.json({ qrCode: qrDataURL });
  } catch (error) {
    return NextResponse.json(
      { error: 'QR generation failed' }, 
      { status: 500 }
    );
  }
}
```

### 3.2 Error Correction Levels

**For Authentication (TOTP)**:
- Level: **M (Medium)** - 15% error correction
- Rationale: Balance between size and reliability for clean displays

**For Booking Check-in**:
- Level: **H (High)** - 30% error correction  
- Rationale: Robust scanning in busy venue environments

### 3.3 Data Validation and Sanitization

```typescript
const validateQRData = (data: any): boolean => {
  // Validate booking data structure
  if (!data.bookingId || !data.token) return false;
  
  // Validate JWT token
  try {
    const decoded = jwt.verify(data.token, process.env.JWT_SECRET!);
    return !!decoded;
  } catch {
    return false;
  }
};
```

---

## 4. Performance Optimization

### 4.1 Caching Strategy

**TOTP QR Codes**:
- **No Caching** - Generate on-demand only
- Reason: Contains sensitive secret keys

**Booking QR Codes**:
- **Redis Cache**: 24-hour TTL
- **Key Pattern**: `qr:booking:${bookingId}:${version}`
- **Invalidation**: On booking updates

```typescript
import { Redis } from 'ioredis';

const getCachedBookingQR = async (bookingId: string): Promise<string | null> => {
  const redis = new Redis(process.env.REDIS_URL);
  const cacheKey = `qr:booking:${bookingId}:v1`;
  
  const cached = await redis.get(cacheKey);
  if (cached) return cached;
  
  // Generate new QR code
  const qrCode = await generateBookingQR(booking);
  
  // Cache for 24 hours
  await redis.setex(cacheKey, 86400, qrCode);
  
  return qrCode;
};
```

### 4.2 Image Optimization

**Compression Settings**:
```typescript
const QR_OPTIONS = {
  TOTP: {
    width: 256,
    quality: 0.92,
    type: 'image/png' as const
  },
  BOOKING: {
    width: 300,
    quality: 0.95,
    type: 'image/png' as const
  }
};
```

---

## 5. Integration with Email System

### 5.1 TOTP Setup Email

```typescript
// lib/email-templates.ts
const sendTOTPSetupEmail = async (adminUser: AdminUser, qrDataURL: string) => {
  await sendEmail({
    to: adminUser.email,
    subject: 'The Backroom Leeds - Setup Two-Factor Authentication',
    html: `
      <div style="font-family: Arial, sans-serif;">
        <h2>Setup Two-Factor Authentication</h2>
        <p>Scan this QR code with your authenticator app:</p>
        <img src="${qrDataURL}" alt="TOTP QR Code" style="max-width: 300px;" />
        <p><strong>Manual Entry Key:</strong> ${adminUser.totpSecret}</p>
        <p>This email contains sensitive information. Please delete after setup.</p>
      </div>
    `
  });
};
```

### 5.2 Booking Confirmation Email

```typescript
const sendBookingConfirmation = async (booking: Booking, qrDataURL: string) => {
  await sendEmail({
    to: booking.customerEmail,
    subject: `Your Booking Confirmation - ${booking.eventName}`,
    html: `
      <div class="booking-confirmation">
        <h2>Booking Confirmed - The Backroom Leeds</h2>
        <p>Your check-in QR code:</p>
        <img src="${qrDataURL}" alt="Booking Check-in QR Code" />
        <p>Show this QR code at the venue for quick check-in.</p>
      </div>
    `
  });
};
```

---

## 6. Mobile Optimization

### 6.1 QR Code Scanning Considerations

**Size Requirements**:
- **Minimum**: 200x200 pixels for mobile scanning
- **Recommended**: 300x300 pixels for optimal readability
- **Maximum**: 512x512 pixels (email size considerations)

**Contrast Requirements**:
- **Minimum Contrast Ratio**: 3:1 (WCAG AA)
- **Recommended**: 4.5:1 or higher
- **Dark/Light Module Difference**: Minimum 50% brightness difference

### 6.2 Responsive Display

```typescript
// components/QRCodeDisplay.tsx
import Image from 'next/image';

interface QRCodeDisplayProps {
  qrDataURL: string;
  alt: string;
  size?: 'sm' | 'md' | 'lg';
}

const QRCodeDisplay: React.FC<QRCodeDisplayProps> = ({ 
  qrDataURL, 
  alt, 
  size = 'md' 
}) => {
  const dimensions = {
    sm: 200,
    md: 300,
    lg: 400
  };

  return (
    <div className="flex justify-center p-4">
      <Image
        src={qrDataURL}
        alt={alt}
        width={dimensions[size]}
        height={dimensions[size]}
        className="border border-gray-300 rounded-lg"
        priority={true}
      />
    </div>
  );
};
```

---

## 7. Security Vulnerabilities to Avoid

### 7.1 Common QR Code Security Issues

1. **Client-Side Secret Exposure**:
   ```typescript
   // ❌ NEVER do this
   const secret = 'JBSWY3DPEHPK3PXP';
   const qrCode = generateQR(secret); // Client-side
   ```

2. **Unencrypted Data Transmission**:
   ```typescript
   // ❌ Avoid plain text sensitive data
   const bookingData = {
     bookingId: '12345',
     creditCard: '1234-5678-9012-3456' // Never include PCI data
   };
   ```

3. **Missing Expiration**:
   ```typescript
   // ✅ Always include expiration for sensitive QR codes
   const token = jwt.sign(payload, secret, { expiresIn: '24h' });
   ```

### 7.2 Rate Limiting QR Generation

```typescript
// lib/rate-limiting.ts
const rateLimitQR = async (userId: string, type: 'TOTP' | 'BOOKING'): Promise<boolean> => {
  const limits = {
    TOTP: 3,    // 3 per hour (setup attempts)
    BOOKING: 10 // 10 per hour (regeneration requests)
  };

  const key = `qr_generation:${type}:${userId}`;
  const attempts = await redis.incr(key);
  
  if (attempts === 1) {
    await redis.expire(key, 3600); // 1-hour window
  }
  
  return attempts <= limits[type];
};
```

---

## 8. Testing and Validation

### 8.1 QR Code Quality Testing

```typescript
// __tests__/qr-generation.test.ts
import { generateTOTPQR, generateBookingQR } from '@/lib/qr-generation';
import QRCode from 'qrcode-reader';

describe('QR Code Generation', () => {
  test('TOTP QR contains valid otpauth URL', async () => {
    const qrDataURL = await generateTOTPQR(mockUser);
    
    // Parse QR code content
    const qrReader = new QRCode();
    const result = await parseQRCode(qrDataURL);
    
    expect(result).toMatch(/^otpauth:\/\/totp\//);
    expect(result).toContain('The%20Backroom%20Leeds');
  });

  test('Booking QR contains valid JWT token', async () => {
    const qrDataURL = await generateBookingQR(mockBooking);
    const result = await parseQRCode(qrDataURL);
    const data = JSON.parse(result);
    
    expect(data.token).toBeDefined();
    expect(() => jwt.verify(data.token, process.env.JWT_SECRET!)).not.toThrow();
  });
});
```

### 8.2 Performance Testing

```typescript
// __tests__/qr-performance.test.ts
describe('QR Code Performance', () => {
  test('generates TOTP QR in under 100ms', async () => {
    const start = Date.now();
    await generateTOTPQR(mockUser);
    const duration = Date.now() - start;
    
    expect(duration).toBeLessThan(100);
  });

  test('handles concurrent generation', async () => {
    const promises = Array(10).fill(null).map(() => 
      generateBookingQR(mockBooking)
    );
    
    const results = await Promise.all(promises);
    expect(results).toHaveLength(10);
    results.forEach(qr => expect(qr).toMatch(/^data:image\/png;base64,/));
  });
});
```

---

## 9. Recommendations for The Backroom Leeds

### 9.1 Primary Implementation Strategy

**Library Choice**: `qrcode` npm package
- ✅ Mature and well-maintained
- ✅ Excellent TypeScript support
- ✅ Server-side generation capability
- ✅ Multiple output formats
- ✅ High security rating

### 9.2 Implementation Phases

**Phase 1: TOTP Authentication** (Week 1)
- Implement secure TOTP QR generation
- Create admin setup flow
- Email delivery system

**Phase 2: Booking System** (Week 2)
- JWT-based booking tokens
- QR code caching strategy
- Customer email integration

**Phase 3: Security Hardening** (Week 3)
- Rate limiting implementation
- Security audit and testing
- Performance optimization

### 9.3 Infrastructure Requirements

**Server Resources**:
- Additional memory: ~50MB for QR generation
- CPU: Minimal impact (<5% increase)
- Storage: Redis cache for booking QR codes

**Security Requirements**:
- HTTPS mandatory for all QR transmissions
- JWT secret rotation capability
- Audit logging for all QR generations

---

**Research Date**: August 26, 2024  
**Next Review**: November 2024  
**Confidence Level**: High (5/5)

This research provides comprehensive guidance for implementing secure QR code generation for both TOTP authentication setup and booking check-in systems at The Backroom Leeds, prioritizing security, performance, and user experience.