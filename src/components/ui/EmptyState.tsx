'use client';

import React from 'react';
import { Compass, type LucideIcon } from 'lucide-react';
import { cn } from '@/utils/cn';

interface EmptyStateProps {
  /** Ikon lucide; default kompas agar selaras dengan tabel. */
  icon?: LucideIcon;
  title?: string;
  message: string;
  /** Aksi opsional, mis. tombol "Tambah". */
  action?: React.ReactNode;
  className?: string;
}

/**
 * Status kosong yang konsisten — menggantikan blok "belum ada data" yang
 * sebelumnya ditulis manual di banyak halaman. Selaras dengan empty state Table.
 */
export default function EmptyState({
  icon: Icon = Compass,
  title,
  message,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center gap-3 py-16 text-center', className)}>
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-surface-sunken shadow-neu-in">
        <Icon className="h-6 w-6 text-slate-400 dark:text-slate-500" strokeWidth={1.75} />
      </div>
      <div className="space-y-1">
        {title && <p className="text-sm font-bold text-slate-700 dark:text-slate-200">{title}</p>}
        <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 max-w-sm">{message}</p>
      </div>
      {action && <div className="mt-1">{action}</div>}
    </div>
  );
}
