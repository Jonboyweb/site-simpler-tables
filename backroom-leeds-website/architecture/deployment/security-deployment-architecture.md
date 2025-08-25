# Security & Deployment Architecture

**Version**: 1.0  
**Date**: August 2025  
**Infrastructure**: Vercel, Supabase, Edge Network

## Executive Summary

This document defines the comprehensive security architecture and deployment strategy for The Backroom Leeds, implementing defense-in-depth security, zero-trust networking, and automated CI/CD pipelines with multi-region failover capabilities.

## Security Architecture

### Defense in Depth Strategy

```mermaid
graph TB
    subgraph "Layer 1: Edge Security"
        WAF[Web Application Firewall]
        DDOS[DDoS Protection]
        GEO[Geo-blocking]
        RATE[Rate Limiting]
    end
    
    subgraph "Layer 2: Network Security"
        TLS[TLS 1.3 Encryption]
        CERT[Certificate Pinning]
        VPN[VPN Tunnels]
        SEG[Network Segmentation]
    end
    
    subgraph "Layer 3: Application Security"
        AUTH[Authentication]
        AUTHZ[Authorization]
        CSRF[CSRF Protection]
        XSS[XSS Prevention]
    end
    
    subgraph "Layer 4: Data Security"
        ENCRYPT[Encryption at Rest]
        RLS[Row Level Security]
        MASK[Data Masking]
        AUDIT[Audit Logging]
    end
    
    subgraph "Layer 5: Infrastructure Security"
        SECRETS[Secrets Management]
        PATCH[Patch Management]
        MONITOR[Security Monitoring]
        INCIDENT[Incident Response]
    end
    
    WAF --> TLS
    TLS --> AUTH
    AUTH --> ENCRYPT
    ENCRYPT --> SECRETS
```

### 1. Authentication & Authorization Architecture

