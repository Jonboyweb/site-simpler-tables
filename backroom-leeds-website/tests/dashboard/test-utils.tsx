import React from 'react';
import { render } from '@testing-library/react';
import { ThemeProvider } from '@/components/theme-provider';
import { SessionProvider } from 'next-auth/react';

// Mock session data for different roles
export const mockSuperAdminSession = {
  user: {
    id: 'super-admin-1',
    name: 'Super Admin',
    email: 'superadmin@backroomleeds.com',
    role: 'super_admin'
  },
  expires: new Date(Date.now() + 86400 * 1000).toISOString()
};

export const mockManagerSession = {
  user: {
    id: 'manager-1',
    name: 'Manager',
    email: 'manager@backroomleeds.com',
    role: 'manager'
  },
  expires: new Date(Date.now() + 86400 * 1000).toISOString()
};

export const mockDoorStaffSession = {
  user: {
    id: 'doorstaff-1',
    name: 'Door Staff',
    email: 'doorstaff@backroomleeds.com',
    role: 'door_staff'
  },
  expires: new Date(Date.now() + 86400 * 1000).toISOString()
};

// Custom render with theme and session providers
export const customRender = (
  ui: React.ReactElement, 
  session: any = mockSuperAdminSession
) => {
  return render(
    <SessionProvider session={session}>
      <ThemeProvider 
        attribute="class" 
        defaultTheme="dark" 
        enableSystem={false}
      >
        {ui}
      </ThemeProvider>
    </SessionProvider>
  );
};

// Mock data generators
export const generateMockUsers = (count: number, role: string) => {
  return Array.from({ length: count }, (_, i) => ({
    id: `user-${i + 1}`,
    name: `${role.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())} ${i + 1}`,
    email: `${role}-${i + 1}@backroomleeds.com`,
    role: role
  }));
};

// Mock booking data generator
export const generateMockBookings = (count: number) => {
  return Array.from({ length: count }, (_, i) => ({
    id: `booking-${i + 1}`,
    customerName: `Customer ${i + 1}`,
    tableNumber: Math.floor(Math.random() * 16) + 1,
    status: ['confirmed', 'arrived', 'cancelled'][Math.floor(Math.random() * 3)],
    date: new Date(Date.now() + i * 86400 * 1000).toISOString()
  }));
};