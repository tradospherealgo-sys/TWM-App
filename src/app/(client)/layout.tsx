import React from 'react';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { ClientHeader } from '@/components/layout/ClientHeader';
import { ClientBottomNav } from '@/components/layout/ClientBottomNav';

export const dynamic = 'force-dynamic';

export default async function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/login');
  }

  // Count unread notifications
  const unreadCount = await prisma.notification.count({
    where: { userId: user.id, isRead: false },
  });

  return (
    <div className="min-h-screen bg-[#0B111E] text-slate-100 flex flex-col">
      <ClientHeader userName={user.name} unreadNotificationsCount={unreadCount} />
      <main className="flex-1 max-w-md md:max-w-lg lg:max-w-xl w-full mx-auto px-4 py-5 pb-24">
        {children}
      </main>
      <ClientBottomNav />
    </div>
  );
}
