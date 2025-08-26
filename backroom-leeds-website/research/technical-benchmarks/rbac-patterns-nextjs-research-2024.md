# RBAC Patterns in Next.js Research 2024
*The Backroom Leeds - Role-Based Access Control Implementation*

## Executive Summary

This research analyzes Role-Based Access Control (RBAC) patterns for The Backroom Leeds admin system using Next.js 15.5, focusing on middleware-level protection, component-level authorization, and API endpoint security. Primary recommendation: **Auth.js v5 with middleware-based RBAC** for comprehensive three-tier admin system (Super Admin, Manager, Door Staff).

---

## 1. RBAC Authentication Libraries Comparison

### 1.1 Auth.js v5 (NextAuth.js) (RECOMMENDED)

**Version**: 5.0.0+ (2024)
**TypeScript Support**: ✅ Native TypeScript
**Security Rating**: ⭐⭐⭐⭐⭐
**RBAC Support**: Built-in with JWT and session strategies

**Key Features 2024**:
- Middleware-based route protection
- JWT token role enhancement
- Dynamic route matching with regex patterns
- Type-safe role definitions
- Session-based and JWT-based RBAC

**Installation**:
```bash
npm install next-auth@beta @auth/prisma-adapter
npm install @types/jsonwebtoken jsonwebtoken
```

**Basic Configuration**:
```typescript
// lib/auth.ts
import NextAuth from 'next-auth';
import { JWT } from 'next-auth/jwt';

declare module 'next-auth' {
  interface User {
    role: 'SUPER_ADMIN' | 'MANAGER' | 'DOOR_STAFF';
    permissions: string[];
  }
  
  interface Session {
    user: User & {
      id: string;
      role: 'SUPER_ADMIN' | 'MANAGER' | 'DOOR_STAFF';
      permissions: string[];
    };
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    role: 'SUPER_ADMIN' | 'MANAGER' | 'DOOR_STAFF';
    permissions: string[];
  }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    // Your providers here
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role;
        token.permissions = user.permissions;
      }
      return token;
    },
    async session({ session, token }) {
      session.user.role = token.role;
      session.user.permissions = token.permissions;
      return session;
    },
    async signIn({ user, account }) {
      // Additional sign-in logic
      if (user.role && ['SUPER_ADMIN', 'MANAGER', 'DOOR_STAFF'].includes(user.role)) {
        return true;
      }
      return false;
    }
  }
});
```

### 1.2 Clerk (Alternative)

**Version**: 4.29.0+ (2024)
**TypeScript Support**: ✅ Native TypeScript
**Security Rating**: ⭐⭐⭐⭐⭐
**RBAC Approach**: User metadata and organizations

**Strengths**:
- Built-in user management UI
- Organizations and role management
- Excellent developer experience
- Real-time session updates

**Limitations for The Backroom Leeds**:
- Additional cost for advanced features
- Less customization for venue-specific needs
- Overkill for three-role system

### 1.3 Supabase Auth (Integration Option)

**Version**: 2.38.0+ (2024)
**Integration**: Works with existing Supabase backend
**RBAC Approach**: Custom implementation required

**Consideration**: Good if already using Supabase, but requires manual RBAC implementation.

---

## 2. The Backroom Leeds Role Hierarchy

### 2.1 Role Definitions

```typescript
// types/auth.ts
export enum AdminRole {
  SUPER_ADMIN = 'SUPER_ADMIN',
  MANAGER = 'MANAGER',
  DOOR_STAFF = 'DOOR_STAFF'
}

export interface Permission {
  resource: string;
  action: 'create' | 'read' | 'update' | 'delete' | 'manage';
}

export const ROLE_PERMISSIONS: Record<AdminRole, Permission[]> = {
  [AdminRole.SUPER_ADMIN]: [
    { resource: '*', action: 'manage' }, // All permissions
  ],
  [AdminRole.MANAGER]: [
    { resource: 'bookings', action: 'manage' },
    { resource: 'events', action: 'manage' },
    { resource: 'reports', action: 'read' },
    { resource: 'floor-plan', action: 'read' },
    { resource: 'staff', action: 'read' }
  ],
  [AdminRole.DOOR_STAFF]: [
    { resource: 'bookings', action: 'read' },
    { resource: 'bookings', action: 'update' }, // Check-in only
    { resource: 'floor-plan', action: 'read' }
  ]
};
```

