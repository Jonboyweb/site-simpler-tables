/**
 * Database Setup API Route
 * Creates admin_users table and default admin user if they don't exist
 * This endpoint is accessible during development setup
 */

import { createServiceRoleClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';

export async function GET(request: NextRequest) {
  // Only allow in development
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json({
      status: 'error',
      message: 'This endpoint is only available in development mode'
    }, { status: 403 });
  }

  try {
    const supabase = createServiceRoleClient();

    // Check if admin_users table exists
    const { data: adminUsers, error } = await supabase
      .from('admin_users')
      .select('id, email, role, is_active, created_at')
      .eq('is_active', true);

    if (error) {
      if (error.code === '42P01') {
        return NextResponse.json({
          status: 'setup_required',
          message: 'Admin users table does not exist',
          tableExists: false,
          adminUserExists: false,
          setupUrl: '/api/setup/db',
          instructions: [
            'The admin_users table does not exist in the database.',
            'Make a POST request to /api/setup/db to create the table and default admin user.',
            'Default credentials will be: admin@backroomleeds.co.uk / change-me-in-production'
          ]
        });
      }
      throw error;
    }

    const defaultAdminExists = adminUsers.find(user => 
      user.email === (process.env.DEFAULT_ADMIN_EMAIL || 'admin@backroomleeds.co.uk')
    );

    return NextResponse.json({
      status: defaultAdminExists ? 'ready' : 'needs_admin',
      message: defaultAdminExists ? 'Admin system is ready' : 'Default admin user needs to be created',
      data: {
        tableExists: true,
        totalAdminUsers: adminUsers.length,
        defaultAdminExists: !!defaultAdminExists,
        defaultAdminEmail: process.env.DEFAULT_ADMIN_EMAIL || 'admin@backroomleeds.co.uk',
        adminUsers: adminUsers.map(user => ({
          id: user.id,
          email: user.email,
          role: user.role,
          created_at: user.created_at
        }))
      }
    });

  } catch (error) {
    console.error('Database setup status error:', error);
    
    return NextResponse.json({
      status: 'error',
      message: 'Failed to check database status',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  // Only allow in development
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json({
      status: 'error',
      message: 'This endpoint is only available in development mode'
    }, { status: 403 });
  }

  try {
    const supabase = createServiceRoleClient();

    console.log('Starting database setup...');

    // First, check if the table exists by trying to query it
    let tableExists = true;
    const { data: tableTest, error: tableError } = await supabase
      .from('admin_users')
      .select('id')
      .limit(1);

    if (tableError && tableError.code === '42P01') {
      tableExists = false;
      console.log('admin_users table does not exist, will create it');
    }

    // If table doesn't exist, we need to create it manually
    // Since we can't execute raw SQL easily, let's first create a minimal setup
    if (!tableExists) {
      return NextResponse.json({
        status: 'manual_setup_required',
        message: 'Database tables need to be created manually',
        instructions: [
          '1. Open Supabase Studio at http://127.0.0.1:54323',
          '2. Go to SQL Editor',
          '3. Run the following SQL to create the admin_users table:',
          '',
          'CREATE TABLE IF NOT EXISTS admin_users (',
          '  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,',
          '  email varchar(255) UNIQUE NOT NULL,',
          '  password_hash varchar(255) NOT NULL,',
          '  role varchar(50) NOT NULL DEFAULT \'manager\',',
          '  name varchar(255),',
          '  is_active boolean DEFAULT true,',
          '  totp_enabled boolean DEFAULT false,',
          '  totp_secret varchar(255),',
          '  failed_login_attempts integer DEFAULT 0,',
          '  locked_until timestamp with time zone,',
          '  created_at timestamp with time zone DEFAULT now(),',
          '  updated_at timestamp with time zone DEFAULT now()',
          ');',
          '',
          'CREATE TABLE IF NOT EXISTS audit_log (',
          '  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,',
          '  admin_user_id uuid REFERENCES admin_users(id),',
          '  action varchar(100) NOT NULL,',
          '  table_name varchar(100),',
          '  record_id varchar(255),',
          '  old_values jsonb,',
          '  new_values jsonb,',
          '  ip_address inet,',
          '  user_agent text,',
          '  created_at timestamp with time zone DEFAULT now()',
          ');',
          '',
          '4. After running the SQL, call this endpoint again to create the default admin user'
        ],
        sql: `
CREATE TABLE IF NOT EXISTS admin_users (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  email varchar(255) UNIQUE NOT NULL,
  password_hash varchar(255) NOT NULL,
  role varchar(50) NOT NULL DEFAULT 'manager',
  name varchar(255),
  is_active boolean DEFAULT true,
  totp_enabled boolean DEFAULT false,
  totp_secret varchar(255),
  failed_login_attempts integer DEFAULT 0,
  locked_until timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_admin_users_email ON admin_users(email);
CREATE INDEX IF NOT EXISTS idx_admin_users_role ON admin_users(role);

CREATE TABLE IF NOT EXISTS audit_log (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  admin_user_id uuid REFERENCES admin_users(id),
  action varchar(100) NOT NULL,
  table_name varchar(100),
  record_id varchar(255),
  old_values jsonb,
  new_values jsonb,
  ip_address inet,
  user_agent text,
  created_at timestamp with time zone DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_audit_log_admin_user ON audit_log(admin_user_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_action ON audit_log(action);
CREATE INDEX IF NOT EXISTS idx_audit_log_created_at ON audit_log(created_at);
        `
      });
    }

    // Table exists, now check if default admin user exists
    const { data: existingAdmin, error: adminError } = await supabase
      .from('admin_users')
      .select('id, email, role')
      .eq('email', process.env.DEFAULT_ADMIN_EMAIL || 'admin@backroomleeds.co.uk')
      .single();

    if (adminError && adminError.code !== 'PGRST116') {
      throw new Error(`Error checking for admin user: ${adminError.message}`);
    }

    if (existingAdmin) {
      return NextResponse.json({
        status: 'already_exists',
        message: 'Default admin user already exists',
        data: {
          adminEmail: existingAdmin.email,
          adminRole: existingAdmin.role,
          adminId: existingAdmin.id
        }
      });
    }

    // Create default admin user
    const defaultEmail = process.env.DEFAULT_ADMIN_EMAIL || 'admin@backroomleeds.co.uk';
    const defaultPassword = process.env.DEFAULT_ADMIN_PASSWORD || 'change-me-in-production';
    
    console.log(`Creating admin user with email: ${defaultEmail}`);
    
    const passwordHash = await bcrypt.hash(defaultPassword, 12);

    const { data: newAdmin, error: insertError } = await supabase
      .from('admin_users')
      .insert({
        email: defaultEmail,
        password_hash: passwordHash,
        role: 'super_admin',
        name: 'Default Admin',
        is_active: true,
        totp_enabled: false,
        failed_login_attempts: 0
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error creating admin user:', insertError);
      throw new Error(`Error creating admin user: ${insertError.message}`);
    }

    console.log('Admin user created successfully');

    return NextResponse.json({
      status: 'success',
      message: 'Database setup completed successfully',
      data: {
        adminUserCreated: true,
        adminEmail: newAdmin.email,
        adminRole: newAdmin.role,
        adminId: newAdmin.id,
        loginCredentials: {
          email: defaultEmail,
          password: 'Use the password from your .env.local file',
          loginUrl: 'http://localhost:3000/admin/login'
        }
      }
    });

  } catch (error) {
    console.error('Database setup error:', error);
    
    return NextResponse.json({
      status: 'error',
      message: 'Failed to set up database',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}