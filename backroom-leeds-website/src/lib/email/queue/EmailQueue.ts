/**
 * Email Queue System
 * 
 * BullMQ-based email queue management with priority handling,
 * retry logic, and dead letter queue processing.
 * 
 * @module EmailQueue
 */

import { Queue, Worker, Job, QueueEvents } from 'bullmq';
import Redis from 'redis';
import { EmailMessage, EmailPriority, getEmailServiceManager } from '../providers/EmailServiceManager';
import { v4 as uuidv4 } from 'uuid';

// ============================================================================
// Types and Interfaces
// ============================================================================

export interface EmailQueueJob extends EmailMessage {
  id?: string;
  priority: EmailPriority;
  templateName?: string;
  templateData?: any;
  trackingEnabled?: boolean;
  scheduleAt?: Date;
  maxRetries?: number;
  retryBackoff?: {
    type: 'exponential' | 'fixed';
    delay: number;
  };
  customerConsent?: {
    emailTracking: boolean;
    marketingEmails: boolean;
    transactionalEmails: boolean;
  };
}

export interface EmailQueueOptions {
  redis: {
    host: string;
    port: number;
    password?: string;
    db?: number;
  };
  concurrency?: number;
  maxRetries?: number;
  backoffStrategy?: {
    type: 'exponential' | 'fixed';
    delay: number;
    factor?: number;
  };
  removeOnComplete?: number;
  removeOnFail?: number;
  enableMetrics?: boolean;
}

export interface EmailQueueMetrics {
  waiting: number;
  active: number;
  completed: number;
  failed: number;
  delayed: number;
  totalProcessed: number;
  averageProcessingTime: number;
  failureRate: number;
  lastProcessedAt?: Date;
}

export interface EmailQueueHealth {
  isHealthy: boolean;
  redisConnected: boolean;
  workersActive: number;
  queueStatus: 'running' | 'paused' | 'error';
  lastError?: string;
  metrics: EmailQueueMetrics;
}

// ============================================================================
// Email Queue Configuration
// ============================================================================

const QUEUE_NAMES = {
  CRITICAL: 'email-critical',
  HIGH: 'email-high',
  NORMAL: 'email-normal',
  LOW: 'email-low',
  DEAD_LETTER: 'email-dead-letter'
} as const;

const PRIORITY_MAPPING: Record<EmailPriority, number> = {
  [EmailPriority.CRITICAL]: 10,
  [EmailPriority.HIGH]: 7,
  [EmailPriority.NORMAL]: 5,
  [EmailPriority.LOW]: 1
};

const DEFAULT_RETRY_CONFIG = {
  maxRetries: 5,
  backoff: {
    type: 'exponential' as const,
    delay: 2000,
    factor: 2
  }
};

// ============================================================================
// Email Queue Manager
// ============================================================================

export class EmailQueue {
  private redis: Redis.RedisClientType;
  private queues: Map<string, Queue> = new Map();
  private workers: Map<string, Worker> = new Map();
  private queueEvents: Map<string, QueueEvents> = new Map();
  private options: EmailQueueOptions;
  private emailManager = getEmailServiceManager();
  private isInitialized = false;

  constructor(options: EmailQueueOptions) {
    this.options = {
      concurrency: 5,
      maxRetries: 5,
      removeOnComplete: 100,
      removeOnFail: 50,
      enableMetrics: true,
      ...options
    };
  }

  /**
   * Initialize the email queue system
   */
  async initialize(): Promise<void> {
    try {
      // Initialize Redis connection
      this.redis = Redis.createClient({
        socket: {
          host: this.options.redis.host,
          port: this.options.redis.port
        },
        password: this.options.redis.password,
        database: this.options.redis.db || 0
      });

      await this.redis.connect();

      // Initialize queues for each priority level
      await this.initializeQueues();
      
      // Initialize workers
      await this.initializeWorkers();
      
      // Initialize queue events monitoring
      await this.initializeQueueEvents();

      this.isInitialized = true;
      console.log('Email queue system initialized successfully');
    } catch (error) {
      console.error('Failed to initialize email queue system:', error);
      throw error;
    }
  }

