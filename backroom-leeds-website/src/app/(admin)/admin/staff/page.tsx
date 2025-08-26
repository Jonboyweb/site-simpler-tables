import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { Heading, Text } from '@/components/atoms';
import { Card } from '@/components/molecules';

/**
 * Staff Management Page
 * Super Admin only access - manages admin users, roles, and permissions
 */
export default async function StaffManagementPage() {
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
            Staff Management
          </Heading>
          <Text className="text-speakeasy-champagne/70">
            Manage admin users, roles, and permissions (Super Admin Only)
          </Text>
          <Text className="text-speakeasy-champagne/50 text-sm mt-1">
            Current User Role: {session.user.role}
          </Text>
        </div>
      </div>

      {/* Staff Management Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        <Card className="p-6">
          <Heading level={3} className="text-speakeasy-gold mb-4">
            Admin Users
          </Heading>
          <Text className="text-speakeasy-champagne/70 mb-4">
            Manage admin user accounts, roles, and access permissions.
          </Text>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-speakeasy-champagne/60">Super Admins:</span>
              <span className="text-speakeasy-champagne">1/1</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-speakeasy-champagne/60">Managers:</span>
              <span className="text-speakeasy-champagne">-/10</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-speakeasy-champagne/60">Door Staff:</span>
              <span className="text-speakeasy-champagne">-/10</span>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <Heading level={3} className="text-speakeasy-gold mb-4">
            Role Management
          </Heading>
          <Text className="text-speakeasy-champagne/70 mb-4">
            Configure role-based permissions and access levels.
          </Text>
          <div className="space-y-2 text-sm">
            <div className="text-speakeasy-champagne/60">
              • Super Admin: Full system access
            </div>
            <div className="text-speakeasy-champagne/60">
              • Manager: Operations & reporting
            </div>
            <div className="text-speakeasy-champagne/60">
              • Door Staff: Check-in only
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <Heading level={3} className="text-speakeasy-gold mb-4">
            Security Settings
          </Heading>
          <Text className="text-speakeasy-champagne/70 mb-4">
            Manage 2FA requirements and security policies.
          </Text>
          <div className="space-y-2 text-sm">
            <div className="text-speakeasy-champagne/60">
              • 2FA enforcement
            </div>
            <div className="text-speakeasy-champagne/60">
              • Session management
            </div>
            <div className="text-speakeasy-champagne/60">
              • Access audit logs
            </div>
          </div>
        </Card>
      </div>

      {/* Action Buttons */}
      <Card className="p-6">
        <Heading level={3} className="text-speakeasy-gold mb-4">
          Staff Management Actions
        </Heading>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <button className="px-4 py-2 bg-speakeasy-gold text-speakeasy-noir rounded-lg font-medium hover:bg-speakeasy-champagne transition-colors">
            Add New User
          </button>
          <button className="px-4 py-2 border border-speakeasy-gold text-speakeasy-gold rounded-lg font-medium hover:bg-speakeasy-gold hover:text-speakeasy-noir transition-colors">
            Manage Roles
          </button>
          <button className="px-4 py-2 border border-speakeasy-copper text-speakeasy-copper rounded-lg font-medium hover:bg-speakeasy-copper hover:text-speakeasy-noir transition-colors">
            Security Audit
          </button>
          <button className="px-4 py-2 border border-speakeasy-champagne text-speakeasy-champagne rounded-lg font-medium hover:bg-speakeasy-champagne hover:text-speakeasy-noir transition-colors">
            Export Logs
          </button>
        </div>
      </Card>

      {/* Recent Activity */}
      <Card className="p-6">
        <Heading level={3} className="text-speakeasy-gold mb-4">
          Recent Staff Activity
        </Heading>
        <Text className="text-speakeasy-champagne/70">
          No recent staff activity to display. Full activity logs and user management functionality will be available in the next development phase.
        </Text>
      </Card>
    </div>
  );
}