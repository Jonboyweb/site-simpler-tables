import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

// Route protection middleware with NextAuth authentication
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Get JWT token from NextAuth
  const token = await getToken({ 
    req: request, 
    secret: process.env.NEXTAUTH_SECRET 
  });

  // Create a response object
  const response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  // Admin route protection
  if (pathname.startsWith('/admin')) {
    // Skip login page
    if (pathname === '/admin/login') {
      // If already authenticated, redirect to dashboard
      if (token) {
        return NextResponse.redirect(new URL('/admin/dashboard', request.url))
      }
      return response;
    }

    // Check if user is authenticated and is an admin user
    if (!token) {
      const loginUrl = new URL('/admin/login', request.url);
      loginUrl.searchParams.set('from', pathname);
      return NextResponse.redirect(loginUrl);
    }

    // Check role-based access for specific paths
    const userRole = token.role as string;
    
    // Super admin only routes
    if (pathname.startsWith('/admin/staff') && userRole !== 'super_admin') {
      return NextResponse.redirect(new URL('/admin/dashboard', request.url));
    }
    
    // Manager and Super admin only routes
    if ((pathname.startsWith('/admin/finance') || pathname.startsWith('/admin/reports')) 
        && !['super_admin', 'manager'].includes(userRole)) {
      return NextResponse.redirect(new URL('/admin/dashboard', request.url));
    }

    // Add user context headers
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
    // Check if user is authenticated
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

    // Add user context headers for API routes
    response.headers.set('x-auth-user', token.sub || '');
    response.headers.set('x-auth-role', token.role as string);
    
    if (process.env.NODE_ENV === 'development') {
      response.headers.set('x-development-mode', 'true');
      response.headers.set('x-auth-email', token.email || '');
    }

    return response;
  }

  // Rate limiting for booking API (to be implemented with actual rate limiting)
  if (pathname.startsWith('/api/bookings') && request.method === 'POST') {
    response.headers.set('x-rate-limit-remaining', '50');
    response.headers.set('x-rate-limit-reset', String(Date.now() + 3600000));
    return response;
  }

  // Return response with any authentication cookies set
  return response;
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