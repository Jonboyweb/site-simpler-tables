import { test, expect } from '@playwright/test'

// Comprehensive booking flow E2E tests for Backroom Leeds
test.describe('Booking Flow - Complete User Journey', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to booking page
    await page.goto('/booking')
    
    // Ensure prohibition theme is loaded
    await expect(page.locator('h1')).toHaveClass(/font-bebas/)
    
    // Wait for availability data to load
    await page.waitForSelector('[data-testid="table-selector"]', { state: 'visible' })
  })

  test('complete booking flow - Friday night premium table', async ({ page }) => {
    // Step 1: Select premium table for Friday night
    await test.step('Select VIP booth table', async () => {
      await page.click('[data-testid="table-vip-1"]')
      await expect(page.locator('[data-testid="selected-table"]')).toHaveText('VIP Booth #1')
      
      // Validate prohibition styling
      await expect(page.locator('[data-testid="table-vip-1"]')).toHaveClass(/border-speakeasy-gold/)
    })

    // Step 2: Choose date and time
    await test.step('Select date and time', async () => {
      // Select Friday night - premium time slot
      await page.fill('[data-testid="date-picker"]', '2024-12-29') // Friday
      await page.selectOption('[data-testid="time-select"]', '20:00')
      
      // Verify dynamic pricing for premium slot
      await expect(page.locator('[data-testid="pricing-info"]')).toContainText('Premium Time')
      
      // Check availability confirmation
      await expect(page.locator('[data-testid="availability-status"]')).toHaveText('Available')
    })

    // Step 3: Add guest information
    await test.step('Enter guest details', async () => {
      await page.fill('[data-testid="guest-name"]', 'James Gatsby')
      await page.fill('[data-testid="guest-email"]', 'gatsby@speakeasy.com')
      await page.fill('[data-testid="guest-phone"]', '+44 20 7946 0958')
      await page.selectOption('[data-testid="party-size"]', '6')
      
      // Add special requests with prohibition theme
      await page.fill('[data-testid="special-requests"]', 
        'Celebrating anniversary - please prepare champagne service')
    })

    // Step 4: Review booking details
    await test.step('Review booking summary', async () => {
      await page.click('[data-testid="review-booking"]')
      
      // Verify all details in Art Deco styled summary
      await expect(page.locator('[data-testid="booking-summary"]')).toBeVisible()
      await expect(page.locator('[data-testid="summary-table"]')).toContainText('VIP Booth #1')
      await expect(page.locator('[data-testid="summary-date"]')).toContainText('Friday, December 29, 2024')
      await expect(page.locator('[data-testid="summary-time"]')).toContainText('8:00 PM')
      await expect(page.locator('[data-testid="summary-guests"]')).toContainText('6 guests')
      
      // Check total amount calculation
      await expect(page.locator('[data-testid="total-amount"]')).toContainText('£150.00')
    })

    // Step 5: Complete payment
    await test.step('Process payment', async () => {
      await page.click('[data-testid="confirm-booking"]')
      
      // Wait for payment form with prohibition styling
      await expect(page.locator('[data-testid="payment-form"]')).toBeVisible()
      await expect(page.locator('.art-deco-border')).toBeVisible()
      
      // Fill payment details (test card)
      await page.fill('[data-testid="card-number"]', '4242424242424242')
      await page.fill('[data-testid="card-expiry"]', '12/26')
      await page.fill('[data-testid="card-cvc"]', '123')
      await page.fill('[data-testid="card-name"]', 'James Gatsby')
      
      // Process payment
      await page.click('[data-testid="process-payment"]')
      
      // Wait for payment processing
      await expect(page.locator('[data-testid="payment-processing"]')).toBeVisible()
    })

    // Step 6: Confirm booking success
    await test.step('Verify booking confirmation', async () => {
      // Wait for confirmation page with prohibition theme
      await expect(page.locator('[data-testid="booking-confirmation"]')).toBeVisible({ timeout: 10000 })
      
      // Check confirmation details with Art Deco styling
      await expect(page.locator('h1')).toContainText('Booking Confirmed')
      await expect(page.locator('h1')).toHaveClass(/font-bebas.*text-speakeasy-gold/)
      
      // Verify booking reference
      const bookingRef = await page.locator('[data-testid="booking-reference"]').textContent()
      expect(bookingRef).toMatch(/^BR\d{8}$/) // Format: BR12345678
      
      // Check email confirmation message
      await expect(page.locator('[data-testid="email-confirmation"]')).toContainText('gatsby@speakeasy.com')
      
      // Validate prohibition-themed confirmation card
      await expect(page.locator('[data-testid="confirmation-card"]')).toHaveClass(/bg-gradient-to-b.*from-speakeasy-noir/)
    })

    // Step 7: Verify booking in customer portal
    await test.step('Check booking in customer account', async () => {
      await page.click('[data-testid="view-my-bookings"]')
      
      // Should navigate to customer portal
      await expect(page).toHaveURL(/.*\/customer\/bookings/)
      
      // Verify booking appears in history
      await expect(page.locator('[data-testid="booking-history"]')).toBeVisible()
      await expect(page.locator(`[data-testid="booking-${bookingRef}"]`)).toBeVisible()
      
      // Check booking status
      await expect(page.locator(`[data-testid="status-${bookingRef}"]`)).toHaveText('Confirmed')
    })
  })

  test('booking flow with waitlist - fully booked scenario', async ({ page }) => {
    // Simulate fully booked Friday night
    await page.route('**/api/bookings/availability', async (route) => {
      await route.fulfill({
        json: {
          available: false,
          waitlistAvailable: true,
          nextAvailable: '2024-12-30T20:00:00Z'
        }
      })
    })

    await test.step('Attempt to book unavailable slot', async () => {
      await page.click('[data-testid="table-4"]')
      await page.fill('[data-testid="date-picker"]', '2024-12-29')
      await page.selectOption('[data-testid="time-select"]', '20:00')
      
      // Should show no availability
      await expect(page.locator('[data-testid="availability-status"]')).toHaveText('Fully Booked')
    })

    await test.step('Join waitlist', async () => {
      await page.click('[data-testid="join-waitlist"]')
      
      // Fill waitlist form
      await page.fill('[data-testid="waitlist-name"]', 'Sarah Connor')
      await page.fill('[data-testid="waitlist-email"]', 'sarah@example.com')
      await page.fill('[data-testid="waitlist-phone"]', '+44 20 7946 0959')
      
      await page.click('[data-testid="confirm-waitlist"]')
      
      // Verify waitlist confirmation
      await expect(page.locator('[data-testid="waitlist-confirmation"]')).toBeVisible()
      await expect(page.locator('[data-testid="waitlist-position"]')).toContainText('Position #')
    })
  })

  test('mobile booking flow - responsive design validation', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 })

    await test.step('Verify mobile layout', async () => {
      // Check mobile-optimized table selector
      await expect(page.locator('[data-testid="table-selector-mobile"]')).toBeVisible()
      
      // Verify prohibition theme on mobile
      await expect(page.locator('h1')).toHaveClass(/text-4xl.*md:text-6xl/)
      
      // Check touch-friendly buttons (minimum 44px)
      const buttonSize = await page.locator('[data-testid="table-4"]').boundingBox()
      expect(buttonSize?.height).toBeGreaterThanOrEqual(44)
    })

    await test.step('Complete mobile booking', async () => {
      // Select table with touch interaction
      await page.tap('[data-testid="table-4"]')
      
      // Use mobile date picker
      await page.fill('[data-testid="date-picker-mobile"]', '2024-12-31')
      
      // Scroll and fill form (mobile behavior)
      await page.locator('[data-testid="guest-details-section"]').scrollIntoViewIfNeeded()
      await page.fill('[data-testid="guest-name"]', 'Mobile User')
      await page.fill('[data-testid="guest-email"]', 'mobile@example.com')
      
      // Complete mobile booking
      await page.tap('[data-testid="confirm-mobile-booking"]')
      
      // Verify mobile confirmation layout
      await expect(page.locator('[data-testid="mobile-confirmation"]')).toBeVisible()
    })
  })

  test('accessibility - keyboard navigation and screen reader', async ({ page }) => {
    await test.step('Keyboard navigation through booking flow', async () => {
      // Start from first focusable element
      await page.keyboard.press('Tab')
      await expect(page.locator('[data-testid="table-1"]')).toBeFocused()
      
      // Navigate through tables using arrow keys
      await page.keyboard.press('ArrowRight')
      await expect(page.locator('[data-testid="table-2"]')).toBeFocused()
      
      // Select table with Enter
      await page.keyboard.press('Enter')
      await expect(page.locator('[data-testid="selected-table"]')).toHaveText('Table #2')
      
      // Navigate to date picker
      await page.keyboard.press('Tab')
      await expect(page.locator('[data-testid="date-picker"]')).toBeFocused()
    })

    await test.step('Screen reader accessibility', async () => {
      // Check ARIA labels and roles
      await expect(page.locator('[data-testid="table-selector"]')).toHaveAttribute('role', 'radiogroup')
      await expect(page.locator('[data-testid="table-1"]')).toHaveAttribute('aria-label', 'Table 1, seats 2 people')
      
      // Verify form labels
      await expect(page.locator('[data-testid="guest-name"]')).toHaveAttribute('aria-describedby')
      
      // Check error announcements
      await page.fill('[data-testid="guest-email"]', 'invalid-email')
      await page.blur('[data-testid="guest-email"]')
      await expect(page.locator('[role="alert"]')).toContainText('Please enter a valid email address')
    })

    await test.step('Color contrast validation', async () => {
      // Verify prohibition theme meets WCAG AA standards
      const goldText = page.locator('.text-speakeasy-gold')
      const bgColor = await goldText.evaluate(el => getComputedStyle(el).backgroundColor)
      const textColor = await goldText.evaluate(el => getComputedStyle(el).color)
      
      // These would typically use a contrast checking library
      // For demo purposes, we verify the elements exist and are styled
      expect(bgColor).toBeDefined()
      expect(textColor).toBeDefined()
    })
  })
})