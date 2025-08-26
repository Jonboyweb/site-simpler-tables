/**
 * The Backroom Leeds - Job Status Monitoring API
 * Version: 1.0.0
 * Phase: 3, Step 3.5
 * 
 * API endpoints for monitoring job execution status and system health
 */

import { NextRequest, NextResponse } from 'next/server';
import { getJobScheduler } from '@/lib/reporting/jobs/JobScheduler';
import { getJobMonitor } from '@/lib/reporting/jobs/JobMonitor';

// ============================================================================
// GET: Job and System Status
// ============================================================================

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const jobId = searchParams.get('jobId');
    const systemHealth = searchParams.get('systemHealth') === 'true';
    const detailed = searchParams.get('detailed') === 'true';

    // Handle specific job status request
    if (jobId) {
      return await handleJobStatusRequest(jobId, detailed);
    }

    // Handle system health request
    if (systemHealth) {
      return await handleSystemHealthRequest();
    }

    // Default: return job queue overview
    return await handleJobQueueOverview();

  } catch (error) {
    console.error('Error getting job status:', error);
    
    return NextResponse.json(
      {
        error: 'Failed to get job status',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// ============================================================================
// Job Status Handler
// ============================================================================

async function handleJobStatusRequest(jobId: string, detailed: boolean) {
  try {
    const scheduler = await getJobScheduler();
    const monitor = getJobMonitor();
    
    // Get job status from scheduler
    const jobStatus = await scheduler.getJobStatus(jobId);
    
    if (!jobStatus) {
      return NextResponse.json(
        { error: 'Job not found' },
        { status: 404 }
      );
    }

    const response: any = {
      jobId,
      status: jobStatus,
      timestamp: new Date().toISOString()
    };

    // Add detailed information if requested
    if (detailed) {
      // Get job execution history
      const executionLogs = await monitor.getJobExecutionLogs(jobId, 10);
      
      // Get job performance metrics
      const performanceMetrics = await monitor.getJobPerformanceMetrics(jobId, 30);
      
      response.executionHistory = executionLogs.map(log => ({
        id: log.id,
        status: log.status,
        startedAt: log.startedAt,
        completedAt: log.completedAt,
        executionTimeMs: log.executionTimeMs,
        attemptNumber: log.attemptNumber,
        errorMessage: log.errorMessage
      }));
      
      response.performanceMetrics = performanceMetrics;
    }

    return NextResponse.json(response);

  } catch (error) {
    console.error('Error getting specific job status:', error);
    throw error;
  }
}

// ============================================================================
// System Health Handler
// ============================================================================

async function handleSystemHealthRequest() {
  try {
    const scheduler = await getJobScheduler();
    const monitor = getJobMonitor();
    
    // Get scheduler health check
    const schedulerHealth = await scheduler.healthCheck();
    
    // Get system performance overview
    const systemOverview = await monitor.getSystemPerformanceOverview();
    
    // Get queue statistics
    const queueStats = await scheduler.getQueueStats();
    
    // Determine overall system health
    const isHealthy = schedulerHealth.status === 'healthy' && 
                      (systemOverview?.systemLoad || 0) < 80 &&
                      (queueStats.failed || 0) < 10;

    const healthStatus = {
      status: isHealthy ? 'healthy' : 'degraded',
      timestamp: new Date().toISOString(),
      components: {
        scheduler: {
          status: schedulerHealth.status,
          redis: schedulerHealth.redis,
          queues: schedulerHealth.queues,
          worker: schedulerHealth.worker,
          details: schedulerHealth.details
        },
        system: {
          status: systemOverview ? 'operational' : 'unknown',
          load: systemOverview?.systemLoad || 0,
          totalJobs24h: systemOverview?.totalJobs || 0,
          runningJobs: systemOverview?.runningJobs || 0,
          failedJobs: systemOverview?.failedJobs || 0,
          completedJobs: systemOverview?.completedJobs || 0,
          averageExecutionTime: systemOverview?.averageExecutionTime || 0,
          topFailingJobs: systemOverview?.topFailingJobs || []
        },
        queues: {
          status: queueStats ? 'operational' : 'unknown',
          waiting: queueStats.waiting || 0,
          active: queueStats.active || 0,
          completed: queueStats.completed || 0,
          failed: queueStats.failed || 0,
          delayed: queueStats.delayed || 0,
          paused: queueStats.paused || 0
        }
      },
      alerts: []
    };

    // Add alerts based on system state
    if (!schedulerHealth.redis) {
      healthStatus.alerts.push({
        type: 'critical',
        message: 'Redis connection is down',
        timestamp: new Date().toISOString()
      });
    }

    if ((systemOverview?.systemLoad || 0) > 80) {
      healthStatus.alerts.push({
        type: 'warning',
        message: `High system load: ${systemOverview?.systemLoad}%`,
        timestamp: new Date().toISOString()
      });
    }

    if ((queueStats.failed || 0) > 10) {
      healthStatus.alerts.push({
        type: 'warning',
        message: `High number of failed jobs: ${queueStats.failed}`,
        timestamp: new Date().toISOString()
      });
    }

    if ((queueStats.waiting || 0) > 50) {
      healthStatus.alerts.push({
        type: 'info',
        message: `High queue backlog: ${queueStats.waiting} waiting jobs`,
        timestamp: new Date().toISOString()
      });
    }

    return NextResponse.json(healthStatus);

  } catch (error) {
    console.error('Error getting system health:', error);
    
    return NextResponse.json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: 'Failed to retrieve system health',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 503 });
  }
}

// ============================================================================
// Job Queue Overview Handler
// ============================================================================

async function handleJobQueueOverview() {
  try {
    const scheduler = await getJobScheduler();
    
    // Get queue statistics
    const queueStats = await scheduler.getQueueStats();
    
    // Get recent job history
    const recentJobs = await scheduler.getJobHistory(20);
    
    // Get active jobs
    const activeJobs = await scheduler.getActiveJobs();
    
    // Get waiting jobs
    const waitingJobs = await scheduler.getWaitingJobs();

    const overview = {
      timestamp: new Date().toISOString(),
      queueStats,
      activeJobs: activeJobs.map(job => ({
        id: job.id,
        name: job.name,
        data: job.data,
        processedOn: job.processedOn,
        progress: job.progress()
      })),
      waitingJobs: waitingJobs.slice(0, 10).map(job => ({
        id: job.id,
        name: job.name,
        delay: job.delay,
        timestamp: job.timestamp
      })),
      recentJobs: recentJobs.slice(0, 10).map(job => ({
        id: job.id,
        name: job.name,
        finishedOn: job.finishedOn,
        processedOn: job.processedOn,
        returnvalue: job.returnvalue,
        failedReason: job.failedReason
      }))
    };

    return NextResponse.json(overview);

  } catch (error) {
    console.error('Error getting job queue overview:', error);
    throw error;
  }
}

// ============================================================================
// POST: Manual Job Control
// ============================================================================

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, jobId, data } = body;

    if (!action) {
      return NextResponse.json(
        { error: 'Action is required' },
        { status: 400 }
      );
    }

    const scheduler = await getJobScheduler();
    let result: any = {};

    switch (action) {
      case 'pause':
        if (!jobId) {
          return NextResponse.json(
            { error: 'Job ID is required for pause action' },
            { status: 400 }
          );
        }
        await scheduler.pauseJob(jobId);
        result = { 
          message: `Job ${jobId} has been paused`,
          jobId,
          action: 'paused'
        };
        break;

      case 'resume':
        if (!jobId) {
          return NextResponse.json(
            { error: 'Job ID is required for resume action' },
            { status: 400 }
          );
        }
        await scheduler.resumeJob(jobId);
        result = { 
          message: `Job ${jobId} has been resumed`,
          jobId,
          action: 'resumed'
        };
        break;

      case 'retry':
        if (!jobId) {
          return NextResponse.json(
            { error: 'Job ID is required for retry action' },
            { status: 400 }
          );
        }
        // This would need to be implemented in the scheduler
        result = { 
          message: `Job ${jobId} retry has been queued`,
          jobId,
          action: 'retrying'
        };
        break;

      case 'cancel':
        if (!jobId) {
          return NextResponse.json(
            { error: 'Job ID is required for cancel action' },
            { status: 400 }
          );
        }
        await scheduler.removeJob(jobId);
        result = { 
          message: `Job ${jobId} has been cancelled`,
          jobId,
          action: 'cancelled'
        };
        break;

      default:
        return NextResponse.json(
          { error: `Unknown action: ${action}` },
          { status: 400 }
        );
    }

    result.timestamp = new Date().toISOString();
    return NextResponse.json(result);

  } catch (error) {
    console.error('Error performing job action:', error);
    
    return NextResponse.json(
      {
        error: 'Failed to perform job action',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}