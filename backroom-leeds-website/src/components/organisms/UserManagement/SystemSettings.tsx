/**
 * SystemSettings.tsx
 * Super Admin User Management - System Settings Component
 * The Backroom Leeds
 */

import { useState } from 'react';
import { Button, Heading, Text } from '@/components/atoms';
import { FormField } from '@/components/molecules';

interface SystemSettingsProps {
  settings: SystemSettingsData;
  onSave: (settings: SystemSettingsData) => void;
  loading?: boolean;
}

export interface SystemSettingsData {
  // Password Policy
  passwordMinLength: number;
  passwordRequireUppercase: boolean;
  passwordRequireLowercase: boolean;
  passwordRequireNumbers: boolean;
  passwordRequireSpecialChars: boolean;
  passwordHistoryCount: number;
  passwordExpiryDays: number;
  
  // Session Management
  sessionDurationHours: number;
  rememberMeDurationDays: number;
  inactivityTimeoutMinutes: number;
  maxConcurrentSessions: number;
  
  // Rate Limiting
  maxLoginAttempts: number;
  lockoutDurationMinutes: number;
  rateLimitWindowMinutes: number;
  
  // 2FA Settings
  require2FAForAllUsers: boolean;
  totpWindowSize: number;
  backupCodeCount: number;
  backupCodeExpiryDays: number;
  
  // Security
  enableSuspiciousActivityDetection: boolean;
  logRetentionDays: number;
  enableGeoBlocking: boolean;
  allowedCountries: string[];
  
  // Notifications
  notifyOnFailedLogins: boolean;
  notifyOnAccountLockout: boolean;
  notifyOnSuspiciousActivity: boolean;
  securityEmailRecipients: string[];
}

