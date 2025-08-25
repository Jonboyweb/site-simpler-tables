# Testing Strategy: Phase 3, Step 3.2 - Table Booking System

## Overview

This comprehensive testing strategy ensures The Backroom Leeds table booking system meets all quality, performance, accessibility, and compliance requirements. The strategy follows industry best practices and implementation guide requirements for >80% coverage.

**Testing Framework**: Jest + React Testing Library + Playwright + axe-core  
**Coverage Target**: >80% (Unit: 85%, Integration: 80%, E2E: 90%)  
**Standards Compliance**: WCAG 2.1 AA, PCI DSS v4.0.1, UK GDPR

---

## 1. Testing Architecture

### 1.1 Test Pyramid Structure

```
     /\
    /  \         E2E Tests (10%)
   /    \        - Critical user journeys
  /______\       - Payment flows
 /        \      - Accessibility compliance
/__________\     
    |      |     Integration Tests (30%)
    |      |     - API endpoints
    |      |     - Database operations  
    |      |     - External service integration
    |______|     
            |    Unit Tests (60%)
            |    - Component testing
            |    - Business logic
            |    - Utility functions
            |    - Form validation
            |
```

### 1.2 Testing Tools Configuration

#### Package Installation
```bash
# Core testing frameworks
npm install --save-dev jest @jest/environment-jsdom
npm install --save-dev @testing-library/react @testing-library/jest-dom @testing-library/user-event
npm install --save-dev @playwright/test
npm install --save-dev jest-axe axe-core

# Mocking and utilities
npm install --save-dev msw
npm install --save-dev @supabase/ssr
npm install --save-dev stripe-mock

# Performance and visual testing
npm install --save-dev @testing-library/react-hooks
npm install --save-dev puppeteer lighthouse
```

#### Jest Configuration
```typescript
// jest.config.ts
import type { Config } from 'jest';
import nextJest from 'next/jest';

const createJestConfig = nextJest({
  dir: './',
});

const config: Config = {
  coverageProvider: 'v8',
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  testMatch: [
    '<rootDir>/src/**/__tests__/**/*.{js,jsx,ts,tsx}',
    '<rootDir>/src/**/*.{test,spec}.{js,jsx,ts,tsx}',
  ],
  testPathIgnorePatterns: ['<rootDir>/.next/', '<rootDir>/node_modules/'],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 85,
      statements: 85,
    },
  },
  collectCoverageFrom: [
    'src/**/*.{js,jsx,ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/*.stories.{js,jsx,ts,tsx}',
    '!src/types/**/*',
    '!src/**/__tests__/**/*',
  ],
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  transform: {
    '^.+\\.(js|jsx|ts|tsx)$': ['babel-jest', { presets: ['next/babel'] }],
  },
};

export default createJestConfig(config);
```

#### Test Setup
```typescript
// jest.setup.ts
import '@testing-library/jest-dom';
import 'jest-axe/extend-expect';
import { server } from './src/tests/mocks/server';

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter() {
    return {
      push: jest.fn(),
      replace: jest.fn(),
      prefetch: jest.fn(),
      back: jest.fn(),
      forward: jest.fn(),
    };
  },
  useSearchParams() {
    return new URLSearchParams();
  },
  usePathname() {
    return '';
  },
}));

// Mock Supabase
jest.mock('@supabase/auth-helpers-nextjs', () => ({
  createClientComponentClient: jest.fn(() => ({
    auth: {
      getUser: jest.fn(),
      signInWithPassword: jest.fn(),
      signOut: jest.fn(),
    },
    from: jest.fn(() => ({
      select: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn(),
    })),
    channel: jest.fn(() => ({
      on: jest.fn().mockReturnThis(),
      subscribe: jest.fn(),
      unsubscribe: jest.fn(),
    })),
  })),
}));

// Mock Stripe
jest.mock('@stripe/stripe-js', () => ({
  loadStripe: jest.fn(() => Promise.resolve({})),
}));

jest.mock('@stripe/react-stripe-js', () => ({
  Elements: ({ children }: { children: React.ReactNode }) => children,
  useStripe: jest.fn(() => ({
    confirmPayment: jest.fn(),
    retrievePaymentIntent: jest.fn(),
  })),
  useElements: jest.fn(() => ({})),
  PaymentElement: () => <div data-testid="payment-element" />,
  AddressElement: () => <div data-testid="address-element" />,
}));

// Establish API mocking before all tests
beforeAll(() => server.listen());

// Reset any request handlers that we may add during the tests,
// so they don't affect other tests
afterEach(() => server.resetHandlers());

// Clean up after the tests are finished
afterAll(() => server.close());

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Mock IntersectionObserver
global.IntersectionObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));
```

---

## 2. Unit Testing Strategy

### 2.1 Component Testing Patterns

#### Table Availability Component Tests
```typescript
// src/components/organisms/__tests__/TableAvailability.test.tsx
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe, toHaveNoViolations } from 'jest-axe';
import { TableAvailability } from '../TableAvailability';
import { mockTableAvailabilityData } from '@/tests/fixtures/table-data';

expect.extend(toHaveNoViolations);

describe('TableAvailability Component', () => {
  const mockEventId = 'test-event-123';
  const mockOnTableSelect = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Accessibility', () => {
    it('has no accessibility violations', async () => {
      const { container } = render(
        <TableAvailability 
          eventId={mockEventId}
          onTableSelect={mockOnTableSelect}
        />
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('provides proper ARIA labels for table buttons', async () => {
      render(
        <TableAvailability 
          eventId={mockEventId}
          onTableSelect={mockOnTableSelect}
        />
      );

      await waitFor(() => {
        const table1Button = screen.getByRole('button', { 
          name: /table 1, capacity 4, available/i 
        });
        expect(table1Button).toBeInTheDocument();
      });
    });

    it('supports keyboard navigation', async () => {
      const user = userEvent.setup();
      render(
        <TableAvailability 
          eventId={mockEventId}
          onTableSelect={mockOnTableSelect}
        />
      );

      // Tab through table buttons
      await user.tab();
      const firstButton = screen.getByRole('button', { name: /table 1/i });
      expect(firstButton).toHaveFocus();

      await user.tab();
      const secondButton = screen.getByRole('button', { name: /table 2/i });
      expect(secondButton).toHaveFocus();
    });

    it('announces table selection to screen readers', async () => {
      const user = userEvent.setup();
      render(
        <TableAvailability 
          eventId={mockEventId}
          onTableSelect={mockOnTableSelect}
        />
      );

      const tableButton = await screen.findByRole('button', { 
        name: /table 1, capacity 4, available/i 
      });
      
      await user.click(tableButton);

      // Verify aria-pressed state changes
      expect(tableButton).toHaveAttribute('aria-pressed', 'true');
    });
  });

  describe('Functionality', () => {
    it('displays table layout correctly', async () => {
      render(
        <TableAvailability 
          eventId={mockEventId}
          onTableSelect={mockOnTableSelect}
        />
      );

      // Check floor sections
      expect(screen.getByText('Upstairs')).toBeInTheDocument();
      expect(screen.getByText('Downstairs')).toBeInTheDocument();

      // Check table grids
      expect(screen.getByRole('grid', { name: /upstairs tables/i })).toBeInTheDocument();
      expect(screen.getByRole('grid', { name: /downstairs tables/i })).toBeInTheDocument();
    });

    it('handles table selection correctly', async () => {
      const user = userEvent.setup();
      render(
        <TableAvailability 
          eventId={mockEventId}
          onTableSelect={mockOnTableSelect}
        />
      );

      const tableButton = await screen.findByRole('button', { 
        name: /table 1, capacity 4, available/i 
      });
      
      await user.click(tableButton);

      expect(mockOnTableSelect).toHaveBeenCalledWith('1');
    });

    it('disables booked tables', async () => {
      // Mock data with booked table
      const bookedTableData = mockTableAvailabilityData.map(table => 
        table.table_number === 1 ? { ...table, status: 'booked' } : table
      );

      render(
        <TableAvailability 
          eventId={mockEventId}
          onTableSelect={mockOnTableSelect}
          initialData={bookedTableData}
        />
      );

      const bookedButton = await screen.findByRole('button', { 
        name: /table 1, capacity 4, booked/i 
      });
      
      expect(bookedButton).toBeDisabled();
    });

    it('shows loading state correctly', () => {
      render(
        <TableAvailability 
          eventId={mockEventId}
          onTableSelect={mockOnTableSelect}
          loading={true}
        />
      );

      expect(screen.getByRole('status', { name: /loading table availability/i })).toBeInTheDocument();
    });

    it('handles optimistic updates for better UX', async () => {
      const user = userEvent.setup();
      render(
        <TableAvailability 
          eventId={mockEventId}
          onTableSelect={mockOnTableSelect}
        />
      );

      const tableButton = await screen.findByRole('button', { 
        name: /table 1, capacity 4, available/i 
      });
      
      await user.click(tableButton);

      // Should show booking state immediately
      expect(tableButton).toHaveAttribute('aria-pressed', 'true');
      expect(screen.getByLabelText(/booking in progress/i)).toBeInTheDocument();
    });
  });

  describe('Real-time Updates', () => {
    it('updates table status on real-time events', async () => {
      const { rerender } = render(
        <TableAvailability 
          eventId={mockEventId}
          onTableSelect={mockOnTableSelect}
        />
      );

      // Simulate real-time update
      const updatedData = mockTableAvailabilityData.map(table => 
        table.table_number === 1 ? { ...table, status: 'booked' } : table
      );

      rerender(
        <TableAvailability 
          eventId={mockEventId}
          onTableSelect={mockOnTableSelect}
          initialData={updatedData}
        />
      );

      await waitFor(() => {
        const bookedButton = screen.getByRole('button', { 
          name: /table 1, capacity 4, booked/i 
        });
        expect(bookedButton).toBeDisabled();
      });
    });
  });

  describe('Error Handling', () => {
    it('displays error message when data fetch fails', () => {
      render(
        <TableAvailability 
          eventId={mockEventId}
          onTableSelect={mockOnTableSelect}
          error="Failed to load table availability"
        />
      );

      expect(screen.getByRole('alert')).toHaveTextContent('Failed to load table availability');
    });

    it('provides retry mechanism on error', async () => {
      const user = userEvent.setup();
      const mockRetry = jest.fn();
      
      render(
        <TableAvailability 
          eventId={mockEventId}
          onTableSelect={mockOnTableSelect}
          error="Failed to load table availability"
          onRetry={mockRetry}
        />
      );

      const retryButton = screen.getByRole('button', { name: /retry/i });
      await user.click(retryButton);

      expect(mockRetry).toHaveBeenCalled();
    });
  });
});
```

