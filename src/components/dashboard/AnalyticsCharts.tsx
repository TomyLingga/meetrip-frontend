'use client';

import { useMemo, useState } from 'react';
import { Banknote, BarChart3, CircleDollarSign, Pencil, ReceiptText, TrendingUp } from 'lucide-react';
import type { DashboardAnalytics } from './types';

export const STATUS_LABELS: Record<string, string> = {
  DRAFT: 'Draft',
  SUBMITTED: 'BTO diajukan',
  ADMIN_DP_REVIEW: 'Pemeriksaan DP',
  REVISION_DP: 'Revisi DP',
  PT_REVIEW: 'Review Pemberi Tugas',
  SDM_REVIEW: 'Review SDM',
  SPDK_DRAFT: 'Penerbitan SPDK',
  KABAG_REVIEW: 'Review KABAG',
  ACTIVE: 'SPDK aktif',
  ATTENDED: 'Sudah absen',
  REPORT_UPLOADED: 'Laporan masuk',
  BTE_DRAFT: 'Penyusunan BTE',
  ADMIN_BTE_REVIEW: 'Pemeriksaan BTE',
  BTE_PAYMENT: 'Menunggu pembayaran',
  COMPLETED: 'Selesai',
  REJECTED: 'Ditolak',
  REVISION_BTE: 'Revisi BTE',
};

const STATUS_COLORS: Record<string, string> = {
  DRAFT: '#94a3b8', SUBMITTED: '#0284c7', ADMIN_DP_REVIEW: '#d97706', REVISION_DP: '#e11d48',
  PT_REVIEW: '#0891b2', SDM_REVIEW: '#4f46e5', SPDK_DRAFT: '#7c3aed', KABAG_REVIEW: '#c026d3',
  ACTIVE: '#2563eb', ATTENDED: '#0d9488', REPORT_UPLOADED: '#059669', BTE_DRAFT: '#65a30d',
  ADMIN_BTE_REVIEW: '#ea580c', BTE_PAYMENT: '#ca8a04', COMPLETED: '#047857', REJECTED: '#be123c', REVISION_BTE: '#e11d48',
};

const CATEGORY_LABELS: Record<string, string> = {
  uang_saku: 'Uang saku', hotel: 'Penginapan', transportasi: 'Transportasi', transport: 'Transportasi',
  laundry: 'Laundry', konsumsi: 'Konsumsi', representasi: 'Representasi', biaya_lain: 'Biaya lain', lain_lain: 'Lain-lain',
};

const ACTION_LABELS: Record<string, string> = {
  approve: 'Disetujui', approved: 'Disetujui', reject: 'Ditolak', rejected: 'Ditolak',
  revision: 'Dikembalikan', revise: 'Dikembalikan', submit: 'Dikirim', issued: 'Diterbitkan', mark_paid: 'Dibayar', paid: 'Dibayar',
};

const money = (value: number) => new Intl.NumberFormat('id-ID', {
  style: 'currency', currency: 'IDR', maximumFractionDigits: 0,
}).format(value);

const compactMoney = (value: number) => {
  const absolute = Math.abs(value);
  if (absolute >= 1_000_000_000) return `${(value / 1_000_000_000).toLocaleString('id-ID', { maximumFractionDigits: 1 })} M`;
  if (absolute >= 1_000_000) return `${(value / 1_000_000).toLocaleString('id-ID', { maximumFractionDigits: 1 })} jt`;
  if (absolute >= 1_000) return `${(value / 1_000).toLocaleString('id-ID', { maximumFractionDigits: 0 })} rb`;
  return value.toLocaleString('id-ID');
};

function PanelHeader({ title, description, icon: Icon, action }: { title: string; description: string; icon: React.ElementType; action?: React.ReactNode }) {
  return <div className="flex items-start justify-between gap-4">
    <div className="min-w-0">
      <h3 className="text-sm font-bold text-slate-950 dark:text-white">{title}</h3>
      <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">{description}</p>
    </div>
    <div className="flex shrink-0 items-center gap-2">{action}<Icon className="h-4 w-4 text-slate-400 dark:text-slate-500" /></div>
  </div>;
}

