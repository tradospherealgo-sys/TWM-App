'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { StatusBadge } from '@/components/ui/Badge';
import { StatusBanner } from '@/components/ui/StatusBanner';
import { EmptyState } from '@/components/ui/EmptyState';
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

export default function ClientDocumentsPage() {
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [loading, setLoading] = useState(true);
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
      if (data.documents) {
        setDocuments(data.documents);
      }
    } catch (e) {
      console.error('Error fetching documents:', e);
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
        setSuccessNotice(`${title} uploaded successfully to secure storage vault.`);
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

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">KYC &amp; Document Vault</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Encrypted repository for Demat, Mutual Funds &amp; Loan verification
          </p>
        </div>

        <Button
          size="sm"
          variant="primary"
          onClick={() => setIsUploading(true)}
          className="text-xs shrink-0"
        >
          <Upload className="w-3.5 h-3.5 mr-1" /> Upload Document
        </Button>
      </div>

      <StatusBanner
        type="regulatory"
        title="DPDP Act &amp; SEBI Compliance"
        message="Your KYC documents are stored in an encrypted vault. Files are role-gated and strictly accessible only to authorized compliance officers for verification purposes."
      />

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

      {/* Documents List */}
      {loading ? (
        <div className="p-8 text-center text-xs text-slate-400">Loading document vault...</div>
      ) : documents.length > 0 ? (
        <div className="space-y-3">
          {documents.map((doc) => (
            <Card key={doc.id} className="p-4 space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-start gap-2.5">
                  <span className="w-9 h-9 rounded-xl bg-blue-600/10 text-blue-400 flex items-center justify-center shrink-0">
                    <FileText className="w-4 h-4" />
                  </span>
                  <div>
                    <h3 className="font-bold text-sm text-white">{doc.title}</h3>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono font-semibold">
                        {doc.documentType}
                      </span>
                      <span className="text-[11px] text-slate-500">
                        {Math.max(1, Math.round(doc.fileSize / 1024))} KB
                      </span>
                    </div>
                  </div>
                </div>

                <StatusBadge status={doc.status} />
              </div>

              {/* Status notes from reviewer */}
              {doc.notes && (
                <div className="p-2.5 rounded-xl bg-blue-950/20 border border-blue-900/30 text-xs text-blue-200">
                  <span className="text-[10px] uppercase font-bold text-blue-400 block mb-0.5">
                    Reviewer Note:
                  </span>
                  <p className="text-[11px]">{doc.notes}</p>
                </div>
              )}

              <div className="flex items-center justify-between pt-2 border-t border-slate-800 text-[11px] text-slate-400">
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  Uploaded on {new Date(doc.createdAt).toLocaleDateString()}
                </span>

                <a
                  href={`/api/documents/download?id=${doc.id}`}
                  className="inline-flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 font-medium"
                >
                  <Download className="w-3.5 h-3.5" /> Download
                </a>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={FileCheck}
          title="No documents uploaded"
          description="Upload your PAN, Aadhaar, or Bank Proof to expedite Demat and loan onboarding."
          actionLabel="Upload First Document"
          onAction={() => setIsUploading(true)}
        />
      )}

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
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={documentType}
                  onChange={(e) => setDocumentType(e.target.value)}
                >
                  <option value="PAN">PAN Card (Mandatory)</option>
                  <option value="AADHAAR">Aadhaar Card (Front &amp; Back)</option>
                  <option value="BANK_STATEMENT">Bank Statement (6 Months)</option>
                  <option value="CANCELLED_CHEQUE">Cancelled Cheque with Name Printed</option>
                  <option value="SALARY_SLIP">Salary Slips (Latest 3 Months)</option>
                  <option value="ITR">Income Tax Return (ITR-V)</option>
                  <option value="OTHER">Other Proof / Financial Statement</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                  Choose File (PDF, PNG, JPG)
                </label>
                <input
                  type="file"
                  accept=".pdf,image/png,image/jpeg"
                  className="w-full text-xs text-slate-400 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-500 cursor-pointer"
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
                  className="w-full text-xs"
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