### 2.2 Permission Hierarchy Logic

```typescript
// lib/permissions.ts
export const hasPermission = (
  userRole: AdminRole,
  resource: string,
  action: string
): boolean => {
  const permissions = ROLE_PERMISSIONS[userRole];
  
  // Super Admin has all permissions
  if (userRole === AdminRole.SUPER_ADMIN) {
    return true;
  }
  
  // Check specific permissions
  return permissions.some(permission => {
    const resourceMatch = permission.resource === '*' || permission.resource === resource;
    const actionMatch = permission.action === 'manage' || permission.action === action;
    return resourceMatch && actionMatch;
  });
};

export const checkRole = (requiredRole: AdminRole, userRole: AdminRole): boolean => {
  const hierarchy = {
    [AdminRole.SUPER_ADMIN]: 3,
    [AdminRole.MANAGER]: 2,
    [AdminRole.DOOR_STAFF]: 1
  };
  
  return hierarchy[userRole] >= hierarchy[requiredRole];
};
```

---

## 3. Middleware-Level Route Protection

### 3.1 Core Middleware Implementation

```typescript
// middleware.ts
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { hasPermission, AdminRole } from '@/lib/permissions';

// Route protection configuration
const PROTECTED_ROUTES = {
  '/admin/dashboard': { role: AdminRole.DOOR_STAFF, permission: { resource: 'dashboard', action: 'read' } },
  '/admin/bookings': { role: AdminRole.DOOR_STAFF, permission: { resource: 'bookings', action: 'read' } },
  '/admin/bookings/manage': { role: AdminRole.MANAGER, permission: { resource: 'bookings', action: 'manage' } },
  '/admin/events': { role: AdminRole.MANAGER, permission: { resource: 'events', action: 'read' } },
  '/admin/events/create': { role: AdminRole.MANAGER, permission: { resource: 'events', action: 'create' } },
  '/admin/reports': { role: AdminRole.MANAGER, permission: { resource: 'reports', action: 'read' } },
  '/admin/users': { role: AdminRole.SUPER_ADMIN, permission: { resource: 'users', action: 'manage' } }
};

// Dynamic route patterns
const DYNAMIC_ROUTE_PATTERNS = [
  {
    pattern: /^\/admin\/bookings\/(\d+)$/,
    role: AdminRole.DOOR_STAFF,
    permission: { resource: 'bookings', action: 'read' }
  },
  {
    pattern: /^\/admin\/bookings\/(\d+)\/edit$/,
    role: AdminRole.MANAGER,
    permission: { resource: 'bookings', action: 'update' }
  },
  {
    pattern: /^\/admin\/events\/(\d+)$/,
    role: AdminRole.MANAGER,
    permission: { resource: 'events', action: 'read' }
  }
];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Skip middleware for non-admin routes
  if (!pathname.startsWith('/admin')) {
    return NextResponse.next();
  }
  
  // Get session
  const session = await auth();
  
  // Redirect to login if not authenticated
  if (!session?.user) {
    return NextResponse.redirect(new URL('/admin/login', request.url));
  }

  const user = session.user;
  
  // Check for 2FA requirement
  if (user.role !== AdminRole.DOOR_STAFF && !user.twoFactorVerified) {
    return NextResponse.redirect(new URL('/admin/2fa-verify', request.url));
  }

  // Check exact route match
  const routeConfig = PROTECTED_ROUTES[pathname];
  if (routeConfig) {
    if (!checkRole(routeConfig.role, user.role)) {
      return NextResponse.redirect(new URL('/admin/unauthorized', request.url));
    }
    
    if (!hasPermission(user.role, routeConfig.permission.resource, routeConfig.permission.action)) {
      return NextResponse.redirect(new URL('/admin/unauthorized', request.url));
    }
  }

  // Check dynamic route patterns
  const dynamicMatch = DYNAMIC_ROUTE_PATTERNS.find(pattern => 
    pattern.pattern.test(pathname)
  );
  
  if (dynamicMatch) {
    if (!checkRole(dynamicMatch.role, user.role)) {
      return NextResponse.redirect(new URL('/admin/unauthorized', request.url));
    }
    
    if (!hasPermission(user.role, dynamicMatch.permission.resource, dynamicMatch.permission.action)) {
      return NextResponse.redirect(new URL('/admin/unauthorized', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/admin/:path*',
    '/api/admin/:path*'
  ]
};
```

