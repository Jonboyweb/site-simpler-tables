# The Backroom Leeds - Automated Reporting System

**Version**: 1.0.0  
**Phase**: 3, Step 3.5  
**Status**: Implementation Complete  
**Last Updated**: August 2024

## Overview

The Automated Reporting System is a comprehensive business intelligence platform designed specifically for The Backroom Leeds nightclub. It provides real-time analytics, automated report generation, and intelligent business insights to support data-driven decision making.

## Architecture

### System Components

```
┌─────────────────────────────────────────────────────────────────┐
│                    Automated Reporting System                  │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  │
│  │  Job Scheduling │  │ Report Generation│  │ Email Distribution│ │
│  │     (BullMQ)    │  │    (Generators)  │  │   (React Email) │  │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘  │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  │
│  │ Business Intel  │  │  Data Analytics │  │ Recipient Mgmt  │  │
│  │ (KPI Tracking)  │  │ (Trend Analysis)│  │ (Subscriptions) │  │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘  │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────────────┐  │
│  │           Admin Dashboard Integration                       │  │
│  │      (Real-time Monitoring & Management)                   │  │
│  └─────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

### Technology Stack

- **Job Queue**: BullMQ with Redis backend
- **Email Service**: Resend (primary) + SendGrid (fallback)
- **Email Templates**: React Email with prohibition-era styling
- **Database**: Supabase PostgreSQL with advanced schema
- **Analytics Engine**: Custom metrics calculator with trend analysis
- **Frontend**: Next.js 15 with TypeScript and Tailwind CSS

## Core Features

### 1. Automated Report Generation

#### Daily Summary Reports
- **Schedule**: Every day at 10:00 PM (UK time)
- **Content**: Comprehensive daily operational metrics
- **Format**: PDF, Excel, CSV, HTML support
- **Distribution**: Automated email delivery to subscribers

**Key Metrics Included**:
- Total bookings and revenue
- Table occupancy rates
- Customer analytics (new vs returning)
- Event performance data
- Package popularity analysis
- Operational KPIs (no-shows, cancellations)

#### Weekly Summary Reports
- **Schedule**: Every Monday at 9:00 AM (UK time)
- **Content**: Weekly performance analysis with trends
- **Features**: Week-over-week comparisons, forecasting
- **Business Intelligence**: Recommendations and alerts

**Advanced Analytics**:
- Revenue trend analysis
- Customer behavior patterns  
- Event performance comparisons
- Seasonal pattern detection
- Operational efficiency metrics

### 2. Business Intelligence & KPIs

#### Real-time Metrics Dashboard
- Live system health monitoring
- Queue performance tracking
- Job execution status
- Email delivery analytics

#### Key Performance Indicators
- Daily/weekly/monthly revenue tracking
- Table occupancy optimization
- Customer satisfaction metrics
- Staff performance indicators
- Event success measurements

#### Trend Analysis Engine
- Statistical trend detection
- Forecasting capabilities
- Anomaly identification
- Comparative analysis tools
- Leading indicator discovery

### 3. Intelligent Job Scheduling

#### BullMQ Integration
- Redis-backed job queue system
- Priority-based job processing
- Automatic retry logic with exponential backoff
- Comprehensive error handling and alerting
- Real-time monitoring and health checks

#### Scheduling Features
- Cron-based recurring jobs
- One-time job scheduling
- Job dependency management
- Concurrent processing support
- Performance optimization

### 4. Professional Email Distribution

#### Multi-Provider Support
- **Primary**: Resend API for reliability
- **Fallback**: SendGrid for enterprise features
- Automatic failover handling
- Delivery status tracking
- Bounce and complaint management

#### React Email Templates
- Prohibition-era design theme
- Mobile-responsive layouts
- Professional PDF attachments
- Interactive elements
- Brand-consistent styling

### 5. Recipient & Subscription Management

#### Advanced Recipient System
- Role-based access control
- Preference management
- Email verification workflows
- Multi-channel delivery support
- Subscription lifecycle management

#### Subscription Features
- Granular report subscriptions
- Custom delivery schedules
- Format preferences
- Pause/resume functionality
- Bulk subscription management

## Database Schema

### Core Tables

```sql
-- Job Management
scheduled_jobs              -- Cron job definitions
job_execution_history       -- Execution tracking and performance
job_dependencies           -- Job workflow relationships
job_alerts                 -- Failure notification system

