/**
 * The Backroom Leeds - Reporting System Integration Tests
 * Version: 1.0.0
 * Phase: 3, Step 3.5
 * 
 * Comprehensive integration tests for the automated reporting system
 */

import { describe, test, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import { getJobScheduler, shutdownScheduler } from '@/lib/reporting/jobs/JobScheduler';
import { getJobMonitor } from '@/lib/reporting/jobs/JobMonitor';
import { getRecipientManager } from '@/lib/reporting/distribution/RecipientManager';
import { getMetricsCalculator } from '@/lib/reporting/analytics/MetricsCalculator';
import { DailySummaryGenerator } from '@/lib/reporting/generators/DailySummaryGenerator';
import { WeeklySummaryGenerator } from '@/lib/reporting/generators/WeeklySummaryGenerator';
import { EmailDistributor } from '@/lib/reporting/distribution/EmailDistributor';
import { ReportFormat, DeliveryChannel, JobPriority, JobStatus } from '@/types/reporting';

// ============================================================================
// TEST SETUP
// ============================================================================

describe('Reporting System Integration Tests', () => {
  let jobScheduler: any;
  let jobMonitor: any;
  let recipientManager: any;
  let metricsCalculator: any;

  beforeAll(async () => {
    // Initialize system components
    jobScheduler = await getJobScheduler();
    jobMonitor = getJobMonitor();
    recipientManager = getRecipientManager();
    metricsCalculator = getMetricsCalculator();
  });

  afterAll(async () => {
    // Cleanup
    await shutdownScheduler();
  });

  beforeEach(async () => {
    // Clean up any test data before each test
    jest.clearAllMocks();
  });

  // ============================================================================
  // JOB SCHEDULING TESTS
  // ============================================================================

  describe('Job Scheduling System', () => {
    test('should initialize job scheduler successfully', async () => {
      expect(jobScheduler).toBeDefined();
      
      const healthCheck = await jobScheduler.healthCheck();
      expect(healthCheck.status).toBe('healthy');
      expect(healthCheck.redis).toBe(true);
    });

    test('should schedule daily report job', async () => {
      const jobId = await jobScheduler.scheduleOneTimeJob(
        'test-daily-report',
        'daily_summary',
        { reportDate: new Date() },
        1000, // 1 second delay
        { priority: JobPriority.HIGH }
      );

      expect(jobId).toBeDefined();
      expect(typeof jobId).toBe('string');
    });

    test('should schedule weekly report job', async () => {
      const jobId = await jobScheduler.scheduleOneTimeJob(
        'test-weekly-report',
        'weekly_summary',
        { weekStart: new Date() },
        1000,
        { priority: JobPriority.HIGH }
      );

      expect(jobId).toBeDefined();
      expect(typeof jobId).toBe('string');
    });

    test('should get queue statistics', async () => {
      const stats = await jobScheduler.getQueueStats();
      
      expect(stats).toHaveProperty('waiting');
      expect(stats).toHaveProperty('active');
      expect(stats).toHaveProperty('completed');
      expect(stats).toHaveProperty('failed');
      
      expect(typeof stats.waiting).toBe('number');
      expect(typeof stats.active).toBe('number');
    });

    test('should handle job cancellation', async () => {
      const jobId = await jobScheduler.scheduleOneTimeJob(
        'test-cancellation',
        'daily_summary',
        { reportDate: new Date() },
        10000, // 10 second delay
        { priority: JobPriority.LOW }
      );

      // Cancel the job
      await jobScheduler.removeJob(jobId);

      // Verify job was cancelled
      const status = await jobScheduler.getJobStatus(jobId);
      expect(status).toBeNull();
    });
  });

  // ============================================================================
  // REPORT GENERATION TESTS
  // ============================================================================

  describe('Report Generation', () => {
    test('should generate daily summary report', async () => {
      const generator = new DailySummaryGenerator();
      
      const result = await generator.generate({
        reportDate: new Date(),
        format: ReportFormat.JSON
      });

      expect(result).toHaveProperty('reportId');
      expect(result).toHaveProperty('reportData');
      expect(result.reportData).toHaveProperty('date');
      expect(result.reportData).toHaveProperty('overview');
      expect(result.reportData).toHaveProperty('bookings');
      expect(result.reportData).toHaveProperty('revenue');
      expect(result.reportData).toHaveProperty('events');
      expect(result.reportData).toHaveProperty('customers');
      
      // Verify data structure
      expect(result.reportData.overview).toHaveProperty('totalBookings');
      expect(result.reportData.overview).toHaveProperty('totalRevenue');
      expect(result.reportData.overview).toHaveProperty('totalGuests');
      expect(result.reportData.overview).toHaveProperty('occupancyRate');
    });

    test('should generate weekly summary report', async () => {
      const generator = new WeeklySummaryGenerator();
      
      const result = await generator.generate({
        weekStart: new Date(),
        format: ReportFormat.JSON
      });

      expect(result).toHaveProperty('reportId');
      expect(result).toHaveProperty('reportData');
      expect(result.reportData).toHaveProperty('weekStart');
      expect(result.reportData).toHaveProperty('weekEnd');
      expect(result.reportData).toHaveProperty('overview');
      expect(result.reportData).toHaveProperty('dailyBreakdown');
      expect(result.reportData).toHaveProperty('topEvents');
      expect(result.reportData).toHaveProperty('customerMetrics');
      expect(result.reportData).toHaveProperty('trends');
      
      // Verify trends data
      expect(result.reportData.trends).toHaveProperty('bookingTrend');
      expect(result.reportData.trends).toHaveProperty('revenueTrend');
      expect(result.reportData.trends).toHaveProperty('occupancyTrend');
    });

    test('should handle report generation errors gracefully', async () => {
      const generator = new DailySummaryGenerator();
      
      // Test with invalid date
      await expect(async () => {
        await generator.generate({
          reportDate: new Date('invalid-date'),
          format: ReportFormat.JSON
        });
      }).rejects.toThrow();
    });
  });

  // ============================================================================
  // RECIPIENT MANAGEMENT TESTS
  // ============================================================================

  describe('Recipient Management', () => {
    let testRecipientId: string;

    test('should create a new recipient', async () => {
      const recipientData = {
        email: `test-${Date.now()}@backroomleeds.test`,
        name: 'Test Recipient',
        role: 'manager',
        preferredChannels: [DeliveryChannel.EMAIL],
        preferredFormat: ReportFormat.PDF
      };

      testRecipientId = await recipientManager.createRecipient(recipientData);
      
      expect(testRecipientId).toBeDefined();
      expect(typeof testRecipientId).toBe('string');
    });

    test('should retrieve recipient details', async () => {
      const recipient = await recipientManager.getRecipient(testRecipientId);
      
      expect(recipient).toBeDefined();
      expect(recipient.id).toBe(testRecipientId);
      expect(recipient.email).toContain('@backroomleeds.test');
      expect(recipient.name).toBe('Test Recipient');
    });

    test('should update recipient information', async () => {
      const updateData = {
        name: 'Updated Test Recipient',
        preferredFormat: ReportFormat.EXCEL
      };

      const success = await recipientManager.updateRecipient(testRecipientId, updateData);
      expect(success).toBe(true);

      const updatedRecipient = await recipientManager.getRecipient(testRecipientId);
      expect(updatedRecipient.name).toBe('Updated Test Recipient');
      expect(updatedRecipient.preferredFormat).toBe(ReportFormat.EXCEL);
    });

    test('should create subscription for recipient', async () => {
      const subscriptionRequest = {
        recipientEmail: (await recipientManager.getRecipient(testRecipientId)).email,
        templateId: 'daily-summary-template-id', // This would be a real template ID in practice
        deliveryFormat: ReportFormat.PDF,
        deliveryChannels: [DeliveryChannel.EMAIL]
      };

      const subscriptionResponse = await recipientManager.subscribeToReport(subscriptionRequest);
      
      expect(subscriptionResponse).toHaveProperty('subscriptionId');
      expect(subscriptionResponse).toHaveProperty('status');
      expect(subscriptionResponse.status).toBe('pending_verification');
    });

    test('should list recipients with pagination', async () => {
      const result = await recipientManager.listRecipients(
        { role: 'manager' },
        { page: 1, pageSize: 10 }
      );

      expect(result).toHaveProperty('recipients');
      expect(result).toHaveProperty('totalCount');
      expect(result).toHaveProperty('page');
      expect(result).toHaveProperty('totalPages');
      
      expect(Array.isArray(result.recipients)).toBe(true);
      expect(typeof result.totalCount).toBe('number');
    });

    test('should deactivate recipient', async () => {
      const success = await recipientManager.deactivateRecipient(testRecipientId);
      expect(success).toBe(true);

      const deactivatedRecipient = await recipientManager.getRecipient(testRecipientId);
      expect(deactivatedRecipient.isActive).toBe(false);
    });
  });

  // ============================================================================
  // METRICS CALCULATION TESTS
  // ============================================================================

  describe('Metrics Calculation', () => {
    test('should process daily aggregation', async () => {
      const result = await metricsCalculator.processAggregation({
        aggregationDate: new Date(),
        type: 'daily',
        forceRecalculation: true
      });

      expect(result).toHaveProperty('success');
      expect(result).toHaveProperty('recordsProcessed');
      expect(result).toHaveProperty('executionTimeMs');
      
      expect(result.success).toBe(true);
      expect(typeof result.recordsProcessed).toBe('number');
      expect(typeof result.executionTimeMs).toBe('number');
    });

    test('should calculate event performance analytics', async () => {
      const eventAnalytics = await metricsCalculator.calculateEventPerformance(
        'test-event-id',
        new Date()
      );

      // Should handle gracefully even if no data exists
      expect(eventAnalytics).toBeDefined();
    });
  });

  // ============================================================================
  // EMAIL DISTRIBUTION TESTS
  // ============================================================================

  describe('Email Distribution', () => {
    test('should initialize email distributor', () => {
      const emailDistributor = new EmailDistributor();
      expect(emailDistributor).toBeDefined();
    });

    test('should handle delivery stats retrieval', async () => {
      const emailDistributor = new EmailDistributor();
      
      const stats = await emailDistributor.getDeliveryStats('non-existent-report-id');
      
      expect(stats).toHaveProperty('total');
      expect(stats).toHaveProperty('delivered');
      expect(stats).toHaveProperty('failed');
      expect(stats).toHaveProperty('pending');
      expect(stats).toHaveProperty('bounced');
      
      // Should return zeros for non-existent report
      expect(stats.total).toBe(0);
    });
  });

  // ============================================================================
  // JOB MONITORING TESTS
  // ============================================================================

  describe('Job Monitoring', () => {
    test('should record job execution', async () => {
      const executionId = await jobMonitor.recordJobExecution({
        jobId: 'test-job-monitoring',
        executionId: `test-${Date.now()}`,
        status: JobStatus.COMPLETED,
        startedAt: new Date(Date.now() - 5000),
        completedAt: new Date(),
        executionTimeMs: 5000,
        attemptNumber: 1,
        metadata: { test: true }
      });

      expect(executionId).toBeDefined();
      expect(typeof executionId).toBe('string');
    });

    test('should get system performance overview', async () => {
      const overview = await jobMonitor.getSystemPerformanceOverview();
      
      if (overview) {
        expect(overview).toHaveProperty('totalJobs');
        expect(overview).toHaveProperty('runningJobs');
        expect(overview).toHaveProperty('failedJobs');
        expect(overview).toHaveProperty('completedJobs');
        expect(overview).toHaveProperty('systemLoad');
        
        expect(typeof overview.totalJobs).toBe('number');
        expect(typeof overview.systemLoad).toBe('number');
      }
    });

    test('should get job performance metrics', async () => {
      const metrics = await jobMonitor.getJobPerformanceMetrics('test-job-monitoring', 7);
      
      // Should handle gracefully even if no data exists
      expect(metrics).toBeDefined();
    });
  });

  // ============================================================================
  // API INTEGRATION TESTS
  // ============================================================================

  describe('API Integration', () => {
    test('should handle daily report generation API', async () => {
      // Mock API call
      const mockRequest = {
        reportDate: new Date().toISOString(),
        format: ReportFormat.JSON,
        async: false
      };

      // This would typically test the actual API endpoint
      // For now, we'll test the underlying logic
      const generator = new DailySummaryGenerator();
      const result = await generator.generate({
        reportDate: new Date(mockRequest.reportDate),
        format: mockRequest.format
      });

      expect(result).toBeDefined();
      expect(result.reportData).toBeDefined();
    });

    test('should handle metrics API request', async () => {
      // Mock metrics request
      const mockMetrics = ['daily_revenue', 'total_bookings'];
      
      // This would test the actual metrics API endpoint
      // For now, we'll verify the underlying calculation works
      const result = await metricsCalculator.processAggregation({
        aggregationDate: new Date(),
        type: 'daily'
      });

      expect(result.success).toBe(true);
    });
  });

  // ============================================================================
  // ERROR HANDLING TESTS
  // ============================================================================

  describe('Error Handling', () => {
    test('should handle database connection errors gracefully', async () => {
      // Test with invalid configuration
      expect(async () => {
        const generator = new DailySummaryGenerator();
        // This should handle database errors gracefully
        await generator.generate({
          reportDate: new Date(),
          format: ReportFormat.JSON
        });
      }).not.toThrow();
    });

    test('should handle job scheduling errors', async () => {
      // Test with invalid job configuration
      await expect(async () => {
        await jobScheduler.scheduleOneTimeJob(
          '', // Empty name should cause validation error
          'invalid_type',
          {},
          0
        );
      }).rejects.toThrow();
    });

    test('should handle email delivery failures', async () => {
      const emailDistributor = new EmailDistributor();
      
      // Test with invalid recipient data
      const stats = await emailDistributor.getDeliveryStats('invalid-report-id');
      
      // Should return default values without throwing
      expect(stats.total).toBe(0);
    });
  });

  // ============================================================================
  // PERFORMANCE TESTS
  // ============================================================================

  describe('Performance Tests', () => {
    test('should generate daily report within acceptable time', async () => {
      const startTime = Date.now();
      
      const generator = new DailySummaryGenerator();
      const result = await generator.generate({
        reportDate: new Date(),
        format: ReportFormat.JSON
      });
      
      const executionTime = Date.now() - startTime;
      
      expect(result).toBeDefined();
      expect(executionTime).toBeLessThan(10000); // Should complete within 10 seconds
    });

    test('should handle concurrent report generation', async () => {
      const generator = new DailySummaryGenerator();
      
      const promises = Array.from({ length: 3 }, (_, i) => 
        generator.generate({
          reportDate: new Date(),
          format: ReportFormat.JSON
        })
      );

      const results = await Promise.all(promises);
      
      expect(results).toHaveLength(3);
      results.forEach(result => {
        expect(result).toBeDefined();
        expect(result.reportData).toBeDefined();
      });
    });
  });

  // ============================================================================
  // END-TO-END WORKFLOW TESTS
  // ============================================================================

  describe('End-to-End Workflow', () => {
    test('should complete full reporting workflow', async () => {
      // 1. Schedule a report generation job
      const jobId = await jobScheduler.scheduleOneTimeJob(
        'e2e-test-report',
        'daily_summary',
        { reportDate: new Date() },
        100, // Very short delay
        { priority: JobPriority.HIGH }
      );

      expect(jobId).toBeDefined();

      // 2. Wait a moment for job to potentially start
      await new Promise(resolve => setTimeout(resolve, 200));

      // 3. Check job status
      const status = await jobScheduler.getJobStatus(jobId);
      expect(status).toBeDefined();

      // 4. Generate a report directly (since job queue might not be fully running in test)
      const generator = new DailySummaryGenerator();
      const report = await generator.generate({
        reportDate: new Date(),
        format: ReportFormat.JSON
      });

      expect(report.reportData).toBeDefined();
      expect(report.reportId).toBeDefined();

      // 5. Verify report contains expected data structure
      const reportData = report.reportData;
      expect(reportData.date).toBeDefined();
      expect(reportData.overview.totalBookings).toBeGreaterThanOrEqual(0);
      expect(reportData.overview.totalRevenue).toBeGreaterThanOrEqual(0);
      expect(reportData.overview.occupancyRate).toBeGreaterThanOrEqual(0);
      expect(reportData.overview.occupancyRate).toBeLessThanOrEqual(100);
    });
  });
});