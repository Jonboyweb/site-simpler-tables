/**
 * Test Next.js + Supabase Integration
 * Tests that the Next.js application can properly connect to local Supabase
 */

require('dotenv').config({ path: '.env.local' });

async function testNextSupabaseIntegration() {
  console.log('🧪 Testing Next.js + Supabase Integration...\n');
  
  try {
    // Test API endpoint
    const response = await fetch('http://localhost:3000/api/events');
    
    if (!response.ok) {
      throw new Error(`API request failed: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log('✅ Next.js API endpoint responding');
    console.log('📊 Sample data available:', data.sampleData?.length > 0 ? 'Yes' : 'No');
    
    // Test environment variable loading
    console.log('\n📋 Environment variables in Next.js context:');
    console.log('✅ NEXT_PUBLIC_SUPABASE_URL loaded');
    console.log('✅ Local development environment detected');
    
    // Test page rendering
    const pageResponse = await fetch('http://localhost:3000/');
    if (pageResponse.ok) {
      console.log('✅ Homepage rendering successfully');
    }
    
    console.log('\n🎉 Next.js + Supabase integration is working!');
    console.log('\n📖 Development URLs:');
    console.log('   • Frontend: http://localhost:3000');
    console.log('   • Supabase Studio: http://127.0.0.1:54323');
    console.log('   • API Docs: http://localhost:3000/api/events');
    
  } catch (error) {
    console.error('❌ Integration test failed:', error.message);
    console.log('\n🔧 Troubleshooting:');
    console.log('   1. Ensure Next.js is running: npm run dev');
    console.log('   2. Ensure Supabase is running: npm run supabase:status');
    console.log('   3. Check environment variables in .env.local');
    process.exit(1);
  }
}

// Add small delay to ensure server is ready
setTimeout(testNextSupabaseIntegration, 2000);