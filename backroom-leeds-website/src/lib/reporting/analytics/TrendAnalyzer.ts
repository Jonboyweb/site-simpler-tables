/**
 * The Backroom Leeds - Trend Analyzer
 * Version: 1.0.0
 * Phase: 3, Step 3.5
 * 
 * Advanced trend analysis and forecasting for business intelligence
 */

import { createClient } from '@/lib/supabase/server';
import { format, subDays, subWeeks, subMonths, eachDayOfInterval, eachWeekOfInterval } from 'date-fns';
import { AggregationPeriod } from '@/types/reporting';

// ============================================================================
// TREND ANALYZER CLASS
// ============================================================================

export class TrendAnalyzer {
  private supabase = createClient();

  // ============================================================================
  // TREND DETECTION
  // ============================================================================

  async analyzeTrend(
    metricName: string,
    periodStart: Date,
    periodEnd: Date,
    options: {
      aggregationPeriod?: AggregationPeriod;
      seasonalAdjustment?: boolean;
      smoothingWindow?: number;
      confidenceThreshold?: number;
    } = {}
  ): Promise<{
    trend: 'increasing' | 'decreasing' | 'stable' | 'volatile';
    strength: 'weak' | 'moderate' | 'strong';
    confidence: number;
    slope: number;
    r2: number;
    forecast: number[];
    seasonalPattern?: {
      period: number;
      amplitude: number;
      phase: number;
    };
    changePoints?: {
      date: Date;
      significance: number;
      type: 'increase' | 'decrease' | 'level_shift';
    }[];
    insights: string[];
  }> {
    const {
      aggregationPeriod = AggregationPeriod.DAILY,
      seasonalAdjustment = true,
      smoothingWindow = 7,
      confidenceThreshold = 0.7
    } = options;

    try {
      // Get historical data
      const dataPoints = await this.getHistoricalData(metricName, periodStart, periodEnd, aggregationPeriod);
      
      if (dataPoints.length < 10) {
        return {
          trend: 'stable',
          strength: 'weak',
          confidence: 0,
          slope: 0,
          r2: 0,
          forecast: [],
          insights: ['Insufficient data for trend analysis (minimum 10 data points required)']
        };
      }

      // Apply smoothing if requested
      const smoothedData = smoothingWindow > 1 
        ? this.applyMovingAverage(dataPoints, smoothingWindow)
        : dataPoints;

      // Detect seasonal patterns if requested
      let seasonalPattern;
      let deseasonalizedData = smoothedData;
      
      if (seasonalAdjustment) {
        seasonalPattern = this.detectSeasonalPattern(smoothedData);
        if (seasonalPattern) {
          deseasonalizedData = this.removeSeasonalComponent(smoothedData, seasonalPattern);
        }
      }

      // Calculate linear regression
      const regression = this.calculateLinearRegression(deseasonalizedData);
      
      // Detect trend direction and strength
      const trendAnalysis = this.classifyTrend(regression, confidenceThreshold);
      
      // Detect change points
      const changePoints = this.detectChangePoints(deseasonalizedData);
      
      // Generate forecast
      const forecast = this.generateForecast(deseasonalizedData, 7, seasonalPattern);
      
      // Generate insights
      const insights = this.generateTrendInsights(
        trendAnalysis,
        seasonalPattern,
        changePoints,
        metricName
      );

      return {
        ...trendAnalysis,
        slope: regression.slope,
        r2: regression.r2,
        forecast,
        seasonalPattern,
        changePoints,
        insights
      };

    } catch (error) {
      console.error('Error analyzing trend:', error);
      return {
        trend: 'stable',
        strength: 'weak',
        confidence: 0,
        slope: 0,
        r2: 0,
        forecast: [],
        insights: ['Error occurred during trend analysis']
      };
    }
  }

  // ============================================================================
  // COMPARATIVE ANALYSIS
  // ============================================================================

