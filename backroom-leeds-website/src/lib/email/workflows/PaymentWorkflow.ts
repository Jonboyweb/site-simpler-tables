/**
 * Payment Email Workflow
 * 
 * Automated email workflows for payment processing notifications
 * with professional templates and retry mechanisms.
 * 
 * @module PaymentWorkflow
 */

import { getEmailQueue, EmailQueueJob } from '../queue/EmailQueue';
import { EmailPriority } from '../providers/EmailServiceManager';
import { getEmailDeliveryTracker } from '../tracking/DeliveryTracker';
import { render } from '@react-email/render';
import PaymentConfirmationTemplate from '../templates/payment/PaymentConfirmationTemplate';
import PaymentFailureTemplate from '../templates/payment/PaymentFailureTemplate';
import { addDays, format } from 'date-fns';

// ============================================================================
// Types and Interfaces
// ============================================================================

export interface PaymentEmailContext {
  customer: {
    id: string;
    name: string;
    email: string;
    preferences?: {
      emailNotifications: boolean;
      smsNotifications: boolean;
    };
  };
  booking: {
    id: string;
    date: Date;
    timeSlot: string;
    tableName: string;
    floor: string;
    partySize: number;
  };
  payment: {
    id: string;
    type: 'deposit' | 'balance' | 'full_payment' | 'drinks_package';
    amount: number;
    currency: string;
    method: string;
    last4?: string;
    status: 'pending' | 'processing' | 'succeeded' | 'failed' | 'cancelled';
    processedAt?: Date;
    failedAt?: Date;
    transactionId: string;
    receiptUrl?: string;
    errorCode?: string;
    errorMessage?: string;
    retryUrl?: string;
  };
  totals: {
    originalAmount: number;
    totalPaid: number;
    remainingBalance: number;
    drinksPackageAmount?: number;
  };
  drinksPackage?: {
    name: string;
    description: string;
    items: string[];
  };
}

export interface PaymentWorkflowTrigger {
  event: 'payment_succeeded' | 'payment_failed' | 'payment_retry' | 'refund_processed' | 'chargeback_received';
  context: PaymentEmailContext;
  metadata?: {
    triggeredBy: 'stripe' | 'admin' | 'system';
    triggeredAt: Date;
    webhookId?: string;
    urgency?: 'low' | 'medium' | 'high' | 'critical';
    retryAttempt?: number;
  };
}

// ============================================================================
// Payment Email Workflow Manager
// ============================================================================

