/**
 * Authentication Database Helper Functions
 * The Backroom Leeds - Database utility functions for authentication operations
 * 
 * This module provides type-safe helper functions for interacting with
 * the authentication database schema.
 */

import { createClient } from '@supabase/supabase-js';
import * as argon2 from 'argon2';
import * as crypto from 'crypto';
import { authenticator } from 'otplib';
import type {
  AdminUser,
  AdminSession,
  AdminRole,
  LoginRequest,
  LoginResponse,
  SessionValidation,
  CreateUserRequest,
  RateLimitStatus,
  ActivityAction,
  LoginAttemptResult,
  Permission,
  ROLE_PERMISSIONS
} from '@/types/authentication.types';

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

// ============================================================================
// PASSWORD MANAGEMENT
// ============================================================================

/**
 * Hash a password using Argon2id
 */
export async function hashPassword(password: string): Promise<string> {
  return await argon2.hash(password, {
    type: argon2.argon2id,
    memoryCost: 65536, // 64 MB
    timeCost: 3,
    parallelism: 1,
    hashLength: 32,
    saltLength: 16
  });
}

/**
 * Verify a password against its hash
 */
export async function verifyPassword(
  hash: string,
  password: string
): Promise<boolean> {
  try {
    return await argon2.verify(hash, password);
  } catch (error) {
    console.error('Password verification error:', error);
    return false;
  }
}

/**
 * Validate password complexity requirements
 */
export function validatePasswordComplexity(password: string): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  
  if (password.length < 8) {
    errors.push('Password must be at least 8 characters');
  }
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }
  if (!/[0-9]/.test(password)) {
    errors.push('Password must contain at least one number');
  }
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    errors.push('Password must contain at least one special character');
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Check if password was previously used
 */
export async function checkPasswordHistory(
  userId: string,
  newPasswordHash: string
): Promise<boolean> {
  const { data, error } = await supabase.rpc('check_password_history', {
    p_user_id: userId,
    p_password_hash: newPasswordHash
  });
  
  if (error) {
    console.error('Password history check error:', error);
    return false;
  }
  
  return data as boolean;
}

// ============================================================================
// USER MANAGEMENT
// ============================================================================

/**
 * Create a new admin user
 */
export async function createAdminUser(
  request: CreateUserRequest,
  createdBy: string
): Promise<{ success: boolean; user?: AdminUser; error?: string }> {
  try {
    // Validate password complexity
    const passwordCheck = validatePasswordComplexity(request.password);
    if (!passwordCheck.valid) {
      return {
        success: false,
        error: passwordCheck.errors.join(', ')
      };
    }
    
    // Hash password
    const passwordHash = await hashPassword(request.password);
    
    // Create user
    const { data, error } = await supabase
      .from('admin_users')
      .insert({
        email: request.email.toLowerCase(),
        username: request.username.toLowerCase(),
        full_name: request.full_name,
        password_hash: passwordHash,
        role: request.role,
        require_2fa: request.require_2fa ?? true,
        created_by: createdBy,
        email_verified: false
      })
      .select()
      .single();
    
    if (error) {
      return {
        success: false,
        error: error.message
      };
    }
    
    // Log activity
    await logActivity({
      userId: createdBy,
      action: 'user_created' as ActivityAction,
      entityType: 'user',
      entityId: data.id,
      metadata: {
        created_user: request.email,
        role: request.role
      }
    });
    
    return {
      success: true,
      user: data as AdminUser
    };
  } catch (error) {
    console.error('Create user error:', error);
    return {
      success: false,
      error: 'Failed to create user'
    };
  }
}

/**
 * Get user by ID
 */
export async function getUserById(userId: string): Promise<AdminUser | null> {
  const { data, error } = await supabase
    .from('admin_users')
    .select('*')
    .eq('id', userId)
    .single();
  
  if (error) {
    console.error('Get user error:', error);
    return null;
  }
  
  return data as AdminUser;
}

/**
 * Get user by email
 */
export async function getUserByEmail(email: string): Promise<AdminUser | null> {
  const { data, error } = await supabase
    .from('admin_users')
    .select('*')
    .eq('email', email.toLowerCase())
    .single();
  
  if (error) {
    console.error('Get user by email error:', error);
    return null;
  }
  
  return data as AdminUser;
}

/**
 * Update user role
 */
