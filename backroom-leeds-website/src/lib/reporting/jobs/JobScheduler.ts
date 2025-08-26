/**
 * The Backroom Leeds - Job Scheduler
 * Version: 1.0.0
 * Phase: 3, Step 3.5
 * 
 * BullMQ-based job scheduling system with Redis integration
 */

import { Queue, Worker, QueueEvents, Job } from 'bullmq';
import Redis from 'ioredis';
import { JobStatus, JobPriority, type ScheduledJob, type JobExecutionHistory } from '@/types/reporting';

// ============================================================================
// CONFIGURATION
// ============================================================================

const REDIS_CONFIG = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD,
  retryDelayOnFailover: 100,
  enableReadyCheck: false,
  lazyConnect: true,
  maxRetriesPerRequest: 3,
  family: 4,
  keepAlive: 30000,
  connectTimeout: 60000,
  commandTimeout: 60000
};

const QUEUE_CONFIG = {
  defaultJobOptions: {
    removeOnComplete: 50,
    removeOnFail: 20,
    attempts: 3,
    backoff: {
      type: 'exponential' as const,
      delay: 5000
    }
  }
};

// ============================================================================
// JOB SCHEDULER CLASS
// ============================================================================

export class JobScheduler {
  private redis: Redis;
  private reportQueue: Queue;
  private aggregationQueue: Queue;
  private cleanupQueue: Queue;
  private worker: Worker | null = null;
  private queueEvents: QueueEvents | null = null;
  private isInitialized: boolean = false;

  constructor() {
    this.redis = new Redis(REDIS_CONFIG);
    
    // Initialize queues
    this.reportQueue = new Queue('reports', {
      connection: this.redis,
      ...QUEUE_CONFIG
    });
    
    this.aggregationQueue = new Queue('aggregations', {
      connection: this.redis,
      ...QUEUE_CONFIG
    });
    
    this.cleanupQueue = new Queue('cleanup', {
      connection: this.redis,
      ...QUEUE_CONFIG
    });
  }

  // ============================================================================
  // INITIALIZATION
  // ============================================================================

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      await this.redis.ping();
      console.log('✅ Connected to Redis successfully');

      // Initialize queue events for monitoring
      this.queueEvents = new QueueEvents('reports', { connection: this.redis });
      
      // Set up event listeners
      this.setupEventListeners();
      
      // Initialize worker
      await this.initializeWorker();
      
