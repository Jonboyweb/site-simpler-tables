-- ============================================================================
-- THE BACKROOM LEEDS - EMAIL NOTIFICATION SYSTEM SCHEMA
-- Version: 1.0.0
-- Phase: 3, Step 3.6
-- Description: Complete email notification system with GDPR compliance
-- Dependencies: 009_automated_reporting_system.sql (for job queue integration)
-- ============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- ENUMS AND TYPES
-- ============================================================================

-- Email provider types
CREATE TYPE email_provider AS ENUM (
    'resend',
    'postmark',
    'ses',
    'sendgrid'
);

-- Email priority levels
CREATE TYPE email_priority AS ENUM (
    'critical',  -- Booking confirmations, payment confirmations
    'high',      -- Cancellations, refunds, waitlist notifications
    'normal',    -- Event updates, feedback requests
    'low'        -- Marketing, newsletters
);

-- Email status tracking
CREATE TYPE email_status AS ENUM (
    'pending',
    'queued',
    'sending',
    'sent',
    'delivered',
    'opened',
    'clicked',
    'bounced',
    'failed',
    'deferred',
    'spam',
    'unsubscribed'
);

-- Email template types
CREATE TYPE email_type AS ENUM (
    'booking_confirmation',
    'booking_reminder',
    'booking_modification',
    'cancellation_confirmation',
    'payment_confirmation',
    'refund_processed',
    'refund_request',
    'waitlist_notification',
    'waitlist_expired',
    'event_announcement',
    'special_offer',
    'feedback_request',
    'password_reset',
    'account_verification',
    'marketing_campaign',
    'venue_update',
    'birthday_offer',
    'loyalty_reward'
);

-- Consent types
CREATE TYPE consent_type AS ENUM (
    'transactional',    -- Always allowed (booking confirmations, etc)
    'marketing',        -- Requires explicit consent
    'promotional',      -- Special offers and deals
    'informational',    -- Venue updates and announcements
    'feedback',         -- Survey and feedback requests
    'analytics'         -- Tracking and analytics
);

-- Legal basis for processing
CREATE TYPE legal_basis AS ENUM (
    'consent',
    'contract',
    'legitimate_interest',
    'vital_interest',
    'legal_obligation',
    'public_task'
);

-- Bounce types
CREATE TYPE bounce_type AS ENUM (
    'hard_bounce',
    'soft_bounce',
    'blocked',
    'auto_reply',
    'transient',
    'subscribe',
    'unsubscribe',
    'challenge_verification'
);

-- ============================================================================
-- EMAIL TEMPLATES TABLE
-- ============================================================================

CREATE TABLE email_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Template identification
    name VARCHAR(100) UNIQUE NOT NULL,
    email_type email_type NOT NULL,
    version VARCHAR(20) NOT NULL DEFAULT '1.0.0',
    is_active BOOLEAN DEFAULT true,
    
    -- Template content
    subject_template TEXT NOT NULL,
    html_template TEXT,
    text_template TEXT,
    
    -- React Email component reference
    component_name VARCHAR(100),
    component_path VARCHAR(255),
    
    -- Template variables
    required_variables JSONB DEFAULT '[]',
    optional_variables JSONB DEFAULT '[]',
    default_values JSONB DEFAULT '{}',
    
    -- Testing data
    test_data JSONB,
    preview_text TEXT,
    
    -- Template settings
    priority email_priority DEFAULT 'normal',
    sender_name VARCHAR(100) DEFAULT 'The Backroom Leeds',
    sender_email VARCHAR(255) DEFAULT 'noreply@backroomleeds.com',
    reply_to_email VARCHAR(255),
    
    -- Analytics
    total_sent INTEGER DEFAULT 0,
    total_opened INTEGER DEFAULT 0,
    total_clicked INTEGER DEFAULT 0,
    avg_open_rate DECIMAL(5,2),
    avg_click_rate DECIMAL(5,2),
    
    -- A/B testing
    is_variant BOOLEAN DEFAULT false,
    parent_template_id UUID REFERENCES email_templates(id),
    variant_name VARCHAR(50),
    variant_weight DECIMAL(3,2) CHECK (variant_weight >= 0 AND variant_weight <= 1),
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES auth.users(id),
    updated_by UUID REFERENCES auth.users(id),
    notes TEXT,
    
    CONSTRAINT valid_variant CHECK (
        (is_variant = false AND parent_template_id IS NULL) OR
        (is_variant = true AND parent_template_id IS NOT NULL)
    )
);

