/**
 * The Backroom Leeds - Metrics Calculator
 * Version: 1.0.0
 * Phase: 3, Step 3.5
 * 
 * Advanced business intelligence and KPI calculation engine
 */

import { createClient } from '@/lib/supabase/server';
import { format, startOfDay, endOfDay, subDays, eachDayOfInterval } from 'date-fns';
import { 
  AggregationPeriod, 
  MetricType,
  type KPICalculation,
  type DailyAggregation,
  type EventPerformanceAnalytics 
} from '@/types/reporting';

// ============================================================================
// METRICS CALCULATOR CLASS
// ============================================================================

export class MetricsCalculator {
  private supabase = createClient();

  // ============================================================================
  // DAILY AGGREGATIONS PROCESSING
  // ============================================================================

  async processAggregation(payload: {
    aggregationDate?: Date;
    type?: 'daily' | 'hourly' | 'weekly' | 'monthly';
    forceRecalculation?: boolean;
  }): Promise<{
    success: boolean;
    recordsProcessed: number;
    executionTimeMs: number;
  }> {
    const startTime = Date.now();
    const targetDate = payload.aggregationDate || new Date();
    
    console.log(`📊 Processing ${payload.type || 'daily'} aggregation for ${format(targetDate, 'yyyy-MM-dd')}`);

    try {
      let recordsProcessed = 0;

      switch (payload.type || 'daily') {
        case 'daily':
          recordsProcessed = await this.processDailyAggregation(targetDate, payload.forceRecalculation);
          break;
        case 'hourly':
          recordsProcessed = await this.processHourlyAggregation(targetDate, payload.forceRecalculation);
          break;
        case 'weekly':
          recordsProcessed = await this.processWeeklyAggregation(targetDate, payload.forceRecalculation);
          break;
        case 'monthly':
          recordsProcessed = await this.processMonthlyAggregation(targetDate, payload.forceRecalculation);
          break;
      }

      const executionTimeMs = Date.now() - startTime;
      
      console.log(`✅ Aggregation completed: ${recordsProcessed} records in ${executionTimeMs}ms`);

      return {
        success: true,
        recordsProcessed,
        executionTimeMs
      };

    } catch (error) {
      console.error('❌ Error processing aggregation:', error);
      throw error;
    }
  }

  private async processDailyAggregation(targetDate: Date, forceRecalculation = false): Promise<number> {
    const dateStr = format(targetDate, 'yyyy-MM-dd');
    
    // Check if aggregation already exists and skip if not forcing
    if (!forceRecalculation) {
      const { data: existing } = await this.supabase
        .from('daily_aggregations')
        .select('id')
        .eq('aggregation_date', dateStr)
        .single();
      
      if (existing) {
        console.log(`Daily aggregation for ${dateStr} already exists, skipping`);
        return 0;
      }
    }

    // Get all bookings for the target date
    const { data: bookings, error: bookingsError } = await this.supabase
      .from('bookings')
      .select(`
        *,
        customers (id, created_at),
        payments (*)
      `)
      .eq('booking_date', dateStr);

    if (bookingsError) {
      throw new Error(`Failed to fetch bookings: ${bookingsError.message}`);
    }

    if (!bookings?.length) {
      console.log(`No bookings found for ${dateStr}, creating zero aggregation`);
      await this.createEmptyDailyAggregation(dateStr);
      return 1;
    }

    // Calculate metrics
    const metrics = this.calculateDailyMetrics(bookings, targetDate);
    
    // Upsert daily aggregation
    const { error: upsertError } = await this.supabase
      .from('daily_aggregations')
      .upsert({
        aggregation_date: dateStr,
        ...metrics,
        updated_at: new Date().toISOString()
      });

    if (upsertError) {
      throw new Error(`Failed to save daily aggregation: ${upsertError.message}`);
    }

    return 1;
  }

