import React from 'react';
import { 
  render, 
  screen, 
  waitFor, 
  fireEvent 
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { 
  customRender, 
  mockSuperAdminSession, 
  generateMockUsers 
} from '../../test-utils';
import UserManagement from '@/app/dashboard/super-admin/users/page';
import { server } from '../../../tests/mocks/handlers';

describe('Super Admin User Management', () => {
  beforeEach(() => {
    server.listen();
  });

  afterEach(() => {
    server.resetHandlers();
  });

  it('renders user management page with correct title', () => {
    customRender(<UserManagement />);
    expect(screen.getByText(/User Management/i)).toBeInTheDocument();
  });

  it('displays list of users', async () => {
    const mockUsers = generateMockUsers(5, 'super_admin');
    
    // Mock the API response
    jest.spyOn(global, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ users: mockUsers }),
      status: 200
    } as Response);

    customRender(<UserManagement />);

    await waitFor(() => {
      mockUsers.forEach(user => {
        expect(screen.getByText(user.name)).toBeInTheDocument();
        expect(screen.getByText(user.email)).toBeInTheDocument();
      });
    });
  });

  it('creates a new user with role limit enforcement', async () => {
    const user = userEvent.setup();
    
    customRender(<UserManagement />);

    // Open create user modal
    const createUserButton = screen.getByText(/Create User/i);
    await user.click(createUserButton);

    // Fill out user creation form
    const nameInput = screen.getByLabelText(/Name/i);
    const emailInput = screen.getByLabelText(/Email/i);
    const roleSelect = screen.getByLabelText(/Role/i);
    
    await user.type(nameInput, 'New Test User');
    await user.type(emailInput, 'newuser@backroomleeds.com');
    await user.selectOptions(roleSelect, 'manager');

    // Submit form
    const submitButton = screen.getByText(/Submit/i);
    await user.click(submitButton);

    // Assert user creation success
    await waitFor(() => {
      expect(screen.getByText(/User created successfully/i)).toBeInTheDocument();
    });
  });

  it('prevents creating users beyond role limits', async () => {
    const user = userEvent.setup();
    
    // Mock API to simulate existing managers
    const existingManagers = generateMockUsers(10, 'manager');
    jest.spyOn(global, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ users: existingManagers }),
      status: 200
    } as Response);

    customRender(<UserManagement />);

    // Open create user modal
    const createUserButton = screen.getByText(/Create User/i);
    await user.click(createUserButton);

    // Attempt to create 11th manager
    const roleSelect = screen.getByLabelText(/Role/i);
    await user.selectOptions(roleSelect, 'manager');

    // Submit form
    const submitButton = screen.getByText(/Submit/i);
    await user.click(submitButton);

    // Assert role limit error
    await waitFor(() => {
      expect(screen.getByText(/Maximum manager limit reached/i)).toBeInTheDocument();
    });
  });

  it('requires 2FA reset confirmation', async () => {
    const user = userEvent.setup();
    
    customRender(<UserManagement />);

    // Find a user to reset 2FA
    const resetButton = screen.getByText(/Reset 2FA/i);
    await user.click(resetButton);

    // Confirm dialog should appear
    expect(screen.getByText(/Are you sure you want to reset 2FA\?/i)).toBeInTheDocument();

    // Confirm reset
    const confirmResetButton = screen.getByText(/Confirm Reset/i);
    await user.click(confirmResetButton);

    // Assert successful reset
    await waitFor(() => {
      expect(screen.getByText(/2FA reset successfully/i)).toBeInTheDocument();
    });
  });

  it('prevents non-super admin access', async () => {
    // Render with a non-super admin session
    const { container } = customRender(
      <UserManagement />, 
      { 
        user: { 
          id: 'manager-1', 
          name: 'Manager', 
          email: 'manager@backroomleeds.com', 
          role: 'manager' 
        },
        expires: new Date(Date.now() + 86400 * 1000).toISOString()
      }
    );

    // Assert unauthorized access message
    await waitFor(() => {
      expect(screen.getByText(/Unauthorized Access/i)).toBeInTheDocument();
    });
  });
});