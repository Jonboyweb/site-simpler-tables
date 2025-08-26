import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

const ROUTE_PERMISSIONS = {
  '/admin/staff': ['super_admin'],
  '/admin/customers': ['super_admin', 'manager'],
  '/admin/finance': ['super_admin', 'manager'],
  '/admin/settings': ['super_admin'],
  '/admin/users': ['super_admin'],
  '/admin/reports': ['super_admin', 'manager'],
} as const;

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  if (pathname.startsWith('/admin')) {
    if (pathname === '/admin/login') {
      const token = await getToken({ req: request });
      if (token) {
        return NextResponse.redirect(new URL('/admin/dashboard', request.url));
      }
      return NextResponse.next();
    }

    const token = await getToken({ req: request });
    
    if (!token) {
      return NextResponse.redirect(new URL('/admin/login?error=SessionRequired', request.url));
    }

    // Enhanced role-based access control
    const userRole = token.role as string;
    const requiredRoles = getRequiredRolesForPath(pathname);
    
    if (requiredRoles.length > 0 && !requiredRoles.includes(userRole)) {
      return NextResponse.redirect(new URL('/admin/dashboard?error=InsufficientPermissions', request.url));
    }

    const response = NextResponse.next();
    
    // Critical security headers
    response.headers.set('X-Frame-Options', 'DENY');
    response.headers.set('X-Content-Type-Options', 'nosniff');
    response.headers.set('X-XSS-Protection', '1; mode=block');
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
    
    // User context headers
    response.headers.set('x-auth-user', token.sub || '');
    response.headers.set('x-auth-role', userRole);
    
    if (process.env.NODE_ENV === 'development') {
      response.headers.set('x-development-mode', 'true');
      response.headers.set('x-auth-email', token.email || '');
    }
    
    return response;
  }

  // API route protection
  if (pathname.startsWith('/api/admin')) {
    const token = await getToken({ req: request });
    
    if (!token) {
      return new NextResponse(
        JSON.stringify({
          error: 'Authentication required',
          message: 'This endpoint requires admin authentication',
          status: 401
        }),
        {
          status: 401,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
    }

    // API role-based access control
    const userRole = token.role as string;
    const apiPath = pathname.replace('/api', '');
    const requiredRoles = getRequiredRolesForPath(apiPath);
    
    if (requiredRoles.length > 0 && !requiredRoles.includes(userRole)) {
      return new NextResponse(
        JSON.stringify({
          error: 'Insufficient permissions',
          message: 'Access denied for this endpoint',
          status: 403
        }),
        {
          status: 403,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
    }

    const response = NextResponse.next();
    response.headers.set('x-auth-user', token.sub || '');
    response.headers.set('x-auth-role', userRole);
    
    if (process.env.NODE_ENV === 'development') {
      response.headers.set('x-development-mode', 'true');
      response.headers.set('x-auth-email', token.email || '');
    }

    return response;
  }

  // Rate limiting for booking API (to be implemented with actual rate limiting)
  if (pathname.startsWith('/api/bookings') && request.method === 'POST') {
    const response = NextResponse.next();
    response.headers.set('x-rate-limit-remaining', '50');
    response.headers.set('x-rate-limit-reset', String(Date.now() + 3600000));
    return response;
  }

  return NextResponse.next();
}

function getRequiredRolesForPath(pathname: string): string[] {
  for (const [route, roles] of Object.entries(ROUTE_PERMISSIONS)) {
    if (pathname.startsWith(route)) {
      return roles;
    }
  }
  return [];
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};