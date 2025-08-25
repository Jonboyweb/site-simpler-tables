import { NextRequest } from 'next/server';

// Admin user management (Super Admin only)
// This will be implemented in Phase 3 with authentication middleware

export async function GET() {
  // Sample admin users data structure
  const sampleUsers = [
    {
      id: 'user-1',
      email: 'admin@backroomleeds.co.uk',
      name: 'Admin User',
      role: 'super_admin',
      twoFAEnabled: true,
      isActive: true,
      lastLogin: '2025-01-25T14:30:00Z',
      createdAt: '2025-01-01T00:00:00Z',
      createdBy: null
    },
    {
      id: 'user-2',
      email: 'sarah.m@backroomleeds.co.uk',
      name: 'Sarah Manager',
      role: 'manager',
      twoFAEnabled: true,
      isActive: true,
      lastLogin: '2025-01-25T12:15:00Z',
      createdAt: '2025-01-10T00:00:00Z',
      createdBy: 'user-1'
    }
  ];

  return new Response(
    JSON.stringify({
      message: 'Admin users endpoint - to be implemented in Phase 3',
      status: 'development',
      sampleData: sampleUsers,
      note: 'This endpoint will require Super Admin authentication and return user management data',
      authentication: 'Required: Super Admin role'
    }),
    {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store'
      },
    }
  );
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate required fields for user creation
    const requiredFields = ['email', 'name', 'role'];
    const missingFields = requiredFields.filter(field => !body[field]);
    
    if (missingFields.length > 0) {
      return new Response(
        JSON.stringify({
          error: 'Missing required fields',
          missingFields,
          message: 'Email, name, and role are required'
        }),
        {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
    }

    // Validate role limits
    if (body.role === 'manager') {
      return new Response(
        JSON.stringify({
          message: 'Create admin user endpoint - to be implemented in Phase 3',
          status: 'development',
          receivedData: body,
          note: 'This endpoint will enforce role limits (10 managers, 10 door staff) and create user accounts',
          authentication: 'Required: Super Admin role',
          roleLimits: {
            manager: '10 maximum',
            door_staff: '10 maximum',
            super_admin: 'unlimited'
          }
        }),
        {
          status: 201,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
    }
    
    return new Response(
      JSON.stringify({
        message: 'Create admin user endpoint - to be implemented in Phase 3',
        status: 'development',
        receivedData: body,
        note: 'This endpoint will create admin user accounts with role-based permissions'
      }),
      {
        status: 201,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  } catch {
    return new Response(
      JSON.stringify({
        error: 'Invalid JSON payload',
        message: 'Request body must be valid JSON'
      }),
      {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  }
}