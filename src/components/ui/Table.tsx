'use client';

import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { Compass, ChevronLeft, ChevronRight } from 'lucide-react';
import PaginationControls from './PaginationControls';
import { DEFAULT_PAGE_SIZE } from '@/hooks/usePagination';

interface Column<T> {
  header: string;
  render: (item: T, index: number) => React.ReactNode;
  className?: string;
}

interface TableProps<T> {
  columns: Column<T>[];
  data: T[];
  loading?: boolean;
  emptyMessage?: string;
  keyExtractor?: (item: T, index: number) => string;
  rowClassName?: (item: T, index: number) => string;
  pageSize?: number;
  enablePagination?: boolean;
  minWidthClassName?: string;
}

export default function Table<T>({
  columns,
  data,
  loading = false,
  emptyMessage = 'Belum ada data tersedia.',
  keyExtractor = (item: any, i) => item.id || String(i),
  rowClassName,
  pageSize: initialPageSize = DEFAULT_PAGE_SIZE,
  enablePagination = true,
  minWidthClassName = 'min-w-[760px]',
}: TableProps<T>) {
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(initialPageSize);
  const totalPages = Math.max(1, Math.ceil(data.length / pageSize));
  const shouldPaginate = enablePagination && data.length > pageSize;
  // Show the footer bar (with the rows-per-page dropdown) whenever pagination is on and there is data.
  const showFooter = enablePagination && data.length > 0;

  const containerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const checkScroll = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    const { scrollLeft, scrollWidth, clientWidth } = el;
    setCanScrollLeft(scrollLeft > 4);
    setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 4);
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [data.length, pageSize]);

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [currentPage, totalPages]);

  const visibleData = useMemo(() => {
    if (!shouldPaginate) return data;
    const start = (currentPage - 1) * pageSize;
    return data.slice(start, start + pageSize);
  }, [currentPage, data, pageSize, shouldPaginate]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    checkScroll();
    el.addEventListener('scroll', checkScroll, { passive: true });
    window.addEventListener('resize', checkScroll);

    const ro = new ResizeObserver(checkScroll);
    ro.observe(el);

    return () => {
      el.removeEventListener('scroll', checkScroll);
      window.removeEventListener('resize', checkScroll);
      ro.disconnect();
    };
  }, [checkScroll, data, loading, visibleData]);

  const scrollByOffset = (offset: number) => {
    containerRef.current?.scrollBy({ left: offset, behavior: 'smooth' });
  };

  const startNumber = data.length === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const endNumber = shouldPaginate ? Math.min(currentPage * pageSize, data.length) : data.length;

  return (
    <div className="relative min-w-0 rounded-xl border border-slate-200/70 bg-surface-card shadow-neu dark:border-white/[0.06] sm:rounded-2xl">
      {/* Scroll Left Button */}
      {!loading && data.length > 0 && canScrollLeft && (
        <div className="pointer-events-none absolute -left-3.5 top-3 z-30 flex items-center">
          <button
            type="button"
            onClick={() => scrollByOffset(-260)}
            className="pointer-events-auto flex h-8 w-8 items-center justify-center rounded-full border border-teal-500/60 bg-white dark:bg-[#111622] text-teal-600 dark:text-teal-400 shadow-[0_4px_14px_rgba(20,184,166,0.35)] dark:shadow-[0_4px_14px_rgba(0,0,0,0.6)] hover:scale-110 hover:bg-teal-500 hover:text-white dark:hover:bg-teal-500 transition-all duration-200 cursor-pointer"
            aria-label="Scroll kiri"
            title="Geser tabel ke kiri"
          >
            <ChevronLeft className="h-4.5 w-4.5 stroke-[2.5]" />
          </button>
        </div>
      )}

      {/* Scroll Right Button */}
      {!loading && data.length > 0 && canScrollRight && (
        <div className="pointer-events-none absolute -right-3.5 top-3 z-30 flex items-center">
          <button
            type="button"
            onClick={() => scrollByOffset(260)}
            className="pointer-events-auto flex h-8 w-8 items-center justify-center rounded-full border border-teal-500/60 bg-white dark:bg-[#111622] text-teal-600 dark:text-teal-400 shadow-[0_4px_14px_rgba(20,184,166,0.35)] dark:shadow-[0_4px_14px_rgba(0,0,0,0.6)] hover:scale-110 hover:bg-teal-500 hover:text-white dark:hover:bg-teal-500 transition-all duration-200 cursor-pointer"
            aria-label="Scroll kanan"
            title="Geser tabel ke kanan"
          >
            <ChevronRight className="h-4.5 w-4.5 stroke-[2.5]" />
          </button>
        </div>
      )}

      {/* Left Edge Gradient Fade */}
      {canScrollLeft && (
        <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-8 rounded-l-xl sm:rounded-l-2xl bg-gradient-to-r from-slate-200/50 via-slate-100/20 to-transparent dark:from-[#0e131d]/90 dark:via-[#0e131d]/40 dark:to-transparent transition-opacity duration-300" />
      )}

      {/* Right Edge Gradient Fade */}
      {canScrollRight && (
        <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-8 rounded-r-xl sm:rounded-r-2xl bg-gradient-to-l from-slate-200/50 via-slate-100/20 to-transparent dark:from-[#0e131d]/90 dark:via-[#0e131d]/40 dark:to-transparent transition-opacity duration-300" />
      )}

      <div ref={containerRef} className="table-scroll overflow-x-auto">
        <table className={`w-full text-left border-collapse ${minWidthClassName}`}>
          <thead>
            <tr className="table-head-row">
              {columns.map((col, idx) => (
                <th
                  key={idx}
                  className={`px-3 py-3 text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider sm:px-5 sm:py-4 ${
                    col.className || ''
                  }`}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200/50 dark:divide-white/[0.04]">
            {loading ? (
              Array.from({ length: 5 }).map((_, rIdx) => (
                <tr key={rIdx} className="border-b border-slate-100 dark:border-slate-800/40">
                  {columns.map((_, cIdx) => {
                    const widths = ['w-24', 'w-36', 'w-20', 'w-16', 'w-32', 'w-28'];
                    const widthClass = widths[cIdx % widths.length];
                    return (
                      <td key={cIdx} className="px-5 py-4">
                        <div className={`h-3 bg-slate-200 dark:bg-slate-800 rounded-full ${widthClass} animate-pulse`} />
                      </td>
                    );
                  })}
                </tr>
              ))
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="py-20 text-center">
                  <div className="flex flex-col items-center gap-3 text-slate-400">
                    <Compass className="h-10 w-10 opacity-20" />
                    <p className="font-semibold text-xs">{emptyMessage}</p>
                  </div>
                </td>
              </tr>
            ) : (
              visibleData.map((item, rowIdx) => {
                const absoluteIndex = shouldPaginate ? (currentPage - 1) * pageSize + rowIdx : rowIdx;
                return (
                <tr
                  key={keyExtractor(item, absoluteIndex)}
                  className={`transition-colors ${
                    rowClassName ? rowClassName(item, absoluteIndex) : 'hover:bg-surface-sunken dark:hover:bg-white/[0.02]'
                  }`}
                >
                  {columns.map((col, colIdx) => (
                    <td
                      key={colIdx}
                      className={`px-3 py-3 text-xs font-semibold text-slate-700 dark:text-slate-350 sm:px-5 sm:py-4 ${
                        col.className || ''
                      }`}
                    >
                      {col.render(item, absoluteIndex)}
                    </td>
                  ))}
                </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
      {showFooter && (
        <PaginationControls
          currentPage={currentPage}
          totalItems={data.length}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
          onPageSizeChange={setPageSize}
        />
      )}
    </div>
  );
}