export class PaymentEmailWorkflow {
  private emailQueue = getEmailQueue();
  private emailTracker = getEmailDeliveryTracker();

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
      console.log('Payment email workflow initialized');
    } catch (error) {
      console.error('Failed to initialize payment email workflow:', error);
    }
  }

  /**
   * Process payment workflow trigger
   */
  async processWorkflowTrigger(trigger: PaymentWorkflowTrigger): Promise<void> {
    console.log(`Processing payment workflow trigger: ${trigger.event} for payment ${trigger.context.payment.id}`);

    try {
      switch (trigger.event) {
        case 'payment_succeeded':
          await this.handlePaymentSucceeded(trigger.context, trigger.metadata);
          break;
        case 'payment_failed':
          await this.handlePaymentFailed(trigger.context, trigger.metadata);
          break;
        case 'payment_retry':
          await this.handlePaymentRetry(trigger.context, trigger.metadata);
          break;
        case 'refund_processed':
          await this.handleRefundProcessed(trigger.context, trigger.metadata);
          break;
        case 'chargeback_received':
          await this.handleChargebackReceived(trigger.context, trigger.metadata);
          break;
        default:
          console.warn(`Unknown payment workflow trigger: ${trigger.event}`);
      }
    } catch (error) {
      console.error(`Failed to process payment workflow trigger ${trigger.event}:`, error);
      throw error;
    }
  }

  /**
   * Handle successful payment
   */
  private async handlePaymentSucceeded(
    context: PaymentEmailContext, 
    metadata?: any
  ): Promise<void> {
    const { customer, booking, payment, totals, drinksPackage } = context;

    // Check customer email preferences
    if (!customer.preferences?.emailNotifications) {
      console.log(`Skipping payment confirmation for ${customer.email} - notifications disabled`);
      return;
    }

    // Get customer consent
    const consent = await this.emailTracker.getCustomerConsent(customer.email);

    const confirmationContext = {
      customerName: customer.name,
      booking: {
        id: booking.id,
        date: booking.date,
        timeSlot: booking.timeSlot,
        tableName: booking.tableName,
        floor: booking.floor,
        partySize: booking.partySize
      },
      payment: {
        id: payment.id,
        type: payment.type,
        amount: payment.amount,
        currency: payment.currency,
        method: payment.method,
        last4: payment.last4,
        processedAt: payment.processedAt || new Date(),
        transactionId: payment.transactionId,
        receiptUrl: payment.receiptUrl
      },
      totals,
      drinksPackage
    };

    const html = render(PaymentConfirmationTemplate(confirmationContext));
    const text = this.generatePaymentConfirmationText(confirmationContext);

    const emailJob: EmailQueueJob = {
      to: customer.email,
      from: 'The Backroom Leeds <bookings@backroomleeds.com>',
      subject: `Payment Confirmed - £${payment.amount} for ${format(booking.date, 'MMMM d')}`,
      html,
      text,
      priority: EmailPriority.HIGH,
      templateName: 'payment_confirmation',
      templateData: confirmationContext,
      trackingEnabled: consent?.trackingConsent.openTracking || false,
      customerConsent: {
        emailTracking: consent?.trackingConsent.openTracking || false,
        marketingEmails: customer.preferences?.emailNotifications || false,
        transactionalEmails: true
      }
    };

    await this.emailQueue.addEmailJob(emailJob);

    console.log(`Payment confirmation sent for payment ${payment.id}`);
  }

  /**
   * Handle failed payment
   */
  private async handlePaymentFailed(
    context: PaymentEmailContext, 
    metadata?: any
  ): Promise<void> {
    const { customer, booking, payment, totals } = context;

    // Check customer email preferences
    if (!customer.preferences?.emailNotifications) {
      console.log(`Skipping payment failure notification for ${customer.email} - notifications disabled`);
      return;
    }

    // Determine urgency based on booking date
    const hoursUntilBooking = Math.floor(
      (booking.date.getTime() - Date.now()) / (1000 * 60 * 60)
    );

    let riskLevel: 'low' | 'medium' | 'high' | 'critical';
    let isUrgent = false;

    if (hoursUntilBooking <= 24) {
      riskLevel = 'critical';
      isUrgent = true;
    } else if (hoursUntilBooking <= 48) {
      riskLevel = 'high';
      isUrgent = true;
    } else if (hoursUntilBooking <= 72) {
      riskLevel = 'medium';
    } else {
      riskLevel = 'low';
    }

    // Get customer consent
    const consent = await this.emailTracker.getCustomerConsent(customer.email);

    const failureContext = {
      customerName: customer.name,
      booking: {
        id: booking.id,
        date: booking.date,
        timeSlot: booking.timeSlot,
        tableName: booking.tableName,
        floor: booking.floor,
        partySize: booking.partySize
      },
      payment: {
        id: payment.id,
        type: payment.type,
        attemptedAmount: payment.amount,
        currency: payment.currency,
        method: payment.method,
        last4: payment.last4,
        failedAt: payment.failedAt || new Date(),
        errorCode: payment.errorCode,
        errorMessage: payment.errorMessage || 'Payment processing failed',
        retryUrl: payment.retryUrl || `https://backroomleeds.com/bookings/${booking.id}/payment`
      },
      totals,
      urgency: {
        isUrgent,
        hoursUntilBooking,
        deadlineDate: addDays(new Date(), 1), // Payment deadline
        riskLevel
      }
    };

    const html = render(PaymentFailureTemplate(failureContext));
    const text = this.generatePaymentFailureText(failureContext);

    const priority = isUrgent ? EmailPriority.CRITICAL : EmailPriority.HIGH;

    const emailJob: EmailQueueJob = {
      to: customer.email,
      from: 'The Backroom Leeds <bookings@backroomleeds.com>',
      subject: `${isUrgent ? 'URGENT: ' : ''}Payment Failed - Action Required`,
      html,
      text,
      priority,
      templateName: 'payment_failure',
      templateData: failureContext,
      trackingEnabled: consent?.trackingConsent.openTracking || false,
      customerConsent: {
        emailTracking: consent?.trackingConsent.openTracking || false,
        marketingEmails: customer.preferences?.emailNotifications || false,
        transactionalEmails: true
      }
    };

    await this.emailQueue.addEmailJob(emailJob);

    // Schedule follow-up emails for urgent payments
    if (isUrgent && hoursUntilBooking > 12) {
      await this.schedulePaymentFollowUp(context, metadata);
    }

    console.log(`Payment failure notification sent for payment ${payment.id} (${riskLevel} urgency)`);
  }

  /**
   * Handle payment retry attempt
   */
  private async handlePaymentRetry(
    context: PaymentEmailContext, 
    metadata?: any
  ): Promise<void> {
    const { customer, payment } = context;
    
    const retryAttempt = metadata?.retryAttempt || 1;

    // Only send retry notifications for critical failures
    if (retryAttempt > 3 || !metadata?.urgency || metadata.urgency !== 'critical') {
      return;
    }

    console.log(`Processing payment retry ${retryAttempt} for payment ${payment.id}`);

    // If retry also fails, send another failure notification
    if (payment.status === 'failed') {
      await this.handlePaymentFailed(context, {
        ...metadata,
        retryAttempt
      });
    }
  }

  /**
   * Handle refund processing
   */
  private async handleRefundProcessed(
    context: PaymentEmailContext, 
    metadata?: any
  ): Promise<void> {
    const { customer, booking, payment } = context;

    // Check customer email preferences
    if (!customer.preferences?.emailNotifications) {
      console.log(`Skipping refund notification for ${customer.email} - notifications disabled`);
      return;
    }

    // Get customer consent
    const consent = await this.emailTracker.getCustomerConsent(customer.email);

    // Create refund confirmation context
    const refundContext = {
      customerName: customer.name,
      booking: {
        id: booking.id,
        date: booking.date,
        timeSlot: booking.timeSlot,
        tableName: booking.tableName,
        floor: booking.floor,
        partySize: booking.partySize,
        originalAmount: context.totals.originalAmount,
        depositPaid: payment.amount
      },
      refund: {
        eligible: true,
        amount: payment.amount,
        processedAt: new Date(),
        estimatedRefundDate: addDays(new Date(), 5),
        refundReference: `REF-${payment.transactionId.substring(0, 8).toUpperCase()}`
      },
      cancellation: {
        cancelledAt: new Date(),
        hoursBeforeEvent: Math.floor((booking.date.getTime() - Date.now()) / (1000 * 60 * 60)),
        reason: 'Customer requested refund'
      }
    };

    const html = render(PaymentConfirmationTemplate({
      customerName: customer.name,
      booking,
      payment: {
        ...payment,
        type: 'refund' as any,
        amount: -payment.amount // Negative amount for refund
      },
      totals: context.totals
    }));

    const text = `Your refund of £${payment.amount} has been processed and will appear in your account within 3-5 business days. Reference: REF-${payment.transactionId.substring(0, 8).toUpperCase()}`;

    const emailJob: EmailQueueJob = {
      to: customer.email,
      from: 'The Backroom Leeds <bookings@backroomleeds.com>',
      subject: `Refund Processed - £${payment.amount}`,
      html,
      text,
      priority: EmailPriority.NORMAL,
      templateName: 'refund_confirmation',
      templateData: refundContext,
      trackingEnabled: consent?.trackingConsent.openTracking || false,
      customerConsent: {
        emailTracking: consent?.trackingConsent.openTracking || false,
        marketingEmails: customer.preferences?.emailNotifications || false,
        transactionalEmails: true
      }
    };

    await this.emailQueue.addEmailJob(emailJob);

    console.log(`Refund confirmation sent for payment ${payment.id}`);
  }

  /**
   * Handle chargeback received
   */
  private async handleChargebackReceived(
    context: PaymentEmailContext, 
    metadata?: any
  ): Promise<void> {
    const { customer, booking, payment } = context;

    // Chargebacks are serious - always send notification
    const consent = await this.emailTracker.getCustomerConsent(customer.email);

    const chargebackContext = {
      customerName: customer.name,
      booking,
      payment,
      chargebackAmount: payment.amount,
      chargebackDate: new Date(),
      chargebackReason: metadata?.reason || 'Chargeback initiated by card issuer',
      nextSteps: [
        'We will investigate this chargeback',
        'Please contact us if you did not initiate this dispute',
        'Resolution typically takes 7-14 business days'
      ]
    };

    // Use payment failure template adapted for chargeback
    const html = render(PaymentFailureTemplate({
      ...context,
      payment: {
        ...payment,
        errorMessage: `A chargeback has been initiated for this payment. Amount: £${payment.amount}`,
        retryUrl: 'https://backroomleeds.com/contact'
      },
      urgency: {
        isUrgent: true,
        riskLevel: 'high'
      }
    } as any));

    const text = `A chargeback has been initiated for your payment of £${payment.amount}. Please contact us immediately if you did not request this dispute.`;

    const emailJob: EmailQueueJob = {
      to: customer.email,
      from: 'The Backroom Leeds <bookings@backroomleeds.com>',
      subject: `URGENT: Chargeback Notice - £${payment.amount}`,
      html,
      text,
      priority: EmailPriority.CRITICAL,
      templateName: 'chargeback_notice',
      templateData: chargebackContext,
      trackingEnabled: consent?.trackingConsent.openTracking || false,
      customerConsent: {
        emailTracking: consent?.trackingConsent.openTracking || false,
        marketingEmails: false,
        transactionalEmails: true
      }
    };

    await this.emailQueue.addEmailJob(emailJob);

    console.log(`Chargeback notice sent for payment ${payment.id}`);
  }

  /**
   * Schedule payment follow-up emails for urgent cases
   */
  private async schedulePaymentFollowUp(
    context: PaymentEmailContext, 
    metadata?: any
  ): Promise<void> {
    const { customer, booking, payment } = context;

    // Schedule follow-up in 6 hours if still urgent
    const followUpTime = new Date(Date.now() + 6 * 60 * 60 * 1000);
    const hoursUntilBooking = Math.floor(
      (booking.date.getTime() - followUpTime.getTime()) / (1000 * 60 * 60)
    );

    if (hoursUntilBooking <= 0) {
      return; // Booking has passed
    }

    const consent = await this.emailTracker.getCustomerConsent(customer.email);

    const followUpJob: EmailQueueJob = {
      to: customer.email,
      from: 'The Backroom Leeds <bookings@backroomleeds.com>',
      subject: `FINAL REMINDER: Payment Required for Tonight's Booking`,
      html: '', // Would use a simplified failure template
      text: `This is a final reminder that payment is still required for your booking tonight at ${booking.timeSlot}. Please complete payment immediately to secure your table.`,
      priority: EmailPriority.CRITICAL,
      scheduleAt: followUpTime,
      templateName: 'payment_final_reminder',
      templateData: context,
      trackingEnabled: consent?.trackingConsent.openTracking || false,
      customerConsent: {
        emailTracking: consent?.trackingConsent.openTracking || false,
        marketingEmails: false,
        transactionalEmails: true
      }
    };

    await this.emailQueue.addEmailJob(followUpJob);

    console.log(`Scheduled payment follow-up for payment ${payment.id}`);
  }

  /**
   * Generate payment confirmation text
   */
  private generatePaymentConfirmationText(context: any): string {
    const { customerName, booking, payment, totals } = context;
    
    let text = `Dear ${customerName},\n\n`;
    text += `Your payment has been confirmed!\n\n`;
    text += `Payment Details:\n`;
    text += `Amount: ${payment.currency.toUpperCase()} ${payment.amount}\n`;
    text += `Transaction ID: ${payment.transactionId}\n`;
    text += `Date: ${format(payment.processedAt, 'dd/MM/yyyy HH:mm')}\n\n`;
    text += `Booking Details:\n`;
    text += `Date: ${format(booking.date, 'EEEE, MMMM d, yyyy')}\n`;
    text += `Time: ${booking.timeSlot}\n`;
    text += `Table: ${booking.tableName}\n`;
    text += `Party Size: ${booking.partySize} guests\n\n`;
    
    if (totals.remainingBalance > 0) {
      text += `Outstanding Balance: £${totals.remainingBalance}\n`;
      text += `This balance is due upon arrival at the venue.\n\n`;
    } else {
      text += `Your booking is fully paid. Just arrive and enjoy!\n\n`;
    }
    
    text += `Questions? Contact us at bookings@backroomleeds.com or call 0113 245 1234\n\n`;
    text += `The Backroom Leeds\n`;
    text += `Lower Briggate, Leeds LS1 6LY`;
    
    return text;
  }

  /**
   * Generate payment failure text
   */
  private generatePaymentFailureText(context: any): string {
    const { customerName, booking, payment, urgency } = context;
    
    let text = `Dear ${customerName},\n\n`;
    
    if (urgency.isUrgent) {
      text += `URGENT: We were unable to process your payment for tonight's booking.\n\n`;
    } else {
      text += `We were unable to process your payment for your upcoming booking.\n\n`;
    }
    
    text += `Payment Details:\n`;
    text += `Amount: ${payment.currency.toUpperCase()} ${payment.attemptedAmount}\n`;
    text += `Error: ${payment.errorMessage}\n`;
    text += `Failed At: ${format(payment.failedAt, 'dd/MM/yyyy HH:mm')}\n\n`;
    
    text += `Booking Details:\n`;
    text += `Date: ${format(booking.date, 'EEEE, MMMM d, yyyy')}\n`;
    text += `Time: ${booking.timeSlot}\n`;
    text += `Table: ${booking.tableName}\n\n`;
    
    if (urgency.hoursUntilBooking <= 24) {
      text += `Your booking is in ${urgency.hoursUntilBooking} hours. Please retry your payment immediately to secure your table.\n\n`;
    }
    
    text += `To retry your payment, visit: ${payment.retryUrl}\n\n`;
    text += `Need help? Contact us immediately:\n`;
    text += `Email: bookings@backroomleeds.com\n`;
    text += `Phone: 0113 245 1234\n\n`;
    text += `Quote your booking reference: ${booking.id}`;
    
    return text;
  }
}

// ============================================================================
// Singleton Instance
// ============================================================================

let paymentWorkflow: PaymentEmailWorkflow | null = null;

export function getPaymentEmailWorkflow(): PaymentEmailWorkflow {
  if (!paymentWorkflow) {
    paymentWorkflow = new PaymentEmailWorkflow();
  }
  return paymentWorkflow;
}

// ============================================================================
// Export
// ============================================================================

export default PaymentEmailWorkflow;