'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
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
} from 'lucide-react';

export default function AccountPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Password change state
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');

  React.useEffect(() => {
    fetch('/api/auth/me')
      .then((res) => res.json())
      .then((data) => {
        if (data.user) setUser(data.user);
      })
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
        setTimeout(() => setShowPasswordForm(false), 3000);
      }
    } catch {
      setPasswordError('Network or server error while updating password.');
    } finally {
      setPasswordLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12 text-xs text-slate-400">
        Loading profile...
      </div>
    );
  }

  if (!user) return null;

  const hasPan = Boolean(user.customerProfile?.pan);
  const kycStatus = user.customerProfile?.kycStatus || 'NOT_SUBMITTED';

  return (
    <div className="space-y-4">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-white tracking-tight">Account &amp; Security</h1>
        <p className="text-xs text-slate-400 mt-0.5">
          Customer identification, regulatory profile &amp; security credentials
        </p>
      </div>

      {/* Profile Card */}
      <Card className="p-4 space-y-3">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-blue-600/20 text-blue-400 flex items-center justify-center font-bold text-base">
            {user.name?.charAt(0)}
          </div>
          <div>
            <h2 className="text-base font-bold text-white">{user.name}</h2>
            <div className="text-xs text-slate-400 flex items-center gap-1.5 mt-0.5">
              <span>Code: {user.customerProfile?.customerCode || 'N/A'}</span>
              <span>•</span>
              <StatusBadge status={kycStatus} />
            </div>
          </div>
        </div>

        <div className="pt-3 border-t border-slate-800 space-y-2 text-xs">
          <div className="flex items-center justify-between text-slate-300">
            <span className="flex items-center gap-2 text-slate-400">
              <Mail className="w-3.5 h-3.5" /> Email
            </span>
            <span>{user.email}</span>
          </div>

          <div className="flex items-center justify-between text-slate-300">
            <span className="flex items-center gap-2 text-slate-400">
              <Phone className="w-3.5 h-3.5" /> Mobile
            </span>
            <span>{user.phone || '+91 98765 00000'}</span>
          </div>

          {/* Truthful PAN Display - Never fake 'Verified' */}
          <div className="flex items-center justify-between text-slate-300">
            <span className="flex items-center gap-2 text-slate-400">
              <Shield className="w-3.5 h-3.5" /> PAN Identification
            </span>
            <div className="text-right">
              {hasPan ? (
                <div className="flex items-center gap-1.5">
                  <span className="font-mono font-medium text-slate-200">
                    {user.customerProfile.pan}
                  </span>
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded font-semibold ${
                      kycStatus === 'VERIFIED'
                        ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                        : 'bg-amber-950 text-amber-300 border border-amber-800'
                    }`}
                  >
                    {kycStatus === 'VERIFIED' ? 'Verified' : 'Pending review'}
                  </span>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <span className="text-slate-500 italic">Not Submitted</span>
                  <a
                    href="/documents"
                    className="text-[10px] text-blue-400 hover:text-blue-300 underline"
                  >
                    Upload PAN
                  </a>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between text-slate-300">
            <span className="flex items-center gap-2 text-slate-400">
              <Lock className="w-3.5 h-3.5" /> Role Access
            </span>
            <span className="font-semibold text-blue-400">{user.role}</span>
          </div>
        </div>
      </Card>

      {/* Password & Security Self-Service */}
      <Card className="p-4 space-y-3 bg-[#131C2E]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="p-2 rounded-lg bg-blue-600/10 text-blue-400">
              <KeyRound className="w-4 h-4" />
            </span>
            <div>
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                Password &amp; Security
              </h3>
              <p className="text-[11px] text-slate-400">Manage account credentials</p>
            </div>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              setShowPasswordForm(!showPasswordForm);
              setPasswordError('');
              setPasswordSuccess('');
            }}
            className="text-xs"
          >
            {showPasswordForm ? 'Close' : 'Change Password'}
          </Button>
        </div>

        {showPasswordForm && (
          <form onSubmit={handlePasswordChange} className="pt-3 border-t border-slate-800 space-y-3">
            {passwordError && (
              <div className="p-2.5 rounded-lg bg-rose-950/60 border border-rose-800/80 text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{passwordError}</span>
              </div>
            )}
            {passwordSuccess && (
              <div className="p-2.5 rounded-lg bg-emerald-950/60 border border-emerald-800/80 text-emerald-300 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                <span>{passwordSuccess}</span>
              </div>
            )}

            <div>
              <label className="text-[11px] text-slate-400 block mb-1">Current Password</label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-900 border border-slate-800 text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
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
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-900 border border-slate-800 text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="Min 8 chars, uppercase, lowercase, number & symbol"
              />
              <p className="text-[10px] text-slate-500 mt-0.5">
                Must contain at least 8 characters, an uppercase letter, lowercase letter, number, and special character.
              </p>
            </div>

            <div>
              <label className="text-[11px] text-slate-400 block mb-1">Confirm New Password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-900 border border-slate-800 text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="Re-enter new password"
              />
            </div>

            <div className="flex justify-end gap-2 pt-1">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => setShowPasswordForm(false)}
                className="text-xs"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="sm"
                isLoading={passwordLoading}
                className="text-xs"
              >
                Update Password
              </Button>
            </div>
          </form>
        )}
      </Card>

      {/* Service Links */}
      <div className="grid grid-cols-2 gap-2 text-xs">
        <a
          href="/documents"
          className="p-3 rounded-xl bg-[#131C2E] border border-slate-800 hover:border-slate-700 transition-all flex items-center gap-2.5 text-slate-200"
        >
          <span className="p-2 rounded-lg bg-blue-600/10 text-blue-400">
            <FileCheck className="w-4 h-4" />
          </span>
          <div>
            <div className="font-semibold text-white">KYC Documents</div>
            <span className="text-[10px] text-slate-400">Upload &amp; verify</span>
          </div>
        </a>

        <a
          href="/support"
          className="p-3 rounded-xl bg-[#131C2E] border border-slate-800 hover:border-slate-700 transition-all flex items-center gap-2.5 text-slate-200"
        >
          <span className="p-2 rounded-lg bg-emerald-600/10 text-emerald-400">
            <Shield className="w-4 h-4" />
          </span>
          <div>
            <div className="font-semibold text-white">Help &amp; Support</div>
            <span className="text-[10px] text-slate-400">Raise query</span>
          </div>
        </a>
      </div>

      {/* SMC Brokerage Relationship */}
      <Card className="p-4 space-y-2 bg-[#131C2E]">
        <div className="flex items-center gap-2">
          <Shield className="w-4 h-4 text-amber-400" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-amber-300">
            SMC Global Brokerage Link
          </h3>
        </div>
        <p className="text-xs text-slate-300 leading-relaxed">
          Your account is linked to Tradosphere Wealth Management as an Authorised Person of SMC Global Securities Ltd.
        </p>
        <div className="pt-2">
          <a
            href="https://smctradeonline.com"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs text-amber-400 font-semibold hover:text-amber-300"
          >
            <span>Visit SMC Ace Web Portal</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </Card>

      {/* Logout */}
      <div className="pt-2">
        <Button
          variant="secondary"
          size="md"
          className="w-full text-xs text-red-400 hover:text-red-300 border-red-950/60 hover:bg-red-950/30"
          onClick={handleLogout}
        >
          <LogOut className="w-4 h-4 mr-2" /> Sign Out
        </Button>
      </div>

      <StatusBanner
        type="regulatory"
        title="Account Privacy Notice"
        message="Your KYC records are protected under Indian DPDP and SEBI data guidelines. TWM does not sell client financial data."
      />
    </div>
  );
}
