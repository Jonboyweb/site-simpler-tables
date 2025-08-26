-- ============================================================================
-- THE BACKROOM LEEDS - REPORTING SYSTEM SEED DATA
-- Version: 1.0.0
-- Description: Test data for automated reporting and business intelligence
-- ============================================================================

-- Clear existing test data (be careful in production!)
TRUNCATE TABLE 
    report_access_logs,
    report_delivery_history,
    report_generation_history,
    subscription_preferences,
    report_subscriptions,
    report_recipients,
    report_sections,
    report_template_versions,
    report_templates,
    job_alerts,
    job_dependencies,
    job_execution_history,
    scheduled_jobs,
    customer_analytics,
    event_performance_analytics,
    kpi_calculations,
    kpi_definitions,
    report_metrics_cache,
    hourly_aggregations,
    daily_aggregations
CASCADE;

-- ============================================================================
-- SCHEDULED JOBS
-- ============================================================================

-- Daily report generation job
INSERT INTO scheduled_jobs (
    id,
    name,
    description,
    job_type,
    cron_expression,
    timezone,
    priority,
    max_retries,
    retry_delay_seconds,
    timeout_seconds,
    enabled,
    metadata,
    next_run_at
) VALUES 
(
    'a1b2c3d4-e5f6-4789-0123-456789abcdef',
    'daily_summary_report',
    'Generate and distribute daily summary report for The Backroom Leeds',
    'report',
    '0 22 * * *', -- 10 PM daily
    'Europe/London',
    'high',
    3,
    300,
    600,
    true,
    '{"report_type": "daily_summary", "auto_send": true}'::jsonb,
    date_trunc('day', CURRENT_TIMESTAMP) + interval '22 hours'
),
(
    'b2c3d4e5-f6a7-5890-1234-567890abcdef',
    'weekly_summary_report',
    'Generate weekly performance analysis report',
    'report',
    '0 9 * * 1', -- Monday 9 AM
    'Europe/London',
    'high',
    3,
    300,
    900,
    true,
    '{"report_type": "weekly_summary", "auto_send": true}'::jsonb,
    date_trunc('week', CURRENT_TIMESTAMP) + interval '7 days' + interval '9 hours'
),
(
    'c3d4e5f6-a7b8-6901-2345-678901abcdef',
    'hourly_aggregation',
    'Process hourly metrics aggregation',
    'aggregation',
    '5 * * * *', -- 5 minutes past every hour
    'Europe/London',
    'normal',
    2,
    60,
    120,
    true,
    '{"type": "hourly_metrics"}'::jsonb,
    date_trunc('hour', CURRENT_TIMESTAMP) + interval '1 hour 5 minutes'
),
(
    'd4e5f6a7-b8c9-7012-3456-789012abcdef',
    'daily_aggregation',
    'Process daily metrics aggregation',
    'aggregation',
    '0 2 * * *', -- 2 AM daily
    'Europe/London',
    'normal',
    3,
    600,
    1800,
    true,
    '{"type": "daily_metrics"}'::jsonb,
    date_trunc('day', CURRENT_TIMESTAMP) + interval '1 day 2 hours'
),
(
    'e5f6a7b8-c9d0-8123-4567-890123abcdef',
    'report_cleanup',
    'Clean up old report files and data',
    'cleanup',
    '0 3 * * 0', -- Sunday 3 AM
    'Europe/London',
    'low',
    1,
    0,
    300,
    true,
    '{"retention_days": 90}'::jsonb,
    date_trunc('week', CURRENT_TIMESTAMP) + interval '7 days 3 hours'
);

-- Job dependencies
INSERT INTO job_dependencies (
    parent_job_id,
    dependent_job_id,
    dependency_type
) VALUES
(
    'd4e5f6a7-b8c9-7012-3456-789012abcdef', -- daily_aggregation
    'a1b2c3d4-e5f6-4789-0123-456789abcdef', -- daily_summary_report
    'success'
);

