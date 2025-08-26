/**
 * AdminUsersPage.tsx
 * The Backroom Leeds - Super Admin User Management Dashboard
 * 
 * Comprehensive user management interface for Super Admin users only.
 * Includes CRUD operations, 2FA management, security monitoring, and system settings.
 */

'use client';

import { useState, useEffect } from 'react';
import type { Metadata } from 'next';
import { Heading, Text, Button } from '@/components/atoms';
import { Modal } from '@/components/molecules';
import { 
  UserList, 
  UserForm, 
  SecurityMonitor, 
  SystemSettings,
  type SystemSettingsData
} from '@/components/organisms/UserManagement';
import { 
  AdminUser, 
  AdminRole, 
  AdminLoginAttempt,
  AdminActivityLog,
  CreateUserRequest
} from '@/types/authentication.types';

// Mock data - In real implementation, this would come from API
const mockUsers: AdminUser[] = [
  {
    id: 'user-1',
    email: 'admin@backroomleeds.com',
    username: 'admin',
    full_name: 'Admin User',
    password_hash: '',
    role: AdminRole.SUPER_ADMIN,
    totp_enabled: true,
    totp_verified_at: new Date('2025-01-01'),
    require_2fa: true,
    is_active: true,
    email_verified: true,
    email_verified_at: new Date('2025-01-01'),
    password_changed_at: new Date('2025-01-01'),
    password_expires_at: new Date('2025-07-01'),
    must_change_password: false,
    failed_login_attempts: 0,
    last_failed_login_at: null,
    locked_until: null,
    locked_reason: null,
    last_login_at: new Date('2025-01-25T14:30:00Z'),
    last_login_ip: '192.168.1.100',
    last_activity_at: new Date('2025-01-25T14:30:00Z'),
    created_by: null,
    created_at: new Date('2025-01-01'),
    updated_at: new Date('2025-01-01'),
    deleted_at: null
  },
  {
    id: 'user-2',
    email: 'sarah.m@backroomleeds.com',
    username: 'sarah_manager',
    full_name: 'Sarah Manager',
    password_hash: '',
    role: AdminRole.MANAGER,
    totp_enabled: true,
    totp_verified_at: new Date('2025-01-10'),
    require_2fa: true,
    is_active: true,
    email_verified: true,
    email_verified_at: new Date('2025-01-10'),
    password_changed_at: new Date('2025-01-10'),
    password_expires_at: new Date('2025-07-10'),
    must_change_password: false,
    failed_login_attempts: 0,
    last_failed_login_at: null,
    locked_until: null,
    locked_reason: null,
    last_login_at: new Date('2025-01-25T12:15:00Z'),
    last_login_ip: '192.168.1.101',
    last_activity_at: new Date('2025-01-25T12:15:00Z'),
    created_by: 'user-1',
    created_at: new Date('2025-01-10'),
    updated_at: new Date('2025-01-10'),
    deleted_at: null
  }
];

const mockLoginAttempts: AdminLoginAttempt[] = [
  {
    id: 'attempt-1',
    email: 'test@example.com',
    user_id: null,
    ip_address: '203.0.113.45',
    user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    result: 'invalid_credentials' as any,
    failed_reason: 'Invalid password',
    suspicious_indicators: { vpn: true, country: 'Unknown' },
    attempted_at: new Date('2025-01-25T10:30:00Z')
  }
];

const mockActivityLogs: AdminActivityLog[] = [
  {
    id: 'log-1',
    user_id: 'user-1',
    user_email: 'admin@backroomleeds.com',
    user_role: AdminRole.SUPER_ADMIN,
    action: 'login' as any,
    entity_type: null,
    entity_id: null,
    old_values: null,
    new_values: null,
    metadata: { ip_address: '192.168.1.100' },
    ip_address: '192.168.1.100',
    user_agent: 'Mozilla/5.0 (macOS; Intel Mac OS X 10_15_7)',
    session_id: 'session-1',
    created_at: new Date('2025-01-25T14:30:00Z')
  }
];

const mockSystemSettings: SystemSettingsData = {
  passwordMinLength: 8,
  passwordRequireUppercase: true,
  passwordRequireLowercase: true,
  passwordRequireNumbers: true,
  passwordRequireSpecialChars: true,
  passwordHistoryCount: 12,
  passwordExpiryDays: 90,
  sessionDurationHours: 8,
  rememberMeDurationDays: 30,
  inactivityTimeoutMinutes: 30,
  maxConcurrentSessions: 3,
  maxLoginAttempts: 10,
  lockoutDurationMinutes: 30,
  rateLimitWindowMinutes: 15,
  require2FAForAllUsers: true,
  totpWindowSize: 1,
  backupCodeCount: 10,
  backupCodeExpiryDays: 365,
  enableSuspiciousActivityDetection: true,
  logRetentionDays: 730,
  enableGeoBlocking: false,
  allowedCountries: ['GB', 'US'],
  notifyOnFailedLogins: true,
  notifyOnAccountLockout: true,
  notifyOnSuspiciousActivity: true,
  securityEmailRecipients: ['security@backroomleeds.com']
};

