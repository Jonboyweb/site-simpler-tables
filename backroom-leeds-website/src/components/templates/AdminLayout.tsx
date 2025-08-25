'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import { cn } from '@/lib/utils';
import { Button, Heading, Text } from '@/components/atoms';
import type { AdminLayoutProps } from '@/types/components';

// Navigation items based on user permissions
const getNavigationForRole = (role: string) => {
  const baseNavigation = [
    { href: '/admin/dashboard', label: 'Dashboard', icon: '📊' },
  ];

  switch (role) {
    case 'super_admin':
      return [
        ...baseNavigation,
        { href: '/admin/bookings', label: 'Bookings', icon: '📅' },
        { href: '/admin/events', label: 'Events', icon: '🎉' },
        { href: '/admin/customers', label: 'Customers', icon: '👥' },
        { href: '/admin/staff', label: 'Staff', icon: '👤' },
        { href: '/admin/finance', label: 'Finance', icon: '💰' },
        { href: '/admin/reports', label: 'Reports', icon: '📈' },
        { href: '/admin/settings', label: 'Settings', icon: '⚙️' },
      ];
    case 'manager':
      return [
        ...baseNavigation,
        { href: '/admin/bookings', label: 'Bookings', icon: '📅' },
        { href: '/admin/events', label: 'Events', icon: '🎉' },
        { href: '/admin/customers', label: 'Customers', icon: '👥' },
        { href: '/admin/finance', label: 'Finance', icon: '💰' },
        { href: '/admin/reports', label: 'Reports', icon: '📈' },
      ];
    case 'door_staff':
      return [
        ...baseNavigation,
        { href: '/admin/bookings', label: 'Bookings', icon: '📅', readonly: true },
        { href: '/admin/check-in', label: 'Check-In', icon: '✅' },
      ];
    default:
      return baseNavigation;
  }
};

export const AdminLayout = ({
  children,
  sidebarOpen: initialSidebarOpen = true,
}: AdminLayoutProps) => {
  const [sidebarOpen, setSidebarOpen] = useState(initialSidebarOpen);
  const [loggingOut, setLoggingOut] = useState(false);
  const pathname = usePathname();
  const { data: session } = useSession();

  const userRole = session?.user?.role || 'door_staff';
  const navigation = getNavigationForRole(userRole);

  const handleLogout = async () => {
    setLoggingOut(true);
    await signOut({ 
      callbackUrl: '/admin/login',
      redirect: true 
    });
  };

  return (
    <div className="min-h-screen bg-speakeasy-noir">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-30 bg-speakeasy-noir/95 backdrop-blur-md border-b border-speakeasy-gold/20">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 rounded-sm hover:bg-speakeasy-gold/10 transition-colors lg:hidden"
              aria-label="Toggle sidebar"
            >
              {sidebarOpen ? (
                <span className="text-speakeasy-gold text-xl">✕</span>
              ) : (
                <span className="text-speakeasy-gold text-xl">☰</span>
              )}
            </button>
            <Link href="/admin/dashboard" className="flex items-center gap-2">
              <Heading level={4} variant="bebas" className="text-speakeasy-gold">
                Admin Dashboard
              </Heading>
              <Text variant="caption" className="text-speakeasy-copper hidden sm:block">
                The Backroom Leeds
              </Text>
            </Link>
          </div>
          <div className="flex items-center gap-4">
            {session?.user && (
              <>
                <div className="hidden sm:block text-right">
                  <Text variant="caption" className="text-speakeasy-champagne">
                    {session.user.email}
                  </Text>
                  <Text variant="caption" className="text-speakeasy-gold block">
                    {userRole.replace('_', ' ').toUpperCase()}
                  </Text>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={handleLogout}
                  disabled={loggingOut}
                  className="text-speakeasy-champagne hover:text-speakeasy-gold"
                >
                  {loggingOut ? 'Signing out...' : 'Logout'}
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      <div className="flex pt-16">
        {/* Sidebar */}
        <aside
          className={cn(
            'fixed left-0 top-16 bottom-0 w-64 bg-speakeasy-noir/50 border-r border-speakeasy-gold/20',
            'transition-transform duration-300 z-20',
            'lg:translate-x-0',
            sidebarOpen ? 'translate-x-0' : '-translate-x-full'
          )}
        >
          <nav className="p-4 space-y-1">
            {navigation.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'flex items-center gap-3 px-4 py-2 rounded-sm',
                    'transition-all duration-200',
                    'hover:bg-speakeasy-gold/10 hover:text-speakeasy-gold',
                    isActive
                      ? 'bg-speakeasy-gold/20 text-speakeasy-gold border-l-4 border-speakeasy-gold'
                      : 'text-speakeasy-champagne'
                  )}
                >
                  <span className="text-xl">{item.icon}</span>
                  <span className="font-bebas tracking-wider uppercase">{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </aside>

        {/* Main Content */}
        <main className={cn(
          'flex-1 p-6',
          'transition-all duration-300',
          'lg:ml-64'
        )}>
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>

      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-speakeasy-noir/50 backdrop-blur-sm z-10 lg:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}
    </div>
  );
};