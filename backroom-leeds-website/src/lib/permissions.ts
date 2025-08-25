import { createClient } from '@/lib/supabase/server';
import type { StaffPermissions } from '@/lib/auth';

export interface StaffUser {
  id: string;
  email: string;
  role: 'super_admin' | 'manager' | 'door_staff';
  is_active: boolean;
  totp_enabled: boolean;
  failed_login_attempts: number;
  locked_until?: Date | null;
  created_at: string;
  updated_at: string;
}

export interface PermissionCheck {
  hasPermission: boolean;
  reason?: string;
  requiredRole?: string[];
}

// Define all possible permissions
export enum Permission {
  // Staff Management
  MANAGE_STAFF = 'manage_staff',
  VIEW_STAFF = 'view_staff',
  CREATE_STAFF = 'create_staff',
  UPDATE_STAFF = 'update_staff',
  DELETE_STAFF = 'delete_staff',

  // Financial Management
  VIEW_FINANCIALS = 'view_financials',
  PROCESS_REFUNDS = 'process_refunds',
  VIEW_REPORTS = 'view_reports',
  EXPORT_FINANCIAL_DATA = 'export_financial_data',

  // Booking Management
  VIEW_BOOKINGS = 'view_bookings',
  CREATE_BOOKINGS = 'create_bookings',
  MODIFY_BOOKINGS = 'modify_bookings',
  CANCEL_BOOKINGS = 'cancel_bookings',
  CHECK_IN_CUSTOMERS = 'check_in_customers',

  // Event Management
  VIEW_EVENTS = 'view_events',
  MANAGE_EVENTS = 'manage_events',
  CREATE_EVENTS = 'create_events',
  UPDATE_EVENTS = 'update_events',
  DELETE_EVENTS = 'delete_events',

  // Customer Management
  VIEW_CUSTOMERS = 'view_customers',
  MANAGE_CUSTOMERS = 'manage_customers',
  EXPORT_CUSTOMER_DATA = 'export_customer_data',

  // System Settings
  MANAGE_SETTINGS = 'manage_settings',
  VIEW_SYSTEM_LOGS = 'view_system_logs',
  MANAGE_INTEGRATIONS = 'manage_integrations',

  // Reporting
  VIEW_BASIC_REPORTS = 'view_basic_reports',
  VIEW_DETAILED_REPORTS = 'view_detailed_reports',
  GENERATE_REPORTS = 'generate_reports',
  SCHEDULE_REPORTS = 'schedule_reports',
}

// Role-based permission mapping
export const ROLE_PERMISSIONS: Record<string, Permission[]> = {
  super_admin: [
    // All permissions
    ...Object.values(Permission),
  ],
  manager: [
    // Staff viewing (not management)
    Permission.VIEW_STAFF,

    // Full financial access
    Permission.VIEW_FINANCIALS,
    Permission.PROCESS_REFUNDS,
    Permission.VIEW_REPORTS,
    Permission.EXPORT_FINANCIAL_DATA,

    // Full booking management
    Permission.VIEW_BOOKINGS,
    Permission.CREATE_BOOKINGS,
    Permission.MODIFY_BOOKINGS,
    Permission.CANCEL_BOOKINGS,
    Permission.CHECK_IN_CUSTOMERS,

    // Full event management
    Permission.VIEW_EVENTS,
    Permission.MANAGE_EVENTS,
    Permission.CREATE_EVENTS,
    Permission.UPDATE_EVENTS,
    Permission.DELETE_EVENTS,

    // Full customer management
    Permission.VIEW_CUSTOMERS,
    Permission.MANAGE_CUSTOMERS,
    Permission.EXPORT_CUSTOMER_DATA,

    // Reporting
    Permission.VIEW_BASIC_REPORTS,
    Permission.VIEW_DETAILED_REPORTS,
    Permission.GENERATE_REPORTS,
    Permission.SCHEDULE_REPORTS,
  ],
  door_staff: [
    // Limited booking access
    Permission.VIEW_BOOKINGS,
    Permission.CHECK_IN_CUSTOMERS,

    // Basic customer viewing
    Permission.VIEW_CUSTOMERS,

    // Basic reporting
    Permission.VIEW_BASIC_REPORTS,
  ],
};

export class PermissionManager {
  private static instance: PermissionManager;
  private permissionCache: Map<string, { permissions: Permission[]; expiry: number }> = new Map();
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  static getInstance(): PermissionManager {
    if (!PermissionManager.instance) {
      PermissionManager.instance = new PermissionManager();
    }
    return PermissionManager.instance;
  }

  /**
   * Get permissions for a user role
   */
  getPermissionsForRole(role: string): Permission[] {
    return ROLE_PERMISSIONS[role] || [];
  }

  /**
   * Check if a role has a specific permission
   */
  hasPermission(role: string, permission: Permission): boolean {
    const permissions = this.getPermissionsForRole(role);
    return permissions.includes(permission);
  }

  /**
   * Check multiple permissions for a role
   */
  hasPermissions(role: string, permissions: Permission[]): boolean {
    const userPermissions = this.getPermissionsForRole(role);
    return permissions.every(permission => userPermissions.includes(permission));
  }

