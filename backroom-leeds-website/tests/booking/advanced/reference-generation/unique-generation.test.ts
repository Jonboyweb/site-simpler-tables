import { BookingReferenceService } from '@/lib/booking/reference-generation-service';
import { mockBookings } from '@/tests/mocks/booking-mocks';

describe('Booking Reference System', () => {
  let referenceService: BookingReferenceService;

  beforeEach(() => {
    referenceService = new BookingReferenceService();
  });

  test('Generates unique BRL-2025-XXXXX format references', () => {
    const reference1 = referenceService.generateBookingReference();
    const reference2 = referenceService.generateBookingReference();

    expect(reference1).toMatch(/^BRL-2025-\d{5}$/);
    expect(reference2).toMatch(/^BRL-2025-\d{5}$/);
    expect(reference1).not.toBe(reference2);
  });

  test('Allocates VIP range (80000-99999) correctly', () => {
    const vipReference = referenceService.generateVIPBookingReference();

    expect(vipReference).toMatch(/^BRL-2025-[89]\d{4}$/);
    const referenceNumber = parseInt(vipReference.split('-')[2]);
    expect(referenceNumber).toBeGreaterThanOrEqual(80000);
    expect(referenceNumber).toBeLessThanOrEqual(99999);
  });

  test('Creates 6-character check-in codes without collisions', () => {
    const checkInCode1 = referenceService.generateCheckInCode();
    const checkInCode2 = referenceService.generateCheckInCode();

    expect(checkInCode1).toMatch(/^[A-Z0-9]{6}$/);
    expect(checkInCode2).toMatch(/^[A-Z0-9]{6}$/);
    expect(checkInCode1).not.toBe(checkInCode2);
  });

  test('Integrates references with QR code generation', () => {
    const booking = mockBookings.standardBooking;
    const qrCodeData = referenceService.generateQRCodeData(booking);

    expect(qrCodeData).toHaveProperty('reference');
    expect(qrCodeData).toHaveProperty('checkInCode');
    expect(qrCodeData).toHaveProperty('qrCodeUrl');
  });

  test('Validates reference format and lookup', () => {
    const validReference = 'BRL-2025-12345';
    const invalidReference = 'BRL-2024-ABCDE';

    const validationResult1 = referenceService.validateBookingReference(validReference);
    const validationResult2 = referenceService.validateBookingReference(invalidReference);

    expect(validationResult1.valid).toBe(true);
    expect(validationResult2.valid).toBe(false);
  });

  test('Handles high-volume generation scenarios', () => {
    const references = new Set();
    
    // Generate 10,000 unique references
    for (let i = 0; i < 10000; i++) {
      const ref = referenceService.generateBookingReference();
      references.add(ref);
    }

    expect(references.size).toBe(10000);
  });
});