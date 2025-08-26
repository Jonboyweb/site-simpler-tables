import { ReportAccessControl } from '@/lib/reporting/security/access-control';
import { UserRole } from '@/types/user';

describe('Report Security and Privacy', () => {
  let accessControl: ReportAccessControl;

  beforeEach(() => {
    accessControl = new ReportAccessControl();
  });

  test('Enforces role-based access to sensitive metrics', () => {
    const superAdminAccess = accessControl.canAccessReport({
      role: UserRole.SUPER_ADMIN,
      reportType: 'full'
    });

    const managerAccess = accessControl.canAccessReport({
      role: UserRole.MANAGER,
      reportType: 'daily'
    });

    const doorStaffAccess = accessControl.canAccessReport({
      role: UserRole.DOOR_STAFF,
      reportType: 'limited'
    });

    expect(superAdminAccess).toBe(true);
    expect(managerAccess).toBe(true);
    expect(doorStaffAccess).toBe(false);
  });

  test('Anonymizes customer data appropriately for GDPR', () => {
    const sensitiveBookingData = {
      customerName: 'John Doe',
      email: 'john.doe@example.com',
      phoneNumber: '+44 7911 123456'
    };

    const anonymizedData = accessControl.anonymizePersonalData(sensitiveBookingData);

    expect(anonymizedData).toEqual({
      customerName: expect.stringContaining('****'),
      email: expect.stringContaining('****'),
      phoneNumber: expect.stringContaining('****')
    });

    expect(anonymizedData.customerName).not.toBe(sensitiveBookingData.customerName);
  });

  test('Creates comprehensive audit logs for compliance', async () => {
    const auditLog = await accessControl.createReportAccessLog({
      userId: 'user-123',
      role: UserRole.MANAGER,
      reportType: 'daily',
      accessTimestamp: new Date()
    });

    expect(auditLog).toEqual(expect.objectContaining({
      logId: expect.any(String),
      userId: 'user-123',
      role: UserRole.MANAGER,
      reportType: 'daily',
      accessTimestamp: expect.any(Date),
      ipAddress: expect.any(String)
    }));
  });

  test('Encrypts email delivery and report attachments', async () => {
    const reportPath = '/reports/daily-20250826.pdf';
    
    const encryptedReport = await accessControl.encryptReportFile(reportPath);

    expect(encryptedReport).toEqual(expect.objectContaining({
      originalPath: reportPath,
      encryptedPath: expect.stringContaining('encrypted'),
      encryptionMethod: expect.any(String)
    }));
  });

  test('Validates report recipient authorization levels', async () => {
    const recipients = [
      { email: 'superadmin@backroom.com', role: UserRole.SUPER_ADMIN },
      { email: 'manager@backroom.com', role: UserRole.MANAGER },
      { email: 'doorstaff@backroom.com', role: UserRole.DOOR_STAFF }
    ];

    const authorizedRecipients = await accessControl.filterAuthorizedRecipients(
      recipients, 
      'daily'
    );

    expect(authorizedRecipients).toHaveLength(2);
    expect(authorizedRecipients.map(r => r.role)).toEqual(
      expect.arrayContaining([UserRole.SUPER_ADMIN, UserRole.MANAGER])
    );
    expect(authorizedRecipients).not.toContainEqual(
      expect.objectContaining({ role: UserRole.DOOR_STAFF })
    );
  });
});