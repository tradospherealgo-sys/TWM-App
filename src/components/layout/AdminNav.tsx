'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  ShieldAlert,
  Users,
  Briefcase,
  Layers,
  FileCheck2,
  ScrollText,
  Settings2,
  LayoutDashboard,
  LogOut,
  Activity,
} from 'lucide-react';
import { clsx } from 'clsx';

export function AdminNav({ adminName = 'Administrator' }: { adminName?: string }) {
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
    router.refresh();
  }

  const links = [
    { label: 'Overview', href: '/admin', icon: LayoutDashboard },
    { label: 'Users & Roles', href: '/admin/users', icon: Users },
    { label: 'Employees', href: '/admin/employees', icon: Briefcase },
    { label: 'CRM & Pipeline', href: '/admin/crm', icon: Layers },
    { label: 'Products', href: '/admin/products', icon: Layers },
    { label: 'Signals', href: '/admin/signals', icon: Activity },
    { label: 'Applications', href: '/admin/applications', icon: FileCheck2 },
    { label: 'Audit Logs', href: '/admin/audit-logs', icon: ScrollText },
    { label: 'Integrations', href: '/admin/integrations', icon: Settings2 },
    { label: 'System Health', href: '/admin/system-health', icon: Activity },
  ];

  return (
    <header className="sticky top-0 z-40 bg-[#0B111E]/95 backdrop-blur border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between h-16">
        {/* Brand & Badge */}
        <div className="flex items-center gap-3">
          <Link href="/admin" className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-lg bg-red-700 flex items-center justify-center font-bold text-white text-xs">
              TWM
            </span>
            <div className="font-bold text-slate-100 text-sm hidden sm:block">
              Tradosphere Admin
            </div>
          </Link>
          <span className="px-2 py-0.5 text-[10px] font-semibold bg-red-950 text-red-300 border border-red-800/80 rounded-full flex items-center gap-1">
            <ShieldAlert className="w-3 h-3" /> Control Center
          </span>
        </div>

        {/* Desktop Nav Items */}
        <nav className="hidden lg:flex items-center gap-1">
          {links.map((link) => {
            const isActive = pathname === link.href;
            const Icon = link.icon;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={clsx(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors',
                  isActive
                    ? 'bg-slate-800 text-red-400 font-semibold'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                )}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{link.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* User profile & Logout */}
        <div className="flex items-center gap-3">
          <div className="text-right">
            <div className="text-xs font-semibold text-slate-200">{adminName}</div>
            <div className="text-[10px] text-red-400 font-medium">Principal Admin</div>
          </div>
          <button
            onClick={handleLogout}
            title="Logout"
            aria-label="Logout"
            className="p-2 rounded-lg text-slate-400 hover:text-red-400 hover:bg-slate-800/60 transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Mobile Sub-Navigation Bar */}
      <div className="lg:hidden border-t border-slate-800/60 overflow-x-auto py-1 px-2 flex items-center gap-1 text-xs">
        {links.map((link) => {
          const isActive = pathname === link.href;
          const Icon = link.icon;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={clsx(
                'flex items-center gap-1 px-2.5 py-1.5 rounded-md whitespace-nowrap text-xs font-medium',
                isActive ? 'bg-red-600/20 text-red-400' : 'text-slate-400 hover:text-slate-200'
              )}
            >
              <Icon className="w-3 h-3" />
              <span>{link.label}</span>
            </Link>
          );
        })}
      </div>
    </header>
  );
}
