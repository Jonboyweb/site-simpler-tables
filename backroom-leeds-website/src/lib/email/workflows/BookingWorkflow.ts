/**
 * Booking Email Workflow
 * 
 * Automated email workflows for booking lifecycle management
 * with professional templates and smart scheduling.
 * 
 * @module BookingWorkflow
 */

import { getEmailQueue, EmailQueueJob } from '../queue/EmailQueue';
import { EmailPriority } from '../providers/EmailServiceManager';
import { getEmailDeliveryTracker } from '../tracking/DeliveryTracker';
import { render } from '@react-email/render';
import BookingConfirmationTemplate from '../templates/booking/BookingConfirmationTemplate';
import BookingReminderTemplate from '../templates/booking/BookingReminderTemplate';
import CancellationConfirmationTemplate from '../templates/booking/CancellationConfirmationTemplate';
import { addHours, addDays, subDays, format } from 'date-fns';
import { v4 as uuidv4 } from 'uuid';

// ============================================================================
// Types and Interfaces
// ============================================================================

export interface BookingEmailContext {
  booking: {
    id: string;
    customerId: string;
    customerName: string;
    customerEmail: string;
    date: Date;
    timeSlot: string;
    tableName: string;
    floor: string;
    partySize: number;
    specialRequests?: string;
    totalAmount: number;
    depositPaid: number;
    remainingBalance: number;
    status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
    createdAt: Date;
    updatedAt: Date;
  };
  customer: {
    id: string;
    name: string;
    email: string;
    phone?: string;
    preferences?: {
      emailNotifications: boolean;
      smsNotifications: boolean;
      marketingEmails: boolean;
    };
  };
  venue: {
    name: string;
    address: string;
    phone: string;
    email: string;
    policies: string[];
  };
  eventInfo?: {
    name: string;
    type: string;
    djLineup?: string[];
    specialNotes?: string;
  };
  drinksPackage?: {
    name: string;
    price: number;
    description: string;
    includes: string[];
  };
  qrCode?: {
    dataUrl: string;
    checkInCode: string;
  };
}

export interface EmailWorkflowTrigger {
  event: 'booking_created' | 'booking_confirmed' | 'booking_cancelled' | 'booking_modified' | 'reminder_due';
  context: BookingEmailContext;
  metadata?: {
    triggeredBy: 'system' | 'admin' | 'customer';
    triggeredAt: Date;
    reason?: string;
  };
}

export interface ScheduledEmailJob {
  id: string;
  bookingId: string;
  emailType: 'confirmation' | 'reminder' | 'cancellation' | 'follow_up';
  scheduledFor: Date;
  priority: EmailPriority;
  status: 'scheduled' | 'sent' | 'failed' | 'cancelled';
  attempts: number;
  lastAttempt?: Date;
}

// ============================================================================
// Booking Email Workflow Manager
// ============================================================================

export class BookingEmailWorkflow {
  private emailQueue = getEmailQueue();
  private emailTracker = getEmailDeliveryTracker();
  private scheduledJobs = new Map<string, ScheduledEmailJob[]>();

  constructor() {
    this.initialize();
  }

  /**
   * Initialize the workflow system
   */
  private async initialize(): Promise<void> {
    try {
      await this.emailQueue.initialize();
      await this.emailTracker.initialize();
      console.log('Booking email workflow initialized');
    } catch (error) {
      console.error('Failed to initialize booking email workflow:', error);
    }
  }

  /**
   * Process booking workflow trigger
   */
  async processWorkflowTrigger(trigger: EmailWorkflowTrigger): Promise<void> {
    console.log(`Processing workflow trigger: ${trigger.event} for booking ${trigger.context.booking.id}`);

    try {
      switch (trigger.event) {
        case 'booking_created':
          await this.handleBookingCreated(trigger.context);
          break;
        case 'booking_confirmed':
          await this.handleBookingConfirmed(trigger.context);
          break;
        case 'booking_cancelled':
          await this.handleBookingCancelled(trigger.context, trigger.metadata);
          break;
        case 'booking_modified':
          await this.handleBookingModified(trigger.context, trigger.metadata);
          break;
        case 'reminder_due':
          await this.handleReminderDue(trigger.context);
          break;
        default:
          console.warn(`Unknown workflow trigger: ${trigger.event}`);
      }
    } catch (error) {
      console.error(`Failed to process workflow trigger ${trigger.event}:`, error);
      throw error;
    }
  }

