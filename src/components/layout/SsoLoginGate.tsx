'use client';

import Image from 'next/image';
import { ArrowUpRight, KeyRound, LockKeyhole, ShieldCheck } from 'lucide-react';
import { redirectToSso } from '@/utils/api';

const appName = process.env.NEXT_PUBLIC_APP_NAME?.trim() || 'MeeTrip';
const appDescription = process.env.NEXT_PUBLIC_APP_DESCRIPTION?.trim()
  || 'Perjalanan dinas & ruang meeting';
const portalName = process.env.NEXT_PUBLIC_PORTAL_NAME?.trim() || 'InTes / Portal SSO';
const portalAccountName = process.env.NEXT_PUBLIC_PORTAL_ACCOUNT_NAME?.trim() || 'Portal INL';

const accessSteps = [
  {
    title: `Masuk di ${portalAccountName}`,
    description: 'Gunakan akun kerja perusahaan yang sudah terdaftar.',
  },
  {
    title: 'Akses diverifikasi',
    description: `${portalName} memeriksa identitas dan izin ${appName}.`,
  },
  {
    title: `Kembali ke ${appName}`,
    description: 'Sesi aplikasi dibuat dan pekerjaan dapat dilanjutkan.',
  },
];

export default function SsoLoginGate() {
  return (
    <main
      className="sso-gate-shell h-dvh min-h-0 overflow-hidden bg-slate-50 text-slate-950"
      style={{ fontFamily: '"Aptos Display", Aptos, "Segoe UI Variable Display", "Segoe UI", sans-serif' }}
    >
      <div className="mx-auto grid h-full min-h-0 w-full max-w-[1440px] lg:grid-cols-[minmax(0,1.1fr)_minmax(400px,0.9fr)]">
        <section className="sso-gate-intro flex h-full min-h-0 flex-col justify-between px-6 py-5 sm:px-10 sm:py-6 lg:px-14 lg:py-6 xl:px-20">
          <div className="flex items-center justify-between border-b border-slate-200 pb-3.5">
            <div className="flex items-center gap-3">
              <span className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-700">
                {appName}
              </span>
            </div>
            <span className="border-b-2 border-amber-500 pb-1 text-[10px] font-black uppercase tracking-[0.16em] text-slate-500">
              SSO / Required
            </span>
          </div>

          <div className="sso-gate-copy py-[clamp(1.25rem,4vh,3rem)]">
            <div className="sso-app-logo relative isolate mb-7 w-fit">
              <span
                className="pointer-events-none absolute inset-2 z-0 rounded-full bg-amber-300/45 blur-2xl"
                aria-hidden="true"
              />
              <Image
                src="/iconaja.png"
                alt="Logo MeeTrip"
                width={136}
                height={136}
                priority
                className="relative z-10 h-28 w-28 object-contain drop-shadow-[0_12px_24px_rgba(15,23,42,0.10)] sm:h-32 sm:w-32"
              />
            </div>

            <p className="mb-3 text-xs font-black uppercase tracking-[0.17em] text-amber-600">
              {appDescription}
            </p>
            <h1 className="max-w-2xl text-5xl font-black leading-[0.98] tracking-[-0.05em] text-slate-950 sm:text-6xl lg:text-7xl">
              Selamat datang di {appName}.
            </h1>
            <p className="sso-gate-explanation mt-5 max-w-xl text-base font-semibold leading-7 text-slate-600 sm:text-lg">
              Akses ke {appName} menggunakan akun {portalAccountName}. Login langsung tidak
              tersedia agar identitas dan hak akses kerja dikelola dari satu tempat.
            </p>

            <button
              type="button"
              onClick={redirectToSso}
              className="group relative mt-6 inline-flex min-h-[52px] w-full items-center justify-between overflow-hidden rounded-[12px] border border-amber-500/45 bg-transparent px-5 text-sm font-extrabold text-amber-700 shadow-[0_8px_20px_rgba(217,119,6,0.08)] transition duration-300 hover:scale-[1.02] hover:border-amber-500 hover:text-slate-950 hover:shadow-[0_14px_28px_rgba(217,119,6,0.18)] focus:outline-none focus:ring-4 focus:ring-amber-500/20 active:scale-[0.985] sm:w-auto sm:min-w-[260px]"
            >
              <span
                className="absolute inset-x-0 bottom-0 h-1 bg-amber-500 transition-[height] duration-300 ease-out group-hover:h-full"
                aria-hidden="true"
              />
              <span className="relative flex items-center gap-3">
                <KeyRound className="h-5 w-5" aria-hidden="true" />
                Login with Portal
              </span>
              <ArrowUpRight
                className="relative h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                aria-hidden="true"
              />
            </button>
          </div>

          <div className="sso-gate-footer flex items-center gap-2 border-t border-slate-200 pt-3.5 text-xs font-semibold text-slate-500">
            <LockKeyhole className="h-3.5 w-3.5 text-amber-600" aria-hidden="true" />
            Kredensial Anda hanya dimasukkan di {portalAccountName}.
          </div>
        </section>

        <aside className="sso-gate-guide relative hidden h-full min-h-0 overflow-hidden bg-slate-950 px-8 py-6 text-white lg:flex lg:flex-col lg:justify-between xl:px-11">
          <div className="relative mt-3">
            <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-amber-500">
              Gerbang aplikasi
            </p>
            <h2 className="mt-3 max-w-md text-4xl font-black leading-[1.04] tracking-[-0.035em] xl:text-[42px]">
              Masuk sekali. Lanjutkan pekerjaan di {appName}.
            </h2>
            <p className="mt-4 max-w-md text-base font-medium leading-6 text-slate-300">
              {portalName} menghubungkan identitas kerja Anda ke {appName} tanpa
              membagikan kata sandi.
            </p>
          </div>

          <ol className="relative my-5 border-l border-white/10 pl-7">
            {accessSteps.map((step, index) => (
              <li
                key={step.title}
                className="relative border-b border-white/10 py-3 first:pt-0 last:border-b-0 last:pb-0"
              >
                <span
                  className={`absolute -left-[33px] h-2.5 w-2.5 rounded-full border-2 border-slate-950 bg-amber-500 ${
                    index === 0 ? 'top-1' : 'top-4'
                  }`}
                  aria-hidden="true"
                />
                <span className="font-mono text-[11px] text-amber-500">
                  {String(index + 1).padStart(2, '0')}
                </span>
                <h3 className="mt-1 text-base font-bold text-white">{step.title}</h3>
                <p className="mt-1 text-sm font-medium leading-5 text-slate-300">
                  {step.description}
                </p>
              </li>
            ))}
          </ol>

          <div className="relative mb-3 mt-5 flex items-start gap-3 border-t border-white/10 pt-4">
            <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-amber-400" aria-hidden="true" />
            <div>
              <p className="text-sm font-bold text-slate-200">One-time SSO handoff</p>
              <p className="mt-1 text-xs font-medium leading-5 text-slate-400">
                Token {portalAccountName} digunakan sekali dan tidak disimpan oleh browser.
              </p>
            </div>
          </div>
        </aside>
      </div>
    </main>
  );
}
