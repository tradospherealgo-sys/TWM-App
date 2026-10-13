'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { StatusBadge } from '@/components/ui/Badge';
import { StatusBanner } from '@/components/ui/StatusBanner';
import {
  User,
  Shield,
  FileCheck,
  FolderLock,
  Lock,
  Phone,
  Mail,
  Bell,
  HelpCircle,
  LogOut,
  Upload,
  Download,
  CheckCircle2,
  AlertCircle,
  Clock,
  ChevronRight,
  ShieldCheck,
  X,
  FileText,
  Plus,
  ArrowLeft,
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

export default function ClientSettingsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialTab = (searchParams.get('tab') as any) || 'profile';

  const [activeTab, setActiveTab] = useState<'profile' | 'documents' | 'security' | 'preferences'>(
    ['profile', 'documents', 'security', 'preferences'].includes(initialTab) ? initialTab : 'profile'
  );

  const [user, setUser] = useState<any>(null);
  const [loadingUser, setLoadingUser] = useState(true);

  // Documents state
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [loadingDocs, setLoadingDocs] = useState(false);
  const [isUploadingDoc, setIsUploadingDoc] = useState(false);
  const [docTitle, setDocTitle] = useState('');
  const [docType, setDocType] = useState('PAN');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadingDoc, setUploadingDoc] = useState(false);
  const [docSuccessMessage, setDocSuccessMessage] = useState<string | null>(null);
  const [docErrorMessage, setDocErrorMessage] = useState<string | null>(null);

  // Password change state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');

  // Modals
  const [activeModal, setActiveModal] = useState<'PERSONAL' | 'CONTACT' | 'PRIVACY' | null>(null);

  const fetchUserData = useCallback(async () => {
    try {
      setLoadingUser(true);
      const res = await fetch('/api/auth/me');
      const data = await res.json();
      if (data.user) setUser(data.user);
    } catch (e) {
      console.error('Failed to load user in settings:', e);
    } finally {
      setLoadingUser(false);
    }
  }, []);

  const fetchDocuments = useCallback(async () => {
    try {
      setLoadingDocs(true);
      const res = await fetch('/api/documents');
      const data = await res.json();
      if (res.ok && data.documents) {
        setDocuments(data.documents);
      } else {
        setDocuments([]);
      }
    } catch (e) {
      console.error('Failed to load documents in settings:', e);
      setDocuments([]);
    } finally {
      setLoadingDocs(false);
    }
  }, []);

  useEffect(() => {
    fetchUserData();
  }, [fetchUserData]);

  useEffect(() => {
    if (activeTab === 'documents') {
      fetchDocuments();
    }
  }, [activeTab, fetchDocuments]);

  async function handleLogout() {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/login');
      router.refresh();
    } catch (e) {
      console.error(e);
    }
  }

  async function handlePasswordChange(e: React.FormEvent) {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');

    if (!currentPassword) {
      setPasswordError('Please enter your current password.');
      return;
    }
    if (newPassword.length < 8) {
      setPasswordError('New password must be at least 8 characters long.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('New password and confirmation do not match.');
      return;
    }

    setPasswordLoading(true);
    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword, confirmPassword }),
      });
      const data = await res.json();
      if (!res.ok) {
        setPasswordError(data.error || 'Failed to change password. Please verify current password.');
      } else {
        setPasswordSuccess('Password changed successfully. Your session has been updated.');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      }
    } catch {
      setPasswordError('Network or server error while updating password.');
    } finally {
      setPasswordLoading(false);
    }
  }

  async function handleUploadDocument(e: React.FormEvent) {
    e.preventDefault();
    setDocErrorMessage(null);
    setDocSuccessMessage(null);

    if (!docTitle.trim()) {
      setDocErrorMessage('Document title is required.');
      return;
    }

    setUploadingDoc(true);
    try {
      const formData = new FormData();
      formData.append('title', docTitle.trim());
      formData.append('documentType', docType);
      if (selectedFile) {
        formData.append('file', selectedFile);
      }

      const res = await fetch('/api/documents', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (res.ok) {
        setDocSuccessMessage(`${docTitle} uploaded successfully to secure compliance vault.`);
        setDocTitle('');
        setSelectedFile(null);
        setIsUploadingDoc(false);
        await fetchDocuments();
      } else {
        setDocErrorMessage(data.error || 'Failed to upload document.');
      }
    } catch {
      setDocErrorMessage('Network error while uploading document.');
    } finally {
      setUploadingDoc(false);
    }
  }

  const userName = user?.name || 'Client';
  const userEmail = user?.email || 'client@tradosphere.in';
  const initials =
    userName
      .split(' ')
      .map((n: string) => n[0])
      .join('')
      .slice(0, 2)
      .toUpperCase() || 'RA';

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Link
            href="/home"
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight">Settings &amp; Account</h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Manage your profile, security, and document records.
            </p>
          </div>
        </div>
      </div>

      {/* User Summary Card */}
      <Card className="p-4 bg-gradient-to-br from-[#111927] to-[#162235] border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center font-bold text-base tracking-wider">
            {initials}
          </div>
          <div>
            <h2 className="text-sm sm:text-base font-bold text-white">{userName}</h2>
            <div className="text-xs text-slate-400">{userEmail}</div>
            <div className="text-[10px] text-slate-500 font-mono mt-0.5">
              Client ID: {user?.customerProfile?.customerCode || 'TWM-CUST'}
            </div>
          </div>
        </div>
        <div className="text-right">
          <span className="text-[10px] text-slate-400 block mb-0.5">KYC Status</span>
          <StatusBadge status={user?.customerProfile?.kycStatus || 'VERIFIED'} />
        </div>
      </Card>

      {/* Settings Navigation Tabs */}
      <div className="grid grid-cols-4 gap-1 p-1 bg-slate-900 rounded-xl border border-slate-800 text-xs">
        <button
          onClick={() => setActiveTab('profile')}
          className={`py-2 rounded-lg font-semibold transition-all ${
            activeTab === 'profile'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Profile
        </button>
        <button
          onClick={() => setActiveTab('documents')}
          className={`py-2 rounded-lg font-semibold transition-all ${
            activeTab === 'documents'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Documents
        </button>
        <button
          onClick={() => setActiveTab('security')}
          className={`py-2 rounded-lg font-semibold transition-all ${
            activeTab === 'security'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Security
        </button>
        <button
          onClick={() => setActiveTab('preferences')}
          className={`py-2 rounded-lg font-semibold transition-all ${
            activeTab === 'preferences'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Preferences
        </button>
      </div>

      {/* TAB 1: PROFILE & ACCOUNT */}
      {activeTab === 'profile' && (
        <div className="space-y-3">
          <Card className="p-0 bg-[#111927] border-slate-800 divide-y divide-slate-800/80 overflow-hidden text-xs">
            <button
              onClick={() => setActiveModal('PERSONAL')}
              className="w-full px-4 py-3.5 flex items-center justify-between text-left hover:bg-slate-800/40 transition-colors"
            >
              <div className="flex items-center gap-3 text-slate-200">
                <User className="w-4 h-4 text-emerald-400" />
                <div>
                  <span className="font-medium text-slate-200 block">Personal Information</span>
                  <span className="text-[10px] text-slate-400">Name, Client Code, PAN</span>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-500" />
            </button>

            <button
              onClick={() => setActiveModal('CONTACT')}
              className="w-full px-4 py-3.5 flex items-center justify-between text-left hover:bg-slate-800/40 transition-colors"
            >
              <div className="flex items-center gap-3 text-slate-200">
                <Phone className="w-4 h-4 text-emerald-400" />
                <div>
                  <span className="font-medium text-slate-200 block">Contact Details</span>
                  <span className="text-[10px] text-slate-400">Registered Email and Mobile</span>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-500" />
            </button>

            <Link
              href="/support"
              className="w-full px-4 py-3.5 flex items-center justify-between text-left hover:bg-slate-800/40 transition-colors"
            >
              <div className="flex items-center gap-3 text-slate-200">
                <HelpCircle className="w-4 h-4 text-emerald-400" />
                <div>
                  <span className="font-medium text-slate-200 block">Client Support Desk</span>
                  <span className="text-[10px] text-slate-400">Raise tickets &amp; contact advisory desk</span>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-500" />
            </Link>
          </Card>

          {/* Quick Demat Linking Info */}
          <Card className="p-4 bg-[#111927] border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center">
                <Shield className="w-4 h-4" />
              </span>
              <div>
                <div className="text-xs font-bold text-white">SMC Ace Demat Gateway</div>
                <div className="text-[11px] text-slate-400">Authorised Person: Tradosphere</div>
              </div>
            </div>
            <Link href="/applications">
              <Button size="sm" variant="outline" className="text-xs">
                View Status
              </Button>
            </Link>
          </Card>
        </div>
      )}

      {/* TAB 2: CONSOLIDATED DOCUMENTS */}
      {activeTab === 'documents' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-white">Compliance Documents</h2>
              <p className="text-xs text-slate-400">
                Encrypted at rest under SEBI compliance guidelines.
              </p>
            </div>
            <Button
              size="sm"
              variant="primary"
              onClick={() => setIsUploadingDoc(true)}
              className="text-xs bg-emerald-600 hover:bg-emerald-500 text-white flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" /> Upload Document
            </Button>
          </div>

          {docSuccessMessage && (
            <div className="p-3 rounded-xl bg-emerald-950/60 border border-emerald-800/80 text-emerald-300 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{docSuccessMessage}</span>
            </div>
          )}

          {docErrorMessage && (
            <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-800/80 text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{docErrorMessage}</span>
            </div>
          )}

          {/* Upload Modal / Drawer */}
          {isUploadingDoc && (
            <Card className="p-4 bg-[#131C2E] border-slate-800 space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <span className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Upload className="w-4 h-4 text-emerald-400" /> Upload New Document
                </span>
                <button
                  onClick={() => setIsUploadingDoc(false)}
                  className="text-slate-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleUploadDocument} className="space-y-3 text-xs">
                <div>
                  <label className="text-slate-400 block mb-1">Document Title</label>
                  <Input
                    placeholder="e.g. PAN Card Copy, Bank Statement"
                    value={docTitle}
                    onChange={(e) => setDocTitle(e.target.value)}
                    required
                    className="text-xs"
                  />
                </div>

                <div>
                  <label className="text-slate-400 block mb-1">Document Type</label>
                  <select
                    value={docType}
                    onChange={(e) => setDocType(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-900 border border-slate-800 text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  >
                    <option value="PAN">PAN Card</option>
                    <option value="AADHAAR">Aadhaar Card</option>
                    <option value="BANK_STATEMENT">Bank Statement</option>
                    <option value="INCOME_PROOF">Income Proof / ITR</option>
                    <option value="DEMAT_CML">Demat CML / Holding</option>
                    <option value="OTHER">Other Compliance Document</option>
                  </select>
                </div>

                <div>
                  <label className="text-slate-400 block mb-1">File Attachment (Optional)</label>
                  <input
                    type="file"
                    onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                    className="w-full text-xs text-slate-400 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-slate-800 file:text-slate-200 hover:file:bg-slate-700"
                  />
                </div>

                <div className="flex gap-2 pt-1">
                  <Button
                    type="submit"
                    variant="primary"
                    size="sm"
                    isLoading={uploadingDoc}
                    className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white text-xs"
                  >
                    Submit to Vault
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() => setIsUploadingDoc(false)}
                    className="text-xs"
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </Card>
          )}

          {/* Document List */}
          {loadingDocs ? (
            <div className="p-8 text-center text-xs text-slate-400">Loading documents...</div>
          ) : documents.length === 0 ? (
            <Card className="p-6 text-center bg-[#111927] border-slate-800 space-y-2">
              <FolderLock className="w-8 h-8 text-slate-500 mx-auto" />
              <div className="text-xs font-semibold text-slate-300">No documents uploaded yet</div>
              <p className="text-[11px] text-slate-400 max-w-xs mx-auto">
                Upload your PAN, Aadhaar, or Bank statements for KYC verification and Demat account opening.
              </p>
            </Card>
          ) : (
            <div className="space-y-2">
              {documents.map((doc) => (
                <Card
                  key={doc.id}
                  className="p-3.5 bg-[#111927] border-slate-800 flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-slate-800 flex items-center justify-center text-emerald-400 shrink-0">
                      <FileCheck className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-white">{doc.title}</div>
                      <div className="text-[10px] text-slate-400 mt-0.5 flex items-center gap-2">
                        <span className="font-mono">{doc.documentType}</span>
                        <span>•</span>
                        <span>{new Date(doc.createdAt).toLocaleDateString('en-IN')}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <StatusBadge status={doc.status} />
                    {doc.fileUrl && (
                      <a
                        href={`/api/documents/download?id=${doc.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-400 hover:bg-slate-800 transition-colors"
                        title="Download Document"
                      >
                        <Download className="w-4 h-4" />
                      </a>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: SECURITY */}
      {activeTab === 'security' && (
        <div className="space-y-3">
          <Card className="p-5 bg-[#111927] border-slate-800 space-y-4">
            <div>
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <Lock className="w-4 h-4 text-emerald-400" /> Change Account Password
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Passwords must contain at least 8 characters.
              </p>
            </div>

            {passwordError && (
              <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-800/80 text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{passwordError}</span>
              </div>
            )}
            {passwordSuccess && (
              <div className="p-3 rounded-xl bg-emerald-950/60 border border-emerald-800/80 text-emerald-300 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{passwordSuccess}</span>
              </div>
            )}

            <form onSubmit={handlePasswordChange} className="space-y-3 text-xs">
              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Current Password</label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  required
                  className="w-full px-3 py-2 text-xs rounded-xl bg-slate-900 border border-slate-800 text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  placeholder="Enter current password"
                />
              </div>

              <div>
                <label className="text-[11px] text-slate-400 block mb-1">New Password</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  className="w-full px-3 py-2 text-xs rounded-xl bg-slate-900 border border-slate-800 text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  placeholder="Min 8 chars"
                />
              </div>

              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Confirm New Password</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className="w-full px-3 py-2 text-xs rounded-xl bg-slate-900 border border-slate-800 text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  placeholder="Re-enter new password"
                />
              </div>

              <Button
                type="submit"
                variant="primary"
                size="md"
                isLoading={passwordLoading}
                className="w-full text-xs bg-emerald-600 hover:bg-emerald-500 text-white mt-1"
              >
                Update Password
              </Button>
            </form>
          </Card>

          <Card className="p-4 bg-[#111927] border-slate-800 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2.5">
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
              <div>
                <span className="font-semibold text-white block">Session Encryption</span>
                <span className="text-[10px] text-slate-400">HS256 Authenticated Token • 7-day expiry</span>
              </div>
            </div>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800 font-semibold">
              Active
            </span>
          </Card>
        </div>
      )}

      {/* TAB 4: PREFERENCES & PRIVACY */}
      {activeTab === 'preferences' && (
        <div className="space-y-3">
          <Card className="p-0 bg-[#111927] border-slate-800 divide-y divide-slate-800/80 overflow-hidden text-xs">
            <Link
              href="/notifications"
              className="w-full px-4 py-3.5 flex items-center justify-between text-left hover:bg-slate-800/40 transition-colors"
            >
              <div className="flex items-center gap-3 text-slate-200">
                <Bell className="w-4 h-4 text-emerald-400" />
                <div>
                  <span className="font-medium text-slate-200 block">Notifications &amp; Alerts</span>
                  <span className="text-[10px] text-slate-400">Account, market alerts and advisory updates</span>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-500" />
            </Link>

            <button
              onClick={() => setActiveModal('PRIVACY')}
              className="w-full px-4 py-3.5 flex items-center justify-between text-left hover:bg-slate-800/40 transition-colors"
            >
              <div className="flex items-center gap-3 text-slate-200">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <div>
                  <span className="font-medium text-slate-200 block">Privacy &amp; DPDP Compliance</span>
                  <span className="text-[10px] text-slate-400">Data retention, zero sale guarantee, SEBI guidelines</span>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-500" />
            </button>
          </Card>
        </div>
      )}

      {/* Sign Out Action */}
      <div className="pt-2">
        <Button
          variant="outline"
          size="lg"
          onClick={handleLogout}
          className="w-full text-xs font-semibold py-3 border-red-900/60 text-red-400 hover:bg-red-950/40 flex items-center justify-center gap-2"
        >
          <LogOut className="w-4 h-4" /> Sign Out
        </Button>
      </div>

      {/* PERSONAL INFO MODAL */}
      {activeModal === 'PERSONAL' && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#131C2E] border border-slate-800 rounded-2xl max-w-md w-full p-5 space-y-4 text-xs">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <User className="w-4 h-4 text-emerald-400" /> Personal Information
              </h2>
              <button onClick={() => setActiveModal(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-2.5">
              <div className="flex justify-between py-1.5 border-b border-slate-800">
                <span className="text-slate-400">Full Name</span>
                <span className="text-white font-semibold">{user?.name}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-800">
                <span className="text-slate-400">Client Code</span>
                <span className="text-white font-mono">{user?.customerProfile?.customerCode || 'TWM-CUST'}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-800">
                <span className="text-slate-400">PAN Number</span>
                <span className="text-white font-mono">{user?.customerProfile?.pan || 'Verified on File'}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-800">
                <span className="text-slate-400">Account Type</span>
                <span className="text-emerald-400 font-semibold">Individual Wealth Account</span>
              </div>
            </div>
            <Button size="sm" variant="secondary" onClick={() => setActiveModal(null)} className="w-full text-xs">
              Close
            </Button>
          </div>
        </div>
      )}

      {/* CONTACT DETAILS MODAL */}
      {activeModal === 'CONTACT' && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#131C2E] border border-slate-800 rounded-2xl max-w-md w-full p-5 space-y-4 text-xs">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Phone className="w-4 h-4 text-emerald-400" /> Contact Details
              </h2>
              <button onClick={() => setActiveModal(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-2.5">
              <div className="flex justify-between py-1.5 border-b border-slate-800">
                <span className="text-slate-400">Registered Email</span>
                <span className="text-white font-mono">{user?.email}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-800">
                <span className="text-slate-400">Mobile Number</span>
                <span className="text-white font-mono">{user?.phone || '+91 98765 00000'}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-800">
                <span className="text-slate-400">Client Advisory Desk</span>
                <span className="text-emerald-400">support@tradosphere.in</span>
              </div>
            </div>
            <Button size="sm" variant="secondary" onClick={() => setActiveModal(null)} className="w-full text-xs">
              Close
            </Button>
          </div>
        </div>
      )}

      {/* PRIVACY & SECURITY MODAL */}
      {activeModal === 'PRIVACY' && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#131C2E] border border-slate-800 rounded-2xl max-w-md w-full p-5 space-y-4 text-xs">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" /> Privacy &amp; Data Security
              </h2>
              <button onClick={() => setActiveModal(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-2 text-slate-300 leading-relaxed">
              <p>
                <strong>DPDP Act &amp; SEBI Compliance:</strong> All financial and identity records are stored with AES-256-GCM encryption at rest in our compliance vault.
              </p>
              <p>
                <strong>Zero Third-Party Data Sale:</strong> Tradosphere Wealth Management never sells, leases, or trades user financial data to third-party telemarketers or advertisers.
              </p>
              <p>
                <strong>Access Log Auditing:</strong> Every review and download of your KYC documentation by authorized compliance officers creates an immutable audit trail.
              </p>
            </div>
            <Button size="sm" variant="secondary" onClick={() => setActiveModal(null)} className="w-full text-xs">
              Close
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