  /**
   * Initialize queues for different priority levels
   */
  private async initializeQueues(): Promise<void> {
    const redisConfig = {
      host: this.options.redis.host,
      port: this.options.redis.port,
      password: this.options.redis.password,
      db: this.options.redis.db || 0
    };

    // Create priority queues
    Object.values(QUEUE_NAMES).forEach(queueName => {
      const queue = new Queue(queueName, {
        connection: redisConfig,
        defaultJobOptions: {
          removeOnComplete: this.options.removeOnComplete,
          removeOnFail: this.options.removeOnFail,
          attempts: this.options.maxRetries,
          backoff: this.options.backoffStrategy
        }
      });

      this.queues.set(queueName, queue);
    });
  }

  /**
   * Initialize workers for processing email jobs
   */
  private async initializeWorkers(): Promise<void> {
    const redisConfig = {
      host: this.options.redis.host,
      port: this.options.redis.port,
      password: this.options.redis.password,
      db: this.options.redis.db || 0
    };

    // Create workers for each queue
    Object.values(QUEUE_NAMES).forEach(queueName => {
      if (queueName === QUEUE_NAMES.DEAD_LETTER) {
        // Dead letter queue has special handling
        const worker = new Worker(
          queueName,
          this.processDeadLetterJob.bind(this),
          {
            connection: redisConfig,
            concurrency: 1, // Process dead letter jobs one at a time
            maxStalledCount: 1,
            stalledInterval: 30000
          }
        );
        this.workers.set(queueName, worker);
      } else {
        // Regular email processing
        const worker = new Worker(
          queueName,
          this.processEmailJob.bind(this),
          {
            connection: redisConfig,
            concurrency: this.options.concurrency,
            maxStalledCount: 3,
            stalledInterval: 30000
          }
        );
        this.workers.set(queueName, worker);
      }
    });

    // Set up worker error handling
    this.workers.forEach((worker, queueName) => {
      worker.on('error', (error) => {
        console.error(`Worker error for queue ${queueName}:`, error);
      });

      worker.on('stalled', (job) => {
        console.warn(`Job stalled in queue ${queueName}:`, job.id);
      });
    });
  }

  /**
   * Initialize queue events for monitoring
   */
  private async initializeQueueEvents(): Promise<void> {
    if (!this.options.enableMetrics) return;

    const redisConfig = {
      host: this.options.redis.host,
      port: this.options.redis.port,
      password: this.options.redis.password,
      db: this.options.redis.db || 0
    };

    Object.values(QUEUE_NAMES).forEach(queueName => {
      const queueEvents = new QueueEvents(queueName, {
        connection: redisConfig
      });

      queueEvents.on('completed', ({ jobId }) => {
        console.log(`Email job ${jobId} completed in queue ${queueName}`);
      });

      queueEvents.on('failed', ({ jobId, failedReason }) => {
        console.error(`Email job ${jobId} failed in queue ${queueName}:`, failedReason);
      });

      queueEvents.on('progress', ({ jobId, data }) => {
        console.log(`Email job ${jobId} progress in queue ${queueName}:`, data);
      });

      this.queueEvents.set(queueName, queueEvents);
    });
  }

  /**
   * Add email job to appropriate priority queue
   */
  async addEmailJob(emailJob: EmailQueueJob): Promise<string> {
    if (!this.isInitialized) {
      throw new Error('Email queue not initialized. Call initialize() first.');
    }

    const jobId = emailJob.id || uuidv4();
    const queueName = this.getQueueForPriority(emailJob.priority);
    const queue = this.queues.get(queueName);

    if (!queue) {
      throw new Error(`Queue ${queueName} not found`);
    }

    try {
      const job = await queue.add(
        'send-email',
        {
          ...emailJob,
          id: jobId,
          queuedAt: new Date().toISOString()
        },
        {
          priority: PRIORITY_MAPPING[emailJob.priority],
          delay: emailJob.scheduleAt ? 
            Math.max(0, emailJob.scheduleAt.getTime() - Date.now()) : 0,
          attempts: emailJob.maxRetries || this.options.maxRetries,
          backoff: emailJob.retryBackoff || this.options.backoffStrategy,
          jobId
        }
      );

      console.log(`Email job ${jobId} added to queue ${queueName}`);
      return jobId;
    } catch (error) {
      console.error(`Failed to add email job to queue ${queueName}:`, error);
      throw error;
    }
  }

