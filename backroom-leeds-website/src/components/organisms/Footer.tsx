'use client';

import Link from 'next/link';
import { Text } from '@/components/atoms';

const footerLinks = {
  venue: [
    { href: '/about', label: 'About Us' },
    { href: '/events', label: 'Events' },
    { href: '/gallery', label: 'Gallery' },
    { href: '/contact', label: 'Contact' },
  ],
  booking: [
    { href: '/booking', label: 'Book a Table' },
    { href: '/drinks', label: 'Drinks Packages' },
    { href: '/private-hire', label: 'Private Hire' },
    { href: '/faq', label: 'FAQs' },
  ],
  legal: [
    { href: '/terms', label: 'Terms & Conditions' },
    { href: '/privacy', label: 'Privacy Policy' },
    { href: '/cookies', label: 'Cookie Policy' },
    { href: '/accessibility', label: 'Accessibility' },
  ],
  social: [
    { href: 'https://instagram.com/thebackroomleeds', label: 'Instagram' },
    { href: 'https://facebook.com/thebackroomleeds', label: 'Facebook' },
    { href: 'https://twitter.com/backroomleeds', label: 'Twitter' },
    { href: 'https://tiktok.com/@thebackroomleeds', label: 'TikTok' },
  ],
};

export const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-speakeasy-noir border-t border-speakeasy-gold/20">
      <div className="container mx-auto px-4 py-12">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 mb-8">
          {/* Brand Section */}
          <div className="lg:col-span-2">
            <div className="mb-4">
              <h2 className="text-3xl font-bebas tracking-wider uppercase text-speakeasy-gold mb-1">
                The Backroom
              </h2>
              <p className="font-great-vibes text-xl text-speakeasy-copper">
                A Prohibition Experience
              </p>
            </div>
            <Text variant="caption" className="mb-4">
              Step into Leeds&apos; most exclusive speakeasy. Hidden beneath the streets, 
              The Backroom offers an unforgettable night of mystery, cocktails, and entertainment.
            </Text>
            <div className="space-y-1">
              <Text variant="small">📍 123 Secret Street, Leeds LS1 1AA</Text>
              <Text variant="small">📞 0113 123 4567</Text>
              <Text variant="small">✉️ hello@thebackroomleeds.com</Text>
            </div>
          </div>

          {/* Venue Links */}
          <div>
            <h3 className="font-bebas text-lg tracking-wider uppercase text-speakeasy-gold mb-4">
              Venue
            </h3>
            <ul className="space-y-2">
              {footerLinks.venue.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-speakeasy-champagne/80 hover:text-speakeasy-gold transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Booking Links */}
          <div>
            <h3 className="font-bebas text-lg tracking-wider uppercase text-speakeasy-gold mb-4">
              Booking
            </h3>
            <ul className="space-y-2">
              {footerLinks.booking.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-speakeasy-champagne/80 hover:text-speakeasy-gold transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Social Links */}
          <div>
            <h3 className="font-bebas text-lg tracking-wider uppercase text-speakeasy-gold mb-4">
              Follow Us
            </h3>
            <ul className="space-y-2">
              {footerLinks.social.map((link) => (
                <li key={link.href}>
                  <a
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-speakeasy-champagne/80 hover:text-speakeasy-gold transition-colors"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Divider */}
        <div className="h-px bg-gradient-to-r from-transparent via-speakeasy-gold/40 to-transparent mb-8" />

        {/* Bottom Footer */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex flex-wrap gap-4 text-sm">
            {footerLinks.legal.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-speakeasy-champagne/60 hover:text-speakeasy-gold transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </div>
          <Text variant="small" className="text-speakeasy-champagne/60">
            © {currentYear} The Backroom Leeds. All rights reserved.
          </Text>
        </div>
      </div>
    </footer>
  );
};