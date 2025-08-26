-- ======================================================================================
-- The Backroom Leeds - Comprehensive Authentication System Schema
-- ======================================================================================
-- Version: 1.0.0
-- Date: 2025-08-26
-- Description: Complete authentication infrastructure with 2FA, session management,
--              rate limiting, audit logging, and role enforcement
-- ======================================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "citext"; -- Case-insensitive text for emails

-- Drop existing tables if we're rebuilding (careful in production!)
DROP TABLE IF EXISTS admin_activity_log CASCADE;
DROP TABLE IF EXISTS admin_login_attempts CASCADE;
DROP TABLE IF EXISTS admin_backup_codes CASCADE;
DROP TABLE IF EXISTS admin_totp_secrets CASCADE;
DROP TABLE IF EXISTS admin_sessions CASCADE;
DROP TABLE IF EXISTS admin_password_history CASCADE;

-- Drop existing types if we're rebuilding
DROP TYPE IF EXISTS admin_role CASCADE;
DROP TYPE IF EXISTS session_status CASCADE;
DROP TYPE IF EXISTS activity_action CASCADE;
DROP TYPE IF EXISTS login_attempt_result CASCADE;

-- ======================================================================================
-- CUSTOM TYPES
-- ======================================================================================

-- Admin role hierarchy with strict enforcement
CREATE TYPE admin_role AS ENUM (
    'super_admin',  -- Full system access + user management (max 1)
    'manager',      -- Full access except user management (max 10)
    'door_staff'    -- Bookings view & check-in only (max 10)
);

-- Session status tracking
CREATE TYPE session_status AS ENUM (
    'active',
    'expired',
    'revoked',
    'locked'
);

-- Activity action types for audit logging
CREATE TYPE activity_action AS ENUM (
    'login',
    'logout',
    'login_failed',
    'password_change',
    'totp_enabled',
    'totp_disabled',
    'totp_verified',
    'backup_code_used',
    'booking_created',
    'booking_modified',
    'booking_cancelled',
    'booking_checkin',
    'user_created',
    'user_modified',
    'user_deleted',
    'role_changed',
    'session_expired',
    'session_revoked',
    'account_locked',
    'account_unlocked'
);

-- Login attempt results
CREATE TYPE login_attempt_result AS ENUM (
    'success',
    'invalid_credentials',
    'account_locked',
    'account_disabled',
    'totp_required',
    'totp_invalid',
    'session_expired'
);

-- ======================================================================================
-- ENHANCED ADMIN USERS TABLE
-- ======================================================================================

-- Drop and recreate the admin_users table with enhanced security
DROP TABLE IF EXISTS admin_users CASCADE;

CREATE TABLE admin_users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email CITEXT UNIQUE NOT NULL CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
    username VARCHAR(50) UNIQUE NOT NULL CHECK (length(username) >= 3),
    full_name VARCHAR(255) NOT NULL,
    password_hash VARCHAR(255) NOT NULL, -- Argon2id hash
    role admin_role NOT NULL DEFAULT 'door_staff',
    
    -- 2FA Configuration
    totp_enabled BOOLEAN DEFAULT FALSE,
    totp_verified_at TIMESTAMPTZ,
    require_2fa BOOLEAN DEFAULT TRUE, -- Enforce 2FA for all admin users
    
    -- Account Security
    is_active BOOLEAN DEFAULT TRUE,
    email_verified BOOLEAN DEFAULT FALSE,
    email_verified_at TIMESTAMPTZ,
    
    -- Password Management
    password_changed_at TIMESTAMPTZ DEFAULT NOW(),
    password_expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '90 days'),
    must_change_password BOOLEAN DEFAULT FALSE,
    
    -- Login Security
    failed_login_attempts INTEGER DEFAULT 0 CHECK (failed_login_attempts >= 0),
    last_failed_login_at TIMESTAMPTZ,
    locked_until TIMESTAMPTZ,
    locked_reason TEXT,
    
    -- Session Management
    last_login_at TIMESTAMPTZ,
    last_login_ip INET,
    last_activity_at TIMESTAMPTZ,
    
    -- Metadata
    created_by UUID REFERENCES admin_users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ, -- Soft delete support
    
    -- Constraints
    CONSTRAINT check_role_assignment CHECK (
        -- Only super_admin can be created by null (initial setup) or another super_admin
        (role = 'super_admin' AND (created_by IS NULL OR 
            EXISTS (SELECT 1 FROM admin_users WHERE id = created_by AND role = 'super_admin')))
        OR role != 'super_admin'
    )
);

