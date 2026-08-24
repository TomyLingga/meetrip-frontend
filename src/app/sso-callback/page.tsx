'use client';

import { useEffect, useState } from 'react';
import { Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { API_URL, fetchWithTimeout, getLocalToken, redirectToPortalDashboard, setLocalToken, setLocalRefreshToken, clearTokens, validateRuntimeConfig } from '@/utils/api';
import { ShieldAlert } from 'lucide-react';

function SsoCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    const ssoToken = searchParams.get('token');
    const appIdFromUrl = searchParams.get('appId') || searchParams.get('app_id');
    const appId    = appIdFromUrl || process.env.NEXT_PUBLIC_MEETRIP_APP_ID;
    if (!ssoToken) {
      if (getLocalToken()) {
        router.replace('/dashboard');
      } else {
        redirectToPortalDashboard();
      }
      return;
    }

    // Gunakan sessionStorage agar idempotent saat React 18 StrictMode / re-render
    const sessionKey = `sso_done_${ssoToken}`;
    if (sessionStorage.getItem(sessionKey) === 'completed') {
      router.replace('/dashboard');
      return;
    }
    if (sessionStorage.getItem(sessionKey) === 'processing') return;
    sessionStorage.setItem(sessionKey, 'processing');

    async function loginWithSso() {
      try {
        if (!appId) {
          throw new Error('NEXT_PUBLIC_MEETRIP_APP_ID belum dikonfigurasi di .env.local. Hubungi administrator.');
        }

        validateRuntimeConfig();

        // Bersihkan token/sesi lama sebelum menukar token SSO baru
        clearTokens();

        const res = await fetchWithTimeout(`${API_URL}/api/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ssoToken, appId }),
        });

        if (!res.ok) {
          const json = await res.json().catch(() => null);
          throw new Error(json?.error || json?.message || 'Gagal memproses verifikasi token SSO');
        }

        const json = await res.json();
        const { accessToken, refreshToken, user } = json.data;

        setLocalToken(accessToken);
        setLocalRefreshToken(refreshToken);
        localStorage.setItem('meetrip_user', JSON.stringify(user));
        sessionStorage.setItem(sessionKey, 'completed');

        router.replace('/dashboard');
      } catch (err) {
        console.error('[SSO Callback Error]', err);
        sessionStorage.removeItem(sessionKey);
        setErrorMsg(err instanceof Error ? err.message : 'Kesalahan saat autentikasi SSO');
      }
    }

    loginWithSso();
  }, [searchParams, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface-sunken p-4">
      {!errorMsg ? (
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <h2 className="text-xl font-bold bg-gradient-to-r from-teal-500 to-indigo-600 dark:from-teal-400 dark:to-indigo-400 bg-clip-text text-transparent">
            Mengotentikasi sesi Anda...
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">Harap tunggu sebentar selagi kami mengalihkan Anda</p>
        </div>
      ) : (
        <div className="relative w-full max-w-md overflow-hidden rounded-3xl bg-white p-6 shadow-neu-pop dark:bg-[#121620] border border-slate-200 dark:border-slate-800/80 transition-all transform scale-100 duration-300">
          {/* Header / Icon */}
          <div className="flex items-start gap-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-450 border border-rose-100 dark:border-rose-900/30">
              <ShieldAlert className="h-5 w-5" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-black tracking-tight text-slate-900 dark:text-white">
                Autentikasi SSO Gagal
              </h3>
              <p className="mt-2 text-sm text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
                {errorMsg}
              </p>
            </div>
          </div>

          {/* Action Button */}
          <div className="mt-6 flex justify-end">
            <button
              type="button"
              onClick={redirectToPortalDashboard}
              className="rounded-full bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 px-6 py-2 text-xs font-black tracking-wider text-white dark:text-slate-900 transition-all duration-200 shadow-neu-sm hover:shadow active:scale-95"
            >
              KEMBALI KE PORTAL
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function SsoCallback() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-300 border-t-slate-900" />
      </div>
    }>
      <SsoCallbackContent />
    </Suspense>
  );
}
