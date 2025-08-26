/**
 * Email Service Manager
 * 
 * Multi-provider email service with automatic failover and health monitoring.
 * Manages Resend (primary), Postmark (backup), and AWS SES (bulk) providers.
 * 
 * @module EmailServiceManager
 * @version 1.0.0
 */

import { Resend } from 'resend';
import postmark from 'postmark';
import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';
import { z } from 'zod';

// ============================================================================
// Types and Interfaces
// ============================================================================

export enum EmailProvider {
  RESEND = 'resend',
  POSTMARK = 'postmark',
  SES = 'ses'
}

export enum EmailPriority {
  CRITICAL = 'critical',
  HIGH = 'high',
  NORMAL = 'normal',
  LOW = 'low'
}

export interface EmailMessage {
  to: string | string[];
  from: string;
  subject: string;
  html?: string;
  text?: string;
  replyTo?: string;
  cc?: string[];
  bcc?: string[];
  attachments?: EmailAttachment[];
  headers?: Record<string, string>;
  tags?: Record<string, string>;
  metadata?: Record<string, any>;
}

export interface EmailAttachment {
  filename: string;
  content: Buffer | string;
  contentType?: string;
  contentDisposition?: 'attachment' | 'inline';
}

export interface EmailResult {
  id: string;
  provider: EmailProvider;
  messageId: string;
  status: 'sent' | 'queued' | 'failed';
  timestamp: Date;
  cost?: number;
}

export interface ProviderHealth {
  provider: EmailProvider;
  isHealthy: boolean;
  lastChecked: Date;
  consecutiveFailures: number;
  quotaUsed?: number;
  quotaLimit?: number;
  responseTime?: number;
  lastError?: string;
}

export interface QuotaInfo {
  used: number;
  limit: number;
  remaining: number;
  resetAt?: Date;
}

// ============================================================================
// Email Service Provider Interface
// ============================================================================

interface IEmailServiceProvider {
  name: EmailProvider;
  priority: number;
  isHealthy: boolean;
  sendEmail(message: EmailMessage): Promise<EmailResult>;
  checkHealth(): Promise<boolean>;
  getQuota(): Promise<QuotaInfo>;
}

// ============================================================================
// Resend Provider Implementation
// ============================================================================

class ResendProvider implements IEmailServiceProvider {
  name = EmailProvider.RESEND;
  priority = 1;
  isHealthy = true;
  private client: Resend;
  private healthCheckFailures = 0;

  constructor(apiKey: string) {
    this.client = new Resend(apiKey);
  }

  async sendEmail(message: EmailMessage): Promise<EmailResult> {
    try {
      const response = await this.client.emails.send({
        from: message.from,
        to: Array.isArray(message.to) ? message.to : [message.to],
        subject: message.subject,
        html: message.html,
        text: message.text,
        reply_to: message.replyTo,
        cc: message.cc,
        bcc: message.bcc,
        attachments: message.attachments?.map(att => ({
          filename: att.filename,
          content: att.content,
          content_type: att.contentType
        })),
        headers: message.headers,
        tags: message.tags
      });

      this.healthCheckFailures = 0;
      this.isHealthy = true;

      return {
        id: response.id,
        provider: this.name,
        messageId: response.id,
        status: 'sent',
        timestamp: new Date(),
        cost: this.calculateCost(message)
      };
    } catch (error) {
      this.healthCheckFailures++;
      if (this.healthCheckFailures >= 3) {
        this.isHealthy = false;
      }
      throw new EmailProviderError(`Resend failed: ${error.message}`, this.name, error);
    }
  }

  async checkHealth(): Promise<boolean> {
    try {
      // Resend doesn't have a specific health endpoint, so we check the API key validity
      const response = await this.client.emails.send({
        from: 'health@backroomleeds.com',
        to: 'health-check@backroomleeds.com',
        subject: 'Health Check',
        text: 'Health check message',
        headers: {
          'X-Entity-Ref-ID': 'health-check-' + Date.now()
        }
      });

      this.isHealthy = true;
      this.healthCheckFailures = 0;
      return true;
    } catch (error) {
      this.healthCheckFailures++;
      if (this.healthCheckFailures >= 3) {
        this.isHealthy = false;
      }
      return false;
    }
  }