-- Job alerts
INSERT INTO job_alerts (
    job_id,
    alert_type,
    threshold_value,
    notification_channels,
    recipient_emails,
    enabled
) VALUES
(
    'a1b2c3d4-e5f6-4789-0123-456789abcdef',
    'failure',
    2, -- Alert after 2 consecutive failures
    ARRAY['email']::delivery_channel[],
    ARRAY['manager@backroomleeds.com', 'tech@backroomleeds.com'],
    true
),
(
    'd4e5f6a7-b8c9-7012-3456-789012abcdef',
    'slow_execution',
    1200, -- Alert if execution takes > 20 minutes (in seconds)
    ARRAY['email', 'webhook']::delivery_channel[],
    ARRAY['tech@backroomleeds.com'],
    true
);

-- ============================================================================
-- REPORT TEMPLATES
-- ============================================================================

-- Daily Summary Template
INSERT INTO report_templates (
    id,
    name,
    report_type,
    version,
    description,
    template_config,
    default_format,
    supported_formats,
    cache_duration_minutes,
    max_execution_time_seconds,
    is_active,
    is_system_template
) VALUES
(
    'f6a7b8c9-d0e1-9234-5678-901234abcdef',
    'Daily Operations Summary',
    'daily_summary',
    1,
    'Comprehensive daily operational report for The Backroom Leeds management',
    '{
        "sections": [
            {
                "name": "Executive Summary",
                "type": "summary",
                "order": 1
            },
            {
                "name": "Key Performance Indicators",
                "type": "metrics",
                "order": 2
            },
            {
                "name": "Bookings Analysis",
                "type": "table",
                "order": 3
            },
            {
                "name": "Revenue Breakdown",
                "type": "chart",
                "order": 4
            },
            {
                "name": "Event Performance",
                "type": "table",
                "order": 5
            },
            {
                "name": "Customer Insights",
                "type": "metrics",
                "order": 6
            },
            {
                "name": "Staff Performance",
                "type": "table",
                "order": 7
            }
        ],
        "data_sources": [
            "daily_aggregations",
            "event_performance_analytics",
            "customer_analytics"
        ],
        "metrics": [
            "total_revenue",
            "total_bookings",
            "occupancy_rate",
            "customer_satisfaction"
        ]
    }'::jsonb,
    'pdf',
    ARRAY['pdf', 'excel', 'html']::report_format[],
    60,
    120,
    true,
    true
),
(
    'a7b8c9d0-e1f2-0345-6789-012345abcdef',
    'Weekly Performance Analysis',
    'weekly_summary',
    1,
    'Weekly business performance analysis with trends and insights',
    '{
        "sections": [
            {
                "name": "Weekly Overview",
                "type": "summary",
                "order": 1
            },
            {
                "name": "Trend Analysis",
                "type": "chart",
                "order": 2
            },
            {
                "name": "Event Comparison",
                "type": "table",
                "order": 3
            },
            {
                "name": "Revenue Analysis",
                "type": "chart",
                "order": 4
            },
            {
                "name": "Customer Behavior",
                "type": "metrics",
                "order": 5
            },
            {
                "name": "Top Performers",
                "type": "table",
                "order": 6
            },
            {
                "name": "Recommendations",
                "type": "summary",
                "order": 7
            }
        ],
        "data_sources": [
            "weekly_summary_view",
            "event_performance_analytics",
            "customer_analytics",
            "daily_aggregations"
        ],
        "comparisons": {
            "vs_last_week": true,
            "vs_last_month": true,
            "vs_last_year": true
        }
    }'::jsonb,
    'pdf',
    ARRAY['pdf', 'excel', 'html', 'csv']::report_format[],
    120,
    180,
    true,
    true
),
(
    'b8c9d0e1-f2a3-1456-7890-123456abcdef',
    'Event Performance Report',
    'event_performance',
    1,
    'Detailed analysis of event performance (LA FIESTA, SHHH!, NOSTALGIA)',
    '{
        "sections": [
            {
                "name": "Event Summary",
                "type": "summary",
                "order": 1
            },
            {
                "name": "Attendance Metrics",
                "type": "metrics",
                "order": 2
            },
            {
                "name": "Revenue Analysis",
                "type": "chart",
                "order": 3
            },
            {
                "name": "Customer Demographics",
                "type": "table",
                "order": 4
            },
            {
                "name": "Feedback Analysis",
                "type": "summary",
                "order": 5
            }
        ],
        "filters": {
            "events": ["LA FIESTA", "SHHH!", "NOSTALGIA"]
        }
    }'::jsonb,
    'pdf',
    ARRAY['pdf', 'excel']::report_format[],
    60,
    120,
    true,
    false
);

