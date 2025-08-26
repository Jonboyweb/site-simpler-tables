-- ======================================================================================
-- The Backroom Leeds - Authentication System Seed Data
-- ======================================================================================
-- Version: 1.0.0
-- Date: 2025-08-26
-- Description: Seed data for development and testing of the authentication system
-- 
-- WARNING: This file contains test accounts with known passwords.
--          DO NOT use this in production!
-- ======================================================================================

-- Clear existing test data (for development only)
-- Comment out these lines in production
TRUNCATE TABLE admin_activity_log CASCADE;
TRUNCATE TABLE admin_login_attempts CASCADE;
TRUNCATE TABLE admin_backup_codes CASCADE;
TRUNCATE TABLE admin_totp_secrets CASCADE;
TRUNCATE TABLE admin_sessions CASCADE;
TRUNCATE TABLE admin_password_history CASCADE;
DELETE FROM admin_users WHERE email != 'admin@backroomleeds.com';

-- ======================================================================================
-- TEST USERS
-- ======================================================================================

-- All test passwords are: TestPass123!
-- Argon2id hash: $argon2id$v=19$m=65536,t=3,p=1$9h8QX6Y3bPeVjYRcuZvTZg$MNPRqDAVXI7pTKTBmVs8J8VdIgasP5usCpXfV2mNQiE

-- Manager 1: Emily Johnson (Active, 2FA enabled)
INSERT INTO admin_users (
    id,
    email,
    username,
    full_name,
    password_hash,
    role,
    is_active,
    email_verified,
    email_verified_at,
    totp_enabled,
    totp_verified_at,
    require_2fa,
    last_login_at,
    last_login_ip,
    created_at
) VALUES (
    'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    'emily.johnson@backroomleeds.com',
    'emilyjohnson',
    'Emily Johnson',
    '$argon2id$v=19$m=65536,t=3,p=1$9h8QX6Y3bPeVjYRcuZvTZg$MNPRqDAVXI7pTKTBmVs8J8VdIgasP5usCpXfV2mNQiE',
    'manager',
    TRUE,
    TRUE,
    NOW() - INTERVAL '30 days',
    TRUE,
    NOW() - INTERVAL '29 days',
    TRUE,
    NOW() - INTERVAL '1 hour',
    '192.168.1.100',
    NOW() - INTERVAL '30 days'
);

-- Manager 2: Michael Chen (Active, 2FA not enabled)
INSERT INTO admin_users (
    id,
    email,
    username,
    full_name,
    password_hash,
    role,
    is_active,
    email_verified,
    email_verified_at,
    totp_enabled,
    require_2fa,
    created_at
) VALUES (
    'b2c3d4e5-f678-90ab-cdef-123456789012',
    'michael.chen@backroomleeds.com',
    'michaelchen',
    'Michael Chen',
    '$argon2id$v=19$m=65536,t=3,p=1$9h8QX6Y3bPeVjYRcuZvTZg$MNPRqDAVXI7pTKTBmVs8J8VdIgasP5usCpXfV2mNQiE',
    'manager',
    TRUE,
    TRUE,
    NOW() - INTERVAL '25 days',
    FALSE,
    TRUE,
    NOW() - INTERVAL '25 days'
);

-- Manager 3: Sarah Williams (Inactive - on leave)
INSERT INTO admin_users (
    id,
    email,
    username,
    full_name,
    password_hash,
    role,
    is_active,
    email_verified,
    email_verified_at,
    created_at
) VALUES (
    'c3d4e5f6-7890-abcd-ef12-345678901234',
    'sarah.williams@backroomleeds.com',
    'sarahwilliams',
    'Sarah Williams',
    '$argon2id$v=19$m=65536,t=3,p=1$9h8QX6Y3bPeVjYRcuZvTZg$MNPRqDAVXI7pTKTBmVs8J8VdIgasP5usCpXfV2mNQiE',
    'manager',
    FALSE,
    TRUE,
    NOW() - INTERVAL '60 days',
    NOW() - INTERVAL '60 days'
);

