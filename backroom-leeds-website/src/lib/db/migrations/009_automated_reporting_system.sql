-- ============================================================================
-- THE BACKROOM LEEDS - AUTOMATED REPORTING SYSTEM SCHEMA
-- Version: 1.0.0
-- Phase: 3, Step 3.5
-- Description: Comprehensive reporting system with business intelligence
-- ============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_cron";
CREATE EXTENSION IF NOT EXISTS "tablefunc";

-- ============================================================================
-- ENUMS AND TYPES
-- ============================================================================

-- Job status tracking
CREATE TYPE job_status AS ENUM (
    'pending',
    'running',
    'completed',
    'failed',
    'cancelled',
    'retrying'
);

-- Job priority levels
CREATE TYPE job_priority AS ENUM (
    'low',
    'normal',
    'high',
    'critical'
);

-- Report types
CREATE TYPE report_type AS ENUM (
    'daily_summary',
    'weekly_summary',
    'monthly_summary',
    'event_performance',
    'revenue_analysis',
    'customer_analytics',
    'staff_performance',
    'custom'
);

-- Report formats
CREATE TYPE report_format AS ENUM (
    'pdf',
    'csv',
    'excel',
    'html',
    'json'
);

-- Delivery channels
CREATE TYPE delivery_channel AS ENUM (
    'email',
    'sms',
    'webhook',
    'dashboard',
    'api'
);

-- Delivery status
CREATE TYPE delivery_status AS ENUM (
    'pending',
    'sending',
    'delivered',
    'failed',
    'bounced',
    'opened',
    'clicked'
);

-- Aggregation period
CREATE TYPE aggregation_period AS ENUM (
    'hourly',
    'daily',
    'weekly',
    'monthly',
    'quarterly',
    'yearly'
);

-- Metric types for KPIs
CREATE TYPE metric_type AS ENUM (
    'count',
    'sum',
    'average',
    'percentage',
    'currency',
    'duration',
    'ratio'
);

-- ============================================================================
-- SCHEDULED JOBS AND MONITORING
-- ============================================================================

-- Core job definitions table
CREATE TABLE scheduled_jobs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    job_type VARCHAR(50) NOT NULL, -- 'report', 'cleanup', 'aggregation', etc.
    cron_expression VARCHAR(100) NOT NULL, -- Standard cron format
    timezone VARCHAR(50) DEFAULT 'Europe/London',
    priority job_priority DEFAULT 'normal',
    max_retries INTEGER DEFAULT 3,
    retry_delay_seconds INTEGER DEFAULT 60,
    timeout_seconds INTEGER DEFAULT 300,
    enabled BOOLEAN DEFAULT true,
    metadata JSONB DEFAULT '{}',
    last_run_at TIMESTAMPTZ,
    next_run_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES auth.users(id),
    
    -- Indexes
    INDEX idx_scheduled_jobs_enabled (enabled),
    INDEX idx_scheduled_jobs_next_run (next_run_at) WHERE enabled = true,
    INDEX idx_scheduled_jobs_type (job_type)
);

-- Job execution history
CREATE TABLE job_execution_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    job_id UUID NOT NULL REFERENCES scheduled_jobs(id) ON DELETE CASCADE,
    execution_id VARCHAR(100) UNIQUE, -- External job queue ID (BullMQ)
    status job_status NOT NULL DEFAULT 'pending',
    started_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMPTZ,
    execution_time_ms INTEGER,
    attempt_number INTEGER DEFAULT 1,
    error_message TEXT,
    error_stack TEXT,
    result JSONB,
    metadata JSONB DEFAULT '{}',
    
    -- Performance tracking
    cpu_usage_percent DECIMAL(5,2),
    memory_usage_mb INTEGER,
    records_processed INTEGER,
    
    -- Indexes
    INDEX idx_job_history_job_id (job_id),
    INDEX idx_job_history_status (status),
    INDEX idx_job_history_started (started_at DESC),
    INDEX idx_job_history_execution_id (execution_id)
);

-- Job dependencies for complex workflows
CREATE TABLE job_dependencies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    parent_job_id UUID NOT NULL REFERENCES scheduled_jobs(id) ON DELETE CASCADE,
    dependent_job_id UUID NOT NULL REFERENCES scheduled_jobs(id) ON DELETE CASCADE,
    dependency_type VARCHAR(20) DEFAULT 'completion', -- 'completion', 'success', 'always'
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(parent_job_id, dependent_job_id),
    CHECK (parent_job_id != dependent_job_id)
);

-- Job alerts configuration
CREATE TABLE job_alerts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    job_id UUID NOT NULL REFERENCES scheduled_jobs(id) ON DELETE CASCADE,
    alert_type VARCHAR(50) NOT NULL, -- 'failure', 'timeout', 'slow_execution', etc.
    threshold_value INTEGER, -- e.g., consecutive failures count
    notification_channels delivery_channel[] DEFAULT ARRAY['email']::delivery_channel[],
    recipient_emails TEXT[],
    webhook_url TEXT,
    enabled BOOLEAN DEFAULT true,
    last_triggered_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_job_alerts_job (job_id),
    INDEX idx_job_alerts_enabled (enabled)
);

