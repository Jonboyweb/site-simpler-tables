/**
 * The Backroom Leeds - Reporting Dashboard
 * Version: 1.0.0
 * Phase: 3, Step 3.5
 * 
 * Comprehensive reporting dashboard for admin users
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/molecules/Card';
import { Button } from '@/components/atoms/Button';
import { LoadingSpinner } from '@/components/atoms/LoadingSpinner';
import { Badge } from '@/components/atoms/Badge';
import { format, subDays, startOfWeek, endOfWeek } from 'date-fns';

// ============================================================================
// TYPES
// ============================================================================

interface ReportMetric {
  name: string;
  value: string | number;
  unit?: string;
  trend?: 'up' | 'down' | 'stable';
  changePercentage?: number;
}

interface JobStatus {
  jobId: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  timestamp: string;
  type?: string;
}

interface SystemHealth {
  status: 'healthy' | 'degraded' | 'unhealthy';
  components: {
    scheduler: { status: string; redis: boolean };
    system: { load: number; runningJobs: number; failedJobs: number };
    queues: { waiting: number; active: number; failed: number };
  };
  alerts: Array<{ type: string; message: string }>;
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export const ReportingDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'overview' | 'reports' | 'jobs' | 'recipients' | 'analytics'>('overview');
  const [isLoading, setIsLoading] = useState(true);
  const [systemHealth, setSystemHealth] = useState<SystemHealth | null>(null);
  const [recentMetrics, setRecentMetrics] = useState<ReportMetric[]>([]);
  const [recentJobs, setRecentJobs] = useState<JobStatus[]>([]);

  // ============================================================================
  // EFFECTS
  // ============================================================================

  useEffect(() => {
    loadDashboardData();
    
    // Set up polling for real-time updates
    const interval = setInterval(loadDashboardData, 30000); // Update every 30 seconds
    return () => clearInterval(interval);
  }, []);

  // ============================================================================
  // DATA LOADING
  // ============================================================================

  const loadDashboardData = async () => {
    try {
      setIsLoading(true);

      const [healthResponse, metricsResponse, jobsResponse] = await Promise.all([
        fetch('/api/reporting/jobs/status?systemHealth=true'),
        fetch('/api/reporting/analytics/metrics?metrics=daily_revenue,total_bookings,table_occupancy_rate,customer_satisfaction'),
        fetch('/api/reporting/jobs/status')
      ]);

      if (healthResponse.ok) {
        const health = await healthResponse.json();
        setSystemHealth(health);
      }

      if (metricsResponse.ok) {
        const metrics = await metricsResponse.json();
        setRecentMetrics(metrics.metrics || []);
      }

      if (jobsResponse.ok) {
        const jobs = await jobsResponse.json();
        setRecentJobs(jobs.recentJobs || []);
      }

    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // ============================================================================
  // EVENT HANDLERS
  // ============================================================================

  const handleGenerateReport = async (type: 'daily' | 'weekly') => {
    try {
      const endpoint = type === 'daily' 
        ? '/api/reporting/generate/daily'
        : '/api/reporting/generate/weekly';

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          async: true,
          format: 'pdf'
        })
      });

      if (response.ok) {
        const result = await response.json();
        console.log(`${type} report generation queued:`, result);
        await loadDashboardData(); // Refresh data
      }
    } catch (error) {
      console.error(`Error generating ${type} report:`, error);
    }
  };

  const handleJobAction = async (jobId: string, action: 'pause' | 'resume' | 'cancel') => {
    try {
      const response = await fetch('/api/reporting/jobs/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, jobId })
      });

      if (response.ok) {
        await loadDashboardData(); // Refresh data
      }
    } catch (error) {
      console.error(`Error performing ${action} on job ${jobId}:`, error);
    }
  };

  // ============================================================================
  // RENDER METHODS
  // ============================================================================

  const renderOverview = () => (
    <div className="space-y-6">
      {/* System Health */}
      <Card className="p-6 bg-gradient-to-r from-speakeasy-noir to-speakeasy-smoke">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bebas text-speakeasy-gold">System Health</h3>
          <Badge 
            variant={systemHealth?.status === 'healthy' ? 'success' : 
                   systemHealth?.status === 'degraded' ? 'warning' : 'error'}
          >
            {systemHealth?.status || 'Unknown'}
          </Badge>
        </div>
        
        {systemHealth && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-speakeasy-champagne">
                {systemHealth.components.scheduler.redis ? '✅' : '❌'}
              </div>
              <div className="text-sm text-gray-300">Redis Connection</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-speakeasy-champagne">
                {systemHealth.components.system.load}%
              </div>
              <div className="text-sm text-gray-300">System Load</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-speakeasy-champagne">
                {systemHealth.components.queues.waiting}
              </div>
              <div className="text-sm text-gray-300">Jobs Waiting</div>
            </div>
          </div>
        )}

        {/* System Alerts */}
        {systemHealth?.alerts && systemHealth.alerts.length > 0 && (
          <div className="mt-4 space-y-2">
            {systemHealth.alerts.map((alert, index) => (
              <div 
                key={index}
                className={`p-2 rounded text-sm ${
                  alert.type === 'critical' ? 'bg-red-100 text-red-800' :
                  alert.type === 'warning' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-blue-100 text-blue-800'
                }`}
              >
                <span className="font-medium">{alert.type.toUpperCase()}:</span> {alert.message}
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {recentMetrics.map((metric, index) => (
          <Card key={index} className="p-4">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-medium text-gray-600 capitalize">
                {metric.name.replace(/_/g, ' ')}
              </h4>
              {metric.trend && (
                <span className={`text-xs ${
                  metric.trend === 'up' ? 'text-green-600' :
                  metric.trend === 'down' ? 'text-red-600' :
                  'text-gray-500'
                }`}>
                  {metric.trend === 'up' ? '↗' : metric.trend === 'down' ? '↘' : '→'}
                  {metric.changePercentage ? ` ${metric.changePercentage}%` : ''}
                </span>
              )}
            </div>
            <div className="text-2xl font-bold text-speakeasy-noir">
              {typeof metric.value === 'number' ? metric.value.toLocaleString() : metric.value}
              {metric.unit && <span className="text-sm text-gray-500 ml-1">{metric.unit}</span>}
            </div>
          </Card>
        ))}
      </div>

      {/* Quick Actions */}
      <Card className="p-6">
        <h3 className="text-xl font-bebas text-speakeasy-noir mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Button 
            onClick={() => handleGenerateReport('daily')}
            className="bg-speakeasy-burgundy hover:bg-speakeasy-burgundy/80"
          >
            Generate Daily Report
          </Button>
          <Button 
            onClick={() => handleGenerateReport('weekly')}
            className="bg-speakeasy-copper hover:bg-speakeasy-copper/80"
          >
            Generate Weekly Report
          </Button>
          <Button 
            onClick={() => setActiveTab('recipients')}
            variant="outline"
          >
            Manage Recipients
          </Button>
        </div>
      </Card>

      {/* Recent Jobs */}
      <Card className="p-6">
        <h3 className="text-xl font-bebas text-speakeasy-noir mb-4">Recent Jobs</h3>
        <div className="space-y-2">
          {recentJobs.slice(0, 5).map((job, index) => (
            <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded">
              <div>
                <div className="font-medium">{job.jobId}</div>
                <div className="text-sm text-gray-500">
                  {format(new Date(job.timestamp), 'MMM dd, HH:mm')}
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Badge 
                  variant={
                    job.status === 'completed' ? 'success' :
                    job.status === 'failed' ? 'error' :
                    job.status === 'running' ? 'info' : 'default'
                  }
                >
                  {job.status}
                </Badge>
                {job.status === 'running' && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleJobAction(job.jobId, 'pause')}
                  >
                    Pause
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );

  const renderReports = () => (
    <div className="space-y-6">
      <Card className="p-6">
        <h3 className="text-xl font-bebas text-speakeasy-noir mb-4">Report Management</h3>
        <ReportManagement />
      </Card>
    </div>
  );

  const renderJobs = () => (
    <div className="space-y-6">
      <Card className="p-6">
        <h3 className="text-xl font-bebas text-speakeasy-noir mb-4">Job Management</h3>
        <JobManagement />
      </Card>
    </div>
  );

  const renderRecipients = () => (
    <div className="space-y-6">
      <Card className="p-6">
        <h3 className="text-xl font-bebas text-speakeasy-noir mb-4">Recipient Management</h3>
        <RecipientManagement />
      </Card>
    </div>
  );

  const renderAnalytics = () => (
    <div className="space-y-6">
      <Card className="p-6">
        <h3 className="text-xl font-bebas text-speakeasy-noir mb-4">Analytics & KPIs</h3>
        <AnalyticsView />
      </Card>
    </div>
  );

  // ============================================================================
  // MAIN RENDER
  // ============================================================================

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bebas text-speakeasy-noir">Reporting Dashboard</h1>
          <p className="text-gray-600 mt-1">
            Comprehensive business intelligence and reporting management
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant="info">
            Last updated: {format(new Date(), 'HH:mm:ss')}
          </Badge>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8">
          {[
            { key: 'overview', label: 'Overview', icon: '📊' },
            { key: 'reports', label: 'Reports', icon: '📄' },
            { key: 'jobs', label: 'Jobs', icon: '⚙️' },
            { key: 'recipients', label: 'Recipients', icon: '👥' },
            { key: 'analytics', label: 'Analytics', icon: '📈' }
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === tab.key
                  ? 'border-speakeasy-gold text-speakeasy-burgundy'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <span className="mr-2">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Content */}
      <div className="min-h-[600px]">
        {activeTab === 'overview' && renderOverview()}
        {activeTab === 'reports' && renderReports()}
        {activeTab === 'jobs' && renderJobs()}
        {activeTab === 'recipients' && renderRecipients()}
        {activeTab === 'analytics' && renderAnalytics()}
      </div>
    </div>
  );
};

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

const ReportManagement: React.FC = () => {
  const [reports, setReports] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="font-medium">Generated Reports</h4>
        <div className="space-x-2">
          <Button size="sm" variant="outline">
            Filter
          </Button>
          <Button size="sm" variant="outline">
            Export
          </Button>
        </div>
      </div>
      
      <div className="text-center py-8 text-gray-500">
        Report management interface will be implemented here
      </div>
    </div>
  );
};

const JobManagement: React.FC = () => {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="font-medium">Scheduled Jobs</h4>
        <Button size="sm" variant="outline">
          Schedule New Job
        </Button>
      </div>
      
      <div className="text-center py-8 text-gray-500">
        Job management interface will be implemented here
      </div>
    </div>
  );
};

const RecipientManagement: React.FC = () => {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="font-medium">Report Recipients</h4>
        <Button size="sm" className="bg-speakeasy-burgundy">
          Add Recipient
        </Button>
      </div>
      
      <div className="text-center py-8 text-gray-500">
        Recipient management interface will be implemented here
      </div>
    </div>
  );
};

const AnalyticsView: React.FC = () => {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="font-medium">Business Analytics</h4>
        <div className="space-x-2">
          <Button size="sm" variant="outline">
            Date Range
          </Button>
          <Button size="sm" variant="outline">
            Metrics
          </Button>
        </div>
      </div>
      
      <div className="text-center py-8 text-gray-500">
        Analytics dashboard will be implemented here
      </div>
    </div>
  );
};