```typescript
// Multi-Factor Authentication System
import { authenticator } from 'otplib';
import { SignJWT, jwtVerify } from 'jose';
import bcrypt from 'bcrypt';

export class AuthenticationService {
  private readonly jwtSecret: Uint8Array;
  private readonly refreshTokenSecret: Uint8Array;
  private readonly sessionStore: SessionStore;
  private readonly rateLimiter: RateLimiter;
  
  constructor() {
    this.jwtSecret = new TextEncoder().encode(process.env.JWT_SECRET!);
    this.refreshTokenSecret = new TextEncoder().encode(process.env.REFRESH_SECRET!);
    this.sessionStore = new RedisSessionStore();
    this.rateLimiter = new RateLimiter({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 5 // 5 attempts per window
    });
  }
  
  async authenticate(
    credentials: LoginCredentials,
    request: Request
  ): Promise<AuthenticationResult> {
    // Rate limiting check
    const rateLimitResult = await this.rateLimiter.check(
      credentials.email,
      request.ip
    );
    
    if (!rateLimitResult.allowed) {
      throw new AuthenticationError('Too many login attempts', {
        retryAfter: rateLimitResult.retryAfter
      });
    }
    
    // Verify credentials
    const user = await this.verifyCredentials(credentials);
    
    // Check if 2FA is required
    if (this.requires2FA(user)) {
      return {
        requiresTwoFactor: true,
        tempToken: await this.generateTempToken(user),
        methods: user.twoFactorMethods
      };
    }
    
    // Generate session
    return await this.createSession(user, request);
  }
  
  async verify2FA(
    tempToken: string,
    code: string,
    method: '2fa_totp' | '2fa_sms' | '2fa_backup'
  ): Promise<AuthenticationResult> {
    // Verify temp token
    const payload = await this.verifyTempToken(tempToken);
    const user = await this.getUser(payload.userId);
    
    // Verify 2FA code based on method
    let isValid = false;
    
    switch (method) {
      case '2fa_totp':
        isValid = this.verifyTOTP(user, code);
        break;
      
      case '2fa_sms':
        isValid = await this.verifySMSCode(user, code);
        break;
      
      case '2fa_backup':
        isValid = await this.verifyBackupCode(user, code);
        break;
    }
    
    if (!isValid) {
      await this.recordFailedAttempt(user.id, method);
      throw new AuthenticationError('Invalid 2FA code');
    }
    
    // Create authenticated session
    return await this.createSession(user);
  }
  
  private verifyTOTP(user: User, code: string): boolean {
    // Time-based OTP verification
    const secret = this.decryptTOTPSecret(user.totpSecret);
    
    // Allow for time drift (±1 window)
    const isValid = authenticator.verify({
      token: code,
      secret,
      window: 1
    });
    
    // Prevent replay attacks
    if (isValid) {
      const lastUsed = this.getLastUsedTOTP(user.id);
      if (lastUsed === code) {
        return false; // Code already used
      }
      this.recordUsedTOTP(user.id, code);
    }
    
    return isValid;
  }
  
  private async createSession(
    user: User,
    request?: Request
  ): Promise<AuthenticationResult> {
    // Generate tokens
    const accessToken = await this.generateAccessToken(user);
    const refreshToken = await this.generateRefreshToken(user);
    
    // Create session
    const session: Session = {
      id: crypto.randomUUID(),
      userId: user.id,
      userRole: user.role,
      permissions: await this.loadPermissions(user.role),
      ipAddress: request?.ip,
      userAgent: request?.headers['user-agent'],
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
    };
    
    // Store session
    await this.sessionStore.create(session);
    
    // Audit log
    await this.auditLog({
      event: 'LOGIN_SUCCESS',
      userId: user.id,
      ipAddress: request?.ip,
      metadata: {
        sessionId: session.id,
        twoFactorUsed: user.twoFactorEnabled
      }
    });
    
    return {
      accessToken,
      refreshToken,
      session,
      user: this.sanitizeUser(user)
    };
  }
  
  private async generateAccessToken(user: User): Promise<string> {
    const token = await new SignJWT({
      sub: user.id,
      email: user.email,
      role: user.role,
      permissions: await this.loadPermissions(user.role)
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('15m')
      .setJti(crypto.randomUUID())
      .sign(this.jwtSecret);
    
    return token;
  }
}

// Role-Based Access Control
export class AuthorizationService {
  private readonly permissions: Map<UserRole, Permission[]>;
  private readonly resourcePolicies: Map<string, PolicyEvaluator>;
  
  constructor() {
    this.setupPermissions();
    this.setupResourcePolicies();
  }
  
  private setupPermissions(): void {
    this.permissions = new Map([
      ['SUPER_ADMIN', [
        'bookings:*',
        'users:*',
        'payments:*',
        'events:*',
        'reports:*',
        'settings:*'
      ]],
      ['MANAGER', [
        'bookings:read',
        'bookings:update',
        'bookings:check_in',
        'events:*',
        'reports:read',
        'users:read'
      ]],
      ['DOOR_STAFF', [
        'bookings:read',
        'bookings:check_in',
        'events:read'
      ]],
      ['CUSTOMER', [
        'bookings:create:own',
        'bookings:read:own',
        'bookings:update:own',
        'bookings:cancel:own',
        'payments:read:own'
      ]]
    ]);
  }
  
  async authorize(
    user: AuthenticatedUser,
    resource: string,
    action: string,
    context?: AuthorizationContext
  ): Promise<boolean> {
    // Check direct permissions
    const userPermissions = this.permissions.get(user.role) || [];
    
    // Check wildcard permissions
    if (userPermissions.includes(`${resource}:*`)) {
      return true;
    }
    
    // Check specific permission
    const requiredPermission = `${resource}:${action}`;
    if (userPermissions.includes(requiredPermission)) {
      // Check ownership if required
      if (requiredPermission.includes(':own')) {
        return this.checkOwnership(user, context);
      }
      return true;
    }
    
    // Check resource-specific policies
    const policy = this.resourcePolicies.get(resource);
    if (policy) {
      return await policy.evaluate(user, action, context);
    }
    
    return false;
  }
  
  private checkOwnership(
    user: AuthenticatedUser,
    context?: AuthorizationContext
  ): boolean {
    if (!context?.resourceOwnerId) {
      return false;
    }
    
    return user.id === context.resourceOwnerId;
  }
}
```

### 2. API Security Implementation

