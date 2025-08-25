/**
 * Environment validation utilities
 * Ensures all required environment variables are present and valid
 */

// Required environment variables for different features
const REQUIRED_SUPABASE_VARS = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY'
] as const;

const REQUIRED_STRIPE_VARS = [
  'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY',
  'STRIPE_SECRET_KEY',
  'STRIPE_WEBHOOK_SECRET'
] as const;

const REQUIRED_APP_VARS = [
  'NEXT_PUBLIC_APP_URL',
  'NODE_ENV'
] as const;

const OPTIONAL_EMAIL_VARS = [
  'SENDGRID_API_KEY',
  'SENDGRID_FROM_EMAIL',
  'SENDGRID_FROM_NAME'
] as const;

type EnvironmentConfig = {
  supabase: boolean;
  stripe: boolean;
  app: boolean;
  email: boolean;
};

interface ValidationResult {
  valid: boolean;
  config: EnvironmentConfig;
  missing: string[];
  warnings: string[];
  errors: string[];
}

/**
 * Validate Stripe environment variables
 */
export function validateStripeConfig(): { valid: boolean; errors: string[]; warnings: string[] } {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check required variables
  for (const varName of REQUIRED_STRIPE_VARS) {
    const value = process.env[varName];
    
    if (!value) {
      errors.push(`Missing required environment variable: ${varName}`);
      continue;
    }

    // Validate Stripe key formats
    switch (varName) {
      case 'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY':
        if (!value.startsWith('pk_')) {
          errors.push(`Invalid format for ${varName}: must start with 'pk_'`);
        }
        if (value.includes('pk_test_') && process.env.NODE_ENV === 'production') {
          warnings.push(`Using test publishable key in production environment`);
        }
        if (value.includes('pk_live_') && process.env.NODE_ENV === 'development') {
          warnings.push(`Using live publishable key in development environment`);
        }
        break;

      case 'STRIPE_SECRET_KEY':
        if (!value.startsWith('sk_')) {
          errors.push(`Invalid format for ${varName}: must start with 'sk_'`);
        }
        if (value.includes('sk_test_') && process.env.NODE_ENV === 'production') {
          warnings.push(`Using test secret key in production environment`);
        }
        if (value.includes('sk_live_') && process.env.NODE_ENV === 'development') {
          warnings.push(`Using live secret key in development environment`);
        }
        // Security check: ensure key is not logged
        if (value.length < 20) {
          errors.push(`${varName} appears to be invalid (too short)`);
        }
        break;

      case 'STRIPE_WEBHOOK_SECRET':
        if (!value.startsWith('whsec_')) {
          errors.push(`Invalid format for ${varName}: must start with 'whsec_'`);
        }
        if (value.length < 20) {
          errors.push(`${varName} appears to be invalid (too short)`);
        }
        break;
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Validate Supabase environment variables
 */
export function validateSupabaseConfig(): { valid: boolean; errors: string[]; warnings: string[] } {
  const errors: string[] = [];
  const warnings: string[] = [];

  for (const varName of REQUIRED_SUPABASE_VARS) {
    const value = process.env[varName];
    
    if (!value) {
      errors.push(`Missing required environment variable: ${varName}`);
      continue;
    }

    // Validate Supabase URL format
    if (varName === 'NEXT_PUBLIC_SUPABASE_URL') {
      try {
        const url = new URL(value);
        if (!url.hostname.includes('supabase') && !url.hostname.includes('localhost') && !url.hostname.includes('127.0.0.1')) {
          warnings.push(`Supabase URL format may be incorrect: ${url.hostname}`);
        }
      } catch {
        errors.push(`Invalid URL format for ${varName}`);
      }
    }

    // Validate JWT format for keys
    if (varName.includes('KEY') && !value.includes('.')) {
      warnings.push(`${varName} may not be a valid JWT format`);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Validate application environment variables
 */
export function validateAppConfig(): { valid: boolean; errors: string[]; warnings: string[] } {
  const errors: string[] = [];
  const warnings: string[] = [];

  for (const varName of REQUIRED_APP_VARS) {
    const value = process.env[varName];
    
    if (!value) {
      errors.push(`Missing required environment variable: ${varName}`);
      continue;
    }

    if (varName === 'NEXT_PUBLIC_APP_URL') {
      try {
        new URL(value);
      } catch {
        errors.push(`Invalid URL format for ${varName}`);
      }
    }

    if (varName === 'NODE_ENV') {
      const validEnvs = ['development', 'production', 'test'];
      if (!validEnvs.includes(value)) {
        errors.push(`Invalid NODE_ENV value: ${value}. Must be one of: ${validEnvs.join(', ')}`);
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Validate email configuration (optional)
 */
export function validateEmailConfig(): { valid: boolean; errors: string[]; warnings: string[] } {
  const errors: string[] = [];
  const warnings: string[] = [];

  const hasAnyEmailVar = OPTIONAL_EMAIL_VARS.some(varName => process.env[varName]);
  
  if (hasAnyEmailVar) {
    for (const varName of OPTIONAL_EMAIL_VARS) {
      const value = process.env[varName];
      
      if (!value) {
        errors.push(`Missing required email environment variable: ${varName} (required when email is configured)`);
        continue;
      }

      if (varName === 'SENDGRID_FROM_EMAIL') {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value)) {
          errors.push(`Invalid email format for ${varName}`);
        }
      }
    }
  } else {
    warnings.push('Email configuration not found - email notifications will not work');
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Comprehensive environment validation
 */
export function validateEnvironment(): ValidationResult {
  const supabaseResult = validateSupabaseConfig();
  const stripeResult = validateStripeConfig();
  const appResult = validateAppConfig();
  const emailResult = validateEmailConfig();

  const allErrors = [
    ...supabaseResult.errors,
    ...stripeResult.errors,
    ...appResult.errors,
    ...emailResult.errors
  ];

  const allWarnings = [
    ...supabaseResult.warnings,
    ...stripeResult.warnings,
    ...appResult.warnings,
    ...emailResult.warnings
  ];

  const config: EnvironmentConfig = {
    supabase: supabaseResult.valid,
    stripe: stripeResult.valid,
    app: appResult.valid,
    email: emailResult.valid
  };

  // Collect missing variables
  const missing: string[] = [];
  
  [...REQUIRED_SUPABASE_VARS, ...REQUIRED_STRIPE_VARS, ...REQUIRED_APP_VARS].forEach(varName => {
    if (!process.env[varName]) {
      missing.push(varName);
    }
  });

  return {
    valid: allErrors.length === 0,
    config,
    missing,
    warnings: allWarnings,
    errors: allErrors
  };
}

/**
 * Runtime environment validation middleware
 * Call this in API routes or critical functions to ensure environment is valid
 */
export function requireValidEnvironment(features: (keyof EnvironmentConfig)[] = ['app']) {
  const validation = validateEnvironment();
  
  const requiredFeaturesValid = features.every(feature => validation.config[feature]);
  
  if (!requiredFeaturesValid || validation.errors.length > 0) {
    const missingFeatures = features.filter(feature => !validation.config[feature]);
    
    throw new Error(
      `Environment validation failed. ` +
      `Missing or invalid configuration for: ${missingFeatures.join(', ')}. ` +
      `Errors: ${validation.errors.join('; ')}`
    );
  }

  return validation;
}

/**
 * Safe environment getter with validation
 */
export function getEnvironmentVariable(varName: string, required = true): string {
  const value = process.env[varName];
  
  if (!value && required) {
    throw new Error(`Required environment variable ${varName} is not set`);
  }
  
  return value || '';
}

/**
 * Development helper to log environment status
 */
export function logEnvironmentStatus() {
  if (process.env.NODE_ENV === 'development' && process.env.NEXT_PUBLIC_ENABLE_DEBUG === 'true') {
    const validation = validateEnvironment();
    
    console.log('🔧 Environment Configuration Status:');
    console.log('  Supabase:', validation.config.supabase ? '✅' : '❌');
    console.log('  Stripe:', validation.config.stripe ? '✅' : '❌');
    console.log('  App:', validation.config.app ? '✅' : '❌');
    console.log('  Email:', validation.config.email ? '✅' : '⚠️ Optional');
    
    if (validation.warnings.length > 0) {
      console.warn('⚠️ Environment warnings:');
      validation.warnings.forEach(warning => console.warn(`  - ${warning}`));
    }
    
    if (validation.errors.length > 0) {
      console.error('❌ Environment errors:');
      validation.errors.forEach(error => console.error(`  - ${error}`));
    }
  }
}

/**
 * Production security check
 * Ensures no development/test keys are used in production
 */
export function validateProductionSecurity(): { secure: boolean; issues: string[] } {
  const issues: string[] = [];
  
  if (process.env.NODE_ENV === 'production') {
    // Check for test keys in production
    if (process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY?.includes('pk_test_')) {
      issues.push('Using Stripe test publishable key in production');
    }
    
    if (process.env.STRIPE_SECRET_KEY?.includes('sk_test_')) {
      issues.push('Using Stripe test secret key in production');
    }
    
    // Check for debug flags in production
    if (process.env.NEXT_PUBLIC_ENABLE_DEBUG === 'true') {
      issues.push('Debug mode enabled in production');
    }
    
    if (process.env.NEXT_PUBLIC_ENABLE_MOCK_PAYMENTS === 'true') {
      issues.push('Mock payments enabled in production');
    }
    
    // Check for localhost URLs
    if (process.env.NEXT_PUBLIC_APP_URL?.includes('localhost')) {
      issues.push('Using localhost URL in production');
    }
  }
  
  return {
    secure: issues.length === 0,
    issues
  };
}