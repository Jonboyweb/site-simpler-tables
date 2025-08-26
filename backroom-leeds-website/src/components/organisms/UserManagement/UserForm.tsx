/**
 * UserForm.tsx
 * Super Admin User Management - User Creation/Edit Form
 * The Backroom Leeds
 */

import { useState, useEffect } from 'react';
import { Button, Text } from '@/components/atoms';
import { FormField } from '@/components/molecules';
import { 
  AdminUser, 
  AdminRole, 
  CreateUserRequest,
  validatePasswordComplexity,
  getRoleDisplayName,
  getRoleLimits 
} from '@/types/authentication.types';

interface UserFormProps {
  user?: AdminUser;
  onSave: (user: AdminUser | CreateUserRequest) => void;
  onCancel: () => void;
  mode: 'create' | 'edit';
  roleCounts: Record<AdminRole, number>;
  loading?: boolean;
}

interface FormData {
  full_name: string;
  email: string;
  username: string;
  role: AdminRole;
  password: string;
  confirm_password: string;
  require_2fa: boolean;
  is_active: boolean;
}

interface FormErrors {
  full_name?: string;
  email?: string;
  username?: string;
  role?: string;
  password?: string;
  confirm_password?: string;
  general?: string;
}

export function UserForm({
  user,
  onSave,
  onCancel,
  mode,
  roleCounts,
  loading = false
}: UserFormProps) {
  const [formData, setFormData] = useState<FormData>({
    full_name: user?.full_name || '',
    email: user?.email || '',
    username: user?.username || '',
    role: user?.role || AdminRole.DOOR_STAFF,
    password: '',
    confirm_password: '',
    require_2fa: user?.require_2fa ?? true,
    is_active: user?.is_active ?? true
  });
  
  const [errors, setErrors] = useState<FormErrors>({});
  const [isGeneratingPassword, setIsGeneratingPassword] = useState(false);
  const roleLimits = getRoleLimits();

  // Generate secure random password
  const generatePassword = () => {
    setIsGeneratingPassword(true);
    
    // Character sets for password generation
    const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const lowercase = 'abcdefghijklmnopqrstuvwxyz';
    const numbers = '0123456789';
    const symbols = '!@#$%^&*()_+-=[]{}|;:,.<>?';
    const allChars = uppercase + lowercase + numbers + symbols;
    
    // Ensure at least one character from each set
    let password = '';
    password += uppercase[Math.floor(Math.random() * uppercase.length)];
    password += lowercase[Math.floor(Math.random() * lowercase.length)];
    password += numbers[Math.floor(Math.random() * numbers.length)];
    password += symbols[Math.floor(Math.random() * symbols.length)];
    
    // Fill remaining length with random characters
    for (let i = password.length; i < 12; i++) {
      password += allChars[Math.floor(Math.random() * allChars.length)];
    }
    
    // Shuffle the password
    password = password.split('').sort(() => Math.random() - 0.5).join('');
    
    setFormData(prev => ({ 
      ...prev, 
      password, 
      confirm_password: password 
    }));
    
    // Clear password errors
    setErrors(prev => ({ 
      ...prev, 
      password: undefined, 
      confirm_password: undefined 
    }));
    
    setIsGeneratingPassword(false);
  };

  // Auto-generate username from email
  useEffect(() => {
    if (mode === 'create' && formData.email && !user) {
      const emailPrefix = formData.email.split('@')[0];
      const username = emailPrefix.toLowerCase().replace(/[^a-z0-9]/g, '');
      setFormData(prev => ({ ...prev, username }));
    }
  }, [formData.email, mode, user]);

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};
    
    // Full name validation
    if (!formData.full_name.trim()) {
      newErrors.full_name = 'Full name is required';
    } else if (formData.full_name.trim().length < 2) {
      newErrors.full_name = 'Full name must be at least 2 characters';
    }
    
    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!emailRegex.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    
    // Username validation
    if (!formData.username.trim()) {
      newErrors.username = 'Username is required';
    } else if (formData.username.trim().length < 3) {
      newErrors.username = 'Username must be at least 3 characters';
    } else if (!/^[a-z0-9_]+$/.test(formData.username)) {
      newErrors.username = 'Username can only contain lowercase letters, numbers, and underscores';
    }
    
    // Role validation with limits
    const currentCount = roleCounts[formData.role] || 0;
    const limit = roleLimits[formData.role];
    
    if (mode === 'create' && currentCount >= limit && formData.role !== AdminRole.SUPER_ADMIN) {
      newErrors.role = `Maximum ${limit} ${getRoleDisplayName(formData.role).toLowerCase()}s allowed`;
    }
    
    // Password validation (only for new users or if password is being changed)
    if (mode === 'create' || formData.password) {
      if (!formData.password) {
        newErrors.password = 'Password is required';
      } else {
        const passwordValidation = validatePasswordComplexity(formData.password);
        if (!passwordValidation.valid) {
          newErrors.password = passwordValidation.errors[0];
        }
      }
      
      if (!formData.confirm_password) {
        newErrors.confirm_password = 'Please confirm the password';
      } else if (formData.password !== formData.confirm_password) {
        newErrors.confirm_password = 'Passwords do not match';
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    if (mode === 'create') {
      const newUser: CreateUserRequest = {
        full_name: formData.full_name.trim(),
        email: formData.email.trim().toLowerCase(),
        username: formData.username.trim().toLowerCase(),
        password: formData.password,
        role: formData.role,
        require_2fa: formData.require_2fa
      };
      onSave(newUser);
    } else {
      const updatedUser: AdminUser = {
        ...user!,
        full_name: formData.full_name.trim(),
        email: formData.email.trim().toLowerCase(),
        username: formData.username.trim().toLowerCase(),
        role: formData.role,
        require_2fa: formData.require_2fa,
        is_active: formData.is_active
      };
      onSave(updatedUser);
    }
  };

  const handleFieldChange = (field: keyof FormData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear field error when user starts typing
    if (errors[field as keyof FormErrors]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {errors.general && (
        <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
          {errors.general}
        </div>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField
          label="Full Name"
          type="text"
          value={formData.full_name}
          onChange={(value) => handleFieldChange('full_name', value)}
          error={errors.full_name}
          placeholder="John Doe"
          required
        />
        
        <FormField
          label="Email Address"
          type="email"
          value={formData.email}
          onChange={(value) => handleFieldChange('email', value)}
          error={errors.email}
          placeholder="user@backroomleeds.com"
          required
        />
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField
          label="Username"
          type="text"
          value={formData.username}
          onChange={(value) => handleFieldChange('username', value.toLowerCase())}
          error={errors.username}
          placeholder="johndoe"
          required
          helpText="Lowercase letters, numbers, and underscores only"
        />
        
        <div>
          <label className="block text-sm font-medium text-speakeasy-champagne mb-2">
            Role *
          </label>
          <select
            value={formData.role}
            onChange={(e) => handleFieldChange('role', e.target.value as AdminRole)}
            className={`w-full px-3 py-2 bg-speakeasy-noir/50 border rounded text-speakeasy-champagne focus:outline-none focus:border-speakeasy-gold transition-colors ${
              errors.role ? 'border-red-500' : 'border-speakeasy-gold/20'
            }`}
            disabled={loading}
          >
            <option value={AdminRole.DOOR_STAFF}>
              Door Staff ({roleCounts.door_staff}/{roleLimits.door_staff})
            </option>
            <option value={AdminRole.MANAGER}>
              Manager ({roleCounts.manager}/{roleLimits.manager})
            </option>
            {/* Super admin can only be assigned if none exist or we're editing the current super admin */}
            <option 
              value={AdminRole.SUPER_ADMIN}
              disabled={mode === 'create' && roleCounts.super_admin >= 1}
            >
              Super Admin ({roleCounts.super_admin}/{roleLimits.super_admin})
            </option>
          </select>
          {errors.role && (
            <Text className="text-red-400 text-xs mt-1">{errors.role}</Text>
          )}
        </div>
      </div>
      
      {/* Password fields (only show for new users or when changing password) */}
      {(mode === 'create' || formData.password) && (
        <div className="space-y-4">
          <div className="border-t border-speakeasy-gold/20 pt-4">
            <Text className="text-speakeasy-champagne font-medium mb-4">
              {mode === 'create' ? 'Password Setup' : 'Change Password'}
            </Text>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                label={mode === 'create' ? 'Temporary Password' : 'New Password'}
                type="password"
                value={formData.password}
                onChange={(value) => handleFieldChange('password', value)}
                error={errors.password}
                placeholder="Enter secure password"
                required={mode === 'create'}
                helpText="Min 8 chars, uppercase, lowercase, number, special char"
              />
              
              <FormField
                label="Confirm Password"
                type="password"
                value={formData.confirm_password}
                onChange={(value) => handleFieldChange('confirm_password', value)}
                error={errors.confirm_password}
                placeholder="Confirm password"
                required={mode === 'create'}
              />
            </div>
            
            {mode === 'create' && (
              <div className="mt-3">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={generatePassword}
                  disabled={isGeneratingPassword || loading}
                  className="w-full md:w-auto"
                >
                  {isGeneratingPassword ? 'Generating...' : 'Generate Secure Password'}
                </Button>
                <Text className="text-speakeasy-champagne/60 text-xs mt-2">
                  User will be required to change password on first login
                </Text>
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* Additional options */}
      <div className="space-y-4 border-t border-speakeasy-gold/20 pt-4">
        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            id="require2FA"
            checked={formData.require_2fa}
            onChange={(e) => handleFieldChange('require_2fa', e.target.checked)}
            className="w-4 h-4 text-speakeasy-gold rounded focus:ring-speakeasy-gold"
            disabled={loading}
          />
          <label htmlFor="require2FA" className="text-sm text-speakeasy-champagne">
            Require 2FA setup on first login
          </label>
        </div>
        
        {mode === 'edit' && (
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="isActive"
              checked={formData.is_active}
              onChange={(e) => handleFieldChange('is_active', e.target.checked)}
              className="w-4 h-4 text-speakeasy-gold rounded focus:ring-speakeasy-gold"
              disabled={loading || user?.role === AdminRole.SUPER_ADMIN}
            />
            <label htmlFor="isActive" className="text-sm text-speakeasy-champagne">
              Account is active
            </label>
            {user?.role === AdminRole.SUPER_ADMIN && (
              <Text className="text-speakeasy-champagne/60 text-xs">
                (Super admin accounts cannot be deactivated)
              </Text>
            )}
          </div>
        )}
      </div>
      
      {/* Form actions */}
      <div className="flex gap-3 justify-end pt-4 border-t border-speakeasy-gold/20">
        <Button
          type="button"
          variant="secondary"
          onClick={onCancel}
          disabled={loading}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          variant="primary"
          disabled={loading}
        >
          {loading ? 'Saving...' : mode === 'create' ? 'Create User' : 'Save Changes'}
        </Button>
      </div>
    </form>
  );
}