  /**
   * Add batch email jobs with optimized processing
   */
  async addBatchEmailJobs(emailJobs: EmailQueueJob[]): Promise<string[]> {
    if (!this.isInitialized) {
      throw new Error('Email queue not initialized. Call initialize() first.');
    }

    const jobIds: string[] = [];
    const queueJobs = new Map<string, { job: any; options: any }[]>();

    // Group jobs by queue/priority
    for (const emailJob of emailJobs) {
      const jobId = emailJob.id || uuidv4();
      const queueName = this.getQueueForPriority(emailJob.priority);
      
      if (!queueJobs.has(queueName)) {
        queueJobs.set(queueName, []);
      }

      queueJobs.get(queueName)!.push({
        job: {
          ...emailJob,
          id: jobId,
          queuedAt: new Date().toISOString()
        },
        options: {
          priority: PRIORITY_MAPPING[emailJob.priority],
          delay: emailJob.scheduleAt ? 
            Math.max(0, emailJob.scheduleAt.getTime() - Date.now()) : 0,
          attempts: emailJob.maxRetries || this.options.maxRetries,
          backoff: emailJob.retryBackoff || this.options.backoffStrategy,
          jobId
        }
      });

      jobIds.push(jobId);
    }

    // Add jobs to their respective queues in batches
    for (const [queueName, jobs] of queueJobs) {
      const queue = this.queues.get(queueName);
      if (!queue) continue;

      try {
        await queue.addBulk(
          jobs.map(({ job, options }) => ({
            name: 'send-email',
            data: job,
            opts: options
          }))
        );
        
        console.log(`Added ${jobs.length} email jobs to queue ${queueName}`);
      } catch (error) {
        console.error(`Failed to add batch jobs to queue ${queueName}:`, error);
      }
    }

    return jobIds;
  }

  /**
   * Process individual email job
   */
  private async processEmailJob(job: Job<EmailQueueJob>): Promise<void> {
    const startTime = Date.now();
    
    try {
      console.log(`Processing email job ${job.id}`);
      
      const emailData = job.data;
      
      // Update job progress
      await job.updateProgress(10);
      
      // Check customer consent if tracking is enabled
      if (emailData.trackingEnabled && emailData.customerConsent) {
        if (!this.checkEmailConsent(emailData)) {
          console.log(`Skipping email job ${job.id} due to consent restrictions`);
          await job.updateProgress(100);
          return;
        }
      }
      
      await job.updateProgress(25);
      
      // Send email using the email service manager
      const result = await this.emailManager.sendWithFailover(
        emailData,
        {
          priority: emailData.priority,
          maxAttempts: job.opts.attempts
        }
      );
      
      await job.updateProgress(75);
      
      // Store email tracking information if enabled
      if (emailData.trackingEnabled) {
        await this.storeEmailTracking(job.id!, emailData, result);
      }
      
      await job.updateProgress(100);
      
      const processingTime = Date.now() - startTime;
      console.log(`Email job ${job.id} completed in ${processingTime}ms`);
      
    } catch (error) {
      console.error(`Email job ${job.id} failed:`, error);
      
      // If this is the final attempt, move to dead letter queue
      if (job.attemptsMade >= (job.opts.attempts || DEFAULT_RETRY_CONFIG.maxRetries)) {
        await this.moveToDeadLetterQueue(job, error as Error);
      }
      
      throw error;
    }
  }

  /**
   * Process dead letter queue jobs (manual intervention required)
   */
  private async processDeadLetterJob(job: Job<EmailQueueJob & { originalError: string }>): Promise<void> {
    console.log(`Processing dead letter job ${job.id}`);
    
    // Dead letter jobs require manual intervention
    // This could trigger admin notifications, logging to external systems, etc.
    
    try {
      // Log the failed job details
      await this.logFailedEmail(job);
      
      // Attempt to send notification to admin about the failed email
      await this.notifyAdminOfFailure(job);
      
      console.log(`Dead letter job ${job.id} processed - admin notified`);
    } catch (error) {
      console.error(`Failed to process dead letter job ${job.id}:`, error);
      throw error;
    }
  }

  /**
   * Check customer email consent
   */
  private checkEmailConsent(emailData: EmailQueueJob): boolean {
    if (!emailData.customerConsent) return true;
    
    const { customerConsent } = emailData;
    
    // Transactional emails (booking confirmations, etc.) are generally allowed
    if (emailData.priority === EmailPriority.CRITICAL) {
      return customerConsent.transactionalEmails !== false;
    }
    
    // Marketing emails require explicit consent
    if (emailData.templateName?.includes('marketing') || emailData.templateName?.includes('promotional')) {
      return customerConsent.marketingEmails === true;
    }
    
    // Default to transactional consent for other emails
    return customerConsent.transactionalEmails !== false;
  }

