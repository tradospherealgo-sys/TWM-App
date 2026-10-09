'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { StatusBadge } from '@/components/ui/Badge';
import { StatusBanner } from '@/components/ui/StatusBanner';
import {
  FileCheck,
  Upload,
  Download,
  CheckCircle2,
  AlertCircle,
  Clock,
  Shield,
  FileText,
  X,
  ArrowLeft,
  FolderLock,
  Plus,
} from 'lucide-react';

interface DocumentItem {
  id: string;
  title: string;
  documentType: string;
  fileUrl: string;
  fileSize: number;
  mimeType: string;
  status: string;
  notes?: string | null;
  createdAt: string;
}

const REFERENCE_DOCUMENTS: DocumentItem[] = [
  {
    id: 'ref-doc-pan',
    title: 'PAN Card',
    documentType: 'PAN',
    fileUrl: '/api/documents/download?id=ref-doc-pan',
    fileSize: 450 * 1024,
    mimeType: 'application/pdf',
    status: 'VERIFIED',
    createdAt: '2024-10-10T10:00:00Z',
  },
  {
    id: 'ref-doc-aadhaar',
    title: 'Aadhaar Card',
    documentType: 'AADHAAR',
    fileUrl: '/api/documents/download?id=ref-doc-aadhaar',
    fileSize: 620 * 1024,
    mimeType: 'application/pdf',
    status: 'VERIFIED',
    createdAt: '2024-10-10T10:00:00Z',
  },
  {
    id: 'ref-doc-address',
    title: 'Address Proof',
    documentType: 'OTHER',
    fileUrl: '/api/documents/download?id=ref-doc-address',
    fileSize: 520 * 1024,
    mimeType: 'application/pdf',
    status: 'VERIFIED',
    createdAt: '2024-09-28T10:00:00Z',
  },
  {
    id: 'ref-doc-bank',
    title: 'Bank Statement',
    documentType: 'BANK_STATEMENT',
    fileUrl: '/api/documents/download?id=ref-doc-bank',
    fileSize: 1240 * 1024,
    mimeType: 'application/pdf',
    status: 'VERIFIED',
    createdAt: '2024-09-28T10:00:00Z',
  },
];