  private calculateDailyMetrics(bookings: any[], targetDate: Date): Partial<DailyAggregation> {
    const confirmedBookings = bookings.filter(b => b.status === 'confirmed');
    const cancelledBookings = bookings.filter(b => b.status === 'cancelled');
    const noShowBookings = bookings.filter(b => b.status === 'no_show');
    const checkedInBookings = bookings.filter(b => b.checked_in_at !== null);
    const walkInBookings = bookings.filter(b => b.is_walk_in === true);
    const vipBookings = bookings.filter(b => b.is_vip === true);
    
    // Revenue calculations
    const grossRevenue = confirmedBookings.reduce((sum, b) => sum + (b.total_amount || 0), 0);
    const depositsCollected = bookings.reduce((sum, b) => sum + (b.deposit_amount || 0), 0);
    
    // Calculate refunds from payments
    const allPayments = bookings.flatMap(b => b.payments || []);
    const refundsProcessed = allPayments
      .filter(p => p.payment_type === 'refund')
      .reduce((sum, p) => sum + p.amount, 0);
    
    const netRevenue = grossRevenue - refundsProcessed;
    
    // Guest metrics
    const totalGuests = confirmedBookings.reduce((sum, b) => sum + (b.party_size || 0), 0);
    
    // Table metrics
    const tablesOccupied = new Set(confirmedBookings.map(b => b.table_id)).size;
    const totalTables = 16; // From venue configuration
    const averageOccupancyRate = (tablesOccupied / totalTables) * 100;
    
    // Customer metrics
    const todayStr = format(targetDate, 'yyyy-MM-dd');
    const newCustomers = bookings.filter(b => 
      b.customers && format(new Date(b.customers.created_at), 'yyyy-MM-dd') === todayStr
    ).length;
    
    const returningCustomers = bookings.filter(b => 
      b.customers && format(new Date(b.customers.created_at), 'yyyy-MM-dd') !== todayStr
    ).length;
    
    // Special occasions
    const birthdaysCount = bookings.filter(b => 
      b.special_occasion === 'birthday' || 
      (b.special_requests && b.special_requests.toLowerCase().includes('birthday'))
    ).length;
    
    const anniversariesCount = bookings.filter(b => 
      b.special_occasion === 'anniversary' || 
      (b.special_requests && b.special_requests.toLowerCase().includes('anniversary'))
    ).length;
    
    const corporateEventsCount = bookings.filter(b => 
      b.special_occasion === 'corporate' || 
      (b.special_requests && b.special_requests.toLowerCase().includes('corporate'))
    ).length;
    
    // Booking lead time calculation
    const bookingLeadTimes = bookings
      .filter(b => b.created_at && b.booking_date)
      .map(b => {
        const createdAt = new Date(b.created_at);
        const bookingDate = new Date(b.booking_date);
        return (bookingDate.getTime() - createdAt.getTime()) / (1000 * 60 * 60); // Hours
      });
    
    const averageBookingLeadTimeHours = bookingLeadTimes.length 
      ? Math.round(bookingLeadTimes.reduce((sum, time) => sum + time, 0) / bookingLeadTimes.length)
      : undefined;

    return {
      totalBookings: bookings.length,
      confirmedBookings: confirmedBookings.length,
      cancelledBookings: cancelledBookings.length,
      totalGuests,
      grossRevenue,
      netRevenue,
      depositsCollected,
      refundsProcessed,
      tablesOccupied,
      averageOccupancyRate: Math.round(averageOccupancyRate * 100) / 100,
      newCustomers,
      returningCustomers,
      vipBookings: vipBookings.length,
      checkIns: checkedInBookings.length,
      noShows: noShowBookings.length,
      walkIns: walkInBookings.length,
      birthdaysCount,
      anniversariesCount,
      corporateEventsCount,
      averageBookingLeadTimeHours
    };
  }