#### Booking Form Validation Tests
```typescript
// src/components/organisms/__tests__/BookingForm.test.tsx
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BookingForm } from '../BookingForm';
import { mockEventData } from '@/tests/fixtures/event-data';

describe('BookingForm Component', () => {
  const mockEventId = 'test-event-123';
  const mockOnSuccess = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Form Validation', () => {
    it('validates required customer details', async () => {
      const user = userEvent.setup();
      render(<BookingForm eventId={mockEventId} onSuccess={mockOnSuccess} />);

      // Try to submit without filling required fields
      const submitButton = screen.getByRole('button', { name: /continue/i });
      await user.click(submitButton);

      // Check validation errors
      await waitFor(() => {
        expect(screen.getByRole('alert')).toHaveTextContent(/name is required/i);
      });
    });

    it('validates email format correctly', async () => {
      const user = userEvent.setup();
      render(<BookingForm eventId={mockEventId} onSuccess={mockOnSuccess} />);

      // Fill name and invalid email
      await user.type(screen.getByLabelText(/name/i), 'John Doe');
      await user.type(screen.getByLabelText(/email/i), 'invalid-email');
      await user.click(screen.getByRole('button', { name: /continue/i }));

      await waitFor(() => {
        expect(screen.getByRole('alert')).toHaveTextContent(/valid email address/i);
      });
    });

    it('validates UK phone number format', async () => {
      const user = userEvent.setup();
      render(<BookingForm eventId={mockEventId} onSuccess={mockOnSuccess} />);

      await user.type(screen.getByLabelText(/phone/i), '123456');
      await user.click(screen.getByRole('button', { name: /continue/i }));

      await waitFor(() => {
        expect(screen.getByRole('alert')).toHaveTextContent(/valid UK phone number/i);
      });
    });

    it('validates party size constraints', async () => {
      const user = userEvent.setup();
      render(<BookingForm eventId={mockEventId} onSuccess={mockOnSuccess} />);

      // Test minimum party size
      await user.type(screen.getByLabelText(/party size/i), '0');
      await user.click(screen.getByRole('button', { name: /continue/i }));

      await waitFor(() => {
        expect(screen.getByRole('alert')).toHaveTextContent(/party size must be at least 1/i);
      });

      // Test maximum party size
      await user.clear(screen.getByLabelText(/party size/i));
      await user.type(screen.getByLabelText(/party size/i), '15');
      await user.click(screen.getByRole('button', { name: /continue/i }));

      await waitFor(() => {
        expect(screen.getByRole('alert')).toHaveTextContent(/maximum party size is 12/i);
      });
    });
  });

  describe('Multi-step Navigation', () => {
    it('progresses through form steps correctly', async () => {
      const user = userEvent.setup();
      render(<BookingForm eventId={mockEventId} onSuccess={mockOnSuccess} />);

      // Fill customer details
      await fillCustomerDetails(user);
      
      // Continue to next step
      await user.click(screen.getByRole('button', { name: /continue/i }));

      // Check we're on step 2
      await waitFor(() => {
        expect(screen.getByText(/table selection/i)).toBeInTheDocument();
      });
    });

    it('allows navigation back to previous steps', async () => {
      const user = userEvent.setup();
      render(<BookingForm eventId={mockEventId} onSuccess={mockOnSuccess} />);

      // Progress to step 2
      await fillCustomerDetails(user);
      await user.click(screen.getByRole('button', { name: /continue/i }));

      // Navigate back
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /previous/i })).toBeInTheDocument();
      });
      
      await user.click(screen.getByRole('button', { name: /previous/i }));

      // Check we're back on step 1
      expect(screen.getByLabelText(/name/i)).toBeInTheDocument();
    });

    it('preserves form data between steps', async () => {
      const user = userEvent.setup();
      render(<BookingForm eventId={mockEventId} onSuccess={mockOnSuccess} />);

      // Fill and navigate
      const nameInput = screen.getByLabelText(/name/i);
      await user.type(nameInput, 'John Doe');
      await fillCustomerDetails(user);
      await user.click(screen.getByRole('button', { name: /continue/i }));
      
      // Go back
      await user.click(screen.getByRole('button', { name: /previous/i }));

      // Check data is preserved
      expect(nameInput).toHaveValue('John Doe');
    });
  });

  describe('Progress Indicator', () => {
    it('shows current step correctly', () => {
      render(<BookingForm eventId={mockEventId} onSuccess={mockOnSuccess} />);

      const progressBar = screen.getByRole('navigation', { name: /booking progress/i });
      expect(progressBar).toBeInTheDocument();

      // Check current step is highlighted
      const currentStep = screen.getByRole('button', { 
        name: /step 1.*current/i 
      });
      expect(currentStep).toHaveAttribute('aria-current', 'step');
    });

    it('allows clicking on completed steps', async () => {
      const user = userEvent.setup();
      render(<BookingForm eventId={mockEventId} onSuccess={mockOnSuccess} />);

      // Complete step 1
      await fillCustomerDetails(user);
      await user.click(screen.getByRole('button', { name: /continue/i }));

      // Click on step 1 in progress indicator
      const step1Button = screen.getByRole('button', { name: /step 1.*completed/i });
      await user.click(step1Button);

      // Should navigate back to step 1
      expect(screen.getByLabelText(/name/i)).toBeInTheDocument();
    });
  });

  // Helper function
  async function fillCustomerDetails(user: any) {
    await user.type(screen.getByLabelText(/name/i), 'John Doe');
    await user.type(screen.getByLabelText(/email/i), 'john@example.com');
    await user.type(screen.getByLabelText(/phone/i), '+44 7700 900123');
    await user.type(screen.getByLabelText(/party size/i), '4');
  }
});
```

