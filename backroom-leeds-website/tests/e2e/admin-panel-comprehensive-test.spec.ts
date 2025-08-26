import { test, expect, Page } from '@playwright/test';

test.describe('The Backroom Leeds Admin Panel Comprehensive Test', () => {
  let page: Page;

  test.beforeAll(async ({ browser }) => {
    page = await browser.newPage();
    await page.goto('http://localhost:3001/admin/login');
  });

  test.afterAll(async () => {
    await page.close();
  });

  // Authentication Tests
  test('Admin Login Page Loads', async () => {
    await expect(page).toHaveTitle(/Admin Login/);
    await expect(page.getByRole('heading', { name: 'Admin Login' })).toBeVisible();
  });

  test('Login with Invalid Credentials', async () => {
    const emailInput = page.getByPlaceholder('Enter your email');
    const passwordInput = page.getByPlaceholder('Enter your password');
    const loginButton = page.getByRole('button', { name: 'Login' });

    await emailInput.fill('invalid@backroomleeds.com');
    await passwordInput.fill('wrongpassword');
    await loginButton.click();

    // Check for error message
    const errorMessage = page.getByText('Invalid credentials');
    await expect(errorMessage).toBeVisible();
  });

  test('Navigation Menu Integrity', async () => {
    // Assuming a successful login first
    await loginToAdminPanel(page);

    const expectedMenuItems = [
      'Dashboard',
      'Bookings',
      'Events',
      'Tables',
      'Users',
      'Reports',
      'Settings'
    ];

    for (const menuItem of expectedMenuItems) {
      const menuLink = page.getByRole('link', { name: menuItem });
      await expect(menuLink).toBeVisible(`${menuItem} menu item is missing`);
    }
  });

  test('Booking Management Functionality', async () => {
    await navigateToAdminSection(page, 'Bookings');

    // Check booking list loads
    const bookingList = page.getByTestId('booking-list');
    await expect(bookingList).toBeVisible();

    // Check filtering and sorting work
    const filterInput = page.getByPlaceholder('Filter bookings');
    await filterInput.fill('SHHH!');
    await expect(page.getByTestId('booking-item')).toHaveCount(2); // Example expectation
  });

  test('Event Management Checks', async () => {
    await navigateToAdminSection(page, 'Events');

    // Verify event creation form
    const createEventButton = page.getByRole('button', { name: 'Create New Event' });
    await createEventButton.click();

    const eventNameInput = page.getByPlaceholder('Event Name');
    const eventDateInput = page.getByPlaceholder('Event Date');
    const saveEventButton = page.getByRole('button', { name: 'Save Event' });

    await expect(eventNameInput).toBeVisible();
    await expect(eventDateInput).toBeVisible();
    await expect(saveEventButton).toBeVisible();
  });

  test('Table Management Validation', async () => {
    await navigateToAdminSection(page, 'Tables');

    // Check table overview
    const tableGrid = page.getByTestId('table-management-grid');
    await expect(tableGrid).toBeVisible();

    // Check table status indicators
    const availableTables = page.getByTestId('table-status-available');
    const reservedTables = page.getByTestId('table-status-reserved');
    
    await expect(availableTables.first()).toBeVisible();
    await expect(reservedTables.first()).toBeVisible();
  });

  test('User Management Access Control', async () => {
    await navigateToAdminSection(page, 'Users');

    // Check user list and roles
    const userList = page.getByTestId('user-management-list');
    await expect(userList).toBeVisible();

    const adminUsers = page.getByTestId('user-role-admin');
    const managerUsers = page.getByTestId('user-role-manager');
    
    await expect(adminUsers.first()).toBeVisible();
    await expect(managerUsers.first()).toBeVisible();
  });

  test('Reporting System Validation', async () => {
    await navigateToAdminSection(page, 'Reports');

    // Check report generation options
    const reportTypeSelect = page.getByTestId('report-type-selector');
    const generateReportButton = page.getByRole('button', { name: 'Generate Report' });

    await expect(reportTypeSelect).toBeVisible();
    await expect(generateReportButton).toBeVisible();
  });

  // Utility Functions
  async function loginToAdminPanel(page: Page) {
    await page.goto('http://localhost:3001/admin/login');
    const emailInput = page.getByPlaceholder('Enter your email');
    const passwordInput = page.getByPlaceholder('Enter your password');
    const loginButton = page.getByRole('button', { name: 'Login' });

    await emailInput.fill('admin@backroomleeds.com');
    await passwordInput.fill('secureAdminPassword2025!');
    await loginButton.click();

    // Wait for dashboard to load
    await page.waitForURL('**/admin/dashboard');
  }

  async function navigateToAdminSection(page: Page, sectionName: string) {
    await loginToAdminPanel(page);
    const sectionLink = page.getByRole('link', { name: sectionName });
    await sectionLink.click();
    await page.waitForURL(`**/${sectionName.toLowerCase()}`);
  }
});