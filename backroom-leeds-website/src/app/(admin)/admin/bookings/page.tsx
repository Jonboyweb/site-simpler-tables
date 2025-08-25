import type { Metadata } from 'next';
import { Heading, Text, Button } from '@/components/atoms';

export const metadata: Metadata = {
  title: 'Bookings Management | The Backroom Leeds Admin',
  description: 'Manage table bookings, check-ins, and reservations',
  robots: {
    index: false,
    follow: false,
  },
};

export default function AdminBookingsPage() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <Heading level={1} className="text-4xl font-bebas text-speakeasy-gold mb-2">
            Bookings Management
          </Heading>
          <Text className="text-speakeasy-champagne/80">
            Manage table reservations, check-ins, and booking modifications
          </Text>
        </div>
        <div className="flex gap-3">
          <Button variant="primary">
            New Booking
          </Button>
          <Button variant="secondary">
            Export Data
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-speakeasy-burgundy/20 rounded-lg p-6 border border-speakeasy-gold/20">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-speakeasy-champagne mb-2">
              Filter by Date
            </label>
            <input
              type="date"
              className="w-full px-3 py-2 bg-speakeasy-noir/50 border border-speakeasy-gold/20 rounded text-speakeasy-champagne focus:outline-none focus:border-speakeasy-gold"
              disabled
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-speakeasy-champagne mb-2">
              Status
            </label>
            <select
              className="w-full px-3 py-2 bg-speakeasy-noir/50 border border-speakeasy-gold/20 rounded text-speakeasy-champagne focus:outline-none focus:border-speakeasy-gold"
              disabled
            >
              <option>All Statuses</option>
              <option>Confirmed</option>
              <option>Checked In</option>
              <option>Cancelled</option>
              <option>No Show</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-speakeasy-champagne mb-2">
              Table Number
            </label>
            <input
              type="number"
              min="1"
              max="16"
              placeholder="1-16"
              className="w-full px-3 py-2 bg-speakeasy-noir/50 border border-speakeasy-gold/20 rounded text-speakeasy-champagne focus:outline-none focus:border-speakeasy-gold"
              disabled
            />
          </div>
          <div className="flex items-end">
            <Button variant="secondary" size="sm" className="w-full" disabled>
              Apply Filters
            </Button>
          </div>
        </div>
      </div>

      {/* Bookings Table */}
      <div className="bg-speakeasy-burgundy/20 rounded-lg border border-speakeasy-gold/20 overflow-hidden">
        <div className="p-6 border-b border-speakeasy-gold/20">
          <Heading level={2} className="text-xl font-bebas text-speakeasy-gold">
            Today's Bookings
          </Heading>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-speakeasy-noir/30">
              <tr>
                <th className="text-left p-4 text-speakeasy-gold font-bebas">Reference</th>
                <th className="text-left p-4 text-speakeasy-gold font-bebas">Customer</th>
                <th className="text-left p-4 text-speakeasy-gold font-bebas">Table</th>
                <th className="text-left p-4 text-speakeasy-gold font-bebas">Time</th>
                <th className="text-left p-4 text-speakeasy-gold font-bebas">Party Size</th>
                <th className="text-left p-4 text-speakeasy-gold font-bebas">Status</th>
                <th className="text-left p-4 text-speakeasy-gold font-bebas">Actions</th>
              </tr>
            </thead>
            <tbody>
              {/* Sample booking entries */}
              {[
                { ref: 'BRL-2025-ABC12', customer: 'John Doe', email: 'john@email.com', table: 5, time: '11:00 PM', size: 4, status: 'confirmed' },
                { ref: 'BRL-2025-DEF34', customer: 'Sarah Wilson', email: 'sarah@email.com', table: 8, time: '11:30 PM', size: 6, status: 'checked_in' },
                { ref: 'BRL-2025-GHI56', customer: 'Mike Johnson', email: 'mike@email.com', table: 12, time: '12:00 AM', size: 2, status: 'confirmed' },
                { ref: 'BRL-2025-JKL78', customer: 'Emma Brown', email: 'emma@email.com', table: 3, time: '12:30 AM', size: 8, status: 'cancelled' },
              ].map((booking, i) => (
                <tr key={i} className="border-b border-speakeasy-gold/10 hover:bg-speakeasy-noir/20">
                  <td className="p-4">
                    <Text className="text-speakeasy-champagne font-mono text-sm">
                      {booking.ref}
                    </Text>
                  </td>
                  <td className="p-4">
                    <div>
                      <Text className="text-speakeasy-champagne">{booking.customer}</Text>
                      <Text className="text-speakeasy-champagne/60 text-xs">{booking.email}</Text>
                    </div>
                  </td>
                  <td className="p-4">
                    <span className="inline-block px-2 py-1 bg-speakeasy-gold/20 text-speakeasy-gold rounded text-sm">
                      Table {booking.table}
                    </span>
                  </td>
                  <td className="p-4">
                    <Text className="text-speakeasy-champagne">{booking.time}</Text>
                  </td>
                  <td className="p-4">
                    <Text className="text-speakeasy-champagne">{booking.size}</Text>
                  </td>
                  <td className="p-4">
                    <span className={`inline-block px-2 py-1 rounded text-xs ${
                      booking.status === 'confirmed' ? 'bg-blue-500/20 text-blue-400' :
                      booking.status === 'checked_in' ? 'bg-green-500/20 text-green-400' :
                      booking.status === 'cancelled' ? 'bg-red-500/20 text-red-400' :
                      'bg-gray-500/20 text-gray-400'
                    }`}>
                      {booking.status.replace('_', ' ').toUpperCase()}
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
                        className="px-2 py-1 bg-green-500/20 text-green-400 rounded text-xs hover:bg-green-500/30 transition-colors"
                        disabled
                      >
                        Check In
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* QR Code Scanner */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-speakeasy-burgundy/20 rounded-lg p-6 border border-speakeasy-gold/20">
          <Heading level={2} className="text-xl font-bebas text-speakeasy-gold mb-4">
            QR Code Check-in
          </Heading>
          <div className="aspect-square bg-speakeasy-noir/30 rounded-lg border-2 border-dashed border-speakeasy-gold/20 flex items-center justify-center mb-4">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-2 bg-speakeasy-gold/20 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-speakeasy-gold" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M12 12h4.01M12 12v4.01" />
                </svg>
              </div>
              <Text className="text-speakeasy-champagne/70 text-sm">QR Camera will be integrated here</Text>
            </div>
          </div>
          <Button variant="primary" size="sm" className="w-full" disabled>
            Start QR Scanner
          </Button>
        </div>

        <div className="bg-speakeasy-burgundy/20 rounded-lg p-6 border border-speakeasy-gold/20">
          <Heading level={2} className="text-xl font-bebas text-speakeasy-gold mb-4">
            Manual Check-in
          </Heading>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-speakeasy-champagne mb-2">
                Booking Reference
              </label>
              <input
                type="text"
                placeholder="BRL-2025-XXXXX"
                className="w-full px-3 py-2 bg-speakeasy-noir/50 border border-speakeasy-gold/20 rounded text-speakeasy-champagne focus:outline-none focus:border-speakeasy-gold"
                disabled
              />
            </div>
            <Button variant="secondary" size="sm" className="w-full" disabled>
              Check In by Reference
            </Button>
          </div>

          <div className="mt-6 pt-6 border-t border-speakeasy-gold/20">
            <Text className="text-speakeasy-champagne/80 text-sm">
              <strong>Recent Check-ins:</strong>
            </Text>
            <div className="mt-2 space-y-2">
              <div className="text-sm text-speakeasy-champagne/60">
                • Table 8 - Sarah Wilson (11:45 PM)
              </div>
              <div className="text-sm text-speakeasy-champagne/60">
                • Table 3 - Mike Johnson (11:32 PM)
              </div>
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
              Bookings management functionality is in development. Features will include:
              real-time booking updates, QR code scanning for check-ins, booking modifications, 
              and integration with the payment system. Currently showing placeholder data.
            </Text>
          </div>
        </div>
      </div>
    </div>
  );
}