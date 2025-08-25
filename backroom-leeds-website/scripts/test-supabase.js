#!/usr/bin/env node

/**
 * Simple Supabase connection test script
 * This script validates that environment variables are set correctly
 * and that the Supabase connection can be established
 */

const { createClient } = require('@supabase/supabase-js')
const dotenv = require('dotenv')

// Load environment variables
dotenv.config({ path: '.env.local' })

async function testSupabaseConnection() {
  console.log('🔍 Testing Supabase Connection...\n')

  // Check environment variables
  const requiredEnvVars = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_ROLE_KEY'
  ]

  console.log('📋 Checking environment variables:')
  for (const envVar of requiredEnvVars) {
    const value = process.env[envVar]
    if (value) {
      console.log(`✅ ${envVar}: ${value.substring(0, 20)}...`)
    } else {
      console.log(`❌ ${envVar}: Not set`)
      process.exit(1)
    }
  }

  // Test basic connection
  try {
    console.log('\n🔗 Testing basic Supabase connection...')
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    )

    // Test connection by checking if we can query the database
    const { data, error } = await supabase
      .from('venue_tables')
      .select('*', { count: 'exact' })
      .limit(1)

    if (error) {
      console.log(`❌ Database connection failed: ${error.message}`)
      process.exit(1)
    }

    console.log('✅ Database connection successful!')
    console.log(`📊 Found ${data?.length || 0} venue tables`)

    // Test authentication
    console.log('\n🔐 Testing authentication...')
    const { data: { session } } = await supabase.auth.getSession()
    console.log(`🔒 Current session: ${session ? 'Active' : 'None (expected for CLI test)'}`)

    console.log('\n🎉 Supabase setup is working correctly!')

  } catch (err) {
    console.log(`❌ Connection test failed: ${err.message}`)
    process.exit(1)
  }
}

// Only run if this script is executed directly
if (require.main === module) {
  testSupabaseConnection().catch(console.error)
}