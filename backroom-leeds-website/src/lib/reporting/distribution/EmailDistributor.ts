/**
 * The Backroom Leeds - Email Distributor
 * Version: 1.0.0
 * Phase: 3, Step 3.5
 * 
 * Professional email distribution system with multi-provider support
 */

import { Resend } from 'resend';
import { createClient } from '@/lib/supabase/server';
import { render } from '@react-email/render';
import { 
  DeliveryStatus, 
  DeliveryChannel,
  DailySummaryReportData,
  WeeklySummaryReportData,
  type ReportRecipient 
} from '@/types/reporting';

// ============================================================================
// CONFIGURATION
// ============================================================================

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;
const FROM_EMAIL = process.env.FROM_EMAIL || 'reports@backroomleeds.co.uk';
const FROM_NAME = 'The Backroom Leeds - Reporting';

// ============================================================================
// EMAIL DISTRIBUTOR CLASS
// ============================================================================

export class EmailDistributor {
  private resend: Resend | null = null;
  private sendgrid: any = null;
  private supabase = createClient();

  constructor() {
    // Initialize email providers
    if (RESEND_API_KEY) {
      this.resend = new Resend(RESEND_API_KEY);
    }

    if (SENDGRID_API_KEY) {
      this.initializeSendGrid();
    }
  }

  private async initializeSendGrid() {
    try {
      const sgMail = await import('@sendgrid/mail');
      sgMail.default.setApiKey(SENDGRID_API_KEY!);
      this.sendgrid = sgMail.default;
    } catch (error) {
      console.error('Failed to initialize SendGrid:', error);
    }
  }

  // ============================================================================
  // DAILY REPORT DISTRIBUTION
  // ============================================================================

  async scheduleDailyReportDistribution(
    reportId: string,
    recipientIds: string[],
    reportData: DailySummaryReportData
  ): Promise<void> {
    console.log(`📧 Scheduling daily report distribution for ${recipientIds.length} recipients`);

    try {
      // Get recipient details
      const recipients = await this.getRecipients(recipientIds);
      
      // Generate email content
      const { html, text, subject } = await this.generateDailyReportEmail(reportData);

      // Send to each recipient
      const deliveryPromises = recipients.map(recipient => 
        this.sendReportEmail(
          reportId,
          recipient,
          subject,
          html,
          text,
          'daily_report'
        )
      );

      await Promise.all(deliveryPromises);
      console.log('✅ Daily report distribution scheduled successfully');

    } catch (error) {
      console.error('❌ Error scheduling daily report distribution:', error);
      throw error;
    }
  }

  async scheduleWeeklyReportDistribution(
    reportId: string,
    recipientIds: string[],
    reportData: WeeklySummaryReportData
  ): Promise<void> {
    console.log(`📧 Scheduling weekly report distribution for ${recipientIds.length} recipients`);

    try {
      // Get recipient details
      const recipients = await this.getRecipients(recipientIds);
      
      // Generate email content
      const { html, text, subject } = await this.generateWeeklyReportEmail(reportData);

      // Send to each recipient
      const deliveryPromises = recipients.map(recipient => 
        this.sendReportEmail(
          reportId,
          recipient,
          subject,
          html,
          text,
          'weekly_report'
        )
      );

      await Promise.all(deliveryPromises);
      console.log('✅ Weekly report distribution scheduled successfully');

    } catch (error) {
      console.error('❌ Error scheduling weekly report distribution:', error);
      throw error;
    }
  }

  // ============================================================================
  // EMAIL GENERATION
  // ============================================================================