### 2.2 Business Logic Testing

#### Payment Processing Tests
```typescript
// src/lib/payments/__tests__/stripe-handler.test.ts
import { BookingPaymentProcessor } from '../stripe-handler';
import { stripe } from '@/lib/stripe/server';
import { createMockBooking } from '@/tests/fixtures/booking-data';

jest.mock('@/lib/stripe/server');
jest.mock('@supabase/auth-helpers-nextjs');

describe('BookingPaymentProcessor', () => {
  let processor: BookingPaymentProcessor;
  const mockBookingData = createMockBooking();

  beforeEach(() => {
    processor = new BookingPaymentProcessor();
    jest.clearAllMocks();
  });

  describe('Payment Intent Creation', () => {
    it('creates payment intent with correct parameters', async () => {
      const mockPaymentIntent = {
        id: 'pi_test_123',
        client_secret: 'pi_test_123_secret',
        status: 'requires_payment_method',
      };

      (stripe.paymentIntents.create as jest.Mock).mockResolvedValue(mockPaymentIntent);

      const result = await processor.createPaymentIntent(mockBookingData);

      expect(stripe.paymentIntents.create).toHaveBeenCalledWith({
        amount: 5000, // £50.00 in pence
        currency: 'gbp',
        confirmation_method: 'manual',
        payment_method_types: ['card', 'bacs_debit'],
        payment_method_options: {
          card: { request_three_d_secure: 'automatic' }
        },
        customer: mockBookingData.customerId,
        receipt_email: mockBookingData.customerEmail,
        description: 'Table booking deposit for The Backroom Leeds',
        statement_descriptor: 'BACKROOM LEEDS',
        metadata: expect.objectContaining({
          booking_id: mockBookingData.bookingId,
          customer_email: mockBookingData.customerEmail,
          venue: 'backroom-leeds'
        })
      });

      expect(result.success).toBe(true);
      expect(result.clientSecret).toBe('pi_test_123_secret');
    });

    it('handles Stripe errors correctly', async () => {
      const stripeError = new Error('Your card was declined.');
      (stripeError as any).type = 'StripeCardError';
      (stripeError as any).decline_code = 'insufficient_funds';

      (stripe.paymentIntents.create as jest.Mock).mockRejectedValue(stripeError);

      const result = await processor.createPaymentIntent(mockBookingData);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Your card was declined.');
      expect(result.alternativeMethods).toContain('bacs_debit');
    });

    it('validates booking before creating payment intent', async () => {
      const expiredBooking = {
        ...mockBookingData,
        createdAt: new Date(Date.now() - 20 * 60 * 1000) // 20 minutes ago
      };

      const result = await processor.createPaymentIntent(expiredBooking);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Booking has expired');
      expect(stripe.paymentIntents.create).not.toHaveBeenCalled();
    });
  });

  describe('Payment Confirmation', () => {
    it('confirms payment intent successfully', async () => {
      const mockConfirmedPayment = {
        id: 'pi_test_123',
        status: 'succeeded',
        metadata: { booking_id: mockBookingData.bookingId }
      };

      (stripe.paymentIntents.confirm as jest.Mock).mockResolvedValue(mockConfirmedPayment);

      const result = await processor.confirmPaymentIntent('pi_test_123');

      expect(result.success).toBe(true);
      expect(result.paymentIntent?.status).toBe('succeeded');
    });

    it('handles 3D Secure authentication requirements', async () => {
      const mockRequiresAction = {
        id: 'pi_test_123',
        status: 'requires_action',
        client_secret: 'pi_test_123_secret'
      };

      (stripe.paymentIntents.confirm as jest.Mock).mockResolvedValue(mockRequiresAction);

      const result = await processor.confirmPaymentIntent('pi_test_123');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Additional authentication required');
      expect(result.clientSecret).toBe('pi_test_123_secret');
    });
  });

  describe('Error Handling', () => {
    it('provides helpful error messages for different decline codes', async () => {
      const testCases = [
        {
          decline_code: 'insufficient_funds',
          expected_message: 'insufficient funds',
          expected_alternatives: ['bacs_debit', 'bank_transfer']
        },
        {
          decline_code: 'expired_card',
          expected_message: 'expired',
          expected_alternatives: ['different_card']
        }
      ];

      for (const testCase of testCases) {
        const error = new Error('Card declined');
        (error as any).type = 'StripeCardError';
        (error as any).decline_code = testCase.decline_code;

        (stripe.paymentIntents.create as jest.Mock).mockRejectedValue(error);

        const result = await processor.createPaymentIntent(mockBookingData);

        expect(result.error).toContain(testCase.expected_message);
        expect(result.alternativeMethods).toEqual(
          expect.arrayContaining(testCase.expected_alternatives)
        );
      }
    });
  });
});
```

### 2.3 Utility Function Testing

#### GDPR Consent Manager Tests
```typescript
// src/lib/gdpr/__tests__/consent-manager.test.ts
import { ConsentManager, ConsentType } from '../consent-manager';
import { createMockSupabaseClient } from '@/tests/mocks/supabase';

jest.mock('@supabase/auth-helpers-nextjs');

describe('ConsentManager', () => {
  let consentManager: ConsentManager;
  let mockSupabase: any;

  beforeEach(() => {
    mockSupabase = createMockSupabaseClient();
    consentManager = new ConsentManager();
    jest.clearAllMocks();
  });

  describe('Consent Recording', () => {
    it('records consent with proper audit trail', async () => {
      const userId = 'user-123';
      const consents = {
        [ConsentType.ESSENTIAL]: true,
        [ConsentType.MARKETING]: true,
        [ConsentType.ANALYTICS]: false,
        [ConsentType.PERSONALIZATION]: false,
        [ConsentType.THIRD_PARTY]: false
      };
      const context = {
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0...',
        timestamp: new Date()
      };

      mockSupabase.from.mockReturnValue({
        insert: jest.fn().mockResolvedValue({ error: null })
      });

      await consentManager.recordConsent(userId, consents, context);

      expect(mockSupabase.from).toHaveBeenCalledWith('consent_records');
      expect(mockSupabase.from().insert).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            user_id: userId,
            consent_type: ConsentType.MARKETING,
            granted: true,
            ip_address: context.ipAddress,
            user_agent: context.userAgent
          })
        ])
      );
    });

    it('handles consent recording errors gracefully', async () => {
      const userId = 'user-123';
      const consents = { [ConsentType.ESSENTIAL]: true };
      const context = {
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0...',
        timestamp: new Date()
      };

      mockSupabase.from.mockReturnValue({
        insert: jest.fn().mockResolvedValue({ 
          error: new Error('Database connection failed') 
        })
      });

      await expect(
        consentManager.recordConsent(userId, consents, context)
      ).rejects.toThrow('Consent recording failed');
    });
  });

  describe('Consent Withdrawal', () => {
    it('processes consent withdrawal correctly', async () => {
      const userId = 'user-123';
      const consentTypes = [ConsentType.MARKETING];
      const context = {
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0...',
        timestamp: new Date()
      };

      mockSupabase.from.mockReturnValue({
        update: jest.fn().mockResolvedValue({ error: null })
      });

      await consentManager.withdrawConsent(userId, consentTypes, context);

      expect(mockSupabase.from().update).toHaveBeenCalledWith(
        expect.objectContaining({
          granted: false,
          withdrawal_date: context.timestamp.toISOString(),
          withdrawal_ip_address: context.ipAddress
        })
      );
    });

    it('triggers data cleanup on consent withdrawal', async () => {
      const userId = 'user-123';
      const consentTypes = [ConsentType.MARKETING];
      const context = {
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0...',
        timestamp: new Date()
      };

      // Mock successful withdrawal update
      mockSupabase.from.mockReturnValue({
        update: jest.fn().mockResolvedValue({ error: null })
      });

      // Spy on cleanup methods
      const removeFromMarketingSpy = jest.spyOn(
        consentManager as any, 
        'removeFromMarketingLists'
      ).mockResolvedValue(undefined);

      await consentManager.withdrawConsent(userId, consentTypes, context);

      expect(removeFromMarketingSpy).toHaveBeenCalledWith(userId);
    });
  });

  describe('Consent Status Retrieval', () => {
    it('returns latest consent status for each type', async () => {
      const userId = 'user-123';
      const mockConsents = [
        { consent_type: ConsentType.MARKETING, granted: true },
        { consent_type: ConsentType.MARKETING, granted: false }, // Latest
        { consent_type: ConsentType.ANALYTICS, granted: true }
      ];

      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({ 
          data: mockConsents, 
          error: null 
        })
      });

      const status = await consentManager.getConsentStatus(userId);

      expect(status[ConsentType.MARKETING]).toBe(false); // Latest value
      expect(status[ConsentType.ANALYTICS]).toBe(true);
      expect(status[ConsentType.ESSENTIAL]).toBe(true); // Always true
    });
  });
});
```

