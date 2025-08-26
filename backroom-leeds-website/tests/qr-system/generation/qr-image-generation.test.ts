import QRCode from 'qrcode';
import { generateQRCode } from '@/lib/qr-system/qr-generator';
import { mockBookingData } from '@/tests/mocks/booking-data';

describe('QR Code Image Generation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('generates QR code image in multiple formats', async () => {
    const formats = ['png', 'svg', 'base64'];
    
    for (const format of formats) {
      const qrCode = await generateQRCode(mockBookingData, format);
      
      expect(qrCode).toBeTruthy();
      expect(qrCode.length).toBeGreaterThan(0);
      
      // Validate different format prefixes
      if (format === 'png') {
        expect(qrCode).toMatch(/^data:image\/png;base64,/);
      } else if (format === 'svg') {
        expect(qrCode).toMatch(/<svg/);
      } else if (format === 'base64') {
        expect(qrCode).toMatch(/^data:image\/png;base64,/);
      }
    }
  });

  test('handles QR code generation errors', async () => {
    // Mock QRCode.toDataURL to throw an error
    jest.spyOn(QRCode, 'toDataURL').mockRejectedValue(new Error('QR Generation Failed'));
    
    await expect(generateQRCode(mockBookingData)).rejects.toThrow('QR Generation Failed');
  });

  test('QR code contains booking reference', async () => {
    const qrCode = await generateQRCode(mockBookingData);
    
    expect(qrCode).toContain(mockBookingData.ref);
  });

  test('handles large booking data', async () => {
    const largeBookingData = {
      ...mockBookingData,
      specialRequests: 'A very long special request string that tests the limits of QR code data encoding...',
    };
    
    const qrCode = await generateQRCode(largeBookingData);
    expect(qrCode).toBeTruthy();
  });

  test('performance of QR code generation', async () => {
    const startTime = performance.now();
    await generateQRCode(mockBookingData);
    const endTime = performance.now();
    
    const generationTime = endTime - startTime;
    expect(generationTime).toBeLessThan(100); // Should generate in less than 100ms
  });
});