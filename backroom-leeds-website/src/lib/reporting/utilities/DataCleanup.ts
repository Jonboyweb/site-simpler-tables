/**
 * The Backroom Leeds - Data Cleanup Utilities
 * Version: 1.0.0
 * Phase: 3, Step 3.5
 * 
 * Data cleanup and maintenance utilities for the reporting system
 */

import { createClient } from '@/lib/supabase/server';

// ============================================================================
// DATA CLEANUP FUNCTIONS
// ============================================================================

export async function performCleanup(payload: {
  retentionDays?: number;
  cleanupType?: 'reports' | 'jobs' | 'metrics' | 'all';
}): Promise<{
  success: boolean;
  recordsProcessed: number;
  executionTimeMs: number;
  cleanupSummary: Record<string, number>;
}> {
  const startTime = Date.now();
  const { retentionDays = 90, cleanupType = 'all' } = payload;
  
  console.log(`🧹 Starting cleanup process: ${cleanupType}, retention: ${retentionDays} days`);

  const supabase = createClient();
  let totalRecords = 0;
  const cleanupSummary: Record<string, number> = {};

  try {
    if (cleanupType === 'reports' || cleanupType === 'all') {
      const reportsDeleted = await cleanupOldReports(supabase, retentionDays);
      cleanupSummary.reports = reportsDeleted;
      totalRecords += reportsDeleted;
    }

    if (cleanupType === 'jobs' || cleanupType === 'all') {
      const jobsDeleted = await cleanupOldJobs(supabase, retentionDays);
      cleanupSummary.jobs = jobsDeleted;
      totalRecords += jobsDeleted;
    }

    if (cleanupType === 'metrics' || cleanupType === 'all') {
      const metricsDeleted = await cleanupOldMetrics(supabase, retentionDays);
      cleanupSummary.metrics = metricsDeleted;
      totalRecords += metricsDeleted;
    }

    const executionTimeMs = Date.now() - startTime;
    
    console.log(`✅ Cleanup completed: ${totalRecords} records in ${executionTimeMs}ms`);

    return {
      success: true,
      recordsProcessed: totalRecords,
      executionTimeMs,
      cleanupSummary
    };

  } catch (error) {
    console.error('❌ Error during cleanup:', error);
    throw error;
  }
}

async function cleanupOldReports(supabase: any, retentionDays: number): Promise<number> {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

  const { data: deleted, error } = await supabase
    .from('report_generation_history')
    .delete()
    .lt('generated_at', cutoffDate.toISOString())
    .eq('is_successful', true)
    .select('id');

  if (error) {
    console.error('Error cleaning up reports:', error);
    return 0;
  }

  return deleted?.length || 0;
}

async function cleanupOldJobs(supabase: any, retentionDays: number): Promise<number> {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

  const { data: deleted, error } = await supabase
    .from('job_execution_history')
    .delete()
    .lt('completed_at', cutoffDate.toISOString())
    .eq('status', 'completed')
    .select('id');

  if (error) {
    console.error('Error cleaning up jobs:', error);
    return 0;
  }

  return deleted?.length || 0;
}

async function cleanupOldMetrics(supabase: any, retentionDays: number): Promise<number> {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

  const { data: deleted, error } = await supabase
    .from('report_metrics_cache')
    .delete()
    .lt('expires_at', cutoffDate.toISOString())
    .select('id');

  if (error) {
    console.error('Error cleaning up metrics cache:', error);
    return 0;
  }

  return deleted?.length || 0;
}