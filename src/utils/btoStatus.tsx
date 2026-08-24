import React from 'react';

/**
 * Sumber tunggal status BTO/SPDK — label + kelas badge.
 * Menggantikan definisi `getStatusBadge` + `formatStatusName` yang sebelumnya
 * disalin di banyak halaman. Meniru pola `meetingStatus.ts`.
 *
 * Palet mengikuti gaya yang lebih halus (`-50/-700` + border tipis) agar
 * konsisten dan enterprise di seluruh alur dinas.
 */

export const BTO_STATUS_META: Record<string, { label: string; badgeClass: string }> = {
  DRAFT: { label: 'Draft', badgeClass: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300' },
  SUBMITTED: { label: 'Submitted BTO', badgeClass: 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400 border border-blue-200/30' },
  ADMIN_DP_REVIEW: { label: 'Review Admin DP', badgeClass: 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 border border-amber-200/30' },
  PT_REVIEW: { label: 'Pemberi Tugas Review', badgeClass: 'bg-indigo-50 text-indigo-755 dark:bg-indigo-950/40 dark:text-indigo-400 border border-indigo-200/30' },
  KABAG_REVIEW: { label: 'Review Kabag / Kasi', badgeClass: 'bg-pink-50 text-pink-700 dark:bg-pink-950/40 dark:text-pink-400 border border-pink-200/30' },
  SDM_REVIEW: { label: 'Review SDM', badgeClass: 'bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-400 border border-purple-200/30' },
  SPDK_DRAFT: { label: 'Draft SPDK', badgeClass: 'bg-cyan-50 text-cyan-700 dark:bg-cyan-950/40 dark:text-cyan-400 border border-cyan-200/30' },
  REVISION_DP: { label: 'Revisi DP / Panjar', badgeClass: 'bg-orange-50 text-orange-700 dark:bg-orange-950/40 dark:text-orange-400 border border-orange-200/30' },
  REVISION_BTE: { label: 'Revisi BTE', badgeClass: 'bg-orange-50 text-orange-700 dark:bg-orange-950/40 dark:text-orange-400 border border-orange-200/30' },
  ACTIVE: { label: 'SPDK Aktif', badgeClass: 'bg-teal-50 text-teal-700 dark:bg-teal-950/40 dark:text-teal-400 border border-teal-200/30' },
  ATTENDED: { label: 'Sudah Absen', badgeClass: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-450 border border-emerald-200/30' },
  REPORT_UPLOADED: { label: 'Laporan Diunggah', badgeClass: 'bg-sky-50 text-sky-700 dark:bg-sky-950/40 dark:text-sky-400 border border-sky-200/30' },
  BTE_DRAFT: { label: 'BTE Draft', badgeClass: 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 border border-amber-200/30' },
  ADMIN_BTE_REVIEW: { label: 'Review Admin BTE', badgeClass: 'bg-orange-50 text-orange-700 dark:bg-orange-950/40 dark:text-orange-400 border border-orange-200/30' },
  BTE_PAYMENT: { label: 'Pembayaran BTE', badgeClass: 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 border border-amber-200/30' },
  COMPLETED: { label: 'Selesai', badgeClass: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-450 border border-emerald-200/30' },
  REJECTED: { label: 'Ditolak', badgeClass: 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400 border border-rose-200/30' },
};

const FALLBACK_BADGE = 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300';

/** Kelas Tailwind untuk badge status (tanpa markup). */
export function getBtoStatusBadgeClass(status: string): string {
  return BTO_STATUS_META[status]?.badgeClass ?? FALLBACK_BADGE;
}

/** Label status yang ramah dibaca. */
export function formatBtoStatusName(status: string): string {
  return BTO_STATUS_META[status]?.label ?? status;
}

interface BtoStatusBadgeProps {
  status: string;
  className?: string;
}

/** Badge status BTO siap pakai (pill). */
export function BtoStatusBadge({ status, className = '' }: BtoStatusBadgeProps) {
  return (
    <span
      className={`inline-flex shrink-0 items-center px-2.5 py-0.5 text-[10px] font-extrabold rounded-full ${getBtoStatusBadgeClass(status)} ${className}`}
    >
      {formatBtoStatusName(status)}
    </span>
  );
}
