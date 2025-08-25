// Mock Service Worker server setup for API mocking in tests
import { setupServer } from 'msw/node'
import { http, HttpResponse } from 'msw'

// Define mock handlers for Backroom Leeds API endpoints
const handlers = [
  // Authentication endpoints
  http.post('/api/auth/login', () => {
    return HttpResponse.json({
      success: true,
      user: {
        id: 'user_123',
        email: 'test@backroomleeds.com',
        role: 'customer'
      },
      token: 'mock_jwt_token'
    })
  }),

  // Booking endpoints
  http.get('/api/bookings/availability', () => {
    return HttpResponse.json({
      success: true,
      availableSlots: [
        { time: '18:00', available: true },
        { time: '19:00', available: true },
        { time: '20:00', available: false },
        { time: '21:00', available: true }
      ]
    })
  }),

  http.post('/api/bookings', () => {
    return HttpResponse.json({
      success: true,
      booking: {
        id: 'booking_123',
        customerId: 'customer_123',
        date: '2024-12-31',
        time: '20:00',
        partySize: 4,
        tableId: 'table_4',
        status: 'confirmed',
        confirmationCode: 'BRL2024123'
      }
    })
  }),

  // Table management endpoints
  http.get('/api/tables', () => {
    return HttpResponse.json({
      success: true,
      tables: [
        {
          id: 'table_1',
          number: '1',
          capacity: 4,
          location: 'downstairs',
          type: 'standard',
          isAvailable: true
        },
        {
          id: 'table_2',
          number: '2',
          capacity: 6,
          location: 'upstairs',
          type: 'booth',
          isAvailable: false
        }
      ]
    })
  }),

  // Event management endpoints
  http.get('/api/events', () => {
    return HttpResponse.json({
      success: true,
      events: [
        {
          id: 'event_123',
          title: 'LA FIESTA',
          description: 'Weekly Latin music night',
          date: '2024-12-31',
          startTime: '21:00',
          endTime: '03:00',
          ticketPrice: 15.00,
          artist: 'DJ Rodriguez'
        }
      ]
    })
  }),

  // Payment processing endpoints
  http.post('/api/payments/create-intent', () => {
    return HttpResponse.json({
      success: true,
      clientSecret: 'pi_mock_client_secret',
      amount: 5000 // £50.00 in pence
    })
  }),

  // Admin dashboard endpoints
  http.get('/api/admin/dashboard', () => {
    return HttpResponse.json({
      success: true,
      stats: {
        totalBookings: 156,
        totalRevenue: 7800,
        occupancyRate: 78.5,
        averagePartySize: 3.8
      }
    })
  })
]

// Create and export the MSW server
export const server = setupServer(...handlers)

// Export handlers for test-specific customization
export { handlers }