-- ============================================================================
-- REPORT TEMPLATES AND CONFIGURATION
-- ============================================================================

-- Report template definitions
CREATE TABLE report_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    report_type report_type NOT NULL,
    version INTEGER DEFAULT 1,
    description TEXT,
    template_config JSONB NOT NULL, -- Template structure and queries
    default_format report_format DEFAULT 'pdf',
    supported_formats report_format[] DEFAULT ARRAY['pdf', 'csv', 'excel']::report_format[],
    
    -- Customization options
    customizable_fields JSONB DEFAULT '{}',
    required_parameters JSONB DEFAULT '{}',
    
    -- Performance settings
    cache_duration_minutes INTEGER DEFAULT 60,
    max_execution_time_seconds INTEGER DEFAULT 120,
    
    -- Metadata
    is_active BOOLEAN DEFAULT true,
    is_system_template BOOLEAN DEFAULT false, -- Prevents deletion
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES auth.users(id),
    
    INDEX idx_report_templates_type (report_type),
    INDEX idx_report_templates_active (is_active),
    UNIQUE(name, version)
);

-- Report template versions for history
CREATE TABLE report_template_versions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    template_id UUID NOT NULL REFERENCES report_templates(id) ON DELETE CASCADE,
    version INTEGER NOT NULL,
    template_config JSONB NOT NULL,
    change_description TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES auth.users(id),
    
    INDEX idx_template_versions_template (template_id),
    UNIQUE(template_id, version)
);

-- Report sections for modular reports
CREATE TABLE report_sections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    template_id UUID NOT NULL REFERENCES report_templates(id) ON DELETE CASCADE,
    section_name VARCHAR(100) NOT NULL,
    section_order INTEGER NOT NULL,
    section_type VARCHAR(50) NOT NULL, -- 'chart', 'table', 'summary', 'metric'
    query_config JSONB NOT NULL,
    display_config JSONB DEFAULT '{}',
    is_optional BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_report_sections_template (template_id),
    UNIQUE(template_id, section_order)
);

-- ============================================================================
-- REPORT RECIPIENTS AND SUBSCRIPTIONS
-- ============================================================================

-- Report recipients
CREATE TABLE report_recipients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL,
    name VARCHAR(100),
    phone VARCHAR(20),
    role VARCHAR(50), -- 'manager', 'owner', 'staff', 'stakeholder'
    timezone VARCHAR(50) DEFAULT 'Europe/London',
    language_code VARCHAR(10) DEFAULT 'en',
    
    -- Delivery preferences
    preferred_channels delivery_channel[] DEFAULT ARRAY['email']::delivery_channel[],
    preferred_format report_format DEFAULT 'pdf',
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    email_verified BOOLEAN DEFAULT false,
    bounced_count INTEGER DEFAULT 0,
    last_email_sent_at TIMESTAMPTZ,
    
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_report_recipients_email (email),
    INDEX idx_report_recipients_user (user_id),
    INDEX idx_report_recipients_active (is_active)
);

-- Report subscriptions
CREATE TABLE report_subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    recipient_id UUID NOT NULL REFERENCES report_recipients(id) ON DELETE CASCADE,
    template_id UUID NOT NULL REFERENCES report_templates(id) ON DELETE CASCADE,
    
    -- Delivery settings
    delivery_channels delivery_channel[] DEFAULT ARRAY['email']::delivery_channel[],
    delivery_format report_format DEFAULT 'pdf',
    
    -- Schedule override (optional, uses template default if null)
    custom_schedule VARCHAR(100), -- Cron expression
    
    -- Filters and parameters
    filter_config JSONB DEFAULT '{}',
    custom_parameters JSONB DEFAULT '{}',
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    paused_until TIMESTAMPTZ,
    last_delivered_at TIMESTAMPTZ,
    next_delivery_at TIMESTAMPTZ,
    
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_subscriptions_recipient (recipient_id),
    INDEX idx_subscriptions_template (template_id),
    INDEX idx_subscriptions_active (is_active),
    INDEX idx_subscriptions_next_delivery (next_delivery_at) WHERE is_active = true,
    UNIQUE(recipient_id, template_id)
);

-- Subscription preferences
CREATE TABLE subscription_preferences (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    subscription_id UUID NOT NULL REFERENCES report_subscriptions(id) ON DELETE CASCADE,
    preference_key VARCHAR(50) NOT NULL,
    preference_value TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(subscription_id, preference_key)
);

-- ============================================================================
-- REPORT GENERATION HISTORY
-- ============================================================================