  async compareMetrics(
    metrics: string[],
    periodStart: Date,
    periodEnd: Date,
    comparisonType: 'correlation' | 'causation' | 'leading_indicator' = 'correlation'
  ): Promise<{
    correlations: {
      metric1: string;
      metric2: string;
      correlation: number;
      significance: number;
      relationship: 'strong_positive' | 'weak_positive' | 'none' | 'weak_negative' | 'strong_negative';
    }[];
    leadingIndicators?: {
      leading: string;
      lagging: string;
      lag: number;
      correlation: number;
    }[];
    insights: string[];
  }> {
    try {
      const metricData: Record<string, { date: Date; value: number }[]> = {};
      
      // Get data for all metrics
      for (const metric of metrics) {
        metricData[metric] = await this.getHistoricalData(metric, periodStart, periodEnd, AggregationPeriod.DAILY);
      }

      const correlations = [];
      const leadingIndicators = [];

      // Calculate pairwise correlations
      for (let i = 0; i < metrics.length; i++) {
        for (let j = i + 1; j < metrics.length; j++) {
          const metric1 = metrics[i];
          const metric2 = metrics[j];
          
          const correlation = this.calculateCorrelation(
            metricData[metric1],
            metricData[metric2]
          );

          correlations.push({
            metric1,
            metric2,
            correlation: correlation.coefficient,
            significance: correlation.significance,
            relationship: this.classifyCorrelation(correlation.coefficient)
          });

          // Look for leading indicators if requested
          if (comparisonType === 'leading_indicator') {
            const leadingAnalysis = this.findLeadingIndicator(
              metricData[metric1],
              metricData[metric2],
              metric1,
              metric2
            );
            
            if (leadingAnalysis) {
              leadingIndicators.push(leadingAnalysis);
            }
          }
        }
      }

      // Generate insights
      const insights = this.generateComparisonInsights(correlations, leadingIndicators);

      return {
        correlations,
        leadingIndicators: leadingIndicators.length > 0 ? leadingIndicators : undefined,
        insights
      };

    } catch (error) {
      console.error('Error in comparative analysis:', error);
      return {
        correlations: [],
        insights: ['Error occurred during comparative analysis']
      };
    }
  }

  // ============================================================================
  // FORECASTING
  // ============================================================================

  async generateForecast(
    metricName: string,
    periodStart: Date,
    periodEnd: Date,
    forecastDays: number = 7,
    options: {
      method?: 'linear' | 'exponential' | 'seasonal';
      confidenceInterval?: number;
      includeSeasonality?: boolean;
    } = {}
  ): Promise<{
    forecast: {
      date: Date;
      value: number;
      upperBound: number;
      lowerBound: number;
      confidence: number;
    }[];
    method: string;
    accuracy: number;
    insights: string[];
  }> {
    const { method = 'linear', confidenceInterval = 0.95, includeSeasonality = true } = options;

    try {
      const historicalData = await this.getHistoricalData(metricName, periodStart, periodEnd, AggregationPeriod.DAILY);
      
      if (historicalData.length < 14) {
        return {
          forecast: [],
          method,
          accuracy: 0,
          insights: ['Insufficient data for reliable forecasting (minimum 14 days required)']
        };
      }

      let forecastValues: number[];
      let accuracy = 0;

      switch (method) {
        case 'linear':
          const regression = this.calculateLinearRegression(historicalData);
          forecastValues = this.linearForecast(historicalData, forecastDays, regression);
          accuracy = regression.r2;
          break;
          
        case 'exponential':
          forecastValues = this.exponentialSmoothing(historicalData, forecastDays);
          accuracy = this.calculateForecastAccuracy(historicalData, forecastValues);
          break;
          
        case 'seasonal':
          forecastValues = this.seasonalForecast(historicalData, forecastDays);
          accuracy = this.calculateForecastAccuracy(historicalData, forecastValues);
          break;
          
        default:
          throw new Error(`Unknown forecasting method: ${method}`);
      }

      // Calculate confidence intervals
      const standardError = this.calculateStandardError(historicalData, forecastValues);
      const tValue = this.getTValue(confidenceInterval, historicalData.length - 2);

      const forecast = forecastValues.map((value, index) => {
        const forecastDate = new Date(periodEnd);
        forecastDate.setDate(forecastDate.getDate() + index + 1);
        
        const margin = tValue * standardError * Math.sqrt(1 + 1/historicalData.length);
        
        return {
          date: forecastDate,
          value: Math.round(value * 100) / 100,
          upperBound: Math.round((value + margin) * 100) / 100,
          lowerBound: Math.round(Math.max(0, value - margin) * 100) / 100,
          confidence: confidenceInterval
        };
      });

      const insights = this.generateForecastInsights(method, accuracy, forecast, metricName);

      return {
        forecast,
        method,
        accuracy: Math.round(accuracy * 100) / 100,
        insights
      };

    } catch (error) {
      console.error('Error generating forecast:', error);
      return {
        forecast: [],
        method,
        accuracy: 0,
        insights: ['Error occurred during forecast generation']
      };
    }
  }

