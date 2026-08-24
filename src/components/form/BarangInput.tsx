'use client';

import React from 'react';
import { Package } from 'lucide-react';

interface BarangInputProps {
  value: string;
  onChange: (val: string) => void;
  error?: string;
  required?: boolean;
}

export default function BarangInput({ value, onChange, error, required = false }: BarangInputProps) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
        <Package className="w-4 h-4 text-teal-600 dark:text-teal-400 shrink-0" />
        Barang yang Dibawa {required && <span className="text-red-500">*</span>}
      </label>
      <textarea
        rows={3}
        placeholder="Contoh: Laptop, Dokumen Kontrak, Sampel Produk..."
        value={value}
        onChange={e => onChange(e.target.value)}
        className={`input-field w-full resize-none rounded-xl border bg-slate-50/50 dark:bg-slate-950/80 p-3 text-xs leading-relaxed transition-all focus:bg-white dark:focus:bg-slate-950 ${
          error ? 'border-red-500 focus:ring-red-500/20' : 'border-slate-200 dark:border-slate-800 focus:ring-teal-500/20 focus:border-teal-500'
        }`}
        required={required}
      />
      {error && <p className="text-[10px] text-red-500 mt-1 font-medium">{error}</p>}
    </div>
  );
}
