'use client';

import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'motion/react';
import { X } from 'lucide-react';
import { backdrop, modalPanel } from '@/lib/motion';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  widthClassName?: string;
}

export default function Modal({ isOpen, onClose, title, children, widthClassName = 'max-w-md' }: ModalProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-4">
          <motion.div
            className="absolute inset-0 bg-slate-900/55 backdrop-blur-sm dark:bg-slate-950/80"
            onClick={onClose}
            variants={backdrop}
            initial="hidden"
            animate="show"
            exit="exit"
          />

          <motion.div
            className={`relative flex w-full ${widthClassName} max-h-[calc(100dvh-1rem)] min-h-0 flex-col overflow-hidden rounded-xl border border-slate-200/70 bg-surface-card p-4 text-slate-900 shadow-neu-modal dark:border-white/[0.07] dark:text-slate-100 sm:max-h-[calc(100dvh-2rem)] sm:rounded-2xl sm:p-6`}
            variants={modalPanel}
            initial="hidden"
            animate="show"
            exit="exit"
          >
            {title ? (
              <div className="mb-4 flex shrink-0 items-start justify-between gap-4 sm:mb-5">
                <h3 className="min-w-0 text-base font-bold text-slate-900 dark:text-white sm:text-lg">
                  {title}
                </h3>
                <button
                  type="button"
                  onClick={onClose}
                  className="neu-pressable shrink-0 rounded-xl border border-slate-200/70 bg-surface-card p-2 text-slate-400 hover:text-slate-600 dark:border-white/[0.06] dark:hover:text-slate-200"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={onClose}
                className="neu-pressable absolute right-4 top-4 z-10 rounded-xl border border-slate-200/70 bg-surface-card p-2 text-slate-400 hover:text-slate-600 dark:border-white/[0.06] dark:hover:text-slate-200"
              >
                <X className="h-5 w-5" />
              </button>
            )}

            <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden overscroll-contain pr-0.5">{children}</div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}
