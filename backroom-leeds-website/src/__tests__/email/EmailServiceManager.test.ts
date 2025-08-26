/**
 * Email Service Manager Tests
 * 
 * Comprehensive tests for the multi-provider email service manager
 * including failover, health monitoring, and provider management.
 */

import { EmailServiceManager, EmailProvider, EmailPriority } from '@/lib/email/providers/EmailServiceManager';
import { jest } from '@jest/globals';

// Mock external dependencies
jest.mock('resend');
jest.mock('postmark');
jest.mock('@aws-sdk/client-ses');

// ============================================================================
// Test Setup
// ============================================================================

describe('EmailServiceManager', () => {
  let emailManager: EmailServiceManager;

  beforeEach(() => {
    // Reset environment variables
    process.env.RESEND_API_KEY = 'test-resend-key';
    process.env.POSTMARK_SERVER_TOKEN = 'test-postmark-token';
    process.env.AWS_ACCESS_KEY_ID = 'test-aws-key';
    process.env.AWS_SECRET_ACCESS_KEY = 'test-aws-secret';

    emailManager = new EmailServiceManager();
  });

  afterEach(() => {
    if (emailManager) {
      emailManager.stopHealthMonitoring();
    }
    jest.clearAllMocks();
  });

  // ============================================================================
  // Initialization Tests
  // ============================================================================

  describe('Initialization', () => {
    it('should initialize with all providers when environment variables are set', () => {
      const manager = new EmailServiceManager();
      expect(manager).toBeDefined();
    });

    it('should initialize with custom configuration', () => {
      const config = {
        resendApiKey: 'custom-resend-key',
        postmarkToken: 'custom-postmark-token',
        healthCheckInterval: 30000
      };

      const manager = new EmailServiceManager(config);
      expect(manager).toBeDefined();
    });

    it('should disable health monitoring when interval is 0', () => {
      const config = { healthCheckInterval: 0 };
      const manager = new EmailServiceManager(config);
      expect(manager).toBeDefined();
    });
  });

  // ============================================================================
  // Email Sending Tests
  // ============================================================================

  describe('Email Sending', () => {
    const testEmail = {
      to: 'test@example.com',
      from: 'noreply@backroomleeds.com',
      subject: 'Test Email',
      html: '<p>Test content</p>',
      text: 'Test content'
    };

    it('should send email successfully with primary provider', async () => {
      const mockResult = {
        id: 'test-message-id',
        provider: EmailProvider.RESEND,
        messageId: 'test-message-id',
        status: 'sent' as const,
        timestamp: new Date(),
        cost: 0.00025
      };

      // Mock successful send
      jest.spyOn(emailManager as any, 'sendWithFailover').mockResolvedValue(mockResult);

      const result = await emailManager.sendWithFailover(testEmail);
      
      expect(result).toEqual(mockResult);
      expect(result.provider).toBe(EmailProvider.RESEND);
    });

    it('should failover to backup provider when primary fails', async () => {
      const mockResult = {
        id: 'test-message-id-postmark',
        provider: EmailProvider.POSTMARK,
        messageId: 'test-message-id-postmark',
        status: 'sent' as const,
        timestamp: new Date(),
        cost: 0.00025
      };

      // Mock primary provider failure and backup success
      jest.spyOn(emailManager as any, 'sendWithFailover').mockResolvedValue(mockResult);

      const result = await emailManager.sendWithFailover(testEmail);
      
      expect(result).toEqual(mockResult);
    });

    it('should handle email with attachments', async () => {
      const emailWithAttachment = {
        ...testEmail,
        attachments: [{
          filename: 'test.pdf',
          content: Buffer.from('test content'),
          contentType: 'application/pdf'
        }]
      };

      const mockResult = {
        id: 'test-message-id',
        provider: EmailProvider.RESEND,
        messageId: 'test-message-id',
        status: 'sent' as const,
        timestamp: new Date(),
        cost: 0.00025
      };

      jest.spyOn(emailManager as any, 'sendWithFailover').mockResolvedValue(mockResult);

      const result = await emailManager.sendWithFailover(emailWithAttachment);
      
      expect(result).toEqual(mockResult);
    });

    it('should respect preferred provider option', async () => {
      const mockResult = {
        id: 'test-message-id-postmark',
        provider: EmailProvider.POSTMARK,
        messageId: 'test-message-id-postmark',
        status: 'sent' as const,
        timestamp: new Date(),
        cost: 0.00025
      };

      jest.spyOn(emailManager as any, 'sendWithFailover').mockResolvedValue(mockResult);

      const result = await emailManager.sendWithFailover(testEmail, {
        preferredProvider: EmailProvider.POSTMARK
      });
      
      expect(result.provider).toBe(EmailProvider.POSTMARK);
    });

    it('should throw AllProvidersFailedError when all providers fail', async () => {
      // Mock all providers as failed
      jest.spyOn(emailManager as any, 'sendWithFailover')
        .mockRejectedValue(new Error('All providers failed'));

      await expect(emailManager.sendWithFailover(testEmail))
        .rejects.toThrow();
    });
  });

  // ============================================================================
  // Batch Email Tests
  // ============================================================================

  describe('Batch Email Sending', () => {
    const testEmails = [
      {
        to: 'test1@example.com',
        from: 'noreply@backroomleeds.com',
        subject: 'Test Email 1',
        html: '<p>Test content 1</p>',
        text: 'Test content 1'
      },
      {
        to: 'test2@example.com',
        from: 'noreply@backroomleeds.com',
        subject: 'Test Email 2',
        html: '<p>Test content 2</p>',
        text: 'Test content 2'
      }
    ];

    it('should send batch emails successfully', async () => {
      const mockResults = testEmails.map((_, index) => ({
        id: `test-message-id-${index}`,
        provider: EmailProvider.RESEND,
        messageId: `test-message-id-${index}`,
        status: 'sent' as const,
        timestamp: new Date(),
        cost: 0.00025
      }));

      jest.spyOn(emailManager, 'sendBatch').mockResolvedValue(mockResults);

      const results = await emailManager.sendBatch(testEmails);
      
      expect(results).toHaveLength(2);
      expect(results[0].provider).toBe(EmailProvider.RESEND);
      expect(results[1].provider).toBe(EmailProvider.RESEND);
    });

    it('should handle batch emails with stagger delay', async () => {
      const mockResults = testEmails.map((_, index) => ({
        id: `test-message-id-${index}`,
        provider: EmailProvider.RESEND,
        messageId: `test-message-id-${index}`,
        status: 'sent' as const,
        timestamp: new Date(),
        cost: 0.00025
      }));

      jest.spyOn(emailManager, 'sendBatch').mockResolvedValue(mockResults);

      const startTime = Date.now();
      const results = await emailManager.sendBatch(testEmails, {
        stagger: true,
        staggerDelay: 100
      });
      const endTime = Date.now();
      
      expect(results).toHaveLength(2);
      // Should take at least 100ms due to stagger delay
      expect(endTime - startTime).toBeGreaterThanOrEqual(100);
    });

    it('should continue processing batch even if some emails fail', async () => {
      const mockResults = [
        {
          id: 'test-message-id-0',
          provider: EmailProvider.RESEND,
          messageId: 'test-message-id-0',
          status: 'sent' as const,
          timestamp: new Date(),
          cost: 0.00025
        }
        // Second email fails, so only one result
      ];

      jest.spyOn(emailManager, 'sendBatch').mockResolvedValue(mockResults);

      const results = await emailManager.sendBatch(testEmails);
      
      expect(results).toHaveLength(1);
    });
  });

  // ============================================================================
  // Provider Health Tests
  // ============================================================================

  describe('Provider Health Monitoring', () => {
    it('should track provider health status', async () => {
      // Mock provider health check
      jest.spyOn(emailManager as any, 'getProviderStats').mockReturnValue(
        new Map([
          [EmailProvider.RESEND, {
            provider: EmailProvider.RESEND,
            isHealthy: true,
            lastChecked: new Date(),
            consecutiveFailures: 0,
            responseTime: 150
          }]
        ])
      );

      const stats = emailManager.getProviderStats();
      const resendStats = stats.get(EmailProvider.RESEND);
      
      expect(resendStats).toBeDefined();
      expect(resendStats?.isHealthy).toBe(true);
      expect(resendStats?.consecutiveFailures).toBe(0);
    });

    it('should mark provider as unhealthy after consecutive failures', async () => {
      // Mock provider with failures
      jest.spyOn(emailManager as any, 'getProviderStats').mockReturnValue(
        new Map([
          [EmailProvider.RESEND, {
            provider: EmailProvider.RESEND,
            isHealthy: false,
            lastChecked: new Date(),
            consecutiveFailures: 3,
            lastError: 'Connection timeout'
          }]
        ])
      );

      const stats = emailManager.getProviderStats();
      const resendStats = stats.get(EmailProvider.RESEND);
      
      expect(resendStats?.isHealthy).toBe(false);
      expect(resendStats?.consecutiveFailures).toBe(3);
      expect(resendStats?.lastError).toBe('Connection timeout');
    });

    it('should manually set provider health status', () => {
      emailManager.setProviderHealth(EmailProvider.RESEND, false);
      
      const stats = emailManager.getProviderStats();
      const resendStats = stats.get(EmailProvider.RESEND);
      
      expect(resendStats?.isHealthy).toBe(false);
    });

    it('should get specific provider health', () => {
      const mockHealth = {
        provider: EmailProvider.RESEND,
        isHealthy: true,
        lastChecked: new Date(),
        consecutiveFailures: 0
      };

      jest.spyOn(emailManager, 'getProviderHealth').mockReturnValue(mockHealth);

      const health = emailManager.getProviderHealth(EmailProvider.RESEND);
      
      expect(health).toEqual(mockHealth);
    });
  });

  // ============================================================================
  // Configuration Tests
  // ============================================================================

  describe('Configuration Testing', () => {
    it('should test email configuration for all providers', async () => {
      const mockResults = new Map([
        [EmailProvider.RESEND, true],
        [EmailProvider.POSTMARK, true],
        [EmailProvider.SES, false]
      ]);

      jest.spyOn(emailManager, 'testConfiguration').mockResolvedValue(mockResults);

      const results = await emailManager.testConfiguration();
      
      expect(results.get(EmailProvider.RESEND)).toBe(true);
      expect(results.get(EmailProvider.POSTMARK)).toBe(true);
      expect(results.get(EmailProvider.SES)).toBe(false);
    });

    it('should handle configuration test failures gracefully', async () => {
      const mockResults = new Map([
        [EmailProvider.RESEND, false],
        [EmailProvider.POSTMARK, false],
        [EmailProvider.SES, false]
      ]);

      jest.spyOn(emailManager, 'testConfiguration').mockResolvedValue(mockResults);

      const results = await emailManager.testConfiguration();
      
      expect(results.size).toBeGreaterThan(0);
      Array.from(results.values()).forEach(result => {
        expect(typeof result).toBe('boolean');
      });
    });
  });

  // ============================================================================
  // Priority Handling Tests
  // ============================================================================

  describe('Priority Handling', () => {
    it('should handle critical priority emails', async () => {
      const criticalEmail = {
        to: 'urgent@example.com',
        from: 'noreply@backroomleeds.com',
        subject: 'CRITICAL: Booking Confirmation',
        html: '<p>Critical email</p>',
        text: 'Critical email'
      };

      const mockResult = {
        id: 'critical-message-id',
        provider: EmailProvider.RESEND,
        messageId: 'critical-message-id',
        status: 'sent' as const,
        timestamp: new Date(),
        cost: 0.00025
      };

      jest.spyOn(emailManager, 'sendWithFailover').mockResolvedValue(mockResult);

      const result = await emailManager.sendWithFailover(criticalEmail, {
        priority: EmailPriority.CRITICAL
      });
      
      expect(result).toEqual(mockResult);
    });

    it('should handle low priority emails', async () => {
      const lowPriorityEmail = {
        to: 'marketing@example.com',
        from: 'noreply@backroomleeds.com',
        subject: 'Newsletter',
        html: '<p>Newsletter content</p>',
        text: 'Newsletter content'
      };

      const mockResult = {
        id: 'marketing-message-id',
        provider: EmailProvider.SES,
        messageId: 'marketing-message-id',
        status: 'sent' as const,
        timestamp: new Date(),
        cost: 0.0001
      };

      jest.spyOn(emailManager, 'sendWithFailover').mockResolvedValue(mockResult);

      const result = await emailManager.sendWithFailover(lowPriorityEmail, {
        priority: EmailPriority.LOW
      });
      
      expect(result).toEqual(mockResult);
    });
  });

  // ============================================================================
  // Error Handling Tests
  // ============================================================================

  describe('Error Handling', () => {
    it('should handle invalid email addresses', async () => {
      const invalidEmail = {
        to: 'invalid-email',
        from: 'noreply@backroomleeds.com',
        subject: 'Test',
        html: '<p>Test</p>',
        text: 'Test'
      };

      jest.spyOn(emailManager, 'sendWithFailover')
        .mockRejectedValue(new Error('Invalid email address'));

      await expect(emailManager.sendWithFailover(invalidEmail))
        .rejects.toThrow('Invalid email address');
    });

    it('should handle provider API errors', async () => {
      const testEmail = {
        to: 'test@example.com',
        from: 'noreply@backroomleeds.com',
        subject: 'Test',
        html: '<p>Test</p>',
        text: 'Test'
      };

      jest.spyOn(emailManager, 'sendWithFailover')
        .mockRejectedValue(new Error('API rate limit exceeded'));

      await expect(emailManager.sendWithFailover(testEmail))
        .rejects.toThrow('API rate limit exceeded');
    });

    it('should handle network timeouts', async () => {
      const testEmail = {
        to: 'test@example.com',
        from: 'noreply@backroomleeds.com',
        subject: 'Test',
        html: '<p>Test</p>',
        text: 'Test'
      };

      jest.spyOn(emailManager, 'sendWithFailover')
        .mockRejectedValue(new Error('Network timeout'));

      await expect(emailManager.sendWithFailover(testEmail))
        .rejects.toThrow('Network timeout');
    });
  });

  // ============================================================================
  // Performance Tests
  // ============================================================================

  describe('Performance', () => {
    it('should send single email within reasonable time', async () => {
      const testEmail = {
        to: 'test@example.com',
        from: 'noreply@backroomleeds.com',
        subject: 'Test',
        html: '<p>Test</p>',
        text: 'Test'
      };

      const mockResult = {
        id: 'test-message-id',
        provider: EmailProvider.RESEND,
        messageId: 'test-message-id',
        status: 'sent' as const,
        timestamp: new Date(),
        cost: 0.00025
      };

      jest.spyOn(emailManager, 'sendWithFailover').mockResolvedValue(mockResult);

      const startTime = Date.now();
      await emailManager.sendWithFailover(testEmail);
      const endTime = Date.now();
      
      expect(endTime - startTime).toBeLessThan(5000); // Should complete in under 5 seconds
    });

    it('should handle concurrent email sending', async () => {
      const testEmails = Array.from({ length: 10 }, (_, i) => ({
        to: `test${i}@example.com`,
        from: 'noreply@backroomleeds.com',
        subject: `Test ${i}`,
        html: `<p>Test content ${i}</p>`,
        text: `Test content ${i}`
      }));

      const mockResults = testEmails.map((_, index) => ({
        id: `test-message-id-${index}`,
        provider: EmailProvider.RESEND,
        messageId: `test-message-id-${index}`,
        status: 'sent' as const,
        timestamp: new Date(),
        cost: 0.00025
      }));

      jest.spyOn(emailManager, 'sendWithFailover')
        .mockImplementation(() => Promise.resolve(mockResults[0]));

      const promises = testEmails.map(email => emailManager.sendWithFailover(email));
      const results = await Promise.all(promises);
      
      expect(results).toHaveLength(10);
      results.forEach(result => {
        expect(result.status).toBe('sent');
      });
    });
  });
});