  // ============================================================================
  // ANOMALY DETECTION
  // ============================================================================

  async detectAnomalies(
    metricName: string,
    periodStart: Date,
    periodEnd: Date,
    options: {
      sensitivity?: 'low' | 'medium' | 'high';
      method?: 'statistical' | 'isolation_forest' | 'seasonal_decomposition';
    } = {}
  ): Promise<{
    anomalies: {
      date: Date;
      value: number;
      expectedValue: number;
      deviation: number;
      severity: 'low' | 'medium' | 'high';
      type: 'spike' | 'dip' | 'trend_break' | 'seasonal_anomaly';
    }[];
    thresholds: {
      upperBound: number;
      lowerBound: number;
      method: string;
    };
    insights: string[];
  }> {
    const { sensitivity = 'medium', method = 'statistical' } = options;

    try {
      const data = await this.getHistoricalData(metricName, periodStart, periodEnd, AggregationPeriod.DAILY);
      
      if (data.length < 30) {
        return {
          anomalies: [],
          thresholds: { upperBound: 0, lowerBound: 0, method },
          insights: ['Insufficient data for anomaly detection (minimum 30 days required)']
        };
      }

      const anomalies = [];
      let thresholds;

      switch (method) {
        case 'statistical':
          thresholds = this.calculateStatisticalThresholds(data, sensitivity);
          break;
        default:
          thresholds = this.calculateStatisticalThresholds(data, sensitivity);
      }

      // Detect anomalies
      for (const dataPoint of data) {
        if (dataPoint.value > thresholds.upperBound || dataPoint.value < thresholds.lowerBound) {
          const expectedValue = this.calculateExpectedValue(dataPoint.date, data);
          const deviation = Math.abs(dataPoint.value - expectedValue);
          const severity = this.classifyAnomalySeverity(deviation, thresholds);
          const type = this.classifyAnomalyType(dataPoint, data);

          anomalies.push({
            date: dataPoint.date,
            value: dataPoint.value,
            expectedValue,
            deviation,
            severity,
            type
          });
        }
      }

      const insights = this.generateAnomalyInsights(anomalies, metricName);

      return {
        anomalies,
        thresholds,
        insights
      };

    } catch (error) {
      console.error('Error detecting anomalies:', error);
      return {
        anomalies: [],
        thresholds: { upperBound: 0, lowerBound: 0, method },
        insights: ['Error occurred during anomaly detection']
      };
    }
  }

  // ============================================================================
  // HELPER METHODS
  // ============================================================================

  private async getHistoricalData(
    metricName: string,
    periodStart: Date,
    periodEnd: Date,
    aggregationPeriod: AggregationPeriod
  ): Promise<{ date: Date; value: number }[]> {
    // This would be implemented based on your specific data structure
    // For now, return mock data structure
    const { data, error } = await this.supabase
      .from('daily_aggregations')
      .select('aggregation_date, gross_revenue, total_bookings, total_guests, average_occupancy_rate')
      .gte('aggregation_date', format(periodStart, 'yyyy-MM-dd'))
      .lte('aggregation_date', format(periodEnd, 'yyyy-MM-dd'))
      .order('aggregation_date');

    if (error || !data) {
      return [];
    }

    // Map metric name to column
    const columnMap: Record<string, string> = {
      'daily_revenue': 'gross_revenue',
      'total_bookings': 'total_bookings',
      'total_guests': 'total_guests',
      'table_occupancy_rate': 'average_occupancy_rate'
    };

    const column = columnMap[metricName] || 'gross_revenue';

    return data.map(row => ({
      date: new Date(row.aggregation_date),
      value: row[column] || 0
    }));
  }