-- Indexes for templates
CREATE INDEX idx_email_templates_type ON email_templates(email_type);
CREATE INDEX idx_email_templates_active ON email_templates(is_active) WHERE is_active = true;
CREATE INDEX idx_email_templates_parent ON email_templates(parent_template_id) WHERE parent_template_id IS NOT NULL;

-- ============================================================================
-- EMAIL QUEUE TABLE
-- ============================================================================

CREATE TABLE email_queue (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Queue management
    job_id VARCHAR(255) UNIQUE,
    priority email_priority NOT NULL DEFAULT 'normal',
    status email_status NOT NULL DEFAULT 'pending',
    
    -- Email details
    template_id UUID REFERENCES email_templates(id),
    email_type email_type NOT NULL,
    
    -- Recipient information
    recipient_email VARCHAR(255) NOT NULL,
    recipient_name VARCHAR(255),
    recipient_id UUID,
    
    -- Email content
    subject TEXT NOT NULL,
    html_content TEXT,
    text_content TEXT,
    
    -- Template data
    template_data JSONB NOT NULL DEFAULT '{}',
    attachments JSONB,
    
    -- Scheduling
    scheduled_at TIMESTAMPTZ,
    process_after TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMPTZ,
    
    -- Provider management
    preferred_provider email_provider,
    attempted_providers JSONB DEFAULT '[]',
    
    -- Retry logic
    attempts INTEGER DEFAULT 0,
    max_attempts INTEGER DEFAULT 3,
    last_attempt_at TIMESTAMPTZ,
    next_retry_at TIMESTAMPTZ,
    
    -- Tracking
    message_id VARCHAR(255),
    provider_message_id VARCHAR(255),
    
    -- Related entities
    booking_id UUID,
    payment_id UUID,
    event_id UUID,
    campaign_id UUID,
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    queued_at TIMESTAMPTZ,
    sent_at TIMESTAMPTZ,
    delivered_at TIMESTAMPTZ,
    failed_at TIMESTAMPTZ,
    error_message TEXT,
    error_details JSONB,
    
    -- Performance
    processing_time_ms INTEGER,
    
    CONSTRAINT valid_status_dates CHECK (
        (status != 'sent' OR sent_at IS NOT NULL) AND
        (status != 'delivered' OR delivered_at IS NOT NULL) AND
        (status != 'failed' OR failed_at IS NOT NULL)
    )
);

-- Indexes for queue
CREATE INDEX idx_email_queue_status ON email_queue(status);
CREATE INDEX idx_email_queue_priority ON email_queue(priority, process_after) WHERE status = 'pending';
CREATE INDEX idx_email_queue_scheduled ON email_queue(scheduled_at) WHERE scheduled_at IS NOT NULL;
CREATE INDEX idx_email_queue_recipient ON email_queue(recipient_email);
CREATE INDEX idx_email_queue_booking ON email_queue(booking_id) WHERE booking_id IS NOT NULL;
CREATE INDEX idx_email_queue_message_id ON email_queue(message_id) WHERE message_id IS NOT NULL;

-- ============================================================================
-- EMAIL LOGS TABLE
-- ============================================================================

