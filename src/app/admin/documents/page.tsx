'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { StatusBadge } from '@/components/ui/Badge';
import { StatusBanner } from '@/components/ui/StatusBanner';
import {
  FolderLock,
  FileText,
  Download,
  CheckCircle2,
  XCircle,
  Clock,
  User,
  Search,
  Filter,
  RefreshCw,
  AlertTriangle,
  ExternalLink,
  ShieldCheck,
  X,
} from 'lucide-react';

interface DocumentRecord {
  id: string;
  title: string;
  documentType: string;
  fileUrl: string;
  fileSize: number;
  mimeType: string;
  status: 'PENDING' | 'VERIFIED' | 'REJECTED';
  notes?: string | null;
  createdAt: string;
  user?: {
    name: string;
    email: string;
  };
  customer?: {
    id: string;
    customerCode: string;
    pan?: string | null;
  };
  application?: {
    applicationNumber: string;
    productCode: string;
  } | null;
}

export default function AdminDocumentsPage() {
  const [documents, setDocuments] = useState<DocumentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'ALL' | 'PENDING' | 'VERIFIED' | 'REJECTED'>('PENDING');
  const [searchQuery, setSearchQuery] = useState('');
  const [actionDoc, setActionDoc] = useState<DocumentRecord | null>(null);
  const [actionType, setActionType] = useState<'VERIFY' | 'REJECT' | null>(null);
  const [actionNotes, setActionNotes] = useState('');
  const [submittingAction, setSubmittingAction] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    fetchDocuments();
  }, []);

  async function fetchDocuments() {
    try {
      setLoading(true);
      const res = await fetch('/api/documents');
      const data = await res.json();
      if (res.ok && data.documents) {
        setDocuments(data.documents);
      } else {
        setNotification({
          type: 'error',
          message: data.error || 'Failed to fetch KYC documents',
        });
      }
    } catch (e: any) {
      console.error('Error fetching documents:', e);
      setNotification({
        type: 'error',
        message: e.message || 'Network error while loading documents',
      });
    } finally {
      setLoading(false);
    }
  }

  async function handleVerifySubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!actionDoc || !actionType) return;

    setSubmittingAction(true);
    setNotification(null);

    try {
      const res = await fetch(`/api/documents/${actionDoc.id}/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: actionType === 'VERIFY' ? 'VERIFIED' : 'REJECTED',
          notes: actionNotes.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setNotification({
          type: 'success',
          message: `Document "${actionDoc.title}" marked as ${actionType === 'VERIFY' ? 'VERIFIED' : 'REJECTED'}. Customer has been notified.`,
        });
        // Update local list
        setDocuments((prev) =>
          prev.map((d) =>
            d.id === actionDoc.id
              ? {
                  ...d,
                  status: actionType === 'VERIFY' ? 'VERIFIED' : 'REJECTED',
                  notes: actionNotes.trim() || null,
                }
              : d
          )
        );
        setActionDoc(null);
        setActionType(null);
        setActionNotes('');
      } else {
        setNotification({
          type: 'error',
          message: data.error || 'Failed to update document verification status',
        });
      }
    } catch (e: any) {
      setNotification({
        type: 'error',
        message: e.message || 'Error communicating with verification service',
      });
    } finally {
      setSubmittingAction(false);
    }
  }

  const pendingCount = documents.filter((d) => d.status === 'PENDING').length;
  const verifiedCount = documents.filter((d) => d.status === 'VERIFIED').length;
  const rejectedCount = documents.filter((d) => d.status === 'REJECTED').length;

  const filteredDocs = documents.filter((d) => {
    if (filter !== 'ALL' && d.status !== filter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const titleMatch = d.title.toLowerCase().includes(q);
      const typeMatch = d.documentType.toLowerCase().includes(q);
      const nameMatch = d.user?.name?.toLowerCase().includes(q);
      const emailMatch = d.user?.email?.toLowerCase().includes(q);
      return titleMatch || typeMatch || nameMatch || emailMatch;
    }
    return true;
  });

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <FolderLock className="w-6 h-6 text-emerald-400" />
            Client KYC &amp; Document Review Queue
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            SEBI &amp; DPDP compliance verification desk for PAN, Aadhaar, Bank Proofs &amp; Income Documents
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={fetchDocuments}
            disabled={loading}
            className="text-xs border-slate-700"
          >
            <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh Queue
          </Button>
        </div>
      </div>

      {notification && (
        <div
          className={`p-3.5 rounded-xl border text-xs flex items-center justify-between ${
            notification.type === 'success'
              ? 'bg-emerald-950/80 border-emerald-800 text-emerald-200'
              : 'bg-red-950/80 border-red-800 text-red-200'
          }`}
        >
          <span>{notification.message}</span>
          <button
            onClick={() => setNotification(null)}
            className="text-slate-400 hover:text-white ml-2 font-bold"
          >
            ×
          </button>
        </div>
      )}

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card className="p-3.5 bg-[#131C2E] border-slate-800 flex items-center justify-between">
          <div>
            <div className="text-[10px] text-slate-400 uppercase font-semibold">Total Documents</div>
            <div className="text-lg font-bold text-white mt-0.5">{documents.length}</div>
          </div>
          <FileText className="w-5 h-5 text-blue-400 opacity-80" />
        </Card>

        <Card className="p-3.5 bg-[#131C2E] border-amber-900/40 flex items-center justify-between">
          <div>
            <div className="text-[10px] text-amber-300 uppercase font-semibold">Pending Review</div>
            <div className="text-lg font-bold text-amber-400 mt-0.5">{pendingCount}</div>
          </div>
          <Clock className="w-5 h-5 text-amber-400 opacity-80" />
        </Card>

        <Card className="p-3.5 bg-[#131C2E] border-emerald-900/40 flex items-center justify-between">
          <div>
            <div className="text-[10px] text-emerald-300 uppercase font-semibold">Verified</div>
            <div className="text-lg font-bold text-emerald-400 mt-0.5">{verifiedCount}</div>
          </div>
          <CheckCircle2 className="w-5 h-5 text-emerald-400 opacity-80" />
        </Card>

        <Card className="p-3.5 bg-[#131C2E] border-red-900/40 flex items-center justify-between">
          <div>
            <div className="text-[10px] text-red-300 uppercase font-semibold">Action Required / Rejected</div>
            <div className="text-lg font-bold text-red-400 mt-0.5">{rejectedCount}</div>
          </div>
          <XCircle className="w-5 h-5 text-red-400 opacity-80" />
        </Card>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-1.5 overflow-x-auto text-xs">
          <button
            onClick={() => setFilter('PENDING')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
              filter === 'PENDING'
                ? 'bg-amber-950 text-amber-200 border border-amber-800 font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Pending Review ({pendingCount})
          </button>
          <button
            onClick={() => setFilter('ALL')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
              filter === 'ALL'
                ? 'bg-slate-800 text-white font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            All ({documents.length})
          </button>
          <button
            onClick={() => setFilter('VERIFIED')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
              filter === 'VERIFIED'
                ? 'bg-emerald-950 text-emerald-200 border border-emerald-800 font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Verified ({verifiedCount})
          </button>
          <button
            onClick={() => setFilter('REJECTED')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
              filter === 'REJECTED'
                ? 'bg-red-950 text-red-200 border border-red-800 font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Rejected ({rejectedCount})
          </button>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-500" />
          <input
            type="text"
            placeholder="Search client or doc..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />
        </div>
      </div>

      {/* Documents Review List */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="p-4 bg-[#131C2E] border-slate-800 animate-pulse space-y-3">
              <div className="h-4 w-48 bg-slate-800 rounded" />
              <div className="h-3 w-72 bg-slate-800/60 rounded" />
            </Card>
          ))}
        </div>
      ) : filteredDocs.length === 0 ? (
        <Card className="p-10 text-center bg-[#131C2E] border-slate-800 space-y-2">
          <FolderLock className="w-8 h-8 text-slate-500 mx-auto" />
          <div className="text-sm font-semibold text-white">No Documents in this Queue</div>
          <p className="text-xs text-slate-400">
            {filter === 'PENDING'
              ? 'Great work! All uploaded client documents have been reviewed and verified.'
              : 'No documents match the current filter criteria.'}
          </p>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredDocs.map((doc) => (
            <Card key={doc.id} className="p-4 bg-[#131C2E] border-slate-800 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <span className="w-10 h-10 rounded-xl bg-blue-600/10 text-blue-400 flex items-center justify-center shrink-0">
                    <FileText className="w-5 h-5" />
                  </span>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h2 className="text-sm font-bold text-white">{doc.title}</h2>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono font-semibold">
                        {doc.documentType}
                      </span>
                      <StatusBadge status={doc.status} />
                    </div>

                    <div className="flex items-center gap-3 text-xs text-slate-400 mt-1 flex-wrap">
                      <span className="flex items-center gap-1 text-slate-300">
                        <User className="w-3 h-3 text-slate-400" />
                        {doc.user?.name || 'Client'} ({doc.user?.email || 'N/A'})
                      </span>
                      <span>•</span>
                      <span>Size: {Math.max(1, Math.round(doc.fileSize / 1024))} KB</span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(doc.createdAt).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>

                    {doc.application && (
                      <div className="text-[11px] text-blue-400 font-mono mt-1">
                        Linked Application: {doc.application.applicationNumber} ({doc.application.productCode})
                      </div>
                    )}
                  </div>
                </div>

                {/* Action buttons */}
                <div className="flex items-center gap-2 self-start shrink-0">
                  <a
                    href={`/api/documents/download?id=${doc.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition-colors"
                  >
                    <Download className="w-3.5 h-3.5 text-blue-400" />
                    Download
                  </a>

                  {doc.status !== 'VERIFIED' && (
                    <Button
                      size="sm"
                      variant="primary"
                      onClick={() => {
                        setActionDoc(doc);
                        setActionType('VERIFY');
                        setActionNotes('Document verified against regulatory guidelines.');
                      }}
                      className="text-xs bg-emerald-600 hover:bg-emerald-500 text-white"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                      Approve
                    </Button>
                  )}

                  {doc.status !== 'REJECTED' && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setActionDoc(doc);
                        setActionType('REJECT');
                        setActionNotes('');
                      }}
                      className="text-xs border-red-800/80 text-red-300 hover:bg-red-950/40"
                    >
                      <XCircle className="w-3.5 h-3.5 mr-1" />
                      Reject
                    </Button>
                  )}
                </div>
              </div>

              {doc.notes && (
                <div className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-800 text-xs text-slate-300">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">
                    Reviewer Note:
                  </span>
                  <p className="text-[11px] text-slate-300">{doc.notes}</p>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}

      {/* VERIFY / REJECT MODAL */}
      {actionDoc && actionType && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#131C2E] border border-slate-800 rounded-2xl max-w-md w-full p-5 space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  {actionType === 'VERIFY' ? (
                    <>
                      <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                      Approve &amp; Verify Document
                    </>
                  ) : (
                    <>
                      <XCircle className="w-5 h-5 text-red-400" />
                      Reject Document
                    </>
                  )}
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Target Document: <span className="font-semibold text-white">{actionDoc.title}</span> ({actionDoc.documentType})
                </p>
              </div>
              <button
                onClick={() => {
                  setActionDoc(null);
                  setActionType(null);
                }}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleVerifySubmit} className="space-y-3 text-xs">
              <div>
                <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                  {actionType === 'VERIFY' ? 'Approval Note (Optional)' : 'Rejection Reason *'}
                </label>
                <textarea
                  rows={3}
                  placeholder={
                    actionType === 'VERIFY'
                      ? 'e.g. Verified with KRA/ITR records.'
                      : 'e.g. Document image is blurry or expired. Please re-upload a clear copy.'
                  }
                  value={actionNotes}
                  onChange={(e) => setActionNotes(e.target.value)}
                  required={actionType === 'REJECT'}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex items-center gap-2 pt-2 border-t border-slate-800">
                <Button
                  type="submit"
                  size="md"
                  variant={actionType === 'VERIFY' ? 'primary' : 'outline'}
                  isLoading={submittingAction}
                  className={`w-full text-xs ${
                    actionType === 'VERIFY'
                      ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                      : 'border-red-800 bg-red-950/60 text-red-200 hover:bg-red-900'
                  }`}
                >
                  {actionType === 'VERIFY' ? 'Confirm Approval' : 'Submit Rejection'}
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  size="md"
                  className="w-1/3 text-xs"
                  onClick={() => {
                    setActionDoc(null);
                    setActionType(null);
                  }}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
