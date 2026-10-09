import React from 'react';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { EmployeeNav } from '@/components/layout/EmployeeNav';

export const dynamic = 'force-dynamic';

export default async function EmployeeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/login?reason=session_expired');
  }

  // RBAC check: Only EMPLOYEE or ADMIN can access employee panel
  if (user.role !== 'EMPLOYEE' && user.role !== 'ADMIN') {
    redirect('/home');
  }

  return (
    <div className="min-h-screen bg-[#0B111E] text-slate-100 flex flex-col">
      <EmployeeNav employeeName={user.name} />
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 pb-20">
        {children}
      </main>
    </div>
  );
}