### 3.2 API Route Protection

```typescript
// lib/api-auth.ts
import { NextRequest } from 'next/server';
import { auth } from '@/lib/auth';
import { hasPermission, AdminRole } from '@/lib/permissions';

export interface APIAuthOptions {
  requiredRole?: AdminRole;
  requiredPermission?: {
    resource: string;
    action: string;
  };
}

export const withAuth = (handler: Function, options: APIAuthOptions = {}) => {
  return async (request: NextRequest, ...args: any[]) => {
    const session = await auth();
    
    if (!session?.user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const user = session.user;

    // Check role requirement
    if (options.requiredRole && !checkRole(options.requiredRole, user.role)) {
      return new Response(JSON.stringify({ error: 'Insufficient permissions' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Check specific permission
    if (options.requiredPermission) {
      const { resource, action } = options.requiredPermission;
      if (!hasPermission(user.role, resource, action)) {
        return new Response(JSON.stringify({ error: 'Permission denied' }), {
          status: 403,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    }

    // Check 2FA for sensitive operations
    if (user.role !== AdminRole.DOOR_STAFF && !user.twoFactorVerified) {
      return new Response(JSON.stringify({ error: '2FA verification required' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return handler(request, ...args);
  };
};
```

**Usage in API Routes**:
```typescript
// app/api/admin/bookings/route.ts
import { NextRequest } from 'next/server';
import { withAuth, AdminRole } from '@/lib/api-auth';

const handler = async (request: NextRequest) => {
  // Your API logic here
  return new Response(JSON.stringify({ bookings: [] }));
};

export const GET = withAuth(handler, {
  requiredRole: AdminRole.DOOR_STAFF,
  requiredPermission: { resource: 'bookings', action: 'read' }
});

export const POST = withAuth(handler, {
  requiredRole: AdminRole.MANAGER,
  requiredPermission: { resource: 'bookings', action: 'create' }
});
```

---

## 4. Component-Level Authorization

### 4.1 Permission-Based Component Rendering

```typescript
// components/auth/PermissionGuard.tsx
'use client';

import { useSession } from 'next-auth/react';
import { hasPermission, AdminRole } from '@/lib/permissions';
import { ReactNode } from 'react';

interface PermissionGuardProps {
  children: ReactNode;
  requiredRole?: AdminRole;
  requiredPermission?: {
    resource: string;
    action: string;
  };
  fallback?: ReactNode;
  exact?: boolean; // Exact role match vs minimum role
}

export const PermissionGuard: React.FC<PermissionGuardProps> = ({
  children,
  requiredRole,
  requiredPermission,
  fallback = null,
  exact = false
}) => {
  const { data: session, status } = useSession();

  if (status === 'loading') {
    return <div className="animate-pulse">Loading...</div>;
  }

  if (!session?.user) {
    return <>{fallback}</>;
  }

  const user = session.user;

  // Check role requirement
  if (requiredRole) {
    const hasRequiredRole = exact 
      ? user.role === requiredRole
      : checkRole(requiredRole, user.role);
    
    if (!hasRequiredRole) {
      return <>{fallback}</>;
    }
  }

  // Check permission requirement
  if (requiredPermission) {
    const { resource, action } = requiredPermission;
    if (!hasPermission(user.role, resource, action)) {
      return <>{fallback}</>;
    }
  }

  return <>{children}</>;
};
```

