import React from 'react';
import prisma from '@/lib/prisma';
import { Card } from '@/components/ui/Card';
import { StatusBadge } from '@/components/ui/Badge';
import { FileSpreadsheet, User, Clock, FileText } from 'lucide-react';

export default async function AdminApplicationsPage() {
  const applications = await prisma.application.findMany({
    include: {
      customer: {
        include: { user: { select: { name: true, email: true, phone: true } } },
      },
      assignedEmployee: {
        include: { user: { select: { name: true } } },
      },
      documents: true,
    },
    orderBy: { createdAt: 'desc' },
  });

  return (
    <div className="space-y-4">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-white tracking-tight">Organization Applications</h1>
        <p className="text-xs text-slate-400 mt-0.5">
          Enterprise operational oversight across Demat, Mutual Funds, IPO, Insurance &amp; Loans
        </p>
      </div>

      <Card className="overflow-x-auto p-0 bg-[#131C2E] border-slate-800">
        <table className="w-full text-left text-xs text-slate-300">
          <thead className="bg-slate-900/80 text-[10px] uppercase font-bold text-slate-400 border-b border-slate-800">
            <tr>
              <th className="px-4 py-3">Application Number</th>
              <th className="px-4 py-3">Client</th>
              <th className="px-4 py-3">Category</th>
              <th className="px-4 py-3">Assigned Desk</th>
              <th className="px-4 py-3">Attached Docs</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Created</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/80">
            {applications.map((app) => (
              <tr key={app.id} className="hover:bg-slate-900/40 transition-colors">
                <td className="px-4 py-3 font-mono font-bold text-blue-400">
                  {app.applicationNumber}
                </td>
                <td className="px-4 py-3">
                  <div className="font-semibold text-white">{app.customer?.user.name}</div>
                  <div className="text-[11px] text-slate-400">{app.customer?.user.email}</div>
                </td>
                <td className="px-4 py-3">
                  <span className="px-2 py-0.5 rounded bg-slate-900 text-slate-200 border border-slate-800 font-medium">
                    {app.productCategory}
                  </span>
                </td>
                <td className="px-4 py-3 text-slate-300">
                  {app.assignedEmployee?.user.name || <span className="text-amber-400 italic">Unassigned</span>}
                </td>
                <td className="px-4 py-3">
                  {app.documents && app.documents.length > 0 ? (
                    <div className="space-y-1">
                      {app.documents.map((doc) => (
                        <div key={doc.id} className="flex items-center gap-1.5 text-[11px]">
                          <a
                            href={`/api/documents/download?id=${doc.id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-400 hover:underline flex items-center gap-0.5 font-medium"
                          >
                            <FileText className="w-3 h-3 text-blue-400" />
                            <span>{doc.title}</span>
                          </a>
                          <span className={`text-[9px] px-1 py-0.2 rounded font-mono ${doc.status === 'VERIFIED' ? 'bg-emerald-950 text-emerald-300' : 'bg-amber-950 text-amber-300'}`}>
                            {doc.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <span className="text-slate-500 text-[11px]">None attached</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <StatusBadge status={app.status} />
                </td>
                <td className="px-4 py-3 text-slate-500">
                  {new Date(app.createdAt).toLocaleDateString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