  async getQuota(): Promise<QuotaInfo> {
    // Resend has a 100 emails/day on free tier, 10,000/month on pro
    // This would need to be tracked in our database
    return {
      used: 0,
      limit: 10000,
      remaining: 10000,
      resetAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    };
  }

  private calculateCost(message: EmailMessage): number {
    // Resend pricing: $0.00025 per email after free tier
    const recipients = Array.isArray(message.to) ? message.to.length : 1;
    return recipients * 0.00025;
  }
}

// ============================================================================
// Postmark Provider Implementation
// ============================================================================

class PostmarkProvider implements IEmailServiceProvider {
  name = EmailProvider.POSTMARK;
  priority = 2;
  isHealthy = true;
  private client: postmark.ServerClient;
  private healthCheckFailures = 0;

  constructor(serverToken: string) {
    this.client = new postmark.ServerClient(serverToken);
  }

  async sendEmail(message: EmailMessage): Promise<EmailResult> {
    try {
      const response = await this.client.sendEmail({
        From: message.from,
        To: Array.isArray(message.to) ? message.to.join(',') : message.to,
        Subject: message.subject,
        HtmlBody: message.html,
        TextBody: message.text,
        ReplyTo: message.replyTo,
        Cc: message.cc?.join(','),
        Bcc: message.bcc?.join(','),
        Headers: Object.entries(message.headers || {}).map(([name, value]) => ({
          Name: name,
          Value: value
        })),
        Metadata: message.metadata,
        Attachments: message.attachments?.map(att => ({
          Name: att.filename,
          Content: typeof att.content === 'string' ? att.content : att.content.toString('base64'),
          ContentType: att.contentType || 'application/octet-stream'
        }))
      });

      this.healthCheckFailures = 0;
      this.isHealthy = true;

      return {
        id: response.MessageID,
        provider: this.name,
        messageId: response.MessageID,
        status: 'sent',
        timestamp: new Date(),
        cost: this.calculateCost(message)
      };
    } catch (error) {
      this.healthCheckFailures++;
      if (this.healthCheckFailures >= 3) {
        this.isHealthy = false;
      }
      throw new EmailProviderError(`Postmark failed: ${error.message}`, this.name, error);
    }
  }

  async checkHealth(): Promise<boolean> {
    try {
      const response = await this.client.getServer();
      this.isHealthy = response.Name !== undefined;
      if (this.isHealthy) {
        this.healthCheckFailures = 0;
      }
      return this.isHealthy;
    } catch (error) {
      this.healthCheckFailures++;
      if (this.healthCheckFailures >= 3) {
        this.isHealthy = false;
      }
      return false;
    }
  }

  async getQuota(): Promise<QuotaInfo> {
    try {
      const stats = await this.client.getOutboundOverview();
      return {
        used: stats.Sent,
        limit: 10000, // This would need to be configured based on plan
        remaining: 10000 - stats.Sent,
        resetAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      };
    } catch (error) {
      throw new EmailProviderError(`Failed to get Postmark quota: ${error.message}`, this.name, error);
    }
  }

  private calculateCost(message: EmailMessage): number {
    // Postmark pricing: $0.00025 per email
    const recipients = Array.isArray(message.to) ? message.to.length : 1;
    return recipients * 0.00025;
  }
}

// ============================================================================
// AWS SES Provider Implementation
// ============================================================================

class SESProvider implements IEmailServiceProvider {
  name = EmailProvider.SES;
  priority = 3;
  isHealthy = true;
  private client: SESClient;
  private healthCheckFailures = 0;

