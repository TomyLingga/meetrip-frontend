'use client';

import React, { useEffect, useState, useRef } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { apiFetch } from '@/utils/api';
import { Search, ChevronDown, X } from 'lucide-react';
import { dropdownPanel } from '@/lib/motion';

export interface PortalUser {
  portalUserId: string;
  employeeId: string | null;
  nama: string | null;
  jabatan: string | null;
  gradeLevel: number | null;
  gradeKode: string | null;
  unitNama: string | null;
  penempatanNama: string | null;
  meetripRole: string | null;
}

interface UserSearchDropdownProps {
  value: PortalUser | null;
  onChange: (u: PortalUser | null) => void;
  placeholder?: string;
}

export default function UserSearchDropdown({
  value,
  onChange,
  placeholder = "Cari nama atau email..."
}: UserSearchDropdownProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<PortalUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  /*
   * Debounced search dengan cleanup.
   * Sebelumnya effect ini tidak mengembalikan cleanup, sehingga timer 300 ms tetap
   * berjalan setelah komponen unmount dan hasil pencarian yang datang tidak
   * berurutan bisa menimpa hasil yang lebih baru.
   */
  useEffect(() => {
    if (!open) return;
    let active = true;
    const timer = setTimeout(async () => {
      try {
        setLoading(true);
        const data = await apiFetch(`/api/portal/users?search=${encodeURIComponent(query)}&limit=20`);
        if (active) setResults(data || []);
      } catch {
        if (active) setResults([]);
      } finally {
        if (active) setLoading(false);
      }
    }, 300);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [query, open]);

  const handleSelect = (u: PortalUser) => {
    onChange(u);
    setQuery('');
    setOpen(false);
  };

  const handleClear = () => {
    onChange(null);
    setQuery('');
  };

  return (
    <div ref={wrapperRef} className="relative w-full">
      {value ? (
        // Selected state
        <div className="flex items-center justify-between px-3.5 py-2.5 rounded-xl border border-teal-500/50 bg-teal-50/50 dark:bg-teal-950/20">
          <div className="min-w-0">
            <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">{value.nama ?? value.portalUserId}</p>
            <p className="text-[10px] text-slate-500 dark:text-slate-450 truncate mt-0.5">
              {[value.jabatan, value.unitNama].filter(Boolean).join(' · ')}
            </p>
          </div>
          <button type="button" onClick={handleClear} className="text-slate-400 hover:text-red-500 transition-colors ml-2 shrink-0">
            <X className="w-4 h-4" />
          </button>
        </div>
      ) : (
        // Search input
        <div
          onClick={() => setOpen(true)}
          className="flex items-center px-4 py-2.5 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-surface-sunken shadow-neu-in-sm cursor-text gap-2.5 w-full transition-all focus-within:ring-2 focus-within:ring-teal-500/10 focus-within:border-teal-500/50"
        >
          <Search className="w-4 h-4 text-slate-400 shrink-0" />
          <input
            type="text"
            className="flex-1 bg-transparent text-sm outline-none text-slate-800 dark:text-slate-200"
            placeholder={placeholder}
            value={query}
            onChange={e => setQuery(e.target.value)}
            onFocus={() => setOpen(true)}
          />
          <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-200 shrink-0 ${open ? 'rotate-180' : ''}`} />
        </div>
      )}

      {/* Dropdown hasil pencarian */}
      <AnimatePresence>
        {open && !value && (
          <motion.div
            variants={dropdownPanel}
            initial="hidden"
            animate="show"
            exit="exit"
            className="absolute left-0 right-0 z-50 mt-2 max-h-60 overflow-y-auto overflow-x-hidden rounded-xl border border-slate-200/70 dark:border-white/[0.06] bg-surface-card shadow-neu-pop py-1 origin-top"
          >
          {loading ? (
            <div className="p-4 text-center text-xs text-slate-400">
              <div className="w-4 h-4 border-2 border-teal-500 border-t-transparent rounded-full animate-spin inline-block mr-2" />
              Mencari...
            </div>
          ) : results.length === 0 ? (
            <div className="p-4 text-center text-xs text-slate-400">
              {query ? 'Tidak ditemukan.' : 'Ketik untuk mencari...'}
            </div>
          ) : (
            results.map(u => (
              <button
                key={u.portalUserId}
                type="button"
                onClick={() => handleSelect(u)}
                className="w-full flex items-start px-4 py-2.5 text-left hover:bg-surface-sunken dark:hover:bg-white/[0.03] transition-colors border-b border-slate-100 dark:border-white/[0.04] last:border-0"
              >
                <div className="min-w-0">
                  <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">{u.nama ?? u.portalUserId}</p>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                    {[u.jabatan, u.unitNama].filter(Boolean).join(' · ')}
                  </p>
                </div>
              </button>
            ))
          )}
        </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
