import { 
  testServices, 
  mockDataGenerator, 
  performanceTestUtils 
} from '../setup';

describe('Weekly Report Analytics Integration', () => {
  let supabaseClient: any;
  let reportQueue: any;
  let emailClients: any;

  beforeAll(async () => {
    supabaseClient = testServices.createSupabaseClient();
    reportQueue = testServices.createReportQueue('weekly-reports');
    emailClients = testServices.createEmailClients();
  });

  afterAll(async () => {
    await reportQueue.close();
    await supabaseClient.auth.signOut();
  });

  test('Comprehensive weekly business intelligence generation', async () => {
    // 1. Generate multi-source mock data
    const bookingData = mockDataGenerator.generateDailyBookingData();
    const customerData = mockDataGenerator.generateWeeklyCustomerData();

    // 2. Insert comprehensive data for analysis
    const { data: insertedBookings, error: bookingError } = await supabaseClient
      .from('weekly_bookings')
      .insert(bookingData);
    
    const { data: insertedCustomers, error: customerError } = await supabaseClient
      .from('weekly_customers')
      .insert(customerData);

    expect(bookingError).toBeNull();
    expect(customerError).toBeNull();

    // 3. Create weekly report generation job
    const job = await reportQueue.add('generate-weekly-report', {
      startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      endDate: new Date().toISOString(),
      bookingData: insertedBookings,
      customerData: insertedCustomers,
    });

    // 4. Process comprehensive report generation
    const executionTime = await performanceTestUtils.measureExecutionTime(async () => {
      const result = await job.waitUntilFinished(reportQueue);
      
      // Validate comprehensive report
      expect(result).toBeTruthy();
      expect(result.analytics).toBeDefined();
      
      // Venue-specific KPI validation
      expect(result.analytics.totalRevenue).toBeGreaterThan(0);
      expect(result.analytics.averageTablesPerBooking).toBeGreaterThan(0);
      expect(result.analytics.topPerformingEvents).toHaveLength(3);

      // Performance and multi-format validation
      expect(result.pdfUrl).toBeDefined();
      expect(result.excelUrl).toBeDefined();
      expect(result.dashboardUpdateUrl).toBeDefined();
    });

    // Performance validation
    expect(executionTime).toBeLessThan(180000); // Under 3 minutes for comprehensive analysis

    // 5. Multi-stakeholder distribution
    const emailResult = await emailClients.resend.emails.send({
      from: 'reports@backroomleeds.com',
      to: [
        'manager@backroomleeds.com', 
        'marketing@backroomleeds.com', 
        'finance@backroomleeds.com'
      ],
      subject: 'Weekly Venue Performance Report',
      attachments: [
        { filename: 'weekly-report.pdf', path: result.pdfUrl },
        { filename: 'weekly-analytics.xlsx', path: result.excelUrl },
      ],
      html: `
        <h1>The Backroom Leeds - Weekly Performance</h1>
        <p>Total Revenue: £${result.analytics.totalRevenue.toFixed(2)}</p>
        <p>Top Events: ${result.analytics.topPerformingEvents.join(', ')}</p>
      `,
    });

    expect(emailResult.id).toBeTruthy();
  });
});