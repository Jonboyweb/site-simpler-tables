import type { Metadata } from 'next';
import { Heading, Text } from '@/components/atoms';

export const metadata: Metadata = {
  title: 'Admin Login | The Backroom Leeds',
  description: 'Secure login for The Backroom Leeds admin staff',
  robots: {
    index: false,
    follow: false,
  },
};

export default function AdminLoginPage() {
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

        <div className="space-y-6">
          {/* Login Form Placeholder */}
          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-speakeasy-champagne mb-2">
                Email Address
              </label>
              <input
                type="email"
                id="email"
                className="w-full px-4 py-3 bg-speakeasy-noir/50 border border-speakeasy-gold/20 rounded-lg text-speakeasy-champagne placeholder-speakeasy-champagne/50 focus:outline-none focus:border-speakeasy-gold transition-colors"
                placeholder="admin@backroomleeds.co.uk"
                disabled
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-speakeasy-champagne mb-2">
                Password
              </label>
              <input
                type="password"
                id="password"
                className="w-full px-4 py-3 bg-speakeasy-noir/50 border border-speakeasy-gold/20 rounded-lg text-speakeasy-champagne placeholder-speakeasy-champagne/50 focus:outline-none focus:border-speakeasy-gold transition-colors"
                placeholder="••••••••"
                disabled
              />
            </div>

            <div>
              <label htmlFor="totp" className="block text-sm font-medium text-speakeasy-champagne mb-2">
                2FA Code
              </label>
              <input
                type="text"
                id="totp"
                maxLength={6}
                className="w-full px-4 py-3 bg-speakeasy-noir/50 border border-speakeasy-gold/20 rounded-lg text-speakeasy-champagne placeholder-speakeasy-champagne/50 focus:outline-none focus:border-speakeasy-gold transition-colors text-center font-mono tracking-widest"
                placeholder="123456"
                disabled
              />
            </div>
          </div>

          <button
            disabled
            className="w-full bg-speakeasy-gold/20 text-speakeasy-gold py-3 px-6 rounded-lg font-bebas text-lg tracking-wider cursor-not-allowed opacity-50"
          >
            Sign In
          </button>

          <div className="text-center">
            <Text className="text-speakeasy-champagne/60 text-sm">
              Authentication system will be implemented in Phase 3
            </Text>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-speakeasy-gold/20">
          <Text className="text-center text-speakeasy-champagne/70 text-sm">
            Need help accessing your account?<br />
            Contact the system administrator
          </Text>
        </div>
      </div>
    </div>
  );
}