# Admin Authentication System Architecture

## System Overview
The authentication system for The Backroom Leeds is designed as a multi-tier, role-based access control (RBAC) platform built on Next.js and Auth.js, providing secure, granular access to administrative functions.

## Architecture Components

### 1. Authentication Layer
```typescript
interface AuthenticationLayer {
  providers: AuthProvider[];
  strategies: {
    passwordHash: 'argon2id';
    totpVerification: boolean;
    jwtTokenGeneration: boolean;
  };
  securityFeatures: {
    bruteForceProtection: boolean;
    rateLimiting: {
      maxAttempts: number;
      windowMs: number;
    };
  };
}
```

### 2. Role Hierarchy
```typescript
enum UserRole {
  SUPER_ADMIN = 'SUPER_ADMIN',
  MANAGER = 'MANAGER', 
  DOOR_STAFF = 'DOOR_STAFF'
}

interface RolePermissions {
  [UserRole.SUPER_ADMIN]: string[];
  [UserRole.MANAGER]: string[];
  [UserRole.DOOR_STAFF]: string[];
}
```

### 3. Database Schema
**Authentication Tables**:
- `users`: Primary user information
- `user_roles`: Role assignments
- `authentication_logs`: Login attempts and events
- `two_factor_secrets`: Encrypted 2FA secrets
- `access_tokens`: JWT token management
- `permission_groups`: Granular permission definitions
- `audit_trail`: Comprehensive action logging

## Security Implementations

### Password Management
- **Hashing**: Argon2id with configurable parameters
- **Salt Generation**: Cryptographically secure random salt
- **Pepper**: Additional server-side secret

### Two-Factor Authentication
- **Protocol**: Time-based One-Time Password (TOTP)
- **Library**: `otpauth`
- **Encryption**: AES-256-GCM for secret storage

### Token Management
- **Type**: JSON Web Tokens (JWT)
- **Expiration**: 48-hour rolling window
- **Claims**: 
  ```typescript
  interface TokenClaims {
    userId: string;
    role: UserRole;
    permissions: string[];
    issuedAt: number;
    expiresAt: number;
  }
  ```

## Access Control Middleware
```typescript
function adminAccessMiddleware(req, res, next) {
  const user = getCurrentUser(req);
  const requiredRole = determineRequiredRole(req.path);

  if (!hasRequiredRole(user, requiredRole)) {
    return res.status(403).json({ error: 'Unauthorized' });
  }

  // Log administrative access attempt
  logAdminAccess(user, req.path);
  next();
}
```

## Dashboard Access Matrix

### Super Admin Dashboard
- **Full System Configuration**
- **User Management**
  - Create/Delete Users
  - Modify Roles
  - Reset 2FA
- **Security Monitoring**
  - View Authentication Logs
  - Access Audit Trails
  - Configure Security Settings

### Manager Dashboard
- **Venue Operations**
  - Booking Management
  - Staff Scheduling
  - Limited User Administration
- **Reporting**
  - Generate Operational Reports
  - View Performance Metrics

### Door Staff Dashboard
- **Guest Management**
  - QR Code Check-In
  - Real-Time Guest Tracking
  - Basic Event Monitoring

## Performance Considerations
- **Caching**: Redis-based token caching
- **Query Optimization**: Indexed database queries
- **Rate Limiting**: Per-IP and per-user request throttling

## Compliance and Standards
- WCAG 2.1 AA Accessibility
- GDPR Data Protection
- OWASP Security Recommendations

## Extensibility
The architecture supports easy role and permission modifications through a flexible, configuration-driven approach.