  /**
   * Handle new booking creation
   */
  private async handleBookingCreated(context: BookingEmailContext): Promise<void> {
    const { booking, customer } = context;

    // Check customer email preferences
    if (!customer.preferences?.emailNotifications) {
      console.log(`Skipping booking emails for ${customer.email} - notifications disabled`);
      return;
    }

    // Get customer consent for email tracking
    const consent = await this.emailTracker.getCustomerConsent(customer.email);
    const trackingConsent = consent?.trackingConsent.openTracking || false;

    // Send immediate booking confirmation
    await this.sendBookingConfirmation(context, {
      priority: EmailPriority.CRITICAL,
      trackingEnabled: trackingConsent,
      customerConsent: {
        emailTracking: trackingConsent,
        marketingEmails: customer.preferences?.marketingEmails || false,
        transactionalEmails: customer.preferences?.emailNotifications || true
      }
    });

    // Schedule automated reminders
    await this.scheduleBookingReminders(context);

    console.log(`Booking creation workflow completed for booking ${booking.id}`);
  }

  /**
   * Handle booking confirmation
   */
  private async handleBookingConfirmed(context: BookingEmailContext): Promise<void> {
    const { booking, customer } = context;

    // Update booking confirmation if needed
    if (booking.status === 'confirmed' && booking.qrCode) {
      const consent = await this.emailTracker.getCustomerConsent(customer.email);
      
      await this.sendBookingConfirmation(context, {
        priority: EmailPriority.HIGH,
        trackingEnabled: consent?.trackingConsent.openTracking || false,
        customerConsent: {
          emailTracking: consent?.trackingConsent.openTracking || false,
          marketingEmails: customer.preferences?.marketingEmails || false,
          transactionalEmails: true
        }
      });
    }

    console.log(`Booking confirmation workflow completed for booking ${booking.id}`);
  }

  /**
   * Handle booking cancellation
   */
  private async handleBookingCancelled(
    context: BookingEmailContext, 
    metadata?: any
  ): Promise<void> {
    const { booking, customer } = context;

    // Cancel scheduled reminders
    await this.cancelScheduledEmails(booking.id);

    // Determine refund eligibility
    const hoursBeforeEvent = Math.floor(
      (booking.date.getTime() - Date.now()) / (1000 * 60 * 60)
    );
    const refundEligible = hoursBeforeEvent >= 48;

    // Get customer consent
    const consent = await this.emailTracker.getCustomerConsent(customer.email);

    // Send cancellation confirmation
    const cancellationContext = {
      customerName: customer.name,
      booking: {
        id: booking.id,
        date: booking.date,
        timeSlot: booking.timeSlot,
        tableName: booking.tableName,
        floor: booking.floor,
        partySize: booking.partySize,
        originalAmount: booking.totalAmount,
        depositPaid: booking.depositPaid
      },
      refund: {
        eligible: refundEligible,
        amount: refundEligible ? booking.depositPaid : 0,
        reason: refundEligible ? undefined : 'Cancelled within 48 hours of booking',
        processedAt: refundEligible ? new Date() : undefined,
        estimatedRefundDate: refundEligible ? addDays(new Date(), 5) : undefined,
        refundReference: refundEligible ? `REF-${booking.id.substring(0, 8).toUpperCase()}` : undefined
      },
      cancellation: {
        cancelledAt: new Date(),
        hoursBeforeEvent,
        reason: metadata?.reason
      }
    };

    const html = render(CancellationConfirmationTemplate(cancellationContext));
    const text = `Your booking ${booking.id} has been cancelled. ${refundEligible ? 'A refund will be processed.' : 'No refund is available due to our 48-hour policy.'}`;

    const emailJob: EmailQueueJob = {
      to: customer.email,
      from: `The Backroom Leeds <${context.venue.email}>`,
      subject: `Booking Cancelled - ${format(booking.date, 'EEEE, MMMM d')}`,
      html,
      text,
      priority: EmailPriority.HIGH,
      templateName: 'cancellation_confirmation',
      templateData: cancellationContext,
      trackingEnabled: consent?.trackingConsent.openTracking || false,
      customerConsent: {
        emailTracking: consent?.trackingConsent.openTracking || false,
        marketingEmails: customer.preferences?.marketingEmails || false,
        transactionalEmails: true
      }
    };

    await this.emailQueue.addEmailJob(emailJob);

    console.log(`Booking cancellation workflow completed for booking ${booking.id}`);
  }