  private async createEmptyDailyAggregation(dateStr: string): Promise<void> {
    const { error } = await this.supabase
      .from('daily_aggregations')
      .upsert({
        aggregation_date: dateStr,
        totalBookings: 0,
        confirmedBookings: 0,
        cancelledBookings: 0,
        totalGuests: 0,
        grossRevenue: 0,
        netRevenue: 0,
        depositsCollected: 0,
        refundsProcessed: 0,
        tablesOccupied: 0,
        averageOccupancyRate: 0,
        newCustomers: 0,
        returningCustomers: 0,
        vipBookings: 0,
        checkIns: 0,
        noShows: 0,
        walkIns: 0,
        birthdaysCount: 0,
        anniversariesCount: 0,
        corporateEventsCount: 0
      });

    if (error) {
      throw new Error(`Failed to create empty daily aggregation: ${error.message}`);
    }
  }

  private async processHourlyAggregation(targetDate: Date, forceRecalculation = false): Promise<number> {
    // Implement hourly aggregation logic
    // This would process real-time metrics for each hour of the target date
    console.log('Hourly aggregation processing not yet implemented');
    return 0;
  }

  private async processWeeklyAggregation(targetDate: Date, forceRecalculation = false): Promise<number> {
    // Refresh the weekly summary materialized view
    const { error } = await this.supabase.rpc('refresh_summary_views');
    
    if (error) {
      console.error('Failed to refresh weekly summary view:', error);
    }
    
    return 1;
  }

  private async processMonthlyAggregation(targetDate: Date, forceRecalculation = false): Promise<number> {
    // Refresh the monthly summary materialized view
    const { error } = await this.supabase.rpc('refresh_summary_views');
    
    if (error) {
      console.error('Failed to refresh monthly summary view:', error);
    }
    
    return 1;
  }

  // ============================================================================
  // KPI CALCULATIONS
  // ============================================================================

  async calculateKPI(
    kpiId: string,
    periodStart: Date,
    periodEnd: Date,
    aggregationPeriod: AggregationPeriod = AggregationPeriod.DAILY
  ): Promise<KPICalculation | null> {
    try {
      // Get KPI definition
      const { data: kpiDef, error } = await this.supabase
        .from('kpi_definitions')
        .select('*')
        .eq('id', kpiId)
        .eq('is_active', true)
        .single();

      if (error || !kpiDef) {
        console.error(`KPI definition not found: ${kpiId}`);
        return null;
      }

      const startTime = Date.now();
      
      // Calculate current value
      const calculatedValue = await this.executeKPIQuery(
        kpiDef.calculation_query,
        periodStart,
        periodEnd
      );

      // Calculate comparison values
      const previousValue = await this.calculatePreviousPeriodValue(
        kpiDef.calculation_query,
        periodStart,
        periodEnd,
        aggregationPeriod
      );

      const yearAgoValue = await this.calculateYearAgoValue(
        kpiDef.calculation_query,
        periodStart,
        periodEnd
      );

      // Calculate trend
      let changePercentage = 0;
      let trendDirection: 'up' | 'down' | 'stable' = 'stable';

      if (previousValue && previousValue > 0) {
        changePercentage = ((calculatedValue - previousValue) / previousValue) * 100;
        
        if (Math.abs(changePercentage) > 5) {
          trendDirection = changePercentage > 0 ? 'up' : 'down';
        }
      }

      const calculationTimeMs = Date.now() - startTime;

      // Create KPI calculation record
      const kpiCalculation: Omit<KPICalculation, 'id'> = {
        kpiId,
        periodStart,
        periodEnd,
        aggregationPeriod,
        calculatedValue,
        previousValue,
        changePercentage: Math.round(changePercentage * 100) / 100,
        trendDirection,
        yearAgoValue,
        calculationTimeMs,
        dataPointsCount: 1, // Would be calculated based on the query
        calculatedAt: new Date(),
        expiresAt: new Date(Date.now() + (kpiDef.cache_duration_minutes || 15) * 60000)
      };

      // Save to cache
      const { data: savedCalculation, error: saveError } = await this.supabase
        .from('kpi_calculations')
        .upsert(kpiCalculation)
        .select()
        .single();

      if (saveError) {
        console.error('Failed to save KPI calculation:', saveError);
        return { id: 'temp', ...kpiCalculation };
      }

      return savedCalculation;

    } catch (error) {
      console.error('Error calculating KPI:', error);
      return null;
    }
  }