-- ======================================================================================
-- ADMIN SESSIONS TABLE
-- ======================================================================================

CREATE TABLE admin_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_token VARCHAR(255) UNIQUE NOT NULL, -- Secure random token
    user_id UUID NOT NULL REFERENCES admin_users(id) ON DELETE CASCADE,
    
    -- Session Security
    status session_status DEFAULT 'active',
    totp_verified BOOLEAN DEFAULT FALSE,
    totp_verified_at TIMESTAMPTZ,
    
    -- Session Metadata
    ip_address INET NOT NULL,
    user_agent TEXT,
    device_fingerprint JSONB, -- Optional device tracking
    
    -- Session Lifecycle
    created_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '8 hours'), -- 8-hour sessions
    last_activity_at TIMESTAMPTZ DEFAULT NOW(),
    revoked_at TIMESTAMPTZ,
    revoked_by UUID REFERENCES admin_users(id),
    revoke_reason TEXT,
    
    -- Constraints
    CONSTRAINT check_session_expiry CHECK (expires_at > created_at),
    CONSTRAINT check_active_session CHECK (
        (status = 'active' AND revoked_at IS NULL) OR
        (status != 'active' AND revoked_at IS NOT NULL)
    )
);

-- ======================================================================================
-- TOTP SECRETS TABLE (Encrypted Storage)
-- ======================================================================================

CREATE TABLE admin_totp_secrets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID UNIQUE NOT NULL REFERENCES admin_users(id) ON DELETE CASCADE,
    
    -- Encrypted TOTP Secret
    encrypted_secret TEXT NOT NULL, -- AES-256-GCM encrypted
    encryption_iv VARCHAR(32) NOT NULL, -- Initialization vector
    
    -- TOTP Configuration
    issuer VARCHAR(100) DEFAULT 'The Backroom Leeds',
    algorithm VARCHAR(10) DEFAULT 'SHA1',
    digits INTEGER DEFAULT 6 CHECK (digits IN (6, 8)),
    period INTEGER DEFAULT 30 CHECK (period > 0),
    
    -- Recovery
    recovery_email VARCHAR(255),
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    last_used_at TIMESTAMPTZ,
    last_used_token VARCHAR(10), -- Prevent replay attacks
    
    -- Security
    verified BOOLEAN DEFAULT FALSE,
    verified_at TIMESTAMPTZ,
    attempts_since_success INTEGER DEFAULT 0
);

-- ======================================================================================
-- BACKUP CODES TABLE
-- ======================================================================================

CREATE TABLE admin_backup_codes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES admin_users(id) ON DELETE CASCADE,
    code_hash VARCHAR(255) NOT NULL, -- Hashed backup code
    
    -- Usage Tracking
    used BOOLEAN DEFAULT FALSE,
    used_at TIMESTAMPTZ,
    used_ip INET,
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '1 year'),
    
    -- Unique constraint
    CONSTRAINT unique_user_code UNIQUE (user_id, code_hash)
);

-- ======================================================================================
-- LOGIN ATTEMPTS TABLE (Rate Limiting)
-- ======================================================================================

CREATE TABLE admin_login_attempts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Attempt Identification
    email CITEXT NOT NULL,
    user_id UUID REFERENCES admin_users(id) ON DELETE SET NULL,
    
    -- Attempt Details
    ip_address INET NOT NULL,
    user_agent TEXT,
    result login_attempt_result NOT NULL,
    
    -- Security Details
    failed_reason TEXT,
    suspicious_indicators JSONB, -- e.g., {"vpn": true, "tor": false, "country": "UK"}
    
    -- Metadata
    attempted_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Indexes will be added for rate limiting queries
    -- Create compound index for efficient rate limiting checks
    CONSTRAINT check_failed_reason CHECK (
        (result = 'success' AND failed_reason IS NULL) OR
        (result != 'success' AND failed_reason IS NOT NULL)
    )
);

