/**
 * The Backroom Leeds - Automated Reporting System Types
 * Version: 1.0.0
 * Phase: 3, Step 3.5
 * 
 * Comprehensive TypeScript definitions for the reporting and business intelligence system
 */

// ============================================================================
// ENUMS AND CONSTANTS
// ============================================================================

export enum JobStatus {
  PENDING = 'pending',
  RUNNING = 'running',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
  RETRYING = 'retrying'
}

export enum JobPriority {
  LOW = 'low',
  NORMAL = 'normal',
  HIGH = 'high',
  CRITICAL = 'critical'
}

export enum ReportType {
  DAILY_SUMMARY = 'daily_summary',
  WEEKLY_SUMMARY = 'weekly_summary',
  MONTHLY_SUMMARY = 'monthly_summary',
  EVENT_PERFORMANCE = 'event_performance',
  REVENUE_ANALYSIS = 'revenue_analysis',
  CUSTOMER_ANALYTICS = 'customer_analytics',
  STAFF_PERFORMANCE = 'staff_performance',
  CUSTOM = 'custom'
}

export enum ReportFormat {
  PDF = 'pdf',
  CSV = 'csv',
  EXCEL = 'excel',
  HTML = 'html',
  JSON = 'json'
}

export enum DeliveryChannel {
  EMAIL = 'email',
  SMS = 'sms',
  WEBHOOK = 'webhook',
  DASHBOARD = 'dashboard',
  API = 'api'
}

export enum DeliveryStatus {
  PENDING = 'pending',
  SENDING = 'sending',
  DELIVERED = 'delivered',
  FAILED = 'failed',
  BOUNCED = 'bounced',
  OPENED = 'opened',
  CLICKED = 'clicked'
}

export enum AggregationPeriod {
  HOURLY = 'hourly',
  DAILY = 'daily',
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
  QUARTERLY = 'quarterly',
  YEARLY = 'yearly'
}

export enum MetricType {
  COUNT = 'count',
  SUM = 'sum',
  AVERAGE = 'average',
  PERCENTAGE = 'percentage',
  CURRENCY = 'currency',
  DURATION = 'duration',
  RATIO = 'ratio'
}

// ============================================================================
// JOB SCHEDULING TYPES
// ============================================================================

export interface ScheduledJob {
  id: string;
  name: string;
  description?: string;
  jobType: string;
  cronExpression: string;
  timezone: string;
  priority: JobPriority;
  maxRetries: number;
  retryDelaySeconds: number;
  timeoutSeconds: number;
  enabled: boolean;
  metadata: Record<string, any>;
  lastRunAt?: Date;
  nextRunAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  createdBy?: string;
}

export interface JobExecutionHistory {
  id: string;
  jobId: string;
  executionId?: string;
  status: JobStatus;
  startedAt: Date;
  completedAt?: Date;
  executionTimeMs?: number;
  attemptNumber: number;
  errorMessage?: string;
  errorStack?: string;
  result?: Record<string, any>;
  metadata: Record<string, any>;
  cpuUsagePercent?: number;
  memoryUsageMb?: number;
  recordsProcessed?: number;
}

export interface JobDependency {
  id: string;
  parentJobId: string;
  dependentJobId: string;
  dependencyType: 'completion' | 'success' | 'always';
  createdAt: Date;
}

export interface JobAlert {
  id: string;
  jobId: string;
  alertType: string;
  thresholdValue?: number;
  notificationChannels: DeliveryChannel[];
  recipientEmails?: string[];
  webhookUrl?: string;
  enabled: boolean;
  lastTriggeredAt?: Date;
  createdAt: Date;
}

// ============================================================================
// REPORT TEMPLATE TYPES
// ============================================================================

export interface ReportTemplate {
  id: string;
  name: string;
  reportType: ReportType;
  version: number;
  description?: string;
  templateConfig: ReportTemplateConfig;
  defaultFormat: ReportFormat;
  supportedFormats: ReportFormat[];
  customizableFields?: Record<string, any>;
  requiredParameters?: Record<string, any>;
  cacheDurationMinutes: number;
  maxExecutionTimeSeconds: number;
  isActive: boolean;
  isSystemTemplate: boolean;
  createdAt: Date;
  updatedAt: Date;
  createdBy?: string;
}

export interface ReportTemplateConfig {
  sections: ReportSection[];
  dataSources: string[];
  schedule?: string;
  filters?: Record<string, any>;
  aggregations?: Record<string, any>;
}

