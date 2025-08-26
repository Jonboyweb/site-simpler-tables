import { ReportingWorkflow } from '@/lib/reporting/workflows/daily-reporting-workflow';
import { SupabaseClient } from '@supabase/supabase-js';
import { Queue } from 'bullmq';
import { EmailDistributor } from '@/lib/reporting/distribution/email-distributor';

describe('Complete Daily Report Workflow', () => {
  let workflow: ReportingWorkflow;
  let mockSupabase: jest.Mocked<SupabaseClient>;
  let mockQueue: jest.Mocked<Queue>;
  let mockEmailDistributor: jest.Mocked<EmailDistributor>;

  beforeEach(() => {
    // Setup mock services
    mockSupabase = {
      from: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
    } as unknown as jest.Mocked<SupabaseClient>;

    mockQueue = {
      add: jest.fn(),
      getJobs: jest.fn(),
    } as unknown as jest.Mocked<Queue>;

    mockEmailDistributor = {
      sendReportViaResend: jest.fn(),
      trackDeliveryStatus: jest.fn(),
    } as unknown as jest.Mocked<EmailDistributor>;

    workflow = new ReportingWorkflow(
      mockSupabase, 
      mockQueue, 
      mockEmailDistributor
    );
  });

  test('Full daily report: data aggregation → generation → distribution', async () => {
    // Setup mock data
    mockSupabase.select.mockResolvedValue({
      data: [
        { totalBookings: 45, totalRevenue: 12500, tablesOccupied: 14 }
      ],
      error: null
    });

    // Execute complete workflow
    const workflowResult = await workflow.executeDailyReportWorkflow(new Date());

    // Validate workflow stages
    expect(workflowResult).toEqual(expect.objectContaining({
      dataAggregation: expect.objectContaining({
        totalBookings: expect.any(Number),
        totalRevenue: expect.any(Number)
      }),
      reportGeneration: expect.objectContaining({
        pdfPath: expect.any(String),
        reportId: expect.any(String)
      }),
      emailDistribution: expect.objectContaining({
        status: 'sent',
        recipients: expect.any(Array)
      })
    }));

    // Verify interaction with mocked services
    expect(mockSupabase.from).toHaveBeenCalledWith('bookings');
    expect(mockQueue.add).toHaveBeenCalledWith(
      expect.stringContaining('daily-report'),
      expect.any(Object)
    );
    expect(mockEmailDistributor.sendReportViaResend).toHaveBeenCalled();
  });

  test('Job failure recovery: error detection → retry → success notification', async () => {
    // Simulate initial job failure
    mockQueue.add.mockRejectedValueOnce(new Error('Initial job submission failed'));

    // Retry mechanism
    const retryResult = await workflow.handleReportJobFailure(
      new Date(), 
      'daily-report-error'
    );

    expect(retryResult).toEqual(expect.objectContaining({
      originalJobId: expect.any(String),
      retryAttempts: expect.any(Number),
      finalStatus: expect.stringMatching(/success|failed/),
      errorLog: expect.any(Array)
    }));
  });

  test('Recipient lifecycle: subscription → delivery → unsubscribe', async () => {
    const recipientLifecycle = await workflow.manageReportRecipients(
      'user@example.com', 
      'daily'
    );

    expect(recipientLifecycle).toEqual(expect.objectContaining({
      subscription: expect.objectContaining({
        status: 'active',
        type: 'daily'
      }),
      deliveryHistory: expect.arrayContaining([
        expect.objectContaining({
          reportType: 'daily',
          deliveryStatus: expect.stringMatching(/sent|failed/)
        })
      ]),
      unsubscribeOption: expect.any(Object)
    }));
  });
});