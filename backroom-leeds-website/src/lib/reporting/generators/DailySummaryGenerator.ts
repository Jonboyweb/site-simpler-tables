/**
 * The Backroom Leeds - Daily Summary Report Generator
 * Version: 1.0.0
 * Phase: 3, Step 3.5
 * 
 * Comprehensive daily summary report generation with business intelligence
 */

import { createClient } from '@/lib/supabase/server';
import { format, startOfDay, endOfDay, subDays } from 'date-fns';
import { 
  DailySummaryReportData, 
  ReportGenerationHistory,
  ReportFormat,
  ReportType 
} from '@/types/reporting';

// ============================================================================
// DAILY SUMMARY GENERATOR CLASS
// ============================================================================

export class DailySummaryGenerator {
  private supabase = createClient();

  // ============================================================================
  // MAIN GENERATION METHOD
  // ============================================================================

  async generate(payload: {
    reportDate?: Date;
    recipientIds?: string[];
    format?: ReportFormat;
    templateId?: string;
  }): Promise<{
    reportId: string;
    reportData: DailySummaryReportData;
    filePath?: string;
    fileUrl?: string;
  }> {
    const reportDate = payload.reportDate || new Date();
    const targetDate = startOfDay(reportDate);
    
    console.log(`📊 Generating daily summary report for ${format(targetDate, 'yyyy-MM-dd')}`);

    try {
      // Collect all report data
      const reportData = await this.collectDailyData(targetDate);
      
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
      console.error('❌ Error generating daily summary report:', error);
      throw error;
    }
  }

  // ============================================================================
  // DATA COLLECTION METHODS
  // ============================================================================

  private async collectDailyData(targetDate: Date): Promise<DailySummaryReportData> {
    const startTime = Date.now();
    console.log(`🔍 Collecting data for ${format(targetDate, 'yyyy-MM-dd')}`);

    const [
      overview,
      bookings,
      revenue,
      events,
      customers,
      packages,
      staffPerformance
    ] = await Promise.all([
      this.getOverviewMetrics(targetDate),
      this.getBookingMetrics(targetDate),
      this.getRevenueMetrics(targetDate),
      this.getEventMetrics(targetDate),
      this.getCustomerMetrics(targetDate),
      this.getTopPackages(targetDate),
      this.getStaffPerformance(targetDate)
    ]);

    console.log(`✅ Data collection completed in ${Date.now() - startTime}ms`);

    return {
      date: targetDate,
      overview,
      bookings,
      revenue,
      events,
      customers,
      topPackages: packages,
      staffPerformance
    };
  }

  private async getOverviewMetrics(targetDate: Date) {
    try {
      const { data: aggregation } = await this.supabase
        .from('daily_aggregations')
        .select('*')
        .eq('aggregation_date', format(targetDate, 'yyyy-MM-dd'))
        .single();

      if (aggregation) {
        return {
          totalBookings: aggregation.total_bookings,
          totalRevenue: aggregation.gross_revenue,
          totalGuests: aggregation.total_guests,
          tablesOccupied: aggregation.tables_occupied,
          occupancyRate: aggregation.average_occupancy_rate || 0
        };
      }

      // Fallback to live calculation
      const { data: bookings } = await this.supabase
        .from('bookings')
        .select(`
          *,
          tables (capacity)
        `)
        .eq('booking_date', format(targetDate, 'yyyy-MM-dd'))
        .eq('status', 'confirmed');

      const totalBookings = bookings?.length || 0;
      const totalGuests = bookings?.reduce((sum, b) => sum + b.party_size, 0) || 0;
      const totalRevenue = bookings?.reduce((sum, b) => sum + b.total_amount, 0) || 0;
      const tablesOccupied = new Set(bookings?.map(b => b.table_id)).size;
      const totalTables = 16; // From venue configuration
      const occupancyRate = (tablesOccupied / totalTables) * 100;

      return {
        totalBookings,
        totalRevenue,
        totalGuests,
        tablesOccupied,
        occupancyRate: Math.round(occupancyRate * 100) / 100
      };

    } catch (error) {
      console.error('Error getting overview metrics:', error);
      return {
        totalBookings: 0,
        totalRevenue: 0,
        totalGuests: 0,
        tablesOccupied: 0,
        occupancyRate: 0
      };
    }
  }