  private async executeKPIQuery(
    query: string,
    periodStart: Date,
    periodEnd: Date
  ): Promise<number> {
    try {
      // Replace placeholders in the query
      const formattedQuery = query
        .replace('%s', periodStart.toISOString())
        .replace('%s', periodEnd.toISOString());

      // Execute the query - this is a simplified version
      // In production, you'd use a more sophisticated query executor
      const { data, error } = await this.supabase.rpc('execute_kpi_query', {
        query_text: formattedQuery
      });

      if (error) {
        throw new Error(`KPI query failed: ${error.message}`);
      }

      // Extract numeric result
      return parseFloat(data?.[0]?.result || '0') || 0;

    } catch (error) {
      console.error('Error executing KPI query:', error);
      return 0;
    }
  }

  private async calculatePreviousPeriodValue(
    query: string,
    periodStart: Date,
    periodEnd: Date,
    aggregationPeriod: AggregationPeriod
  ): Promise<number | undefined> {
    try {
      const periodLength = periodEnd.getTime() - periodStart.getTime();
      const previousStart = new Date(periodStart.getTime() - periodLength);
      const previousEnd = new Date(periodEnd.getTime() - periodLength);

      return await this.executeKPIQuery(query, previousStart, previousEnd);
    } catch (error) {
      console.error('Error calculating previous period value:', error);
      return undefined;
    }
  }

  private async calculateYearAgoValue(
    query: string,
    periodStart: Date,
    periodEnd: Date
  ): Promise<number | undefined> {
    try {
      const yearAgoStart = new Date(periodStart);
      const yearAgoEnd = new Date(periodEnd);
      yearAgoStart.setFullYear(yearAgoStart.getFullYear() - 1);
      yearAgoEnd.setFullYear(yearAgoEnd.getFullYear() - 1);

      return await this.executeKPIQuery(query, yearAgoStart, yearAgoEnd);
    } catch (error) {
      console.error('Error calculating year ago value:', error);
      return undefined;
    }
  }

  // ============================================================================
  // EVENT PERFORMANCE ANALYTICS
  // ============================================================================