-- ============================================================================
-- REPORT RECIPIENTS
-- ============================================================================

INSERT INTO report_recipients (
    id,
    email,
    name,
    role,
    timezone,
    preferred_channels,
    preferred_format,
    is_active,
    email_verified
) VALUES
(
    'c9d0e1f2-a3b4-2567-8901-234567abcdef',
    'owner@backroomleeds.com',
    'James Thompson',
    'owner',
    'Europe/London',
    ARRAY['email', 'dashboard']::delivery_channel[],
    'pdf',
    true,
    true
),
(
    'd0e1f2a3-b4c5-3678-9012-345678abcdef',
    'manager@backroomleeds.com',
    'Sarah Mitchell',
    'manager',
    'Europe/London',
    ARRAY['email', 'dashboard', 'sms']::delivery_channel[],
    'excel',
    true,
    true
),
(
    'e1f2a3b4-c5d6-4789-0123-456789abcdef',
    'events@backroomleeds.com',
    'Michael Roberts',
    'events_manager',
    'Europe/London',
    ARRAY['email']::delivery_channel[],
    'pdf',
    true,
    true
),
(
    'f2a3b4c5-d6e7-5890-1234-567890abcdef',
    'finance@backroomleeds.com',
    'Emma Wilson',
    'finance',
    'Europe/London',
    ARRAY['email']::delivery_channel[],
    'excel',
    true,
    true
);

-- ============================================================================
-- REPORT SUBSCRIPTIONS
-- ============================================================================

INSERT INTO report_subscriptions (
    recipient_id,
    template_id,
    delivery_channels,
    delivery_format,
    filter_config,
    is_active,
    next_delivery_at
) VALUES
(
    'c9d0e1f2-a3b4-2567-8901-234567abcdef', -- Owner
    'f6a7b8c9-d0e1-9234-5678-901234abcdef', -- Daily Summary
    ARRAY['email', 'dashboard']::delivery_channel[],
    'pdf',
    '{}'::jsonb,
    true,
    date_trunc('day', CURRENT_TIMESTAMP) + interval '22 hours'
),
(
    'c9d0e1f2-a3b4-2567-8901-234567abcdef', -- Owner
    'a7b8c9d0-e1f2-0345-6789-012345abcdef', -- Weekly Summary
    ARRAY['email']::delivery_channel[],
    'pdf',
    '{}'::jsonb,
    true,
    date_trunc('week', CURRENT_TIMESTAMP) + interval '7 days 9 hours'
),
(
    'd0e1f2a3-b4c5-3678-9012-345678abcdef', -- Manager
    'f6a7b8c9-d0e1-9234-5678-901234abcdef', -- Daily Summary
    ARRAY['email', 'dashboard']::delivery_channel[],
    'excel',
    '{"include_staff_metrics": true}'::jsonb,
    true,
    date_trunc('day', CURRENT_TIMESTAMP) + interval '22 hours'
),
(
    'e1f2a3b4-c5d6-4789-0123-456789abcdef', -- Events Manager
    'b8c9d0e1-f2a3-1456-7890-123456abcdef', -- Event Performance
    ARRAY['email']::delivery_channel[],
    'pdf',
    '{"events": ["LA FIESTA", "SHHH!", "NOSTALGIA"]}'::jsonb,
    true,
    date_trunc('week', CURRENT_TIMESTAMP) + interval '7 days 10 hours'
),
(
    'f2a3b4c5-d6e7-5890-1234-567890abcdef', -- Finance
    'a7b8c9d0-e1f2-0345-6789-012345abcdef', -- Weekly Summary
    ARRAY['email']::delivery_channel[],
    'excel',
    '{"focus": "revenue"}'::jsonb,
    true,
    date_trunc('week', CURRENT_TIMESTAMP) + interval '7 days 9 hours'
);

-- ============================================================================
-- KPI DEFINITIONS
-- ============================================================================

