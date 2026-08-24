'use client';

import React from 'react';

interface PageTemplateProps {
  title: string;
  sectionTitle?: string;
  description?: string;
  headerActions?: React.ReactNode;
  children: React.ReactNode;
}

export default function PageTemplate({
  title,
  sectionTitle,
  description,
  headerActions,
  children,
}: PageTemplateProps) {
  return (
    <div className="relative w-full min-w-0 space-y-4 sm:space-y-6">
      {/* Header Block — bar terangkat sebagai "topbar" halaman */}
      <div className="flex flex-col gap-4 rounded-2xl border border-slate-200/70 bg-surface-raised px-4 py-4 shadow-neu dark:border-white/[0.06] sm:px-5 sm:py-5 md:flex-row md:items-center md:justify-between">
        <div className="min-w-0">
          {sectionTitle && (
            <p className="text-xs font-bold uppercase tracking-widest text-teal-600 dark:text-teal-400">
              {sectionTitle}
            </p>
          )}
          <h1 className="mt-1.5 break-words text-xl font-black text-slate-900 dark:text-white tracking-tight sm:text-2xl">
            {title}
          </h1>
          {description && (
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              {description}
            </p>
          )}
        </div>
        {headerActions && (
          <div className="flex w-full flex-wrap items-center justify-end gap-2 sm:w-auto sm:shrink-0 sm:gap-3 [&>*]:max-w-full">
            {headerActions}
          </div>
        )}
      </div>

      {/* Content Body */}
      <div className="w-full min-w-0">
        {children}
      </div>
    </div>
  );
}
