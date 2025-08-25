import { createClient } from '@supabase/supabase-js';
import { Database } from '../../src/types/supabase.types';

// Utility functions for database testing
export const getSupabaseTestClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

  return createClient<Database>(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: false,
    },
  });
};

// Helper function to generate test data
export const generateTestData = {
  user: () => ({
    email: `test-${Date.now()}@backroomleeds.com`,
    full_name: 'Test User',
    role: 'customer',
  }),

  booking: (userId: string) => ({
    user_id: userId,
    event_id: 'test-event-id',
    table_id: 'test-table-id',
    status: 'pending',
  }),

  // Add more test data generators as needed
};

// Cleanup utility to remove test data after tests
export const cleanupTestData = async (supabase: any, table: string, condition: object) => {
  const { error } = await supabase
    .from(table)
    .delete()
    .match(condition);

  if (error) {
    console.error(`Error cleaning up ${table}:`, error);
  }
};