'use client';

import React, { useState } from 'react';
import { Loader2 } from 'lucide-react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'indigo' | 'amber';
  children: React.ReactNode;
  loading?: boolean;
  loadingLabel?: string;
}

export default function Button({
  variant = 'primary',
  children,
  className = '',
  loading = false,
  loadingLabel,
  disabled,
  onClick,
  ...props
}: ButtonProps) {
  const [internalLoading, setInternalLoading] = useState(false);
  const isLoading = loading || internalLoading;
  const baseStyle = "cursor-pointer inline-flex items-center justify-center gap-1.5 rounded-xl px-4 py-2 text-xs font-bold shadow-neu-sm transition-[box-shadow,transform,background-color,border-color,color] duration-150 active:translate-y-px active:shadow-neu-in-sm disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 select-none";

  const variants = {
    primary: "border-2 border-teal-600 bg-surface-card text-teal-600 dark:border-teal-500 dark:text-teal-400 hover:bg-teal-600 hover:text-white hover:shadow-neu-accent dark:hover:bg-teal-500 dark:hover:text-slate-950 focus:ring-teal-500/30",
    secondary: "border border-teal-600/35 dark:border-teal-500/45 bg-surface-card text-slate-700 dark:text-slate-200 hover:border-teal-500 hover:text-teal-600 dark:hover:text-teal-400 focus:ring-teal-500/20",
    danger: "border-2 border-rose-500 bg-surface-card text-rose-500 dark:border-rose-500 dark:text-rose-400 hover:bg-rose-600 hover:text-white dark:hover:bg-rose-500 dark:hover:text-white focus:ring-rose-500/30",
    indigo: "border-2 border-indigo-600 bg-surface-card text-indigo-600 dark:border-indigo-500 dark:text-indigo-400 hover:bg-indigo-600 hover:text-white dark:hover:bg-indigo-500 dark:hover:text-slate-950 focus:ring-indigo-500/30",
    amber: "border-2 border-amber-500 bg-surface-card text-amber-600 dark:border-amber-500 dark:text-amber-400 hover:bg-amber-500 hover:text-white dark:hover:bg-amber-500 dark:hover:text-slate-950 focus:ring-amber-500/30",
  };

  const handleClick: React.MouseEventHandler<HTMLButtonElement> = async (event) => {
    if (!onClick || isLoading) return;
    const result = onClick(event) as unknown;
    if (result && typeof (result as any).then === 'function') {
      try {
        setInternalLoading(true);
        await result;
      } finally {
        setInternalLoading(false);
      }
    }
  };

  return (
    <button
      className={`${baseStyle} ${variants[variant]} ${className}`}
      disabled={disabled || isLoading}
      onClick={handleClick}
      aria-busy={isLoading || undefined}
      data-loading={isLoading ? 'true' : undefined}
      {...props}
    >
      {isLoading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
      {isLoading && loadingLabel ? loadingLabel : children}
    </button>
  );
}