-- Report System
report_templates           -- Template definitions and versions
report_generation_history  -- Complete audit trail of generated reports
report_sections            -- Modular report components

-- Distribution System
report_recipients          -- Recipient management and preferences
report_subscriptions       -- Subscription configuration
report_delivery_history    -- Delivery tracking and analytics

-- Business Intelligence
kpi_definitions           -- KPI calculation rules
kpi_calculations          -- Cached KPI values with trends
event_performance_analytics -- Event-specific metrics
customer_analytics        -- Customer behavior analysis

-- Data Aggregation
daily_aggregations        -- Pre-computed daily metrics
hourly_aggregations       -- Real-time operational data
report_metrics_cache      -- Performance optimization cache
```

### Materialized Views

```sql
weekly_summary_view       -- Pre-aggregated weekly data
monthly_summary_view      -- Monthly business intelligence
top_customers_view        -- Customer ranking and LTV analysis
```

## API Endpoints

### Report Generation
```
POST /api/reporting/generate/daily     # Generate daily report
POST /api/reporting/generate/weekly    # Generate weekly report
PUT  /api/reporting/generate/daily     # Regenerate existing report
GET  /api/reporting/generate/daily     # Get report history
DELETE /api/reporting/generate/daily   # Cancel queued generation
```

### Job Management
```
GET  /api/reporting/jobs/status        # System health and job status
POST /api/reporting/jobs/status        # Job control (pause/resume/cancel)
GET  /api/reporting/jobs/status?systemHealth=true # Full health check
```

### Recipient Management
```
POST /api/reporting/recipients/manage   # Create recipient
GET  /api/reporting/recipients/manage   # List recipients
PUT  /api/reporting/recipients/manage   # Update recipient
DELETE /api/reporting/recipients/manage # Deactivate recipient
```

### Subscription Management
```
POST /api/reporting/recipients/subscribe   # Subscribe to reports
GET  /api/reporting/recipients/subscribe   # List subscriptions
PUT  /api/reporting/recipients/subscribe   # Update subscription
DELETE /api/reporting/recipients/subscribe # Unsubscribe
```

### Analytics & Metrics
```
GET  /api/reporting/analytics/metrics   # Retrieve KPI metrics
POST /api/reporting/analytics/metrics   # Calculate custom metrics
```

## Configuration

### Environment Variables

```env
# Redis Configuration
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=your_redis_password

# Email Service Configuration
RESEND_API_KEY=your_resend_api_key
SENDGRID_API_KEY=your_sendgrid_api_key
FROM_EMAIL=reports@backroomleeds.co.uk

# Application Configuration
NEXT_PUBLIC_APP_URL=https://backroomleeds.co.uk
```

### Default Scheduled Jobs

```javascript
// Daily Summary Report - 10:00 PM UK
'0 22 * * *' -> daily_summary_generation

// Weekly Summary Report - Monday 9:00 AM UK  
'0 9 * * 1' -> weekly_summary_generation

// Daily Aggregation Processing - 2:00 AM UK
'0 2 * * *' -> daily_aggregation_processing

// Weekly Cleanup - Sunday 3:00 AM UK
'0 3 * * 0' -> cleanup_old_reports
```

## Installation & Setup

### 1. Install Dependencies

```bash
npm install bullmq redis @react-email/render @react-email/components \
            resend sendgrid chart.js react-chartjs-2 jspdf puppeteer \
            xlsx node-schedule date-fns
```

### 2. Database Setup

```bash
# Apply reporting system migration
supabase db push

# Seed system data
psql -d your_database -f src/lib/db/seeds/reporting-system-seed.sql
```

### 3. Initialize Redis

```bash
# Start Redis server
redis-server

