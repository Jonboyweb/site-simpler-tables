import { EmailServiceManager } from '@/lib/email/providers/email-service-manager';
import { ResendProvider } from '@/lib/email/providers/resend';
import { PostmarkProvider } from '@/lib/email/providers/postmark';
import { AWSSESProvider } from '@/lib/email/providers/aws-ses';

describe('EmailServiceManager', () => {
  let emailServiceManager: EmailServiceManager;
  let mockResendProvider: jest.Mocked<ResendProvider>;
  let mockPostmarkProvider: jest.Mocked<PostmarkProvider>;
  let mockAWSSESProvider: jest.Mocked<AWSSESProvider>;

  beforeEach(() => {
    mockResendProvider = {
      sendEmail: jest.fn(),
      validateApiKey: jest.fn(),
      getHealthStatus: jest.fn()
    } as any;

    mockPostmarkProvider = {
      sendEmail: jest.fn(),
      validateApiKey: jest.fn(),
      getHealthStatus: jest.fn()
    } as any;

    mockAWSSESProvider = {
      sendEmail: jest.fn(),
      validateApiKey: jest.fn(),
      getHealthStatus: jest.fn()
    } as any;

    emailServiceManager = new EmailServiceManager(
      mockResendProvider,
      mockPostmarkProvider,
      mockAWSSESProvider
    );
  });

  describe('Provider Failover', () => {
    test('automatically switches to next provider on failure', async () => {
      // Simulate Resend failure
      mockResendProvider.sendEmail.mockRejectedValueOnce(new Error('Resend failed'));
      mockPostmarkProvider.sendEmail.mockResolvedValueOnce({ messageId: 'postmark-success' });

      const result = await emailServiceManager.sendEmail({
        to: 'test@example.com',
        subject: 'Test Email',
        html: '<p>Test Content</p>'
      });

      expect(mockResendProvider.sendEmail).toHaveBeenCalled();
      expect(mockPostmarkProvider.sendEmail).toHaveBeenCalled();
      expect(result.provider).toBe('Postmark');
    });

    test('tries all providers before throwing an error', async () => {
      mockResendProvider.sendEmail.mockRejectedValueOnce(new Error('Resend failed'));
      mockPostmarkProvider.sendEmail.mockRejectedValueOnce(new Error('Postmark failed'));
      mockAWSSESProvider.sendEmail.mockRejectedValueOnce(new Error('AWS SES failed'));

      await expect(emailServiceManager.sendEmail({
        to: 'test@example.com',
        subject: 'Test Email',
        html: '<p>Test Content</p>'
      })).rejects.toThrow('All email providers have failed');
    });
  });

  describe('Provider Health Monitoring', () => {
    test('tracks provider health status', async () => {
      mockResendProvider.getHealthStatus.mockResolvedValueOnce({
        isHealthy: false,
        lastError: new Error('Rate limit exceeded')
      });

      const healthStatus = await emailServiceManager.checkProvidersHealth();

      expect(healthStatus.Resend.isHealthy).toBe(false);
      expect(healthStatus.Resend.lastError).toBeDefined();
    });
  });

  describe('API Key Validation', () => {
    test('validates API keys for all providers', async () => {
      mockResendProvider.validateApiKey.mockResolvedValueOnce(true);
      mockPostmarkProvider.validateApiKey.mockResolvedValueOnce(true);
      mockAWSSESProvider.validateApiKey.mockResolvedValueOnce(true);

      const validationResults = await emailServiceManager.validateAllApiKeys();

      expect(validationResults).toEqual({
        Resend: true,
        Postmark: true,
        'AWS SES': true
      });
    });
  });

  describe('Cost Optimization', () => {
    test('selects provider based on volume and cost', async () => {
      const cheapProvider = await emailServiceManager.selectOptimalProvider(100);
      
      expect(['Resend', 'Postmark', 'AWS SES']).toContain(cheapProvider);
    });
  });
});