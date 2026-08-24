'use client';

import React from 'react';
import { cn } from '@/utils/cn';

/**
 * Skeleton kartu — menggantikan grid `animate-pulse` yang disalin di banyak
 * halaman approval. Tampilkan saat loading sebelum data pertama tiba.
 */

export function SkeletonCard({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'rounded-2xl border border-slate-200/70 bg-surface-card p-5 shadow-neu dark:border-white/[0.06]',
        className
      )}
      aria-hidden="true"
    >
      <div className="flex items-center justify-between">
        <div className="h-4 w-28 rounded-full bg-slate-200 motion-safe:animate-pulse dark:bg-slate-800" />
        <div className="h-5 w-16 rounded-full bg-slate-200 motion-safe:animate-pulse dark:bg-slate-800" />
      </div>
      <div className="mt-4 space-y-2.5">
        <div className="h-3 w-3/4 rounded-full bg-slate-200 motion-safe:animate-pulse dark:bg-slate-800" />
        <div className="h-3 w-1/2 rounded-full bg-slate-100 motion-safe:animate-pulse dark:bg-slate-800/60" />
      </div>
      <div className="mt-5 flex gap-2">
        <div className="h-8 w-24 rounded-lg bg-slate-100 motion-safe:animate-pulse dark:bg-slate-800/60" />
        <div className="h-8 w-24 rounded-lg bg-slate-100 motion-safe:animate-pulse dark:bg-slate-800/60" />
      </div>
    </div>
  );
}

interface CardListSkeletonProps {
  /** Jumlah kartu placeholder. */
  count?: number;
  className?: string;
}

export default function CardListSkeleton({ count = 5, className }: CardListSkeletonProps) {
  return (
    <div className={cn('space-y-3', className)} aria-hidden="true">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}