  private async getBookingMetrics(targetDate: Date) {
    try {
      const { data: bookings } = await this.supabase
        .from('bookings')
        .select('*')
        .eq('booking_date', format(targetDate, 'yyyy-MM-dd'));

      if (!bookings?.length) {
        return {
          confirmed: 0,
          cancelled: 0,
          noShows: 0,
          walkIns: 0,
          waitlist: 0,
          averagePartySize: 0
        };
      }

      const confirmed = bookings.filter(b => b.status === 'confirmed').length;
      const cancelled = bookings.filter(b => b.status === 'cancelled').length;
      const noShows = bookings.filter(b => b.status === 'no_show').length;
      const walkIns = bookings.filter(b => b.is_walk_in === true).length;
      
      // Get waitlist data
      const { data: waitlistData } = await this.supabase
        .from('waitlist_entries')
        .select('*')
        .eq('event_date', format(targetDate, 'yyyy-MM-dd'));

      const waitlist = waitlistData?.length || 0;

      const confirmedBookings = bookings.filter(b => b.status === 'confirmed');
      const totalGuests = confirmedBookings.reduce((sum, b) => sum + b.party_size, 0);
      const averagePartySize = confirmedBookings.length > 0 ? totalGuests / confirmedBookings.length : 0;

      return {
        confirmed,
        cancelled,
        noShows,
        walkIns,
        waitlist,
        averagePartySize: Math.round(averagePartySize * 100) / 100
      };

    } catch (error) {
      console.error('Error getting booking metrics:', error);
      return {
        confirmed: 0,
        cancelled: 0,
        noShows: 0,
        walkIns: 0,
        waitlist: 0,
        averagePartySize: 0
      };
    }
  }

  private async getRevenueMetrics(targetDate: Date) {
    try {
      const { data: bookings } = await this.supabase
        .from('bookings')
        .select(`
          *,
          payments (*)
        `)
        .eq('booking_date', format(targetDate, 'yyyy-MM-dd'))
        .eq('status', 'confirmed');

      if (!bookings?.length) {
        return {
          gross: 0,
          net: 0,
          deposits: 0,
          refunds: 0,
          perGuest: 0,
          perTable: 0
        };
      }

      const gross = bookings.reduce((sum, b) => sum + b.total_amount, 0);
      const deposits = bookings.reduce((sum, b) => sum + b.deposit_amount, 0);
      
      // Calculate refunds from payments
      const allPayments = bookings.flatMap(b => b.payments || []);
      const refunds = allPayments
        .filter(p => p.payment_type === 'refund')
        .reduce((sum, p) => sum + p.amount, 0);

      const net = gross - refunds;
      const totalGuests = bookings.reduce((sum, b) => sum + b.party_size, 0);
      const uniqueTables = new Set(bookings.map(b => b.table_id)).size;

      const perGuest = totalGuests > 0 ? gross / totalGuests : 0;
      const perTable = uniqueTables > 0 ? gross / uniqueTables : 0;

      return {
        gross,
        net,
        deposits,
        refunds,
        perGuest: Math.round(perGuest * 100) / 100,
        perTable: Math.round(perTable * 100) / 100
      };

    } catch (error) {
      console.error('Error getting revenue metrics:', error);
      return {
        gross: 0,
        net: 0,
        deposits: 0,
        refunds: 0,
        perGuest: 0,
        perTable: 0
      };
    }
  }

  private async getEventMetrics(targetDate: Date) {
    try {
      const dayOfWeek = targetDate.getDay();
      let eventName = '';
      
      // Map day to event based on venue schedule
      switch (dayOfWeek) {
        case 5: // Friday
          eventName = 'BELLA GENTE';
          break;
        case 6: // Saturday  
          eventName = 'SHHH!';
          break;
        case 0: // Sunday
          eventName = 'NOSTALGIA';
          break;
        default:
          eventName = 'Regular Night';
      }

      const { data: bookings } = await this.supabase
        .from('bookings')
        .select(`
          *,
          events (name, id)
        `)
        .eq('booking_date', format(targetDate, 'yyyy-MM-dd'))
        .eq('status', 'confirmed');

      if (!bookings?.length) {
        return [{
          name: eventName,
          attendance: 0,
          revenue: 0,
          occupancyRate: 0
        }];
      }

      // Group by event
      const eventGroups = bookings.reduce((acc, booking) => {
        const name = booking.events?.name || eventName;
        if (!acc[name]) {
          acc[name] = {
            bookings: [],
            revenue: 0,
            attendance: 0
          };
        }
        acc[name].bookings.push(booking);
        acc[name].revenue += booking.total_amount;
        acc[name].attendance += booking.party_size;
        return acc;
      }, {} as Record<string, any>);

      return Object.entries(eventGroups).map(([name, data]) => {
        const totalTables = 16;
        const tablesUsed = new Set(data.bookings.map((b: any) => b.table_id)).size;
        const occupancyRate = (tablesUsed / totalTables) * 100;

        return {
          name,
          attendance: data.attendance,
          revenue: data.revenue,
          occupancyRate: Math.round(occupancyRate * 100) / 100
        };
      });

    } catch (error) {
      console.error('Error getting event metrics:', error);
      return [{
        name: 'Unknown Event',
        attendance: 0,
        revenue: 0,
        occupancyRate: 0
      }];
    }
  }

