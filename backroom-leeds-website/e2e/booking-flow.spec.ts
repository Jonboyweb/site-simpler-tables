import { test, expect } from '@playwright/test';

test.describe('Table Booking Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/events');
  });

  test('complete booking process', async ({ page }) => {
    // Select an event
    await page.getByText('LA FIESTA').first().click();

    // Select a table
    await page.getByText('Downstairs Table').click();
    await page.getByText('Next').click();

    // Fill customer details
    await page.getByLabel('Name').fill('John Doe');
    await page.getByLabel('Email').fill('john.doe@example.com');
    await page.getByLabel('Phone').fill('+447911123456');
    await page.getByText('Next').click();

    // Select package
    await page.getByText('Premium Package').click();
    await page.getByLabel('I agree to the data handling policy').check();
    await page.getByText('Confirm Booking').click();

    // Verify confirmation
    await expect(page.getByText('Booking Confirmed')).toBeVisible();
    await expect(page.getByText('Booking Reference')).toBeVisible();
  });

  test('validates booking constraints', async ({ page }) => {
    // Attempt to book a table multiple times
    await page.getByText('LA FIESTA').first().click();
    await page.getByText('Downstairs Table').click();
    await page.getByText('Next').click();

    // First booking
    await page.getByLabel('Name').fill('John Doe');
    await page.getByLabel('Email').fill('john.doe@example.com');
    await page.getByLabel('Phone').fill('+447911123456');
    await page.getByText('Next').click();
    await page.getByText('Premium Package').click();
    await page.getByLabel('I agree to the data handling policy').check();
    await page.getByText('Confirm Booking').click();

    // Reset for second booking attempt
    await page.goto('/events');
    await page.getByText('LA FIESTA').first().click();
    await page.getByText('Downstairs Table').click();
    await page.getByText('Next').click();

    // Attempt second booking with same details
    await page.getByLabel('Name').fill('John Doe');
    await page.getByLabel('Email').fill('john.doe@example.com');
    await page.getByLabel('Phone').fill('+447911123456');
    await page.getByText('Next').click();
    await page.getByText('Premium Package').click();
    await page.getByLabel('I agree to the data handling policy').check();
    await page.getByText('Confirm Booking').click();

    // Verify booking constraint error
    await expect(page.getByText('Table Already Booked')).toBeVisible();
  });

  test('handles 48-hour cancellation policy', async ({ page }) => {
    // Complete a booking
    await page.getByText('LA FIESTA').first().click();
    await page.getByText('Downstairs Table').click();
    await page.getByText('Next').click();
    await page.getByLabel('Name').fill('Jane Doe');
    await page.getByLabel('Email').fill('jane.doe@example.com');
    await page.getByLabel('Phone').fill('+447911654321');
    await page.getByText('Next').click();
    await page.getByText('Premium Package').click();
    await page.getByLabel('I agree to the data handling policy').check();
    await page.getByText('Confirm Booking').click();

    // Get booking reference
    const bookingReference = await page.getByText('Booking Reference').textContent();

    // Navigate to cancellation page
    await page.goto('/bookings/cancel');
    await page.getByLabel('Booking Reference').fill(bookingReference || '');
    await page.getByText('Check Cancellation Eligibility').click();

    // Verify cancellation policy information
    await expect(page.getByText('Cancellation Eligible')).toBeVisible();
    await expect(page.getByText('Refund Amount: £50')).toBeVisible();
  });
});