  private async generateDailyReportEmail(reportData: DailySummaryReportData): Promise<{
    html: string;
    text: string;
    subject: string;
  }> {
    try {
      // Import the daily report template
      const { DailyReportTemplate } = await import('../templates/DailyReportTemplate');
      
      // Render HTML email
      const html = render(DailyReportTemplate({ reportData }));
      
      // Generate text version
      const text = this.generateDailyReportText(reportData);
      
      // Create subject
      const dateStr = new Date(reportData.date).toLocaleDateString('en-GB', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
      const subject = `Daily Summary Report - ${dateStr} | The Backroom Leeds`;

      return { html, text, subject };

    } catch (error) {
      console.error('Error generating daily report email:', error);
      throw error;
    }
  }

  private async generateWeeklyReportEmail(reportData: WeeklySummaryReportData): Promise<{
    html: string;
    text: string;
    subject: string;
  }> {
    try {
      // Import the weekly report template
      const { WeeklyReportTemplate } = await import('../templates/WeeklyReportTemplate');
      
      // Render HTML email
      const html = render(WeeklyReportTemplate({ reportData }));
      
      // Generate text version
      const text = this.generateWeeklyReportText(reportData);
      
      // Create subject
      const startDate = new Date(reportData.weekStart).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
      const endDate = new Date(reportData.weekEnd).toLocaleDateString('en-GB', { 
        day: 'numeric', 
        month: 'short',
        year: 'numeric'
      });
      const subject = `Weekly Summary Report - ${startDate} to ${endDate} | The Backroom Leeds`;

      return { html, text, subject };

    } catch (error) {
      console.error('Error generating weekly report email:', error);
      throw error;
    }
  }

  private generateDailyReportText(reportData: DailySummaryReportData): string {
    const dateStr = new Date(reportData.date).toLocaleDateString('en-GB');
    
    return `
THE BACKROOM LEEDS - DAILY SUMMARY REPORT
${dateStr}
${'='.repeat(50)}

OVERVIEW
--------
• Total Bookings: ${reportData.overview.totalBookings}
• Total Revenue: £${reportData.revenue.gross.toFixed(2)}
• Total Guests: ${reportData.overview.totalGuests}
• Tables Occupied: ${reportData.overview.tablesOccupied}
• Occupancy Rate: ${reportData.overview.occupancyRate.toFixed(1)}%

BOOKINGS
--------
• Confirmed: ${reportData.bookings.confirmed}
• Cancelled: ${reportData.bookings.cancelled}
• No Shows: ${reportData.bookings.noShows}
• Walk-ins: ${reportData.bookings.walkIns}
• Waitlist: ${reportData.bookings.waitlist}
• Avg Party Size: ${reportData.bookings.averagePartySize.toFixed(1)}

REVENUE
-------
• Gross Revenue: £${reportData.revenue.gross.toFixed(2)}
• Net Revenue: £${reportData.revenue.net.toFixed(2)}
• Deposits: £${reportData.revenue.deposits.toFixed(2)}
• Refunds: £${reportData.revenue.refunds.toFixed(2)}
• Per Guest: £${reportData.revenue.perGuest.toFixed(2)}
• Per Table: £${reportData.revenue.perTable.toFixed(2)}

EVENTS
------
${reportData.events.map(event => 
  `• ${event.name}: ${event.attendance} guests, £${event.revenue.toFixed(2)} revenue, ${event.occupancyRate.toFixed(1)}% occupancy`
).join('\n')}

CUSTOMERS
---------
• New: ${reportData.customers.new}
• Returning: ${reportData.customers.returning}
• VIP: ${reportData.customers.vip}
• Birthdays: ${reportData.customers.birthdays}
• Anniversaries: ${reportData.customers.anniversaries}

TOP PACKAGES
-----------
${reportData.topPackages.map(pkg => 
  `• ${pkg.packageName}: ${pkg.bookings} bookings, £${pkg.revenue.toFixed(2)}`
).join('\n')}

This report was generated automatically by The Backroom Leeds reporting system.
For questions or support, contact: reports@backroomleeds.co.uk
    `.trim();
  }

  private generateWeeklyReportText(reportData: WeeklySummaryReportData): string {
    const startDate = new Date(reportData.weekStart).toLocaleDateString('en-GB');
    const endDate = new Date(reportData.weekEnd).toLocaleDateString('en-GB');
    
    return `
THE BACKROOM LEEDS - WEEKLY SUMMARY REPORT
${startDate} to ${endDate}
${'='.repeat(60)}

WEEKLY OVERVIEW
--------------
• Total Bookings: ${reportData.overview.totalBookings} (${reportData.overview.vsLastWeek.bookingsChange > 0 ? '+' : ''}${reportData.overview.vsLastWeek.bookingsChange}% vs last week)
• Total Revenue: £${reportData.overview.totalRevenue.toFixed(2)} (${reportData.overview.vsLastWeek.revenueChange > 0 ? '+' : ''}${reportData.overview.vsLastWeek.revenueChange}% vs last week)
• Total Guests: ${reportData.overview.totalGuests} (${reportData.overview.vsLastWeek.guestsChange > 0 ? '+' : ''}${reportData.overview.vsLastWeek.guestsChange}% vs last week)
• Avg Occupancy: ${reportData.overview.averageOccupancyRate.toFixed(1)}%

DAILY BREAKDOWN
--------------
${reportData.dailyBreakdown.map(day => {
  const dayName = new Date(day.date).toLocaleDateString('en-GB', { weekday: 'short' });
  return `• ${dayName}: ${day.bookings} bookings, £${day.revenue.toFixed(2)}, ${day.guests} guests, ${day.occupancyRate.toFixed(1)}% occupancy`;
}).join('\n')}

TOP EVENTS
----------
${reportData.topEvents.slice(0, 3).map(event => 
  `• ${event.eventName}: ${event.totalGuests} guests, £${event.totalRevenue.toFixed(2)} revenue`
).join('\n')}

CUSTOMER METRICS
---------------
• New Customers: ${reportData.customerMetrics.newCustomers}
• Returning Rate: ${reportData.customerMetrics.returningRate.toFixed(1)}%
• Average LTV: £${reportData.customerMetrics.averageLTV.toFixed(2)}

TRENDS
------
• Bookings: ${reportData.trends.bookingTrend.toUpperCase()}
• Revenue: ${reportData.trends.revenueTrend.toUpperCase()}
• Occupancy: ${reportData.trends.occupancyTrend.toUpperCase()}

RECOMMENDATIONS
--------------
${reportData.recommendations.map(rec => `• ${rec}`).join('\n')}

${reportData.alerts.length > 0 ? `
ALERTS
------
${reportData.alerts.map(alert => `⚠️  ${alert}`).join('\n')}
` : ''}

This report was generated automatically by The Backroom Leeds reporting system.
For questions or support, contact: reports@backroomleeds.co.uk
    `.trim();
  }

  // ============================================================================
  // EMAIL SENDING
  // ============================================================================

  private async sendReportEmail(
    reportId: string,
    recipient: ReportRecipient,
    subject: string,
    html: string,
    text: string,
    reportType: string
  ): Promise<void> {
    try {
      // Record delivery attempt
      const deliveryId = await this.recordDeliveryAttempt(
        reportId,
        recipient.id,
        DeliveryChannel.EMAIL,
        recipient.email
      );

      let success = false;
      let messageId: string | undefined;
      let errorMessage: string | undefined;

      // Try Resend first
      if (this.resend) {
        try {
          const result = await this.resend.emails.send({
            from: `${FROM_NAME} <${FROM_EMAIL}>`,
            to: [recipient.email],
            subject,
            html,
            text,
            tags: [
              { name: 'report_type', value: reportType },
              { name: 'recipient_id', value: recipient.id },
              { name: 'delivery_id', value: deliveryId }
            ]
          });

          if (result.data?.id) {
            messageId = result.data.id;
            success = true;
            console.log(`✅ Email sent via Resend to ${recipient.email}`);
          }
        } catch (error) {
          console.error(`❌ Resend failed for ${recipient.email}:`, error);
          errorMessage = error instanceof Error ? error.message : String(error);
        }
      }

      // Fallback to SendGrid if Resend failed
      if (!success && this.sendgrid) {
        try {
          const msg = {
            to: recipient.email,
            from: {
              email: FROM_EMAIL,
              name: FROM_NAME
            },
            subject,
            html,
            text,
            customArgs: {
              report_type: reportType,
              recipient_id: recipient.id,
              delivery_id: deliveryId
            },
            trackingSettings: {
              clickTracking: { enable: true },
              openTracking: { enable: true }
            }
          };

          const result = await this.sendgrid.send(msg);
          if (result[0]?.statusCode === 202) {
            messageId = result[0].headers['x-message-id'];
            success = true;
            console.log(`✅ Email sent via SendGrid to ${recipient.email}`);
          }
        } catch (error) {
          console.error(`❌ SendGrid failed for ${recipient.email}:`, error);
          errorMessage = error instanceof Error ? error.message : String(error);
        }
      }

      // Update delivery status
      await this.updateDeliveryStatus(
        deliveryId,
        success ? DeliveryStatus.DELIVERED : DeliveryStatus.FAILED,
        messageId,
        errorMessage
      );

    } catch (error) {
      console.error('Error sending report email:', error);
    }
  }

  // ============================================================================
  // ALERT EMAILS
  // ============================================================================

  async sendJobAlert(recipients: string[], alertData: any): Promise<void> {
    try {
      console.log(`🚨 Sending job alert to ${recipients.length} recipients`);

      // Generate alert email content
      const { html, text, subject } = await this.generateJobAlertEmail(alertData);

      // Send to each recipient
      const sendPromises = recipients.map(email => 
        this.sendAlertEmail(email, subject, html, text)
      );

      await Promise.all(sendPromises);
      console.log('✅ Job alerts sent successfully');

    } catch (error) {
      console.error('❌ Error sending job alert:', error);
    }
  }

  private async generateJobAlertEmail(alertData: any): Promise<{
    html: string;
    text: string;
    subject: string;
  }> {
    try {
      // Import the alert template
      const { AlertTemplate } = await import('../templates/AlertTemplate');
      
      // Render HTML email
      const html = render(AlertTemplate({ alertData }));
      
      // Generate text version
      const text = `
JOB ALERT - ${alertData.jobName}
${'='.repeat(40)}

Alert Type: ${alertData.alertType}
Job: ${alertData.jobName}
Time: ${new Date(alertData.timestamp).toLocaleString('en-GB')}

Description: ${alertData.jobDescription || 'No description available'}

${alertData.executionData ? `
Execution Details:
- Status: ${alertData.executionData.status}
- Error: ${alertData.executionData.errorMessage || 'N/A'}
- Execution Time: ${alertData.executionData.executionTimeMs || 0}ms
` : ''}

This is an automated alert from The Backroom Leeds reporting system.
Please investigate the issue and take appropriate action.

For support, contact: tech@backroomleeds.co.uk
      `.trim();
      
      const subject = `🚨 Job Alert: ${alertData.jobName} - ${alertData.alertType}`;

      return { html, text, subject };

    } catch (error) {
      console.error('Error generating job alert email:', error);
      throw error;
    }
  }

  private async sendAlertEmail(
    email: string,
    subject: string,
    html: string,
    text: string
  ): Promise<void> {
    try {
      let success = false;

      // Try Resend first
      if (this.resend) {
        try {
          await this.resend.emails.send({
            from: `${FROM_NAME} <${FROM_EMAIL}>`,
            to: [email],
            subject,
            html,
            text,
            tags: [{ name: 'alert_type', value: 'job_alert' }]
          });
          success = true;
        } catch (error) {
          console.error(`Resend failed for alert email:`, error);
        }
      }

      // Fallback to SendGrid
      if (!success && this.sendgrid) {
        try {
          await this.sendgrid.send({
            to: email,
            from: { email: FROM_EMAIL, name: FROM_NAME },
            subject,
            html,
            text
          });
          success = true;
        } catch (error) {
          console.error(`SendGrid failed for alert email:`, error);
        }
      }

    } catch (error) {
      console.error('Error sending alert email:', error);
    }
  }

  // ============================================================================
  // DATABASE OPERATIONS
  // ============================================================================

  private async getRecipients(recipientIds: string[]): Promise<ReportRecipient[]> {
    try {
      const { data: recipients, error } = await this.supabase
        .from('report_recipients')
        .select('*')
        .in('id', recipientIds)
        .eq('is_active', true)
        .eq('email_verified', true);

      if (error) {
        throw new Error(`Failed to get recipients: ${error.message}`);
      }

      return recipients || [];
    } catch (error) {
      console.error('Error getting recipients:', error);
      return [];
    }
  }

  private async recordDeliveryAttempt(
    reportId: string,
    recipientId: string,
    channel: DeliveryChannel,
    address: string
  ): Promise<string> {
    try {
      const { data: delivery, error } = await this.supabase
        .from('report_delivery_history')
        .insert({
          generation_id: reportId,
          recipient_id: recipientId,
          delivery_channel: channel,
          delivery_status: DeliveryStatus.PENDING,
          delivery_address: address,
          queued_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to record delivery attempt: ${error.message}`);
      }

      return delivery.id;
    } catch (error) {
      console.error('Error recording delivery attempt:', error);
      return 'unknown';
    }
  }

  private async updateDeliveryStatus(
    deliveryId: string,
    status: DeliveryStatus,
    messageId?: string,
    errorMessage?: string
  ): Promise<void> {
    try {
      const updateData: any = {
        delivery_status: status,
        updated_at: new Date().toISOString()
      };

      if (status === DeliveryStatus.DELIVERED) {
        updateData.sent_at = new Date().toISOString();
        updateData.delivered_at = new Date().toISOString();
      }

      if (messageId) {
        updateData.message_id = messageId;
      }

      if (errorMessage) {
        updateData.failure_reason = errorMessage;
      }

      const { error } = await this.supabase
        .from('report_delivery_history')
        .update(updateData)
        .eq('id', deliveryId);

      if (error) {
        console.error('Error updating delivery status:', error);
      }
    } catch (error) {
      console.error('Error in updateDeliveryStatus:', error);
    }
  }

  // ============================================================================
  // UTILITY METHODS
  // ============================================================================

  async getDeliveryStats(
    reportId: string
  ): Promise<{
    total: number;
    delivered: number;
    failed: number;
    pending: number;
    bounced: number;
  }> {
    try {
      const { data: deliveries, error } = await this.supabase
        .from('report_delivery_history')
        .select('delivery_status')
        .eq('generation_id', reportId);

      if (error || !deliveries) {
        return { total: 0, delivered: 0, failed: 0, pending: 0, bounced: 0 };
      }

      const stats = deliveries.reduce(
        (acc, delivery) => {
          acc.total++;
          switch (delivery.delivery_status) {
            case DeliveryStatus.DELIVERED:
              acc.delivered++;
              break;
            case DeliveryStatus.FAILED:
              acc.failed++;
              break;
            case DeliveryStatus.PENDING:
              acc.pending++;
              break;
            case DeliveryStatus.BOUNCED:
              acc.bounced++;
              break;
          }
          return acc;
        },
        { total: 0, delivered: 0, failed: 0, pending: 0, bounced: 0 }
      );

      return stats;
    } catch (error) {
      console.error('Error getting delivery stats:', error);
      return { total: 0, delivered: 0, failed: 0, pending: 0, bounced: 0 };
    }
  }

  async processWebhookEvent(
    provider: 'resend' | 'sendgrid',
    eventData: any
  ): Promise<void> {
    try {
      // Process webhook events for delivery tracking
      let messageId: string | undefined;
      let eventType: string | undefined;
      let deliveryStatus: DeliveryStatus | undefined;

      if (provider === 'resend') {
        messageId = eventData.data?.email_id;
        eventType = eventData.type;
        
        switch (eventType) {
          case 'email.delivered':
            deliveryStatus = DeliveryStatus.DELIVERED;
            break;
          case 'email.opened':
            deliveryStatus = DeliveryStatus.OPENED;
            break;
          case 'email.clicked':
            deliveryStatus = DeliveryStatus.CLICKED;
            break;
          case 'email.bounced':
            deliveryStatus = DeliveryStatus.BOUNCED;
            break;
        }
      } else if (provider === 'sendgrid') {
        messageId = eventData.sg_message_id;
        eventType = eventData.event;
        
        switch (eventType) {
          case 'delivered':
            deliveryStatus = DeliveryStatus.DELIVERED;
            break;
          case 'open':
            deliveryStatus = DeliveryStatus.OPENED;
            break;
          case 'click':
            deliveryStatus = DeliveryStatus.CLICKED;
            break;
          case 'bounce':
            deliveryStatus = DeliveryStatus.BOUNCED;
            break;
        }
      }

      if (messageId && deliveryStatus) {
        await this.updateDeliveryByMessageId(messageId, deliveryStatus, eventData);
      }

    } catch (error) {
      console.error('Error processing webhook event:', error);
    }
  }

  private async updateDeliveryByMessageId(
    messageId: string,
    status: DeliveryStatus,
    eventData: any
  ): Promise<void> {
    try {
      const updateData: any = {
        delivery_status: status,
        updated_at: new Date().toISOString()
      };

      if (status === DeliveryStatus.DELIVERED) {
        updateData.delivered_at = new Date().toISOString();
      } else if (status === DeliveryStatus.OPENED) {
        updateData.opened_at = new Date().toISOString();
      } else if (status === DeliveryStatus.CLICKED) {
        updateData.clicked_at = new Date().toISOString();
      }

      const { error } = await this.supabase
        .from('report_delivery_history')
        .update(updateData)
        .eq('message_id', messageId);

      if (error) {
        console.error('Error updating delivery by message ID:', error);
      }
    } catch (error) {
      console.error('Error in updateDeliveryByMessageId:', error);
    }
  }
}