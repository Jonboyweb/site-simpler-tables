import { 
  sendMultiChannelNotification, 
  trackNotificationDelivery 
} from '@/lib/notifications/multi-channel-service';
import { 
  mockCustomer, 
  mockEmailService, 
  mockSMSService, 
  mockPushService 
} from '@/tests/mocks/notification-mocks';
import { NotificationChannel, NotificationPriority } from '@/types/notifications';

describe('Multi-Channel Notification Delivery', () => {
  test('Sends coordinated notifications across email, SMS, and push', async () => {
    const customer = await mockCustomer();
    const notificationPayload = {
      customerId: customer.id,
      message: 'Your table is now available at The Backroom Leeds!',
      priority: NotificationPriority.HIGH,
      channels: [
        NotificationChannel.EMAIL, 
        NotificationChannel.SMS, 
        NotificationChannel.PUSH
      ]
    };

    // Send multi-channel notifications
    const multiChannelResult = await sendMultiChannelNotification(notificationPayload);

    // Validate email notification
    const emailDelivery = multiChannelResult.email;
    expect(emailDelivery.sent).toBe(true);
    expect(emailDelivery.recipient).toBe(customer.email);

    // Validate SMS notification
    const smsDelivery = multiChannelResult.sms;
    expect(smsDelivery.sent).toBe(true);
    expect(smsDelivery.recipient).toBe(customer.phone);

    // Validate push notification
    const pushDelivery = multiChannelResult.push;
    expect(pushDelivery.sent).toBe(true);

    // Track notification delivery status
    const trackingResult = await trackNotificationDelivery(multiChannelResult.trackingId);
    
    expect(trackingResult.status).toBe('DELIVERED');
    expect(trackingResult.readReceipts.email).toBeDefined();
    expect(trackingResult.readReceipts.sms).toBeDefined();
    expect(trackingResult.readReceipts.push).toBeDefined();
  }, 30000);

  test('Handles notification delivery failures gracefully', async () => {
    const customer = await mockCustomer();
    
    // Simulate service failures
    mockEmailService.simulateFailure();
    mockSMSService.simulateRateLimitExceeded();

    const notificationPayload = {
      customerId: customer.id,
      message: 'Backup notification from The Backroom',
      priority: NotificationPriority.CRITICAL,
      channels: [
        NotificationChannel.EMAIL, 
        NotificationChannel.SMS, 
        NotificationChannel.FALLBACK_CALL
      ]
    };

    const multiChannelResult = await sendMultiChannelNotification(notificationPayload);

    // Email and SMS should fail, fallback call should be triggered
    expect(multiChannelResult.email.sent).toBe(false);
    expect(multiChannelResult.sms.sent).toBe(false);
    expect(multiChannelResult.fallbackCall.sent).toBe(true);

    // Error logging and reporting
    const errorLog = await retrieveNotificationErrorLog(multiChannelResult.trackingId);
    expect(errorLog.failures).toContain('EMAIL_SERVICE_UNAVAILABLE');
    expect(errorLog.failures).toContain('SMS_RATE_LIMIT_EXCEEDED');
  }, 30000);
});