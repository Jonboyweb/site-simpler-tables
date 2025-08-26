/**
 * The Backroom Leeds - Weekly Report Email Template
 * Version: 1.0.0
 * Phase: 3, Step 3.5
 * 
 * Professional React Email template for weekly summary reports with trends
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
import { WeeklySummaryReportData } from '@/types/reporting';

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

interface WeeklyReportTemplateProps {
  reportData: WeeklySummaryReportData;
}

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: 'up' | 'down' | 'stable';
  trendValue?: string;
  trendColor?: string;
}

interface DayRowProps {
  day: {
    date: Date;
    bookings: number;
    revenue: number;
    guests: number;
    occupancyRate: number;
  };
  isWeekend?: boolean;
}

interface EventRowProps {
  event: {
    eventName: string;
    totalGuests: number;
    totalRevenue: number;
    tableOccupancyRate: number;
    checkInRate: number;
  };
}

interface TrendIndicatorProps {
  trend: 'up' | 'down' | 'stable';
  label: string;
}

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

const MetricCard: React.FC<MetricCardProps> = ({ 
  title, 
  value, 
  subtitle, 
  trend, 
  trendValue,
  trendColor
}) => (
  <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
    <Text className="text-sm text-gray-600 font-medium mb-1 m-0">{title}</Text>
    <Text className="text-2xl font-bold text-speakeasy-noir m-0">{value}</Text>
    {subtitle && (
      <Text className="text-xs text-gray-500 mt-1 m-0">{subtitle}</Text>
    )}
    {trend && trendValue && (
      <div className="flex items-center mt-2">
        <span className={`text-xs font-medium ${trendColor || 
          (trend === 'up' ? 'text-green-600' : 
           trend === 'down' ? 'text-red-600' : 
           'text-gray-500')
        }`}>
          {trend === 'up' ? '↗' : trend === 'down' ? '↘' : '→'} {trendValue}
        </span>
      </div>
    )}
  </div>
);

const DayRow: React.FC<DayRowProps> = ({ day, isWeekend }) => {
  const dayName = day.date.toLocaleDateString('en-GB', { weekday: 'short' });
  const dateStr = day.date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
  
  return (
    <tr className={`border-b border-gray-100 ${isWeekend ? 'bg-speakeasy-gold/5' : ''}`}>
      <td className="py-3 px-4 text-left">
        <Text className="font-medium text-speakeasy-noir m-0">
          {dayName}
        </Text>
        <Text className="text-xs text-gray-500 m-0">{dateStr}</Text>
      </td>
      <td className="py-3 px-4 text-center">
        <Text className="text-gray-700 m-0">{day.bookings}</Text>
      </td>
      <td className="py-3 px-4 text-center">
        <Text className="text-gray-700 m-0">£{day.revenue.toFixed(0)}</Text>
      </td>
      <td className="py-3 px-4 text-center">
        <Text className="text-gray-700 m-0">{day.guests}</Text>
      </td>
      <td className="py-3 px-4 text-center">
        <Text className={`m-0 ${day.occupancyRate > 70 ? 'text-green-600 font-medium' : 
          day.occupancyRate < 40 ? 'text-red-600 font-medium' : 'text-gray-700'}`}>
          {day.occupancyRate.toFixed(1)}%
        </Text>
      </td>
    </tr>
  );
};

const EventRow: React.FC<EventRowProps> = ({ event }) => (
  <tr className="border-b border-gray-100">
    <td className="py-3 px-4 text-left">
      <Text className="font-medium text-speakeasy-noir m-0">{event.eventName}</Text>
    </td>
    <td className="py-3 px-4 text-center">
      <Text className="text-gray-700 m-0">{event.totalGuests}</Text>
    </td>
    <td className="py-3 px-4 text-center">
      <Text className="text-gray-700 m-0">£{event.totalRevenue.toFixed(0)}</Text>
    </td>
    <td className="py-3 px-4 text-center">
      <Text className="text-gray-700 m-0">{event.tableOccupancyRate.toFixed(1)}%</Text>
    </td>
    <td className="py-3 px-4 text-center">
      <Text className={`m-0 ${event.checkInRate > 85 ? 'text-green-600 font-medium' : 
        event.checkInRate < 70 ? 'text-orange-600 font-medium' : 'text-gray-700'}`}>
        {event.checkInRate.toFixed(1)}%
      </Text>
    </td>
  </tr>
);

const TrendIndicator: React.FC<TrendIndicatorProps> = ({ trend, label }) => (
  <div className={`flex items-center justify-center px-3 py-2 rounded-full ${
    trend === 'up' ? 'bg-green-100 text-green-700' :
    trend === 'down' ? 'bg-red-100 text-red-700' :
    'bg-gray-100 text-gray-700'
  }`}>
    <span className="text-lg mr-1">
      {trend === 'up' ? '📈' : trend === 'down' ? '📉' : '➖'}
    </span>
    <Text className="text-sm font-medium m-0">{label}</Text>
  </div>
);

// ============================================================================
// MAIN TEMPLATE COMPONENT
// ============================================================================

export const WeeklyReportTemplate: React.FC<WeeklyReportTemplateProps> = ({ 
  reportData 
}) => {
  const weekStart = new Date(reportData.weekStart);
  const weekEnd = new Date(reportData.weekEnd);
  
  const startStr = weekStart.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
  const endStr = weekEnd.toLocaleDateString('en-GB', { 
    day: 'numeric', 
    month: 'short', 
    year: 'numeric' 
  });

  const previewText = `Weekly Summary ${startStr} to ${endStr} - ${reportData.overview.totalBookings} bookings, £${reportData.overview.totalRevenue.toFixed(0)} revenue`;

  const formatTrendValue = (change: number): { value: string; color: string } => {
    const sign = change > 0 ? '+' : '';
    const color = change > 0 ? 'text-green-600' : change < 0 ? 'text-red-600' : 'text-gray-500';
    return { value: `${sign}${change.toFixed(1)}%`, color };
  };

  const bookingTrend = formatTrendValue(reportData.overview.vsLastWeek.bookingsChange);
  const revenueTrend = formatTrendValue(reportData.overview.vsLastWeek.revenueChange);
  const guestTrend = formatTrendValue(reportData.overview.vsLastWeek.guestsChange);

  return (
    <Html>
      <Head />
      <Preview>{previewText}</Preview>
      <Tailwind config={tailwindConfig}>
        <Body className="bg-gray-50 font-inter">
          <Container className="mx-auto py-8 px-4 max-w-5xl">
            
            {/* Header */}
            <Section className="bg-gradient-to-r from-speakeasy-noir via-speakeasy-smoke to-speakeasy-noir rounded-t-lg py-8 px-6 text-center">
              <Img
                src="https://backroomleeds.co.uk/logo-white.png"
                alt="The Backroom Leeds"
                className="mx-auto mb-4"
                width="140"
                height="45"
              />
              <Heading className="text-speakeasy-gold font-bebas text-4xl m-0 mb-2">
                WEEKLY SUMMARY REPORT
              </Heading>
              <Text className="text-speakeasy-champagne text-xl m-0">
                {startStr} to {endStr}
              </Text>
            </Section>

            {/* Executive Overview */}
            <Section className="bg-white px-6 py-6 border-l border-r border-gray-200">
              <Heading className="text-speakeasy-noir font-playfair text-2xl mb-6 text-center">
                Weekly Performance Overview
              </Heading>
              
              <Row className="mb-6">
                <Column className="w-1/4 pr-2">
                  <MetricCard 
                    title="Total Bookings"
                    value={reportData.overview.totalBookings}
                    subtitle="this week"
                    trend={reportData.trends.bookingTrend}
                    trendValue={bookingTrend.value}
                    trendColor={bookingTrend.color}
                  />
                </Column>
                <Column className="w-1/4 px-2">
                  <MetricCard 
                    title="Total Revenue"
                    value={`£${reportData.overview.totalRevenue.toFixed(0)}`}
                    subtitle="gross revenue"
                    trend={reportData.trends.revenueTrend}
                    trendValue={revenueTrend.value}
                    trendColor={revenueTrend.color}
                  />
                </Column>
                <Column className="w-1/4 px-2">
                  <MetricCard 
                    title="Total Guests"
                    value={reportData.overview.totalGuests}
                    subtitle="served"
                    trend={guestTrend.value !== '+0.0%' ? 'up' : 'stable'}
                    trendValue={guestTrend.value}
                    trendColor={guestTrend.color}
                  />
                </Column>
                <Column className="w-1/4 pl-2">
                  <MetricCard 
                    title="Avg Occupancy"
                    value={`${reportData.overview.averageOccupancyRate.toFixed(1)}%`}
                    subtitle="weekly average"
                    trend={reportData.trends.occupancyTrend}
                  />
                </Column>
              </Row>

              {/* Trend Indicators */}
              <div className="bg-gradient-to-r from-speakeasy-champagne/20 to-speakeasy-gold/20 rounded-lg p-4">
                <Text className="font-medium text-speakeasy-noir mb-3 text-center m-0">
                  Performance Trends
                </Text>
                <Row>
                  <Column className="w-1/3 text-center">
                    <TrendIndicator 
                      trend={reportData.trends.bookingTrend} 
                      label="Bookings"
                    />
                  </Column>
                  <Column className="w-1/3 text-center">
                    <TrendIndicator 
                      trend={reportData.trends.revenueTrend} 
                      label="Revenue"
                    />
                  </Column>
                  <Column className="w-1/3 text-center">
                    <TrendIndicator 
                      trend={reportData.trends.occupancyTrend} 
                      label="Occupancy"
                    />
                  </Column>
                </Row>
              </div>
            </Section>

            {/* Daily Breakdown */}
            <Section className="bg-white px-6 py-6 border-l border-r border-gray-200">
              <Heading className="text-speakeasy-noir font-playfair text-xl mb-4">
                Daily Performance Breakdown
              </Heading>
              
              <table className="w-full">
                <thead>
                  <tr className="bg-speakeasy-gold/10">
                    <th className="py-3 px-4 text-left text-sm font-medium text-speakeasy-noir">
                      Day
                    </th>
                    <th className="py-3 px-4 text-center text-sm font-medium text-speakeasy-noir">
                      Bookings
                    </th>
                    <th className="py-3 px-4 text-center text-sm font-medium text-speakeasy-noir">
                      Revenue
                    </th>
                    <th className="py-3 px-4 text-center text-sm font-medium text-speakeasy-noir">
                      Guests
                    </th>
                    <th className="py-3 px-4 text-center text-sm font-medium text-speakeasy-noir">
                      Occupancy
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {reportData.dailyBreakdown.map((day, index) => {
                    const dayOfWeek = day.date.getDay();
                    const isWeekend = dayOfWeek === 5 || dayOfWeek === 6 || dayOfWeek === 0; // Fri, Sat, Sun
                    return (
                      <DayRow key={index} day={day} isWeekend={isWeekend} />
                    );
                  })}
                </tbody>
              </table>
            </Section>

            {/* Top Events Performance */}
            {reportData.topEvents.length > 0 && (
              <Section className="bg-white px-6 py-6 border-l border-r border-gray-200">
                <Heading className="text-speakeasy-noir font-playfair text-xl mb-4">
                  Top Event Performances
                </Heading>
                
                <table className="w-full">
                  <thead>
                    <tr className="bg-speakeasy-burgundy/10">
                      <th className="py-3 px-4 text-left text-sm font-medium text-speakeasy-noir">
                        Event
                      </th>
                      <th className="py-3 px-4 text-center text-sm font-medium text-speakeasy-noir">
                        Guests
                      </th>
                      <th className="py-3 px-4 text-center text-sm font-medium text-speakeasy-noir">
                        Revenue
                      </th>
                      <th className="py-3 px-4 text-center text-sm font-medium text-speakeasy-noir">
                        Occupancy
                      </th>
                      <th className="py-3 px-4 text-center text-sm font-medium text-speakeasy-noir">
                        Check-in Rate
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportData.topEvents.slice(0, 5).map((event, index) => (
                      <EventRow key={index} event={event} />
                    ))}
                  </tbody>
                </table>
              </Section>
            )}

            {/* Customer Analytics */}
            <Section className="bg-white px-6 py-6 border-l border-r border-gray-200">
              <Heading className="text-speakeasy-noir font-playfair text-xl mb-4">
                Customer Analytics & Insights
              </Heading>
              
              <Row>
                <Column className="w-1/2 pr-4">
                  <div className="bg-gradient-to-br from-speakeasy-copper/10 to-speakeasy-burgundy/10 rounded-lg p-4">
                    <Text className="font-medium text-speakeasy-noir mb-3 m-0">
                      Customer Acquisition
                    </Text>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center">
                        <Text className="text-3xl font-bold text-speakeasy-burgundy m-0">
                          {reportData.customerMetrics.newCustomers}
                        </Text>
                        <Text className="text-sm text-gray-600 m-0">New Customers</Text>
                      </div>
                      <div className="text-center">
                        <Text className="text-3xl font-bold text-speakeasy-copper m-0">
                          {reportData.customerMetrics.returningRate.toFixed(1)}%
                        </Text>
                        <Text className="text-sm text-gray-600 m-0">Returning Rate</Text>
                      </div>
                    </div>
                  </div>
                </Column>
                <Column className="w-1/2 pl-4">
                  <div className="bg-gradient-to-br from-speakeasy-gold/10 to-speakeasy-champagne/20 rounded-lg p-4">
                    <Text className="font-medium text-speakeasy-noir mb-3 m-0">
                      Customer Value
                    </Text>
                    <div className="text-center">
                      <Text className="text-3xl font-bold text-speakeasy-gold m-0">
                        £{reportData.customerMetrics.averageLTV.toFixed(0)}
                      </Text>
                      <Text className="text-sm text-gray-600 m-0">Average Customer LTV</Text>
                    </div>
                  </div>
                </Column>
              </Row>

              {/* Top Customers */}
              {reportData.customerMetrics.topCustomers.length > 0 && (
                <div className="mt-4">
                  <Text className="font-medium text-speakeasy-noir mb-2 m-0">
                    Top Customers This Week
                  </Text>
                  <div className="bg-gray-50 rounded-lg p-4">
                    {reportData.customerMetrics.topCustomers.slice(0, 3).map((customer, index) => (
                      <div key={index} className="flex justify-between items-center py-2 border-b border-gray-200 last:border-b-0">
                        <Text className="text-sm text-gray-700 m-0">{customer.name}</Text>
                        <div className="text-right">
                          <Text className="text-sm font-medium text-speakeasy-noir m-0">
                            £{customer.spend.toFixed(0)}
                          </Text>
                          <Text className="text-xs text-gray-500 m-0">
                            {customer.bookings} booking{customer.bookings !== 1 ? 's' : ''}
                          </Text>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </Section>

            {/* Recommendations & Alerts */}
            <Section className="bg-white px-6 py-6 border-l border-r border-gray-200">
              <Row>
                {/* Recommendations */}
                <Column className="w-1/2 pr-4">
                  <div className="bg-blue-50 rounded-lg p-4">
                    <Text className="font-medium text-blue-900 mb-3 m-0 flex items-center">
                      💡 Recommendations
                    </Text>
                    {reportData.recommendations.length > 0 ? (
                      <ul className="space-y-2">
                        {reportData.recommendations.slice(0, 3).map((rec, index) => (
                          <li key={index}>
                            <Text className="text-sm text-blue-800 m-0">• {rec}</Text>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <Text className="text-sm text-blue-700 m-0">
                        No specific recommendations at this time. Keep up the excellent work!
                      </Text>
                    )}
                  </div>
                </Column>

                {/* Alerts */}
                <Column className="w-1/2 pl-4">
                  <div className={`rounded-lg p-4 ${
                    reportData.alerts.length > 0 ? 'bg-red-50' : 'bg-green-50'
                  }`}>
                    <Text className={`font-medium mb-3 m-0 flex items-center ${
                      reportData.alerts.length > 0 ? 'text-red-900' : 'text-green-900'
                    }`}>
                      {reportData.alerts.length > 0 ? '⚠️ Alerts' : '✅ All Clear'}
                    </Text>
                    {reportData.alerts.length > 0 ? (
                      <ul className="space-y-2">
                        {reportData.alerts.slice(0, 3).map((alert, index) => (
                          <li key={index}>
                            <Text className="text-sm text-red-800 m-0">• {alert}</Text>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <Text className="text-sm text-green-700 m-0">
                        No alerts or issues detected. Performance is within expected ranges.
                      </Text>
                    )}
                  </div>
                </Column>
              </Row>
            </Section>

            {/* Footer */}
            <Section className="bg-gradient-to-r from-speakeasy-smoke via-speakeasy-noir to-speakeasy-smoke rounded-b-lg px-6 py-8 text-center">
              <Text className="text-speakeasy-champagne text-lg font-medium m-0 mb-4">
                Weekly Report Summary
              </Text>
              <Text className="text-speakeasy-gold text-sm m-0 mb-4">
                This comprehensive weekly analysis helps drive informed business decisions 
                for continued growth and exceptional guest experiences.
              </Text>
              <Hr className="border-gray-600 my-4" />
              <Text className="text-gray-400 text-xs m-0 mb-2">
                Generated automatically by The Backroom Leeds Business Intelligence System
              </Text>
              <Text className="text-gray-400 text-xs m-0">
                Report generated: {new Date().toLocaleString('en-GB')} | 
                For support: <Link 
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

export default WeeklyReportTemplate;