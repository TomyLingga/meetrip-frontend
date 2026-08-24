'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  AlertTriangle, ArrowUpRight, BriefcaseBusiness, Building2, CalendarClock, CalendarRange, CheckCircle2, ClipboardCheck,
  Clock3, DoorOpen, Route, ShieldCheck, UserRound, Users, Video, WalletCards,
} from 'lucide-react';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import { InputUang } from '@/app/bto/components/InputUang';
import { apiFetch, getCachedUser } from '@/utils/api';
import { useAlert } from '@/context/FeedbackContext';
import {
  AnalyticsLoading, BudgetOverview, CategoryBreakdown, DailyTripChart, DecisionSummary,
  STATUS_LABELS, StatusBreakdown, UnitCostList, WeeklyFinanceChart,
} from '@/components/dashboard/AnalyticsCharts';
import {
  MeetingAnalyticsLoading, MeetingDailyChart, MeetingHostSummary, MeetingRoomUsage,
  MeetingStatusBreakdown, MeetingSummaryStrip, NextMeetingPanel,
} from '@/components/dashboard/MeetingCharts';
import { MonthPicker, type MonthValue } from '@/components/dashboard/MonthPicker';
import type { DashboardAnalytics, DashboardContext, DashboardOverview, DashboardTrip } from '@/components/dashboard/types';
import { MeetripDashboardHelp } from '@/components/help/MeetripHelpGuide';

type CachedUser = { nama?: string | null };
type MetricItem = { label: string; value: number; detail: string; icon: React.ElementType; tone: string; suffix?: string };

const MONTHS = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
const CONTEXT_META: Record<DashboardContext, { label: string; icon: React.ElementType }> = {
  company: { label: 'Perusahaan', icon: Building2 },
  employee: { label: 'Dinas Saya', icon: UserRound },
  assigner: { label: 'Pemberi Tugas', icon: BriefcaseBusiness },
  kabag: { label: 'KABAG', icon: ShieldCheck },
};

function MetricCard({ label, value, detail, icon: Icon, tone, suffix, centered }: MetricItem & { centered?: boolean }) {
  if (centered) {
    return (
      <article className="min-w-0 rounded-2xl border border-slate-200/90 dark:border-slate-800/80 bg-white dark:bg-[#111827] p-5 text-center flex flex-col items-center justify-center transition-all duration-200 hover:border-slate-300 dark:hover:border-slate-700 shadow-sm">
        <Icon className={`h-5 w-5 mb-2 ${tone}`} />
        <p className="text-3xl font-extrabold text-slate-900 dark:text-white tabular-nums tracking-tight">
          {value.toLocaleString('id-ID')}
          {suffix && <span className="ml-1 text-xs font-semibold text-slate-500">{suffix}</span>}
        </p>
        <p className="mt-1.5 text-xs font-bold text-slate-700 dark:text-slate-200">{label}</p>
        <p className="mt-0.5 text-[11px] font-medium text-slate-400 dark:text-slate-500 leading-snug">{detail}</p>
      </article>
    );
  }

  return <article className="min-w-0 rounded-lg border border-slate-200 bg-surface-card p-4 dark:border-slate-800 shadow-neu">
    <div className="flex items-center justify-between gap-3"><p className="truncate text-xs font-semibold text-slate-600 dark:text-slate-300">{label}</p><Icon className={`h-4 w-4 shrink-0 ${tone}`} /></div>
    <p className="mt-3 text-2xl font-bold tabular-nums text-slate-950 dark:text-white">{value.toLocaleString('id-ID')}{suffix && <span className="ml-1 text-xs font-semibold text-slate-500">{suffix}</span>}</p>
    <p className="mt-1 text-[11px] leading-4 text-slate-500 dark:text-slate-400">{detail}</p>
  </article>;
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
}

function waitingLabel(hours?: number) {
  if (hours == null) return null;
  if (hours < 24) return `${Math.max(hours, 0)} jam`;
  return `${Math.floor(hours / 24)} hari`;
}