-- Report generation history
CREATE TABLE report_generation_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    template_id UUID NOT NULL REFERENCES report_templates(id),
    job_execution_id UUID REFERENCES job_execution_history(id),
    report_type report_type NOT NULL,
    
    -- Generation details
    generated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    generation_time_ms INTEGER,
    data_period_start TIMESTAMPTZ NOT NULL,
    data_period_end TIMESTAMPTZ NOT NULL,
    
    -- Output details
    output_format report_format NOT NULL,
    file_size_bytes INTEGER,
    file_path TEXT,
    file_url TEXT,
    expires_at TIMESTAMPTZ,
    
    -- Metrics
    records_processed INTEGER,
    sections_generated INTEGER,
    errors_count INTEGER DEFAULT 0,
    warnings JSONB DEFAULT '[]',
    
    -- Report content summary
    report_summary JSONB,
    key_metrics JSONB,
    
    -- Status
    is_successful BOOLEAN DEFAULT true,
    error_message TEXT,
    
    created_by UUID REFERENCES auth.users(id),
    
    INDEX idx_generation_history_template (template_id),
    INDEX idx_generation_history_generated (generated_at DESC),
    INDEX idx_generation_history_type (report_type),
    INDEX idx_generation_history_period (data_period_start, data_period_end)
);

-- Report delivery history
CREATE TABLE report_delivery_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    generation_id UUID NOT NULL REFERENCES report_generation_history(id) ON DELETE CASCADE,
    subscription_id UUID REFERENCES report_subscriptions(id) ON DELETE SET NULL,
    recipient_id UUID NOT NULL REFERENCES report_recipients(id),
    
    -- Delivery details
    delivery_channel delivery_channel NOT NULL,
    delivery_status delivery_status NOT NULL DEFAULT 'pending',
    delivery_address TEXT NOT NULL, -- Email, phone, webhook URL, etc.
    
    -- Timestamps
    queued_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    sent_at TIMESTAMPTZ,
    delivered_at TIMESTAMPTZ,
    opened_at TIMESTAMPTZ,
    clicked_at TIMESTAMPTZ,
    
    -- Tracking
    message_id TEXT, -- External service message ID
    tracking_id TEXT,
    bounce_reason TEXT,
    failure_reason TEXT,
    retry_count INTEGER DEFAULT 0,
    
    -- Metadata
    metadata JSONB DEFAULT '{}',
    
    INDEX idx_delivery_history_generation (generation_id),
    INDEX idx_delivery_history_subscription (subscription_id),
    INDEX idx_delivery_history_recipient (recipient_id),
    INDEX idx_delivery_history_status (delivery_status),
    INDEX idx_delivery_history_queued (queued_at DESC)
);

-- Report access logs for security and compliance
CREATE TABLE report_access_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    generation_id UUID NOT NULL REFERENCES report_generation_history(id) ON DELETE CASCADE,
    accessed_by UUID REFERENCES auth.users(id),
    access_type VARCHAR(50) NOT NULL, -- 'view', 'download', 'share', 'export'
    ip_address INET,
    user_agent TEXT,
    accessed_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_access_logs_generation (generation_id),
    INDEX idx_access_logs_user (accessed_by),
    INDEX idx_access_logs_accessed (accessed_at DESC)
);

-- ============================================================================
-- BUSINESS INTELLIGENCE AND ANALYTICS
-- ============================================================================

-- KPI definitions
CREATE TABLE kpi_definitions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL UNIQUE,
    display_name VARCHAR(100) NOT NULL,
    category VARCHAR(50) NOT NULL, -- 'revenue', 'bookings', 'customers', 'operations'
    metric_type metric_type NOT NULL,
    calculation_query TEXT NOT NULL,
    
    -- Thresholds for alerts
    target_value DECIMAL(15,2),
    warning_threshold DECIMAL(15,2),
    critical_threshold DECIMAL(15,2),
    
    -- Display settings
    unit VARCHAR(20), -- '£', '%', 'bookings', etc.
    decimal_places INTEGER DEFAULT 2,
    trend_direction VARCHAR(10), -- 'higher_better', 'lower_better', 'neutral'
    
    -- Caching
    cache_duration_minutes INTEGER DEFAULT 15,
    requires_realtime BOOLEAN DEFAULT false,
    
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_kpi_definitions_category (category),
    INDEX idx_kpi_definitions_active (is_active)
);

