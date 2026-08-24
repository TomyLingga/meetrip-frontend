'use client';

import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { CheckCircle2, AlertTriangle, Info, AlertCircle, X } from 'lucide-react';

type ToastType = 'success' | 'error' | 'warning' | 'info';

interface Toast {
  id: string;
  message: string;
  type: ToastType;
  isClosing?: boolean;
}

interface ConfirmOptions {
  title?: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'info' | 'danger';
}

interface ConfirmState {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText: string;
  cancelText: string;
  type: 'info' | 'danger';
  resolve: (value: boolean) => void;
}

interface FeedbackContextType {
  showAlert: (message: string, type?: ToastType) => void;
  showConfirm: (message: string, options?: ConfirmOptions) => Promise<boolean>;
}

const FeedbackContext = createContext<FeedbackContextType | undefined>(undefined);

export function FeedbackProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [confirmState, setConfirmState] = useState<ConfirmState | null>(null);
  const [mounted, setMounted] = useState(false);

  // Ensure we only use portals after hydration
  useEffect(() => { setMounted(true); }, []);

  // Generate unique IDs for toasts
  const toastIdRef = useRef(0);
  const getToastId = () => {
    toastIdRef.current += 1;
    return `toast-${toastIdRef.current}`;
  };

  const showAlert = (message: string, type: ToastType = 'info') => {
    const id = getToastId();
    setToasts((prev) => {
      let currentToasts = [...prev];
      const activeToasts = currentToasts.filter(t => !t.isClosing);
      
      if (activeToasts.length >= 3) {
        const oldestActiveId = activeToasts[0].id;
        setTimeout(() => {
          setToasts((curr) => curr.filter((t) => t.id !== oldestActiveId));
        }, 300);
        currentToasts = currentToasts.map(t => 
          t.id === oldestActiveId ? { ...t, isClosing: true } : t
        );
      }
      
      return [...currentToasts, { id, message, type }];
    });

    // Auto dismiss after 4 seconds
    setTimeout(() => {
      removeToast(id);
    }, 4000);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.map(t => t.id === id ? { ...t, isClosing: true } : t));
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 300);
  };

  const showConfirm = (message: string, options?: ConfirmOptions) => {
    return new Promise<boolean>((resolve) => {
      setConfirmState({
        isOpen: true,
        title: options?.title || 'Konfirmasi Tindakan',
        message,
        confirmText: options?.confirmText || 'Ya, Lanjutkan',
        cancelText: options?.cancelText || 'Batal',
        type: options?.type || 'info',
        resolve,
      });
    });
  };

  const handleConfirmClose = (result: boolean) => {
    if (confirmState) {
      confirmState.resolve(result);
    }
    setConfirmState(null);
  };

  // Close confirm modal on Escape key
  useEffect(() => {
    if (!confirmState) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleConfirmClose(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [confirmState]);

  const renderIcon = (type: ToastType) => {
    switch (type) {
      case 'success':
        return <CheckCircle2 className="h-6 w-6 shrink-0 text-emerald-500 dark:text-emerald-400 mt-1.5 mr-3" />;
      case 'error':
        return <AlertTriangle className="h-6 w-6 shrink-0 text-rose-500 dark:text-rose-400 mt-1.5 mr-3" />;
      case 'warning':
        return <AlertCircle className="h-6 w-6 shrink-0 text-amber-500 dark:text-amber-400 mt-1.5 mr-3" />;
      case 'info':
      default:
        return <Info className="h-6 w-6 shrink-0 text-sky-500 dark:text-sky-400 mt-1.5 mr-3" />;
    }
  };

  const getToastStyle = (type: ToastType) => {
    switch (type) {
      case 'success':
        return {
          label: 'Berhasil',
          panel: 'border-emerald-200/90 bg-surface-card dark:border-emerald-900/70',
          line: 'bg-emerald-500',
        };
      case 'error':
        return {
          label: 'Tindakan gagal',
          panel: 'border-rose-200/90 bg-surface-card dark:border-rose-900/70',
          line: 'bg-rose-500',
        };
      case 'warning':
        return {
          label: 'Perlu perhatian',
          panel: 'border-amber-200/90 bg-surface-card dark:border-amber-900/70',
          line: 'bg-amber-500',
        };
      case 'info':
      default:
        return {
          label: 'Informasi',
          panel: 'border-sky-200/90 bg-surface-card dark:border-sky-900/70',
          line: 'bg-sky-500',
        };
    }
  };

  return (
    <FeedbackContext.Provider value={{ showAlert, showConfirm }}>
      {children}

      {/* ── TOAST CONTAINER — rendered into document.body via Portal ── */}
      {mounted && createPortal(
        <div
          style={{ zIndex: 2147483647, top: 'calc(env(safe-area-inset-top, 0px) + 18px)', right: 'max(16px, env(safe-area-inset-right, 0px))' }}
          className="pointer-events-none fixed flex w-[min(23rem,calc(100vw-2rem))] flex-col gap-2.5"
        >
          {toasts.map((toast) => {
            const style = getToastStyle(toast.type);
            return (
              <div
                key={toast.id}
                role="status"
                aria-live={toast.type === 'error' ? 'assertive' : 'polite'}
                className={`pointer-events-auto relative w-full overflow-hidden rounded-xl border shadow-neu-pop transition-all duration-300 ${
                  toast.isClosing ? 'translate-x-6 opacity-0' : 'animate-fade-up'
                } ${style.panel}`}
              >
                <div className="flex items-start px-4 py-3.5">
                  {renderIcon(toast.type)}
                  <div className="min-w-0 flex-1 pt-0.5">
                    <p className="text-xs font-bold text-slate-900 dark:text-white">{style.label}</p>
                    <p className="mt-1 break-words text-xs leading-relaxed text-slate-600 dark:text-slate-300">{toast.message}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeToast(toast.id)}
                    className="pointer-events-auto relative z-20 shrink-0 flex h-6 w-6 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200 -mr-1 mt-0.5"
                    aria-label="Tutup notifikasi"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <div className="absolute inset-x-0 bottom-0 h-1 overflow-hidden pointer-events-none rounded-b-xl">
                  <span
                    className={`block h-full w-full animate-toast-progress ${style.line}`}
                    style={{ transformOrigin: 'left center' }}
                  />
                </div>
              </div>
            );
          })}
        </div>,
        document.body
      )}

      {/* ── CONFIRMATION MODAL — rendered into document.body via Portal ── */}
      {mounted && confirmState && createPortal(
        <div style={{ zIndex: 2147483000 }} className="fixed inset-0 flex items-center justify-center p-4">
          {/* Backdrop Blur */}
          <div
            className="fixed inset-0 bg-slate-950/40 dark:bg-slate-950/60 backdrop-blur-md"
            onClick={() => handleConfirmClose(false)}
          />

          {/* Dialog Box */}
          <div style={{ zIndex: 2147483001 }} className="relative bg-surface-card border border-slate-300 dark:border-white/[0.08] shadow-neu-modal rounded-2xl p-6 max-w-md w-full overflow-hidden animate-zoom-out">
            <div className="flex gap-4">
              <div
                className={`shrink-0 flex items-start mt-0.5 ${
                  confirmState.type === 'danger'
                    ? 'text-rose-500'
                    : 'text-teal-600 dark:text-teal-400'
                }`}
              >
                {confirmState.type === 'danger' ? (
                  <AlertTriangle className="w-6 h-6" />
                ) : (
                  <CheckCircle2 className="w-6 h-6" />
                )}
              </div>
              <div className="space-y-2">
                <h3 className="text-base font-black text-slate-800 dark:text-white leading-none">
                  {confirmState.title}
                </h3>
                <p className="text-xs font-semibold text-slate-400 dark:text-slate-350 leading-relaxed">
                  {confirmState.message}
                </p>
              </div>
            </div>

            {/* Buttons */}
            <div className="flex justify-end gap-3 mt-6 border-t border-slate-100 dark:border-slate-800/60 pt-4 flex-wrap">
              <button
                type="button"
                onClick={() => handleConfirmClose(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold border border-slate-200 dark:border-slate-800 bg-surface-card text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shadow-neu"
              >
                {confirmState.cancelText}
              </button>
              <button
                type="button"
                onClick={() => handleConfirmClose(true)}
                className={`px-5 py-2 rounded-xl text-xs font-bold text-white shadow-neu transition-colors ${
                  confirmState.type === 'danger'
                    ? 'bg-rose-600 hover:bg-rose-700 shadow-rose-600/15'
                    : 'bg-teal-600 hover:bg-teal-700 shadow-teal-600/15'
                }`}
              >
                {confirmState.confirmText}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </FeedbackContext.Provider>
  );
}

export function useAlert() {
  const context = useContext(FeedbackContext);
  if (!context) {
    throw new Error('useAlert must be used within a FeedbackProvider');
  }
  return { showAlert: context.showAlert };
}

export function useConfirm() {
  const context = useContext(FeedbackContext);
  if (!context) {
    throw new Error('useConfirm must be used within a FeedbackProvider');
  }
  return { confirm: context.showConfirm };
}
