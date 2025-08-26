import { 
  hashPassword, 
  verifyPassword, 
  validatePasswordStrength 
} from '@/lib/auth/password-security';
import { faker } from '@faker-js/faker';

describe('Password Security', () => {
  // Password Hashing Tests
  describe('Password Hashing', () => {
    it('should hash password successfully', async () => {
      const password = faker.internet.password({ length: 16, prefix: 'Test1!' });
      
      const hashedPassword = await hashPassword(password);
      
      expect(hashedPassword).toBeDefined();
      expect(hashedPassword).not.toBe(password);
    });

    it('should verify correct password', async () => {
      const password = faker.internet.password({ length: 16, prefix: 'Test1!' });
      const hashedPassword = await hashPassword(password);
      
      const isValid = await verifyPassword(password, hashedPassword);
      
      expect(isValid).toBe(true);
    });

    it('should reject incorrect password', async () => {
      const password = faker.internet.password({ length: 16, prefix: 'Test1!' });
      const hashedPassword = await hashPassword(password);
      
      const isValid = await verifyPassword('wrongPassword', hashedPassword);
      
      expect(isValid).toBe(false);
    });
  });

  // Password Strength Validation Tests
  describe('Password Strength Validation', () => {
    it('should reject passwords shorter than 12 characters', () => {
      const weakPassword = 'Short1!';
      
      const result = validatePasswordStrength(weakPassword);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Password must be at least 12 characters long');
    });

    it('should reject passwords without uppercase letters', () => {
      const weakPassword = 'testpassword1!';
      
      const result = validatePasswordStrength(weakPassword);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Password must contain at least one uppercase letter');
    });

    it('should reject passwords without lowercase letters', () => {
      const weakPassword = 'TESTPASSWORD1!';
      
      const result = validatePasswordStrength(weakPassword);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Password must contain at least one lowercase letter');
    });

    it('should reject passwords without numbers', () => {
      const weakPassword = 'TestPassword!';
      
      const result = validatePasswordStrength(weakPassword);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Password must contain at least one number');
    });

    it('should reject passwords without special characters', () => {
      const weakPassword = 'TestPassword123';
      
      const result = validatePasswordStrength(weakPassword);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Password must contain at least one special character');
    });

    it('should accept strong passwords', () => {
      const strongPassword = 'Test1Password!@#';
      
      const result = validatePasswordStrength(strongPassword);
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });

  // Performance Tests for Password Hashing
  describe('Password Hashing Performance', () => {
    it('should hash password within acceptable time', async () => {
      const password = faker.internet.password({ length: 16, prefix: 'Test1!' });
      
      const startTime = performance.now();
      await hashPassword(password);
      const endTime = performance.now();
      
      const duration = endTime - startTime;
      
      expect(duration).toBeLessThan(300); // Less than 300ms
    });

    it('should verify password within acceptable time', async () => {
      const password = faker.internet.password({ length: 16, prefix: 'Test1!' });
      const hashedPassword = await hashPassword(password);
      
      const startTime = performance.now();
      await verifyPassword(password, hashedPassword);
      const endTime = performance.now();
      
      const duration = endTime - startTime;
      
      expect(duration).toBeLessThan(50); // Less than 50ms
    });
  });
});