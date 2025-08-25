import NextAuth from 'next-auth';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      email: string;
      name?: string;
      role: 'super_admin' | 'manager' | 'door_staff';
      permissions: {
        canManageStaff: boolean;
        canViewFinancials: boolean;
        canModifyBookings: boolean;
        canCheckInCustomers: boolean;
        canManageEvents: boolean;
        canViewReports: boolean;
        canProcessRefunds: boolean;
        canManageSettings: boolean;
      };
    };
  }

  interface User {
    id: string;
    email: string;
    name?: string;
    role: 'super_admin' | 'manager' | 'door_staff';
    permissions: {
      canManageStaff: boolean;
      canViewFinancials: boolean;
      canModifyBookings: boolean;
      canCheckInCustomers: boolean;
      canManageEvents: boolean;
      canViewReports: boolean;
      canProcessRefunds: boolean;
      canManageSettings: boolean;
    };
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    role: string;
    permissions: {
      canManageStaff: boolean;
      canViewFinancials: boolean;
      canModifyBookings: boolean;
      canCheckInCustomers: boolean;
      canManageEvents: boolean;
      canViewReports: boolean;
      canProcessRefunds: boolean;
      canManageSettings: boolean;
    };
  }
}