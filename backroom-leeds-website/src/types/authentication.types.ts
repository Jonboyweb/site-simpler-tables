/**
 * Authentication System Type Definitions
 * The Backroom Leeds - Admin Authentication Infrastructure
 * 
 * These types match the PostgreSQL schema defined in the authentication migrations
 * and provide type safety for all authentication-related operations.
 */

// ============================================================================
// ENUMS
// ============================================================================

/**
 * Admin role hierarchy with strict enforcement
 * - super_admin: Full system access + user management (max 1 user)
 * - manager: Full access except user management (max 10 users)
 * - door_staff: Bookings view & check-in only (max 10 users)
 */
export enum AdminRole {
  SUPER_ADMIN = 'super_admin',
  MANAGER = 'manager',
  DOOR_STAFF = 'door_staff'
}

/**
 * Session status tracking
 */
export enum SessionStatus {
  ACTIVE = 'active',
  EXPIRED = 'expired',
  REVOKED = 'revoked',
  LOCKED = 'locked'
}

/**
 * Activity action types for audit logging
 */
export enum ActivityAction {
  LOGIN = 'login',
  LOGOUT = 'logout',
  LOGIN_FAILED = 'login_failed',
  PASSWORD_CHANGE = 'password_change',
  TOTP_ENABLED = 'totp_enabled',
  TOTP_DISABLED = 'totp_disabled',
  TOTP_VERIFIED = 'totp_verified',
  BACKUP_CODE_USED = 'backup_code_used',
  BOOKING_CREATED = 'booking_created',
  BOOKING_MODIFIED = 'booking_modified',
  BOOKING_CANCELLED = 'booking_cancelled',
  BOOKING_CHECKIN = 'booking_checkin',
  USER_CREATED = 'user_created',
  USER_MODIFIED = 'user_modified',
  USER_DELETED = 'user_deleted',
  ROLE_CHANGED = 'role_changed',
  SESSION_EXPIRED = 'session_expired',
  SESSION_REVOKED = 'session_revoked',
  ACCOUNT_LOCKED = 'account_locked',
  ACCOUNT_UNLOCKED = 'account_unlocked'
}

/**
 * Login attempt results
 */
export enum LoginAttemptResult {
  SUCCESS = 'success',
  INVALID_CREDENTIALS = 'invalid_credentials',
  ACCOUNT_LOCKED = 'account_locked',
  ACCOUNT_DISABLED = 'account_disabled',
  TOTP_REQUIRED = 'totp_required',
  TOTP_INVALID = 'totp_invalid',
  SESSION_EXPIRED = 'session_expired'
}

// ============================================================================
// DATABASE TABLES
// ============================================================================

/**
 * Admin user account
 */
export interface AdminUser {
  id: string;
  email: string;
  username: string;
  full_name: string;
  password_hash: string;
  role: AdminRole;
  
  // 2FA Configuration
  totp_enabled: boolean;
  totp_verified_at: Date | null;
  require_2fa: boolean;
  
  // Account Security
  is_active: boolean;
  email_verified: boolean;
  email_verified_at: Date | null;
  
  // Password Management
  password_changed_at: Date;
  password_expires_at: Date;
  must_change_password: boolean;
  
  // Login Security
  failed_login_attempts: number;
  last_failed_login_at: Date | null;
  locked_until: Date | null;
  locked_reason: string | null;
  
  // Session Management
  last_login_at: Date | null;
  last_login_ip: string | null;
  last_activity_at: Date | null;
  
  // Metadata
  created_by: string | null;
  created_at: Date;
  updated_at: Date;
  deleted_at: Date | null;
}

/**
 * Admin session
 */
export interface AdminSession {
  id: string;
  session_token: string;
  user_id: string;
  
  // Session Security
  status: SessionStatus;
  totp_verified: boolean;
  totp_verified_at: Date | null;
  
  // Session Metadata
  ip_address: string;
  user_agent: string | null;
  device_fingerprint: Record<string, any> | null;
  
  // Session Lifecycle
  created_at: Date;
  expires_at: Date;
  last_activity_at: Date;
  revoked_at: Date | null;
  revoked_by: string | null;
  revoke_reason: string | null;
}

/**
 * TOTP secret configuration (encrypted)
 */