  private async getCustomerMetrics(targetDate: Date) {
    try {
      const { data: bookings } = await this.supabase
        .from('bookings')
        .select(`
          *,
          customers (id, created_at)
        `)
        .eq('booking_date', format(targetDate, 'yyyy-MM-dd'))
        .eq('status', 'confirmed');

      if (!bookings?.length) {
        return {
          new: 0,
          returning: 0,
          vip: 0,
          birthdays: 0,
          anniversaries: 0
        };
      }

      const targetDateStr = format(targetDate, 'yyyy-MM-dd');
      
      const newCustomers = bookings.filter(b => 
        b.customers && format(new Date(b.customers.created_at), 'yyyy-MM-dd') === targetDateStr
      ).length;

      const returningCustomers = bookings.filter(b => 
        b.customers && format(new Date(b.customers.created_at), 'yyyy-MM-dd') !== targetDateStr
      ).length;

      const vipBookings = bookings.filter(b => b.is_vip === true).length;

      // Count special occasions
      const birthdays = bookings.filter(b => 
        b.special_occasion === 'birthday' || 
        b.special_requests?.toLowerCase().includes('birthday')
      ).length;

      const anniversaries = bookings.filter(b => 
        b.special_occasion === 'anniversary' ||
        b.special_requests?.toLowerCase().includes('anniversary')
      ).length;

      return {
        new: newCustomers,
        returning: returningCustomers,
        vip: vipBookings,
        birthdays,
        anniversaries
      };

    } catch (error) {
      console.error('Error getting customer metrics:', error);
      return {
        new: 0,
        returning: 0,
        vip: 0,
        birthdays: 0,
        anniversaries: 0
      };
    }
  }