-- Door Staff 1: James Brown (Active, experienced)
INSERT INTO admin_users (
    id,
    email,
    username,
    full_name,
    password_hash,
    role,
    is_active,
    email_verified,
    email_verified_at,
    totp_enabled,
    totp_verified_at,
    require_2fa,
    last_login_at,
    last_login_ip,
    created_at
) VALUES (
    'd4e5f678-90ab-cdef-1234-567890123456',
    'james.brown@backroomleeds.com',
    'jamesbrown',
    'James Brown',
    '$argon2id$v=19$m=65536,t=3,p=1$9h8QX6Y3bPeVjYRcuZvTZg$MNPRqDAVXI7pTKTBmVs8J8VdIgasP5usCpXfV2mNQiE',
    'door_staff',
    TRUE,
    TRUE,
    NOW() - INTERVAL '90 days',
    TRUE,
    NOW() - INTERVAL '89 days',
    TRUE,
    NOW() - INTERVAL '2 hours',
    '192.168.1.101',
    NOW() - INTERVAL '90 days'
);

-- Door Staff 2: Lisa Martinez (New staff)
INSERT INTO admin_users (
    id,
    email,
    username,
    full_name,
    password_hash,
    role,
    is_active,
    email_verified,
    email_verified_at,
    must_change_password,
    created_at
) VALUES (
    'e5f67890-abcd-ef12-3456-789012345678',
    'lisa.martinez@backroomleeds.com',
    'lisamartinez',
    'Lisa Martinez',
    '$argon2id$v=19$m=65536,t=3,p=1$9h8QX6Y3bPeVjYRcuZvTZg$MNPRqDAVXI7pTKTBmVs8J8VdIgasP5usCpXfV2mNQiE',
    'door_staff',
    TRUE,
    TRUE,
    NOW() - INTERVAL '5 days',
    TRUE, -- Must change password on first login
    NOW() - INTERVAL '5 days'
);

-- Door Staff 3: Tom Wilson (Part-time)
INSERT INTO admin_users (
    id,
    email,
    username,
    full_name,
    password_hash,
    role,
    is_active,
    email_verified,
    email_verified_at,
    created_at
) VALUES (
    'f6789012-bcde-f123-4567-890123456789',
    'tom.wilson@backroomleeds.com',
    'tomwilson',
    'Tom Wilson',
    '$argon2id$v=19$m=65536,t=3,p=1$9h8QX6Y3bPeVjYRcuZvTZg$MNPRqDAVXI7pTKTBmVs8J8VdIgasP5usCpXfV2mNQiE',
    'door_staff',
    TRUE,
    TRUE,
    NOW() - INTERVAL '45 days',
    NOW() - INTERVAL '45 days'
);

-- Account with failed login attempts (for testing lockout)
INSERT INTO admin_users (
    id,
    email,
    username,
    full_name,
    password_hash,
    role,
    is_active,
    email_verified,
    email_verified_at,
    failed_login_attempts,
    last_failed_login_at,
    locked_until,
    locked_reason,
    created_at
) VALUES (
    '01234567-cdef-1234-5678-901234567890',
    'locked.account@backroomleeds.com',
    'lockedaccount',
    'Test Locked Account',
    '$argon2id$v=19$m=65536,t=3,p=1$9h8QX6Y3bPeVjYRcuZvTZg$MNPRqDAVXI7pTKTBmVs8J8VdIgasP5usCpXfV2mNQiE',
    'door_staff',
    TRUE,
    TRUE,
    NOW() - INTERVAL '20 days',
    5,
    NOW() - INTERVAL '10 minutes',
    NOW() + INTERVAL '20 minutes',
    'Too many failed login attempts',
    NOW() - INTERVAL '20 days'
);

-- ======================================================================================
-- TOTP SECRETS (for users with 2FA enabled)
-- ======================================================================================

