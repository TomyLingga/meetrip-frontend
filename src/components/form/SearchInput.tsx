'use client';

import React from 'react';
import { Search } from 'lucide-react';

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

const searchInputCls = 'w-full rounded-xl border border-teal-500/40 dark:border-teal-500/50 bg-white dark:bg-[#111622] pr-4 py-2.5 text-sm text-slate-800 dark:text-slate-100 placeholder:text-slate-400 shadow-sm outline-none hover:border-teal-500 focus:border-teal-600 focus:ring-2 focus:ring-teal-500/20 transition-all';

export default function SearchInput({
  value,
  onChange,
  placeholder = 'Cari...',
  className = '',
}: SearchInputProps) {
  return (
    <div className={`relative w-full ${className}`}>
      <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-teal-600 dark:text-teal-400 pointer-events-none" />
      <input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`${searchInputCls} pl-10`}
      />
    </div>
  );
}
