import React from 'react';
import Link from 'next/link';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { StatusBadge } from '@/components/ui/Badge';
import {
  CheckSquare,
  Users,
  PhoneCall,
  FileSpreadsheet,
  Plus,
  Clock,
  ArrowRight,
  Sparkles,
  ClipboardList,
  AlertCircle,
} from 'lucide-react';

export default async function EmployeeDashboardPage() {
  const user = await getCurrentUser();
  if (!user) return null;

  const employeeProfile = user.employeeProfile;

  // Real database metrics
  const pendingTasksCount = await prisma.task.count({
    where: {
      assignedEmployeeId: employeeProfile?.id,
      status: { in: ['PENDING', 'IN_PROGRESS'] },
    },
  });

  const activeLeadsCount = await prisma.lead.count({
    where: {
      assignedEmployeeId: employeeProfile?.id,
      status: { notIn: ['COMPLETED', 'LOST_CLOSED'] },
    },
  });

  const activeAppsCount = await prisma.application.count({
    where: {
      assignedEmployeeId: employeeProfile?.id,
      status: { notIn: ['COMPLETED', 'REJECTED', 'CANCELLED'] },
    },
  });

  const followUpsCount = await prisma.followUp.count({
    where: {
      employeeId: employeeProfile?.id,
      status: 'SCHEDULED',
    },
  });

  // Today's priority tasks
  const tasks = await prisma.task.findMany({
    where: {
      assignedEmployeeId: employeeProfile?.id,
      status: { in: ['PENDING', 'IN_PROGRESS'] },
    },
    include: {
      customer: { include: { user: { select: { name: true, phone: true } } } },
      lead: { select: { name: true, phone: true, productInterest: true } },
    },
    orderBy: { dueDate: 'asc' },
    take: 5,
  });

  // Recent leads requiring attention
  const recentLeads = await prisma.lead.findMany({
    where: {
      assignedEmployeeId: employeeProfile?.id,
    },
    orderBy: { updatedAt: 'desc' },
    take: 4,
  });

  return (
    <div className="space-y-6">
      {/* 1. Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 border-b border-slate-800">
        <div>
          <span className="text-xs text-slate-400">Tradosphere Wealth Management Operating System</span>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            Welcome, {user.name}
          </h1>
          <div className="text-xs text-slate-400 mt-1 flex items-center gap-2">
            <span>Code: <strong className="text-emerald-400 font-mono">{employeeProfile?.employeeCode || 'TWM-EMP'}</strong></span>
            <span>•</span>
            <span>{employeeProfile?.designation || 'Wealth Executive'}</span>
          </div>
        </div>

        {/* Quick action bar */}
        <div className="flex items-center gap-2">
          <Link href="/employee/leads">
            <Button size="sm" variant="primary">
              <Plus className="w-3.5 h-3.5 mr-1" /> New Lead
            </Button>
          </Link>
          <Link href="/employee/copilot">
            <Button size="sm" variant="outline" className="border-blue-700/60 text-blue-300 hover:bg-blue-950/40">
              <Sparkles className="w-3.5 h-3.5 mr-1" /> AI Copilot
            </Button>
          </Link>
          <Link href="/employee/report">
            <Button size="sm" variant="secondary">
              <ClipboardList className="w-3.5 h-3.5 mr-1" /> Daily Report
            </Button>
          </Link>
        </div>
      </div>

      {/* 2. Operational Metrics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <Card className="p-4 bg-[#111927]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase text-slate-400">Pending Tasks</span>
            <span className="p-2 rounded-xl bg-blue-950 text-blue-400">
              <CheckSquare className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-2 text-2xl font-bold text-white">{pendingTasksCount}</div>
          <div className="mt-1 text-[11px] text-slate-400">Require action</div>
        </Card>

        <Card className="p-4 bg-[#111927]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase text-slate-400">Active Leads</span>
            <span className="p-2 rounded-xl bg-purple-950 text-purple-400">
              <Users className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-2 text-2xl font-bold text-white">{activeLeadsCount}</div>
          <div className="mt-1 text-[11px] text-slate-400">In pipeline</div>
        </Card>

        <Card className="p-4 bg-[#111927]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase text-slate-400">Applications</span>
            <span className="p-2 rounded-xl bg-emerald-950 text-emerald-400">
              <FileSpreadsheet className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-2 text-2xl font-bold text-white">{activeAppsCount}</div>
          <div className="mt-1 text-[11px] text-slate-400">Under review</div>
        </Card>

        <Card className="p-4 bg-[#111927]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase text-slate-400">Follow-ups</span>
            <span className="p-2 rounded-xl bg-amber-950 text-amber-400">
              <PhoneCall className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-2 text-2xl font-bold text-white">{followUpsCount}</div>
          <div className="mt-1 text-[11px] text-slate-400">Scheduled calls</div>
        </Card>
      </div>

      {/* 3. Main Dashboard Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Today's Tasks */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
              <CheckSquare className="w-4 h-4 text-blue-400" /> Today&apos;s Priority Tasks
            </h2>
            <Link href="/employee/tasks" className="text-xs text-blue-400 hover:text-blue-300">
              All Tasks
            </Link>
          </div>

          {tasks.length > 0 ? (
            <div className="space-y-2">
              {tasks.map((task) => (
                <Card key={task.id} className="p-3.5 bg-[#131C2E] hover:border-slate-700 transition-colors">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="text-xs font-semibold text-white">{task.title}</h3>
                      {task.description && (
                        <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-1">
                          {task.description}
                        </p>
                      )}
                      <div className="text-[10px] text-slate-500 mt-1 flex items-center gap-2">
                        {task.customer && <span>Client: {task.customer.user.name}</span>}
                        {task.lead && <span>Lead: {task.lead.name}</span>}
                        {task.dueDate && (
                          <span className="flex items-center gap-0.5 text-slate-400">
                            <Clock className="w-3 h-3" /> Due {new Date(task.dueDate).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded font-semibold uppercase bg-amber-950/70 text-amber-300 border border-amber-800/60">
                      {task.priority}
                    </span>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="p-6 text-center text-xs text-slate-400">
              All tasks completed for today. Good job!
            </Card>
          )}
        </div>

        {/* Recent Leads in Pipeline */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
              <Users className="w-4 h-4 text-purple-400" /> Active Lead Pipeline
            </h2>
            <Link href="/employee/leads" className="text-xs text-blue-400 hover:text-blue-300">
              View CRM
            </Link>
          </div>

          {recentLeads.length > 0 ? (
            <div className="space-y-2">
              {recentLeads.map((lead) => (
                <Card key={lead.id} className="p-3.5 bg-[#131C2E]">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-xs text-white">{lead.name}</div>
                      <div className="text-[11px] text-slate-400">{lead.phone} • {lead.productInterest}</div>
                    </div>
                    <StatusBadge status={lead.status} />
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="p-6 text-center text-xs text-slate-400">
              No leads currently assigned. Create a new lead to get started.
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
