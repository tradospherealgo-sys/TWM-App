import React from 'react';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { AdminNav } from '@/components/layout/AdminNav';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/login');
  }

  // Strict RBAC: Only ADMIN role is allowed here
  if (user.role !== 'ADMIN') {
    redirect(user.role === 'EMPLOYEE' ? '/employee' : '/home');
  }

  return (
    <div className="min-h-screen bg-[#0B111E] text-slate-100 flex flex-col">
      <AdminNav adminName={user.name} />
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 pb-20">
        {children}
      </main>
    </div>
  );
}
