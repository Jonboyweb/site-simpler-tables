import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { toast } from 'sonner';
import { EnhancedPaymentProcessor } from '@/components/organisms/EnhancedPaymentProcessor';
import { PaymentMethodType } from '@/types/payment';

// Mock external dependencies
jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
}));

jest.mock('@stripe/stripe-js', () => ({
  loadStripe: jest.fn(() => 
    Promise.resolve({
      elements: jest.fn(() => ({
        create: jest.fn(() => ({
          mount: jest.fn(),
          on: jest.fn(),
        })),
      })),
    })
  ),
}));

jest.mock('@stripe/react-stripe-js', () => ({
  Elements: ({ children }: { children: React.ReactNode }) => <div data-testid="stripe-elements">{children}</div>,
  useStripe: () => ({
    confirmPayment: jest.fn(),
  }),
  useElements: () => ({
    getElement: jest.fn(),
  }),
}));

// Mock fetch for API calls
global.fetch = jest.fn();

const mockProps = {
  amount: 5000, // £50.00
  currency: 'GBP',
  region: 'GB',
  description: 'Test booking',
  customerEmail: 'test@example.com',
  customerName: 'Test Customer',
  bookingRef: 'TEST-123',
  billingAddress: {
    line1: '123 Test Street',
    city: 'Leeds',
    postcode: 'LS1 1AA',
    country: 'GB'
  },
  onSuccess: jest.fn(),
  onError: jest.fn(),
  onStateChange: jest.fn(),
};