  /**
   * Store email tracking information
   */
  private async storeEmailTracking(jobId: string, emailData: EmailQueueJob, result: any): Promise<void> {
    try {
      const trackingData = {
        jobId,
        messageId: result.messageId,
        provider: result.provider,
        sentAt: new Date(),
        recipient: Array.isArray(emailData.to) ? emailData.to[0] : emailData.to,
        subject: emailData.subject,
        templateName: emailData.templateName,
        priority: emailData.priority,
        trackingConsent: emailData.customerConsent?.emailTracking || false
      };
      
      // Store in Redis for quick access
      await this.redis.setEx(
        `email:tracking:${result.messageId}`,
        7 * 24 * 60 * 60, // 7 days TTL
        JSON.stringify(trackingData)
      );
      
      console.log(`Email tracking stored for job ${jobId}`);
    } catch (error) {
      console.error(`Failed to store email tracking for job ${jobId}:`, error);
    }
  }

  /**
   * Move job to dead letter queue
   */
  private async moveToDeadLetterQueue(job: Job<EmailQueueJob>, error: Error): Promise<void> {
    const deadLetterQueue = this.queues.get(QUEUE_NAMES.DEAD_LETTER);
    if (!deadLetterQueue) return;
    
    try {
      await deadLetterQueue.add(
        'dead-letter',
        {
          ...job.data,
          originalJobId: job.id,
          originalQueue: job.queueName,
          originalError: error.message,
          failedAt: new Date().toISOString(),
          attemptsMade: job.attemptsMade
        },
        {
          priority: 1,
          attempts: 1 // Don't retry dead letter jobs
        }
      );
      
      console.log(`Moved job ${job.id} to dead letter queue`);
    } catch (dlqError) {
      console.error(`Failed to move job ${job.id} to dead letter queue:`, dlqError);
    }
  }

  /**
   * Log failed email details
   */
  private async logFailedEmail(job: Job<EmailQueueJob & { originalError: string }>): Promise<void> {
    const logEntry = {
      jobId: job.data.originalJobId,
      recipient: Array.isArray(job.data.to) ? job.data.to[0] : job.data.to,
      subject: job.data.subject,
      templateName: job.data.templateName,
      priority: job.data.priority,
      error: job.data.originalError,
      failedAt: job.data.failedAt,
      attemptsMade: job.data.attemptsMade
    };
    
    // Store failed email log in Redis
    await this.redis.lPush(
      'email:failed_logs',
      JSON.stringify(logEntry)
    );
    
    // Keep only last 1000 failed email logs
    await this.redis.lTrim('email:failed_logs', 0, 999);
  }

  /**
   * Notify admin of email failure
   */
  private async notifyAdminOfFailure(job: Job<EmailQueueJob & { originalError: string }>): Promise<void> {
    // This would typically send an email or notification to administrators
    // For now, we'll just log it
    console.warn(`ADMIN ALERT: Email job ${job.data.originalJobId} failed permanently`, {
      recipient: Array.isArray(job.data.to) ? job.data.to[0] : job.data.to,
      subject: job.data.subject,
      error: job.data.originalError
    });
  }

  /**
   * Get appropriate queue name for priority level
   */
  private getQueueForPriority(priority: EmailPriority): string {
    switch (priority) {
      case EmailPriority.CRITICAL:
        return QUEUE_NAMES.CRITICAL;
      case EmailPriority.HIGH:
        return QUEUE_NAMES.HIGH;
      case EmailPriority.NORMAL:
        return QUEUE_NAMES.NORMAL;
      case EmailPriority.LOW:
        return QUEUE_NAMES.LOW;
      default:
        return QUEUE_NAMES.NORMAL;
    }
  }

  /**
   * Get queue metrics
   */
  async getQueueMetrics(): Promise<Record<string, EmailQueueMetrics>> {
    const metrics: Record<string, EmailQueueMetrics> = {};
    
    for (const [queueName, queue] of this.queues) {
      const counts = await queue.getJobCounts();
      const stats = await queue.getJobCountByTypes(['completed', 'failed']);
      
      metrics[queueName] = {
        waiting: counts.waiting,
        active: counts.active,
        completed: counts.completed,
        failed: counts.failed,
        delayed: counts.delayed,
        totalProcessed: stats.completed + stats.failed,
        averageProcessingTime: 0, // Would need to calculate from job data
        failureRate: stats.failed / (stats.completed + stats.failed) || 0,
        lastProcessedAt: new Date()
      };
    }
    
    return metrics;
  }