export default function AdminUsersPage() {
  const [activeTab, setActiveTab] = useState<'users' | 'security' | 'settings'>('users');
  const [users, setUsers] = useState<AdminUser[]>(mockUsers);
  const [loginAttempts, setLoginAttempts] = useState<AdminLoginAttempt[]>(mockLoginAttempts);
  const [activityLogs, setActivityLogs] = useState<AdminActivityLog[]>(mockActivityLogs);
  const [systemSettings, setSystemSettings] = useState<SystemSettingsData>(mockSystemSettings);
  const [loading, setLoading] = useState(false);
  const [showCreateUser, setShowCreateUser] = useState(false);
  const [currentUserId] = useState('user-1'); // Would come from auth context
  
  // Calculate role counts
  const roleCounts = {
    [AdminRole.SUPER_ADMIN]: users.filter(u => u.role === AdminRole.SUPER_ADMIN && u.is_active).length,
    [AdminRole.MANAGER]: users.filter(u => u.role === AdminRole.MANAGER && u.is_active).length,
    [AdminRole.DOOR_STAFF]: users.filter(u => u.role === AdminRole.DOOR_STAFF && u.is_active).length
  };

  const handleCreateUser = async (userData: CreateUserRequest) => {
    setLoading(true);
    try {
      // In real implementation, would call API
      console.log('Creating user:', userData);
      
      // Mock user creation
      const newUser: AdminUser = {
        id: `user-${Date.now()}`,
        email: userData.email,
        username: userData.username,
        full_name: userData.full_name,
        password_hash: '',
        role: userData.role,
        totp_enabled: false,
        totp_verified_at: null,
        require_2fa: userData.require_2fa ?? true,
        is_active: true,
        email_verified: false,
        email_verified_at: null,
        password_changed_at: new Date(),
        password_expires_at: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
        must_change_password: true,
        failed_login_attempts: 0,
        last_failed_login_at: null,
        locked_until: null,
        locked_reason: null,
        last_login_at: null,
        last_login_ip: null,
        last_activity_at: null,
        created_by: currentUserId,
        created_at: new Date(),
        updated_at: new Date(),
        deleted_at: null
      };
      
      setUsers(prev => [...prev, newUser]);
      setShowCreateUser(false);
    } catch (error) {
      console.error('Error creating user:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEditUser = async (userData: AdminUser) => {
    setLoading(true);
    try {
      // In real implementation, would call API
      console.log('Updating user:', userData);
      
      setUsers(prev => 
        prev.map(user => 
          user.id === userData.id 
            ? { ...user, ...userData, updated_at: new Date() }
            : user
        )
      );
    } catch (error) {
      console.error('Error updating user:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    setLoading(true);
    try {
      // In real implementation, would call API
      console.log('Deleting user:', userId);
      
      setUsers(prev => 
        prev.map(user => 
          user.id === userId 
            ? { ...user, deleted_at: new Date(), is_active: false }
            : user
        )
      );
    } catch (error) {
      console.error('Error deleting user:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleResetTwoFA = async (userId: string) => {
    setLoading(true);
    try {
      // In real implementation, would call API
      console.log('Resetting 2FA for user:', userId);
      
      setUsers(prev => 
        prev.map(user => 
          user.id === userId 
            ? { ...user, totp_enabled: false, totp_verified_at: null, updated_at: new Date() }
            : user
        )
      );
    } catch (error) {
      console.error('Error resetting 2FA:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleUserStatus = async (userId: string, isActive: boolean) => {
    setLoading(true);
    try {
      // In real implementation, would call API
      console.log('Toggling user status:', userId, isActive);
      
      setUsers(prev => 
        prev.map(user => 
          user.id === userId 
            ? { ...user, is_active: isActive, updated_at: new Date() }
            : user
        )
      );
    } catch (error) {
      console.error('Error toggling user status:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefreshSecurity = () => {
    setLoading(true);
    setTimeout(() => {
      // In real implementation, would refetch data
      setLoading(false);
    }, 1000);
  };

  const handleSaveSystemSettings = async (settings: SystemSettingsData) => {
    setLoading(true);
    try {
      // In real implementation, would call API
      console.log('Saving system settings:', settings);
      setSystemSettings(settings);
    } catch (error) {
      console.error('Error saving system settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLockAccount = async (email: string) => {
    console.log('Locking account:', email);
    // Implementation would call API to lock account
  };

  const handleUnlockAccount = async (userId: string) => {
    console.log('Unlocking account:', userId);
    // Implementation would call API to unlock account
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <Heading level={1} className="text-4xl font-bebas text-speakeasy-gold mb-2">
            User Management
          </Heading>
          <Text className="text-speakeasy-champagne/80">
            Manage admin users, roles, security, and system settings (Super Admin only)
          </Text>
        </div>
        
        <div className="flex gap-3">
          {activeTab === 'users' && (
            <>
              <Button 
                variant="secondary"
                size="sm"
                onClick={() => console.log('Export users')}
              >
                Export Users
              </Button>
              <Button 
                variant="primary"
                size="sm"
                onClick={() => setShowCreateUser(true)}
              >
                Add User
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Role Limits Overview - Always shown */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-speakeasy-burgundy/20 rounded-lg p-6 border border-speakeasy-gold/20">
          <div className="flex items-center justify-between mb-2">
            <Heading level={3} className="text-lg font-bebas text-speakeasy-gold">
              Super Admin
            </Heading>
            <span className="px-2 py-1 bg-speakeasy-gold/20 text-speakeasy-gold rounded text-xs">
              Max 1
            </span>
          </div>
          <Text className="text-speakeasy-champagne/80 text-sm mb-3">
            Full system access + user management
          </Text>
          <div className="flex justify-between items-center">
            <Text className="text-speakeasy-champagne">Active: {roleCounts.super_admin}</Text>
            <Text className="text-speakeasy-gold font-bebas">
              {1 - roleCounts.super_admin} left
            </Text>
          </div>
        </div>

        <div className="bg-speakeasy-burgundy/20 rounded-lg p-6 border border-speakeasy-gold/20">
          <div className="flex items-center justify-between mb-2">
            <Heading level={3} className="text-lg font-bebas text-speakeasy-gold">
              Managers
            </Heading>
            <span className="px-2 py-1 bg-speakeasy-copper/20 text-speakeasy-copper rounded text-xs">
              Max 10
            </span>
          </div>
          <Text className="text-speakeasy-champagne/80 text-sm mb-3">
            Bookings, events, reports access
          </Text>
          <div className="flex justify-between items-center">
            <Text className="text-speakeasy-champagne">Active: {roleCounts.manager}</Text>
            <Text className="text-speakeasy-copper font-bebas">
              {10 - roleCounts.manager} left
            </Text>
          </div>
        </div>

        <div className="bg-speakeasy-burgundy/20 rounded-lg p-6 border border-speakeasy-gold/20">
          <div className="flex items-center justify-between mb-2">
            <Heading level={3} className="text-lg font-bebas text-speakeasy-gold">
              Door Staff
            </Heading>
            <span className="px-2 py-1 bg-speakeasy-champagne/20 text-speakeasy-champagne rounded text-xs">
              Max 10
            </span>
          </div>
          <Text className="text-speakeasy-champagne/80 text-sm mb-3">
            Check-in and bookings view only
          </Text>
          <div className="flex justify-between items-center">
            <Text className="text-speakeasy-champagne">Active: {roleCounts.door_staff}</Text>
            <Text className="text-speakeasy-champagne font-bebas">
              {10 - roleCounts.door_staff} left
            </Text>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex gap-1 bg-speakeasy-noir/30 rounded-lg p-1">
        {[
          { key: 'users', label: 'User Management', icon: '👥' },
          { key: 'security', label: 'Security Monitor', icon: '🔒' },
          { key: 'settings', label: 'System Settings', icon: '⚙️' }
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as any)}
            className={`flex items-center gap-2 px-4 py-3 rounded-md text-sm font-medium transition-colors ${
              activeTab === tab.key
                ? 'bg-speakeasy-gold/20 text-speakeasy-gold'
                : 'text-speakeasy-champagne/60 hover:text-speakeasy-champagne hover:bg-speakeasy-gold/10'
            }`}
          >
            <span>{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'users' && (
        <UserList
          users={users.filter(u => !u.deleted_at)}
          currentUserId={currentUserId}
          onEditUser={handleEditUser}
          onDeleteUser={handleDeleteUser}
          onResetTwoFA={handleResetTwoFA}
          onToggleUserStatus={handleToggleUserStatus}
          roleCounts={roleCounts}
          loading={loading}
        />
      )}

      {activeTab === 'security' && (
        <SecurityMonitor
          loginAttempts={loginAttempts}
          activityLogs={activityLogs}
          loading={loading}
          onRefresh={handleRefreshSecurity}
          onLockAccount={handleLockAccount}
          onUnlockAccount={handleUnlockAccount}
        />
      )}

      {activeTab === 'settings' && (
        <SystemSettings
          settings={systemSettings}
          onSave={handleSaveSystemSettings}
          loading={loading}
        />
      )}

      {/* Create User Modal */}
      <Modal 
        isOpen={showCreateUser} 
        onClose={() => setShowCreateUser(false)}
        title="Create New User"
        size="lg"
      >
        <UserForm
          onSave={handleCreateUser}
          onCancel={() => setShowCreateUser(false)}
          mode="create"
          roleCounts={roleCounts}
          loading={loading}
        />
      </Modal>
    </div>
  );
}