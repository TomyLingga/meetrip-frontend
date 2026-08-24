'use client';

import React, { useState, useRef, useEffect } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { ChevronDown, Check } from 'lucide-react';
import { dropdownPanel } from '@/lib/motion';

interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

interface CustomSelectProps {
  value: string;
  onChange: (val: string) => void;
  options: SelectOption[];
  placeholder?: string;
  className?: string;
}

export default function CustomSelect({
  value,
  onChange,
  options,
  placeholder,
  className = '',
}: CustomSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const activeOption = options.find((opt) => opt.value === value);

  useEffect(() => {
    function handleOutsideClick(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleOutsideClick);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, []);

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-4 py-2.5 rounded-xl border border-slate-200/80 dark:border-white/[0.06] bg-surface-sunken text-left text-sm text-slate-800 dark:text-slate-200 shadow-neu-in-sm focus:outline-none focus:ring-2 focus:ring-teal-500/15 focus:border-teal-500/60 transition-all select-none"
      >
        <span className={activeOption ? 'font-semibold' : 'text-slate-400 dark:text-slate-500'}>
          {activeOption ? activeOption.label : placeholder || 'Pilih Opsi'}
        </span>
        <ChevronDown className={`w-4 h-4 text-slate-400 dark:text-slate-500 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            variants={dropdownPanel}
            initial="hidden"
            animate="show"
            exit="exit"
            className="absolute z-[60] w-full mt-2 bg-surface-card border border-slate-200/70 dark:border-white/[0.06] rounded-xl shadow-neu-pop py-1 max-h-60 overflow-y-auto overflow-x-hidden origin-top"
          >
          {options.map((opt) => {
            const isSelected = opt.value === value;
            return (
              <button
                key={opt.value}
                type="button"
                disabled={opt.disabled}
                onClick={() => {
                  if (opt.disabled) return;
                  onChange(opt.value);
                  setIsOpen(false);
                }}
                className={`w-full flex items-center justify-between px-4 py-2.5 text-sm text-left transition-colors ${
                  opt.disabled
                    ? 'opacity-50 cursor-not-allowed bg-surface-sunken text-slate-400 dark:text-slate-500'
                    : isSelected
                      ? 'bg-teal-50 dark:bg-teal-950/20 text-teal-600 dark:text-teal-400 font-bold shadow-neu-in-accent'
                      : 'text-slate-700 dark:text-slate-350 hover:bg-surface-sunken dark:hover:bg-white/[0.03]'
                }`}
              >
                <span>{opt.label}</span>
                {isSelected && <Check className="w-4 h-4 text-teal-600 dark:text-teal-400" />}
              </button>
            );
          })}
          {options.length === 0 && (
            <div className="px-4 py-3 text-sm text-slate-400 dark:text-slate-600 text-center">
              Tidak ada opsi tersedia
            </div>
          )}
        </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
