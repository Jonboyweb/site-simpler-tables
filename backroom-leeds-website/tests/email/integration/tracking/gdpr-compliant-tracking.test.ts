import { faker } from '@faker-js/faker';
import { generateTestBookingData } from '../setup-tests';
import { EmailTrackingService } from '@/services/email/tracking-service';
import { CustomerConsentService } from '@/services/customer/consent-service';
import { DataPrivacyAuditService } from '@/services/compliance/data-privacy-audit-service';

describe('GDPR-Compliant Email Tracking Integration', () => {
  let trackingService: EmailTrackingService;
  let consentService: CustomerConsentService;
  let privacyAuditService: DataPrivacyAuditService;

  beforeEach(() => {
    consentService = new CustomerConsentService();
    privacyAuditService = new DataPrivacyAuditService();
    trackingService = new EmailTrackingService(
      consentService, 
      privacyAuditService
    );
  });

  test('Tracking workflow with customer consent', async () => {
    const testBookingData = generateTestBookingData();
    
    // Update customer consent explicitly
    await consentService.updateConsent(
      testBookingData.booking.customer_email, 
      {
        transactional: true,
        marketing: false,
        tracking: true
      }
    );

    // Send email with tracking
    const trackingResult = await trackingService.trackEmailEngagement({
      recipient: testBookingData.booking.customer_email,
      emailType: 'booking_confirmation',
      templateId: `template_${faker.string.alphanumeric(8)}`,
      trackingData: testBookingData
    });

    // Validate tracking result
    expect(trackingResult).toEqual(
      expect.objectContaining({
        trackingAllowed: true,
        anonymizedId: expect.any(String),
        engagementData: expect.objectContaining({
          opened: expect.any(Boolean),
          clicked: expect.any(Boolean)
        })
      })
    );

    // Verify audit trail
    const auditRecord = await privacyAuditService.getTrackingAuditRecord(
      testBookingData.booking.customer_email
    );
    
    expect(auditRecord).toEqual(
      expect.objectContaining({
        consentVersion: expect.any(String),
        trackingEnabled: true,
        timestamp: expect.any(Date)
      })
    );
  });

  test('Prevents tracking for non-consenting customers', async () => {
    const testBookingData = generateTestBookingData();
    
    // Explicitly disable tracking consent
    await consentService.updateConsent(
      testBookingData.booking.customer_email, 
      {
        transactional: true,
        marketing: false,
        tracking: false
      }
    );

    // Attempt tracking
    const trackingResult = await trackingService.trackEmailEngagement({
      recipient: testBookingData.booking.customer_email,
      emailType: 'booking_confirmation',
      templateId: `template_${faker.string.alphanumeric(8)}`,
      trackingData: testBookingData
    });

    // Validate no tracking occurs
    expect(trackingResult).toEqual(
      expect.objectContaining({
        trackingAllowed: false,
        anonymizedId: null,
        engagementData: null
      })
    );

    // Verify privacy audit
    const auditRecord = await privacyAuditService.getTrackingAuditRecord(
      testBookingData.booking.customer_email
    );
    
    expect(auditRecord.trackingBlocked).toBe(true);
  });

  test('Data subject rights processing', async () => {
    const testBookingData = generateTestBookingData();
    
    // Simulate data subject access request
    const accessRequest = await privacyAuditService.processDataSubjectAccessRequest(
      testBookingData.booking.customer_email
    );

    // Validate comprehensive data export
    expect(accessRequest).toEqual(
      expect.objectContaining({
        personalData: expect.any(Object),
        communicationHistory: expect.any(Array),
        consentHistory: expect.any(Array),
        trackingData: expect.any(Object)
      })
    );

    // Simulate data erasure request
    const erasureResult = await privacyAuditService.processDataErasureRequest(
      testBookingData.booking.customer_email
    );

    expect(erasureResult.status).toBe('completed');
    expect(erasureResult.dataRemoved).toBe(true);
  });
});