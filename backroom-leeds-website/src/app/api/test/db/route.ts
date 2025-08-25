/**
 * Test Database Connection API Route
 * Tests actual Supabase client connectivity from Next.js
 */

import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Create Supabase client
    const supabase = await createClient();
    
    // Test 1: Basic connection test
    const connectionTest = await supabase
      .from('venue_tables')
      .select('count')
      .limit(1);
    
    if (connectionTest.error) {
      throw new Error(`Connection test failed: ${connectionTest.error.message}`);
    }
    
    // Test 2: Get venue tables
    const { data: tables, error: tablesError } = await supabase
      .from('venue_tables')
      .select('*')
      .limit(5);
    
    if (tablesError) {
      throw new Error(`Tables query failed: ${tablesError.message}`);
    }
    
    // Test 3: Test a database function
    const { data: stats, error: statsError } = await supabase
      .rpc('get_booking_stats', { 
        start_date: '2025-01-01', 
        end_date: '2025-12-31' 
      });
    
    if (statsError) {
      console.warn('Stats function test failed:', statsError.message);
    }
    
    // Test 4: Check available tables view
    const { data: availableTables, error: availableError } = await supabase
      .from('available_tables')
      .select('*')
      .limit(3);
    
    if (availableError) {
      console.warn('Available tables view test failed:', availableError.message);
    }
    
    return NextResponse.json({
      status: 'success',
      message: 'Database connection test passed',
      tests: {
        connection: {
          status: 'passed',
          description: 'Basic Supabase client connection'
        },
        tables: {
          status: 'passed',
          description: `Venue tables query returned ${tables?.length || 0} records`,
          data: tables
        },
        functions: {
          status: statsError ? 'warning' : 'passed',
          description: 'Database functions test',
          data: stats?.[0] || null,
          error: statsError?.message || null
        },
        views: {
          status: availableError ? 'warning' : 'passed',
          description: `Available tables view returned ${availableTables?.length || 0} records`,
          data: availableTables,
          error: availableError?.message || null
        }
      },
      environment: {
        supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
        nodeEnv: process.env.NODE_ENV,
        hasServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
        databaseUrl: process.env.DATABASE_URL?.split('@')[1] || 'Not set' // Hide credentials
      },
      timestamp: new Date().toISOString()
    }, {
      status: 200,
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
  } catch (error) {
    console.error('Database test error:', error);
    
    return NextResponse.json({
      status: 'error',
      message: 'Database connection test failed',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, {
      status: 500,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }
}