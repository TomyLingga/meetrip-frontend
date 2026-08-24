'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Compass,
  ArrowLeft,
  LayoutDashboard,
  MapPinned,
  Settings,
  Shield,
  ShieldCheck,
  User,
  ChevronDown,
  Database,
  Menu,
  X,
  Calendar,
  PanelLeftClose,
  PanelLeftOpen,
} from 'lucide-react';
import { apiFetch, getCachedUser, leaveMeetripForPortal } from '@/utils/api';
import { useConfirm } from '@/context/FeedbackContext';
import ThemeToggle from '../ui/ThemeToggle';
import { AnimatePresence, motion, type Variants } from 'motion/react';

type CachedUser = {
  nama?: string | null;
  jabatan?: string | null;
  email?: string;
  role?: string | null;
  gradeLevel?: number | null;
  gradeKode?: string | null;
  unitNama?: string | null;
  employeeId?: string | null;
  fotoPath?: string | null;
};

type NavSubItem = {
  name: string;
  path: string;
  roles?: string[];
};

type NavItem = {
  name: string;
  path: string;
  icon: any;
  roles: string[];
  subItems?: NavSubItem[];
};

const HamburgerIcon = ({ isOpen }: { isOpen: boolean }) => (
  <div className="flex flex-col justify-center items-center w-5 h-5 space-y-[4px]">
    <motion.span
      animate={isOpen ? { rotate: 45, y: 6 } : { rotate: 0, y: 0 }}
      className="block w-4 h-[2px] bg-current rounded-full origin-center"
      transition={{ duration: 0.3 }}
    />
    <motion.span
      animate={isOpen ? { opacity: 0 } : { opacity: 1 }}
      className="block w-4 h-[2px] bg-current rounded-full"
      transition={{ duration: 0.3 }}
    />
    <motion.span
      animate={isOpen ? { rotate: -45, y: -6 } : { rotate: 0, y: 0 }}
      className="block w-4 h-[2px] bg-current rounded-full origin-center"
      transition={{ duration: 0.3 }}
    />
  </div>
);

const getInitial = (name?: string | null) => name ? name.charAt(0).toUpperCase() : 'U';

const navItems: NavItem[] = [
  { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard, roles: ['admin', 'sdm', 'user'] },
  {
    name: 'Manajemen Dinas',
    path: '/bto',
    icon: Compass,
    roles: ['admin', 'sdm', 'user'],
    subItems: [
      { name: 'Butuh Persetujuan', path: '/bto/butuh-persetujuan', roles: ['admin', 'sdm', 'user'] },
      { name: 'Pengajuan Dinas', path: '/bto', roles: ['admin', 'sdm', 'user'] },
      { name: 'Persetujuan SDM', path: '/bto/sdm-review', roles: ['admin', 'sdm'] },
      { name: 'Persetujuan DP', path: '/bto/approve-dp', roles: ['admin'] },
      { name: 'Penerbitan SPDK', path: '/bto/issue-spdk', roles: ['admin'] },
      { name: 'Daftar SPDK Aktif', path: '/bto/active-spdk', roles: ['admin', 'sdm', 'user'] },
      { name: 'Menunggu Pencairan', path: '/bto/bte-payment', roles: ['admin'] },
      { name: 'Persetujuan BTE', path: '/bto/bte-approve', roles: ['admin'] },
      { name: 'Riwayat Selesai/Batal', path: '/bto/completed', roles: ['admin', 'sdm', 'user'] },
    ]
  },
  { name: 'Booking Ruang Rapat', path: '/meeting', icon: Calendar, roles: ['admin', 'sdm', 'user'] },
  {
    name: 'Master Data',
    path: '/master',
    icon: Database,
    roles: ['admin'],
    subItems: [
      { name: 'Master Transport', path: '/master/transport', roles: ['admin'] },
      { name: 'Master Tipe Rincian', path: '/master/tipe-rincian', roles: ['admin'] },
      { name: 'Master Rincian Biaya', path: '/master/rincian-biaya', roles: ['admin'] },
      { name: 'Master Pagu', path: '/master/pagu', roles: ['admin'] },
      { name: 'Master Ruang Meeting', path: '/master/ruang-meeting', roles: ['admin'] },
    ]
  },
  {
    name: 'Konfigurasi',
    path: '/konfigurasi',
    icon: Settings,
    roles: ['admin'],
    subItems: [
      { name: 'Radius Absen', path: '/konfigurasi/dinas', roles: ['admin'] },
      { name: 'Konfigurasi Pemberi Tugas', path: '/konfigurasi/pemberi-tugas', roles: ['admin'] },
      { name: 'Konfigurasi Approver SPDK', path: '/konfigurasi/approver-spdk', roles: ['admin'] },
    ]
  },
  { name: 'Atur Hak Akses', path: '/akses', icon: Shield, roles: ['admin'] },
  { name: 'Profil Saya', path: '/profile', icon: User, roles: ['admin', 'sdm', 'user'] },
];

