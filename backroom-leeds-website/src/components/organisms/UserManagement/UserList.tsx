/**
 * UserList.tsx
 * Super Admin User Management - User List Component
 * The Backroom Leeds
 */

import { useState } from 'react';
import { Button, Heading, Text } from '@/components/atoms';
import { Modal } from '@/components/molecules';
import { AdminUser, AdminRole, getRoleDisplayName } from '@/types/authentication.types';
import { UserForm } from './UserForm';
import { TwoFactorReset } from './TwoFactorReset';
import { formatDistanceToNow } from 'date-fns';

interface UserListProps {
  users: AdminUser[];
  currentUserId: string;
  onEditUser: (user: AdminUser) => void;
  onDeleteUser: (userId: string) => void;
  onResetTwoFA: (userId: string) => void;
  onToggleUserStatus: (userId: string, isActive: boolean) => void;
  roleCounts: Record<AdminRole, number>;
  loading?: boolean;
}

export function UserList({
  users,
  currentUserId,
  onEditUser,
  onDeleteUser,
  onResetTwoFA,
  onToggleUserStatus,
  roleCounts,
  loading = false
}: UserListProps) {
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null);
  const [resetTwoFAUser, setResetTwoFAUser] = useState<AdminUser | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ user: AdminUser; isOpen: boolean }>({ 
    user: null as any, 
    isOpen: false 
  });
  const [sortField, setSortField] = useState<keyof AdminUser>('created_at');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [filterRole, setFilterRole] = useState<AdminRole | 'all'>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all');

  // Filter and sort users
  const filteredUsers = users
    .filter(user => {
      if (filterRole !== 'all' && user.role !== filterRole) return false;
      if (filterStatus === 'active' && !user.is_active) return false;
      if (filterStatus === 'inactive' && user.is_active) return false;
      return true;
    })
    .sort((a, b) => {
      const aValue = a[sortField];
      const bValue = b[sortField];
      
      if (aValue === null || aValue === undefined) return 1;
      if (bValue === null || bValue === undefined) return -1;
      
      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

  const handleSort = (field: keyof AdminUser) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const handleDeleteUser = async () => {
    if (deleteConfirm.user) {
      await onDeleteUser(deleteConfirm.user.id);
      setDeleteConfirm({ user: null as any, isOpen: false });
    }
  };

  if (loading) {
    return (
      <div className="bg-speakeasy-burgundy/20 rounded-lg border border-speakeasy-gold/20 overflow-hidden animate-pulse">
        <div className="p-6 border-b border-speakeasy-gold/20">
          <div className="h-6 bg-speakeasy-gold/20 rounded w-32"></div>
        </div>
        <div className="p-6 space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-16 bg-speakeasy-noir/20 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="bg-speakeasy-burgundy/20 rounded-lg border border-speakeasy-gold/20 overflow-hidden">
        {/* Header with filters */}
        <div className="p-6 border-b border-speakeasy-gold/20">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-4">
            <Heading level={2} className="text-xl font-bebas text-speakeasy-gold">
              Admin Users ({filteredUsers.length})
            </Heading>
            
            <div className="flex gap-4">
              {/* Role filter */}
              <select
                value={filterRole}
                onChange={(e) => setFilterRole(e.target.value as AdminRole | 'all')}
                className="px-3 py-2 bg-speakeasy-noir/50 border border-speakeasy-gold/20 rounded text-speakeasy-champagne focus:outline-none focus:border-speakeasy-gold text-sm"
              >
                <option value="all">All Roles</option>
                <option value={AdminRole.SUPER_ADMIN}>Super Admin</option>
                <option value={AdminRole.MANAGER}>Manager ({roleCounts.manager}/10)</option>
                <option value={AdminRole.DOOR_STAFF}>Door Staff ({roleCounts.door_staff}/10)</option>
              </select>
              
              {/* Status filter */}
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as 'all' | 'active' | 'inactive')}
                className="px-3 py-2 bg-speakeasy-noir/50 border border-speakeasy-gold/20 rounded text-speakeasy-champagne focus:outline-none focus:border-speakeasy-gold text-sm"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-speakeasy-noir/30">
              <tr>
                <th 
                  className="text-left p-4 text-speakeasy-gold font-bebas cursor-pointer hover:bg-speakeasy-gold/10 transition-colors"
                  onClick={() => handleSort('full_name')}
                >
                  User
                  {sortField === 'full_name' && (
                    <span className="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                  )}
                </th>
                <th 
                  className="text-left p-4 text-speakeasy-gold font-bebas cursor-pointer hover:bg-speakeasy-gold/10 transition-colors"
                  onClick={() => handleSort('role')}
                >
                  Role
                  {sortField === 'role' && (
                    <span className="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                  )}
                </th>
                <th className="text-left p-4 text-speakeasy-gold font-bebas">2FA Status</th>
                <th 
                  className="text-left p-4 text-speakeasy-gold font-bebas cursor-pointer hover:bg-speakeasy-gold/10 transition-colors"
                  onClick={() => handleSort('last_login_at')}
                >
                  Last Login
                  {sortField === 'last_login_at' && (
                    <span className="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                  )}
                </th>
                <th className="text-left p-4 text-speakeasy-gold font-bebas">Status</th>
                <th className="text-left p-4 text-speakeasy-gold font-bebas">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-speakeasy-champagne/60">
                    No users found matching the current filters.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr key={user.id} className="border-b border-speakeasy-gold/10 hover:bg-speakeasy-noir/20 transition-colors">
                    <td className="p-4">
                      <div>
                        <Text className="text-speakeasy-champagne font-medium">{user.full_name}</Text>
                        <Text className="text-speakeasy-champagne/60 text-xs">{user.email}</Text>
                        {user.username && (
                          <Text className="text-speakeasy-champagne/60 text-xs">@{user.username}</Text>
                        )}
                      </div>
                    </td>
                    <td className="p-4">
                      <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                        user.role === AdminRole.SUPER_ADMIN ? 'bg-speakeasy-gold/20 text-speakeasy-gold' :
                        user.role === AdminRole.MANAGER ? 'bg-speakeasy-copper/20 text-speakeasy-copper' :
                        'bg-speakeasy-champagne/20 text-speakeasy-champagne'
                      }`}>
                        {getRoleDisplayName(user.role)}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${
                          user.totp_enabled ? 'bg-green-500' : 'bg-red-500'
                        }`}></div>
                        <Text className="text-speakeasy-champagne text-sm">
                          {user.totp_enabled ? 'Enabled' : 'Disabled'}
                        </Text>
                        {user.require_2fa && !user.totp_enabled && (
                          <span className="ml-1 px-1 py-0.5 bg-amber-500/20 text-amber-400 text-xs rounded">
                            Required
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="p-4">
                      <Text className="text-speakeasy-champagne/80 text-sm">
                        {user.last_login_at 
                          ? formatDistanceToNow(new Date(user.last_login_at), { addSuffix: true })
                          : 'Never'
                        }
                      </Text>
                    </td>
                    <td className="p-4">
                      <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                        user.is_active ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                      }`}>
                        {user.is_active ? 'ACTIVE' : 'INACTIVE'}
                      </span>
                      {user.locked_until && new Date(user.locked_until) > new Date() && (
                        <span className="ml-1 px-1 py-0.5 bg-red-500/20 text-red-400 text-xs rounded">
                          Locked
                        </span>
                      )}
                    </td>
                    <td className="p-4">
                      <div className="flex gap-2 flex-wrap">
                        <button 
                          onClick={() => setEditingUser(user)}
                          className="px-2 py-1 bg-speakeasy-gold/20 text-speakeasy-gold rounded text-xs hover:bg-speakeasy-gold/30 transition-colors font-medium"
                        >
                          Edit
                        </button>
                        
                        {user.totp_enabled && (
                          <button 
                            onClick={() => setResetTwoFAUser(user)}
                            className="px-2 py-1 bg-speakeasy-copper/20 text-speakeasy-copper rounded text-xs hover:bg-speakeasy-copper/30 transition-colors font-medium"
                          >
                            Reset 2FA
                          </button>
                        )}
                        
                        <button 
                          onClick={() => onToggleUserStatus(user.id, !user.is_active)}
                          className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                            user.is_active 
                              ? 'bg-amber-500/20 text-amber-400 hover:bg-amber-500/30'
                              : 'bg-green-500/20 text-green-400 hover:bg-green-500/30'
                          }`}
                        >
                          {user.is_active ? 'Disable' : 'Enable'}
                        </button>
                        
                        {user.role !== AdminRole.SUPER_ADMIN && user.id !== currentUserId && (
                          <button 
                            onClick={() => setDeleteConfirm({ user, isOpen: true })}
                            className="px-2 py-1 bg-red-500/20 text-red-400 rounded text-xs hover:bg-red-500/30 transition-colors font-medium"
                          >
                            Delete
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit User Modal */}
      <Modal 
        isOpen={!!editingUser} 
        onClose={() => setEditingUser(null)}
        title="Edit User"
      >
        {editingUser && (
          <UserForm
            user={editingUser}
            onSave={(updatedUser) => {
              onEditUser(updatedUser);
              setEditingUser(null);
            }}
            onCancel={() => setEditingUser(null)}
            mode="edit"
            roleCounts={roleCounts}
          />
        )}
      </Modal>

      {/* Two-Factor Reset Modal */}
      <Modal 
        isOpen={!!resetTwoFAUser} 
        onClose={() => setResetTwoFAUser(null)}
        title="Reset Two-Factor Authentication"
      >
        {resetTwoFAUser && (
          <TwoFactorReset
            user={resetTwoFAUser}
            onConfirm={() => {
              onResetTwoFA(resetTwoFAUser.id);
              setResetTwoFAUser(null);
            }}
            onCancel={() => setResetTwoFAUser(null)}
          />
        )}
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal 
        isOpen={deleteConfirm.isOpen} 
        onClose={() => setDeleteConfirm({ user: null as any, isOpen: false })}
        title="Confirm User Deletion"
      >
        {deleteConfirm.user && (
          <div className="space-y-4">
            <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-red-500/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <svg className="w-4 h-4 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
                <div>
                  <Heading level={3} className="text-lg font-bebas text-red-400 mb-2">
                    Warning: This action cannot be undone
                  </Heading>
                  <Text className="text-speakeasy-champagne/80 text-sm leading-relaxed">
                    You are about to permanently delete the user account for <strong>{deleteConfirm.user.full_name}</strong> ({deleteConfirm.user.email}). This will:
                  </Text>
                  <ul className="text-speakeasy-champagne/80 text-sm mt-2 space-y-1">
                    <li>• Remove all account access immediately</li>
                    <li>• Revoke all active sessions</li>
                    <li>• Delete 2FA configuration</li>
                    <li>• Maintain audit logs for compliance</li>
                  </ul>
                </div>
              </div>
            </div>
            
            <div className="flex gap-3 justify-end">
              <Button
                variant="secondary"
                onClick={() => setDeleteConfirm({ user: null as any, isOpen: false })}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={handleDeleteUser}
                className="bg-red-500 hover:bg-red-600 text-white"
              >
                Delete User
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}