```typescript
// API Security Middleware
export class APISecurityMiddleware {
  private readonly csrf: CSRFProtection;
  private readonly cors: CORSPolicy;
  private readonly helmet: SecurityHeaders;
  private readonly validator: InputValidator;
  
  async handle(
    request: NextRequest,
    next: () => Promise<NextResponse>
  ): Promise<NextResponse> {
    try {
      // Security headers
      const securityHeaders = this.getSecurityHeaders();
      
      // CORS validation
      if (!this.cors.validate(request)) {
        return new NextResponse('CORS policy violation', { status: 403 });
      }
      
      // CSRF protection for state-changing operations
      if (this.requiresCSRF(request)) {
        const csrfValid = await this.csrf.validate(request);
        if (!csrfValid) {
          return new NextResponse('CSRF token invalid', { status: 403 });
        }
      }
      
      // Input validation and sanitization
      const sanitized = await this.sanitizeRequest(request);
      
      // Rate limiting per endpoint
      const rateLimitResult = await this.checkRateLimit(request);
      if (!rateLimitResult.allowed) {
        return new NextResponse('Rate limit exceeded', {
          status: 429,
          headers: {
            'Retry-After': rateLimitResult.retryAfter.toString(),
            'X-RateLimit-Limit': rateLimitResult.limit.toString(),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': rateLimitResult.reset.toString()
          }
        });
      }
      
      // Execute request
      const response = await next();
      
      // Add security headers to response
      Object.entries(securityHeaders).forEach(([key, value]) => {
        response.headers.set(key, value);
      });
      
      return response;
    } catch (error) {
      // Security error handling
      return this.handleSecurityError(error);
    }
  }
  
  private getSecurityHeaders(): Record<string, string> {
    return {
      // Content Security Policy
      'Content-Security-Policy': [
        "default-src 'self'",
        "script-src 'self' 'unsafe-inline' https://js.stripe.com",
        "style-src 'self' 'unsafe-inline'",
        "img-src 'self' data: https:",
        "font-src 'self' data:",
        "connect-src 'self' https://api.stripe.com wss://supabase.com",
        "frame-src https://js.stripe.com",
        "frame-ancestors 'none'",
        "base-uri 'self'",
        "form-action 'self'",
        "upgrade-insecure-requests"
      ].join('; '),
      
      // Security headers
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'X-XSS-Protection': '1; mode=block',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'Permissions-Policy': 'geolocation=(), microphone=(), camera=()',
      
      // HSTS
      'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload'
    };
  }
  
  private async sanitizeRequest(request: NextRequest): Promise<any> {
    const contentType = request.headers.get('content-type');
    
    if (contentType?.includes('application/json')) {
      const body = await request.json();
      return this.sanitizeJSON(body);
    }
    
    if (contentType?.includes('multipart/form-data')) {
      const formData = await request.formData();
      return this.sanitizeFormData(formData);
    }
    
    return {};
  }
  
  private sanitizeJSON(data: any): any {
    // Remove any potential XSS vectors
    const sanitized = JSON.parse(
      JSON.stringify(data)
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/javascript:/gi, '')
        .replace(/on\w+\s*=/gi, '')
    );
    
    // SQL injection prevention
    if (typeof sanitized === 'object') {
      Object.keys(sanitized).forEach(key => {
        if (typeof sanitized[key] === 'string') {
          sanitized[key] = sanitized[key]
            .replace(/'/g, "''")
            .replace(/--/g, '')
            .replace(/\/\*/g, '')
            .replace(/\*\//g, '');
        }
      });
    }
    
    return sanitized;
  }
}
```

### 3. Data Protection & GDPR Compliance

