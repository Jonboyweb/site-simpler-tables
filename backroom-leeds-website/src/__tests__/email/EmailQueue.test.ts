/**
 * Email Queue Tests
 * 
 * Comprehensive tests for the BullMQ-based email queue system
 * including priority handling, retry logic, and dead letter queue.
 */

import { EmailQueue, EmailQueueJob, EmailPriority } from '@/lib/email/queue/EmailQueue';
import { jest } from '@jest/globals';

// Mock BullMQ
jest.mock('bullmq');
jest.mock('redis');

// ============================================================================
// Test Setup
// ============================================================================

describe('EmailQueue', () => {
  let emailQueue: EmailQueue;
  let mockRedis: any;
  let mockQueue: any;
  let mockWorker: any;
  let mockQueueEvents: any;

  beforeEach(() => {
    // Mock Redis client
    mockRedis = {
      connect: jest.fn().mockResolvedValue(undefined),
      disconnect: jest.fn().mockResolvedValue(undefined),
      isReady: true,
      setEx: jest.fn().mockResolvedValue('OK'),
      get: jest.fn().mockResolvedValue(null),
      del: jest.fn().mockResolvedValue(1),
      hIncrBy: jest.fn().mockResolvedValue(1),
      expire: jest.fn().mockResolvedValue(1),
      lPush: jest.fn().mockResolvedValue(1),
      lTrim: jest.fn().mockResolvedValue('OK'),
      keys: jest.fn().mockResolvedValue([])
    };

    // Mock BullMQ Queue
    mockQueue = {
      add: jest.fn().mockResolvedValue({ id: 'job-123', data: {}, opts: {} }),
      addBulk: jest.fn().mockResolvedValue([{ id: 'job-123' }, { id: 'job-124' }]),
      getJob: jest.fn().mockResolvedValue(null),
      getJobCounts: jest.fn().mockResolvedValue({
        waiting: 0,
        active: 0,
        completed: 5,
        failed: 1,
        delayed: 0
      }),
      getJobCountByTypes: jest.fn().mockResolvedValue({ completed: 5, failed: 1 }),
      pause: jest.fn().mockResolvedValue(undefined),
      resume: jest.fn().mockResolvedValue(undefined),
      close: jest.fn().mockResolvedValue(undefined)
    };

    // Mock BullMQ Worker
    mockWorker = {
      on: jest.fn(),
      close: jest.fn().mockResolvedValue(undefined),
      closing: false
    };

    // Mock BullMQ QueueEvents
    mockQueueEvents = {
      on: jest.fn(),
      close: jest.fn().mockResolvedValue(undefined)
    };

    // Mock the modules
    jest.doMock('redis', () => ({
      createClient: jest.fn(() => mockRedis)
    }));

    jest.doMock('bullmq', () => ({
      Queue: jest.fn(() => mockQueue),
      Worker: jest.fn(() => mockWorker),
      QueueEvents: jest.fn(() => mockQueueEvents)
    }));

    const queueOptions = {
      redis: {
        host: 'localhost',
        port: 6379,
        db: 0
      },
      concurrency: 5,
      maxRetries: 3
    };

    emailQueue = new EmailQueue(queueOptions);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // ============================================================================
  // Initialization Tests
  // ============================================================================

  describe('Initialization', () => {
    it('should initialize successfully with valid configuration', async () => {
      await emailQueue.initialize();
      
      expect(mockRedis.connect).toHaveBeenCalled();
    });

    it('should handle Redis connection failure', async () => {
      mockRedis.connect.mockRejectedValue(new Error('Redis connection failed'));

      await expect(emailQueue.initialize())
        .rejects.toThrow('Redis connection failed');
    });

    it('should initialize with environment variables', async () => {
      process.env.REDIS_HOST = 'redis.example.com';
      process.env.REDIS_PORT = '6380';
      process.env.REDIS_PASSWORD = 'secret';

      const queue = new EmailQueue({
        redis: {
          host: process.env.REDIS_HOST,
          port: parseInt(process.env.REDIS_PORT),
          password: process.env.REDIS_PASSWORD
        }
      });

      await queue.initialize();
      
      expect(mockRedis.connect).toHaveBeenCalled();
    });
  });

  // ============================================================================
  // Email Job Tests
  // ============================================================================

  describe('Email Job Management', () => {
    beforeEach(async () => {
      await emailQueue.initialize();
    });

    it('should add email job to correct priority queue', async () => {
      const emailJob: EmailQueueJob = {
        to: 'test@example.com',
        from: 'noreply@backroomleeds.com',
        subject: 'Test Email',
        html: '<p>Test</p>',
        text: 'Test',
        priority: EmailPriority.HIGH
      };

      const jobId = await emailQueue.addEmailJob(emailJob);

      expect(jobId).toBeDefined();
      expect(mockQueue.add).toHaveBeenCalledWith(
        'send-email',
        expect.objectContaining({
          ...emailJob,
          id: expect.any(String),
          queuedAt: expect.any(String)
        }),
        expect.objectContaining({
          priority: 7, // HIGH priority mapping
          attempts: 3
        })
      );
    });

    it('should add email job with custom ID', async () => {
      const customId = 'custom-email-job-123';
      const emailJob: EmailQueueJob = {
        id: customId,
        to: 'test@example.com',
        from: 'noreply@backroomleeds.com',
        subject: 'Test Email',
        html: '<p>Test</p>',
        text: 'Test',
        priority: EmailPriority.NORMAL
      };

      const jobId = await emailQueue.addEmailJob(emailJob);

      expect(jobId).toBe(customId);
      expect(mockQueue.add).toHaveBeenCalledWith(
        'send-email',
        expect.objectContaining({
          id: customId
        }),
        expect.objectContaining({
          jobId: customId
        })
      );
    });

    it('should schedule email job for future delivery', async () => {
      const scheduleAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour from now
      const emailJob: EmailQueueJob = {
        to: 'test@example.com',
        from: 'noreply@backroomleeds.com',
        subject: 'Scheduled Email',
        html: '<p>Scheduled</p>',
        text: 'Scheduled',
        priority: EmailPriority.NORMAL,
        scheduleAt
      };

      await emailQueue.addEmailJob(emailJob);

      expect(mockQueue.add).toHaveBeenCalledWith(
        'send-email',
        expect.objectContaining(emailJob),
        expect.objectContaining({
          delay: expect.any(Number)
        })
      );
    });

    it('should handle email job with custom retry configuration', async () => {
      const emailJob: EmailQueueJob = {
        to: 'test@example.com',
        from: 'noreply@backroomleeds.com',
        subject: 'Test Email',
        html: '<p>Test</p>',
        text: 'Test',
        priority: EmailPriority.CRITICAL,
        maxRetries: 10,
        retryBackoff: {
          type: 'exponential',
          delay: 5000
        }
      };

      await emailQueue.addEmailJob(emailJob);

      expect(mockQueue.add).toHaveBeenCalledWith(
        'send-email',
        expect.objectContaining(emailJob),
        expect.objectContaining({
          attempts: 10,
          backoff: {
            type: 'exponential',
            delay: 5000
          }
        })
      );
    });
  });

  // ============================================================================
  // Batch Email Tests
  // ============================================================================

  describe('Batch Email Processing', () => {
    beforeEach(async () => {
      await emailQueue.initialize();
    });

    it('should add batch email jobs efficiently', async () => {
      const emailJobs: EmailQueueJob[] = [
        {
          to: 'test1@example.com',
          from: 'noreply@backroomleeds.com',
          subject: 'Batch Email 1',
          html: '<p>Test 1</p>',
          text: 'Test 1',
          priority: EmailPriority.NORMAL
        },
        {
          to: 'test2@example.com',
          from: 'noreply@backroomleeds.com',
          subject: 'Batch Email 2',
          html: '<p>Test 2</p>',
          text: 'Test 2',
          priority: EmailPriority.LOW
        }
      ];

      const jobIds = await emailQueue.addBatchEmailJobs(emailJobs);

      expect(jobIds).toHaveLength(2);
      expect(mockQueue.addBulk).toHaveBeenCalled();
    });

    it('should group batch jobs by priority queue', async () => {
      const emailJobs: EmailQueueJob[] = [
        {
          to: 'critical@example.com',
          from: 'noreply@backroomleeds.com',
          subject: 'Critical Email',
          html: '<p>Critical</p>',
          text: 'Critical',
          priority: EmailPriority.CRITICAL
        },
        {
          to: 'normal@example.com',
          from: 'noreply@backroomleeds.com',
          subject: 'Normal Email',
          html: '<p>Normal</p>',
          text: 'Normal',
          priority: EmailPriority.NORMAL
        }
      ];

      await emailQueue.addBatchEmailJobs(emailJobs);

      // Should call addBulk for each priority queue that has jobs
      expect(mockQueue.addBulk).toHaveBeenCalledTimes(2);
    });

    it('should handle empty batch gracefully', async () => {
      const jobIds = await emailQueue.addBatchEmailJobs([]);

      expect(jobIds).toEqual([]);
      expect(mockQueue.addBulk).not.toHaveBeenCalled();
    });
  });

  // ============================================================================
  // Priority Queue Tests
  // ============================================================================

  describe('Priority Queue Handling', () => {
    beforeEach(async () => {
      await emailQueue.initialize();
    });

    it('should map CRITICAL priority to highest queue priority', async () => {
      const criticalJob: EmailQueueJob = {
        to: 'urgent@example.com',
        from: 'noreply@backroomleeds.com',
        subject: 'URGENT',
        html: '<p>Urgent</p>',
        text: 'Urgent',
        priority: EmailPriority.CRITICAL
      };

      await emailQueue.addEmailJob(criticalJob);

      expect(mockQueue.add).toHaveBeenCalledWith(
        'send-email',
        expect.anything(),
        expect.objectContaining({
          priority: 10 // CRITICAL priority mapping
        })
      );
    });

    it('should map LOW priority to lowest queue priority', async () => {
      const lowJob: EmailQueueJob = {
        to: 'marketing@example.com',
        from: 'noreply@backroomleeds.com',
        subject: 'Newsletter',
        html: '<p>Newsletter</p>',
        text: 'Newsletter',
        priority: EmailPriority.LOW
      };

      await emailQueue.addEmailJob(lowJob);

      expect(mockQueue.add).toHaveBeenCalledWith(
        'send-email',
        expect.anything(),
        expect.objectContaining({
          priority: 1 // LOW priority mapping
        })
      );
    });
  });

  // ============================================================================
  // Job Processing Tests
  // ============================================================================

  describe('Job Processing', () => {
    beforeEach(async () => {
      await emailQueue.initialize();
    });

    it('should process email job successfully', async () => {
      const mockJob = {
        id: 'job-123',
        data: {
          to: 'test@example.com',
          from: 'noreply@backroomleeds.com',
          subject: 'Test Email',
          html: '<p>Test</p>',
          text: 'Test',
          priority: EmailPriority.NORMAL,
          trackingEnabled: false
        },
        updateProgress: jest.fn().mockResolvedValue(undefined),
        attemptsMade: 1,
        opts: { attempts: 3 }
      };

      // Mock the email manager
      const mockEmailManager = {
        sendWithFailover: jest.fn().mockResolvedValue({
          id: 'msg-123',
          provider: 'resend',
          messageId: 'msg-123',
          status: 'sent'
        })
      };

      // Process the job (this would normally be called by the worker)
      const processEmailJob = (emailQueue as any).processEmailJob.bind(emailQueue);
      await processEmailJob(mockJob);

      expect(mockJob.updateProgress).toHaveBeenCalledWith(100);
    });

    it('should handle job processing errors', async () => {
      const mockJob = {
        id: 'job-123',
        data: {
          to: 'invalid-email',
          from: 'noreply@backroomleeds.com',
          subject: 'Test Email',
          priority: EmailPriority.NORMAL
        },
        updateProgress: jest.fn().mockResolvedValue(undefined),
        attemptsMade: 3,
        opts: { attempts: 3 }
      };

      const processEmailJob = (emailQueue as any).processEmailJob.bind(emailQueue);
      
      // Should throw error for processing failure
      await expect(processEmailJob(mockJob))
        .rejects.toThrow();
    });

    it('should check customer consent before processing', async () => {
      const mockJob = {
        id: 'job-123',
        data: {
          to: 'test@example.com',
          from: 'noreply@backroomleeds.com',
          subject: 'Test Email',
          priority: EmailPriority.NORMAL,
          trackingEnabled: true,
          customerConsent: {
            emailTracking: false,
            marketingEmails: false,
            transactionalEmails: false
          }
        },
        updateProgress: jest.fn().mockResolvedValue(undefined),
        attemptsMade: 1,
        opts: { attempts: 3 }
      };

      const processEmailJob = (emailQueue as any).processEmailJob.bind(emailQueue);
      await processEmailJob(mockJob);

      // Should complete without sending due to consent restrictions
      expect(mockJob.updateProgress).toHaveBeenCalledWith(100);
    });
  });

  // ============================================================================
  // Dead Letter Queue Tests
  // ============================================================================

  describe('Dead Letter Queue', () => {
    beforeEach(async () => {
      await emailQueue.initialize();
    });

    it('should move failed jobs to dead letter queue', async () => {
      const mockFailedJob = {
        id: 'failed-job-123',
        queueName: 'email-high',
        data: {
          to: 'test@example.com',
          from: 'noreply@backroomleeds.com',
          subject: 'Failed Email',
          priority: EmailPriority.HIGH
        },
        attemptsMade: 3
      };

      const moveToDeadLetterQueue = (emailQueue as any).moveToDeadLetterQueue.bind(emailQueue);
      const error = new Error('Email sending failed');
      
      await moveToDeadLetterQueue(mockFailedJob, error);

      expect(mockQueue.add).toHaveBeenCalledWith(
        'dead-letter',
        expect.objectContaining({
          originalJobId: 'failed-job-123',
          originalQueue: 'email-high',
          originalError: 'Email sending failed',
          failedAt: expect.any(String),
          attemptsMade: 3
        }),
        expect.objectContaining({
          priority: 1,
          attempts: 1
        })
      );
    });

    it('should process dead letter jobs for admin notification', async () => {
      const mockDeadLetterJob = {
        id: 'dead-letter-123',
        data: {
          to: 'test@example.com',
          originalJobId: 'original-123',
          originalError: 'All providers failed',
          failedAt: new Date().toISOString()
        }
      };

      const processDeadLetterJob = (emailQueue as any).processDeadLetterJob.bind(emailQueue);
      
      await processDeadLetterJob(mockDeadLetterJob);

      // Should log and notify admin
      expect(mockRedis.lPush).toHaveBeenCalledWith(
        'email:failed_logs',
        expect.any(String)
      );
    });
  });

  // ============================================================================
  // Queue Management Tests
  // ============================================================================

  describe('Queue Management', () => {
    beforeEach(async () => {
      await emailQueue.initialize();
    });

    it('should get queue metrics successfully', async () => {
      const metrics = await emailQueue.getQueueMetrics();

      expect(metrics).toBeDefined();
      expect(typeof metrics).toBe('object');
      expect(mockQueue.getJobCounts).toHaveBeenCalled();
    });

    it('should get queue health status', async () => {
      const health = await emailQueue.getHealth();

      expect(health).toBeDefined();
      expect(health).toHaveProperty('isHealthy');
      expect(health).toHaveProperty('redisConnected');
      expect(health).toHaveProperty('workersActive');
      expect(health).toHaveProperty('queueStatus');
      expect(health).toHaveProperty('metrics');
    });

    it('should pause all queues', async () => {
      await emailQueue.pauseAllQueues();

      expect(mockQueue.pause).toHaveBeenCalled();
    });

    it('should resume all queues', async () => {
      await emailQueue.resumeAllQueues();

      expect(mockQueue.resume).toHaveBeenCalled();
    });

    it('should get job by ID', async () => {
      const jobId = 'test-job-123';
      mockQueue.getJob.mockResolvedValue({
        id: jobId,
        data: { to: 'test@example.com' }
      });

      const job = await emailQueue.getJob(jobId);

      expect(job).toBeDefined();
      expect(job.id).toBe(jobId);
      expect(mockQueue.getJob).toHaveBeenCalledWith(jobId);
    });

    it('should retry failed job', async () => {
      const jobId = 'failed-job-123';
      const mockJob = {
        id: jobId,
        retry: jest.fn().mockResolvedValue(undefined)
      };

      mockQueue.getJob.mockResolvedValue(mockJob);

      const success = await emailQueue.retryJob(jobId);

      expect(success).toBe(true);
      expect(mockJob.retry).toHaveBeenCalled();
    });

    it('should return false when retrying non-existent job', async () => {
      const jobId = 'non-existent-job';
      mockQueue.getJob.mockResolvedValue(null);

      const success = await emailQueue.retryJob(jobId);

      expect(success).toBe(false);
    });
  });

  // ============================================================================
  // Error Handling Tests
  // ============================================================================

  describe('Error Handling', () => {
    it('should handle initialization errors', async () => {
      mockRedis.connect.mockRejectedValue(new Error('Connection failed'));

      await expect(emailQueue.initialize())
        .rejects.toThrow('Connection failed');
    });

    it('should handle queue add errors', async () => {
      await emailQueue.initialize();
      mockQueue.add.mockRejectedValue(new Error('Queue full'));

      const emailJob: EmailQueueJob = {
        to: 'test@example.com',
        from: 'noreply@backroomleeds.com',
        subject: 'Test Email',
        html: '<p>Test</p>',
        text: 'Test',
        priority: EmailPriority.NORMAL
      };

      await expect(emailQueue.addEmailJob(emailJob))
        .rejects.toThrow('Queue full');
    });

    it('should handle job processing without initialization', async () => {
      const emailJob: EmailQueueJob = {
        to: 'test@example.com',
        from: 'noreply@backroomleeds.com',
        subject: 'Test Email',
        html: '<p>Test</p>',
        text: 'Test',
        priority: EmailPriority.NORMAL
      };

      await expect(emailQueue.addEmailJob(emailJob))
        .rejects.toThrow('Email queue not initialized');
    });
  });

  // ============================================================================
  // Cleanup Tests
  // ============================================================================

  describe('Cleanup', () => {
    beforeEach(async () => {
      await emailQueue.initialize();
    });

    it('should close all connections properly', async () => {
      await emailQueue.close();

      expect(mockWorker.close).toHaveBeenCalled();
      expect(mockQueueEvents.close).toHaveBeenCalled();
      expect(mockQueue.close).toHaveBeenCalled();
      expect(mockRedis.disconnect).toHaveBeenCalled();
    });

    it('should handle cleanup errors gracefully', async () => {
      mockRedis.disconnect.mockRejectedValue(new Error('Disconnect failed'));

      // Should not throw error during cleanup
      await expect(emailQueue.close()).resolves.not.toThrow();
    });
  });
});