'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, TrendingUp, Radio, PieChart, ShieldCheck, User } from 'lucide-react';
import { clsx } from 'clsx';

export function ClientBottomNav() {
  const pathname = usePathname();

  const navItems = [
    { label: 'Home', href: '/home', icon: Home },
    { label: 'Markets', href: '/markets', icon: TrendingUp },
    { label: 'Signals', href: '/signals', icon: Radio },
    { label: 'Invest', href: '/invest', icon: PieChart },
    { label: 'Protect', href: '/protect', icon: ShieldCheck },
    { label: 'Account', href: '/account', icon: User },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-[#0B111E]/95 backdrop-blur-md border-t border-slate-800/80 pb-safe">
      <div className="max-w-md mx-auto grid grid-cols-6 h-16">
        {navItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== '/home' && pathname?.startsWith(item.href));
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={clsx(
                'flex flex-col items-center justify-center gap-1 transition-colors select-none',
                isActive ? 'text-blue-400 font-semibold' : 'text-slate-400 hover:text-slate-200'
              )}
            >
              <div
                className={clsx(
                  'w-9 h-6 rounded-full flex items-center justify-center transition-all',
                  isActive ? 'bg-blue-600/20' : 'bg-transparent'
                )}
              >
                <Icon className={clsx('w-4 h-4', isActive ? 'text-blue-400 stroke-[2.5]' : 'stroke-[1.75]')} />
              </div>
              <span className="text-[10px] tracking-tight">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