-- ======================================================================================
-- ACTIVITY LOG TABLE (Audit Trail)
-- ======================================================================================

CREATE TABLE admin_activity_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Actor Information
    user_id UUID REFERENCES admin_users(id) ON DELETE SET NULL,
    user_email CITEXT,
    user_role admin_role,
    
    -- Action Details
    action activity_action NOT NULL,
    entity_type VARCHAR(50), -- 'booking', 'user', 'event', etc.
    entity_id VARCHAR(255), -- ID of affected entity
    
    -- Change Tracking
    old_values JSONB,
    new_values JSONB,
    metadata JSONB, -- Additional context
    
    -- Request Information
    ip_address INET,
    user_agent TEXT,
    session_id UUID REFERENCES admin_sessions(id) ON DELETE SET NULL,
    
    -- Timestamp
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Ensure we always have actor information
    CONSTRAINT check_actor_info CHECK (
        user_id IS NOT NULL OR user_email IS NOT NULL
    )
);

-- ======================================================================================
-- PASSWORD HISTORY TABLE (Prevent Reuse)
-- ======================================================================================

CREATE TABLE admin_password_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES admin_users(id) ON DELETE CASCADE,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Keep last 12 password hashes
    CONSTRAINT unique_user_password UNIQUE (user_id, password_hash)
);

-- ======================================================================================
-- DATABASE FUNCTIONS
-- ======================================================================================

-- Function to enforce role limits
CREATE OR REPLACE FUNCTION enforce_role_limits()
RETURNS TRIGGER AS $$
DECLARE
    super_admin_count INTEGER;
    manager_count INTEGER;
    door_staff_count INTEGER;
BEGIN
    -- Only check on INSERT or when role is being changed
    IF TG_OP = 'UPDATE' AND OLD.role = NEW.role THEN
        RETURN NEW;
    END IF;
    
    -- Count active users by role
    SELECT COUNT(*) INTO super_admin_count
    FROM admin_users 
    WHERE role = 'super_admin' 
        AND is_active = TRUE 
        AND deleted_at IS NULL
        AND id != NEW.id;
    
    SELECT COUNT(*) INTO manager_count
    FROM admin_users 
    WHERE role = 'manager' 
        AND is_active = TRUE 
        AND deleted_at IS NULL
        AND id != NEW.id;
    
    SELECT COUNT(*) INTO door_staff_count
    FROM admin_users 
    WHERE role = 'door_staff' 
        AND is_active = TRUE 
        AND deleted_at IS NULL
        AND id != NEW.id;
    
    -- Enforce limits
    IF NEW.role = 'super_admin' AND super_admin_count >= 1 THEN
        RAISE EXCEPTION 'Maximum number of super admins (1) reached';
    ELSIF NEW.role = 'manager' AND manager_count >= 10 THEN
        RAISE EXCEPTION 'Maximum number of managers (10) reached';
    ELSIF NEW.role = 'door_staff' AND door_staff_count >= 10 THEN
        RAISE EXCEPTION 'Maximum number of door staff (10) reached';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to log activity
