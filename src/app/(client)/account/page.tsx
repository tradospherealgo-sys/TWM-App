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
} from 'lucide-react';

export default function AccountPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

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

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12 text-xs text-slate-400">
        Loading profile...
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-white tracking-tight">Account &amp; Security</h1>
        <p className="text-xs text-slate-400 mt-0.5">
          Customer identification and regulatory profile
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
              <StatusBadge status={user.customerProfile?.kycStatus || 'PENDING'} />
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

          <div className="flex items-center justify-between text-slate-300">
            <span className="flex items-center gap-2 text-slate-400">
              <Shield className="w-3.5 h-3.5" /> PAN
            </span>
            <span className="font-mono">{user.customerProfile?.pan || 'Verified'}</span>
          </div>

          <div className="flex items-center justify-between text-slate-300">
            <span className="flex items-center gap-2 text-slate-400">
              <Lock className="w-3.5 h-3.5" /> Role Access
            </span>
            <span className="font-semibold text-blue-400">{user.role}</span>
          </div>
        </div>
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
