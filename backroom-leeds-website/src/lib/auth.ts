import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import speakeasy from 'speakeasy';
import { createClient } from '@/lib/supabase/server';

export interface StaffUser {
  id: string;
  email: string;
  role: 'super_admin' | 'manager' | 'door_staff';
  name?: string;
  is_active: boolean;
  totp_enabled: boolean;
  failed_login_attempts: number;
  locked_until?: Date | null;
}

export interface StaffPermissions {
  canManageStaff: boolean;
  canViewFinancials: boolean;
  canModifyBookings: boolean;
  canCheckInCustomers: boolean;
  canManageEvents: boolean;
  canViewReports: boolean;
  canProcessRefunds: boolean;
  canManageSettings: boolean;
}

// Define permissions based on role
export const getPermissionsForRole = (role: string): StaffPermissions => {
  switch (role) {
    case 'super_admin':
      return {
        canManageStaff: true,
        canViewFinancials: true,
        canModifyBookings: true,
        canCheckInCustomers: true,
        canManageEvents: true,
        canViewReports: true,
        canProcessRefunds: true,
        canManageSettings: true,
      };
    case 'manager':
      return {
        canManageStaff: false,
        canViewFinancials: true,
        canModifyBookings: true,
        canCheckInCustomers: true,
        canManageEvents: true,
        canViewReports: true,
        canProcessRefunds: true,
        canManageSettings: false,
      };
    case 'door_staff':
      return {
        canManageStaff: false,
        canViewFinancials: false,
        canModifyBookings: false,
        canCheckInCustomers: true,
        canManageEvents: false,
        canViewReports: false,
        canProcessRefunds: false,
        canManageSettings: false,
      };
    default:
      return {
        canManageStaff: false,
        canViewFinancials: false,
        canModifyBookings: false,
        canCheckInCustomers: false,
        canManageEvents: false,
        canViewReports: false,
        canProcessRefunds: false,
        canManageSettings: false,
      };
  }
};

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'staff-credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
        totp: { label: '2FA Code', type: 'text', placeholder: '123456' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Email and password are required');
        }

        const supabase = await createClient();

        try {
          // Get staff user from database
          const { data: staff, error } = await supabase
            .from('admin_users')
            .select('*')
            .eq('email', credentials.email.toLowerCase())
            .eq('is_active', true)
            .single();

          if (error || !staff) {
            throw new Error('Invalid credentials');
          }

          // Check if account is locked
          if (staff.locked_until && new Date(staff.locked_until) > new Date()) {
            throw new Error('Account is temporarily locked due to failed login attempts');
          }

          // Verify password
          const isValidPassword = await bcrypt.compare(credentials.password, staff.password_hash);

          if (!isValidPassword) {
            // Increment failed login attempts
            const newFailedAttempts = staff.failed_login_attempts + 1;
            const lockDuration = newFailedAttempts >= 5 ? new Date(Date.now() + 15 * 60 * 1000) : null; // 15 minutes lock

            await supabase
              .from('admin_users')
              .update({
                failed_login_attempts: newFailedAttempts,
                locked_until: lockDuration,
              })
              .eq('id', staff.id);

            if (newFailedAttempts >= 5) {
              throw new Error('Account locked due to multiple failed attempts');
            }

            throw new Error('Invalid credentials');
          }

          // Verify 2FA if enabled
          if (staff.totp_enabled && staff.totp_secret) {
            if (!credentials.totp) {
              throw new Error('2FA code is required');
            }

            const isValidTotp = speakeasy.totp.verify({
              secret: staff.totp_secret,
              encoding: 'base32',
              token: credentials.totp,
              window: 2, // Allow 2 time steps of variance
            });

            if (!isValidTotp) {
              throw new Error('Invalid 2FA code');
            }
          }

          // Reset failed login attempts on successful login
          if (staff.failed_login_attempts > 0) {
            await supabase
              .from('admin_users')
              .update({
                failed_login_attempts: 0,
                locked_until: null,
              })
              .eq('id', staff.id);
          }

          // Log successful login
          await supabase
            .from('audit_log')
            .insert({
              admin_user_id: staff.id,
              action: 'login',
              table_name: 'admin_users',
              record_id: staff.id,
              new_values: { login_time: new Date().toISOString() },
            });

          return {
            id: staff.id,
            email: staff.email,
            role: staff.role,
            name: staff.email.split('@')[0], // Use email prefix as name
            permissions: getPermissionsForRole(staff.role),
          };
        } catch (error) {
          console.error('Auth error:', error);
          throw error;
        }
      },
    }),
  ],
  session: {
    strategy: 'jwt',
    maxAge: 8 * 60 * 60, // 8 hours
  },
  jwt: {
    maxAge: 8 * 60 * 60, // 8 hours
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role;
        token.permissions = user.permissions;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.sub!;
        session.user.role = token.role as string;
        session.user.permissions = token.permissions as StaffPermissions;
      }
      return session;
    },
  },
  pages: {
    signIn: '/admin/login',
    error: '/admin/login',
  },
  events: {
    async signOut({ token }) {
      if (token?.sub) {
        const supabase = await createClient();
        // Log logout event
        await supabase
          .from('audit_log')
          .insert({
            admin_user_id: token.sub,
            action: 'logout',
            table_name: 'admin_users',
            record_id: token.sub,
            new_values: { logout_time: new Date().toISOString() },
          });
      }
    },
  },
};

// Export alias for backward compatibility
export const authConfig = authOptions;