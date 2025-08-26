import { test, describe, expect } from '@jest/globals';
import { createMocks } from 'node-mocks-http';
import { middleware } from '@/middleware';
import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';

// Mock next-auth JWT token
jest.mock('next-auth/jwt', () => ({
  getToken: jest.fn(),
}));

describe('Admin Middleware Security Tests', () => {
  const baseUrl = 'https://backroom-leeds.com';

  const mockRequest = (pathname: string, token: any = null) => {
    const request = createMocks<NextRequest>({
      url: `${baseUrl}${pathname}`,
      nextUrl: {
        pathname,
      },
    }).req;
    
    (getToken as jest.Mock).mockResolvedValue(token);
    
    return request as unknown as NextRequest;
  };

  describe('Unauthorized Access Prevention', () => {
    const adminRoutes = [
      '/admin/staff',
      '/admin/customers', 
      '/admin/finance', 
      '/admin/settings', 
      '/admin/dashboard'
    ];

    test.each(adminRoutes)('Route %s requires authentication', async (route) => {
      const request = mockRequest(route);
      const response = await middleware(request);

      expect(response?.status).toBe(302);
      expect(response?.headers.get('location')).toContain('/admin/login?error=SessionRequired');
    });
  });

  describe('Role-Based Access Control', () => {
    const superAdminToken = {
      role: 'super_admin',
      sub: 'super_admin_id',
      email: 'super@backroom.com'
    };

    const managerToken = {
      role: 'manager',
      sub: 'manager_id',
      email: 'manager@backroom.com'
    };

    test('Super Admin can access all admin routes', async () => {
      const adminRoutes = [
        '/admin/staff',
        '/admin/customers', 
        '/admin/finance', 
        '/admin/settings'
      ];

      for (const route of adminRoutes) {
        const request = mockRequest(route, superAdminToken);
        const response = await middleware(request);

        expect(response?.status).not.toBe(302);
        expect(response?.headers.get('x-auth-role')).toBe('super_admin');
      }
    });

    test('Manager cannot access super_admin restricted routes', async () => {
      const restrictedRoutes = [
        '/admin/staff',
        '/admin/settings'
      ];

      for (const route of restrictedRoutes) {
        const request = mockRequest(route, managerToken);
        const response = await middleware(request);

        expect(response?.status).toBe(302);
        expect(response?.headers.get('location')).toContain('/admin/dashboard?error=InsufficientPermissions');
      }
    });
  });

  describe('Security Headers', () => {
    const superAdminToken = {
      role: 'super_admin',
      sub: 'super_admin_id',
      email: 'super@backroom.com'
    };

    test('Security headers are present on admin routes', async () => {
      const request = mockRequest('/admin/dashboard', superAdminToken);
      const response = await middleware(request);

      expect(response?.headers.get('X-Frame-Options')).toBe('DENY');
      expect(response?.headers.get('X-Content-Type-Options')).toBe('nosniff');
      expect(response?.headers.get('X-XSS-Protection')).toBe('1; mode=block');
      expect(response?.headers.get('Referrer-Policy')).toBe('strict-origin-when-cross-origin');
    });
  });
});