-- KPI calculations cache
CREATE TABLE kpi_calculations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    kpi_id UUID NOT NULL REFERENCES kpi_definitions(id) ON DELETE CASCADE,
    period_start TIMESTAMPTZ NOT NULL,
    period_end TIMESTAMPTZ NOT NULL,
    aggregation_period aggregation_period NOT NULL,
    
    -- Values
    calculated_value DECIMAL(15,4) NOT NULL,
    previous_value DECIMAL(15,4),
    change_percentage DECIMAL(10,2),
    trend_direction VARCHAR(10), -- 'up', 'down', 'stable'
    
    -- Comparison values
    year_ago_value DECIMAL(15,4),
    month_ago_value DECIMAL(15,4),
    week_ago_value DECIMAL(15,4),
    
    -- Statistics
    min_value DECIMAL(15,4),
    max_value DECIMAL(15,4),
    avg_value DECIMAL(15,4),
    std_deviation DECIMAL(15,4),
    
    -- Metadata
    calculation_time_ms INTEGER,
    data_points_count INTEGER,
    calculated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMPTZ,
    
    INDEX idx_kpi_calculations_kpi (kpi_id),
    INDEX idx_kpi_calculations_period (period_start, period_end),
    INDEX idx_kpi_calculations_aggregation (aggregation_period),
    INDEX idx_kpi_calculations_expires (expires_at),
    UNIQUE(kpi_id, period_start, period_end, aggregation_period)
);

-- Event performance analytics
CREATE TABLE event_performance_analytics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID NOT NULL, -- Reference to events table
    event_date DATE NOT NULL,
    event_name VARCHAR(100) NOT NULL, -- LA FIESTA, SHHH!, NOSTALGIA
    
    -- Attendance metrics
    total_bookings INTEGER DEFAULT 0,
    total_guests INTEGER DEFAULT 0,
    table_occupancy_rate DECIMAL(5,2),
    walk_ins_count INTEGER DEFAULT 0,
    
    -- Revenue metrics
    total_revenue DECIMAL(10,2) DEFAULT 0,
    bar_revenue DECIMAL(10,2) DEFAULT 0,
    table_revenue DECIMAL(10,2) DEFAULT 0,
    average_spend_per_guest DECIMAL(8,2),
    
    -- Operational metrics
    check_in_rate DECIMAL(5,2),
    no_show_rate DECIMAL(5,2),
    cancellation_rate DECIMAL(5,2),
    average_party_size DECIMAL(4,2),
    
    -- Time-based metrics
    peak_hour TIME,
    peak_hour_guests INTEGER,
    average_stay_duration_minutes INTEGER,
    
    -- Customer satisfaction
    feedback_score DECIMAL(3,2),
    feedback_count INTEGER DEFAULT 0,
    
    -- Comparisons
    vs_last_week_revenue_change DECIMAL(10,2),
    vs_last_month_revenue_change DECIMAL(10,2),
    vs_last_year_revenue_change DECIMAL(10,2),
    
    calculated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_event_performance_date (event_date DESC),
    INDEX idx_event_performance_name (event_name),
    INDEX idx_event_performance_event (event_id),
    UNIQUE(event_id, event_date)
);

-- Customer analytics aggregations
CREATE TABLE customer_analytics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_id UUID NOT NULL, -- Reference to customers table
    analysis_period aggregation_period NOT NULL,
    period_start TIMESTAMPTZ NOT NULL,
    period_end TIMESTAMPTZ NOT NULL,
    
    -- Booking behavior
    total_bookings INTEGER DEFAULT 0,
    total_spend DECIMAL(10,2) DEFAULT 0,
    average_party_size DECIMAL(4,2),
    favorite_event VARCHAR(100),
    favorite_day_of_week INTEGER, -- 0-6
    
    -- Loyalty metrics
    loyalty_score DECIMAL(5,2),
    lifetime_value DECIMAL(10,2),
    churn_probability DECIMAL(5,2),
    days_since_last_visit INTEGER,
    
    -- Preferences
    preferred_tables INTEGER[],
    preferred_packages TEXT[],
    special_occasions_count INTEGER DEFAULT 0,
    
    -- Engagement
    cancellation_count INTEGER DEFAULT 0,
    no_show_count INTEGER DEFAULT 0,
    on_time_arrival_rate DECIMAL(5,2),
    
    calculated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_customer_analytics_customer (customer_id),
    INDEX idx_customer_analytics_period (period_start, period_end),
    INDEX idx_customer_analytics_aggregation (analysis_period),
    UNIQUE(customer_id, analysis_period, period_start, period_end)
);

-- ============================================================================
-- REPORT DATA AGGREGATION
-- ============================================================================