  constructor(region: string = 'eu-west-2') {
    this.client = new SESClient({
      region,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!
      }
    });
  }

  async sendEmail(message: EmailMessage): Promise<EmailResult> {
    try {
      const command = new SendEmailCommand({
        Source: message.from,
        Destination: {
          ToAddresses: Array.isArray(message.to) ? message.to : [message.to],
          CcAddresses: message.cc,
          BccAddresses: message.bcc
        },
        Message: {
          Subject: { Data: message.subject },
          Body: {
            Html: message.html ? { Data: message.html } : undefined,
            Text: message.text ? { Data: message.text } : undefined
          }
        },
        ReplyToAddresses: message.replyTo ? [message.replyTo] : undefined
      });

      const response = await this.client.send(command);

      this.healthCheckFailures = 0;
      this.isHealthy = true;

      return {
        id: response.MessageId!,
        provider: this.name,
        messageId: response.MessageId!,
        status: 'sent',
        timestamp: new Date(),
        cost: this.calculateCost(message)
      };
    } catch (error) {
      this.healthCheckFailures++;
      if (this.healthCheckFailures >= 3) {
        this.isHealthy = false;
      }
      throw new EmailProviderError(`AWS SES failed: ${error.message}`, this.name, error);
    }
  }

  async checkHealth(): Promise<boolean> {
    try {
      const response = await this.client.send(new SendEmailCommand({
        Source: 'health@backroomleeds.com',
        Destination: {
          ToAddresses: ['health-check@backroomleeds.com']
        },
        Message: {
          Subject: { Data: 'Health Check' },
          Body: {
            Text: { Data: 'Health check message' }
          }
        }
      }));

      this.isHealthy = true;
      this.healthCheckFailures = 0;
      return true;
    } catch (error) {
      this.healthCheckFailures++;
      if (this.healthCheckFailures >= 3) {
        this.isHealthy = false;
      }
      return false;
    }
  }

  async getQuota(): Promise<QuotaInfo> {
    // SES quotas would need to be retrieved via AWS API
    return {
      used: 0,
      limit: 50000,
      remaining: 50000,
      resetAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
    };
  }

  private calculateCost(message: EmailMessage): number {
    // AWS SES pricing: $0.00010 per email
    const recipients = Array.isArray(message.to) ? message.to.length : 1;
    return recipients * 0.00010;
  }
}

// ============================================================================
// Email Provider Error
// ============================================================================

export class EmailProviderError extends Error {
  constructor(
    message: string,
    public provider: EmailProvider,
    public originalError?: any
  ) {
    super(message);
    this.name = 'EmailProviderError';
  }
}

export class AllProvidersFailedError extends Error {
  constructor(public failures: Map<EmailProvider, Error>) {
    super('All email providers failed to send the message');
    this.name = 'AllProvidersFailedError';
  }
}

// ============================================================================
// Email Service Manager
// ============================================================================

export class EmailServiceManager {
  private providers: Map<EmailProvider, IEmailServiceProvider> = new Map();
  private healthMonitor?: NodeJS.Timer;
  private providerStats: Map<EmailProvider, ProviderHealth> = new Map();

  constructor(config?: {
    resendApiKey?: string;
    postmarkToken?: string;
    awsRegion?: string;
    healthCheckInterval?: number;
  }) {
    // Initialize providers based on configuration
    if (config?.resendApiKey || process.env.RESEND_API_KEY) {
      this.providers.set(
        EmailProvider.RESEND,
        new ResendProvider(config?.resendApiKey || process.env.RESEND_API_KEY!)
      );
    }

    if (config?.postmarkToken || process.env.POSTMARK_SERVER_TOKEN) {
      this.providers.set(
        EmailProvider.POSTMARK,
        new PostmarkProvider(config?.postmarkToken || process.env.POSTMARK_SERVER_TOKEN!)
      );
    }

    if (process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY) {
      this.providers.set(
        EmailProvider.SES,
        new SESProvider(config?.awsRegion || 'eu-west-2')
      );
    }

    // Start health monitoring
    if (config?.healthCheckInterval !== 0) {
      this.startHealthMonitoring(config?.healthCheckInterval || 60000); // Default 1 minute
    }
  }

