import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import BookingForm from '@/components/organisms/BookingForm';
import { mockTableAvailability, mockBookingData } from '../../fixtures/table-booking';

expect.extend(toHaveNoViolations);

describe('BookingForm Component', () => {
  const mockOnSubmit = jest.fn();

  beforeEach(() => {
    mockOnSubmit.mockClear();
  });

  it('renders all form steps', () => {
    render(
      <BookingForm 
        tableAvailability={mockTableAvailability} 
        onSubmit={mockOnSubmit} 
      />
    );

    // Check for key form sections
    expect(screen.getByText(/Select Table/i)).toBeInTheDocument();
    expect(screen.getByText(/Customer Details/i)).toBeInTheDocument();
    expect(screen.getByText(/Package Selection/i)).toBeInTheDocument();
  });

  it('validates customer details inputs', async () => {
    render(
      <BookingForm 
        tableAvailability={mockTableAvailability} 
        onSubmit={mockOnSubmit} 
      />
    );

    // Navigate to customer details step
    fireEvent.click(screen.getByText(/Select Table/i));
    fireEvent.click(screen.getByText(/downstairs table/i));
    fireEvent.click(screen.getByText(/Next/i));

    // Try submitting invalid details
    fireEvent.click(screen.getByText(/Next/i));

    // Check for validation errors
    await waitFor(() => {
      expect(screen.getByText(/Name is required/i)).toBeInTheDocument();
      expect(screen.getByText(/Email is required/i)).toBeInTheDocument();
      expect(screen.getByText(/Phone number is required/i)).toBeInTheDocument();
    });
  });

  it('handles complete booking flow', async () => {
    render(
      <BookingForm 
        tableAvailability={mockTableAvailability} 
        onSubmit={mockOnSubmit} 
      />
    );

    // Table selection
    fireEvent.click(screen.getByText(/downstairs table/i));
    fireEvent.click(screen.getByText(/Next/i));

    // Customer details
    fireEvent.change(screen.getByLabelText(/Name/i), { target: { value: mockBookingData.customerDetails.name } });
    fireEvent.change(screen.getByLabelText(/Email/i), { target: { value: mockBookingData.customerDetails.email } });
    fireEvent.change(screen.getByLabelText(/Phone/i), { target: { value: mockBookingData.customerDetails.phone } });
    fireEvent.click(screen.getByText(/Next/i));

    // Package selection
    fireEvent.click(screen.getByText(/Premium Package/i));
    fireEvent.click(screen.getByText(/Confirm Booking/i));

    // Check submission
    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith(expect.objectContaining({
        tableId: 2,
        customerName: mockBookingData.customerDetails.name,
        packageId: 'premium-package',
      }));
    });
  });

  it('meets accessibility standards', async () => {
    const { container } = render(
      <BookingForm 
        tableAvailability={mockTableAvailability} 
        onSubmit={mockOnSubmit} 
      />
    );

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('handles GDPR consent', () => {
    render(
      <BookingForm 
        tableAvailability={mockTableAvailability} 
        onSubmit={mockOnSubmit} 
      />
    );

    // Ensure GDPR consent checkbox is present and required
    const gdprConsent = screen.getByLabelText(/I agree to the data handling policy/i);
    expect(gdprConsent).toBeInTheDocument();
    expect(gdprConsent).toBeRequired();
  });
});