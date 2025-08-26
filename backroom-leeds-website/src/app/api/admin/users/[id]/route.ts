/**
 * Admin User Management API Routes - Individual User Operations
 * The Backroom Leeds - Super Admin User Management
 * 
 * PUT /api/admin/users/[id] - Update admin user (Super Admin only)
 * DELETE /api/admin/users/[id] - Delete admin user (Super Admin only)
 * POST /api/admin/users/[id]/reset-2fa - Reset user 2FA (Super Admin only)
 * POST /api/admin/users/[id]/toggle-status - Toggle user active status (Super Admin only)
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  validateSession,
  getUserById,
  updateUserRole,
  logActivity,
  revokeSession,
  getUserSessions
} from '@/lib/auth/database-helpers';
import {
  AdminRole,
  AdminUser,
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
 * PUT /api/admin/users/[id]
 * Update an admin user
 */
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const userId = params.id;
    
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
    
    // Only super admins can update users
    if (!userHasPermission(sessionValidation.user.role as AdminRole, 'users:update')) {
      return NextResponse.json({ 
        error: 'Insufficient permissions. Super Admin access required.' 
      }, { status: 403 });
    }
    
    // Get the user to update
    const existingUser = await getUserById(userId);
    if (!existingUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    
    // Parse request body
    const updateData = await request.json();
    
    const supabase = createClient();
    
    // Build update object
    const updates: Partial<AdminUser> = {};
    
    if (updateData.full_name !== undefined) {
      updates.full_name = updateData.full_name.trim();
    }
    
    if (updateData.email !== undefined) {
      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(updateData.email)) {
        return NextResponse.json({ error: 'Invalid email format' }, { status: 400 });
      }
      
      // Check if email is already taken by another user
      const { data: emailCheck } = await supabase
        .from('admin_users')
        .select('id')
        .eq('email', updateData.email.toLowerCase())
        .neq('id', userId)
        .single();
      
      if (emailCheck) {
        return NextResponse.json({ error: 'Email is already taken' }, { status: 409 });
      }
      
      updates.email = updateData.email.toLowerCase();
    }
    
    if (updateData.username !== undefined) {
      // Validate username format
      if (!/^[a-z0-9_]+$/.test(updateData.username)) {
        return NextResponse.json({ 
          error: 'Username can only contain lowercase letters, numbers, and underscores' 
        }, { status: 400 });
      }
      
      // Check if username is already taken by another user
      const { data: usernameCheck } = await supabase
        .from('admin_users')
        .select('id')
        .eq('username', updateData.username.toLowerCase())
        .neq('id', userId)
        .single();
      
      if (usernameCheck) {
        return NextResponse.json({ error: 'Username is already taken' }, { status: 409 });
      }
      
      updates.username = updateData.username.toLowerCase();
    }
    
    if (updateData.role !== undefined && updateData.role !== existingUser.role) {
      // Check role limits
      const { data: roleCounts } = await supabase
        .from('admin_users')
        .select('role')
        .is('deleted_at', null)
        .eq('is_active', true)
        .neq('id', userId); // Exclude current user from count
      
      const currentCount = roleCounts?.filter(u => u.role === updateData.role).length || 0;
      const roleLimits = {
        [AdminRole.SUPER_ADMIN]: 1,
        [AdminRole.MANAGER]: 10,
        [AdminRole.DOOR_STAFF]: 10
      };
      
      if (currentCount >= roleLimits[updateData.role as AdminRole]) {
        return NextResponse.json({ 
          error: `Maximum number of ${updateData.role.replace('_', ' ')}s (${roleLimits[updateData.role as AdminRole]}) reached` 
        }, { status: 409 });
      }
      
      updates.role = updateData.role;
    }
    
    if (updateData.require_2fa !== undefined) {
      updates.require_2fa = updateData.require_2fa;
    }
    
    if (updateData.is_active !== undefined && existingUser.role !== AdminRole.SUPER_ADMIN) {
      updates.is_active = updateData.is_active;
    }
    
    // Update the user
    const { data: updatedUser, error } = await supabase
      .from('admin_users')
      .update(updates)
      .eq('id', userId)
      .select()
      .single();
    
    if (error) {
      console.error('Error updating user:', error);
      return NextResponse.json({ error: 'Failed to update user' }, { status: 500 });
    }
    
    // Log activity
    await logActivity({
      userId: sessionValidation.user.id,
      action: 'user_modified' as any,
      entityType: 'user',
      entityId: userId,
      oldValues: {
        full_name: existingUser.full_name,
        email: existingUser.email,
        username: existingUser.username,
        role: existingUser.role,
        require_2fa: existingUser.require_2fa,
        is_active: existingUser.is_active
      },
      newValues: updates,
      ipAddress: getClientIP(request),
      userAgent: request.headers.get('user-agent') || undefined
    });
    
    return NextResponse.json({
      message: 'User updated successfully',
      user: updatedUser
    });
    
  } catch (error) {
    console.error('Error in PUT /api/admin/users/[id]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * DELETE /api/admin/users/[id]
 * Delete an admin user
 */
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const userId = params.id;
    
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
    
    // Only super admins can delete users
    if (!userHasPermission(sessionValidation.user.role as AdminRole, 'users:delete')) {
      return NextResponse.json({ 
        error: 'Insufficient permissions. Super Admin access required.' 
      }, { status: 403 });
    }
    
    // Prevent self-deletion
    if (userId === sessionValidation.user.id) {
      return NextResponse.json({ 
        error: 'Cannot delete your own account' 
      }, { status: 400 });
    }
    
    // Get the user to delete
    const existingUser = await getUserById(userId);
    if (!existingUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    
    // Prevent deletion of super admin users
    if (existingUser.role === AdminRole.SUPER_ADMIN) {
      return NextResponse.json({ 
        error: 'Super admin users cannot be deleted' 
      }, { status: 400 });
    }
    
    const supabase = createClient();
    
    // Soft delete the user (set deleted_at timestamp)
    const { error: deleteError } = await supabase
      .from('admin_users')
      .update({
        deleted_at: new Date().toISOString(),
        is_active: false
      })
      .eq('id', userId);
    
    if (deleteError) {
      console.error('Error deleting user:', deleteError);
      return NextResponse.json({ error: 'Failed to delete user' }, { status: 500 });
    }
    
    // Revoke all active sessions for the user
    const userSessions = await getUserSessions(userId);
    for (const session of userSessions) {
      await revokeSession(session.id, sessionValidation.user.id!, 'User deleted');
    }
    
    // Delete 2FA configuration
    await supabase.from('admin_totp_secrets').delete().eq('user_id', userId);
    await supabase.from('admin_backup_codes').delete().eq('user_id', userId);
    
    // Log activity
    await logActivity({
      userId: sessionValidation.user.id,
      action: 'user_deleted' as any,
      entityType: 'user',
      entityId: userId,
      metadata: {
        deletedUser: {
          email: existingUser.email,
          full_name: existingUser.full_name,
          role: existingUser.role
        }
      },
      ipAddress: getClientIP(request),
      userAgent: request.headers.get('user-agent') || undefined
    });
    
    return NextResponse.json({ message: 'User deleted successfully' });
    
  } catch (error) {
    console.error('Error in DELETE /api/admin/users/[id]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}