      this.isInitialized = true;
      console.log('✅ Job Scheduler initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize Job Scheduler:', error);
      throw error;
    }
  }

  private setupEventListeners(): void {
    if (!this.queueEvents) return;

    this.queueEvents.on('completed', async ({ jobId, returnvalue }) => {
      console.log(`✅ Job ${jobId} completed successfully`);
      await this.updateJobHistory(jobId, JobStatus.COMPLETED, null, returnvalue);
    });

    this.queueEvents.on('failed', async ({ jobId, failedReason }) => {
      console.error(`❌ Job ${jobId} failed:`, failedReason);
      await this.updateJobHistory(jobId, JobStatus.FAILED, failedReason);
    });

    this.queueEvents.on('active', async ({ jobId }) => {
      console.log(`🔄 Job ${jobId} started processing`);
      await this.updateJobHistory(jobId, JobStatus.RUNNING);
    });

    this.queueEvents.on('waiting', async ({ jobId }) => {
      console.log(`⏳ Job ${jobId} is waiting in queue`);
    });
  }

  private async initializeWorker(): Promise<void> {
    this.worker = new Worker(
      'reports',
      async (job) => {
        return await this.processJob(job);
      },
      {
        connection: this.redis,
        concurrency: 3,
        removeOnComplete: { count: 50 },
        removeOnFail: { count: 20 }
      }
    );

    this.worker.on('completed', (job) => {
      console.log(`✅ Worker completed job ${job.id}`);
    });

    this.worker.on('failed', (job, err) => {
      console.error(`❌ Worker failed job ${job?.id}:`, err);
    });

    this.worker.on('error', (err) => {
      console.error('❌ Worker error:', err);
    });
  }

  // ============================================================================
  // JOB PROCESSING
  // ============================================================================

  private async processJob(job: Job): Promise<any> {
    const startTime = Date.now();
    const { type, payload } = job.data;

    console.log(`🔄 Processing job ${job.id} of type ${type}`);

    try {
      let result: any;

      switch (type) {
        case 'daily_summary':
          const { DailySummaryGenerator } = await import('../generators/DailySummaryGenerator');
          const dailyGenerator = new DailySummaryGenerator();
          result = await dailyGenerator.generate(payload);
          break;

        case 'weekly_summary':
          const { WeeklySummaryGenerator } = await import('../generators/WeeklySummaryGenerator');
          const weeklyGenerator = new WeeklySummaryGenerator();
          result = await weeklyGenerator.generate(payload);
          break;

        case 'aggregation':
          const { processAggregation } = await import('../analytics/MetricsCalculator');
          result = await processAggregation(payload);
          break;

        case 'cleanup':
          const { performCleanup } = await import('../utilities/DataCleanup');
          result = await performCleanup(payload);
          break;

        default:
          throw new Error(`Unknown job type: ${type}`);
      }

      const executionTime = Date.now() - startTime;
      console.log(`✅ Job ${job.id} completed in ${executionTime}ms`);

      return {
        success: true,
        result,
        executionTime,
        processedAt: new Date().toISOString()
      };

    } catch (error) {
      const executionTime = Date.now() - startTime;
      console.error(`❌ Job ${job.id} failed after ${executionTime}ms:`, error);
      
      throw {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        executionTime,
        failedAt: new Date().toISOString()
      };
    }
  }

  // ============================================================================
  // SCHEDULING METHODS
  // ============================================================================

  async scheduleRecurringJob(
    name: string,
    type: string,
    payload: any,
    cronExpression: string,
    options: {
      priority?: JobPriority;
      timezone?: string;
      maxRetries?: number;
      timeout?: number;
    } = {}
  ): Promise<string> {
    const jobOptions = {
      repeat: { 
        pattern: cronExpression,
        tz: options.timezone || 'Europe/London'
      },
      priority: this.getPriorityValue(options.priority || JobPriority.NORMAL),
      attempts: options.maxRetries || 3,
      removeOnComplete: 10,
      removeOnFail: 5
    };

    if (options.timeout) {
      (jobOptions as any).jobId = `${name}-${Date.now()}`;
    }

    const job = await this.reportQueue.add(
      name,
      { type, payload, scheduledAt: new Date().toISOString() },
      jobOptions
    );

    console.log(`📅 Scheduled recurring job ${name} with pattern ${cronExpression}`);
    return job.id!;
  }

  async scheduleOneTimeJob(
    name: string,
    type: string,
    payload: any,
    delay: number = 0,
    options: {
      priority?: JobPriority;
      maxRetries?: number;
    } = {}
  ): Promise<string> {
    const jobOptions = {
      delay,
      priority: this.getPriorityValue(options.priority || JobPriority.NORMAL),
      attempts: options.maxRetries || 3
    };

    const job = await this.reportQueue.add(
      name,
      { type, payload, scheduledAt: new Date().toISOString() },
      jobOptions
    );

    console.log(`⏰ Scheduled one-time job ${name} with ${delay}ms delay`);
    return job.id!;
  }

  async pauseJob(jobId: string): Promise<void> {
    await this.reportQueue.pause();
    console.log(`⏸️ Paused job queue`);
  }

  async resumeJob(jobId: string): Promise<void> {
    await this.reportQueue.resume();
    console.log(`▶️ Resumed job queue`);
  }

  async removeJob(jobId: string): Promise<void> {
    const job = await Job.fromId(this.reportQueue, jobId);
    if (job) {
      await job.remove();
      console.log(`🗑️ Removed job ${jobId}`);
    }
  }

  // ============================================================================
  // MONITORING AND STATUS
  // ============================================================================

  async getJobStatus(jobId: string): Promise<JobStatus | null> {
    try {
      const job = await Job.fromId(this.reportQueue, jobId);
      if (!job) return null;

      const state = await job.getState();
      
      switch (state) {
        case 'waiting': return JobStatus.PENDING;
        case 'active': return JobStatus.RUNNING;
        case 'completed': return JobStatus.COMPLETED;
        case 'failed': return JobStatus.FAILED;
        case 'delayed': return JobStatus.PENDING;
        case 'paused': return JobStatus.CANCELLED;
        default: return JobStatus.PENDING;
      }
    } catch (error) {
      console.error(`Error getting job status for ${jobId}:`, error);
      return null;
    }
  }

  async getQueueStats(): Promise<{
    waiting: number;
    active: number;
    completed: number;
    failed: number;
    delayed: number;
    paused: number;
  }> {
    return await this.reportQueue.getJobCounts();
  }

  async getJobHistory(limit: number = 50): Promise<Job[]> {
    const jobs = await this.reportQueue.getJobs(['completed', 'failed'], 0, limit - 1);
    return jobs.reverse(); // Most recent first
  }

  async getActiveJobs(): Promise<Job[]> {
    return await this.reportQueue.getActive();
  }

  async getWaitingJobs(): Promise<Job[]> {
    return await this.reportQueue.getWaiting();
  }

  // ============================================================================
  // HEALTH CHECKS
  // ============================================================================

  async healthCheck(): Promise<{
    status: 'healthy' | 'unhealthy';
    redis: boolean;
    queues: boolean;
    worker: boolean;
    details: Record<string, any>;
  }> {
    const health = {
      status: 'healthy' as const,
      redis: false,
      queues: false,
      worker: false,
      details: {} as Record<string, any>
    };

    try {
      // Check Redis connection
      const pong = await this.redis.ping();
      health.redis = pong === 'PONG';
      
      // Check queue health
      const stats = await this.getQueueStats();
      health.queues = true;
      health.details.queueStats = stats;
      
      // Check worker health
      health.worker = this.worker !== null && !this.worker.isRunning();
      
      if (!health.redis || !health.queues || !health.worker) {
        health.status = 'unhealthy';
      }
      
    } catch (error) {
      health.status = 'unhealthy';
      health.details.error = error instanceof Error ? error.message : String(error);
    }

    return health;
  }

  // ============================================================================
  // DATABASE INTEGRATION
  // ============================================================================

  private async updateJobHistory(
    jobId: string,
    status: JobStatus,
    errorMessage?: string,
    result?: any
  ): Promise<void> {
    try {
      const { createClient } = await import('@/lib/supabase/server');
      const supabase = createClient();

      const updateData: any = {
        status,
        updated_at: new Date().toISOString()
      };

      if (status === JobStatus.COMPLETED) {
        updateData.completed_at = new Date().toISOString();
        if (result) {
          updateData.result = result;
        }
      }

      if (errorMessage) {
        updateData.error_message = errorMessage;
      }

      const { error } = await supabase
        .from('job_execution_history')
        .update(updateData)
        .eq('execution_id', jobId);

      if (error) {
        console.error('Error updating job history:', error);
      }
    } catch (error) {
      console.error('Database error in updateJobHistory:', error);
    }
  }

  // ============================================================================
  // UTILITY METHODS
  // ============================================================================

  private getPriorityValue(priority: JobPriority): number {
    switch (priority) {
      case JobPriority.CRITICAL: return 1;
      case JobPriority.HIGH: return 2;
      case JobPriority.NORMAL: return 3;
      case JobPriority.LOW: return 4;
      default: return 3;
    }
  }

  async shutdown(): Promise<void> {
    console.log('🔄 Shutting down Job Scheduler...');
    
    if (this.worker) {
      await this.worker.close();
      console.log('✅ Worker closed');
    }
    
    if (this.queueEvents) {
      await this.queueEvents.close();
      console.log('✅ Queue events closed');
    }
    
    await this.reportQueue.close();
    await this.aggregationQueue.close();
    await this.cleanupQueue.close();
    console.log('✅ Queues closed');
    
    await this.redis.disconnect();
    console.log('✅ Redis connection closed');
    
    this.isInitialized = false;
    console.log('✅ Job Scheduler shut down successfully');
  }
}

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

