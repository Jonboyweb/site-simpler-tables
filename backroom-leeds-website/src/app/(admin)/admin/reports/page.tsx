import type { Metadata } from 'next';
import { Heading, Text, Button } from '@/components/atoms';

export const metadata: Metadata = {
  title: 'Reports & Analytics | The Backroom Leeds Admin',
  description: 'Venue analytics, booking reports, and performance metrics',
  robots: {
    index: false,
    follow: false,
  },
};

export default function AdminReportsPage() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <Heading level={1} className="text-4xl font-bebas text-speakeasy-gold mb-2">
            Reports & Analytics
          </Heading>
          <Text className="text-speakeasy-champagne/80">
            Venue performance metrics, booking analytics, and automated reports
          </Text>
        </div>
        <div className="flex gap-3">
          <Button variant="primary">
            Export Report
          </Button>
          <Button variant="secondary">
            Schedule Report
          </Button>
        </div>
      </div>

      {/* Key Metrics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-speakeasy-burgundy/20 rounded-lg p-6 border border-speakeasy-gold/20">
          <div className="flex items-center justify-between mb-2">
            <Text className="text-speakeasy-champagne/70 text-sm font-medium">This Week</Text>
            <div className="w-8 h-8 bg-speakeasy-gold/20 rounded-full flex items-center justify-center">
              <svg className="w-4 h-4 text-speakeasy-gold" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
          </div>
          <Heading level={3} className="text-3xl font-bebas text-speakeasy-gold mb-1">72</Heading>
          <Text className="text-speakeasy-champagne/80 text-sm">Total Bookings</Text>
          <div className="flex items-center gap-1 mt-2">
            <span className="text-green-400 text-xs">↗ +12%</span>
            <Text className="text-speakeasy-champagne/60 text-xs">vs last week</Text>
          </div>
        </div>

        <div className="bg-speakeasy-burgundy/20 rounded-lg p-6 border border-speakeasy-gold/20">
          <div className="flex items-center justify-between mb-2">
            <Text className="text-speakeasy-champagne/70 text-sm font-medium">Revenue</Text>
            <div className="w-8 h-8 bg-speakeasy-copper/20 rounded-full flex items-center justify-center">
              <svg className="w-4 h-4 text-speakeasy-copper" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
              </svg>
            </div>
          </div>
          <Heading level={3} className="text-3xl font-bebas text-speakeasy-gold mb-1">£4,850</Heading>
          <Text className="text-speakeasy-champagne/80 text-sm">This Week</Text>
          <div className="flex items-center gap-1 mt-2">
            <span className="text-green-400 text-xs">↗ +8%</span>
            <Text className="text-speakeasy-champagne/60 text-xs">vs last week</Text>
          </div>
        </div>

        <div className="bg-speakeasy-burgundy/20 rounded-lg p-6 border border-speakeasy-gold/20">
          <div className="flex items-center justify-between mb-2">
            <Text className="text-speakeasy-champagne/70 text-sm font-medium">Occupancy</Text>
            <div className="w-8 h-8 bg-speakeasy-champagne/20 rounded-full flex items-center justify-center">
              <svg className="w-4 h-4 text-speakeasy-champagne" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
          </div>
          <Heading level={3} className="text-3xl font-bebas text-speakeasy-gold mb-1">87%</Heading>
          <Text className="text-speakeasy-champagne/80 text-sm">Average Rate</Text>
          <div className="flex items-center gap-1 mt-2">
            <span className="text-green-400 text-xs">↗ +5%</span>
            <Text className="text-speakeasy-champagne/60 text-xs">vs last week</Text>
          </div>
        </div>

        <div className="bg-speakeasy-burgundy/20 rounded-lg p-6 border border-speakeasy-gold/20">
          <div className="flex items-center justify-between mb-2">
            <Text className="text-speakeasy-champagne/70 text-sm font-medium">Cancellations</Text>
            <div className="w-8 h-8 bg-red-500/20 rounded-full flex items-center justify-center">
              <svg className="w-4 h-4 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
          </div>
          <Heading level={3} className="text-3xl font-bebas text-speakeasy-gold mb-1">5.2%</Heading>
          <Text className="text-speakeasy-champagne/80 text-sm">Cancellation Rate</Text>
          <div className="flex items-center gap-1 mt-2">
            <span className="text-red-400 text-xs">↗ +1.2%</span>
            <Text className="text-speakeasy-champagne/60 text-xs">vs last week</Text>
          </div>
        </div>
      </div>

      {/* Charts and Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Revenue Chart */}
        <div className="bg-speakeasy-burgundy/20 rounded-lg border border-speakeasy-gold/20">
          <div className="p-6 border-b border-speakeasy-gold/20">
            <Heading level={2} className="text-xl font-bebas text-speakeasy-gold">
              Weekly Revenue Trend
            </Heading>
          </div>
          <div className="p-6">
            <div className="h-64 bg-speakeasy-noir/30 rounded-lg border-2 border-dashed border-speakeasy-gold/20 flex items-center justify-center">
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 bg-speakeasy-gold/20 rounded-full flex items-center justify-center">
                  <svg className="w-8 h-8 text-speakeasy-gold" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <Text className="text-speakeasy-champagne/70">Chart.js integration will be added here</Text>
              </div>
            </div>
          </div>
        </div>

        {/* Booking Patterns */}
        <div className="bg-speakeasy-burgundy/20 rounded-lg border border-speakeasy-gold/20">
          <div className="p-6 border-b border-speakeasy-gold/20">
            <Heading level={2} className="text-xl font-bebas text-speakeasy-gold">
              Table Popularity
            </Heading>
          </div>
          <div className="p-6">
            <div className="space-y-3">
              {/* Sample table popularity data */}
              {[
                { table: 8, bookings: 15, percentage: 94 },
                { table: 5, bookings: 14, percentage: 88 },
                { table: 12, bookings: 13, percentage: 81 },
                { table: 3, bookings: 11, percentage: 69 },
                { table: 15, bookings: 10, percentage: 63 },
              ].map((item, i) => (
                <div key={i} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="w-8 h-8 bg-speakeasy-gold/20 rounded-full flex items-center justify-center text-speakeasy-gold font-bebas text-sm">
                      {item.table}
                    </span>
                    <Text className="text-speakeasy-champagne">Table {item.table}</Text>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-24 bg-speakeasy-noir/30 rounded-full h-2">
                      <div 
                        className="bg-speakeasy-gold rounded-full h-2"
                        style={{ width: `${item.percentage}%` }}
                      ></div>
                    </div>
                    <Text className="text-speakeasy-champagne text-sm w-8">{item.bookings}</Text>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Event Performance */}
      <div className="bg-speakeasy-burgundy/20 rounded-lg border border-speakeasy-gold/20">
        <div className="p-6 border-b border-speakeasy-gold/20">
          <Heading level={2} className="text-xl font-bebas text-speakeasy-gold">
            Event Performance
          </Heading>
        </div>
        
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { name: 'LA FIESTA', bookings: 24, revenue: '£2,100', attendance: '96%', rating: 4.8 },
              { name: 'SHHH!', bookings: 18, revenue: '£1,650', attendance: '89%', rating: 4.9 },
              { name: 'NOSTALGIA', bookings: 15, revenue: '£1,200', attendance: '83%', rating: 4.7 },
            ].map((event, i) => (
              <div key={i} className="bg-speakeasy-noir/30 rounded-lg p-4 border border-speakeasy-gold/10">
                <Heading level={3} className="text-lg font-bebas text-speakeasy-gold mb-3">
                  {event.name}
                </Heading>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Text className="text-speakeasy-champagne/80 text-sm">Bookings:</Text>
                    <Text className="text-speakeasy-gold font-bebas">{event.bookings}</Text>
                  </div>
                  <div className="flex justify-between">
                    <Text className="text-speakeasy-champagne/80 text-sm">Revenue:</Text>
                    <Text className="text-speakeasy-gold font-bebas">{event.revenue}</Text>
                  </div>
                  <div className="flex justify-between">
                    <Text className="text-speakeasy-champagne/80 text-sm">Attendance:</Text>
                    <Text className="text-speakeasy-gold font-bebas">{event.attendance}</Text>
                  </div>
                  <div className="flex justify-between">
                    <Text className="text-speakeasy-champagne/80 text-sm">Rating:</Text>
                    <Text className="text-speakeasy-gold font-bebas">{event.rating} ⭐</Text>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Automated Reports */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-speakeasy-burgundy/20 rounded-lg p-6 border border-speakeasy-gold/20">
          <Heading level={2} className="text-xl font-bebas text-speakeasy-gold mb-4">
            Scheduled Reports
          </Heading>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-speakeasy-noir/30 rounded border border-speakeasy-gold/10">
              <div>
                <Text className="text-speakeasy-champagne font-medium">Daily Summary</Text>
                <Text className="text-speakeasy-champagne/70 text-sm">Sent at 10:00 PM daily</Text>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <Text className="text-green-400 text-sm">Active</Text>
              </div>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-speakeasy-noir/30 rounded border border-speakeasy-gold/10">
              <div>
                <Text className="text-speakeasy-champagne font-medium">Weekly Summary</Text>
                <Text className="text-speakeasy-champagne/70 text-sm">Sent Monday at 9:00 AM</Text>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <Text className="text-green-400 text-sm">Active</Text>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-speakeasy-gold/20">
            <Button variant="secondary" size="sm" className="w-full" disabled>
              Configure Reports
            </Button>
          </div>
        </div>

        <div className="bg-speakeasy-burgundy/20 rounded-lg p-6 border border-speakeasy-gold/20">
          <Heading level={2} className="text-xl font-bebas text-speakeasy-gold mb-4">
            Export Options
          </Heading>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-speakeasy-champagne mb-2">
                Report Type
              </label>
              <select
                className="w-full px-3 py-2 bg-speakeasy-noir/50 border border-speakeasy-gold/20 rounded text-speakeasy-champagne focus:outline-none focus:border-speakeasy-gold"
                disabled
              >
                <option>Booking Summary</option>
                <option>Revenue Report</option>
                <option>Event Performance</option>
                <option>Customer Analytics</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-speakeasy-champagne mb-2">
                  From Date
                </label>
                <input
                  type="date"
                  className="w-full px-3 py-2 bg-speakeasy-noir/50 border border-speakeasy-gold/20 rounded text-speakeasy-champagne focus:outline-none focus:border-speakeasy-gold"
                  disabled
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-speakeasy-champagne mb-2">
                  To Date
                </label>
                <input
                  type="date"
                  className="w-full px-3 py-2 bg-speakeasy-noir/50 border border-speakeasy-gold/20 rounded text-speakeasy-gold"
                  disabled
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-speakeasy-champagne mb-2">
                Format
              </label>
              <div className="flex gap-2">
                <label className="flex items-center">
                  <input type="radio" name="format" value="pdf" className="mr-2" disabled />
                  <Text className="text-speakeasy-champagne text-sm">PDF</Text>
                </label>
                <label className="flex items-center">
                  <input type="radio" name="format" value="csv" className="mr-2" disabled />
                  <Text className="text-speakeasy-champagne text-sm">CSV</Text>
                </label>
              </div>
            </div>

            <Button variant="primary" size="sm" className="w-full" disabled>
              Generate Report
            </Button>
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
              Analytics and reporting system is in development. Features will include:
              real-time charts using Chart.js, automated report generation and email distribution,
              advanced filtering and export capabilities, and integration with business intelligence tools.
              Currently displaying sample data for demonstration.
            </Text>
          </div>
        </div>
      </div>
    </div>
  );
}