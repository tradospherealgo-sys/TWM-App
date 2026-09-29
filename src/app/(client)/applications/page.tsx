import React from 'react';
import Link from 'next/link';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { StatusBadge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import {
  FileText,
  Clock,
  UserCheck,
  FileCheck2,
  Calendar,
  AlertCircle,
  HelpCircle,
  ArrowRight,
} from 'lucide-react';

export default async function ApplicationsPage() {
  const user = await getCurrentUser();
  if (!user || !user.customerProfile) return null;

  const applications = await prisma.application.findMany({
    where: { customerId: user.customerProfile.id },
    include: {
      assignedEmployee: {
        include: { user: { select: { name: true, phone: true } } },
      },
      documents: true,
    },
    orderBy: { createdAt: 'desc' },
  });

  return (
    <div className="space-y-4">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-white tracking-tight">Applications Center</h1>
        <p className="text-xs text-slate-400 mt-0.5">
          Real-time tracking for Demat, Mutual Funds, Insurance &amp; Loans
        </p>
      </div>

      {applications.length > 0 ? (
        <div className="space-y-3">
          {applications.map((app) => (
            <Card key={app.id} className="p-4 space-y-3">
              {/* Top row */}
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-blue-400" />
                    <span className="font-bold text-sm text-white">
                      {app.productCode.replace(/_/g, ' ')}
                    </span>
                  </div>
                  <div className="text-[11px] font-mono text-slate-400 mt-0.5">
                    {app.applicationNumber}
                  </div>
                </div>
                <StatusBadge status={app.status} />
              </div>

              {/* Application Details */}
              <div className="grid grid-cols-2 gap-2 text-xs py-2 border-y border-slate-800">
                <div>
                  <span className="text-[10px] text-slate-500 uppercase block font-semibold">Category</span>
                  <span className="text-slate-300 font-medium">{app.productCategory}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 uppercase block font-semibold">Submitted On</span>
                  <span className="text-slate-300 font-medium">
                    {new Date(app.createdAt).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </span>
                </div>
              </div>

              {/* Assigned Relationship Officer */}
              {app.assignedEmployee && (
                <div className="p-2 rounded-xl bg-slate-900/80 border border-slate-800/80 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <UserCheck className="w-4 h-4 text-emerald-400" />
                    <div>
                      <span className="text-slate-400 block text-[10px]">Assigned Officer</span>
                      <span className="text-slate-200 font-medium">{app.assignedEmployee.user.name}</span>
                    </div>
                  </div>
                  <span className="text-[10px] text-emerald-400 font-medium px-2 py-0.5 rounded bg-emerald-950/60 border border-emerald-800/60">
                    Active Desk
                  </span>
                </div>
              )}

              {/* Status notes / timeline updates */}
              {app.notes && (
                <div className="p-2.5 rounded-xl bg-blue-950/20 border border-blue-900/30 text-xs text-blue-200/90 leading-relaxed">
                  <div className="text-[10px] uppercase font-bold text-blue-400 mb-0.5">Operational Note:</div>
                  <p className="whitespace-pre-line text-[11px]">{app.notes}</p>
                </div>
              )}
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={FileCheck2}
          title="No applications found"
          description="You don't have any active service requests or demat onboarding files."
          actionLabel="Explore Financial Services"
          actionHref="/home"
        />
      )}
    </div>
  );
}
