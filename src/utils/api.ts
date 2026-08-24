// ─── API Helper Utility ───────────────────────────────────────────────────────
export const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3003';
export const PORTAL_URL = process.env.NEXT_PUBLIC_PORTAL_URL || 'http://localhost:3002';
export const PORTAL_LOGIN_URL = process.env.NEXT_PUBLIC_PORTAL_LOGIN_URL
  || `${PORTAL_URL.replace(/\/$/, '')}/login`;
export const PORTAL_DASHBOARD_URL = `${PORTAL_URL.replace(/\/$/, '')}/dashboard`;
const MEETRIP_APP_ID = process.env.NEXT_PUBLIC_MEETRIP_APP_ID || '';

/**
 * URL dokumen TANPA token. Dulu fungsi ini menempelkan `?token=<JWT>` sehingga
 * access token 30 menit ikut tertulis di riwayat browser, header Referer, dan log
 * server. Semua pembukaan dokumen sekarang lewat `openDocument()` yang memakai
 * header Authorization; fungsi ini hanya untuk membangun URL biasa.
 */
export function documentUrl(path: string) {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${API_URL}${normalizedPath}`;
}

export async function openDocument(path: string) {
  if (typeof window === 'undefined') return;
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;

  const popup = window.open('', '_blank');
  const token = getLocalToken();

  try {
    const response = await fetchWithTimeout(`${API_URL}${normalizedPath}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    });
    if (!response.ok) {
      const text = await response.text().catch(() => '');
      throw new Error(text || `Gagal membuka dokumen (${response.status})`);
    }
    const contentType = response.headers.get('content-type') || 'text/html; charset=utf-8';
    const blob = await response.blob();
    const url = URL.createObjectURL(new Blob([blob], { type: contentType }));
    if (popup) {
      popup.location.href = url;
    } else {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
    window.setTimeout(() => URL.revokeObjectURL(url), 120000);
  } catch (err: any) {
    const message = String(err?.message || err);
    if (popup) {
      // textContent, bukan innerHTML: pesan error bisa berisi teks dari server.
      const pre = popup.document.createElement('pre');
      pre.setAttribute('style', 'font-family:Arial,sans-serif;color:#b91c1c;white-space:pre-wrap');
      pre.textContent = message;
      popup.document.body.appendChild(pre);
    }
    console.error(err);
  }
}

export function refreshMeetripBadges() {
  if (typeof window === 'undefined') return;
  // Satu event saja: dulu 'storage' ikut dikirim padahal listener-nya sama,
  // sehingga tiap aksi approve memicu dua kali putaran fetch badge.
  window.dispatchEvent(new Event('meetrip:badges-refresh'));
}

/**
 * Unduh berkas lewat header Authorization lalu simpan sebagai file.
 * Dipakai untuk ekspor Excel dan unduhan PDF yang dulu memakai `?token=` di href.
 */