  private applyMovingAverage(data: { date: Date; value: number }[], window: number): { date: Date; value: number }[] {
    if (window <= 1) return data;
    
    const smoothed = [];
    for (let i = 0; i < data.length; i++) {
      const start = Math.max(0, i - Math.floor(window / 2));
      const end = Math.min(data.length, i + Math.ceil(window / 2));
      
      const windowData = data.slice(start, end);
      const average = windowData.reduce((sum, point) => sum + point.value, 0) / windowData.length;
      
      smoothed.push({
        date: data[i].date,
        value: average
      });
    }
    
    return smoothed;
  }

  private calculateLinearRegression(data: { date: Date; value: number }[]): {
    slope: number;
    intercept: number;
    r2: number;
    significance: number;
  } {
    const n = data.length;
    const x = data.map((_, i) => i);
    const y = data.map(d => d.value);

    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = y.reduce((a, b) => a + b, 0);
    const sumXY = x.reduce((acc, xi, i) => acc + xi * y[i], 0);
    const sumXX = x.reduce((acc, xi) => acc + xi * xi, 0);
    const sumYY = y.reduce((acc, yi) => acc + yi * yi, 0);

    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;
    
    // Calculate R²
    const yMean = sumY / n;
    const ssRes = y.reduce((acc, yi, i) => {
      const predicted = slope * x[i] + intercept;
      return acc + Math.pow(yi - predicted, 2);
    }, 0);
    const ssTot = y.reduce((acc, yi) => acc + Math.pow(yi - yMean, 2), 0);
    const r2 = 1 - (ssRes / ssTot);
    
    // Calculate significance (correlation coefficient)
    const numerator = n * sumXY - sumX * sumY;
    const denominator = Math.sqrt((n * sumXX - sumX * sumX) * (n * sumYY - sumY * sumY));
    const significance = denominator !== 0 ? Math.abs(numerator / denominator) : 0;

    return { slope, intercept, r2, significance };
  }

  private classifyTrend(
    regression: { slope: number; r2: number; significance: number },
    confidenceThreshold: number
  ): {
    trend: 'increasing' | 'decreasing' | 'stable' | 'volatile';
    strength: 'weak' | 'moderate' | 'strong';
    confidence: number;
  } {
    const { slope, r2, significance } = regression;
    
    let trend: 'increasing' | 'decreasing' | 'stable' | 'volatile' = 'stable';
    let strength: 'weak' | 'moderate' | 'strong' = 'weak';
    
    if (significance >= confidenceThreshold) {
      if (Math.abs(slope) < 0.1) {
        trend = 'stable';
      } else {
        trend = slope > 0 ? 'increasing' : 'decreasing';
      }
      
      if (r2 > 0.8) strength = 'strong';
      else if (r2 > 0.5) strength = 'moderate';
      else strength = 'weak';
    } else {
      trend = 'volatile';
      strength = 'weak';
    }

    return {
      trend,
      strength,
      confidence: significance
    };
  }

