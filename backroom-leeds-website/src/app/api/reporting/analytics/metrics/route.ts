/**
 * The Backroom Leeds - Analytics Metrics API
 * Version: 1.0.0
 * Phase: 3, Step 3.5
 * 
 * API endpoints for real-time KPI metrics and business intelligence
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { AggregationPeriod, MetricType } from '@/types/reporting';
import { format, subDays, subWeeks, subMonths, startOfDay, endOfDay } from 'date-fns';

// ============================================================================
// GET: Retrieve KPI Metrics
// ============================================================================

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Parse query parameters
    const metrics = searchParams.get('metrics')?.split(',') || [];
    const periodStart = searchParams.get('periodStart');
    const periodEnd = searchParams.get('periodEnd');
    const aggregation = searchParams.get('aggregation') as AggregationPeriod || AggregationPeriod.DAILY;
    const groupBy = searchParams.get('groupBy')?.split(',') || [];
    const realtime = searchParams.get('realtime') === 'true';

    // Validate parameters
    if (metrics.length === 0) {
      return NextResponse.json(
        { error: 'At least one metric must be specified' },
        { status: 400 }
      );
    }

    const startDate = periodStart ? new Date(periodStart) : subDays(new Date(), 7);
    const endDate = periodEnd ? new Date(periodEnd) : new Date();

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return NextResponse.json(
        { error: 'Invalid date format' },
        { status: 400 }
      );
    }

    if (startDate >= endDate) {
      return NextResponse.json(
        { error: 'Start date must be before end date' },
        { status: 400 }
      );
    }

    // Get metrics data
    const metricsData = await getMetricsData({
      metrics,
      startDate,
      endDate,
      aggregation,
      groupBy,
      realtime
    });

    return NextResponse.json({
      metrics: metricsData,
      period: {
        start: startDate.toISOString(),
        end: endDate.toISOString(),
        aggregation
      },
      calculatedAt: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error retrieving metrics:', error);
    
    return NextResponse.json(
      {
        error: 'Failed to retrieve metrics',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// ============================================================================
// POST: Calculate Custom Metrics
// ============================================================================

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      customMetrics,
      periodStart,
      periodEnd,
      aggregation = AggregationPeriod.DAILY,
      filters = {}
    } = body;

    if (!customMetrics || !Array.isArray(customMetrics) || customMetrics.length === 0) {
      return NextResponse.json(
        { error: 'Custom metrics array is required' },
        { status: 400 }
      );
    }

    const startDate = periodStart ? new Date(periodStart) : subDays(new Date(), 7);
    const endDate = periodEnd ? new Date(periodEnd) : new Date();

    // Validate custom metrics structure
    for (const metric of customMetrics) {
      if (!metric.name || !metric.query || !metric.type) {
        return NextResponse.json(
          { error: 'Each custom metric must have name, query, and type fields' },
          { status: 400 }
        );
      }
    }

    // Calculate custom metrics
    const results = await Promise.all(
      customMetrics.map(metric => calculateCustomMetric(metric, startDate, endDate, aggregation, filters))
    );

    return NextResponse.json({
      metrics: results,
      period: {
        start: startDate.toISOString(),
        end: endDate.toISOString(),
        aggregation
      },
      calculatedAt: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error calculating custom metrics:', error);
    
    return NextResponse.json(
      {
        error: 'Failed to calculate custom metrics',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// ============================================================================
// METRICS CALCULATION FUNCTIONS
// ============================================================================

async function getMetricsData(params: {
  metrics: string[];
  startDate: Date;
  endDate: Date;
  aggregation: AggregationPeriod;
  groupBy: string[];
  realtime: boolean;
}) {
  const { metrics, startDate, endDate, aggregation, groupBy, realtime } = params;
  const supabase = createClient();

  const results = [];

  for (const metricName of metrics) {
    try {
      let metricData;

      switch (metricName) {
        case 'daily_revenue':
          metricData = await getDailyRevenue(supabase, startDate, endDate, aggregation);
          break;
        
        case 'total_bookings':
          metricData = await getTotalBookings(supabase, startDate, endDate, aggregation);
          break;
        
        case 'table_occupancy_rate':
          metricData = await getTableOccupancyRate(supabase, startDate, endDate, aggregation);
          break;
        
        case 'customer_satisfaction':
          metricData = await getCustomerSatisfaction(supabase, startDate, endDate, aggregation);
          break;
        
        case 'average_party_size':
          metricData = await getAveragePartySize(supabase, startDate, endDate, aggregation);
          break;
        
        case 'no_show_rate':
          metricData = await getNoShowRate(supabase, startDate, endDate, aggregation);
          break;
        
        case 'cancellation_rate':
          metricData = await getCancellationRate(supabase, startDate, endDate, aggregation);
          break;
        
        case 'revenue_per_guest':
          metricData = await getRevenuePerGuest(supabase, startDate, endDate, aggregation);
          break;
        
        case 'waitlist_conversion_rate':
          metricData = await getWaitlistConversionRate(supabase, startDate, endDate, aggregation);
          break;
        
        case 'event_performance':
          metricData = await getEventPerformance(supabase, startDate, endDate, aggregation, groupBy);
          break;
        
        default:
          // Try to find in KPI definitions
          metricData = await getKPIMetric(supabase, metricName, startDate, endDate, aggregation);
          break;
      }

      if (metricData) {
        results.push({
          name: metricName,
          ...metricData
        });
      }

    } catch (error) {
      console.error(`Error calculating metric ${metricName}:`, error);
      results.push({
        name: metricName,
        error: error instanceof Error ? error.message : 'Calculation failed',
        value: null,
        trend: 'stable',
        changePercentage: 0
      });
    }
  }

  return results;
}

// ============================================================================
// SPECIFIC METRIC CALCULATIONS
// ============================================================================

async function getDailyRevenue(supabase: any, startDate: Date, endDate: Date, aggregation: AggregationPeriod) {
  const { data, error } = await supabase
    .from('daily_aggregations')
    .select('aggregation_date, gross_revenue')
    .gte('aggregation_date', format(startDate, 'yyyy-MM-dd'))
    .lte('aggregation_date', format(endDate, 'yyyy-MM-dd'))
    .order('aggregation_date');

  if (error) throw error;

  const totalRevenue = data?.reduce((sum: number, day: any) => sum + day.gross_revenue, 0) || 0;
  const avgDailyRevenue = data?.length ? totalRevenue / data.length : 0;

  // Calculate trend (compare with previous period)
  const periodDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
  const previousStartDate = subDays(startDate, periodDays);
  const previousEndDate = subDays(endDate, periodDays);

  const { data: previousData } = await supabase
    .from('daily_aggregations')
    .select('gross_revenue')
    .gte('aggregation_date', format(previousStartDate, 'yyyy-MM-dd'))
    .lte('aggregation_date', format(previousEndDate, 'yyyy-MM-dd'));

  const previousRevenue = previousData?.reduce((sum: number, day: any) => sum + day.gross_revenue, 0) || 0;
  const changePercentage = previousRevenue > 0 ? ((totalRevenue - previousRevenue) / previousRevenue) * 100 : 0;

  return {
    value: aggregation === AggregationPeriod.DAILY ? avgDailyRevenue : totalRevenue,
    unit: '£',
    trend: changePercentage > 5 ? 'up' : changePercentage < -5 ? 'down' : 'stable',
    changePercentage: Math.round(changePercentage * 100) / 100,
    historicalData: data?.map((d: any) => ({
      date: d.aggregation_date,
      value: d.gross_revenue
    }))
  };
}

async function getTotalBookings(supabase: any, startDate: Date, endDate: Date, aggregation: AggregationPeriod) {
  const { data, error } = await supabase
    .from('daily_aggregations')
    .select('aggregation_date, total_bookings')
    .gte('aggregation_date', format(startDate, 'yyyy-MM-dd'))
    .lte('aggregation_date', format(endDate, 'yyyy-MM-dd'))
    .order('aggregation_date');

  if (error) throw error;

  const totalBookings = data?.reduce((sum: number, day: any) => sum + day.total_bookings, 0) || 0;
  const avgDailyBookings = data?.length ? totalBookings / data.length : 0;

  // Calculate trend
  const periodDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
  const previousStartDate = subDays(startDate, periodDays);
  const previousEndDate = subDays(endDate, periodDays);

  const { data: previousData } = await supabase
    .from('daily_aggregations')
    .select('total_bookings')
    .gte('aggregation_date', format(previousStartDate, 'yyyy-MM-dd'))
    .lte('aggregation_date', format(previousEndDate, 'yyyy-MM-dd'));

  const previousBookings = previousData?.reduce((sum: number, day: any) => sum + day.total_bookings, 0) || 0;
  const changePercentage = previousBookings > 0 ? ((totalBookings - previousBookings) / previousBookings) * 100 : 0;

  return {
    value: aggregation === AggregationPeriod.DAILY ? avgDailyBookings : totalBookings,
    unit: 'bookings',
    trend: changePercentage > 5 ? 'up' : changePercentage < -5 ? 'down' : 'stable',
    changePercentage: Math.round(changePercentage * 100) / 100,
    historicalData: data?.map((d: any) => ({
      date: d.aggregation_date,
      value: d.total_bookings
    }))
  };
}

async function getTableOccupancyRate(supabase: any, startDate: Date, endDate: Date, aggregation: AggregationPeriod) {
  const { data, error } = await supabase
    .from('daily_aggregations')
    .select('aggregation_date, average_occupancy_rate')
    .gte('aggregation_date', format(startDate, 'yyyy-MM-dd'))
    .lte('aggregation_date', format(endDate, 'yyyy-MM-dd'))
    .order('aggregation_date');

  if (error) throw error;

  const avgOccupancyRate = data?.length 
    ? data.reduce((sum: number, day: any) => sum + (day.average_occupancy_rate || 0), 0) / data.length 
    : 0;

  // Calculate trend
  const periodDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
  const previousStartDate = subDays(startDate, periodDays);
  const previousEndDate = subDays(endDate, periodDays);

  const { data: previousData } = await supabase
    .from('daily_aggregations')
    .select('average_occupancy_rate')
    .gte('aggregation_date', format(previousStartDate, 'yyyy-MM-dd'))
    .lte('aggregation_date', format(previousEndDate, 'yyyy-MM-dd'));

  const previousOccupancy = previousData?.length 
    ? previousData.reduce((sum: number, day: any) => sum + (day.average_occupancy_rate || 0), 0) / previousData.length 
    : 0;

  const changePercentage = previousOccupancy > 0 ? ((avgOccupancyRate - previousOccupancy) / previousOccupancy) * 100 : 0;

  return {
    value: Math.round(avgOccupancyRate * 100) / 100,
    unit: '%',
    trend: changePercentage > 2 ? 'up' : changePercentage < -2 ? 'down' : 'stable',
    changePercentage: Math.round(changePercentage * 100) / 100,
    historicalData: data?.map((d: any) => ({
      date: d.aggregation_date,
      value: d.average_occupancy_rate || 0
    }))
  };
}

async function getCustomerSatisfaction(supabase: any, startDate: Date, endDate: Date, aggregation: AggregationPeriod) {
  const { data, error } = await supabase
    .from('event_performance_analytics')
    .select('event_date, feedback_score, feedback_count')
    .gte('event_date', format(startDate, 'yyyy-MM-dd'))
    .lte('event_date', format(endDate, 'yyyy-MM-dd'))
    .not('feedback_score', 'is', null);

  if (error) throw error;

  if (!data?.length) {
    return {
      value: null,
      unit: '',
      trend: 'stable',
      changePercentage: 0,
      note: 'No customer satisfaction data available'
    };
  }

  // Calculate weighted average
  let totalScore = 0;
  let totalCount = 0;

  data.forEach((event: any) => {
    if (event.feedback_score && event.feedback_count) {
      totalScore += event.feedback_score * event.feedback_count;
      totalCount += event.feedback_count;
    }
  });

  const avgSatisfaction = totalCount > 0 ? totalScore / totalCount : 0;

  return {
    value: Math.round(avgSatisfaction * 100) / 100,
    unit: '/5.0',
    trend: avgSatisfaction > 4 ? 'up' : avgSatisfaction < 3.5 ? 'down' : 'stable',
    changePercentage: 0, // Would need historical data for comparison
    totalFeedbackCount: totalCount
  };
}

async function getAveragePartySize(supabase: any, startDate: Date, endDate: Date, aggregation: AggregationPeriod) {
  const { data, error } = await supabase
    .from('bookings')
    .select('party_size')
    .gte('booking_date', format(startDate, 'yyyy-MM-dd'))
    .lte('booking_date', format(endDate, 'yyyy-MM-dd'))
    .eq('status', 'confirmed');

  if (error) throw error;

  const avgPartySize = data?.length 
    ? data.reduce((sum: number, booking: any) => sum + booking.party_size, 0) / data.length 
    : 0;

  return {
    value: Math.round(avgPartySize * 100) / 100,
    unit: 'guests',
    trend: avgPartySize > 4 ? 'up' : avgPartySize < 3 ? 'down' : 'stable',
    changePercentage: 0 // Would need historical comparison
  };
}

async function getNoShowRate(supabase: any, startDate: Date, endDate: Date, aggregation: AggregationPeriod) {
  const { data, error } = await supabase
    .from('bookings')
    .select('status')
    .gte('booking_date', format(startDate, 'yyyy-MM-dd'))
    .lte('booking_date', format(endDate, 'yyyy-MM-dd'));

  if (error) throw error;

  if (!data?.length) {
    return {
      value: 0,
      unit: '%',
      trend: 'stable',
      changePercentage: 0
    };
  }

  const noShowCount = data.filter((booking: any) => booking.status === 'no_show').length;
  const noShowRate = (noShowCount / data.length) * 100;

  return {
    value: Math.round(noShowRate * 100) / 100,
    unit: '%',
    trend: noShowRate > 15 ? 'down' : noShowRate < 5 ? 'up' : 'stable', // Lower is better
    changePercentage: 0, // Would need historical comparison
    totalBookings: data.length,
    noShowCount
  };
}

async function getCancellationRate(supabase: any, startDate: Date, endDate: Date, aggregation: AggregationPeriod) {
  const { data, error } = await supabase
    .from('bookings')
    .select('status')
    .gte('booking_date', format(startDate, 'yyyy-MM-dd'))
    .lte('booking_date', format(endDate, 'yyyy-MM-dd'));

  if (error) throw error;

  if (!data?.length) {
    return {
      value: 0,
      unit: '%',
      trend: 'stable',
      changePercentage: 0
    };
  }

  const cancelledCount = data.filter((booking: any) => booking.status === 'cancelled').length;
  const cancellationRate = (cancelledCount / data.length) * 100;

  return {
    value: Math.round(cancellationRate * 100) / 100,
    unit: '%',
    trend: cancellationRate > 20 ? 'down' : cancellationRate < 10 ? 'up' : 'stable', // Lower is better
    changePercentage: 0, // Would need historical comparison
    totalBookings: data.length,
    cancelledCount
  };
}

async function getRevenuePerGuest(supabase: any, startDate: Date, endDate: Date, aggregation: AggregationPeriod) {
  const { data, error } = await supabase
    .from('bookings')
    .select('total_amount, party_size')
    .gte('booking_date', format(startDate, 'yyyy-MM-dd'))
    .lte('booking_date', format(endDate, 'yyyy-MM-dd'))
    .eq('status', 'confirmed');

  if (error) throw error;

  if (!data?.length) {
    return {
      value: 0,
      unit: '£',
      trend: 'stable',
      changePercentage: 0
    };
  }

  const totalRevenue = data.reduce((sum: number, booking: any) => sum + booking.total_amount, 0);
  const totalGuests = data.reduce((sum: number, booking: any) => sum + booking.party_size, 0);
  const revenuePerGuest = totalGuests > 0 ? totalRevenue / totalGuests : 0;

  return {
    value: Math.round(revenuePerGuest * 100) / 100,
    unit: '£',
    trend: revenuePerGuest > 50 ? 'up' : revenuePerGuest < 35 ? 'down' : 'stable',
    changePercentage: 0, // Would need historical comparison
    totalRevenue,
    totalGuests
  };
}

async function getWaitlistConversionRate(supabase: any, startDate: Date, endDate: Date, aggregation: AggregationPeriod) {
  // This would require waitlist tracking implementation
  return {
    value: 0,
    unit: '%',
    trend: 'stable',
    changePercentage: 0,
    note: 'Waitlist conversion tracking not yet implemented'
  };
}

async function getEventPerformance(supabase: any, startDate: Date, endDate: Date, aggregation: AggregationPeriod, groupBy: string[]) {
  const { data, error } = await supabase
    .from('event_performance_analytics')
    .select('*')
    .gte('event_date', format(startDate, 'yyyy-MM-dd'))
    .lte('event_date', format(endDate, 'yyyy-MM-dd'))
    .order('total_revenue', { ascending: false });

  if (error) throw error;

  return {
    value: data?.length || 0,
    unit: 'events',
    trend: 'stable',
    changePercentage: 0,
    events: data?.map((event: any) => ({
      name: event.event_name,
      date: event.event_date,
      revenue: event.total_revenue,
      guests: event.total_guests,
      occupancyRate: event.table_occupancy_rate
    }))
  };
}

async function getKPIMetric(supabase: any, metricName: string, startDate: Date, endDate: Date, aggregation: AggregationPeriod) {
  const { data: kpiDef, error } = await supabase
    .from('kpi_definitions')
    .select('*')
    .eq('name', metricName)
    .eq('is_active', true)
    .single();

  if (error || !kpiDef) {
    throw new Error(`KPI metric '${metricName}' not found`);
  }

  // This would execute the custom KPI calculation query
  // For now, return a placeholder
  return {
    value: 0,
    unit: kpiDef.unit || '',
    trend: 'stable',
    changePercentage: 0,
    note: 'Custom KPI calculation not yet implemented'
  };
}

async function calculateCustomMetric(metric: any, startDate: Date, endDate: Date, aggregation: AggregationPeriod, filters: any) {
  // This would execute custom metric queries
  // For now, return a placeholder
  return {
    name: metric.name,
    value: 0,
    unit: '',
    trend: 'stable',
    changePercentage: 0,
    note: 'Custom metric calculation not yet implemented'
  };
}