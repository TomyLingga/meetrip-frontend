'use client';

import { PAGE_SIZE_OPTIONS } from '@/hooks/usePagination';

type Props = {
  pageSize: number;
  onPageSizeChange: (size: number) => void;
  options?: number[];
  className?: string;
};

/**
 * Reusable "rows per page" dropdown. Pair with usePagination's `pageSize`/`setPageSize`.
 */
export default function PageSizeSelect({
  pageSize,
  onPageSizeChange,
  options = PAGE_SIZE_OPTIONS,
  className = '',
}: Props) {
  return (
    <label className={`flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400 ${className}`}>
      <span className="whitespace-nowrap">Baris per halaman</span>
      <select
        value={pageSize}
        onChange={(e) => onPageSizeChange(Number(e.target.value))}
        className="rounded-lg border border-slate-200/80 bg-surface-sunken px-2 py-1.5 text-xs font-bold text-slate-700 shadow-neu-in-sm transition focus:border-teal-500/70 focus:outline-none dark:border-white/[0.06] dark:text-slate-200"
      >
        {options.map((opt) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </select>
    </label>
  );
}