CREATE OR REPLACE FUNCTION log_admin_activity(
    p_user_id UUID,
    p_action activity_action,
    p_entity_type VARCHAR(50) DEFAULT NULL,
    p_entity_id VARCHAR(255) DEFAULT NULL,
    p_old_values JSONB DEFAULT NULL,
    p_new_values JSONB DEFAULT NULL,
    p_metadata JSONB DEFAULT NULL,
    p_ip_address INET DEFAULT NULL,
    p_user_agent TEXT DEFAULT NULL,
    p_session_id UUID DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
    v_user_email CITEXT;
    v_user_role admin_role;
    v_log_id UUID;
BEGIN
    -- Get user information
    SELECT email, role INTO v_user_email, v_user_role
    FROM admin_users WHERE id = p_user_id;
    
    -- Insert activity log
    INSERT INTO admin_activity_log (
        user_id, user_email, user_role, action, entity_type, entity_id,
        old_values, new_values, metadata, ip_address, user_agent, session_id
    ) VALUES (
        p_user_id, v_user_email, v_user_role, p_action, p_entity_type, p_entity_id,
        p_old_values, p_new_values, p_metadata, p_ip_address, p_user_agent, p_session_id
    ) RETURNING id INTO v_log_id;
    
    RETURN v_log_id;
END;
$$ LANGUAGE plpgsql;

-- Function to check rate limiting
CREATE OR REPLACE FUNCTION check_login_rate_limit(
    p_email CITEXT,
    p_ip_address INET
) RETURNS BOOLEAN AS $$
DECLARE
    recent_attempts INTEGER;
    recent_failures INTEGER;
BEGIN
    -- Check attempts in last 15 minutes
    SELECT COUNT(*) INTO recent_attempts
    FROM admin_login_attempts
    WHERE (email = p_email OR ip_address = p_ip_address)
        AND attempted_at > NOW() - INTERVAL '15 minutes';
    
    -- Check failures in last 15 minutes
    SELECT COUNT(*) INTO recent_failures
    FROM admin_login_attempts
    WHERE (email = p_email OR ip_address = p_ip_address)
        AND result != 'success'
        AND attempted_at > NOW() - INTERVAL '15 minutes';
    
    -- Rate limits: max 10 attempts or 5 failures per 15 minutes
    IF recent_attempts >= 10 OR recent_failures >= 5 THEN
        RETURN FALSE;
    END IF;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Function to clean expired sessions
CREATE OR REPLACE FUNCTION cleanup_expired_sessions()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    UPDATE admin_sessions 
    SET status = 'expired'
    WHERE status = 'active' 
        AND expires_at < NOW();
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    -- Log cleanup
    IF deleted_count > 0 THEN
        INSERT INTO admin_activity_log (
            action, metadata, created_at
        ) VALUES (
            'session_expired',
            jsonb_build_object('expired_sessions', deleted_count),
            NOW()
        );
    END IF;
    
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Function to validate password complexity
CREATE OR REPLACE FUNCTION validate_password_complexity(
    p_password TEXT
) RETURNS BOOLEAN AS $$
BEGIN
    -- Minimum 8 characters
    IF length(p_password) < 8 THEN
        RETURN FALSE;
    END IF;
    
    -- Must contain at least one uppercase letter
    IF p_password !~ '[A-Z]' THEN
        RETURN FALSE;
    END IF;
    
    -- Must contain at least one lowercase letter
    IF p_password !~ '[a-z]' THEN
        RETURN FALSE;
    END IF;
    
    -- Must contain at least one number
    IF p_password !~ '[0-9]' THEN
        RETURN FALSE;
    END IF;
    
    -- Must contain at least one special character
    IF p_password !~ '[!@#$%^&*()_+\-=\[\]{};'':"\\|,.<>\/?]' THEN
        RETURN FALSE;
    END IF;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Function to check password history
CREATE OR REPLACE FUNCTION check_password_history(
    p_user_id UUID,
    p_password_hash VARCHAR(255)
) RETURNS BOOLEAN AS $$
DECLARE
    history_match INTEGER;
BEGIN
    -- Check if password was used in last 12 passwords
    SELECT COUNT(*) INTO history_match
    FROM (
        SELECT password_hash 
        FROM admin_password_history 
        WHERE user_id = p_user_id
        ORDER BY created_at DESC
        LIMIT 12
    ) AS recent_passwords
    WHERE password_hash = p_password_hash;
    
    RETURN history_match = 0;
END;
$$ LANGUAGE plpgsql;

-- ======================================================================================
-- TRIGGERS
-- ======================================================================================

-- Trigger to enforce role limits
CREATE TRIGGER enforce_role_limits_trigger
    BEFORE INSERT OR UPDATE OF role ON admin_users
    FOR EACH ROW
    WHEN (NEW.is_active = TRUE AND NEW.deleted_at IS NULL)
    EXECUTE FUNCTION enforce_role_limits();

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_admin_users_updated_at
    BEFORE UPDATE ON admin_users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

-- Trigger to log password changes
CREATE OR REPLACE FUNCTION log_password_change()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.password_hash != NEW.password_hash THEN
        -- Add to password history
        INSERT INTO admin_password_history (user_id, password_hash)
        VALUES (NEW.id, NEW.password_hash);
        
        -- Update password metadata
        NEW.password_changed_at = NOW();
        NEW.password_expires_at = NOW() + INTERVAL '90 days';
        NEW.must_change_password = FALSE;
        
        -- Log activity
        PERFORM log_admin_activity(
            NEW.id,
            'password_change'::activity_action,
            'user',
            NEW.id::TEXT,
            jsonb_build_object('password_changed', TRUE),
            NULL,
            jsonb_build_object('password_changed_at', NOW())
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER log_password_change_trigger
    BEFORE UPDATE OF password_hash ON admin_users
    FOR EACH ROW
    EXECUTE FUNCTION log_password_change();

-- Trigger to cleanup old login attempts (keep only last 30 days)
CREATE OR REPLACE FUNCTION cleanup_old_login_attempts()
RETURNS TRIGGER AS $$
BEGIN
    DELETE FROM admin_login_attempts
    WHERE attempted_at < NOW() - INTERVAL '30 days';
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Run cleanup daily (triggered on any new attempt)
CREATE TRIGGER cleanup_old_login_attempts_trigger
    AFTER INSERT ON admin_login_attempts
    FOR EACH STATEMENT
    EXECUTE FUNCTION cleanup_old_login_attempts();

-- ======================================================================================
-- INDEXES FOR PERFORMANCE
-- ======================================================================================

-- User indexes
CREATE INDEX idx_admin_users_email ON admin_users(email) WHERE deleted_at IS NULL;
CREATE INDEX idx_admin_users_role ON admin_users(role) WHERE is_active = TRUE AND deleted_at IS NULL;
CREATE INDEX idx_admin_users_created_by ON admin_users(created_by);
CREATE INDEX idx_admin_users_active ON admin_users(is_active, deleted_at);

-- Session indexes
CREATE INDEX idx_admin_sessions_user_id ON admin_sessions(user_id) WHERE status = 'active';
CREATE INDEX idx_admin_sessions_token ON admin_sessions(session_token) WHERE status = 'active';
CREATE INDEX idx_admin_sessions_expires ON admin_sessions(expires_at) WHERE status = 'active';
CREATE INDEX idx_admin_sessions_ip ON admin_sessions(ip_address);

-- Login attempts indexes (for rate limiting)
CREATE INDEX idx_login_attempts_email ON admin_login_attempts(email, attempted_at DESC);
CREATE INDEX idx_login_attempts_ip ON admin_login_attempts(ip_address, attempted_at DESC);
CREATE INDEX idx_login_attempts_recent ON admin_login_attempts(attempted_at) 
    WHERE attempted_at > NOW() - INTERVAL '1 hour';

-- Activity log indexes
CREATE INDEX idx_activity_log_user ON admin_activity_log(user_id, created_at DESC);
CREATE INDEX idx_activity_log_action ON admin_activity_log(action, created_at DESC);
CREATE INDEX idx_activity_log_entity ON admin_activity_log(entity_type, entity_id);
CREATE INDEX idx_activity_log_date ON admin_activity_log(created_at DESC);

-- TOTP indexes
CREATE INDEX idx_totp_secrets_user ON admin_totp_secrets(user_id) WHERE verified = TRUE;

-- Backup codes indexes
CREATE INDEX idx_backup_codes_user ON admin_backup_codes(user_id) WHERE used = FALSE;

-- ======================================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ======================================================================================

-- Enable RLS on all tables
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_totp_secrets ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_backup_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_login_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_activity_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_password_history ENABLE ROW LEVEL SECURITY;

-- Admin users policies
CREATE POLICY "Super admins can view all users"
    ON admin_users FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM admin_users current_user
            WHERE current_user.id = auth.uid()
                AND current_user.role = 'super_admin'
                AND current_user.is_active = TRUE
        )
    );

