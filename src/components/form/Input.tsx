import React, { InputHTMLAttributes, forwardRef } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  requiredStar?: boolean;
  icon?: React.ReactNode;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, requiredStar, icon, className = '', ...props }, ref) => {
    return (
      <div className="space-y-1 w-full">
        {label && (
          <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            {label} {requiredStar && <span className="text-rose-500">*</span>}
          </label>
        )}
        <div className="relative flex items-center">
          {icon && (
            <span className="absolute left-3.5 text-slate-400 dark:text-slate-500 pointer-events-none">
              {icon}
            </span>
          )}
          <input
            ref={ref}
            className={`min-w-0 w-full bg-white dark:bg-[#111622] border border-teal-500/35 dark:border-teal-500/45 rounded-xl px-3.5 py-2.5 text-base sm:text-xs text-slate-800 dark:text-slate-100 placeholder-slate-400 shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 transition-all ${
              icon ? 'pl-10' : ''
            } ${
              error ? 'border-rose-500 focus:ring-rose-500/20 focus:border-rose-500' : ''
            } ${className}`}
            {...props}
          />
        </div>
        {error && (
          <p className="text-[10px] font-bold text-rose-500">{error}</p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export default Input;
