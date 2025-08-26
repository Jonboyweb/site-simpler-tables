/**
 * The Backroom Leeds - Daily Report Email Template
 * Version: 1.0.0
 * Phase: 3, Step 3.5
 * 
 * Professional React Email template for daily summary reports
 */

import React from 'react';
import {
  Html,
  Head,
  Preview,
  Body,
  Container,
  Section,
  Row,
  Column,
  Heading,
  Text,
  Link,
  Hr,
  Img
} from '@react-email/components';
import { Tailwind } from '@react-email/tailwind';
import { DailySummaryReportData } from '@/types/reporting';

// ============================================================================
// STYLES
// ============================================================================

const tailwindConfig = {
  theme: {
    extend: {
      colors: {
        'speakeasy': {
          noir: '#1a1a1a',
          burgundy: '#800020', 
          gold: '#d4af37',
          copper: '#b87333',
          champagne: '#f7e7ce',
          smoke: '#2c2c2c'
        }
      },
      fontFamily: {
        'bebas': ['Bebas Neue', 'cursive'],
        'playfair': ['Playfair Display', 'serif'],
        'inter': ['Inter', 'sans-serif']
      }
    }
  }
};

// ============================================================================
// COMPONENT INTERFACES
// ============================================================================

interface DailyReportTemplateProps {
  reportData: DailySummaryReportData;
}

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: 'up' | 'down' | 'stable';
  trendValue?: string;
}

interface EventRowProps {
  event: {
    name: string;
    attendance: number;
    revenue: number;
    occupancyRate: number;
  };
}

interface PackageRowProps {
  package: {
    packageName: string;
    bookings: number;
    revenue: number;
  };
}

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

const MetricCard: React.FC<MetricCardProps> = ({ 
  title, 
  value, 
  subtitle, 
  trend, 
  trendValue 
}) => (
  <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
    <Text className="text-sm text-gray-600 font-medium mb-1 m-0">{title}</Text>
    <Text className="text-2xl font-bold text-speakeasy-noir m-0">{value}</Text>
    {subtitle && (
      <Text className="text-xs text-gray-500 mt-1 m-0">{subtitle}</Text>
    )}
    {trend && trendValue && (
      <div className="flex items-center mt-2">
        <span className={`text-xs font-medium ${
          trend === 'up' ? 'text-green-600' : 
          trend === 'down' ? 'text-red-600' : 
          'text-gray-500'
        }`}>
          {trend === 'up' ? '↗' : trend === 'down' ? '↘' : '→'} {trendValue}
        </span>
      </div>
    )}
  </div>
);

const EventRow: React.FC<EventRowProps> = ({ event }) => (
  <tr className="border-b border-gray-100">
    <td className="py-3 px-4 text-left">
      <Text className="font-medium text-speakeasy-noir m-0">{event.name}</Text>
    </td>
    <td className="py-3 px-4 text-center">
      <Text className="text-gray-700 m-0">{event.attendance}</Text>
    </td>
    <td className="py-3 px-4 text-center">
      <Text className="text-gray-700 m-0">£{event.revenue.toFixed(2)}</Text>
    </td>
    <td className="py-3 px-4 text-center">
      <Text className="text-gray-700 m-0">{event.occupancyRate.toFixed(1)}%</Text>
    </td>
  </tr>
);

const PackageRow: React.FC<PackageRowProps> = ({ package: pkg }) => (
  <tr className="border-b border-gray-100">
    <td className="py-3 px-4 text-left">
      <Text className="font-medium text-speakeasy-noir m-0">{pkg.packageName}</Text>
    </td>
    <td className="py-3 px-4 text-center">
      <Text className="text-gray-700 m-0">{pkg.bookings}</Text>
    </td>
    <td className="py-3 px-4 text-center">
      <Text className="text-gray-700 m-0">£{pkg.revenue.toFixed(2)}</Text>
    </td>
  </tr>
);

// ============================================================================
// MAIN TEMPLATE COMPONENT
// ============================================================================

