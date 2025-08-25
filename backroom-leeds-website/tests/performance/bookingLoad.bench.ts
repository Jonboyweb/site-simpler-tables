import { bench, describe } from 'vitest';
import { createClient } from '@supabase/supabase-js';
import { simulateBookingTransaction } from '@/lib/booking';
import { faker } from '@faker-js/faker';

describe('Booking Performance', () => {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  bench('Single booking transaction', async () => {
    const bookingData = {
      event_id: 1,
      user_id: faker.string.uuid(),
      tables_booked: 1,
      booking_date: new Date().toISOString(),
    };

    await simulateBookingTransaction(supabase, bookingData);
  });

  bench('Concurrent multiple bookings', async () => {
    const bookings = Array.from({ length: 10 }, () => ({
      event_id: 1,
      user_id: faker.string.uuid(),
      tables_booked: 1,
      booking_date: new Date().toISOString(),
    }));

    await Promise.all(
      bookings.map(booking => simulateBookingTransaction(supabase, booking))
    );
  }, { 
    iterations: 5 
  });
});