let schedulerInstance: JobScheduler | null = null;

export const getJobScheduler = async (): Promise<JobScheduler> => {
  if (!schedulerInstance) {
    schedulerInstance = new JobScheduler();
    await schedulerInstance.initialize();
  }
  return schedulerInstance;
};

export const shutdownScheduler = async (): Promise<void> => {
  if (schedulerInstance) {
    await schedulerInstance.shutdown();
    schedulerInstance = null;
  }
};

// ============================================================================
// DEFAULT SCHEDULED JOBS
// ============================================================================

export const initializeDefaultJobs = async (): Promise<void> => {
  const scheduler = await getJobScheduler();
  
  // Daily summary report - 10pm UK time
  await scheduler.scheduleRecurringJob(
    'daily-summary-report',
    'daily_summary',
    { reportDate: new Date() },
    '0 22 * * *',
    { 
      priority: JobPriority.HIGH,
      timezone: 'Europe/London',
      maxRetries: 3,
      timeout: 300000
    }
  );

  // Weekly summary report - Monday 9am UK time  
  await scheduler.scheduleRecurringJob(
    'weekly-summary-report', 
    'weekly_summary',
    { weekStart: new Date() },
    '0 9 * * MON',
    {
      priority: JobPriority.HIGH,
      timezone: 'Europe/London',
      maxRetries: 3,
      timeout: 600000
    }
  );

  // Daily aggregation processing - 2am UK time
  await scheduler.scheduleRecurringJob(
    'daily-aggregation-processing',
    'aggregation',
    { aggregationDate: new Date() },
    '0 2 * * *',
    {
      priority: JobPriority.NORMAL,
      timezone: 'Europe/London',
      maxRetries: 2,
      timeout: 1800000
    }
  );

  // Weekly cleanup - Sunday 3am UK time
  await scheduler.scheduleRecurringJob(
    'weekly-cleanup',
    'cleanup',
    { retentionDays: 90 },
    '0 3 * * SUN',
    {
      priority: JobPriority.LOW,
      timezone: 'Europe/London',
      maxRetries: 1,
      timeout: 600000
    }
  );

  console.log('✅ Default scheduled jobs initialized successfully');
};