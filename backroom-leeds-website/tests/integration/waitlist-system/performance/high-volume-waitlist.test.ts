import { 
  createMassWaitlistEntries, 
  processHighVolumeWaitlist 
} from '@/lib/waitlist/performance-service';
import { 
  mockHighTrafficScenario, 
  monitorSystemResources 
} from '@/tests/mocks/performance-mocks';
import { WaitlistEntryStatus } from '@/types/waitlist';
import { performance } from 'perf_hooks';

describe('High-Volume Waitlist Operations', () => {
  test('System handles 1000+ concurrent waitlist enrollments', async () => {
    // Start resource monitoring
    const resourceMonitor = await monitorSystemResources();

    // Simulate high-traffic scenario (Friday/Saturday night)
    const startTime = performance.now();
    
    const massEntries = await createMassWaitlistEntries(1200, {
      eventType: 'LA FIESTA',
      date: new Date('2025-08-30T22:00:00Z')
    });

    // Process high-volume waitlist
    const processingResult = await processHighVolumeWaitlist(massEntries);

    const endTime = performance.now();
    const processingDuration = endTime - startTime;

    // Performance assertions
    expect(processingResult.processedEntries.length).toBe(1200);
    expect(processingDuration).toBeLessThan(10000); // Less than 10 seconds
    
    // Validate system resource usage
    const resourceUsage = await resourceMonitor.getMetrics();
    expect(resourceUsage.cpuUsage).toBeLessThan(80);
    expect(resourceUsage.memoryUsage).toBeLessThan(2048); // MB

    // Conversion and notification stats
    const successfulConversions = processingResult.processedEntries.filter(
      entry => entry.status === WaitlistEntryStatus.CONVERTED
    );
    
    expect(successfulConversions.length).toBeGreaterThan(50);
    expect(successfulConversions.length).toBeLessThan(200);
  }, 60000); // Extended timeout for massive test

  test('Notification system processes large queues efficiently', async () => {
    // 500+ waitlist customers to notify
    const massNotificationScenario = await mockHighTrafficScenario(600);
    
    const startTime = performance.now();
    
    const notificationResult = await processNotificationQueue(
      massNotificationScenario.entries, 
      ['email', 'sms', 'push']
    );

    const endTime = performance.now();
    const notificationDuration = endTime - startTime;

    // Performance and delivery assertions
    expect(notificationResult.totalSent).toBe(600);
    expect(notificationResult.successRate).toBeGreaterThan(0.95);
    expect(notificationDuration).toBeLessThan(15000); // Less than 15 seconds

    // Rate limiting and throttling checks
    expect(notificationResult.rateLimitEvents).toBeLessThan(10);
    expect(notificationResult.queuedNotifications).toBeGreaterThan(0);
  }, 60000);
});