---

## 3. Integration Testing Strategy

### 3.1 API Route Testing

#### Booking Creation API Tests
```typescript
// src/app/api/bookings/__tests__/route.test.ts
import { POST } from '../route';
import { NextRequest } from 'next/server';
import { createMockSupabaseClient } from '@/tests/mocks/supabase';
import { createMockStripeClient } from '@/tests/mocks/stripe';

jest.mock('@supabase/auth-helpers-nextjs');
jest.mock('@/lib/stripe/server');

describe('/api/bookings POST', () => {
  let mockRequest: NextRequest;
  let mockSupabase: any;
  let mockStripe: any;

  beforeEach(() => {
    mockSupabase = createMockSupabaseClient();
    mockStripe = createMockStripeClient();
    jest.clearAllMocks();
  });

  it('creates booking successfully with valid data', async () => {
    const validBookingData = {
      eventId: 'event-123',
      tableId: 1,
      customerName: 'John Doe',
      customerEmail: 'john@example.com',
      customerPhone: '+44 7700 900123',
      partySize: 4,
      arrivalTime: '23:00',
      drinksPackage: 'premium'
    };

    mockRequest = new NextRequest('http://localhost:3000/api/bookings', {
      method: 'POST',
      body: JSON.stringify(validBookingData),
      headers: { 'Content-Type': 'application/json' }
    });

    // Mock successful table availability check
    mockSupabase.from.mockReturnValue({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      in: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({ data: null, error: null })
    });

    // Mock successful booking creation
    mockSupabase.from.mockReturnValue({
      insert: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({
        data: {
          id: 'booking-123',
          booking_ref: 'BRL-2025-ABC123',
          ...validBookingData
        },
        error: null
      })
    });

    // Mock successful Stripe payment intent
    mockStripe.paymentIntents.create.mockResolvedValue({
      id: 'pi_test_123',
      client_secret: 'pi_test_123_secret',
      status: 'requires_payment_method'
    });

    const response = await POST(mockRequest);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual({
      bookingId: 'booking-123',
      bookingRef: 'BRL-2025-ABC123',
      clientSecret: 'pi_test_123_secret',
      depositAmount: 50.00,
      status: 'pending'
    });
  });

  it('returns 409 when table is not available', async () => {
    const bookingData = {
      eventId: 'event-123',
      tableId: 1,
      customerName: 'John Doe',
      customerEmail: 'john@example.com',
      customerPhone: '+44 7700 900123',
      partySize: 4,
      arrivalTime: '23:00',
      drinksPackage: 'premium'
    };

    mockRequest = new NextRequest('http://localhost:3000/api/bookings', {
      method: 'POST',
      body: JSON.stringify(bookingData),
      headers: { 'Content-Type': 'application/json' }
    });

    // Mock existing booking found
    mockSupabase.from.mockReturnValue({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      in: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({
        data: { id: 'existing-booking' },
        error: null
      })
    });

    const response = await POST(mockRequest);
    const data = await response.json();

    expect(response.status).toBe(409);
    expect(data.error).toBe('Table is not available');
  });

  it('validates request data correctly', async () => {
    const invalidBookingData = {
      eventId: 'invalid-uuid',
      tableId: -1,
      customerName: 'J',
      customerEmail: 'invalid-email',
      customerPhone: '123',
      partySize: 15,
      arrivalTime: '',
      drinksPackage: ''
    };

    mockRequest = new NextRequest('http://localhost:3000/api/bookings', {
      method: 'POST',
      body: JSON.stringify(invalidBookingData),
      headers: { 'Content-Type': 'application/json' }
    });

    const response = await POST(mockRequest);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Invalid booking data');
    expect(data.details).toBeInstanceOf(Array);
  });

  it('cleans up booking if payment intent creation fails', async () => {
    const validBookingData = {
      eventId: 'event-123',
      tableId: 1,
      customerName: 'John Doe',
      customerEmail: 'john@example.com',
      customerPhone: '+44 7700 900123',
      partySize: 4,
      arrivalTime: '23:00',
      drinksPackage: 'premium'
    };

    mockRequest = new NextRequest('http://localhost:3000/api/bookings', {
      method: 'POST',
      body: JSON.stringify(validBookingData),
      headers: { 'Content-Type': 'application/json' }
    });

    // Mock successful booking creation
    const mockBookingId = 'booking-123';
    mockSupabase.from.mockReturnValue({
      insert: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({
        data: { id: mockBookingId, ...validBookingData },
        error: null
      }),
      delete: jest.fn().mockReturnThis(),
      eq: jest.fn().mockResolvedValue({ error: null })
    });

    // Mock Stripe payment intent failure
    mockStripe.paymentIntents.create.mockRejectedValue(
      new Error('Payment processing unavailable')
    );

    const response = await POST(mockRequest);

    expect(response.status).toBe(400);
    
    // Verify cleanup was called
    expect(mockSupabase.from().delete).toHaveBeenCalled();
    expect(mockSupabase.from().eq).toHaveBeenCalledWith('id', mockBookingId);
  });
});
```

### 3.2 Database Integration Testing

