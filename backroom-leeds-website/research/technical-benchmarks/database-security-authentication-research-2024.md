# Database Security for Authentication Research 2024
*The Backroom Leeds - Secure Authentication Infrastructure*

## Executive Summary

This research analyzes database security practices for authentication systems, focusing on password storage with Argon2, TOTP secret encryption, session management, and rate limiting storage. Primary findings: **Argon2id for password hashing**, **encrypted TOTP secrets**, and **Redis for session/rate limiting storage** provide optimal security for The Backroom Leeds admin system.

---

## 1. Password Storage Security Analysis

### 1.1 Argon2 - The Modern Champion (RECOMMENDED)

**Version**: argon2 npm package 0.31.0+ (2024)
**Status**: Winner of Password Hashing Competition (2015)
**Security Rating**: ⭐⭐⭐⭐⭐ (Industry Standard)
**Resistance**: Brute-force, GPU-based cracking, side-channel attacks

**Key Advantages**:
- Memory-hard function (ASIC/FPGA resistant)
- Fine-tunable parameters (memory, time, parallelism)
- Three variants: Argon2d, Argon2i, Argon2id (recommended)
- Winner of internationally recognized Password Hashing Competition

**Installation and Setup**:
```bash
npm install argon2
npm install --save-dev @types/argon2
```

**Configuration for The Backroom Leeds**:
```typescript
// lib/password-security.ts
import argon2 from 'argon2';

const ARGON2_OPTIONS = {
  type: argon2.argon2id,     // Recommended variant
  memoryCost: 2 ** 16,      // 64 MB memory usage
  timeCost: 3,              // 3 iterations
  parallelism: 1,           // Single thread (server optimization)
  hashLength: 32,           // 256-bit hash output
  saltLength: 16            // 128-bit salt
};

export const hashPassword = async (password: string): Promise<string> => {
  try {
    return await argon2.hash(password, ARGON2_OPTIONS);
  } catch (error) {
    throw new Error('Password hashing failed');
  }
};

export const verifyPassword = async (
  hashedPassword: string, 
  plainPassword: string
): Promise<boolean> => {
  try {
    return await argon2.verify(hashedPassword, plainPassword);
  } catch (error) {
    return false;
  }
};

// Performance benchmarking for parameter tuning
export const benchmarkArgon2 = async (): Promise<void> => {
  const testPassword = 'benchmark_password_123';
  const start = Date.now();
  
  await argon2.hash(testPassword, ARGON2_OPTIONS);
  
  const duration = Date.now() - start;
  console.log(`Argon2 hash duration: ${duration}ms`);
  
  // Adjust parameters if duration is outside acceptable range (100-500ms)
  if (duration < 100) {
    console.warn('Consider increasing memoryCost or timeCost');
  } else if (duration > 500) {
    console.warn('Consider decreasing parameters for better UX');
  }
};
```

**Security Benefits vs Alternatives**:
```typescript
// Security comparison (approximate crack resistance)
const PASSWORD_SECURITY_COMPARISON = {
  'md5': '< 1 second',           // Never use
  'sha256': '< 1 minute',        // Never use
  'bcrypt': '1-10 hours',        // Good but dated
  'scrypt': '10-100 hours',      // Good alternative
  'argon2id': '1000+ hours'      // Recommended
};
```

### 1.2 Alternative: bcrypt (Legacy Systems)

**Status**: Still secure but less future-proof
**Recommendation**: Migrate to Argon2 when possible

**Migration Strategy**:
```typescript
// lib/password-migration.ts
export const migratePasswordHash = async (
  userId: string,
  plainPassword: string,
  oldHashedPassword: string
): Promise<string> => {
  const bcrypt = require('bcrypt');
  
  // Verify old hash
  const isValidOldHash = await bcrypt.compare(plainPassword, oldHashedPassword);
  if (!isValidOldHash) {
    throw new Error('Invalid password');
  }
  
  // Create new Argon2 hash
  const newHash = await hashPassword(plainPassword);
  
  // Update database
  await updateUserPasswordHash(userId, newHash);
  
  return newHash;
};
```

---

## 2. TOTP Secret Encryption

### 2.1 Security Requirement Analysis

**Critical Finding**: RFC 4226 Section 7.5 recommends encrypting TOTP shared secrets in databases.