CREATE POLICY "Users can view own profile"
    ON admin_users FOR SELECT
    USING (id = auth.uid());

CREATE POLICY "Super admins can manage users"
    ON admin_users FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM admin_users current_user
            WHERE current_user.id = auth.uid()
                AND current_user.role = 'super_admin'
                AND current_user.is_active = TRUE
        )
    );

CREATE POLICY "Users can update own profile"
    ON admin_users FOR UPDATE
    USING (id = auth.uid())
    WITH CHECK (
        id = auth.uid() 
        AND role = (SELECT role FROM admin_users WHERE id = auth.uid())
    );

-- Session policies
CREATE POLICY "Users can view own sessions"
    ON admin_sessions FOR SELECT
    USING (user_id = auth.uid());

CREATE POLICY "Users can manage own sessions"
    ON admin_sessions FOR ALL
    USING (user_id = auth.uid());

-- TOTP secrets policies
CREATE POLICY "Users can manage own TOTP"
    ON admin_totp_secrets FOR ALL
    USING (user_id = auth.uid());

-- Backup codes policies
CREATE POLICY "Users can manage own backup codes"
    ON admin_backup_codes FOR ALL
    USING (user_id = auth.uid());

-- Login attempts policies (write-only for security)
CREATE POLICY "System can write login attempts"
    ON admin_login_attempts FOR INSERT
    WITH CHECK (TRUE);

