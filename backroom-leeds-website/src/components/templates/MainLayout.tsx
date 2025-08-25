'use client';

import { NavigationHeader, Footer } from '@/components/organisms';
import type { MainLayoutProps } from '@/types/components';

export const MainLayout = ({
  children,
  showHeader = true,
  showFooter = true,
  transparentHeader = false,
}: MainLayoutProps) => {
  return (
    <div className="min-h-screen flex flex-col">
      {showHeader && (
        <NavigationHeader transparent={transparentHeader} fixed hideOnScroll />
      )}
      <main className={`flex-1 ${showHeader ? 'pt-20' : ''}`}>
        {children}
      </main>
      {showFooter && <Footer />}
    </div>
  );
};