import jwt from 'jsonwebtoken';
import { generateQRToken, validateQRToken } from '@/lib/qr-system/token-generator';
import { mockBookingData } from '@/tests/mocks/booking-data';

describe('QR Token Generation', () => {
  const SECRET_KEY = process.env.JWT_SECRET || 'test_secret';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('generates a valid JWT token with booking data', () => {
    const token = generateQRToken(mockBookingData);
    expect(token).toBeTruthy();
    
    const decoded = jwt.verify(token, SECRET_KEY) as any;
    expect(decoded.ref).toBe(mockBookingData.ref);
    expect(decoded.table).toBe(mockBookingData.table);
  });

  test('token contains correct expiration', () => {
    const token = generateQRToken(mockBookingData);
    const decoded = jwt.verify(token, SECRET_KEY) as any;
    
    // Check token expiration (48 hours)
    const expiresIn = decoded.exp - decoded.iat;
    expect(expiresIn).toBe(48 * 60 * 60); // 48 hours in seconds
  });

  test('validates a valid QR token', () => {
    const token = generateQRToken(mockBookingData);
    const validationResult = validateQRToken(token);
    
    expect(validationResult.isValid).toBeTruthy();
    expect(validationResult.data.ref).toBe(mockBookingData.ref);
  });

  test('rejects an expired token', () => {
    // Simulate an expired token
    const expiredToken = jwt.sign(
      { ...mockBookingData, exp: Math.floor(Date.now() / 1000) - (48 * 60 * 60) }, 
      SECRET_KEY
    );
    
    const validationResult = validateQRToken(expiredToken);
    expect(validationResult.isValid).toBeFalsy();
    expect(validationResult.error).toBe('Token has expired');
  });

  test('handles invalid token signatures', () => {
    const invalidToken = 'invalid.token.signature';
    const validationResult = validateQRToken(invalidToken);
    
    expect(validationResult.isValid).toBeFalsy();
    expect(validationResult.error).toContain('Invalid token');
  });
});