```typescript
// GDPR Compliance Service
export class GDPRComplianceService {
  private readonly encryptionKey: Buffer;
  private readonly dataClassification: Map<string, DataClassification>;
  
  constructor() {
    this.encryptionKey = Buffer.from(process.env.ENCRYPTION_KEY!, 'hex');
    this.setupDataClassification();
  }
  
  // Data Subject Rights Implementation
  async handleDataSubjectRequest(
    requestType: DataSubjectRequestType,
    userId: string,
    verificationToken: string
  ): Promise<DataSubjectResponse> {
    // Verify request authenticity
    const verified = await this.verifyDataSubjectIdentity(
      userId,
      verificationToken
    );
    
    if (!verified) {
      throw new SecurityError('Identity verification failed');
    }
    
    switch (requestType) {
      case 'ACCESS':
        return await this.handleAccessRequest(userId);
      
      case 'PORTABILITY':
        return await this.handlePortabilityRequest(userId);
      
      case 'RECTIFICATION':
        return await this.handleRectificationRequest(userId);
      
      case 'ERASURE':
        return await this.handleErasureRequest(userId);
      
      case 'RESTRICTION':
        return await this.handleRestrictionRequest(userId);
      
      case 'OBJECTION':
        return await this.handleObjectionRequest(userId);
      
      default:
        throw new Error('Unknown request type');
    }
  }
  
  private async handleErasureRequest(userId: string): Promise<DataSubjectResponse> {
    // Check for legal obligations to retain data
    const retentionObligations = await this.checkRetentionObligations(userId);
    
    if (retentionObligations.hasObligations) {
      return {
        success: false,
        reason: 'Legal retention requirements',
        details: retentionObligations.obligations,
        alternativeAction: 'DATA_ANONYMIZATION'
      };
    }
    
    // Begin erasure process
    const erasureTasks = [
      this.erasePersonalData(userId),
      this.eraseBookingHistory(userId),
      this.erasePaymentData(userId),
      this.eraseAuditLogs(userId),
      this.removeFromMarketing(userId),
      this.deleteBackups(userId)
    ];
    
    const results = await Promise.allSettled(erasureTasks);
    
    // Verify complete erasure
    const verificationResult = await this.verifyErasure(userId);
    
    // Generate erasure certificate
    const certificate = await this.generateErasureCertificate({
      userId,
      requestDate: new Date(),
      completionDate: new Date(),
      erasedData: results,
      verification: verificationResult
    });
    
    return {
      success: true,
      certificate,
      completedAt: new Date()
    };
  }
  
  // Encryption at Rest
  async encryptSensitiveData(
    data: any,
    classification: DataClassification
  ): Promise<EncryptedData> {
    if (classification.level < 'CONFIDENTIAL') {
      return { data, encrypted: false };
    }
    
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(
      'aes-256-gcm',
      this.encryptionKey,
      iv
    );
    
    const encrypted = Buffer.concat([
      cipher.update(JSON.stringify(data), 'utf8'),
      cipher.final()
    ]);
    
    const authTag = cipher.getAuthTag();
    
    return {
      data: encrypted.toString('base64'),
      iv: iv.toString('base64'),
      authTag: authTag.toString('base64'),
      encrypted: true,
      algorithm: 'aes-256-gcm',
      classification: classification.level
    };
  }
  
  // Data Masking for Non-Production
  maskSensitiveData(data: any, environment: string): any {
    if (environment === 'production') {
      return data;
    }
    
    const masked = { ...data };
    
    // Mask PII fields
    const piiFields = [
      'email',
      'phone',
      'firstName',
      'lastName',
      'dateOfBirth',
      'address',
      'postcode'
    ];
    
    piiFields.forEach(field => {
      if (masked[field]) {
        masked[field] = this.maskField(masked[field], field);
      }
    });
    
    // Mask payment data
    if (masked.cardNumber) {
      masked.cardNumber = '**** **** **** ' + masked.cardNumber.slice(-4);
    }
    
    return masked;
  }
  
  private maskField(value: string, fieldType: string): string {
    switch (fieldType) {
      case 'email':
        const [local, domain] = value.split('@');
        return `${local[0]}***@${domain}`;
      
      case 'phone':
        return value.slice(0, 3) + '****' + value.slice(-3);
      
      case 'firstName':
      case 'lastName':
        return value[0] + '*'.repeat(value.length - 1);
      
      case 'dateOfBirth':
        return '01/01/****';
      
      case 'postcode':
        return value.slice(0, 2) + '** ***';
      
      default:
        return '*'.repeat(value.length);
    }
  }
}
```

### 4. Infrastructure Security

