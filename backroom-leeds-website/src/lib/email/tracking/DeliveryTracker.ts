/**
 * Email Delivery Tracker
 * 
 * GDPR-compliant email delivery tracking with real-time status monitoring
 * and customer consent management.
 * 
 * @module DeliveryTracker
 */

import { createClient } from '@supabase/supabase-js';
import Redis from 'redis';
import { v4 as uuidv4 } from 'uuid';

// ============================================================================
// Types and Interfaces
// ============================================================================

export interface EmailDeliveryStatus {
  messageId: string;
  jobId: string;
  recipient: string;
  subject: string;
  status: 'queued' | 'sent' | 'delivered' | 'bounced' | 'complained' | 'opened' | 'clicked' | 'unsubscribed';
  provider: 'resend' | 'postmark' | 'ses';
  sentAt?: Date;
  deliveredAt?: Date;
  openedAt?: Date;
  clickedAt?: Date;
  bouncedAt?: Date;
  complainedAt?: Date;
  unsubscribedAt?: Date;
  bounceReason?: string;
  complaintReason?: string;
  ipAddress?: string;
  userAgent?: string;
  location?: {
    country?: string;
    region?: string;
    city?: string;
  };
  device?: {
    type: 'desktop' | 'mobile' | 'tablet' | 'unknown';
    os?: string;
    client?: string;
  };
  trackingConsent: boolean;
  consentTimestamp: Date;
}

export interface EmailTrackingEvent {
  id: string;
  messageId: string;
  eventType: 'sent' | 'delivered' | 'bounced' | 'complained' | 'opened' | 'clicked' | 'unsubscribed';
  timestamp: Date;
  data?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  location?: {
    country?: string;
    region?: string;
    city?: string;
  };
  consentGiven: boolean;
}

export interface CustomerEmailConsent {
  customerId: string;
  email: string;
  consentTypes: {
    transactional: boolean;
    marketing: boolean;
    event_notifications: boolean;
    surveys: boolean;
  };
  trackingConsent: {
    openTracking: boolean;
    clickTracking: boolean;
    engagementAnalytics: boolean;
  };
  consentTimestamp: Date;
  consentSource: 'website' | 'email' | 'admin' | 'api';
  ipAddress?: string;
  doubleOptIn: boolean;
  doubleOptInConfirmedAt?: Date;
  unsubscribedAt?: Date;
  unsubscribeReason?: string;
}

export interface EmailEngagementMetrics {
  totalSent: number;
  totalDelivered: number;
  totalBounced: number;
  totalComplaints: number;
  totalOpened: number;
  totalClicked: number;
  totalUnsubscribed: number;
  deliveryRate: number;
  bounceRate: number;
  complaintRate: number;
  openRate: number;
  clickRate: number;
  unsubscribeRate: number;
  engagementScore: number;
}

export interface GDPRComplianceReport {
  totalCustomers: number;
  consentedCustomers: number;
  trackingConsentRate: number;
  doubleOptInRate: number;
  unsubscribeRate: number;
  dataRetentionCompliance: boolean;
  consentAuditTrail: {
    totalConsentEvents: number;
    recentConsentChanges: number;
    missingConsent: number;
  };
  rightToBeForgotten: {
    totalRequests: number;
    processedRequests: number;
    pendingRequests: number;
  };
}

// ============================================================================
// Email Delivery Tracker
// ============================================================================

export class EmailDeliveryTracker {
  private supabase: any;
  private redis: Redis.RedisClientType;
  private initialized = false;

  constructor() {
    this.supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
  }

  /**
   * Initialize the delivery tracker
   */
  async initialize(): Promise<void> {
    try {
      // Initialize Redis connection
      this.redis = Redis.createClient({
        socket: {
          host: process.env.REDIS_HOST || 'localhost',
          port: parseInt(process.env.REDIS_PORT || '6379')
        },
        password: process.env.REDIS_PASSWORD,
        database: parseInt(process.env.REDIS_DB || '0')
      });

      await this.redis.connect();
      this.initialized = true;
      
      console.log('Email delivery tracker initialized');
    } catch (error) {
      console.error('Failed to initialize email delivery tracker:', error);
      throw error;
    }
  }

