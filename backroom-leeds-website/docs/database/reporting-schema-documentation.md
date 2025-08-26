# The Backroom Leeds - Automated Reporting System Database Schema

## Overview

The automated reporting system provides comprehensive business intelligence and operational analytics for The Backroom Leeds. This schema supports daily and weekly automated reports, real-time KPI monitoring, and sophisticated event performance analysis.

## Schema Architecture

### Core Components

1. **Job Scheduling System** - Manages automated report generation and data processing
2. **Report Templates** - Configurable report definitions with customizable sections
3. **Subscription Management** - Recipient preferences and delivery configuration
4. **Report Generation** - Audit trail and history of generated reports
5. **Business Intelligence** - KPI calculations and performance analytics
6. **Data Aggregation** - Pre-computed metrics for fast reporting

## Database Tables

### Job Scheduling and Monitoring

#### `scheduled_jobs`
- **Purpose**: Core job definitions for automated tasks
- **Key Features**:
  - Cron-based scheduling with timezone support
  - Priority levels and retry logic
  - Timeout and performance monitoring
- **Relationships**: 
  - One-to-many with `job_execution_history`
  - One-to-many with `job_dependencies`
  - One-to-many with `job_alerts`

#### `job_execution_history`
- **Purpose**: Complete execution audit trail
- **Key Features**:
  - Performance metrics (CPU, memory, execution time)
  - Error tracking and retry attempts
  - Result storage in JSONB format
- **Usage**: Monitor job health and performance trends

#### `job_dependencies`
- **Purpose**: Define job execution chains
- **Key Features**:
  - Parent-child relationships
  - Conditional execution (completion, success, always)
- **Example**: Daily aggregation must complete before daily report generation

#### `job_alerts`
- **Purpose**: Proactive monitoring and alerting
- **Key Features**:
  - Multiple alert types (failure, timeout, slow execution)
  - Multi-channel notifications (email, SMS, webhook)
  - Threshold-based triggering

### Report Configuration

#### `report_templates`
- **Purpose**: Define report structure and content
- **Key Features**:
  - Versioned templates with change history
  - Configurable sections and data sources
  - Multiple output formats (PDF, Excel, HTML, CSV)
  - Cache settings for performance
- **System Templates**:
  - Daily Summary Report (10pm daily)
  - Weekly Summary Report (Monday 9am)

#### `report_sections`
- **Purpose**: Modular report building blocks
- **Section Types**:
  - `summary`: Executive summaries and highlights
  - `metrics`: KPI dashboards
  - `table`: Detailed data tables
  - `chart`: Visual analytics
- **Configuration**: Query config and display settings in JSONB

### Recipient Management

#### `report_recipients`
- **Purpose**: Manage report distribution list
- **Key Features**:
  - Role-based access (owner, manager, events, finance)
  - Delivery preferences (channel, format, timezone)
  - Bounce handling and email verification
- **Privacy**: GDPR-compliant with user consent tracking

#### `report_subscriptions`
- **Purpose**: Link recipients to report templates
- **Key Features**:
  - Custom schedules override template defaults
  - Filter configurations for personalized content
  - Pause/resume functionality
- **Delivery**: Automated scheduling with `next_delivery_at`

### Report Generation and Delivery

#### `report_generation_history`
- **Purpose**: Audit trail of all generated reports
- **Key Features**:
  - Performance metrics and data volume tracking
  - File storage with expiration management
  - Report summaries and key metrics in JSONB
  - Error handling and warning collection

#### `report_delivery_history`
- **Purpose**: Track report distribution
- **Delivery Channels**:
  - Email (with open/click tracking)
  - SMS (for critical alerts)
  - Dashboard (in-app viewing)
  - Webhook (third-party integration)
  - API (programmatic access)
- **Status Tracking**: Full delivery lifecycle from queue to opened

### Business Intelligence