CREATE TABLE email_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Reference to queue
    queue_id UUID REFERENCES email_queue(id),
    
    -- Email identification
    message_id VARCHAR(255) NOT NULL,
    provider_message_id VARCHAR(255),
    
    -- Email details
    email_type email_type NOT NULL,
    template_id UUID REFERENCES email_templates(id),
    template_version VARCHAR(20),
    
    -- Recipient
    recipient_email VARCHAR(255) NOT NULL,
    recipient_name VARCHAR(255),
    recipient_id UUID,
    
    -- Sender
    sender_email VARCHAR(255) NOT NULL,
    sender_name VARCHAR(255),
    
    -- Content summary
    subject TEXT NOT NULL,
    preview_text TEXT,
    
    -- Provider information
    provider email_provider NOT NULL,
    provider_cost DECIMAL(10,4),
    
    -- Delivery status
    status email_status NOT NULL,
    delivered_at TIMESTAMPTZ,
    bounced_at TIMESTAMPTZ,
    bounce_type bounce_type,
    bounce_reason TEXT,
    
    -- Engagement tracking
    opened_at TIMESTAMPTZ,
    open_count INTEGER DEFAULT 0,
    first_opened_at TIMESTAMPTZ,
    last_opened_at TIMESTAMPTZ,
    
    clicked_at TIMESTAMPTZ,
    click_count INTEGER DEFAULT 0,
    first_clicked_at TIMESTAMPTZ,
    last_clicked_at TIMESTAMPTZ,
    clicked_links JSONB DEFAULT '[]',
    
    -- Unsubscribe tracking
    unsubscribed_at TIMESTAMPTZ,
    unsubscribe_reason TEXT,
    
    -- Device and client info
    email_client VARCHAR(100),
    device_type VARCHAR(50),
    operating_system VARCHAR(50),
    ip_address_hash VARCHAR(64), -- SHA-256 hash for GDPR
    
    -- Related entities
    booking_id UUID,
    payment_id UUID,
    event_id UUID,
    campaign_id UUID,
    
    -- Performance metrics
    time_to_deliver_ms INTEGER,
    time_to_open_ms INTEGER,
    time_to_click_ms INTEGER,
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    metadata JSONB DEFAULT '{}',
    
    CONSTRAINT unique_message_id UNIQUE (message_id)
);

-- Indexes for logs
CREATE INDEX idx_email_logs_recipient ON email_logs(recipient_email);
CREATE INDEX idx_email_logs_status ON email_logs(status);
CREATE INDEX idx_email_logs_type ON email_logs(email_type);
CREATE INDEX idx_email_logs_delivered ON email_logs(delivered_at) WHERE delivered_at IS NOT NULL;
CREATE INDEX idx_email_logs_opened ON email_logs(opened_at) WHERE opened_at IS NOT NULL;
CREATE INDEX idx_email_logs_clicked ON email_logs(clicked_at) WHERE clicked_at IS NOT NULL;
CREATE INDEX idx_email_logs_booking ON email_logs(booking_id) WHERE booking_id IS NOT NULL;
CREATE INDEX idx_email_logs_campaign ON email_logs(campaign_id) WHERE campaign_id IS NOT NULL;

-- ============================================================================
-- CUSTOMER CONSENT TABLE
-- ============================================================================

CREATE TABLE customer_consent (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Customer identification
    customer_id UUID NOT NULL,
    customer_email VARCHAR(255) NOT NULL,
    
    -- Consent details
    consent_type consent_type NOT NULL,
    consent_given BOOLEAN NOT NULL DEFAULT false,
    legal_basis legal_basis NOT NULL,
    
    -- Consent tracking
    consent_date TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    consent_method VARCHAR(50) NOT NULL, -- 'explicit', 'implicit', 'imported'
    consent_source VARCHAR(255), -- Where consent was collected
    consent_version VARCHAR(20) DEFAULT '1.0.0',
    
    -- Withdrawal tracking
    withdrawn_date TIMESTAMPTZ,
    withdrawal_method VARCHAR(50),
    withdrawal_reason TEXT,
    
    -- Evidence
    ip_address_hash VARCHAR(64),
    user_agent TEXT,
    consent_text TEXT, -- What the user agreed to
    
    -- Validity
    expires_at TIMESTAMPTZ,
    is_active BOOLEAN GENERATED ALWAYS AS (
        consent_given = true AND 
        withdrawn_date IS NULL AND 
        (expires_at IS NULL OR expires_at > CURRENT_TIMESTAMP)
    ) STORED,
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    notes TEXT,
    
    CONSTRAINT unique_customer_consent UNIQUE (customer_id, consent_type)
);

