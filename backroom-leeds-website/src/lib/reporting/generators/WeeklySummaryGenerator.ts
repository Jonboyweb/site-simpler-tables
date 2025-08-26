/**
 * The Backroom Leeds - Weekly Summary Report Generator
 * Version: 1.0.0
 * Phase: 3, Step 3.5
 * 
 * Weekly performance analysis with trends and business intelligence
 */

import { createClient } from '@/lib/supabase/server';
import { format, startOfWeek, endOfWeek, subWeeks, eachDayOfInterval } from 'date-fns';
import { 
  WeeklySummaryReportData, 
  EventPerformanceAnalytics,
  ReportGenerationHistory,
  ReportFormat,
  ReportType 
} from '@/types/reporting';

// ============================================================================
// WEEKLY SUMMARY GENERATOR CLASS
// ============================================================================

export class WeeklySummaryGenerator {
  private supabase = createClient();

  // ============================================================================
  // MAIN GENERATION METHOD
  // ============================================================================

  async generate(payload: {
    weekStart?: Date;
    recipientIds?: string[];
    format?: ReportFormat;
    templateId?: string;
  }): Promise<{
    reportId: string;
    reportData: WeeklySummaryReportData;
    filePath?: string;
    fileUrl?: string;
  }> {
    const weekStart = payload.weekStart ? startOfWeek(payload.weekStart, { weekStartsOn: 1 }) : startOfWeek(new Date(), { weekStartsOn: 1 });
    const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 });
    
    console.log(`📊 Generating weekly summary report for ${format(weekStart, 'yyyy-MM-dd')} to ${format(weekEnd, 'yyyy-MM-dd')}`);

    try {
      // Collect all report data
      const reportData = await this.collectWeeklyData(weekStart, weekEnd);
      
      // Generate the report record
      const reportId = await this.saveReportGeneration(
        reportData,
        payload.templateId,
        payload.format || ReportFormat.PDF
      );

      // Generate file if needed
      let filePath: string | undefined;
      let fileUrl: string | undefined;

      if (payload.format !== ReportFormat.JSON) {
        const fileResult = await this.generateReportFile(reportData, payload.format || ReportFormat.PDF);
        filePath = fileResult.filePath;
        fileUrl = fileResult.fileUrl;
      }

      // Distribute to recipients if specified
      if (payload.recipientIds?.length) {
        await this.scheduleDistribution(reportId, payload.recipientIds, reportData);
      }

      return {
        reportId,
        reportData,
        filePath,
        fileUrl
      };

    } catch (error) {
      console.error('❌ Error generating weekly summary report:', error);
      throw error;
    }
  }

  // ============================================================================
  // DATA COLLECTION METHODS
  // ============================================================================

  private async collectWeeklyData(weekStart: Date, weekEnd: Date): Promise<WeeklySummaryReportData> {
    const startTime = Date.now();
    console.log(`🔍 Collecting weekly data from ${format(weekStart, 'yyyy-MM-dd')} to ${format(weekEnd, 'yyyy-MM-dd')}`);

    // Get previous week for comparison
    const prevWeekStart = startOfWeek(subWeeks(weekStart, 1), { weekStartsOn: 1 });
    const prevWeekEnd = endOfWeek(prevWeekStart, { weekStartsOn: 1 });

    const [
      currentWeekData,
      previousWeekData,
      dailyBreakdown,
      topEvents,
      customerMetrics,
      trends
    ] = await Promise.all([
      this.getWeeklyMetrics(weekStart, weekEnd),
      this.getWeeklyMetrics(prevWeekStart, prevWeekEnd),
      this.getDailyBreakdown(weekStart, weekEnd),
      this.getTopEvents(weekStart, weekEnd),
      this.getCustomerMetrics(weekStart, weekEnd),
      this.calculateTrends(weekStart, weekEnd)
    ]);

    // Calculate comparisons
    const vsLastWeek = {
      bookingsChange: this.calculatePercentageChange(
        previousWeekData.totalBookings, 
        currentWeekData.totalBookings
      ),
      revenueChange: this.calculatePercentageChange(
        previousWeekData.totalRevenue, 
        currentWeekData.totalRevenue
      ),
      guestsChange: this.calculatePercentageChange(
        previousWeekData.totalGuests, 
        currentWeekData.totalGuests
      )
    };

    const overview = {
      ...currentWeekData,
      vsLastWeek
    };

    // Generate insights
    const recommendations = this.generateRecommendations(currentWeekData, previousWeekData, trends);
    const alerts = this.generateAlerts(currentWeekData, trends);

    console.log(`✅ Weekly data collection completed in ${Date.now() - startTime}ms`);

    return {
      weekStart,
      weekEnd,
      overview,
      dailyBreakdown,
      topEvents,
      customerMetrics,
      trends,
      recommendations,
      alerts
    };
  }

  private async getWeeklyMetrics(weekStart: Date, weekEnd: Date) {
    try {
      // Try to get from materialized view first
      const { data: weeklyView } = await this.supabase
        .from('weekly_summary_view')
        .select('*')
        .eq('week_start', format(weekStart, 'yyyy-MM-dd'))
        .single();

      if (weeklyView) {
        return {
          totalBookings: weeklyView.total_bookings,
          totalRevenue: weeklyView.gross_revenue,
          totalGuests: weeklyView.total_guests,
          averageOccupancyRate: weeklyView.avg_occupancy_rate
        };
      }

      // Fallback to daily aggregations
      const { data: dailyAggregations } = await this.supabase
        .from('daily_aggregations')
        .select('*')
        .gte('aggregation_date', format(weekStart, 'yyyy-MM-dd'))
        .lte('aggregation_date', format(weekEnd, 'yyyy-MM-dd'));

      if (dailyAggregations?.length) {
        const totalBookings = dailyAggregations.reduce((sum, d) => sum + d.total_bookings, 0);
        const totalRevenue = dailyAggregations.reduce((sum, d) => sum + d.gross_revenue, 0);
        const totalGuests = dailyAggregations.reduce((sum, d) => sum + d.total_guests, 0);
        const avgOccupancy = dailyAggregations.reduce((sum, d) => sum + (d.average_occupancy_rate || 0), 0) / dailyAggregations.length;

        return {
          totalBookings,
          totalRevenue,
          totalGuests,
          averageOccupancyRate: avgOccupancy
        };
      }

      // Final fallback to live calculation
      const { data: bookings } = await this.supabase
        .from('bookings')
        .select('*')
        .gte('booking_date', format(weekStart, 'yyyy-MM-dd'))
        .lte('booking_date', format(weekEnd, 'yyyy-MM-dd'))
        .eq('status', 'confirmed');

      const totalBookings = bookings?.length || 0;
      const totalRevenue = bookings?.reduce((sum, b) => sum + b.total_amount, 0) || 0;
      const totalGuests = bookings?.reduce((sum, b) => sum + b.party_size, 0) || 0;
      
      // Calculate average occupancy
      const dailyOccupancies = await this.calculateDailyOccupancies(weekStart, weekEnd);
      const averageOccupancyRate = dailyOccupancies.reduce((sum, o) => sum + o, 0) / dailyOccupancies.length;

      return {
        totalBookings,
        totalRevenue,
        totalGuests,
        averageOccupancyRate: averageOccupancyRate || 0
      };

    } catch (error) {
      console.error('Error getting weekly metrics:', error);
      return {
        totalBookings: 0,
        totalRevenue: 0,
        totalGuests: 0,
        averageOccupancyRate: 0
      };
    }
  }

  private async getDailyBreakdown(weekStart: Date, weekEnd: Date) {
    try {
      const days = eachDayOfInterval({ start: weekStart, end: weekEnd });
      
      const dailyData = await Promise.all(
        days.map(async (day) => {
          const { data: aggregation } = await this.supabase
            .from('daily_aggregations')
            .select('*')
            .eq('aggregation_date', format(day, 'yyyy-MM-dd'))
            .single();

          if (aggregation) {
            return {
              date: day,
              bookings: aggregation.total_bookings,
              revenue: aggregation.gross_revenue,
              guests: aggregation.total_guests,
              occupancyRate: aggregation.average_occupancy_rate || 0
            };
          }

          // Fallback to live calculation
          const { data: bookings } = await this.supabase
            .from('bookings')
            .select('*')
            .eq('booking_date', format(day, 'yyyy-MM-dd'))
            .eq('status', 'confirmed');

          const dailyBookings = bookings?.length || 0;
          const dailyRevenue = bookings?.reduce((sum, b) => sum + b.total_amount, 0) || 0;
          const dailyGuests = bookings?.reduce((sum, b) => sum + b.party_size, 0) || 0;
          
          const tablesUsed = new Set(bookings?.map(b => b.table_id)).size;
          const occupancyRate = (tablesUsed / 16) * 100; // 16 total tables

          return {
            date: day,
            bookings: dailyBookings,
            revenue: dailyRevenue,
            guests: dailyGuests,
            occupancyRate
          };
        })
      );

      return dailyData;

    } catch (error) {
      console.error('Error getting daily breakdown:', error);
      return [];
    }
  }

  private async getTopEvents(weekStart: Date, weekEnd: Date): Promise<EventPerformanceAnalytics[]> {
    try {
      const { data: eventAnalytics } = await this.supabase
        .from('event_performance_analytics')
        .select('*')
        .gte('event_date', format(weekStart, 'yyyy-MM-dd'))
        .lte('event_date', format(weekEnd, 'yyyy-MM-dd'))
        .order('total_revenue', { ascending: false });

      if (eventAnalytics?.length) {
        return eventAnalytics.map(event => ({
          ...event,
          eventDate: new Date(event.event_date),
          calculatedAt: new Date(event.calculated_at)
        }));
      }

      // Fallback to manual calculation
      const { data: bookings } = await this.supabase
        .from('bookings')
        .select(`
          *,
          events (name, id)
        `)
        .gte('booking_date', format(weekStart, 'yyyy-MM-dd'))
        .lte('booking_date', format(weekEnd, 'yyyy-MM-dd'))
        .eq('status', 'confirmed');

      if (!bookings?.length) return [];

      // Group by event and date
      const eventGroups = bookings.reduce((acc, booking) => {
        const eventName = booking.events?.name || this.getEventNameByDate(new Date(booking.booking_date));
        const eventDate = booking.booking_date;
        const key = `${eventName}-${eventDate}`;
        
        if (!acc[key]) {
          acc[key] = {
            eventId: booking.events?.id || 'unknown',
            eventDate: new Date(eventDate),
            eventName,
            bookings: [],
            totalRevenue: 0,
            totalGuests: 0
          };
        }
        
        acc[key].bookings.push(booking);
        acc[key].totalRevenue += booking.total_amount;
        acc[key].totalGuests += booking.party_size;
        return acc;
      }, {} as Record<string, any>);

      // Convert to EventPerformanceAnalytics format
      const topEvents = Object.values(eventGroups).map((event: any) => {
        const tablesOccupied = new Set(event.bookings.map((b: any) => b.table_id)).size;
        const tableOccupancyRate = (tablesOccupied / 16) * 100;
        
        return {
          id: `${event.eventName}-${format(event.eventDate, 'yyyy-MM-dd')}`,
          eventId: event.eventId,
          eventDate: event.eventDate,
          eventName: event.eventName,
          totalBookings: event.bookings.length,
          totalGuests: event.totalGuests,
          tableOccupancyRate,
          walkInsCount: event.bookings.filter((b: any) => b.is_walk_in).length,
          totalRevenue: event.totalRevenue,
          barRevenue: 0, // Not tracked yet
          tableRevenue: event.totalRevenue,
          averageSpendPerGuest: event.totalGuests > 0 ? event.totalRevenue / event.totalGuests : 0,
          checkInRate: event.bookings.filter((b: any) => b.checked_in_at).length / event.bookings.length * 100,
          noShowRate: event.bookings.filter((b: any) => b.status === 'no_show').length / event.bookings.length * 100,
          cancellationRate: 0, // Calculate from historical data
          averagePartySize: event.totalGuests / event.bookings.length,
          peakHour: undefined,
          peakHourGuests: undefined,
          averageStayDurationMinutes: undefined,
          feedbackScore: undefined,
          feedbackCount: 0,
          vsLastWeekRevenueChange: undefined,
          vsLastMonthRevenueChange: undefined,
          vsLastYearRevenueChange: undefined,
          calculatedAt: new Date()
        };
      });

      return topEvents.sort((a, b) => b.totalRevenue - a.totalRevenue);

    } catch (error) {
      console.error('Error getting top events:', error);
      return [];
    }
  }

  private async getCustomerMetrics(weekStart: Date, weekEnd: Date) {
    try {
      const { data: bookings } = await this.supabase
        .from('bookings')
        .select(`
          *,
          customers (id, created_at)
        `)
        .gte('booking_date', format(weekStart, 'yyyy-MM-dd'))
        .lte('booking_date', format(weekEnd, 'yyyy-MM-dd'))
        .eq('status', 'confirmed');

      if (!bookings?.length) {
        return {
          newCustomers: 0,
          returningRate: 0,
          averageLTV: 0,
          topCustomers: []
        };
      }

      // Count new customers (created this week)
      const newCustomers = bookings.filter(b => {
        if (!b.customers) return false;
        const customerCreated = new Date(b.customers.created_at);
        return customerCreated >= weekStart && customerCreated <= weekEnd;
      }).length;

      // Calculate returning rate
      const returningCustomers = bookings.filter(b => {
        if (!b.customers) return false;
        const customerCreated = new Date(b.customers.created_at);
        return customerCreated < weekStart;
      }).length;

      const returningRate = bookings.length > 0 ? (returningCustomers / bookings.length) * 100 : 0;

      // Get top customers by spend
      const customerSpends = bookings.reduce((acc, booking) => {
        if (!booking.customers) return acc;
        
        const customerId = booking.customers.id;
        if (!acc[customerId]) {
          acc[customerId] = {
            customerId,
            name: `Customer ${customerId.slice(-6)}`, // Placeholder name
            bookings: 0,
            spend: 0
          };
        }
        
        acc[customerId].bookings++;
        acc[customerId].spend += booking.total_amount;
        return acc;
      }, {} as Record<string, any>);

      const topCustomers = Object.values(customerSpends)
        .sort((a: any, b: any) => b.spend - a.spend)
        .slice(0, 10);

      // Calculate average LTV (simplified)
      const averageLTV = topCustomers.length > 0 
        ? topCustomers.reduce((sum: number, customer: any) => sum + customer.spend, 0) / topCustomers.length
        : 0;

      return {
        newCustomers,
        returningRate: Math.round(returningRate * 100) / 100,
        averageLTV: Math.round(averageLTV * 100) / 100,
        topCustomers
      };

    } catch (error) {
      console.error('Error getting customer metrics:', error);
      return {
        newCustomers: 0,
        returningRate: 0,
        averageLTV: 0,
        topCustomers: []
      };
    }
  }

  private async calculateTrends(weekStart: Date, weekEnd: Date) {
    try {
      const currentWeek = await this.getWeeklyMetrics(weekStart, weekEnd);
      const previousWeek = await this.getWeeklyMetrics(
        startOfWeek(subWeeks(weekStart, 1), { weekStartsOn: 1 }),
        endOfWeek(subWeeks(weekStart, 1), { weekStartsOn: 1 })
      );

      const bookingTrend = this.getTrendDirection(previousWeek.totalBookings, currentWeek.totalBookings);
      const revenueTrend = this.getTrendDirection(previousWeek.totalRevenue, currentWeek.totalRevenue);
      const occupancyTrend = this.getTrendDirection(previousWeek.averageOccupancyRate, currentWeek.averageOccupancyRate);

      return {
        bookingTrend,
        revenueTrend,
        occupancyTrend
      };

    } catch (error) {
      console.error('Error calculating trends:', error);
      return {
        bookingTrend: 'stable' as const,
        revenueTrend: 'stable' as const,
        occupancyTrend: 'stable' as const
      };
    }
  }

  // ============================================================================
  // UTILITY METHODS
  // ============================================================================

  private calculatePercentageChange(oldValue: number, newValue: number): number {
    if (oldValue === 0) return newValue > 0 ? 100 : 0;
    return Math.round(((newValue - oldValue) / oldValue) * 100 * 100) / 100;
  }

  private getTrendDirection(oldValue: number, newValue: number): 'up' | 'down' | 'stable' {
    const change = this.calculatePercentageChange(oldValue, newValue);
    if (Math.abs(change) < 5) return 'stable';
    return change > 0 ? 'up' : 'down';
  }

  private getEventNameByDate(date: Date): string {
    const dayOfWeek = date.getDay();
    switch (dayOfWeek) {
      case 5: return 'BELLA GENTE';
      case 6: return 'SHHH!';
      case 0: return 'NOSTALGIA';
      default: return 'Regular Night';
    }
  }

  private async calculateDailyOccupancies(weekStart: Date, weekEnd: Date): Promise<number[]> {
    const days = eachDayOfInterval({ start: weekStart, end: weekEnd });
    
    const occupancies = await Promise.all(
      days.map(async (day) => {
        const { data: bookings } = await this.supabase
          .from('bookings')
          .select('table_id')
          .eq('booking_date', format(day, 'yyyy-MM-dd'))
          .eq('status', 'confirmed');

        const tablesUsed = new Set(bookings?.map(b => b.table_id)).size;
        return (tablesUsed / 16) * 100; // 16 total tables
      })
    );

    return occupancies;
  }

  private generateRecommendations(
    currentWeek: any, 
    previousWeek: any, 
    trends: any
  ): string[] {
    const recommendations: string[] = [];

    // Revenue trend recommendations
    if (trends.revenueTrend === 'down') {
      recommendations.push('Revenue declining - implement targeted promotional campaigns');
      recommendations.push('Review pricing strategy and packages to optimize revenue');
    } else if (trends.revenueTrend === 'up') {
      recommendations.push('Strong revenue growth - maintain current strategies');
    }

    // Booking trend recommendations
    if (trends.bookingTrend === 'down') {
      recommendations.push('Booking volume decreasing - enhance marketing efforts');
      recommendations.push('Consider loyalty programs to retain existing customers');
    }

    // Occupancy recommendations
    if (currentWeek.averageOccupancyRate < 60) {
      recommendations.push('Low occupancy rate - focus on capacity optimization');
    } else if (currentWeek.averageOccupancyRate > 85) {
      recommendations.push('High occupancy - consider expanding capacity or premium pricing');
    }

    // Weekly performance recommendations
    if (currentWeek.totalRevenue < previousWeek.totalRevenue * 0.8) {
      recommendations.push('Significant revenue drop - urgent review of operations required');
    }

    return recommendations;
  }

  private generateAlerts(currentWeek: any, trends: any): string[] {
    const alerts: string[] = [];

    // Revenue alerts
    if (currentWeek.totalRevenue < 10000) {
      alerts.push('Weekly revenue below minimum threshold');
    }

    // Trend alerts
    if (trends.revenueTrend === 'down' && trends.bookingTrend === 'down') {
      alerts.push('Both revenue and bookings declining - immediate action required');
    }

    // Occupancy alerts
    if (currentWeek.averageOccupancyRate < 30) {
      alerts.push('Critical: Average occupancy below 30%');
    }

    return alerts;
  }

  // ============================================================================
  // REPORT GENERATION AND STORAGE
  // ============================================================================

  private async saveReportGeneration(
    reportData: WeeklySummaryReportData,
    templateId?: string,
    format: ReportFormat = ReportFormat.PDF
  ): Promise<string> {
    try {
      // Get or create template
      let actualTemplateId = templateId;
      if (!actualTemplateId) {
        const { data: template } = await this.supabase
          .from('report_templates')
          .select('id')
          .eq('name', 'Weekly Summary Report')
          .eq('is_system_template', true)
          .single();
        
        actualTemplateId = template?.id;
      }

      const reportSummary = {
        title: `Weekly Summary - ${format(reportData.weekStart, 'MMM dd')} to ${format(reportData.weekEnd, 'MMM dd, yyyy')}`,
        description: 'Weekly performance analysis with trends and business intelligence',
        highlights: [
          `${reportData.overview.totalBookings} total bookings`,
          `£${reportData.overview.totalRevenue.toFixed(2)} total revenue`,
          `${reportData.overview.totalGuests} guests served`,
          `${reportData.overview.averageOccupancyRate.toFixed(1)}% average occupancy`
        ],
        recommendations: reportData.recommendations,
        alerts: reportData.alerts
      };

      const keyMetrics = {
        totalBookings: reportData.overview.totalBookings,
        totalRevenue: reportData.overview.totalRevenue,
        totalGuests: reportData.overview.totalGuests,
        averageOccupancyRate: reportData.overview.averageOccupancyRate,
        bookingTrend: reportData.trends.bookingTrend,
        revenueTrend: reportData.trends.revenueTrend,
        weekOverWeekBookingChange: reportData.overview.vsLastWeek.bookingsChange,
        weekOverWeekRevenueChange: reportData.overview.vsLastWeek.revenueChange
      };

      const { data: generation, error } = await this.supabase
        .from('report_generation_history')
        .insert({
          template_id: actualTemplateId,
          report_type: ReportType.WEEKLY_SUMMARY,
          generated_at: new Date().toISOString(),
          data_period_start: reportData.weekStart.toISOString(),
          data_period_end: reportData.weekEnd.toISOString(),
          output_format: format,
          records_processed: reportData.overview.totalBookings,
          sections_generated: 7, // overview, daily, events, customers, trends, recommendations, alerts
          report_summary: reportSummary,
          key_metrics: keyMetrics,
          is_successful: true
        })
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to save report generation: ${error.message}`);
      }

      return generation.id;

    } catch (error) {
      console.error('Error saving report generation:', error);
      throw error;
    }
  }

  private async generateReportFile(
    reportData: WeeklySummaryReportData,
    format: ReportFormat
  ): Promise<{ filePath: string; fileUrl: string }> {
    try {
      const weekIdentifier = format(reportData.weekStart, 'yyyy-MM-dd');
      
      switch (format) {
        case ReportFormat.PDF:
          return await this.generatePDFReport(reportData, weekIdentifier);
        case ReportFormat.EXCEL:
          return await this.generateExcelReport(reportData, weekIdentifier);
        case ReportFormat.CSV:
          return await this.generateCSVReport(reportData, weekIdentifier);
        case ReportFormat.HTML:
          return await this.generateHTMLReport(reportData, weekIdentifier);
        default:
          throw new Error(`Unsupported report format: ${format}`);
      }
    } catch (error) {
      console.error('Error generating report file:', error);
      throw error;
    }
  }

  private async generatePDFReport(reportData: WeeklySummaryReportData, weekIdentifier: string): Promise<{ filePath: string; fileUrl: string }> {
    const fileName = `weekly-summary-${weekIdentifier}.pdf`;
    const filePath = `/reports/weekly/${fileName}`;
    const fileUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/reports/download/${fileName}`;
    
    return { filePath, fileUrl };
  }

  private async generateExcelReport(reportData: WeeklySummaryReportData, weekIdentifier: string): Promise<{ filePath: string; fileUrl: string }> {
    const fileName = `weekly-summary-${weekIdentifier}.xlsx`;
    const filePath = `/reports/weekly/${fileName}`;
    const fileUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/reports/download/${fileName}`;
    
    return { filePath, fileUrl };
  }

  private async generateCSVReport(reportData: WeeklySummaryReportData, weekIdentifier: string): Promise<{ filePath: string; fileUrl: string }> {
    const fileName = `weekly-summary-${weekIdentifier}.csv`;
    const filePath = `/reports/weekly/${fileName}`;
    const fileUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/reports/download/${fileName}`;
    
    return { filePath, fileUrl };
  }

  private async generateHTMLReport(reportData: WeeklySummaryReportData, weekIdentifier: string): Promise<{ filePath: string; fileUrl: string }> {
    const fileName = `weekly-summary-${weekIdentifier}.html`;
    const filePath = `/reports/weekly/${fileName}`;
    const fileUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/reports/download/${fileName}`;
    
    return { filePath, fileUrl };
  }

  private async scheduleDistribution(
    reportId: string,
    recipientIds: string[],
    reportData: WeeklySummaryReportData
  ): Promise<void> {
    try {
      const { EmailDistributor } = await import('../distribution/EmailDistributor');
      const emailDistributor = new EmailDistributor();
      
      await emailDistributor.scheduleWeeklyReportDistribution(reportId, recipientIds, reportData);
    } catch (error) {
      console.error('Error scheduling distribution:', error);
    }
  }
}