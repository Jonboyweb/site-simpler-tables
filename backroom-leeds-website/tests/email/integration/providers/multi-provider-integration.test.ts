import { faker } from '@faker-js/faker';
import { generateTestBookingData } from '../setup-tests';
import { ResendEmailProvider } from '@/services/email/providers/resend-provider';
import { PostmarkEmailProvider } from '@/services/email/providers/postmark-provider';
import { EmailProviderManager } from '@/services/email/email-provider-manager';

describe('Multi-Provider Email Delivery Integration', () => {
  let providerManager: EmailProviderManager;
  let resendProvider: ResendEmailProvider;
  let postmarkProvider: PostmarkEmailProvider;

  beforeEach(() => {
    resendProvider = new ResendEmailProvider();
    postmarkProvider = new PostmarkEmailProvider();
    providerManager = new EmailProviderManager(
      [resendProvider, postmarkProvider],
      // Health check configuration
      {
        healthCheckInterval: 5000,
        failoverThreshold: 2,
        retryDelay: 1000
      }
    );
  });

  test('Automatic provider failover with delivery confirmation', async () => {
    const testBookingData = generateTestBookingData();

    // Simulate Resend service unavailability
    jest.spyOn(resendProvider, 'send').mockRejectedValue(new Error('Resend service unavailable'));

    // Attempt email sending
    const emailResult = await providerManager.sendEmail({
      to: testBookingData.booking.customer_email,
      subject: 'Booking Confirmation',
      template: 'booking_confirmation',
      data: testBookingData
    });

    // Verify successful delivery via fallback provider
    expect(emailResult).toEqual(
      expect.objectContaining({
        provider: 'postmark',
        status: 'sent',
        messageId: expect.any(String)
      })
    );

    // Verify provider health tracking
    const providerHealthStatus = providerManager.getProviderHealthStatus();
    expect(providerHealthStatus.resend.lastFailureCount).toBeGreaterThan(0);
    expect(providerHealthStatus.postmark.successCount).toBeGreaterThan(0);
  });

  test('Real-time provider health monitoring', async () => {
    // Simulate varied response times and error rates
    jest.spyOn(resendProvider, 'send').mockImplementation(async () => {
      if (Math.random() < 0.3) {
        throw new Error('Random Resend failure');
      }
      return { 
        messageId: faker.string.uuid(), 
        status: 'sent' 
      };
    });

    jest.spyOn(postmarkProvider, 'send').mockImplementation(async () => {
      return { 
        messageId: faker.string.uuid(), 
        status: 'sent' 
      };
    });

    // Send multiple emails to test health monitoring
    const emails = Array.from({ length: 10 }, () => generateTestBookingData());
    
    const sendPromises = emails.map(email => 
      providerManager.sendEmail({
        to: email.booking.customer_email,
        subject: 'Booking Confirmation',
        template: 'booking_confirmation',
        data: email
      })
    );

    await Promise.all(sendPromises);

    // Check provider health status
    const healthStatus = providerManager.getProviderHealthStatus();
    
    expect(healthStatus.resend.successRate).toBeLessThan(1);
    expect(healthStatus.postmark.successRate).toBe(1);
    expect(healthStatus.resend.failureCount).toBeGreaterThan(0);
  });

  test('Cost-optimized provider routing', async () => {
    // Configure provider cost profiles
    providerManager.setProviderCostProfile({
      resend: { baseRate: 0.0015, volumeDiscount: 0.0005 },
      postmark: { baseRate: 0.0020, volumeDiscount: 0.0007 }
    });

    const testBookingData = generateTestBookingData();

    // Send email and track cost
    const emailResult = await providerManager.sendEmail({
      to: testBookingData.booking.customer_email,
      subject: 'Booking Confirmation',
      template: 'booking_confirmation',
      data: testBookingData
    });

    // Verify cost-optimal provider selection
    const costAnalysis = providerManager.getProviderCostAnalysis();
    expect(costAnalysis.selectedProvider).toBe('resend');
    expect(emailResult.provider).toBe('resend');
  });
});