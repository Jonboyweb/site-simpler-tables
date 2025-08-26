import { 
  testServices, 
  testFailureSimulator,
  mockDataGenerator 
} from '../setup';

describe('Job Failure Recovery Integration', () => {
  let supabaseClient: any;
  let reportQueue: any;
  let redisClient: any;
  let emailClients: any;

  beforeAll(async () => {
    supabaseClient = testServices.createSupabaseClient();
    reportQueue = testServices.createReportQueue('recovery-reports');
    redisClient = testServices.createRedisClient();
    emailClients = testServices.createEmailClients();
  });

  afterAll(async () => {
    await reportQueue.close();
    await redisClient.quit();
    await supabaseClient.auth.signOut();
  });

  test('Complete error handling and recovery workflow', async () => {
    // 1. Simulate database connectivity failure
    await testFailureSimulator.simulateDatabaseConnectionLoss(supabaseClient);

    // 2. Attempt report generation with simulated failure
    const job = await reportQueue.add('generate-recovery-report', {
      date: new Date().toISOString(),
      retryCount: 0,
    });

    // 3. Set up sophisticated retry and fallback mechanism
    const jobOptions = {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 1000, // Start with 1 second
      },
    };

    try {
      const result = await job.waitUntilFinished(reportQueue, jobOptions);
      
      // Unexpected success case
      expect(result).toBeNull();
    } catch (error) {
      // 4. Validate error handling
      expect(error).toBeDefined();
      expect(error.message).toContain('Database connection lost');

      // 5. Trigger manual recovery process
      const recoveryData = mockDataGenerator.generateDailyBookingData();
      
      // Simulate manual data reconstruction
      const { data: reconstructedData, error: reconstructionError } = await supabaseClient
        .from('recovery_bookings')
        .insert(recoveryData);

      expect(reconstructionError).toBeNull();
      expect(reconstructedData).toBeTruthy();

      // 6. Send alert notification
      const alertEmail = await emailClients.resend.emails.send({
        from: 'alerts@backroomleeds.com',
        to: ['admin@backroomleeds.com'],
        subject: 'Reporting System Recovery Alert',
        html: `
          <h1>Reporting System Recovery Initiated</h1>
          <p>Database connection loss detected and recovered.</p>
          <p>Recovery timestamp: ${new Date().toISOString()}</p>
          <p>Reconstructed records: ${reconstructedData.length}</p>
        `,
      });

      expect(alertEmail.id).toBeTruthy();
    }
  });

  test('Job queue resilience under extreme conditions', async () => {
    // Simulate high-concurrency job submission
    const jobPromises = Array.from({ length: 50 }, (_, i) => 
      reportQueue.add(`concurrent-job-${i}`, {
        timestamp: Date.now(),
        jobIndex: i,
      })
    );

    const results = await Promise.allSettled(jobPromises);

    // Validate job queue handles high concurrency
    const successfulJobs = results.filter(
      result => result.status === 'fulfilled'
    ).length;

    expect(successfulJobs).toBeGreaterThan(40); // High success rate
  });
});