import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'neutral' | 'success' | 'warning' | 'danger' | 'info' | 'primary';
}

export function Badge({ className, variant = 'neutral', children, ...props }: BadgeProps) {
  const baseStyles = 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium tracking-wide';

  const variants = {
    neutral: 'bg-slate-800 text-slate-300 border border-slate-700',
    success: 'bg-emerald-950/80 text-emerald-400 border border-emerald-800/60',
    warning: 'bg-amber-950/80 text-amber-300 border border-amber-800/60',
    danger: 'bg-rose-950/80 text-rose-400 border border-rose-800/60',
    info: 'bg-cyan-950/80 text-cyan-300 border border-cyan-800/60',
    primary: 'bg-blue-950/80 text-blue-300 border border-blue-800/60',
  };

  return (
    <span className={twMerge(clsx(baseStyles, variants[variant], className))} {...props}>
      {children}
    </span>
  );
}

/**
 * Maps application / CRM statuses to visual badges
 */
export function StatusBadge({ status }: { status: string }) {
  const normalized = status.toUpperCase();

  switch (normalized) {
    case 'COMPLETED':
    case 'VERIFIED':
    case 'ACTIVE':
    case 'RESOLVED':
      return <Badge variant="success">{status.replace(/_/g, ' ')}</Badge>;

    case 'IN_PROGRESS':
    case 'UNDER_REVIEW':
    case 'INTERESTED':
    case 'APPLICATION':
      return <Badge variant="info">{status.replace(/_/g, ' ')}</Badge>;

    case 'NEW':
    case 'NEW_LEAD':
    case 'PENDING':
    case 'SCHEDULED':
      return <Badge variant="primary">{status.replace(/_/g, ' ')}</Badge>;

    case 'DOCUMENTS_REQUIRED':
    case 'FOLLOW_UP':
    case 'CONTACTED':
      return <Badge variant="warning">{status.replace(/_/g, ' ')}</Badge>;

    case 'REJECTED':
    case 'CANCELLED':
    case 'LOST_CLOSED':
    case 'SUSPENDED':
    case 'OVERDUE':
      return <Badge variant="danger">{status.replace(/_/g, ' ')}</Badge>;

    default:
      return <Badge variant="neutral">{status.replace(/_/g, ' ')}</Badge>;
  }
}
