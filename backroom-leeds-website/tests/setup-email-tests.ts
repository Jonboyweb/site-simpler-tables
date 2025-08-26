import 'jest-extended';
import { mockDeep } from 'jest-mock-extended';

// Global mocks for email services
jest.mock('@/lib/email/providers/resend', () => mockDeep());
jest.mock('@/lib/email/providers/postmark', () => mockDeep());
jest.mock('@/lib/email/providers/aws-ses', () => mockDeep());

// Global setup for email testing environment
beforeEach(() => {
  // Reset all mocks before each test
  jest.resetAllMocks();
  
  // Configure mock environment variables
  process.env.RESEND_API_KEY = 'mock-resend-key';
  process.env.POSTMARK_API_KEY = 'mock-postmark-key';
  process.env.AWS_SES_ACCESS_KEY = 'mock-aws-access-key';
});

// Optional: Add extended Jest matchers
expect.extend({
  toBeValidEmail(received) {
    const pass = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(received);
    if (pass) {
      return {
        message: () => `expected ${received} not to be a valid email`,
        pass: true
      };
    } else {
      return {
        message: () => `expected ${received} to be a valid email`,
        pass: false
      };
    }
  }
});