```typescript
// Secrets Management
export class SecretsManager {
  private readonly vault: HashiCorpVault;
  private readonly cache: Map<string, CachedSecret>;
  private readonly rotationSchedule: Map<string, RotationPolicy>;
  
  constructor() {
    this.vault = new HashiCorpVault({
      endpoint: process.env.VAULT_ENDPOINT!,
      token: process.env.VAULT_TOKEN!,
      namespace: 'backroom-leeds'
    });
    
    this.cache = new Map();
    this.setupRotationPolicies();
  }
  
  async getSecret(key: string): Promise<string> {
    // Check cache
    const cached = this.cache.get(key);
    if (cached && !this.isExpired(cached)) {
      return cached.value;
    }
    
    // Fetch from vault
    const secret = await this.vault.read(`secret/data/${key}`);
    
    // Cache with TTL
    this.cache.set(key, {
      value: secret.data.value,
      fetchedAt: Date.now(),
      ttl: secret.data.ttl || 3600000 // 1 hour default
    });
    
    return secret.data.value;
  }
  
  async rotateSecret(key: string): Promise<void> {
    const policy = this.rotationSchedule.get(key);
    if (!policy) {
      throw new Error(`No rotation policy for secret: ${key}`);
    }
    
    // Generate new secret
    const newSecret = await policy.generate();
    
    // Update in vault
    await this.vault.write(`secret/data/${key}`, {
      value: newSecret,
      rotatedAt: new Date().toISOString(),
      previousVersion: await this.getSecret(key)
    });
    
    // Invalidate cache
    this.cache.delete(key);
    
    // Notify dependent services
    await this.notifyRotation(key);
  }
  
  private setupRotationPolicies(): void {
    // Database password rotation
    this.rotationSchedule.set('database_password', {
      generate: async () => {
        return crypto.randomBytes(32).toString('base64');
      },
      schedule: '0 0 1 * *', // Monthly
      notify: ['database_service']
    });
    
    // API keys rotation
    this.rotationSchedule.set('api_key', {
      generate: async () => {
        return `sk_live_${crypto.randomBytes(24).toString('hex')}`;
      },
      schedule: '0 0 * * 0', // Weekly
      notify: ['api_gateway']
    });
    
    // JWT secrets rotation
    this.rotationSchedule.set('jwt_secret', {
      generate: async () => {
        return crypto.randomBytes(64).toString('hex');
      },
      schedule: '0 0 1 */3 *', // Quarterly
      notify: ['auth_service']
    });
  }
}
```

## Deployment Architecture

### CI/CD Pipeline