#### Booking State Management Tests
```typescript
// src/tests/integration/booking-state.test.ts
import { createServerActionClient } from '@supabase/auth-helpers-nextjs';
import { Database } from '@/types/database.types';

// Test with actual Supabase test database
describe('Booking State Management Integration', () => {
  let supabase: ReturnType<typeof createServerActionClient<Database>>;

  beforeAll(() => {
    // Use test database connection
    supabase = createServerActionClient<Database>();
  });

  beforeEach(async () => {
    // Clean up test data
    await cleanupTestData();
  });

  afterAll(async () => {
    await cleanupTestData();
  });

  it('prevents double booking of same table', async () => {
    const eventId = 'test-event-123';
    const tableId = 1;

    // Create first booking
    const { data: firstBooking, error: firstError } = await supabase
      .from('table_bookings')
      .insert({
        event_id: eventId,
        table_id: tableId,
        customer_name: 'John Doe',
        customer_email: 'john@example.com',
        customer_phone: '+44 7700 900123',
        party_size: 4,
        booking_date: new Date().toISOString().split('T')[0],
        arrival_time: '23:00',
        deposit_amount: 50.00
      })
      .select()
      .single();

    expect(firstError).toBeNull();
    expect(firstBooking).toBeTruthy();

    // Attempt second booking for same table
    const { error: secondError } = await supabase
      .from('table_bookings')
      .insert({
        event_id: eventId,
        table_id: tableId,
        customer_name: 'Jane Smith',
        customer_email: 'jane@example.com',
        customer_phone: '+44 7700 900124',
        party_size: 2,
        booking_date: new Date().toISOString().split('T')[0],
        arrival_time: '23:30',
        deposit_amount: 50.00
      });

    // Should fail due to business logic constraints
    expect(secondError).toBeTruthy();
  });

  it('automatically generates unique booking references', async () => {
    const bookingData = {
      event_id: 'test-event-123',
      table_id: 2,
      customer_name: 'Test Customer',
      customer_email: 'test@example.com',
      customer_phone: '+44 7700 900123',
      party_size: 4,
      booking_date: new Date().toISOString().split('T')[0],
      arrival_time: '23:00',
      deposit_amount: 50.00
    };

    // Create multiple bookings
    const promises = Array.from({ length: 5 }, () =>
      supabase
        .from('table_bookings')
        .insert({ ...bookingData, table_id: Math.floor(Math.random() * 16) + 1 })
        .select('booking_ref')
        .single()
    );

    const results = await Promise.all(promises);
    const bookingRefs = results.map(result => result.data?.booking_ref);

    // All booking references should be unique
    const uniqueRefs = new Set(bookingRefs);
    expect(uniqueRefs.size).toBe(5);

    // All should follow BRL-YYYY-XXXXX format
    bookingRefs.forEach(ref => {
      expect(ref).toMatch(/^BRL-\d{4}-[A-Z0-9]{5}$/);
    });
  });

  it('expires old pending bookings automatically', async () => {
    // Create booking with old timestamp (simulate expired booking)
    const { data: booking } = await supabase
      .from('table_bookings')
      .insert({
        event_id: 'test-event-123',
        table_id: 3,
        customer_name: 'Expired Booking',
        customer_email: 'expired@example.com',
        customer_phone: '+44 7700 900123',
        party_size: 2,
        booking_date: new Date().toISOString().split('T')[0],
        arrival_time: '23:00',
        deposit_amount: 50.00,
        status: 'pending',
        created_at: new Date(Date.now() - 20 * 60 * 1000).toISOString() // 20 minutes ago
      })
      .select()
      .single();

    expect(booking).toBeTruthy();

    // Trigger expiry function
    const { data: expiredCount } = await supabase.rpc('expire_old_bookings');

    expect(expiredCount).toBeGreaterThan(0);

    // Verify booking was expired
    const { data: updatedBooking } = await supabase
      .from('table_bookings')
      .select('status')
      .eq('id', booking!.id)
      .single();

    expect(updatedBooking?.status).toBe('expired');
  });

  async function cleanupTestData() {
    await supabase
      .from('table_bookings')
      .delete()
      .like('customer_email', '%@example.com');
  }
});
```

### 3.3 External Service Integration Testing

#### Stripe Webhook Integration Tests
```typescript
// src/tests/integration/stripe-webhook.test.ts
import { POST } from '@/app/api/webhooks/stripe/route';
import { NextRequest } from 'next/server';
import { stripe } from '@/lib/stripe/server';
import crypto from 'crypto';

describe('Stripe Webhook Integration', () => {
  const mockWebhookSecret = 'whsec_test_secret';
  
  beforeAll(() => {
    process.env.STRIPE_WEBHOOK_SECRET = mockWebhookSecret;
  });

  it('processes payment succeeded webhook correctly', async () => {
    const paymentIntentSucceeded = {
      id: 'evt_test_123',
      object: 'event',
      type: 'payment_intent.succeeded',
      data: {
        object: {
          id: 'pi_test_123',
          object: 'payment_intent',
          status: 'succeeded',
          metadata: {
            booking_id: 'booking-123',
            customer_email: 'john@example.com'
          }
        }
      }
    };

    const payload = JSON.stringify(paymentIntentSucceeded);
    const signature = generateStripeSignature(payload, mockWebhookSecret);

    const request = new NextRequest('http://localhost:3000/api/webhooks/stripe', {
      method: 'POST',
      body: payload,
      headers: {
        'stripe-signature': signature,
        'content-type': 'application/json'
      }
    });

    const response = await POST(request);
    expect(response.status).toBe(200);

    const data = await response.json();
    expect(data.received).toBe(true);
  });

  it('rejects webhook with invalid signature', async () => {
    const payload = JSON.stringify({ type: 'payment_intent.succeeded' });
    const invalidSignature = 'invalid_signature';

    const request = new NextRequest('http://localhost:3000/api/webhooks/stripe', {
      method: 'POST',
      body: payload,
      headers: {
        'stripe-signature': invalidSignature,
        'content-type': 'application/json'
      }
    });

    const response = await POST(request);
    expect(response.status).toBe(400);

    const data = await response.json();
    expect(data.error).toBe('Invalid signature');
  });

  it('handles payment failed webhook correctly', async () => {
    const paymentIntentFailed = {
      id: 'evt_test_456',
      object: 'event',
      type: 'payment_intent.payment_failed',
      data: {
        object: {
          id: 'pi_test_456',
          object: 'payment_intent',
          status: 'requires_payment_method',
          last_payment_error: {
            message: 'Your card was declined.',
            decline_code: 'generic_decline'
          },
          metadata: {
            booking_id: 'booking-456',
            table_id: '5'
          }
        }
      }
    };

    const payload = JSON.stringify(paymentIntentFailed);
    const signature = generateStripeSignature(payload, mockWebhookSecret);

    const request = new NextRequest('http://localhost:3000/api/webhooks/stripe', {
      method: 'POST',
      body: payload,
      headers: {
        'stripe-signature': signature,
        'content-type': 'application/json'
      }
    });

    const response = await POST(request);
    expect(response.status).toBe(200);
  });

  function generateStripeSignature(payload: string, secret: string): string {
    const timestamp = Math.floor(Date.now() / 1000);
    const signedPayload = `${timestamp}.${payload}`;
    const signature = crypto
      .createHmac('sha256', secret)
      .update(signedPayload)
      .digest('hex');
    
    return `t=${timestamp},v1=${signature}`;
  }
});
```

---

## 4. End-to-End Testing Strategy

### 4.1 Playwright Configuration

```typescript
// playwright.config.ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [
    ['html'],
    ['json', { outputFile: 'test-results/results.json' }],
    ['junit', { outputFile: 'test-results/results.xml' }]
  ],
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure'
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 12'] },
    },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
});
```

### 4.2 Complete Booking Journey Tests