export const DailyReportTemplate: React.FC<DailyReportTemplateProps> = ({ 
  reportData 
}) => {
  const reportDate = new Date(reportData.date);
  const formattedDate = reportDate.toLocaleDateString('en-GB', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const previewText = `Daily Summary for ${formattedDate} - ${reportData.overview.totalBookings} bookings, £${reportData.revenue.gross.toFixed(2)} revenue`;

  return (
    <Html>
      <Head />
      <Preview>{previewText}</Preview>
      <Tailwind config={tailwindConfig}>
        <Body className="bg-gray-50 font-inter">
          <Container className="mx-auto py-8 px-4 max-w-4xl">
            
            {/* Header */}
            <Section className="bg-speakeasy-noir rounded-t-lg py-8 px-6 text-center">
              <Img
                src="https://backroomleeds.co.uk/logo-white.png"
                alt="The Backroom Leeds"
                className="mx-auto mb-4"
                width="120"
                height="40"
              />
              <Heading className="text-speakeasy-gold font-bebas text-3xl m-0 mb-2">
                DAILY SUMMARY REPORT
              </Heading>
              <Text className="text-speakeasy-champagne text-lg m-0">
                {formattedDate}
              </Text>
            </Section>

            {/* Executive Summary */}
            <Section className="bg-white px-6 py-6 border-l border-r border-gray-200">
              <Heading className="text-speakeasy-noir font-playfair text-xl mb-4">
                Executive Summary
              </Heading>
              
              <Row>
                <Column className="w-1/4 pr-2">
                  <MetricCard 
                    title="Total Bookings"
                    value={reportData.overview.totalBookings}
                    subtitle="confirmed reservations"
                  />
                </Column>
                <Column className="w-1/4 px-2">
                  <MetricCard 
                    title="Total Revenue"
                    value={`£${reportData.revenue.gross.toFixed(2)}`}
                    subtitle="gross revenue"
                  />
                </Column>
                <Column className="w-1/4 px-2">
                  <MetricCard 
                    title="Total Guests"
                    value={reportData.overview.totalGuests}
                    subtitle="served"
                  />
                </Column>
                <Column className="w-1/4 pl-2">
                  <MetricCard 
                    title="Occupancy Rate"
                    value={`${reportData.overview.occupancyRate.toFixed(1)}%`}
                    subtitle={`${reportData.overview.tablesOccupied}/16 tables`}
                  />
                </Column>
              </Row>
            </Section>

            {/* Booking Metrics */}
            <Section className="bg-white px-6 py-6 border-l border-r border-gray-200">
              <Heading className="text-speakeasy-noir font-playfair text-xl mb-4">
                Booking Analysis
              </Heading>
              
              <Row>
                <Column className="w-1/2 pr-4">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <Text className="font-medium text-speakeasy-noir mb-3 m-0">
                      Booking Status
                    </Text>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <Text className="text-gray-600 m-0">Confirmed:</Text>
                        <Text className="font-medium text-green-600 m-0">
                          {reportData.bookings.confirmed}
                        </Text>
                      </div>
                      <div className="flex justify-between">
                        <Text className="text-gray-600 m-0">Cancelled:</Text>
                        <Text className="font-medium text-red-600 m-0">
                          {reportData.bookings.cancelled}
                        </Text>
                      </div>
                      <div className="flex justify-between">
                        <Text className="text-gray-600 m-0">No Shows:</Text>
                        <Text className="font-medium text-orange-600 m-0">
                          {reportData.bookings.noShows}
                        </Text>
                      </div>
                      <div className="flex justify-between">
                        <Text className="text-gray-600 m-0">Walk-ins:</Text>
                        <Text className="font-medium text-blue-600 m-0">
                          {reportData.bookings.walkIns}
                        </Text>
                      </div>
                    </div>
                  </div>
                </Column>
                <Column className="w-1/2 pl-4">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <Text className="font-medium text-speakeasy-noir mb-3 m-0">
                      Key Metrics
                    </Text>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <Text className="text-gray-600 m-0">Avg Party Size:</Text>
                        <Text className="font-medium text-speakeasy-noir m-0">
                          {reportData.bookings.averagePartySize.toFixed(1)}
                        </Text>
                      </div>
                      <div className="flex justify-between">
                        <Text className="text-gray-600 m-0">Waitlist:</Text>
                        <Text className="font-medium text-speakeasy-noir m-0">
                          {reportData.bookings.waitlist}
                        </Text>
                      </div>
                      <div className="flex justify-between">
                        <Text className="text-gray-600 m-0">Revenue/Guest:</Text>
                        <Text className="font-medium text-speakeasy-gold m-0">
                          £{reportData.revenue.perGuest.toFixed(2)}
                        </Text>
                      </div>
                      <div className="flex justify-between">
                        <Text className="text-gray-600 m-0">Revenue/Table:</Text>
                        <Text className="font-medium text-speakeasy-gold m-0">
                          £{reportData.revenue.perTable.toFixed(2)}
                        </Text>
                      </div>
                    </div>
                  </div>
                </Column>
              </Row>
            </Section>

            {/* Revenue Breakdown */}
            <Section className="bg-white px-6 py-6 border-l border-r border-gray-200">
              <Heading className="text-speakeasy-noir font-playfair text-xl mb-4">
                Revenue Breakdown
              </Heading>
              
              <Row>
                <Column className="w-1/3 pr-2">
                  <MetricCard 
                    title="Gross Revenue"
                    value={`£${reportData.revenue.gross.toFixed(2)}`}
                    subtitle="total income"
                  />
                </Column>
                <Column className="w-1/3 px-2">
                  <MetricCard 
                    title="Net Revenue"
                    value={`£${reportData.revenue.net.toFixed(2)}`}
                    subtitle="after refunds"
                  />
                </Column>
                <Column className="w-1/3 pl-2">
                  <MetricCard 
                    title="Deposits"
                    value={`£${reportData.revenue.deposits.toFixed(2)}`}
                    subtitle="collected"
                  />
                </Column>
              </Row>
            </Section>

            {/* Events Performance */}
            {reportData.events.length > 0 && (
              <Section className="bg-white px-6 py-6 border-l border-r border-gray-200">
                <Heading className="text-speakeasy-noir font-playfair text-xl mb-4">
                  Event Performance
                </Heading>
                
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="py-3 px-4 text-left text-sm font-medium text-gray-700">
                        Event
                      </th>
                      <th className="py-3 px-4 text-center text-sm font-medium text-gray-700">
                        Attendance
                      </th>
                      <th className="py-3 px-4 text-center text-sm font-medium text-gray-700">
                        Revenue
                      </th>
                      <th className="py-3 px-4 text-center text-sm font-medium text-gray-700">
                        Occupancy
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportData.events.map((event, index) => (
                      <EventRow key={index} event={event} />
                    ))}
                  </tbody>
                </table>
              </Section>
            )}

            {/* Customer Insights */}
            <Section className="bg-white px-6 py-6 border-l border-r border-gray-200">
              <Heading className="text-speakeasy-noir font-playfair text-xl mb-4">
                Customer Insights
              </Heading>
              
              <Row>
                <Column className="w-1/2 pr-4">
                  <div className="bg-gradient-to-br from-speakeasy-gold/10 to-speakeasy-copper/10 rounded-lg p-4">
                    <Text className="font-medium text-speakeasy-noir mb-3 m-0">
                      Customer Breakdown
                    </Text>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center">
                        <Text className="text-2xl font-bold text-speakeasy-burgundy m-0">
                          {reportData.customers.new}
                        </Text>
                        <Text className="text-xs text-gray-600 m-0">New Customers</Text>
                      </div>
                      <div className="text-center">
                        <Text className="text-2xl font-bold text-speakeasy-copper m-0">
                          {reportData.customers.returning}
                        </Text>
                        <Text className="text-xs text-gray-600 m-0">Returning</Text>
                      </div>
                      <div className="text-center">
                        <Text className="text-2xl font-bold text-speakeasy-gold m-0">
                          {reportData.customers.vip}
                        </Text>
                        <Text className="text-xs text-gray-600 m-0">VIP Bookings</Text>
                      </div>
                      <div className="text-center">
                        <Text className="text-2xl font-bold text-purple-600 m-0">
                          {reportData.customers.birthdays + reportData.customers.anniversaries}
                        </Text>
                        <Text className="text-xs text-gray-600 m-0">Celebrations</Text>
                      </div>
                    </div>
                  </div>
                </Column>
                <Column className="w-1/2 pl-4">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <Text className="font-medium text-speakeasy-noir mb-3 m-0">
                      Special Occasions
                    </Text>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <Text className="text-gray-600 m-0">🎂 Birthdays:</Text>
                        <Text className="font-medium text-pink-600 m-0">
                          {reportData.customers.birthdays}
                        </Text>
                      </div>
                      <div className="flex justify-between items-center">
                        <Text className="text-gray-600 m-0">💕 Anniversaries:</Text>
                        <Text className="font-medium text-red-600 m-0">
                          {reportData.customers.anniversaries}
                        </Text>
                      </div>
                    </div>
                  </div>
                </Column>
              </Row>
            </Section>

            {/* Top Packages */}
            {reportData.topPackages.length > 0 && (
              <Section className="bg-white px-6 py-6 border-l border-r border-gray-200">
                <Heading className="text-speakeasy-noir font-playfair text-xl mb-4">
                  Top Performing Packages
                </Heading>
                
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="py-3 px-4 text-left text-sm font-medium text-gray-700">
                        Package
                      </th>
                      <th className="py-3 px-4 text-center text-sm font-medium text-gray-700">
                        Bookings
                      </th>
                      <th className="py-3 px-4 text-center text-sm font-medium text-gray-700">
                        Revenue
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportData.topPackages.slice(0, 5).map((pkg, index) => (
                      <PackageRow key={index} package={pkg} />
                    ))}
                  </tbody>
                </table>
              </Section>
            )}

            {/* Footer */}
            <Section className="bg-speakeasy-smoke rounded-b-lg px-6 py-6 text-center">
              <Text className="text-speakeasy-champagne text-sm m-0 mb-2">
                This report was generated automatically by The Backroom Leeds reporting system.
              </Text>
              <Text className="text-gray-400 text-xs m-0">
                Generated at: {new Date().toLocaleString('en-GB')}
              </Text>
              <Hr className="border-gray-600 my-4" />
              <Text className="text-gray-400 text-xs m-0">
                For questions or support, contact:{' '}
                <Link 
                  href="mailto:reports@backroomleeds.co.uk"
                  className="text-speakeasy-gold hover:text-speakeasy-champagne"
                >
                  reports@backroomleeds.co.uk
                </Link>
              </Text>
            </Section>

          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
};

export default DailyReportTemplate;