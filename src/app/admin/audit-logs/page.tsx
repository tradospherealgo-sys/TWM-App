import React from 'react';
import prisma from '@/lib/prisma';
import { Card } from '@/components/ui/Card';
import { ScrollText, ShieldAlert, User, Clock, Terminal } from 'lucide-react';

export default async function AdminAuditLogsPage() {
  const logs = await prisma.activityLog.findMany({
    include: {
      actorUser: { select: { name: true, email: true, role: true } },
    },
    orderBy: { createdAt: 'desc' },
    take: 100,
  });

  return (
    <div className="space-y-4">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-white tracking-tight">Security &amp; Audit Logs</h1>
        <p className="text-xs text-slate-400 mt-0.5">
          Tamper-evident record of user role changes, status updates &amp; operational events
        </p>
      </div>

      <Card className="overflow-x-auto p-0 bg-[#131C2E] border-slate-800">
        <table className="w-full text-left text-xs text-slate-300">
          <thead className="bg-slate-900/80 text-[10px] uppercase font-bold text-slate-400 border-b border-slate-800">
            <tr>
              <th className="px-4 py-3">Timestamp</th>
              <th className="px-4 py-3">Action</th>
              <th className="px-4 py-3">Actor</th>
              <th className="px-4 py-3">Entity</th>
              <th className="px-4 py-3">Details</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/80 font-mono text-[11px]">
            {logs.map((log) => {
              let details: any = {};
              try {
                details = JSON.parse(log.detailsJson || '{}');
              } catch {
                details = {};
              }

              return (
                <tr key={log.id} className="hover:bg-slate-900/40 transition-colors">
                  <td className="px-4 py-3 text-slate-400 whitespace-nowrap">
                    {new Date(log.createdAt).toLocaleString()}
                  </td>
                  <td className="px-4 py-3 font-semibold text-blue-400 whitespace-nowrap">
                    {log.action}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className="text-white font-sans font-medium">
                      {log.actorUser ? log.actorUser.name : 'System'}
                    </span>
                    <span className="text-slate-500 ml-1 font-mono text-[10px]">
                      ({log.actorRole})
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-300 whitespace-nowrap">
                    {log.entityType}
                  </td>
                  <td className="px-4 py-3 text-slate-400 max-w-xs truncate font-mono text-[10px]">
                    {JSON.stringify(details)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