INSERT INTO kpi_definitions (
    name,
    display_name,
    category,
    metric_type,
    calculation_query,
    target_value,
    warning_threshold,
    critical_threshold,
    unit,
    decimal_places,
    trend_direction,
    cache_duration_minutes,
    requires_realtime,
    is_active
) VALUES
(
    'daily_revenue',
    'Daily Revenue',
    'revenue',
    'currency',
    'SELECT COALESCE(SUM(gross_revenue), 0) FROM daily_aggregations WHERE aggregation_date = $1::date',
    15000.00,
    10000.00,
    7500.00,
    '£',
    2,
    'higher_better',
    15,
    false,
    true
),
(
    'table_occupancy',
    'Table Occupancy Rate',
    'operations',
    'percentage',
    'SELECT COALESCE(AVG(average_occupancy_rate), 0) FROM daily_aggregations WHERE aggregation_date BETWEEN $1 AND $2',
    85.00,
    70.00,
    60.00,
    '%',
    1,
    'higher_better',
    30,
    false,
    true
),
(
    'booking_conversion',
    'Booking Conversion Rate',
    'bookings',
    'percentage',
    'SELECT CASE WHEN total > 0 THEN (confirmed::decimal / total * 100) ELSE 0 END FROM (SELECT COUNT(*) FILTER (WHERE status = ''confirmed'') as confirmed, COUNT(*) as total FROM bookings WHERE created_at BETWEEN $1 AND $2) t',
    75.00,
    60.00,
    50.00,
    '%',
    1,
    'higher_better',
    60,
    false,
    true
),
(
    'customer_satisfaction',
    'Customer Satisfaction Score',
    'customers',
    'average',
    'SELECT COALESCE(AVG(feedback_score), 0) FROM event_performance_analytics WHERE event_date BETWEEN $1::date AND $2::date',
    4.5,
    4.0,
    3.5,
    '',
    2,
    'higher_better',
    120,
    false,
    true
),
(
    'avg_party_size',
    'Average Party Size',
    'bookings',
    'average',
    'SELECT COALESCE(AVG(party_size), 0) FROM bookings WHERE booking_date BETWEEN $1::date AND $2::date AND status = ''confirmed''',
    6.00,
    4.00,
    3.00,
    'guests',
    1,
    'neutral',
    60,
    false,
    true
),
(
    'no_show_rate',
    'No-Show Rate',
    'operations',
    'percentage',
    'SELECT CASE WHEN total > 0 THEN (no_shows::decimal / total * 100) ELSE 0 END FROM (SELECT COUNT(*) FILTER (WHERE status = ''no_show'') as no_shows, COUNT(*) as total FROM bookings WHERE booking_date BETWEEN $1::date AND $2::date) t',
    5.00,
    10.00,
    15.00,
    '%',
    1,
    'lower_better',
    30,
    false,
    true
);

-- ============================================================================
-- SAMPLE AGGREGATION DATA (Last 7 days)
-- ============================================================================

-- Generate daily aggregations for the past week
INSERT INTO daily_aggregations (
    aggregation_date,
    total_bookings,
    confirmed_bookings,
    cancelled_bookings,
    total_guests,
    gross_revenue,
    net_revenue,
    deposits_collected,
    refunds_processed,
    tables_occupied,
    table_turnover_rate,
    average_occupancy_rate,
    new_customers,
    returning_customers,
    vip_bookings,
    check_ins,
    no_shows,
    walk_ins,
    waitlist_count,
    average_booking_lead_time_hours,
    average_stay_duration_minutes,
    peak_hour,
    peak_occupancy_rate,
    birthdays_count,
    anniversaries_count,
    corporate_events_count
)
SELECT 
    CURRENT_DATE - (n || ' days')::interval,
    45 + (random() * 20)::int,  -- 45-65 bookings
    40 + (random() * 15)::int,  -- 40-55 confirmed
    2 + (random() * 5)::int,     -- 2-7 cancelled
    250 + (random() * 100)::int, -- 250-350 guests
    12000 + (random() * 8000),   -- £12,000-20,000 gross
    10000 + (random() * 7000),   -- £10,000-17,000 net
    2000 + (random() * 1000),    -- £2,000-3,000 deposits
    100 + (random() * 200),      -- £100-300 refunds
    14 + (random() * 2)::int,    -- 14-16 tables occupied
    2.5 + (random() * 1),        -- 2.5-3.5 turnover rate
    75 + (random() * 20),        -- 75-95% occupancy
    5 + (random() * 10)::int,    -- 5-15 new customers
    30 + (random() * 20)::int,   -- 30-50 returning
    2 + (random() * 3)::int,     -- 2-5 VIP bookings
    35 + (random() * 15)::int,   -- 35-50 check-ins
    1 + (random() * 3)::int,     -- 1-4 no-shows
    5 + (random() * 5)::int,     -- 5-10 walk-ins
    3 + (random() * 7)::int,     -- 3-10 waitlist
    48 + (random() * 72)::int,   -- 48-120 hours lead time
    120 + (random() * 60)::int,  -- 120-180 minutes stay
    '21:00',                      -- Peak hour
    85 + (random() * 10),        -- 85-95% peak occupancy
    2 + (random() * 3)::int,     -- 2-5 birthdays
    1 + (random() * 2)::int,     -- 1-3 anniversaries
    0 + (random() * 2)::int      -- 0-2 corporate events
