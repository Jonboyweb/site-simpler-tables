import { faker } from '@faker-js/faker';

// Global test setup and utility functions
jest.setTimeout(30000); // 30 seconds timeout for complex integration tests

// Set up global mocks for external services
global.console = {
  ...console,
  error: jest.fn(), // Suppress error logs during testing
  warn: jest.fn()
};

// Utility function for generating test mock data
export const generateTestBookingData = () => ({
  booking: {
    id: `BRL-${faker.date.recent().getFullYear()}-${faker.string.alphanumeric(6).toUpperCase()}`,
    customer_name: faker.person.fullName(),
    customer_email: faker.internet.email(),
    booking_date: faker.date.future().toISOString(),
    arrival_time: faker.date.recent().toLocaleTimeString('en-UK', { 
      hour: '2-digit', 
      minute: '2-digit', 
      hour12: false 
    }),
    table_number: faker.number.int({ min: 1, max: 16 }),
    party_size: faker.number.int({ min: 1, max: 10 }),
    special_requests: faker.lorem.sentence(),
    status: 'confirmed'
  },
  payment: {
    stripe_payment_intent_id: `pi_${faker.string.alphanumeric(12)}`,
    deposit_amount: 50,
    remaining_balance: faker.number.int({ min: 50, max: 500 }),
    total_amount: faker.number.int({ min: 100, max: 1000 }),
    drinks_package: faker.helpers.arrayElement([
      'Standard', 'Premium', 'VIP Bottle Service'
    ])
  },
  customer: {
    email_consent: {
      transactional: faker.datatype.boolean(),
      marketing: faker.datatype.boolean(),
      tracking: faker.datatype.boolean()
    },
    preferences: {
      email_frequency: faker.helpers.arrayElement([
        'low', 'normal', 'high'
      ]),
      communication_channel: 'email'
    }
  }
});