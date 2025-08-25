import { createClient } from '@supabase/supabase-js';
import { Database } from '@/types/database.types';
import { simulateBookingTransaction } from '@/lib/booking';

const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

describe('Supabase Booking Integration', () => {
  beforeEach(async () => {
    // Reset test data before each test
    await supabase.from('bookings').delete().gt('id', 0);
  });

  it('should create a booking and update table availability', async () => {
    const bookingData = {
      event_id: 1,
      user_id: 'test-user-123',
      tables_booked: 2,
      booking_date: new Date().toISOString(),
    };

    const result = await simulateBookingTransaction(supabase, bookingData);
    
    expect(result.success).toBeTruthy();
    expect(result.bookingId).toBeDefined();
  });

  it('should prevent overbooking', async () => {
    // Simulate booking all available tables
    const result = await simulateBookingTransaction(supabase, {
      event_id: 1,
      user_id: 'test-user-max',
      tables_booked: 16,  // More than available tables
      booking_date: new Date().toISOString(),
    });

    expect(result.success).toBeFalsy();
    expect(result.error).toContain('Insufficient tables available');
  });
});