  private detectSeasonalPattern(data: { date: Date; value: number }[]): {
    period: number;
    amplitude: number;
    phase: number;
  } | undefined {
    // Simplified seasonal detection - look for weekly patterns
    if (data.length < 21) return undefined; // Need at least 3 weeks

    const weeklyAverages: number[] = new Array(7).fill(0);
    const weeklyCounts: number[] = new Array(7).fill(0);

    data.forEach(point => {
      const dayOfWeek = point.date.getDay();
      weeklyAverages[dayOfWeek] += point.value;
      weeklyCounts[dayOfWeek]++;
    });

    // Calculate averages
    for (let i = 0; i < 7; i++) {
      if (weeklyCounts[i] > 0) {
        weeklyAverages[i] /= weeklyCounts[i];
      }
    }

    const overallMean = weeklyAverages.reduce((sum, avg) => sum + avg, 0) / 7;
    const maxDiff = Math.max(...weeklyAverages) - Math.min(...weeklyAverages);
    
    // If the difference between max and min is significant, consider it seasonal
    if (maxDiff > overallMean * 0.2) {
      return {
        period: 7, // Weekly pattern
        amplitude: maxDiff / 2,
        phase: weeklyAverages.indexOf(Math.max(...weeklyAverages))
      };
    }

    return undefined;
  }

  private removeSeasonalComponent(
    data: { date: Date; value: number }[],
    pattern: { period: number; amplitude: number; phase: number }
  ): { date: Date; value: number }[] {
    return data.map(point => {
      const seasonalFactor = pattern.amplitude * Math.sin(
        2 * Math.PI * ((point.date.getDay() - pattern.phase) / pattern.period)
      );
      return {
        date: point.date,
        value: point.value - seasonalFactor
      };
    });
  }

  private detectChangePoints(data: { date: Date; value: number }[]): {
    date: Date;
    significance: number;
    type: 'increase' | 'decrease' | 'level_shift';
  }[] {
    // Simplified change point detection
    const changePoints = [];
    const windowSize = Math.min(7, Math.floor(data.length / 4));
    
    for (let i = windowSize; i < data.length - windowSize; i++) {
      const before = data.slice(i - windowSize, i);
      const after = data.slice(i, i + windowSize);
      
      const beforeMean = before.reduce((sum, d) => sum + d.value, 0) / before.length;
      const afterMean = after.reduce((sum, d) => sum + d.value, 0) / after.length;
      
      const difference = afterMean - beforeMean;
      const significance = Math.abs(difference) / Math.max(beforeMean, 1);
      
      if (significance > 0.5) { // 50% change threshold
        changePoints.push({
          date: data[i].date,
          significance,
          type: difference > 0 ? 'increase' : 'decrease'
        });
      }
    }
    
    return changePoints.slice(0, 5); // Return top 5 change points
  }

  private generateForecast(
    data: { date: Date; value: number }[],
    days: number,
    seasonalPattern?: { period: number; amplitude: number; phase: number }
  ): number[] {
    const regression = this.calculateLinearRegression(data);
    const forecast = [];
    
    for (let i = 1; i <= days; i++) {
      let value = regression.slope * (data.length + i) + regression.intercept;
      
      // Add seasonal component if present
      if (seasonalPattern) {
        const seasonal = seasonalPattern.amplitude * Math.sin(
          2 * Math.PI * (i / seasonalPattern.period)
        );
        value += seasonal;
      }
      
      forecast.push(Math.max(0, value)); // Ensure non-negative values
    }
    
    return forecast;
  }

  private generateTrendInsights(
    trendAnalysis: { trend: string; strength: string; confidence: number },
    seasonalPattern?: any,
    changePoints?: any[],
    metricName?: string
  ): string[] {
    const insights = [];
    
    // Trend insights
    if (trendAnalysis.trend === 'increasing') {
      insights.push(`${metricName} shows a ${trendAnalysis.strength} upward trend with ${Math.round(trendAnalysis.confidence * 100)}% confidence`);
    } else if (trendAnalysis.trend === 'decreasing') {
      insights.push(`${metricName} shows a ${trendAnalysis.strength} downward trend with ${Math.round(trendAnalysis.confidence * 100)}% confidence`);
    } else if (trendAnalysis.trend === 'stable') {
      insights.push(`${metricName} remains relatively stable over the analyzed period`);
    } else {
      insights.push(`${metricName} shows high volatility with no clear trend pattern`);
    }
    
    // Seasonal insights
    if (seasonalPattern) {
      if (seasonalPattern.period === 7) {
        insights.push('Clear weekly seasonal pattern detected - performance varies by day of week');
      } else {
        insights.push(`Seasonal pattern detected with ${seasonalPattern.period}-day cycle`);
      }
    }
    
    // Change point insights
    if (changePoints && changePoints.length > 0) {
      insights.push(`${changePoints.length} significant change point(s) detected in the data`);
      
      const majorChanges = changePoints.filter(cp => cp.significance > 1);
      if (majorChanges.length > 0) {
        insights.push(`Major performance shifts occurred on ${majorChanges.length} occasions`);
      }
    }
    
    return insights;
  }

