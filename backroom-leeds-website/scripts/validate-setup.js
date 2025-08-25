#!/usr/bin/env node
/**
 * Environment Setup Validation Script
 * 
 * This script validates that the local development environment
 * is properly configured and all services are operational.
 */

require('dotenv').config({ path: '.env.local' });

async function validateSetup() {
  console.log('🔍 Validating Backroom Leeds Development Environment Setup...\n');
  
  let allTestsPassed = true;
  const results = [];

  // Test 1: Environment Variables
  console.log('1️⃣ Testing Environment Variables...');
  const requiredEnvVars = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY', 
    'SUPABASE_SERVICE_ROLE_KEY',
    'DATABASE_URL',
    'JWT_SECRET'
  ];
  
  let envTestPassed = true;
  for (const envVar of requiredEnvVars) {
    if (process.env[envVar]) {
      console.log(`   ✅ ${envVar}: Set`);
    } else {
      console.log(`   ❌ ${envVar}: Missing`);
      envTestPassed = false;
      allTestsPassed = false;
    }
  }
  results.push({ test: 'Environment Variables', passed: envTestPassed });

  // Test 2: Supabase Services
  console.log('\n2️⃣ Testing Supabase Services...');
  try {
    const supabaseResponse = await fetch(process.env.NEXT_PUBLIC_SUPABASE_URL + '/rest/v1/', {
      headers: {
        'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`
      }
    });
    
    if (supabaseResponse.ok) {
      console.log('   ✅ Supabase API: Responding');
    } else {
      throw new Error(`API returned ${supabaseResponse.status}`);
    }
    results.push({ test: 'Supabase API', passed: true });
  } catch (error) {
    console.log(`   ❌ Supabase API: Failed (${error.message})`);
    results.push({ test: 'Supabase API', passed: false });
    allTestsPassed = false;
  }

  // Test 3: Next.js Development Server
  console.log('\n3️⃣ Testing Next.js Development Server...');
  try {
    const nextResponse = await fetch('http://localhost:3000/api/events');
    if (nextResponse.ok) {
      console.log('   ✅ Next.js Dev Server: Running');
      console.log('   ✅ API Routes: Responding');
    } else {
      throw new Error(`Server returned ${nextResponse.status}`);
    }
    results.push({ test: 'Next.js Server', passed: true });
  } catch (error) {
    console.log(`   ❌ Next.js Dev Server: Not running (${error.message})`);
    console.log('   💡 Start with: npm run dev');
    results.push({ test: 'Next.js Server', passed: false });
    allTestsPassed = false;
  }

  // Test 4: Database Connection
  console.log('\n4️⃣ Testing Database Connection...');
  try {
    const dbResponse = await fetch('http://localhost:3000/api/test/db');
    if (dbResponse.ok) {
      const dbData = await dbResponse.json();
      if (dbData.status === 'success') {
        console.log('   ✅ Database Connection: Working');
        console.log('   ✅ Table Queries: Working');
        console.log('   ✅ Database Functions: Working');
        console.log('   ✅ Database Views: Working');
      } else {
        throw new Error(dbData.error || 'Database test failed');
      }
    } else {
      throw new Error(`Database test endpoint returned ${dbResponse.status}`);
    }
    results.push({ test: 'Database Connection', passed: true });
  } catch (error) {
    console.log(`   ❌ Database Connection: Failed (${error.message})`);
    results.push({ test: 'Database Connection', passed: false });
    allTestsPassed = false;
  }

  // Test 5: TypeScript Types
  console.log('\n5️⃣ Testing TypeScript Configuration...');
  try {
    const fs = require('fs');
    const path = require('path');
    
    const typesPath = path.join(__dirname, '../src/types/database.types.ts');
    if (fs.existsSync(typesPath)) {
      const typesContent = fs.readFileSync(typesPath, 'utf8');
      if (typesContent.includes('Database') && typesContent.includes('Tables')) {
        console.log('   ✅ Database Types: Generated');
        console.log('   ✅ Type Definitions: Valid');
      } else {
        throw new Error('Types file exists but appears invalid');
      }
    } else {
      throw new Error('Types file not found');
    }
    results.push({ test: 'TypeScript Types', passed: true });
  } catch (error) {
    console.log(`   ❌ TypeScript Types: ${error.message}`);
    console.log('   💡 Generate with: npm run supabase:generate-types');
    results.push({ test: 'TypeScript Types', passed: false });
    allTestsPassed = false;
  }

  // Summary
  console.log('\n📊 VALIDATION SUMMARY');
  console.log('═══════════════════');
  
  results.forEach(result => {
    const status = result.passed ? '✅' : '❌';
    console.log(`${status} ${result.test}`);
  });
  
  if (allTestsPassed) {
    console.log('\n🎉 SUCCESS: Your development environment is ready!');
    console.log('\n🚀 Next Steps:');
    console.log('   • Visit http://localhost:3000 for the frontend');
    console.log('   • Visit http://127.0.0.1:54323 for Supabase Studio');  
    console.log('   • Run tests with: npm run test:all');
    console.log('   • View documentation in: docs/technical/local-development-setup.md');
    process.exit(0);
  } else {
    console.log('\n❌ ISSUES DETECTED: Some tests failed');
    console.log('\n🔧 Troubleshooting:');
    console.log('   1. Ensure Supabase is running: npm run supabase:start');
    console.log('   2. Ensure Next.js is running: npm run dev');  
    console.log('   3. Check environment variables in .env.local');
    console.log('   4. Generate types: npm run supabase:generate-types');
    console.log('   5. See docs/technical/local-development-setup.md for help');
    process.exit(1);
  }
}

// Add delay to ensure services are ready if just started
console.log('⏳ Waiting for services to be ready...\n');
setTimeout(validateSetup, 3000);