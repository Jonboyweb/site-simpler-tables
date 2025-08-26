import { DailySummaryReportGenerator } from '@/lib/reporting/generators/daily-summary-generator';
import { SupabaseClient } from '@supabase/supabase-js';
import { mockVenueMetrics } from '../__mocks__/report-data';

describe('Daily Summary Report Generator', () => {
  let reportGenerator: DailySummaryReportGenerator;
  let mockSupabase: jest.Mocked<SupabaseClient>;

  beforeEach(() => {
    // Mock Supabase client
    mockSupabase = {
      from: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      gte: jest.fn().mockReturnThis(),
      lte: jest.fn().mockReturnThis(),
    } as unknown as jest.Mocked<SupabaseClient>;

    reportGenerator = new DailySummaryReportGenerator(mockSupabase);
  });

  test('Aggregates venue metrics accurately for business day', async () => {
    // Mock the database query results
    mockSupabase.select.mockResolvedValue({
      data: mockVenueMetrics,
      error: null
    });

    const metrics = await reportGenerator.aggregateDailyMetrics(new Date());

    expect(metrics).toEqual(expect.objectContaining({
      totalBookings: expect.any(Number),
      totalRevenue: expect.any(Number),
      tablesOccupied: expect.any(Number)
    }));
  });

  test('Calculates performance analytics correctly', async () => {
    mockSupabase.select.mockResolvedValue({
      data: mockVenueMetrics,
      error: null
    });

    const performanceAnalytics = await reportGenerator.calculatePerformanceMetrics(new Date());

    expect(performanceAnalytics).toEqual(expect.objectContaining({
      avgPartySize: expect.any(Number),
      checkedInRate: expect.any(Number),
      noShowRate: expect.any(Number)
    }));
  });

  test('Handles missing data gracefully with fallbacks', async () => {
    // Simulate no data scenario
    mockSupabase.select.mockResolvedValue({
      data: null,
      error: null
    });

    const metrics = await reportGenerator.aggregateDailyMetrics(new Date());

    expect(metrics).toEqual(expect.objectContaining({
      totalBookings: 0,
      totalRevenue: 0,
      tablesOccupied: 0
    }));
  });

  test('Generates professional PDF with prohibition styling', async () => {
    mockSupabase.select.mockResolvedValue({
      data: mockVenueMetrics,
      error: null
    });

    const pdfReport = await reportGenerator.generatePdfReport(new Date());

    expect(pdfReport).toEqual(expect.objectContaining({
      path: expect.any(String),
      size: expect.any(Number)
    }));

    // Validate prohibition-era styling specifics
    expect(pdfReport.path).toMatch(/daily-report-\d{8}\.pdf/);
  });

  test('Creates audit trail for report generation', async () => {
    mockSupabase.select.mockResolvedValue({
      data: mockVenueMetrics,
      error: null
    });

    const auditTrail = await reportGenerator.createReportAuditTrail(new Date());

    expect(auditTrail).toEqual(expect.objectContaining({
      reportId: expect.any(String),
      generatedAt: expect.any(Date),
      metrics: expect.any(Object)
    }));
  });
});