  /**
   * Check if role has any of the specified permissions
   */
  hasAnyPermission(role: string, permissions: Permission[]): boolean {
    const userPermissions = this.getPermissionsForRole(role);
    return permissions.some(permission => userPermissions.includes(permission));
  }

  /**
   * Get detailed permission check result
   */
  checkPermission(role: string, permission: Permission): PermissionCheck {
    const hasPermission = this.hasPermission(role, permission);
    
    if (!hasPermission) {
      const rolesWithPermission = Object.keys(ROLE_PERMISSIONS).filter(r => 
        ROLE_PERMISSIONS[r].includes(permission)
      );
      
      return {
        hasPermission: false,
        reason: `Permission '${permission}' requires one of the following roles: ${rolesWithPermission.join(', ')}`,
        requiredRole: rolesWithPermission,
      };
    }

    return { hasPermission: true };
  }

  /**
   * Get staff user from database with caching
   */
  async getStaffUser(userId: string): Promise<StaffUser | null> {
    const cacheKey = `staff_${userId}`;
    const cached = this.permissionCache.get(cacheKey);
    
    if (cached && cached.expiry > Date.now()) {
      return cached.permissions as any; // Type hack for cache
    }

    const supabase = createClient();
    const { data: staff, error } = await supabase
      .from('admin_users')
      .select('*')
      .eq('id', userId)
      .eq('is_active', true)
      .single();

    if (error || !staff) {
      return null;
    }

    // Cache the result
    this.permissionCache.set(cacheKey, {
      permissions: staff as any, // Type hack for cache
      expiry: Date.now() + this.CACHE_TTL,
    });

    return {
      id: staff.id,
      email: staff.email,
      role: staff.role as 'super_admin' | 'manager' | 'door_staff',
      is_active: staff.is_active,
      totp_enabled: staff.totp_enabled || false,
      failed_login_attempts: staff.failed_login_attempts || 0,
      locked_until: staff.locked_until ? new Date(staff.locked_until) : null,
      created_at: staff.created_at,
      updated_at: staff.updated_at,
    };
  }

  /**
   * Validate user access to specific resource
   */
  async validateResourceAccess(
    userId: string, 
    resourceType: string, 
    resourceId: string, 
    action: Permission
  ): Promise<PermissionCheck> {
    const user = await this.getStaffUser(userId);
    
    if (!user) {
      return {
        hasPermission: false,
        reason: 'User not found or inactive',
      };
    }

    const basePermissionCheck = this.checkPermission(user.role, action);
    if (!basePermissionCheck.hasPermission) {
      return basePermissionCheck;
    }

    // Additional resource-specific checks can be added here
    // For example, managers might only access their own reports
    switch (resourceType) {
      case 'booking':
        // All staff with booking permissions can access all bookings
        return { hasPermission: true };
      
      case 'staff':
        // Only super_admin can manage other staff
        if (action === Permission.MANAGE_STAFF && user.role !== 'super_admin') {
          return {
            hasPermission: false,
            reason: 'Only super administrators can manage staff accounts',
          };
        }
        return { hasPermission: true };
      
      case 'financial':
        // Only managers and super_admin can access financial data
        if (![Permission.VIEW_FINANCIALS, Permission.PROCESS_REFUNDS].some(p => 
            this.hasPermission(user.role, p))) {
          return {
            hasPermission: false,
            reason: 'Financial access requires manager role or higher',
          };
        }
        return { hasPermission: true };
      
      default:
        return { hasPermission: true };
    }
  }

  /**
   * Clear permission cache for a user
   */
  clearUserCache(userId: string): void {
    const cacheKey = `staff_${userId}`;
    this.permissionCache.delete(cacheKey);
  }

  /**
   * Clear all permission cache
   */
  clearAllCache(): void {
    this.permissionCache.clear();
  }
}

// Utility functions for easy access
export const permissionManager = PermissionManager.getInstance();

/**
 * Middleware helper to check permissions
 */
export async function requirePermission(
  userId: string, 
  permission: Permission
): Promise<PermissionCheck> {
  const user = await permissionManager.getStaffUser(userId);
  
  if (!user) {
    return {
      hasPermission: false,
      reason: 'User not found or inactive',
    };
  }

  return permissionManager.checkPermission(user.role, permission);
}

/**
 * Convert permissions to legacy format for backward compatibility
 */
export function convertToLegacyPermissions(role: string): StaffPermissions {
  const permissions = permissionManager.getPermissionsForRole(role);
  
  return {
    canManageStaff: permissions.includes(Permission.MANAGE_STAFF),
    canViewFinancials: permissions.includes(Permission.VIEW_FINANCIALS),
    canModifyBookings: permissions.includes(Permission.MODIFY_BOOKINGS),
    canCheckInCustomers: permissions.includes(Permission.CHECK_IN_CUSTOMERS),
    canManageEvents: permissions.includes(Permission.MANAGE_EVENTS),
    canViewReports: permissions.includes(Permission.VIEW_REPORTS),
    canProcessRefunds: permissions.includes(Permission.PROCESS_REFUNDS),
    canManageSettings: permissions.includes(Permission.MANAGE_SETTINGS),
  };
}