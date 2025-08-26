/**
 * TwoFactorReset.tsx
 * Super Admin User Management - 2FA Reset Component
 * The Backroom Leeds
 */

import { useState } from 'react';
import { Button, Heading, Text } from '@/components/atoms';
import { AdminUser } from '@/types/authentication.types';

interface TwoFactorResetProps {
  user: AdminUser;
  onConfirm: () => void;
  onCancel: () => void;
  loading?: boolean;
}

export function TwoFactorReset({
  user,
  onConfirm,
  onCancel,
  loading = false
}: TwoFactorResetProps) {
  const [reason, setReason] = useState('');
  const [notifyUser, setNotifyUser] = useState(true);
  const [requireResetup, setRequireResetup] = useState(true);

  const handleConfirm = () => {
    onConfirm();
  };

  return (
    <div className="space-y-6">
      {/* Warning */}
      <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-lg">
        <div className="flex items-start gap-3">
          <div className="w-6 h-6 bg-amber-500/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
            <svg className="w-4 h-4 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <div>
            <Heading level={3} className="text-lg font-bebas text-amber-400 mb-2">
              Two-Factor Authentication Reset
            </Heading>
            <Text className="text-speakeasy-champagne/80 text-sm leading-relaxed">
              You are about to reset 2FA for <strong>{user.full_name}</strong> ({user.email}). This action will:
            </Text>
          </div>
        </div>
      </div>
      
      {/* Impact details */}
      <div className="space-y-4">
        <div className="bg-speakeasy-burgundy/20 rounded-lg p-4 border border-speakeasy-gold/20">
          <Heading level={4} className="text-base font-bebas text-speakeasy-gold mb-3">
            What will happen:
          </Heading>
          <ul className="text-speakeasy-champagne/80 text-sm space-y-2">
            <li className="flex items-start gap-2">
              <span className="text-red-400 mt-1">•</span>
              <span>Immediately disable current TOTP authentication</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-red-400 mt-1">•</span>
              <span>Delete existing TOTP secret and backup codes</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-red-400 mt-1">•</span>
              <span>Revoke all active sessions for this user</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-400 mt-1">•</span>
              <span>User will need to set up 2FA again on next login</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-400 mt-1">•</span>
              <span>All actions will be logged in the audit trail</span>
            </li>
          </ul>
        </div>
        
        {/* Reset reason */}
        <div>
          <label className="block text-sm font-medium text-speakeasy-champagne mb-2">
            Reason for Reset *
          </label>
          <select
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="w-full px-3 py-2 bg-speakeasy-noir/50 border border-speakeasy-gold/20 rounded text-speakeasy-champagne focus:outline-none focus:border-speakeasy-gold"
            required
          >
            <option value="">Select reason...</option>
            <option value="lost_device">User lost authenticator device</option>
            <option value="device_reset">User reset/replaced device</option>
            <option value="app_issues">Authenticator app issues</option>
            <option value="account_recovery">Account recovery request</option>
            <option value="security_incident">Security incident</option>
            <option value="admin_maintenance">Administrative maintenance</option>
            <option value="other">Other (will be logged)</option>
          </select>
        </div>
        
        {/* Options */}
        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <input
              type="checkbox"
              id="notifyUser"
              checked={notifyUser}
              onChange={(e) => setNotifyUser(e.target.checked)}
              className="w-4 h-4 text-speakeasy-gold rounded focus:ring-speakeasy-gold mt-0.5"
            />
            <div>
              <label htmlFor="notifyUser" className="text-sm font-medium text-speakeasy-champagne">
                Notify user via email
              </label>
              <Text className="text-speakeasy-champagne/60 text-xs mt-1">
                Send an email notification about the 2FA reset and next steps
              </Text>
            </div>
          </div>
          
          <div className="flex items-start gap-3">
            <input
              type="checkbox"
              id="requireResetup"
              checked={requireResetup}
              onChange={(e) => setRequireResetup(e.target.checked)}
              className="w-4 h-4 text-speakeasy-gold rounded focus:ring-speakeasy-gold mt-0.5"
            />
            <div>
              <label htmlFor="requireResetup" className="text-sm font-medium text-speakeasy-champagne">
                Require 2FA setup on next login
              </label>
              <Text className="text-speakeasy-champagne/60 text-xs mt-1">
                Force user to set up 2FA immediately on their next login attempt
              </Text>
            </div>
          </div>
        </div>
      </div>
      
      {/* User info reminder */}
      <div className="bg-speakeasy-noir/30 rounded-lg p-4 border border-speakeasy-gold/10">
        <Text className="text-speakeasy-champagne/80 text-sm">
          <strong>User Details:</strong> {user.full_name} ({user.email})<br />
          <strong>Current Status:</strong> {user.totp_enabled ? 'Enabled' : 'Disabled'}<br />
          <strong>Last Login:</strong> {user.last_login_at ? new Date(user.last_login_at).toLocaleString() : 'Never'}
        </Text>
      </div>
      
      {/* Actions */}
      <div className="flex gap-3 justify-end pt-4 border-t border-speakeasy-gold/20">
        <Button
          type="button"
          variant="secondary"
          onClick={onCancel}
          disabled={loading}
        >
          Cancel
        </Button>
        <Button
          type="button"
          variant="primary"
          onClick={handleConfirm}
          disabled={loading || !reason}
          className="bg-amber-600 hover:bg-amber-700 text-white"
        >
          {loading ? 'Resetting...' : 'Reset 2FA'}
        </Button>
      </div>
    </div>
  );
}