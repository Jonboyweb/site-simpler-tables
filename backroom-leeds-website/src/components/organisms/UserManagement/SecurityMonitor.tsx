/**
 * SecurityMonitor.tsx
 * Super Admin User Management - Security Monitoring Component
 * The Backroom Leeds
 */

import { useState, useEffect } from 'react';
import { Button, Heading, Text } from '@/components/atoms';
import { 
  AdminLoginAttempt, 
  AdminActivityLog, 
  LoginAttemptResult,
  ActivityAction 
} from '@/types/authentication.types';
import { formatDistanceToNow } from 'date-fns';

interface SecurityMonitorProps {
  loginAttempts: AdminLoginAttempt[];
  activityLogs: AdminActivityLog[];
  loading?: boolean;
  onRefresh: () => void;
  onLockAccount: (email: string) => void;
  onUnlockAccount: (userId: string) => void;
}

interface SecurityMetrics {
  totalAttempts: number;
  failedAttempts: number;
  successfulLogins: number;
  suspiciousActivity: number;
  lockedAccounts: number;
  uniqueIPs: number;
}

export function SecurityMonitor({
  loginAttempts,
  activityLogs,
  loading = false,
  onRefresh,
  onLockAccount,
  onUnlockAccount
}: SecurityMonitorProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'attempts' | 'activity'>('overview');
  const [timeFilter, setTimeFilter] = useState<'1h' | '24h' | '7d' | '30d'>('24h');
  const [metrics, setMetrics] = useState<SecurityMetrics>({
    totalAttempts: 0,
    failedAttempts: 0,
    successfulLogins: 0,
    suspiciousActivity: 0,
    lockedAccounts: 0,
    uniqueIPs: 0
  });

  // Calculate security metrics
  useEffect(() => {
    const now = new Date();
    const timeThresholds = {
      '1h': 1 * 60 * 60 * 1000,
      '24h': 24 * 60 * 60 * 1000,
      '7d': 7 * 24 * 60 * 60 * 1000,
      '30d': 30 * 24 * 60 * 60 * 1000
    };
    
    const threshold = now.getTime() - timeThresholds[timeFilter];
    const recentAttempts = loginAttempts.filter(
      attempt => new Date(attempt.attempted_at).getTime() > threshold
    );
    
    const uniqueIPs = new Set(recentAttempts.map(attempt => attempt.ip_address));
    const suspiciousAttempts = recentAttempts.filter(
      attempt => attempt.suspicious_indicators && Object.keys(attempt.suspicious_indicators).length > 0
    );
    
    setMetrics({
      totalAttempts: recentAttempts.length,
      failedAttempts: recentAttempts.filter(a => a.result !== LoginAttemptResult.SUCCESS).length,
      successfulLogins: recentAttempts.filter(a => a.result === LoginAttemptResult.SUCCESS).length,
      suspiciousActivity: suspiciousAttempts.length,
      lockedAccounts: recentAttempts.filter(a => a.result === LoginAttemptResult.ACCOUNT_LOCKED).length,
      uniqueIPs: uniqueIPs.size
    });
  }, [loginAttempts, timeFilter]);

  const getResultIcon = (result: LoginAttemptResult) => {
    switch (result) {
      case LoginAttemptResult.SUCCESS:
        return <span className="text-green-400">✓</span>;
      case LoginAttemptResult.INVALID_CREDENTIALS:
        return <span className="text-red-400">✗</span>;
      case LoginAttemptResult.ACCOUNT_LOCKED:
        return <span className="text-orange-400">🔒</span>;
      case LoginAttemptResult.TOTP_INVALID:
        return <span className="text-purple-400">🔑</span>;
      default:
        return <span className="text-gray-400">?</span>;
    }
  };

  const getActionIcon = (action: ActivityAction) => {
    switch (action) {
      case ActivityAction.LOGIN:
        return <span className="text-green-400">➤</span>;
      case ActivityAction.LOGOUT:
        return <span className="text-blue-400">➤</span>;
      case ActivityAction.USER_CREATED:
        return <span className="text-green-400">+</span>;
      case ActivityAction.USER_MODIFIED:
        return <span className="text-yellow-400">✎</span>;
      case ActivityAction.USER_DELETED:
        return <span className="text-red-400">✗</span>;
      case ActivityAction.ROLE_CHANGED:
        return <span className="text-purple-400">🔄</span>;
      case ActivityAction.ACCOUNT_LOCKED:
        return <span className="text-red-400">🔒</span>;
      default:
        return <span className="text-gray-400">•</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <Heading level={2} className="text-2xl font-bebas text-speakeasy-gold mb-2">
            Security Monitor
          </Heading>
          <Text className="text-speakeasy-champagne/80">
            Monitor login attempts, user activity, and security events
          </Text>
        </div>
        
        <div className="flex gap-3">
          <select
            value={timeFilter}
            onChange={(e) => setTimeFilter(e.target.value as any)}
            className="px-3 py-2 bg-speakeasy-noir/50 border border-speakeasy-gold/20 rounded text-speakeasy-champagne focus:outline-none focus:border-speakeasy-gold text-sm"
          >
            <option value="1h">Last Hour</option>
            <option value="24h">Last 24 Hours</option>
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
          </select>
          
          <Button
            variant="secondary"
            onClick={onRefresh}
            disabled={loading}
            size="sm"
          >
            {loading ? 'Refreshing...' : 'Refresh'}
          </Button>
        </div>
      </div>

      {/* Security Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <div className="bg-speakeasy-burgundy/20 rounded-lg p-4 border border-speakeasy-gold/20">
          <div className="text-2xl font-bebas text-speakeasy-gold mb-1">
            {metrics.totalAttempts}
          </div>
          <Text className="text-speakeasy-champagne/80 text-sm">Total Attempts</Text>
        </div>
        
        <div className="bg-speakeasy-burgundy/20 rounded-lg p-4 border border-green-500/20">
          <div className="text-2xl font-bebas text-green-400 mb-1">
            {metrics.successfulLogins}
          </div>
          <Text className="text-speakeasy-champagne/80 text-sm">Successful</Text>
        </div>
        
        <div className="bg-speakeasy-burgundy/20 rounded-lg p-4 border border-red-500/20">
          <div className="text-2xl font-bebas text-red-400 mb-1">
            {metrics.failedAttempts}
          </div>
          <Text className="text-speakeasy-champagne/80 text-sm">Failed</Text>
        </div>
        
        <div className="bg-speakeasy-burgundy/20 rounded-lg p-4 border border-amber-500/20">
          <div className="text-2xl font-bebas text-amber-400 mb-1">
            {metrics.suspiciousActivity}
          </div>
          <Text className="text-speakeasy-champagne/80 text-sm">Suspicious</Text>
        </div>
        
        <div className="bg-speakeasy-burgundy/20 rounded-lg p-4 border border-orange-500/20">
          <div className="text-2xl font-bebas text-orange-400 mb-1">
            {metrics.lockedAccounts}
          </div>
          <Text className="text-speakeasy-champagne/80 text-sm">Locked</Text>
        </div>
        
        <div className="bg-speakeasy-burgundy/20 rounded-lg p-4 border border-blue-500/20">
          <div className="text-2xl font-bebas text-blue-400 mb-1">
            {metrics.uniqueIPs}
          </div>
          <Text className="text-speakeasy-champagne/80 text-sm">Unique IPs</Text>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-speakeasy-noir/30 rounded-lg p-1">
        {[
          { key: 'overview', label: 'Overview' },
          { key: 'attempts', label: 'Login Attempts' },
          { key: 'activity', label: 'Activity Log' }
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
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Failures */}
          <div className="bg-speakeasy-burgundy/20 rounded-lg p-6 border border-speakeasy-gold/20">
            <Heading level={3} className="text-lg font-bebas text-speakeasy-gold mb-4">
              Recent Failed Attempts
            </Heading>
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {loginAttempts
                .filter(attempt => attempt.result !== LoginAttemptResult.SUCCESS)
                .slice(0, 10)
                .map((attempt) => (
                  <div key={attempt.id} className="flex items-center justify-between p-3 bg-speakeasy-noir/30 rounded border border-speakeasy-gold/10">
                    <div className="flex items-center gap-3">
                      {getResultIcon(attempt.result)}
                      <div>
                        <Text className="text-speakeasy-champagne text-sm font-medium">
                          {attempt.email}
                        </Text>
                        <Text className="text-speakeasy-champagne/60 text-xs">
                          {attempt.ip_address} • {formatDistanceToNow(new Date(attempt.attempted_at), { addSuffix: true })}
                        </Text>
                      </div>
                    </div>
                    {attempt.suspicious_indicators && Object.keys(attempt.suspicious_indicators).length > 0 && (
                      <span className="px-2 py-1 bg-red-500/20 text-red-400 rounded text-xs">
                        Suspicious
                      </span>
                    )}
                  </div>
                ))
              }
              {loginAttempts.filter(attempt => attempt.result !== LoginAttemptResult.SUCCESS).length === 0 && (
                <Text className="text-speakeasy-champagne/60 text-sm text-center py-4">
                  No recent failed attempts
                </Text>
              )}
            </div>
          </div>

          {/* Suspicious Activity */}
          <div className="bg-speakeasy-burgundy/20 rounded-lg p-6 border border-speakeasy-gold/20">
            <Heading level={3} className="text-lg font-bebas text-speakeasy-gold mb-4">
              Suspicious Activity
            </Heading>
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {loginAttempts
                .filter(attempt => attempt.suspicious_indicators && Object.keys(attempt.suspicious_indicators).length > 0)
                .slice(0, 10)
                .map((attempt) => (
                  <div key={attempt.id} className="p-3 bg-amber-500/10 rounded border border-amber-500/20">
                    <div className="flex items-center justify-between mb-2">
                      <Text className="text-amber-400 text-sm font-medium">
                        {attempt.email}
                      </Text>
                      <Text className="text-speakeasy-champagne/60 text-xs">
                        {formatDistanceToNow(new Date(attempt.attempted_at), { addSuffix: true })}
                      </Text>
                    </div>
                    <Text className="text-speakeasy-champagne/60 text-xs mb-2">
                      {attempt.ip_address}
                    </Text>
                    <div className="flex gap-2 flex-wrap">
                      {Object.entries(attempt.suspicious_indicators || {}).map(([key, value]) => (
                        <span key={key} className="px-2 py-1 bg-red-500/20 text-red-400 rounded text-xs">
                          {key}: {String(value)}
                        </span>
                      ))}
                    </div>
                  </div>
                ))
              }
              {loginAttempts.filter(attempt => attempt.suspicious_indicators && Object.keys(attempt.suspicious_indicators).length > 0).length === 0 && (
                <Text className="text-speakeasy-champagne/60 text-sm text-center py-4">
                  No suspicious activity detected
                </Text>
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'attempts' && (
        <div className="bg-speakeasy-burgundy/20 rounded-lg border border-speakeasy-gold/20 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-speakeasy-noir/30">
                <tr>
                  <th className="text-left p-4 text-speakeasy-gold font-bebas">Time</th>
                  <th className="text-left p-4 text-speakeasy-gold font-bebas">Email</th>
                  <th className="text-left p-4 text-speakeasy-gold font-bebas">IP Address</th>
                  <th className="text-left p-4 text-speakeasy-gold font-bebas">Result</th>
                  <th className="text-left p-4 text-speakeasy-gold font-bebas">Details</th>
                </tr>
              </thead>
              <tbody>
                {loginAttempts.slice(0, 50).map((attempt) => (
                  <tr key={attempt.id} className="border-b border-speakeasy-gold/10 hover:bg-speakeasy-noir/20">
                    <td className="p-4">
                      <Text className="text-speakeasy-champagne/80 text-sm">
                        {formatDistanceToNow(new Date(attempt.attempted_at), { addSuffix: true })}
                      </Text>
                    </td>
                    <td className="p-4">
                      <Text className="text-speakeasy-champagne text-sm">
                        {attempt.email}
                      </Text>
                    </td>
                    <td className="p-4">
                      <Text className="text-speakeasy-champagne/80 text-sm font-mono">
                        {attempt.ip_address}
                      </Text>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        {getResultIcon(attempt.result)}
                        <span className={`text-sm ${
                          attempt.result === LoginAttemptResult.SUCCESS ? 'text-green-400' :
                          attempt.result === LoginAttemptResult.ACCOUNT_LOCKED ? 'text-orange-400' :
                          'text-red-400'
                        }`}>
                          {attempt.result.replace('_', ' ').toUpperCase()}
                        </span>
                      </div>
                    </td>
                    <td className="p-4">
                      {attempt.failed_reason && (
                        <Text className="text-speakeasy-champagne/60 text-xs">
                          {attempt.failed_reason}
                        </Text>
                      )}
                      {attempt.suspicious_indicators && Object.keys(attempt.suspicious_indicators).length > 0 && (
                        <span className="inline-block mt-1 px-2 py-1 bg-red-500/20 text-red-400 rounded text-xs">
                          Suspicious
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'activity' && (
        <div className="bg-speakeasy-burgundy/20 rounded-lg border border-speakeasy-gold/20 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-speakeasy-noir/30">
                <tr>
                  <th className="text-left p-4 text-speakeasy-gold font-bebas">Time</th>
                  <th className="text-left p-4 text-speakeasy-gold font-bebas">User</th>
                  <th className="text-left p-4 text-speakeasy-gold font-bebas">Action</th>
                  <th className="text-left p-4 text-speakeasy-gold font-bebas">Entity</th>
                  <th className="text-left p-4 text-speakeasy-gold font-bebas">IP Address</th>
                </tr>
              </thead>
              <tbody>
                {activityLogs.slice(0, 50).map((log) => (
                  <tr key={log.id} className="border-b border-speakeasy-gold/10 hover:bg-speakeasy-noir/20">
                    <td className="p-4">
                      <Text className="text-speakeasy-champagne/80 text-sm">
                        {formatDistanceToNow(new Date(log.created_at), { addSuffix: true })}
                      </Text>
                    </td>
                    <td className="p-4">
                      <div>
                        <Text className="text-speakeasy-champagne text-sm">
                          {log.user_email || 'System'}
                        </Text>
                        {log.user_role && (
                          <Text className="text-speakeasy-champagne/60 text-xs">
                            {log.user_role.replace('_', ' ').toUpperCase()}
                          </Text>
                        )}
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        {getActionIcon(log.action)}
                        <Text className="text-speakeasy-champagne text-sm">
                          {log.action.replace('_', ' ').toUpperCase()}
                        </Text>
                      </div>
                    </td>
                    <td className="p-4">
                      {log.entity_type && (
                        <Text className="text-speakeasy-champagne/80 text-sm">
                          {log.entity_type}: {log.entity_id?.substring(0, 8) || 'N/A'}
                        </Text>
                      )}
                    </td>
                    <td className="p-4">
                      <Text className="text-speakeasy-champagne/80 text-sm font-mono">
                        {log.ip_address || 'N/A'}
                      </Text>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}