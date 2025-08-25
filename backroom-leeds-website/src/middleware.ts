import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Route protection middleware
// This will be fully implemented in Phase 3 with NextAuth.js

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Admin route protection
  if (pathname.startsWith('/admin')) {
    // Skip login page
    if (pathname === '/admin/login') {
      return NextResponse.next();
    }

    // For development, allow access to admin routes
    // In production, this will check for valid authentication
    if (process.env.NODE_ENV === 'development') {
      const response = NextResponse.next();
      response.headers.set('x-development-mode', 'true');
      response.headers.set('x-auth-required', 'true');
      return response;
    }

    // In production, redirect to login if not authenticated
    const loginUrl = new URL('/admin/login', request.url);
    loginUrl.searchParams.set('from', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // API route protection
  if (pathname.startsWith('/api/admin')) {
    // For development, allow API access with headers
    if (process.env.NODE_ENV === 'development') {
      const response = NextResponse.next();
      response.headers.set('x-development-mode', 'true');
      response.headers.set('x-admin-api', 'true');
      return response;
    }

    // In production, require authentication for admin API routes
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

  // Rate limiting for booking API (to be implemented with actual rate limiting)
  if (pathname.startsWith('/api/bookings') && request.method === 'POST') {
    const response = NextResponse.next();
    response.headers.set('x-rate-limit-remaining', '50');
    response.headers.set('x-rate-limit-reset', String(Date.now() + 3600000));
    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};