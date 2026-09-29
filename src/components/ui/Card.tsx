import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'interactive' | 'outline';
}

export function Card({ className, variant = 'default', children, ...props }: CardProps) {
  const baseStyles = 'rounded-2xl p-4 sm:p-5 transition-all';
  const variants = {
    default: 'bg-[#131C2E] border border-slate-800/80 shadow-sm text-slate-100',
    interactive:
      'bg-[#131C2E] border border-slate-800/80 shadow-sm text-slate-100 hover:border-slate-700 active:scale-[0.99] cursor-pointer',
    outline: 'bg-transparent border border-slate-800 text-slate-100',
  };

  return (
    <div className={twMerge(clsx(baseStyles, variants[variant], className))} {...props}>
      {children}
    </div>
  );
}