-- Daily aggregations for fast reporting
CREATE TABLE daily_aggregations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    aggregation_date DATE NOT NULL,
    
    -- Booking metrics
    total_bookings INTEGER DEFAULT 0,
    confirmed_bookings INTEGER DEFAULT 0,
    cancelled_bookings INTEGER DEFAULT 0,
    total_guests INTEGER DEFAULT 0,
    
    -- Revenue metrics
    gross_revenue DECIMAL(10,2) DEFAULT 0,
    net_revenue DECIMAL(10,2) DEFAULT 0,
    deposits_collected DECIMAL(10,2) DEFAULT 0,
    refunds_processed DECIMAL(10,2) DEFAULT 0,
    
    -- Table metrics
    tables_occupied INTEGER DEFAULT 0,
    table_turnover_rate DECIMAL(5,2),
    average_occupancy_rate DECIMAL(5,2),
    
    -- Customer metrics
    new_customers INTEGER DEFAULT 0,
    returning_customers INTEGER DEFAULT 0,
    vip_bookings INTEGER DEFAULT 0,
    
    -- Operational metrics
    check_ins INTEGER DEFAULT 0,
    no_shows INTEGER DEFAULT 0,
    walk_ins INTEGER DEFAULT 0,
    waitlist_count INTEGER DEFAULT 0,
    
    -- Time metrics
    average_booking_lead_time_hours INTEGER,
    average_stay_duration_minutes INTEGER,
    peak_hour TIME,
    peak_occupancy_rate DECIMAL(5,2),
    
    -- Special occasions
    birthdays_count INTEGER DEFAULT 0,
    anniversaries_count INTEGER DEFAULT 0,
    corporate_events_count INTEGER DEFAULT 0,
    
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    
    PRIMARY KEY (aggregation_date),
    INDEX idx_daily_aggregations_date (aggregation_date DESC)
);

-- Hourly aggregations for real-time monitoring
CREATE TABLE hourly_aggregations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    aggregation_hour TIMESTAMPTZ NOT NULL,
    
    -- Real-time metrics
    current_occupancy INTEGER DEFAULT 0,
    current_guests INTEGER DEFAULT 0,
    tables_available INTEGER DEFAULT 0,
    
    -- Flow metrics
    check_ins_count INTEGER DEFAULT 0,
    check_outs_count INTEGER DEFAULT 0,
    new_bookings_count INTEGER DEFAULT 0,
    cancellations_count INTEGER DEFAULT 0,
    
    -- Revenue metrics
    hour_revenue DECIMAL(10,2) DEFAULT 0,
    hour_bar_sales DECIMAL(10,2) DEFAULT 0,
    
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    
    PRIMARY KEY (aggregation_hour),
    INDEX idx_hourly_aggregations_hour (aggregation_hour DESC)
);

-- Pre-computed report metrics
CREATE TABLE report_metrics_cache (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    metric_key VARCHAR(100) NOT NULL,
    period_start TIMESTAMPTZ NOT NULL,
    period_end TIMESTAMPTZ NOT NULL,
    metric_value JSONB NOT NULL,
    calculated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMPTZ NOT NULL,
    
    INDEX idx_metrics_cache_key (metric_key),
    INDEX idx_metrics_cache_period (period_start, period_end),
    INDEX idx_metrics_cache_expires (expires_at),
    UNIQUE(metric_key, period_start, period_end)
);

-- ============================================================================
-- MATERIALIZED VIEWS FOR PERFORMANCE
-- ============================================================================

-- Weekly summary view
CREATE MATERIALIZED VIEW weekly_summary_view AS
SELECT 
    date_trunc('week', aggregation_date) AS week_start,
    SUM(total_bookings) AS total_bookings,
    SUM(total_guests) AS total_guests,
    SUM(gross_revenue) AS gross_revenue,
    AVG(average_occupancy_rate) AS avg_occupancy_rate,
    SUM(new_customers) AS new_customers,
    SUM(returning_customers) AS returning_customers,
    SUM(no_shows) AS no_shows,
    SUM(cancellations_count) AS cancellations
FROM daily_aggregations
GROUP BY date_trunc('week', aggregation_date)
WITH DATA;

CREATE INDEX idx_weekly_summary_week ON weekly_summary_view(week_start DESC);

-- Monthly summary view
CREATE MATERIALIZED VIEW monthly_summary_view AS
SELECT 
    date_trunc('month', aggregation_date) AS month_start,
    SUM(total_bookings) AS total_bookings,
    SUM(total_guests) AS total_guests,
    SUM(gross_revenue) AS gross_revenue,
    AVG(average_occupancy_rate) AS avg_occupancy_rate,
    SUM(new_customers) AS new_customers,
    SUM(returning_customers) AS returning_customers
FROM daily_aggregations
GROUP BY date_trunc('month', aggregation_date)
WITH DATA;

CREATE INDEX idx_monthly_summary_month ON monthly_summary_view(month_start DESC);

-- Top customers view
CREATE MATERIALIZED VIEW top_customers_view AS
SELECT 
    customer_id,
    SUM(total_bookings) AS total_bookings,
    SUM(total_spend) AS total_spend,
    AVG(average_party_size) AS avg_party_size,
    MAX(period_end) AS last_visit
FROM customer_analytics
WHERE analysis_period = 'monthly'
GROUP BY customer_id
ORDER BY total_spend DESC
WITH DATA;

CREATE INDEX idx_top_customers_spend ON top_customers_view(total_spend DESC);

-- ============================================================================
-- FUNCTIONS AND TRIGGERS
-- ============================================================================