function TripQueue({ title, description, trips, href, linkLabel }: { title: string; description: string; trips: DashboardTrip[]; href: string; linkLabel: string }) {
  return <section className="rounded-lg border border-slate-200 bg-surface-card p-5 dark:border-slate-800 shadow-neu">
    <div className="flex items-start justify-between gap-4"><div><h2 className="text-sm font-bold text-slate-950 dark:text-white">{title}</h2><p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">{description}</p></div><Link href={href} className="inline-flex shrink-0 items-center gap-1 text-xs font-semibold text-teal-700 hover:text-teal-800 dark:text-teal-300 dark:hover:text-teal-200">{linkLabel}<ArrowUpRight className="h-3.5 w-3.5" /></Link></div>
    <div className="mt-5 divide-y divide-slate-100 dark:divide-slate-800">{trips.length === 0
      ? <p className="py-9 text-center text-sm text-slate-500 dark:text-slate-400">Tidak ada item yang memerlukan perhatian.</p>
      : trips.map((trip) => <div key={trip.id} className="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0"><div className="min-w-0"><p className="truncate text-sm font-semibold text-slate-800 dark:text-slate-200">{trip.employeeNama ? `${trip.employeeNama} - ${trip.tujuanNama}` : trip.tujuanNama}</p><p className="mt-1 truncate text-[11px] text-slate-500 dark:text-slate-400">{trip.nomorBto || 'Nomor BTO belum terbit'} · {formatDate(trip.estBerangkat)}{trip.unitNama ? ` · ${trip.unitNama}` : ''}</p></div><div className="shrink-0 text-right"><p className="text-[10px] font-semibold text-slate-600 dark:text-slate-300">{STATUS_LABELS[trip.status] || trip.status}</p>{waitingLabel(trip.waitingHours) && <p className={`mt-1 text-[10px] ${Number(trip.waitingHours) >= 24 ? 'font-semibold text-rose-600 dark:text-rose-400' : 'text-slate-400'}`}>{waitingLabel(trip.waitingHours)}</p>}</div></div>)}</div>
  </section>;
}

function StageSummary({ overview }: { overview: DashboardOverview }) {
  const rows = overview.actionStages;
  return <section className="rounded-lg border border-slate-200 bg-surface-card p-5 dark:border-slate-800 shadow-neu">
    <h2 className="text-sm font-bold text-slate-950 dark:text-white">Komposisi antrean</h2>
    <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">Posisi pekerjaan yang menunggu tindakan sekarang.</p>
    <div className="mt-5 space-y-3">{rows.length === 0 ? <p className="py-8 text-center text-sm text-slate-500 dark:text-slate-400">Antrean bersih.</p> : rows.map((row) => <div key={row.status} className="flex items-center justify-between gap-4 border-b border-slate-100 pb-3 last:border-0 last:pb-0 dark:border-slate-800"><span className="text-xs font-medium text-slate-600 dark:text-slate-300">{STATUS_LABELS[row.status] || row.status}</span><span className="text-lg font-bold tabular-nums text-slate-950 dark:text-white">{row.total}</span></div>)}</div>
  </section>;
}

