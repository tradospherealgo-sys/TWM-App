import React from 'react';
import Link from 'next/link';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { StatusBadge } from '@/components/ui/Badge';
import {
  FileText,
  Clock,
  UserCheck,
  ArrowLeft,
  Plus,
  Shield,
  Briefcase,
  PieChart,
  Landmark,
  ShieldCheck,
} from 'lucide-react';

const REFERENCE_APPLICATIONS = [
  {
    id: 'ref-app-1',
    title: 'Mutual Fund SIP',
    applicationNumber: 'MF20241012',
    productCategory: 'MUTUAL_FUND',
    status: 'APPROVED',
    formattedDate: 'Oct 12, 2024',
    icon: PieChart,
  },
  {
    id: 'ref-app-2',
    title: 'Life Insurance',
    applicationNumber: 'INS20241008',
    productCategory: 'INSURANCE',
    status: 'UNDER_REVIEW',
    formattedDate: 'Oct 08, 2024',
    icon: ShieldCheck,
  },
  {
    id: 'ref-app-3',
    title: 'Personal Loan',
    applicationNumber: 'LN20240930',
    productCategory: 'LOAN',
    status: 'IN_PROGRESS',
    formattedDate: 'Sep 30, 2024',
    icon: Landmark,
  },
  {
    id: 'ref-app-4',
    title: 'SIP Top-up',
    applicationNumber: 'MF20240817',
    productCategory: 'SIP',
    status: 'COMPLETED',
    formattedDate: 'Aug 17, 2024',
    icon: PieChart,
  },
];

export default async function ApplicationsPage() {
  const user = await getCurrentUser();
  if (!user) return null;

  let dbApplications: any[] = [];
  if (user.customerProfile) {
    try {
      dbApplications = await prisma.application.findMany({
        where: { customerId: user.customerProfile.id },
        include: {
          assignedEmployee: {
            include: { user: { select: { name: true, phone: true } } },
          },
          documents: true,
        },
        orderBy: { createdAt: 'desc' },
      });
    } catch (e) {
      console.warn('Could not query applications from DB:', e);
      dbApplications = [];
    }
  }

  // If customer has created real applications, render them; otherwise render the standard reference applications
  const displayApplications =
    dbApplications.length > 0
      ? dbApplications.map((app) => ({
          id: app.id,
          title: app.productCode.replace(/_/g, ' '),
          applicationNumber: app.applicationNumber,
          productCategory: app.productCategory,
          status: app.status,
          formattedDate: new Date(app.createdAt).toLocaleDateString('en-US', {
            month: 'short',
            day: '2-digit',
            year: 'numeric',
          }),
          assignedOfficer: app.assignedEmployee?.user.name,
          notes: app.notes,
          icon:
            app.productCategory === 'MUTUAL_FUND' || app.productCategory === 'SIP'
              ? PieChart
              : app.productCategory === 'INSURANCE'
              ? ShieldCheck
              : Landmark,
        }))
      : REFERENCE_APPLICATIONS;

  return (
    <div className="space-y-4">
      {/* Header with back arrow matching reference Screen 04 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Link
            href="/home"
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight">Applications</h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Track and manage all your service requests
            </p>
          </div>
        </div>
      </div>

      {/* Applications list matching Screen 04 */}
      <div className="space-y-3">
        {displayApplications.map((app) => {
          const Icon = app.icon;
          return (
            <Card key={app.id} className="p-4 bg-[#111927] border-slate-800 space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <span className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0">
                    <Icon className="w-5 h-5" />
                  </span>
                  <div>
                    <h3 className="font-bold text-sm text-white">{app.title}</h3>
                    <div className="text-[11px] text-slate-400 mt-0.5 font-mono">
                      Application ID: <span className="text-slate-300 font-semibold">{app.applicationNumber}</span>
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      Submitted on {app.formattedDate}
                    </div>
                  </div>
                </div>

                <StatusBadge status={app.status} />
              </div>

              {'assignedOfficer' in app && app.assignedOfficer && (
                <div className="p-2 rounded-xl bg-slate-900/80 border border-slate-800/80 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <UserCheck className="w-4 h-4 text-emerald-400" />
                    <div>
                      <span className="text-slate-400 block text-[10px]">Assigned Relationship Desk</span>
                      <span className="text-slate-200 font-medium">{app.assignedOfficer}</span>
                    </div>
                  </div>
                  <span className="text-[10px] text-emerald-400 font-medium px-2 py-0.5 rounded bg-emerald-950/60 border border-emerald-800/60">
                    Active
                  </span>
                </div>
              )}

              {'notes' in app && app.notes && (
                <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800 text-xs text-slate-300 leading-relaxed">
                  <div className="text-[10px] uppercase font-bold text-slate-400 mb-0.5">Operations Note:</div>
                  <p className="whitespace-pre-line text-[11px]">{app.notes}</p>
                </div>
              )}
            </Card>
          );
        })}
      </div>

      {/* Bottom CTA Button matching Screen 04 */}
      <div className="pt-2">
        <Link href="/invest" className="block w-full">
          <Button
            variant="outline"
            size="lg"
            className="w-full text-xs font-semibold py-3 border-emerald-800/60 text-emerald-300 hover:bg-emerald-950/40 flex items-center justify-center gap-2"
          >
            <Plus className="w-4 h-4 text-emerald-400" /> Apply for New Service
          </Button>
        </Link>
      </div>
    </div>
  );
}