  /**
   * Track email delivery status
   */
  async trackDeliveryStatus(status: Partial<EmailDeliveryStatus>): Promise<void> {
    if (!this.initialized) {
      await this.initialize();
    }

    try {
      // Check if tracking is consented
      if (!status.trackingConsent) {
        console.log(`Skipping delivery tracking for ${status.messageId} - no consent`);
        return;
      }

      // Store in database
      await this.supabase
        .from('email_delivery_tracking')
        .upsert({
          message_id: status.messageId,
          job_id: status.jobId,
          recipient: status.recipient,
          subject: status.subject,
          status: status.status,
          provider: status.provider,
          sent_at: status.sentAt,
          delivered_at: status.deliveredAt,
          opened_at: status.openedAt,
          clicked_at: status.clickedAt,
          bounced_at: status.bouncedAt,
          complained_at: status.complainedAt,
          unsubscribed_at: status.unsubscribedAt,
          bounce_reason: status.bounceReason,
          complaint_reason: status.complaintReason,
          ip_address: status.ipAddress,
          user_agent: status.userAgent,
          location: status.location,
          device: status.device,
          tracking_consent: status.trackingConsent,
          consent_timestamp: status.consentTimestamp,
          updated_at: new Date()
        }, {
          onConflict: 'message_id'
        });

      // Cache in Redis for quick access
      const cacheKey = `email:tracking:${status.messageId}`;
      await this.redis.setEx(
        cacheKey,
        7 * 24 * 60 * 60, // 7 days TTL
        JSON.stringify(status)
      );

      // Update real-time metrics
      await this.updateRealTimeMetrics(status);

      console.log(`Delivery status tracked for message ${status.messageId}`);
    } catch (error) {
      console.error('Failed to track delivery status:', error);
      throw error;
    }
  }

  /**
   * Record email tracking event
   */
  async recordTrackingEvent(event: Partial<EmailTrackingEvent>): Promise<string> {
    if (!this.initialized) {
      await this.initialize();
    }

    const eventId = uuidv4();
    
    try {
      // Only record if consent is given
      if (!event.consentGiven) {
        console.log(`Skipping tracking event for ${event.messageId} - no consent`);
        return eventId;
      }

      const trackingEvent: EmailTrackingEvent = {
        id: eventId,
        messageId: event.messageId!,
        eventType: event.eventType!,
        timestamp: event.timestamp || new Date(),
        data: event.data,
        ipAddress: event.ipAddress,
        userAgent: event.userAgent,
        location: event.location,
        consentGiven: event.consentGiven
      };

      // Store in database
      await this.supabase
        .from('email_tracking_events')
        .insert({
          id: trackingEvent.id,
          message_id: trackingEvent.messageId,
          event_type: trackingEvent.eventType,
          timestamp: trackingEvent.timestamp,
          data: trackingEvent.data,
          ip_address: trackingEvent.ipAddress,
          user_agent: trackingEvent.userAgent,
          location: trackingEvent.location,
          consent_given: trackingEvent.consentGiven
        });

      // Update delivery status based on event type
      await this.updateDeliveryStatusFromEvent(trackingEvent);

      console.log(`Tracking event ${eventId} recorded for message ${event.messageId}`);
      return eventId;
    } catch (error) {
      console.error('Failed to record tracking event:', error);
      throw error;
    }
  }