-- Indexes for consent
CREATE INDEX idx_customer_consent_customer ON customer_consent(customer_id);
CREATE INDEX idx_customer_consent_email ON customer_consent(customer_email);
CREATE INDEX idx_customer_consent_active ON customer_consent(customer_id, consent_type) WHERE is_active = true;
CREATE INDEX idx_customer_consent_withdrawn ON customer_consent(withdrawn_date) WHERE withdrawn_date IS NOT NULL;

-- ============================================================================
-- CUSTOMER PREFERENCES TABLE
-- ============================================================================

CREATE TABLE customer_email_preferences (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Customer identification
    customer_id UUID NOT NULL UNIQUE,
    customer_email VARCHAR(255) NOT NULL,
    
    -- Communication preferences
    booking_confirmations BOOLEAN DEFAULT true, -- Cannot be disabled
    payment_notifications BOOLEAN DEFAULT true, -- Cannot be disabled
    cancellation_notifications BOOLEAN DEFAULT true, -- Cannot be disabled
    
    marketing_emails BOOLEAN DEFAULT false,
    event_announcements BOOLEAN DEFAULT false,
    special_offers BOOLEAN DEFAULT false,
    waitlist_notifications BOOLEAN DEFAULT true,
    feedback_requests BOOLEAN DEFAULT false,
    birthday_offers BOOLEAN DEFAULT false,
    loyalty_updates BOOLEAN DEFAULT false,
    
    -- Frequency preferences
    email_frequency VARCHAR(20) DEFAULT 'immediate', -- 'immediate', 'daily', 'weekly', 'monthly'
    quiet_hours_start TIME,
    quiet_hours_end TIME,
    timezone VARCHAR(50) DEFAULT 'Europe/London',
    
    -- Format preferences
    prefer_html BOOLEAN DEFAULT true,
    language_preference VARCHAR(10) DEFAULT 'en',
    
    -- Tracking preferences
    allow_open_tracking BOOLEAN DEFAULT false,
    allow_click_tracking BOOLEAN DEFAULT false,
    allow_analytics BOOLEAN DEFAULT false,
    
    -- Suppression
    is_suppressed BOOLEAN DEFAULT false,
    suppression_reason VARCHAR(50), -- 'bounce', 'complaint', 'manual', 'inactive'
    suppressed_at TIMESTAMPTZ,
    suppression_expires_at TIMESTAMPTZ,
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    last_email_sent_at TIMESTAMPTZ,
    total_emails_sent INTEGER DEFAULT 0,
    
    CONSTRAINT transactional_always_enabled CHECK (
        booking_confirmations = true AND
        payment_notifications = true AND
        cancellation_notifications = true
    )
);

-- Indexes for preferences
CREATE INDEX idx_customer_email_preferences_customer ON customer_email_preferences(customer_id);
CREATE INDEX idx_customer_email_preferences_email ON customer_email_preferences(customer_email);
CREATE INDEX idx_customer_email_preferences_suppressed ON customer_email_preferences(is_suppressed) WHERE is_suppressed = true;

-- ============================================================================
-- EMAIL CAMPAIGNS TABLE
-- ============================================================================

