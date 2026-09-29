import React from 'react';
import prisma from '@/lib/prisma';
import { Card } from '@/components/ui/Card';
import { StatusBadge } from '@/components/ui/Badge';
import { Layers, Users, Phone, Mail, ArrowRight } from 'lucide-react';

export default async function AdminCrmPage() {
  const leads = await prisma.lead.findMany({
    include: {
      assignedEmployee: {
        include: { user: { select: { name: true } } },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  // Count leads by status
  const stages = [
    'NEW_LEAD',
    'CONTACTED',
    'INTERESTED',
    'FOLLOW_UP',
    'DOCUMENTS_REQUIRED',
    'APPLICATION',
    'COMPLETED',
    'LOST_CLOSED',
  ];

  const countsByStage: Record<string, number> = {};
  for (const st of stages) {
    countsByStage[st] = leads.filter((l) => l.status === st).length;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-white tracking-tight">Enterprise CRM &amp; Pipeline</h1>
        <p className="text-xs text-slate-400 mt-0.5">
          Organization-wide lead progression, employee assignments &amp; conversion metrics
        </p>
      </div>

      {/* Pipeline Stage Funnel Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
        {stages.map((st) => (
          <div key={st} className="p-3 rounded-xl bg-[#131C2E] border border-slate-800 text-center">
            <div className="text-[10px] uppercase font-bold text-slate-400 truncate">
              {st.replace(/_/g, ' ')}
            </div>
            <div className="text-xl font-bold text-white mt-1">{countsByStage[st] || 0}</div>
          </div>
        ))}
      </div>

      {/* Leads Table */}
      <Card className="overflow-x-auto p-0 bg-[#131C2E] border-slate-800">
        <table className="w-full text-left text-xs text-slate-300">
          <thead className="bg-slate-900/80 text-[10px] uppercase font-bold text-slate-400 border-b border-slate-800">
            <tr>
              <th className="px-4 py-3">Lead Name</th>
              <th className="px-4 py-3">Interest</th>
              <th className="px-4 py-3">Source</th>
              <th className="px-4 py-3">Assigned Staff</th>
              <th className="px-4 py-3">Pipeline Stage</th>
              <th className="px-4 py-3">Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/80">
            {leads.map((lead) => (
              <tr key={lead.id} className="hover:bg-slate-900/40 transition-colors">
                <td className="px-4 py-3">
                  <div className="font-semibold text-white">{lead.name}</div>
                  <div className="text-[11px] text-slate-400">{lead.phone}</div>
                </td>
                <td className="px-4 py-3">
                  <span className="px-2 py-0.5 rounded bg-slate-900 text-slate-200 border border-slate-800 font-medium text-[11px]">
                    {lead.productInterest}
                  </span>
                </td>
                <td className="px-4 py-3 text-slate-400">{lead.source}</td>
                <td className="px-4 py-3 text-slate-300">
                  {lead.assignedEmployee ? lead.assignedEmployee.user.name : <span className="text-amber-400 italic">Unassigned</span>}
                </td>
                <td className="px-4 py-3">
                  <StatusBadge status={lead.status} />
                </td>
                <td className="px-4 py-3 text-slate-500">
                  {new Date(lead.createdAt).toLocaleDateString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
