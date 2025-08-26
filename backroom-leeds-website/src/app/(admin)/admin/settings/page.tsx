import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { Heading, Text } from '@/components/atoms';
import { Card } from '@/components/molecules';

/**
 * Settings Management Page
 * Super Admin only access - manages system settings, configurations, and policies
 */
export default async function SettingsManagementPage() {
  const session = await getServerSession(authOptions);

  // Check authentication and role permissions
  if (!session?.user?.role || session.user.role !== 'super_admin') {
    redirect('/admin/dashboard?error=SuperAdminRequired');
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <Heading level={1} variant="bebas" className="text-speakeasy-gold mb-2">
            System Settings
          </Heading>
          <Text className="text-speakeasy-champagne/70">
            System configuration and administrative settings (Super Admin Only)
          </Text>
          <Text className="text-speakeasy-champagne/50 text-sm mt-1">
            Current User Role: {session.user.role}
          </Text>
        </div>
      </div>

      {/* System Configuration */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <Heading level={3} className="text-speakeasy-gold mb-4">
            Venue Configuration
          </Heading>
          <div className="space-y-4">
            <div className="space-y-2">
              <Text className="text-speakeasy-champagne font-medium">Operating Hours</Text>
              <div className="grid grid-cols-2 gap-2">
                <input 
                  type="time" 
                  defaultValue="19:00"
                  className="px-3 py-2 bg-speakeasy-noir border border-speakeasy-copper rounded-lg text-speakeasy-champagne focus:outline-none focus:border-speakeasy-gold"
                />
                <input 
                  type="time" 
                  defaultValue="03:00"
                  className="px-3 py-2 bg-speakeasy-noir border border-speakeasy-copper rounded-lg text-speakeasy-champagne focus:outline-none focus:border-speakeasy-gold"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Text className="text-speakeasy-champagne font-medium">Maximum Tables per Booking</Text>
              <input 
                type="number" 
                defaultValue="2"
                min="1" 
                max="5"
                className="w-full px-3 py-2 bg-speakeasy-noir border border-speakeasy-copper rounded-lg text-speakeasy-champagne focus:outline-none focus:border-speakeasy-gold"
              />
            </div>
            <div className="space-y-2">
              <Text className="text-speakeasy-champagne font-medium">Deposit Amount (£)</Text>
              <input 
                type="number" 
                defaultValue="50"
                min="0" 
                step="10"
                className="w-full px-3 py-2 bg-speakeasy-noir border border-speakeasy-copper rounded-lg text-speakeasy-champagne focus:outline-none focus:border-speakeasy-gold"
              />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <Heading level={3} className="text-speakeasy-gold mb-4">
            Booking Policies
          </Heading>
          <div className="space-y-4">
            <div className="space-y-2">
              <Text className="text-speakeasy-champagne font-medium">Cancellation Window (hours)</Text>
              <input 
                type="number" 
                defaultValue="48"
                min="1" 
                max="168"
                className="w-full px-3 py-2 bg-speakeasy-noir border border-speakeasy-copper rounded-lg text-speakeasy-champagne focus:outline-none focus:border-speakeasy-gold"
              />
            </div>
            <div className="space-y-2">
              <Text className="text-speakeasy-champagne font-medium">Advance Booking Limit (days)</Text>
              <input 
                type="number" 
                defaultValue="30"
                min="1" 
                max="90"
                className="w-full px-3 py-2 bg-speakeasy-noir border border-speakeasy-copper rounded-lg text-speakeasy-champagne focus:outline-none focus:border-speakeasy-gold"
              />
            </div>
            <div className="flex items-center space-x-3">
              <input 
                type="checkbox" 
                id="allowWaitlist"
                defaultChecked
                className="w-4 h-4 text-speakeasy-gold bg-speakeasy-noir border-speakeasy-copper rounded focus:ring-speakeasy-gold"
              />
              <label htmlFor="allowWaitlist" className="text-speakeasy-champagne">
                Enable Waitlist System
              </label>
            </div>
          </div>
        </Card>
      </div>

      {/* Security & Authentication */}
      <Card className="p-6">
        <Heading level={3} className="text-speakeasy-gold mb-4">
          Security & Authentication
        </Heading>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <input 
                type="checkbox" 
                id="require2FA"
                defaultChecked
                className="w-4 h-4 text-speakeasy-gold bg-speakeasy-noir border-speakeasy-copper rounded focus:ring-speakeasy-gold"
              />
              <label htmlFor="require2FA" className="text-speakeasy-champagne">
                Require 2FA for all admin users
              </label>
            </div>
            <div className="space-y-2">
              <Text className="text-speakeasy-champagne font-medium">Session Timeout (hours)</Text>
              <input 
                type="number" 
                defaultValue="8"
                min="1" 
                max="24"
                className="w-full px-3 py-2 bg-speakeasy-noir border border-speakeasy-copper rounded-lg text-speakeasy-champagne focus:outline-none focus:border-speakeasy-gold"
              />
            </div>
            <div className="space-y-2">
              <Text className="text-speakeasy-champagne font-medium">Max Failed Login Attempts</Text>
              <input 
                type="number" 
                defaultValue="5"
                min="3" 
                max="10"
                className="w-full px-3 py-2 bg-speakeasy-noir border border-speakeasy-copper rounded-lg text-speakeasy-champagne focus:outline-none focus:border-speakeasy-gold"
              />
            </div>
          </div>
          <div className="space-y-4">
            <div className="space-y-2">
              <Text className="text-speakeasy-champagne font-medium">Account Lock Duration (minutes)</Text>
              <input 
                type="number" 
                defaultValue="15"
                min="5" 
                max="60"
                className="w-full px-3 py-2 bg-speakeasy-noir border border-speakeasy-copper rounded-lg text-speakeasy-champagne focus:outline-none focus:border-speakeasy-gold"
              />
            </div>
            <div className="flex items-center space-x-3">
              <input 
                type="checkbox" 
                id="auditLogging"
                defaultChecked
                className="w-4 h-4 text-speakeasy-gold bg-speakeasy-noir border-speakeasy-copper rounded focus:ring-speakeasy-gold"
              />
              <label htmlFor="auditLogging" className="text-speakeasy-champagne">
                Enable comprehensive audit logging
              </label>
            </div>
            <div className="flex items-center space-x-3">
              <input 
                type="checkbox" 
                id="ipRestrictions"
                className="w-4 h-4 text-speakeasy-gold bg-speakeasy-noir border-speakeasy-copper rounded focus:ring-speakeasy-gold"
              />
              <label htmlFor="ipRestrictions" className="text-speakeasy-champagne">
                Enable IP address restrictions
              </label>
            </div>
          </div>
        </div>
      </Card>

      {/* Email & Notifications */}
      <Card className="p-6">
        <Heading level={3} className="text-speakeasy-gold mb-4">
          Email & Notifications
        </Heading>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Text className="text-speakeasy-champagne font-medium">SMTP Server</Text>
              <input 
                type="text" 
                placeholder="smtp.example.com"
                className="w-full px-3 py-2 bg-speakeasy-noir border border-speakeasy-copper rounded-lg text-speakeasy-champagne placeholder-speakeasy-champagne/50 focus:outline-none focus:border-speakeasy-gold"
              />
            </div>
            <div className="space-y-2">
              <Text className="text-speakeasy-champagne font-medium">From Email</Text>
              <input 
                type="email" 
                placeholder="bookings@thebackroomleeds.com"
                className="w-full px-3 py-2 bg-speakeasy-noir border border-speakeasy-copper rounded-lg text-speakeasy-champagne placeholder-speakeasy-champagne/50 focus:outline-none focus:border-speakeasy-gold"
              />
            </div>
            <div className="flex items-center space-x-3">
              <input 
                type="checkbox" 
                id="emailConfirmations"
                defaultChecked
                className="w-4 h-4 text-speakeasy-gold bg-speakeasy-noir border-speakeasy-copper rounded focus:ring-speakeasy-gold"
              />
              <label htmlFor="emailConfirmations" className="text-speakeasy-champagne">
                Send booking confirmations
              </label>
            </div>
          </div>
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <input 
                type="checkbox" 
                id="emailReminders"
                defaultChecked
                className="w-4 h-4 text-speakeasy-gold bg-speakeasy-noir border-speakeasy-copper rounded focus:ring-speakeasy-gold"
              />
              <label htmlFor="emailReminders" className="text-speakeasy-champagne">
                Send booking reminders
              </label>
            </div>
            <div className="flex items-center space-x-3">
              <input 
                type="checkbox" 
                id="adminNotifications"
                defaultChecked
                className="w-4 h-4 text-speakeasy-gold bg-speakeasy-noir border-speakeasy-copper rounded focus:ring-speakeasy-gold"
              />
              <label htmlFor="adminNotifications" className="text-speakeasy-champagne">
                Admin notification emails
              </label>
            </div>
            <div className="space-y-2">
              <Text className="text-speakeasy-champagne font-medium">Reminder Lead Time (hours)</Text>
              <input 
                type="number" 
                defaultValue="24"
                min="1" 
                max="72"
                className="w-full px-3 py-2 bg-speakeasy-noir border border-speakeasy-copper rounded-lg text-speakeasy-champagne focus:outline-none focus:border-speakeasy-gold"
              />
            </div>
          </div>
        </div>
      </Card>

      {/* Integration Settings */}
      <Card className="p-6">
        <Heading level={3} className="text-speakeasy-gold mb-4">
          Third-Party Integrations
        </Heading>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="space-y-4">
            <Text className="text-speakeasy-gold font-medium">Payment Processing</Text>
            <div className="space-y-2">
              <Text className="text-speakeasy-champagne/70 text-sm">Stripe Integration</Text>
              <input 
                type="password" 
                placeholder="sk_live_..."
                className="w-full px-3 py-2 bg-speakeasy-noir border border-speakeasy-copper rounded-lg text-speakeasy-champagne placeholder-speakeasy-champagne/50 focus:outline-none focus:border-speakeasy-gold"
              />
            </div>
            <div className="flex items-center space-x-3">
              <input 
                type="checkbox" 
                id="testMode"
                className="w-4 h-4 text-speakeasy-gold bg-speakeasy-noir border-speakeasy-copper rounded focus:ring-speakeasy-gold"
              />
              <label htmlFor="testMode" className="text-speakeasy-champagne text-sm">
                Test mode enabled
              </label>
            </div>
          </div>

          <div className="space-y-4">
            <Text className="text-speakeasy-gold font-medium">Analytics</Text>
            <div className="space-y-2">
              <Text className="text-speakeasy-champagne/70 text-sm">Google Analytics</Text>
              <input 
                type="text" 
                placeholder="GA-XXXXXXXXX-X"
                className="w-full px-3 py-2 bg-speakeasy-noir border border-speakeasy-copper rounded-lg text-speakeasy-champagne placeholder-speakeasy-champagne/50 focus:outline-none focus:border-speakeasy-gold"
              />
            </div>
            <div className="flex items-center space-x-3">
              <input 
                type="checkbox" 
                id="trackingEnabled"
                className="w-4 h-4 text-speakeasy-gold bg-speakeasy-noir border-speakeasy-copper rounded focus:ring-speakeasy-gold"
              />
              <label htmlFor="trackingEnabled" className="text-speakeasy-champagne text-sm">
                Enable tracking
              </label>
            </div>
          </div>

          <div className="space-y-4">
            <Text className="text-speakeasy-gold font-medium">External APIs</Text>
            <div className="space-y-2">
              <Text className="text-speakeasy-champagne/70 text-sm">Fatsoma Integration</Text>
              <input 
                type="password" 
                placeholder="API Key"
                className="w-full px-3 py-2 bg-speakeasy-noir border border-speakeasy-copper rounded-lg text-speakeasy-champagne placeholder-speakeasy-champagne/50 focus:outline-none focus:border-speakeasy-gold"
              />
            </div>
            <div className="flex items-center space-x-3">
              <input 
                type="checkbox" 
                id="apiEnabled"
                className="w-4 h-4 text-speakeasy-gold bg-speakeasy-noir border-speakeasy-copper rounded focus:ring-speakeasy-gold"
              />
              <label htmlFor="apiEnabled" className="text-speakeasy-champagne text-sm">
                API integration active
              </label>
            </div>
          </div>
        </div>
      </Card>

      {/* System Maintenance */}
      <Card className="p-6">
        <Heading level={3} className="text-speakeasy-gold mb-4">
          System Maintenance
        </Heading>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-4">
            <Text className="text-speakeasy-gold font-medium">Database Maintenance</Text>
            <div className="grid grid-cols-2 gap-3">
              <button className="px-4 py-2 bg-speakeasy-copper text-speakeasy-noir rounded-lg font-medium hover:bg-speakeasy-gold transition-colors">
                Backup Database
              </button>
              <button className="px-4 py-2 border border-speakeasy-copper text-speakeasy-copper rounded-lg font-medium hover:bg-speakeasy-copper hover:text-speakeasy-noir transition-colors">
                Optimize Tables
              </button>
              <button className="px-4 py-2 border border-speakeasy-burgundy text-speakeasy-burgundy rounded-lg font-medium hover:bg-speakeasy-burgundy hover:text-speakeasy-noir transition-colors">
                Clear Cache
              </button>
              <button className="px-4 py-2 border border-speakeasy-champagne text-speakeasy-champagne rounded-lg font-medium hover:bg-speakeasy-champagne hover:text-speakeasy-noir transition-colors">
                View Logs
              </button>
            </div>
          </div>

          <div className="space-y-4">
            <Text className="text-speakeasy-gold font-medium">System Status</Text>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-speakeasy-champagne/70">Database:</span>
                <span className="text-green-400">Connected</span>
              </div>
              <div className="flex justify-between">
                <span className="text-speakeasy-champagne/70">Email Service:</span>
                <span className="text-speakeasy-champagne/70">Not configured</span>
              </div>
              <div className="flex justify-between">
                <span className="text-speakeasy-champagne/70">Payment Gateway:</span>
                <span className="text-speakeasy-champagne/70">Not configured</span>
              </div>
              <div className="flex justify-between">
                <span className="text-speakeasy-champagne/70">Last Backup:</span>
                <span className="text-speakeasy-champagne/70">Never</span>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Save Settings */}
      <div className="flex justify-end space-x-4">
        <button className="px-6 py-3 border border-speakeasy-copper text-speakeasy-copper rounded-lg font-medium hover:bg-speakeasy-copper hover:text-speakeasy-noir transition-colors">
          Reset to Defaults
        </button>
        <button className="px-6 py-3 bg-speakeasy-gold text-speakeasy-noir rounded-lg font-medium hover:bg-speakeasy-champagne transition-colors">
          Save All Settings
        </button>
      </div>
    </div>
  );
}