CREATE TABLE email_campaigns (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Campaign details
    name VARCHAR(255) NOT NULL,
    description TEXT,
    campaign_type VARCHAR(50) NOT NULL, -- 'marketing', 'event', 'announcement', 'automated'
    
    -- Template
    template_id UUID REFERENCES email_templates(id),
    
    -- Targeting
    segment_criteria JSONB DEFAULT '{}',
    recipient_count INTEGER DEFAULT 0,
    
    -- Scheduling
    scheduled_at TIMESTAMPTZ,
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    
    -- Status
    status VARCHAR(20) DEFAULT 'draft', -- 'draft', 'scheduled', 'sending', 'sent', 'cancelled'
    
    -- Performance metrics
    emails_sent INTEGER DEFAULT 0,
    emails_delivered INTEGER DEFAULT 0,
    emails_opened INTEGER DEFAULT 0,
    emails_clicked INTEGER DEFAULT 0,
    emails_unsubscribed INTEGER DEFAULT 0,
    
    open_rate DECIMAL(5,2),
    click_rate DECIMAL(5,2),
    unsubscribe_rate DECIMAL(5,2),
    
    -- Business metrics
    bookings_generated INTEGER DEFAULT 0,
    revenue_generated DECIMAL(10,2) DEFAULT 0,
    
    -- A/B testing
    is_ab_test BOOLEAN DEFAULT false,
    control_group_size DECIMAL(3,2),
    winner_template_id UUID REFERENCES email_templates(id),
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES auth.users(id),
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    approved_by UUID REFERENCES auth.users(id),
    approved_at TIMESTAMPTZ,
    
    CONSTRAINT valid_campaign_status CHECK (
        (status != 'sent' OR completed_at IS NOT NULL) AND
        (status != 'sending' OR started_at IS NOT NULL)
    )
);

-- Indexes for campaigns
CREATE INDEX idx_email_campaigns_status ON email_campaigns(status);
CREATE INDEX idx_email_campaigns_scheduled ON email_campaigns(scheduled_at) WHERE scheduled_at IS NOT NULL;
CREATE INDEX idx_email_campaigns_template ON email_campaigns(template_id);

-- ============================================================================
-- EMAIL PROVIDER STATS TABLE
-- ============================================================================

CREATE TABLE email_provider_stats (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Provider identification
    provider email_provider NOT NULL,
    
    -- Time window
    period_start TIMESTAMPTZ NOT NULL,
    period_end TIMESTAMPTZ NOT NULL,
    
    -- Volume metrics
    emails_sent INTEGER DEFAULT 0,
    emails_delivered INTEGER DEFAULT 0,
    emails_bounced INTEGER DEFAULT 0,
    emails_failed INTEGER DEFAULT 0,
    
    -- Performance metrics
    avg_delivery_time_ms INTEGER,
    success_rate DECIMAL(5,2),
    
    -- Cost metrics
    total_cost DECIMAL(10,2) DEFAULT 0,
    cost_per_email DECIMAL(10,4),
    
    -- Quota tracking
    quota_used INTEGER DEFAULT 0,
    quota_limit INTEGER,
    
    -- Health status
    is_healthy BOOLEAN DEFAULT true,
    health_check_failures INTEGER DEFAULT 0,
    last_error TEXT,
    last_error_at TIMESTAMPTZ,
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT unique_provider_period UNIQUE (provider, period_start, period_end)
);

-- Indexes for provider stats
CREATE INDEX idx_email_provider_stats_provider ON email_provider_stats(provider);
CREATE INDEX idx_email_provider_stats_period ON email_provider_stats(period_start, period_end);
CREATE INDEX idx_email_provider_stats_health ON email_provider_stats(is_healthy);

-- ============================================================================
-- EMAIL ATTACHMENTS TABLE
-- ============================================================================