FROM generate_series(1, 7) n;

-- Generate event performance data for recent events
INSERT INTO event_performance_analytics (
    event_id,
    event_date,
    event_name,
    total_bookings,
    total_guests,
    table_occupancy_rate,
    walk_ins_count,
    total_revenue,
    bar_revenue,
    table_revenue,
    average_spend_per_guest,
    check_in_rate,
    no_show_rate,
    cancellation_rate,
    average_party_size,
    peak_hour,
    peak_hour_guests,
    average_stay_duration_minutes,
    feedback_score,
    feedback_count
)
VALUES
-- LA FIESTA events (Fridays)
(
    gen_random_uuid(),
    CURRENT_DATE - interval '1 day',
    'LA FIESTA',
    58,
    320,
    93.75,
    15,
    18500.00,
    8500.00,
    10000.00,
    57.81,
    95.00,
    3.00,
    5.00,
    5.5,
    '22:00',
    180,
    150,
    4.6,
    42
),
(
    gen_random_uuid(),
    CURRENT_DATE - interval '8 days',
    'LA FIESTA',
    55,
    305,
    87.50,
    12,
    17200.00,
    7800.00,
    9400.00,
    56.39,
    92.00,
    5.00,
    7.00,
    5.5,
    '22:00',
    175,
    145,
    4.5,
    38
),
-- SHHH! events (Saturdays)
(
    gen_random_uuid(),
    CURRENT_DATE - interval '2 days',
    'SHHH!',
    62,
    350,
    100.00,
    20,
    22000.00,
    10500.00,
    11500.00,
    62.86,
    96.00,
    2.00,
    3.00,
    5.6,
    '23:00',
    200,
    160,
    4.7,
    48
),
(
    gen_random_uuid(),
    CURRENT_DATE - interval '9 days',
    'SHHH!',
    60,
    335,
    93.75,
    18,
    20500.00,
    9500.00,
    11000.00,
    61.19,
    93.00,
    4.00,
    5.00,
    5.6,
    '23:00',
    190,
    155,
    4.6,
    45
),
-- NOSTALGIA events (Thursdays)
(
    gen_random_uuid(),
    CURRENT_DATE - interval '3 days',
    'NOSTALGIA',
    42,
    220,
    75.00,
    8,
    12500.00,
    5500.00,
    7000.00,
    56.82,
    90.00,
    5.00,
    8.00,
    5.2,
    '21:00',
    120,
    140,
    4.4,
    30
);