export default function Sidebar({ 
  isCollapsed = false, 
  onToggleCollapse = () => {} 
}: { 
  isCollapsed?: boolean; 
  onToggleCollapse?: () => void;
}) {
  const pathname = usePathname();
  const [user, setUser] = useState<CachedUser | null>(null);
  const [configExpanded, setConfigExpanded] = useState(false);
  const [manajemenExpanded, setManajemenExpanded] = useState(false);
  const [masterExpanded, setMasterExpanded] = useState(false);
  const [myApprovalsCount, setMyApprovalsCount] = useState(0);
  const [adminQueueCounts, setAdminQueueCounts] = useState<Record<string, number>>({});
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isReturningToPortal, setIsReturningToPortal] = useState(false);
  const { confirm } = useConfirm();

  useEffect(() => {
    const cachedUser = getCachedUser();
    if (cachedUser) setUser(cachedUser);
  }, []);

  useEffect(() => {
    const fetchApprovalsCount = async () => {
      try {
        const res = await apiFetch('/api/bto/approvals?all=false');
        if (Array.isArray(res)) {
          setMyApprovalsCount(res.length);
        }
      } catch (err) {
        console.error('Failed to fetch approvals count for badge:', err);
      }
    };

    if (user) {
      fetchApprovalsCount();
      window.addEventListener('meetrip:badges-refresh', fetchApprovalsCount);
      window.addEventListener('storage', fetchApprovalsCount);
      const interval = setInterval(fetchApprovalsCount, 30000);
      return () => {
        clearInterval(interval);
        window.removeEventListener('meetrip:badges-refresh', fetchApprovalsCount);
        window.removeEventListener('storage', fetchApprovalsCount);
      };
    }
  }, [user]);

  useEffect(() => {
    const fetchAdminQueueCounts = async () => {
      const userRoles = (user?.role || 'user').split(',');
      const canSeeAdminQueues = userRoles.some(r => ['admin', 'super_admin', 'sdm'].includes(r));
      if (!canSeeAdminQueues) {
        setAdminQueueCounts({});
        return;
      }

      const safeRows = async (endpoint: string) => {
        try {
          const res = await apiFetch(endpoint);
          return Array.isArray(res) ? res : (res?.rows || []);
        } catch {
          return [];
        }
      };

      const [dpRows, sdmRows, spdkRows, bteRows] = await Promise.all([
        safeRows('/api/bto?status=ADMIN_DP_REVIEW&limit=200'),
        userRoles.includes('sdm') ? safeRows('/api/bto?status=SDM_REVIEW&limit=200') : Promise.resolve([]),
        safeRows('/api/bto?status=SPDK_DRAFT&limit=200'),
        safeRows('/api/bte/admin/list?limit=100'),
      ]);

      setAdminQueueCounts({
        '/bto/approve-dp': dpRows.length,
        '/bto/sdm-review': sdmRows.length,
        '/bto/issue-spdk': spdkRows.length,
        '/bto/bte-approve': bteRows.filter((row: any) => ['ADMIN_REVIEW', 'SUBMITTED'].includes(row.status)).length,
        '/bto/bte-payment': bteRows.filter((row: any) => row.status === 'PENDING_PAYMENT').length,
      });
    };

    if (user) {
      fetchAdminQueueCounts();
      window.addEventListener('meetrip:badges-refresh', fetchAdminQueueCounts);
      window.addEventListener('storage', fetchAdminQueueCounts);
      const interval = setInterval(fetchAdminQueueCounts, 30000);
      return () => {
        clearInterval(interval);
        window.removeEventListener('meetrip:badges-refresh', fetchAdminQueueCounts);
        window.removeEventListener('storage', fetchAdminQueueCounts);
      };
    }
  }, [user]);

  useEffect(() => {
    if (pathname.startsWith('/konfigurasi/')) {
      setConfigExpanded(true);
    }
    if (pathname.startsWith('/bto')) {
      setManajemenExpanded(true);
    }
    if (pathname.startsWith('/master')) {
      setMasterExpanded(true);
    }
    // Close sidebar on route change in mobile mode
    setIsMobileOpen(false);
  }, [pathname]);

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

  const itemVariants: Variants = {
    hidden: { opacity: 0, x: -20 },
    show: { opacity: 1, x: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } }
  };

  const renderNavLinks = (isDrawer: boolean = false) => {
    const showText = isDrawer || !isCollapsed;

    return (
      <motion.nav 
        variants={isDrawer ? {
          hidden: { opacity: 0 },
          show: { opacity: 1, transition: { staggerChildren: 0.05, delayChildren: 0.1 } }
        } : undefined}
        initial={isDrawer ? "hidden" : undefined}
        animate={isDrawer ? "show" : undefined}
        className={`space-y-0.5 ${isDrawer ? '' : 'hidden md:block md:min-h-0 md:flex-1 md:overflow-y-auto overflow-x-hidden md:pr-1'}`}
      >
        {navItems.map((item) => {
          const userRoles = (user?.role || 'user').split(',');
          const hasAccess = item.roles.some(r => userRoles.includes(r));
          if (!hasAccess) return null;
          const Icon = item.icon;

          if (item.subItems) {
            const isParentActive = pathname.startsWith(item.path);
            const isExpanded = item.path === '/konfigurasi' 
              ? configExpanded 
              : item.path === '/master' 
              ? masterExpanded 
              : manajemenExpanded;
            
            const toggleExpanded = () => {
              if (item.path === '/konfigurasi') setConfigExpanded(!configExpanded);
              else if (item.path === '/master') setMasterExpanded(!masterExpanded);
              else setManajemenExpanded(!manajemenExpanded);
            };

            const allowedSubItems = item.subItems.filter(
              sub => !sub.roles || sub.roles.some(r => userRoles.includes(r))
            );
            const isManajemenDinas = item.path === '/bto';
            const manajemenQueueCount = isManajemenDinas
              ? myApprovalsCount + Object.values(adminQueueCounts).reduce((sum, count) => sum + count, 0)
              : 0;

            if (allowedSubItems.length === 0) return null;

            return (
              <motion.div key={item.name} className="space-y-0.5" variants={isDrawer ? itemVariants : undefined}>
                <button
                  type="button"
                  onClick={toggleExpanded}
                  title={!showText ? item.name : undefined}
                  aria-expanded={isExpanded}
                  aria-label={`${isExpanded ? 'Tutup' : 'Buka'} menu ${item.name}`}
                  className={`relative flex min-h-11 w-full items-center justify-between rounded-xl border px-3 py-2.5 text-sm font-semibold transition-[color,background-color,border-color,box-shadow] duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500/25 ${isParentActive
                      ? 'border-teal-300/70 bg-teal-50 text-teal-800 shadow-[inset_3px_0_0_#0d9488,var(--neu-inset-accent)] dark:border-teal-800/70 dark:bg-teal-950/30 dark:text-teal-300 dark:shadow-[inset_3px_0_0_#2dd4bf,var(--neu-inset-accent)]'
                      : isExpanded
                        ? 'border-slate-200/70 bg-surface-sunken text-slate-800 shadow-neu-in-sm dark:border-white/[0.05] dark:text-slate-100'
                        : 'border-transparent text-slate-600 hover:border-slate-200/70 hover:bg-surface-card hover:text-slate-900 hover:shadow-neu-sm dark:text-slate-300 dark:hover:border-white/[0.05] dark:hover:text-white'
                    } ${!showText ? 'justify-center' : ''}`}
                >
                  <div className={`flex items-center gap-3 ${!showText ? 'justify-center w-full' : ''}`}>
                    <Icon className="h-4 w-4 shrink-0" />
                    {showText && <span className="truncate">{item.name}</span>}
                  </div>
                  {showText ? (
                    <div className="flex items-center gap-2">
                      {isManajemenDinas && manajemenQueueCount > 0 && (
                        <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1.5 text-[10px] font-black leading-none text-white">
                          {manajemenQueueCount}
                        </span>
                      )}
                      <span className="flex h-5 w-5 items-center justify-end border-l border-current/20 pl-2">
                        <ChevronDown className={`h-3.5 w-3.5 transition-transform duration-200 ${isExpanded ? '' : '-rotate-90'}`} aria-hidden="true" />
                      </span>
                    </div>
                  ) : (
                    isManajemenDinas && manajemenQueueCount > 0 && (
                      <span className="absolute top-1 right-1 flex h-2 w-2 items-center justify-center rounded-full bg-red-500 animate-pulse" />
                    )
                  )}
                </button>

                {isExpanded && (
                  <div className={`${showText ? 'ml-5 pl-3 border-l' : 'mt-0.5 flex flex-col items-center gap-1 border-y py-2'} border-slate-200 dark:border-slate-800 space-y-1`}>
                    {allowedSubItems.map((sub) => {
                      const isSubActive = pathname === sub.path;
                      const isApprovalQueue = sub.path === '/bto/butuh-persetujuan';
                      const subQueueCount = isApprovalQueue
                        ? myApprovalsCount
                        : (adminQueueCounts[sub.path] || 0);
                      return (
                        <Link
                          key={sub.path}
                          href={sub.path}
                          title={!showText ? sub.name : undefined}
                          className={`relative flex items-center justify-between rounded-lg px-3 py-1.5 text-xs font-semibold transition-all duration-150 ${
                            isApprovalQueue
                              ? isSubActive
                                ? 'bg-amber-500 text-white shadow-neu-sm'
                                : 'text-amber-700 bg-amber-50 shadow-neu-sm dark:text-amber-400 dark:bg-amber-950/20 hover:bg-amber-100 dark:hover:bg-amber-950/40 border border-amber-200/50 dark:border-amber-800/30'
                              : isSubActive
                                ? 'bg-teal-55 text-teal-700 shadow-neu-in-accent dark:bg-teal-950/30 dark:text-teal-400 font-bold'
                                : 'text-slate-500 hover:text-teal-600 hover:bg-surface-card hover:shadow-neu-sm dark:text-slate-400 dark:hover:text-teal-300'
                          } ${!showText ? 'justify-center w-8 h-8 px-0' : ''}`}
                        >
                          {showText ? (
                            <span>{sub.name}</span>
                          ) : (
                            <span className="mx-auto font-black text-[10px] uppercase">{sub.name.charAt(0)}</span>
                          )}
                          {subQueueCount > 0 && (
                            <span className={`flex items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white animate-pulse ${!showText ? 'absolute -top-1 -right-1 h-3 w-3 text-[8px]' : 'h-4 w-4'}`}>
                              {!showText ? '' : subQueueCount}
                            </span>
                          )}
                        </Link>
                      );
                    })}
                  </div>
                )}
              </motion.div>
            );
          }

          const active = pathname === item.path || (item.path !== '/dashboard' && pathname.startsWith(`${item.path}/`));
          return (
            <motion.div key={item.path} variants={isDrawer ? itemVariants : undefined}>
              <Link
                href={item.path}
                className={`flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-semibold transition-all duration-150 ${active
                    ? 'bg-teal-600 text-white shadow-neu-accent dark:bg-teal-500 dark:text-slate-950'
                    : 'text-slate-600 hover:bg-surface-card hover:text-teal-600 hover:shadow-neu-sm dark:text-slate-300 dark:hover:text-teal-300'
                  } ${!showText ? 'justify-center' : ''}`}
                title={!showText ? item.name : undefined}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {showText && <span className="truncate">{item.name}</span>}
              </Link>
            </motion.div>
          );
        })}
      </motion.nav>
    );
  };

  return (
    <>
      {/* Top Bar for Mobile Screens */}
      <aside className="fixed inset-x-0 top-0 z-40 flex h-16 items-center justify-between border-b border-slate-200/70 bg-surface-raised px-4 shadow-neu-top backdrop-blur-xl dark:border-white/[0.06] md:hidden">
        <div className="flex items-center gap-3">
          <img src="/iconaja.png" alt="MeeTrip Logo" className="h-10 w-10 object-contain drop-shadow-sm" />
          <div>
            <h1 className="text-base font-black bg-gradient-to-r from-teal-600 to-emerald-650 bg-clip-text text-transparent dark:from-teal-400 dark:to-emerald-400">
              MeeTrip
            </h1>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setIsMobileOpen(true)}
          className="neu-pressable ml-auto flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200/70 bg-surface-card text-slate-600 hover:text-teal-700 dark:border-white/[0.06] dark:text-slate-400 dark:hover:text-teal-300"
        >
          <HamburgerIcon isOpen={false} />
        </button>
      </aside>

      {/* Floating Toggle Button for Desktop when Sidebar is Collapsed */}
      {isCollapsed && (
        <button
          type="button"
          onClick={onToggleCollapse}
          aria-label="Buka menu navigasi"
          title="Buka menu navigasi"
          className="neu-pressable fixed left-4 top-4 z-40 hidden md:flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200/80 bg-surface-raised text-slate-700 shadow-neu hover:text-teal-700 hover:scale-105 active:scale-95 focus-visible:outline-none transition-all duration-200 dark:border-white/[0.08] dark:bg-surface-card dark:text-slate-300 dark:hover:text-teal-400"
        >
          <PanelLeftOpen className="h-5 w-5 text-teal-600 dark:text-teal-400" aria-hidden="true" />
        </button>
      )}

      {/* Main Sidebar for Desktop Screens */}
      <aside
        className={`hidden fixed inset-y-0 left-0 z-30 border-r border-slate-200/70 bg-surface-raised shadow-neu-side dark:border-white/[0.06] md:flex md:flex-col transition-all duration-300 ${
          isCollapsed
            ? 'md:w-0 -translate-x-full opacity-0 pointer-events-none border-r-0 overflow-hidden'
            : 'md:w-64 translate-x-0 opacity-100'
        }`}
      >
        <div className="flex h-full min-h-0 flex-col gap-4 p-4 w-64">
          {/* Logo Header with Collapse Button */}
          <div className="flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3 min-w-0">
              <img src="/iconaja.png" alt="MeeTrip Logo" className="h-10 w-10 shrink-0 object-contain drop-shadow-sm" />
              <div className="min-w-0">
                <h1 className="truncate text-lg font-black bg-gradient-to-r from-teal-600 to-emerald-650 bg-clip-text text-transparent dark:from-teal-400 dark:to-emerald-400">
                  MeeTrip
                </h1>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  Meeting & Trip
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onToggleCollapse}
              aria-label="Ciutkan sidebar"
              title="Ciutkan sidebar"
              className="neu-pressable flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-slate-200/70 bg-surface-card text-slate-500 hover:text-teal-700 focus-visible:outline-none dark:border-white/[0.06] dark:text-slate-400 dark:hover:text-teal-300"
            >
              <PanelLeftClose className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>

          {/* User Profile Card */}
          <div className="rounded-xl border border-slate-200/70 bg-surface-sunken p-3 shadow-neu-in-sm dark:border-white/[0.05] shrink-0">
            <div className="flex items-center gap-3">
              <div className="relative flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-teal-500 to-emerald-600 text-white shadow-neu-sm font-bold text-sm">
                <span className="absolute z-0">{getInitial(user?.nama || user?.email)}</span>
                {(user?.fotoPath || user?.employeeId) && (
                  <img
                    src={user?.fotoPath || `${process.env.NEXT_PUBLIC_PORTAL_URL || 'http://localhost:3002'}/uploads/profiles/${user?.employeeId}.jpg`}
                    alt="Profile"
                    className="absolute inset-0 z-10 h-full w-full object-cover bg-surface-card"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                )}
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">{user?.nama || user?.email || 'User MeeTrip'}</p>
                {user?.jabatan ? (
                  <p className="truncate text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">{user.jabatan}</p>
                ) : (
                  <div className="mt-1 inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold uppercase text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
                    <ShieldCheck className="h-3 w-3" />
                    {user?.role || 'user'}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Desktop Nav Links */}
          {renderNavLinks(false)}

          {/* Bottom Action Section */}
          <div className="sticky bottom-0 mt-auto shrink-0 flex flex-col gap-2 border-t border-slate-200/70 bg-surface-raised pt-3 dark:border-white/[0.06]">
            <div className="flex items-center justify-between rounded-xl border border-slate-200/70 bg-surface-sunken p-2 shadow-neu-in-sm dark:border-white/[0.05]">
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Theme</span>
              <ThemeToggle />
            </div>
            <button
              onClick={handleBackToPortal}
              disabled={isReturningToPortal}
              title="Kembali Ke Portal"
              className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition-all duration-150 bg-teal-600 hover:bg-teal-700 text-white shadow-neu-accent active:translate-y-px active:shadow-neu-in-sm disabled:cursor-wait disabled:opacity-60 dark:bg-teal-500 dark:hover:bg-teal-600"
            >
              <ArrowLeft className="h-4 w-4 shrink-0" />
              <span>{isReturningToPortal ? 'Mengakhiri sesi...' : 'Kembali Ke Portal'}</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile Drawer (Slide-over Navigation) */}
      <AnimatePresence>
        {isMobileOpen && (
          <div className="relative z-[60] md:hidden">
            {/* Backdrop overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm"
              onClick={() => setIsMobileOpen(false)}
            />

            {/* Drawer container */}
            <motion.div 
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', bounce: 0, duration: 0.4 }}
              className="fixed inset-y-0 left-0 flex w-72 max-w-full bg-surface-raised shadow-neu-pop dark:border-r dark:border-white/[0.06]"
            >
              <div className="flex h-full w-full flex-col gap-4 p-5 overflow-y-auto overflow-x-hidden">
                {/* Drawer Header */}
                <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
                  <div className="flex items-center gap-2.5">
                    <img src="/iconaja.png" alt="MeeTrip Logo" className="h-8 w-8 object-contain drop-shadow-sm" />
                    <span className="text-sm font-black bg-gradient-to-r from-teal-600 to-emerald-650 bg-clip-text text-transparent dark:from-teal-400 dark:to-emerald-400">
                      MeeTrip Navigation
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsMobileOpen(false)}
                    className="neu-pressable flex h-8 w-8 items-center justify-center rounded-xl border border-slate-200/70 bg-surface-card text-slate-500 hover:text-teal-700 dark:border-white/[0.06] dark:text-slate-400 dark:hover:text-teal-300"
                  >
                    <HamburgerIcon isOpen={true} />
                  </button>
                </div>

                {/* User Profile Card inside Drawer */}
                <motion.div 
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ delay: 0.15, duration: 0.3 }}
                  className="rounded-xl border border-slate-200/70 bg-surface-sunken p-3 shadow-neu-in-sm dark:border-white/[0.05]"
                >
                  <div className="flex items-center gap-3">
                    <div className="relative flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-teal-500 to-emerald-600 text-white shadow-neu-sm font-bold text-sm">
                      <span className="absolute z-0">{getInitial(user?.nama || user?.email)}</span>
                      {(user?.fotoPath || user?.employeeId) && (
                        <img
                          src={user?.fotoPath || `${process.env.NEXT_PUBLIC_PORTAL_URL || 'http://localhost:3002'}/uploads/profiles/${user?.employeeId}.jpg`}
                          alt="Profile"
                          className="absolute inset-0 z-10 h-full w-full object-cover bg-surface-card"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                          }}
                        />
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold">{user?.nama || user?.email || 'User MeeTrip'}</p>
                      {user?.jabatan ? (
                        <p className="truncate text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">{user.jabatan}</p>
                      ) : (
                        <div className="mt-1 inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold uppercase text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
                          <ShieldCheck className="h-3 w-3" />
                          {user?.role || 'user'}
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>

              {/* Drawer Navigation Links */}
              <div className="flex-1 py-2">
                {renderNavLinks(true)}
              </div>

              {/* Drawer Bottom Actions */}
              <div className="mt-auto border-t border-slate-200/70 pt-4 dark:border-white/[0.06] space-y-3">
                <div className="flex items-center justify-between rounded-xl border border-slate-200/70 bg-surface-sunken p-2 shadow-neu-in-sm dark:border-white/[0.05]">
                  <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Theme</span>
                  <ThemeToggle />
                </div>
                <button
                  onClick={handleBackToPortal}
                  disabled={isReturningToPortal}
                  className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-xs font-bold transition-all duration-150 bg-teal-600 hover:bg-teal-700 text-white shadow-neu-accent active:translate-y-px active:shadow-neu-in-sm disabled:cursor-wait disabled:opacity-60 dark:bg-teal-500 dark:hover:bg-teal-600"
                >
                  <ArrowLeft className="h-4 w-4" />
                  <span>{isReturningToPortal ? 'Mengakhiri sesi...' : 'Kembali Ke Portal'}</span>
                </button>
              </div>
            </div>
          </motion.div>
        </div>
        )}
      </AnimatePresence>
    </>
  );
}
