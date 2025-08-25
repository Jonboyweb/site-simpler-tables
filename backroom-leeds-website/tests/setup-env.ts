import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config({ path: '.env.local' });

// Global test setup, if needed
beforeAll(() => {
  // Any global setup for database tests
});

afterAll(() => {
  // Any global cleanup for database tests
});