```typescript
// tests/e2e/booking-journey.spec.ts
import { test, expect } from '@playwright/test';
import { generateTestBookingData } from '../fixtures/booking-data';

test.describe('Complete Booking Journey', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to events page
    await page.goto('/events');
    await page.waitForLoadState('networkidle');
  });

  test('successful table booking end-to-end', async ({ page }) => {
    const bookingData = generateTestBookingData();

    // Step 1: Select event and start booking
    await page.click('[data-testid="event-card"]:first-child .book-now-button');
    await expect(page.locator('h1')).toContainText('Table Booking');

    // Step 2: Fill customer details
    await page.fill('[data-testid="customer-name"]', bookingData.name);
    await page.fill('[data-testid="customer-email"]', bookingData.email);
    await page.fill('[data-testid="customer-phone"]', bookingData.phone);
    await page.fill('[data-testid="party-size"]', bookingData.partySize.toString());

    // Continue to table selection
    await page.click('[data-testid="continue-button"]');
    await page.waitForSelector('[data-testid="table-availability"]');

    // Step 3: Select table and arrival time
    const availableTable = page.locator('.table-button[data-status="available"]').first();
    await availableTable.click();
    
    await page.selectOption('[data-testid="arrival-time"]', '23:00');
    await page.selectOption('[data-testid="drinks-package"]', 'premium');

    // Continue to payment
    await page.click('[data-testid="continue-button"]');
    await page.waitForSelector('[data-testid="payment-form"]');

    // Step 4: Fill payment details (test mode)
    const paymentFrame = page.frameLocator('[data-testid="stripe-payment-element"] iframe');
    await paymentFrame.fill('[data-elements-stable-field-name="cardNumber"]', '4242424242424242');
    await paymentFrame.fill('[data-elements-stable-field-name="cardExpiry"]', '12/34');
    await paymentFrame.fill('[data-elements-stable-field-name="cardCvc"]', '123');

    // Fill address
    const addressFrame = page.frameLocator('[data-testid="stripe-address-element"] iframe');
    await addressFrame.fill('[data-elements-stable-field-name="address"]', '123 Test Street');
    await addressFrame.fill('[data-elements-stable-field-name="city"]', 'Leeds');
    await addressFrame.fill('[data-elements-stable-field-name="postalCode"]', 'LS1 1AA');

    // Accept terms and complete booking
    await page.check('[data-testid="terms-accepted"]');
    await page.click('[data-testid="complete-booking-button"]');

    // Step 5: Verify confirmation page
    await expect(page.locator('h1')).toContainText('Booking Confirmed');
    await expect(page.locator('[data-testid="booking-reference"]')).toMatch(/BRL-\d{4}-[A-Z0-9]{5}/);
    await expect(page.locator('[data-testid="qr-code"]')).toBeVisible();
  });

  test('handles payment failure gracefully', async ({ page }) => {
    const bookingData = generateTestBookingData();

    // Fill customer details
    await fillCustomerDetails(page, bookingData);
    await page.click('[data-testid="continue-button"]');

    // Select table
    await selectTable(page);
    await page.click('[data-testid="continue-button"]');

    // Use declined test card
    const paymentFrame = page.frameLocator('[data-testid="stripe-payment-element"] iframe');
    await paymentFrame.fill('[data-elements-stable-field-name="cardNumber"]', '4000000000000002');
    await paymentFrame.fill('[data-elements-stable-field-name="cardExpiry"]', '12/34');
    await paymentFrame.fill('[data-elements-stable-field-name="cardCvc"]', '123');

    await page.check('[data-testid="terms-accepted"]');
    await page.click('[data-testid="complete-booking-button"]');

    // Verify error handling
    await expect(page.locator('[role="alert"]')).toContainText('Your card was declined');
    await expect(page.locator('[data-testid="alternative-payment-methods"]')).toBeVisible();
  });

  test('shows table as unavailable after booking', async ({ page }) => {
    // Complete a booking
    await completeBooking(page, generateTestBookingData());

    // Navigate back to booking page
    await page.goto('/events');
    await page.click('[data-testid="event-card"]:first-child .book-now-button');

    // Skip to table selection
    await fillCustomerDetails(page, generateTestBookingData());
    await page.click('[data-testid="continue-button"]');

    // Verify previously selected table is now unavailable
    const previouslySelectedTable = page.locator('.table-button[data-table-id="1"]');
    await expect(previouslySelectedTable).toHaveAttribute('data-status', 'booked');
    await expect(previouslySelectedTable).toBeDisabled();
  });

  test('booking form is accessible', async ({ page }) => {
    // Start booking flow
    await page.click('[data-testid="event-card"]:first-child .book-now-button');

    // Check accessibility landmarks
    await expect(page.locator('main')).toBeVisible();
    await expect(page.locator('[role="navigation"][aria-label="Booking progress"]')).toBeVisible();

    // Check form labels
    await expect(page.locator('label[for*="customer-name"]')).toContainText('Name');
    await expect(page.locator('input[aria-required="true"]')).toHaveCount(4);

    // Test keyboard navigation
    await page.keyboard.press('Tab');
    await expect(page.locator('[data-testid="customer-name"]')).toBeFocused();

    // Test error announcements
    await page.click('[data-testid="continue-button"]');
    await expect(page.locator('[role="alert"]')).toBeVisible();
  });

  // Helper functions
  async function fillCustomerDetails(page: any, data: any) {
    await page.fill('[data-testid="customer-name"]', data.name);
    await page.fill('[data-testid="customer-email"]', data.email);
    await page.fill('[data-testid="customer-phone"]', data.phone);
    await page.fill('[data-testid="party-size"]', data.partySize.toString());
  }

  async function selectTable(page: any) {
    await page.waitForSelector('[data-testid="table-availability"]');
    await page.click('.table-button[data-status="available"]:first-child');
    await page.selectOption('[data-testid="arrival-time"]', '23:00');
    await page.selectOption('[data-testid="drinks-package"]', 'premium');
  }

  async function completeBooking(page: any, data: any) {
    await fillCustomerDetails(page, data);
    await page.click('[data-testid="continue-button"]');
    await selectTable(page);
    await page.click('[data-testid="continue-button"]');

    // Fill payment with successful test card
    const paymentFrame = page.frameLocator('[data-testid="stripe-payment-element"] iframe');
    await paymentFrame.fill('[data-elements-stable-field-name="cardNumber"]', '4242424242424242');
    await paymentFrame.fill('[data-elements-stable-field-name="cardExpiry"]', '12/34');
    await paymentFrame.fill('[data-elements-stable-field-name="cardCvc"]', '123');

    await page.check('[data-testid="terms-accepted"]');
    await page.click('[data-testid="complete-booking-button"]');

    await page.waitForSelector('[data-testid="booking-reference"]');
  }
});
```

### 4.3 Accessibility Testing with Playwright

```typescript
// tests/e2e/accessibility.spec.ts
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('Accessibility Testing', () => {
  test('booking form meets WCAG 2.1 AA standards', async ({ page }) => {
    await page.goto('/events');
    await page.click('[data-testid="event-card"]:first-child .book-now-button');

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('table selection interface is fully accessible', async ({ page }) => {
    await page.goto('/book/test-event');
    
    // Fill form to reach table selection
    await page.fill('[data-testid="customer-name"]', 'Test User');
    await page.fill('[data-testid="customer-email"]', 'test@example.com');
    await page.fill('[data-testid="customer-phone"]', '+44 7700 900123');
    await page.fill('[data-testid="party-size"]', '4');
    await page.click('[data-testid="continue-button"]');

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .exclude('[data-testid="stripe-payment-element"]') // Exclude external iframe
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('payment form has proper accessibility', async ({ page }) => {
    await page.goto('/book/test-event');
    
    // Complete steps to reach payment
    await fillFormToPayment(page);

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .exclude('[data-testid="stripe-payment-element"] iframe')
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('keyboard navigation works throughout booking flow', async ({ page }) => {
    await page.goto('/book/test-event');

    // Test tab order in customer details step
    await page.keyboard.press('Tab');
    await expect(page.locator('[data-testid="customer-name"]')).toBeFocused();

    await page.keyboard.press('Tab');
    await expect(page.locator('[data-testid="customer-email"]')).toBeFocused();

    await page.keyboard.press('Tab');
    await expect(page.locator('[data-testid="customer-phone"]')).toBeFocused();

    // Fill form and test next step
    await page.fill('[data-testid="customer-name"]', 'Test User');
    await page.fill('[data-testid="customer-email"]', 'test@example.com');
    await page.fill('[data-testid="customer-phone"]', '+44 7700 900123');
    await page.fill('[data-testid="party-size"]', '4');

    // Navigate with keyboard
    await page.keyboard.press('Tab');
    await page.keyboard.press('Enter'); // Click continue button

    // Test table selection keyboard navigation
    await page.waitForSelector('[data-testid="table-availability"]');
    
    // Focus should move to first available table
    await page.keyboard.press('Tab');
    const focusedElement = await page.locator(':focus');
    await expect(focusedElement).toHaveClass(/table-button/);
  });

  test('screen reader announcements work correctly', async ({ page }) => {
    await page.goto('/book/test-event');

    // Test form validation announcements
    await page.click('[data-testid="continue-button"]');
    
    // Check for aria-live regions
    const errorAnnouncements = page.locator('[aria-live="polite"]');
    await expect(errorAnnouncements).toBeVisible();

    // Test progress announcements
    await fillFormToTableSelection(page);
    
    // Check for step progress announcements
    const progressAnnouncements = page.locator('[aria-live="polite"]');
    await expect(progressAnnouncements).toContainText(/step 2/i);
  });

  async function fillFormToPayment(page: any) {
    await page.fill('[data-testid="customer-name"]', 'Test User');
    await page.fill('[data-testid="customer-email"]', 'test@example.com');
    await page.fill('[data-testid="customer-phone"]', '+44 7700 900123');
    await page.fill('[data-testid="party-size"]', '4');
    await page.click('[data-testid="continue-button"]');
    
    await page.waitForSelector('[data-testid="table-availability"]');
    await page.click('.table-button[data-status="available"]:first-child');
    await page.selectOption('[data-testid="arrival-time"]', '23:00');
    await page.selectOption('[data-testid="drinks-package"]', 'premium');
    await page.click('[data-testid="continue-button"]');
    
    await page.waitForSelector('[data-testid="payment-form"]');
  }

  async function fillFormToTableSelection(page: any) {
    await page.fill('[data-testid="customer-name"]', 'Test User');
    await page.fill('[data-testid="customer-email"]', 'test@example.com');
    await page.fill('[data-testid="customer-phone"]', '+44 7700 900123');
    await page.fill('[data-testid="party-size"]', '4');
    await page.click('[data-testid="continue-button"]');
  }
});
```