  async calculateEventPerformance(
    eventId: string,
    eventDate: Date
  ): Promise<EventPerformanceAnalytics | null> {
    try {
      const eventDateStr = format(eventDate, 'yyyy-MM-dd');
      
      // Get event bookings
      const { data: bookings, error: bookingsError } = await this.supabase
        .from('bookings')
        .select(`
          *,
          tables (capacity)
        `)
        .eq('event_id', eventId)
        .eq('booking_date', eventDateStr);

      if (bookingsError) {
        throw new Error(`Failed to fetch event bookings: ${bookingsError.message}`);
      }

      if (!bookings?.length) {
        console.log(`No bookings found for event ${eventId} on ${eventDateStr}`);
        return null;
      }

      // Get event details
      const { data: event, error: eventError } = await this.supabase
        .from('events')
        .select('name')
        .eq('id', eventId)
        .single();

      if (eventError) {
        throw new Error(`Failed to fetch event details: ${eventError.message}`);
      }

      // Calculate metrics
      const confirmedBookings = bookings.filter(b => b.status === 'confirmed');
      const checkedInBookings = bookings.filter(b => b.checked_in_at !== null);
      const noShowBookings = bookings.filter(b => b.status === 'no_show');
      const cancelledBookings = bookings.filter(b => b.status === 'cancelled');
      const walkInsCount = bookings.filter(b => b.is_walk_in === true).length;

      const totalBookings = bookings.length;
      const totalGuests = confirmedBookings.reduce((sum, b) => sum + b.party_size, 0);
      const totalRevenue = confirmedBookings.reduce((sum, b) => sum + b.total_amount, 0);
      
      // Table occupancy
      const tablesOccupied = new Set(confirmedBookings.map(b => b.table_id)).size;
      const totalTables = 16; // From venue configuration
      const tableOccupancyRate = (tablesOccupied / totalTables) * 100;
      
      // Performance rates
      const checkInRate = totalBookings > 0 ? (checkedInBookings.length / totalBookings) * 100 : 0;
      const noShowRate = totalBookings > 0 ? (noShowBookings.length / totalBookings) * 100 : 0;
      const cancellationRate = totalBookings > 0 ? (cancelledBookings.length / totalBookings) * 100 : 0;
      const averagePartySize = confirmedBookings.length > 0 ? totalGuests / confirmedBookings.length : 0;
      const averageSpendPerGuest = totalGuests > 0 ? totalRevenue / totalGuests : 0;

      // Calculate comparisons
      const vsLastWeekRevenueChange = await this.calculateEventRevenueChange(
        event.name,
        eventDate,
        'week'
      );

      const vsLastMonthRevenueChange = await this.calculateEventRevenueChange(
        event.name,
        eventDate,
        'month'
      );

      const eventAnalytics: Omit<EventPerformanceAnalytics, 'id'> = {
        eventId,
        eventDate,
        eventName: event.name,
        totalBookings,
        totalGuests,
        tableOccupancyRate: Math.round(tableOccupancyRate * 100) / 100,
        walkInsCount,
        totalRevenue,
        barRevenue: 0, // Not tracked separately yet
        tableRevenue: totalRevenue,
        averageSpendPerGuest: Math.round(averageSpendPerGuest * 100) / 100,
        checkInRate: Math.round(checkInRate * 100) / 100,
        noShowRate: Math.round(noShowRate * 100) / 100,
        cancellationRate: Math.round(cancellationRate * 100) / 100,
        averagePartySize: Math.round(averagePartySize * 100) / 100,
        feedbackCount: 0, // Not implemented yet
        vsLastWeekRevenueChange,
        vsLastMonthRevenueChange,
        calculatedAt: new Date()
      };

      // Save analytics
      const { data: savedAnalytics, error: saveError } = await this.supabase
        .from('event_performance_analytics')
        .upsert(eventAnalytics)
        .select()
        .single();

      if (saveError) {
        console.error('Failed to save event analytics:', saveError);
        return { id: 'temp', ...eventAnalytics };
      }

      return savedAnalytics;

    } catch (error) {
      console.error('Error calculating event performance:', error);
      return null;
    }
  }

  private async calculateEventRevenueChange(
    eventName: string,
    currentDate: Date,
    period: 'week' | 'month'
  ): Promise<number | undefined> {
    try {
      const previousDate = new Date(currentDate);
      if (period === 'week') {
        previousDate.setDate(previousDate.getDate() - 7);
      } else {
        previousDate.setMonth(previousDate.getMonth() - 1);
      }

      const { data: previousEvent } = await this.supabase
        .from('event_performance_analytics')
        .select('total_revenue')
        .eq('event_name', eventName)
        .eq('event_date', format(previousDate, 'yyyy-MM-dd'))
        .single();

      if (!previousEvent) return undefined;

      const { data: currentEvent } = await this.supabase
        .from('event_performance_analytics')
        .select('total_revenue')
        .eq('event_name', eventName)
        .eq('event_date', format(currentDate, 'yyyy-MM-dd'))
        .single();

      if (!currentEvent) return undefined;

      const changeAmount = currentEvent.total_revenue - previousEvent.total_revenue;
      return Math.round(changeAmount * 100) / 100;

    } catch (error) {
      console.error('Error calculating event revenue change:', error);
      return undefined;
    }
  }

  // ============================================================================
  // TREND ANALYSIS
  // ============================================================================

