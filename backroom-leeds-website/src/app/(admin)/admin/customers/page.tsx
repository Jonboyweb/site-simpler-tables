import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { Heading, Text } from '@/components/atoms';
import { Card } from '@/components/molecules';

/**
 * Customer Management Page
 * Manager and Super Admin access - manages customer accounts, bookings, and profiles
 */
export default async function CustomerManagementPage() {
  const session = await getServerSession(authOptions);

  // Check authentication and role permissions
  if (!session?.user?.role || !['super_admin', 'manager'].includes(session.user.role)) {
    redirect('/admin/dashboard?error=InsufficientPermissions');
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <Heading level={1} variant="bebas" className="text-speakeasy-gold mb-2">
            Customer Management
          </Heading>
          <Text className="text-speakeasy-champagne/70">
            Manage customer accounts, bookings, and profiles (Manager/Super Admin)
          </Text>
          <Text className="text-speakeasy-champagne/50 text-sm mt-1">
            Current User Role: {session.user.role}
          </Text>
        </div>
      </div>

      {/* Customer Overview Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-6">
        <Card className="p-6">
          <Heading level={3} className="text-speakeasy-gold mb-2">
            Total Customers
          </Heading>
          <Text className="text-3xl font-bold text-speakeasy-champagne">
            -
          </Text>
          <Text className="text-speakeasy-champagne/60 text-sm">
            Registered customers
          </Text>
        </Card>

        <Card className="p-6">
          <Heading level={3} className="text-speakeasy-gold mb-2">
            Active This Month
          </Heading>
          <Text className="text-3xl font-bold text-speakeasy-champagne">
            -
          </Text>
          <Text className="text-speakeasy-champagne/60 text-sm">
            Customers with bookings
          </Text>
        </Card>

        <Card className="p-6">
          <Heading level={3} className="text-speakeasy-gold mb-2">
            VIP Members
          </Heading>
          <Text className="text-3xl font-bold text-speakeasy-champagne">
            -
          </Text>
          <Text className="text-speakeasy-champagne/60 text-sm">
            Premium customers
          </Text>
        </Card>

        <Card className="p-6">
          <Heading level={3} className="text-speakeasy-gold mb-2">
            Waitlist
          </Heading>
          <Text className="text-3xl font-bold text-speakeasy-champagne">
            -
          </Text>
          <Text className="text-speakeasy-champagne/60 text-sm">
            Customers waiting
          </Text>
        </Card>
      </div>

      {/* Customer Management Tools */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <Heading level={3} className="text-speakeasy-gold mb-4">
            Customer Search & Filter
          </Heading>
          <div className="space-y-4">
            <div>
              <input 
                type="text" 
                placeholder="Search by name, email, or phone..."
                className="w-full px-4 py-2 bg-speakeasy-noir border border-speakeasy-copper rounded-lg text-speakeasy-champagne placeholder-speakeasy-champagne/50 focus:outline-none focus:border-speakeasy-gold"
              />
            </div>
            <div className="flex gap-2">
              <select className="px-3 py-2 bg-speakeasy-noir border border-speakeasy-copper rounded-lg text-speakeasy-champagne text-sm focus:outline-none focus:border-speakeasy-gold">
                <option>All Customers</option>
                <option>VIP Members</option>
                <option>Regular Customers</option>
                <option>New Customers</option>
              </select>
              <button className="px-4 py-2 bg-speakeasy-gold text-speakeasy-noir rounded-lg font-medium text-sm hover:bg-speakeasy-champagne transition-colors">
                Search
              </button>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <Heading level={3} className="text-speakeasy-gold mb-4">
            Quick Actions
          </Heading>
          <div className="grid grid-cols-2 gap-3">
            <button className="px-4 py-2 bg-speakeasy-gold text-speakeasy-noir rounded-lg font-medium hover:bg-speakeasy-champagne transition-colors">
              Add Customer
            </button>
            <button className="px-4 py-2 border border-speakeasy-gold text-speakeasy-gold rounded-lg font-medium hover:bg-speakeasy-gold hover:text-speakeasy-noir transition-colors">
              Import CSV
            </button>
            <button className="px-4 py-2 border border-speakeasy-copper text-speakeasy-copper rounded-lg font-medium hover:bg-speakeasy-copper hover:text-speakeasy-noir transition-colors">
              Export Data
            </button>
            <button className="px-4 py-2 border border-speakeasy-champagne text-speakeasy-champagne rounded-lg font-medium hover:bg-speakeasy-champagne hover:text-speakeasy-noir transition-colors">
              Send Newsletter
            </button>
          </div>
        </Card>
      </div>

      {/* Customer List */}
      <Card className="p-6">
        <Heading level={3} className="text-speakeasy-gold mb-4">
          Customer Directory
        </Heading>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-speakeasy-copper">
                <th className="text-left py-3 px-4 text-speakeasy-gold font-medium">Name</th>
                <th className="text-left py-3 px-4 text-speakeasy-gold font-medium">Email</th>
                <th className="text-left py-3 px-4 text-speakeasy-gold font-medium">Phone</th>
                <th className="text-left py-3 px-4 text-speakeasy-gold font-medium">Status</th>
                <th className="text-left py-3 px-4 text-speakeasy-gold font-medium">Bookings</th>
                <th className="text-left py-3 px-4 text-speakeasy-gold font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td colSpan={6} className="text-center py-8 text-speakeasy-champagne/70">
                  No customer data available. Customer management functionality will be implemented in the next development phase.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </Card>

      {/* Customer Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <Heading level={3} className="text-speakeasy-gold mb-4">
            Customer Analytics
          </Heading>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-speakeasy-champagne/70">New customers this week:</span>
              <span className="text-speakeasy-champagne">-</span>
            </div>
            <div className="flex justify-between">
              <span className="text-speakeasy-champagne/70">Repeat customers:</span>
              <span className="text-speakeasy-champagne">-</span>
            </div>
            <div className="flex justify-between">
              <span className="text-speakeasy-champagne/70">Average booking size:</span>
              <span className="text-speakeasy-champagne">- people</span>
            </div>
            <div className="flex justify-between">
              <span className="text-speakeasy-champagne/70">Customer retention rate:</span>
              <span className="text-speakeasy-champagne">-%</span>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <Heading level={3} className="text-speakeasy-gold mb-4">
            Communication Tools
          </Heading>
          <div className="space-y-3">
            <button className="w-full px-4 py-2 text-left bg-speakeasy-noir border border-speakeasy-copper rounded-lg text-speakeasy-champagne hover:border-speakeasy-gold transition-colors">
              Send booking confirmations
            </button>
            <button className="w-full px-4 py-2 text-left bg-speakeasy-noir border border-speakeasy-copper rounded-lg text-speakeasy-champagne hover:border-speakeasy-gold transition-colors">
              Event invitations
            </button>
            <button className="w-full px-4 py-2 text-left bg-speakeasy-noir border border-speakeasy-copper rounded-lg text-speakeasy-champagne hover:border-speakeasy-gold transition-colors">
              VIP program updates
            </button>
            <button className="w-full px-4 py-2 text-left bg-speakeasy-noir border border-speakeasy-copper rounded-lg text-speakeasy-champagne hover:border-speakeasy-gold transition-colors">
              Feedback surveys
            </button>
          </div>
        </Card>
      </div>
    </div>
  );
}