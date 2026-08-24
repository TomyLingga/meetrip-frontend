'use client';

import { useEffect, useState } from 'react';
import { Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { getLocalToken } from '@/utils/api';
import SsoLoginGate from '@/components/layout/SsoLoginGate';

function RedirectHome() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isCheckingSession, setIsCheckingSession] = useState(true);

  useEffect(() => {
    const ssoToken = searchParams.get('token') ?? searchParams.get('sso_token');
    const appId = searchParams.get('appId') ?? searchParams.get('app_id');
    if (ssoToken) {
      const targetUrl = appId
        ? `/sso-callback?token=${encodeURIComponent(ssoToken)}&appId=${encodeURIComponent(appId)}`
        : `/sso-callback?token=${encodeURIComponent(ssoToken)}`;
      router.replace(targetUrl);
      return;
    }

    const token = getLocalToken();
    if (token) {
      router.replace('/dashboard');
    } else {
      setIsCheckingSession(false);
    }
  }, [router, searchParams]);

  if (isCheckingSession) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f3f3ed]">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#123f38]/20 border-t-[#123f38]" />
        <span className="sr-only">Memeriksa sesi MeeTrip...</span>
      </div>
    );
  }

  return <SsoLoginGate />;
}

export default function Home() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center bg-[#f3f3ed]">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#123f38]/20 border-t-[#123f38]" />
      </div>
    }>
      <RedirectHome />
    </Suspense>
  );
}