```yaml
# .github/workflows/deploy.yml
name: Production Deployment Pipeline

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

env:
  NODE_VERSION: '20.x'
  PNPM_VERSION: '8'

jobs:
  # Security Scanning
  security:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Run Trivy vulnerability scanner
        uses: aquasecurity/trivy-action@master
        with:
          scan-type: 'fs'
          scan-ref: '.'
          format: 'sarif'
          output: 'trivy-results.sarif'
      
      - name: Upload Trivy results
        uses: github/codeql-action/upload-sarif@v2
        with:
          sarif_file: 'trivy-results.sarif'
      
      - name: Run Snyk security scan
        uses: snyk/actions/node@master
        env:
          SNYK_TOKEN: ${{ secrets.SNYK_TOKEN }}
        with:
          args: --severity-threshold=high
      
      - name: Run OWASP dependency check
        uses: dependency-check/Dependency-Check_Action@main
        with:
          project: 'backroom-leeds'
          path: '.'
          format: 'JSON'

  # Code Quality
  quality:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
      
      - name: Setup pnpm
        uses: pnpm/action-setup@v2
        with:
          version: ${{ env.PNPM_VERSION }}
      
      - name: Install dependencies
        run: pnpm install --frozen-lockfile
      
      - name: Run ESLint
        run: pnpm lint
      
      - name: Run TypeScript check
        run: pnpm tsc --noEmit
      
      - name: Run Prettier check
        run: pnpm prettier --check .
      
      - name: SonarCloud scan
        uses: SonarSource/sonarcloud-github-action@master
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          SONAR_TOKEN: ${{ secrets.SONAR_TOKEN }}

  # Testing
  test:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: supabase/postgres:15
        env:
          POSTGRES_PASSWORD: postgres
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5432:5432
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
      
      - name: Setup pnpm
        uses: pnpm/action-setup@v2
        with:
          version: ${{ env.PNPM_VERSION }}
      
      - name: Install dependencies
        run: pnpm install --frozen-lockfile
      
      - name: Run unit tests
        run: pnpm test:unit -- --coverage
      
      - name: Run integration tests
        run: pnpm test:integration
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/test
      
      - name: Run E2E tests
        run: pnpm test:e2e
        env:
          TEST_URL: http://localhost:3000
      
      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage/lcov.info

  # Build
  build:
    needs: [security, quality, test]
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
      
      - name: Setup pnpm
        uses: pnpm/action-setup@v2
        with:
          version: ${{ env.PNPM_VERSION }}
      
      - name: Install dependencies
        run: pnpm install --frozen-lockfile
      
      - name: Build application
        run: pnpm build
        env:
          NEXT_PUBLIC_SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
          NEXT_PUBLIC_SUPABASE_ANON_KEY: ${{ secrets.SUPABASE_ANON_KEY }}
          NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: ${{ secrets.STRIPE_PUBLISHABLE_KEY }}
      
      - name: Upload build artifacts
        uses: actions/upload-artifact@v3
        with:
          name: build-artifacts
          path: .next

  # Database Migrations
  migrate:
    needs: build
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Supabase CLI
        uses: supabase/setup-cli@v1
        with:
          version: latest
      
      - name: Run migrations
        run: |
          supabase link --project-ref ${{ secrets.SUPABASE_PROJECT_REF }}
          supabase db push
        env:
          SUPABASE_ACCESS_TOKEN: ${{ secrets.SUPABASE_ACCESS_TOKEN }}

  # Deploy to Vercel
  deploy:
    needs: [build, migrate]
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v4
      
      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: '--prod'
          scope: ${{ secrets.VERCEL_SCOPE }}

  # Post-Deployment
  post-deploy:
    needs: deploy
    runs-on: ubuntu-latest
    steps:
      - name: Purge CDN cache
        run: |
          curl -X POST https://api.vercel.com/v1/purge \
            -H "Authorization: Bearer ${{ secrets.VERCEL_TOKEN }}" \
            -H "Content-Type: application/json" \
            -d '{"url": "https://thebackroomleeds.com/*"}'
      
      - name: Run smoke tests
        run: |
          npx playwright test tests/smoke
        env:
          PRODUCTION_URL: https://thebackroomleeds.com
      
      - name: Notify deployment
        uses: 8398a7/action-slack@v3
        with:
          status: ${{ job.status }}
          text: 'Production deployment completed'
          webhook_url: ${{ secrets.SLACK_WEBHOOK }}
```

### Infrastructure as Code

```typescript
// infrastructure/main.tf
terraform {
  required_version = ">= 1.0"
  
  required_providers {
    vercel = {
      source  = "vercel/vercel"
      version = "~> 0.4"
    }
    supabase = {
      source  = "supabase/supabase"
      version = "~> 1.0"
    }
    cloudflare = {
      source  = "cloudflare/cloudflare"
      version = "~> 4.0"
    }
  }
  
  backend "s3" {
    bucket = "backroom-leeds-terraform-state"
    key    = "production/terraform.tfstate"
    region = "eu-west-2"
    encrypt = true
    dynamodb_table = "terraform-state-lock"
  }
}

# Vercel Project
resource "vercel_project" "backroom_leeds" {
  name = "backroom-leeds"
  framework = "nextjs"
  
  build_command = "pnpm build"
  output_directory = ".next"
  install_command = "pnpm install"
  
  environment = [
    {
      key   = "NEXT_PUBLIC_SUPABASE_URL"
      value = var.supabase_url
      target = ["production", "preview"]
    },
    {
      key   = "NEXT_PUBLIC_SUPABASE_ANON_KEY"
      value = var.supabase_anon_key
      target = ["production", "preview"]
    },
    {
      key   = "STRIPE_SECRET_KEY"
      value = var.stripe_secret_key
      target = ["production"]
    }
  ]
  
  git_repository = {
    type = "github"
    repo = "backroom-leeds/website"
  }
}

# Vercel Domain
resource "vercel_domain" "main" {
  domain = "thebackroomleeds.com"
  team_id = var.vercel_team_id
}

resource "vercel_project_domain" "main" {
  project_id = vercel_project.backroom_leeds.id
  domain     = vercel_domain.main.domain
}

# Cloudflare DNS
resource "cloudflare_record" "main" {
  zone_id = var.cloudflare_zone_id
  name    = "@"
  value   = vercel_domain.main.verification_record
  type    = "TXT"
  ttl     = 3600
}

resource "cloudflare_record" "cname" {
  zone_id = var.cloudflare_zone_id
  name    = "www"
  value   = "cname.vercel-dns.com"
  type    = "CNAME"
  ttl     = 1
  proxied = true
}

# Cloudflare Security Rules
resource "cloudflare_firewall_rule" "rate_limit" {
  zone_id     = var.cloudflare_zone_id
  description = "Rate limiting rule"
  filter_id   = cloudflare_filter.rate_limit.id
  action      = "challenge"
}

resource "cloudflare_filter" "rate_limit" {
  zone_id     = var.cloudflare_zone_id
  description = "Rate limit filter"
  expression  = "(http.request.uri.path contains \"/api/\") and (rate() > 100)"
}

# Supabase Project
resource "supabase_project" "main" {
  organization_id = var.supabase_org_id
  name           = "backroom-leeds"
  database_password = var.database_password
  region         = "eu-west-2"
  
  lifecycle {
    prevent_destroy = true
  }
}

# Monitoring & Alerting
resource "datadog_monitor" "api_latency" {
  name    = "API Latency Alert"
  type    = "metric alert"
  message = "API latency is too high @slack-backroom-alerts"
  
  query = "avg(last_5m):avg:trace.next.request{service:backroom-api} > 500"
  
  monitor_thresholds {
    warning  = 300
    critical = 500
  }
  
  notify_no_data    = true
  no_data_timeframe = 10
}

resource "datadog_monitor" "error_rate" {
  name    = "Error Rate Alert"
  type    = "metric alert"
  message = "Error rate is too high @slack-backroom-alerts"
  
  query = "sum(last_5m):sum:trace.next.errors{service:backroom-api}.as_rate() > 0.05"
  
  monitor_thresholds {
    warning  = 0.03
    critical = 0.05
  }
}
```

