import { test, expect } from '@playwright/test';

test.describe('Booking Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/events');
  });

  test('can select and book an event table', async ({ page }) => {
    // Find first available event
    const firstEvent = await page.locator('.event-card').first();
    await firstEvent.click();

    // Select tables
    await page.locator('.table-selection [data-testid="table-checkbox"]').first().check();
    await page.locator('.table-selection [data-testid="table-checkbox"]').nth(1).check();

    // Proceed to booking
    await page.locator('button[type="submit"]').click();

    // Validate booking confirmation
    await expect(page.locator('.booking-confirmation')).toBeVisible();
    await expect(page.locator('.booking-confirmation')).toContainText('Booking Successful');
  });

  test('prevents booking more than 2 tables', async ({ page }) => {
    await page.goto('/events/la-fiesta');

    // Try to select 3 tables
    const tableCheckboxes = page.locator('.table-selection [data-testid="table-checkbox"]');
    await tableCheckboxes.first().check();
    await tableCheckboxes.nth(1).check();
    await tableCheckboxes.nth(2).check();

    // Validate error message
    await expect(page.locator('.error-message')).toContainText('Maximum 2 tables allowed');
  });
});