import { createMocks } from 'node-mocks-http';
import { faker } from '@faker-js/faker';
import { 
  registerUser, 
  loginUser, 
  resetPassword, 
  isAccountLocked 
} from '@/lib/auth/authentication';
import { createSupabaseClient } from '@/lib/supabase/client';
import { validateUserRole } from '@/lib/auth/roles';

// Mock Supabase client
jest.mock('@/lib/supabase/client', () => ({
  createSupabaseClient: jest.fn(),
}));

// Mock role validation
jest.mock('@/lib/auth/roles', () => ({
  validateUserRole: jest.fn(),
}));

describe('Authentication System', () => {
  // Setup and teardown
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // User Registration Tests
  describe('User Registration', () => {
    it('should successfully register a valid user', async () => {
      const mockSupabase = {
        auth: {
          signUp: jest.fn().mockResolvedValue({
            data: { 
              user: { id: faker.string.uuid() },
              session: null 
            },
            error: null
          })
        }
      };
      (createSupabaseClient as jest.Mock).mockReturnValue(mockSupabase);

      const userData = {
        email: faker.internet.email(),
        password: faker.internet.password({ length: 16, prefix: 'Test1!' }),
        role: 'manager'
      };

      (validateUserRole as jest.Mock).mockReturnValue(true);

      const result = await registerUser(userData);

      expect(result.success).toBe(true);
      expect(result.user).toBeDefined();
      expect(mockSupabase.auth.signUp).toHaveBeenCalledWith({
        email: userData.email,
        password: userData.password,
        options: {
          data: { role: userData.role }
        }
      });
    });

    it('should prevent registration with invalid password', async () => {
      const userData = {
        email: faker.internet.email(),
        password: 'weak', // Too short
        role: 'manager'
      };

      const result = await registerUser(userData);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Password does not meet requirements');
    });

    it('should prevent duplicate email registration', async () => {
      const mockSupabase = {
        auth: {
          signUp: jest.fn().mockResolvedValue({
            data: { user: null, session: null },
            error: { message: 'User already exists' }
          })
        }
      };
      (createSupabaseClient as jest.Mock).mockReturnValue(mockSupabase);

      const userData = {
        email: faker.internet.email(),
        password: faker.internet.password({ length: 16, prefix: 'Test1!' }),
        role: 'manager'
      };

      const result = await registerUser(userData);

      expect(result.success).toBe(false);
      expect(result.error).toContain('User already exists');
    });
  });

  // User Login Tests
  describe('User Login', () => {
    it('should successfully login with valid credentials', async () => {
      const mockSupabase = {
        auth: {
          signInWithPassword: jest.fn().mockResolvedValue({
            data: { 
              user: { 
                id: faker.string.uuid(),
                email: faker.internet.email() 
              },
              session: { access_token: faker.string.uuid() }
            },
            error: null
          })
        }
      };
      (createSupabaseClient as jest.Mock).mockReturnValue(mockSupabase);

      const loginData = {
        email: faker.internet.email(),
        password: faker.internet.password({ length: 16, prefix: 'Test1!' })
      };

      const result = await loginUser(loginData);

      expect(result.success).toBe(true);
      expect(result.session).toBeDefined();
      expect(result.user).toBeDefined();
    });

    it('should prevent login with incorrect credentials', async () => {
      const mockSupabase = {
        auth: {
          signInWithPassword: jest.fn().mockResolvedValue({
            data: { user: null, session: null },
            error: { message: 'Invalid login credentials' }
          })
        }
      };
      (createSupabaseClient as jest.Mock).mockReturnValue(mockSupabase);

      const loginData = {
        email: faker.internet.email(),
        password: 'incorrectPassword'
      };

      const result = await loginUser(loginData);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid login credentials');
    });
  });

  // Account Lockout Tests
  describe('Account Lockout', () => {
    it('should lock account after multiple failed attempts', async () => {
      const email = faker.internet.email();

      // Simulate multiple failed login attempts
      for (let i = 0; i < 6; i++) {
        await loginUser({
          email,
          password: 'incorrectPassword'
        });
      }

      const isLocked = await isAccountLocked(email);
      expect(isLocked).toBe(true);
    });

    it('should allow password reset for locked account', async () => {
      const email = faker.internet.email();
      const newPassword = faker.internet.password({ length: 16, prefix: 'Test1!' });

      const result = await resetPassword(email, newPassword);

      expect(result.success).toBe(true);
      expect(result.message).toContain('Password reset successful');
    });
  });
});