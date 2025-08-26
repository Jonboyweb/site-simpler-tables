import { faker } from '@faker-js/faker';
import { generateTestBookingData } from '../setup-tests';
import { BookingConfirmationEmailService } from '@/services/email/booking-confirmation-service';
import { StripePaymentService } from '@/services/payment/stripe-payment-service';
import { QRCodeService } from '@/services/qr-code/qr-code-service';
import { ResendEmailProvider } from '@/services/email/providers/resend-provider';
import { PostmarkEmailProvider } from '@/services/email/providers/postmark-provider';

describe('Complete Booking Confirmation Integration Workflow', () => {
  let bookingData: ReturnType<typeof generateTestBookingData>;
  let confirmationService: BookingConfirmationEmailService;
  let stripePaymentService: StripePaymentService;
  let qrCodeService: QRCodeService;
  let resendProvider: ResendEmailProvider;
  let postmarkProvider: PostmarkEmailProvider;

  beforeEach(() => {
    // Generate fresh test booking data
    bookingData = generateTestBookingData();

    // Initialize services and providers
    stripePaymentService = new StripePaymentService();
    qrCodeService = new QRCodeService();
    resendProvider = new ResendEmailProvider();
    postmarkProvider = new PostmarkEmailProvider();
    confirmationService = new BookingConfirmationEmailService(
      resendProvider, 
      postmarkProvider, 
      qrCodeService
    );
  });

  test('End-to-end booking confirmation with QR code delivery', async () => {
    // 1. Validate payment via Stripe
    const paymentResult = await stripePaymentService.processBookingPayment(
      bookingData.payment.stripe_payment_intent_id, 
      bookingData.payment.total_amount
    );
    expect(paymentResult.status).toBe('succeeded');

    // 2. Generate QR code for booking
    const qrCode = await qrCodeService.generateBookingQRCode(bookingData.booking.id);
    expect(qrCode).toBeTruthy();

    // 3. Send booking confirmation email
    const emailResult = await confirmationService.sendBookingConfirmation(
      bookingData.booking, 
      bookingData.customer, 
      qrCode
    );

    // 4. Validate email delivery results
    expect(emailResult).toEqual(
      expect.objectContaining({
        messageId: expect.any(String),
        status: 'sent',
        provider: expect.stringMatching(/resend|postmark/),
        trackingData: expect.any(Object)
      })
    );

    // 5. Verify tracking and audit information
    expect(emailResult.trackingData).toEqual(
      expect.objectContaining({
        timestamp: expect.any(Date),
        recipients: expect.arrayContaining([
          bookingData.booking.customer_email
        ]),
        templateId: expect.any(String)
      })
    );
  });

  test('Email delivery failover mechanism', async () => {
    // Simulate Resend provider failure
    jest.spyOn(resendProvider, 'send').mockRejectedValue(new Error('Resend service unavailable'));

    // Force fallback to Postmark
    const emailResult = await confirmationService.sendBookingConfirmation(
      bookingData.booking, 
      bookingData.customer
    );

    // Verify Postmark provider was used
    expect(emailResult.provider).toBe('postmark');
    expect(emailResult.status).toBe('sent');
  });

  test('GDPR compliance in email tracking', async () => {
    // Disable email tracking for non-consenting customer
    const nonConsentCustomer = {
      ...bookingData.customer,
      email_consent: {
        ...bookingData.customer.email_consent,
        tracking: false
      }
    };

    const emailResult = await confirmationService.sendBookingConfirmation(
      bookingData.booking, 
      nonConsentCustomer
    );

    // Verify no tracking pixels or external tracking
    expect(emailResult.trackingData.gdprCompliant).toBe(true);
    expect(emailResult.trackingData.pixelsEnabled).toBe(false);
  });
});