export async function downloadDocument(path: string, filename?: string) {
  if (typeof window === 'undefined') return;
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  const token = getLocalToken();

  const response = await fetchWithTimeout(`${API_URL}${normalizedPath}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  });
  if (!response.ok) {
    const text = await response.text().catch(() => '');
    throw new Error(text || `Gagal mengunduh berkas (${response.status})`);
  }

  const disposition = response.headers.get('content-disposition') || '';
  const matched = /filename\*?=(?:UTF-8'')?"?([^";]+)"?/i.exec(disposition);
  const resolvedName = filename || (matched ? decodeURIComponent(matched[1]) : normalizedPath.split('/').pop() || 'berkas');

  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = resolvedName;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 60000);
}

function isLocalApiUrl(url: string) {
  try {
    const parsed = new URL(url);
    return parsed.hostname === 'localhost' || parsed.hostname === '127.0.0.1';
  } catch {
    return false;
  }
}

function isBrowserProductionHost() {
  if (typeof window === 'undefined') return false;
  return window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1';
}

export function validateRuntimeConfig() {
  if (isBrowserProductionHost() && isLocalApiUrl(API_URL)) {
    throw new Error('Konfigurasi MeeTrip belum siap: NEXT_PUBLIC_API_URL masih mengarah ke localhost. Isi dengan URL backend Render, misalnya https://meetrip-be.onrender.com, lalu redeploy frontend.');
  }

  if (isBrowserProductionHost() && !MEETRIP_APP_ID) {
    throw new Error('Konfigurasi MeeTrip belum siap: NEXT_PUBLIC_MEETRIP_APP_ID belum diisi di environment frontend.');
  }
}

export async function fetchWithTimeout(input: RequestInfo | URL, init: RequestInit = {}, timeoutMs = 20000) {
  const controller = new AbortController();
  const timer = globalThis.setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(input, { ...init, signal: init.signal || controller.signal });
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') {
      throw new Error('Request ke server MeeTrip terlalu lama. Periksa apakah backend Render sudah aktif dan NEXT_PUBLIC_API_URL sudah benar.');
    }
    throw err;
  } finally {
    globalThis.clearTimeout(timer);
  }
}

export function getLocalToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('meetrip_access_token');
}

export function setLocalToken(token: string) {
  localStorage.setItem('meetrip_access_token', token);
}

export function getLocalRefreshToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('meetrip_refresh_token');
}

export function setLocalRefreshToken(token: string) {
  localStorage.setItem('meetrip_refresh_token', token);
}

export function clearTokens() {
  localStorage.removeItem('meetrip_access_token');
  localStorage.removeItem('meetrip_refresh_token');
  localStorage.removeItem('meetrip_user');
}

// Safely read the cached SSO user from localStorage. Returns null (and clears the
// bad key) if the value is missing or corrupt, so a malformed entry never throws
// during render and white-screens the app.
export function getCachedUser<T = any>(): T | null {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem('meetrip_user');
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    localStorage.removeItem('meetrip_user');
    return null;
  }
}

export function redirectToPortalDashboard() {
  if (typeof window !== 'undefined') {
    window.location.href = PORTAL_DASHBOARD_URL;
  }
}

async function revokeMeetripRefreshToken(accessToken: string, refreshToken: string) {
  return fetchWithTimeout(`${API_URL}/api/auth/logout`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ refreshToken }),
  }, 6000);
}

/**
 * Mencabut refresh token MeeTrip di server dan selalu membersihkan sesi lokal.
 * Jika access token sudah kedaluwarsa, refresh dilakukan sekali hanya untuk
 * memperoleh kredensial yang dapat mencabut refresh token terbaru.
 */
export async function destroyMeetripSession() {
  if (typeof window === 'undefined') return;

  const accessToken = getLocalToken();
  const refreshToken = getLocalRefreshToken();

  try {
    if (!accessToken || !refreshToken) return;

    const logoutResponse = await revokeMeetripRefreshToken(accessToken, refreshToken);
    if (logoutResponse.status !== 401) return;

    const refreshResponse = await fetchWithTimeout(`${API_URL}/api/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    }, 6000);

    if (!refreshResponse.ok) return;

    const payload = await refreshResponse.json();
    const refreshedAccessToken = payload?.data?.accessToken;
    const refreshedRefreshToken = payload?.data?.refreshToken;
    if (refreshedAccessToken && refreshedRefreshToken) {
      await revokeMeetripRefreshToken(refreshedAccessToken, refreshedRefreshToken);
    }
  } catch (error) {
    // Logout tetap dilanjutkan secara lokal ketika backend sedang tidak tersedia.
    console.warn('[MeeTrip Logout] Gagal mencabut sesi server:', error);
  } finally {
    clearTokens();
  }
}

/**
 * Mengakhiri sesi MeeTrip lalu menutup tab aplikasi bila tab dibuka oleh Portal.
 * Browser yang menolak window.close() akan memakai redirect sebagai fallback.
 */
export async function leaveMeetripForPortal() {
  if (typeof window === 'undefined') return;

  await destroyMeetripSession();
  window.close();
  window.setTimeout(() => {
    if (!window.closed) {
      window.location.replace(PORTAL_DASHBOARD_URL);
    }
  }, 120);
}

