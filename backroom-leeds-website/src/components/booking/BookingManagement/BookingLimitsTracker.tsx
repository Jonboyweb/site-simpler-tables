'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Shield, 
  AlertTriangle, 
  CheckCircle, 
  Users, 
  Calendar,
  Clock,
  Mail,
  Phone,
  CreditCard,
  AlertCircle,
  TrendingUp,
  X
} from 'lucide-react';

import { Badge } from '@/components/atoms/Badge';
import { Button } from '@/components/atoms/Button';
import { LoadingSpinner } from '@/components/atoms/LoadingSpinner';
import { BookingLimits, BookingSource } from '@/types/advanced-booking.types';
import { BOOKING_LIMITS } from '@/types/advanced-booking.types';

interface BookingLimitsTrackerProps {
  customerEmail?: string;
  customerPhone?: string;
  bookingDate: string;
  requestedTables: number;
  requestedGuests: number;
  paymentMethodId?: string;
  onLimitStatusChange: (isWithinLimits: boolean, details: LimitCheckResult) => void;
  className?: string;
}

interface LimitCheckResult {
  isValid: boolean;
  violations: LimitViolation[];
  currentLimits: BookingLimits;
  recommendations: string[];
  canProceedWithOverride: boolean;
}

interface LimitViolation {
  type: 'booking_count' | 'table_count' | 'duplicate_detection' | 'suspicious_activity';
  severity: 'error' | 'warning' | 'info';
  message: string;
  details?: Record<string, any>;
}

interface CustomerBookingHistory {
  bookingId: string;
  bookingRef: string;
  bookingDate: Date;
  tablesCount: number;
  partySize: number;
  status: string;
  createdAt: Date;
}