function EmptyChart({ text }: { text: string }) {
  return <div className="flex h-48 items-center justify-center px-5 text-center text-sm text-slate-500 dark:text-slate-400">{text}</div>;
}

export function BudgetOverview({ data, canEdit, onEdit }: { data: DashboardAnalytics; canEdit: boolean; onEdit: () => void }) {
  const finance = data.finance;
  const isCompany = data.context === 'company';
  const hasAllocation = finance.allocation != null && finance.allocation > 0;
  const utilization = Math.max(0, finance.utilizationPercent ?? 0);
  const progress = Math.min(utilization, 100);
  const overBudget = finance.remaining != null && finance.remaining < 0;

  return <section className="rounded-lg border border-slate-200 bg-surface-card p-5 dark:border-slate-800 shadow-neu">
    <PanelHeader
      title={isCompany ? 'Budget perjalanan perusahaan' : 'Biaya perjalanan dalam cakupan'}
      description={!isCompany
        ? 'Komitmen DP dan realisasi BTE untuk perjalanan yang berangkat pada bulan terpilih.'
        : 'Eksposur memakai BTE final, atau DP disetujui selama BTE final belum tersedia.'}
      icon={CircleDollarSign}
      action={canEdit ? <button type="button" onClick={onEdit} className="rounded p-1.5 text-slate-500 transition hover:bg-slate-100 hover:text-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-500/20 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-teal-300" title="Atur budget bulan ini" aria-label="Atur budget bulan ini"><Pencil className="h-3.5 w-3.5" /></button> : null}
    />

    {isCompany && <div className="mt-6">
      <div className="flex items-end justify-between gap-5">
        <div><p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Eksposur dari anggaran</p><p className="mt-1 text-2xl font-bold tabular-nums text-slate-950 dark:text-white">{money(finance.exposure)}</p></div>
        <div className="text-right"><p className={`text-sm font-bold tabular-nums ${overBudget ? 'text-rose-600 dark:text-rose-400' : 'text-teal-700 dark:text-teal-300'}`}>{hasAllocation ? `${utilization.toLocaleString('id-ID', { maximumFractionDigits: 1 })}%` : 'Belum diatur'}</p><p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">{finance.allocation == null ? 'Tetapkan budget bulan ini' : `dari ${money(finance.allocation)}`}</p></div>
      </div>
      <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800"><div className={`h-full rounded-full transition-[width] duration-500 ${overBudget ? 'bg-rose-500' : utilization >= 80 ? 'bg-amber-500' : 'bg-teal-600 dark:bg-teal-400'}`} style={{ width: `${hasAllocation ? progress : 0}%` }} /></div>
      <div className="mt-2 flex justify-between gap-4 text-[11px] text-slate-500 dark:text-slate-400"><span>Sisa budget</span><span className={`font-bold tabular-nums ${overBudget ? 'text-rose-600 dark:text-rose-400' : 'text-slate-700 dark:text-slate-200'}`}>{finance.remaining == null ? '-' : money(finance.remaining)}</span></div>
    </div>}

    <dl className="mt-6 grid grid-cols-2 gap-x-5 gap-y-5 border-t border-slate-100 pt-5 dark:border-slate-800 sm:grid-cols-3">
      <FinanceValue label="DP disetujui" value={finance.approvedDp} />
      <FinanceValue label="Realisasi BTE" value={finance.actualBte} />
      <FinanceValue label="Menunggu dibayar" value={finance.pendingPayment} />
      <FinanceValue label="Kas dibayar bulan ini" value={finance.paidCash} />
      <FinanceValue label="Selisih BTE - DP" value={finance.settlementDelta} signed />
      {finance.allocation == null && <FinanceValue label="Eksposur biaya" value={finance.exposure} />}
    </dl>
    {finance.budgetNotes && <p className="mt-5 border-t border-slate-100 pt-4 text-xs leading-5 text-slate-500 dark:border-slate-800 dark:text-slate-400">{finance.budgetNotes}</p>}
  </section>;
}

