import React from 'react';
import Link from 'next/link';
import prisma from '@/lib/prisma';
import { Card } from '@/components/ui/Card';
import { StatusBadge } from '@/components/ui/Badge';
import {
  Users,
  Briefcase,
  FileSpreadsheet,
  Layers,
  ScrollText,
  ShieldCheck,
  TrendingUp,
  AlertCircle,
  ArrowRight,
} from 'lucide-react';

export default async function AdminDashboardPage() {
  // Query real business data from DB
  const [
    totalUsers,
    totalClients,
    totalEmployees,
    totalLeads,
    totalApplications,
    pendingApplications,
    totalTasks,
    auditLogsCount,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { role: 'CLIENT' } }),
    prisma.user.count({ where: { role: 'EMPLOYEE' } }),
    prisma.lead.count(),
    prisma.application.count(),
    prisma.application.count({ where: { status: { in: ['NEW', 'IN_PROGRESS', 'UNDER_REVIEW'] } } }),
    prisma.task.count({ where: { status: { not: 'COMPLETED' } } }),
    prisma.activityLog.count(),
  ]);

  // Recent Audit Logs
  const recentLogs = await prisma.activityLog.findMany({
    include: { actorUser: { select: { name: true, role: true } } },
    orderBy: { createdAt: 'desc' },
    take: 5,
  });

  // Applications by product category
  const appsByCategory = await prisma.application.groupBy({
    by: ['productCategory'],
    _count: { id: true },
  });

  return (
    <div className="space-y-6">
      {/* 1. Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 border-b border-slate-800">
        <div>
          <span className="text-xs text-red-400 font-semibold tracking-wide uppercase">
            Business Control Center
          </span>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            Tradosphere Operations Executive
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Organization-wide user management, CRM pipelines, audit trails &amp; integration health
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link href="/admin/system-health">
            <span className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-950/80 text-emerald-300 border border-emerald-800 flex items-center gap-1.5 hover:bg-emerald-900/60 transition-colors">
              <ShieldCheck className="w-4 h-4 text-emerald-400" /> System Health
            </span>
          </Link>
          <Link href="/admin/integrations">
            <span className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-950/80 text-blue-300 border border-blue-800 flex items-center gap-1.5 hover:bg-blue-900/60 transition-colors">
              Integrations Hub <ArrowRight className="w-3.5 h-3.5" />
            </span>
          </Link>
        </div>
      </div>

      {/* 2. Key Business Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <Card className="p-4 bg-[#111927]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase text-slate-400">Total Users</span>
            <span className="p-2 rounded-xl bg-blue-950 text-blue-400">
              <Users className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-2 text-2xl font-bold text-white">{totalUsers}</div>
          <div className="mt-1 text-[11px] text-slate-400">
            {totalClients} Clients • {totalEmployees} Staff
          </div>
        </Card>

        <Card className="p-4 bg-[#111927]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase text-slate-400">CRM Leads</span>
            <span className="p-2 rounded-xl bg-purple-950 text-purple-400">
              <Layers className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-2 text-2xl font-bold text-white">{totalLeads}</div>
          <div className="mt-1 text-[11px] text-slate-400">Total pipeline records</div>
        </Card>

        <Card className="p-4 bg-[#111927]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase text-slate-400">Applications</span>
            <span className="p-2 rounded-xl bg-emerald-950 text-emerald-400">
              <FileSpreadsheet className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-2 text-2xl font-bold text-white">{totalApplications}</div>
          <div className="mt-1 text-[11px] text-emerald-400 font-medium">
            {pendingApplications} pending action
          </div>
        </Card>

        <Card className="p-4 bg-[#111927]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase text-slate-400">Audit Logs</span>
            <span className="p-2 rounded-xl bg-amber-950 text-amber-400">
              <ScrollText className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-2 text-2xl font-bold text-white">{auditLogsCount}</div>
          <div className="mt-1 text-[11px] text-slate-400">Recorded activity events</div>
        </Card>
      </div>

      {/* 3. Product Application Volume Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-5 bg-[#131C2E] space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-200">
              Applications by Service
            </h2>
            <Link href="/admin/applications" className="text-xs text-blue-400 hover:text-blue-300">
              View All
            </Link>
          </div>

          <div className="space-y-2.5">
            {appsByCategory.map((cat) => (
              <div key={cat.productCategory} className="flex items-center justify-between text-xs p-2 rounded-lg bg-slate-900/60 border border-slate-800">
                <span className="font-medium text-slate-200">{cat.productCategory}</span>
                <span className="font-bold text-white bg-slate-800 px-2 py-0.5 rounded">
                  {cat._count.id} files
                </span>
              </div>
            ))}
            {appsByCategory.length === 0 && (
              <p className="text-xs text-slate-400">No applications created yet.</p>
            )}
          </div>
        </Card>

        {/* 4. Recent Audit Logs */}
        <Card className="p-5 bg-[#131C2E] space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-200 flex items-center gap-2">
              <ScrollText className="w-4 h-4 text-amber-400" /> Recent Security &amp; Ops Audit
            </h2>
            <Link href="/admin/audit-logs" className="text-xs text-blue-400 hover:text-blue-300">
              Audit Trail
            </Link>
          </div>

          <div className="space-y-2">
            {recentLogs.map((log) => (
              <div key={log.id} className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[11px] text-blue-400 font-semibold">{log.action}</span>
                  <span className="text-[10px] text-slate-500">
                    {new Date(log.createdAt).toLocaleTimeString()}
                  </span>
                </div>
                <div className="text-[11px] text-slate-400 mt-1">
                  Actor: <strong className="text-slate-200">{log.actorUser?.name || 'System'}</strong> ({log.actorRole}) • Target: {log.entityType}
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