-- TOTP for Emily Johnson (encrypted with test key)
INSERT INTO admin_totp_secrets (
    user_id,
    encrypted_secret,
    encryption_iv,
    issuer,
    algorithm,
    digits,
    period,
    verified,
    verified_at,
    last_used_at
) VALUES (
    'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    'U2FsdGVkX1+ZxQWE5L3Y7nH8K9xVmNpQ2LkRjF1234567890abcdef', -- Test encrypted secret
    '1234567890abcdef',
    'The Backroom Leeds',
    'SHA1',
    6,
    30,
    TRUE,
    NOW() - INTERVAL '29 days',
    NOW() - INTERVAL '1 hour'
);

-- TOTP for James Brown (door staff with 2FA)
INSERT INTO admin_totp_secrets (
    user_id,
    encrypted_secret,
    encryption_iv,
    issuer,
    algorithm,
    digits,
    period,
    verified,
    verified_at
) VALUES (
    'd4e5f678-90ab-cdef-1234-567890123456',
    'U2FsdGVkX1+ABC123DEF456GHI789JKL012MNO345PQR678STU', -- Test encrypted secret
    'fedcba0987654321',
    'The Backroom Leeds',
    'SHA1',
    6,
    30,
    TRUE,
    NOW() - INTERVAL '89 days'
);

-- ======================================================================================
-- BACKUP CODES (for 2FA recovery)
-- ======================================================================================

-- Backup codes for Emily Johnson
INSERT INTO admin_backup_codes (user_id, code_hash, created_at, expires_at)
VALUES
    ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', '$2b$10$ABCD1234EFGH5678IJKL9012MNOP3456QRST7890UVWX', NOW() - INTERVAL '29 days', NOW() + INTERVAL '336 days'),
    ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', '$2b$10$BCDE2345FGHI6789JKLM0123NOPQ4567RSTU8901VWXY', NOW() - INTERVAL '29 days', NOW() + INTERVAL '336 days'),
    ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', '$2b$10$CDEF3456GHIJ7890KLMN1234OPQR5678STUV9012WXYZ', NOW() - INTERVAL '29 days', NOW() + INTERVAL '336 days'),
    ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', '$2b$10$DEFG4567HIJK8901LMNO2345PQRS6789TUVW0123XYZA', NOW() - INTERVAL '29 days', NOW() + INTERVAL '336 days'),
    ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', '$2b$10$EFGH5678IJKL9012MNOP3456QRST7890UVWX1234YZAB', NOW() - INTERVAL '29 days', NOW() + INTERVAL '336 days');

-- One used backup code for Emily
INSERT INTO admin_backup_codes (user_id, code_hash, used, used_at, used_ip, created_at, expires_at)
VALUES
    ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', '$2b$10$USED1234CODE5678HASH9012ABCD3456EFGH7890IJKL', TRUE, NOW() - INTERVAL '5 days', '192.168.1.100', NOW() - INTERVAL '29 days', NOW() + INTERVAL '336 days');

-- Backup codes for James Brown
INSERT INTO admin_backup_codes (user_id, code_hash, created_at, expires_at)
VALUES
    ('d4e5f678-90ab-cdef-1234-567890123456', '$2b$10$FGHI6789JKLM0123NOPQ4567RSTU8901VWXY2345ZABC', NOW() - INTERVAL '89 days', NOW() + INTERVAL '276 days'),
    ('d4e5f678-90ab-cdef-1234-567890123456', '$2b$10$GHIJ7890KLMN1234OPQR5678STUV9012WXYZ3456ABCD', NOW() - INTERVAL '89 days', NOW() + INTERVAL '276 days'),
    ('d4e5f678-90ab-cdef-1234-567890123456', '$2b$10$HIJK8901LMNO2345PQRS6789TUVW0123XYZA4567BCDE', NOW() - INTERVAL '89 days', NOW() + INTERVAL '276 days'),
    ('d4e5f678-90ab-cdef-1234-567890123456', '$2b$10$IJKL9012MNOP3456QRST7890UVWX1234YZAB5678CDEF', NOW() - INTERVAL '89 days', NOW() + INTERVAL '276 days'),
    ('d4e5f678-90ab-cdef-1234-567890123456', '$2b$10$JKLM0123NOPQ4567RSTU8901VWXY2345ZABC6789DEFG', NOW() - INTERVAL '89 days', NOW() + INTERVAL '276 days');