#### `kpi_definitions`
- **Purpose**: Define business metrics
- **Categories**:
  - Revenue: Daily/weekly/monthly revenue tracking
  - Bookings: Conversion rates, party sizes
  - Customers: Satisfaction, loyalty, demographics
  - Operations: Occupancy, no-show rates, efficiency
- **Features**:
  - Target values with warning/critical thresholds
  - Trend analysis (higher_better, lower_better)
  - Real-time vs cached calculations

#### `kpi_calculations`
- **Purpose**: Store calculated KPI values
- **Key Features**:
  - Period-based aggregations
  - Historical comparisons (week/month/year ago)
  - Statistical analysis (min, max, avg, std deviation)
  - Cache management with expiration

#### `event_performance_analytics`
- **Purpose**: Analyze LA FIESTA, SHHH!, NOSTALGIA events
- **Metrics**:
  - Attendance and occupancy
  - Revenue breakdown (bar vs table)
  - Customer satisfaction scores
  - Operational efficiency
- **Comparisons**: Week-over-week, month-over-month trends

#### `customer_analytics`
- **Purpose**: Customer behavior and loyalty analysis
- **Key Metrics**:
  - Lifetime value and loyalty scores
  - Churn probability predictions
  - Booking patterns and preferences
  - Special occasion tracking
- **Privacy**: Aggregated and anonymized data

### Data Aggregation

#### `daily_aggregations`
- **Purpose**: Pre-computed daily metrics
- **Coverage**:
  - Booking metrics (confirmed, cancelled, no-shows)
  - Revenue metrics (gross, net, deposits, refunds)
  - Customer metrics (new, returning, VIP)
  - Operational metrics (occupancy, turnover, peak times)
  - Special occasions (birthdays, anniversaries)
- **Performance**: Primary data source for daily reports

#### `hourly_aggregations`
- **Purpose**: Real-time operational monitoring
- **Use Cases**:
  - Live occupancy tracking
  - Flow analysis (check-ins/outs)
  - Peak hour identification
  - Real-time revenue monitoring

#### `report_metrics_cache`
- **Purpose**: Cache complex calculations
- **Features**:
  - Key-based metric storage
  - Period-specific caching
  - Automatic expiration
  - JSONB flexibility for various metric types

### Materialized Views

#### `weekly_summary_view`
- **Purpose**: Optimized weekly reporting
- **Refresh**: Daily at 2am after aggregation processing
- **Content**: Week-by-week comparisons and trends

#### `monthly_summary_view`
- **Purpose**: Monthly business analysis
- **Refresh**: Weekly on Sundays
- **Content**: Month-over-month performance metrics

#### `top_customers_view`
- **Purpose**: Customer ranking and segmentation
- **Refresh**: Daily with aggregation processing
- **Content**: Top spenders, most frequent visitors

## Key Relationships

### Report Generation Flow
```
scheduled_jobs → job_execution_history → report_generation_history → report_delivery_history
                                                ↓
                                          report_templates
                                                ↓
                                          report_recipients (via subscriptions)
```

### Data Aggregation Pipeline
```
Raw Data (bookings, customers, events)
    ↓
hourly_aggregations (real-time)
    ↓
daily_aggregations (batch processing at 2am)
    ↓
weekly_summary_view / monthly_summary_view (materialized)
    ↓
KPI calculations / Event analytics / Customer analytics
    ↓
Reports (Daily Summary at 10pm, Weekly Summary Monday 9am)
```

## Performance Optimizations

### Indexing Strategy

1. **Time-based Indexes**: BRIN indexes for time-series data
2. **Composite Indexes**: Multi-column for common query patterns
3. **Partial Indexes**: Active records only for better performance
4. **GIN Indexes**: JSONB columns for flexible querying

### Caching Strategy

1. **KPI Cache**: 15-60 minute cache for non-critical metrics
2. **Report Cache**: 60-120 minute cache for generated reports
3. **Materialized Views**: Daily refresh for summary data
4. **Metrics Cache**: Flexible expiration based on data freshness needs

## Security and Compliance

### Row Level Security (RLS)