  /**
   * Send email with automatic failover
   */
  async sendWithFailover(
    message: EmailMessage,
    options?: {
      priority?: EmailPriority;
      preferredProvider?: EmailProvider;
      maxAttempts?: number;
    }
  ): Promise<EmailResult> {
    const providers = this.getHealthyProviders(options?.preferredProvider);
    const failures = new Map<EmailProvider, Error>();

    if (providers.length === 0) {
      throw new AllProvidersFailedError(failures);
    }

    // Try each provider in order of priority
    for (const provider of providers) {
      try {
        console.log(`Attempting to send email via ${provider.name}`);
        
        const result = await provider.sendEmail(message);
        
        // Update statistics
        this.updateProviderStats(provider.name, true);
        
        return result;
      } catch (error) {
        console.error(`Provider ${provider.name} failed:`, error);
        
        // Record failure
        failures.set(provider.name, error as Error);
        this.updateProviderStats(provider.name, false, (error as Error).message);
        
        // Mark provider as unhealthy if too many failures
        await this.handleProviderError(provider, error as Error);
        
        // Continue to next provider
        continue;
      }
    }

    // All providers failed
    throw new AllProvidersFailedError(failures);
  }

  /**
   * Send batch emails efficiently
   */
  async sendBatch(
    messages: EmailMessage[],
    options?: {
      priority?: EmailPriority;
      stagger?: boolean;
      staggerDelay?: number;
    }
  ): Promise<EmailResult[]> {
    const results: EmailResult[] = [];
    
    for (const message of messages) {
      try {
        const result = await this.sendWithFailover(message, { priority: options?.priority });
        results.push(result);
        
        // Add stagger delay if requested
        if (options?.stagger && options?.staggerDelay) {
          await new Promise(resolve => setTimeout(resolve, options.staggerDelay));
        }
      } catch (error) {
        console.error('Failed to send batch email:', error);
        // Continue with next message
      }
    }
    
    return results;
  }

  /**
   * Get healthy providers sorted by priority
   */
  private getHealthyProviders(preferredProvider?: EmailProvider): IEmailServiceProvider[] {
    const providers = Array.from(this.providers.values());
    
    // Filter healthy providers
    let healthyProviders = providers.filter(p => p.isHealthy);
    
    // Sort by priority
    healthyProviders.sort((a, b) => a.priority - b.priority);
    
    // If preferred provider is specified and healthy, move to front
    if (preferredProvider) {
      const preferred = healthyProviders.find(p => p.name === preferredProvider);
      if (preferred) {
        healthyProviders = [
          preferred,
          ...healthyProviders.filter(p => p.name !== preferredProvider)
        ];
      }
    }
    
    return healthyProviders;
  }

  /**
   * Handle provider errors and update health status
   */
  private async handleProviderError(provider: IEmailServiceProvider, error: Error): Promise<void> {
    const stats = this.providerStats.get(provider.name) || {
      provider: provider.name,
      isHealthy: true,
      lastChecked: new Date(),
      consecutiveFailures: 0
    };
    
    stats.consecutiveFailures++;
    stats.lastError = error.message;
    
    // Mark as unhealthy after 3 consecutive failures
    if (stats.consecutiveFailures >= 3) {
      provider.isHealthy = false;
      stats.isHealthy = false;
      
      console.error(`Provider ${provider.name} marked as unhealthy after ${stats.consecutiveFailures} failures`);
      
      // Schedule health check in 5 minutes
      setTimeout(() => this.checkProviderHealth(provider), 5 * 60 * 1000);
    }
    
    this.providerStats.set(provider.name, stats);
  }

