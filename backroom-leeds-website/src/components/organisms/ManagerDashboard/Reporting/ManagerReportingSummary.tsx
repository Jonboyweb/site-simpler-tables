'use client';

import { Text, Button } from '@/components/atoms';
import { Card } from '@/components/molecules';

export function ManagerReportingSummary() {
  return (
    <div className="space-y-6">
      {/* Quick Reports Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-6">
          <div className="text-center">
            <div className="text-3xl mb-3">📊</div>
            <Text className="text-speakeasy-gold font-medium mb-2">
              Revenue Analytics
            </Text>
            <Text variant="caption" className="text-speakeasy-champagne/70 mb-4">
              Daily, weekly, and monthly revenue tracking with trends
            </Text>
            <Button variant="outline" size="sm">
              View Revenue
            </Button>
          </div>
        </Card>

        <Card className="p-6">
          <div className="text-center">
            <div className="text-3xl mb-3">👥</div>
            <Text className="text-speakeasy-gold font-medium mb-2">
              Customer Insights
            </Text>
            <Text variant="caption" className="text-speakeasy-champagne/70 mb-4">
              Customer behavior, demographics, and repeat booking analysis
            </Text>
            <Button variant="outline" size="sm">
              View Insights
            </Button>
          </div>
        </Card>

        <Card className="p-6">
          <div className="text-center">
            <div className="text-3xl mb-3">📈</div>
            <Text className="text-speakeasy-gold font-medium mb-2">
              Performance Metrics
            </Text>
            <Text variant="caption" className="text-speakeasy-champagne/70 mb-4">
              Table utilization, occupancy rates, and operational KPIs
            </Text>
            <Button variant="outline" size="sm">
              View Metrics
            </Button>
          </div>
        </Card>
      </div>

      {/* Comprehensive Reporting Features */}
      <Card className="p-8">
        <div className="max-w-4xl mx-auto text-center">
          <div className="text-6xl mb-6">📋</div>
          <Text className="text-speakeasy-gold text-xl mb-4">
            Comprehensive Reporting & Analytics Suite
          </Text>
          <Text className="text-speakeasy-champagne/70 mb-8 max-w-2xl mx-auto">
            Advanced reporting capabilities with PDF/CSV exports, real-time analytics, 
            and business intelligence dashboards will be available here.
          </Text>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-left">
            <div>
              <Text className="text-speakeasy-gold font-medium mb-4">Revenue & Financial Reports</Text>
              <ul className="text-speakeasy-champagne/60 text-sm space-y-2">
                <li>• Daily, weekly, monthly revenue summaries</li>
                <li>• Drinks package performance analysis</li>
                <li>• Deposit and payment tracking</li>
                <li>• Refund and cancellation reports</li>
                <li>• Profit margin analysis by event type</li>
                <li>• Tax reporting and compliance</li>
              </ul>
            </div>

            <div>
              <Text className="text-speakeasy-gold font-medium mb-4">Operational Analytics</Text>
              <ul className="text-speakeasy-champagne/60 text-sm space-y-2">
                <li>• Table utilization and occupancy rates</li>
                <li>• Peak hours and capacity analysis</li>
                <li>• Staff scheduling optimization</li>
                <li>• Event performance comparisons</li>
                <li>• No-show and cancellation trends</li>
                <li>• Waitlist conversion analysis</li>
              </ul>
            </div>

            <div>
              <Text className="text-speakeasy-gold font-medium mb-4">Customer Intelligence</Text>
              <ul className="text-speakeasy-champagne/60 text-sm space-y-2">
                <li>• Customer segmentation and demographics</li>
                <li>• Repeat booking patterns and loyalty</li>
                <li>• Average party size and spending</li>
                <li>• Booking lead times and preferences</li>
                <li>• Customer lifetime value analysis</li>
                <li>• Marketing campaign effectiveness</li>
              </ul>
            </div>

            <div>
              <Text className="text-speakeasy-gold font-medium mb-4">Export & Automation</Text>
              <ul className="text-speakeasy-champagne/60 text-sm space-y-2">
                <li>• PDF report generation with branding</li>
                <li>• CSV data exports for external analysis</li>
                <li>• Automated daily/weekly report emails</li>
                <li>• Custom report builder and scheduler</li>
                <li>• API integration for external systems</li>
                <li>• Real-time dashboard widgets</li>
              </ul>
            </div>
          </div>

          <div className="flex gap-4 justify-center mt-8">
            <Button variant="primary" href="/admin/reports">
              Current Reports Page
            </Button>
            <Button variant="outline" href="/admin/reports/export">
              Export Data
            </Button>
            <Button variant="ghost" href="/admin/reports/schedule">
              Schedule Reports
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}