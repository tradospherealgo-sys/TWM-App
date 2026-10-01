'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Bell, Shield, LogOut } from 'lucide-react';

import { NotificationCenter } from '@/components/notifications/NotificationCenter';

interface ClientHeaderProps {
  userName?: string;
  unreadNotificationsCount?: number;
}

export function ClientHeader({
  userName = 'Client',
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
        <Link href="/home" className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center font-bold text-white shadow-sm text-sm">
            TWM
          </div>
          <div>
            <div className="text-sm font-bold tracking-tight text-white leading-tight">
              Tradosphere
            </div>
            <div className="text-[10px] text-amber-400/90 font-medium tracking-wide flex items-center gap-1">
              <Shield className="w-2.5 h-2.5 inline" /> AP • SMC Global
            </div>
          </div>
        </Link>

        {/* Header Right Actions */}
        <div className="flex items-center gap-2">
          {/* Notification Center */}
          <NotificationCenter initialUnreadCount={unreadNotificationsCount} />

          {/* User profile / Logout */}
          <div className="flex items-center gap-1.5 pl-2 border-l border-slate-800">
            <Link
              href="/account"
              className="text-xs font-semibold text-slate-200 px-2 py-1 rounded-lg bg-slate-800/60 hover:bg-slate-800"
            >
              {userName.split(' ')[0]}
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