-- Activity log policies
CREATE POLICY "Super admins can view all logs"
    ON admin_activity_log FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM admin_users
            WHERE id = auth.uid()
                AND role = 'super_admin'
                AND is_active = TRUE
        )
    );

CREATE POLICY "Users can view own activity"
    ON admin_activity_log FOR SELECT
    USING (user_id = auth.uid());

-- Password history policies
CREATE POLICY "System can manage password history"
    ON admin_password_history FOR ALL
    USING (user_id = auth.uid());

-- ======================================================================================
-- INITIAL DATA SEEDING
-- ======================================================================================

-- Create default super admin account (password: ChangeMe123!)
-- Note: This should be changed immediately after deployment
DO $$
DECLARE
    v_user_id UUID;
BEGIN
    -- Only insert if no super admin exists
    IF NOT EXISTS (SELECT 1 FROM admin_users WHERE role = 'super_admin') THEN
        INSERT INTO admin_users (
            email,
            username,
            full_name,
            password_hash,
            role,
            is_active,
            email_verified,
            email_verified_at,
            require_2fa,
            created_at
        ) VALUES (
            'admin@backroomleeds.com',
            'superadmin',
            'System Administrator',
            '$argon2id$v=19$m=65536,t=3,p=1$vFPKH9yGRsJLnkfCwyfKbQ$Y8oXCwhzmF6jLPzgLqP5mPvAzkm8XUq6Rh3VYJ8PLTA', -- ChangeMe123!
            'super_admin',
            TRUE,
            TRUE,
            NOW(),
            TRUE,
            NOW()
        ) RETURNING id INTO v_user_id;
        
        -- Log the creation
        INSERT INTO admin_activity_log (
            user_id,
            user_email,
            user_role,
            action,
            entity_type,
            entity_id,
            metadata,
            created_at
        ) VALUES (
            v_user_id,
            'admin@backroomleeds.com',
            'super_admin',
            'user_created',
            'user',
            v_user_id::TEXT,
            jsonb_build_object(
                'initial_setup', true,
                'note', 'Default super admin account created. CHANGE PASSWORD IMMEDIATELY!'
            ),
            NOW()
        );
        
        RAISE NOTICE 'Default super admin created. Username: superadmin, Password: ChangeMe123! - CHANGE THIS IMMEDIATELY!';
    END IF;
END $$;

-- ======================================================================================
-- SCHEDULED MAINTENANCE PROCEDURES
-- ======================================================================================