export async function updateUserRole(
  userId: string,
  newRole: AdminRole,
  updatedBy: string
): Promise<boolean> {
  const { data: oldUser } = await supabase
    .from('admin_users')
    .select('role')
    .eq('id', userId)
    .single();
  
  const { error } = await supabase
    .from('admin_users')
    .update({ role: newRole })
    .eq('id', userId);
  
  if (!error) {
    await logActivity({
      userId: updatedBy,
      action: 'role_changed' as ActivityAction,
      entityType: 'user',
      entityId: userId,
      oldValues: { role: oldUser?.role },
      newValues: { role: newRole }
    });
  }
  
  return !error;
}

/**
 * Lock user account
 */
export async function lockUserAccount(
  userId: string,
  reason: string,
  duration: number = 30 // minutes
): Promise<boolean> {
  const lockedUntil = new Date();
  lockedUntil.setMinutes(lockedUntil.getMinutes() + duration);
  
  const { error } = await supabase
    .from('admin_users')
    .update({
      locked_until: lockedUntil.toISOString(),
      locked_reason: reason
    })
    .eq('id', userId);
  
  if (!error) {
    await logActivity({
      userId,
      action: 'account_locked' as ActivityAction,
      metadata: { reason, duration_minutes: duration }
    });
  }
  
  return !error;
}

// ============================================================================
// SESSION MANAGEMENT
// ============================================================================

/**
 * Create a new session
 */
export async function createSession(
  userId: string,
  ipAddress: string,
  userAgent: string,
  rememberMe: boolean = false
): Promise<{ token: string; expiresAt: Date } | null> {
  const token = crypto.randomBytes(32).toString('hex');
  const duration = rememberMe ? 30 * 24 * 60 : 8 * 60; // 30 days or 8 hours
  const expiresAt = new Date();
  expiresAt.setMinutes(expiresAt.getMinutes() + duration);
  
  const { data, error } = await supabase
    .from('admin_sessions')
    .insert({
      session_token: token,
      user_id: userId,
      ip_address: ipAddress,
      user_agent: userAgent,
      expires_at: expiresAt.toISOString(),
      status: 'active'
    })
    .select()
    .single();
  
  if (error) {
    console.error('Create session error:', error);
    return null;
  }
  
  return {
    token,
    expiresAt
  };
}

/**
 * Validate a session token
 */
export async function validateSession(token: string): Promise<SessionValidation> {
  const { data, error } = await supabase
    .from('admin_sessions')
    .select(`
      *,
      user:admin_users(*)
    `)
    .eq('session_token', token)
    .eq('status', 'active')
    .single();
  
  if (error || !data) {
    return { valid: false };
  }
  
  // Check if session is expired
  if (new Date(data.expires_at) < new Date()) {
    await expireSession(data.id);
    return { valid: false };
  }
  
  // Update last activity
  await updateSessionActivity(data.id);
  
  // Get user permissions
  const permissions = getRolePermissions(data.user.role);
  
  return {
    valid: true,
    user: data.user,
    permissions,
    expires_at: new Date(data.expires_at)
  };
}

/**
 * Update session activity timestamp
 */
export async function updateSessionActivity(sessionId: string): Promise<void> {
  await supabase
    .from('admin_sessions')
    .update({ last_activity_at: new Date().toISOString() })
    .eq('id', sessionId);
}

/**
 * Expire a session
 */
export async function expireSession(sessionId: string): Promise<void> {
  await supabase
    .from('admin_sessions')
    .update({ status: 'expired' })
    .eq('id', sessionId);
}

/**
 * Revoke a session
 */
export async function revokeSession(
  sessionId: string,
  revokedBy: string,
  reason: string = 'User logout'
): Promise<void> {
  await supabase
    .from('admin_sessions')
    .update({
      status: 'revoked',
      revoked_at: new Date().toISOString(),
      revoked_by: revokedBy,
      revoke_reason: reason
    })
    .eq('id', sessionId);
}

/**
 * Get active sessions for a user
 */
export async function getUserSessions(userId: string): Promise<AdminSession[]> {
  const { data, error } = await supabase
    .from('admin_sessions')
    .select('*')
    .eq('user_id', userId)
    .eq('status', 'active')
    .order('created_at', { ascending: false });
  
  if (error) {
    console.error('Get user sessions error:', error);
    return [];
  }
  
  return data as AdminSession[];
}

// ============================================================================
// TWO-FACTOR AUTHENTICATION
// ============================================================================

/**
 * Generate TOTP secret
 */