# Verify connection
redis-cli ping
```

### 4. Start Job Scheduler

```javascript
import { initializeDefaultJobs } from '@/lib/reporting/jobs/JobScheduler';

// Initialize on application startup
await initializeDefaultJobs();
```

## Usage Examples

### Generate Manual Report

```javascript
import { DailySummaryGenerator } from '@/lib/reporting/generators/DailySummaryGenerator';

const generator = new DailySummaryGenerator();
const report = await generator.generate({
  reportDate: new Date(),
  format: ReportFormat.PDF,
  recipientIds: ['recipient-id-1', 'recipient-id-2']
});

console.log('Report generated:', report.reportId);
```

### Schedule Custom Job

```javascript
import { getJobScheduler } from '@/lib/reporting/jobs/JobScheduler';

const scheduler = await getJobScheduler();
const jobId = await scheduler.scheduleOneTimeJob(
  'custom-analysis',
  'weekly_summary', 
  { weekStart: new Date() },
  0, // No delay
  { priority: JobPriority.HIGH }
);
```

### Create Subscription

```javascript
import { getRecipientManager } from '@/lib/reporting/distribution/RecipientManager';

const manager = getRecipientManager();
const subscription = await manager.subscribeToReport({
  recipientEmail: 'manager@backroomleeds.co.uk',
  templateId: 'daily-summary-template',
  deliveryFormat: ReportFormat.PDF,
  deliveryChannels: [DeliveryChannel.EMAIL]
});
```

### Calculate KPIs

```javascript
import { getMetricsCalculator } from '@/lib/reporting/analytics/MetricsCalculator';

const calculator = getMetricsCalculator();
const kpi = await calculator.calculateKPI(
  'daily-revenue-kpi',
  startDate,
  endDate,
  AggregationPeriod.DAILY
);
```

## Monitoring & Observability

### System Health Monitoring

The system provides comprehensive health monitoring through:

- **Redis Connection**: Queue backend availability
- **Database Performance**: Query execution times and connection pool status  
- **Job Queue Status**: Active, waiting, failed, and completed job counts
- **Email Delivery**: Success rates, bounce rates, and provider status
- **Memory & CPU**: Resource utilization tracking
- **Error Rates**: Exception tracking and alerting

### Performance Metrics

- **Report Generation Time**: Target <60 seconds for daily, <120 seconds for weekly
- **Job Queue Processing**: Real-time throughput monitoring
- **Email Delivery Speed**: Delivery confirmation tracking
- **Database Query Performance**: Slow query identification and optimization
- **Cache Hit Rates**: Metrics cache effectiveness tracking

### Alerting System

Automated alerts for:
- Job execution failures (>3 consecutive failures)
- High system load (>80% utilization) 
- Email delivery issues (>10% bounce rate)
- Database performance degradation
- Queue backlog buildup (>50 waiting jobs)

## Security & Compliance

### Data Protection
- **Encryption**: All email communications encrypted in transit
- **Access Control**: Role-based permissions for admin functions
- **Data Retention**: Configurable retention policies (90-day default)
- **Audit Logging**: Complete audit trail of all system actions
- **GDPR Compliance**: Data anonymization and deletion capabilities

### Security Measures
- **API Authentication**: JWT-based admin API access
- **Rate Limiting**: Protection against abuse and spam
- **Input Validation**: Comprehensive sanitization of user inputs
- **SQL Injection Prevention**: Parameterized queries throughout
- **XSS Protection**: Content Security Policy implementation

## Troubleshooting

### Common Issues

#### Job Queue Not Processing
```bash
# Check Redis connection
redis-cli ping

# Verify job scheduler status
curl /api/reporting/jobs/status?systemHealth=true

# Restart job scheduler
npm run reporting:restart-scheduler
```

#### Email Delivery Failures
```bash
# Check provider status
curl /api/reporting/jobs/status?systemHealth=true

# Review delivery logs
tail -f logs/email-delivery.log