// Redirect to SSO Portal. The portal dashboard will validate its own session
// and send unauthenticated users to the login page.
export function redirectToSso() {
  clearTokens();
  if (typeof window !== 'undefined') {
    window.location.href = PORTAL_LOGIN_URL;
  }
}

// ─── Single-flight refresh mutex ──────────────────────────────────────────────
// Ketika beberapa request paralel mendapat 401, hanya satu yang melakukan refresh
// dan yang lain menunggu hasilnya. Tanpa ini, backend merotasi refresh token pada
// penggunaan pertama sehingga permintaan kedua gagal dan memaksa logout.
let refreshPromise: Promise<{ accessToken: string; refreshToken: string }> | null = null

async function singleFlightRefresh(): Promise<{ accessToken: string; refreshToken: string }> {
  if (refreshPromise) return refreshPromise

  const rt = getLocalRefreshToken()
  if (!rt) {
    redirectToSso()
    throw new Error('Unauthorized')
  }

  refreshPromise = (async () => {
    try {
      const refreshRes = await fetchWithTimeout(`${API_URL}/api/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken: rt }),
      })

      if (refreshRes.ok) {
        const { data } = await refreshRes.json()
        setLocalToken(data.accessToken)
        setLocalRefreshToken(data.refreshToken)
        return { accessToken: data.accessToken, refreshToken: data.refreshToken }
      } else {
        redirectToSso()
        throw new Error('Session expired')
      }
    } catch (err) {
      redirectToSso()
      throw err
    } finally {
      refreshPromise = null
    }
  })()

  return refreshPromise
}

/**
 * Versi apiFetch yang mengembalikan objek Response mentah — untuk pemanggil yang
 * ingin memeriksa `res.ok`/status sendiri (mis. unggahan file). Tetap menyertakan
 * header Authorization dan tetap melakukan refresh sekali saat 401, sesuatu yang
 * hilang ketika kode memakai `fetch()` langsung.
 */
export async function apiFetchRaw(endpoint: string, options: RequestInit = {}): Promise<Response> {
  validateRuntimeConfig();
  const token = getLocalToken();
  const headers = new Headers(options.headers || {});
  if (token) headers.set('Authorization', `Bearer ${token}`);
  if (typeof options.body === 'string' && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const url = `${API_URL}${endpoint}`;
  let response = await fetchWithTimeout(url, { ...options, headers });
  if (response.status === 401) {
    const refreshed = await singleFlightRefresh();
    headers.set('Authorization', `Bearer ${refreshed.accessToken}`);
    response = await fetchWithTimeout(url, { ...options, headers });
  }
  return response;
}

// Fetch with automatic token handling and refresh
export async function apiFetch(endpoint: string, options: RequestInit = {}): Promise<any> {
  validateRuntimeConfig();
  let token = getLocalToken();

  const headers = new Headers(options.headers || {});
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  /*
   * Body berupa string selalu JSON di aplikasi ini. Tanpa header ini browser
   * mengirim `text/plain`, Fastify tidak mem-parse body-nya, dan validasi Zod di
   * backend menolak request — itulah sebabnya beberapa modal edit selalu gagal
   * menyimpan meski payload-nya benar.
   */
  if (typeof options.body === 'string' && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const url = `${API_URL}${endpoint}`;
  let response = await fetchWithTimeout(url, { ...options, headers });

  // Handle Unauthorized (401) — gunakan single-flight mutex agar concurrent
  // 401 tidak masing-masing memanggil refresh (backend merotasi token).
  if (response.status === 401) {
    try {
      const refreshed = await singleFlightRefresh();
      headers.set('Authorization', `Bearer ${refreshed.accessToken}`);
      response = await fetchWithTimeout(url, { ...options, headers });
    } catch (err) {
      throw err;
    }
  }

  const json = await response.json();
  if (!response.ok) {
    let errorMessage = json.error || json.message || 'Request failed';
    if (json.details && Array.isArray(json.details)) {
      const detailsStr = json.details.map((d: any) => `${d.field || 'Field'}: ${d.message || 'Invalid'}`).join('\n');
      errorMessage = `${errorMessage}\n${detailsStr}`;
    }
    throw new Error(errorMessage);
  }

  return json.data;
}