  /**
   * Handle booking modification
   */
  private async handleBookingModified(
    context: BookingEmailContext, 
    metadata?: any
  ): Promise<void> {
    const { booking, customer } = context;

    // Cancel existing reminders and reschedule
    await this.cancelScheduledEmails(booking.id);
    await this.scheduleBookingReminders(context);

    // Send updated confirmation
    const consent = await this.emailTracker.getCustomerConsent(customer.email);

    await this.sendBookingConfirmation(context, {
      priority: EmailPriority.HIGH,
      trackingEnabled: consent?.trackingConsent.openTracking || false,
      subject: `Booking Updated - ${format(booking.date, 'EEEE, MMMM d')}`,
      customerConsent: {
        emailTracking: consent?.trackingConsent.openTracking || false,
        marketingEmails: customer.preferences?.marketingEmails || false,
        transactionalEmails: true
      }
    });

    console.log(`Booking modification workflow completed for booking ${booking.id}`);
  }

  /**
   * Handle reminder due
   */
  private async handleReminderDue(context: BookingEmailContext): Promise<void> {
    const { booking, customer } = context;

    // Determine reminder type based on time until booking
    const hoursUntilBooking = Math.floor(
      (booking.date.getTime() - Date.now()) / (1000 * 60 * 60)
    );

    let reminderType: 'week_before' | 'day_before' | 'day_of';
    if (hoursUntilBooking >= 168) { // 7 days
      reminderType = 'week_before';
    } else if (hoursUntilBooking >= 24) {
      reminderType = 'day_before';
    } else {
      reminderType = 'day_of';
    }

    // Get customer consent and weather info
    const consent = await this.emailTracker.getCustomerConsent(customer.email);
    const weatherAlert = reminderType === 'day_of' ? await this.getWeatherAlert() : undefined;

    const reminderContext = {
      customerName: customer.name,
      booking: {
        id: booking.id,
        date: booking.date,
        timeSlot: booking.timeSlot,
        tableName: booking.tableName,
        floor: booking.floor,
        partySize: booking.partySize,
        specialRequests: booking.specialRequests,
        remainingBalance: booking.remainingBalance
      },
      qrCodeUrl: context.qrCode?.dataUrl || '',
      reminderType,
      eventInfo: context.eventInfo,
      weatherAlert
    };

    const html = render(BookingReminderTemplate(reminderContext));
    const text = `Reminder: Your booking at The Backroom Leeds is ${reminderType.replace('_', ' ')}. ${format(booking.date, 'EEEE, MMMM d')} at ${booking.timeSlot}.`;

    const emailJob: EmailQueueJob = {
      to: customer.email,
      from: `The Backroom Leeds <${context.venue.email}>`,
      subject: `Reminder: Your booking ${reminderType.replace('_', ' ')} - ${format(booking.date, 'EEEE, MMMM d')}`,
      html,
      text,
      priority: reminderType === 'day_of' ? EmailPriority.HIGH : EmailPriority.NORMAL,
      templateName: 'booking_reminder',
      templateData: reminderContext,
      trackingEnabled: consent?.trackingConsent.openTracking || false,
      customerConsent: {
        emailTracking: consent?.trackingConsent.openTracking || false,
        marketingEmails: customer.preferences?.marketingEmails || false,
        transactionalEmails: true
      }
    };

    await this.emailQueue.addEmailJob(emailJob);

    console.log(`Booking reminder sent for booking ${booking.id} (${reminderType})`);
  }