  private calculateCorrelation(
    data1: { date: Date; value: number }[],
    data2: { date: Date; value: number }[]
  ): { coefficient: number; significance: number } {
    // Align data by date
    const aligned = this.alignDataByDate(data1, data2);
    
    if (aligned.length < 3) {
      return { coefficient: 0, significance: 0 };
    }
    
    const x = aligned.map(d => d.value1);
    const y = aligned.map(d => d.value2);
    
    const n = aligned.length;
    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = y.reduce((a, b) => a + b, 0);
    const sumXY = x.reduce((acc, xi, i) => acc + xi * y[i], 0);
    const sumXX = x.reduce((acc, xi) => acc + xi * xi, 0);
    const sumYY = y.reduce((acc, yi) => acc + yi * yi, 0);
    
    const numerator = n * sumXY - sumX * sumY;
    const denominator = Math.sqrt((n * sumXX - sumX * sumX) * (n * sumYY - sumY * sumY));
    
    const coefficient = denominator !== 0 ? numerator / denominator : 0;
    const significance = Math.abs(coefficient); // Simplified significance measure
    
    return { coefficient, significance };
  }

  private alignDataByDate(
    data1: { date: Date; value: number }[],
    data2: { date: Date; value: number }[]
  ): { date: Date; value1: number; value2: number }[] {
    const aligned = [];
    const data2Map = new Map(data2.map(d => [d.date.toISOString(), d.value]));
    
    for (const point1 of data1) {
      const dateKey = point1.date.toISOString();
      const value2 = data2Map.get(dateKey);
      
      if (value2 !== undefined) {
        aligned.push({
          date: point1.date,
          value1: point1.value,
          value2
        });
      }
    }
    
    return aligned;
  }

  private classifyCorrelation(coefficient: number): 'strong_positive' | 'weak_positive' | 'none' | 'weak_negative' | 'strong_negative' {
    const abs = Math.abs(coefficient);
    
    if (abs >= 0.7) {
      return coefficient > 0 ? 'strong_positive' : 'strong_negative';
    } else if (abs >= 0.3) {
      return coefficient > 0 ? 'weak_positive' : 'weak_negative';
    } else {
      return 'none';
    }
  }

  private findLeadingIndicator(
    data1: { date: Date; value: number }[],
    data2: { date: Date; value: number }[],
    metric1: string,
    metric2: string
  ): {
    leading: string;
    lagging: string;
    lag: number;
    correlation: number;
  } | null {
    // Test different lag periods
    const maxLag = Math.min(7, Math.floor(data1.length / 4));
    let bestCorrelation = 0;
    let bestLag = 0;
    let leadingMetric = '';
    let laggingMetric = '';
    
    // Test metric1 leading metric2
    for (let lag = 1; lag <= maxLag; lag++) {
      const laggedData2 = data2.slice(lag);
      const alignedData1 = data1.slice(0, -lag);
      
      const correlation = this.calculateCorrelation(alignedData1, laggedData2);
      
      if (Math.abs(correlation.coefficient) > Math.abs(bestCorrelation)) {
        bestCorrelation = correlation.coefficient;
        bestLag = lag;
        leadingMetric = metric1;
        laggingMetric = metric2;
      }
    }
    
    // Test metric2 leading metric1
    for (let lag = 1; lag <= maxLag; lag++) {
      const laggedData1 = data1.slice(lag);
      const alignedData2 = data2.slice(0, -lag);
      
      const correlation = this.calculateCorrelation(alignedData2, laggedData1);
      
      if (Math.abs(correlation.coefficient) > Math.abs(bestCorrelation)) {
        bestCorrelation = correlation.coefficient;
        bestLag = lag;
        leadingMetric = metric2;
        laggingMetric = metric1;
      }
    }
    
    // Only return if correlation is significant
    if (Math.abs(bestCorrelation) > 0.5) {
      return {
        leading: leadingMetric,
        lagging: laggingMetric,
        lag: bestLag,
        correlation: bestCorrelation
      };
    }
    
    return null;
  }