function metricsFor(overview: DashboardOverview): MetricItem[] {
  const metrics = overview.metrics;
  if (overview.context === 'employee') return [
    { label: 'Perlu dilengkapi', value: metrics.needsRevision, detail: 'Draft atau revisi yang menunggu Anda', icon: AlertTriangle, tone: 'text-amber-600 dark:text-amber-400' },
    { label: 'Dinas aktif', value: metrics.activeTrips, detail: 'Perjalanan yang sedang berlangsung', icon: Route, tone: 'text-blue-600 dark:text-blue-400' },
    { label: 'Berangkat 7 hari', value: metrics.upcomingSevenDays, detail: 'Agenda keberangkatan terdekat', icon: CalendarRange, tone: 'text-cyan-700 dark:text-cyan-300' },
    { label: 'Selesai bulan ini', value: metrics.completedThisMonth, detail: 'Perjalanan pribadi yang telah tuntas', icon: CheckCircle2, tone: 'text-emerald-700 dark:text-emerald-300' },
  ];
  if (overview.context === 'company' && overview.roleContext.isSdm && !overview.roleContext.isAdmin) return [
    { label: 'Persetujuan SDM', value: metrics.pendingSdmReview, detail: 'Pengajuan menunggu verifikasi SDM', icon: ShieldCheck, tone: 'text-indigo-600 dark:text-indigo-400' },
    { label: 'Antrean tertua', value: Math.round(metrics.oldestPendingHours), suffix: 'jam', detail: 'Usia pekerjaan paling lama', icon: Clock3, tone: 'text-rose-600 dark:text-rose-400' },
    { label: 'Dinas aktif', value: metrics.activeTrips, detail: 'Karyawan sedang menjalankan dinas', icon: Users, tone: 'text-blue-600 dark:text-blue-400' },
    { label: 'Berangkat 7 hari', value: metrics.upcomingSevenDays, detail: 'Karyawan yang segera berangkat', icon: CalendarRange, tone: 'text-teal-700 dark:text-teal-300' },
  ];
  return [
    { label: 'Butuh tindakan', value: metrics.pendingAction, detail: overview.context === 'company' ? 'Seluruh pekerjaan sesuai kewenangan Anda' : 'Persetujuan yang ditugaskan kepada Anda', icon: ClipboardCheck, tone: 'text-cyan-700 dark:text-cyan-300' },
    { label: 'Lewat 24 jam', value: metrics.overdueActions, detail: 'Antrean yang perlu segera diprioritaskan', icon: Clock3, tone: 'text-rose-600 dark:text-rose-400' },
    { label: 'Dinas aktif', value: metrics.activeTrips, detail: 'Perjalanan berlangsung dalam cakupan', icon: Route, tone: 'text-blue-600 dark:text-blue-400' },
    overview.context === 'company'
      ? { label: 'Menunggu pembayaran', value: metrics.pendingPayment, detail: 'BTE disetujui dan belum diselesaikan', icon: WalletCards, tone: 'text-amber-600 dark:text-amber-400' }
      : { label: 'Berangkat 7 hari', value: metrics.upcomingSevenDays, detail: 'Agenda tim yang segera dimulai', icon: CalendarRange, tone: 'text-teal-700 dark:text-teal-300' },
  ];
}