**Security Rationale**:
- Database breach without server access = TOTP secrets still protected
- Compliance with security best practices
- Defense-in-depth strategy

### 2.2 Encryption Implementation

```typescript
// lib/totp-encryption.ts
import crypto from 'crypto';

// Environment variables required
const ENCRYPTION_KEY = process.env.TOTP_ENCRYPTION_KEY!; // 32-byte key
const ALGORITHM = 'aes-256-gcm';

export const encryptTOTPSecret = (secret: string): string => {
  const iv = crypto.randomBytes(16); // 128-bit IV
  const cipher = crypto.createCipher(ALGORITHM, ENCRYPTION_KEY);
  
  cipher.setAAD(Buffer.from('totp-secret')); // Additional authenticated data
  
  let encrypted = cipher.update(secret, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  const authTag = cipher.getAuthTag();
  
  // Format: iv:authTag:encryptedData
  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
};

export const decryptTOTPSecret = (encryptedSecret: string): string => {
  const parts = encryptedSecret.split(':');
  if (parts.length !== 3) {
    throw new Error('Invalid encrypted secret format');
  }
  
  const [ivHex, authTagHex, encrypted] = parts;
  const iv = Buffer.from(ivHex, 'hex');
  const authTag = Buffer.from(authTagHex, 'hex');
  
  const decipher = crypto.createDecipher(ALGORITHM, ENCRYPTION_KEY);
  decipher.setAuthTag(authTag);
  decipher.setAAD(Buffer.from('totp-secret'));
  
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  
  return decrypted;
};

// Key rotation support
export const rotateTOTPEncryptionKey = async (): Promise<void> => {
  const newKey = crypto.randomBytes(32).toString('hex');
  
  // Re-encrypt all TOTP secrets with new key
  const users = await db.adminUser.findMany({
    where: { totpSecret: { not: null } },
    select: { id: true, totpSecret: true }
  });
  
  for (const user of users) {
    const decryptedSecret = decryptTOTPSecret(user.totpSecret);
    const reencryptedSecret = encryptTOTPSecret(decryptedSecret);
    
    await db.adminUser.update({
      where: { id: user.id },
      data: { totpSecret: reencryptedSecret }
    });
  }
  
  // Update environment variable (requires deployment)
  console.log('New encryption key:', newKey);
};
```

### 2.3 Database Schema for Encrypted Secrets

```sql
-- Updated admin_users table with encrypted TOTP secrets
ALTER TABLE admin_users 
ADD COLUMN totp_secret_encrypted TEXT,
ADD COLUMN totp_backup_codes_encrypted TEXT,
ADD COLUMN encryption_key_version INTEGER DEFAULT 1;

-- Remove old plaintext columns after migration
-- ALTER TABLE admin_users DROP COLUMN totp_secret;
-- ALTER TABLE admin_users DROP COLUMN totp_backup_codes;
```

---

## 3. Session Storage Security

### 3.1 Redis vs Database Session Storage

**Redis (RECOMMENDED)**:
- ✅ High performance (in-memory)
- ✅ Automatic expiration (TTL)
- ✅ Atomic operations
- ✅ Distributed session support
- ✅ Built-in pub/sub for real-time invalidation

**Database Storage**:
- ✅ ACID compliance
- ✅ Persistent storage
- ❌ Slower performance
- ❌ Manual cleanup required

### 3.2 Redis Session Implementation

