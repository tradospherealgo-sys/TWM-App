'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { StatusBadge } from '@/components/ui/Badge';
import {
  FileSpreadsheet,
  Clock,
  UserCheck,
  CheckCircle2,
  X,
  FileText,
  Filter,
} from 'lucide-react';

interface Application {
  id: string;
  applicationNumber: string;
  productCategory: string;
  productCode: string;
  status: string;
  detailsJson: string;
  notes: string | null;
  createdAt: string;
  customer?: { user: { name: string; email: string; phone: string } };
}

const STATUS_OPTIONS = [
  'NEW',
  'IN_PROGRESS',
  'DOCUMENTS_REQUIRED',
  'SUBMITTED',
  'UNDER_REVIEW',
  'COMPLETED',
  'REJECTED',
  'CANCELLED',
];

export default function EmployeeApplicationsPage() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedApp, setSelectedApp] = useState<Application | null>(null);

  // Status update modal state
  const [newStatus, setNewStatus] = useState('');
  const [opNotes, setOpNotes] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    fetchApplications();
  }, []);

  async function fetchApplications() {
    try {
      setLoading(true);
      const res = await fetch('/api/applications');
      const data = await res.json();
      if (data.applications) setApplications(data.applications);
    } catch (e) {
      console.error('Fetch applications error:', e);
    } finally {
      setLoading(false);
    }
  }

  async function handleUpdateStatus() {
    if (!selectedApp || !newStatus) return;
    setIsUpdating(true);
    try {
      const res = await fetch(`/api/applications/${selectedApp.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: newStatus,
          notes: opNotes,
        }),
      });
      const data = await res.json();
      if (data.application) {
        setApplications(
          applications.map((a) => (a.id === selectedApp.id ? { ...a, ...data.application } : a))
        );
        setSelectedApp(null);
        setOpNotes('');
      } else {
        alert(data.error || 'Failed to update application');
      }
    } catch (e) {
      console.error('Update status error:', e);
    } finally {
      setIsUpdating(false);
    }
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-white tracking-tight">Applications Desk</h1>
        <p className="text-xs text-slate-400 mt-0.5">
          Review client applications, verify documentation &amp; transition workflow stages
        </p>
      </div>

      {/* Applications List */}
      {loading ? (
        <div className="p-12 text-center text-xs text-slate-400">Loading applications...</div>
      ) : applications.length > 0 ? (
        <div className="space-y-3">
          {applications.map((app) => (
            <Card
              key={app.id}
              variant="interactive"
              onClick={() => {
                setSelectedApp(app);
                setNewStatus(app.status);
              }}
              className="p-4 bg-[#131C2E] hover:border-slate-700 space-y-3"
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-blue-400" />
                    <span className="font-bold text-sm text-white">{app.productCode.replace(/_/g, ' ')}</span>
                  </div>
                  <div className="text-xs text-slate-400 mt-0.5">
                    Client: <strong className="text-slate-200">{app.customer?.user.name || 'Client'}</strong> ({app.customer?.user.phone})
                  </div>
                </div>
                <StatusBadge status={app.status} />
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs py-2 border-y border-slate-800">
                <div>
                  <span className="text-[10px] text-slate-500 uppercase block font-semibold">Ref ID</span>
                  <span className="font-mono text-slate-300">{app.applicationNumber}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 uppercase block font-semibold">Created Date</span>
                  <span className="text-slate-300">{new Date(app.createdAt).toLocaleDateString()}</span>
                </div>
              </div>

              {app.notes && (
                <p className="text-xs text-slate-400 bg-slate-900/60 p-2 rounded-lg line-clamp-2">
                  {app.notes}
                </p>
              )}

              <div className="text-right">
                <span className="text-xs text-blue-400 font-semibold hover:underline">
                  Review &amp; Update Status →
                </span>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="p-8 text-center text-xs text-slate-400">
          No applications assigned yet.
        </Card>
      )}

      {/* APPLICATION REVIEW MODAL */}
      {selectedApp && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#131C2E] border border-slate-800 rounded-2xl max-w-lg w-full p-5 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-base font-bold text-white">
                  Review File: {selectedApp.applicationNumber}
                </h2>
                <div className="text-xs text-slate-400 mt-0.5">
                  {selectedApp.productCode} • {selectedApp.customer?.user.name}
                </div>
              </div>
              <button
                onClick={() => setSelectedApp(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Submission Form Details */}
            <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
              <span className="text-[10px] uppercase font-semibold text-slate-400 block">
                Form Submission Details
              </span>
              <pre className="text-xs text-slate-300 whitespace-pre-wrap font-mono bg-slate-950 p-2.5 rounded-lg border border-slate-800/80 max-h-36 overflow-y-auto">
                {JSON.stringify(JSON.parse(selectedApp.detailsJson || '{}'), null, 2)}
              </pre>
            </div>

            {/* Attached KYC Documents */}
            <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
              <span className="text-[10px] uppercase font-semibold text-slate-400 block">
                Attached Documents
              </span>
              {(selectedApp as any).documents && (selectedApp as any).documents.length > 0 ? (
                <div className="space-y-2">
                  {(selectedApp as any).documents.map((doc: any) => (
                    <div
                      key={doc.id}
                      className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-between text-xs"
                    >
                      <div>
                        <div className="font-semibold text-white">{doc.title}</div>
                        <span className="text-[10px] text-slate-400">{doc.documentType}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <StatusBadge status={doc.status} />
                        <a
                          href={doc.fileUrl}
                          download
                          className="text-[11px] text-blue-400 hover:underline"
                        >
                          View
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-[11px] text-slate-500">No documents attached to this file yet.</p>
              )}
            </div>

            {/* Status Update Form */}
            <div className="space-y-3 pt-2 border-t border-slate-800">
              <div>
                <label className="text-xs font-semibold uppercase text-slate-300 block mb-1">
                  Transition Status
                </label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {STATUS_OPTIONS.map((st) => (
                    <option key={st} value={st}>
                      {st.replace(/_/g, ' ')}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold uppercase text-slate-400 block mb-1">
                  Operational Note (visible in customer timeline &amp; audit trail)
                </label>
                <textarea
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[70px]"
                  placeholder="e.g. KYC verified with NSDL depository; signature mismatch resolved..."
                  value={opNotes}
                  onChange={(e) => setOpNotes(e.target.value)}
                />
              </div>

              <div className="flex gap-2 pt-2">
                <Button
                  variant="primary"
                  size="md"
                  className="w-full text-xs"
                  isLoading={isUpdating}
                  onClick={handleUpdateStatus}
                >
                  Confirm Status Change
                </Button>
                <Button
                  variant="secondary"
                  size="md"
                  className="w-1/3 text-xs"
                  onClick={() => setSelectedApp(null)}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
