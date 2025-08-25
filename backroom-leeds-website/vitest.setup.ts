import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock Browser APIs
vi.stubGlobal('fetch', vi.fn());
vi.stubGlobal('localStorage', {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
});

// Setup for React Testing Library
import '@testing-library/jest-dom/vitest';

// Performance and error tracking mocks
vi.mock('@sentry/nextjs', () => ({
  init: vi.fn(),
  captureException: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  useRouter: vi.fn(() => ({
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
  })),
  usePathname: vi.fn(),
  useSearchParams: vi.fn(() => new URLSearchParams()),
}));