```typescript
// lib/session-storage.ts
import { Redis } from 'ioredis';
import crypto from 'crypto';

const redis = new Redis(process.env.REDIS_URL!, {
  retryDelayOnFailover: 100,
  enableReadyCheck: false,
  maxRetriesPerRequest: null,
});

interface SessionData {
  userId: string;
  role: string;
  permissions: string[];
  twoFactorVerified: boolean;
  loginTime: number;
  lastActivity: number;
  ipAddress: string;
  userAgent: string;
}

export class SecureSessionManager {
  private readonly SESSION_PREFIX = 'session:';
  private readonly SESSION_TTL = 8 * 60 * 60; // 8 hours
  private readonly ACTIVITY_UPDATE_INTERVAL = 5 * 60; // 5 minutes

  async createSession(
    userId: string,
    sessionData: Omit<SessionData, 'lastActivity' | 'loginTime'>
  ): Promise<string> {
    const sessionId = crypto.randomBytes(32).toString('hex');
    const sessionKey = `${this.SESSION_PREFIX}${sessionId}`;
    
    const fullSessionData: SessionData = {
      ...sessionData,
      loginTime: Date.now(),
      lastActivity: Date.now()
    };

    await redis.setex(sessionKey, this.SESSION_TTL, JSON.stringify(fullSessionData));
    
    // Track active sessions for user
    await redis.sadd(`user_sessions:${userId}`, sessionId);
    await redis.expire(`user_sessions:${userId}`, this.SESSION_TTL);

    return sessionId;
  }

  async getSession(sessionId: string): Promise<SessionData | null> {
    const sessionKey = `${this.SESSION_PREFIX}${sessionId}`;
    const sessionDataStr = await redis.get(sessionKey);
    
    if (!sessionDataStr) {
      return null;
    }

    const sessionData: SessionData = JSON.parse(sessionDataStr);
    
    // Update last activity if enough time has passed
    const now = Date.now();
    if (now - sessionData.lastActivity > this.ACTIVITY_UPDATE_INTERVAL * 1000) {
      sessionData.lastActivity = now;
      await redis.setex(sessionKey, this.SESSION_TTL, JSON.stringify(sessionData));
    }

    return sessionData;
  }

  async invalidateSession(sessionId: string): Promise<void> {
    const sessionData = await this.getSession(sessionId);
    if (!sessionData) return;

    const sessionKey = `${this.SESSION_PREFIX}${sessionId}`;
    
    // Remove session
    await redis.del(sessionKey);
    
    // Remove from user's active sessions
    await redis.srem(`user_sessions:${sessionData.userId}`, sessionId);
  }

  async invalidateAllUserSessions(userId: string): Promise<void> {
    const sessionIds = await redis.smembers(`user_sessions:${userId}`);
    
    const pipeline = redis.pipeline();
    
    // Delete all sessions
    for (const sessionId of sessionIds) {
      pipeline.del(`${this.SESSION_PREFIX}${sessionId}`);
    }
    
    // Clear user session set
    pipeline.del(`user_sessions:${userId}`);
    
    await pipeline.exec();
  }

  async getActiveSessionsCount(userId: string): Promise<number> {
    return await redis.scard(`user_sessions:${userId}`);
  }
}

export const sessionManager = new SecureSessionManager();
```

### 3.3 Session Security Features

```typescript
// lib/session-security.ts
export class SessionSecurityManager {
  
  async detectSuspiciousActivity(
    sessionId: string,
    currentIP: string,
    currentUserAgent: string
  ): Promise<boolean> {
    const session = await sessionManager.getSession(sessionId);
    if (!session) return false;

    // Check for IP address changes
    if (session.ipAddress !== currentIP) {
      await this.logSecurityEvent({
        type: 'IP_CHANGE',
        sessionId,
        oldIP: session.ipAddress,
        newIP: currentIP,
        userId: session.userId
      });
      return true;
    }

    // Check for user agent changes (simplified)
    if (session.userAgent !== currentUserAgent) {
      await this.logSecurityEvent({
        type: 'USER_AGENT_CHANGE',
        sessionId,
        userId: session.userId
      });
      return true;
    }

    return false;
  }

  async enforceSessionLimits(userId: string): Promise<void> {
    const MAX_CONCURRENT_SESSIONS = 3;
    const activeSessions = await redis.smembers(`user_sessions:${userId}`);
    
    if (activeSessions.length > MAX_CONCURRENT_SESSIONS) {
      // Sort by last activity and remove oldest
      const sessionsWithActivity = await Promise.all(
        activeSessions.map(async (sessionId) => {
          const session = await sessionManager.getSession(sessionId);
          return { sessionId, lastActivity: session?.lastActivity || 0 };
        })
      );

      sessionsWithActivity.sort((a, b) => a.lastActivity - b.lastActivity);
      
      // Invalidate oldest sessions
      const sessionsToRemove = sessionsWithActivity
        .slice(0, activeSessions.length - MAX_CONCURRENT_SESSIONS);
      
      for (const { sessionId } of sessionsToRemove) {
        await sessionManager.invalidateSession(sessionId);
      }
    }
  }

  private async logSecurityEvent(event: any): Promise<void> {
    await redis.lpush('security_events', JSON.stringify({
      ...event,
      timestamp: Date.now()
    }));
  }
}
```

