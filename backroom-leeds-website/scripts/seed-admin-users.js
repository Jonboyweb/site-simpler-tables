#!/usr/bin/env node
/**
 * Seed Admin Users Script
 * 
 * Creates default admin users for development and testing.
 * Run with: node scripts/seed-admin-users.js
 */

const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcryptjs');
const speakeasy = require('speakeasy');
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

// Default admin users for development - using environment variables
const defaultUsers = [
  {
    email: process.env.DEFAULT_ADMIN_EMAIL || 'admin@backroomleeds.co.uk',
    password: process.env.DEFAULT_ADMIN_PASSWORD || 'change-me-in-production',
    role: 'super_admin',
    enable2FA: false,
  },
  {
    email: 'manager@backroomleeds.co.uk',
    password: 'Manager123!BRL2024',
    role: 'manager',
    enable2FA: false,
  },
  {
    email: 'door@backroomleeds.co.uk',
    password: 'Door123!BRL2024',
    role: 'door_staff',
    enable2FA: false,
  },
  {
    email: 'admin2fa@backroomleeds.co.uk',
    password: 'Admin2FA123!BRL2024',
    role: 'super_admin',
    enable2FA: true,
  },
];

async function hashPassword(password) {
  const saltRounds = 12;
  return await bcrypt.hash(password, saltRounds);
}

async function generateTOTPSecret(email) {
  const secret = speakeasy.generateSecret({
    name: email,
    issuer: process.env.TOTP_ISSUER || 'The Backroom Leeds',
    length: 32,
  });
  return secret.base32;
}

async function createAdminUser(userData) {
  try {
    const { email, password, role, enable2FA } = userData;

    // Check if user already exists
    const { data: existingUser } = await supabase
      .from('admin_users')
      .select('id, email')
      .eq('email', email.toLowerCase())
      .single();

    if (existingUser) {
      console.log(`⚠️  User ${email} already exists, skipping...`);
      return existingUser;
    }

    // Hash password
    const passwordHash = await hashPassword(password);

    // Generate 2FA secret if requested
    let totpSecret = null;
    if (enable2FA) {
      totpSecret = await generateTOTPSecret(email);
    }

    // Insert user
    const { data: newUser, error } = await supabase
      .from('admin_users')
      .insert({
        email: email.toLowerCase(),
        password_hash: passwordHash,
        role,
        totp_enabled: enable2FA,
        totp_secret: totpSecret,
        is_active: true,
        failed_login_attempts: 0,
      })
      .select('id, email, role, totp_enabled')
      .single();

    if (error) {
      throw new Error(`Failed to create user ${email}: ${error.message}`);
    }

    console.log(`✅ Created ${role} user: ${email}`);

    if (enable2FA && totpSecret) {
      const qrUrl = speakeasy.otpauthURL({
        secret: totpSecret,
        label: email,
        issuer: process.env.TOTP_ISSUER || 'The Backroom Leeds',
      });
      
      console.log(`   🔐 2FA Secret: ${totpSecret}`);
      console.log(`   📱 QR Code URL: ${qrUrl}`);
    }

    return newUser;
  } catch (error) {
    console.error(`❌ Error creating user ${userData.email}:`, error.message);
    return null;
  }
}

async function seedAdminUsers() {
  console.log('🌱 Seeding admin users for development...\n');

  try {
    // Test database connection
    const { error: connectionError } = await supabase
      .from('admin_users')
      .select('count')
      .single();

    if (connectionError) {
      throw new Error(`Database connection failed: ${connectionError.message}`);
    }

    const results = [];

    // Create all default users
    for (const userData of defaultUsers) {
      const user = await createAdminUser(userData);
      if (user) {
        results.push(user);
      }
    }

    console.log(`\n🎉 Successfully created ${results.length} admin users`);

    // Display login credentials
    console.log('\n📋 Login Credentials for Development:');
    console.log('=====================================');
    
    defaultUsers.forEach(user => {
      console.log(`\n${user.role.replace('_', ' ').toUpperCase()}:`);
      console.log(`  Email: ${user.email}`);
      console.log(`  Password: ${user.password}`);
      console.log(`  2FA: ${user.enable2FA ? 'Enabled' : 'Disabled'}`);
    });

    console.log('\n⚠️  IMPORTANT: Change these passwords in production!');
    console.log('💻 Access admin panel at: http://localhost:3000/admin/login');

  } catch (error) {
    console.error('❌ Seeding failed:', error.message);
    process.exit(1);
  }
}

async function cleanupUsers() {
  console.log('🧹 Cleaning up existing development users...\n');

  try {
    const emails = defaultUsers.map(user => user.email.toLowerCase());
    
    const { error } = await supabase
      .from('admin_users')
      .delete()
      .in('email', emails);

    if (error && error.code !== 'PGRST116') { // Ignore "no rows" error
      throw new Error(`Failed to cleanup users: ${error.message}`);
    }

    console.log('✅ Cleanup completed\n');
  } catch (error) {
    console.error('❌ Cleanup failed:', error.message);
    process.exit(1);
  }
}

// Command line interface
async function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  switch (command) {
    case 'cleanup':
      await cleanupUsers();
      break;
    case 'seed':
    case undefined:
      await seedAdminUsers();
      break;
    case 'reset':
      await cleanupUsers();
      await seedAdminUsers();
      break;
    default:
      console.log('Usage: node scripts/seed-admin-users.js [seed|cleanup|reset]');
      console.log('  seed    - Create default admin users (default)');
      console.log('  cleanup - Remove existing development users');
      console.log('  reset   - Cleanup then seed');
      process.exit(1);
  }
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = {
  seedAdminUsers,
  cleanupUsers,
  createAdminUser,
};