function FinanceValue({ label, value, signed = false }: { label: string; value: number; signed?: boolean }) {
  return <div><dt className="text-[11px] font-medium text-slate-500 dark:text-slate-400">{label}</dt><dd className={`mt-1 text-sm font-bold tabular-nums ${signed && value > 0 ? 'text-rose-600 dark:text-rose-400' : signed && value < 0 ? 'text-emerald-700 dark:text-emerald-300' : 'text-slate-900 dark:text-white'}`}>{signed && value > 0 ? '+' : ''}{money(value)}</dd></div>;
}

export function WeeklyFinanceChart({ data }: { data: DashboardAnalytics['weeklyFinance'] }) {
  const [hovered, setHovered] = useState<number | null>(null);
  const max = Math.max(...data.flatMap((item) => [item.dp, item.bte]), 1);
  const total = data.reduce((sum, item) => sum + item.dp + item.bte, 0);

  return <section className="rounded-lg border border-slate-200 bg-surface-card p-5 dark:border-slate-800 shadow-neu">
    <PanelHeader title="Pergerakan biaya mingguan" description="DP dan BTE dikelompokkan menurut tanggal keberangkatan perjalanan." icon={TrendingUp} />
    {total === 0 ? <EmptyChart text="Belum ada DP atau BTE pada periode ini." /> : <div className="mt-6">
      <div className="flex h-52 items-end gap-3 border-b border-slate-200 px-1 dark:border-slate-700 sm:gap-6">
        {data.map((item) => <button key={item.week} type="button" className="group relative flex h-full min-w-0 flex-1 items-end justify-center gap-1.5 pt-6 focus:outline-none" onMouseEnter={() => setHovered(item.week)} onMouseLeave={() => setHovered(null)} onFocus={() => setHovered(item.week)} onBlur={() => setHovered(null)} aria-label={`Minggu ${item.week}, DP ${money(item.dp)}, BTE ${money(item.bte)}`}>
          <span className="w-full max-w-8 rounded-t-sm bg-cyan-600/80 transition-opacity group-hover:opacity-100 dark:bg-cyan-400/75" style={{ height: `${item.dp ? Math.max(5, (item.dp / max) * 100) : 1}%` }} />
          <span className="w-full max-w-8 rounded-t-sm bg-emerald-600/80 transition-opacity group-hover:opacity-100 dark:bg-emerald-400/75" style={{ height: `${item.bte ? Math.max(5, (item.bte / max) * 100) : 1}%` }} />
          <span className="absolute -bottom-6 text-[10px] font-semibold text-slate-500 dark:text-slate-400">M{item.week}</span>
          {hovered === item.week && <span className="absolute bottom-[calc(100%-1rem)] left-1/2 z-20 w-44 -translate-x-1/2 rounded-md border border-slate-200 bg-surface-card p-3 text-left shadow-neu-pop dark:border-slate-700"><strong className="block text-xs text-slate-900 dark:text-white">Minggu {item.week}</strong><span className="mt-2 block text-[11px] text-cyan-700 dark:text-cyan-300">DP {money(item.dp)}</span><span className="mt-1 block text-[11px] text-emerald-700 dark:text-emerald-300">BTE {money(item.bte)}</span><span className="mt-1 block text-[11px] text-slate-500">{item.trips} perjalanan</span></span>}
        </button>)}
      </div>
      <div className="mt-8 flex items-center gap-5 text-[11px] font-medium text-slate-500 dark:text-slate-400"><span className="flex items-center gap-2"><i className="h-2 w-2 rounded-full bg-cyan-600 dark:bg-cyan-400" />DP disetujui</span><span className="flex items-center gap-2"><i className="h-2 w-2 rounded-full bg-emerald-600 dark:bg-emerald-400" />BTE final</span></div>
    </div>}
  </section>;
}

