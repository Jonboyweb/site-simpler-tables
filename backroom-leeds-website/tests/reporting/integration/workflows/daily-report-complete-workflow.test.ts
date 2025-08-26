import { 
  testServices, 
  mockDataGenerator, 
  testFailureSimulator, 
  performanceTestUtils 
} from '../setup';

describe('Daily Report Complete Integration Workflow', () => {
  let supabaseClient: any;
  let reportQueue: any;
  let reportWorker: any;
  let emailClients: any;

  beforeAll(async () => {
    // Initialize all necessary services
    supabaseClient = testServices.createSupabaseClient();
    reportQueue = testServices.createReportQueue('daily-reports');
    emailClients = testServices.createEmailClients();
  });

  afterAll(async () => {
    // Clean up resources
    await reportQueue.close();
    await supabaseClient.auth.signOut();
  });

  test('End-to-end daily report generation and distribution', async () => {
    // 1. Generate mock booking data
    const bookingData = mockDataGenerator.generateDailyBookingData();
    
    // 2. Insert mock data into Supabase
    const { data: insertedData, error: insertError } = await supabaseClient
      .from('daily_bookings')
      .insert(bookingData);
    
    expect(insertError).toBeNull();
    expect(insertedData).toBeTruthy();

    // 3. Create report generation job
    const job = await reportQueue.add('generate-daily-report', {
      date: new Date().toISOString(),
      bookingData: insertedData,
    });

    // 4. Process report generation
    const executionTime = await performanceTestUtils.measureExecutionTime(async () => {
      const result = await job.waitUntilFinished(reportQueue);
      
      // Validate report generation
      expect(result).toBeTruthy();
      expect(result.pdfUrl).toBeDefined();
      expect(result.htmlUrl).toBeDefined();
    });

    // Performance validation
    expect(executionTime).toBeLessThan(120000); // Under 2 minutes

    // 5. Email distribution
    const emailResult = await emailClients.resend.emails.send({
      from: 'reports@backroomleeds.com',
      to: ['manager@backroomleeds.com'],
      subject: 'Daily Venue Report',
      attachments: [
        { filename: 'daily-report.pdf', path: result.pdfUrl },
        { filename: 'daily-report.html', path: result.htmlUrl },
      ],
    });

    expect(emailResult.id).toBeTruthy();
  });

  test('Email service failover scenario', async () => {
    // Simulate primary email service failure
    await testFailureSimulator.simulateEmailServiceFailure(emailClients.resend);

    // Attempt report distribution with fallback
    const fallbackResult = await emailClients.sendgrid.sendMail({
      from: 'reports@backroomleeds.com',
      to: ['manager@backroomleeds.com'],
      subject: 'Daily Venue Report - Fallback Delivery',
      text: 'Report generation successful. Fallback email service used.',
    });

    expect(fallbackResult.messageId).toBeTruthy();
  });
});