export interface AdminTOTPSecret {
  id: string;
  user_id: string;
  
  // Encrypted TOTP Secret
  encrypted_secret: string;
  encryption_iv: string;
  
  // TOTP Configuration
  issuer: string;
  algorithm: string;
  digits: number;
  period: number;
  
  // Recovery
  recovery_email: string | null;
  
  // Metadata
  created_at: Date;
  last_used_at: Date | null;
  last_used_token: string | null;
  
  // Security
  verified: boolean;
  verified_at: Date | null;
  attempts_since_success: number;
}

/**
 * Backup recovery code
 */
export interface AdminBackupCode {
  id: string;
  user_id: string;
  code_hash: string;
  
  // Usage Tracking
  used: boolean;
  used_at: Date | null;
  used_ip: string | null;
  
  // Metadata
  created_at: Date;
  expires_at: Date;
}

/**
 * Login attempt record
 */
export interface AdminLoginAttempt {
  id: string;
  
  // Attempt Identification
  email: string;
  user_id: string | null;
  
  // Attempt Details
  ip_address: string;
  user_agent: string | null;
  result: LoginAttemptResult;
  
  // Security Details
  failed_reason: string | null;
  suspicious_indicators: {
    vpn?: boolean;
    tor?: boolean;
    country?: string;
    [key: string]: any;
  } | null;
  
  // Metadata
  attempted_at: Date;
}

/**
 * Activity log entry
 */
export interface AdminActivityLog {
  id: string;
  
  // Actor Information
  user_id: string | null;
  user_email: string | null;
  user_role: AdminRole | null;
  
  // Action Details
  action: ActivityAction;
  entity_type: string | null;
  entity_id: string | null;
  
  // Change Tracking
  old_values: Record<string, any> | null;
  new_values: Record<string, any> | null;
  metadata: Record<string, any> | null;
  
  // Request Information
  ip_address: string | null;
  user_agent: string | null;
  session_id: string | null;
  
  // Timestamp
  created_at: Date;
}

/**
 * Password history record
 */
export interface AdminPasswordHistory {
  id: string;
  user_id: string;
  password_hash: string;
  created_at: Date;
}

// ============================================================================
// PERMISSION SYSTEM
// ============================================================================

/**
 * Permission definitions
 */
export type Permission = 
  // Booking permissions
  | 'bookings:read'
  | 'bookings:create'
  | 'bookings:update'
  | 'bookings:delete'
  | 'bookings:checkin'
  
  // Event permissions
  | 'events:read'
  | 'events:create'
  | 'events:update'
  | 'events:delete'
  
  // User management permissions
  | 'users:read'
  | 'users:create'
  | 'users:update'
  | 'users:delete'
  | 'users:manage_roles'
  
  // Report permissions
  | 'reports:read'
  | 'reports:create'
  | 'reports:export'
  
  // Floor plan permissions
  | 'floor_plan:read'
  | 'floor_plan:manage'
  
  // System permissions
  | 'system:manage'
  | 'system:view_logs'
  | 'system:manage_settings';

/**
 * Role-based permission mapping
 */
export const ROLE_PERMISSIONS: Record<AdminRole, Permission[]> = {
  [AdminRole.SUPER_ADMIN]: [
    // All permissions
    'bookings:read', 'bookings:create', 'bookings:update', 'bookings:delete', 'bookings:checkin',
    'events:read', 'events:create', 'events:update', 'events:delete',
    'users:read', 'users:create', 'users:update', 'users:delete', 'users:manage_roles',
    'reports:read', 'reports:create', 'reports:export',
    'floor_plan:read', 'floor_plan:manage',
    'system:manage', 'system:view_logs', 'system:manage_settings'
  ],
  [AdminRole.MANAGER]: [
    'bookings:read', 'bookings:create', 'bookings:update', 'bookings:delete', 'bookings:checkin',
    'events:read', 'events:create', 'events:update', 'events:delete',
    'reports:read', 'reports:create', 'reports:export',
    'floor_plan:read'
  ],
  [AdminRole.DOOR_STAFF]: [
    'bookings:read', 'bookings:checkin',
    'floor_plan:read'
  ]
};

// ============================================================================
// HELPER TYPES
// ============================================================================