export function DailyTripChart({ data }: { data: DashboardAnalytics['dailyVolume'] }) {
  const [hovered, setHovered] = useState<number | null>(null);
  const max = Math.max(...data.map((item) => item.total), 1);
  const total = data.reduce((sum, item) => sum + item.total, 0);
  return <section className="rounded-lg border border-slate-200 bg-surface-card p-5 dark:border-slate-800 overflow-visible shadow-neu">
    <PanelHeader title="Ritme keberangkatan" description="Jumlah perjalanan yang mulai pada setiap tanggal di bulan terpilih." icon={BarChart3} />
    {total === 0 ? <EmptyChart text="Tidak ada keberangkatan pada bulan ini." /> : <div className="mt-2 overflow-x-auto pb-1 pt-9">
      <div className="flex h-44 min-w-[620px] items-end gap-1 border-b border-slate-200 px-1 dark:border-slate-700">
        {data.map((item, index) => {
          const isFirst = index < 3;
          const isLast = index > data.length - 4;
          const alignClass = isFirst ? 'left-0 translate-x-0' : isLast ? 'right-0 left-auto translate-x-0' : 'left-1/2 -translate-x-1/2';
          return (
            <button key={item.day} type="button" className="group relative flex h-full min-w-[13px] flex-1 items-end focus:outline-none" onMouseEnter={() => setHovered(item.day)} onMouseLeave={() => setHovered(null)} onFocus={() => setHovered(item.day)} onBlur={() => setHovered(null)} aria-label={`Tanggal ${item.day}: ${item.total} perjalanan`}>
              <span className={`w-full rounded-t-[2px] transition-colors ${item.total ? 'bg-teal-600/75 group-hover:bg-teal-700 dark:bg-teal-400/70 dark:group-hover:bg-teal-300' : 'bg-slate-100 dark:bg-slate-800'}`} style={{ height: `${item.total ? Math.max(5, (item.total / max) * 100) : 1}%` }} />
              {(item.day === 1 || item.day === data.length || item.day % 5 === 0) && <span className="absolute -bottom-5 left-1/2 -translate-x-1/2 text-[10px] text-slate-400">{item.day}</span>}
              {hovered === item.day && (
                <span className={`pointer-events-none absolute -top-8 z-30 whitespace-nowrap rounded-md border border-slate-200 bg-slate-900 px-2.5 py-1 text-center text-[11px] font-bold text-white shadow-neu-pop dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 ${alignClass}`}>
                  Tgl {item.day}: {item.total} perjalanan
                </span>
              )}
            </button>
          );
        })}
      </div>
      <p className="mt-7 text-[11px] text-slate-500 dark:text-slate-400">Total {total} keberangkatan</p>
    </div>}
  </section>;
}

export function StatusBreakdown({ data }: { data: DashboardAnalytics['statusDistribution'] }) {
  const visible = useMemo(() => data.filter((item) => item.total > 0).slice(0, 8), [data]);
  const max = Math.max(...visible.map((item) => item.total), 1);
  return <section className="rounded-lg border border-slate-200 bg-surface-card p-5 dark:border-slate-800 shadow-neu">
    <PanelHeader title="Posisi perjalanan" description="Status terkini dari perjalanan yang berangkat pada periode ini." icon={ReceiptText} />
    {visible.length === 0 ? <EmptyChart text="Belum ada status untuk ditampilkan." /> : <div className="mt-6 space-y-4">{visible.map((item) => <div key={item.status}><div className="mb-1.5 flex items-center justify-between gap-3"><span className="truncate text-xs font-medium text-slate-700 dark:text-slate-300">{STATUS_LABELS[item.status] || item.status}</span><span className="text-xs font-bold tabular-nums text-slate-950 dark:text-white">{item.total}</span></div><div className="h-1.5 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800"><div className="h-full rounded-full" style={{ width: `${(item.total / max) * 100}%`, backgroundColor: STATUS_COLORS[item.status] || '#64748b' }} /></div></div>)}</div>}
  </section>;
}

