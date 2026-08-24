'use client';

import React, { useEffect, useState } from 'react';
import {
  User, Mail, Shield, Briefcase, Award, Building,
  ArrowLeft, LogOut, ShieldAlert, KeyRound, CheckCircle
} from 'lucide-react';
import { getCachedUser, leaveMeetripForPortal } from '@/utils/api';
import { useConfirm } from '@/context/FeedbackContext';

type CachedUser = {
  nama?: string | null;
  jabatan?: string | null;
  email?: string;
  role?: string | null;
  gradeLevel?: number | null;
  gradeKode?: string | null;
  unitNama?: string | null;
  sub?: string;
  employeeId?: string | null;
  fotoPath?: string | null;
};

export default function ProfilePage() {
  const [user, setUser] = useState<CachedUser | null>(null);
  const [isReturningToPortal, setIsReturningToPortal] = useState(false);
  const { confirm } = useConfirm();

  useEffect(() => {
    const cachedUser = getCachedUser();
    if (cachedUser) setUser(cachedUser);
  }, []);

  const handleBackToPortal = async () => {
    if (isReturningToPortal) return;

    const approved = await confirm(
      'Sesi MeeTrip akan diakhiri. Setelah itu tab ini akan ditutup dan Anda kembali ke dashboard Portal.',
      {
        title: 'Kembali ke Portal?',
        confirmText: 'Akhiri Sesi & Kembali',
        cancelText: 'Tetap di MeeTrip',
        type: 'danger',
      },
    );
    if (!approved) return;

    setIsReturningToPortal(true);
    await leaveMeetripForPortal();
  };

  const getRoleBadge = (role?: string | null) => {
    switch (role) {
      case 'admin':
        return 'bg-rose-500/10 text-rose-600 dark:bg-rose-500/20 dark:text-rose-400 border border-rose-200/50';
      case 'sdm':
        return 'bg-purple-500/10 text-purple-600 dark:bg-purple-500/20 dark:text-purple-400 border border-purple-200/50';
      default:
        return 'bg-teal-500/10 text-teal-600 dark:bg-teal-500/20 dark:text-teal-400 border border-teal-200/50';
    }
  };

  return (
    <div className="space-y-8 max-w-4xl animate-in fade-in slide-in-from-bottom-4 duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-5 dark:border-slate-800">
        <div>
          <h1 className="text-2xl font-black text-slate-850 dark:text-white">Profil Pengguna</h1>
          <p className="text-xs text-slate-400 font-semibold mt-1">Detail informasi diri dan status akun yang sedang login di MeeTrip.</p>
        </div>
        <button
          onClick={handleBackToPortal}
          disabled={isReturningToPortal}
          className="inline-flex items-center justify-center gap-2 bg-surface-card hover:bg-slate-50 disabled:cursor-wait disabled:opacity-60 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-xs font-bold transition-all shadow-neu-sm active:scale-95 text-slate-600 dark:text-slate-350"
        >
          <ArrowLeft className="h-4 w-4" />
          {isReturningToPortal ? 'Mengakhiri sesi...' : 'Kembali Ke Portal'}
        </button>
      </div>

      {/* Profile Card Header */}
      <div className="relative overflow-hidden rounded-[24px] border border-slate-200/80 dark:border-white/[0.06] bg-surface-card p-6 md:p-8 shadow-neu-sm">
        {/* Accent Glow */}
        <div className="absolute top-0 right-0 h-40 w-40 rounded-full bg-teal-500/10 blur-[50px] pointer-events-none" />

        <div className="flex flex-col md:flex-row items-center gap-6">
          <div className="relative overflow-hidden h-20 w-20 rounded-full bg-gradient-to-tr from-teal-500 to-emerald-400 flex items-center justify-center text-white text-3xl font-black shadow-neu-accent shrink-0 select-none">
            <span className="absolute z-0">{user?.nama ? user.nama.charAt(0).toUpperCase() : <User className="h-8 w-8" />}</span>
            {(user?.fotoPath || user?.employeeId) && (
              <img
                src={user?.fotoPath || `${process.env.NEXT_PUBLIC_PORTAL_URL || 'http://localhost:3002'}/uploads/profiles/${user?.employeeId}.jpg`}
                alt="Profile"
                className="absolute inset-0 h-full w-full object-cover z-10 bg-surface-card"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
            )}
          </div>

          <div className="flex-1 text-center md:text-left space-y-2">
            <div>
              <h2 className="text-xl font-extrabold text-slate-800 dark:text-white">{user?.nama || 'Pengguna MeeTrip'}</h2>
              <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mt-0.5">{user?.jabatan || 'Staf Karyawan'}</p>
            </div>
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold capitalize ${getRoleBadge(user?.role)}`}>
                <Shield className="h-3 w-3" />
                Akses: {user?.role || 'user'}
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200/50 dark:border-slate-700/50">
                <Award className="h-3 w-3 text-amber-500" />
                Grade: {user?.gradeKode || 'N/A'} (Lvl {user?.gradeLevel ?? 0})
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Detailed Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Corporate Details */}
        <div className="bg-surface-card border border-slate-200/80 dark:border-white/[0.06] rounded-[24px] p-6 space-y-5 shadow-neu-sm">
          <h3 className="text-xs font-black text-slate-450 dark:text-slate-400 uppercase tracking-widest flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
            <Building className="h-4.5 w-4.5 text-teal-500" />
            Detail Perusahaan & Jabatan
          </h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center py-0.5">
              <span className="text-xs text-slate-400 font-semibold">Nama Lengkap</span>
              <span className="text-xs font-bold text-slate-800 dark:text-slate-250">{user?.nama || '—'}</span>
            </div>
            <div className="flex justify-between items-center py-0.5">
              <span className="text-xs text-slate-400 font-semibold">Jabatan</span>
              <span className="text-xs font-bold text-slate-800 dark:text-slate-250">{user?.jabatan || '—'}</span>
            </div>
            <div className="flex justify-between items-center py-0.5">
              <span className="text-xs text-slate-400 font-semibold">Unit Kerja / Divisi</span>
              <span className="text-xs font-bold text-slate-800 dark:text-slate-250">{user?.unitNama || '—'}</span>
            </div>
            <div className="flex justify-between items-center py-0.5">
              <span className="text-xs text-slate-400 font-semibold">Grade Golongan</span>
              <span className="text-xs font-bold text-slate-800 dark:text-slate-250">{user?.gradeKode || '—'} (Level {user?.gradeLevel ?? '0'})</span>
            </div>
          </div>
        </div>

        {/* Account and Credentials */}
        <div className="bg-surface-card border border-slate-200/80 dark:border-white/[0.06] rounded-[24px] p-6 space-y-5 shadow-neu-sm">
          <h3 className="text-xs font-black text-slate-450 dark:text-slate-400 uppercase tracking-widest flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
            <KeyRound className="h-4.5 w-4.5 text-teal-500" />
            Informasi Akun & Keamanan
          </h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center py-0.5">
              <span className="text-xs text-slate-400 font-semibold">Alamat Email</span>
              <span className="text-xs font-bold text-slate-800 dark:text-slate-250 flex items-center gap-1.5">
                <Mail className="h-3.5 w-3.5 text-slate-400" />
                {user?.email || '—'}
              </span>
            </div>
            <div className="flex justify-between items-center py-0.5">
              <span className="text-xs text-slate-400 font-semibold">SSO User ID</span>
              <span className="text-[10px] font-bold font-mono text-slate-500 dark:text-slate-400 truncate max-w-[200px]" title={user?.sub}>
                {user?.sub || '—'}
              </span>
            </div>
            <div className="flex justify-between items-center py-0.5">
              <span className="text-xs text-slate-400 font-semibold">Status Login</span>
              <span className="inline-flex items-center gap-1 bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400 px-2 py-0.5 rounded-full text-[10px] font-bold">
                <CheckCircle className="h-3 w-3" />
                Terverifikasi SSO
              </span>
            </div>
            <div className="flex justify-between items-center py-0.5">
              <span className="text-xs text-slate-400 font-semibold">Sistem Keamanan</span>
              <span className="inline-flex items-center gap-1 bg-teal-500/10 text-teal-600 dark:bg-teal-500/20 dark:text-teal-400 px-2 py-0.5 rounded-full text-[10px] font-bold">
                Active Token (JWT)
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Notes / App Rules */}
      <div className="flex items-start gap-3 p-4 rounded-2xl bg-amber-500/5 border border-amber-500/10 text-slate-600 dark:text-slate-400 text-xs font-semibold leading-relaxed">
        <ShieldAlert className="h-5 w-5 text-amber-500 shrink-0" />
        <p>
          Akun ini terhubung langsung dengan sistem SSO (Single Sign-On) Portal Utama Perusahaan. Pengubahan data profil (nama, jabatan, golongan, divisi) hanya dapat dilakukan melalui Administrator Portal Utama.
        </p>
      </div>
    </div>
  );
}
