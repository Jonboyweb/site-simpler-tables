/**
 * Booking Email Workflow Tests
 * 
 * Comprehensive tests for the booking email workflow system
 * including lifecycle management and automated scheduling.
 */

import { BookingEmailWorkflow, EmailWorkflowTrigger } from '@/lib/email/workflows/BookingWorkflow';
import { EmailPriority } from '@/lib/email/providers/EmailServiceManager';
import { jest } from '@jest/globals';

// Mock dependencies
jest.mock('@/lib/email/queue/EmailQueue');
jest.mock('@/lib/email/tracking/DeliveryTracker');
jest.mock('@react-email/render');

// ============================================================================
// Test Data
// ============================================================================

const mockBookingContext = {
  booking: {
    id: 'BK-2024-001234',
    customerId: 'CUST-789',
    customerName: 'Sarah Johnson',
    customerEmail: 'sarah.johnson@example.com',
    date: new Date('2024-12-31T21:00:00Z'),
    timeSlot: '21:00',
    tableName: 'VIP-3',
    floor: 'Upstairs',
    partySize: 4,
    specialRequests: 'Birthday celebration',
    totalAmount: 200,
    depositPaid: 50,
    remainingBalance: 150,
    status: 'confirmed' as const,
    createdAt: new Date('2024-12-01T10:00:00Z'),
    updatedAt: new Date('2024-12-01T10:00:00Z')
  },
  customer: {
    id: 'CUST-789',
    name: 'Sarah Johnson',
    email: 'sarah.johnson@example.com',
    phone: '+44 7700 900123',
    preferences: {
      emailNotifications: true,
      smsNotifications: false,
      marketingEmails: true
    }
  },
  venue: {
    name: 'The Backroom Leeds',
    address: 'Lower Briggate, Leeds LS1 6LY',
    phone: '0113 245 1234',
    email: 'bookings@backroomleeds.com',
    policies: [
      'Smart casual dress code',
      'Tables held for 15 minutes',
      '48-hour cancellation policy',
      'Challenge 21 ID policy'
    ]
  },
  eventInfo: {
    name: 'New Year\'s Eve Spectacular',
    type: 'special_event',
    djLineup: ['DJ Shadow', 'MC Voltage'],
    specialNotes: 'Complimentary champagne at midnight'
  },
  qrCode: {
    dataUrl: 'data:image/png;base64,mockQRCode',
    checkInCode: 'QR-BK-001234'
  }
};

// ============================================================================
// Test Setup
// ============================================================================