  /**
   * Send booking confirmation email
   */
  private async sendBookingConfirmation(
    context: BookingEmailContext,
    options: {
      priority: EmailPriority;
      trackingEnabled: boolean;
      subject?: string;
      customerConsent: {
        emailTracking: boolean;
        marketingEmails: boolean;
        transactionalEmails: boolean;
      };
    }
  ): Promise<void> {
    const { booking, customer, qrCode, drinksPackage, eventInfo, venue } = context;

    const confirmationContext = {
      customerName: customer.name,
      booking: {
        id: booking.id,
        date: booking.date,
        timeSlot: booking.timeSlot,
        tableName: booking.tableName,
        floor: booking.floor,
        partySize: booking.partySize,
        specialRequests: booking.specialRequests,
        totalAmount: booking.totalAmount,
        depositPaid: booking.depositPaid,
        remainingBalance: booking.remainingBalance
      },
      qrCodeUrl: qrCode?.dataUrl || '',
      drinksPackage,
      eventInfo
    };

    const html = render(BookingConfirmationTemplate(confirmationContext));
    const text = `Your booking at The Backroom Leeds is confirmed for ${format(booking.date, 'EEEE, MMMM d')} at ${booking.timeSlot}. Table: ${booking.tableName}. Remaining balance: £${booking.remainingBalance}.`;

    const emailJob: EmailQueueJob = {
      to: customer.email,
      from: `The Backroom Leeds <${venue.email}>`,
      subject: options.subject || `Booking Confirmed - ${format(booking.date, 'EEEE, MMMM d')}`,
      html,
      text,
      priority: options.priority,
      templateName: 'booking_confirmation',
      templateData: confirmationContext,
      trackingEnabled: options.trackingEnabled,
      customerConsent: options.customerConsent
    };

    await this.emailQueue.addEmailJob(emailJob);
  }