**Usage Examples**:
```typescript
// Admin dashboard with conditional features
export const AdminDashboard = () => {
  return (
    <div className="admin-dashboard">
      <h1>Dashboard</h1>
      
      {/* All admin roles can see bookings overview */}
      <PermissionGuard requiredRole={AdminRole.DOOR_STAFF}>
        <BookingsOverview />
      </PermissionGuard>

      {/* Only managers and super admins can create events */}
      <PermissionGuard 
        requiredRole={AdminRole.MANAGER}
        requiredPermission={{ resource: 'events', action: 'create' }}
      >
        <CreateEventButton />
      </PermissionGuard>

      {/* Only super admins can manage users */}
      <PermissionGuard 
        requiredRole={AdminRole.SUPER_ADMIN}
        exact={true}
      >
        <UserManagementPanel />
      </PermissionGuard>
    </div>
  );
};
```

### 4.2 Hook-Based Permission Checking

```typescript
// hooks/usePermissions.ts
import { useSession } from 'next-auth/react';
import { hasPermission, checkRole, AdminRole } from '@/lib/permissions';

export const usePermissions = () => {
  const { data: session } = useSession();

  const can = (resource: string, action: string): boolean => {
    if (!session?.user?.role) return false;
    return hasPermission(session.user.role, resource, action);
  };

  const hasRole = (role: AdminRole, exact: boolean = false): boolean => {
    if (!session?.user?.role) return false;
    return exact 
      ? session.user.role === role
      : checkRole(role, session.user.role);
  };

  const isAuthenticated = (): boolean => {
    return !!session?.user;
  };

  const is2FAVerified = (): boolean => {
    return session?.user?.twoFactorVerified || false;
  };

  return {
    can,
    hasRole,
    isAuthenticated,
    is2FAVerified,
    user: session?.user,
    role: session?.user?.role
  };
};
```

**Hook Usage**:
```typescript
// components/admin/BookingActions.tsx
import { usePermissions } from '@/hooks/usePermissions';

export const BookingActions = ({ booking }: { booking: Booking }) => {
  const { can, hasRole } = usePermissions();

  return (
    <div className="booking-actions">
      {/* All staff can check in */}
      {can('bookings', 'update') && (
        <button onClick={() => checkInBooking(booking.id)}>
          Check In
        </button>
      )}

      {/* Only managers can modify bookings */}
      {can('bookings', 'manage') && (
        <button onClick={() => editBooking(booking.id)}>
          Edit Booking
        </button>
      )}

      {/* Only super admins can delete */}
      {hasRole(AdminRole.SUPER_ADMIN) && (
        <button onClick={() => deleteBooking(booking.id)}>
          Delete Booking
        </button>
      )}
    </div>
  );
};
```

---

## 5. Advanced RBAC Patterns

### 5.1 Context-Based Permissions

```typescript
// lib/context-permissions.ts
export interface PermissionContext {
  booking?: {
    id: string;
    createdBy?: string;
    status: string;
  };
  event?: {
    id: string;
    date: Date;
  };
}

export const hasContextualPermission = (
  userRole: AdminRole,
  userId: string,
  resource: string,
  action: string,
  context?: PermissionContext
): boolean => {
  // Base permission check
  if (!hasPermission(userRole, resource, action)) {
    return false;
  }

  // Additional contextual checks
  if (context?.booking) {
    // Door staff can only check in bookings for today's events
    if (userRole === AdminRole.DOOR_STAFF && action === 'update') {
      const today = new Date().toDateString();
      const bookingDate = new Date(context.booking.status).toDateString();
      return today === bookingDate;
    }

    // Users can only modify their own created bookings
    if (context.booking.createdBy && action === 'update') {
      return context.booking.createdBy === userId || userRole === AdminRole.SUPER_ADMIN;
    }
  }

  return true;
};
```