### Multi-Region Deployment

```typescript
// Edge Function Configuration
export const config = {
  runtime: 'edge',
  regions: ['lhr1', 'cdg1', 'fra1'], // London, Paris, Frankfurt
};

// Geo-routing Logic
export async function middleware(request: NextRequest) {
  const country = request.geo?.country || 'GB';
  const region = request.geo?.region || 'EN';
  
  // Route to nearest region
  const regionMap: Record<string, string> = {
    'GB': 'lhr1', // United Kingdom -> London
    'FR': 'cdg1', // France -> Paris
    'DE': 'fra1', // Germany -> Frankfurt
    'IE': 'lhr1', // Ireland -> London
    'NL': 'fra1', // Netherlands -> Frankfurt
    'BE': 'cdg1', // Belgium -> Paris
  };
  
  const targetRegion = regionMap[country] || 'lhr1';
  
  // Set region header for downstream services
  const response = NextResponse.next();
  response.headers.set('X-Vercel-Region', targetRegion);
  response.headers.set('X-User-Country', country);
  response.headers.set('X-User-Region', region);
  
  return response;
}
```

### Disaster Recovery

```typescript
// Automated Backup Strategy
export class DisasterRecoveryService {
  private readonly backupSchedule: CronJob[];
  private readonly storageProviders: BackupStorage[];
  
  constructor() {
    this.setupBackupSchedule();
    this.initializeStorageProviders();
  }
  
  private setupBackupSchedule(): void {
    // Database backup - every 6 hours
    this.backupSchedule.push(
      new CronJob('0 */6 * * *', async () => {
        await this.backupDatabase();
      })
    );
    
    // File storage backup - daily
    this.backupSchedule.push(
      new CronJob('0 3 * * *', async () => {
        await this.backupFileStorage();
      })
    );
    
    // Configuration backup - weekly
    this.backupSchedule.push(
      new CronJob('0 0 * * 0', async () => {
        await this.backupConfiguration();
      })
    );
  }
  
  async backupDatabase(): Promise<BackupResult> {
    const backup = await this.createDatabaseBackup();
    
    // Store in multiple locations
    await Promise.all([
      this.storeInS3(backup),
      this.storeInGCS(backup),
      this.storeInAzure(backup)
    ]);
    
    // Verify backup integrity
    await this.verifyBackup(backup);
    
    // Prune old backups
    await this.pruneOldBackups({
      retentionDays: 30,
      minBackups: 10
    });
    
    return {
      id: backup.id,
      size: backup.size,
      locations: ['s3', 'gcs', 'azure'],
      timestamp: backup.timestamp
    };
  }
  
  async restoreFromBackup(
    backupId: string,
    targetEnvironment: string
  ): Promise<RestoreResult> {
    // Validate target environment
    if (targetEnvironment === 'production') {
      throw new Error('Cannot restore directly to production');
    }
    
    // Fetch backup
    const backup = await this.fetchBackup(backupId);
    
    // Create restore point
    const restorePoint = await this.createRestorePoint();
    
    try {
      // Restore database
      await this.restoreDatabase(backup, targetEnvironment);
      
      // Restore file storage
      await this.restoreFileStorage(backup, targetEnvironment);
      
      // Verify restoration
      const verification = await this.verifyRestoration(targetEnvironment);
      
      return {
        success: true,
        restorePoint,
        verification
      };
    } catch (error) {
      // Rollback on failure
      await this.rollbackToRestorePoint(restorePoint);
      throw error;
    }
  }
}
```