  /**
   * Schedule automated booking reminders
   */
  private async scheduleBookingReminders(context: BookingEmailContext): Promise<void> {
    const { booking, customer } = context;
    const bookingDate = booking.date;

    // Skip reminders if booking is too soon or customer opted out
    if (!customer.preferences?.emailNotifications) {
      return;
    }

    const reminderJobs: ScheduledEmailJob[] = [];

    // Schedule week before reminder (if booking is more than 7 days away)
    const weekBefore = subDays(bookingDate, 7);
    if (weekBefore > new Date()) {
      const weekBeforeJob: ScheduledEmailJob = {
        id: uuidv4(),
        bookingId: booking.id,
        emailType: 'reminder',
        scheduledFor: weekBefore,
        priority: EmailPriority.NORMAL,
        status: 'scheduled',
        attempts: 0
      };

      reminderJobs.push(weekBeforeJob);

      // Add to email queue
      const triggerJob: EmailQueueJob = {
        to: customer.email,
        from: `The Backroom Leeds <${context.venue.email}>`,
        subject: 'Booking Reminder - One Week Away',
        html: '',
        text: '',
        priority: EmailPriority.NORMAL,
        scheduleAt: weekBefore,
        templateName: 'reminder_trigger',
        templateData: { bookingId: booking.id, reminderType: 'week_before' }
      };

      await this.emailQueue.addEmailJob(triggerJob);
    }

    // Schedule day before reminder
    const dayBefore = subDays(bookingDate, 1);
    if (dayBefore > new Date()) {
      const dayBeforeJob: ScheduledEmailJob = {
        id: uuidv4(),
        bookingId: booking.id,
        emailType: 'reminder',
        scheduledFor: dayBefore,
        priority: EmailPriority.HIGH,
        status: 'scheduled',
        attempts: 0
      };

      reminderJobs.push(dayBeforeJob);

      const triggerJob: EmailQueueJob = {
        to: customer.email,
        from: `The Backroom Leeds <${context.venue.email}>`,
        subject: 'Booking Reminder - Tomorrow Night',
        html: '',
        text: '',
        priority: EmailPriority.HIGH,
        scheduleAt: dayBefore,
        templateName: 'reminder_trigger',
        templateData: { bookingId: booking.id, reminderType: 'day_before' }
      };

      await this.emailQueue.addEmailJob(triggerJob);
    }

    // Schedule day of reminder (morning of the event)
    const dayOf = new Date(bookingDate);
    dayOf.setHours(10, 0, 0, 0); // 10 AM on the day

    if (dayOf > new Date()) {
      const dayOfJob: ScheduledEmailJob = {
        id: uuidv4(),
        bookingId: booking.id,
        emailType: 'reminder',
        scheduledFor: dayOf,
        priority: EmailPriority.HIGH,
        status: 'scheduled',
        attempts: 0
      };

      reminderJobs.push(dayOfJob);

      const triggerJob: EmailQueueJob = {
        to: customer.email,
        from: `The Backroom Leeds <${context.venue.email}>`,
        subject: 'Booking Reminder - Tonight!',
        html: '',
        text: '',
        priority: EmailPriority.HIGH,
        scheduleAt: dayOf,
        templateName: 'reminder_trigger',
        templateData: { bookingId: booking.id, reminderType: 'day_of' }
      };

      await this.emailQueue.addEmailJob(triggerJob);
    }

    // Store scheduled jobs
    this.scheduledJobs.set(booking.id, reminderJobs);

    console.log(`Scheduled ${reminderJobs.length} reminder emails for booking ${booking.id}`);
  }

  /**
   * Cancel scheduled emails for a booking
   */
  private async cancelScheduledEmails(bookingId: string): Promise<void> {
    const jobs = this.scheduledJobs.get(bookingId);
    if (!jobs) return;

    // Mark jobs as cancelled
    jobs.forEach(job => {
      job.status = 'cancelled';
    });

    // Remove from scheduled jobs
    this.scheduledJobs.delete(bookingId);

    console.log(`Cancelled scheduled emails for booking ${bookingId}`);
  }

  /**
   * Get weather alert for day-of reminders
   */
  private async getWeatherAlert(): Promise<{ condition: string; recommendation: string } | undefined> {
    // This would integrate with a weather API
    // For now, return undefined (no weather alert)
    return undefined;
  }

  /**
   * Get scheduled jobs for a booking
   */
  getScheduledJobs(bookingId: string): ScheduledEmailJob[] {
    return this.scheduledJobs.get(bookingId) || [];
  }

  /**
   * Get all scheduled jobs
   */
  getAllScheduledJobs(): Map<string, ScheduledEmailJob[]> {
    return new Map(this.scheduledJobs);
  }

  /**
   * Update job status
   */
  updateJobStatus(bookingId: string, jobId: string, status: ScheduledEmailJob['status']): void {
    const jobs = this.scheduledJobs.get(bookingId);
    if (jobs) {
      const job = jobs.find(j => j.id === jobId);
      if (job) {
        job.status = status;
        if (status === 'sent' || status === 'failed') {
          job.lastAttempt = new Date();
          job.attempts++;
        }
      }
    }
  }
}

// ============================================================================
// Singleton Instance
// ============================================================================

let bookingWorkflow: BookingEmailWorkflow | null = null;

export function getBookingEmailWorkflow(): BookingEmailWorkflow {
  if (!bookingWorkflow) {
    bookingWorkflow = new BookingEmailWorkflow();
  }
  return bookingWorkflow;
}

// ============================================================================
// Export
// ============================================================================

export default BookingEmailWorkflow;