export function CategoryBreakdown({ data }: { data: DashboardAnalytics['categoryBreakdown'] }) {
  const max = Math.max(...data.map((item) => item.total), 1);
  return <section className="rounded-lg border border-slate-200 bg-surface-card p-5 dark:border-slate-800 shadow-neu">
    <PanelHeader title="Komposisi realisasi" description="Kategori biaya dari BTE final pada perjalanan periode ini." icon={Banknote} />
    {data.length === 0 ? <EmptyChart text="Rincian BTE final belum tersedia." /> : <div className="mt-6 space-y-4">{data.map((item) => <div key={item.category}><div className="mb-1.5 flex items-center justify-between gap-4"><span className="truncate text-xs font-medium text-slate-700 dark:text-slate-300">{CATEGORY_LABELS[item.category] || item.category.replaceAll('_', ' ')}</span><span className="shrink-0 text-xs font-bold tabular-nums text-slate-950 dark:text-white">{compactMoney(item.total)}</span></div><div className="h-1.5 rounded-full bg-slate-100 dark:bg-slate-800"><div className="h-full rounded-full bg-amber-500 dark:bg-amber-400" style={{ width: `${(item.total / max) * 100}%` }} /></div></div>)}</div>}
  </section>;
}

export function UnitCostList({ data }: { data: DashboardAnalytics['unitBreakdown'] }) {
  return <section className="rounded-lg border border-slate-200 bg-surface-card p-5 dark:border-slate-800 shadow-neu">
    <PanelHeader title="Biaya per unit" description="Eksposur terbesar berdasarkan unit karyawan saat BTO dibuat." icon={CircleDollarSign} />
    {data.length === 0 ? <EmptyChart text="Belum ada data unit untuk periode ini." /> : <div className="mt-5 divide-y divide-slate-100 dark:divide-slate-800">{data.map((item, index) => <div key={item.unit} className="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0"><div className="flex min-w-0 items-center gap-3"><span className="w-5 text-xs font-bold tabular-nums text-slate-400">{index + 1}</span><div className="min-w-0"><p className="truncate text-xs font-semibold text-slate-800 dark:text-slate-200">{item.unit}</p><p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">{item.trips} perjalanan</p></div></div><span className="shrink-0 text-xs font-bold tabular-nums text-slate-950 dark:text-white">{compactMoney(item.total)}</span></div>)}</div>}
  </section>;
}

export function DecisionSummary({ data }: { data: DashboardAnalytics['decisionOutcomes'] }) {
  const normalized = data.filter((item) => item.total > 0);
  const total = normalized.reduce((sum, item) => sum + item.total, 0);
  return <section className="rounded-lg border border-slate-200 bg-surface-card p-5 dark:border-slate-800 shadow-neu">
    <PanelHeader title="Keputusan Anda" description="Tindakan persetujuan yang Anda catat pada bulan terpilih." icon={ReceiptText} />
    {normalized.length === 0 ? <EmptyChart text="Belum ada keputusan yang dicatat pada periode ini." /> : <div className="mt-6 grid grid-cols-2 gap-x-5 gap-y-5">{normalized.map((item) => <div key={item.action}><p className="text-[11px] text-slate-500 dark:text-slate-400">{ACTION_LABELS[item.action] || item.action.replaceAll('_', ' ')}</p><p className="mt-1 text-xl font-bold tabular-nums text-slate-950 dark:text-white">{item.total}</p><p className="mt-0.5 text-[10px] text-slate-400">{Math.round((item.total / total) * 100)}% tindakan</p></div>)}</div>}
  </section>;
}

export function AnalyticsLoading() {
  return <div className="grid grid-cols-1 gap-4 lg:grid-cols-2"><div className="h-80 animate-pulse rounded-lg border border-slate-200 bg-surface-sunken dark:border-slate-800" /><div className="h-80 animate-pulse rounded-lg border border-slate-200 bg-surface-sunken dark:border-slate-800" /><div className="h-72 animate-pulse rounded-lg border border-slate-200 bg-surface-sunken dark:border-slate-800" /><div className="h-72 animate-pulse rounded-lg border border-slate-200 bg-surface-sunken dark:border-slate-800" /></div>;
}