### 5.2 Time-Based Permissions

```typescript
// lib/time-permissions.ts
export const hasTimeBasedPermission = (
  userRole: AdminRole,
  action: string
): boolean => {
  const now = new Date();
  const hour = now.getHours();
  const dayOfWeek = now.getDay();

  // Door staff can only check in during venue hours
  if (userRole === AdminRole.DOOR_STAFF && action === 'update') {
    // Venue hours: Wed-Sat 8PM-3AM, Sun 6PM-2AM
    const isWeekend = [0, 3, 4, 5, 6].includes(dayOfWeek); // Sun, Wed-Sat
    const isVenueHours = (hour >= 20 || hour <= 3) || (dayOfWeek === 0 && hour >= 18 && hour <= 2);
    
    return isWeekend && isVenueHours;
  }

  return true;
};
```

### 5.3 Resource Ownership Patterns

```typescript
// lib/ownership.ts
export const checkResourceOwnership = async (
  userId: string,
  userRole: AdminRole,
  resourceType: string,
  resourceId: string
): Promise<boolean> => {
  // Super admins can access everything
  if (userRole === AdminRole.SUPER_ADMIN) {
    return true;
  }

  // Check database for ownership
  switch (resourceType) {
    case 'booking':
      const booking = await db.booking.findUnique({
        where: { id: resourceId },
        select: { createdBy: true }
      });
      return booking?.createdBy === userId || userRole === AdminRole.MANAGER;

    case 'event':
      const event = await db.event.findUnique({
        where: { id: resourceId },
        select: { createdBy: true }
      });
      return event?.createdBy === userId || userRole === AdminRole.MANAGER;

    default:
      return false;
  }
};
```

---

## 6. Session Management and Security

### 6.1 Session Configuration

```typescript
// lib/auth.ts - Session configuration
export const authConfig = {
  session: {
    strategy: 'jwt' as const,
    maxAge: 8 * 60 * 60, // 8 hours for admin sessions
    updateAge: 60 * 60,  // Update every hour
  },
  jwt: {
    maxAge: 8 * 60 * 60, // Match session maxAge
  },
  pages: {
    signIn: '/admin/login',
    error: '/admin/error',
  },
  callbacks: {
    async jwt({ token, user, trigger }) {
      // Refresh token data periodically
      if (trigger === 'update' || (Date.now() - token.lastUpdated > 60 * 60 * 1000)) {
        // Refresh user data from database
        const updatedUser = await getUserById(token.sub);
        if (updatedUser) {
          token.role = updatedUser.role;
          token.permissions = updatedUser.permissions;
          token.twoFactorVerified = updatedUser.twoFactorVerified;
          token.lastUpdated = Date.now();
        }
      }
      return token;
    }
  }
};
```

### 6.2 Session Invalidation

```typescript
// lib/session-management.ts
export const invalidateUserSessions = async (userId: string) => {
  // For JWT strategy, we need to maintain a blacklist
  const blacklistKey = `session_blacklist:${userId}`;
  await redis.set(blacklistKey, Date.now(), 'EX', 8 * 60 * 60); // 8 hours
};

export const isSessionBlacklisted = async (userId: string, tokenIssuedAt: number) => {
  const blacklistKey = `session_blacklist:${userId}`;
  const blacklistedAt = await redis.get(blacklistKey);
  
  if (blacklistedAt && parseInt(blacklistedAt) > tokenIssuedAt * 1000) {
    return true;
  }
  
  return false;
};
```

---

## 7. Testing RBAC Implementation

### 7.1 Unit Tests for Permissions

