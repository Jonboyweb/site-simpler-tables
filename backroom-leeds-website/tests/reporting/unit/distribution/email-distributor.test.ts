import { EmailDistributor } from '@/lib/reporting/distribution/email-distributor';
import { Resend } from 'resend';
import { SendGridClient } from '@sendgrid/mail';

describe('Professional Email Distribution', () => {
  let emailDistributor: EmailDistributor;
  let mockResend: jest.Mocked<Resend>;
  let mockSendGrid: jest.Mocked<SendGridClient>;

  beforeEach(() => {
    // Mock Resend client
    mockResend = {
      emails: {
        send: jest.fn()
      }
    } as unknown as jest.Mocked<Resend>;

    // Mock SendGrid client
    mockSendGrid = {
      send: jest.fn()
    } as unknown as jest.Mocked<SendGridClient>;

    emailDistributor = new EmailDistributor(mockResend, mockSendGrid);
  });

  test('Delivers reports via Resend with proper formatting', async () => {
    const mockReport = {
      type: 'daily',
      date: '2025-08-26',
      pdfPath: '/reports/daily-20250826.pdf'
    };

    const result = await emailDistributor.sendReportViaResend(mockReport);

    expect(mockResend.emails.send).toHaveBeenCalledWith(expect.objectContaining({
      from: expect.any(String),
      to: expect.arrayContaining([expect.any(String)]),
      subject: expect.stringContaining('Daily Report'),
      attachments: expect.arrayContaining([
        expect.objectContaining({
          filename: expect.stringContaining('daily-report'),
          path: mockReport.pdfPath
        })
      ])
    }));

    expect(result).toEqual(expect.objectContaining({
      status: 'sent',
      messageId: expect.any(String)
    }));
  });

  test('Falls back to SendGrid on Resend failure', async () => {
    // Simulate Resend failure
    mockResend.emails.send.mockRejectedValue(new Error('Resend service error'));

    const mockReport = {
      type: 'weekly',
      date: '2025-08-25',
      pdfPath: '/reports/weekly-20250825.pdf'
    };

    const result = await emailDistributor.sendReportViaSendGrid(mockReport);

    expect(mockSendGrid.send).toHaveBeenCalledWith(expect.objectContaining({
      from: expect.any(String),
      to: expect.arrayContaining([expect.any(String)]),
      subject: expect.stringContaining('Weekly Report'),
      attachments: expect.arrayContaining([
        expect.objectContaining({
          filename: expect.stringContaining('weekly-report'),
          content: expect.any(String)
        })
      ])
    }));

    expect(result).toEqual(expect.objectContaining({
      status: 'sent',
      provider: 'sendgrid'
    }));
  });

  test('Renders React Email templates with prohibition styling', async () => {
    const reportTemplate = await emailDistributor.renderReportTemplate({
      type: 'daily',
      date: '2025-08-26',
      metrics: {
        totalBookings: 45,
        totalRevenue: 12500
      }
    });

    expect(reportTemplate).toMatch(/prohibition/i);
    expect(reportTemplate).toContain('45 bookings');
    expect(reportTemplate).toContain('£12,500');
  });

  test('Handles PDF attachments and inline images correctly', async () => {
    const result = await emailDistributor.prepareReportAttachment({
      pdfPath: '/reports/daily-20250826.pdf',
      chartImagePath: '/charts/daily-chart-20250826.png'
    });

    expect(result).toEqual(expect.objectContaining({
      pdfAttachment: expect.objectContaining({
        filename: expect.stringContaining('daily-report'),
        path: '/reports/daily-20250826.pdf'
      }),
      chartImage: expect.objectContaining({
        cid: expect.any(String),
        path: '/charts/daily-chart-20250826.png'
      })
    }));
  });

  test('Tracks delivery status and handles bounces', async () => {
    const deliveryStatus = await emailDistributor.trackDeliveryStatus('message-id-123');

    expect(deliveryStatus).toEqual(expect.objectContaining({
      status: expect.stringMatching(/delivered|bounced|complained/),
      timestamp: expect.any(Date),
      recipient: expect.any(String)
    }));
  });

  test('Processes unsubscribe requests appropriately', async () => {
    const unsubscribeResult = await emailDistributor.processUnsubscribeRequest('user@example.com');

    expect(unsubscribeResult).toEqual(expect.objectContaining({
      status: 'unsubscribed',
      email: 'user@example.com',
      updatedAt: expect.any(Date)
    }));
  });
});