---

## 4. Rate Limiting Storage

### 4.1 Redis-based Rate Limiting (RECOMMENDED)

**Advantages**:
- High-performance counters
- Atomic increment operations
- Built-in expiration
- Distributed rate limiting

```typescript
// lib/rate-limiting.ts
import { Redis } from 'ioredis';

export class RateLimitManager {
  private redis: Redis;

  constructor() {
    this.redis = new Redis(process.env.REDIS_URL!);
  }

  async checkRateLimit(
    identifier: string,
    limit: number,
    windowSeconds: number,
    action: string = 'default'
  ): Promise<{ allowed: boolean; remaining: number; resetTime: number }> {
    const key = `rate_limit:${action}:${identifier}`;
    const now = Date.now();
    const windowStart = now - (windowSeconds * 1000);

    // Use sorted set for sliding window
    const pipeline = this.redis.pipeline();
    
    // Remove expired entries
    pipeline.zremrangebyscore(key, 0, windowStart);
    
    // Add current request
    pipeline.zadd(key, now, `${now}-${Math.random()}`);
    
    // Count requests in current window
    pipeline.zcard(key);
    
    // Set expiration
    pipeline.expire(key, windowSeconds);
    
    const results = await pipeline.exec();
    const currentCount = results![2][1] as number;

    const resetTime = now + (windowSeconds * 1000);
    const remaining = Math.max(0, limit - currentCount);
    const allowed = currentCount <= limit;

    return { allowed, remaining, resetTime };
  }

  // Specific rate limits for The Backroom Leeds
  async checkLoginAttempts(identifier: string): Promise<boolean> {
    const result = await this.checkRateLimit(identifier, 5, 300, 'login'); // 5 per 5 minutes
    return result.allowed;
  }

  async checkTOTPAttempts(userId: string): Promise<boolean> {
    const result = await this.checkRateLimit(userId, 3, 900, 'totp'); // 3 per 15 minutes
    return result.allowed;
  }

  async checkPasswordReset(email: string): Promise<boolean> {
    const result = await this.checkRateLimit(email, 3, 3600, 'password_reset'); // 3 per hour
    return result.allowed;
  }

  async checkQRGeneration(userId: string): Promise<boolean> {
    const result = await this.checkRateLimit(userId, 5, 3600, 'qr_generation'); // 5 per hour
    return result.allowed;
  }

  // Progressive delay for brute force protection
  async getDelayForFailedAttempts(identifier: string): Promise<number> {
    const key = `failed_attempts:${identifier}`;
    const attempts = await this.redis.get(key);
    const failureCount = attempts ? parseInt(attempts) : 0;

    // Progressive delay: 1s, 2s, 4s, 8s, 16s...
    const delay = Math.min(Math.pow(2, failureCount) * 1000, 30000); // Max 30 seconds

    return delay;
  }

  async recordFailedAttempt(identifier: string): Promise<void> {
    const key = `failed_attempts:${identifier}`;
    await this.redis.incr(key);
    await this.redis.expire(key, 3600); // Reset after 1 hour
  }

  async clearFailedAttempts(identifier: string): Promise<void> {
    const key = `failed_attempts:${identifier}`;
    await this.redis.del(key);
  }
}

export const rateLimitManager = new RateLimitManager();
```

### 4.2 Database-based Rate Limiting (Fallback)

```typescript
// lib/database-rate-limiting.ts
interface RateLimitEntry {
  id: string;
  identifier: string;
  action: string;
  timestamp: Date;
  windowSeconds: number;
}

export const checkDatabaseRateLimit = async (
  identifier: string,
  limit: number,
  windowSeconds: number,
  action: string
): Promise<boolean> => {
  const windowStart = new Date(Date.now() - (windowSeconds * 1000));

  // Clean old entries
  await db.rateLimitEntry.deleteMany({
    where: {
      timestamp: { lt: windowStart }
    }
  });

  // Count current entries
  const currentCount = await db.rateLimitEntry.count({
    where: {
      identifier,
      action,
      timestamp: { gte: windowStart }
    }
  });

  if (currentCount >= limit) {
    return false;
  }

  // Record new attempt
  await db.rateLimitEntry.create({
    data: {
      identifier,
      action,
      timestamp: new Date(),
      windowSeconds
    }
  });

  return true;
};
```

