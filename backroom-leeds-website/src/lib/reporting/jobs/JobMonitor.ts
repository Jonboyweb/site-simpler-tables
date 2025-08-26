/**
 * The Backroom Leeds - Job Monitor
 * Version: 1.0.0
 * Phase: 3, Step 3.5
 * 
 * Job execution monitoring and alerting system
 */

import { createClient } from '@/lib/supabase/server';
import { JobStatus, DeliveryChannel, type JobExecutionHistory, type JobAlert } from '@/types/reporting';

// ============================================================================
// JOB MONITOR CLASS
// ============================================================================

export class JobMonitor {
  private supabase = createClient();

  // ============================================================================
  // MONITORING METHODS
  // ============================================================================

  async recordJobExecution(data: {
    jobId: string;
    executionId: string;
    status: JobStatus;
    startedAt?: Date;
    completedAt?: Date;
    executionTimeMs?: number;
    attemptNumber: number;
    errorMessage?: string;
    errorStack?: string;
    result?: Record<string, any>;
    metadata?: Record<string, any>;
    cpuUsagePercent?: number;
    memoryUsageMb?: number;
    recordsProcessed?: number;
  }): Promise<string | null> {
    try {
      const { data: execution, error } = await this.supabase
        .from('job_execution_history')
        .insert({
          job_id: data.jobId,
          execution_id: data.executionId,
          status: data.status,
          started_at: data.startedAt?.toISOString() || new Date().toISOString(),
          completed_at: data.completedAt?.toISOString(),
          execution_time_ms: data.executionTimeMs,
          attempt_number: data.attemptNumber,
          error_message: data.errorMessage,
          error_stack: data.errorStack,
          result: data.result || {},
          metadata: data.metadata || {},
          cpu_usage_percent: data.cpuUsagePercent,
          memory_usage_mb: data.memoryUsageMb,
          records_processed: data.recordsProcessed
        })
        .select()
        .single();

      if (error) {
        console.error('Error recording job execution:', error);
        return null;
      }

      // Check for alerts if job failed
      if (data.status === JobStatus.FAILED) {
        await this.checkAndTriggerAlerts(data.jobId, data);
      }

      return execution.id;
    } catch (error) {
      console.error('Error in recordJobExecution:', error);
      return null;
    }
  }

