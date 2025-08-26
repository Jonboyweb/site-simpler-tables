import { 
  simulateAvailabilityChange, 
  processWaitlistMatching, 
  broadcastWaitlistUpdates 
} from '@/lib/waitlist/waitlist-service';
import { 
  mockMultipleCustomers, 
  mockWebSocketService 
} from '@/tests/mocks/waitlist-mocks';
import { WaitlistEntryStatus } from '@/types/waitlist';
import { WebSocketServer } from '@/lib/websocket/server';

describe('Real-time Waitlist Updates', () => {
  let customers: Customer[];
  let webSocketServer: WebSocketServer;

  beforeEach(async () => {
    // Setup multiple mock customers on waitlist
    customers = await mockMultipleCustomers(10);
    webSocketServer = mockWebSocketService();
  });

  test('Availability changes trigger waitlist processing pipeline', async () => {
    // 1. Multiple customers on waitlist for same time slot
    const waitlistEntries = customers.map(customer => ({
      customerId: customer.id,
      status: WaitlistEntryStatus.ACTIVE
    }));

    // 2. Table becomes available (cancellation)
    const newAvailability = await simulateAvailabilityChange();

    // 3. System calculates best matches using priority algorithm
    const matchedEntries = await processWaitlistMatching(newAvailability);
    
    expect(matchedEntries.length).toBeGreaterThan(0);
    expect(matchedEntries.length).toBeLessThanOrEqual(3);

    // 4. Top 3 customers notified simultaneously
    const topMatches = matchedEntries.slice(0, 3);
    const notificationResults = await Promise.all(
      topMatches.map(entry => sendNotifications(entry))
    );

    // 5. First customer to respond gets the booking
    const firstResponse = await convertWaitlistToBooking(topMatches[0]);
    expect(firstResponse.booking).toBeDefined();

    // 6. Other customers notified of position change
    const updatedEntries = await processWaitlistMatching(newAvailability);
    
    // 7. WebSocket updates sent to all active sessions
    const broadcastResult = await broadcastWaitlistUpdates(updatedEntries);
    
    expect(broadcastResult.recipients).toBeGreaterThan(0);
    expect(webSocketServer.sentMessages.length).toBeGreaterThan(0);
  }, 45000); // Extended timeout for complex real-time scenario
});