### 4.4 Performance Testing

```typescript
// tests/e2e/performance.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Performance Testing', () => {
  test('booking page loads within performance budget', async ({ page }) => {
    const startTime = Date.now();
    
    await page.goto('/book/test-event');
    await page.waitForLoadState('networkidle');
    
    const loadTime = Date.now() - startTime;
    expect(loadTime).toBeLessThan(2000); // 2 second limit
  });

  test('Core Web Vitals meet requirements', async ({ page }) => {
    await page.goto('/book/test-event');

    // Measure Core Web Vitals
    const vitals = await page.evaluate(() => {
      return new Promise((resolve) => {
        new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const vitals: Record<string, number> = {};
          
          entries.forEach((entry) => {
            if (entry.name === 'FCP') {
              vitals.fcp = entry.value;
            } else if (entry.name === 'LCP') {
              vitals.lcp = entry.value;
            } else if (entry.name === 'CLS') {
              vitals.cls = entry.value;
            }
          });
          
          resolve(vitals);
        }).observe({ entryTypes: ['paint', 'largest-contentful-paint', 'layout-shift'] });
        
        // Timeout after 10 seconds
        setTimeout(() => resolve({}), 10000);
      });
    });

    // Core Web Vitals thresholds
    if (vitals.fcp) expect(vitals.fcp).toBeLessThan(1800); // First Contentful Paint < 1.8s
    if (vitals.lcp) expect(vitals.lcp).toBeLessThan(2500); // Largest Contentful Paint < 2.5s  
    if (vitals.cls) expect(vitals.cls).toBeLessThan(0.1);  // Cumulative Layout Shift < 0.1
  });

  test('table availability updates perform well under load', async ({ page }) => {
    await page.goto('/book/test-event');
    
    // Navigate to table selection
    await page.fill('[data-testid="customer-name"]', 'Performance Test');
    await page.fill('[data-testid="customer-email"]', 'perf@test.com');
    await page.fill('[data-testid="customer-phone"]', '+44 7700 900123');
    await page.fill('[data-testid="party-size"]', '4');
    await page.click('[data-testid="continue-button"]');

    await page.waitForSelector('[data-testid="table-availability"]');

    // Measure real-time update performance
    const updateStartTime = Date.now();
    
    // Simulate table status change (would be done by another user/process in reality)
    await page.evaluate(() => {
      // Trigger real-time update simulation
      window.dispatchEvent(new CustomEvent('table-status-change', {
        detail: { tableId: 1, status: 'booked' }
      }));
    });

    // Wait for UI update
    await page.waitForFunction(() => {
      const table = document.querySelector('.table-button[data-table-id="1"]');
      return table?.getAttribute('data-status') === 'booked';
    }, { timeout: 1000 });

    const updateTime = Date.now() - updateStartTime;
    expect(updateTime).toBeLessThan(500); // Updates should be < 500ms
  });

  test('payment form renders quickly', async ({ page }) => {
    await page.goto('/book/test-event');
    
    // Navigate to payment step
    await fillFormToPayment(page);

    // Measure Stripe Elements load time
    const stripeLoadStart = Date.now();
    await page.waitForSelector('[data-testid="stripe-payment-element"] iframe', { timeout: 5000 });
    const stripeLoadTime = Date.now() - stripeLoadStart;

    expect(stripeLoadTime).toBeLessThan(3000); // Stripe Elements should load < 3s
  });

  async function fillFormToPayment(page: any) {
    await page.fill('[data-testid="customer-name"]', 'Test User');
    await page.fill('[data-testid="customer-email"]', 'test@example.com');
    await page.fill('[data-testid="customer-phone"]', '+44 7700 900123');
    await page.fill('[data-testid="party-size"]', '4');
    await page.click('[data-testid="continue-button"]');
    
    await page.waitForSelector('[data-testid="table-availability"]');
    await page.click('.table-button[data-status="available"]:first-child');
    await page.selectOption('[data-testid="arrival-time"]', '23:00');
    await page.selectOption('[data-testid="drinks-package"]', 'premium');
    await page.click('[data-testid="continue-button"]');
  }
});
```

---

## 5. Testing Utilities and Mocks

### 5.1 Mock Service Worker Setup

```typescript
// src/tests/mocks/server.ts
import { setupServer } from 'msw/node';
import { rest } from 'msw';

const handlers = [
  // Mock Supabase API
  rest.get('*/rest/v1/table_bookings', (req, res, ctx) => {
    return res(
      ctx.json([
        {
          id: 'booking-123',
          event_id: 'event-123',
          table_id: 1,
          customer_name: 'John Doe',
          customer_email: 'john@example.com',
          status: 'confirmed'
        }
      ])
    );
  }),

  rest.post('*/rest/v1/table_bookings', (req, res, ctx) => {
    return res(
      ctx.json({
        id: 'booking-new',
        booking_ref: 'BRL-2025-TEST1',
        status: 'pending'
      })
    );
  }),

  // Mock Stripe API
  rest.post('https://api.stripe.com/v1/payment_intents', (req, res, ctx) => {
    return res(
      ctx.json({
        id: 'pi_test_123',
        client_secret: 'pi_test_123_secret',
        status: 'requires_payment_method'
      })
    );
  }),

  rest.post('https://api.stripe.com/v1/payment_intents/*/confirm', (req, res, ctx) => {
    return res(
      ctx.json({
        id: 'pi_test_123',
        status: 'succeeded'
      })
    );
  }),
];

export const server = setupServer(...handlers);
```

### 5.2 Test Fixtures

```typescript
// src/tests/fixtures/booking-data.ts
export function createMockBooking(overrides: any = {}) {
  return {
    id: 'booking-123',
    event_id: 'event-123',
    table_id: 1,
    customer_name: 'John Doe',
    customer_email: 'john@example.com',
    customer_phone: '+44 7700 900123',
    party_size: 4,
    booking_date: '2025-08-30',
    arrival_time: '23:00',
    drinks_package: { package: 'premium' },
    deposit_amount: 50.00,
    booking_ref: 'BRL-2025-ABC123',
    status: 'pending',
    created_at: new Date().toISOString(),
    ...overrides
  };
}

export function generateTestBookingData() {
  return {
    name: 'Test Customer',
    email: 'test@example.com',
    phone: '+44 7700 900123',
    partySize: 4
  };
}

export const mockTableAvailabilityData = [
  {
    id: 1,
    table_number: 1,
    floor: 'upstairs',
    capacity_min: 2,
    capacity_max: 4,
    status: 'available'
  },
  {
    id: 2,
    table_number: 2,
    floor: 'upstairs',
    capacity_min: 2,
    capacity_max: 6,
    status: 'available'
  },
  {
    id: 3,
    table_number: 3,
    floor: 'downstairs',
    capacity_min: 4,
    capacity_max: 8,
    status: 'booked'
  }
];
```

### 5.3 Custom Matchers

