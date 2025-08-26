#!/usr/bin/env node
/**
 * Test Authentication Script
 * 
 * Verifies that the admin login is working with default credentials.
 * Run with: node scripts/test-auth.js
 */

const bcrypt = require('bcryptjs');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

// Supabase configuration
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://127.0.0.1:54321';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseServiceKey) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY is required in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function testAuthentication() {
  console.log('🔍 Testing admin authentication...\n');

  const testEmail = process.env.DEFAULT_ADMIN_EMAIL || 'admin@backroomleeds.co.uk';
  const testPassword = process.env.DEFAULT_ADMIN_PASSWORD || 'change-me-in-production';

  try {
    // Get admin user from database
    const { data: staff, error } = await supabase
      .from('admin_users')
      .select('*')
      .eq('email', testEmail.toLowerCase())
      .eq('is_active', true)
      .single();

    if (error || !staff) {
      console.error('❌ Admin user not found in database');
      console.log('Expected email:', testEmail.toLowerCase());
      console.log('Error:', error);
      return;
    }

    console.log('✅ Admin user found in database');
    console.log('   Email:', staff.email);
    console.log('   Role:', staff.role);
    console.log('   Active:', staff.is_active);
    console.log('   2FA Enabled:', staff.totp_enabled);

    // Test password verification
    const isValidPassword = await bcrypt.compare(testPassword, staff.password_hash);

    if (isValidPassword) {
      console.log('✅ Password verification successful');
      console.log('\n🎉 Authentication test PASSED');
      console.log('\n📋 Login Details:');
      console.log('   URL: http://localhost:3000/admin/login');
      console.log('   Email:', testEmail);
      console.log('   Password:', testPassword);
      console.log('   2FA Required: No');
    } else {
      console.error('❌ Password verification failed');
      console.log('Expected password:', testPassword);
      console.log('Stored hash:', staff.password_hash);
    }

  } catch (error) {
    console.error('❌ Authentication test failed:', error.message);
  }
}

async function testDatabaseConnection() {
  console.log('🔍 Testing database connection...\n');

  try {
    const { data, error } = await supabase
      .from('admin_users')
      .select('count')
      .single();

    if (error) {
      console.error('❌ Database connection failed:', error.message);
      return false;
    }

    console.log('✅ Database connection successful');
    
    const { count } = await supabase
      .from('admin_users')
      .select('*', { count: 'exact', head: true });
    
    console.log('   Total admin users:', count);
    return true;

  } catch (error) {
    console.error('❌ Database test failed:', error.message);
    return false;
  }
}

async function main() {
  console.log('🧪 Admin Authentication Test Suite');
  console.log('==================================\n');

  const dbConnected = await testDatabaseConnection();
  if (!dbConnected) {
    process.exit(1);
  }

  await testAuthentication();
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = {
  testAuthentication,
  testDatabaseConnection,
};