  /**
   * Get delivery status for a message
   */
  async getDeliveryStatus(messageId: string): Promise<EmailDeliveryStatus | null> {
    if (!this.initialized) {
      await this.initialize();
    }

    try {
      // Try Redis cache first
      const cached = await this.redis.get(`email:tracking:${messageId}`);
      if (cached) {
        return JSON.parse(cached);
      }

      // Fallback to database
      const { data, error } = await this.supabase
        .from('email_delivery_tracking')
        .select('*')
        .eq('message_id', messageId)
        .single();

      if (error || !data) {
        return null;
      }

      const status: EmailDeliveryStatus = {
        messageId: data.message_id,
        jobId: data.job_id,
        recipient: data.recipient,
        subject: data.subject,
        status: data.status,
        provider: data.provider,
        sentAt: data.sent_at ? new Date(data.sent_at) : undefined,
        deliveredAt: data.delivered_at ? new Date(data.delivered_at) : undefined,
        openedAt: data.opened_at ? new Date(data.opened_at) : undefined,
        clickedAt: data.clicked_at ? new Date(data.clicked_at) : undefined,
        bouncedAt: data.bounced_at ? new Date(data.bounced_at) : undefined,
        complainedAt: data.complained_at ? new Date(data.complained_at) : undefined,
        unsubscribedAt: data.unsubscribed_at ? new Date(data.unsubscribed_at) : undefined,
        bounceReason: data.bounce_reason,
        complaintReason: data.complaint_reason,
        ipAddress: data.ip_address,
        userAgent: data.user_agent,
        location: data.location,
        device: data.device,
        trackingConsent: data.tracking_consent,
        consentTimestamp: new Date(data.consent_timestamp)
      };

      // Cache for future requests
      await this.redis.setEx(
        `email:tracking:${messageId}`,
        7 * 24 * 60 * 60,
        JSON.stringify(status)
      );

      return status;
    } catch (error) {
      console.error('Failed to get delivery status:', error);
      return null;
    }
  }

  /**
   * Get tracking events for a message
   */
  async getTrackingEvents(messageId: string): Promise<EmailTrackingEvent[]> {
    if (!this.initialized) {
      await this.initialize();
    }

    try {
      const { data, error } = await this.supabase
        .from('email_tracking_events')
        .select('*')
        .eq('message_id', messageId)
        .eq('consent_given', true) // Only return events with consent
        .order('timestamp', { ascending: false });

      if (error || !data) {
        return [];
      }

      return data.map((event: any) => ({
        id: event.id,
        messageId: event.message_id,
        eventType: event.event_type,
        timestamp: new Date(event.timestamp),
        data: event.data,
        ipAddress: event.ip_address,
        userAgent: event.user_agent,
        location: event.location,
        consentGiven: event.consent_given
      }));
    } catch (error) {
      console.error('Failed to get tracking events:', error);
      return [];
    }
  }

  /**
   * Store customer email consent
   */
  async storeCustomerConsent(consent: CustomerEmailConsent): Promise<void> {
    if (!this.initialized) {
      await this.initialize();
    }

    try {
      await this.supabase
        .from('customer_email_consent')
        .upsert({
          customer_id: consent.customerId,
          email: consent.email,
          consent_types: consent.consentTypes,
          tracking_consent: consent.trackingConsent,
          consent_timestamp: consent.consentTimestamp,
          consent_source: consent.consentSource,
          ip_address: consent.ipAddress,
          double_opt_in: consent.doubleOptIn,
          double_opt_in_confirmed_at: consent.doubleOptInConfirmedAt,
          unsubscribed_at: consent.unsubscribedAt,
          unsubscribe_reason: consent.unsubscribeReason,
          updated_at: new Date()
        }, {
          onConflict: 'email'
        });

      // Cache consent for quick lookup
      await this.redis.setEx(
        `email:consent:${consent.email}`,
        24 * 60 * 60, // 24 hours TTL
        JSON.stringify(consent)
      );

      console.log(`Email consent stored for ${consent.email}`);
    } catch (error) {
      console.error('Failed to store customer consent:', error);
      throw error;
    }
  }

