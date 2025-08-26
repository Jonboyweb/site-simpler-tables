import { 
  createWaitlistEntry, 
  processWaitlistMatching, 
  sendNotifications, 
  convertWaitlistToBooking 
} from '@/lib/waitlist/waitlist-service';
import { 
  mockCustomer, 
  mockAvailability, 
  mockNotificationServices 
} from '@/tests/mocks/waitlist-mocks';
import { WaitlistEntryStatus, NotificationChannel } from '@/types/waitlist';
import { performDatabaseTransaction } from '@/lib/database/transactions';

describe('Complete Waitlist Customer Journey', () => {
  let customer: Customer;
  let waitlistEntry: WaitlistEntry;

  beforeEach(async () => {
    // Setup mock customer and services
    customer = mockCustomer();
    mockNotificationServices();
  });

  test('Customer enrolls → receives position → gets notified → converts to booking', async () => {
    // 1. Customer attempts to book (table unavailable)
    const unavailableTables = await mockAvailability();
    expect(unavailableTables.length).toBeGreaterThan(0);

    // 2. System offers waitlist enrollment
    waitlistEntry = await createWaitlistEntry({
      customerId: customer.id,
      preferredTables: unavailableTables,
      eventDate: new Date(),
    });

    // 3. Customer provides preferences and enrolls
    expect(waitlistEntry.status).toBe(WaitlistEntryStatus.ACTIVE);
    expect(waitlistEntry.position).toBeDefined();

    // 4. System calculates priority and position
    await performDatabaseTransaction(async (transaction) => {
      const updatedEntry = await processWaitlistMatching(waitlistEntry, transaction);
      expect(updatedEntry.calculatedPriority).toBeDefined();
    });

    // 5. Another customer cancels their booking
    const newAvailability = await mockAvailability();

    // 6. System matches waitlist customer to availability
    const matchedEntries = await processWaitlistMatching(newAvailability);
    const topMatch = matchedEntries[0];
    expect(topMatch.customerId).toBe(customer.id);

    // 7. Multi-channel notifications sent
    const notificationResult = await sendNotifications(topMatch, [
      NotificationChannel.EMAIL, 
      NotificationChannel.SMS,
      NotificationChannel.PUSH
    ]);
    
    expect(notificationResult.email.sent).toBe(true);
    expect(notificationResult.sms.sent).toBe(true);
    expect(notificationResult.push.sent).toBe(true);

    // 8. Customer clicks conversion link
    const bookingConversion = await convertWaitlistToBooking(topMatch);
    
    // 9. Booking created with original preferences
    expect(bookingConversion.booking).toBeDefined();
    expect(bookingConversion.booking.tableIds).toEqual(topMatch.preferredTables);

    // 10. Waitlist entry marked as converted
    expect(bookingConversion.waitlistEntry.status).toBe(WaitlistEntryStatus.CONVERTED);
  }, 30000); // Extended timeout for complex workflow
});