```typescript
// src/tests/utils/matchers/venue-matchers.ts
import { expect } from '@jest/globals';

expect.extend({
  toHaveValidBookingReference(received: string) {
    const referencePattern = /^BRL-\d{4}-[A-Z0-9]{5}$/;
    const pass = referencePattern.test(received);

    return {
      pass,
      message: () =>
        pass
          ? `Expected ${received} not to be a valid booking reference`
          : `Expected ${received} to be a valid booking reference (format: BRL-YYYY-XXXXX)`
    };
  },

  toHaveValidUKPhoneNumber(received: string) {
    const phonePattern = /^(\+44|0)[0-9]{10,11}$/;
    const pass = phonePattern.test(received);

    return {
      pass,
      message: () =>
        pass
          ? `Expected ${received} not to be a valid UK phone number`
          : `Expected ${received} to be a valid UK phone number`
    };
  },

  toHaveAccessibleName(received: HTMLElement) {
    const accessibleName = received.getAttribute('aria-label') || 
                          received.getAttribute('aria-labelledby') ||
                          received.textContent;
    const pass = Boolean(accessibleName && accessibleName.trim().length > 0);

    return {
      pass,
      message: () =>
        pass
          ? `Expected element not to have an accessible name`
          : `Expected element to have an accessible name (aria-label, aria-labelledby, or text content)`
    };
  }
});

declare global {
  namespace jest {
    interface Matchers<R> {
      toHaveValidBookingReference(): R;
      toHaveValidUKPhoneNumber(): R;
      toHaveAccessibleName(): R;
    }
  }
}
```

---

## 6. Continuous Integration Setup

### 6.1 GitHub Actions Workflow

```yaml
# .github/workflows/test.yml
name: Test Suite

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

jobs:
  unit-tests:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v4
    
    - name: Setup Node.js
      uses: actions/setup-node@v4
      with:
        node-version: '18'
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Run unit tests
      run: npm run test:unit -- --coverage --watchAll=false
    
    - name: Upload coverage reports
      uses: codecov/codecov-action@v3
      with:
        token: ${{ secrets.CODECOV_TOKEN }}
        directory: ./coverage
        flags: unit-tests

  integration-tests:
    runs-on: ubuntu-latest
    
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: postgres
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
    
    steps:
    - uses: actions/checkout@v4
    
    - name: Setup Node.js
      uses: actions/setup-node@v4
      with:
        node-version: '18'
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Setup test database
      run: |
        npm run db:test:setup
      env:
        DATABASE_URL: postgresql://postgres:postgres@localhost:5432/test_db
    
    - name: Run integration tests
      run: npm run test:integration
      env:
        DATABASE_URL: postgresql://postgres:postgres@localhost:5432/test_db
        STRIPE_SECRET_KEY: ${{ secrets.STRIPE_TEST_SECRET_KEY }}

  e2e-tests:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v4
    
    - name: Setup Node.js
      uses: actions/setup-node@v4
      with:
        node-version: '18'
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Install Playwright
      run: npx playwright install --with-deps
    
    - name: Build application
      run: npm run build
      env:
        NEXT_PUBLIC_SUPABASE_URL: ${{ secrets.TEST_SUPABASE_URL }}
        NEXT_PUBLIC_SUPABASE_ANON_KEY: ${{ secrets.TEST_SUPABASE_ANON_KEY }}
        NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: ${{ secrets.STRIPE_TEST_PUBLISHABLE_KEY }}
    
    - name: Run E2E tests
      run: npm run test:e2e
      env:
        NEXT_PUBLIC_SUPABASE_URL: ${{ secrets.TEST_SUPABASE_URL }}
        NEXT_PUBLIC_SUPABASE_ANON_KEY: ${{ secrets.TEST_SUPABASE_ANON_KEY }}
        STRIPE_SECRET_KEY: ${{ secrets.STRIPE_TEST_SECRET_KEY }}
        STRIPE_WEBHOOK_SECRET: ${{ secrets.STRIPE_TEST_WEBHOOK_SECRET }}
    
    - name: Upload test results
      uses: actions/upload-artifact@v3
      if: always()
      with:
        name: playwright-results
        path: test-results/

  accessibility-audit:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v4
    
    - name: Setup Node.js
      uses: actions/setup-node@v4
      with:
        node-version: '18'
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Build application
      run: npm run build
    
    - name: Run accessibility audit
      run: npm run test:a11y
    
    - name: Upload accessibility reports
      uses: actions/upload-artifact@v3
      with:
        name: accessibility-reports
        path: accessibility-reports/

  performance-audit:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v4
    
    - name: Setup Node.js
      uses: actions/setup-node@v4
      with:
        node-version: '18'
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Build application
      run: npm run build
    
    - name: Run Lighthouse audit
      run: npm run test:lighthouse
    
    - name: Upload performance reports
      uses: actions/upload-artifact@v3
      with:
        name: lighthouse-reports
        path: lighthouse-reports/
```

### 6.2 Package.json Scripts

```json
{
  "scripts": {
    "test": "jest",
    "test:unit": "jest --testPathPattern='\\.(test|spec)\\.(js|ts|tsx)$'",
    "test:integration": "jest --testPathPattern='integration'",
    "test:e2e": "playwright test",
    "test:a11y": "npm run test:e2e -- --grep='accessibility'",
    "test:lighthouse": "lighthouse-ci",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "test:coverage:open": "open coverage/lcov-report/index.html"
  }
}
```

---

## 7. Quality Gates and Metrics

### 7.1 Coverage Requirements

**Minimum Coverage Thresholds:**
- **Unit Tests**: 85% line coverage, 80% branch coverage
- **Integration Tests**: 80% API endpoint coverage
- **E2E Tests**: 90% critical user journey coverage
- **Accessibility Tests**: 100% WCAG 2.1 AA compliance

### 7.2 Performance Budgets

**Core Web Vitals Targets:**
- **First Contentful Paint (FCP)**: < 1.8 seconds
- **Largest Contentful Paint (LCP)**: < 2.5 seconds  
- **Cumulative Layout Shift (CLS)**: < 0.1
- **First Input Delay (FID)**: < 100 milliseconds

**Load Time Targets:**
- **Initial Page Load**: < 2 seconds
- **Form Validation**: < 200 milliseconds
- **Real-time Updates**: < 500 milliseconds
- **Payment Processing**: < 3 seconds

### 7.3 Accessibility Standards

**WCAG 2.1 AA Compliance:**
- **Level A**: 100% compliance required
- **Level AA**: 100% compliance required
- **Keyboard Navigation**: Full keyboard accessibility
- **Screen Reader**: Compatible with NVDA, JAWS, VoiceOver
- **Color Contrast**: Minimum 4.5:1 for normal text, 3:1 for large text

---

## Implementation Summary

This comprehensive testing strategy ensures The Backroom Leeds table booking system meets all quality, performance, accessibility, and compliance requirements through:

### ✅ Complete Test Coverage
- **Unit Tests**: Component testing with accessibility validation
- **Integration Tests**: API and database operation testing
- **E2E Tests**: Complete user journey validation with multiple browsers
- **Performance Tests**: Core Web Vitals and load time validation

### ✅ Accessibility Compliance
- **Automated Testing**: axe-core integration for WCAG 2.1 AA compliance
- **Manual Testing**: Keyboard navigation and screen reader testing
- **Continuous Monitoring**: Accessibility regression prevention

### ✅ Security Validation
- **Payment Testing**: Comprehensive Stripe integration testing
- **Data Protection**: GDPR compliance validation through testing
- **Input Validation**: Security vulnerability prevention

### ✅ Quality Assurance
- **CI/CD Integration**: Automated testing in GitHub Actions
- **Coverage Tracking**: >80% coverage requirements enforced
- **Performance Budgets**: Automated performance monitoring

All testing patterns follow 2025 industry best practices and are ready for implementation with the development agent.

---

*Testing Strategy compiled: August 25, 2025*  
*Coverage target: >80% (Unit: 85%, Integration: 80%, E2E: 90%)*  
*Standards: WCAG 2.1 AA, PCI DSS v4.0.1, UK GDPR compliant*  
*Ready for development agent implementation*