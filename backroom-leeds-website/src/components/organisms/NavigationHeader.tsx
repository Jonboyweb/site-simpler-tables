'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { MenuIcon, CloseIcon } from '@/components/atoms';
import { NavigationItem } from '@/components/molecules';
import type { NavigationHeaderProps } from '@/types/components';

const navLinks = [
  { href: '/', label: 'Home' },
  { href: '/events', label: 'Events' },
  { href: '/book', label: 'Book a Table' },
  { href: '/about', label: 'About' },
  { href: '/contact', label: 'Contact' },
];

export const NavigationHeader = ({
  transparent = false,
  fixed = true,
  hideOnScroll = false,
}: NavigationHeaderProps) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isHidden, setIsHidden] = useState(false);
  const [lastScrollY, setLastScrollY] = useState(0);
  const pathname = usePathname();

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      setIsScrolled(currentScrollY > 10);
      
      if (hideOnScroll) {
        if (currentScrollY > lastScrollY && currentScrollY > 100) {
          setIsHidden(true);
        } else {
          setIsHidden(false);
        }
      }
      
      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY, hideOnScroll]);

  useEffect(() => {
    if (isMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
  }, [isMenuOpen]);

  const headerBg = transparent && !isScrolled
    ? 'bg-transparent'
    : 'bg-speakeasy-noir/95 backdrop-blur-md border-b border-speakeasy-gold/20';

  return (
    <header
      className={cn(
        'w-full z-40 transition-all duration-300',
        fixed && 'fixed top-0 left-0',
        isHidden && '-translate-y-full',
        headerBg
      )}
    >
      <nav className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link 
            href="/" 
            className="relative group"
            aria-label="The Backroom Leeds Home"
          >
            <h1 className="text-3xl font-bebas tracking-wider uppercase text-speakeasy-gold">
              The Backroom
            </h1>
            <span className="absolute -bottom-1 left-0 text-xs font-playfair text-speakeasy-copper opacity-80">
              Leeds
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center gap-2">
            {navLinks.map((link) => (
              <NavigationItem
                key={link.href}
                href={link.href}
                label={link.label}
                active={pathname === link.href}
              />
            ))}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="lg:hidden p-2 rounded-sm hover:bg-speakeasy-gold/10 transition-colors"
            aria-label={isMenuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={isMenuOpen}
          >
            {isMenuOpen ? (
              <CloseIcon size="md" className="text-speakeasy-gold" />
            ) : (
              <MenuIcon size="md" className="text-speakeasy-gold" />
            )}
          </button>
        </div>
      </nav>

      {/* Mobile Navigation */}
      <div
        className={cn(
          'lg:hidden fixed inset-0 z-50 bg-speakeasy-noir/95 backdrop-blur-md',
          'transition-all duration-300',
          isMenuOpen ? 'opacity-100 visible' : 'opacity-0 invisible'
        )}
        style={{ top: '72px' }}
      >
        <nav className="container mx-auto px-4 py-8">
          <div className="flex flex-col gap-2">
            {navLinks.map((link) => (
              <NavigationItem
                key={link.href}
                href={link.href}
                label={link.label}
                active={pathname === link.href}
                onClick={() => setIsMenuOpen(false)}
              />
            ))}
          </div>
        </nav>
      </div>
    </header>
  );
};