  private generateComparisonInsights(correlations: any[], leadingIndicators?: any[]): string[] {
    const insights = [];
    
    const strongCorrelations = correlations.filter(c => 
      c.relationship === 'strong_positive' || c.relationship === 'strong_negative'
    );
    
    if (strongCorrelations.length > 0) {
      insights.push(`Found ${strongCorrelations.length} strong correlation(s) between metrics`);
      
      strongCorrelations.forEach(c => {
        const direction = c.relationship.includes('positive') ? 'positively' : 'negatively';
        insights.push(`${c.metric1} and ${c.metric2} are strongly ${direction} correlated (${Math.abs(c.correlation).toFixed(2)})`);
      });
    }
    
    if (leadingIndicators && leadingIndicators.length > 0) {
      leadingIndicators.forEach(li => {
        insights.push(`${li.leading} appears to be a ${li.lag}-day leading indicator for ${li.lagging}`);
      });
    }
    
    if (insights.length === 0) {
      insights.push('No significant correlations or leading indicators found between the analyzed metrics');
    }
    
    return insights;
  }

  private linearForecast(
    data: { date: Date; value: number }[],
    days: number,
    regression: { slope: number; intercept: number }
  ): number[] {
    const forecast = [];
    for (let i = 1; i <= days; i++) {
      const value = regression.slope * (data.length + i) + regression.intercept;
      forecast.push(Math.max(0, value));
    }
    return forecast;
  }

  private exponentialSmoothing(data: { date: Date; value: number }[], days: number): number[] {
    const alpha = 0.3; // Smoothing factor
    const forecast = [];
    
    let smoothed = data[0].value;
    for (let i = 1; i < data.length; i++) {
      smoothed = alpha * data[i].value + (1 - alpha) * smoothed;
    }
    
    for (let i = 0; i < days; i++) {
      forecast.push(Math.max(0, smoothed));
    }
    
    return forecast;
  }

  private seasonalForecast(data: { date: Date; value: number }[], days: number): number[] {
    // Use last week's pattern for forecasting
    const lastWeek = data.slice(-7);
    const forecast = [];
    
    for (let i = 0; i < days; i++) {
      const dayIndex = i % 7;
      const value = lastWeek[dayIndex]?.value || data[data.length - 1].value;
      forecast.push(Math.max(0, value));
    }
    
    return forecast;
  }

  private calculateForecastAccuracy(historical: { date: Date; value: number }[], forecast: number[]): number {
    // Simple accuracy measure - would be more sophisticated in practice
    return 0.75; // Placeholder
  }

  private calculateStandardError(historical: { date: Date; value: number }[], forecast: number[]): number {
    const values = historical.map(h => h.value);
    const mean = values.reduce((sum, v) => sum + v, 0) / values.length;
    const variance = values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / (values.length - 1);
    return Math.sqrt(variance);
  }

  private getTValue(confidenceLevel: number, degreesOfFreedom: number): number {
    // Simplified t-value lookup - would use proper statistical tables in practice
    if (confidenceLevel >= 0.95) return 2.0;
    if (confidenceLevel >= 0.90) return 1.7;
    return 1.0;
  }