  /**
   * Get queue health status
   */
  async getHealth(): Promise<EmailQueueHealth> {
    try {
      const redisConnected = this.redis.isReady;
      const metrics = await this.getQueueMetrics();
      const totalMetrics = Object.values(metrics).reduce(
        (acc, m) => ({
          waiting: acc.waiting + m.waiting,
          active: acc.active + m.active,
          completed: acc.completed + m.completed,
          failed: acc.failed + m.failed,
          delayed: acc.delayed + m.delayed,
          totalProcessed: acc.totalProcessed + m.totalProcessed,
          averageProcessingTime: 0,
          failureRate: acc.failureRate + m.failureRate
        }),
        { waiting: 0, active: 0, completed: 0, failed: 0, delayed: 0, totalProcessed: 0, averageProcessingTime: 0, failureRate: 0 }
      );
      
      const workersActive = Array.from(this.workers.values()).filter(w => !w.closing).length;
      
      return {
        isHealthy: redisConnected && workersActive > 0,
        redisConnected,
        workersActive,
        queueStatus: redisConnected && workersActive > 0 ? 'running' : 'error',
        metrics: totalMetrics
      };
    } catch (error) {
      return {
        isHealthy: false,
        redisConnected: false,
        workersActive: 0,
        queueStatus: 'error',
        lastError: (error as Error).message,
        metrics: {
          waiting: 0,
          active: 0,
          completed: 0,
          failed: 0,
          delayed: 0,
          totalProcessed: 0,
          averageProcessingTime: 0,
          failureRate: 1
        }
      };
    }
  }

  /**
   * Pause all queues
   */
  async pauseAllQueues(): Promise<void> {
    const pausePromises = Array.from(this.queues.values()).map(queue => queue.pause());
    await Promise.all(pausePromises);
    console.log('All email queues paused');
  }

  /**
   * Resume all queues
   */
  async resumeAllQueues(): Promise<void> {
    const resumePromises = Array.from(this.queues.values()).map(queue => queue.resume());
    await Promise.all(resumePromises);
    console.log('All email queues resumed');
  }

  /**
   * Get job by ID
   */
  async getJob(jobId: string): Promise<Job<EmailQueueJob> | null> {
    for (const queue of this.queues.values()) {
      const job = await queue.getJob(jobId);
      if (job) return job;
    }
    return null;
  }

  /**
   * Retry failed job
   */
  async retryJob(jobId: string): Promise<boolean> {
    const job = await this.getJob(jobId);
    if (!job) return false;
    
    try {
      await job.retry();
      return true;
    } catch (error) {
      console.error(`Failed to retry job ${jobId}:`, error);
      return false;
    }
  }

  /**
   * Cleanup and close all connections
   */
  async close(): Promise<void> {
    // Close workers
    const workerClosePromises = Array.from(this.workers.values()).map(worker => worker.close());
    await Promise.all(workerClosePromises);
    
    // Close queue events
    const eventClosePromises = Array.from(this.queueEvents.values()).map(events => events.close());
    await Promise.all(eventClosePromises);
    
    // Close queues
    const queueClosePromises = Array.from(this.queues.values()).map(queue => queue.close());
    await Promise.all(queueClosePromises);
    
    // Close Redis connection
    await this.redis.disconnect();
    
    console.log('Email queue system closed');
  }
}

// ============================================================================
// Singleton Instance
// ============================================================================

let emailQueue: EmailQueue | null = null;

export function getEmailQueue(): EmailQueue {
  if (!emailQueue) {
    const queueOptions: EmailQueueOptions = {
      redis: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379'),
        password: process.env.REDIS_PASSWORD,
        db: parseInt(process.env.REDIS_DB || '0')
      },
      concurrency: parseInt(process.env.EMAIL_QUEUE_CONCURRENCY || '5'),
      maxRetries: parseInt(process.env.EMAIL_QUEUE_MAX_RETRIES || '5'),
      removeOnComplete: parseInt(process.env.EMAIL_QUEUE_REMOVE_ON_COMPLETE || '100'),
      removeOnFail: parseInt(process.env.EMAIL_QUEUE_REMOVE_ON_FAIL || '50'),
      enableMetrics: process.env.EMAIL_QUEUE_ENABLE_METRICS !== 'false'
    };
    
    emailQueue = new EmailQueue(queueOptions);
  }
  
  return emailQueue;
}

// ============================================================================
// Export
// ============================================================================

export default EmailQueue;