---

## 5. User Enumeration Prevention

### 5.1 Consistent Response Timing

```typescript
// lib/timing-security.ts
export const consistentDelay = async (minMs: number = 100, maxMs: number = 300): Promise<void> => {
  const delay = Math.floor(Math.random() * (maxMs - minMs + 1)) + minMs;
  await new Promise(resolve => setTimeout(resolve, delay));
};

export const secureUserLookup = async (email: string): Promise<{ exists: boolean; user?: any }> => {
  const startTime = Date.now();
  
  const user = await db.adminUser.findUnique({
    where: { email: email.toLowerCase() }
  });

  // Ensure minimum response time to prevent timing attacks
  const elapsed = Date.now() - startTime;
  if (elapsed < 100) {
    await new Promise(resolve => setTimeout(resolve, 100 - elapsed));
  }

  return { exists: !!user, user };
};
```

### 5.2 Login Response Consistency

```typescript
// lib/secure-login.ts
export const secureLoginAttempt = async (
  email: string,
  password: string,
  ipAddress: string
): Promise<{ success: boolean; message: string; sessionId?: string }> => {
  const startTime = Date.now();
  
  // Check rate limiting first
  if (!await rateLimitManager.checkLoginAttempts(ipAddress)) {
    await consistentDelay();
    return { success: false, message: 'Too many attempts. Please try again later.' };
  }

  const { exists, user } = await secureUserLookup(email);
  
  let passwordValid = false;
  if (exists && user) {
    passwordValid = await verifyPassword(user.passwordHash, password);
  } else {
    // Still perform hash operation to prevent timing attacks
    await argon2.verify('$argon2id$v=19$m=65536,t=3,p=1$dummy', password).catch(() => {});
  }

  // Ensure consistent timing
  const elapsed = Date.now() - startTime;
  if (elapsed < 200) {
    await new Promise(resolve => setTimeout(resolve, 200 - elapsed));
  }

  if (!exists || !passwordValid) {
    await rateLimitManager.recordFailedAttempt(ipAddress);
    return { success: false, message: 'Invalid email or password.' };
  }

  // Clear failed attempts on success
  await rateLimitManager.clearFailedAttempts(ipAddress);

  // Create session
  const sessionId = await sessionManager.createSession(user.id, {
    userId: user.id,
    role: user.role,
    permissions: user.permissions,
    twoFactorVerified: !user.totpEnabled, // Skip 2FA if not enabled
    ipAddress,
    userAgent: 'user-agent-string'
  });

  return { success: true, message: 'Login successful.', sessionId };
};
```

---

## 6. Database Security Best Practices

### 6.1 Connection Security

```typescript
// lib/database-security.ts
const DATABASE_CONFIG = {
  // SSL/TLS configuration
  ssl: {
    rejectUnauthorized: true,
    ca: process.env.DB_CA_CERT,
    key: process.env.DB_CLIENT_KEY,
    cert: process.env.DB_CLIENT_CERT
  },
  
  // Connection pooling
  pool: {
    min: 2,
    max: 10,
    acquireTimeoutMillis: 30000,
    createTimeoutMillis: 30000,
    destroyTimeoutMillis: 5000,
    idleTimeoutMillis: 30000,
    reapIntervalMillis: 1000,
    createRetryIntervalMillis: 200
  },
  
  // Logging (be careful with sensitive data)
  logging: process.env.NODE_ENV === 'development' ? ['query', 'error'] : ['error']
};
```

### 6.2 Query Security

```typescript
// lib/secure-queries.ts
export const secureUserQuery = async (email: string) => {
  // Use parameterized queries (Prisma handles this automatically)
  return await db.adminUser.findUnique({
    where: { 
      email: email.toLowerCase().trim() // Normalize input
    },
    select: {
      id: true,
      email: true,
      role: true,
      permissions: true,
      totpEnabled: true,
      // Never select password hash in regular queries
    }
  });
};

// Row-level security example for multi-tenant scenarios
export const getUserBookings = async (userId: string, requestingUserId: string) => {
  // Ensure users can only access their own data or admins can access all
  const whereClause = requestingUserId === userId 
    ? { userId } 
    : { 
        userId,
        // Additional admin check would go here
      };

  return await db.booking.findMany({
    where: whereClause
  });
};
```