export interface ReportSection {
  id: string;
  templateId: string;
  sectionName: string;
  sectionOrder: number;
  sectionType: 'chart' | 'table' | 'summary' | 'metric';
  queryConfig: Record<string, any>;
  displayConfig?: Record<string, any>;
  isOptional: boolean;
  createdAt: Date;
}

export interface ReportTemplateVersion {
  id: string;
  templateId: string;
  version: number;
  templateConfig: ReportTemplateConfig;
  changeDescription?: string;
  createdAt: Date;
  createdBy?: string;
}

// ============================================================================
// RECIPIENT AND SUBSCRIPTION TYPES
// ============================================================================

export interface ReportRecipient {
  id: string;
  userId?: string;
  email: string;
  name?: string;
  phone?: string;
  role?: string;
  timezone: string;
  languageCode: string;
  preferredChannels: DeliveryChannel[];
  preferredFormat: ReportFormat;
  isActive: boolean;
  emailVerified: boolean;
  bouncedCount: number;
  lastEmailSentAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface ReportSubscription {
  id: string;
  recipientId: string;
  templateId: string;
  deliveryChannels: DeliveryChannel[];
  deliveryFormat: ReportFormat;
  customSchedule?: string;
  filterConfig?: Record<string, any>;
  customParameters?: Record<string, any>;
  isActive: boolean;
  pausedUntil?: Date;
  lastDeliveredAt?: Date;
  nextDeliveryAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface SubscriptionPreference {
  id: string;
  subscriptionId: string;
  preferenceKey: string;
  preferenceValue: string;
  createdAt: Date;
}

// ============================================================================
// REPORT GENERATION TYPES
// ============================================================================

export interface ReportGenerationHistory {
  id: string;
  templateId: string;
  jobExecutionId?: string;
  reportType: ReportType;
  generatedAt: Date;
  generationTimeMs?: number;
  dataPeriodStart: Date;
  dataPeriodEnd: Date;
  outputFormat: ReportFormat;
  fileSizeBytes?: number;
  filePath?: string;
  fileUrl?: string;
  expiresAt?: Date;
  recordsProcessed?: number;
  sectionsGenerated?: number;
  errorsCount: number;
  warnings?: any[];
  reportSummary?: ReportSummary;
  keyMetrics?: Record<string, any>;
  isSuccessful: boolean;
  errorMessage?: string;
  createdBy?: string;
}

export interface ReportSummary {
  title: string;
  description: string;
  highlights: string[];
  recommendations?: string[];
  alerts?: string[];
}

export interface ReportDeliveryHistory {
  id: string;
  generationId: string;
  subscriptionId?: string;
  recipientId: string;
  deliveryChannel: DeliveryChannel;
  deliveryStatus: DeliveryStatus;
  deliveryAddress: string;
  queuedAt: Date;
  sentAt?: Date;
  deliveredAt?: Date;
  openedAt?: Date;
  clickedAt?: Date;
  messageId?: string;
  trackingId?: string;
  bounceReason?: string;
  failureReason?: string;
  retryCount: number;
  metadata?: Record<string, any>;
}

export interface ReportAccessLog {
  id: string;
  generationId: string;
  accessedBy?: string;
  accessType: 'view' | 'download' | 'share' | 'export';
  ipAddress?: string;
  userAgent?: string;
  accessedAt: Date;
}

// ============================================================================
// BUSINESS INTELLIGENCE TYPES
// ============================================================================

export interface KPIDefinition {
  id: string;
  name: string;
  displayName: string;
  category: 'revenue' | 'bookings' | 'customers' | 'operations';
  metricType: MetricType;
  calculationQuery: string;
  targetValue?: number;
  warningThreshold?: number;
  criticalThreshold?: number;
  unit?: string;
  decimalPlaces: number;
  trendDirection?: 'higher_better' | 'lower_better' | 'neutral';
  cacheDurationMinutes: number;
  requiresRealtime: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface KPICalculation {
  id: string;
  kpiId: string;
  periodStart: Date;
  periodEnd: Date;
  aggregationPeriod: AggregationPeriod;
  calculatedValue: number;
  previousValue?: number;
  changePercentage?: number;
  trendDirection?: 'up' | 'down' | 'stable';
  yearAgoValue?: number;
  monthAgoValue?: number;
  weekAgoValue?: number;
  minValue?: number;
  maxValue?: number;
  avgValue?: number;
  stdDeviation?: number;
  calculationTimeMs?: number;
  dataPointsCount?: number;
  calculatedAt: Date;
  expiresAt?: Date;
}

export interface EventPerformanceAnalytics {
  id: string;
  eventId: string;
  eventDate: Date;
  eventName: string;
  totalBookings: number;
  totalGuests: number;
  tableOccupancyRate: number;
  walkInsCount: number;
  totalRevenue: number;
  barRevenue: number;
  tableRevenue: number;
  averageSpendPerGuest: number;
  checkInRate: number;
  noShowRate: number;
  cancellationRate: number;
  averagePartySize: number;
  peakHour?: string;
  peakHourGuests?: number;
  averageStayDurationMinutes?: number;
  feedbackScore?: number;
  feedbackCount: number;
  vsLastWeekRevenueChange?: number;
  vsLastMonthRevenueChange?: number;
  vsLastYearRevenueChange?: number;
  calculatedAt: Date;
}

export interface CustomerAnalytics {
  id: string;
  customerId: string;
  analysisPeriod: AggregationPeriod;
  periodStart: Date;
  periodEnd: Date;
  totalBookings: number;
  totalSpend: number;
  averagePartySize: number;
  favoriteEvent?: string;
  favoriteDayOfWeek?: number;
  loyaltyScore?: number;
  lifetimeValue?: number;
  churnProbability?: number;
  daysSinceLastVisit?: number;
  preferredTables?: number[];
  preferredPackages?: string[];
  specialOccasionsCount: number;
  cancellationCount: number;
  noShowCount: number;
  onTimeArrivalRate?: number;
  calculatedAt: Date;
}

// ============================================================================
// AGGREGATION TYPES
// ============================================================================

export interface DailyAggregation {
  id: string;
  aggregationDate: Date;
  totalBookings: number;
  confirmedBookings: number;
  cancelledBookings: number;
  totalGuests: number;
  grossRevenue: number;
  netRevenue: number;
  depositsCollected: number;
  refundsProcessed: number;
  tablesOccupied: number;
  tableTurnoverRate?: number;
  averageOccupancyRate?: number;
  newCustomers: number;
  returningCustomers: number;
  vipBookings: number;
  checkIns: number;
  noShows: number;
  walkIns: number;
  waitlistCount: number;
  averageBookingLeadTimeHours?: number;
  averageStayDurationMinutes?: number;
  peakHour?: string;
  peakOccupancyRate?: number;
  birthdaysCount: number;
  anniversariesCount: number;
  corporateEventsCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface HourlyAggregation {
  id: string;
  aggregationHour: Date;
  currentOccupancy: number;
  currentGuests: number;
  tablesAvailable: number;
  checkInsCount: number;
  checkOutsCount: number;
  newBookingsCount: number;
  cancellationsCount: number;
  hourRevenue: number;
  hourBarSales: number;
  createdAt: Date;
}

export interface ReportMetricsCache {
  id: string;
  metricKey: string;
  periodStart: Date;
  periodEnd: Date;
  metricValue: Record<string, any>;
  calculatedAt: Date;
  expiresAt: Date;
}

// ============================================================================
// REPORT DATA INTERFACES
// ============================================================================

export interface DailySummaryReportData {
  date: Date;
  overview: {
    totalBookings: number;
    totalRevenue: number;
    totalGuests: number;
    tablesOccupied: number;
    occupancyRate: number;
  };
  bookings: {
    confirmed: number;
    cancelled: number;
    noShows: number;
    walkIns: number;
    waitlist: number;
    averagePartySize: number;
  };
  revenue: {
    gross: number;
    net: number;
    deposits: number;
    refunds: number;
    perGuest: number;
    perTable: number;
  };
  events: {
    name: string;
    attendance: number;
    revenue: number;
    occupancyRate: number;
  }[];
  customers: {
    new: number;
    returning: number;
    vip: number;
    birthdays: number;
    anniversaries: number;
  };
  topPackages: {
    packageName: string;
    bookings: number;
    revenue: number;
  }[];
  staffPerformance?: {
    staffId: string;
    name: string;
    checkIns: number;
    averageProcessTime: number;
  }[];
}

export interface WeeklySummaryReportData {
  weekStart: Date;
  weekEnd: Date;
  overview: {
    totalBookings: number;
    totalRevenue: number;
    totalGuests: number;
    averageOccupancyRate: number;
    vsLastWeek: {
      bookingsChange: number;
      revenueChange: number;
      guestsChange: number;
    };
  };
  dailyBreakdown: {
    date: Date;
    bookings: number;
    revenue: number;
    guests: number;
    occupancyRate: number;
  }[];
  topEvents: EventPerformanceAnalytics[];
  customerMetrics: {
    newCustomers: number;
    returningRate: number;
    averageLTV: number;
    topCustomers: {
      customerId: string;
      name: string;
      bookings: number;
      spend: number;
    }[];
  };
  trends: {
    bookingTrend: 'up' | 'down' | 'stable';
    revenueTrend: 'up' | 'down' | 'stable';
    occupancyTrend: 'up' | 'down' | 'stable';
  };
  recommendations: string[];
  alerts: string[];
}

// ============================================================================
// API REQUEST/RESPONSE TYPES
// ============================================================================

export interface GenerateReportRequest {
  templateId: string;
  format: ReportFormat;
  periodStart: Date;
  periodEnd: Date;
  parameters?: Record<string, any>;
  recipientIds?: string[];
  deliveryChannels?: DeliveryChannel[];
}

export interface GenerateReportResponse {
  reportId: string;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  estimatedCompletionTime?: Date;
  fileUrl?: string;
  errors?: string[];
}

export interface SubscribeToReportRequest {
  recipientEmail: string;
  templateId: string;
  deliveryFormat: ReportFormat;
  deliveryChannels: DeliveryChannel[];
  customSchedule?: string;
  filters?: Record<string, any>;
}

export interface SubscribeToReportResponse {
  subscriptionId: string;
  status: 'active' | 'pending_verification';
  nextDeliveryAt?: Date;
}

export interface ReportMetricsRequest {
  metrics: string[];
  periodStart: Date;
  periodEnd: Date;
  aggregation?: AggregationPeriod;
  groupBy?: string[];
}

export interface ReportMetricsResponse {
  metrics: {
    name: string;
    value: number | string;
    unit?: string;
    trend?: 'up' | 'down' | 'stable';
    changePercentage?: number;
  }[];
  period: {
    start: Date;
    end: Date;
  };
  calculatedAt: Date;
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

export interface ReportSchedule {
  cronExpression: string;
  timezone: string;
  nextRunTime: Date;
  lastRunTime?: Date;
}

export interface ReportFilter {
  field: string;
  operator: 'eq' | 'ne' | 'gt' | 'gte' | 'lt' | 'lte' | 'in' | 'nin' | 'like';
  value: any;
}

export interface ReportSort {
  field: string;
  direction: 'asc' | 'desc';
}

export interface ReportPagination {
  page: number;
  pageSize: number;
  totalPages: number;
  totalRecords: number;
}

export interface ReportError {
  code: string;
  message: string;
  details?: Record<string, any>;
  timestamp: Date;
}

// ============================================================================
// CHART DATA TYPES
// ============================================================================

export interface ChartData {
  labels: string[];
  datasets: ChartDataset[];
  options?: Record<string, any>;
}

export interface ChartDataset {
  label: string;
  data: number[];
  backgroundColor?: string | string[];
  borderColor?: string | string[];
  borderWidth?: number;
  type?: 'bar' | 'line' | 'pie' | 'doughnut' | 'radar';
}

export interface TableData {
  columns: TableColumn[];
  rows: Record<string, any>[];
  pagination?: ReportPagination;
}

export interface TableColumn {
  key: string;
  label: string;
  type: 'string' | 'number' | 'date' | 'currency' | 'percentage';
  sortable?: boolean;
  filterable?: boolean;
  width?: number;
}

// ============================================================================
// EXPORT ALL TYPES
// ============================================================================

export type {
  // Re-export all interfaces for convenience
  ScheduledJob as IScheduledJob,
  JobExecutionHistory as IJobExecutionHistory,
  ReportTemplate as IReportTemplate,
  ReportRecipient as IReportRecipient,
  ReportSubscription as IReportSubscription,
  ReportGenerationHistory as IReportGenerationHistory,
  KPIDefinition as IKPIDefinition,
  EventPerformanceAnalytics as IEventPerformanceAnalytics,
  CustomerAnalytics as ICustomerAnalytics,
  DailyAggregation as IDailyAggregation,
  DailySummaryReportData as IDailySummaryReportData,
  WeeklySummaryReportData as IWeeklySummaryReportData
};