-- Function to calculate next run time for scheduled jobs
CREATE OR REPLACE FUNCTION calculate_next_run_time(
    cron_exp VARCHAR,
    timezone VARCHAR,
    after_time TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
) RETURNS TIMESTAMPTZ AS $$
DECLARE
    next_run TIMESTAMPTZ;
BEGIN
    -- This is a placeholder - integrate with pg_cron or custom cron parser
    -- For now, return next hour
    next_run := date_trunc('hour', after_time) + INTERVAL '1 hour';
    RETURN next_run;
END;
$$ LANGUAGE plpgsql;

-- Function to process daily aggregations
CREATE OR REPLACE FUNCTION process_daily_aggregations(target_date DATE)
RETURNS void AS $$
BEGIN
    INSERT INTO daily_aggregations (
        aggregation_date,
        total_bookings,
        confirmed_bookings,
        cancelled_bookings,
        total_guests,
        gross_revenue,
        tables_occupied,
        new_customers,
        returning_customers,
        check_ins,
        no_shows,
        updated_at
    )
    SELECT
        target_date,
        COUNT(DISTINCT b.id) AS total_bookings,
        COUNT(DISTINCT b.id) FILTER (WHERE b.status = 'confirmed') AS confirmed_bookings,
        COUNT(DISTINCT b.id) FILTER (WHERE b.status = 'cancelled') AS cancelled_bookings,
        SUM(b.party_size) AS total_guests,
        SUM(b.total_amount) FILTER (WHERE b.status = 'confirmed') AS gross_revenue,
        COUNT(DISTINCT b.table_id) FILTER (WHERE b.status = 'confirmed') AS tables_occupied,
        COUNT(DISTINCT b.customer_id) FILTER (WHERE c.created_at::date = target_date) AS new_customers,
        COUNT(DISTINCT b.customer_id) FILTER (WHERE c.created_at::date < target_date) AS returning_customers,
        COUNT(DISTINCT b.id) FILTER (WHERE b.checked_in_at IS NOT NULL) AS check_ins,
        COUNT(DISTINCT b.id) FILTER (WHERE b.status = 'no_show') AS no_shows,
        CURRENT_TIMESTAMP
    FROM bookings b
    LEFT JOIN customers c ON b.customer_id = c.id
    WHERE b.booking_date = target_date
    GROUP BY target_date
    ON CONFLICT (aggregation_date) DO UPDATE SET
        total_bookings = EXCLUDED.total_bookings,
        confirmed_bookings = EXCLUDED.confirmed_bookings,
        cancelled_bookings = EXCLUDED.cancelled_bookings,
        total_guests = EXCLUDED.total_guests,
        gross_revenue = EXCLUDED.gross_revenue,
        tables_occupied = EXCLUDED.tables_occupied,
        new_customers = EXCLUDED.new_customers,
        returning_customers = EXCLUDED.returning_customers,
        check_ins = EXCLUDED.check_ins,
        no_shows = EXCLUDED.no_shows,
        updated_at = CURRENT_TIMESTAMP;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate KPI value
CREATE OR REPLACE FUNCTION calculate_kpi_value(
    kpi_id UUID,
    start_date TIMESTAMPTZ,
    end_date TIMESTAMPTZ
) RETURNS DECIMAL AS $$
DECLARE
    kpi_query TEXT;
    kpi_value DECIMAL;
BEGIN
    SELECT calculation_query INTO kpi_query
    FROM kpi_definitions
    WHERE id = kpi_id;
    
    -- Execute dynamic query with date parameters
    EXECUTE format(kpi_query, start_date, end_date) INTO kpi_value;
    
    RETURN kpi_value;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update job next run time
CREATE OR REPLACE FUNCTION update_job_next_run_time()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status IN ('completed', 'failed') THEN
        UPDATE scheduled_jobs
        SET 
            last_run_at = NEW.completed_at,
            next_run_at = calculate_next_run_time(
                (SELECT cron_expression FROM scheduled_jobs WHERE id = NEW.job_id),
                (SELECT timezone FROM scheduled_jobs WHERE id = NEW.job_id),
                NEW.completed_at
            )
        WHERE id = NEW.job_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_job_next_run
AFTER UPDATE ON job_execution_history
FOR EACH ROW
WHEN (NEW.status != OLD.status)
EXECUTE FUNCTION update_job_next_run_time();

-- Trigger to refresh materialized views
CREATE OR REPLACE FUNCTION refresh_summary_views()
RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY weekly_summary_view;
    REFRESH MATERIALIZED VIEW CONCURRENTLY monthly_summary_view;
    REFRESH MATERIALIZED VIEW CONCURRENTLY top_customers_view;
END;
$$ LANGUAGE plpgsql;