export function BookingLimitsTracker({
  customerEmail,
  customerPhone,
  bookingDate,
  requestedTables,
  requestedGuests,
  paymentMethodId,
  onLimitStatusChange,
  className = ''
}: BookingLimitsTrackerProps) {
  const [isChecking, setIsChecking] = useState(false);
  const [limitResult, setLimitResult] = useState<LimitCheckResult | null>(null);
  const [customerHistory, setCustomerHistory] = useState<CustomerBookingHistory[]>([]);
  const [showDetails, setShowDetails] = useState(false);
  const [overrideRequested, setOverrideRequested] = useState(false);

  // Check booking limits whenever inputs change
  useEffect(() => {
    if (customerEmail || customerPhone) {
      checkBookingLimits();
    }
  }, [customerEmail, customerPhone, bookingDate, requestedTables, requestedGuests, paymentMethodId]);

  const checkBookingLimits = async () => {
    if (!customerEmail && !customerPhone) return;

    setIsChecking(true);
    try {
      // Mock API call - would be real implementation
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const mockResult = await performLimitCheck();
      setLimitResult(mockResult);
      onLimitStatusChange(mockResult.isValid, mockResult);
      
      if (mockResult.currentLimits.bookingsCount > 0) {
        setCustomerHistory(generateMockHistory(mockResult.currentLimits));
      }
    } catch (error) {
      console.error('Failed to check booking limits:', error);
      
      // Fallback result in case of error
      const fallbackResult: LimitCheckResult = {
        isValid: false,
        violations: [{
          type: 'suspicious_activity',
          severity: 'error',
          message: 'Unable to verify booking limits. Please contact support.'
        }],
        currentLimits: {
          customerId: 'unknown',
          customerEmail: customerEmail || '',
          bookingDate: new Date(bookingDate),
          bookingsCount: 0,
          tablesReserved: [],
          totalGuests: 0,
          attemptedExcessBookings: 0
        },
        recommendations: ['Contact our booking team for assistance'],
        canProceedWithOverride: false
      };
      
      setLimitResult(fallbackResult);
      onLimitStatusChange(false, fallbackResult);
    } finally {
      setIsChecking(false);
    }
  };

  const performLimitCheck = async (): Promise<LimitCheckResult> => {
    const violations: LimitViolation[] = [];
    const recommendations: string[] = [];
    
    // Mock customer data
    const existingBookings = Math.floor(Math.random() * 3); // 0-2 existing bookings
    const existingTables = Math.floor(Math.random() * 3); // 0-2 existing tables
    
    const currentLimits: BookingLimits = {
      customerId: `customer-${Date.now()}`,
      customerEmail: customerEmail || '',
      bookingDate: new Date(bookingDate),
      bookingsCount: existingBookings,
      tablesReserved: existingTables > 0 ? Array.from({length: existingTables}, (_, i) => i + 1) : [],
      totalGuests: existingBookings * 6, // Assume 6 guests per booking
      attemptedExcessBookings: Math.floor(Math.random() * 2)
    };

    // Check booking count limit
    if (existingBookings >= BOOKING_LIMITS.MAX_BOOKINGS_PER_CUSTOMER_PER_DAY) {
      violations.push({
        type: 'booking_count',
        severity: 'error',
        message: `Maximum ${BOOKING_LIMITS.MAX_BOOKINGS_PER_CUSTOMER_PER_DAY} bookings per customer per day exceeded`,
        details: { current: existingBookings, limit: BOOKING_LIMITS.MAX_BOOKINGS_PER_CUSTOMER_PER_DAY }
      });
    } else if (existingBookings === BOOKING_LIMITS.MAX_BOOKINGS_PER_CUSTOMER_PER_DAY - 1) {
      violations.push({
        type: 'booking_count',
        severity: 'warning',
        message: 'This will be your final booking for today',
        details: { current: existingBookings, limit: BOOKING_LIMITS.MAX_BOOKINGS_PER_CUSTOMER_PER_DAY }
      });
    }

    // Check table count limit
    const totalTables = existingTables + requestedTables;
    if (totalTables > BOOKING_LIMITS.MAX_TABLES_PER_BOOKING) {
      violations.push({
        type: 'table_count',
        severity: 'error',
        message: `Maximum ${BOOKING_LIMITS.MAX_TABLES_PER_BOOKING} tables per customer exceeded`,
        details: { 
          existing: existingTables, 
          requested: requestedTables, 
          total: totalTables, 
          limit: BOOKING_LIMITS.MAX_TABLES_PER_BOOKING 
        }
      });
    }

    // Check for duplicate detection (same email/phone with different payment methods)
    if (customerEmail && paymentMethodId) {
      const duplicateRisk = Math.random() > 0.8; // 20% chance of duplicate detection
      if (duplicateRisk) {
        violations.push({
          type: 'duplicate_detection',
          severity: 'warning',
          message: 'Multiple payment methods detected for this customer',
          details: { customerEmail, paymentMethodId }
        });
        recommendations.push('Verify customer identity to prevent duplicate bookings');
      }
    }

    // Check for suspicious activity
    if (currentLimits.attemptedExcessBookings > 0) {
      violations.push({
        type: 'suspicious_activity',
        severity: 'warning',
        message: 'Previous attempts to exceed booking limits detected',
        details: { attempts: currentLimits.attemptedExcessBookings }
      });
    }

    // Generate recommendations
    if (violations.length === 0) {
      recommendations.push('All limits satisfied - booking can proceed normally');
    } else {
      const hasErrors = violations.some(v => v.severity === 'error');
      if (!hasErrors) {
        recommendations.push('Warnings detected but booking can proceed with caution');
      } else {
        recommendations.push('Manual review required before booking can be confirmed');
        recommendations.push('Contact customer to discuss alternative arrangements');
      }
    }

    const isValid = violations.every(v => v.severity !== 'error');
    const canProceedWithOverride = violations.some(v => v.severity === 'error') && 
                                  violations.length < 3; // Allow override for minor violations

    return {
      isValid,
      violations,
      currentLimits,
      recommendations,
      canProceedWithOverride
    };
  };

  const generateMockHistory = (limits: BookingLimits): CustomerBookingHistory[] => {
    return Array.from({ length: limits.bookingsCount }, (_, index) => ({
      bookingId: `booking-${index + 1}`,
      bookingRef: `BRL-2025-${String(Math.floor(Math.random() * 100000)).padStart(5, '0')}`,
      bookingDate: new Date(Date.now() - (index + 1) * 24 * 60 * 60 * 1000),
      tablesCount: Math.floor(Math.random() * 2) + 1,
      partySize: Math.floor(Math.random() * 10) + 2,
      status: ['confirmed', 'completed', 'cancelled'][Math.floor(Math.random() * 3)],
      createdAt: new Date(Date.now() - (index + 1) * 24 * 60 * 60 * 1000)
    }));
  };

  const handleOverrideRequest = () => {
    setOverrideRequested(true);
    // In real implementation, this would notify admin staff
    console.log('Override requested for booking limits');
  };

  const getViolationIcon = (severity: LimitViolation['severity']) => {
    switch (severity) {
      case 'error': return <AlertTriangle className="w-5 h-5 text-red-600" />;
      case 'warning': return <AlertCircle className="w-5 h-5 text-amber-600" />;
      case 'info': return <Shield className="w-5 h-5 text-blue-600" />;
    }
  };

  const getViolationBgColor = (severity: LimitViolation['severity']) => {
    switch (severity) {
      case 'error': return 'bg-red-50 border-red-200';
      case 'warning': return 'bg-amber-50 border-amber-200';
      case 'info': return 'bg-blue-50 border-blue-200';
    }
  };

  if (!customerEmail && !customerPhone) {
    return (
      <div className={`booking-limits-tracker ${className}`}>
        <div className="flex items-center space-x-2 text-gray-500">
          <Shield className="w-4 h-4" />
          <span className="text-sm">Booking limits will be checked once customer details are provided</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`booking-limits-tracker ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <Shield className="w-5 h-5 text-gray-600" />
          <h3 className="font-medium text-gray-900">Booking Limits Check</h3>
          {isChecking && <LoadingSpinner size="sm" />}
        </div>
        
        {limitResult && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowDetails(!showDetails)}
            className="text-sm"
          >
            {showDetails ? 'Hide Details' : 'Show Details'}
          </Button>
        )}
      </div>

      {/* Loading State */}
      {isChecking && (
        <div className="flex items-center justify-center p-6 bg-gray-50 rounded-lg">
          <LoadingSpinner size="lg" className="mr-3" />
          <div>
            <div className="font-medium text-gray-900">Checking Booking Limits</div>
            <div className="text-sm text-gray-600">Validating customer booking history...</div>
          </div>
        </div>
      )}

      {/* Results */}
      {limitResult && !isChecking && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          {/* Overall Status */}
          <div className={`
            p-4 rounded-lg border-2 flex items-center space-x-3
            ${limitResult.isValid 
              ? 'bg-green-50 border-green-200' 
              : 'bg-red-50 border-red-200'
            }
          `}>
            {limitResult.isValid ? (
              <CheckCircle className="w-6 h-6 text-green-600" />
            ) : (
              <AlertTriangle className="w-6 h-6 text-red-600" />
            )}
            
            <div className="flex-1">
              <div className="font-medium">
                {limitResult.isValid 
                  ? 'Booking Limits: All Clear' 
                  : 'Booking Limits: Violations Detected'
                }
              </div>
              <div className="text-sm text-gray-600">
                {limitResult.violations.length === 0 
                  ? 'Customer can proceed with booking normally'
                  : `${limitResult.violations.length} issue${limitResult.violations.length !== 1 ? 's' : ''} found`
                }
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <Badge variant="secondary" className={
                limitResult.isValid ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
              }>
                {limitResult.violations.filter(v => v.severity === 'error').length} Errors
              </Badge>
              
              <Badge variant="secondary" className="bg-amber-100 text-amber-800">
                {limitResult.violations.filter(v => v.severity === 'warning').length} Warnings
              </Badge>
            </div>
          </div>

          {/* Violations */}
          <AnimatePresence>
            {limitResult.violations.map((violation, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ delay: index * 0.1 }}
                className={`p-4 rounded-lg border ${getViolationBgColor(violation.severity)}`}
              >
                <div className="flex items-start space-x-3">
                  {getViolationIcon(violation.severity)}
                  
                  <div className="flex-1">
                    <div className="font-medium text-gray-900 capitalize">
                      {violation.type.replace('_', ' ')} - {violation.severity}
                    </div>
                    <p className="text-sm text-gray-700 mt-1">{violation.message}</p>
                    
                    {violation.details && showDetails && (
                      <div className="mt-2 p-2 bg-white rounded text-xs">
                        <pre className="text-gray-600">
                          {JSON.stringify(violation.details, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {/* Current Limits Summary */}
          {showDetails && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="bg-gray-50 rounded-lg p-4"
            >
              <h4 className="font-medium text-gray-900 mb-3">Current Customer Limits</h4>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">
                    {limitResult.currentLimits.bookingsCount}
                  </div>
                  <div className="text-xs text-gray-600">Existing Bookings</div>
                  <div className="text-xs text-gray-500">
                    of {BOOKING_LIMITS.MAX_BOOKINGS_PER_CUSTOMER_PER_DAY} max
                  </div>
                </div>
                
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">
                    {limitResult.currentLimits.tablesReserved.length}
                  </div>
                  <div className="text-xs text-gray-600">Tables Reserved</div>
                  <div className="text-xs text-gray-500">
                    of {BOOKING_LIMITS.MAX_TABLES_PER_BOOKING} max
                  </div>
                </div>
                
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">
                    {limitResult.currentLimits.totalGuests}
                  </div>
                  <div className="text-xs text-gray-600">Total Guests</div>
                  <div className="text-xs text-gray-500">Today</div>
                </div>
                
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">
                    {limitResult.currentLimits.attemptedExcessBookings}
                  </div>
                  <div className="text-xs text-gray-600">Excess Attempts</div>
                  <div className="text-xs text-gray-500">Historical</div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Customer History */}
          {customerHistory.length > 0 && showDetails && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="bg-white rounded-lg border border-gray-200 p-4"
            >
              <h4 className="font-medium text-gray-900 mb-3">Recent Booking History</h4>
              
              <div className="space-y-2">
                {customerHistory.map((booking, index) => (
                  <div key={index} className="flex items-center space-x-4 text-sm">
                    <Badge variant="outline" className={
                      booking.status === 'completed' ? 'border-green-300 text-green-700' :
                      booking.status === 'confirmed' ? 'border-blue-300 text-blue-700' :
                      'border-red-300 text-red-700'
                    }>
                      {booking.status}
                    </Badge>
                    
                    <div className="font-mono text-xs">{booking.bookingRef}</div>
                    
                    <div className="flex items-center space-x-1 text-gray-600">
                      <Calendar className="w-3 h-3" />
                      <span>{booking.bookingDate.toLocaleDateString()}</span>
                    </div>
                    
                    <div className="flex items-center space-x-1 text-gray-600">
                      <Users className="w-3 h-3" />
                      <span>{booking.partySize}</span>
                    </div>
                    
                    <div className="text-gray-500">
                      {booking.tablesCount} table{booking.tablesCount !== 1 ? 's' : ''}
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Recommendations */}
          {limitResult.recommendations.length > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-medium text-blue-900 mb-2">Recommendations</h4>
              <ul className="text-sm text-blue-800 space-y-1">
                {limitResult.recommendations.map((rec, index) => (
                  <li key={index} className="flex items-start space-x-2">
                    <TrendingUp className="w-4 h-4 mt-0.5 text-blue-600" />
                    <span>{rec}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Override Request */}
          {!limitResult.isValid && limitResult.canProceedWithOverride && !overrideRequested && (
            <div className="flex justify-center">
              <Button
                variant="outline"
                onClick={handleOverrideRequest}
                className="border-amber-300 text-amber-700 hover:bg-amber-50"
              >
                Request Manager Override
              </Button>
            </div>
          )}

          {overrideRequested && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-center">
              <div className="text-amber-900 font-medium mb-1">Override Requested</div>
              <p className="text-sm text-amber-800">
                A manager has been notified and will review this booking shortly.
              </p>
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
}