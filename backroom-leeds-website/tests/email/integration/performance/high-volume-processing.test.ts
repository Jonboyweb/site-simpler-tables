import { faker } from '@faker-js/faker';
import { generateTestBookingData } from '../setup-tests';
import { EmailBatchProcessingService } from '@/services/email/batch-processing-service';
import { ResendEmailProvider } from '@/services/email/providers/resend-provider';
import { PostmarkEmailProvider } from '@/services/email/providers/postmark-provider';

describe('High-Volume Email Processing Integration', () => {
  let batchProcessingService: EmailBatchProcessingService;
  let resendProvider: ResendEmailProvider;
  let postmarkProvider: PostmarkEmailProvider;

  beforeEach(() => {
    resendProvider = new ResendEmailProvider();
    postmarkProvider = new PostmarkEmailProvider();
    
    batchProcessingService = new EmailBatchProcessingService(
      [resendProvider, postmarkProvider],
      {
        maxConcurrentBatches: 3,
        emailsPerBatch: 500,
        retryAttempts: 3
      }
    );
  });

  test('Processes 1000 booking confirmations during peak periods', async () => {
    // Generate 1000 test booking data entries
    const bookingData = Array.from({ length: 1000 }, () => generateTestBookingData());

    // Performance tracking
    const startTime = Date.now();

    // Process batch of booking confirmation emails
    const batchResult = await batchProcessingService.processEmailBatch(
      bookingData.map(booking => ({
        recipient: booking.booking.customer_email,
        subject: 'Weekend Booking Confirmation',
        template: 'booking_confirmation',
        data: booking
      }))
    );

    const processingTime = Date.now() - startTime;

    // Validate batch processing results
    expect(batchResult).toEqual(
      expect.objectContaining({
        totalEmails: 1000,
        successfulDeliveries: expect.any(Number),
        failedDeliveries: expect.any(Number),
        providersUsed: expect.arrayContaining(['resend', 'postmark'])
      })
    );

    // Performance assertions
    expect(processingTime).toBeLessThan(60000); // Under 60 seconds
    expect(batchResult.successfulDeliveries).toBeGreaterThan(900); // Over 90% success rate
  });

  test('Handles segmented email campaign with rate limiting', async () => {
    // Simulate customer segmentation for weekly events
    const eventTypes = ['LA FIESTA', 'SHHH!', 'NOSTALGIA'];
    
    const segmentedCampaign = eventTypes.map(eventType => 
      Array.from({ length: 350 }, () => {
        const bookingData = generateTestBookingData();
        return {
          recipient: bookingData.booking.customer_email,
          subject: `Upcoming ${eventType} Event`,
          template: 'event_promotion',
          data: {
            ...bookingData,
            eventType
          }
        };
      })
    );

    const campaignResults = await Promise.all(
      segmentedCampaign.map(segment => 
        batchProcessingService.processEmailBatch(segment)
      )
    );

    // Validate segmented campaign results
    campaignResults.forEach((result, index) => {
      expect(result).toEqual(
        expect.objectContaining({
          totalEmails: 350,
          event: eventTypes[index],
          successfulDeliveries: expect.any(Number),
          deliveryRate: expect.any(Number)
        })
      );
    });
  });

  test('Provider load balancing and performance metrics', async () => {
    // Generate mixed booking data
    const bookingData = Array.from({ length: 500 }, () => generateTestBookingData());

    // Spy on provider send methods
    const resendSpy = jest.spyOn(resendProvider, 'send');
    const postmarkSpy = jest.spyOn(postmarkProvider, 'send');

    // Process batch
    await batchProcessingService.processEmailBatch(
      bookingData.map(booking => ({
        recipient: booking.booking.customer_email,
        subject: 'Booking Update',
        template: 'booking_update',
        data: booking
      }))
    );

    // Validate provider load distribution
    expect(resendSpy).toHaveBeenCalledTimes(expect.any(Number));
    expect(postmarkSpy).toHaveBeenCalledTimes(expect.any(Number));

    // Validate performance metrics
    const providerMetrics = batchProcessingService.getProviderPerformanceMetrics();
    
    expect(providerMetrics).toEqual(
      expect.objectContaining({
        resend: expect.objectContaining({
          averageResponseTime: expect.any(Number),
          successRate: expect.any(Number)
        }),
        postmark: expect.objectContaining({
          averageResponseTime: expect.any(Number),
          successRate: expect.any(Number)
        })
      })
    );
  });
});