-- ======================================================================================
-- ACTIVE SESSIONS
-- ======================================================================================

-- Active session for Emily Johnson
INSERT INTO admin_sessions (
    id,
    session_token,
    user_id,
    status,
    totp_verified,
    totp_verified_at,
    ip_address,
    user_agent,
    created_at,
    expires_at,
    last_activity_at
) VALUES (
    '11111111-2222-3333-4444-555555555555',
    'session_emily_' || encode(gen_random_bytes(32), 'hex'),
    'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    'active',
    TRUE,
    NOW() - INTERVAL '1 hour',
    '192.168.1.100',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0',
    NOW() - INTERVAL '1 hour',
    NOW() + INTERVAL '7 hours',
    NOW() - INTERVAL '5 minutes'
);

-- Active session for James Brown
INSERT INTO admin_sessions (
    id,
    session_token,
    user_id,
    status,
    totp_verified,
    totp_verified_at,
    ip_address,
    user_agent,
    created_at,
    expires_at,
    last_activity_at
) VALUES (
    '22222222-3333-4444-5555-666666666666',
    'session_james_' || encode(gen_random_bytes(32), 'hex'),
    'd4e5f678-90ab-cdef-1234-567890123456',
    'active',
    TRUE,
    NOW() - INTERVAL '2 hours',
    '192.168.1.101',
    'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) Mobile/15E148',
    NOW() - INTERVAL '2 hours',
    NOW() + INTERVAL '6 hours',
    NOW() - INTERVAL '15 minutes'
);

-- Expired session for Michael Chen
INSERT INTO admin_sessions (
    id,
    session_token,
    user_id,
    status,
    totp_verified,
    ip_address,
    user_agent,
    created_at,
    expires_at,
    last_activity_at
) VALUES (
    '33333333-4444-5555-6666-777777777777',
    'session_michael_expired_' || encode(gen_random_bytes(32), 'hex'),
    'b2c3d4e5-f678-90ab-cdef-123456789012',
    'expired',
    FALSE,
    '192.168.1.102',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) Safari/605.1.15',
    NOW() - INTERVAL '10 hours',
    NOW() - INTERVAL '2 hours',
    NOW() - INTERVAL '3 hours'
);

-- ======================================================================================
-- LOGIN ATTEMPTS (for rate limiting testing)
-- ======================================================================================

-- Successful login for Emily
INSERT INTO admin_login_attempts (
    email,
    user_id,
    ip_address,
    user_agent,
    result,
    attempted_at
) VALUES (
    'emily.johnson@backroomleeds.com',
    'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    '192.168.1.100',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0',
    'success',
    NOW() - INTERVAL '1 hour'
);

-- Failed attempts for locked account
INSERT INTO admin_login_attempts (
    email,
    user_id,
    ip_address,
    user_agent,
    result,
    failed_reason,
    attempted_at
) VALUES 
    ('locked.account@backroomleeds.com', '01234567-cdef-1234-5678-901234567890', '192.168.1.50', 'Mozilla/5.0', 'invalid_credentials', 'Incorrect password', NOW() - INTERVAL '15 minutes'),
    ('locked.account@backroomleeds.com', '01234567-cdef-1234-5678-901234567890', '192.168.1.50', 'Mozilla/5.0', 'invalid_credentials', 'Incorrect password', NOW() - INTERVAL '14 minutes'),
    ('locked.account@backroomleeds.com', '01234567-cdef-1234-5678-901234567890', '192.168.1.50', 'Mozilla/5.0', 'invalid_credentials', 'Incorrect password', NOW() - INTERVAL '13 minutes'),
    ('locked.account@backroomleeds.com', '01234567-cdef-1234-5678-901234567890', '192.168.1.50', 'Mozilla/5.0', 'invalid_credentials', 'Incorrect password', NOW() - INTERVAL '12 minutes'),
    ('locked.account@backroomleeds.com', '01234567-cdef-1234-5678-901234567890', '192.168.1.50', 'Mozilla/5.0', 'invalid_credentials', 'Incorrect password', NOW() - INTERVAL '10 minutes');

