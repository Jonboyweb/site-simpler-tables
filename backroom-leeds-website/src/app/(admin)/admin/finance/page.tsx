import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { Heading, Text } from '@/components/atoms';
import { Card } from '@/components/molecules';

/**
 * Finance Management Page
 * Manager and Super Admin access - manages financial operations, reports, and payments
 */
export default async function FinanceManagementPage() {
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
            Finance Management
          </Heading>
          <Text className="text-speakeasy-champagne/70">
            Financial operations, payments, and reporting (Manager/Super Admin)
          </Text>
          <Text className="text-speakeasy-champagne/50 text-sm mt-1">
            Current User Role: {session.user.role}
          </Text>
        </div>
      </div>

      {/* Financial Overview Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-6">
        <Card className="p-6 border-l-4 border-speakeasy-gold">
          <Heading level={3} className="text-speakeasy-gold mb-2">
            Today's Revenue
          </Heading>
          <Text className="text-3xl font-bold text-speakeasy-champagne">
            £-
          </Text>
          <Text className="text-speakeasy-champagne/60 text-sm">
            Total deposits received
          </Text>
        </Card>

        <Card className="p-6 border-l-4 border-speakeasy-copper">
          <Heading level={3} className="text-speakeasy-gold mb-2">
            Pending Payments
          </Heading>
          <Text className="text-3xl font-bold text-speakeasy-champagne">
            £-
          </Text>
          <Text className="text-speakeasy-champagne/60 text-sm">
            Outstanding balances
          </Text>
        </Card>

        <Card className="p-6 border-l-4 border-speakeasy-burgundy">
          <Heading level={3} className="text-speakeasy-gold mb-2">
            Monthly Total
          </Heading>
          <Text className="text-3xl font-bold text-speakeasy-champagne">
            £-
          </Text>
          <Text className="text-speakeasy-champagne/60 text-sm">
            This month's revenue
          </Text>
        </Card>

        <Card className="p-6 border-l-4 border-speakeasy-champagne">
          <Heading level={3} className="text-speakeasy-gold mb-2">
            Refunds Processed
          </Heading>
          <Text className="text-3xl font-bold text-speakeasy-champagne">
            £-
          </Text>
          <Text className="text-speakeasy-champagne/60 text-sm">
            Total refunds this month
          </Text>
        </Card>
      </div>

      {/* Payment Operations */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <Heading level={3} className="text-speakeasy-gold mb-4">
            Payment Operations
          </Heading>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <button className="px-4 py-2 bg-speakeasy-gold text-speakeasy-noir rounded-lg font-medium hover:bg-speakeasy-champagne transition-colors">
                Process Refund
              </button>
              <button className="px-4 py-2 border border-speakeasy-gold text-speakeasy-gold rounded-lg font-medium hover:bg-speakeasy-gold hover:text-speakeasy-noir transition-colors">
                Manual Payment
              </button>
              <button className="px-4 py-2 border border-speakeasy-copper text-speakeasy-copper rounded-lg font-medium hover:bg-speakeasy-copper hover:text-speakeasy-noir transition-colors">
                Payment History
              </button>
              <button className="px-4 py-2 border border-speakeasy-burgundy text-speakeasy-burgundy rounded-lg font-medium hover:bg-speakeasy-burgundy hover:text-speakeasy-noir transition-colors">
                Failed Payments
              </button>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <Heading level={3} className="text-speakeasy-gold mb-4">
            Financial Reports
          </Heading>
          <div className="space-y-3">
            <button className="w-full px-4 py-2 text-left bg-speakeasy-noir border border-speakeasy-copper rounded-lg text-speakeasy-champagne hover:border-speakeasy-gold transition-colors flex justify-between">
              <span>Daily Revenue Report</span>
              <span className="text-speakeasy-gold">→</span>
            </button>
            <button className="w-full px-4 py-2 text-left bg-speakeasy-noir border border-speakeasy-copper rounded-lg text-speakeasy-champagne hover:border-speakeasy-gold transition-colors flex justify-between">
              <span>Weekly Summary</span>
              <span className="text-speakeasy-gold">→</span>
            </button>
            <button className="w-full px-4 py-2 text-left bg-speakeasy-noir border border-speakeasy-copper rounded-lg text-speakeasy-champagne hover:border-speakeasy-gold transition-colors flex justify-between">
              <span>Monthly Analysis</span>
              <span className="text-speakeasy-gold">→</span>
            </button>
            <button className="w-full px-4 py-2 text-left bg-speakeasy-noir border border-speakeasy-copper rounded-lg text-speakeasy-champagne hover:border-speakeasy-gold transition-colors flex justify-between">
              <span>Tax Export</span>
              <span className="text-speakeasy-gold">→</span>
            </button>
          </div>
        </Card>
      </div>

      {/* Recent Transactions */}
      <Card className="p-6">
        <Heading level={3} className="text-speakeasy-gold mb-4">
          Recent Transactions
        </Heading>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-speakeasy-copper">
                <th className="text-left py-3 px-4 text-speakeasy-gold font-medium">Date</th>
                <th className="text-left py-3 px-4 text-speakeasy-gold font-medium">Booking Ref</th>
                <th className="text-left py-3 px-4 text-speakeasy-gold font-medium">Customer</th>
                <th className="text-left py-3 px-4 text-speakeasy-gold font-medium">Type</th>
                <th className="text-left py-3 px-4 text-speakeasy-gold font-medium">Amount</th>
                <th className="text-left py-3 px-4 text-speakeasy-gold font-medium">Status</th>
                <th className="text-left py-3 px-4 text-speakeasy-gold font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td colSpan={7} className="text-center py-8 text-speakeasy-champagne/70">
                  No transaction data available. Financial management functionality will be implemented in the next development phase.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </Card>

      {/* Financial Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <Heading level={3} className="text-speakeasy-gold mb-4">
            Revenue Analytics
          </Heading>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-speakeasy-champagne/70">Average booking value:</span>
              <span className="text-speakeasy-champagne font-medium">£-</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-speakeasy-champagne/70">Deposit completion rate:</span>
              <span className="text-speakeasy-champagne font-medium">-%</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-speakeasy-champagne/70">Peak revenue day:</span>
              <span className="text-speakeasy-champagne font-medium">-</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-speakeasy-champagne/70">Refund rate:</span>
              <span className="text-speakeasy-champagne font-medium">-%</span>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <Heading level={3} className="text-speakeasy-gold mb-4">
            Payment Methods
          </Heading>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-speakeasy-champagne/70">Card payments:</span>
              <span className="text-speakeasy-champagne font-medium">-%</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-speakeasy-champagne/70">Digital wallets:</span>
              <span className="text-speakeasy-champagne font-medium">-%</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-speakeasy-champagne/70">Bank transfers:</span>
              <span className="text-speakeasy-champagne font-medium">-%</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-speakeasy-champagne/70">Failed attempts:</span>
              <span className="text-speakeasy-copper font-medium">-</span>
            </div>
          </div>
        </Card>
      </div>

      {/* Export & Integration */}
      <Card className="p-6">
        <Heading level={3} className="text-speakeasy-gold mb-4">
          Export & Integration
        </Heading>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <button className="px-4 py-2 bg-speakeasy-gold text-speakeasy-noir rounded-lg font-medium hover:bg-speakeasy-champagne transition-colors">
            Export to Excel
          </button>
          <button className="px-4 py-2 border border-speakeasy-gold text-speakeasy-gold rounded-lg font-medium hover:bg-speakeasy-gold hover:text-speakeasy-noir transition-colors">
            Accounting Software
          </button>
          <button className="px-4 py-2 border border-speakeasy-copper text-speakeasy-copper rounded-lg font-medium hover:bg-speakeasy-copper hover:text-speakeasy-noir transition-colors">
            Tax Reports
          </button>
          <button className="px-4 py-2 border border-speakeasy-champagne text-speakeasy-champagne rounded-lg font-medium hover:bg-speakeasy-champagne hover:text-speakeasy-noir transition-colors">
            Stripe Dashboard
          </button>
        </div>
      </Card>
    </div>
  );
}