1. **Admin Access**: Full access to all reporting data
2. **Manager Access**: Read access to operational reports
3. **Staff Access**: Limited to own performance metrics
4. **Customer Access**: None (reports are internal only)

### GDPR Compliance

1. **Data Retention**: 90-day default retention with configurable cleanup
2. **Anonymization**: Customer data aggregated in analytics
3. **Audit Logging**: Complete access trail for compliance
4. **Right to Erasure**: Cascade deletes for user data

## Report Types

### Daily Summary Report (10pm)
- **Sections**:
  1. Executive Summary
  2. Key Performance Indicators
  3. Bookings Analysis
  4. Revenue Breakdown
  5. Event Performance
  6. Customer Insights
  7. Staff Performance
- **Recipients**: Owner, Manager, Finance
- **Formats**: PDF, Excel, HTML

### Weekly Summary Report (Monday 9am)
- **Sections**:
  1. Weekly Overview with Comparisons
  2. Trend Analysis Charts
  3. Event Performance Comparison
  4. Revenue Analysis with Forecasts
  5. Customer Behavior Patterns
  6. Top Performers
  7. Recommendations and Alerts
- **Recipients**: Owner, Manager, Events, Finance
- **Formats**: PDF, Excel, HTML, CSV

## Integration Points

### External Systems

1. **Supabase**: Database platform with real-time subscriptions
2. **BullMQ**: Job queue for reliable task execution
3. **SendGrid/Postmark**: Email delivery with tracking
4. **Twilio**: SMS notifications for critical alerts
5. **Stripe**: Payment data for revenue analytics
6. **Fatsoma**: Event ticketing integration

### Internal Systems

1. **Booking System**: Source data for occupancy and revenue
2. **Authentication**: Role-based access control
3. **QR Check-in**: Real-time attendance tracking
4. **Customer Portal**: Report viewing interface

## Maintenance Procedures

### Daily Tasks (Automated)
- Process hourly aggregations (every hour)
- Generate daily aggregations (2am)
- Generate and send daily report (10pm)
- Clean expired cache entries (3am)

### Weekly Tasks (Automated)
- Generate weekly report (Monday 9am)
- Refresh materialized views (Sunday 3am)
- Clean old report files (Sunday 3am)
- Archive old execution history (Sunday 3am)

### Monthly Tasks (Manual Review)
- Review KPI thresholds and targets
- Audit report subscription list
- Analyze job performance trends
- Update report templates if needed

## Error Handling

### Job Failures
1. Automatic retry with exponential backoff
2. Alert notifications after threshold
3. Fallback to previous successful report
4. Manual intervention escalation

### Data Quality
1. Validation checks in aggregation functions
2. Warning collection in report generation
3. Data completeness monitoring
4. Anomaly detection for outliers

## Future Enhancements

1. **Predictive Analytics**: ML-based forecasting
2. **Real-time Dashboards**: WebSocket-based live updates
3. **Custom Report Builder**: User-defined report templates
4. **Mobile App Integration**: Push notifications for key metrics
5. **Multi-venue Support**: Scalable to multiple locations
6. **Advanced Visualizations**: Interactive charts and heatmaps

## Usage Examples

### Schedule a New Report
```sql
INSERT INTO scheduled_jobs (name, job_type, cron_expression, priority)
VALUES ('monthly_report', 'report', '0 9 1 * *', 'normal');
```

### Subscribe to Report
```sql
INSERT INTO report_subscriptions (recipient_id, template_id, delivery_channels)
VALUES ('user-id', 'template-id', ARRAY['email', 'dashboard']);
```

### Calculate KPI
```sql
SELECT calculate_kpi_value('daily_revenue', CURRENT_DATE, CURRENT_DATE);
```

### Process Daily Aggregations
```sql
SELECT process_daily_aggregations(CURRENT_DATE - interval '1 day');
```

This comprehensive reporting system ensures The Backroom Leeds maintains operational excellence through data-driven decision making and automated business intelligence.