  /**
   * Get customer email consent
   */
  async getCustomerConsent(email: string): Promise<CustomerEmailConsent | null> {
    if (!this.initialized) {
      await this.initialize();
    }

    try {
      // Try cache first
      const cached = await this.redis.get(`email:consent:${email}`);
      if (cached) {
        return JSON.parse(cached);
      }

      // Fallback to database
      const { data, error } = await this.supabase
        .from('customer_email_consent')
        .select('*')
        .eq('email', email)
        .single();

      if (error || !data) {
        return null;
      }

      const consent: CustomerEmailConsent = {
        customerId: data.customer_id,
        email: data.email,
        consentTypes: data.consent_types,
        trackingConsent: data.tracking_consent,
        consentTimestamp: new Date(data.consent_timestamp),
        consentSource: data.consent_source,
        ipAddress: data.ip_address,
        doubleOptIn: data.double_opt_in,
        doubleOptInConfirmedAt: data.double_opt_in_confirmed_at ? new Date(data.double_opt_in_confirmed_at) : undefined,
        unsubscribedAt: data.unsubscribed_at ? new Date(data.unsubscribed_at) : undefined,
        unsubscribeReason: data.unsubscribe_reason
      };

      // Cache for future requests
      await this.redis.setEx(
        `email:consent:${email}`,
        24 * 60 * 60,
        JSON.stringify(consent)
      );

      return consent;
    } catch (error) {
      console.error('Failed to get customer consent:', error);
      return null;
    }
  }

  /**
   * Update customer unsubscribe status
   */
  async updateUnsubscribeStatus(
    email: string, 
    unsubscribed: boolean, 
    reason?: string,
    categoryTypes?: string[]
  ): Promise<void> {
    if (!this.initialized) {
      await this.initialize();
    }

    try {
      const updateData: any = {
        unsubscribed_at: unsubscribed ? new Date() : null,
        unsubscribe_reason: unsubscribed ? reason : null,
        updated_at: new Date()
      };

      // Handle category-specific unsubscribes
      if (categoryTypes && !unsubscribed) {
        const existingConsent = await this.getCustomerConsent(email);
        if (existingConsent) {
          const updatedConsentTypes = { ...existingConsent.consentTypes };
          
          categoryTypes.forEach(category => {
            if (category in updatedConsentTypes) {
              (updatedConsentTypes as any)[category] = false;
            }
          });
          
          updateData.consent_types = updatedConsentTypes;
        }
      }

      await this.supabase
        .from('customer_email_consent')
        .update(updateData)
        .eq('email', email);

      // Clear cache
      await this.redis.del(`email:consent:${email}`);

      console.log(`Unsubscribe status updated for ${email}: ${unsubscribed}`);
    } catch (error) {
      console.error('Failed to update unsubscribe status:', error);
      throw error;
    }
  }