  async calculateTrends(
    metricName: string,
    periodStart: Date,
    periodEnd: Date,
    aggregationPeriod: AggregationPeriod = AggregationPeriod.DAILY
  ): Promise<{
    trend: 'up' | 'down' | 'stable';
    slope: number;
    confidence: number;
    dataPoints: { date: string; value: number }[];
  }> {
    try {
      // Get historical data points
      const dataPoints = await this.getHistoricalDataPoints(
        metricName,
        periodStart,
        periodEnd,
        aggregationPeriod
      );

      if (dataPoints.length < 3) {
        return {
          trend: 'stable',
          slope: 0,
          confidence: 0,
          dataPoints
        };
      }

      // Calculate linear regression
      const { slope, confidence } = this.calculateLinearRegression(dataPoints);

      // Determine trend direction
      let trend: 'up' | 'down' | 'stable' = 'stable';
      if (Math.abs(slope) > 0.1 && confidence > 0.7) {
        trend = slope > 0 ? 'up' : 'down';
      }

      return {
        trend,
        slope: Math.round(slope * 1000) / 1000,
        confidence: Math.round(confidence * 100) / 100,
        dataPoints
      };

    } catch (error) {
      console.error('Error calculating trends:', error);
      return {
        trend: 'stable',
        slope: 0,
        confidence: 0,
        dataPoints: []
      };
    }
  }

  private async getHistoricalDataPoints(
    metricName: string,
    periodStart: Date,
    periodEnd: Date,
    aggregationPeriod: AggregationPeriod
  ): Promise<{ date: string; value: number }[]> {
    const days = eachDayOfInterval({ start: periodStart, end: periodEnd });
    const dataPoints: { date: string; value: number }[] = [];

    for (const day of days) {
      try {
        const value = await this.getMetricValueForDate(metricName, day);
        dataPoints.push({
          date: format(day, 'yyyy-MM-dd'),
          value
        });
      } catch (error) {
        console.error(`Error getting metric value for ${format(day, 'yyyy-MM-dd')}:`, error);
      }
    }

    return dataPoints;
  }

  private async getMetricValueForDate(metricName: string, date: Date): Promise<number> {
    const dateStr = format(date, 'yyyy-MM-dd');

    // Map metric names to aggregation table columns
    const metricMapping: Record<string, string> = {
      'daily_revenue': 'gross_revenue',
      'total_bookings': 'total_bookings',
      'table_occupancy_rate': 'average_occupancy_rate',
      'total_guests': 'total_guests',
      'new_customers': 'new_customers'
    };

    const column = metricMapping[metricName];
    if (!column) {
      throw new Error(`Unknown metric: ${metricName}`);
    }

    const { data, error } = await this.supabase
      .from('daily_aggregations')
      .select(column)
      .eq('aggregation_date', dateStr)
      .single();

    if (error) {
      return 0; // Return 0 for missing data
    }

    return data?.[column] || 0;
  }

  private calculateLinearRegression(dataPoints: { date: string; value: number }[]): {
    slope: number;
    confidence: number;
  } {
    const n = dataPoints.length;
    const x = dataPoints.map((_, i) => i);
    const y = dataPoints.map(p => p.value);

    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = y.reduce((a, b) => a + b, 0);
    const sumXY = x.reduce((acc, xi, i) => acc + xi * y[i], 0);
    const sumXX = x.reduce((acc, xi) => acc + xi * xi, 0);
    const sumYY = y.reduce((acc, yi) => acc + yi * yi, 0);

    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    
    // Calculate correlation coefficient as confidence measure
    const numerator = n * sumXY - sumX * sumY;
    const denominator = Math.sqrt((n * sumXX - sumX * sumX) * (n * sumYY - sumY * sumY));
    const correlation = denominator !== 0 ? Math.abs(numerator / denominator) : 0;

    return {
      slope,
      confidence: correlation
    };
  }
}

// ============================================================================
// AGGREGATION PROCESSING FUNCTION (for job system)
// ============================================================================

export async function processAggregation(payload: {
  aggregationDate?: Date;
  type?: 'daily' | 'hourly' | 'weekly' | 'monthly';
  forceRecalculation?: boolean;
}): Promise<any> {
  const calculator = new MetricsCalculator();
  return await calculator.processAggregation(payload);
}

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

let calculatorInstance: MetricsCalculator | null = null;

export const getMetricsCalculator = (): MetricsCalculator => {
  if (!calculatorInstance) {
    calculatorInstance = new MetricsCalculator();
  }
  return calculatorInstance;
};