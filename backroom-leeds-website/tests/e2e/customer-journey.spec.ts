import { test, expect } from '@playwright/test';

test.describe('Customer Booking Journey', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/events');
  });

  test('Successfully book a table for LA FIESTA', async ({ page }) => {
    // Select LA FIESTA event
    const fiestEvent = await page.getByRole('heading', { name: /LA FIESTA/i });
    await fiestEvent.click();

    // Select table and package
    await page.getByRole('button', { name: /Book Table/i }).first().click();
    await page.getByRole('radio', { name: /Premium Package/i }).check();

    // Fill customer details
    await page.fill('input[name="name"]', 'Test Customer');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="phone"]', '+447911123456');

    // Proceed to payment
    await page.getByRole('button', { name: /Proceed to Payment/i }).click();

    // Simulate Stripe payment (test card)
    await page.fill('input[name="cardNumber"]', '4242424242424242');
    await page.fill('input[name="expiry"]', '12/25');
    await page.fill('input[name="cvc"]', '123');

    await page.getByRole('button', { name: /Complete Booking/i }).click();

    // Verify booking confirmation
    const confirmationMessage = await page.getByRole('heading', { name: /Booking Confirmed/i });
    expect(confirmationMessage).toBeTruthy();
  });

  test('Mobile booking experience', async ({ page }) => {
    // Mobile-specific booking flow test
    await page.setViewportSize({ width: 375, height: 812 }); // iPhone X size
    
    const mobileMenuToggle = await page.getByRole('button', { name: /Menu/i });
    await mobileMenuToggle.click();

    const eventLink = await page.getByRole('link', { name: /SHHH! Event/i });
    await eventLink.click();

    // Additional mobile-specific interaction tests
    const bookingButton = await page.getByRole('button', { name: /Book Now/i });
    expect(bookingButton).toBeVisible();
  });

  test('Edge case: Sold out event handling', async ({ page }) => {
    // Navigate to a potentially sold-out event
    await page.goto('/events/nostalgia');

    const soldOutMessage = await page.getByRole('alert', { name: /Sold Out/i });
    
    // Check waitlist functionality
    if (soldOutMessage) {
      const waitlistButton = await page.getByRole('button', { name: /Join Waitlist/i });
      expect(waitlistButton).toBeVisible();

      await waitlistButton.click();
      await page.fill('input[name="email"]', 'waitlist@example.com');
      await page.getByRole('button', { name: /Submit/i }).click();

      const confirmationText = await page.getByText(/Waitlist Confirmation/i);
      expect(confirmationText).toBeTruthy();
    }
  });
});

test.describe('Payment Processing Scenarios', () => {
  test('Handle declined card payment', async ({ page }) => {
    // Simulate declined payment scenario
    await page.goto('/events');
    
    // Select event and proceed to payment
    await page.getByRole('button', { name: /Book Table/i }).first().click();

    // Use a test card that simulates a decline
    await page.fill('input[name="cardNumber"]', '4000000000000002'); // Test declined card
    await page.fill('input[name="expiry"]', '12/25');
    await page.fill('input[name="cvc"]', '123');

    await page.getByRole('button', { name: /Complete Booking/i }).click();

    // Verify error handling
    const errorMessage = await page.getByRole('alert', { name: /Payment Declined/i });
    expect(errorMessage).toBeTruthy();
  });
});