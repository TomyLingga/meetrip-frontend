'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import AuthGuard from '@/components/layout/AuthGuard';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  // Pages that bypass main app AuthGuard and Sidebar layout
  const isStandalonePage = pathname === '/' || pathname?.startsWith('/sso-callback') || pathname?.startsWith('/meeting/tv');

  if (isStandalonePage) {
    return <>{children}</>;
  }

  return <AuthGuard>{children}</AuthGuard>;
}