-- Generate hourly aggregations for today
INSERT INTO hourly_aggregations (
    aggregation_hour,
    current_occupancy,
    current_guests,
    tables_available,
    check_ins_count,
    check_outs_count,
    new_bookings_count,
    cancellations_count,
    hour_revenue,
    hour_bar_sales
)
SELECT
    date_trunc('hour', CURRENT_TIMESTAMP) - (n || ' hours')::interval,
    CASE 
        WHEN extract(hour from date_trunc('hour', CURRENT_TIMESTAMP) - (n || ' hours')::interval) BETWEEN 20 AND 23 
        THEN 10 + (random() * 6)::int
        ELSE (random() * 5)::int
    END,
    CASE 
        WHEN extract(hour from date_trunc('hour', CURRENT_TIMESTAMP) - (n || ' hours')::interval) BETWEEN 20 AND 23 
        THEN 50 + (random() * 150)::int
        ELSE (random() * 30)::int
    END,
    CASE 
        WHEN extract(hour from date_trunc('hour', CURRENT_TIMESTAMP) - (n || ' hours')::interval) BETWEEN 20 AND 23 
        THEN (random() * 6)::int
        ELSE 10 + (random() * 6)::int
    END,
    (random() * 10)::int,
    (random() * 5)::int,
    (random() * 3)::int,
    (random() * 2)::int,
    CASE 
        WHEN extract(hour from date_trunc('hour', CURRENT_TIMESTAMP) - (n || ' hours')::interval) BETWEEN 20 AND 23 
        THEN 500 + (random() * 1500)
        ELSE (random() * 200)
    END,
    CASE 
        WHEN extract(hour from date_trunc('hour', CURRENT_TIMESTAMP) - (n || ' hours')::interval) BETWEEN 20 AND 23 
        THEN 200 + (random() * 800)
        ELSE (random() * 100)
    END
FROM generate_series(1, 24) n;

-- ============================================================================
-- SAMPLE JOB EXECUTION HISTORY
-- ============================================================================

INSERT INTO job_execution_history (
    job_id,
    execution_id,
    status,
    started_at,
    completed_at,
    execution_time_ms,
    attempt_number,
    result,
    cpu_usage_percent,
    memory_usage_mb,
    records_processed
)
VALUES
-- Successful daily report generation
(
    'a1b2c3d4-e5f6-4789-0123-456789abcdef',
    'exec-001',
    'completed',
    CURRENT_TIMESTAMP - interval '1 day 2 hours',
    CURRENT_TIMESTAMP - interval '1 day 1 hour 58 minutes',
    120000,
    1,
    '{"report_id": "rpt-001", "file_size": 524288, "recipients": 4}'::jsonb,
    35.5,
    256,
    1250
),
-- Failed then retried weekly report
(
    'b2c3d4e5-f6a7-5890-1234-567890abcdef',
    'exec-002',
    'failed',
    CURRENT_TIMESTAMP - interval '7 days 15 minutes',
    CURRENT_TIMESTAMP - interval '7 days 14 minutes',
    60000,
    1,
    null,
    78.2,
    512,
    0
),
(
    'b2c3d4e5-f6a7-5890-1234-567890abcdef',
    'exec-003',
    'completed',
    CURRENT_TIMESTAMP - interval '7 days 10 minutes',
    CURRENT_TIMESTAMP - interval '7 days 8 minutes',
    120000,
    2,
    '{"report_id": "rpt-002", "file_size": 1048576, "recipients": 5}'::jsonb,
    42.1,
    384,
    8500
),
-- Recent aggregation jobs
(
    'd4e5f6a7-b8c9-7012-3456-789012abcdef',
    'exec-004',
    'completed',
    CURRENT_TIMESTAMP - interval '2 hours',
    CURRENT_TIMESTAMP - interval '1 hour 45 minutes',
    900000,
    1,
    '{"aggregated_days": 1, "metrics_calculated": 25}'::jsonb,
    55.0,
    768,
    15000
);

-- ============================================================================
-- SAMPLE REPORT GENERATION AND DELIVERY HISTORY
-- ============================================================================