-- Function to clean up old report data
CREATE OR REPLACE FUNCTION cleanup_old_reports(retention_days INTEGER DEFAULT 90)
RETURNS void AS $$
BEGIN
    -- Delete old generation history
    DELETE FROM report_generation_history
    WHERE generated_at < CURRENT_TIMESTAMP - (retention_days || ' days')::INTERVAL
    AND is_successful = true;
    
    -- Delete old job execution history
    DELETE FROM job_execution_history
    WHERE completed_at < CURRENT_TIMESTAMP - (retention_days || ' days')::INTERVAL
    AND status = 'completed';
    
    -- Delete expired cache entries
    DELETE FROM report_metrics_cache
    WHERE expires_at < CURRENT_TIMESTAMP;
    
    -- Delete old delivery history
    DELETE FROM report_delivery_history
    WHERE delivered_at < CURRENT_TIMESTAMP - (retention_days || ' days')::INTERVAL
    AND delivery_status = 'delivered';
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- ROW LEVEL SECURITY POLICIES
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE scheduled_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_execution_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE report_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE report_recipients ENABLE ROW LEVEL SECURITY;
ALTER TABLE report_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE report_generation_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE report_delivery_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE report_access_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE kpi_definitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE kpi_calculations ENABLE ROW LEVEL SECURITY;

-- Scheduled jobs policies (admin only)
CREATE POLICY scheduled_jobs_admin_all ON scheduled_jobs
    FOR ALL
    TO authenticated
    USING (auth.check_user_role(auth.uid(), 'admin'));

-- Report templates policies (read for all, write for admin)
CREATE POLICY report_templates_read ON report_templates
    FOR SELECT
    TO authenticated
    USING (is_active = true);

CREATE POLICY report_templates_write ON report_templates
    FOR ALL
    TO authenticated
    USING (auth.check_user_role(auth.uid(), 'admin'));

-- Report recipients policies (self and admin)
CREATE POLICY report_recipients_self ON report_recipients
    FOR ALL
    TO authenticated
    USING (user_id = auth.uid() OR auth.check_user_role(auth.uid(), 'admin'));

-- Report subscriptions policies (own subscriptions)
CREATE POLICY report_subscriptions_own ON report_subscriptions
    FOR ALL
    TO authenticated
    USING (
        recipient_id IN (
            SELECT id FROM report_recipients WHERE user_id = auth.uid()
        ) OR auth.check_user_role(auth.uid(), 'admin')
    );

-- Report generation history policies (based on role)
CREATE POLICY report_generation_admin ON report_generation_history
    FOR ALL
    TO authenticated
    USING (auth.check_user_role(auth.uid(), 'admin'));

CREATE POLICY report_generation_manager ON report_generation_history
    FOR SELECT
    TO authenticated
    USING (auth.check_user_role(auth.uid(), 'manager'));

-- KPI policies (read for managers, write for admin)
CREATE POLICY kpi_read ON kpi_definitions
    FOR SELECT
    TO authenticated
    USING (
        auth.check_user_role(auth.uid(), 'manager') OR 
        auth.check_user_role(auth.uid(), 'admin')
    );

CREATE POLICY kpi_write ON kpi_definitions
    FOR ALL
    TO authenticated
    USING (auth.check_user_role(auth.uid(), 'admin'));

-- ============================================================================
-- INDEXES FOR PERFORMANCE OPTIMIZATION
-- ============================================================================

-- Composite indexes for common queries
CREATE INDEX idx_job_history_composite ON job_execution_history(job_id, status, started_at DESC);
CREATE INDEX idx_delivery_composite ON report_delivery_history(recipient_id, delivery_status, queued_at DESC);
CREATE INDEX idx_aggregations_composite ON daily_aggregations(aggregation_date DESC, gross_revenue DESC);
CREATE INDEX idx_customer_analytics_composite ON customer_analytics(customer_id, analysis_period, period_end DESC);
CREATE INDEX idx_event_performance_composite ON event_performance_analytics(event_name, event_date DESC);

-- Partial indexes for active records
CREATE INDEX idx_jobs_active_next_run ON scheduled_jobs(next_run_at) WHERE enabled = true;
CREATE INDEX idx_subscriptions_active_delivery ON report_subscriptions(next_delivery_at) WHERE is_active = true AND paused_until IS NULL;
CREATE INDEX idx_templates_active_type ON report_templates(report_type) WHERE is_active = true;

-- BRIN indexes for time-series data
CREATE INDEX idx_daily_aggregations_brin ON daily_aggregations USING BRIN(aggregation_date);
CREATE INDEX idx_hourly_aggregations_brin ON hourly_aggregations USING BRIN(aggregation_hour);
CREATE INDEX idx_generation_history_brin ON report_generation_history USING BRIN(generated_at);

-- GIN indexes for JSONB columns
CREATE INDEX idx_job_metadata_gin ON scheduled_jobs USING GIN(metadata);
CREATE INDEX idx_template_config_gin ON report_templates USING GIN(template_config);
CREATE INDEX idx_report_summary_gin ON report_generation_history USING GIN(report_summary);
CREATE INDEX idx_key_metrics_gin ON report_generation_history USING GIN(key_metrics);

