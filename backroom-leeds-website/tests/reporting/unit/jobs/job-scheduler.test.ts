import { ReportJobScheduler } from '@/lib/reporting/jobs/job-scheduler';
import { Queue } from 'bullmq';
import { DateTime } from 'luxon';

describe('Automated Job Scheduling', () => {
  let jobScheduler: ReportJobScheduler;
  let mockQueue: jest.Mocked<Queue>;

  beforeEach(() => {
    // Mock BullMQ Queue
    mockQueue = {
      add: jest.fn(),
      getJobs: jest.fn(),
      getJobCounts: jest.fn(),
      process: jest.fn()
    } as unknown as jest.Mocked<Queue>;

    jobScheduler = new ReportJobScheduler(mockQueue);
  });

  test('Schedules daily reports at correct UK timezone (10pm)', () => {
    const scheduledJob = jobScheduler.scheduleDailyReport();
    
    const scheduledTime = DateTime.fromObject({
      zone: 'Europe/London',
      hour: 22,
      minute: 0
    });

    expect(scheduledJob).toEqual(expect.objectContaining({
      jobId: expect.any(String),
      scheduledTime: scheduledTime.toISO()
    }));
  });

  test('Schedules weekly reports on Monday 9am UK time', () => {
    const scheduledJob = jobScheduler.scheduleWeeklyReport();
    
    const scheduledTime = DateTime.fromObject({
      zone: 'Europe/London',
      weekday: 1,  // Monday
      hour: 9,
      minute: 0
    });

    expect(scheduledJob).toEqual(expect.objectContaining({
      jobId: expect.any(String),
      scheduledTime: scheduledTime.toISO()
    }));
  });

  test('Handles job dependencies and execution order', async () => {
    const dailyJob = jobScheduler.scheduleDailyReport();
    const weeklyJob = jobScheduler.scheduleWeeklyReport();

    const dependencyChain = await jobScheduler.createReportDependencyChain(
      dailyJob.jobId, 
      weeklyJob.jobId
    );

    expect(dependencyChain).toEqual(expect.objectContaining({
      mainJobId: dailyJob.jobId,
      dependentJobId: weeklyJob.jobId
    }));
  });

  test('Implements retry logic with exponential backoff', async () => {
    const retryConfig = jobScheduler.configureRetryStrategy();

    expect(retryConfig).toEqual(expect.objectContaining({
      attempts: expect.any(Number),
      backoff: {
        type: 'exponential',
        delay: expect.any(Number)
      }
    }));
  });

  test('Monitors job performance and generates alerts', async () => {
    const performanceMonitor = jobScheduler.createPerformanceMonitor();

    const alertResult = await performanceMonitor.checkJobPerformance();

    expect(alertResult).toEqual(expect.objectContaining({
      status: expect.stringMatching(/healthy|warning|critical/),
      metrics: expect.any(Object)
    }));
  });

  test('Manages concurrent job execution efficiently', async () => {
    const concurrencyConfig = jobScheduler.configureConcurrentJobHandling();

    expect(concurrencyConfig).toEqual(expect.objectContaining({
      maxConcurrentJobs: expect.any(Number),
      priorityQueue: expect.any(Array)
    }));
  });
});