# Test email configuration
npm run reporting:test-email
```

#### Report Generation Timeout
```sql
-- Check for long-running queries
SELECT * FROM pg_stat_activity WHERE state = 'active' AND query_start < NOW() - INTERVAL '5 minutes';

-- Review aggregation performance
SELECT * FROM job_execution_history WHERE execution_time_ms > 300000 ORDER BY started_at DESC LIMIT 10;
```

#### High Memory Usage
```bash
# Monitor memory usage
pm2 monit

# Check for memory leaks
node --inspect app.js

# Restart workers if needed
pm2 restart reporting-workers
```

### Performance Optimization

#### Database Optimization
- **Index Analysis**: Regular review of query execution plans
- **Materialized View Refresh**: Scheduled during low-usage periods
- **Connection Pooling**: Optimized for concurrent report generation
- **Query Caching**: Redis-based caching for frequent analytics queries

#### Job Queue Optimization  
- **Concurrency Tuning**: Balanced worker allocation based on system resources
- **Priority Queues**: Critical reports processed first
- **Batch Processing**: Multiple small jobs combined for efficiency
- **Resource Monitoring**: Automatic scaling based on queue depth

## Development & Testing

### Running Tests

```bash
# Core functionality tests
npm test -- --testPathPatterns=reporting-core

# Integration tests (requires Redis and database)
npm test -- --testPathPatterns=reporting-integration

# Full test suite
npm run test:reporting
```

### Development Commands

```bash
# Start development with hot reload
npm run dev:reporting

# Generate test reports
npm run reporting:generate-test-data

# Monitor job queue in development
npm run reporting:monitor

# Clean up test data
npm run reporting:cleanup-test
```

### Adding Custom Reports

1. **Create Template**: Define report structure in `report_templates`
2. **Implement Generator**: Extend base generator class
3. **Add API Endpoint**: Create REST endpoint for manual generation
4. **Configure Scheduling**: Add to default scheduled jobs if recurring
5. **Create Email Template**: Design React Email template
6. **Write Tests**: Unit and integration tests for new functionality

### Performance Testing

```bash
# Load test report generation
npm run test:load-reports

# Stress test job queue
npm run test:stress-queue

# Email delivery performance
npm run test:email-performance

# Database performance under load
npm run test:db-performance
```

## Roadmap & Future Enhancements

### Phase 4 Planned Features
- **Machine Learning Integration**: Predictive analytics for booking patterns
- **Advanced Visualization**: Interactive charts with Chart.js integration
- **Multi-language Support**: International report templates
- **Mobile App Integration**: Push notifications for critical alerts
- **API Rate Limiting**: Enhanced security and resource protection

### Long-term Roadmap
- **Multi-venue Support**: Scale to additional venue locations
- **Real-time Dashboard**: Live metrics with WebSocket updates  
- **Customer Segmentation**: Advanced customer behavior analysis
- **Revenue Optimization**: AI-driven pricing recommendations
- **Integration Hub**: Third-party service integrations (Stripe, Fatsoma, etc.)

## Support & Maintenance

### Regular Maintenance Tasks
- **Weekly**: Review system performance metrics and job success rates
- **Monthly**: Analyze storage usage and clean up old reports beyond retention period
- **Quarterly**: Update dependencies and security patches
- **Annually**: Review and optimize database schema and indexes

### Support Contacts
- **Technical Issues**: tech@backroomleeds.co.uk  
- **Business Questions**: reports@backroomleeds.co.uk
- **Emergency Contact**: +44 113 XXX XXXX (24/7 critical issues)

### Documentation Updates
This documentation is maintained alongside the codebase. For the most current information, refer to:
- **Code Comments**: Comprehensive inline documentation
- **API Documentation**: OpenAPI specifications in `/docs/api/`
- **Schema Documentation**: Database schema docs in `/docs/database/`
- **Change Log**: Release notes in `/CHANGELOG.md`

---

**The Backroom Leeds Automated Reporting System** provides sophisticated business intelligence capabilities while maintaining the venue's prohibition-era elegance and professional operational standards.