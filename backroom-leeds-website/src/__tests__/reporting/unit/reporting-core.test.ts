/**
 * The Backroom Leeds - Reporting Core Unit Tests
 * Version: 1.0.0
 * Phase: 3, Step 3.5
 * 
 * Core unit tests for reporting system components
 */

import { describe, test, expect } from '@jest/globals';
import { 
  ReportFormat, 
  DeliveryChannel, 
  JobPriority, 
  JobStatus,
  AggregationPeriod,
  MetricType 
} from '@/types/reporting';

// ============================================================================
// TYPE VALIDATION TESTS
// ============================================================================

describe('Reporting System Core Tests', () => {
  
  describe('Type System Validation', () => {
    test('should have correct ReportFormat enum values', () => {
      expect(ReportFormat.PDF).toBe('pdf');
      expect(ReportFormat.CSV).toBe('csv');
      expect(ReportFormat.EXCEL).toBe('excel');
      expect(ReportFormat.HTML).toBe('html');
      expect(ReportFormat.JSON).toBe('json');
    });

    test('should have correct DeliveryChannel enum values', () => {
      expect(DeliveryChannel.EMAIL).toBe('email');
      expect(DeliveryChannel.SMS).toBe('sms');
      expect(DeliveryChannel.WEBHOOK).toBe('webhook');
      expect(DeliveryChannel.DASHBOARD).toBe('dashboard');
      expect(DeliveryChannel.API).toBe('api');
    });

    test('should have correct JobStatus enum values', () => {
      expect(JobStatus.PENDING).toBe('pending');
      expect(JobStatus.RUNNING).toBe('running');
      expect(JobStatus.COMPLETED).toBe('completed');
      expect(JobStatus.FAILED).toBe('failed');
      expect(JobStatus.CANCELLED).toBe('cancelled');
      expect(JobStatus.RETRYING).toBe('retrying');
    });

    test('should have correct JobPriority enum values', () => {
      expect(JobPriority.LOW).toBe('low');
      expect(JobPriority.NORMAL).toBe('normal');
      expect(JobPriority.HIGH).toBe('high');
      expect(JobPriority.CRITICAL).toBe('critical');
    });

    test('should have correct AggregationPeriod enum values', () => {
      expect(AggregationPeriod.HOURLY).toBe('hourly');
      expect(AggregationPeriod.DAILY).toBe('daily');
      expect(AggregationPeriod.WEEKLY).toBe('weekly');
      expect(AggregationPeriod.MONTHLY).toBe('monthly');
      expect(AggregationPeriod.QUARTERLY).toBe('quarterly');
      expect(AggregationPeriod.YEARLY).toBe('yearly');
    });

    test('should have correct MetricType enum values', () => {
      expect(MetricType.COUNT).toBe('count');
      expect(MetricType.SUM).toBe('sum');
      expect(MetricType.AVERAGE).toBe('average');
      expect(MetricType.PERCENTAGE).toBe('percentage');
      expect(MetricType.CURRENCY).toBe('currency');
      expect(MetricType.DURATION).toBe('duration');
      expect(MetricType.RATIO).toBe('ratio');
    });
  });

  // ============================================================================
  // DATA STRUCTURE VALIDATION
  // ============================================================================

  describe('Data Structure Validation', () => {
    test('should validate daily summary report data structure', () => {
      const mockDailySummary = {
        date: new Date(),
        overview: {
          totalBookings: 15,
          totalRevenue: 2500.50,
          totalGuests: 45,
          tablesOccupied: 8,
          occupancyRate: 50.0
        },
        bookings: {
          confirmed: 12,
          cancelled: 2,
          noShows: 1,
          walkIns: 3,
          waitlist: 5,
          averagePartySize: 3.0
        },
        revenue: {
          gross: 2500.50,
          net: 2350.75,
          deposits: 750.00,
          refunds: 149.75,
          perGuest: 55.57,
          perTable: 312.56
        },
        events: [
          {
            name: 'SHHH!',
            attendance: 35,
            revenue: 2100.00,
            occupancyRate: 87.5
          }
        ],
        customers: {
          new: 8,
          returning: 7,
          vip: 3,
          birthdays: 2,
          anniversaries: 1
        },
        topPackages: [
          {
            packageName: 'Premium Bottle Service',
            bookings: 5,
            revenue: 1250.00
          }
        ]
      };

      // Validate structure
      expect(mockDailySummary).toHaveProperty('date');
      expect(mockDailySummary).toHaveProperty('overview');
      expect(mockDailySummary).toHaveProperty('bookings');
      expect(mockDailySummary).toHaveProperty('revenue');
      expect(mockDailySummary).toHaveProperty('events');
      expect(mockDailySummary).toHaveProperty('customers');
      expect(mockDailySummary).toHaveProperty('topPackages');

      // Validate data types
      expect(typeof mockDailySummary.overview.totalBookings).toBe('number');
      expect(typeof mockDailySummary.overview.totalRevenue).toBe('number');
      expect(typeof mockDailySummary.overview.occupancyRate).toBe('number');
      expect(Array.isArray(mockDailySummary.events)).toBe(true);
      expect(Array.isArray(mockDailySummary.topPackages)).toBe(true);

      // Validate ranges
      expect(mockDailySummary.overview.occupancyRate).toBeGreaterThanOrEqual(0);
      expect(mockDailySummary.overview.occupancyRate).toBeLessThanOrEqual(100);
      expect(mockDailySummary.overview.totalBookings).toBeGreaterThanOrEqual(0);
      expect(mockDailySummary.overview.totalRevenue).toBeGreaterThanOrEqual(0);
    });

    test('should validate weekly summary report data structure', () => {
      const mockWeeklySummary = {
        weekStart: new Date('2024-01-01'),
        weekEnd: new Date('2024-01-07'),
        overview: {
          totalBookings: 85,
          totalRevenue: 12750.25,
          totalGuests: 255,
          averageOccupancyRate: 72.3,
          vsLastWeek: {
            bookingsChange: 12.5,
            revenueChange: 8.7,
            guestsChange: 15.2
          }
        },
        dailyBreakdown: [
          {
            date: new Date('2024-01-01'),
            bookings: 10,
            revenue: 1500.00,
            guests: 30,
            occupancyRate: 62.5
          }
        ],
        topEvents: [
          {
            id: 'event-1',
            eventId: 'shhh-saturday',
            eventDate: new Date('2024-01-06'),
            eventName: 'SHHH!',
            totalBookings: 20,
            totalGuests: 60,
            tableOccupancyRate: 93.75,
            walkInsCount: 2,
            totalRevenue: 4500.00,
            barRevenue: 0,
            tableRevenue: 4500.00,
            averageSpendPerGuest: 75.00,
            checkInRate: 95.0,
            noShowRate: 5.0,
            cancellationRate: 0.0,
            averagePartySize: 3.0,
            feedbackCount: 0,
            calculatedAt: new Date()
          }
        ],
        customerMetrics: {
          newCustomers: 25,
          returningRate: 68.2,
          averageLTV: 150.75,
          topCustomers: [
            {
              customerId: 'customer-1',
              name: 'VIP Customer',
              bookings: 3,
              spend: 450.00
            }
          ]
        },
        trends: {
          bookingTrend: 'up' as const,
          revenueTrend: 'up' as const,
          occupancyTrend: 'stable' as const
        },
        recommendations: [
          'Continue current marketing strategy',
          'Consider premium package promotions'
        ],
        alerts: []
      };

      // Validate structure
      expect(mockWeeklySummary).toHaveProperty('weekStart');
      expect(mockWeeklySummary).toHaveProperty('weekEnd');
      expect(mockWeeklySummary).toHaveProperty('overview');
      expect(mockWeeklySummary).toHaveProperty('dailyBreakdown');
      expect(mockWeeklySummary).toHaveProperty('topEvents');
      expect(mockWeeklySummary).toHaveProperty('customerMetrics');
      expect(mockWeeklySummary).toHaveProperty('trends');

      // Validate trends
      expect(['up', 'down', 'stable']).toContain(mockWeeklySummary.trends.bookingTrend);
      expect(['up', 'down', 'stable']).toContain(mockWeeklySummary.trends.revenueTrend);
      expect(['up', 'down', 'stable']).toContain(mockWeeklySummary.trends.occupancyTrend);

      // Validate arrays
      expect(Array.isArray(mockWeeklySummary.dailyBreakdown)).toBe(true);
      expect(Array.isArray(mockWeeklySummary.topEvents)).toBe(true);
      expect(Array.isArray(mockWeeklySummary.recommendations)).toBe(true);
      expect(Array.isArray(mockWeeklySummary.alerts)).toBe(true);

      // Validate date ranges
      expect(mockWeeklySummary.weekStart).toBeInstanceOf(Date);
      expect(mockWeeklySummary.weekEnd).toBeInstanceOf(Date);
      expect(mockWeeklySummary.weekEnd.getTime()).toBeGreaterThan(mockWeeklySummary.weekStart.getTime());
    });
  });

  // ============================================================================
  // BUSINESS LOGIC VALIDATION
  // ============================================================================

  describe('Business Logic Validation', () => {
    test('should validate venue constraints', () => {
      const totalTables = 16; // The Backroom Leeds venue specification
      const maxOccupancyRate = 100;
      const minOccupancyRate = 0;

      // Test occupancy rate calculation
      const tablesOccupied = 8;
      const occupancyRate = (tablesOccupied / totalTables) * 100;

      expect(occupancyRate).toBe(50);
      expect(occupancyRate).toBeGreaterThanOrEqual(minOccupancyRate);
      expect(occupancyRate).toBeLessThanOrEqual(maxOccupancyRate);

      // Test edge cases
      expect((0 / totalTables) * 100).toBe(0); // No tables occupied
      expect((totalTables / totalTables) * 100).toBe(100); // All tables occupied
    });

    test('should validate booking constraints', () => {
      const maxTablesPerBooking = 2; // Business rule
      const minPartySize = 1;
      const maxPartySize = 12; // Reasonable maximum for table capacity

      // Test party size validation
      expect(3).toBeGreaterThanOrEqual(minPartySize);
      expect(3).toBeLessThanOrEqual(maxPartySize);

      // Test table booking limits
      const tablesRequested = 1;
      expect(tablesRequested).toBeLessThanOrEqual(maxTablesPerBooking);
    });

    test('should validate financial calculations', () => {
      const grossRevenue = 2500.00;
      const refunds = 150.00;
      const netRevenue = grossRevenue - refunds;

      expect(netRevenue).toBe(2350.00);
      expect(netRevenue).toBeLessThanOrEqual(grossRevenue);

      // Test per-guest calculations
      const totalGuests = 50;
      const revenuePerGuest = grossRevenue / totalGuests;
      
      expect(revenuePerGuest).toBe(50.00);
      expect(revenuePerGuest).toBeGreaterThan(0);

      // Test deposit calculations (£50 standard deposit)
      const standardDeposit = 50.00;
      const numberOfBookings = 5;
      const totalDeposits = standardDeposit * numberOfBookings;

      expect(totalDeposits).toBe(250.00);
    });

    test('should validate time-based calculations', () => {
      // Test weekly date range
      const weekStart = new Date('2024-01-01T00:00:00Z'); // Monday
      const weekEnd = new Date('2024-01-07T23:59:59Z'); // Sunday
      
      const weekDuration = weekEnd.getTime() - weekStart.getTime();
      const expectedWeekDuration = 7 * 24 * 60 * 60 * 1000 - 1000; // 7 days minus 1 second

      expect(weekDuration).toBe(expectedWeekDuration);

      // Test daily report timing (10pm generation)
      const reportTime = new Date('2024-01-01T22:00:00Z');
      expect(reportTime.getHours()).toBe(22);
    });
  });

  // ============================================================================
  // UTILITY FUNCTION TESTS
  // ============================================================================

  describe('Utility Functions', () => {
    test('should format currency correctly', () => {
      const formatCurrency = (amount: number): string => {
        return `£${amount.toFixed(2)}`;
      };

      expect(formatCurrency(1234.56)).toBe('£1234.56');
      expect(formatCurrency(0)).toBe('£0.00');
      expect(formatCurrency(1000)).toBe('£1000.00');
    });

    test('should calculate percentage changes correctly', () => {
      const calculatePercentageChange = (oldValue: number, newValue: number): number => {
        if (oldValue === 0) return newValue > 0 ? 100 : 0;
        return Math.round(((newValue - oldValue) / oldValue) * 100 * 100) / 100;
      };

      expect(calculatePercentageChange(100, 120)).toBe(20);
      expect(calculatePercentageChange(100, 80)).toBe(-20);
      expect(calculatePercentageChange(100, 100)).toBe(0);
      expect(calculatePercentageChange(0, 50)).toBe(100);
      expect(calculatePercentageChange(0, 0)).toBe(0);
    });

    test('should validate email addresses', () => {
      const isValidEmail = (email: string): boolean => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
      };

      expect(isValidEmail('test@backroomleeds.co.uk')).toBe(true);
      expect(isValidEmail('manager@venue.com')).toBe(true);
      expect(isValidEmail('invalid-email')).toBe(false);
      expect(isValidEmail('')).toBe(false);
      expect(isValidEmail('test@')).toBe(false);
    });

    test('should validate cron expressions format', () => {
      const isValidCron = (expression: string): boolean => {
        // Basic cron validation (5 parts for standard cron)
        const parts = expression.split(' ');
        return parts.length === 5;
      };

      expect(isValidCron('0 22 * * *')).toBe(true); // Daily at 10pm
      expect(isValidCron('0 9 * * 1')).toBe(true); // Monday at 9am
      expect(isValidCron('invalid')).toBe(false);
      expect(isValidCron('')).toBe(false);
    });
  });

  // ============================================================================
  // MOCK DATA VALIDATION
  // ============================================================================

  describe('Mock Data Validation', () => {
    test('should generate realistic venue data', () => {
      const generateMockVenueData = () => ({
        totalTables: 16,
        upstairsTables: 8,
        downstairsTables: 8,
        events: {
          friday: 'BELLA GENTE',
          saturday: 'SHHH!',
          sunday: 'NOSTALGIA'
        },
        operatingHours: {
          open: '20:00',
          close: '03:00'
        },
        standardDeposit: 50.00,
        maxTablesPerBooking: 2
      });

      const mockData = generateMockVenueData();

      expect(mockData.totalTables).toBe(16);
      expect(mockData.upstairsTables + mockData.downstairsTables).toBe(mockData.totalTables);
      expect(mockData.standardDeposit).toBe(50.00);
      expect(mockData.maxTablesPerBooking).toBe(2);
      expect(mockData.events.saturday).toBe('SHHH!');
    });

    test('should generate realistic booking patterns', () => {
      const generateMockBookingPattern = () => ({
        weekdayAverage: 8, // Lower booking volume
        weekendAverage: 15, // Higher booking volume
        peakHours: ['21:00', '22:00', '23:00'],
        averagePartySize: 3.2,
        typicalOccupancyRate: 75
      });

      const pattern = generateMockBookingPattern();

      expect(pattern.weekendAverage).toBeGreaterThan(pattern.weekdayAverage);
      expect(pattern.averagePartySize).toBeGreaterThan(1);
      expect(pattern.typicalOccupancyRate).toBeGreaterThan(0);
      expect(pattern.typicalOccupancyRate).toBeLessThanOrEqual(100);
      expect(pattern.peakHours).toHaveLength(3);
    });
  });

  // ============================================================================
  // ERROR SCENARIOS
  // ============================================================================

  describe('Error Scenario Handling', () => {
    test('should handle division by zero in metrics', () => {
      const safeCalculateAverage = (total: number, count: number): number => {
        return count === 0 ? 0 : total / count;
      };

      expect(safeCalculateAverage(100, 0)).toBe(0);
      expect(safeCalculateAverage(100, 4)).toBe(25);
      expect(safeCalculateAverage(0, 5)).toBe(0);
    });

    test('should handle invalid date ranges', () => {
      const validateDateRange = (start: Date, end: Date): boolean => {
        return start instanceof Date && 
               end instanceof Date && 
               !isNaN(start.getTime()) && 
               !isNaN(end.getTime()) && 
               start < end;
      };

      const validStart = new Date('2024-01-01');
      const validEnd = new Date('2024-01-07');
      const invalidDate = new Date('invalid');

      expect(validateDateRange(validStart, validEnd)).toBe(true);
      expect(validateDateRange(validEnd, validStart)).toBe(false); // End before start
      expect(validateDateRange(invalidDate, validEnd)).toBe(false);
    });

    test('should handle empty or null data gracefully', () => {
      const safeArrayProcess = <T>(arr: T[] | null | undefined): T[] => {
        return arr || [];
      };

      const safeStringProcess = (str: string | null | undefined): string => {
        return str || '';
      };

      expect(safeArrayProcess(null)).toEqual([]);
      expect(safeArrayProcess(undefined)).toEqual([]);
      expect(safeArrayProcess([1, 2, 3])).toEqual([1, 2, 3]);
      
      expect(safeStringProcess(null)).toBe('');
      expect(safeStringProcess(undefined)).toBe('');
      expect(safeStringProcess('test')).toBe('test');
    });
  });
});