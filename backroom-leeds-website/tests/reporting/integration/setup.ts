import { createClient } from '@supabase/supabase-js';
import Redis from 'ioredis';
import { Queue, Worker } from 'bullmq';
import { Resend } from 'resend';
import { createTransport } from 'nodemailer';

// Centralized test configuration for integration tests
export const testConfig = {
  supabase: {
    url: process.env.SUPABASE_URL || '',
    key: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
  },
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
  },
  email: {
    resendApiKey: process.env.RESEND_API_KEY || '',
    sendgridApiKey: process.env.SENDGRID_API_KEY || '',
  },
};

// Centralized mock data generator for integration tests
export const mockDataGenerator = {
  generateDailyBookingData: () => {
    // Generate realistic daily booking data for The Backroom Leeds
    return Array.from({ length: 50 }, (_, i) => ({
      id: `booking_${i + 1}`,
      venue: 'Backroom Leeds',
      date: new Date().toISOString(),
      tables: Math.floor(Math.random() * 2) + 1,
      event: ['LA FIESTA', 'SHHH!', 'NOSTALGIA'][Math.floor(Math.random() * 3)],
      revenue: Math.random() * 500 + 50, // £50-£550 range
    }));
  },

  generateWeeklyCustomerData: () => {
    // Generate weekly customer behavior data
    return Array.from({ length: 100 }, (_, i) => ({
      id: `customer_${i + 1}`,
      visits: Math.floor(Math.random() * 3),
      averageSpend: Math.random() * 300 + 100, // £100-£400 range
      preferredEvent: ['LA FIESTA', 'SHHH!', 'NOSTALGIA'][Math.floor(Math.random() * 3)],
    }));
  },
};

// Centralized service clients for integration testing
export const testServices = {
  createSupabaseClient: () => {
    return createClient(testConfig.supabase.url, testConfig.supabase.key, {
      auth: {
        persistSession: false,
      },
    });
  },

  createRedisClient: () => {
    return new Redis({
      host: testConfig.redis.host,
      port: testConfig.redis.port,
    });
  },

  createEmailClients: () => {
    return {
      resend: new Resend(testConfig.email.resendApiKey),
      sendgrid: createTransport({
        host: 'smtp.sendgrid.net',
        port: 587,
        auth: {
          user: 'apikey',
          pass: testConfig.email.sendgridApiKey,
        },
      }),
    };
  },

  createReportQueue: (name: string) => {
    return new Queue(name, {
      connection: {
        host: testConfig.redis.host,
        port: testConfig.redis.port,
      },
    });
  },

  createReportWorker: (name: string, processor: any) => {
    return new Worker(name, processor, {
      connection: {
        host: testConfig.redis.host,
        port: testConfig.redis.port,
      },
    });
  },
};

// Utility for simulating failure scenarios
export const testFailureSimulator = {
  simulateEmailServiceFailure: async (emailClient: any) => {
    // Mock email service failure
    jest.spyOn(emailClient, 'send').mockImplementation(() => {
      throw new Error('Email service temporarily unavailable');
    });
  },

  simulateDatabaseConnectionLoss: async (dbClient: any) => {
    // Mock database connection loss
    jest.spyOn(dbClient, 'query').mockImplementation(() => {
      throw new Error('Database connection lost');
    });
  },
};

// Performance and scalability test utilities
export const performanceTestUtils = {
  measureExecutionTime: async (fn: () => Promise<any>) => {
    const start = performance.now();
    await fn();
    const end = performance.now();
    return end - start;
  },

  generateLargeDataset: (size: number) => {
    return Array.from({ length: size }, (_, i) => ({
      id: `large_data_${i}`,
      randomValue: Math.random(),
    }));
  },
};