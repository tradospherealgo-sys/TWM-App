import React from 'react';
import prisma from '@/lib/prisma';
import { Card } from '@/components/ui/Card';
import { StatusBadge } from '@/components/ui/Badge';
import { Briefcase, Users, CheckSquare, FileSpreadsheet, ClipboardList } from 'lucide-react';

export default async function AdminEmployeesPage() {
  const employees = await prisma.employee.findMany({
    include: {
      user: { select: { name: true, email: true, phone: true } },
      assignedLeads: { select: { id: true } },
      assignedTasks: { where: { status: { not: 'COMPLETED' } }, select: { id: true } },
      assignedApplications: { select: { id: true } },
      dailyReports: { orderBy: { submittedAt: 'desc' }, take: 1 },
    },
    orderBy: { createdAt: 'desc' },
  });

  return (
    <div className="space-y-4">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-white tracking-tight">Staff &amp; Relationship Desk</h1>
        <p className="text-xs text-slate-400 mt-0.5">
          Employee operational workload, lead assignments &amp; daily report tracking
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {employees.map((emp) => (
          <Card key={emp.id} className="p-4 space-y-3 bg-[#131C2E]">
            <div className="flex items-start justify-between">
              <div>
                <div className="font-bold text-sm text-white">{emp.user.name}</div>
                <div className="text-xs text-slate-400">{emp.user.email}</div>
                <div className="text-[11px] font-mono text-emerald-400 font-semibold mt-0.5">
                  {emp.employeeCode}
                </div>
              </div>
              <StatusBadge status={emp.status} />
            </div>

            <div className="pt-2 border-t border-slate-800 text-xs text-slate-300">
              <div>Dept: <strong className="text-white">{emp.department}</strong></div>
              <div>Role: {emp.designation}</div>
            </div>

            {/* Operational stats */}
            <div className="grid grid-cols-3 gap-2 text-center text-[11px] py-2 bg-slate-900/60 rounded-xl border border-slate-800">
              <div>
                <span className="text-slate-500 block">Leads</span>
                <strong className="text-white">{emp.assignedLeads.length}</strong>
              </div>
              <div>
                <span className="text-slate-500 block">Open Tasks</span>
                <strong className="text-white">{emp.assignedTasks.length}</strong>
              </div>
              <div>
                <span className="text-slate-500 block">Apps</span>
                <strong className="text-white">{emp.assignedApplications.length}</strong>
              </div>
            </div>

            {/* Latest Report */}
            {emp.dailyReports.length > 0 ? (
              <div className="text-[11px] text-slate-400 bg-slate-900/40 p-2 rounded-lg border border-slate-800/60">
                <span className="font-semibold text-slate-300">Latest Report: </span>
                {new Date(emp.dailyReports[0].submittedAt).toLocaleDateString()} (Calls: {emp.dailyReports[0].callsCount}, Conversions: {emp.dailyReports[0].conversionsCount})
              </div>
            ) : (
              <div className="text-[10px] text-slate-500 italic">No daily report filed today.</div>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}
