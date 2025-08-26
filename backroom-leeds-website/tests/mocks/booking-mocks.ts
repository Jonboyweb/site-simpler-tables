export const mockBookings = {
  standardBooking: {
    id: 'booking-789',
    reference: 'BRL-2025-12345',
    customer: {
      id: 'customer-123',
      email: 'regular@example.com'
    },
    date: new Date('2025-09-15T20:00:00'),
    tables: [15],
    partySize: 4,
    specialRequests: [],
    status: 'confirmed'
  },
  combinedTableBooking: {
    id: 'booking-combined-456',
    reference: 'BRL-2025-54321',
    customer: {
      id: 'customer-vip-456',
      email: 'vip@example.com'
    },
    date: new Date('2025-09-15T20:00:00'),
    tables: [15, 16],
    partySize: 10,
    specialRequests: ['Birthday celebration'],
    status: 'confirmed'
  }
};