## Monitoring & Observability

### Application Performance Monitoring

```typescript
// APM Configuration
import { init as initSentry } from '@sentry/nextjs';
import { ProfilingIntegration } from '@sentry/profiling-node';

initSentry({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  
  // Performance Monitoring
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
  profilesSampleRate: 1.0,
  
  integrations: [
    new ProfilingIntegration(),
    new Sentry.Integrations.Http({ tracing: true }),
    new Sentry.Integrations.Postgres(),
    new Sentry.Integrations.Redis()
  ],
  
  // Release tracking
  release: process.env.VERCEL_GIT_COMMIT_SHA,
  
  // Error filtering
  beforeSend(event, hint) {
    // Filter out non-critical errors
    if (event.exception) {
      const error = hint.originalException;
      
      // Don't send client-side network errors
      if (error?.name === 'NetworkError') {
        return null;
      }
      
      // Sanitize sensitive data
      event = sanitizeSentryEvent(event);
    }
    
    return event;
  },
  
  // Transaction filtering
  beforeSendTransaction(event) {
    // Don't send health check transactions
    if (event.transaction === '/api/health') {
      return null;
    }
    
    return event;
  }
});

// Custom instrumentation
export function instrumentBookingFlow() {
  return Sentry.startTransaction({
    name: 'booking.flow',
    op: 'booking',
    data: {
      source: 'website'
    }
  });
}
```

### Logging Architecture

```typescript
// Structured Logging
import winston from 'winston';
import { LoggingWinston } from '@google-cloud/logging-winston';

const loggingWinston = new LoggingWinston({
  projectId: 'backroom-leeds',
  keyFilename: 'path/to/keyfile.json',
  resource: {
    type: 'cloud_function',
    labels: {
      function_name: 'backroom-api',
      region: 'europe-west2'
    }
  }
});

export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: {
    service: 'backroom-api',
    environment: process.env.NODE_ENV,
    version: process.env.npm_package_version
  },
  transports: [
    // Console output for development
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    }),
    // Google Cloud Logging for production
    ...(process.env.NODE_ENV === 'production' ? [loggingWinston] : [])
  ]
});

// Audit logging
export class AuditLogger {
  async log(event: AuditEvent): Promise<void> {
    const auditEntry = {
      timestamp: new Date().toISOString(),
      eventType: event.type,
      userId: event.userId,
      resourceType: event.resourceType,
      resourceId: event.resourceId,
      action: event.action,
      result: event.result,
      ipAddress: event.ipAddress,
      userAgent: event.userAgent,
      metadata: event.metadata,
      
      // Compliance fields
      dataClassification: event.dataClassification,
      gdprRelevant: event.gdprRelevant,
      retentionPeriod: event.retentionPeriod
    };
    
    // Write to audit log table
    await this.writeToDatabase(auditEntry);
    
    // Send to SIEM if security-relevant
    if (this.isSecurityRelevant(event)) {
      await this.sendToSIEM(auditEntry);
    }
    
    // Archive for compliance
    await this.archiveAuditLog(auditEntry);
  }
}
```

---

*Security and deployment architecture designed for The Backroom Leeds by Claude Opus 4.1 Architecture Agent*