```typescript
// __tests__/permissions.test.ts
import { hasPermission, checkRole, AdminRole } from '@/lib/permissions';

describe('RBAC Permissions', () => {
  test('Super Admin has all permissions', () => {
    expect(hasPermission(AdminRole.SUPER_ADMIN, 'any-resource', 'any-action')).toBe(true);
  });

  test('Manager can manage bookings and events', () => {
    expect(hasPermission(AdminRole.MANAGER, 'bookings', 'create')).toBe(true);
    expect(hasPermission(AdminRole.MANAGER, 'events', 'update')).toBe(true);
    expect(hasPermission(AdminRole.MANAGER, 'users', 'delete')).toBe(false);
  });

  test('Door Staff has limited permissions', () => {
    expect(hasPermission(AdminRole.DOOR_STAFF, 'bookings', 'read')).toBe(true);
    expect(hasPermission(AdminRole.DOOR_STAFF, 'bookings', 'update')).toBe(true);
    expect(hasPermission(AdminRole.DOOR_STAFF, 'events', 'create')).toBe(false);
  });

  test('Role hierarchy works correctly', () => {
    expect(checkRole(AdminRole.DOOR_STAFF, AdminRole.MANAGER)).toBe(true);
    expect(checkRole(AdminRole.MANAGER, AdminRole.DOOR_STAFF)).toBe(false);
  });
});
```

### 7.2 Integration Tests

```typescript
// __tests__/rbac-integration.test.ts
import { testApiHandler } from 'next-test-api-route-handler';
import handler from '@/app/api/admin/bookings/route';

describe('/api/admin/bookings RBAC', () => {
  test('allows Door Staff to read bookings', async () => {
    await testApiHandler({
      handler,
      url: '/api/admin/bookings',
      test: async ({ fetch }) => {
        const res = await fetch({
          method: 'GET',
          headers: {
            authorization: getDoorStaffToken()
          }
        });
        
        expect(res.status).toBe(200);
      }
    });
  });

  test('denies Door Staff from creating bookings', async () => {
    await testApiHandler({
      handler,
      url: '/api/admin/bookings',
      test: async ({ fetch }) => {
        const res = await fetch({
          method: 'POST',
          headers: {
            authorization: getDoorStaffToken()
          },
          body: JSON.stringify({})
        });
        
        expect(res.status).toBe(403);
      }
    });
  });
});
```

---

## 8. Implementation Recommendations

### 8.1 Phased Rollout Strategy

**Phase 1: Basic RBAC** (Week 1)
- Implement three-role system
- Basic middleware protection
- Component-level guards

**Phase 2: Advanced Features** (Week 2)
- Contextual permissions
- Time-based restrictions
- Resource ownership

**Phase 3: Security Hardening** (Week 3)
- Session management
- 2FA integration
- Audit logging

### 8.2 Security Best Practices

1. **Principle of Least Privilege**: Give users minimum required permissions
2. **Defense in Depth**: Multiple layers of authorization (middleware, API, component)
3. **Regular Permission Audits**: Automated checks for permission consistency
4. **Session Security**: Short-lived sessions with proper invalidation
5. **Audit Logging**: Comprehensive logs of all permission checks

### 8.3 Database Schema Requirements

```sql
-- Admin users table
CREATE TABLE admin_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role admin_role NOT NULL DEFAULT 'DOOR_STAFF',
  permissions JSONB DEFAULT '[]',
  totp_enabled BOOLEAN DEFAULT FALSE,
  totp_secret VARCHAR(255),
  totp_verified BOOLEAN DEFAULT FALSE,
  last_login TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create enum for roles
CREATE TYPE admin_role AS ENUM ('SUPER_ADMIN', 'MANAGER', 'DOOR_STAFF');

-- Audit log for permissions
CREATE TABLE permission_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES admin_users(id),
  action VARCHAR(100) NOT NULL,
  resource VARCHAR(100) NOT NULL,
  permission_granted BOOLEAN NOT NULL,
  context JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
```

---

**Research Date**: August 26, 2024  
**Next Review**: December 2024  
**Confidence Level**: High (5/5)

This research provides comprehensive guidance for implementing secure, scalable RBAC in The Backroom Leeds admin system, with Auth.js v5 as the recommended foundation for multi-layer permission control.