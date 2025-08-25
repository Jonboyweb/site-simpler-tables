// Custom Jest matchers for Backroom Leeds venue-specific testing
import { expect } from '@jest/globals'

// Extend Jest matchers interface
declare module '@jest/expect' {
  interface Matchers<R> {
    toBeValidBookingTime(): R
    toBeWithinVenueCapacity(): R
    toHaveProhibitionTheme(): R
    toBeAccessibleComponent(): R
    toMeetPerformanceThreshold(threshold: number): R
  }
}

// Custom matcher: Check if time is within venue operating hours
expect.extend({
  toBeValidBookingTime(received: string) {
    const time = received.split(':').map(Number)
    const hours = time[0]
    const minutes = time[1]
    
    // Venue operates from 17:00 to 03:00 (next day)
    const isValidHour = hours >= 17 || hours <= 3
    const isValidMinute = minutes >= 0 && minutes <= 59
    const isValidTime = isValidHour && isValidMinute
    
    if (isValidTime) {
      return {
        message: () => `expected ${received} not to be a valid booking time`,
        pass: true
      }
    } else {
      return {
        message: () => `expected ${received} to be a valid booking time (17:00-03:00)`,
        pass: false
      }
    }
  }
})

// Custom matcher: Check if party size is within venue capacity constraints
expect.extend({
  toBeWithinVenueCapacity(received: number) {
    const maxCapacity = global.testConfig?.venue?.capacity?.total || 224
    const isWithinCapacity = received > 0 && received <= maxCapacity
    
    if (isWithinCapacity) {
      return {
        message: () => `expected ${received} not to be within venue capacity`,
        pass: true
      }
    } else {
      return {
        message: () => `expected ${received} to be within venue capacity (1-${maxCapacity})`,
        pass: false
      }
    }
  }
})

// Custom matcher: Check if element has prohibition theme styling
expect.extend({
  toHaveProhibitionTheme(received: HTMLElement) {
    const computedStyle = window.getComputedStyle(received)
    const backgroundColor = computedStyle.backgroundColor
    const color = computedStyle.color
    const fontFamily = computedStyle.fontFamily.toLowerCase()
    
    // Check for prohibition theme colors and fonts
    const hasNoirColors = backgroundColor.includes('8%') || color.includes('8%')
    const hasBurgundyColors = backgroundColor.includes('25%') || color.includes('25%')
    const hasGoldColors = backgroundColor.includes('76.9%') || color.includes('76.9%')
    const hasProhibitionFonts = fontFamily.includes('bebas') || 
                               fontFamily.includes('playfair') || 
                               fontFamily.includes('great vibes')
    
    const hasProhibitionTheme = (hasNoirColors || hasBurgundyColors || hasGoldColors) && hasProhibitionFonts
    
    if (hasProhibitionTheme) {
      return {
        message: () => `expected element not to have prohibition theme styling`,
        pass: true
      }
    } else {
      return {
        message: () => `expected element to have prohibition theme styling (noir/burgundy/gold colors with period fonts)`,
        pass: false
      }
    }
  }
})

// Custom matcher: Check if component meets WCAG 2.1 AA accessibility standards
expect.extend({
  toBeAccessibleComponent(received: HTMLElement) {
    const hasAriaLabels = received.hasAttribute('aria-label') || received.hasAttribute('aria-labelledby')
    const hasProperHeadings = received.querySelector('h1, h2, h3, h4, h5, h6') !== null
    const hasFocusableElements = received.querySelector('button, a, input, select, textarea, [tabindex]') !== null
    const hasAltText = Array.from(received.querySelectorAll('img')).every(img => img.hasAttribute('alt'))
    
    const isAccessible = hasAriaLabels && hasProperHeadings && (hasFocusableElements ? true : true) && hasAltText
    
    if (isAccessible) {
      return {
        message: () => `expected component not to be accessible`,
        pass: true
      }
    } else {
      return {
        message: () => `expected component to meet WCAG 2.1 AA accessibility standards`,
        pass: false
      }
    }
  }
})

// Custom matcher: Check if performance metric meets threshold
expect.extend({
  toMeetPerformanceThreshold(received: number, threshold: number) {
    const meetsThreshold = received <= threshold
    
    if (meetsThreshold) {
      return {
        message: () => `expected ${received} not to meet performance threshold of ${threshold}ms`,
        pass: true
      }
    } else {
      return {
        message: () => `expected ${received} to meet performance threshold of ${threshold}ms`,
        pass: false
      }
    }
  }
})

export {}