import { faker } from '@faker-js/faker';
import { 
  WaitlistEntry, 
  WaitlistEntryStatus, 
  NotificationChannel 
} from '@/types/waitlist';

export function mockCustomer(overrides = {}) {
  return {
    id: faker.string.uuid(),
    name: faker.person.fullName(),
    email: faker.internet.email(),
    phone: faker.phone.number(),
    ...overrides
  };
}

export async function mockAvailability() {
  // Simulate venue table availability
  return Array.from({ length: faker.number.int({ min: 1, max: 3 }) }, () => ({
    tableId: faker.string.uuid(),
    section: faker.helpers.arrayElement(['upstairs', 'downstairs']),
    capacity: faker.number.int({ min: 2, max: 6 })
  }));
}

export function mockNotificationServices() {
  // Mock notification service behaviors
  return {
    email: {
      send: jest.fn().mockResolvedValue({ sent: true }),
      trackDelivery: jest.fn().mockResolvedValue({ status: 'DELIVERED' })
    },
    sms: {
      send: jest.fn().mockResolvedValue({ sent: true }),
      trackDelivery: jest.fn().mockResolvedValue({ status: 'DELIVERED' })
    },
    push: {
      send: jest.fn().mockResolvedValue({ sent: true }),
      trackDelivery: jest.fn().mockResolvedValue({ status: 'DELIVERED' })
    }
  };
}

export async function mockMultipleCustomers(count: number) {
  return Array.from({ length: count }, () => mockCustomer());
}

export function mockWebSocketService() {
  return {
    sentMessages: [],
    broadcast: jest.fn((message) => {
      this.sentMessages.push(message);
      return { recipients: 10 };
    }),
    sendToUser: jest.fn((userId, message) => {
      this.sentMessages.push({ userId, message });
    })
  };
}

// Utility for creating mock waitlist entries
export function createMockWaitlistEntry(
  customer: any, 
  overrides: Partial<WaitlistEntry> = {}
): WaitlistEntry {
  return {
    id: faker.string.uuid(),
    customerId: customer.id,
    status: WaitlistEntryStatus.ACTIVE,
    createdAt: new Date(),
    preferredTables: [],
    calculatedPriority: faker.number.float({ min: 0, max: 100 }),
    notificationChannels: [
      NotificationChannel.EMAIL, 
      NotificationChannel.SMS
    ],
    ...overrides
  };
}