'use client';

import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react';
import { dropdownPanel } from '@/lib/motion';

export type MonthValue = { year: number; month: number };

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agt', 'Sep', 'Okt', 'Nov', 'Des'];

export function MonthPicker({ value, onChange }: { value: MonthValue; onChange: (value: MonthValue) => void }) {
  const [open, setOpen] = useState(false);
  const [viewYear, setViewYear] = useState(value.year);
  const rootRef = useRef<HTMLDivElement>(null);
  const now = new Date();

  useEffect(() => {
    if (!open) return;
    const close = (event: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [open]);

  const isFuture = (month: number) => (
    viewYear > now.getFullYear() || (viewYear === now.getFullYear() && month > now.getMonth() + 1)
  );

  return (
    <div className="relative" ref={rootRef}>
      <button
        type="button"
        onClick={() => { setViewYear(value.year); setOpen((current) => !current); }}
        className="inline-flex h-9 items-center gap-2 rounded-md border border-slate-200 bg-surface-card px-3 text-xs font-semibold text-slate-700 transition-colors hover:border-slate-300 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-teal-500/25 dark:border-slate-700 dark:text-slate-200 dark:hover:border-slate-600 dark:hover:bg-slate-800 shadow-neu"
        aria-expanded={open}
        aria-haspopup="dialog"
      >
        <CalendarDays className="h-4 w-4 text-teal-650 dark:text-teal-450" />
        Statistik: {MONTHS[value.month - 1]} {value.year}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            variants={dropdownPanel}
            initial="hidden"
            animate="show"
            exit="exit"
            role="dialog"
            aria-label="Pilih bulan statistik"
            className="absolute right-0 top-full z-[70] mt-2 w-64 rounded-lg border border-slate-200 bg-surface-card p-2 shadow-neu-pop dark:border-slate-700 origin-top-right"
          >
          <div className="mb-2 flex items-center justify-between border-b border-slate-100 px-1 pb-2 dark:border-slate-800">
            <button type="button" onClick={() => setViewYear((year) => year - 1)} className="flex h-7 w-7 items-center justify-center rounded text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800" aria-label="Tahun sebelumnya">
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="text-xs font-bold text-slate-900 dark:text-white">{viewYear}</span>
            <button type="button" onClick={() => setViewYear((year) => year + 1)} disabled={viewYear >= now.getFullYear()} className="flex h-7 w-7 items-center justify-center rounded text-slate-500 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-30 dark:text-slate-400 dark:hover:bg-slate-800" aria-label="Tahun berikutnya">
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
          <div className="grid grid-cols-3 gap-1">
            {MONTHS.map((label, index) => {
              const month = index + 1;
              const selected = value.year === viewYear && value.month === month;
              return (
                <button
                  key={label}
                  type="button"
                  disabled={isFuture(month)}
                  onClick={() => { onChange({ year: viewYear, month }); setOpen(false); }}
                  className={`rounded py-2 text-xs font-semibold transition-colors ${selected ? 'bg-teal-600 text-white dark:bg-teal-450 dark:text-slate-950' : 'text-slate-600 hover:bg-slate-100 disabled:cursor-not-allowed disabled:text-slate-300 dark:text-slate-300 dark:hover:bg-slate-800 dark:disabled:text-slate-700'}`}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
