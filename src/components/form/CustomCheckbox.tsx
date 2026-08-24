'use client';

import React from 'react';
import { Check } from 'lucide-react';

interface CustomCheckboxProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  disabled?: boolean;
  className?: string;
}

export default function CustomCheckbox({
  checked,
  onChange,
  label,
  disabled = false,
  className = '',
}: CustomCheckboxProps) {
  return (
    <label
      className={`flex items-center gap-3 select-none ${
        disabled ? 'opacity-55 cursor-not-allowed' : 'cursor-pointer'
      } ${className}`}
    >
      <div className="relative shrink-0">
        <input
          type="checkbox"
          checked={checked}
          disabled={disabled}
          onChange={(e) => !disabled && onChange(e.target.checked)}
          className="sr-only"
        />
        <div
          className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all duration-150 ${
            checked
              ? 'bg-teal-600 border-teal-600 text-white dark:bg-teal-500 dark:border-teal-500 shadow-neu-accent'
              : 'border-slate-300/80 dark:border-white/[0.08] bg-surface-sunken shadow-neu-in-sm hover:border-teal-500 dark:hover:border-teal-400'
          }`}
        >
          <Check
            className={`w-3.5 h-3.5 stroke-[4] transition-all duration-200 transform ${
              checked ? 'scale-100 rotate-0 opacity-100' : 'scale-75 -rotate-45 opacity-0'
            }`}
          />
        </div>
      </div>
      {label && (
        <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">
          {label}
        </span>
      )}
    </label>
  );
}
