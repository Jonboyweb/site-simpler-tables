import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr'
import type { Database } from '@/types/database.types'

// Route protection middleware with Supabase authentication
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Create a response object
  const response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  // Create Supabase client for middleware
  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          const cookieNames = request.cookies.getAll().map(c => c.name)
          return cookieNames.map(name => ({
            name,
            value: request.cookies.get(name)?.value || ''
          }))
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Get current user for authentication checks
  const { data: { user } } = await supabase.auth.getUser()

  // Admin route protection
  if (pathname.startsWith('/admin')) {
    // Skip login page
    if (pathname === '/admin/login') {
      // If already authenticated, redirect to dashboard
      if (user) {
        return NextResponse.redirect(new URL('/admin/dashboard', request.url))
      }
      return response;
    }

    // Check if user is authenticated and is an admin user
    if (!user) {
      const loginUrl = new URL('/admin/login', request.url);
      loginUrl.searchParams.set('from', pathname);
      return NextResponse.redirect(loginUrl);
    }

    // In development mode, add helpful headers
    if (process.env.NODE_ENV === 'development') {
      response.headers.set('x-development-mode', 'true');
      response.headers.set('x-auth-user', user.id);
      response.headers.set('x-auth-email', user.email || '');
    }

    return response;
  }

  // API route protection
  if (pathname.startsWith('/api/admin')) {
    // Check if user is authenticated
    if (!user) {
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
    response.headers.set('x-auth-user', user.id);
    response.headers.set('x-auth-email', user.email || '');
    
    if (process.env.NODE_ENV === 'development') {
      response.headers.set('x-development-mode', 'true');
      response.headers.set('x-admin-api', 'true');
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