CREATE TABLE email_attachments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Attachment details
    filename VARCHAR(255) NOT NULL,
    content_type VARCHAR(100) NOT NULL,
    size_bytes INTEGER NOT NULL,
    
    -- Storage
    storage_url TEXT NOT NULL,
    storage_provider VARCHAR(50) DEFAULT 's3',
    
    -- Security
    checksum VARCHAR(64) NOT NULL, -- SHA-256
    virus_scanned BOOLEAN DEFAULT false,
    virus_scan_result VARCHAR(50),
    
    -- Usage tracking
    used_in_emails INTEGER DEFAULT 0,
    last_used_at TIMESTAMPTZ,
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMPTZ,
    
    CONSTRAINT valid_file_size CHECK (size_bytes > 0 AND size_bytes <= 10485760) -- Max 10MB
);

-- ============================================================================
-- EMAIL TRACKING EVENTS TABLE
-- ============================================================================

CREATE TABLE email_tracking_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Email reference
    email_log_id UUID REFERENCES email_logs(id),
    message_id VARCHAR(255) NOT NULL,
    
    -- Event details
    event_type VARCHAR(20) NOT NULL, -- 'open', 'click', 'unsubscribe', 'bounce', 'complaint'
    event_timestamp TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    
    -- Click tracking
    clicked_url TEXT,
    link_category VARCHAR(50), -- 'cta', 'social', 'unsubscribe', 'preference'
    
    -- Client information
    ip_address_hash VARCHAR(64),
    user_agent TEXT,
    email_client VARCHAR(100),
    device_type VARCHAR(50),
    operating_system VARCHAR(50),
    browser VARCHAR(50),
    
    -- Geolocation (anonymized)
    country_code VARCHAR(2),
    region VARCHAR(100),
    city VARCHAR(100),
    
    -- Metadata
    is_bot BOOLEAN DEFAULT false,
    confidence_score DECIMAL(3,2), -- 0-1 confidence this is a real user
    
    CONSTRAINT valid_event_type CHECK (
        event_type IN ('open', 'click', 'unsubscribe', 'bounce', 'complaint', 'forward')
    )
);

-- Indexes for tracking events
CREATE INDEX idx_email_tracking_events_log ON email_tracking_events(email_log_id);
CREATE INDEX idx_email_tracking_events_type ON email_tracking_events(event_type);
CREATE INDEX idx_email_tracking_events_timestamp ON email_tracking_events(event_timestamp);
CREATE INDEX idx_email_tracking_events_message ON email_tracking_events(message_id);

-- ============================================================================
-- EMAIL UNSUBSCRIBE TOKENS TABLE
-- ============================================================================

CREATE TABLE email_unsubscribe_tokens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Token details
    token VARCHAR(255) UNIQUE NOT NULL,
    token_hash VARCHAR(64) NOT NULL, -- SHA-256 hash for lookup
    
    -- Customer reference
    customer_id UUID NOT NULL,
    customer_email VARCHAR(255) NOT NULL,
    
    -- Scope
    unsubscribe_type VARCHAR(50) NOT NULL, -- 'all', 'marketing', 'events', etc.
    campaign_id UUID REFERENCES email_campaigns(id),
    
    -- Validity
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMPTZ NOT NULL,
    used_at TIMESTAMPTZ,
    
    -- Metadata
    ip_address_hash VARCHAR(64),
    user_agent TEXT,
    
    CONSTRAINT token_not_expired CHECK (expires_at > created_at)
);

-- Index for token lookup
CREATE INDEX idx_email_unsubscribe_tokens_hash ON email_unsubscribe_tokens(token_hash);
CREATE INDEX idx_email_unsubscribe_tokens_customer ON email_unsubscribe_tokens(customer_id);

-- ============================================================================
-- FUNCTIONS AND TRIGGERS
-- ============================================================================

