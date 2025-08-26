import { BookingLimitService } from '@/lib/booking/booking-limit-service';
import { mockCustomers } from '@/tests/mocks/customer-mocks';

describe('Booking Limits Enforcement', () => {
  let limitService: BookingLimitService;

  beforeEach(() => {
    limitService = new BookingLimitService();
  });

  test('Identifies customers across multiple platforms', () => {
    const customer = mockCustomers.vipCustomer;
    const platformIdentities = limitService.identifyCustomerAcrossPlatforms(customer);

    expect(platformIdentities.identified).toBe(true);
    expect(platformIdentities.platforms).toContain('email');
    expect(platformIdentities.platforms).toContain('phone');
  });

  test('Enforces 2-table maximum per customer per day', () => {
    const customer = mockCustomers.regularCustomer;
    const bookingAttempt = limitService.validateBookingLimit(
      customer, 
      new Date('2025-09-15')
    );

    expect(bookingAttempt.allowed).toBe(true);
    expect(bookingAttempt.remainingTables).toBe(2);
  });

  test('Allows VIP overrides for Gold/Platinum customers', () => {
    const vipCustomer = mockCustomers.vipCustomer;
    const bookingAttempt = limitService.validateBookingLimit(
      vipCustomer, 
      new Date('2025-09-15')
    );

    expect(bookingAttempt.allowed).toBe(true);
    expect(bookingAttempt.remainingTables).toBe(3);
  });

  test('Calculates risk scores accurately (0-100)', () => {
    const customer = mockCustomers.regularCustomer;
    const riskScore = limitService.calculateRiskScore(customer);

    expect(riskScore).toBeGreaterThanOrEqual(0);
    expect(riskScore).toBeLessThanOrEqual(100);
  });

  test('Provides admin override capabilities', () => {
    const adminOverride = limitService.adminBookingOverride(
      mockCustomers.regularCustomer,
      { 
        reason: 'Special event', 
        additionalTables: 1 
      }
    );

    expect(adminOverride.approved).toBe(true);
    expect(adminOverride.modifiedLimit).toBe(3);
  });

  test('Handles edge cases and boundary conditions', () => {
    const edgeCaseCustomer = {
      ...mockCustomers.regularCustomer,
      bookingHistory: Array(2).fill({date: new Date('2025-09-15')})
    };

    const bookingAttempt = limitService.validateBookingLimit(
      edgeCaseCustomer, 
      new Date('2025-09-15')
    );

    expect(bookingAttempt.allowed).toBe(false);
    expect(bookingAttempt.reason).toBe('Maximum tables reached');
  });
});