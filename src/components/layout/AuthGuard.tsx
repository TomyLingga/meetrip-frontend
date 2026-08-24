'use client';

import React, { useEffect, useState } from 'react';
import { getLocalToken } from '@/utils/api';
import Sidebar from './Sidebar';
import PageTransition from '../motion/PageTransition';
import SsoLoginGate from './SsoLoginGate';

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const [authorized, setAuthorized] = useState(false);
  const [showGate, setShowGate] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const ssoToken = urlParams.get('token') || urlParams.get('sso_token');
      const appId = urlParams.get('appId') || urlParams.get('app_id');
      if (ssoToken) {
        const targetUrl = appId
          ? `/sso-callback?token=${encodeURIComponent(ssoToken)}&appId=${encodeURIComponent(appId)}`
          : `/sso-callback?token=${encodeURIComponent(ssoToken)}`;
        window.location.replace(targetUrl);
        return;
      }
    }

    const token = getLocalToken();
    if (!token) {
      setShowGate(true);
      return;
    }
    setAuthorized(true);
  }, []);

  if (showGate) {
    return <SsoLoginGate />;
  }

  if (!authorized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface">
        <div className="flex items-center gap-3 rounded-xl border border-slate-200/70 bg-surface-card px-4 py-3 shadow-neu dark:border-white/[0.06]">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-slate-300 border-t-teal-600 dark:border-slate-700 dark:border-t-teal-400" />
          <p className="text-sm font-medium text-slate-600 dark:text-slate-300">Verifikasi sesi SSO...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface transition-all duration-300">
      <Sidebar isCollapsed={isSidebarCollapsed} onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)} />
      <main className={`min-h-screen min-w-0 overflow-x-hidden px-3 pb-5 pt-20 sm:px-4 md:px-6 md:py-6 lg:px-8 transition-all duration-300 ${isSidebarCollapsed ? 'md:ml-0' : 'md:ml-64'}`}>
        <div className="mx-auto w-full max-w-7xl">
          <PageTransition>{children}</PageTransition>
        </div>
      </main>
    </div>
  );
}
