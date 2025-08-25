import type { Metadata } from 'next';
import { Heading, Text, Button } from '@/components/atoms';

export const metadata: Metadata = {
  title: 'User Management | The Backroom Leeds Admin',
  description: 'Manage admin users, roles, and permissions (Super Admin only)',
  robots: {
    index: false,
    follow: false,
  },
};

export default function AdminUsersPage() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <Heading level={1} className="text-4xl font-bebas text-speakeasy-gold mb-2">
            User Management
          </Heading>
          <Text className="text-speakeasy-champagne/80">
            Manage admin users, roles, and 2FA settings (Super Admin only)
          </Text>
        </div>
        <div className="flex gap-3">
          <Button variant="primary">
            Add User
          </Button>
          <Button variant="secondary">
            Export Users
          </Button>
        </div>
      </div>

      {/* Role Limits Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-speakeasy-burgundy/20 rounded-lg p-6 border border-speakeasy-gold/20">
          <div className="flex items-center justify-between mb-2">
            <Heading level={3} className="text-lg font-bebas text-speakeasy-gold">
              Super Admin
            </Heading>
            <span className="px-2 py-1 bg-speakeasy-gold/20 text-speakeasy-gold rounded text-xs">
              Unlimited
            </span>
          </div>
          <Text className="text-speakeasy-champagne/80 text-sm mb-3">
            Full system access + user management
          </Text>
          <div className="flex justify-between items-center">
            <Text className="text-speakeasy-champagne">Active: 1</Text>
            <Text className="text-speakeasy-gold font-bebas">∞</Text>
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
            <Text className="text-speakeasy-champagne">Active: 3</Text>
            <Text className="text-speakeasy-copper font-bebas">7 left</Text>
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
            <Text className="text-speakeasy-champagne">Active: 5</Text>
            <Text className="text-speakeasy-champagne font-bebas">5 left</Text>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-speakeasy-burgundy/20 rounded-lg border border-speakeasy-gold/20 overflow-hidden">
        <div className="p-6 border-b border-speakeasy-gold/20">
          <Heading level={2} className="text-xl font-bebas text-speakeasy-gold">
            Admin Users
          </Heading>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-speakeasy-noir/30">
              <tr>
                <th className="text-left p-4 text-speakeasy-gold font-bebas">User</th>
                <th className="text-left p-4 text-speakeasy-gold font-bebas">Role</th>
                <th className="text-left p-4 text-speakeasy-gold font-bebas">2FA Status</th>
                <th className="text-left p-4 text-speakeasy-gold font-bebas">Last Login</th>
                <th className="text-left p-4 text-speakeasy-gold font-bebas">Status</th>
                <th className="text-left p-4 text-speakeasy-gold font-bebas">Actions</th>
              </tr>
            </thead>
            <tbody>
              {/* Sample user entries */}
              {[
                { name: 'Admin User', email: 'admin@backroomleeds.co.uk', role: 'super_admin', twoFA: true, lastLogin: '2025-01-25 14:30', status: 'active' },
                { name: 'Sarah Manager', email: 'sarah.m@backroomleeds.co.uk', role: 'manager', twoFA: true, lastLogin: '2025-01-25 12:15', status: 'active' },
                { name: 'Mike Manager', email: 'mike.m@backroomleeds.co.uk', role: 'manager', twoFA: true, lastLogin: '2025-01-24 18:45', status: 'active' },
                { name: 'Emma Staff', email: 'emma.s@backroomleeds.co.uk', role: 'door_staff', twoFA: false, lastLogin: '2025-01-23 22:00', status: 'inactive' },
                { name: 'John Staff', email: 'john.s@backroomleeds.co.uk', role: 'door_staff', twoFA: true, lastLogin: '2025-01-25 10:30', status: 'active' },
              ].map((user, i) => (
                <tr key={i} className="border-b border-speakeasy-gold/10 hover:bg-speakeasy-noir/20">
                  <td className="p-4">
                    <div>
                      <Text className="text-speakeasy-champagne">{user.name}</Text>
                      <Text className="text-speakeasy-champagne/60 text-xs">{user.email}</Text>
                    </div>
                  </td>
                  <td className="p-4">
                    <span className={`inline-block px-2 py-1 rounded text-xs ${
                      user.role === 'super_admin' ? 'bg-speakeasy-gold/20 text-speakeasy-gold' :
                      user.role === 'manager' ? 'bg-speakeasy-copper/20 text-speakeasy-copper' :
                      'bg-speakeasy-champagne/20 text-speakeasy-champagne'
                    }`}>
                      {user.role.replace('_', ' ').toUpperCase()}
                    </span>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${
                        user.twoFA ? 'bg-green-500' : 'bg-red-500'
                      }`}></div>
                      <Text className="text-speakeasy-champagne text-sm">
                        {user.twoFA ? 'Enabled' : 'Disabled'}
                      </Text>
                    </div>
                  </td>
                  <td className="p-4">
                    <Text className="text-speakeasy-champagne/80 text-sm">
                      {user.lastLogin}
                    </Text>
                  </td>
                  <td className="p-4">
                    <span className={`inline-block px-2 py-1 rounded text-xs ${
                      user.status === 'active' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                    }`}>
                      {user.status.toUpperCase()}
                    </span>
                  </td>
                  <td className="p-4">
                    <div className="flex gap-2">
                      <button 
                        className="px-2 py-1 bg-speakeasy-gold/20 text-speakeasy-gold rounded text-xs hover:bg-speakeasy-gold/30 transition-colors"
                        disabled
                      >
                        Edit
                      </button>
                      <button 
                        className="px-2 py-1 bg-speakeasy-copper/20 text-speakeasy-copper rounded text-xs hover:bg-speakeasy-copper/30 transition-colors"
                        disabled
                      >
                        Reset 2FA
                      </button>
                      {user.role !== 'super_admin' && (
                        <button 
                          className="px-2 py-1 bg-red-500/20 text-red-400 rounded text-xs hover:bg-red-500/30 transition-colors"
                          disabled
                        >
                          Disable
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add User Form */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-speakeasy-burgundy/20 rounded-lg p-6 border border-speakeasy-gold/20">
          <Heading level={2} className="text-xl font-bebas text-speakeasy-gold mb-4">
            Add New User
          </Heading>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-speakeasy-champagne mb-2">
                Full Name
              </label>
              <input
                type="text"
                placeholder="John Doe"
                className="w-full px-3 py-2 bg-speakeasy-noir/50 border border-speakeasy-gold/20 rounded text-speakeasy-champagne focus:outline-none focus:border-speakeasy-gold"
                disabled
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-speakeasy-champagne mb-2">
                Email Address
              </label>
              <input
                type="email"
                placeholder="user@backroomleeds.co.uk"
                className="w-full px-3 py-2 bg-speakeasy-noir/50 border border-speakeasy-gold/20 rounded text-speakeasy-champagne focus:outline-none focus:border-speakeasy-gold"
                disabled
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-speakeasy-champagne mb-2">
                Role
              </label>
              <select
                className="w-full px-3 py-2 bg-speakeasy-noir/50 border border-speakeasy-gold/20 rounded text-speakeasy-champagne focus:outline-none focus:border-speakeasy-gold"
                disabled
              >
                <option>Select Role</option>
                <option>Manager (7 slots available)</option>
                <option>Door Staff (5 slots available)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-speakeasy-champagne mb-2">
                Temporary Password
              </label>
              <input
                type="password"
                placeholder="Auto-generated"
                className="w-full px-3 py-2 bg-speakeasy-noir/50 border border-speakeasy-gold/20 rounded text-speakeasy-champagne focus:outline-none focus:border-speakeasy-gold"
                disabled
              />
              <Text className="text-speakeasy-champagne/60 text-xs mt-1">
                User will be required to change password on first login
              </Text>
            </div>

            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="requireTwoFA"
                className="w-4 h-4 text-speakeasy-gold rounded focus:ring-speakeasy-gold"
                disabled
              />
              <label htmlFor="requireTwoFA" className="text-sm text-speakeasy-champagne">
                Require 2FA setup on first login
              </label>
            </div>

            <Button variant="primary" size="sm" className="w-full" disabled>
              Create User
            </Button>
          </div>
        </div>

        <div className="bg-speakeasy-burgundy/20 rounded-lg p-6 border border-speakeasy-gold/20">
          <Heading level={2} className="text-xl font-bebas text-speakeasy-gold mb-4">
            Role Permissions
          </Heading>
          
          <div className="space-y-6">
            <div>
              <Heading level={3} className="text-lg font-bebas text-speakeasy-gold mb-2">
                Super Admin
              </Heading>
              <ul className="text-speakeasy-champagne/80 text-sm space-y-1">
                <li>• Full system access</li>
                <li>• User management</li>
                <li>• System settings</li>
                <li>• All manager permissions</li>
              </ul>
            </div>

            <div>
              <Heading level={3} className="text-lg font-bebas text-speakeasy-gold mb-2">
                Manager
              </Heading>
              <ul className="text-speakeasy-champagne/80 text-sm space-y-1">
                <li>• Full booking management</li>
                <li>• Event management</li>
                <li>• Artist profile management</li>
                <li>• Reports and analytics</li>
                <li>• No user management</li>
              </ul>
            </div>

            <div>
              <Heading level={3} className="text-lg font-bebas text-speakeasy-gold mb-2">
                Door Staff
              </Heading>
              <ul className="text-speakeasy-champagne/80 text-sm space-y-1">
                <li>• View tonight&apos;s bookings</li>
                <li>• QR code scanner</li>
                <li>• Manual check-in</li>
                <li>• Real-time arrival tracking</li>
                <li>• No modification access</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Development Notice */}
      <div className="bg-speakeasy-burgundy/10 border border-speakeasy-gold/20 rounded-lg p-6">
        <div className="flex items-start gap-3">
          <div className="w-6 h-6 bg-speakeasy-gold/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
            <svg className="w-4 h-4 text-speakeasy-gold" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <Heading level={3} className="text-lg font-bebas text-speakeasy-gold mb-2">
              Development Status
            </Heading>
            <Text className="text-speakeasy-champagne/80 text-sm leading-relaxed">
              User management system is reserved for Super Admin users only. Features will include:
              user CRUD operations with role limits enforcement, 2FA management, password reset functionality,
              and activity logging. Role-based access control will be enforced at the middleware level.
            </Text>
          </div>
        </div>
      </div>
    </div>
  );
}