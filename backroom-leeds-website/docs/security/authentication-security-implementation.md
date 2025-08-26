# Authentication Security Implementation Guide

## Overview
This document details the comprehensive security measures implemented in The Backroom Leeds admin authentication system, ensuring enterprise-grade protection and compliance with industry standards.

## Password Security

### Hashing Strategy: Argon2id
- **Algorithm**: Argon2id (memory-hard function)
- **Parameters**:
  - Memory: 64 MB
  - Iterations: 3
  - Parallelism: 4
- **Salt**: 16-byte cryptographically secure random salt
- **Pepper**: Additional server-side secret

```typescript
async function hashPassword(password: string): Promise<string> {
  const salt = crypto.randomBytes(16);
  const pepper = process.env.PASSWORD_PEPPER;
  
  return argon2.hash(password + pepper, {
    type: argon2.argon2id,
    memoryCost: 64 * 1024,
    timeCost: 3,
    parallelism: 4,
    salt
  });
}
```

## Two-Factor Authentication (2FA)

### TOTP Implementation
- **Library**: `otpauth`
- **Secret Storage**: AES-256-GCM encrypted
- **Token Lifetime**: 30-second window
- **Backup Codes**: 5 single-use emergency codes

```typescript
function generateTOTPSecret(): TOTPSecret {
  const secret = OTP.secret({ length: 32 });
  const encryptedSecret = encrypt(secret, AES_256_GCM_KEY);
  
  return {
    secret: encryptedSecret,
    backupCodes: generateBackupCodes(5)
  };
}
```

## JWT Token Management

### Token Generation
- **Algorithm**: HMAC-SHA256
- **Expiration**: 48-hour rolling window
- **Claims**:
  - User ID
  - Role
  - Permissions
  - Issued At
  - Expiration Time

```typescript
function generateJWT(user: User): string {
  return jwt.sign({
    sub: user.id,
    role: user.role,
    permissions: user.permissions,
    iat: Date.now(),
    exp: Date.now() + 48 * 60 * 60 * 1000
  }, JWT_SECRET);
}
```

## Access Control

### Role-Based Access Control (RBAC)
- **Roles**:
  1. Super Admin
  2. Manager
  3. Door Staff
- **Middleware-Enforced Permissions**
- **Granular Access Control**

```typescript
const ROLE_PERMISSIONS = {
  SUPER_ADMIN: ['*'],
  MANAGER: [
    'VIEW_BOOKINGS', 
    'MANAGE_STAFF', 
    'GENERATE_REPORTS'
  ],
  DOOR_STAFF: [
    'CHECK_IN_GUESTS', 
    'VIEW_CURRENT_EVENTS'
  ]
};
```

## Brute Force Protection

### Login Attempt Tracking
- **Rate Limiting**: 5 attempts per 15 minutes
- **Progressive Delays**
- **IP-Based Blocking**

```typescript
function checkLoginAttempts(ip: string, userId: string): boolean {
  const attempts = getRecentLoginAttempts(ip, userId);
  
  if (attempts.length >= 5) {
    const lastAttempt = attempts[attempts.length - 1];
    const blockDuration = calculateBlockDuration(attempts);
    
    if (Date.now() - lastAttempt.timestamp < blockDuration) {
      return false; // Block further attempts
    }
  }
  
  return true;
}
```

## Audit Logging

### Comprehensive Event Tracking
- **Authentication Events**
- **Role Changes**
- **Security Configuration Modifications**

```typescript
function logSecurityEvent(event: SecurityEvent) {
  securityAuditLog.create({
    type: event.type,
    userId: event.userId,
    ipAddress: event.ipAddress,
    timestamp: new Date(),
    details: event.details
  });
}
```

## Encryption Standards

### Data Protection
- **Rest**: AES-256-GCM
- **Transit**: TLS 1.3
- **Secrets**: Hardware Security Module (HSM) backed

## Compliance Checklist
- [x] WCAG 2.1 AA Accessibility
- [x] GDPR Data Protection
- [x] OWASP Top 10 Mitigation
- [x] SOC 2 Security Principles

## Recommended Monitoring
- Real-time anomaly detection
- Weekly security report generation
- Monthly comprehensive audit

## Emergency Procedures
1. Immediate token revocation
2. Force password reset
3. Detailed forensic logging
4. Incident response workflow