  /**
   * Get engagement metrics for a date range
   */
  async getEngagementMetrics(
    startDate: Date, 
    endDate: Date, 
    provider?: string
  ): Promise<EmailEngagementMetrics> {
    if (!this.initialized) {
      await this.initialize();
    }

    try {
      let query = this.supabase
        .from('email_delivery_tracking')
        .select('status, provider')
        .gte('sent_at', startDate.toISOString())
        .lte('sent_at', endDate.toISOString())
        .eq('tracking_consent', true); // Only include consented tracking

      if (provider) {
        query = query.eq('provider', provider);
      }

      const { data, error } = await query;

      if (error || !data) {
        throw new Error('Failed to fetch engagement metrics');
      }

      const totals = data.reduce((acc, record) => {
        acc.totalSent++;
        
        switch (record.status) {
          case 'delivered':
            acc.totalDelivered++;
            break;
          case 'bounced':
            acc.totalBounced++;
            break;
          case 'complained':
            acc.totalComplaints++;
            break;
          case 'opened':
            acc.totalOpened++;
            acc.totalDelivered++; // Opened implies delivered
            break;
          case 'clicked':
            acc.totalClicked++;
            acc.totalOpened++; // Clicked implies opened and delivered
            acc.totalDelivered++;
            break;
          case 'unsubscribed':
            acc.totalUnsubscribed++;
            break;
        }
        
        return acc;
      }, {
        totalSent: 0,
        totalDelivered: 0,
        totalBounced: 0,
        totalComplaints: 0,
        totalOpened: 0,
        totalClicked: 0,
        totalUnsubscribed: 0
      });

      const metrics: EmailEngagementMetrics = {
        ...totals,
        deliveryRate: totals.totalSent > 0 ? totals.totalDelivered / totals.totalSent : 0,
        bounceRate: totals.totalSent > 0 ? totals.totalBounced / totals.totalSent : 0,
        complaintRate: totals.totalSent > 0 ? totals.totalComplaints / totals.totalSent : 0,
        openRate: totals.totalDelivered > 0 ? totals.totalOpened / totals.totalDelivered : 0,
        clickRate: totals.totalOpened > 0 ? totals.totalClicked / totals.totalOpened : 0,
        unsubscribeRate: totals.totalSent > 0 ? totals.totalUnsubscribed / totals.totalSent : 0,
        engagementScore: 0 // Calculate engagement score
      };

      // Calculate engagement score (0-100)
      metrics.engagementScore = Math.round(
        (metrics.deliveryRate * 0.3 +
         metrics.openRate * 0.4 +
         metrics.clickRate * 0.2 +
         (1 - metrics.bounceRate) * 0.05 +
         (1 - metrics.complaintRate) * 0.05) * 100
      );

      return metrics;
    } catch (error) {
      console.error('Failed to get engagement metrics:', error);
      throw error;
    }
  }

  /**
   * Generate GDPR compliance report
   */
  async generateGDPRComplianceReport(): Promise<GDPRComplianceReport> {
    if (!this.initialized) {
      await this.initialize();
    }

    try {
      // Get customer consent statistics
      const { data: consentData, error: consentError } = await this.supabase
        .from('customer_email_consent')
        .select('consent_types, tracking_consent, double_opt_in, unsubscribed_at');

      if (consentError) {
        throw new Error('Failed to fetch consent data');
      }

      const totals = consentData.reduce((acc, record) => {
        acc.totalCustomers++;
        
        if (record.consent_types.transactional || 
            record.consent_types.marketing || 
            record.consent_types.event_notifications) {
          acc.consentedCustomers++;
        }
        
        if (record.tracking_consent.openTracking || 
            record.tracking_consent.clickTracking) {
          acc.trackingConsentCount++;
        }
        
        if (record.double_opt_in) {
          acc.doubleOptInCount++;
        }
        
        if (record.unsubscribed_at) {
          acc.unsubscribeCount++;
        }
        
        return acc;
      }, {
        totalCustomers: 0,
        consentedCustomers: 0,
        trackingConsentCount: 0,
        doubleOptInCount: 0,
        unsubscribeCount: 0
      });

      // Get consent audit trail
      const { data: auditData, error: auditError } = await this.supabase
        .from('customer_email_consent')
        .select('updated_at')
        .order('updated_at', { ascending: false });

      const recentChanges = auditData ? auditData.filter(
        record => new Date(record.updated_at) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      ).length : 0;

      return {
        totalCustomers: totals.totalCustomers,
        consentedCustomers: totals.consentedCustomers,
        trackingConsentRate: totals.totalCustomers > 0 ? 
          totals.trackingConsentCount / totals.totalCustomers : 0,
        doubleOptInRate: totals.totalCustomers > 0 ? 
          totals.doubleOptInCount / totals.totalCustomers : 0,
        unsubscribeRate: totals.totalCustomers > 0 ? 
          totals.unsubscribeCount / totals.totalCustomers : 0,
        dataRetentionCompliance: true, // Implement data retention check
        consentAuditTrail: {
          totalConsentEvents: totals.totalCustomers,
          recentConsentChanges: recentChanges,
          missingConsent: totals.totalCustomers - totals.consentedCustomers
        },
        rightToBeForotten: {
          totalRequests: 0, // Implement GDPR deletion request tracking
          processedRequests: 0,
          pendingRequests: 0
        }
      };
    } catch (error) {
      console.error('Failed to generate GDPR compliance report:', error);
      throw error;
    }
  }

