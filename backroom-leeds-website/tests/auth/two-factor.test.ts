import { 
  generateTOTPSecret, 
  verifyTOTPToken, 
  generateBackupCodes,
  validateBackupCode
} from '@/lib/auth/two-factor';
import { faker } from '@faker-js/faker';
import speakeasy from 'speakeasy';

describe('Two-Factor Authentication', () => {
  // TOTP Secret Generation Tests
  describe('TOTP Secret Generation', () => {
    it('should generate a valid TOTP secret', () => {
      const secret = generateTOTPSecret();
      
      expect(secret).toBeDefined();
      expect(secret.base32).toBeTruthy();
      expect(secret.otpauth_url).toBeTruthy();
    });
  });

  // TOTP Token Verification Tests
  describe('TOTP Token Verification', () => {
    let testSecret: { base32: string, otpauth_url: string };

    beforeEach(() => {
      testSecret = generateTOTPSecret();
    });

    it('should verify a valid TOTP token', () => {
      // Generate a valid token
      const token = speakeasy.totp({
        secret: testSecret.base32,
        encoding: 'base32'
      });

      const result = verifyTOTPToken(testSecret.base32, token);
      
      expect(result).toBe(true);
    });

    it('should reject an invalid TOTP token', () => {
      const invalidToken = '123456';

      const result = verifyTOTPToken(testSecret.base32, invalidToken);
      
      expect(result).toBe(false);
    });

    it('should handle token time window', () => {
      // Test tokens from adjacent time windows
      const currentToken = speakeasy.totp({
        secret: testSecret.base32,
        encoding: 'base32'
      });

      // Simulate a token from 30 seconds ago
      const pastToken = speakeasy.totp({
        secret: testSecret.base32,
        encoding: 'base32',
        time: Math.floor(Date.now() / 1000) - 30
      });

      const currentResult = verifyTOTPToken(testSecret.base32, currentToken);
      const pastResult = verifyTOTPToken(testSecret.base32, pastToken);
      
      expect(currentResult).toBe(true);
      expect(pastResult).toBe(true);
    });
  });

  // Backup Codes Tests
  describe('Backup Codes', () => {
    it('should generate secure backup codes', () => {
      const backupCodes = generateBackupCodes();
      
      expect(backupCodes).toHaveLength(5);
      backupCodes.forEach(code => {
        expect(code).toMatch(/^[A-Z0-9]{8}$/);
      });
    });

    it('should validate a valid backup code', () => {
      const backupCodes = generateBackupCodes();
      const validCode = backupCodes[0];

      const result = validateBackupCode(validCode, backupCodes);
      
      expect(result).toBe(true);
    });

    it('should invalidate a used backup code', () => {
      const backupCodes = generateBackupCodes();
      const validCode = backupCodes[0];

      // First validation should succeed
      const firstResult = validateBackupCode(validCode, backupCodes);
      expect(firstResult).toBe(true);

      // Second validation should fail
      const secondResult = validateBackupCode(validCode, backupCodes);
      expect(secondResult).toBe(false);
    });

    it('should reject an invalid backup code', () => {
      const backupCodes = generateBackupCodes();
      const invalidCode = 'INVALIDCD';

      const result = validateBackupCode(invalidCode, backupCodes);
      
      expect(result).toBe(false);
    });
  });

  // Performance Tests
  describe('2FA Performance', () => {
    it('should generate TOTP secret quickly', () => {
      const startTime = performance.now();
      generateTOTPSecret();
      const endTime = performance.now();
      
      const duration = endTime - startTime;
      expect(duration).toBeLessThan(50); // Less than 50ms
    });

    it('should verify TOTP token quickly', () => {
      const secret = generateTOTPSecret();
      const token = speakeasy.totp({
        secret: secret.base32,
        encoding: 'base32'
      });

      const startTime = performance.now();
      verifyTOTPToken(secret.base32, token);
      const endTime = performance.now();
      
      const duration = endTime - startTime;
      expect(duration).toBeLessThan(50); // Less than 50ms
    });
  });
});