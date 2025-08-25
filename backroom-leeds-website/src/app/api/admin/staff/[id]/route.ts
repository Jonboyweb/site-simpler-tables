import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import bcrypt from 'bcryptjs';
import speakeasy from 'speakeasy';
import { createClient } from '@/lib/supabase/server';
import { permissionManager, Permission } from '@/lib/permissions';
import { z } from 'zod';

const updateStaffSchema = z.object({
  role: z.enum(['super_admin', 'manager', 'door_staff']).optional(),
  is_active: z.boolean().optional(),
  enable2FA: z.boolean().optional(),
  resetPassword: z.boolean().optional(),
  newPassword: z.string().min(8).optional(),
});

interface RouteContext {
  params: { id: string };
}

/**
 * GET /api/admin/staff/[id]
 * Get specific staff member details
 */
export async function GET(request: NextRequest, { params }: RouteContext) {
  try {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
    
    if (!token?.sub) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const staffId = params.id;

    // Users can view their own profile, or need VIEW_STAFF permission for others
    const isOwnProfile = token.sub === staffId;
    
    if (!isOwnProfile) {
      const permissionCheck = await permissionManager.validateResourceAccess(
        token.sub,
        'staff',
        staffId,
        Permission.VIEW_STAFF
      );

      if (!permissionCheck.hasPermission) {
        return NextResponse.json(
          { error: 'Insufficient permissions', reason: permissionCheck.reason },
          { status: 403 }
        );
      }
    }

    const supabase = createClient();

    const { data: staff, error } = await supabase
      .from('admin_users')
      .select(`
        id,
        email,
        role,
        is_active,
        totp_enabled,
        failed_login_attempts,
        locked_until,
        created_at,
        updated_at
      `)
      .eq('id', staffId)
      .single();

    if (error || !staff) {
      return NextResponse.json(
        { error: 'Staff member not found' },
        { status: 404 }
      );
    }

    // Add permission info
    const staffWithPermissions = {
      ...staff,
      permissions: permissionManager.getPermissionsForRole(staff.role),
      role_display: staff.role.replace('_', ' ').toUpperCase(),
      can_edit: !isOwnProfile && permissionManager.hasPermission(
        (await permissionManager.getStaffUser(token.sub))?.role || 'door_staff',
        Permission.UPDATE_STAFF
      ),
    };

    return NextResponse.json({ staff: staffWithPermissions });

  } catch (error) {
    console.error('Staff retrieval error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/admin/staff/[id]
 * Update staff member details
 */
export async function PATCH(request: NextRequest, { params }: RouteContext) {
  try {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
    
    if (!token?.sub) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const staffId = params.id;
    const body = await request.json();
    const validation = updateStaffSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { 
          error: 'Validation failed', 
          details: validation.error.errors 
        },
        { status: 400 }
      );
    }

    const updateData = validation.data;

    // Check permissions
    const isOwnProfile = token.sub === staffId;
    const requiredPermission = isOwnProfile ? Permission.VIEW_STAFF : Permission.UPDATE_STAFF;

    if (!isOwnProfile) {
      const permissionCheck = await permissionManager.validateResourceAccess(
        token.sub,
        'staff',
        staffId,
        requiredPermission
      );

      if (!permissionCheck.hasPermission) {
        return NextResponse.json(
          { error: 'Insufficient permissions', reason: permissionCheck.reason },
          { status: 403 }
        );
      }
    }

    // Users can't change their own role or status
    if (isOwnProfile && (updateData.role || updateData.is_active !== undefined)) {
      return NextResponse.json(
        { error: 'Cannot modify own role or active status' },
        { status: 403 }
      );
    }

    const supabase = createClient();

    // Get current staff data
    const { data: currentStaff, error: fetchError } = await supabase
      .from('admin_users')
      .select('*')
      .eq('id', staffId)
      .single();

    if (fetchError || !currentStaff) {
      return NextResponse.json(
        { error: 'Staff member not found' },
        { status: 404 }
      );
    }

    // Prepare update object
    const dbUpdate: Record<string, unknown> = {};
    
    if (updateData.role && updateData.role !== currentStaff.role) {
      dbUpdate.role = updateData.role;
    }

    if (updateData.is_active !== undefined && updateData.is_active !== currentStaff.is_active) {
      dbUpdate.is_active = updateData.is_active;
    }

    // Handle 2FA changes
    if (updateData.enable2FA !== undefined) {
      if (updateData.enable2FA && !currentStaff.totp_enabled) {
        // Enable 2FA - generate new secret
        const secret = speakeasy.generateSecret({
          name: currentStaff.email,
          issuer: process.env.TOTP_ISSUER || 'The Backroom Leeds',
          length: 32,
        });
        dbUpdate.totp_secret = secret.base32;
        dbUpdate.totp_enabled = true;
      } else if (!updateData.enable2FA && currentStaff.totp_enabled) {
        // Disable 2FA
        dbUpdate.totp_secret = null;
        dbUpdate.totp_enabled = false;
      }
    }

    // Handle password reset
    if (updateData.resetPassword && updateData.newPassword) {
      const saltRounds = 12;
      const passwordHash = await bcrypt.hash(updateData.newPassword, saltRounds);
      dbUpdate.password_hash = passwordHash;
      dbUpdate.failed_login_attempts = 0;
      dbUpdate.locked_until = null;
    }

    // If no changes, return current data
    if (Object.keys(dbUpdate).length === 0) {
      return NextResponse.json({
        message: 'No changes to apply',
        staff: {
          ...currentStaff,
          password_hash: undefined, // Don't return password hash
          totp_secret: undefined, // Don't return TOTP secret
        },
      });
    }

    // Update staff record
    const { data: updatedStaff, error: updateError } = await supabase
      .from('admin_users')
      .update(dbUpdate)
      .eq('id', staffId)
      .select(`
        id,
        email,
        role,
        is_active,
        totp_enabled,
        failed_login_attempts,
        locked_until,
        created_at,
        updated_at
      `)
      .single();

    if (updateError) {
      console.error('Database update error:', updateError);
      return NextResponse.json(
        { error: 'Failed to update staff account' },
        { status: 500 }
      );
    }

    // Log the update
    await supabase
      .from('audit_log')
      .insert({
        admin_user_id: token.sub,
        action: 'update_staff_account',
        table_name: 'admin_users',
        record_id: staffId,
        old_values: {
          role: currentStaff.role,
          is_active: currentStaff.is_active,
          totp_enabled: currentStaff.totp_enabled,
        },
        new_values: {
          role: updatedStaff.role,
          is_active: updatedStaff.is_active,
          totp_enabled: updatedStaff.totp_enabled,
          password_reset: updateData.resetPassword || false,
        },
      });

    // Clear permission cache
    permissionManager.clearUserCache(staffId);

    // Generate QR code URL if 2FA was enabled
    let totpQrUrl = null;
    if (updateData.enable2FA && dbUpdate.totp_secret) {
      totpQrUrl = speakeasy.otpauthURL({
        secret: dbUpdate.totp_secret,
        label: currentStaff.email,
        issuer: process.env.TOTP_ISSUER || 'The Backroom Leeds',
      });
    }

    return NextResponse.json({
      message: 'Staff account updated successfully',
      staff: {
        ...updatedStaff,
        permissions: permissionManager.getPermissionsForRole(updatedStaff.role),
        role_display: updatedStaff.role.replace('_', ' ').toUpperCase(),
      },
      totp_qr_url: totpQrUrl,
      changes_applied: Object.keys(dbUpdate),
    });

  } catch (error) {
    console.error('Staff update error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/staff/[id]
 * Deactivate staff member (soft delete)
 */
export async function DELETE(request: NextRequest, { params }: RouteContext) {
  try {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
    
    if (!token?.sub) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const staffId = params.id;

    // Can't delete own account
    if (token.sub === staffId) {
      return NextResponse.json(
        { error: 'Cannot deactivate your own account' },
        { status: 403 }
      );
    }

    // Check permissions
    const permissionCheck = await permissionManager.validateResourceAccess(
      token.sub,
      'staff',
      staffId,
      Permission.DELETE_STAFF
    );

    if (!permissionCheck.hasPermission) {
      return NextResponse.json(
        { error: 'Insufficient permissions', reason: permissionCheck.reason },
        { status: 403 }
      );
    }

    const supabase = createClient();

    // Get current staff data
    const { data: currentStaff, error: fetchError } = await supabase
      .from('admin_users')
      .select('*')
      .eq('id', staffId)
      .single();

    if (fetchError || !currentStaff) {
      return NextResponse.json(
        { error: 'Staff member not found' },
        { status: 404 }
      );
    }

    // Deactivate (soft delete) the account
    const { error: updateError } = await supabase
      .from('admin_users')
      .update({ 
        is_active: false,
        locked_until: null,
        failed_login_attempts: 0,
      })
      .eq('id', staffId);

    if (updateError) {
      console.error('Database update error:', updateError);
      return NextResponse.json(
        { error: 'Failed to deactivate staff account' },
        { status: 500 }
      );
    }

    // Log the deactivation
    await supabase
      .from('audit_log')
      .insert({
        admin_user_id: token.sub,
        action: 'deactivate_staff_account',
        table_name: 'admin_users',
        record_id: staffId,
        old_values: {
          is_active: currentStaff.is_active,
          role: currentStaff.role,
          email: currentStaff.email,
        },
        new_values: {
          is_active: false,
          deactivated_by: token.sub,
          deactivated_at: new Date().toISOString(),
        },
      });

    // Clear permission cache
    permissionManager.clearUserCache(staffId);

    return NextResponse.json({
      message: 'Staff account deactivated successfully',
      staff_id: staffId,
      deactivated_at: new Date().toISOString(),
    });

  } catch (error) {
    console.error('Staff deactivation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}