-- Function to update email statistics
CREATE OR REPLACE FUNCTION update_email_template_stats()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'delivered' AND OLD.status != 'delivered' THEN
        UPDATE email_templates
        SET total_sent = total_sent + 1
        WHERE id = NEW.template_id;
    END IF;
    
    IF NEW.opened_at IS NOT NULL AND OLD.opened_at IS NULL THEN
        UPDATE email_templates
        SET total_opened = total_opened + 1
        WHERE id = NEW.template_id;
    END IF;
    
    IF NEW.clicked_at IS NOT NULL AND OLD.clicked_at IS NULL THEN
        UPDATE email_templates
        SET total_clicked = total_clicked + 1
        WHERE id = NEW.template_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_template_stats_trigger
    AFTER UPDATE ON email_logs
    FOR EACH ROW
    EXECUTE FUNCTION update_email_template_stats();

-- Function to handle email bounces
CREATE OR REPLACE FUNCTION handle_email_bounce()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.bounce_type = 'hard_bounce' THEN
        -- Suppress email address for hard bounces
        INSERT INTO customer_email_preferences (
            customer_id,
            customer_email,
            is_suppressed,
            suppression_reason,
            suppressed_at
        )
        VALUES (
            NEW.recipient_id,
            NEW.recipient_email,
            true,
            'bounce',
            NOW()
        )
        ON CONFLICT (customer_id) DO UPDATE
        SET is_suppressed = true,
            suppression_reason = 'bounce',
            suppressed_at = NOW();
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER handle_bounce_trigger
    AFTER UPDATE ON email_logs
    FOR EACH ROW
    WHEN (NEW.bounce_type IS NOT NULL AND OLD.bounce_type IS NULL)
    EXECUTE FUNCTION handle_email_bounce();

-- Function to calculate email campaign metrics
CREATE OR REPLACE FUNCTION calculate_campaign_metrics(campaign_id UUID)
RETURNS TABLE (
    open_rate DECIMAL(5,2),
    click_rate DECIMAL(5,2),
    unsubscribe_rate DECIMAL(5,2),
    bounce_rate DECIMAL(5,2),
    delivery_rate DECIMAL(5,2)
) AS $$
DECLARE
    total_sent INTEGER;
    total_delivered INTEGER;
    total_opened INTEGER;
    total_clicked INTEGER;
    total_unsubscribed INTEGER;
    total_bounced INTEGER;
BEGIN
    SELECT 
        COUNT(*),
        COUNT(*) FILTER (WHERE status = 'delivered'),
        COUNT(*) FILTER (WHERE opened_at IS NOT NULL),
        COUNT(*) FILTER (WHERE clicked_at IS NOT NULL),
        COUNT(*) FILTER (WHERE unsubscribed_at IS NOT NULL),
        COUNT(*) FILTER (WHERE bounce_type IS NOT NULL)
    INTO 
        total_sent,
        total_delivered,
        total_opened,
        total_clicked,
        total_unsubscribed,
        total_bounced
    FROM email_logs
    WHERE campaign_id = calculate_campaign_metrics.campaign_id;
    
    RETURN QUERY
    SELECT 
        CASE WHEN total_delivered > 0 
            THEN ROUND((total_opened::DECIMAL / total_delivered) * 100, 2)
            ELSE 0 
        END AS open_rate,
        CASE WHEN total_delivered > 0 
            THEN ROUND((total_clicked::DECIMAL / total_delivered) * 100, 2)
            ELSE 0 
        END AS click_rate,
        CASE WHEN total_delivered > 0 
            THEN ROUND((total_unsubscribed::DECIMAL / total_delivered) * 100, 2)
            ELSE 0 
        END AS unsubscribe_rate,
        CASE WHEN total_sent > 0 
            THEN ROUND((total_bounced::DECIMAL / total_sent) * 100, 2)
            ELSE 0 
        END AS bounce_rate,
        CASE WHEN total_sent > 0 
            THEN ROUND((total_delivered::DECIMAL / total_sent) * 100, 2)
            ELSE 0 
        END AS delivery_rate;
END;
$$ LANGUAGE plpgsql;

