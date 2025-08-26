/**
 * The Backroom Leeds - Report Recipient Manager
 * Version: 1.0.0
 * Phase: 3, Step 3.5
 * 
 * Comprehensive recipient and subscription management system
 */

import { createClient } from '@/lib/supabase/server';
import { 
  ReportRecipient, 
  ReportSubscription, 
  ReportType,
  ReportFormat,
  DeliveryChannel,
  type SubscribeToReportRequest,
  type SubscribeToReportResponse
} from '@/types/reporting';

// ============================================================================
// RECIPIENT MANAGER CLASS
// ============================================================================

export class RecipientManager {
  private supabase = createClient();

  // ============================================================================
  // RECIPIENT MANAGEMENT
  // ============================================================================

  async createRecipient(data: {
    userId?: string;
    email: string;
    name?: string;
    phone?: string;
    role?: string;
    timezone?: string;
    languageCode?: string;
    preferredChannels?: DeliveryChannel[];
    preferredFormat?: ReportFormat;
  }): Promise<string | null> {
    try {
      // Check if recipient already exists
      const { data: existing } = await this.supabase
        .from('report_recipients')
        .select('id')
        .eq('email', data.email)
        .single();

      if (existing) {
        throw new Error('Recipient with this email already exists');
      }

      const { data: recipient, error } = await this.supabase
        .from('report_recipients')
        .insert({
          user_id: data.userId,
          email: data.email,
          name: data.name,
          phone: data.phone,
          role: data.role || 'stakeholder',
          timezone: data.timezone || 'Europe/London',
          language_code: data.languageCode || 'en',
          preferred_channels: data.preferredChannels || [DeliveryChannel.EMAIL],
          preferred_format: data.preferredFormat || ReportFormat.PDF,
          is_active: true,
          email_verified: false,
          bounced_count: 0
        })
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to create recipient: ${error.message}`);
      }

      // Send verification email
      await this.sendVerificationEmail(recipient.id, data.email);

      return recipient.id;

    } catch (error) {
      console.error('Error creating recipient:', error);
      throw error;
    }
  }

  async updateRecipient(
    recipientId: string,
    updates: Partial<ReportRecipient>
  ): Promise<boolean> {
    try {
      const { error } = await this.supabase
        .from('report_recipients')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', recipientId);

      if (error) {
        throw new Error(`Failed to update recipient: ${error.message}`);
      }

      return true;
    } catch (error) {
      console.error('Error updating recipient:', error);
      return false;
    }
  }

  async getRecipient(recipientId: string): Promise<ReportRecipient | null> {
    try {
      const { data: recipient, error } = await this.supabase
        .from('report_recipients')
        .select('*')
        .eq('id', recipientId)
        .single();

      if (error) {
        console.error('Error getting recipient:', error);
        return null;
      }

      return recipient;
    } catch (error) {
      console.error('Error in getRecipient:', error);
      return null;
    }
  }

  async getRecipientByEmail(email: string): Promise<ReportRecipient | null> {
    try {
      const { data: recipient, error } = await this.supabase
        .from('report_recipients')
        .select('*')
        .eq('email', email)
        .single();

      if (error) {
        return null;
      }

      return recipient;
    } catch (error) {
      console.error('Error in getRecipientByEmail:', error);
      return null;
    }
  }

  async listRecipients(
    filters: {
      role?: string;
      isActive?: boolean;
      emailVerified?: boolean;
    } = {},
    pagination: {
      page?: number;
      pageSize?: number;
    } = {}
  ): Promise<{
    recipients: ReportRecipient[];
    totalCount: number;
    page: number;
    totalPages: number;
  }> {
    try {
      let query = this.supabase.from('report_recipients').select('*', { count: 'exact' });

      // Apply filters
      if (filters.role) {
        query = query.eq('role', filters.role);
      }
      if (filters.isActive !== undefined) {
        query = query.eq('is_active', filters.isActive);
      }
      if (filters.emailVerified !== undefined) {
        query = query.eq('email_verified', filters.emailVerified);
      }

      // Apply pagination
      const page = pagination.page || 1;
      const pageSize = pagination.pageSize || 50;
      const offset = (page - 1) * pageSize;

      query = query
        .order('created_at', { ascending: false })
        .range(offset, offset + pageSize - 1);

      const { data: recipients, error, count } = await query;

      if (error) {
        throw new Error(`Failed to list recipients: ${error.message}`);
      }

      const totalCount = count || 0;
      const totalPages = Math.ceil(totalCount / pageSize);

      return {
        recipients: recipients || [],
        totalCount,
        page,
        totalPages
      };

    } catch (error) {
      console.error('Error listing recipients:', error);
      return {
        recipients: [],
        totalCount: 0,
        page: 1,
        totalPages: 0
      };
    }
  }

  async deactivateRecipient(recipientId: string): Promise<boolean> {
    try {
      // Deactivate recipient
      const { error: recipientError } = await this.supabase
        .from('report_recipients')
        .update({
          is_active: false,
          updated_at: new Date().toISOString()
        })
        .eq('id', recipientId);

      if (recipientError) {
        throw new Error(`Failed to deactivate recipient: ${recipientError.message}`);
      }

      // Deactivate all subscriptions
      const { error: subscriptionError } = await this.supabase
        .from('report_subscriptions')
        .update({
          is_active: false,
          updated_at: new Date().toISOString()
        })
        .eq('recipient_id', recipientId);

      if (subscriptionError) {
        console.error('Error deactivating subscriptions:', subscriptionError);
      }

      return true;
    } catch (error) {
      console.error('Error deactivating recipient:', error);
      return false;
    }
  }

  // ============================================================================
  // EMAIL VERIFICATION
  // ============================================================================

  private async sendVerificationEmail(recipientId: string, email: string): Promise<void> {
    try {
      // Generate verification token (in a real implementation, this would be more secure)
      const verificationToken = `${recipientId}-${Date.now()}-${Math.random().toString(36).substring(2)}`;
      
      // Store token in database (you'd need to add a verification_token column)
      await this.supabase
        .from('report_recipients')
        .update({
          verification_token: verificationToken,
          updated_at: new Date().toISOString()
        })
        .eq('id', recipientId);

      // In a real implementation, send verification email here
      console.log(`Verification email would be sent to ${email} with token ${verificationToken}`);

    } catch (error) {
      console.error('Error sending verification email:', error);
    }
  }

  async verifyEmail(recipientId: string, verificationToken: string): Promise<boolean> {
    try {
      const { data: recipient, error } = await this.supabase
        .from('report_recipients')
        .select('verification_token')
        .eq('id', recipientId)
        .single();

      if (error || !recipient || recipient.verification_token !== verificationToken) {
        return false;
      }

      // Mark email as verified
      const { error: updateError } = await this.supabase
        .from('report_recipients')
        .update({
          email_verified: true,
          verification_token: null,
          updated_at: new Date().toISOString()
        })
        .eq('id', recipientId);

      return !updateError;
    } catch (error) {
      console.error('Error verifying email:', error);
      return false;
    }
  }

  // ============================================================================
  // SUBSCRIPTION MANAGEMENT
  // ============================================================================

  async subscribeToReport(request: SubscribeToReportRequest): Promise<SubscribeToReportResponse> {
    try {
      // Get or create recipient
      let recipient = await this.getRecipientByEmail(request.recipientEmail);
      
      if (!recipient) {
        const recipientId = await this.createRecipient({
          email: request.recipientEmail,
          preferredFormat: request.deliveryFormat,
          preferredChannels: request.deliveryChannels
        });
        
        if (!recipientId) {
          throw new Error('Failed to create recipient');
        }

        recipient = await this.getRecipient(recipientId);
        if (!recipient) {
          throw new Error('Failed to retrieve created recipient');
        }
      }

      // Check if subscription already exists
      const { data: existingSub } = await this.supabase
        .from('report_subscriptions')
        .select('id, is_active')
        .eq('recipient_id', recipient.id)
        .eq('template_id', request.templateId)
        .single();

      if (existingSub) {
        if (existingSub.is_active) {
          throw new Error('Subscription already exists and is active');
        } else {
          // Reactivate existing subscription
          const { error } = await this.supabase
            .from('report_subscriptions')
            .update({
              is_active: true,
              delivery_channels: request.deliveryChannels,
              delivery_format: request.deliveryFormat,
              custom_schedule: request.customSchedule,
              filter_config: request.filters || {},
              updated_at: new Date().toISOString()
            })
            .eq('id', existingSub.id);

          if (error) {
            throw new Error(`Failed to reactivate subscription: ${error.message}`);
          }

          return {
            subscriptionId: existingSub.id,
            status: recipient.emailVerified ? 'active' : 'pending_verification',
            nextDeliveryAt: await this.calculateNextDelivery(request.templateId, request.customSchedule)
          };
        }
      }

      // Create new subscription
      const nextDeliveryAt = await this.calculateNextDelivery(request.templateId, request.customSchedule);

      const { data: subscription, error } = await this.supabase
        .from('report_subscriptions')
        .insert({
          recipient_id: recipient.id,
          template_id: request.templateId,
          delivery_channels: request.deliveryChannels,
          delivery_format: request.deliveryFormat,
          custom_schedule: request.customSchedule,
          filter_config: request.filters || {},
          custom_parameters: {},
          is_active: true,
          next_delivery_at: nextDeliveryAt?.toISOString()
        })
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to create subscription: ${error.message}`);
      }