-- Sample generated reports
INSERT INTO report_generation_history (
    id,
    template_id,
    report_type,
    generated_at,
    generation_time_ms,
    data_period_start,
    data_period_end,
    output_format,
    file_size_bytes,
    file_path,
    records_processed,
    sections_generated,
    report_summary,
    key_metrics,
    is_successful
)
VALUES
(
    'gen-001',
    'f6a7b8c9-d0e1-9234-5678-901234abcdef',
    'daily_summary',
    CURRENT_TIMESTAMP - interval '1 day',
    85000,
    CURRENT_DATE - interval '1 day',
    CURRENT_DATE - interval '1 day' + interval '23 hours 59 minutes',
    'pdf',
    524288,
    '/reports/daily/2024-01-10-daily-summary.pdf',
    1250,
    7,
    '{"title": "Daily Summary - Strong Performance", "highlights": ["Revenue exceeded target by 15%", "Table occupancy at 92%", "Zero no-shows for VIP bookings"]}'::jsonb,
    '{"revenue": 18500, "bookings": 58, "occupancy_rate": 92.5, "customer_satisfaction": 4.6}'::jsonb,
    true
),
(
    'gen-002',
    'a7b8c9d0-e1f2-0345-6789-012345abcdef',
    'weekly_summary',
    CURRENT_TIMESTAMP - interval '7 days',
    145000,
    CURRENT_DATE - interval '14 days',
    CURRENT_DATE - interval '7 days',
    'pdf',
    1048576,
    '/reports/weekly/2024-w02-weekly-summary.pdf',
    8500,
    7,
    '{"title": "Weekly Performance Analysis", "highlights": ["Best week of the year so far", "SHHH! events at full capacity", "Customer satisfaction improved to 4.6"]}'::jsonb,
    '{"total_revenue": 125000, "total_bookings": 385, "avg_occupancy": 88.5, "new_customers": 67}'::jsonb,
    true
);

-- Sample delivery history
INSERT INTO report_delivery_history (
    generation_id,
    recipient_id,
    delivery_channel,
    delivery_status,
    delivery_address,
    queued_at,
    sent_at,
    delivered_at,
    opened_at,
    message_id,
    tracking_id
)
VALUES
(
    'gen-001',
    'c9d0e1f2-a3b4-2567-8901-234567abcdef',
    'email',
    'opened',
    'owner@backroomleeds.com',
    CURRENT_TIMESTAMP - interval '1 day',
    CURRENT_TIMESTAMP - interval '1 day' + interval '2 minutes',
    CURRENT_TIMESTAMP - interval '1 day' + interval '3 minutes',
    CURRENT_TIMESTAMP - interval '23 hours',
    'msg-001@sendgrid',
    'trk-001'
),
(
    'gen-001',
    'd0e1f2a3-b4c5-3678-9012-345678abcdef',
    'email',
    'delivered',
    'manager@backroomleeds.com',
    CURRENT_TIMESTAMP - interval '1 day',
    CURRENT_TIMESTAMP - interval '1 day' + interval '2 minutes',
    CURRENT_TIMESTAMP - interval '1 day' + interval '3 minutes',
    null,
    'msg-002@sendgrid',
    'trk-002'
),
(
    'gen-002',
    'c9d0e1f2-a3b4-2567-8901-234567abcdef',
    'email',
    'opened',
    'owner@backroomleeds.com',
    CURRENT_TIMESTAMP - interval '7 days',
    CURRENT_TIMESTAMP - interval '7 days' + interval '2 minutes',
    CURRENT_TIMESTAMP - interval '7 days' + interval '3 minutes',
    CURRENT_TIMESTAMP - interval '6 days',
    'msg-003@sendgrid',
    'trk-003'
);

-- ============================================================================
-- REFRESH MATERIALIZED VIEWS
-- ============================================================================

-- Refresh the materialized views with the new data
REFRESH MATERIALIZED VIEW weekly_summary_view;
REFRESH MATERIALIZED VIEW monthly_summary_view;
REFRESH MATERIALIZED VIEW top_customers_view;

-- ============================================================================
-- VERIFY DATA INSERTION
-- ============================================================================

-- Output summary of inserted data
SELECT 
    'Data insertion complete' as status,
    (SELECT COUNT(*) FROM scheduled_jobs) as jobs_count,
    (SELECT COUNT(*) FROM report_templates) as templates_count,
    (SELECT COUNT(*) FROM report_recipients) as recipients_count,
    (SELECT COUNT(*) FROM report_subscriptions) as subscriptions_count,
    (SELECT COUNT(*) FROM kpi_definitions) as kpi_count,
    (SELECT COUNT(*) FROM daily_aggregations) as daily_aggregations_count,
    (SELECT COUNT(*) FROM event_performance_analytics) as event_analytics_count;