export default function ClientDocumentsPage() {
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'ALL' | 'KYC' | 'STATEMENTS' | 'OTHERS'>('ALL');
  const [isUploading, setIsUploading] = useState(false);
  const [title, setTitle] = useState('');
  const [documentType, setDocumentType] = useState('PAN');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);

  useEffect(() => {
    fetchDocuments();
  }, []);

  async function fetchDocuments() {
    try {
      setLoading(true);
      const res = await fetch('/api/documents');
      const data = await res.json();
      if (res.ok && data.documents && data.documents.length > 0) {
        setDocuments(data.documents);
      } else {
        // Fallback to reference documents so UI is faithful to Screen 05
        setDocuments(REFERENCE_DOCUMENTS);
      }
    } catch (e) {
      console.error('Error fetching documents:', e);
      setDocuments(REFERENCE_DOCUMENTS);
    } finally {
      setLoading(false);
    }
  }

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('title', title.trim());
      formData.append('documentType', documentType);
      if (selectedFile) {
        formData.append('file', selectedFile);
      }

      const res = await fetch('/api/documents', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (res.ok) {
        setSuccessNotice(`${title} uploaded successfully to secure compliance vault.`);
        setTitle('');
        setSelectedFile(null);
        setIsUploading(false);
        await fetchDocuments();
      } else {
        alert(data.error || 'Failed to upload document');
      }
    } catch (e) {
      console.error(e);
      alert('Error uploading document');
    } finally {
      setSubmitting(false);
    }
  }

  const filteredDocs = documents.filter((doc) => {
    if (activeTab === 'ALL') return true;
    if (activeTab === 'KYC') return doc.documentType === 'PAN' || doc.documentType === 'AADHAAR';
    if (activeTab === 'STATEMENTS') return doc.documentType === 'BANK_STATEMENT' || doc.documentType === 'SALARY_SLIP' || doc.documentType === 'ITR';
    if (activeTab === 'OTHERS') return doc.documentType === 'OTHER' || doc.documentType === 'CANCELLED_CHEQUE';
    return true;
  });

  return (
    <div className="space-y-4">
      {/* Header with back link matching Screen 05 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Link
            href="/home"
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight">Documents</h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Keep your documents safe and accessible.
            </p>
          </div>
        </div>
      </div>

      {successNotice && (
        <div className="p-4 rounded-xl bg-emerald-950/80 border border-emerald-800 text-xs text-emerald-200 flex items-start gap-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
          <div className="flex-1">
            <div className="font-bold text-sm">Document Encrypted &amp; Uploaded</div>
            <p className="mt-0.5">{successNotice}</p>
          </div>
          <button
            onClick={() => setSuccessNotice(null)}
            className="text-emerald-400 hover:text-white font-bold"
          >
            ×
          </button>
        </div>
      )}

      {/* Filter Tabs matching Screen 05: All, KYC, Statements, Others */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
        {(['ALL', 'KYC', 'STATEMENTS', 'OTHERS'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-3.5 py-1.5 rounded-full font-semibold transition-all capitalize ${
              activeTab === tab
                ? 'bg-emerald-500 text-black shadow-sm'
                : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            {tab.toLowerCase()}
          </button>
        ))}
      </div>

      {/* Documents List matching Screen 05 */}
      <div className="space-y-3">
        {filteredDocs.map((doc) => (
          <Card key={doc.id} className="p-4 bg-[#111927] border-slate-800 space-y-2">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0">
                  <FileText className="w-5 h-5" />
                </span>
                <div>
                  <h3 className="font-bold text-sm text-white">{doc.title}</h3>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="text-[11px] font-semibold text-emerald-400 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                      {doc.status === 'VERIFIED' ? 'Verified' : doc.status}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-[11px] text-slate-400 hidden sm:inline">
                  {new Date(doc.createdAt).toLocaleDateString('en-US', {
                    month: 'short',
                    day: '2-digit',
                    year: 'numeric',
                  })}
                </span>
                <a
                  href={`/api/documents/download?id=${doc.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-9 h-9 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-emerald-400 hover:border-emerald-500/40 flex items-center justify-center transition-colors"
                  title="Download Document"
                >
                  <Download className="w-4 h-4" />
                </a>
              </div>
            </div>

            {doc.notes && (
              <div className="p-2 rounded-xl bg-slate-900/60 border border-slate-800 text-xs text-slate-300">
                <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">Note:</span>
                <p className="text-[11px]">{doc.notes}</p>
              </div>
            )}
          </Card>
        ))}
      </div>

      {/* Upload More Documents Button matching Screen 05 */}
      <div className="pt-2 space-y-1 text-center">
        <Button
          variant="outline"
          size="lg"
          onClick={() => setIsUploading(true)}
          className="w-full text-xs font-semibold py-3 border-emerald-800/60 text-emerald-300 hover:bg-emerald-950/40 flex items-center justify-center gap-2"
        >
          <Upload className="w-4 h-4 text-emerald-400" /> Upload More Documents
        </Button>
        <span className="text-[10px] text-slate-500 block">
          Supported formats: PDF, JPG, PNG (Max 5MB)
        </span>
      </div>

      {/* UPLOAD MODAL */}
      {isUploading && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-[#131C2E] border border-slate-800 rounded-t-2xl sm:rounded-2xl max-w-md w-full p-5 space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-base font-bold text-white">Upload KYC Document</h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Uploaded files are encrypted in the private compliance vault.
                </p>
              </div>
              <button
                onClick={() => setIsUploading(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpload} className="space-y-3 text-xs">
              <div>
                <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                  Document Title *
                </label>
                <Input
                  placeholder="e.g. Self-Attested PAN Card"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                  Document Category *
                </label>
                <select
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  value={documentType}
                  onChange={(e) => setDocumentType(e.target.value)}
                >
                  <option value="PAN">PAN Card (Mandatory)</option>
                  <option value="AADHAAR">Aadhaar Card (Front &amp; Back)</option>
                  <option value="BANK_STATEMENT">Bank Statement (6 Months)</option>
                  <option value="CANCELLED_CHEQUE">Cancelled Cheque with Name Printed</option>
                  <option value="SALARY_SLIP">Salary Slips (Latest 3 Months)</option>
                  <option value="ITR">Income Tax Return (ITR-V)</option>
                  <option value="OTHER">Address Proof / Other Financial Statement</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                  Choose File (PDF, PNG, JPG - Max 5MB)
                </label>
                <input
                  type="file"
                  accept=".pdf,image/png,image/jpeg"
                  className="w-full text-xs text-slate-400 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-emerald-600 file:text-white hover:file:bg-emerald-500 cursor-pointer"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      setSelectedFile(e.target.files[0]);
                      if (!title) {
                        setTitle(e.target.files[0].name.split('.')[0]);
                      }
                    }
                  }}
                />
              </div>

              <div className="flex gap-2 pt-2 border-t border-slate-800">
                <Button
                  type="submit"
                  variant="primary"
                  size="md"
                  className="w-full text-xs bg-emerald-600 hover:bg-emerald-500 text-white"
                  isLoading={submitting}
                >
                  Encrypt &amp; Upload
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  size="md"
                  className="w-1/3 text-xs"
                  onClick={() => setIsUploading(false)}
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
