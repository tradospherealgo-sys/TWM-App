'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Bell, Shield, LogOut } from 'lucide-react';

import { NotificationCenter } from '@/components/notifications/NotificationCenter';
import { TradosphereLogo } from '@/components/ui/TradosphereLogo';

interface ClientHeaderProps {
  userName?: string;
  userRole?: string;
  unreadNotificationsCount?: number;
}

export function ClientHeader({
  userName = 'Client',
  userRole = 'CLIENT',
  unreadNotificationsCount = 0,
}: ClientHeaderProps) {
  const router = useRouter();

  async function handleLogout() {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/login');
      router.refresh();
    } catch (e) {
      console.error('Logout error:', e);
    }
  }

  return (
    <header className="sticky top-0 z-40 bg-[#0B111E]/95 backdrop-blur border-b border-slate-800/80 px-4 py-3">
      <div className="max-w-md md:max-w-lg lg:max-w-xl mx-auto flex items-center justify-between">
        {/* Brand identity */}
        <Link href="/home" className="hover:opacity-95 transition-opacity">
          <TradosphereLogo size="sm" showSubtitle={true} />
        </Link>

        {/* Header Right Actions */}
        <div className="flex items-center gap-2">
          {/* Notification Center */}
          <NotificationCenter initialUnreadCount={unreadNotificationsCount} />

          {/* Quick Staff Return Badge */}
          {userRole === 'ADMIN' && (
            <Link
              href="/admin"
              className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-red-950 text-red-300 border border-red-800 hover:bg-red-900 transition-colors"
              title="Return to Admin Control Center"
            >
              Admin OS
            </Link>
          )}
          {userRole === 'EMPLOYEE' && (
            <Link
              href="/employee"
              className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-emerald-950 text-emerald-300 border border-emerald-800 hover:bg-emerald-900 transition-colors"
              title="Return to Staff Desk"
            >
              Staff Desk
            </Link>
          )}

          {/* User profile / Logout */}
          <div className="flex items-center gap-2 pl-2 border-l border-slate-800">
            <Link
              href="/account"
              className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center text-xs font-bold hover:scale-105 transition-transform"
              title="Account & Profile"
            >
              {userName
                .split(' ')
                .map((n) => n[0])
                .join('')
                .slice(0, 2)
                .toUpperCase() || 'RA'}
            </Link>
            <button
              onClick={handleLogout}
              title="Logout"
              aria-label="Logout"
              className="p-1.5 text-slate-400 hover:text-red-400 transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
