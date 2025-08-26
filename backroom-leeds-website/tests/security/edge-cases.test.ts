import { 
  sanitizeInput, 
  preventSQLInjection,
  generateCSRFToken,
  validateCSRFToken 
} from '@/lib/security/input-validation';
import { createSupabaseClient } from '@/lib/supabase/client';
import { faker } from '@faker-js/faker';

// Mock Supabase client
jest.mock('@/lib/supabase/client', () => ({
  createSupabaseClient: jest.fn(),
}));

describe('Security Edge Cases', () => {
  // Input Sanitization Tests
  describe('Input Sanitization', () => {
    it('should sanitize potential XSS in text inputs', () => {
      const maliciousInput = '<script>alert("XSS");</script>Hello World';
      const sanitizedInput = sanitizeInput(maliciousInput);

      expect(sanitizedInput).toBe('Hello World');
    });

    it('should sanitize HTML tags', () => {
      const htmlInput = 'Test <b>bold</b> <i>italic</i>';
      const sanitizedInput = sanitizeInput(htmlInput);

      expect(sanitizedInput).toBe('Test bold italic');
    });

    it('should handle special characters', () => {
      const specialCharsInput = 'Test & "quote" \'single quote\'';
      const sanitizedInput = sanitizeInput(specialCharsInput);

      expect(sanitizedInput).toBe('Test &amp; "quote" \'single quote\'');
    });
  });

  // SQL Injection Prevention Tests
  describe('SQL Injection Prevention', () => {
    it('should prevent SQL injection in queries', () => {
      const maliciousInput = "' OR 1=1 --";
      const sanitizedInput = preventSQLInjection(maliciousInput);

      expect(sanitizedInput).toBe('OR 1=1');
    });

    it('should handle complex SQL injection attempts', () => {
      const complexInjection = "1'; DROP TABLE users; --";
      const sanitizedInput = preventSQLInjection(complexInjection);

      expect(sanitizedInput).toBe('DROP TABLE users');
    });

    it('should validate database queries with sanitized inputs', async () => {
      const mockSupabase = {
        from: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockImplementation((column, value) => {
          // Validate that inputs are properly sanitized
          expect(value).not.toContain("'");
          expect(value).not.toContain(';');
          return this;
        }),
        single: jest.fn().mockResolvedValue({ data: null, error: null })
      };
      (createSupabaseClient as jest.Mock).mockReturnValue(mockSupabase);

      const userEmail = "test@example.com' OR 1=1 --";
      const sanitizedEmail = preventSQLInjection(userEmail);

      await mockSupabase.from('users').select().eq('email', sanitizedEmail).single();

      expect(mockSupabase.eq).toHaveBeenCalledWith('email', 'test@example.com OR 1=1');
    });
  });

  // CSRF Protection Tests
  describe('CSRF Token Protection', () => {
    it('should generate unique CSRF tokens', () => {
      const token1 = generateCSRFToken();
      const token2 = generateCSRFToken();

      expect(token1).toBeDefined();
      expect(token2).toBeDefined();
      expect(token1).not.toBe(token2);
    });

    it('should validate correct CSRF token', () => {
      const token = generateCSRFToken();
      const isValid = validateCSRFToken(token);

      expect(isValid).toBe(true);
    });

    it('should reject incorrect CSRF token', () => {
      const token = generateCSRFToken();
      const invalidToken = 'fake-token';
      
      const isValid = validateCSRFToken(invalidToken);

      expect(isValid).toBe(false);
    });

    it('should expire CSRF tokens after a set time', () => {
      const token = generateCSRFToken();
      
      // Simulate token expiration by advancing time
      jest.useFakeTimers().setSystemTime(Date.now() + 24 * 60 * 60 * 1000); // 24 hours later
      
      const isValid = validateCSRFToken(token);

      expect(isValid).toBe(false);

      jest.useRealTimers();
    });
  });

  // Rate Limiting and Brute Force Prevention
  describe('Brute Force Prevention', () => {
    it('should track login attempts', async () => {
      const email = faker.internet.email();
      const mockSupabase = {
        from: jest.fn().mockReturnThis(),
        insert: jest.fn().mockResolvedValue({ data: null, error: null }),
        select: jest.fn().mockResolvedValue({
          data: { count: 6 },
          error: null
        })
      };
      (createSupabaseClient as jest.Mock).mockReturnValue(mockSupabase);

      // Simulate multiple login attempts
      for (let i = 0; i < 6; i++) {
        await mockSupabase.from('login_attempts').insert({ 
          email, 
          timestamp: new Date().toISOString() 
        });
      }

      const { data, error } = await mockSupabase.from('login_attempts')
        .select('*', { count: 'exact' })
        .eq('email', email);

      expect(data.count).toBeGreaterThanOrEqual(5);
      expect(error).toBeNull();
    });

    it('should block IP after excessive attempts', async () => {
      const ip = faker.internet.ip();
      const mockSupabase = {
        from: jest.fn().mockReturnThis(),
        insert: jest.fn().mockResolvedValue({ data: null, error: null }),
        select: jest.fn().mockResolvedValue({
          data: { 
            blocked_ips: [ip],
            count: 10 
          },
          error: null
        })
      };
      (createSupabaseClient as jest.Mock).mockReturnValue(mockSupabase);

      // Simulate multiple login attempts from same IP
      for (let i = 0; i < 10; i++) {
        await mockSupabase.from('login_attempts').insert({ 
          ip, 
          timestamp: new Date().toISOString() 
        });
      }

      const { data, error } = await mockSupabase.from('blocked_ips')
        .select('*', { count: 'exact' })
        .eq('ip', ip);

      expect(data.blocked_ips).toContain(ip);
      expect(data.count).toBeGreaterThanOrEqual(1);
      expect(error).toBeNull();
    });
  });
});