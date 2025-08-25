'use client';

import Link from 'next/link';
import { cn } from '@/lib/utils';
import type { NavigationItemProps } from '@/types/components';

export const NavigationItem = ({
  href,
  label,
  active = false,
  icon,
  onClick,
}: NavigationItemProps) => {
  const content = (
    <>
      {icon && <span className="w-5 h-5">{icon}</span>}
      <span>{label}</span>
    </>
  );

  const className = cn(
    'inline-flex items-center gap-2',
    'px-4 py-2 rounded-sm',
    'font-bebas text-lg tracking-wider uppercase',
    'transition-all duration-200',
    'hover:text-speakeasy-gold hover:bg-speakeasy-gold/10',
    active && 'text-speakeasy-gold bg-speakeasy-gold/10'
  );

  if (onClick) {
    return (
      <button type="button" onClick={onClick} className={className}>
        {content}
      </button>
    );
  }

  return (
    <Link href={href} className={className}>
      {content}
    </Link>
  );
};