export function SystemSettings({
  settings,
  onSave,
  loading = false
}: SystemSettingsProps) {
  const [formData, setFormData] = useState<SystemSettingsData>(settings);
  const [activeTab, setActiveTab] = useState<'password' | 'session' | 'security' | 'notifications'>('password');
  const [hasChanges, setHasChanges] = useState(false);

  const handleFieldChange = (field: keyof SystemSettingsData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setHasChanges(true);
  };

  const handleSave = () => {
    onSave(formData);
    setHasChanges(false);
  };

  const handleReset = () => {
    setFormData(settings);
    setHasChanges(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <Heading level={2} className="text-2xl font-bebas text-speakeasy-gold mb-2">
            System Settings
          </Heading>
          <Text className="text-speakeasy-champagne/80">
            Configure security policies, session management, and system behavior
          </Text>
        </div>
        
        {hasChanges && (
          <div className="flex gap-3">
            <Button
              variant="secondary"
              onClick={handleReset}
              disabled={loading}
              size="sm"
            >
              Reset Changes
            </Button>
            <Button
              variant="primary"
              onClick={handleSave}
              disabled={loading}
              size="sm"
            >
              {loading ? 'Saving...' : 'Save Settings'}
            </Button>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-speakeasy-noir/30 rounded-lg p-1">
        {[
          { key: 'password', label: 'Password Policy' },
          { key: 'session', label: 'Session Management' },
          { key: 'security', label: 'Security & 2FA' },
          { key: 'notifications', label: 'Notifications' }
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as any)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === tab.key
                ? 'bg-speakeasy-gold/20 text-speakeasy-gold'
                : 'text-speakeasy-champagne/60 hover:text-speakeasy-champagne hover:bg-speakeasy-gold/10'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="bg-speakeasy-burgundy/20 rounded-lg p-6 border border-speakeasy-gold/20">
        {activeTab === 'password' && (
          <div className="space-y-6">
            <Heading level={3} className="text-xl font-bebas text-speakeasy-gold">
              Password Policy Configuration
            </Heading>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                label="Minimum Password Length"
                type="number"
                value={formData.passwordMinLength.toString()}
                onChange={(value) => handleFieldChange('passwordMinLength', parseInt(value))}
                min={8}
                max={128}
                helpText="Minimum number of characters required (8-128)"
              />
              
              <FormField
                label="Password History Count"
                type="number"
                value={formData.passwordHistoryCount.toString()}
                onChange={(value) => handleFieldChange('passwordHistoryCount', parseInt(value))}
                min={1}
                max={50}
                helpText="Number of previous passwords to remember (1-50)"
              />
              
              <FormField
                label="Password Expiry (Days)"
                type="number"
                value={formData.passwordExpiryDays.toString()}
                onChange={(value) => handleFieldChange('passwordExpiryDays', parseInt(value))}
                min={0}
                max={365}
                helpText="Days until password expires (0 = never)"
              />
            </div>
            
            <div className="space-y-4">
              <Text className="text-speakeasy-champagne font-medium">
                Password Complexity Requirements
              </Text>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { key: 'passwordRequireUppercase', label: 'Require Uppercase Letters (A-Z)' },
                  { key: 'passwordRequireLowercase', label: 'Require Lowercase Letters (a-z)' },
                  { key: 'passwordRequireNumbers', label: 'Require Numbers (0-9)' },
                  { key: 'passwordRequireSpecialChars', label: 'Require Special Characters' }
                ].map(({ key, label }) => (
                  <div key={key} className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id={key}
                      checked={formData[key as keyof SystemSettingsData] as boolean}
                      onChange={(e) => handleFieldChange(key as keyof SystemSettingsData, e.target.checked)}
                      className="w-4 h-4 text-speakeasy-gold rounded focus:ring-speakeasy-gold"
                    />
                    <label htmlFor={key} className="text-sm text-speakeasy-champagne">
                      {label}
                    </label>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'session' && (
          <div className="space-y-6">
            <Heading level={3} className="text-xl font-bebas text-speakeasy-gold">
              Session Management Configuration
            </Heading>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                label="Session Duration (Hours)"
                type="number"
                value={formData.sessionDurationHours.toString()}
                onChange={(value) => handleFieldChange('sessionDurationHours', parseInt(value))}
                min={1}
                max={168}
                helpText="Default session duration (1-168 hours)"
              />
              
              <FormField
                label="Remember Me Duration (Days)"
                type="number"
                value={formData.rememberMeDurationDays.toString()}
                onChange={(value) => handleFieldChange('rememberMeDurationDays', parseInt(value))}
                min={1}
                max={365}
                helpText="Remember me session duration (1-365 days)"
              />
              
              <FormField
                label="Inactivity Timeout (Minutes)"
                type="number"
                value={formData.inactivityTimeoutMinutes.toString()}
                onChange={(value) => handleFieldChange('inactivityTimeoutMinutes', parseInt(value))}
                min={5}
                max={480}
                helpText="Automatic logout after inactivity (5-480 minutes)"
              />
              
              <FormField
                label="Max Concurrent Sessions"
                type="number"
                value={formData.maxConcurrentSessions.toString()}
                onChange={(value) => handleFieldChange('maxConcurrentSessions', parseInt(value))}
                min={1}
                max={10}
                helpText="Maximum active sessions per user (1-10)"
              />
            </div>
            
            <div className="space-y-4">
              <Text className="text-speakeasy-champagne font-medium">
                Rate Limiting Configuration
              </Text>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <FormField
                  label="Max Login Attempts"
                  type="number"
                  value={formData.maxLoginAttempts.toString()}
                  onChange={(value) => handleFieldChange('maxLoginAttempts', parseInt(value))}
                  min={3}
                  max={20}
                  helpText="Maximum attempts before lockout"
                />
                
                <FormField
                  label="Lockout Duration (Minutes)"
                  type="number"
                  value={formData.lockoutDurationMinutes.toString()}
                  onChange={(value) => handleFieldChange('lockoutDurationMinutes', parseInt(value))}
                  min={5}
                  max={1440}
                  helpText="Account lockout duration"
                />
                
                <FormField
                  label="Rate Limit Window (Minutes)"
                  type="number"
                  value={formData.rateLimitWindowMinutes.toString()}
                  onChange={(value) => handleFieldChange('rateLimitWindowMinutes', parseInt(value))}
                  min={1}
                  max={60}
                  helpText="Time window for attempt counting"
                />
              </div>
            </div>
          </div>
        )}

        {activeTab === 'security' && (
          <div className="space-y-6">
            <Heading level={3} className="text-xl font-bebas text-speakeasy-gold">
              Security & Two-Factor Authentication
            </Heading>
            
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="require2FAForAllUsers"
                  checked={formData.require2FAForAllUsers}
                  onChange={(e) => handleFieldChange('require2FAForAllUsers', e.target.checked)}
                  className="w-4 h-4 text-speakeasy-gold rounded focus:ring-speakeasy-gold"
                />
                <label htmlFor="require2FAForAllUsers" className="text-speakeasy-champagne">
                  Require 2FA for all users
                </label>
              </div>
              
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="enableSuspiciousActivityDetection"
                  checked={formData.enableSuspiciousActivityDetection}
                  onChange={(e) => handleFieldChange('enableSuspiciousActivityDetection', e.target.checked)}
                  className="w-4 h-4 text-speakeasy-gold rounded focus:ring-speakeasy-gold"
                />
                <label htmlFor="enableSuspiciousActivityDetection" className="text-speakeasy-champagne">
                  Enable suspicious activity detection
                </label>
              </div>
              
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="enableGeoBlocking"
                  checked={formData.enableGeoBlocking}
                  onChange={(e) => handleFieldChange('enableGeoBlocking', e.target.checked)}
                  className="w-4 h-4 text-speakeasy-gold rounded focus:ring-speakeasy-gold"
                />
                <label htmlFor="enableGeoBlocking" className="text-speakeasy-champagne">
                  Enable geographical blocking
                </label>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                label="TOTP Window Size"
                type="number"
                value={formData.totpWindowSize.toString()}
                onChange={(value) => handleFieldChange('totpWindowSize', parseInt(value))}
                min={0}
                max={5}
                helpText="Time window tolerance for TOTP codes (0-5 periods)"
              />
              
              <FormField
                label="Backup Code Count"
                type="number"
                value={formData.backupCodeCount.toString()}
                onChange={(value) => handleFieldChange('backupCodeCount', parseInt(value))}
                min={5}
                max={20}
                helpText="Number of backup codes to generate (5-20)"
              />
              
              <FormField
                label="Backup Code Expiry (Days)"
                type="number"
                value={formData.backupCodeExpiryDays.toString()}
                onChange={(value) => handleFieldChange('backupCodeExpiryDays', parseInt(value))}
                min={30}
                max={730}
                helpText="Days until backup codes expire (30-730)"
              />
              
              <FormField
                label="Log Retention (Days)"
                type="number"
                value={formData.logRetentionDays.toString()}
                onChange={(value) => handleFieldChange('logRetentionDays', parseInt(value))}
                min={30}
                max={2555}
                helpText="Days to retain audit logs (30-2555)"
              />
            </div>
            
            {formData.enableGeoBlocking && (
              <div>
                <label className="block text-sm font-medium text-speakeasy-champagne mb-2">
                  Allowed Countries (comma-separated country codes)
                </label>
                <textarea
                  value={formData.allowedCountries.join(', ')}
                  onChange={(e) => handleFieldChange('allowedCountries', e.target.value.split(',').map(c => c.trim()))}
                  className="w-full px-3 py-2 bg-speakeasy-noir/50 border border-speakeasy-gold/20 rounded text-speakeasy-champagne focus:outline-none focus:border-speakeasy-gold"
                  rows={3}
                  placeholder="GB, US, CA, AU"
                />
                <Text className="text-speakeasy-champagne/60 text-xs mt-1">
                  ISO 3166-1 alpha-2 country codes (e.g., GB, US, CA)
                </Text>
              </div>
            )}
          </div>
        )}

        {activeTab === 'notifications' && (
          <div className="space-y-6">
            <Heading level={3} className="text-xl font-bebas text-speakeasy-gold">
              Security Notifications
            </Heading>
            
            <div className="space-y-4">
              <Text className="text-speakeasy-champagne font-medium">
                Email Notification Settings
              </Text>
              
              <div className="space-y-3">
                {[
                  { key: 'notifyOnFailedLogins', label: 'Failed login attempts' },
                  { key: 'notifyOnAccountLockout', label: 'Account lockouts' },
                  { key: 'notifyOnSuspiciousActivity', label: 'Suspicious activity detection' }
                ].map(({ key, label }) => (
                  <div key={key} className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id={key}
                      checked={formData[key as keyof SystemSettingsData] as boolean}
                      onChange={(e) => handleFieldChange(key as keyof SystemSettingsData, e.target.checked)}
                      className="w-4 h-4 text-speakeasy-gold rounded focus:ring-speakeasy-gold"
                    />
                    <label htmlFor={key} className="text-sm text-speakeasy-champagne">
                      Send notifications for {label}
                    </label>
                  </div>
                ))}
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-speakeasy-champagne mb-2">
                Security Email Recipients
              </label>
              <textarea
                value={formData.securityEmailRecipients.join('\n')}
                onChange={(e) => handleFieldChange('securityEmailRecipients', e.target.value.split('\n').filter(email => email.trim()))}
                className="w-full px-3 py-2 bg-speakeasy-noir/50 border border-speakeasy-gold/20 rounded text-speakeasy-champagne focus:outline-none focus:border-speakeasy-gold"
                rows={4}
                placeholder="security@backroomleeds.com\nadmin@backroomleeds.com"
              />
              <Text className="text-speakeasy-champagne/60 text-xs mt-1">
                One email address per line. These recipients will receive security alerts.
              </Text>
            </div>
          </div>
        )}
      </div>

      {/* Save confirmation */}
      {hasChanges && (
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 bg-amber-500/20 rounded-full flex items-center justify-center flex-shrink-0">
              <svg className="w-4 h-4 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <div>
              <Text className="text-amber-400 font-medium">
                Unsaved Changes
              </Text>
              <Text className="text-speakeasy-champagne/80 text-sm">
                You have unsaved configuration changes. Make sure to save your settings before leaving this page.
              </Text>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}