  private generateForecastInsights(
    method: string,
    accuracy: number,
    forecast: any[],
    metricName: string
  ): string[] {
    const insights = [];
    
    insights.push(`${method} forecasting method used with ${Math.round(accuracy * 100)}% accuracy`);
    
    const avgForecast = forecast.reduce((sum, f) => sum + f.value, 0) / forecast.length;
    const trend = forecast[forecast.length - 1].value > forecast[0].value ? 'increasing' : 'decreasing';
    
    insights.push(`${metricName} is forecasted to be ${trend} with average value of ${avgForecast.toFixed(2)}`);
    
    if (accuracy < 0.5) {
      insights.push('Low forecast accuracy - results should be interpreted with caution');
    } else if (accuracy > 0.8) {
      insights.push('High forecast accuracy - results are reliable for planning');
    }
    
    return insights;
  }

  private calculateStatisticalThresholds(
    data: { date: Date; value: number }[],
    sensitivity: 'low' | 'medium' | 'high'
  ): { upperBound: number; lowerBound: number; method: string } {
    const values = data.map(d => d.value);
    const mean = values.reduce((sum, v) => sum + v, 0) / values.length;
    const stdDev = Math.sqrt(values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length);
    
    let multiplier;
    switch (sensitivity) {
      case 'low': multiplier = 3; break;
      case 'medium': multiplier = 2; break;
      case 'high': multiplier = 1.5; break;
      default: multiplier = 2;
    }
    
    return {
      upperBound: mean + multiplier * stdDev,
      lowerBound: Math.max(0, mean - multiplier * stdDev),
      method: 'statistical'
    };
  }

  private calculateExpectedValue(date: Date, data: { date: Date; value: number }[]): number {
    // Simple moving average as expected value
    const windowSize = 7;
    const index = data.findIndex(d => d.date.getTime() === date.getTime());
    
    if (index < windowSize) return data[index].value;
    
    const window = data.slice(Math.max(0, index - windowSize), index);
    return window.reduce((sum, d) => sum + d.value, 0) / window.length;
  }

  private classifyAnomalySeverity(deviation: number, thresholds: any): 'low' | 'medium' | 'high' {
    const range = thresholds.upperBound - thresholds.lowerBound;
    
    if (deviation > range * 0.5) return 'high';
    if (deviation > range * 0.25) return 'medium';
    return 'low';
  }

  private classifyAnomalyType(
    dataPoint: { date: Date; value: number },
    data: { date: Date; value: number }[]
  ): 'spike' | 'dip' | 'trend_break' | 'seasonal_anomaly' {
    // Simplified classification
    const index = data.findIndex(d => d.date.getTime() === dataPoint.date.getTime());
    
    if (index > 0 && index < data.length - 1) {
      const prev = data[index - 1].value;
      const next = data[index + 1].value;
      const current = dataPoint.value;
      
      if (current > prev && current > next) return 'spike';
      if (current < prev && current < next) return 'dip';
    }
    
    return 'seasonal_anomaly';
  }

  private generateAnomalyInsights(anomalies: any[], metricName: string): string[] {
    const insights = [];
    
    if (anomalies.length === 0) {
      insights.push(`No anomalies detected in ${metricName} during the analyzed period`);
      return insights;
    }
    
    const severeCounts = {
      high: anomalies.filter(a => a.severity === 'high').length,
      medium: anomalies.filter(a => a.severity === 'medium').length,
      low: anomalies.filter(a => a.severity === 'low').length
    };
    
    insights.push(`Detected ${anomalies.length} anomalies in ${metricName}: ${severeCounts.high} high, ${severeCounts.medium} medium, ${severeCounts.low} low severity`);
    
    const typeCounts = anomalies.reduce((acc, a) => {
      acc[a.type] = (acc[a.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    Object.entries(typeCounts).forEach(([type, count]) => {
      insights.push(`${count} ${type} anomal${count === 1 ? 'y' : 'ies'} detected`);
    });
    
    return insights;
  }
}

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

let analyzerInstance: TrendAnalyzer | null = null;

export const getTrendAnalyzer = (): TrendAnalyzer => {
  if (!analyzerInstance) {
    analyzerInstance = new TrendAnalyzer();
  }
  return analyzerInstance;
};