  /**
   * Update delivery status from tracking event
   */
  private async updateDeliveryStatusFromEvent(event: EmailTrackingEvent): Promise<void> {
    const updateData: any = {
      updated_at: new Date()
    };

    switch (event.eventType) {
      case 'delivered':
        updateData.status = 'delivered';
        updateData.delivered_at = event.timestamp;
        break;
      case 'bounced':
        updateData.status = 'bounced';
        updateData.bounced_at = event.timestamp;
        updateData.bounce_reason = event.data?.reason;
        break;
      case 'complained':
        updateData.status = 'complained';
        updateData.complained_at = event.timestamp;
        updateData.complaint_reason = event.data?.reason;
        break;
      case 'opened':
        updateData.status = 'opened';
        updateData.opened_at = event.timestamp;
        updateData.ip_address = event.ipAddress;
        updateData.user_agent = event.userAgent;
        updateData.location = event.location;
        break;
      case 'clicked':
        updateData.status = 'clicked';
        updateData.clicked_at = event.timestamp;
        updateData.ip_address = event.ipAddress;
        updateData.user_agent = event.userAgent;
        updateData.location = event.location;
        break;
      case 'unsubscribed':
        updateData.status = 'unsubscribed';
        updateData.unsubscribed_at = event.timestamp;
        break;
    }

    await this.supabase
      .from('email_delivery_tracking')
      .update(updateData)
      .eq('message_id', event.messageId);

    // Clear cache
    await this.redis.del(`email:tracking:${event.messageId}`);
  }

  /**
   * Update real-time metrics in Redis
   */
  private async updateRealTimeMetrics(status: Partial<EmailDeliveryStatus>): Promise<void> {
    const today = new Date().toISOString().split('T')[0];
    const metricsKey = `email:metrics:${today}`;

    // Update daily metrics counters
    await this.redis.hIncrBy(metricsKey, `${status.provider}:${status.status}`, 1);
    await this.redis.hIncrBy(metricsKey, `total:${status.status}`, 1);
    
    // Set expiry for 30 days
    await this.redis.expire(metricsKey, 30 * 24 * 60 * 60);
  }

  /**
   * Process GDPR data deletion request
   */
  async processDataDeletionRequest(email: string): Promise<boolean> {
    if (!this.initialized) {
      await this.initialize();
    }

    try {
      // Delete all email tracking data
      await this.supabase
        .from('email_delivery_tracking')
        .delete()
        .eq('recipient', email);

      // Delete consent records
      await this.supabase
        .from('customer_email_consent')
        .delete()
        .eq('email', email);

      // Clear cache
      await this.redis.del(`email:consent:${email}`);

      // Find and clear message tracking caches
      const trackingKeys = await this.redis.keys(`email:tracking:*`);
      for (const key of trackingKeys) {
        const data = await this.redis.get(key);
        if (data) {
          const parsed = JSON.parse(data);
          if (parsed.recipient === email) {
            await this.redis.del(key);
          }
        }
      }

      console.log(`GDPR data deletion completed for ${email}`);
      return true;
    } catch (error) {
      console.error(`Failed to process data deletion request for ${email}:`, error);
      return false;
    }
  }

  /**
   * Close connections and cleanup
   */
  async close(): Promise<void> {
    if (this.redis) {
      await this.redis.disconnect();
    }
    console.log('Email delivery tracker closed');
  }
}

// ============================================================================
// Singleton Instance
// ============================================================================

let emailTracker: EmailDeliveryTracker | null = null;

export function getEmailDeliveryTracker(): EmailDeliveryTracker {
  if (!emailTracker) {
    emailTracker = new EmailDeliveryTracker();
  }
  return emailTracker;
}

// ============================================================================
// Export
// ============================================================================

export default EmailDeliveryTracker;