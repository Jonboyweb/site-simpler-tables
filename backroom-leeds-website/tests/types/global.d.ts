// Global type definitions for Backroom Leeds test suite
// Resolves TypeScript inference issues with global object extensions

declare global {
  // Global test configuration interface
  var testConfig: {
    venue: {
      capacity: {
        downstairs: number
        upstairs: number
        vip: number
        total: number
      }
      operatingHours: {
        [key: string]: {
          open: string
          close: string
        }
      }
      tables: {
        twoPerson: number
        fourPerson: number
        sixPerson: number
        eightPerson: number
        vipBooths: number
      }
    }
    performance: {
      unitTestTimeout: number
      integrationTestTimeout: number
      e2eTestTimeout: number
      apiResponseTime: number
      pageLoadTime: number
    }
    accessibility: {
      wcagLevel: string
      contrastRatio: number
      keyboardNavigation: boolean
      screenReaderSupport: boolean
    }
  }

  // Test logging utilities interface
  var testLog: {
    booking: (message: string, data?: any) => void
    event: (message: string, data?: any) => void
    customer: (message: string, data?: any) => void
    performance: (message: string, data?: any) => void
  }

  // Prohibition theme test utilities interface
  var prohibitionTheme: {
    colors: {
      noir: string
      burgundy: string
      gold: string
      copper: string
      champagne: string
    }
    fonts: {
      bebas: string
      playfair: string
      greatVibes: string
    }
  }

  // Test data generators interface
  var generateTestData: {
    customer: (overrides?: Partial<Customer>) => Customer
    booking: (overrides?: Partial<Booking>) => Booking
    event: (overrides?: Partial<Event>) => Event
  }

  // Jest global fetch mock
  var fetch: jest.Mock
}

// Type definitions for test data models
interface Customer {
  id: string
  name: string
  email: string
  phone: string
  preferences: {
    dietary: string[]
    seating: string
    communication: string
  }
  loyaltyTier: string
  totalVisits: number
}

interface Booking {
  id: string
  customerId: string
  date: string
  time: string
  partySize: number
  tableId: string
  status: string
  specialRequests: string
  totalAmount: number
}

interface Event {
  id: string
  title: string
  description: string
  date: string
  startTime: string
  endTime: string
  capacity: number
  ticketPrice: number
  artist: string
}

export {}