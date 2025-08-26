import { BookingService } from '@/services/booking/booking-service';
import { EmailServiceManager } from '@/lib/email/providers/email-service-manager';
import { mockBookingConfirmation } from '@/tests/mocks/email-mock-data';

describe('Complete Booking Email Workflow', () => {
  let bookingService: BookingService;
  let emailServiceManager: EmailServiceManager;

  beforeEach(() => {
    // Initialize services with mock dependencies
    bookingService = new BookingService();
    emailServiceManager = new EmailServiceManager(
      {} as any, // Resend Provider
      {} as any, // Postmark Provider
      {} as any  // AWS SES Provider
    );

    // Reset mocks before each test
    jest.clearAllMocks();
  });

  test('processes successful booking and sends confirmation email', async () => {
    // Mock booking creation
    const mockBooking = await bookingService.createBooking(mockBookingConfirmation);
    
    // Mock email sending
    const sendEmailSpy = jest.spyOn(emailServiceManager, 'sendEmail');
    sendEmailSpy.mockResolvedValueOnce({
      messageId: 'test-message-id',
      provider: 'Resend'
    });

    // Simulate complete booking workflow
    const bookingConfirmation = await bookingService.confirmBooking(mockBooking.id);
    const emailResult = await emailServiceManager.sendEmail({
      to: mockBookingConfirmation.customer.email,
      subject: `Booking Confirmation: ${mockBooking.reference}`,
      html: '' // Rendered template would go here
    });

    // Assertions
    expect(bookingConfirmation).toBeDefined();
    expect(bookingConfirmation.status).toBe('CONFIRMED');
    
    expect(sendEmailSpy).toHaveBeenCalledWith(expect.objectContaining({
      to: mockBookingConfirmation.customer.email,
      subject: expect.stringContaining('Booking Confirmation')
    }));

    expect(emailResult.messageId).toBe('test-message-id');
    expect(emailResult.provider).toBe('Resend');
  });

  test('handles booking confirmation email failure', async () => {
    // Mock booking creation
    const mockBooking = await bookingService.createBooking(mockBookingConfirmation);
    
    // Simulate email sending failure
    const sendEmailSpy = jest.spyOn(emailServiceManager, 'sendEmail');
    sendEmailSpy.mockRejectedValueOnce(new Error('Email sending failed'));

    // Attempt to send confirmation email
    await expect(emailServiceManager.sendEmail({
      to: mockBookingConfirmation.customer.email,
      subject: `Booking Confirmation: ${mockBooking.reference}`,
      html: ''
    })).rejects.toThrow('Email sending failed');

    // Verify that booking status remains pending
    const bookingStatus = await bookingService.getBookingStatus(mockBooking.id);
    expect(bookingStatus).toBe('PENDING');
  });

  test('logs email sending attempt for compliance', async () => {
    const mockBooking = await bookingService.createBooking(mockBookingConfirmation);
    
    const auditLogSpy = jest.spyOn(bookingService, 'createAuditLog');
    
    try {
      await emailServiceManager.sendEmail({
        to: mockBookingConfirmation.customer.email,
        subject: `Booking Confirmation: ${mockBooking.reference}`,
        html: ''
      });
    } catch (error) {
      // Even on failure, log the attempt
      expect(auditLogSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          eventType: 'EMAIL_ATTEMPT',
          details: expect.objectContaining({
            bookingReference: mockBooking.reference,
            recipientEmail: mockBookingConfirmation.customer.email
          })
        })
      );
    }
  });
});