describe('BookingEmailWorkflow', () => {
  let workflow: BookingEmailWorkflow;
  let mockEmailQueue: any;
  let mockEmailTracker: any;

  beforeEach(() => {
    // Mock email queue
    mockEmailQueue = {
      initialize: jest.fn().mockResolvedValue(undefined),
      addEmailJob: jest.fn().mockResolvedValue('job-123')
    };

    // Mock email tracker
    mockEmailTracker = {
      initialize: jest.fn().mockResolvedValue(undefined),
      getCustomerConsent: jest.fn().mockResolvedValue({
        customerId: 'CUST-789',
        email: 'sarah.johnson@example.com',
        trackingConsent: {
          openTracking: true,
          clickTracking: true,
          engagementAnalytics: true
        },
        consentTimestamp: new Date()
      })
    };

    // Mock the imported modules
    jest.doMock('@/lib/email/queue/EmailQueue', () => ({
      getEmailQueue: () => mockEmailQueue
    }));

    jest.doMock('@/lib/email/tracking/DeliveryTracker', () => ({
      getEmailDeliveryTracker: () => mockEmailTracker
    }));

    jest.doMock('@react-email/render', () => ({
      render: jest.fn().mockReturnValue('<html>Mock rendered email</html>')
    }));

    workflow = new BookingEmailWorkflow();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // ============================================================================
  // Booking Creation Tests
  // ============================================================================

  describe('Booking Creation Workflow', () => {
    it('should process booking_created trigger successfully', async () => {
      const trigger: EmailWorkflowTrigger = {
        event: 'booking_created',
        context: mockBookingContext,
        metadata: {
          triggeredBy: 'system',
          triggeredAt: new Date()
        }
      };

      await workflow.processWorkflowTrigger(trigger);

      // Should call addEmailJob for confirmation
      expect(mockEmailQueue.addEmailJob).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'sarah.johnson@example.com',
          subject: expect.stringContaining('Booking Confirmed'),
          priority: EmailPriority.CRITICAL,
          templateName: 'booking_confirmation'
        })
      );
    });

    it('should skip emails when customer notifications are disabled', async () => {
      const contextWithDisabledNotifications = {
        ...mockBookingContext,
        customer: {
          ...mockBookingContext.customer,
          preferences: {
            emailNotifications: false,
            smsNotifications: false,
            marketingEmails: false
          }
        }
      };

      const trigger: EmailWorkflowTrigger = {
        event: 'booking_created',
        context: contextWithDisabledNotifications
      };

      await workflow.processWorkflowTrigger(trigger);

      // Should not call addEmailJob
      expect(mockEmailQueue.addEmailJob).not.toHaveBeenCalled();
    });

    it('should schedule reminder emails for future bookings', async () => {
      const futureBookingContext = {
        ...mockBookingContext,
        booking: {
          ...mockBookingContext.booking,
          date: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000) // 10 days from now
        }
      };

      const trigger: EmailWorkflowTrigger = {
        event: 'booking_created',
        context: futureBookingContext
      };

      await workflow.processWorkflowTrigger(trigger);

      // Should schedule multiple reminder emails
      expect(mockEmailQueue.addEmailJob).toHaveBeenCalledTimes(4); // Confirmation + 3 reminders
    });

    it('should not schedule past reminders for bookings soon', async () => {
      const soonBookingContext = {
        ...mockBookingContext,
        booking: {
          ...mockBookingContext.booking,
          date: new Date(Date.now() + 2 * 60 * 60 * 1000) // 2 hours from now
        }
      };

      const trigger: EmailWorkflowTrigger = {
        event: 'booking_created',
        context: soonBookingContext
      };

      await workflow.processWorkflowTrigger(trigger);

      // Should only send confirmation, no reminders
      expect(mockEmailQueue.addEmailJob).toHaveBeenCalledTimes(1);
    });
  });

  // ============================================================================
  // Booking Confirmation Tests
  // ============================================================================

  describe('Booking Confirmation Workflow', () => {
    it('should send updated confirmation for confirmed booking', async () => {
      const trigger: EmailWorkflowTrigger = {
        event: 'booking_confirmed',
        context: mockBookingContext
      };

      await workflow.processWorkflowTrigger(trigger);

      expect(mockEmailQueue.addEmailJob).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'sarah.johnson@example.com',
          priority: EmailPriority.HIGH,
          templateName: 'booking_confirmation'
        })
      );
    });

    it('should include QR code in confirmation when available', async () => {
      const trigger: EmailWorkflowTrigger = {
        event: 'booking_confirmed',
        context: mockBookingContext
      };

      await workflow.processWorkflowTrigger(trigger);

      expect(mockEmailQueue.addEmailJob).toHaveBeenCalledWith(
        expect.objectContaining({
          templateData: expect.objectContaining({
            qrCodeUrl: 'data:image/png;base64,mockQRCode'
          })
        })
      );
    });
  });

  // ============================================================================
  // Booking Cancellation Tests
  // ============================================================================

  describe('Booking Cancellation Workflow', () => {
    it('should send cancellation confirmation with refund for early cancellation', async () => {
      const earlyBookingContext = {
        ...mockBookingContext,
        booking: {
          ...mockBookingContext.booking,
          date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000) // 5 days from now
        }
      };

      const trigger: EmailWorkflowTrigger = {
        event: 'booking_cancelled',
        context: earlyBookingContext,
        metadata: {
          triggeredBy: 'customer',
          triggeredAt: new Date(),
          reason: 'Change of plans'
        }
      };

      await workflow.processWorkflowTrigger(trigger);

      expect(mockEmailQueue.addEmailJob).toHaveBeenCalledWith(
        expect.objectContaining({
          subject: expect.stringContaining('Booking Cancelled'),
          templateData: expect.objectContaining({
            refund: expect.objectContaining({
              eligible: true,
              amount: 50
            })
          })
        })
      );
    });

    it('should send cancellation confirmation without refund for late cancellation', async () => {
      const lateBookingContext = {
        ...mockBookingContext,
        booking: {
          ...mockBookingContext.booking,
          date: new Date(Date.now() + 12 * 60 * 60 * 1000) // 12 hours from now
        }
      };

      const trigger: EmailWorkflowTrigger = {
        event: 'booking_cancelled',
        context: lateBookingContext,
        metadata: {
          triggeredBy: 'customer',
          triggeredAt: new Date()
        }
      };

      await workflow.processWorkflowTrigger(trigger);

      expect(mockEmailQueue.addEmailJob).toHaveBeenCalledWith(
        expect.objectContaining({
          templateData: expect.objectContaining({
            refund: expect.objectContaining({
              eligible: false,
              amount: 0
            })
          })
        })
      );
    });

    it('should cancel scheduled reminder emails', async () => {
      const trigger: EmailWorkflowTrigger = {
        event: 'booking_cancelled',
        context: mockBookingContext
      };

      // First, simulate scheduling reminders
      await workflow.processWorkflowTrigger({
        event: 'booking_created',
        context: {
          ...mockBookingContext,
          booking: {
            ...mockBookingContext.booking,
            date: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000) // 10 days from now
          }
        }
      });

      // Then cancel the booking
      await workflow.processWorkflowTrigger(trigger);

      // Should have no scheduled jobs after cancellation
      const scheduledJobs = workflow.getScheduledJobs(mockBookingContext.booking.id);
      expect(scheduledJobs.every(job => job.status === 'cancelled')).toBe(true);
    });
  });

  // ============================================================================
  // Booking Modification Tests
  // ============================================================================

  describe('Booking Modification Workflow', () => {
    it('should reschedule reminders for modified booking', async () => {
      const trigger: EmailWorkflowTrigger = {
        event: 'booking_modified',
        context: {
          ...mockBookingContext,
          booking: {
            ...mockBookingContext.booking,
            date: new Date(Date.now() + 8 * 24 * 60 * 60 * 1000), // New date 8 days from now
            timeSlot: '22:00' // New time
          }
        },
        metadata: {
          triggeredBy: 'customer',
          triggeredAt: new Date()
        }
      };

      await workflow.processWorkflowTrigger(trigger);

      // Should send updated confirmation
      expect(mockEmailQueue.addEmailJob).toHaveBeenCalledWith(
        expect.objectContaining({
          subject: expect.stringContaining('Booking Updated'),
          priority: EmailPriority.HIGH
        })
      );
    });

    it('should include modification reason in updated confirmation', async () => {
      const trigger: EmailWorkflowTrigger = {
        event: 'booking_modified',
        context: mockBookingContext,
        metadata: {
          triggeredBy: 'admin',
          triggeredAt: new Date(),
          reason: 'Table upgrade requested'
        }
      };

      await workflow.processWorkflowTrigger(trigger);

      expect(mockEmailQueue.addEmailJob).toHaveBeenCalled();
    });
  });

  // ============================================================================
  // Reminder Tests
  // ============================================================================

  describe('Reminder Workflow', () => {
    it('should send week before reminder', async () => {
      const trigger: EmailWorkflowTrigger = {
        event: 'reminder_due',
        context: {
          ...mockBookingContext,
          booking: {
            ...mockBookingContext.booking,
            date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days from now
          }
        }
      };

      await workflow.processWorkflowTrigger(trigger);

      expect(mockEmailQueue.addEmailJob).toHaveBeenCalledWith(
        expect.objectContaining({
          subject: expect.stringContaining('week before'),
          priority: EmailPriority.NORMAL,
          templateData: expect.objectContaining({
            reminderType: 'week_before'
          })
        })
      );
    });

    it('should send day before reminder', async () => {
      const trigger: EmailWorkflowTrigger = {
        event: 'reminder_due',
        context: {
          ...mockBookingContext,
          booking: {
            ...mockBookingContext.booking,
            date: new Date(Date.now() + 25 * 60 * 60 * 1000) // 25 hours from now
          }
        }
      };

      await workflow.processWorkflowTrigger(trigger);

      expect(mockEmailQueue.addEmailJob).toHaveBeenCalledWith(
        expect.objectContaining({
          subject: expect.stringContaining('day before'),
          priority: EmailPriority.NORMAL,
          templateData: expect.objectContaining({
            reminderType: 'day_before'
          })
        })
      );
    });

    it('should send day of reminder with checklist', async () => {
      const trigger: EmailWorkflowTrigger = {
        event: 'reminder_due',
        context: {
          ...mockBookingContext,
          booking: {
            ...mockBookingContext.booking,
            date: new Date(Date.now() + 6 * 60 * 60 * 1000) // 6 hours from now
          }
        }
      };

      await workflow.processWorkflowTrigger(trigger);

      expect(mockEmailQueue.addEmailJob).toHaveBeenCalledWith(
        expect.objectContaining({
          subject: expect.stringContaining('day of'),
          priority: EmailPriority.HIGH,
          templateData: expect.objectContaining({
            reminderType: 'day_of'
          })
        })
      );
    });
  });

  // ============================================================================
  // GDPR Compliance Tests
  // ============================================================================

  describe('GDPR Compliance', () => {
    it('should respect customer consent for tracking', async () => {
      const trigger: EmailWorkflowTrigger = {
        event: 'booking_confirmed',
        context: mockBookingContext
      };

      await workflow.processWorkflowTrigger(trigger);

      expect(mockEmailQueue.addEmailJob).toHaveBeenCalledWith(
        expect.objectContaining({
          trackingEnabled: true,
          customerConsent: expect.objectContaining({
            emailTracking: true,
            transactionalEmails: true
          })
        })
      );
    });

    it('should disable tracking when consent is not given', async () => {
      mockEmailTracker.getCustomerConsent.mockResolvedValue({
        trackingConsent: {
          openTracking: false,
          clickTracking: false,
          engagementAnalytics: false
        }
      });

      const trigger: EmailWorkflowTrigger = {
        event: 'booking_confirmed',
        context: mockBookingContext
      };

      await workflow.processWorkflowTrigger(trigger);

      expect(mockEmailQueue.addEmailJob).toHaveBeenCalledWith(
        expect.objectContaining({
          trackingEnabled: false,
          customerConsent: expect.objectContaining({
            emailTracking: false
          })
        })
      );
    });

    it('should handle missing consent gracefully', async () => {
      mockEmailTracker.getCustomerConsent.mockResolvedValue(null);

      const trigger: EmailWorkflowTrigger = {
        event: 'booking_confirmed',
        context: mockBookingContext
      };

      await workflow.processWorkflowTrigger(trigger);

      expect(mockEmailQueue.addEmailJob).toHaveBeenCalledWith(
        expect.objectContaining({
          trackingEnabled: false
        })
      );
    });
  });

  // ============================================================================
  // Error Handling Tests
  // ============================================================================

  describe('Error Handling', () => {
    it('should handle email queue failures gracefully', async () => {
      mockEmailQueue.addEmailJob.mockRejectedValue(new Error('Queue failed'));

      const trigger: EmailWorkflowTrigger = {
        event: 'booking_confirmed',
        context: mockBookingContext
      };

      await expect(workflow.processWorkflowTrigger(trigger))
        .rejects.toThrow('Queue failed');
    });

    it('should handle unknown workflow events', async () => {
      const trigger: EmailWorkflowTrigger = {
        event: 'unknown_event' as any,
        context: mockBookingContext
      };

      // Should not throw error, but log warning
      await expect(workflow.processWorkflowTrigger(trigger))
        .resolves.not.toThrow();
    });

    it('should handle missing booking context', async () => {
      const trigger: EmailWorkflowTrigger = {
        event: 'booking_confirmed',
        context: null as any
      };

      await expect(workflow.processWorkflowTrigger(trigger))
        .rejects.toThrow();
    });
  });

  // ============================================================================
  // Scheduled Jobs Management Tests
  // ============================================================================

  describe('Scheduled Jobs Management', () => {
    it('should track scheduled reminder jobs', async () => {
      const futureBookingContext = {
        ...mockBookingContext,
        booking: {
          ...mockBookingContext.booking,
          date: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000)
        }
      };

      const trigger: EmailWorkflowTrigger = {
        event: 'booking_created',
        context: futureBookingContext
      };

      await workflow.processWorkflowTrigger(trigger);

      const scheduledJobs = workflow.getScheduledJobs(futureBookingContext.booking.id);
      expect(scheduledJobs).toHaveLength(3); // 3 reminder types
      expect(scheduledJobs.every(job => job.status === 'scheduled')).toBe(true);
    });

    it('should update job status correctly', async () => {
      const futureBookingContext = {
        ...mockBookingContext,
        booking: {
          ...mockBookingContext.booking,
          date: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000)
        }
      };

      const trigger: EmailWorkflowTrigger = {
        event: 'booking_created',
        context: futureBookingContext
      };

      await workflow.processWorkflowTrigger(trigger);

      const scheduledJobs = workflow.getScheduledJobs(futureBookingContext.booking.id);
      const firstJob = scheduledJobs[0];

      workflow.updateJobStatus(futureBookingContext.booking.id, firstJob.id, 'sent');

      const updatedJobs = workflow.getScheduledJobs(futureBookingContext.booking.id);
      const updatedJob = updatedJobs.find(job => job.id === firstJob.id);

      expect(updatedJob?.status).toBe('sent');
      expect(updatedJob?.attempts).toBe(1);
      expect(updatedJob?.lastAttempt).toBeInstanceOf(Date);
    });

    it('should return all scheduled jobs', () => {
      const allJobs = workflow.getAllScheduledJobs();
      expect(allJobs).toBeInstanceOf(Map);
    });
  });
});