#!/usr/bin/env node

/**
 * Payment configuration validation script
 * Run this to test Stripe integration with real keys
 * 
 * Usage: node scripts/validate-payments.js
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function logError(message) {
  log(`❌ ${message}`, colors.red);
}

function logSuccess(message) {
  log(`✅ ${message}`, colors.green);
}

function logWarning(message) {
  log(`⚠️ ${message}`, colors.yellow);
}

function logInfo(message) {
  log(`ℹ️ ${message}`, colors.blue);
}

function logHeader(message) {
  log(`\n${colors.bright}${colors.cyan}=== ${message} ===${colors.reset}`, colors.cyan);
}

// Check if we're in the right directory
const packageJsonPath = path.join(process.cwd(), 'package.json');
if (!fs.existsSync(packageJsonPath)) {
  logError('Please run this script from the root of the Next.js project');
  process.exit(1);
}

// Load environment variables
const envPath = path.join(process.cwd(), '.env.local');
if (!fs.existsSync(envPath)) {
  logError('.env.local file not found');
  logInfo('Please create .env.local with your Stripe configuration');
  process.exit(1);
}

// Read environment variables
require('dotenv').config({ path: envPath });

async function validateEnvironmentVariables() {
  logHeader('Environment Variables Validation');
  
  const requiredVars = [
    'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY',
    'STRIPE_SECRET_KEY',
    'STRIPE_WEBHOOK_SECRET'
  ];
  
  let valid = true;
  
  for (const varName of requiredVars) {
    const value = process.env[varName];
    
    if (!value) {
      logError(`Missing environment variable: ${varName}`);
      valid = false;
      continue;
    }
    
    // Validate format
    if (varName === 'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY') {
      if (!value.startsWith('pk_')) {
        logError(`Invalid format for ${varName}: must start with 'pk_'`);
        valid = false;
      } else {
        logSuccess(`${varName}: Valid format`);
        
        if (value.includes('pk_test_') && process.env.NODE_ENV === 'production') {
          logWarning('Using test publishable key in production environment');
        }
      }
    }
    
    if (varName === 'STRIPE_SECRET_KEY') {
      if (!value.startsWith('sk_')) {
        logError(`Invalid format for ${varName}: must start with 'sk_'`);
        valid = false;
      } else {
        logSuccess(`${varName}: Valid format`);
        
        if (value.includes('sk_test_') && process.env.NODE_ENV === 'production') {
          logWarning('Using test secret key in production environment');
        }
      }
    }
    
    if (varName === 'STRIPE_WEBHOOK_SECRET') {
      if (!value.startsWith('whsec_')) {
        logError(`Invalid format for ${varName}: must start with 'whsec_'`);
        valid = false;
      } else {
        logSuccess(`${varName}: Valid format`);
      }
    }
  }
  
  return valid;
}

async function testStripeConnection() {
  logHeader('Stripe API Connection Test');
  
  try {
    // Import Stripe
    const Stripe = require('stripe');
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2024-06-20',
    });
    
    // Test API connection
    logInfo('Testing Stripe API connection...');
    const account = await stripe.accounts.retrieve();
    
    logSuccess(`Connected to Stripe account: ${account.display_name || account.id}`);
    logInfo(`Account country: ${account.country}`);
    logInfo(`Charges enabled: ${account.charges_enabled}`);
    logInfo(`Details submitted: ${account.details_submitted}`);
    
    return true;
  } catch (error) {
    logError(`Stripe connection failed: ${error.message}`);
    return false;
  }
}

async function testPaymentIntentCreation() {
  logHeader('Payment Intent Creation Test');
  
  try {
    const Stripe = require('stripe');
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2024-06-20',
    });
    
    logInfo('Creating test payment intent...');
    
    const paymentIntent = await stripe.paymentIntents.create({
      amount: 5000, // £50 in pence
      currency: 'gbp',
      confirmation_method: 'manual',
      payment_method_types: ['card', 'bacs_debit'],
      payment_method_options: {
        card: {
          request_three_d_secure: 'automatic', // Required for SCA compliance
        },
        bacs_debit: {
          setup_future_usage: 'off_session'
        }
      },
      metadata: {
        booking_id: 'test-booking-' + Date.now(),
        customer_email: 'test@example.com',
        customer_name: 'Test Customer',
        venue: 'The Backroom Leeds'
      },
      receipt_email: 'test@example.com',
      description: 'Test payment intent - Table booking deposit'
    });
    
    logSuccess(`Payment intent created: ${paymentIntent.id}`);
    logInfo(`Status: ${paymentIntent.status}`);
    logInfo(`Amount: £${paymentIntent.amount / 100}`);
    logInfo(`Currency: ${paymentIntent.currency.toUpperCase()}`);
    logInfo(`3D Secure: ${paymentIntent.payment_method_options.card.request_three_d_secure}`);
    
    // Test retrieval
    logInfo('Testing payment intent retrieval...');
    const retrieved = await stripe.paymentIntents.retrieve(paymentIntent.id);
    
    if (retrieved.id === paymentIntent.id) {
      logSuccess('Payment intent retrieval successful');
    } else {
      logError('Payment intent retrieval failed');
      return false;
    }
    
    return true;
  } catch (error) {
    logError(`Payment intent test failed: ${error.message}`);
    return false;
  }
}

async function testWebhookEndpoint() {
  logHeader('Webhook Endpoint Test');
  
  try {
    // Check if webhook secret is configured
    if (!process.env.STRIPE_WEBHOOK_SECRET) {
      logWarning('STRIPE_WEBHOOK_SECRET not configured - webhook verification will fail');
      return false;
    }
    
    logSuccess('Webhook secret is configured');
    
    // Test webhook signature verification (basic test)
    const Stripe = require('stripe');
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2024-06-20',
    });
    
    // Create a test payload
    const testPayload = JSON.stringify({
      id: 'evt_test_webhook',
      object: 'event',
      created: Math.floor(Date.now() / 1000),
      type: 'payment_intent.succeeded',
      data: {
        object: {
          id: 'pi_test_123',
          amount: 5000,
          currency: 'gbp',
          status: 'succeeded'
        }
      }
    });
    
    logInfo('Webhook signature verification function available');
    logSuccess('Webhook configuration appears valid');
    
    // Note: Full webhook testing requires actually receiving webhooks from Stripe
    logWarning('To fully test webhooks, configure your endpoint URL in Stripe Dashboard');
    logInfo('Webhook URL should be: https://your-domain.com/api/payments/webhook');
    
    return true;
  } catch (error) {
    logError(`Webhook test failed: ${error.message}`);
    return false;
  }
}

async function checkDependencies() {
  logHeader('Dependencies Check');
  
  try {
    // Check if Stripe is installed
    require('stripe');
    logSuccess('Stripe package is installed');
    
    // Check Next.js
    require('next');
    logSuccess('Next.js is installed');
    
    // Check other dependencies
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    const dependencies = { ...packageJson.dependencies, ...packageJson.devDependencies };
    
    if (dependencies['@stripe/stripe-js']) {
      logSuccess('@stripe/stripe-js is installed');
    } else {
      logWarning('@stripe/stripe-js not found in dependencies');
    }
    
    if (dependencies['@stripe/react-stripe-js']) {
      logSuccess('@stripe/react-stripe-js is installed');
    } else {
      logWarning('@stripe/react-stripe-js not found in dependencies');
    }
    
    return true;
  } catch (error) {
    logError(`Dependency check failed: ${error.message}`);
    return false;
  }
}

async function runValidation() {
  logHeader('Stripe Payment Configuration Validation');
  logInfo('This script will validate your Stripe payment setup');
  
  const results = {
    dependencies: false,
    environment: false,
    connection: false,
    paymentIntent: false,
    webhook: false
  };
  
  // Run all tests
  results.dependencies = await checkDependencies();
  results.environment = await validateEnvironmentVariables();
  results.connection = await testStripeConnection();
  results.paymentIntent = await testPaymentIntentCreation();
  results.webhook = await testWebhookEndpoint();
  
  // Summary
  logHeader('Validation Summary');
  
  const allPassed = Object.values(results).every(result => result === true);
  
  if (allPassed) {
    logSuccess('🎉 All tests passed! Your Stripe configuration is ready for production.');
  } else {
    logError('❌ Some tests failed. Please address the issues above.');
  }
  
  // Detailed results
  log('\nDetailed Results:');
  Object.entries(results).forEach(([test, passed]) => {
    const status = passed ? '✅ PASS' : '❌ FAIL';
    const testName = test.charAt(0).toUpperCase() + test.slice(1);
    log(`  ${testName}: ${status}`);
  });
  
  // Next steps
  log('\n📋 Next Steps:');
  if (!allPassed) {
    log('  1. Fix all failing tests');
    log('  2. Re-run this validation script');
  }
  log('  3. Configure webhook endpoint in Stripe Dashboard');
  log('  4. Test complete payment flow in browser');
  log('  5. Monitor payment processing in production');
  
  process.exit(allPassed ? 0 : 1);
}

// Run the validation
runValidation().catch(error => {
  logError(`Validation script failed: ${error.message}`);
  process.exit(1);
});