-- Function to check customer consent
CREATE OR REPLACE FUNCTION check_email_consent(
    p_customer_id UUID,
    p_email_type email_type
) RETURNS BOOLEAN AS $$
DECLARE
    v_consent_required BOOLEAN;
    v_has_consent BOOLEAN;
BEGIN
    -- Transactional emails don't require consent
    IF p_email_type IN ('booking_confirmation', 'payment_confirmation', 'cancellation_confirmation', 'refund_processed') THEN
        RETURN TRUE;
    END IF;
    
    -- Check if customer has given consent for this type
    SELECT EXISTS (
        SELECT 1 
        FROM customer_consent 
        WHERE customer_id = p_customer_id
            AND consent_type = CASE 
                WHEN p_email_type IN ('marketing_campaign', 'special_offer', 'birthday_offer') THEN 'marketing'
                WHEN p_email_type IN ('event_announcement', 'venue_update') THEN 'informational'
                WHEN p_email_type = 'feedback_request' THEN 'feedback'
                ELSE 'promotional'
            END::consent_type
            AND is_active = true
    ) INTO v_has_consent;
    
    RETURN v_has_consent;
END;
$$ LANGUAGE plpgsql;

-- Function to generate secure unsubscribe token
CREATE OR REPLACE FUNCTION generate_unsubscribe_token(
    p_customer_id UUID,
    p_email VARCHAR(255),
    p_unsubscribe_type VARCHAR(50)
) RETURNS VARCHAR AS $$
DECLARE
    v_token VARCHAR(255);
    v_token_hash VARCHAR(64);
BEGIN
    -- Generate random token
    v_token := encode(gen_random_bytes(32), 'hex');
    v_token_hash := encode(digest(v_token, 'sha256'), 'hex');
    
    -- Store token
    INSERT INTO email_unsubscribe_tokens (
        token,
        token_hash,
        customer_id,
        customer_email,
        unsubscribe_type,
        expires_at
    ) VALUES (
        v_token,
        v_token_hash,
        p_customer_id,
        p_email,
        p_unsubscribe_type,
        NOW() + INTERVAL '30 days'
    );
    
    RETURN v_token;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE email_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_consent ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_email_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_campaigns ENABLE ROW LEVEL SECURITY;

-- Policies for email templates (admin only)
CREATE POLICY email_templates_admin_all ON email_templates
    FOR ALL
    USING (auth.has_role('admin') OR auth.has_role('super_admin'));

-- Policies for email logs (customers can see their own)
CREATE POLICY email_logs_customer_read ON email_logs
    FOR SELECT
    USING (
        recipient_id = auth.uid() OR
        auth.has_role('admin') OR 
        auth.has_role('super_admin')
    );

-- Policies for customer consent (customers manage their own)
CREATE POLICY customer_consent_own ON customer_consent
    FOR ALL
    USING (customer_id = auth.uid());

CREATE POLICY customer_consent_admin_all ON customer_consent
    FOR ALL
    USING (auth.has_role('admin') OR auth.has_role('super_admin'));

-- Policies for email preferences (customers manage their own)
CREATE POLICY customer_preferences_own ON customer_email_preferences
    FOR ALL
    USING (customer_id = auth.uid());

CREATE POLICY customer_preferences_admin_all ON customer_email_preferences
    FOR ALL
    USING (auth.has_role('admin') OR auth.has_role('super_admin'));

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

-- Additional performance indexes
CREATE INDEX idx_email_queue_retry ON email_queue(next_retry_at) 
    WHERE status IN ('failed', 'deferred') AND attempts < max_attempts;

CREATE INDEX idx_email_logs_engagement ON email_logs(recipient_id, email_type)
    WHERE opened_at IS NOT NULL OR clicked_at IS NOT NULL;

CREATE INDEX idx_tracking_events_analysis ON email_tracking_events(event_timestamp, event_type)
    WHERE is_bot = false;

-- ============================================================================
-- GRANTS
-- ============================================================================

-- Grant permissions to application role
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;