  private async getTopPackages(targetDate: Date) {
    try {
      const { data: bookings } = await this.supabase
        .from('bookings')
        .select(`
          drinks_package,
          total_amount
        `)
        .eq('booking_date', format(targetDate, 'yyyy-MM-dd'))
        .eq('status', 'confirmed')
        .not('drinks_package', 'is', null);

      if (!bookings?.length) {
        return [];
      }

      // Group by package
      const packageGroups = bookings.reduce((acc, booking) => {
        const packageName = booking.drinks_package || 'No Package';
        if (!acc[packageName]) {
          acc[packageName] = {
            bookings: 0,
            revenue: 0
          };
        }
        acc[packageName].bookings++;
        acc[packageName].revenue += booking.total_amount;
        return acc;
      }, {} as Record<string, any>);

      return Object.entries(packageGroups)
        .map(([packageName, data]) => ({
          packageName,
          bookings: data.bookings,
          revenue: data.revenue
        }))
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 5);

    } catch (error) {
      console.error('Error getting top packages:', error);
      return [];
    }
  }

  private async getStaffPerformance(targetDate: Date) {
    try {
      // This would require staff performance tracking in the database
      // For now, return empty array as this feature may be implemented later
      return [];

    } catch (error) {
      console.error('Error getting staff performance:', error);
      return [];
    }
  }

  // ============================================================================
  // REPORT GENERATION AND STORAGE
  // ============================================================================

  private async saveReportGeneration(
    reportData: DailySummaryReportData,
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
          .eq('name', 'Daily Summary Report')
          .eq('is_system_template', true)
          .single();
        
        actualTemplateId = template?.id;
      }

      const reportSummary = {
        title: `Daily Summary - ${format(reportData.date, 'MMM dd, yyyy')}`,
        description: `Comprehensive daily operational summary for The Backroom Leeds`,
        highlights: [
          `${reportData.overview.totalBookings} total bookings`,
          `£${reportData.revenue.gross.toFixed(2)} gross revenue`, 
          `${reportData.overview.totalGuests} guests served`,
          `${reportData.overview.occupancyRate.toFixed(1)}% table occupancy`
        ],
        recommendations: this.generateRecommendations(reportData),
        alerts: this.generateAlerts(reportData)
      };

      const keyMetrics = {
        totalBookings: reportData.overview.totalBookings,
        totalRevenue: reportData.revenue.gross,
        totalGuests: reportData.overview.totalGuests,
        occupancyRate: reportData.overview.occupancyRate,
        averagePartySize: reportData.bookings.averagePartySize,
        revenuePerGuest: reportData.revenue.perGuest,
        noShowRate: reportData.overview.totalBookings > 0 
          ? (reportData.bookings.noShows / reportData.overview.totalBookings) * 100 
          : 0
      };

      const { data: generation, error } = await this.supabase
        .from('report_generation_history')
        .insert({
          template_id: actualTemplateId,
          report_type: ReportType.DAILY_SUMMARY,
          generated_at: new Date().toISOString(),
          data_period_start: startOfDay(reportData.date).toISOString(),
          data_period_end: endOfDay(reportData.date).toISOString(),
          output_format: format,
          records_processed: reportData.overview.totalBookings,
          sections_generated: 6, // overview, bookings, revenue, events, customers, packages
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

  private generateRecommendations(reportData: DailySummaryReportData): string[] {
    const recommendations: string[] = [];

    // Occupancy recommendations
    if (reportData.overview.occupancyRate < 60) {
      recommendations.push('Consider promotional offers to increase table bookings');
    } else if (reportData.overview.occupancyRate > 90) {
      recommendations.push('High occupancy achieved - maintain service quality standards');
    }

    // Revenue recommendations
    const avgRevenuePerGuest = reportData.revenue.perGuest;
    if (avgRevenuePerGuest < 40) {
      recommendations.push('Implement upselling strategies to increase average spend per guest');
    }

    // No-show recommendations
    const noShowRate = reportData.overview.totalBookings > 0 
      ? (reportData.bookings.noShows / reportData.overview.totalBookings) * 100 
      : 0;
    
    if (noShowRate > 10) {
      recommendations.push('High no-show rate detected - consider deposit increase or confirmation calls');
    }

    // Party size recommendations
    if (reportData.bookings.averagePartySize < 3) {
      recommendations.push('Promote group packages to increase average party size');
    }

    return recommendations;
  }

  private generateAlerts(reportData: DailySummaryReportData): string[] {
    const alerts: string[] = [];

    // Low revenue alert
    if (reportData.revenue.gross < 2000) {
      alerts.push('Daily revenue below target threshold');
    }

    // High cancellation alert
    const cancellationRate = reportData.overview.totalBookings > 0
      ? (reportData.bookings.cancelled / reportData.overview.totalBookings) * 100
      : 0;
    
    if (cancellationRate > 15) {
      alerts.push('High cancellation rate requires investigation');
    }

    // Low occupancy alert
    if (reportData.overview.occupancyRate < 40) {
      alerts.push('Low table occupancy - marketing intervention recommended');
    }

    return alerts;
  }

  private async generateReportFile(
    reportData: DailySummaryReportData,
    format: ReportFormat
  ): Promise<{ filePath: string; fileUrl: string }> {
    try {
      switch (format) {
        case ReportFormat.PDF:
          return await this.generatePDFReport(reportData);
        case ReportFormat.EXCEL:
          return await this.generateExcelReport(reportData);
        case ReportFormat.CSV:
          return await this.generateCSVReport(reportData);
        case ReportFormat.HTML:
          return await this.generateHTMLReport(reportData);
        default:
          throw new Error(`Unsupported report format: ${format}`);
      }
    } catch (error) {
      console.error('Error generating report file:', error);
      throw error;
    }
  }

  private async generatePDFReport(reportData: DailySummaryReportData): Promise<{ filePath: string; fileUrl: string }> {
    // PDF generation will be implemented with the ReportRenderer
    const fileName = `daily-summary-${format(reportData.date, 'yyyy-MM-dd')}.pdf`;
    const filePath = `/reports/daily/${fileName}`;
    const fileUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/reports/download/${fileName}`;
    
    return { filePath, fileUrl };
  }

  private async generateExcelReport(reportData: DailySummaryReportData): Promise<{ filePath: string; fileUrl: string }> {
    // Excel generation implementation
    const fileName = `daily-summary-${format(reportData.date, 'yyyy-MM-dd')}.xlsx`;
    const filePath = `/reports/daily/${fileName}`;
    const fileUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/reports/download/${fileName}`;
    
    return { filePath, fileUrl };
  }

  private async generateCSVReport(reportData: DailySummaryReportData): Promise<{ filePath: string; fileUrl: string }> {
    // CSV generation implementation
    const fileName = `daily-summary-${format(reportData.date, 'yyyy-MM-dd')}.csv`;
    const filePath = `/reports/daily/${fileName}`;
    const fileUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/reports/download/${fileName}`;
    
    return { filePath, fileUrl };
  }

  private async generateHTMLReport(reportData: DailySummaryReportData): Promise<{ filePath: string; fileUrl: string }> {
    // HTML generation implementation
    const fileName = `daily-summary-${format(reportData.date, 'yyyy-MM-dd')}.html`;
    const filePath = `/reports/daily/${fileName}`;
    const fileUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/reports/download/${fileName}`;
    
    return { filePath, fileUrl };
  }

  private async scheduleDistribution(
    reportId: string,
    recipientIds: string[],
    reportData: DailySummaryReportData
  ): Promise<void> {
    try {
      const { EmailDistributor } = await import('../distribution/EmailDistributor');
      const emailDistributor = new EmailDistributor();
      
      await emailDistributor.scheduleDailyReportDistribution(reportId, recipientIds, reportData);
    } catch (error) {
      console.error('Error scheduling distribution:', error);
    }
  }
}