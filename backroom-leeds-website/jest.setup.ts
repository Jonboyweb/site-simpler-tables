import '@testing-library/jest-dom';
import 'jest-axe/extend-expect';

// Global mocks for external dependencies
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(() => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
  })),
  usePathname: jest.fn(() => '/'),
  useSearchParams: jest.fn(() => new URLSearchParams()),
}));

jest.mock('@/lib/supabase/client', () => ({
  createClientComponent: jest.fn(() => ({
    from: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    single: jest.fn(),
  })),
}));

// Performance monitoring setup
global.performance.mark = jest.fn();
global.performance.measure = jest.fn();

// Clean up mocks after each test
afterEach(() => {
  jest.clearAllMocks();
});