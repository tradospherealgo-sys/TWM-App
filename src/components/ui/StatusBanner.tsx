import React from 'react';
import { AlertCircle, ShieldAlert, Info, ArrowUpRight } from 'lucide-react';

export interface StatusBannerProps {
  type?: 'info' | 'warning' | 'smc' | 'regulatory';
  title?: string;
  message: string;
  actionLabel?: string;
  actionHref?: string;
}

export function StatusBanner({
  type = 'info',
  title,
  message,
  actionLabel,
  actionHref,
}: StatusBannerProps) {
  const styles = {
    info: 'bg-blue-950/40 border-blue-800/60 text-blue-200',
    warning: 'bg-amber-950/40 border-amber-800/60 text-amber-200',
    smc: 'bg-amber-950/50 border-amber-600/50 text-amber-100',
    regulatory: 'bg-slate-900 border-slate-700/80 text-slate-300',
  };

  const icons = {
    info: <Info className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />,
    warning: <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />,
    smc: <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />,
    regulatory: <Info className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />,
  };

  return (
    <div className={`p-3.5 rounded-xl border flex items-start gap-3 text-xs leading-relaxed ${styles[type]}`}>
      {icons[type]}
      <div className="flex-1">
        {title && <div className="font-semibold mb-0.5">{title}</div>}
        <div>{message}</div>
        {actionLabel && actionHref && (
          <a
            href={actionHref}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 font-semibold text-amber-400 hover:text-amber-300 mt-2"
          >
            <span>{actionLabel}</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </a>
        )}
      </div>
    </div>
  );
}
