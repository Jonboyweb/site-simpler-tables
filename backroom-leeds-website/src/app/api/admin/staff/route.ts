import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import bcrypt from 'bcryptjs';
import speakeasy from 'speakeasy';
import { createClient } from '@/lib/supabase/server';
import { permissionManager, Permission } from '@/lib/permissions';
import { z } from 'zod';

// Validation schemas
const createStaffSchema = z.object({
  email: z.string().email('Invalid email address'),
  role: z.enum(['super_admin', 'manager', 'door_staff']),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  enable2FA: z.boolean().optional().default(false),
});


interface CreateStaffRequest {
  email: string;
  role: 'super_admin' | 'manager' | 'door_staff';
  password: string;
  enable2FA?: boolean;
}


/**
 * GET /api/admin/staff
 * Retrieve all staff accounts (super_admin only)
 */
export async function GET(request: NextRequest) {
  try {
    // Get authentication token
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
    
    if (!token?.sub) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Check permissions
    const permissionCheck = await permissionManager.validateResourceAccess(
      token.sub,
      'staff',
      'all',
      Permission.VIEW_STAFF
    );

    if (!permissionCheck.hasPermission) {
      return NextResponse.json(
        { error: 'Insufficient permissions', reason: permissionCheck.reason },
        { status: 403 }
      );
    }

    const supabase = createClient();

    // Get all staff members (excluding password hashes)
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
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json(
        { error: 'Failed to retrieve staff accounts' },
        { status: 500 }
      );
    }

    // Add permission info for each staff member
    const staffWithPermissions = staff.map(member => ({
      ...member,
      permissions: permissionManager.getPermissionsForRole(member.role),
      role_display: member.role.replace('_', ' ').toUpperCase(),
    }));

    return NextResponse.json({
      staff: staffWithPermissions,
      total: staff.length,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('Staff retrieval error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/staff
 * Create new staff account (super_admin only)
 */
export async function POST(request: NextRequest) {
  try {
    // Get authentication token
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
    
    if (!token?.sub) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Check permissions - only super_admin can create staff
    const permissionCheck = await permissionManager.validateResourceAccess(
      token.sub,
      'staff',
      'create',
      Permission.CREATE_STAFF
    );

    if (!permissionCheck.hasPermission) {
      return NextResponse.json(
        { error: 'Insufficient permissions', reason: permissionCheck.reason },
        { status: 403 }
      );
    }

    // Validate request body
    const body = await request.json() as CreateStaffRequest;
    const validation = createStaffSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { 
          error: 'Validation failed', 
          details: validation.error.errors 
        },
        { status: 400 }
      );
    }

    const { email, role, password, enable2FA } = validation.data;

    const supabase = createClient();

    // Check if email already exists
    const { data: existingUser } = await supabase
      .from('admin_users')
      .select('id')
      .eq('email', email.toLowerCase())
      .single();

    if (existingUser) {
      return NextResponse.json(
        { error: 'Email address already in use' },
        { status: 409 }
      );
    }

    // Hash password
    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Generate 2FA secret if requested
    let totpSecret = null;
    if (enable2FA) {
      const secret = speakeasy.generateSecret({
        name: email,
        issuer: process.env.TOTP_ISSUER || 'The Backroom Leeds',
        length: 32,
      });
      totpSecret = secret.base32;
    }

    // Create staff account
    const { data: newStaff, error } = await supabase
      .from('admin_users')
      .insert({
        email: email.toLowerCase(),
        password_hash: passwordHash,
        role,
        totp_enabled: enable2FA || false,
        totp_secret: totpSecret,
        is_active: true,
      })
      .select(`
        id,
        email,
        role,
        is_active,
        totp_enabled,
        created_at
      `)
      .single();

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json(
        { error: 'Failed to create staff account' },
        { status: 500 }
      );
    }

    // Log the creation
    await supabase
      .from('audit_log')
      .insert({
        admin_user_id: token.sub,
        action: 'create_staff_account',
        table_name: 'admin_users',
        record_id: newStaff.id,
        new_values: {
          email: newStaff.email,
          role: newStaff.role,
          totp_enabled: newStaff.totp_enabled,
        },
      });

    return NextResponse.json({
      message: 'Staff account created successfully',
      staff: {
        ...newStaff,
        totp_qr_url: totpSecret ? speakeasy.otpauthURL({
          secret: totpSecret,
          label: email,
          issuer: process.env.TOTP_ISSUER || 'The Backroom Leeds',
        }) : null,
        permissions: permissionManager.getPermissionsForRole(role),
      },
    }, { status: 201 });

  } catch (error) {
    console.error('Staff creation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}