      return {
        subscriptionId: subscription.id,
        status: recipient.emailVerified ? 'active' : 'pending_verification',
        nextDeliveryAt
      };

    } catch (error) {
      console.error('Error subscribing to report:', error);
      throw error;
    }
  }

  async unsubscribeFromReport(subscriptionId: string): Promise<boolean> {
    try {
      const { error } = await this.supabase
        .from('report_subscriptions')
        .update({
          is_active: false,
          updated_at: new Date().toISOString()
        })
        .eq('id', subscriptionId);

      if (error) {
        throw new Error(`Failed to unsubscribe: ${error.message}`);
      }

      return true;
    } catch (error) {
      console.error('Error unsubscribing from report:', error);
      return false;
    }
  }

  async unsubscribeByEmail(email: string, templateId?: string): Promise<boolean> {
    try {
      const recipient = await this.getRecipientByEmail(email);
      if (!recipient) {
        return false;
      }

      let query = this.supabase
        .from('report_subscriptions')
        .update({
          is_active: false,
          updated_at: new Date().toISOString()
        })
        .eq('recipient_id', recipient.id);

      if (templateId) {
        query = query.eq('template_id', templateId);
      }

      const { error } = await query;

      return !error;
    } catch (error) {
      console.error('Error unsubscribing by email:', error);
      return false;
    }
  }

  async getSubscription(subscriptionId: string): Promise<ReportSubscription | null> {
    try {
      const { data: subscription, error } = await this.supabase
        .from('report_subscriptions')
        .select(`
          *,
          report_recipients (*),
          report_templates (*)
        `)
        .eq('id', subscriptionId)
        .single();

      if (error) {
        console.error('Error getting subscription:', error);
        return null;
      }

      return subscription;
    } catch (error) {
      console.error('Error in getSubscription:', error);
      return null;
    }
  }

  async listSubscriptions(
    filters: {
      recipientId?: string;
      templateId?: string;
      isActive?: boolean;
    } = {},
    pagination: {
      page?: number;
      pageSize?: number;
    } = {}
  ): Promise<{
    subscriptions: ReportSubscription[];
    totalCount: number;
    page: number;
    totalPages: number;
  }> {
    try {
      let query = this.supabase
        .from('report_subscriptions')
        .select(`
          *,
          report_recipients (email, name, role),
          report_templates (name, report_type)
        `, { count: 'exact' });

      // Apply filters
      if (filters.recipientId) {
        query = query.eq('recipient_id', filters.recipientId);
      }
      if (filters.templateId) {
        query = query.eq('template_id', filters.templateId);
      }
      if (filters.isActive !== undefined) {
        query = query.eq('is_active', filters.isActive);
      }

      // Apply pagination
      const page = pagination.page || 1;
      const pageSize = pagination.pageSize || 50;
      const offset = (page - 1) * pageSize;

      query = query
        .order('created_at', { ascending: false })
        .range(offset, offset + pageSize - 1);

      const { data: subscriptions, error, count } = await query;

      if (error) {
        throw new Error(`Failed to list subscriptions: ${error.message}`);
      }

      const totalCount = count || 0;
      const totalPages = Math.ceil(totalCount / pageSize);

      return {
        subscriptions: subscriptions || [],
        totalCount,
        page,
        totalPages
      };

    } catch (error) {
      console.error('Error listing subscriptions:', error);
      return {
        subscriptions: [],
        totalCount: 0,
        page: 1,
        totalPages: 0
      };
    }
  }

  async pauseSubscription(
    subscriptionId: string, 
    pauseUntil?: Date
  ): Promise<boolean> {
    try {
      const { error } = await this.supabase
        .from('report_subscriptions')
        .update({
          paused_until: pauseUntil?.toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', subscriptionId);

      return !error;
    } catch (error) {
      console.error('Error pausing subscription:', error);
      return false;
    }
  }

  async resumeSubscription(subscriptionId: string): Promise<boolean> {
    try {
      const { error } = await this.supabase
        .from('report_subscriptions')
        .update({
          paused_until: null,
          updated_at: new Date().toISOString()
        })
        .eq('id', subscriptionId);

      return !error;
    } catch (error) {
      console.error('Error resuming subscription:', error);
      return false;
    }
  }

  // ============================================================================
  // DELIVERY SCHEDULING
  // ============================================================================

  async getSubscriptionsDueForDelivery(): Promise<ReportSubscription[]> {
    try {
      const now = new Date();
      
      const { data: subscriptions, error } = await this.supabase
        .from('report_subscriptions')
        .select(`
          *,
          report_recipients (*),
          report_templates (*)
        `)
        .eq('is_active', true)
        .or(`paused_until.is.null,paused_until.lt.${now.toISOString()}`)
        .lt('next_delivery_at', now.toISOString())
        .eq('report_recipients.is_active', true)
        .eq('report_recipients.email_verified', true);

      if (error) {
        throw new Error(`Failed to get due subscriptions: ${error.message}`);
      }

      return subscriptions || [];
    } catch (error) {
      console.error('Error getting subscriptions due for delivery:', error);
      return [];
    }
  }

  async updateNextDeliveryTime(
    subscriptionId: string,
    nextDeliveryAt: Date
  ): Promise<boolean> {
    try {
      const { error } = await this.supabase
        .from('report_subscriptions')
        .update({
          next_delivery_at: nextDeliveryAt.toISOString(),
          last_delivered_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', subscriptionId);

      return !error;
    } catch (error) {
      console.error('Error updating next delivery time:', error);
      return false;
    }
  }

  private async calculateNextDelivery(
    templateId: string,
    customSchedule?: string
  ): Promise<Date | undefined> {
    try {
      // Get template schedule
      const { data: template } = await this.supabase
        .from('report_templates')
        .select('template_config')
        .eq('id', templateId)
        .single();

      const schedule = customSchedule || template?.template_config?.schedule;
      
      if (!schedule) {
        return undefined;
      }

      // Parse cron expression and calculate next execution time
      // This is a simplified implementation - in production, use a proper cron parser
      const now = new Date();
      
      if (schedule === '0 22 * * *') { // Daily at 10pm
        const next = new Date(now);
        next.setHours(22, 0, 0, 0);
        if (next <= now) {
          next.setDate(next.getDate() + 1);
        }
        return next;
      }
      
      if (schedule === '0 9 * * 1') { // Monday at 9am
        const next = new Date(now);
        next.setHours(9, 0, 0, 0);
        const daysUntilMonday = (1 - next.getDay() + 7) % 7 || 7;
        next.setDate(next.getDate() + daysUntilMonday);
        return next;
      }

      // Default to next hour
      const next = new Date(now);
      next.setHours(next.getHours() + 1, 0, 0, 0);
      return next;

    } catch (error) {
      console.error('Error calculating next delivery:', error);
      return undefined;
    }
  }

  // ============================================================================
  // BOUNCE AND COMPLAINT HANDLING
  // ============================================================================

  async recordEmailBounce(
    recipientId: string,
    bounceType: 'hard' | 'soft',
    bounceReason?: string
  ): Promise<void> {
    try {
      const recipient = await this.getRecipient(recipientId);
      if (!recipient) return;

      const newBounceCount = recipient.bouncedCount + 1;

      // Update bounce count
      await this.supabase
        .from('report_recipients')
        .update({
          bounced_count: newBounceCount,
          updated_at: new Date().toISOString()
        })
        .eq('id', recipientId);

      // Deactivate recipient if too many bounces
      if (bounceType === 'hard' || newBounceCount >= 5) {
        await this.deactivateRecipient(recipientId);
        console.log(`Deactivated recipient ${recipientId} due to bounces`);
      }

    } catch (error) {
      console.error('Error recording email bounce:', error);
    }
  }

  async recordEmailComplaint(recipientId: string): Promise<void> {
    try {
      // Immediately deactivate recipient on complaint
      await this.deactivateRecipient(recipientId);
      console.log(`Deactivated recipient ${recipientId} due to complaint`);
    } catch (error) {
      console.error('Error recording email complaint:', error);
    }
  }

  // ============================================================================
  // BULK OPERATIONS
  // ============================================================================

  async bulkSubscribe(
    requests: SubscribeToReportRequest[]
  ): Promise<SubscribeToReportResponse[]> {
    const results: SubscribeToReportResponse[] = [];

    for (const request of requests) {
      try {
        const result = await this.subscribeToReport(request);
        results.push(result);
      } catch (error) {
        results.push({
          subscriptionId: '',
          status: 'active',
          // Add error details in a real implementation
        });
      }
    }

    return results;
  }

  async cleanupInactiveRecipients(daysInactive: number = 90): Promise<number> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysInactive);

      const { data: deleted, error } = await this.supabase
        .from('report_recipients')
        .delete()
        .eq('is_active', false)
        .lt('updated_at', cutoffDate.toISOString())
        .select('id');

      if (error) {
        throw new Error(`Failed to cleanup recipients: ${error.message}`);
      }

      return deleted?.length || 0;
    } catch (error) {
      console.error('Error cleaning up inactive recipients:', error);
      return 0;
    }
  }
}

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

let recipientManagerInstance: RecipientManager | null = null;

export const getRecipientManager = (): RecipientManager => {
  if (!recipientManagerInstance) {
    recipientManagerInstance = new RecipientManager();
  }
  return recipientManagerInstance;
};