/**
 * The Backroom Leeds - Daily Report Generation API
 * Version: 1.0.0
 * Phase: 3, Step 3.5
 * 
 * API endpoint for manual daily report generation
 */

import { NextRequest, NextResponse } from 'next/server';
import { DailySummaryGenerator } from '@/lib/reporting/generators/DailySummaryGenerator';
import { getJobScheduler } from '@/lib/reporting/jobs/JobScheduler';
import { getJobMonitor } from '@/lib/reporting/jobs/JobMonitor';
import { ReportFormat, JobPriority } from '@/types/reporting';

// ============================================================================
// POST: Generate Daily Report
// ============================================================================

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const {
      reportDate,
      format = ReportFormat.PDF,
      recipientIds = [],
      templateId,
      async: isAsync = false
    } = body;

    // Validate required fields
    if (reportDate && isNaN(new Date(reportDate).getTime())) {
      return NextResponse.json(
        { error: 'Invalid report date provided' },
        { status: 400 }
      );
    }

    const targetDate = reportDate ? new Date(reportDate) : new Date();

    // Handle async generation
    if (isAsync) {
      const scheduler = await getJobScheduler();
      const monitor = getJobMonitor();
      
      // Create job execution record
      const executionId = await monitor.recordJobExecution({
        jobId: 'manual-daily-report',
        executionId: `daily-${Date.now()}`,
        status: 'pending' as any,
        attemptNumber: 1,
        metadata: {
          reportDate: targetDate.toISOString(),
          format,
          recipientIds,
          requestedBy: 'api'
        }
      });

      // Schedule the job
      const jobId = await scheduler.scheduleOneTimeJob(
        'manual-daily-report',
        'daily_summary',
        {
          reportDate: targetDate,
          format,
          recipientIds,
          templateId
        },
        0, // No delay
        { priority: JobPriority.HIGH }
      );

      return NextResponse.json({
        status: 'queued',
        jobId,
        executionId,
        estimatedCompletionTime: new Date(Date.now() + 60000), // 1 minute estimate
        message: 'Daily report generation has been queued'
      });
    }

    // Handle synchronous generation
    const generator = new DailySummaryGenerator();
    
    const startTime = Date.now();
    const result = await generator.generate({
      reportDate: targetDate,
      recipientIds,
      format,
      templateId
    });

    const executionTime = Date.now() - startTime;

    return NextResponse.json({
      status: 'completed',
      reportId: result.reportId,
      reportData: result.reportData,
      filePath: result.filePath,
      fileUrl: result.fileUrl,
      executionTimeMs: executionTime,
      generatedAt: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error generating daily report:', error);
    
    return NextResponse.json(
      {
        error: 'Failed to generate daily report',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// ============================================================================
// GET: Get Daily Report Status/History
// ============================================================================

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const reportDate = searchParams.get('date');
    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = parseInt(searchParams.get('offset') || '0');

    if (reportDate && isNaN(new Date(reportDate).getTime())) {
      return NextResponse.json(
        { error: 'Invalid date parameter' },
        { status: 400 }
      );
    }

    const { createClient } = await import('@/lib/supabase/server');
    const supabase = createClient();

    let query = supabase
      .from('report_generation_history')
      .select(`
        *,
        report_templates (name, report_type)
      `)
      .eq('report_type', 'daily_summary')
      .order('generated_at', { ascending: false });

    // Filter by date if provided
    if (reportDate) {
      const date = new Date(reportDate);
      const startOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());
      const endOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59);
      
      query = query
        .gte('data_period_start', startOfDay.toISOString())
        .lte('data_period_end', endOfDay.toISOString());
    }

    // Apply pagination
    query = query.range(offset, offset + limit - 1);

    const { data: reports, error } = await query;

    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }

    return NextResponse.json({
      reports: reports || [],
      pagination: {
        limit,
        offset,
        hasMore: (reports?.length || 0) === limit
      }
    });

  } catch (error) {
    console.error('Error getting daily report history:', error);
    
    return NextResponse.json(
      {
        error: 'Failed to retrieve daily report history',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// ============================================================================
// PUT: Regenerate Daily Report
// ============================================================================

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { reportId, format, recipientIds } = body;

    if (!reportId) {
      return NextResponse.json(
        { error: 'Report ID is required for regeneration' },
        { status: 400 }
      );
    }

    // Get original report details
    const { createClient } = await import('@/lib/supabase/server');
    const supabase = createClient();

    const { data: originalReport, error } = await supabase
      .from('report_generation_history')
      .select('*')
      .eq('id', reportId)
      .single();

    if (error || !originalReport) {
      return NextResponse.json(
        { error: 'Original report not found' },
        { status: 404 }
      );
    }

    // Regenerate with same date range
    const generator = new DailySummaryGenerator();
    
    const result = await generator.generate({
      reportDate: new Date(originalReport.data_period_start),
      recipientIds: recipientIds || [],
      format: format || originalReport.output_format,
      templateId: originalReport.template_id
    });

    return NextResponse.json({
      status: 'completed',
      reportId: result.reportId,
      originalReportId: reportId,
      reportData: result.reportData,
      filePath: result.filePath,
      fileUrl: result.fileUrl,
      regeneratedAt: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error regenerating daily report:', error);
    
    return NextResponse.json(
      {
        error: 'Failed to regenerate daily report',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// ============================================================================
// DELETE: Cancel Queued Report Generation
// ============================================================================

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const jobId = searchParams.get('jobId');

    if (!jobId) {
      return NextResponse.json(
        { error: 'Job ID is required for cancellation' },
        { status: 400 }
      );
    }

    const scheduler = await getJobScheduler();
    await scheduler.removeJob(jobId);

    return NextResponse.json({
      status: 'cancelled',
      jobId,
      cancelledAt: new Date().toISOString(),
      message: 'Daily report generation has been cancelled'
    });

  } catch (error) {
    console.error('Error cancelling daily report generation:', error);
    
    return NextResponse.json(
      {
        error: 'Failed to cancel daily report generation',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}