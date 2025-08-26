import { render } from '@testing-library/react';
import { BookingConfirmationTemplate } from '@/components/email/templates/booking-confirmation';
import { mockBookingConfirmation } from '@/tests/mocks/email-mock-data';

describe('Booking Confirmation Email Template', () => {
  const mockProps = mockBookingConfirmation;

  test('renders customer name correctly', () => {
    const { getByText } = render(<BookingConfirmationTemplate {...mockProps} />);
    expect(getByText(`Hi ${mockProps.customer.name},`)).toBeInTheDocument();
  });

  test('displays booking reference', () => {
    const { getByText } = render(<BookingConfirmationTemplate {...mockProps} />);
    expect(getByText(mockProps.booking.reference)).toBeInTheDocument();
  });

  test('shows QR code check-in details', () => {
    const { getByText } = render(<BookingConfirmationTemplate {...mockProps} />);
    expect(getByText(`Check-in Code: ${mockProps.qrCode.checkInCode}`)).toBeInTheDocument();
  });

  test('includes payment details', () => {
    const { getByText } = render(<BookingConfirmationTemplate {...mockProps} />);
    expect(getByText(`Total Amount: £${mockProps.payment.totalAmount}`)).toBeInTheDocument();
    expect(getByText(`Deposit Paid: £${mockProps.payment.depositPaid}`)).toBeInTheDocument();
  });

  test('displays event and table details', () => {
    const { getByText } = render(<BookingConfirmationTemplate {...mockProps} />);
    expect(getByText(`Date: ${mockProps.booking.date}`)).toBeInTheDocument();
    expect(getByText(`Table Number: ${mockProps.booking.tableNumber}`)).toBeInTheDocument();
    expect(getByText(`Party Size: ${mockProps.booking.partySize}`)).toBeInTheDocument();
  });

  test('renders prohibition-era themed styling', () => {
    const { container } = render(<BookingConfirmationTemplate {...mockProps} />);
    const emailContainer = container.firstChild as HTMLElement;
    
    expect(emailContainer).toHaveStyle({
      backgroundColor: '#1A1A1A',  // Dark, speakeasy-inspired background
      color: '#F5DEB3'  // Aged paper/parchment text color
    });
  });

  test('shows special requests if present', () => {
    const { getByText } = render(<BookingConfirmationTemplate {...mockProps} />);
    expect(getByText(`Special Requests: ${mockProps.booking.specialRequests}`)).toBeInTheDocument();
  });

  test('includes cancellation policy reminder', () => {
    const { getByText } = render(<BookingConfirmationTemplate {...mockProps} />);
    expect(getByText(/48-hour cancellation policy/i)).toBeInTheDocument();
  });
});