/**
 * Admin User Management API Routes
 * The Backroom Leeds - Super Admin User CRUD Operations
 * 
 * POST /api/admin/users - Create new admin user (Super Admin only)
 * GET /api/admin/users - List all admin users with filtering (Super Admin only)
 */

import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import {
  validateSession,
  createAdminUser,
  getUserByEmail,
  getRolePermissions,
  logActivity,
  checkLoginRateLimit
} from '@/lib/auth/database-helpers';
import {
  AdminRole,
  CreateUserRequest,
  userHasPermission
} from '@/types/authentication.types';
import { createClient } from '@/lib/supabase/server';

// Get client IP address
function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const realIP = request.headers.get('x-real-ip');
  
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  
  if (realIP) {
    return realIP;
  }
  
  return '127.0.0.1';
}

/**
 * GET /api/admin/users
 * List all admin users with filtering and sorting
 */
export async function GET(request: NextRequest) {
  try {
    // Get session token from cookie
    const sessionToken = request.cookies.get('session-token')?.value;
    
    if (!sessionToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Validate session and check permissions
    const sessionValidation = await validateSession(sessionToken);
    
    if (!sessionValidation.valid || !sessionValidation.user) {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
    }
    
    // Only super admins can manage users
    if (!userHasPermission(sessionValidation.user.role as AdminRole, 'users:read')) {
      return NextResponse.json({ 
        error: 'Insufficient permissions. Super Admin access required.' 
      }, { status: 403 });
    }
    
    // Get query parameters for filtering
    const { searchParams } = new URL(request.url);
    const role = searchParams.get('role') as AdminRole | null;
    const status = searchParams.get('status'); // 'active' | 'inactive'
    const search = searchParams.get('search');
    const sortBy = searchParams.get('sortBy') || 'created_at';
    const sortOrder = searchParams.get('sortOrder') || 'desc';
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100);
    const offset = parseInt(searchParams.get('offset') || '0');
    
    const supabase = createClient();
    
    // Build query
    let query = supabase
      .from('admin_users')
      .select('*', { count: 'exact' })
      .is('deleted_at', null); // Only active users
    
    // Apply filters
    if (role) {
      query = query.eq('role', role);
    }
    
    if (status === 'active') {
      query = query.eq('is_active', true);
    } else if (status === 'inactive') {
      query = query.eq('is_active', false);
    }
    
    if (search) {
      query = query.or(
        `full_name.ilike.%${search}%,email.ilike.%${search}%,username.ilike.%${search}%`
      );
    }
    
    // Apply sorting
    query = query.order(sortBy, { ascending: sortOrder === 'asc' });
    
    // Apply pagination
    query = query.range(offset, offset + limit - 1);
    
    const { data: users, count, error } = await query;
    
    if (error) {
      console.error('Error fetching users:', error);
      return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
    }
    
    // Get role counts for limits enforcement
    const { data: roleCounts } = await supabase
      .from('admin_users')
      .select('role')
      .is('deleted_at', null)
      .eq('is_active', true);
    
    const roleCountMap = {
      [AdminRole.SUPER_ADMIN]: roleCounts?.filter(u => u.role === AdminRole.SUPER_ADMIN).length || 0,
      [AdminRole.MANAGER]: roleCounts?.filter(u => u.role === AdminRole.MANAGER).length || 0,
      [AdminRole.DOOR_STAFF]: roleCounts?.filter(u => u.role === AdminRole.DOOR_STAFF).length || 0
    };
    
    // Log activity
    await logActivity({
      userId: sessionValidation.user.id,
      action: 'users:read' as any,
      metadata: {
        filters: { role, status, search },
        pagination: { limit, offset },
        resultsCount: users?.length || 0
      },
      ipAddress: getClientIP(request),
      userAgent: request.headers.get('user-agent') || undefined
    });
    
    return NextResponse.json({
      users: users || [],
      pagination: {
        total: count || 0,
        limit,
        offset,
        hasMore: count ? offset + limit < count : false
      },
      roleCounts: roleCountMap
    });
    
  } catch (error) {
    console.error('Error in GET /api/admin/users:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * POST /api/admin/users
 * Create a new admin user
 */
export async function POST(request: NextRequest) {
  try {
    // Get session token from cookie
    const sessionToken = request.cookies.get('session-token')?.value;
    
    if (!sessionToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Validate session and check permissions
    const sessionValidation = await validateSession(sessionToken);
    
    if (!sessionValidation.valid || !sessionValidation.user) {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
    }
    
    // Only super admins can create users
    if (!userHasPermission(sessionValidation.user.role as AdminRole, 'users:create')) {
      return NextResponse.json({ 
        error: 'Insufficient permissions. Super Admin access required.' 
      }, { status: 403 });
    }
    
    // Parse request body
    const body: CreateUserRequest = await request.json();
    
    // Validate required fields
    const requiredFields = ['full_name', 'email', 'username', 'password', 'role'];
    for (const field of requiredFields) {
      if (!body[field as keyof CreateUserRequest]) {
        return NextResponse.json({ 
          error: `Missing required field: ${field}` 
        }, { status: 400 });
      }
    }
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(body.email)) {
      return NextResponse.json({ 
        error: 'Invalid email format' 
      }, { status: 400 });
    }
    
    // Validate username format
    if (!/^[a-z0-9_]+$/.test(body.username)) {
      return NextResponse.json({ 
        error: 'Username can only contain lowercase letters, numbers, and underscores' 
      }, { status: 400 });
    }
    
    // Check if user already exists
    const existingUser = await getUserByEmail(body.email);
    if (existingUser) {
      return NextResponse.json({ 
        error: 'User with this email already exists' 
      }, { status: 409 });
    }
    
    // Check username uniqueness
    const supabase = createClient();
    const { data: existingUsername } = await supabase
      .from('admin_users')
      .select('id')
      .eq('username', body.username.toLowerCase())
      .single();
    
    if (existingUsername) {
      return NextResponse.json({ 
        error: 'Username is already taken' 
      }, { status: 409 });
    }
    
    // Get current role counts
    const { data: roleCounts } = await supabase
      .from('admin_users')
      .select('role')
      .is('deleted_at', null)
      .eq('is_active', true);
    
    const currentCount = roleCounts?.filter(u => u.role === body.role).length || 0;
    const roleLimits = {
      [AdminRole.SUPER_ADMIN]: 1,
      [AdminRole.MANAGER]: 10,
      [AdminRole.DOOR_STAFF]: 10
    };
    
    if (currentCount >= roleLimits[body.role]) {
      return NextResponse.json({ 
        error: `Maximum number of ${body.role.replace('_', ' ')}s (${roleLimits[body.role]}) reached` 
      }, { status: 409 });
    }
    
    // Check rate limiting for user creation
    const ipAddress = getClientIP(request);
    const rateLimit = await checkLoginRateLimit(sessionValidation.user.email!, ipAddress);
    if (!rateLimit.allowed) {
      return NextResponse.json({ 
        error: 'Rate limit exceeded. Please try again later.' 
      }, { status: 429 });
    }
    
    // Create the user
    const result = await createAdminUser(body, sessionValidation.user.id!);
    
    if (!result.success) {
      return NextResponse.json({ 
        error: result.error || 'Failed to create user' 
      }, { status: 400 });
    }
    
    // Log successful user creation
    await logActivity({
      userId: sessionValidation.user.id,
      action: 'user_created' as any,
      entityType: 'user',
      entityId: result.user?.id,
      metadata: {
        createdUser: {
          email: body.email,
          role: body.role,
          full_name: body.full_name
        }
      },
      ipAddress,
      userAgent: request.headers.get('user-agent') || undefined
    });
    
    // Return success (without sensitive data)
    return NextResponse.json({
      message: 'User created successfully',
      user: {
        id: result.user?.id,
        email: result.user?.email,
        username: result.user?.username,
        full_name: result.user?.full_name,
        role: result.user?.role,
        is_active: result.user?.is_active,
        require_2fa: result.user?.require_2fa,
        created_at: result.user?.created_at
      }
    }, { status: 201 });
    
  } catch (error) {
    console.error('Error in POST /api/admin/users:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}