-- Failed attempt from suspicious IP
INSERT INTO admin_login_attempts (
    email,
    ip_address,
    user_agent,
    result,
    failed_reason,
    suspicious_indicators,
    attempted_at
) VALUES (
    'nonexistent@backroomleeds.com',
    '185.220.101.45', -- Known Tor exit node
    'curl/7.68.0',
    'invalid_credentials',
    'User not found',
    '{"tor": true, "vpn": false, "country": "NL", "risk_score": 85}'::jsonb,
    NOW() - INTERVAL '30 minutes'
);

-- ======================================================================================
-- ACTIVITY LOG (audit trail)
-- ======================================================================================

-- User creation logs
INSERT INTO admin_activity_log (
    user_id,
    user_email,
    user_role,
    action,
    entity_type,
    entity_id,
    metadata,
    ip_address,
    created_at
) VALUES 
    (NULL, 'admin@backroomleeds.com', 'super_admin', 'user_created', 'user', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', '{"created_by": "super_admin", "role": "manager"}'::jsonb, '192.168.1.1', NOW() - INTERVAL '30 days'),
    (NULL, 'admin@backroomleeds.com', 'super_admin', 'user_created', 'user', 'b2c3d4e5-f678-90ab-cdef-123456789012', '{"created_by": "super_admin", "role": "manager"}'::jsonb, '192.168.1.1', NOW() - INTERVAL '25 days'),
    (NULL, 'admin@backroomleeds.com', 'super_admin', 'user_created', 'user', 'd4e5f678-90ab-cdef-1234-567890123456', '{"created_by": "super_admin", "role": "door_staff"}'::jsonb, '192.168.1.1', NOW() - INTERVAL '90 days');

-- Login activity
INSERT INTO admin_activity_log (
    user_id,
    user_email,
    user_role,
    action,
    entity_type,
    metadata,
    ip_address,
    user_agent,
    created_at
) VALUES 
    ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'emily.johnson@backroomleeds.com', 'manager', 'login', 'session', '{"session_id": "11111111-2222-3333-4444-555555555555", "2fa_used": true}'::jsonb, '192.168.1.100', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0', NOW() - INTERVAL '1 hour'),
    ('d4e5f678-90ab-cdef-1234-567890123456', 'james.brown@backroomleeds.com', 'door_staff', 'login', 'session', '{"session_id": "22222222-3333-4444-5555-666666666666", "2fa_used": true}'::jsonb, '192.168.1.101', 'Mozilla/5.0 (iPhone)', NOW() - INTERVAL '2 hours');

-- Booking management activity
INSERT INTO admin_activity_log (
    user_id,
    user_email,
    user_role,
    action,
    entity_type,
    entity_id,
    new_values,
    metadata,
    ip_address,
    created_at
) VALUES 
    ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'emily.johnson@backroomleeds.com', 'manager', 'booking_created', 'booking', 'BRL-2024-ABC12', '{"customer": "John Doe", "date": "2024-12-31", "tables": [5, 6]}'::jsonb, '{"party_size": 8, "package": "Premium"}'::jsonb, '192.168.1.100', NOW() - INTERVAL '3 hours'),
    ('d4e5f678-90ab-cdef-1234-567890123456', 'james.brown@backroomleeds.com', 'door_staff', 'booking_checkin', 'booking', 'BRL-2024-XYZ99', '{"status": "arrived", "checked_in_at": "2024-12-25T21:30:00Z"}'::jsonb, '{"tables": [1], "party_size": 4}'::jsonb, '192.168.1.101', NOW() - INTERVAL '4 hours');

-- 2FA setup activity
INSERT INTO admin_activity_log (
    user_id,
    user_email,
    user_role,
    action,
    metadata,
    ip_address,
    created_at
) VALUES 
    ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'emily.johnson@backroomleeds.com', 'manager', 'totp_enabled', '{"method": "authenticator_app", "backup_codes_generated": 10}'::jsonb, '192.168.1.100', NOW() - INTERVAL '29 days'),
    ('d4e5f678-90ab-cdef-1234-567890123456', 'james.brown@backroomleeds.com', 'door_staff', 'totp_enabled', '{"method": "authenticator_app", "backup_codes_generated": 10}'::jsonb, '192.168.1.101', NOW() - INTERVAL '89 days');