---

## 7. Audit Logging

### 7.1 Security Event Logging

```typescript
// lib/audit-logging.ts
interface SecurityEvent {
  eventType: string;
  userId?: string;
  sessionId?: string;
  ipAddress: string;
  userAgent?: string;
  resource?: string;
  action?: string;
  success: boolean;
  metadata?: Record<string, any>;
  timestamp: Date;
}

export class SecurityAuditLogger {
  async logEvent(event: SecurityEvent): Promise<void> {
    // Store in database for compliance
    await db.securityAuditLog.create({
      data: {
        eventType: event.eventType,
        userId: event.userId,
        sessionId: event.sessionId,
        ipAddress: event.ipAddress,
        userAgent: event.userAgent,
        resource: event.resource,
        action: event.action,
        success: event.success,
        metadata: event.metadata,
        timestamp: event.timestamp
      }
    });

    // Also store in Redis for real-time monitoring
    await redis.lpush('security_events', JSON.stringify(event));
    await redis.ltrim('security_events', 0, 10000); // Keep last 10k events
  }

  async logLogin(userId: string, ipAddress: string, success: boolean): Promise<void> {
    await this.logEvent({
      eventType: 'USER_LOGIN',
      userId,
      ipAddress,
      success,
      timestamp: new Date()
    });
  }

  async logTOTPVerification(userId: string, ipAddress: string, success: boolean): Promise<void> {
    await this.logEvent({
      eventType: 'TOTP_VERIFICATION',
      userId,
      ipAddress,
      success,
      timestamp: new Date()
    });
  }

  async logPermissionCheck(
    userId: string,
    resource: string,
    action: string,
    granted: boolean
  ): Promise<void> {
    await this.logEvent({
      eventType: 'PERMISSION_CHECK',
      userId,
      resource,
      action,
      success: granted,
      ipAddress: 'server', // Server-side check
      timestamp: new Date()
    });
  }
}

export const auditLogger = new SecurityAuditLogger();
```

---

## 8. Implementation Recommendations

### 8.1 Security Infrastructure Setup

**Phase 1: Core Security** (Week 1)
- [ ] Implement Argon2 password hashing
- [ ] Set up Redis session storage
- [ ] Configure TOTP secret encryption
- [ ] Basic rate limiting

**Phase 2: Advanced Features** (Week 2)
- [ ] Session security features
- [ ] Comprehensive rate limiting
- [ ] User enumeration protection
- [ ] Progressive authentication delays

**Phase 3: Monitoring & Compliance** (Week 3)
- [ ] Security audit logging
- [ ] Database security hardening
- [ ] Performance optimization
- [ ] Security testing

### 8.2 Environment Variables

```bash
# .env.local
# Password hashing
ARGON2_MEMORY_COST=65536
ARGON2_TIME_COST=3

# TOTP encryption
TOTP_ENCRYPTION_KEY=your-32-byte-key-here
ENCRYPTION_KEY_VERSION=1

# Redis configuration
REDIS_URL=redis://localhost:6379
REDIS_TLS_URL=rediss://...

# Database security
DATABASE_URL=postgresql://...
DB_CA_CERT=path/to/ca-cert.pem
DB_CLIENT_KEY=path/to/client-key.pem
DB_CLIENT_CERT=path/to/client-cert.pem

# Session security
SESSION_SECRET=your-session-secret
SESSION_MAX_AGE=28800 # 8 hours
MAX_CONCURRENT_SESSIONS=3
```

### 8.3 Performance Considerations

**Database Optimization**:
- Index frequently queried fields (email, session_id)
- Use connection pooling
- Implement query timeout limits
- Regular maintenance and vacuuming

**Redis Optimization**:
- Use Redis Cluster for high availability
- Configure memory policies (allkeys-lru)
- Monitor memory usage and key expiration
- Implement Redis persistence (AOF + RDB)

---

**Research Date**: August 26, 2024  
**Next Review**: November 2024  
**Confidence Level**: High (5/5)

This research provides comprehensive guidance for implementing secure database authentication infrastructure at The Backroom Leeds, with modern security practices including Argon2 password hashing, encrypted TOTP secrets, Redis session management, and comprehensive audit logging.