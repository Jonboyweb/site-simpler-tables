import { calculateTableAvailability, validateBooking } from '@/lib/booking';

describe('Booking Logic', () => {
  describe('calculateTableAvailability', () => {
    it('should correctly calculate table availability', () => {
      const totalTables = 16;
      const bookedTables = 5;
      const result = calculateTableAvailability(totalTables, bookedTables);
      
      expect(result.available).toBe(11);
      expect(result.percentAvailable).toBe(68.75);
    });
  });

  describe('validateBooking', () => {
    it('should reject bookings beyond 2-table limit', () => {
      const bookingRequest = {
        userId: 'user123',
        tables: 3,
        date: new Date('2025-09-15')
      };

      expect(() => validateBooking(bookingRequest)).toThrow('Maximum 2 tables per booking');
    });
  });
});