describe('EnhancedPaymentProcessor', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (fetch as jest.Mock).mockClear();
  });

  describe('Payment Method Selection', () => {
    it('should render payment method selector initially', async () => {
      render(<EnhancedPaymentProcessor {...mockProps} />);
      
      expect(screen.getByText('Complete Your Payment')).toBeInTheDocument();
      expect(screen.getByText('£50.00')).toBeInTheDocument();
      expect(screen.getByText('Choose Payment Method')).toBeInTheDocument();
    });

    it('should show payment timing options', async () => {
      render(<EnhancedPaymentProcessor {...mockProps} />);
      
      expect(screen.getByText('Pay Deposit Only')).toBeInTheDocument();
      expect(screen.getByText('Pay Full Amount')).toBeInTheDocument();
    });

    it('should display available payment methods', async () => {
      render(<EnhancedPaymentProcessor {...mockProps} />);
      
      await waitFor(() => {
        expect(screen.getByText('Debit/Credit Card')).toBeInTheDocument();
      });
    });

    it('should handle payment method selection', async () => {
      const user = userEvent.setup();
      render(<EnhancedPaymentProcessor {...mockProps} />);
      
      await waitFor(() => {
        expect(screen.getByText('Debit/Credit Card')).toBeInTheDocument();
      });

      const cardButton = screen.getByText('Debit/Credit Card').closest('button');
      if (cardButton) {
        await user.click(cardButton);
      }

      await waitFor(() => {
        expect(screen.getByText('Change Method')).toBeInTheDocument();
      });
    });
  });

  describe('Card Payments', () => {
    beforeEach(() => {
      (fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          success: true,
          clientSecret: 'pi_test_client_secret',
          paymentIntent: {
            id: 'pi_test_123',
            status: 'requires_payment_method'
          }
        })
      });
    });

    it('should create payment intent for card payments', async () => {
      const user = userEvent.setup();
      render(<EnhancedPaymentProcessor {...mockProps} />);
      
      await waitFor(() => {
        expect(screen.getByText('Debit/Credit Card')).toBeInTheDocument();
      });

      const cardButton = screen.getByText('Debit/Credit Card').closest('button');
      if (cardButton) {
        await user.click(cardButton);
      }

      await waitFor(() => {
        expect(fetch).toHaveBeenCalledWith('/api/payments/create-intent', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: expect.stringContaining('card')
        });
      });
    });

    it('should handle payment intent creation errors', async () => {
      (fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          success: false,
          error: 'Payment intent creation failed'
        })
      });

      const user = userEvent.setup();
      render(<EnhancedPaymentProcessor {...mockProps} />);
      
      await waitFor(() => {
        expect(screen.getByText('Debit/Credit Card')).toBeInTheDocument();
      });

      const cardButton = screen.getByText('Debit/Credit Card').closest('button');
      if (cardButton) {
        await user.click(cardButton);
      }

      await waitFor(() => {
        expect(screen.getByText('Payment Error')).toBeInTheDocument();
        expect(mockProps.onError).toHaveBeenCalledWith('Payment intent creation failed');
      });
    });
  });

  describe('Digital Wallet Payments', () => {
    // Mock window APIs for digital wallets
    beforeEach(() => {
      // Mock Apple Pay
      Object.defineProperty(window, 'ApplePaySession', {
        value: {
          canMakePayments: jest.fn(() => Promise.resolve(true)),
        },
        writable: true,
      });

      // Mock Google Pay
      Object.defineProperty(window, 'google', {
        value: {
          payments: {
            api: {
              PaymentsClient: jest.fn(() => ({
                isReadyToPay: jest.fn(() => Promise.resolve({ result: true })),
              })),
            },
          },
        },
        writable: true,
      });
    });

    it('should detect Apple Pay availability on iOS', async () => {
      // Mock iOS user agent
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15',
        writable: true,
      });

      render(<EnhancedPaymentProcessor {...mockProps} />);
      
      await waitFor(() => {
        expect(screen.getByText('Apple Pay')).toBeInTheDocument();
      });
    });

    it('should detect Google Pay availability', async () => {
      render(<EnhancedPaymentProcessor {...mockProps} />);
      
      await waitFor(() => {
        expect(screen.getByText('Google Pay')).toBeInTheDocument();
      });
    });
  });

  describe('BNPL Payments', () => {
    beforeEach(() => {
      (fetch as jest.Mock).mockImplementation((url) => {
        if (url.includes('bnpl/eligibility')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({
              eligible: true,
              installments: [
                { amount: 1667, dueDate: new Date().toISOString(), description: 'Due today' },
                { amount: 1667, dueDate: new Date().toISOString(), description: 'Due in 30 days' },
                { amount: 1666, dueDate: new Date().toISOString(), description: 'Due in 60 days' }
              ]
            })
          });
        }
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ success: true })
        });
      });
    });

    it('should check BNPL eligibility for Klarna', async () => {
      const user = userEvent.setup();
      render(<EnhancedPaymentProcessor {...mockProps} amount={10000} />); // £100 for BNPL eligibility
      
      await waitFor(() => {
        expect(screen.getByText('Klarna - Pay in 3')).toBeInTheDocument();
      });

      const klarnaButton = screen.getByText('Klarna - Pay in 3').closest('button');
      if (klarnaButton) {
        await user.click(klarnaButton);
      }

      await waitFor(() => {
        expect(fetch).toHaveBeenCalledWith('/api/payments/bnpl/eligibility', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: expect.stringContaining('klarna')
        });
      });
    });

    it('should display installment breakdown for eligible amounts', async () => {
      const user = userEvent.setup();
      render(<EnhancedPaymentProcessor {...mockProps} amount={10000} />);
      
      await waitFor(() => {
        expect(screen.getByText('Klarna - Pay in 3')).toBeInTheDocument();
      });

      const klarnaButton = screen.getByText('Klarna - Pay in 3').closest('button');
      if (klarnaButton) {
        await user.click(klarnaButton);
      }

      await waitFor(() => {
        expect(screen.getByText('Pay in 3 with Klarna')).toBeInTheDocument();
        expect(screen.getByText('Split your payment into 3 interest-free instalments')).toBeInTheDocument();
      });
    });

    it('should handle BNPL ineligibility', async () => {
      (fetch as jest.Mock).mockImplementation((url) => {
        if (url.includes('bnpl/eligibility')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({
              eligible: false,
              reason: 'Amount too low'
            })
          });
        }
        return Promise.resolve({ ok: true, json: () => Promise.resolve({ success: true }) });
      });

      const user = userEvent.setup();
      render(<EnhancedPaymentProcessor {...mockProps} amount={1000} />); // £10 - too low
      
      await waitFor(() => {
        expect(screen.getByText('Klarna - Pay in 3')).toBeInTheDocument();
      });

      const klarnaButton = screen.getByText('Klarna - Pay in 3').closest('button');
      if (klarnaButton) {
        await user.click(klarnaButton);
      }

      await waitFor(() => {
        expect(screen.getByText('Klarna Not Available')).toBeInTheDocument();
        expect(screen.getByText('Amount too low')).toBeInTheDocument();
      });
    });
  });

  describe('Bank Transfer Payments', () => {
    it('should validate UK bank details', async () => {
      const user = userEvent.setup();
      render(<EnhancedPaymentProcessor {...mockProps} />);
      
      await waitFor(() => {
        expect(screen.getByText('UK Bank Transfer')).toBeInTheDocument();
      });

      const bankButton = screen.getByText('UK Bank Transfer').closest('button');
      if (bankButton) {
        await user.click(bankButton);
      }

      await waitFor(() => {
        expect(screen.getByLabelText(/Account Holder Name/)).toBeInTheDocument();
        expect(screen.getByLabelText(/Sort Code/)).toBeInTheDocument();
        expect(screen.getByLabelText(/Account Number/)).toBeInTheDocument();
      });
    });

    it('should format sort codes correctly', async () => {
      const user = userEvent.setup();
      render(<EnhancedPaymentProcessor {...mockProps} />);
      
      await waitFor(() => {
        expect(screen.getByText('UK Bank Transfer')).toBeInTheDocument();
      });

      const bankButton = screen.getByText('UK Bank Transfer').closest('button');
      if (bankButton) {
        await user.click(bankButton);
      }

      const sortCodeInput = screen.getByLabelText(/Sort Code/) as HTMLInputElement;
      await user.type(sortCodeInput, '123456');

      expect(sortCodeInput.value).toBe('12-34-56');
    });

    it('should validate sort code format', async () => {
      const user = userEvent.setup();
      render(<EnhancedPaymentProcessor {...mockProps} />);
      
      await waitFor(() => {
        expect(screen.getByText('UK Bank Transfer')).toBeInTheDocument();
      });

      const bankButton = screen.getByText('UK Bank Transfer').closest('button');
      if (bankButton) {
        await user.click(bankButton);
      }

      const sortCodeInput = screen.getByLabelText(/Sort Code/);
      await user.type(sortCodeInput, '12345'); // Invalid - only 5 digits

      const submitButton = screen.getByText('Get Payment Instructions');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Sort code must be 6 digits')).toBeInTheDocument();
      });
    });
  });

  describe('Error Handling', () => {
    it('should display retry option for failed payments', async () => {
      const user = userEvent.setup();
      render(<EnhancedPaymentProcessor {...mockProps} />);
      
      // Simulate an error
      await waitFor(() => {
        expect(screen.getByText('Debit/Credit Card')).toBeInTheDocument();
      });

      const cardButton = screen.getByText('Debit/Credit Card').closest('button');
      if (cardButton) {
        await user.click(cardButton);
      }

      // Mock failed payment intent creation
      (fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          success: false,
          error: 'Network error'
        })
      });

      await waitFor(() => {
        expect(screen.getByText('Payment Error')).toBeInTheDocument();
        expect(screen.getByText('Try Again')).toBeInTheDocument();
      });
    });

    it('should limit retry attempts', async () => {
      const user = userEvent.setup();
      render(<EnhancedPaymentProcessor {...mockProps} />);
      
      // Mock multiple failed attempts
      (fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          success: false,
          error: 'Persistent error'
        })
      });

      await waitFor(() => {
        expect(screen.getByText('Debit/Credit Card')).toBeInTheDocument();
      });

      const cardButton = screen.getByText('Debit/Credit Card').closest('button');
      if (cardButton) {
        await user.click(cardButton);
      }

      // Click retry multiple times
      for (let i = 0; i < 4; i++) {
        await waitFor(() => {
          const retryButton = screen.queryByText('Try Again');
          if (retryButton) {
            user.click(retryButton);
          }
        });
      }

      // After 3 retries, button should be hidden
      await waitFor(() => {
        expect(screen.queryByText('Try Again')).not.toBeInTheDocument();
      });
    });
  });

  describe('Payment State Management', () => {
    it('should call onStateChange when state updates', async () => {
      const user = userEvent.setup();
      render(<EnhancedPaymentProcessor {...mockProps} />);
      
      await waitFor(() => {
        expect(screen.getByText('Debit/Credit Card')).toBeInTheDocument();
      });

      const cardButton = screen.getByText('Debit/Credit Card').closest('button');
      if (cardButton) {
        await user.click(cardButton);
      }

      await waitFor(() => {
        expect(mockProps.onStateChange).toHaveBeenCalledWith('selecting_method');
      });
    });

    it('should show processing state during payment', async () => {
      const user = userEvent.setup();
      render(<EnhancedPaymentProcessor {...mockProps} />);
      
      await waitFor(() => {
        expect(screen.getByText('Debit/Credit Card')).toBeInTheDocument();
      });

      const cardButton = screen.getByText('Debit/Credit Card').closest('button');
      if (cardButton) {
        await user.click(cardButton);
      }

      await waitFor(() => {
        expect(screen.getByText('Processing your payment...')).toBeInTheDocument();
      });
    });

    it('should show success state on completed payment', async () => {
      const user = userEvent.setup();
      const mockSuccessResult = {
        success: true,
        paymentIntent: {
          id: 'pi_test_success',
          status: 'succeeded',
          amount: 5000,
          currency: 'gbp',
          paymentMethod: 'card' as PaymentMethodType
        }
      };

      render(<EnhancedPaymentProcessor {...mockProps} />);
      
      // Simulate successful payment
      setTimeout(() => {
        mockProps.onSuccess(mockSuccessResult);
      }, 100);

      await waitFor(() => {
        expect(screen.getByText('Payment Successful!')).toBeInTheDocument();
        expect(screen.getByText('Redirecting to confirmation page...')).toBeInTheDocument();
      });
    });
  });

  describe('Payment Analytics', () => {
    it('should track payment method selection', async () => {
      const user = userEvent.setup();
      render(<EnhancedPaymentProcessor {...mockProps} />);
      
      await waitFor(() => {
        expect(screen.getByText('Debit/Credit Card')).toBeInTheDocument();
      });

      const cardButton = screen.getByText('Debit/Credit Card').closest('button');
      if (cardButton) {
        await user.click(cardButton);
      }

      // Should track analytics
      await waitFor(() => {
        expect(fetch).toHaveBeenCalledWith('/api/analytics/payment', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: expect.stringContaining('card')
        });
      });
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels', async () => {
      render(<EnhancedPaymentProcessor {...mockProps} />);
      
      await waitFor(() => {
        const paymentSection = screen.getByRole('region', { name: /payment/i });
        expect(paymentSection).toBeInTheDocument();
      });
    });

    it('should support keyboard navigation', async () => {
      const user = userEvent.setup();
      render(<EnhancedPaymentProcessor {...mockProps} />);
      
      await waitFor(() => {
        expect(screen.getByText('Debit/Credit Card')).toBeInTheDocument();
      });

      // Should be able to tab to payment methods
      await user.tab();
      expect(document.activeElement).toHaveClass('cursor-pointer');
    });

    it('should announce state changes to screen readers', async () => {
      render(<EnhancedPaymentProcessor {...mockProps} />);
      
      await waitFor(() => {
        expect(screen.getByText('Complete Your Payment')).toHaveAttribute('role', 'heading');
      });
    });
  });
});