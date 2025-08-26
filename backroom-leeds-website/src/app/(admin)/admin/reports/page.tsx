/**
 * The Backroom Leeds - Admin Reports Page
 * Version: 1.0.0
 * Phase: 3, Step 3.5
 * 
 * Admin dashboard page for comprehensive reporting system management
 */

import type { Metadata } from 'next';
import { ReportingDashboard } from '@/components/organisms/ReportingDashboard';

export const metadata: Metadata = {
  title: 'Reports & Analytics | The Backroom Leeds Admin',
  description: 'Comprehensive reporting dashboard for business intelligence and automated report management',
  robots: {
    index: false,
    follow: false,
  },
};

export default function AdminReportsPage() {
  return (
    <div className="min-h-screen">
      <div className="container mx-auto px-4 py-8">
        <ReportingDashboard />
      </div>
    </div>
  );
}

// ============================================================================
// ADDITIONAL COMPONENTS FOR FUTURE ENHANCEMENT
// ============================================================================

/**
 * These components can be implemented in future iterations:
 * 
 * - ReportTemplateManager: Manage report templates and customization
 * - KPIConfigManager: Configure KPIs and thresholds  
 * - ScheduleManager: Manage recurring report schedules
 * - DeliveryTracking: Track email delivery status and analytics
 * - ReportViewer: Preview and download generated reports
 * - AlertsManager: Manage job alerts and notifications
 * - PerformanceAnalytics: System performance monitoring
 * - AuditLogs: User activity and system audit trails
 */
}