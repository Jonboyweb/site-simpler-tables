/**
 * The Backroom Leeds - Alert Email Template
 * Version: 1.0.0
 * Phase: 3, Step 3.5
 * 
 * Professional React Email template for job alerts and system notifications
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

interface AlertTemplateProps {
  alertData: {
    jobName: string;
    jobDescription?: string;
    alertType: string;
    timestamp: string;
    executionData?: {
      status: string;
      errorMessage?: string;
      executionTimeMs?: number;
      attemptNumber?: number;
      errorStack?: string;
    };
    metadata?: Record<string, any>;
  };
}

interface AlertTypeConfig {
  icon: string;
  bgColor: string;
  textColor: string;
  title: string;
  description: string;
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

const getAlertTypeConfig = (alertType: string): AlertTypeConfig => {
  const configs: Record<string, AlertTypeConfig> = {
    failure: {
      icon: '🚨',
      bgColor: 'bg-red-100',
      textColor: 'text-red-700',
      title: 'Job Failure Alert',
      description: 'A scheduled job has failed to complete successfully'
    },
    consecutive_failures: {
      icon: '⚠️',
      bgColor: 'bg-orange-100',
      textColor: 'text-orange-700',
      title: 'Multiple Failures Detected',
      description: 'Multiple consecutive job failures have been detected'
    },
    slow_execution: {
      icon: '🐌',
      bgColor: 'bg-yellow-100',
      textColor: 'text-yellow-700',
      title: 'Performance Warning',
      description: 'Job execution time exceeds normal thresholds'
    },
    timeout: {
      icon: '⏰',
      bgColor: 'bg-purple-100',
      textColor: 'text-purple-700',
      title: 'Timeout Alert',
      description: 'Job execution has exceeded the maximum time limit'
    },
    system: {
      icon: '⚙️',
      bgColor: 'bg-blue-100',
      textColor: 'text-blue-700',
      title: 'System Alert',
      description: 'A system-level issue requires attention'
    }
  };

  return configs[alertType] || {
    icon: '🔔',
    bgColor: 'bg-gray-100',
    textColor: 'text-gray-700',
    title: 'General Alert',
    description: 'An alert has been triggered'
  };
};

const formatDuration = (ms: number): string => {
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  return `${(ms / 60000).toFixed(1)}min`;
};

const getSeverityLevel = (alertType: string): 'critical' | 'warning' | 'info' => {
  const criticalTypes = ['failure', 'consecutive_failures', 'timeout'];
  const warningTypes = ['slow_execution'];
  
  if (criticalTypes.includes(alertType)) return 'critical';
  if (warningTypes.includes(alertType)) return 'warning';
  return 'info';
};

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

const AlertHeader: React.FC<{ config: AlertTypeConfig; severity: string; timestamp: string }> = ({ 
  config, 
  severity, 
  timestamp 
}) => (
  <Section className={`${config.bgColor} rounded-lg p-6 text-center border-2 ${
    severity === 'critical' ? 'border-red-500' : 
    severity === 'warning' ? 'border-yellow-500' : 
    'border-blue-500'
  }`}>
    <Text className="text-4xl m-0 mb-2">{config.icon}</Text>
    <Heading className={`${config.textColor} font-bebas text-2xl m-0 mb-2`}>
      {config.title}
    </Heading>
    <Text className={`${config.textColor} text-sm m-0 mb-2`}>
      {config.description}
    </Text>
    <Text className="text-gray-600 text-xs m-0">
      {new Date(timestamp).toLocaleString('en-GB', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        timeZoneName: 'short'
      })}
    </Text>
  </Section>
);

const JobDetails: React.FC<{ jobName: string; description?: string }> = ({ 
  jobName, 
  description 
}) => (
  <Section className="bg-white border border-gray-200 rounded-lg p-4">
    <Text className="font-medium text-speakeasy-noir mb-2 m-0">Job Information</Text>
    <div className="bg-gray-50 rounded p-3">
      <div className="flex justify-between items-start mb-2">
        <Text className="text-sm text-gray-600 m-0">Job Name:</Text>
        <Text className="text-sm font-medium text-speakeasy-noir m-0">{jobName}</Text>
      </div>
      {description && (
        <div className="flex justify-between items-start">
          <Text className="text-sm text-gray-600 m-0">Description:</Text>
          <Text className="text-sm text-gray-700 m-0 max-w-xs text-right">{description}</Text>
        </div>
      )}
    </div>
  </Section>
);

const ExecutionDetails: React.FC<{ executionData: any }> = ({ executionData }) => (
  <Section className="bg-white border border-gray-200 rounded-lg p-4">
    <Text className="font-medium text-speakeasy-noir mb-2 m-0">Execution Details</Text>
    <div className="bg-red-50 rounded p-3">
      <div className="grid grid-cols-2 gap-3">
        <div className="flex justify-between">
          <Text className="text-sm text-gray-600 m-0">Status:</Text>
          <Text className={`text-sm font-medium m-0 ${
            executionData.status === 'failed' ? 'text-red-600' :
            executionData.status === 'running' ? 'text-blue-600' :
            'text-gray-700'
          }`}>
            {executionData.status?.toUpperCase()}
          </Text>
        </div>
        
        {executionData.executionTimeMs && (
          <div className="flex justify-between">
            <Text className="text-sm text-gray-600 m-0">Duration:</Text>
            <Text className="text-sm text-gray-700 m-0">
              {formatDuration(executionData.executionTimeMs)}
            </Text>
          </div>
        )}
        
        {executionData.attemptNumber && (
          <div className="flex justify-between">
            <Text className="text-sm text-gray-600 m-0">Attempt:</Text>
            <Text className="text-sm text-gray-700 m-0">#{executionData.attemptNumber}</Text>
          </div>
        )}
        
        <div className="flex justify-between">
          <Text className="text-sm text-gray-600 m-0">System:</Text>
          <Text className="text-sm text-gray-700 m-0">Production</Text>
        </div>
      </div>
      
      {executionData.errorMessage && (
        <div className="mt-3 pt-3 border-t border-red-200">
          <Text className="text-sm text-gray-600 mb-1 m-0">Error Message:</Text>
          <div className="bg-red-100 rounded p-2">
            <Text className="text-sm text-red-800 font-mono m-0">
              {executionData.errorMessage}
            </Text>
          </div>
        </div>
      )}
    </div>
  </Section>
);

const ActionItems: React.FC<{ alertType: string; severity: string }> = ({ 
  alertType, 
  severity 
}) => {
  const getActionItems = () => {
    switch (alertType) {
      case 'failure':
        return [
          'Check the job execution logs for detailed error information',
          'Verify system resources and dependencies are available',
          'Review recent code changes that might affect job execution',
          'Consider temporarily disabling the job if issues persist'
        ];
      case 'consecutive_failures':
        return [
          'Immediate investigation required - multiple failures detected',
          'Check system health and resource availability',
          'Review job configuration and dependencies',
          'Consider escalating to senior technical staff'
        ];
      case 'slow_execution':
        return [
          'Monitor system performance and resource usage',
          'Review job efficiency and optimization opportunities',
          'Check database performance and query optimization',
          'Consider scaling resources if needed'
        ];
      case 'timeout':
        return [
          'Investigate why job execution is taking longer than expected',
          'Check for resource constraints or blocking operations',
          'Review timeout settings and adjust if necessary',
          'Monitor for deadlocks or long-running queries'
        ];
      default:
        return [
          'Review the alert details and job execution logs',
          'Check system status and resource availability',
          'Contact technical support if issues persist'
        ];
    }
  };

  const actions = getActionItems();
  const priority = severity === 'critical' ? 'High Priority' : 
                   severity === 'warning' ? 'Medium Priority' : 'Low Priority';
  const priorityColor = severity === 'critical' ? 'text-red-600' : 
                        severity === 'warning' ? 'text-yellow-600' : 'text-blue-600';

  return (
    <Section className="bg-white border border-gray-200 rounded-lg p-4">
      <div className="flex justify-between items-center mb-3">
        <Text className="font-medium text-speakeasy-noir m-0">Recommended Actions</Text>
        <span className={`px-2 py-1 rounded text-xs font-medium ${priorityColor} bg-current bg-opacity-10`}>
          {priority}
        </span>
      </div>
      <div className="bg-blue-50 rounded p-3">
        <ul className="space-y-2">
          {actions.map((action, index) => (
            <li key={index}>
              <Text className="text-sm text-blue-800 m-0">
                {index + 1}. {action}
              </Text>
            </li>
          ))}
        </ul>
      </div>
    </Section>
  );
};

// ============================================================================
// MAIN TEMPLATE COMPONENT
// ============================================================================

export const AlertTemplate: React.FC<AlertTemplateProps> = ({ alertData }) => {
  const config = getAlertTypeConfig(alertData.alertType);
  const severity = getSeverityLevel(alertData.alertType);
  
  const previewText = `${config.title}: ${alertData.jobName} - Immediate attention required`;

  return (
    <Html>
      <Head />
      <Preview>{previewText}</Preview>
      <Tailwind config={tailwindConfig}>
        <Body className="bg-gray-50 font-inter">
          <Container className="mx-auto py-8 px-4 max-w-4xl">
            
            {/* Branding Header */}
            <Section className="bg-speakeasy-noir rounded-t-lg py-4 px-6 text-center">
              <Img
                src="https://backroomleeds.co.uk/logo-white.png"
                alt="The Backroom Leeds"
                className="mx-auto mb-2"
                width="100"
                height="30"
              />
              <Text className="text-speakeasy-champagne text-sm m-0">
                Automated Monitoring & Alerting System
              </Text>
            </Section>

            {/* Alert Header */}
            <Section className="bg-white px-6 py-6 border-l border-r border-gray-200">
              <AlertHeader 
                config={config} 
                severity={severity} 
                timestamp={alertData.timestamp} 
              />
            </Section>

            {/* Job Details */}
            <Section className="bg-white px-6 py-4 border-l border-r border-gray-200">
              <JobDetails 
                jobName={alertData.jobName} 
                description={alertData.jobDescription} 
              />
            </Section>

            {/* Execution Details */}
            {alertData.executionData && (
              <Section className="bg-white px-6 py-4 border-l border-r border-gray-200">
                <ExecutionDetails executionData={alertData.executionData} />
              </Section>
            )}

            {/* Action Items */}
            <Section className="bg-white px-6 py-4 border-l border-r border-gray-200">
              <ActionItems alertType={alertData.alertType} severity={severity} />
            </Section>

            {/* System Information */}
            <Section className="bg-white px-6 py-4 border-l border-r border-gray-200">
              <Text className="font-medium text-speakeasy-noir mb-2 m-0">System Information</Text>
              <div className="bg-gray-50 rounded p-3">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="flex justify-between">
                    <Text className="text-gray-600 m-0">Environment:</Text>
                    <Text className="text-gray-700 font-medium m-0">Production</Text>
                  </div>
                  <div className="flex justify-between">
                    <Text className="text-gray-600 m-0">Service:</Text>
                    <Text className="text-gray-700 font-medium m-0">Reporting System</Text>
                  </div>
                  <div className="flex justify-between">
                    <Text className="text-gray-600 m-0">Alert ID:</Text>
                    <Text className="text-gray-700 font-mono text-xs m-0">
                      {alertData.timestamp.slice(-8)}
                    </Text>
                  </div>
                  <div className="flex justify-between">
                    <Text className="text-gray-600 m-0">Severity:</Text>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      severity === 'critical' ? 'bg-red-100 text-red-700' :
                      severity === 'warning' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-blue-100 text-blue-700'
                    }`}>
                      {severity.toUpperCase()}
                    </span>
                  </div>
                </div>
              </div>
            </Section>

            {/* Support Information */}
            <Section className="bg-white px-6 py-4 border-l border-r border-gray-200">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <Text className="font-medium text-blue-900 mb-2 m-0 flex items-center">
                  💬 Need Help?
                </Text>
                <Text className="text-sm text-blue-800 mb-3 m-0">
                  If you need assistance resolving this alert, our technical support team is here to help.
                </Text>
                <Row>
                  <Column className="w-1/2">
                    <Text className="text-sm text-blue-700 m-0">
                      <strong>Technical Support:</strong><br />
                      <Link href="mailto:tech@backroomleeds.co.uk" className="text-blue-600">
                        tech@backroomleeds.co.uk
                      </Link>
                    </Text>
                  </Column>
                  <Column className="w-1/2">
                    <Text className="text-sm text-blue-700 m-0">
                      <strong>Emergency Contact:</strong><br />
                      +44 113 XXX XXXX<br />
                      (24/7 Critical Issues)
                    </Text>
                  </Column>
                </Row>
              </div>
            </Section>

            {/* Footer */}
            <Section className="bg-speakeasy-smoke rounded-b-lg px-6 py-6 text-center">
              <Text className="text-speakeasy-champagne text-sm m-0 mb-2">
                This alert was generated automatically by The Backroom Leeds monitoring system.
              </Text>
              <Text className="text-gray-400 text-xs m-0">
                Please do not reply to this email. For support, use the contact information above.
              </Text>
              <Hr className="border-gray-600 my-4" />
              <Text className="text-gray-400 text-xs m-0">
                The Backroom Leeds | Automated Monitoring System<br />
                Alert generated: {new Date().toLocaleString('en-GB')}
              </Text>
            </Section>

          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
};

export default AlertTemplate;