'use client';

import React from 'react';
import PageSizeSelect from './PageSizeSelect';

type Props = {
  currentPage: number;
  totalItems: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  /** When provided, a "rows per page" dropdown is rendered. */
  onPageSizeChange?: (size: number) => void;
  pageSizeOptions?: number[];
};

export default function PaginationControls({
  currentPage,
  totalItems,
  pageSize,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions,
}: Props) {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const showNav = totalItems > pageSize;

  // Nothing to show at all (no data and no page-size control).
  if (totalItems === 0 && !onPageSizeChange) return null;
  // Single page and no page-size control → hide the whole bar (legacy behaviour).
  if (!showNav && !onPageSizeChange) return null;

  const start = totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const end = Math.min(currentPage * pageSize, totalItems);

  return (
    <div className="flex flex-col gap-3 border-t border-slate-200/70 bg-surface-sunken px-4 py-3 shadow-neu-in-sm dark:border-white/[0.05] sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
        <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
          Menampilkan {start}-{end} dari {totalItems} data
        </p>
        {onPageSizeChange && (
          <PageSizeSelect pageSize={pageSize} onPageSizeChange={onPageSizeChange} options={pageSizeOptions} />
        )}
      </div>
      {showNav && (
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          <button
            disabled={currentPage <= 1}
            type="button"
            onClick={() => onPageChange(Math.max(currentPage - 1, 1))}
            className="neu-pressable px-2.5 py-1.5 rounded-lg border border-slate-200/70 dark:border-white/[0.06] bg-surface-card disabled:opacity-40 disabled:pointer-events-none text-[11px] font-bold text-slate-600 dark:text-slate-300 cursor-pointer focus:outline-none"
          >
            Sebelumnya
          </button>

          {Array.from({ length: totalPages }, (_, i) => i + 1)
            .filter(page => {
              return page === 1 || page === totalPages || Math.abs(page - currentPage) <= 1;
            })
            .map((page, idx, arr) => {
              const showEllipsis = idx > 0 && page - arr[idx - 1] > 1;
              return (
                <React.Fragment key={page}>
                  {showEllipsis && <span className="px-1 text-slate-400 dark:text-slate-600 text-xs">...</span>}
                  <button
                    type="button"
                    onClick={() => onPageChange(page)}
                    className={`rounded-lg px-2.5 py-1.5 text-[11px] font-black cursor-pointer focus:outline-none ${
                      currentPage === page
                        ? 'bg-teal-600 dark:bg-teal-500 text-white dark:text-slate-950 shadow-neu-accent'
                        : 'neu-pressable border border-slate-200/70 dark:border-white/[0.06] bg-surface-card text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    {page}
                  </button>
                </React.Fragment>
              );
            })}

          <button
            disabled={currentPage >= totalPages}
            type="button"
            onClick={() => onPageChange(Math.min(currentPage + 1, totalPages))}
            className="neu-pressable px-2.5 py-1.5 rounded-lg border border-slate-200/70 dark:border-white/[0.06] bg-surface-card disabled:opacity-40 disabled:pointer-events-none text-[11px] font-bold text-slate-600 dark:text-slate-300 cursor-pointer focus:outline-none"
          >
            Berikutnya
          </button>
        </div>
      )}
    </div>
  );
}
