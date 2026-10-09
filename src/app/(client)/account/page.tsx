'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { StatusBadge } from '@/components/ui/Badge';
import { StatusBanner } from '@/components/ui/StatusBanner';
import {
  User,
  Shield,
  FileCheck,
  Mail,
  Phone,
  LogOut,
  ExternalLink,
  Lock,
  KeyRound,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  ChevronRight,
  Bell,
  HelpCircle,
  ShieldCheck,
  X,
} from 'lucide-react';

export default function AccountPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Active drawer / modal state
  const [activeModal, setActiveModal] = useState<
    'PERSONAL' | 'CONTACT' | 'PASSWORD' | 'PRIVACY' | null
  >(null);

  // Password change state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');

  useEffect(() => {
    fetch('/api/auth/me')
      .then((res) => res.json())
      .then((data) => {
        if (data.user) setUser(data.user);
      })
      .catch((e) => console.error(e))
      .finally(() => setLoading(false));
  }, []);

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
        setTimeout(() => setActiveModal(null), 2500);
      }
    } catch {
      setPasswordError('Network or server error while updating password.');
    } finally {
      setPasswordLoading(false);
    }
  }

  const userName = user?.name || 'Client';
  const userEmail = user?.email || 'client@tradosphere.com';
  const initials = userName
    .split(' ')
    .map((n: string) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase() || 'RA';

  return (
    <div className="space-y-4">
      {/* Header with back link matching Screen 07 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Link
            href="/home"
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight">Account</h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Manage your details and preferences.
            </p>
          </div>
        </div>
      </div>

      {/* Profile Header Card matching Screen 07 */}
      <Card className="p-5 bg-[#111927] border-slate-800 flex flex-col items-center text-center space-y-2">
        <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center font-bold text-lg tracking-wider">
          {initials}
        </div>
        <div>
          <h2 className="text-base font-bold text-white">{userName}</h2>
          <div className="text-xs text-slate-400 mt-0.5">{userEmail}</div>
        </div>
        <div className="pt-1">
          <span className="inline-flex items-center gap-1 px-3 py-0.5 rounded-full text-xs font-semibold bg-emerald-950/80 text-emerald-400 border border-emerald-800/80">
            <CheckCircle2 className="w-3.5 h-3.5" /> Verified
          </span>
        </div>
      </Card>

      {/* Settings Menu List matching Screen 07 */}
      <Card className="p-0 bg-[#111927] border-slate-800 divide-y divide-slate-800/80 overflow-hidden text-xs">
        <button
          onClick={() => setActiveModal('PERSONAL')}
          className="w-full px-4 py-3.5 flex items-center justify-between text-left hover:bg-slate-800/40 transition-colors"
        >
          <div className="flex items-center gap-3 text-slate-200">
            <User className="w-4 h-4 text-emerald-400" />
            <span className="font-medium text-slate-200">Personal Information</span>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-500" />
        </button>

        <button
          onClick={() => setActiveModal('CONTACT')}
          className="w-full px-4 py-3.5 flex items-center justify-between text-left hover:bg-slate-800/40 transition-colors"
        >
          <div className="flex items-center gap-3 text-slate-200">
            <Phone className="w-4 h-4 text-emerald-400" />
            <span className="font-medium text-slate-200">Contact Details</span>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-500" />
        </button>

        <button
          onClick={() => setActiveModal('PASSWORD')}
          className="w-full px-4 py-3.5 flex items-center justify-between text-left hover:bg-slate-800/40 transition-colors"
        >
          <div className="flex items-center gap-3 text-slate-200">
            <Lock className="w-4 h-4 text-emerald-400" />
            <span className="font-medium text-slate-200">Change Password</span>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-500" />
        </button>

        <Link
          href="/notifications"
          className="w-full px-4 py-3.5 flex items-center justify-between text-left hover:bg-slate-800/40 transition-colors"
        >
          <div className="flex items-center gap-3 text-slate-200">
            <Bell className="w-4 h-4 text-emerald-400" />
            <span className="font-medium text-slate-200">Notifications</span>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-500" />
        </Link>

        <button
          onClick={() => setActiveModal('PRIVACY')}
          className="w-full px-4 py-3.5 flex items-center justify-between text-left hover:bg-slate-800/40 transition-colors"
        >
          <div className="flex items-center gap-3 text-slate-200">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span className="font-medium text-slate-200">Privacy &amp; Security</span>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-500" />
        </button>

        <Link
          href="/support"
          className="w-full px-4 py-3.5 flex items-center justify-between text-left hover:bg-slate-800/40 transition-colors"
        >
          <div className="flex items-center gap-3 text-slate-200">
            <HelpCircle className="w-4 h-4 text-emerald-400" />
            <span className="font-medium text-slate-200">Help &amp; Support</span>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-500" />
        </Link>
      </Card>

      {/* Log Out Button matching Screen 07 */}
      <div className="pt-2">
        <Button
          variant="outline"
          size="lg"
          onClick={handleLogout}
          className="w-full text-xs font-semibold py-3 border-red-900/60 text-red-400 hover:bg-red-950/40 flex items-center justify-center gap-2"
        >
          <LogOut className="w-4 h-4" /> Log Out
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
                <span className="text-slate-400">Support Desk</span>
                <span className="text-emerald-400">support@tradosphere.com</span>
              </div>
            </div>
            <Button size="sm" variant="secondary" onClick={() => setActiveModal(null)} className="w-full text-xs">
              Close
            </Button>
          </div>
        </div>
      )}

      {/* CHANGE PASSWORD MODAL */}
      {activeModal === 'PASSWORD' && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#131C2E] border border-slate-800 rounded-2xl max-w-md w-full p-5 space-y-4 text-xs">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Lock className="w-4 h-4 text-emerald-400" /> Change Password
              </h2>
              <button onClick={() => setActiveModal(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            {passwordError && (
              <div className="p-2.5 rounded-lg bg-rose-950/60 border border-rose-800/80 text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{passwordError}</span>
              </div>
            )}
            {passwordSuccess && (
              <div className="p-2.5 rounded-lg bg-emerald-950/60 border border-emerald-800/80 text-emerald-300 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{passwordSuccess}</span>
              </div>
            )}

            <form onSubmit={handlePasswordChange} className="space-y-3">
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
                  placeholder="Min 8 chars, uppercase, number & symbol"
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

              <div className="flex gap-2 pt-2">
                <Button
                  type="submit"
                  variant="primary"
                  size="md"
                  isLoading={passwordLoading}
                  className="w-full text-xs bg-emerald-600 hover:bg-emerald-500 text-white"
                >
                  Update Password
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  size="md"
                  className="w-1/3 text-xs"
                  onClick={() => setActiveModal(null)}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PRIVACY & SECURITY MODAL */}
      {activeModal === 'PRIVACY' && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#131C2E] border border-slate-800 rounded-2xl max-w-md w-full p-5 space-y-4 text-xs">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" /> Privacy &amp; Security
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