  async updateJobExecution(
    executionId: string,
    updates: Partial<JobExecutionHistory>
  ): Promise<boolean> {
    try {
      const { error } = await this.supabase
        .from('job_execution_history')
        .update(updates)
        .eq('execution_id', executionId);

      if (error) {
        console.error('Error updating job execution:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in updateJobExecution:', error);
      return false;
    }
  }

  // ============================================================================
  // PERFORMANCE MONITORING
  // ============================================================================

  async getJobPerformanceMetrics(jobId: string, days: number = 30): Promise<{
    averageExecutionTime: number;
    successRate: number;
    failureRate: number;
    totalExecutions: number;
    averageRetries: number;
    lastExecution?: Date;
    commonErrors: { error: string; count: number }[];
  } | null> {
    try {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(endDate.getDate() - days);

      const { data: executions, error } = await this.supabase
        .from('job_execution_history')
        .select('*')
        .eq('job_id', jobId)
        .gte('started_at', startDate.toISOString())
        .order('started_at', { ascending: false });

      if (error || !executions?.length) {
        return null;
      }

      const totalExecutions = executions.length;
      const successCount = executions.filter(e => e.status === JobStatus.COMPLETED).length;
      const failureCount = executions.filter(e => e.status === JobStatus.FAILED).length;
      
      const avgExecutionTime = executions
        .filter(e => e.execution_time_ms)
        .reduce((sum, e) => sum + (e.execution_time_ms || 0), 0) / totalExecutions;

      const avgRetries = executions
        .reduce((sum, e) => sum + e.attempt_number, 0) / totalExecutions;

      // Count common errors
      const errorCounts = executions
        .filter(e => e.error_message)
        .reduce((acc, e) => {
          const error = e.error_message || 'Unknown error';
          acc[error] = (acc[error] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);

      const commonErrors = Object.entries(errorCounts)
        .map(([error, count]) => ({ error, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      return {
        averageExecutionTime: Math.round(avgExecutionTime),
        successRate: Math.round((successCount / totalExecutions) * 100),
        failureRate: Math.round((failureCount / totalExecutions) * 100),
        totalExecutions,
        averageRetries: Math.round(avgRetries * 10) / 10,
        lastExecution: executions[0] ? new Date(executions[0].started_at) : undefined,
        commonErrors
      };
    } catch (error) {
      console.error('Error getting job performance metrics:', error);
      return null;
    }
  }

  async getSystemPerformanceOverview(): Promise<{
    totalJobs: number;
    runningJobs: number;
    failedJobs: number;
    completedJobs: number;
    averageExecutionTime: number;
    systemLoad: number;
    topFailingJobs: { jobId: string; failures: number }[];
  } | null> {
    try {
      const last24Hours = new Date();
      last24Hours.setHours(last24Hours.getHours() - 24);

      const { data: recentExecutions, error } = await this.supabase
        .from('job_execution_history')
        .select(`
          *,
          scheduled_jobs (name)
        `)
        .gte('started_at', last24Hours.toISOString());

      if (error || !recentExecutions) {
        return null;
      }

      const totalJobs = recentExecutions.length;
      const runningJobs = recentExecutions.filter(e => e.status === JobStatus.RUNNING).length;
      const failedJobs = recentExecutions.filter(e => e.status === JobStatus.FAILED).length;
      const completedJobs = recentExecutions.filter(e => e.status === JobStatus.COMPLETED).length;

      const avgExecutionTime = recentExecutions
        .filter(e => e.execution_time_ms)
        .reduce((sum, e) => sum + (e.execution_time_ms || 0), 0) / totalJobs;

      // Calculate system load based on queue depth and failure rate
      const systemLoad = Math.min(100, (runningJobs * 10) + (failedJobs * 5));

      // Find top failing jobs
      const failureCounts = recentExecutions
        .filter(e => e.status === JobStatus.FAILED)
        .reduce((acc, e) => {
          acc[e.job_id] = (acc[e.job_id] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);

      const topFailingJobs = Object.entries(failureCounts)
        .map(([jobId, failures]) => ({ jobId, failures }))
        .sort((a, b) => b.failures - a.failures)
        .slice(0, 5);

      return {
        totalJobs,
        runningJobs,
        failedJobs,
        completedJobs,
        averageExecutionTime: Math.round(avgExecutionTime),
        systemLoad,
        topFailingJobs
      };
    } catch (error) {
      console.error('Error getting system performance overview:', error);
      return null;
    }
  }

  // ============================================================================
  // ALERTING SYSTEM
  // ============================================================================

  async createJobAlert(data: {
    jobId: string;
    alertType: string;
    thresholdValue?: number;
    notificationChannels: DeliveryChannel[];
    recipientEmails?: string[];
    webhookUrl?: string;
  }): Promise<string | null> {
    try {
      const { data: alert, error } = await this.supabase
        .from('job_alerts')
        .insert({
          job_id: data.jobId,
          alert_type: data.alertType,
          threshold_value: data.thresholdValue,
          notification_channels: data.notificationChannels,
          recipient_emails: data.recipientEmails,
          webhook_url: data.webhookUrl,
          enabled: true
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating job alert:', error);
        return null;
      }

      return alert.id;
    } catch (error) {
      console.error('Error in createJobAlert:', error);
      return null;
    }
  }

  private async checkAndTriggerAlerts(
    jobId: string, 
    executionData: any
  ): Promise<void> {
    try {
      const { data: alerts, error } = await this.supabase
        .from('job_alerts')
        .select('*')
        .eq('job_id', jobId)
        .eq('enabled', true);

      if (error || !alerts?.length) {
        return;
      }

      for (const alert of alerts) {
        let shouldTrigger = false;

        switch (alert.alert_type) {
          case 'failure':
            shouldTrigger = executionData.status === JobStatus.FAILED;
            break;
            
          case 'consecutive_failures':
            const recentFailures = await this.getConsecutiveFailures(jobId);
            shouldTrigger = recentFailures >= (alert.threshold_value || 3);
            break;
            
          case 'slow_execution':
            const avgTime = await this.getAverageExecutionTime(jobId);
            const currentTime = executionData.executionTimeMs;
            shouldTrigger = currentTime > (avgTime * (alert.threshold_value || 2));
            break;
            
          case 'timeout':
            shouldTrigger = executionData.errorMessage?.includes('timeout') || false;
            break;
        }

        if (shouldTrigger) {
          await this.triggerAlert(alert, executionData);
        }
      }
    } catch (error) {
      console.error('Error checking and triggering alerts:', error);
    }
  }

  private async triggerAlert(
    alert: JobAlert,
    executionData: any
  ): Promise<void> {
    try {
      // Get job details
      const { data: job } = await this.supabase
        .from('scheduled_jobs')
        .select('name, description')
        .eq('id', alert.jobId)
        .single();

      const alertData = {
        jobName: job?.name || 'Unknown Job',
        jobDescription: job?.description || '',
        alertType: alert.alertType,
        executionData,
        timestamp: new Date().toISOString()
      };

      // Send notifications based on channels
      for (const channel of alert.notificationChannels) {
        switch (channel) {
          case DeliveryChannel.EMAIL:
            if (alert.recipientEmails?.length) {
              await this.sendEmailAlert(alert.recipientEmails, alertData);
            }
            break;
            
          case DeliveryChannel.WEBHOOK:
            if (alert.webhookUrl) {
              await this.sendWebhookAlert(alert.webhookUrl, alertData);
            }
            break;
        }
      }

      // Update last triggered time
      await this.supabase
        .from('job_alerts')
        .update({ last_triggered_at: new Date().toISOString() })
        .eq('id', alert.id);

    } catch (error) {
      console.error('Error triggering alert:', error);
    }
  }

  private async sendEmailAlert(
    recipients: string[],
    alertData: any
  ): Promise<void> {
    try {
      const { EmailDistributor } = await import('../distribution/EmailDistributor');
      const emailDistributor = new EmailDistributor();
      
      await emailDistributor.sendJobAlert(recipients, alertData);
    } catch (error) {
      console.error('Error sending email alert:', error);
    }
  }

  private async sendWebhookAlert(
    webhookUrl: string,
    alertData: any
  ): Promise<void> {
    try {
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'BackroomLeeds-JobMonitor/1.0'
        },
        body: JSON.stringify({
          type: 'job_alert',
          data: alertData,
          timestamp: new Date().toISOString()
        })
      });

      if (!response.ok) {
        throw new Error(`Webhook failed with status ${response.status}`);
      }
    } catch (error) {
      console.error('Error sending webhook alert:', error);
    }
  }

  // ============================================================================
  // UTILITY METHODS
  // ============================================================================

  private async getConsecutiveFailures(jobId: string): Promise<number> {
    try {
      const { data: executions } = await this.supabase
        .from('job_execution_history')
        .select('status')
        .eq('job_id', jobId)
        .order('started_at', { ascending: false })
        .limit(10);

      if (!executions?.length) return 0;

      let consecutiveFailures = 0;
      for (const execution of executions) {
        if (execution.status === JobStatus.FAILED) {
          consecutiveFailures++;
        } else {
          break;
        }
      }

      return consecutiveFailures;
    } catch (error) {
      console.error('Error getting consecutive failures:', error);
      return 0;
    }
  }

  private async getAverageExecutionTime(jobId: string): Promise<number> {
    try {
      const { data: executions } = await this.supabase
        .from('job_execution_history')
        .select('execution_time_ms')
        .eq('job_id', jobId)
        .eq('status', JobStatus.COMPLETED)
        .order('started_at', { ascending: false })
        .limit(10);

      if (!executions?.length) return 0;

      const validTimes = executions.filter(e => e.execution_time_ms);
      if (!validTimes.length) return 0;

      return validTimes.reduce((sum, e) => sum + e.execution_time_ms, 0) / validTimes.length;
    } catch (error) {
      console.error('Error getting average execution time:', error);
      return 0;
    }
  }

  // ============================================================================
  // CLEANUP METHODS
  // ============================================================================

  async cleanupOldExecutions(retentionDays: number = 30): Promise<number> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

      const { data: deleted, error } = await this.supabase
        .from('job_execution_history')
        .delete()
        .lt('completed_at', cutoffDate.toISOString())
        .eq('status', JobStatus.COMPLETED)
        .select('id');

      if (error) {
        console.error('Error cleaning up old executions:', error);
        return 0;
      }

      return deleted?.length || 0;
    } catch (error) {
      console.error('Error in cleanupOldExecutions:', error);
      return 0;
    }
  }

  async getJobExecutionLogs(
    jobId: string,
    limit: number = 50,
    offset: number = 0
  ): Promise<JobExecutionHistory[]> {
    try {
      const { data: executions, error } = await this.supabase
        .from('job_execution_history')
        .select('*')
        .eq('job_id', jobId)
        .order('started_at', { ascending: false })
        .limit(limit)
        .range(offset, offset + limit - 1);

      if (error) {
        console.error('Error getting job execution logs:', error);
        return [];
      }

      return executions || [];
    } catch (error) {
      console.error('Error in getJobExecutionLogs:', error);
      return [];
    }
  }
}

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

let monitorInstance: JobMonitor | null = null;

export const getJobMonitor = (): JobMonitor => {
  if (!monitorInstance) {
    monitorInstance = new JobMonitor();
  }
  return monitorInstance;
};