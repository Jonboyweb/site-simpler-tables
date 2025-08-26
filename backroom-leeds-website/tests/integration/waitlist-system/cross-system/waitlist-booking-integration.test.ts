import { 
  createWaitlistEntry, 
  convertWaitlistToBooking 
} from '@/lib/waitlist/waitlist-service';
import { 
  mockCustomer, 
  mockPaymentService, 
  mockQRCodeService,
  mockAuthenticationService 
} from '@/tests/mocks/cross-system-mocks';
import { WaitlistEntryStatus } from '@/types/waitlist';
import { BookingStatus } from '@/types/booking';

describe('Cross-System Waitlist Integration', () => {
  test('Waitlist conversion integrates with all systems', async () => {
    // 1. Waitlist customer matched to availability
    const customer = await mockCustomer();
    const waitlistEntry = await createWaitlistEntry({
      customerId: customer.id,
      preferences: { eventType: 'NOSTALGIA' }
    });

    // 2. Authentication system validates customer identity
    const authenticatedCustomer = await mockAuthenticationService.validateCustomer(customer);
    expect(authenticatedCustomer.verified).toBe(true);

    // 3. Booking system creates reservation with preferences
    const conversionResult = await convertWaitlistToBooking(waitlistEntry);
    const booking = conversionResult.booking;

    expect(booking.status).toBe(BookingStatus.CONFIRMED);
    expect(booking.preferences.eventType).toBe('NOSTALGIA');

    // 4. Payment system processes £50 deposit
    const paymentResult = await mockPaymentService.processDeposit({
      bookingId: booking.id,
      amount: 50.00,
      currency: 'GBP'
    });
    
    expect(paymentResult.status).toBe('PAID');

    // 5. QR code system generates booking reference
    const qrCode = await mockQRCodeService.generateBookingQR(booking);
    expect(qrCode).toBeDefined();
    expect(qrCode.bookingId).toBe(booking.id);

    // 6. Email system sends confirmation with QR
    const emailResult = await mockNotificationService.sendBookingConfirmation({
      customer: authenticatedCustomer,
      booking,
      qrCode
    });
    
    expect(emailResult.sent).toBe(true);

    // 7. Admin dashboard updates with new booking
    const dashboardUpdate = await mockAdminDashboard.updateBookings(booking);
    expect(dashboardUpdate.success).toBe(true);

    // 8. Waitlist system marks entry as converted
    expect(conversionResult.waitlistEntry.status).toBe(WaitlistEntryStatus.CONVERTED);
  }, 30000);
});