export function generateTOTPSecret(): string {
  return authenticator.generateSecret();
}

/**
 * Generate TOTP URI for QR code
 */
export function generateTOTPUri(
  secret: string,
  email: string,
  issuer: string = 'The Backroom Leeds'
): string {
  return authenticator.keyuri(email, issuer, secret);
}

/**
 * Verify TOTP code
 */
export function verifyTOTPCode(token: string, secret: string): boolean {
  return authenticator.verify({
    token,
    secret,
    window: 1 // Allow 1 period before/after
  });
}

/**
 * Encrypt TOTP secret for storage
 */
export function encryptTOTPSecret(secret: string): {
  encrypted: string;
  iv: string;
} {
  const algorithm = 'aes-256-gcm';
  const key = Buffer.from(process.env.TOTP_ENCRYPTION_KEY!, 'hex');
  const iv = crypto.randomBytes(16);
  
  const cipher = crypto.createCipheriv(algorithm, key, iv);
  let encrypted = cipher.update(secret, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  const authTag = cipher.getAuthTag();
  
  return {
    encrypted: encrypted + authTag.toString('hex'),
    iv: iv.toString('hex')
  };
}

/**
 * Decrypt TOTP secret
 */
export function decryptTOTPSecret(
  encrypted: string,
  iv: string
): string {
  const algorithm = 'aes-256-gcm';
  const key = Buffer.from(process.env.TOTP_ENCRYPTION_KEY!, 'hex');
  const ivBuffer = Buffer.from(iv, 'hex');
  
  // Extract auth tag (last 32 hex chars = 16 bytes)
  const authTag = Buffer.from(encrypted.slice(-32), 'hex');
  const encryptedData = encrypted.slice(0, -32);
  
  const decipher = crypto.createDecipheriv(algorithm, key, ivBuffer);
  decipher.setAuthTag(authTag);
  
  let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  
  return decrypted;
}

/**
 * Generate backup codes
 */
export async function generateBackupCodes(
  userId: string,
  count: number = 10
): Promise<string[]> {
  const codes: string[] = [];
  const hashedCodes: Array<{ user_id: string; code_hash: string }> = [];
  
  for (let i = 0; i < count; i++) {
    const code = crypto.randomBytes(4).toString('hex').toUpperCase();
    codes.push(code);
    
    const hash = await hashPassword(code);
    hashedCodes.push({
      user_id: userId,
      code_hash: hash
    });
  }
  
  // Store hashed codes in database
  await supabase.from('admin_backup_codes').insert(hashedCodes);
  
  return codes;
}

/**
 * Verify backup code
 */
export async function verifyBackupCode(
  userId: string,
  code: string
): Promise<boolean> {
  const { data: backupCodes } = await supabase
    .from('admin_backup_codes')
    .select('id, code_hash')
    .eq('user_id', userId)
    .eq('used', false);
  
  if (!backupCodes) return false;
  
  for (const backupCode of backupCodes) {
    if (await verifyPassword(backupCode.code_hash, code.toUpperCase())) {
      // Mark as used
      await supabase
        .from('admin_backup_codes')
        .update({
          used: true,
          used_at: new Date().toISOString()
        })
        .eq('id', backupCode.id);
      
      return true;
    }
  }
  
  return false;
}

// ============================================================================
// RATE LIMITING
// ============================================================================

/**
 * Check login rate limit
 */
export async function checkLoginRateLimit(
  email: string,
  ipAddress: string
): Promise<RateLimitStatus> {
  const { data, error } = await supabase.rpc('check_login_rate_limit', {
    p_email: email,
    p_ip_address: ipAddress
  });
  
  if (error) {
    console.error('Rate limit check error:', error);
    return {
      allowed: false,
      remaining_attempts: 0,
      reset_at: new Date(Date.now() + 15 * 60 * 1000) // 15 minutes
    };
  }
  
  const allowed = data as boolean;
  
  // Get recent attempts count
  const { count } = await supabase
    .from('admin_login_attempts')
    .select('*', { count: 'exact', head: true })
    .or(`email.eq.${email},ip_address.eq.${ipAddress}`)
    .gte('attempted_at', new Date(Date.now() - 15 * 60 * 1000).toISOString());
  
  return {
    allowed,
    remaining_attempts: Math.max(0, 10 - (count || 0)),
    reset_at: new Date(Date.now() + 15 * 60 * 1000)
  };
}

/**
 * Record login attempt
 */
export async function recordLoginAttempt(
  email: string,
  ipAddress: string,
  userAgent: string,
  result: LoginAttemptResult,
  failedReason?: string,
  userId?: string
): Promise<void> {
  await supabase.from('admin_login_attempts').insert({
    email: email.toLowerCase(),
    user_id: userId,
    ip_address: ipAddress,
    user_agent: userAgent,
    result,
    failed_reason: failedReason
  });
}

// ============================================================================
// ACTIVITY LOGGING
// ============================================================================

interface LogActivityParams {
  userId?: string;
  userEmail?: string;
  action: ActivityAction;
  entityType?: string;
  entityId?: string;
  oldValues?: any;
  newValues?: any;
  metadata?: any;
  ipAddress?: string;
  userAgent?: string;
  sessionId?: string;
}

/**
 * Log an activity to the audit trail
 */
export async function logActivity(params: LogActivityParams): Promise<void> {
  const { data: user } = params.userId
    ? await supabase
        .from('admin_users')
        .select('email, role')
        .eq('id', params.userId)
        .single()
    : { data: null };
  
  await supabase.from('admin_activity_log').insert({
    user_id: params.userId,
    user_email: params.userEmail || user?.email,
    user_role: user?.role,
    action: params.action,
    entity_type: params.entityType,
    entity_id: params.entityId,
    old_values: params.oldValues,
    new_values: params.newValues,
    metadata: params.metadata,
    ip_address: params.ipAddress,
    user_agent: params.userAgent,
    session_id: params.sessionId
  });
}

// ============================================================================
// AUTHENTICATION FLOW
// ============================================================================

/**
 * Authenticate user with email and password
 */
export async function authenticateUser(
  request: LoginRequest,
  ipAddress: string,
  userAgent: string
): Promise<LoginResponse> {
  try {
    // Check rate limiting
    const rateLimit = await checkLoginRateLimit(request.email, ipAddress);
    if (!rateLimit.allowed) {
      await recordLoginAttempt(
        request.email,
        ipAddress,
        userAgent,
        'account_locked' as LoginAttemptResult,
        'Rate limit exceeded'
      );
      
      return {
        success: false,
        error: `Too many login attempts. Please try again after ${rateLimit.reset_at.toLocaleTimeString()}`
      };
    }
    
    // Get user
    const user = await getUserByEmail(request.email);
    if (!user) {
      await recordLoginAttempt(
        request.email,
        ipAddress,
        userAgent,
        'invalid_credentials' as LoginAttemptResult,
        'User not found'
      );
      
      return {
        success: false,
        error: 'Invalid email or password'
      };
    }
    
    // Check if account is locked
    if (user.locked_until && new Date(user.locked_until) > new Date()) {
      await recordLoginAttempt(
        request.email,
        ipAddress,
        userAgent,
        'account_locked' as LoginAttemptResult,
        'Account is locked',
        user.id
      );
      
      return {
        success: false,
        error: `Account is locked until ${new Date(user.locked_until).toLocaleTimeString()}`
      };
    }
    
    // Check if account is active
    if (!user.is_active) {
      await recordLoginAttempt(
        request.email,
        ipAddress,
        userAgent,
        'account_disabled' as LoginAttemptResult,
        'Account is disabled',
        user.id
      );
      
      return {
        success: false,
        error: 'Account is disabled'
      };
    }
    
    // Verify password
    const validPassword = await verifyPassword(user.password_hash, request.password);
    if (!validPassword) {
      // Increment failed attempts
      await supabase
        .from('admin_users')
        .update({
          failed_login_attempts: user.failed_login_attempts + 1,
          last_failed_login_at: new Date().toISOString()
        })
        .eq('id', user.id);
      
      // Lock account if too many failures
      if (user.failed_login_attempts >= 4) {
        await lockUserAccount(user.id, 'Too many failed login attempts');
      }
      
      await recordLoginAttempt(
        request.email,
        ipAddress,
        userAgent,
        'invalid_credentials' as LoginAttemptResult,
        'Invalid password',
        user.id
      );
      
      return {
        success: false,
        error: 'Invalid email or password'
      };
    }
    
    // Check if 2FA is required
    if (user.totp_enabled && !request.totp_code && !request.backup_code) {
      return {
        success: false,
        requires_2fa: true,
        error: '2FA verification required'
      };
    }
    
    // Verify 2FA if provided
    if (user.totp_enabled) {
      let verified = false;
      
      if (request.totp_code) {
        // Get TOTP secret
        const { data: totpSecret } = await supabase
          .from('admin_totp_secrets')
          .select('encrypted_secret, encryption_iv')
          .eq('user_id', user.id)
          .single();
        
        if (totpSecret) {
          const secret = decryptTOTPSecret(
            totpSecret.encrypted_secret,
            totpSecret.encryption_iv
          );
          verified = verifyTOTPCode(request.totp_code, secret);
        }
      } else if (request.backup_code) {
        verified = await verifyBackupCode(user.id, request.backup_code);
      }
      
      if (!verified) {
        await recordLoginAttempt(
          request.email,
          ipAddress,
          userAgent,
          'totp_invalid' as LoginAttemptResult,
          'Invalid 2FA code',
          user.id
        );
        
        return {
          success: false,
          error: 'Invalid 2FA verification code'
        };
      }
    }
    
    // Create session
    const session = await createSession(
      user.id,
      ipAddress,
      userAgent,
      request.remember_me
    );
    
    if (!session) {
      return {
        success: false,
        error: 'Failed to create session'
      };
    }
    
    // Reset failed attempts
    await supabase
      .from('admin_users')
      .update({
        failed_login_attempts: 0,
        last_login_at: new Date().toISOString(),
        last_login_ip: ipAddress
      })
      .eq('id', user.id);
    
    // Record successful login
    await recordLoginAttempt(
      request.email,
      ipAddress,
      userAgent,
      'success' as LoginAttemptResult,
      undefined,
      user.id
    );
    
    // Log activity
    await logActivity({
      userId: user.id,
      action: 'login' as ActivityAction,
      metadata: {
        ip_address: ipAddress,
        user_agent: userAgent,
        remember_me: request.remember_me
      }
    });
    
    return {
      success: true,
      user: {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        role: user.role
      },
      session: {
        token: session.token,
        expires_at: session.expiresAt
      }
    };
  } catch (error) {
    console.error('Authentication error:', error);
    return {
      success: false,
      error: 'An error occurred during authentication'
    };
  }
}

/**
 * Logout user
 */
export async function logoutUser(
  sessionToken: string,
  userId: string,
  ipAddress?: string
): Promise<void> {
  const { data: session } = await supabase
    .from('admin_sessions')
    .select('id')
    .eq('session_token', sessionToken)
    .single();
  
  if (session) {
    await revokeSession(session.id, userId, 'User logout');
  }
  
  await logActivity({
    userId,
    action: 'logout' as ActivityAction,
    metadata: { ip_address: ipAddress }
  });
}

// ============================================================================
// PERMISSION HELPERS
// ============================================================================

/**
 * Get permissions for a role
 */
export function getRolePermissions(role: AdminRole): Permission[] {
  const permissions: Record<AdminRole, Permission[]> = {
    super_admin: [
      'bookings:read', 'bookings:create', 'bookings:update', 'bookings:delete', 'bookings:checkin',
      'events:read', 'events:create', 'events:update', 'events:delete',
      'users:read', 'users:create', 'users:update', 'users:delete', 'users:manage_roles',
      'reports:read', 'reports:create', 'reports:export',
      'floor_plan:read', 'floor_plan:manage',
      'system:manage', 'system:view_logs', 'system:manage_settings'
    ],
    manager: [
      'bookings:read', 'bookings:create', 'bookings:update', 'bookings:delete', 'bookings:checkin',
      'events:read', 'events:create', 'events:update', 'events:delete',
      'reports:read', 'reports:create', 'reports:export',
      'floor_plan:read'
    ],
    door_staff: [
      'bookings:read', 'bookings:checkin',
      'floor_plan:read'
    ]
  };
  
  return permissions[role] || [];
}

/**
 * Check if user has permission
 */
export function userHasPermission(
  role: AdminRole,
  permission: Permission
): boolean {
  const permissions = getRolePermissions(role);
  return permissions.includes(permission);
}

// ============================================================================
// MAINTENANCE FUNCTIONS
// ============================================================================

/**
 * Clean up expired sessions
 */
export async function cleanupExpiredSessions(): Promise<number> {
  const { data } = await supabase.rpc('cleanup_expired_sessions');
  return data as number;
}

/**
 * Perform authentication system maintenance
 */
export async function performMaintenanceTasks(): Promise<void> {
  await supabase.rpc('perform_authentication_maintenance');
}