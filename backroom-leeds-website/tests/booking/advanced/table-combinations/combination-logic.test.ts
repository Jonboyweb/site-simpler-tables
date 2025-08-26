import { TableCombinationService } from '@/lib/booking/table-combination-service';
import { mockTables } from '@/tests/mocks/table-mocks';

describe('Table Combination System', () => {
  let combinationService: TableCombinationService;

  beforeEach(() => {
    combinationService = new TableCombinationService(mockTables);
  });

  test('Triggers combination for party size 7-12', () => {
    const partySize = 8;
    const combinationEligibility = combinationService.checkCombinationEligibility(partySize);
    
    expect(combinationEligibility.isEligible).toBe(true);
    expect(combinationEligibility.combinedTables).toEqual([15, 16]);
  });

  test('Calculates combination availability correctly', () => {
    const availability = combinationService.checkCombinedTablesAvailability(
      new Date('2025-09-15T20:00:00'),
      8
    );

    expect(availability.available).toBe(true);
    expect(availability.totalCapacity).toBe(14);
  });

  test('Applies combination fees and setup costs', () => {
    const combinationCosts = combinationService.calculateCombinationCosts(8);

    expect(combinationCosts.baseCombinationFee).toBe(25);
    expect(combinationCosts.setupTime).toBe(15);
    expect(combinationCosts.totalCost).toBeGreaterThan(0);
  });

  test('Prevents individual bookings of combination tables', () => {
    const individualBookingAttempt = combinationService.validateIndividualTableBooking(
      15, 
      new Date('2025-09-15T20:00:00')
    );

    expect(individualBookingAttempt.allowed).toBe(false);
    expect(individualBookingAttempt.reason).toBe('Table part of combination');
  });

  test('Handles partial availability scenarios', () => {
    const partialAvailability = combinationService.checkPartialCombinationAvailability(
      new Date('2025-09-15T20:00:00')
    );

    expect(partialAvailability.partiallyAvailable).toBe(false);
    expect(partialAvailability.availableTables).toEqual([]);
  });

  test('Renders visual table layout with combination state', () => {
    const tableLayout = combinationService.generateTableLayoutState(
      new Date('2025-09-15T20:00:00')
    );

    expect(tableLayout.combinedTables).toEqual([15, 16]);
    expect(tableLayout.combinationStatus).toBe('available');
  });
});