/**
 * Login request payload
 */
export interface LoginRequest {
  email: string;
  password: string;
  totp_code?: string;
  backup_code?: string;
  remember_me?: boolean;
}

/**
 * Login response
 */
export interface LoginResponse {
  success: boolean;
  user?: Partial<AdminUser>;
  session?: {
    token: string;
    expires_at: Date;
  };
  requires_2fa?: boolean;
  error?: string;
}

/**
 * Session validation response
 */
export interface SessionValidation {
  valid: boolean;
  user?: Partial<AdminUser>;
  permissions?: Permission[];
  expires_at?: Date;
}

/**
 * 2FA setup response
 */
export interface TOTPSetupResponse {
  secret: string;
  qr_code: string;
  backup_codes: string[];
}

/**
 * Password change request
 */
export interface PasswordChangeRequest {
  current_password: string;
  new_password: string;
  confirm_password: string;
  totp_code?: string;
}

/**
 * User creation request
 */
export interface CreateUserRequest {
  email: string;
  username: string;
  full_name: string;
  password: string;
  role: AdminRole;
  require_2fa?: boolean;
}

/**
 * Rate limit status
 */
export interface RateLimitStatus {
  allowed: boolean;
  remaining_attempts: number;
  reset_at: Date;
  locked_until?: Date;
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Check if a user has a specific permission
 */
export function userHasPermission(
  role: AdminRole,
  permission: Permission
): boolean {
  return ROLE_PERMISSIONS[role].includes(permission);
}

/**
 * Get all permissions for a role
 */
export function getRolePermissions(role: AdminRole): Permission[] {
  return ROLE_PERMISSIONS[role];
}

/**
 * Check if a role can manage another role
 */
export function canManageRole(
  actorRole: AdminRole,
  targetRole: AdminRole
): boolean {
  // Only super admins can manage any role
  if (actorRole === AdminRole.SUPER_ADMIN) {
    return true;
  }
  
  // Managers can't manage any roles
  // Door staff can't manage any roles
  return false;
}

/**
 * Get role display name
 */
export function getRoleDisplayName(role: AdminRole): string {
  const displayNames: Record<AdminRole, string> = {
    [AdminRole.SUPER_ADMIN]: 'Super Administrator',
    [AdminRole.MANAGER]: 'Manager',
    [AdminRole.DOOR_STAFF]: 'Door Staff'
  };
  
  return displayNames[role];
}

/**
 * Get role limits
 */
export function getRoleLimits(): Record<AdminRole, number> {
  return {
    [AdminRole.SUPER_ADMIN]: 1,
    [AdminRole.MANAGER]: 10,
    [AdminRole.DOOR_STAFF]: 10
  };
}

/**
 * Password complexity requirements
 */
export const PASSWORD_REQUIREMENTS = {
  minLength: 8,
  requireUppercase: true,
  requireLowercase: true,
  requireNumbers: true,
  requireSpecialChars: true,
  specialChars: '!@#$%^&*()_+-=[]{};\':"|,.<>/?',
  preventReuse: 12 // Last 12 passwords
};

/**
 * Session configuration
 */
export const SESSION_CONFIG = {
  defaultDuration: 8 * 60 * 60 * 1000, // 8 hours in milliseconds
  rememberMeDuration: 30 * 24 * 60 * 60 * 1000, // 30 days in milliseconds
  inactivityTimeout: 30 * 60 * 1000, // 30 minutes in milliseconds
  maxConcurrentSessions: 3
};

/**
 * Rate limiting configuration
 */
export const RATE_LIMIT_CONFIG = {
  maxAttempts: 10, // Max attempts per window
  maxFailures: 5, // Max failures before lock
  windowDuration: 15 * 60 * 1000, // 15 minutes in milliseconds
  lockDuration: 30 * 60 * 1000, // 30 minutes in milliseconds
  progressiveDelay: true,
  delayMultiplier: 2 // Double delay after each failure
};

/**
 * TOTP configuration
 */
export const TOTP_CONFIG = {
  issuer: 'The Backroom Leeds',
  algorithm: 'SHA1',
  digits: 6,
  period: 30, // seconds
  window: 1, // Allow 1 period before/after
  backupCodeCount: 10,
  backupCodeLength: 8
};