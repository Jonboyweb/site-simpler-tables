/**
 * The Backroom Leeds - Weekly Report Generation API
 * Version: 1.0.0
 * Phase: 3, Step 3.5
 * 
 * API endpoint for manual weekly report generation
 */

import { NextRequest, NextResponse } from 'next/server';
import { WeeklySummaryGenerator } from '@/lib/reporting/generators/WeeklySummaryGenerator';
import { getJobScheduler } from '@/lib/reporting/jobs/JobScheduler';
import { getJobMonitor } from '@/lib/reporting/jobs/JobMonitor';
import { ReportFormat, JobPriority } from '@/types/reporting';
import { startOfWeek, endOfWeek } from 'date-fns';

// ============================================================================
// POST: Generate Weekly Report
// ============================================================================

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const {
      weekStart,
      format = ReportFormat.PDF,
      recipientIds = [],
      templateId,
      async: isAsync = false
    } = body;

    // Validate and normalize week start date
    let targetWeekStart: Date;
    if (weekStart) {
      const parsedDate = new Date(weekStart);
      if (isNaN(parsedDate.getTime())) {
        return NextResponse.json(
          { error: 'Invalid week start date provided' },
          { status: 400 }
        );
      }
      targetWeekStart = startOfWeek(parsedDate, { weekStartsOn: 1 }); // Monday start
    } else {
      targetWeekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
    }

    const targetWeekEnd = endOfWeek(targetWeekStart, { weekStartsOn: 1 });

    // Handle async generation
    if (isAsync) {
      const scheduler = await getJobScheduler();
      const monitor = getJobMonitor();
      
      // Create job execution record
      const executionId = await monitor.recordJobExecution({
        jobId: 'manual-weekly-report',
        executionId: `weekly-${Date.now()}`,
        status: 'pending' as any,
        attemptNumber: 1,
        metadata: {
          weekStart: targetWeekStart.toISOString(),
          weekEnd: targetWeekEnd.toISOString(),
          format,
          recipientIds,
          requestedBy: 'api'
        }
      });

      // Schedule the job
      const jobId = await scheduler.scheduleOneTimeJob(
        'manual-weekly-report',
        'weekly_summary',
        {
          weekStart: targetWeekStart,
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
        estimatedCompletionTime: new Date(Date.now() + 120000), // 2 minute estimate
        weekStart: targetWeekStart.toISOString(),
        weekEnd: targetWeekEnd.toISOString(),
        message: 'Weekly report generation has been queued'
      });
    }

    // Handle synchronous generation
    const generator = new WeeklySummaryGenerator();
    
    const startTime = Date.now();
    const result = await generator.generate({
      weekStart: targetWeekStart,
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
      weekStart: targetWeekStart.toISOString(),
      weekEnd: targetWeekEnd.toISOString(),
      executionTimeMs: executionTime,
      generatedAt: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error generating weekly report:', error);
    
    return NextResponse.json(
      {
        error: 'Failed to generate weekly report',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// ============================================================================
// GET: Get Weekly Report Status/History
// ============================================================================

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const weekStartParam = searchParams.get('weekStart');
    const year = parseInt(searchParams.get('year') || new Date().getFullYear().toString());
    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = parseInt(searchParams.get('offset') || '0');

    const { createClient } = await import('@/lib/supabase/server');
    const supabase = createClient();

    let query = supabase
      .from('report_generation_history')
      .select(`
        *,
        report_templates (name, report_type)
      `)
      .eq('report_type', 'weekly_summary')
      .order('generated_at', { ascending: false });

    // Filter by specific week if provided
    if (weekStartParam) {
      const weekStart = new Date(weekStartParam);
      if (!isNaN(weekStart.getTime())) {
        const normalizedWeekStart = startOfWeek(weekStart, { weekStartsOn: 1 });
        const weekEnd = endOfWeek(normalizedWeekStart, { weekStartsOn: 1 });
        
        query = query
          .gte('data_period_start', normalizedWeekStart.toISOString())
          .lte('data_period_end', weekEnd.toISOString());
      }
    } else {
      // Filter by year
      const yearStart = new Date(year, 0, 1);
      const yearEnd = new Date(year, 11, 31, 23, 59, 59);
      
      query = query
        .gte('data_period_start', yearStart.toISOString())
        .lte('data_period_end', yearEnd.toISOString());
    }

    // Apply pagination
    query = query.range(offset, offset + limit - 1);

    const { data: reports, error } = await query;

    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }

    // Get summary statistics for the year
    const { data: yearStats, error: statsError } = await supabase
      .from('report_generation_history')
      .select('generated_at, key_metrics')
      .eq('report_type', 'weekly_summary')
      .gte('generated_at', new Date(year, 0, 1).toISOString())
      .lte('generated_at', new Date(year, 11, 31, 23, 59, 59).toISOString());

    const statistics = {
      totalWeeklyReports: yearStats?.length || 0,
      year,
      avgGenerationTime: yearStats?.length 
        ? yearStats.reduce((sum, r) => sum + (r.key_metrics?.executionTimeMs || 0), 0) / yearStats.length
        : 0
    };

    return NextResponse.json({
      reports: reports || [],
      statistics,
      pagination: {
        limit,
        offset,
        hasMore: (reports?.length || 0) === limit
      }
    });

  } catch (error) {
    console.error('Error getting weekly report history:', error);
    
    return NextResponse.json(
      {
        error: 'Failed to retrieve weekly report history',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// ============================================================================
// PUT: Regenerate Weekly Report
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
    const generator = new WeeklySummaryGenerator();
    
    const result = await generator.generate({
      weekStart: new Date(originalReport.data_period_start),
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
    console.error('Error regenerating weekly report:', error);
    
    return NextResponse.json(
      {
        error: 'Failed to regenerate weekly report',
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
      message: 'Weekly report generation has been cancelled'
    });

  } catch (error) {
    console.error('Error cancelling weekly report generation:', error);
    
    return NextResponse.json(
      {
        error: 'Failed to cancel weekly report generation',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}