export default function Dashboard() {
  const now = new Date();
  const { showAlert } = useAlert();
  const [period, setPeriod] = useState<MonthValue>({ year: now.getFullYear(), month: now.getMonth() + 1 });
  const [context, setContext] = useState<DashboardContext | null>(null);
  const [overview, setOverview] = useState<DashboardOverview | null>(null);
  const [analytics, setAnalytics] = useState<DashboardAnalytics | null>(null);
  const [liveLoading, setLiveLoading] = useState(true);
  const [analyticsLoading, setAnalyticsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [analyticsError, setAnalyticsError] = useState<string | null>(null);
  const [analyticsVersion, setAnalyticsVersion] = useState(0);
  const [budgetOpen, setBudgetOpen] = useState(false);
  const [budgetAmount, setBudgetAmount] = useState<number | undefined>();
  const [budgetNotes, setBudgetNotes] = useState('');
  const [savingBudget, setSavingBudget] = useState(false);
  const [user, setUser] = useState<CachedUser | null>(null);

  useEffect(() => { setUser(getCachedUser<CachedUser>()); }, []);

  const loadOverview = useCallback(async (manual = false) => {
    if (manual) setRefreshing(true); else setLiveLoading(true);
    setLoadError(null);
    try {
      const query = context ? `?context=${context}` : '';
      const data = await apiFetch(`/api/dashboard/overview${query}`) as DashboardOverview;
      setOverview(data);
      if (!context) setContext(data.context);
      if (manual) setAnalyticsVersion((value) => value + 1);
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : 'Dashboard tidak dapat dimuat');
    } finally {
      setLiveLoading(false);
      setRefreshing(false);
    }
  }, [context]);

  useEffect(() => {
    let active = true;
    const load = async () => { if (active) await loadOverview(false); };
    load();
    const interval = window.setInterval(() => { if (active) loadOverview(false); }, 30_000);
    return () => { active = false; window.clearInterval(interval); };
  }, [loadOverview]);

  useEffect(() => {
    if (!context) return;
    let active = true;
    setAnalyticsLoading(true);
    setAnalyticsError(null);
    apiFetch(`/api/dashboard/analytics-v2?context=${context}&year=${period.year}&month=${period.month}`)
      .then((data) => { if (active) setAnalytics(data as DashboardAnalytics); })
      .catch((error) => { if (active) setAnalyticsError(error instanceof Error ? error.message : 'Statistik tidak dapat dimuat'); })
      .finally(() => { if (active) setAnalyticsLoading(false); });
    return () => { active = false; };
  }, [context, period, analyticsVersion]);

  const metrics = useMemo(() => overview ? metricsFor(overview) : [], [overview]);
  const isAdmin = overview?.roleContext.isAdmin ?? false;
  const isSdm = overview?.roleContext.isSdm ?? false;
  const isKabag = overview?.roleContext.isKabag ?? false;
  const isPemberiTugas = overview?.roleContext.isPemberiTugas ?? false;

  const openBudget = () => {
    setBudgetAmount(analytics?.finance.allocation ?? 0);
    setBudgetNotes(analytics?.finance.budgetNotes ?? '');
    setBudgetOpen(true);
  };

  const saveBudget = async () => {
    if (budgetAmount == null || budgetAmount < 0) {
      showAlert('Nilai budget harus berupa angka nol atau lebih.', 'error');
      return;
    }
    setSavingBudget(true);
    try {
      await apiFetch('/api/config/travel-budget', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ year: period.year, month: period.month, amountIdr: budgetAmount, notes: budgetNotes.trim() || null }),
      });
      setBudgetOpen(false);
      setAnalyticsVersion((value) => value + 1);
      showAlert('Budget perjalanan bulanan berhasil disimpan.', 'success');
    } catch (error) {
      showAlert(error instanceof Error ? error.message : 'Gagal menyimpan budget.', 'error');
    } finally {
      setSavingBudget(false);
    }
  };

  const roleLabel = isAdmin ? 'ADMIN MEETRIP' : isSdm ? 'SDM' : isKabag ? 'PERSATUJUAN KABAG' : isPemberiTugas ? 'PEMBERI TUGAS' : 'DINAS KARYAWAN';
  const contextTitle = overview?.contextLabel ?? 'Dashboard perjalanan dinas';
  const queueIsPersonal = context === 'employee';

  return (
    <div className="space-y-6 pb-10">
      {/* ── Dashboard Hero Banner Card (Out-of-flow Illustration & Infinite Animated Accent Line) */}
      <div className="relative group overflow-hidden rounded-[1.25rem] sm:rounded-[1.5rem] border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-[#111827] shadow-sm px-6 sm:px-10 py-9 sm:py-12 flex items-center justify-between">
        {/* Text Container */}
        <div className="flex-1 min-w-0 pr-24 sm:pr-48 md:pr-64 space-y-2 sm:space-y-2.5 z-10 text-left">
          <p className="text-[10px] sm:text-[11px] font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
            MEETRIP - {roleLabel}
          </p>
          <h1 className="text-lg sm:text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-tight">
            Dashboard Sistem Perjalanan Dinas dan Meeting
          </h1>
          <p className="text-[11px] sm:text-xs md:text-sm font-medium text-slate-500 dark:text-slate-400 leading-snug sm:leading-relaxed line-clamp-2 sm:line-clamp-none">
            Pantau perjalanan dinas dan agenda ruang rapat yang berlangsung sekarang, lalu telaah statistik keduanya pada periode yang dipilih.
          </p>
        </div>

        {/* Absolute Out-Of-Flow Hero Illustration with Hover Float/Tilt (Scaled appropriately) */}
        <div className="absolute -right-2 sm:right-2 md:right-4 top-1/2 -translate-y-1/2 z-0 pointer-events-none w-28 h-24 sm:w-44 sm:h-36 md:w-56 md:h-40 flex items-center justify-end">
          <img
            src="/illustrations/hero-car.png"
            alt="MeeTrip Roadtrip Hero"
            className="w-full h-full object-contain filter drop-shadow-md transition-all duration-500 ease-out group-hover:scale-105 group-hover:-translate-y-2 group-hover:-rotate-1"
          />
        </div>

        {/* Infinite Animated Accent Line: Emerald in Light Mode, Glowing White Shadow in Dark Mode */}
        <div className="absolute bottom-0 inset-x-0 h-1 z-10 overflow-hidden bg-emerald-500 dark:bg-white dark:shadow-[0_0_15px_rgba(255,255,255,0.9),0_0_5px_rgba(255,255,255,1)]">
          <div className="w-full h-full bg-gradient-to-r from-emerald-400 via-teal-200 to-emerald-400 dark:from-white dark:via-slate-200 dark:to-white animate-pulse" />
        </div>
      </div>

      {/* Scope Tabs */}
      {overview && overview.availableContexts.length > 1 && (
        <div className="inline-flex max-w-full overflow-x-auto rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-100/80 dark:bg-slate-900/60 p-1" aria-label="Pilih cakupan dashboard">
          {overview.availableContexts.map((item) => {
            const meta = CONTEXT_META[item];
            const Icon = meta.icon;
            const selected = context === item;
            return (
              <button
                key={item}
                type="button"
                onClick={() => setContext(item)}
                className={`inline-flex h-8 shrink-0 items-center gap-2 rounded-lg px-3.5 text-xs font-bold transition-all ${
                  selected
                    ? 'bg-white text-emerald-600 shadow-sm dark:bg-slate-800 dark:text-emerald-400'
                    : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
                }`}
                aria-pressed={selected}
              >
                <Icon className="h-3.5 w-3.5" />
                {meta.label}
              </button>
            );
          })}
        </div>
      )}

    {loadError && <div className="flex items-start justify-between gap-4 rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800 dark:border-rose-900/70 dark:bg-rose-950/30 dark:text-rose-200"><span>{loadError}</span><button type="button" onClick={() => loadOverview(true)} className="shrink-0 text-xs font-bold underline underline-offset-2">Coba lagi</button></div>}

    {liveLoading && !overview ? <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">{Array.from({ length: 4 }).map((_, index) => <div key={index} className="h-28 animate-pulse rounded-lg border border-slate-200 bg-surface-sunken dark:border-slate-800" />)}</div> : overview && <section aria-label="Ringkasan operasional" className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">{metrics.map((metric) => <MetricCard key={metric.label} {...metric} />)}</section>}

    {overview && <section className="grid grid-cols-1 gap-4 lg:grid-cols-5"><div className="lg:col-span-3"><TripQueue title={queueIsPersonal ? 'Langkah berikutnya' : 'Antrean tindakan'} description={queueIsPersonal ? 'Tahap perjalanan yang membutuhkan kelengkapan atau tindakan Anda.' : 'Data real-time, diurutkan dari keberangkatan mendesak dan waktu tunggu terlama.'} trips={overview.actionQueue} href={queueIsPersonal ? '/bto' : '/bto/butuh-persetujuan'} linkLabel={queueIsPersonal ? 'Buka pengajuan' : 'Buka antrean'} /></div><div className="lg:col-span-2"><StageSummary overview={overview} /></div></section>}

    {/* ── Agenda ruang rapat (real-time, tidak mengikuti filter bulan) ── */}
    {overview && <section aria-labelledby="meeting-live" className="border-t border-slate-200 pt-6 dark:border-slate-800">
      <div className="flex flex-col gap-1">
        <p className="text-xs font-semibold text-sky-700 dark:text-sky-300">PEMANTAUAN LANGSUNG</p>
        <h2 id="meeting-live" className="text-lg font-bold text-slate-950 dark:text-white">Jadwal & Pemakaian Ruang Rapat</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400">Status ketersediaan ruangan dan agenda rapat aktif (diperbarui otomatis tiap 30 detik).</p>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-5">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:col-span-3">
          <MetricCard label="Meeting Hari Ini" value={overview.meetings.today} detail="Termasuk yang telah selesai hari ini" icon={CalendarClock} tone="text-sky-600 dark:text-sky-400" centered />
          <MetricCard label="Sedang Berlangsung" value={overview.meetings.ongoing} detail="Ruang terpakai saat ini" icon={Video} tone="text-teal-600 dark:text-teal-400" centered />
          <MetricCard label="7 Hari Ke Depan" value={overview.meetings.upcomingSevenDays} detail="Agenda mendatang" icon={CalendarRange} tone="text-cyan-600 dark:text-cyan-400" centered />
          <MetricCard label="Agenda Saya" value={overview.meetings.mineUpcoming} detail="Meeting yang Anda buat" icon={DoorOpen} tone="text-indigo-600 dark:text-indigo-400" centered />
        </div>
        <div className="lg:col-span-2">
          <NextMeetingPanel next={overview.meetings.next} agenda={overview.meetings.agenda} />
        </div>
      </div>
    </section>}

    <section aria-labelledby="monthly-statistics" className="border-t border-slate-200 pt-6 dark:border-slate-800">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-xs font-semibold text-teal-700 dark:text-teal-300">Statistik bulanan · Perjalanan dinas</p><h2 id="monthly-statistics" className="mt-1 text-lg font-bold text-slate-950 dark:text-white">Perjalanan dan penggunaan biaya</h2><p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Berdasarkan bulan keberangkatan. Periode yang dipilih di sini juga dipakai untuk statistik meeting di bawah.</p></div><MonthPicker value={period} onChange={setPeriod} /></div>

      <div className="mt-5 grid grid-cols-1 overflow-hidden rounded-lg border border-slate-200 bg-surface-card dark:border-slate-800 sm:grid-cols-3 shadow-neu"><div className="p-4"><p className="text-[11px] font-medium text-slate-500 dark:text-slate-400">Perjalanan</p><p className="mt-1 text-xl font-bold tabular-nums text-slate-950 dark:text-white">{analytics?.totalTrips ?? 0}</p></div><div className="border-t border-slate-200 p-4 dark:border-slate-800 sm:border-l sm:border-t-0"><p className="text-[11px] font-medium text-slate-500 dark:text-slate-400">Cakupan statistik</p><p className="mt-1 text-sm font-bold text-slate-950 dark:text-white">{analytics?.contextLabel || contextTitle}</p></div><div className="border-t border-slate-200 p-4 dark:border-slate-800 sm:border-l sm:border-t-0"><p className="text-[11px] font-medium text-slate-500 dark:text-slate-400">Periode</p><p className="mt-1 text-sm font-bold text-slate-950 dark:text-white">{MONTHS[period.month - 1]} {period.year}</p></div></div>

      {analyticsError && <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800 dark:border-amber-900/70 dark:bg-amber-950/30 dark:text-amber-200">{analyticsError}</div>}
      <div className="mt-4">{analyticsLoading || !analytics ? <AnalyticsLoading /> : <div className="space-y-4"><BudgetOverview data={analytics} canEdit={isAdmin && context === 'company'} onEdit={openBudget} /><div className="grid grid-cols-1 gap-4 xl:grid-cols-2"><WeeklyFinanceChart data={analytics.weeklyFinance} /><DailyTripChart data={analytics.dailyVolume} /><StatusBreakdown data={analytics.statusDistribution} /><CategoryBreakdown data={analytics.categoryBreakdown} />{(context === 'company' || context === 'kabag') && <UnitCostList data={analytics.unitBreakdown} />}{analytics.decisionOutcomes.length > 0 && <DecisionSummary data={analytics.decisionOutcomes} />}</div></div>}</div>
    </section>

    {/* ── Statistik meeting: memakai month-year picker yang sama ── */}
    <section aria-labelledby="meeting-statistics" className="border-t border-slate-200 pt-6 dark:border-slate-800">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold text-sky-700 dark:text-sky-300">Statistik bulanan · Ruang rapat</p>
          <h2 id="meeting-statistics" className="mt-1 text-lg font-bold text-slate-950 dark:text-white">Meeting dan pemakaian ruang</h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Berdasarkan tanggal mulai meeting pada {MONTHS[period.month - 1]} {period.year}. Agenda ruang rapat dipakai bersama seluruh organisasi.
          </p>
        </div>
        <Link href="/meeting" className="inline-flex h-9 shrink-0 items-center gap-2 rounded-lg border border-slate-200 bg-surface-card px-3 text-xs font-bold text-slate-700 shadow-neu-sm transition-colors hover:text-sky-700 dark:border-slate-800 dark:text-slate-200 dark:hover:text-sky-300">
          <CalendarClock className="h-3.5 w-3.5" />
          Buka kalender meeting
        </Link>
      </div>

      {analyticsLoading || !analytics ? (
        <div className="mt-5 space-y-4">
          <div className="h-24 animate-pulse rounded-lg border border-slate-200 bg-surface-sunken dark:border-slate-800" />
          <MeetingAnalyticsLoading />
        </div>
      ) : (
        <div className="mt-5 space-y-4">
          <MeetingSummaryStrip data={analytics.meetings} periodLabel={`${MONTHS[period.month - 1]} ${period.year}`} />
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
            <MeetingDailyChart data={analytics.meetings.dailyVolume} />
            <MeetingRoomUsage data={analytics.meetings.roomBreakdown} />
            <MeetingStatusBreakdown data={analytics.meetings.statusDistribution} />
            <MeetingHostSummary data={analytics.meetings} />
          </div>
        </div>
      )}
    </section>

    {overview && <section className="grid grid-cols-1 gap-4 lg:grid-cols-5"><div className="lg:col-span-3"><TripQueue title="Agenda terdekat" description="Perjalanan aktif atau terjadwal dalam cakupan dashboard saat ini." trips={overview.upcomingTrips} href="/bto" linkLabel="Lihat semua" /></div><section className="rounded-lg border border-slate-200 bg-surface-card p-5 dark:border-slate-800 lg:col-span-2 shadow-neu"><h2 className="text-sm font-bold text-slate-950 dark:text-white">Penanda operasional</h2><p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">Angka berikut tetap real-time dan tidak mengikuti filter bulan.</p><dl className="mt-5 space-y-3"><div className="flex justify-between gap-4"><dt className="text-xs text-slate-500 dark:text-slate-400">Meeting hari ini</dt><dd className="text-sm font-bold text-slate-950 dark:text-white">{overview.meetings.today}</dd></div><div className="flex justify-between gap-4"><dt className="text-xs text-slate-500 dark:text-slate-400">Meeting bulan ini</dt><dd className="text-sm font-bold text-slate-950 dark:text-white">{overview.meetings.thisMonth}{overview.meetings.cancelledThisMonth > 0 && <span className="ml-1 text-[11px] font-semibold text-rose-600 dark:text-rose-400">({overview.meetings.cancelledThisMonth} batal)</span>}</dd></div><div className="flex justify-between gap-4"><dt className="text-xs text-slate-500 dark:text-slate-400">Berangkat 7 hari ke depan</dt><dd className="text-sm font-bold text-slate-950 dark:text-white">{overview.metrics.upcomingSevenDays}</dd></div><div className="flex justify-between gap-4"><dt className="text-xs text-slate-500 dark:text-slate-400">Antrean tertua</dt><dd className="text-sm font-bold text-slate-950 dark:text-white">{Math.round(overview.metrics.oldestPendingHours)} jam</dd></div></dl></section></section>}

    {overview && <MeetripDashboardHelp isAdmin={isAdmin} isSdm={isSdm} isKabag={isKabag} isPemberiTugas={isPemberiTugas} />}

    <Modal isOpen={budgetOpen} onClose={() => !savingBudget && setBudgetOpen(false)} title={`Budget perjalanan · ${MONTHS[period.month - 1]} ${period.year}`}>
      <div className="space-y-5"><div><label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">Anggaran perusahaan</label><div className="mt-2 flex items-center rounded-lg border border-slate-300 bg-surface-card px-3 focus-within:border-teal-500 focus-within:ring-2 focus-within:ring-teal-500/15 dark:border-slate-700 shadow-neu"><span className="text-sm font-semibold text-slate-500">Rp</span><InputUang value={budgetAmount} onChange={setBudgetAmount} className="min-w-0 flex-1 bg-transparent px-3 py-2.5 text-right text-base font-bold text-slate-900 outline-none dark:text-white" placeholder="0" /></div><p className="mt-2 text-[11px] leading-5 text-slate-500 dark:text-slate-400">Budget perusahaan berbeda dari pagu biaya berdasarkan grade karyawan.</p></div><div><label htmlFor="budget-notes" className="block text-xs font-semibold text-slate-700 dark:text-slate-300">Catatan</label><textarea id="budget-notes" value={budgetNotes} onChange={(event) => setBudgetNotes(event.target.value)} maxLength={1000} rows={4} className="mt-2 w-full resize-none rounded-lg border border-slate-300 bg-surface-card px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-500/15 dark:border-slate-700 dark:text-white shadow-neu" placeholder="Dasar atau keterangan anggaran bulan ini" /></div><div className="flex justify-end gap-2 border-t border-slate-200 pt-4 dark:border-slate-800"><Button type="button" variant="secondary" onClick={() => setBudgetOpen(false)} disabled={savingBudget}>Batal</Button><Button type="button" onClick={saveBudget} loading={savingBudget} loadingLabel="Menyimpan...">Simpan budget</Button></div></div>
    </Modal>
    </div>
  );
}