-- Create a function to run periodic maintenance
CREATE OR REPLACE FUNCTION perform_authentication_maintenance()
RETURNS VOID AS $$
BEGIN
    -- Clean up expired sessions
    PERFORM cleanup_expired_sessions();
    
    -- Clean up old login attempts (older than 30 days)
    DELETE FROM admin_login_attempts
    WHERE attempted_at < NOW() - INTERVAL '30 days';
    
    -- Clean up expired backup codes
    DELETE FROM admin_backup_codes
    WHERE expires_at < NOW() AND used = FALSE;
    
    -- Unlock accounts that have passed their lock period
    UPDATE admin_users
    SET failed_login_attempts = 0,
        locked_until = NULL,
        locked_reason = NULL
    WHERE locked_until IS NOT NULL 
        AND locked_until < NOW();
    
    -- Mark accounts for password change if expired
    UPDATE admin_users
    SET must_change_password = TRUE
    WHERE password_expires_at < NOW()
        AND must_change_password = FALSE;
END;
$$ LANGUAGE plpgsql;

-- ======================================================================================
-- PERMISSIONS HELPER FUNCTIONS
-- ======================================================================================

-- Function to check if user has permission
CREATE OR REPLACE FUNCTION user_has_permission(
    p_user_id UUID,
    p_permission TEXT
) RETURNS BOOLEAN AS $$
DECLARE
    v_role admin_role;
    v_is_active BOOLEAN;
BEGIN
    SELECT role, is_active INTO v_role, v_is_active
    FROM admin_users
    WHERE id = p_user_id AND deleted_at IS NULL;
    
    IF NOT v_is_active THEN
        RETURN FALSE;
    END IF;
    
    -- Define permissions by role
    CASE v_role
        WHEN 'super_admin' THEN
            RETURN TRUE; -- Super admin has all permissions
        WHEN 'manager' THEN
            RETURN p_permission IN (
                'bookings:read', 'bookings:create', 'bookings:update', 'bookings:delete',
                'events:read', 'events:create', 'events:update', 'events:delete',
                'reports:read', 'reports:create',
                'floor_plan:read'
            );
        WHEN 'door_staff' THEN
            RETURN p_permission IN (
                'bookings:read', 'bookings:checkin',
                'floor_plan:read'
            );
        ELSE
            RETURN FALSE;
    END CASE;
END;
$$ LANGUAGE plpgsql;

-- ======================================================================================
-- GRANT PERMISSIONS (for Supabase)
-- ======================================================================================

-- Grant usage on schema
GRANT USAGE ON SCHEMA public TO anon, authenticated;

-- Grant SELECT on specific tables to authenticated users
GRANT SELECT ON admin_users TO authenticated;
GRANT SELECT ON admin_sessions TO authenticated;
GRANT SELECT ON admin_activity_log TO authenticated;

-- Grant ALL on tables to service role (for backend operations)
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO service_role;

-- ======================================================================================
-- COMMENTS FOR DOCUMENTATION
-- ======================================================================================

COMMENT ON TABLE admin_users IS 'Core authentication table for admin users with role-based access control';
COMMENT ON TABLE admin_sessions IS 'Active session management with security tracking';
COMMENT ON TABLE admin_totp_secrets IS 'Encrypted TOTP secrets for 2FA implementation';
COMMENT ON TABLE admin_backup_codes IS 'Recovery codes for 2FA backup authentication';
COMMENT ON TABLE admin_login_attempts IS 'Login attempt tracking for rate limiting and security monitoring';
COMMENT ON TABLE admin_activity_log IS 'Comprehensive audit trail for compliance and security';
COMMENT ON TABLE admin_password_history IS 'Password history to prevent reuse';

COMMENT ON FUNCTION enforce_role_limits() IS 'Enforces maximum user counts per role';
COMMENT ON FUNCTION check_login_rate_limit(CITEXT, INET) IS 'Checks if login attempt is within rate limits';
COMMENT ON FUNCTION cleanup_expired_sessions() IS 'Marks expired sessions and logs the action';
COMMENT ON FUNCTION validate_password_complexity(TEXT) IS 'Validates password meets security requirements';
COMMENT ON FUNCTION user_has_permission(UUID, TEXT) IS 'Checks if user has specific permission based on role';

-- ======================================================================================
-- END OF AUTHENTICATION SCHEMA
-- ======================================================================================