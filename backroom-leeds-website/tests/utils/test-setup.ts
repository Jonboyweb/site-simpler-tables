// Global test setup for Backroom Leeds testing suite
import '@testing-library/jest-dom'
import { expect, afterEach, beforeAll, afterAll } from '@jest/globals'
import { cleanup } from '@testing-library/react'
import { server } from './mocks/server'

// Extend Jest matchers with custom venue-specific matchers
import './matchers/venue-matchers'

// Setup MSW (Mock Service Worker) for API mocking
beforeAll(() => {
  // Start MSW server for API mocking
  server.listen({
    onUnhandledRequest: 'error'
  })
})

afterEach(() => {
  // Cleanup React Testing Library
  cleanup()
  
  // Reset MSW handlers
  server.resetHandlers()
  
  // Clear all mocks
  jest.clearAllMocks()
  
  // Reset venue-specific state
  localStorage.clear()
  sessionStorage.clear()
})

afterAll(() => {
  // Close MSW server
  server.close()
})

// Global test configuration
global.testConfig = {
  // Venue-specific test settings
  venue: {
    capacity: {
      downstairs: 120,
      upstairs: 80,
      vip: 24,
      total: 224
    },
    operatingHours: {
      monday: { open: '18:00', close: '01:00' },
      tuesday: { open: '18:00', close: '01:00' },
      wednesday: { open: '18:00', close: '01:00' },
      thursday: { open: '18:00', close: '02:00' },
      friday: { open: '17:00', close: '03:00' },
      saturday: { open: '17:00', close: '03:00' },
      sunday: { open: '18:00', close: '24:00' }
    },
    tables: {
      twoPerson: 12,
      fourPerson: 18,
      sixPerson: 8,
      eightPerson: 4,
      vipBooths: 6
    }
  },
  // Test performance thresholds
  performance: {
    unitTestTimeout: 30000, // 30 seconds
    integrationTestTimeout: 300000, // 5 minutes
    e2eTestTimeout: 900000, // 15 minutes
    apiResponseTime: 200, // 200ms
    pageLoadTime: 2500 // 2.5 seconds
  },
  // Accessibility requirements
  accessibility: {
    wcagLevel: 'AA',
    contrastRatio: 4.5,
    keyboardNavigation: true,
    screenReaderSupport: true
  }
}

// Custom console methods for test debugging
global.testLog = {
  booking: (message: string, data?: any) => {
    if (process.env.TEST_DEBUG === 'true') {
      console.log(`🎫 [BOOKING] ${message}`, data || '')
    }
  },
  event: (message: string, data?: any) => {
    if (process.env.TEST_DEBUG === 'true') {
      console.log(`🎭 [EVENT] ${message}`, data || '')
    }
  },
  customer: (message: string, data?: any) => {
    if (process.env.TEST_DEBUG === 'true') {
      console.log(`👤 [CUSTOMER] ${message}`, data || '')
    }
  },
  performance: (message: string, data?: any) => {
    if (process.env.TEST_DEBUG === 'true') {
      console.log(`⚡ [PERFORMANCE] ${message}`, data || '')
    }
  }
}

// Prohibition theme test utilities
global.prohibitionTheme = {
  colors: {
    noir: 'oklch(8% 0.02 240)',
    burgundy: 'oklch(25% 0.15 15)', 
    gold: 'oklch(76.9% 0.188 70.08)',
    copper: 'oklch(55% 0.12 45)',
    champagne: 'oklch(95% 0.05 85)'
  },
  fonts: {
    bebas: 'Bebas Neue',
    playfair: 'Playfair Display',
    greatVibes: 'Great Vibes'
  }
}

// Test data generators
global.generateTestData = {
  customer: (overrides = {}) => ({
    id: `customer_${Date.now()}`,
    name: 'John Doe',
    email: 'john.doe@example.com',
    phone: '+44 20 7946 0958',
    preferences: {
      dietary: [],
      seating: 'booth',
      communication: 'email'
    },
    loyaltyTier: 'standard',
    totalVisits: 0,
    ...overrides
  }),
  
  booking: (overrides = {}) => ({
    id: `booking_${Date.now()}`,
    customerId: 'customer_123',
    date: '2024-12-31',
    time: '20:00',
    partySize: 4,
    tableId: 'table_4',
    status: 'confirmed',
    specialRequests: '',
    totalAmount: 0,
    ...overrides
  }),
  
  event: (overrides = {}) => ({
    id: `event_${Date.now()}`,
    title: 'Prohibition Jazz Night',
    description: 'Live jazz performance in authentic speakeasy atmosphere',
    date: '2024-12-31',
    startTime: '21:00',
    endTime: '02:00',
    capacity: 150,
    ticketPrice: 25.00,
    artist: 'The Gatsby Quintet',
    ...overrides
  })
}

// Error handling for tests
process.on('unhandledRejection', (reason) => {
  console.error('Unhandled Rejection in test:', reason)
  throw reason
})

// Setup fetch mock for Node environment
if (typeof global.fetch === 'undefined') {
  global.fetch = jest.fn()
}