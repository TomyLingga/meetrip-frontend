import React from 'react';

export const formatMoneyInput = (value: number, isDollar?: boolean) => {
  if (value === undefined || value === null) return '';
  return isDollar
    ? value.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 })
    : value.toLocaleString('id-ID');
};

export const parseMoneyInput = (value: string, isDollar?: boolean) => {
  if (!value) return undefined;
  const cleanStr = isDollar ? value.replace(/[^0-9.]/g, '') : value.replace(/[^0-9]/g, '');
  return cleanStr === '' ? undefined : Number(cleanStr);
};

export const InputUang = ({ 
  value, 
  onChange, 
  disabled, 
  useDollar, 
  className = "w-32 bg-transparent text-xs font-extrabold text-right outline-none border-none text-slate-800 dark:text-slate-100 disabled:opacity-60",
  placeholder = "Nominal..."
}: { 
  value: number | undefined; 
  onChange: (val: number | undefined) => void; 
  disabled?: boolean; 
  useDollar?: boolean;
  className?: string;
  placeholder?: string;
}) => (
  <input
    type="text"
    value={value !== undefined && value !== null ? formatMoneyInput(value, useDollar) : ''}
    disabled={disabled}
    onChange={e => onChange(parseMoneyInput(e.target.value, useDollar))}
    className={className}
    placeholder={placeholder}
  />
);
