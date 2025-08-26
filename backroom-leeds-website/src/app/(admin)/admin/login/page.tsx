'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { signIn, getSession } from 'next-auth/react';
import { Heading, Text, Button, LoadingSpinner } from '@/components/atoms';

interface LoginError {
  message: string;
  type?: 'credentials' | '2fa' | 'locked' | 'general';
}

export default function AdminLoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [totp, setTotp] = useState('');
  const [error, setError] = useState<LoginError | null>(null);
  const [loading, setLoading] = useState(false);
  const [show2FA, setShow2FA] = useState(false);
  
  const router = useRouter();
  const searchParams = useSearchParams();
  const from = searchParams?.get('from') || '/admin/dashboard';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const result = await signIn('credentials', {
        email,
        password,
        totp,
        redirect: false,
      });

      if (result?.error) {
        if (result.error.includes('2FA code is required')) {
          setShow2FA(true);
          setError({ 
            message: '2FA verification is required for your account', 
            type: '2fa' 
          });
        } else if (result.error.includes('Invalid 2FA code')) {
          setError({ 
            message: 'Invalid 2FA code. Please try again.', 
            type: '2fa' 
          });
        } else if (result.error.includes('locked') || result.error.includes('attempts')) {
          setError({ 
            message: result.error, 
            type: 'locked' 
          });
        } else if (result.error.includes('Invalid credentials')) {
          setError({ 
            message: 'Invalid email or password. Please check your credentials.', 
            type: 'credentials' 
          });
        } else {
          setError({ 
            message: result.error, 
            type: 'general' 
          });
        }
      } else if (result?.ok) {
        // Successful login - wait for session to be established
        const session = await getSession();
        if (session) {
          router.push(from);
          router.refresh();
        }
      }
    } catch {
      setError({ 
        message: 'An unexpected error occurred. Please try again.', 
        type: 'general' 
      });
    } finally {
      setLoading(false);
    }
  };

  const getErrorColor = (type?: string) => {
    switch (type) {
      case 'locked':
        return 'text-red-400';
      case '2fa':
        return 'text-yellow-400';
      default:
        return 'text-red-300';
    }
  };

  return (
    <div className="min-h-screen bg-speakeasy-noir flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-speakeasy-burgundy/20 rounded-lg border border-speakeasy-gold/20 p-8">
        <div className="text-center mb-8">
          <Heading level={1} className="text-3xl font-bebas text-speakeasy-gold mb-2">
            Admin Access
          </Heading>
          <Text className="text-speakeasy-champagne/80">
            Secure login for authorized staff only
          </Text>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="p-4 rounded-lg bg-red-900/20 border border-red-400/20">
              <Text className={`text-sm ${getErrorColor(error.type)}`}>
                {error.message}
              </Text>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-speakeasy-champagne mb-2">
                Email Address
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 bg-speakeasy-noir/50 border border-speakeasy-gold/20 rounded-lg text-speakeasy-champagne placeholder-speakeasy-champagne/50 focus:outline-none focus:border-speakeasy-gold focus:ring-1 focus:ring-speakeasy-gold transition-colors"
                placeholder="admin@backroomleeds.co.uk"
                required
                disabled={loading}
                autoComplete="email"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-speakeasy-champagne mb-2">
                Password
              </label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 bg-speakeasy-noir/50 border border-speakeasy-gold/20 rounded-lg text-speakeasy-champagne placeholder-speakeasy-champagne/50 focus:outline-none focus:border-speakeasy-gold focus:ring-1 focus:ring-speakeasy-gold transition-colors"
                placeholder="••••••••"
                required
                disabled={loading}
                autoComplete="current-password"
              />
            </div>

            {show2FA && (
              <div>
                <label htmlFor="totp" className="block text-sm font-medium text-speakeasy-champagne mb-2">
                  2FA Authentication Code
                </label>
                <input
                  type="text"
                  id="totp"
                  value={totp}
                  onChange={(e) => setTotp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  maxLength={6}
                  className="w-full px-4 py-3 bg-speakeasy-noir/50 border border-speakeasy-gold/20 rounded-lg text-speakeasy-champagne placeholder-speakeasy-champagne/50 focus:outline-none focus:border-speakeasy-gold focus:ring-1 focus:ring-speakeasy-gold transition-colors text-center font-mono text-xl tracking-widest"
                  placeholder="123456"
                  required
                  disabled={loading}
                  autoComplete="one-time-code"
                />
                <Text className="text-xs text-speakeasy-champagne/60 mt-1">
                  Enter the 6-digit code from your authenticator app
                </Text>
              </div>
            )}
          </div>

          <Button
            type="submit"
            variant="gold"
            fullWidth
            size="lg"
            disabled={loading}
            className="font-bebas text-lg tracking-wider"
          >
            {loading ? (
              <div className="flex items-center justify-center gap-2">
                <LoadingSpinner size="sm" color="gold" />
                <span>Signing In...</span>
              </div>
            ) : (
              'Sign In'
            )}
          </Button>

          <div className="text-center">
            <Text className="text-speakeasy-champagne/60 text-sm">
              Secure authentication with 2FA protection
            </Text>
          </div>
        </form>

        <div className="mt-8 pt-6 border-t border-speakeasy-gold/20">
          <Text className="text-center text-speakeasy-champagne/70 text-sm">
            Need help accessing your account?<br />
            Contact the system administrator
          </Text>
          
          {process.env.NODE_ENV === 'development' && (
            <div className="mt-4 p-3 bg-yellow-900/20 border border-yellow-400/20 rounded-lg">
              <Text className="text-xs text-yellow-300 text-center">
                Development Mode: Default admin credentials may be available
              </Text>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}