  /**
   * Update provider statistics
   */
  private updateProviderStats(
    provider: EmailProvider,
    success: boolean,
    error?: string
  ): void {
    const stats = this.providerStats.get(provider) || {
      provider,
      isHealthy: true,
      lastChecked: new Date(),
      consecutiveFailures: 0
    };
    
    if (success) {
      stats.consecutiveFailures = 0;
      stats.lastError = undefined;
      stats.isHealthy = true;
    } else {
      stats.consecutiveFailures++;
      stats.lastError = error;
      if (stats.consecutiveFailures >= 3) {
        stats.isHealthy = false;
      }
    }
    
    stats.lastChecked = new Date();
    this.providerStats.set(provider, stats);
  }

  /**
   * Check health of a specific provider
   */
  private async checkProviderHealth(provider: IEmailServiceProvider): Promise<boolean> {
    try {
      const startTime = Date.now();
      const isHealthy = await provider.checkHealth();
      const responseTime = Date.now() - startTime;
      
      const stats = this.providerStats.get(provider.name) || {
        provider: provider.name,
        isHealthy,
        lastChecked: new Date(),
        consecutiveFailures: 0
      };
      
      stats.isHealthy = isHealthy;
      stats.responseTime = responseTime;
      stats.lastChecked = new Date();
      
      if (isHealthy) {
        stats.consecutiveFailures = 0;
        stats.lastError = undefined;
        
        // Get quota information
        try {
          const quota = await provider.getQuota();
          stats.quotaUsed = quota.used;
          stats.quotaLimit = quota.limit;
        } catch (error) {
          console.error(`Failed to get quota for ${provider.name}:`, error);
        }
      }
      
      this.providerStats.set(provider.name, stats);
      
      return isHealthy;
    } catch (error) {
      console.error(`Health check failed for ${provider.name}:`, error);
      return false;
    }
  }

  /**
   * Start health monitoring for all providers
   */
  private startHealthMonitoring(interval: number = 60000): void {
    // Initial health check
    this.checkAllProviders();
    
    // Schedule periodic health checks
    this.healthMonitor = setInterval(() => {
      this.checkAllProviders();
    }, interval);
  }

  /**
   * Check health of all providers
   */
  private async checkAllProviders(): Promise<void> {
    const providers = Array.from(this.providers.values());
    
    await Promise.all(
      providers.map(provider => this.checkProviderHealth(provider))
    );
  }

  /**
   * Stop health monitoring
   */
  stopHealthMonitoring(): void {
    if (this.healthMonitor) {
      clearInterval(this.healthMonitor);
      this.healthMonitor = undefined;
    }
  }

  /**
   * Get provider statistics
   */
  getProviderStats(): Map<EmailProvider, ProviderHealth> {
    return new Map(this.providerStats);
  }

  /**
   * Get specific provider health
   */
  getProviderHealth(provider: EmailProvider): ProviderHealth | undefined {
    return this.providerStats.get(provider);
  }

  /**
   * Manually mark a provider as healthy/unhealthy
   */
  setProviderHealth(provider: EmailProvider, isHealthy: boolean): void {
    const providerInstance = this.providers.get(provider);
    if (providerInstance) {
      providerInstance.isHealthy = isHealthy;
      
      const stats = this.providerStats.get(provider) || {
        provider,
        isHealthy,
        lastChecked: new Date(),
        consecutiveFailures: 0
      };
      
      stats.isHealthy = isHealthy;
      if (isHealthy) {
        stats.consecutiveFailures = 0;
        stats.lastError = undefined;
      }
      
      this.providerStats.set(provider, stats);
    }
  }

  /**
   * Test email configuration
   */
  async testConfiguration(): Promise<Map<EmailProvider, boolean>> {
    const results = new Map<EmailProvider, boolean>();
    
    for (const [name, provider] of this.providers) {
      try {
        const isHealthy = await provider.checkHealth();
        results.set(name, isHealthy);
      } catch (error) {
        results.set(name, false);
      }
    }
    
    return results;
  }
}

// ============================================================================
// Export singleton instance
// ============================================================================

let emailServiceManager: EmailServiceManager;

export function getEmailServiceManager(): EmailServiceManager {
  if (!emailServiceManager) {
    emailServiceManager = new EmailServiceManager();
  }
  return emailServiceManager;
}