-- ============================================================================
-- SEED DATA FOR SYSTEM REPORTS
-- ============================================================================

-- Insert system report templates
INSERT INTO report_templates (
    name,
    report_type,
    description,
    template_config,
    default_format,
    supported_formats,
    is_system_template
) VALUES 
(
    'Daily Summary Report',
    'daily_summary',
    'Comprehensive daily operational summary for The Backroom Leeds',
    '{
        "sections": [
            {"type": "summary", "title": "Executive Summary"},
            {"type": "metrics", "title": "Key Metrics"},
            {"type": "table", "title": "Bookings Overview"},
            {"type": "chart", "title": "Revenue Breakdown"},
            {"type": "table", "title": "Event Performance"},
            {"type": "metrics", "title": "Customer Analytics"}
        ],
        "data_sources": ["bookings", "customers", "events", "payments"],
        "schedule": "0 22 * * *"
    }'::JSONB,
    'pdf',
    ARRAY['pdf', 'excel', 'html']::report_format[],
    true
),
(
    'Weekly Summary Report',
    'weekly_summary',
    'Weekly performance analysis with trends and comparisons',
    '{
        "sections": [
            {"type": "summary", "title": "Weekly Overview"},
            {"type": "chart", "title": "Week-over-Week Trends"},
            {"type": "table", "title": "Top Events Performance"},
            {"type": "metrics", "title": "Revenue Analysis"},
            {"type": "chart", "title": "Customer Behavior"},
            {"type": "table", "title": "Staff Performance"}
        ],
        "data_sources": ["weekly_summary_view", "event_performance_analytics", "customer_analytics"],
        "schedule": "0 9 * * 1"
    }'::JSONB,
    'pdf',
    ARRAY['pdf', 'excel', 'html']::report_format[],
    true
);

-- Insert KPI definitions
INSERT INTO kpi_definitions (
    name,
    display_name,
    category,
    metric_type,
    calculation_query,
    unit,
    trend_direction
) VALUES
(
    'daily_revenue',
    'Daily Revenue',
    'revenue',
    'currency',
    'SELECT SUM(gross_revenue) FROM daily_aggregations WHERE aggregation_date = ''%s''::date',
    '£',
    'higher_better'
),
(
    'table_occupancy_rate',
    'Table Occupancy Rate',
    'operations',
    'percentage',
    'SELECT AVG(average_occupancy_rate) FROM daily_aggregations WHERE aggregation_date BETWEEN ''%s'' AND ''%s''',
    '%',
    'higher_better'
),
(
    'customer_satisfaction',
    'Customer Satisfaction',
    'customers',
    'average',
    'SELECT AVG(feedback_score) FROM event_performance_analytics WHERE event_date BETWEEN ''%s'' AND ''%s''',
    '',
    'higher_better'
);

-- Insert scheduled jobs
INSERT INTO scheduled_jobs (
    name,
    description,
    job_type,
    cron_expression,
    priority,
    timeout_seconds
) VALUES
(
    'daily_summary_generation',
    'Generate daily summary report',
    'report',
    '0 22 * * *',
    'high',
    300
),
(
    'weekly_summary_generation',
    'Generate weekly summary report',
    'report',
    '0 9 * * 1',
    'high',
    600
),
(
    'daily_aggregation_processing',
    'Process daily aggregations',
    'aggregation',
    '0 2 * * *',
    'normal',
    1800
),
(
    'cleanup_old_reports',
    'Clean up old report data',
    'cleanup',
    '0 3 * * 0',
    'low',
    600
);

-- ============================================================================
-- GRANTS FOR SUPABASE
-- ============================================================================

-- Grant usage on schema
GRANT USAGE ON SCHEMA public TO anon, authenticated;

-- Grant appropriate permissions
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- ============================================================================
-- COMMENTS FOR DOCUMENTATION
-- ============================================================================

COMMENT ON TABLE scheduled_jobs IS 'Core job scheduling system for automated reports and tasks';
COMMENT ON TABLE report_templates IS 'Report template definitions with customizable configurations';
COMMENT ON TABLE report_recipients IS 'Report recipient management with delivery preferences';
COMMENT ON TABLE report_generation_history IS 'Complete audit trail of all generated reports';
COMMENT ON TABLE kpi_definitions IS 'Business KPI definitions for performance monitoring';
COMMENT ON TABLE daily_aggregations IS 'Pre-computed daily metrics for fast report generation';
COMMENT ON TABLE event_performance_analytics IS 'Event-specific performance metrics and analysis';
COMMENT ON TABLE customer_analytics IS 'Customer behavior and loyalty analytics';

-- ============================================================================
-- END OF SCHEMA
-- ============================================================================