-- Failed login activity
INSERT INTO admin_activity_log (
    user_email,
    action,
    metadata,
    ip_address,
    user_agent,
    created_at
) VALUES 
    ('locked.account@backroomleeds.com', 'login_failed', '{"reason": "invalid_credentials", "attempts": 5}'::jsonb, '192.168.1.50', 'Mozilla/5.0', NOW() - INTERVAL '10 minutes'),
    ('locked.account@backroomleeds.com', 'account_locked', '{"reason": "too_many_attempts", "locked_duration": "30 minutes"}'::jsonb, '192.168.1.50', 'Mozilla/5.0', NOW() - INTERVAL '10 minutes');

-- ======================================================================================
-- PASSWORD HISTORY
-- ======================================================================================

-- Password history for Emily (she changed password once)
INSERT INTO admin_password_history (
    user_id,
    password_hash,
    created_at
) VALUES (
    'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    '$argon2id$v=19$m=65536,t=3,p=1$OldPasswordHash1234567890abcdef$OldHashContent123456789',
    NOW() - INTERVAL '60 days'
);

-- Password history for James (multiple password changes)
INSERT INTO admin_password_history (
    user_id,
    password_hash,
    created_at
) VALUES 
    ('d4e5f678-90ab-cdef-1234-567890123456', '$argon2id$v=19$m=65536,t=3,p=1$OldPass1$Hash1', NOW() - INTERVAL '180 days'),
    ('d4e5f678-90ab-cdef-1234-567890123456', '$argon2id$v=19$m=65536,t=3,p=1$OldPass2$Hash2', NOW() - INTERVAL '120 days'),
    ('d4e5f678-90ab-cdef-1234-567890123456', '$argon2id$v=19$m=65536,t=3,p=1$OldPass3$Hash3', NOW() - INTERVAL '60 days');

-- ======================================================================================
-- SUMMARY OUTPUT
-- ======================================================================================

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '==============================================';
    RAISE NOTICE 'Authentication Seed Data Loaded Successfully';
    RAISE NOTICE '==============================================';
    RAISE NOTICE '';
    RAISE NOTICE 'Test Accounts Created:';
    RAISE NOTICE '----------------------';
    RAISE NOTICE 'Super Admin:';
    RAISE NOTICE '  Email: admin@backroomleeds.com';
    RAISE NOTICE '  Password: ChangeMe123! (CHANGE IMMEDIATELY)';
    RAISE NOTICE '';
    RAISE NOTICE 'Managers (3 total, 2 active):';
    RAISE NOTICE '  ✓ emily.johnson@backroomleeds.com (2FA enabled)';
    RAISE NOTICE '  ✓ michael.chen@backroomleeds.com (2FA pending)';
    RAISE NOTICE '  ✗ sarah.williams@backroomleeds.com (inactive)';
    RAISE NOTICE '';
    RAISE NOTICE 'Door Staff (4 total, 3 active):';
    RAISE NOTICE '  ✓ james.brown@backroomleeds.com (2FA enabled)';
    RAISE NOTICE '  ✓ lisa.martinez@backroomleeds.com (new, must change password)';
    RAISE NOTICE '  ✓ tom.wilson@backroomleeds.com (part-time)';
    RAISE NOTICE '  ⚠ locked.account@backroomleeds.com (locked for testing)';
    RAISE NOTICE '';
    RAISE NOTICE 'All test accounts password: TestPass123!';
    RAISE NOTICE '';
    RAISE NOTICE 'Active Sessions: 2';
    RAISE NOTICE 'Login Attempts Logged: 7';
    RAISE NOTICE 'Activity Log Entries: 11';
    RAISE NOTICE '';
    RAISE NOTICE '==============================================';
END $$;