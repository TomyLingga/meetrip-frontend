'use client';

/*
 * ─── Panel statistik & agenda meeting ─────────────────────────────────────────
 * Dipisah dari AnalyticsCharts.tsx (yang fokus ke perjalanan dinas) supaya dua
 * domain dashboard tetap mudah dibaca. Gaya visual, padding, dan token kedalaman
 * mengikuti panel dinas agar satu bahasa desain.
 */
import { useState } from 'react';
import Link from 'next/link';
import { ArrowUpRight, CalendarClock, DoorOpen, Users2, Video } from 'lucide-react';
import type { DashboardAnalytics, DashboardMeeting } from './types';

export const MEETING_STATUS_LABELS: Record<string, string> = {
  SCHEDULED: 'Akan datang',
  ONGOING: 'Berlangsung',
  DONE: 'Selesai',
  CANCELLED: 'Dibatalkan',
};

const MEETING_STATUS_COLORS: Record<string, string> = {
  SCHEDULED: '#0891b2',
  ONGOING: '#0d9488',
  DONE: '#047857',
  CANCELLED: '#be123c',
};

const dateTime = (value: string) =>
  new Date(value).toLocaleString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });

const timeOnly = (value: string) =>
  new Date(value).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });

/** "2 jam 30 menit" — dipakai untuk durasi rata-rata & total jam ruang. */
export function formatDuration(minutes: number) {
  if (!minutes || minutes <= 0) return '0 menit';
  const hours = Math.floor(minutes / 60);
  const rest = Math.round(minutes % 60);
  if (!hours) return `${rest} menit`;
  return rest ? `${hours} jam ${rest} menit` : `${hours} jam`;
}

/** Jarak waktu relatif ke masa depan: "mulai 45 menit lagi". */
function relativeStart(value: string) {
  const diffMs = new Date(value).getTime() - Date.now();
  if (diffMs <= 0) return 'sedang berlangsung';
  const minutes = Math.round(diffMs / 60000);
  if (minutes < 60) return `mulai ${minutes} menit lagi`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `mulai ${hours} jam lagi`;
  return `mulai ${Math.round(hours / 24)} hari lagi`;
}

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
  return <div className="flex h-40 items-center justify-center px-5 text-center text-sm text-slate-500 dark:text-slate-400">{text}</div>;
}

/** Kartu "Meeting berikutnya" + daftar agenda terdekat (real-time). */
export function NextMeetingPanel({ next, agenda }: { next: DashboardMeeting | null; agenda: DashboardMeeting[] }) {
  const rest = agenda.filter((item) => item.id !== next?.id).slice(0, 4);

  return <section className="rounded-lg border border-slate-200 bg-surface-card p-5 dark:border-slate-800 shadow-neu">
    <PanelHeader
      title="Meeting berikutnya"
      description="Agenda ruang rapat terdekat yang belum selesai."
      icon={CalendarClock}
      action={<Link href="/meeting" className="inline-flex items-center gap-1 text-xs font-semibold text-teal-700 hover:text-teal-800 dark:text-teal-300 dark:hover:text-teal-200">Kalender<ArrowUpRight className="h-3.5 w-3.5" /></Link>}
    />

    {!next ? <EmptyChart text="Belum ada agenda meeting yang akan datang." /> : <>
      <div className="mt-5 rounded-xl border border-teal-500/25 bg-surface-sunken p-4 shadow-neu-in-sm dark:border-teal-500/30">
        <div className="flex items-start justify-between gap-3">
          <p className="min-w-0 text-sm font-bold leading-5 text-slate-900 dark:text-white">{next.topik}</p>
          {next.isMine && <span className="shrink-0 rounded-md border border-teal-500/30 bg-teal-500/10 px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wide text-teal-700 dark:text-teal-300">Milik saya</span>}
        </div>
        <p className="mt-2 text-xs font-semibold text-teal-700 dark:text-teal-300">
          {dateTime(next.mulai)} – {timeOnly(next.selesai)} · {relativeStart(next.mulai)}
        </p>
        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-slate-500 dark:text-slate-400">
          <span className="inline-flex items-center gap-1.5"><DoorOpen className="h-3.5 w-3.5" />{next.ruangNama || 'Tanpa ruang (virtual)'}</span>
          {next.needZoom && <span className="inline-flex items-center gap-1.5 text-sky-700 dark:text-sky-300"><Video className="h-3.5 w-3.5" />Zoom</span>}
          {next.createdByNama && <span className="truncate">Diselenggarakan {next.createdByNama}</span>}
        </div>
      </div>

      {rest.length > 0 && <div className="mt-4 divide-y divide-slate-100 dark:divide-slate-800">
        {rest.map((item) => <div key={item.id} className="flex items-center justify-between gap-4 py-2.5 first:pt-3 last:pb-0">
          <div className="min-w-0">
            <p className="truncate text-xs font-semibold text-slate-800 dark:text-slate-200">{item.topik}</p>
            <p className="mt-0.5 truncate text-[11px] text-slate-500 dark:text-slate-400">{dateTime(item.mulai)} · {item.ruangNama || 'Virtual'}</p>
          </div>
          <span className="shrink-0 text-[10px] font-semibold text-slate-500 dark:text-slate-400">{relativeStart(item.mulai)}</span>
        </div>)}
      </div>}
    </>}
  </section>;
}

/** Volume meeting per tanggal — mengikuti month-year picker. */
export function MeetingDailyChart({ data }: { data: DashboardAnalytics['meetings']['dailyVolume'] }) {
  const [hovered, setHovered] = useState<number | null>(null);
  const max = Math.max(...data.map((item) => item.total), 1);
  const total = data.reduce((sum, item) => sum + item.total, 0);

  return <section className="rounded-lg border border-slate-200 bg-surface-card p-5 dark:border-slate-800 overflow-visible shadow-neu">
    <PanelHeader title="Kepadatan agenda" description="Jumlah meeting yang dimulai pada setiap tanggal di bulan terpilih." icon={CalendarClock} />
    {total === 0 ? <EmptyChart text="Tidak ada meeting pada bulan ini." /> : <div className="mt-2 overflow-x-auto pb-1 pt-9">
      <div className="flex h-44 min-w-[620px] items-end gap-1 border-b border-slate-200 px-1 dark:border-slate-700">
        {data.map((item, index) => {
          const isFirst = index < 3;
          const isLast = index > data.length - 4;
          const alignClass = isFirst ? 'left-0 translate-x-0' : isLast ? 'right-0 left-auto translate-x-0' : 'left-1/2 -translate-x-1/2';
          return (
            <button key={item.day} type="button" className="group relative flex h-full min-w-[13px] flex-1 items-end focus:outline-none"
              onMouseEnter={() => setHovered(item.day)} onMouseLeave={() => setHovered(null)}
              onFocus={() => setHovered(item.day)} onBlur={() => setHovered(null)}
              aria-label={`Tanggal ${item.day}: ${item.total} meeting`}>
              <span className={`w-full rounded-t-[2px] transition-colors ${item.total ? 'bg-sky-600/75 group-hover:bg-sky-700 dark:bg-sky-400/70 dark:group-hover:bg-sky-300' : 'bg-slate-100 dark:bg-slate-800'}`}
                style={{ height: `${item.total ? Math.max(5, (item.total / max) * 100) : 1}%` }} />
              {(item.day === 1 || item.day === data.length || item.day % 5 === 0) && <span className="absolute -bottom-5 left-1/2 -translate-x-1/2 text-[10px] text-slate-400">{item.day}</span>}
              {hovered === item.day && (
                <span className={`pointer-events-none absolute -top-8 z-30 whitespace-nowrap rounded-md border border-slate-200 bg-slate-900 px-2.5 py-1 text-center text-[11px] font-bold text-white shadow-neu-pop dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 ${alignClass}`}>
                  Tgl {item.day}: {item.total} meeting
                </span>
              )}
            </button>
          );
        })}
      </div>
      <p className="mt-7 text-[11px] text-slate-500 dark:text-slate-400">Total {total} meeting terjadwal</p>
    </div>}
  </section>;
}

/** Pemakaian ruang rapat: jumlah sesi + total jam. */
export function MeetingRoomUsage({ data }: { data: DashboardAnalytics['meetings']['roomBreakdown'] }) {
  const max = Math.max(...data.map((item) => item.total), 1);
  return <section className="rounded-lg border border-slate-200 bg-surface-card p-5 dark:border-slate-800 shadow-neu">
    <PanelHeader title="Pemakaian ruang" description="Ruang yang paling sering dipakai pada bulan terpilih." icon={DoorOpen} />
    {data.length === 0 ? <EmptyChart text="Belum ada pemakaian ruang pada bulan ini." /> : <div className="mt-5 divide-y divide-slate-100 dark:divide-slate-800">
      {data.map((item, index) => <div key={item.room} className="py-3 first:pt-0 last:pb-0">
        <div className="mb-1.5 flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <span className="w-5 text-xs font-bold tabular-nums text-slate-400">{index + 1}</span>
            <p className="truncate text-xs font-semibold text-slate-800 dark:text-slate-200">{item.room}</p>
          </div>
          <span className="shrink-0 text-xs font-bold tabular-nums text-slate-950 dark:text-white">{item.total} sesi</span>
        </div>
        <div className="ml-8 h-1.5 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
          <div className="h-full rounded-full bg-sky-600 dark:bg-sky-400" style={{ width: `${(item.total / max) * 100}%` }} />
        </div>
        <p className="ml-8 mt-1 text-[11px] text-slate-500 dark:text-slate-400">{item.hours.toLocaleString('id-ID', { maximumFractionDigits: 1 })} jam terpakai</p>
      </div>)}
    </div>}
  </section>;
}

/** Distribusi status meeting (dihitung dari waktu, bukan hanya kolom status). */
export function MeetingStatusBreakdown({ data }: { data: DashboardAnalytics['meetings']['statusDistribution'] }) {
  const visible = data.filter((item) => item.total > 0);
  const max = Math.max(...visible.map((item) => item.total), 1);
  return <section className="rounded-lg border border-slate-200 bg-surface-card p-5 dark:border-slate-800 shadow-neu">
    <PanelHeader title="Status agenda" description="Posisi meeting pada bulan terpilih: selesai, berlangsung, akan datang, atau dibatalkan." icon={CalendarClock} />
    {visible.length === 0 ? <EmptyChart text="Belum ada agenda untuk ditampilkan." /> : <div className="mt-6 space-y-4">
      {visible.map((item) => <div key={item.status}>
        <div className="mb-1.5 flex items-center justify-between gap-3">
          <span className="truncate text-xs font-medium text-slate-700 dark:text-slate-300">{MEETING_STATUS_LABELS[item.status] || item.status}</span>
          <span className="text-xs font-bold tabular-nums text-slate-950 dark:text-white">{item.total}</span>
        </div>
        <div className="h-1.5 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
          <div className="h-full rounded-full" style={{ width: `${(item.total / max) * 100}%`, backgroundColor: MEETING_STATUS_COLORS[item.status] || '#64748b' }} />
        </div>
      </div>)}
    </div>}
  </section>;
}

/** Penyelenggara paling aktif + komposisi peserta. */
export function MeetingHostSummary({ data }: { data: DashboardAnalytics['meetings'] }) {
  const internal = Math.max(data.participants - data.externalParticipants, 0);
  return <section className="rounded-lg border border-slate-200 bg-surface-card p-5 dark:border-slate-800 shadow-neu">
    <PanelHeader title="Penyelenggara & peserta" description="Siapa yang paling banyak menjadwalkan meeting pada bulan terpilih." icon={Users2} />
    {data.topHosts.length === 0 ? <EmptyChart text="Belum ada penyelenggara pada bulan ini." /> : <>
      <div className="mt-5 divide-y divide-slate-100 dark:divide-slate-800">
        {data.topHosts.map((host, index) => <div key={host.nama} className="flex items-center justify-between gap-4 py-2.5 first:pt-0">
          <div className="flex min-w-0 items-center gap-3">
            <span className="w-5 text-xs font-bold tabular-nums text-slate-400">{index + 1}</span>
            <p className="truncate text-xs font-semibold text-slate-800 dark:text-slate-200">{host.nama}</p>
          </div>
          <span className="shrink-0 text-xs font-bold tabular-nums text-slate-950 dark:text-white">{host.total}</span>
        </div>)}
      </div>
      <dl className="mt-5 grid grid-cols-3 gap-4 border-t border-slate-100 pt-4 dark:border-slate-800">
        <div><dt className="text-[11px] text-slate-500 dark:text-slate-400">Total peserta</dt><dd className="mt-1 text-sm font-bold tabular-nums text-slate-950 dark:text-white">{data.participants}</dd></div>
        <div><dt className="text-[11px] text-slate-500 dark:text-slate-400">Internal</dt><dd className="mt-1 text-sm font-bold tabular-nums text-slate-950 dark:text-white">{internal}</dd></div>
        <div><dt className="text-[11px] text-slate-500 dark:text-slate-400">Eksternal</dt><dd className="mt-1 text-sm font-bold tabular-nums text-amber-600 dark:text-amber-400">{data.externalParticipants}</dd></div>
      </dl>
    </>}
  </section>;
}

/** Ringkasan angka meeting bulan terpilih (baris kartu tipis). */
export function MeetingSummaryStrip({ data, periodLabel }: { data: DashboardAnalytics['meetings']; periodLabel: string }) {
  const items = [
    { label: 'Meeting bulan ini', value: data.total.toLocaleString('id-ID'), hint: periodLabel },
    { label: 'Total durasi', value: formatDuration(data.totalMinutes), hint: `Rata-rata ${formatDuration(data.avgMinutes)}` },
    { label: 'Pakai ruang', value: data.withRoom.toLocaleString('id-ID'), hint: `${data.withZoom} via Zoom · ${data.withSoundSystem} butuh sound` },
    { label: 'Dibatalkan', value: data.cancelled.toLocaleString('id-ID'), hint: `${data.hostCount} penyelenggara · ${data.mine} milik saya` },
  ];
  return <div className="grid grid-cols-1 overflow-hidden rounded-lg border border-slate-200 bg-surface-card dark:border-slate-800 sm:grid-cols-2 xl:grid-cols-4 shadow-neu">
    {items.map((item, index) => <div key={item.label} className={`p-4 ${index > 0 ? 'border-t border-slate-200 dark:border-slate-800 sm:border-t-0 sm:border-l' : ''} ${index === 2 ? 'sm:border-t sm:border-l-0 xl:border-t-0 xl:border-l' : ''}`}>
      <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400">{item.label}</p>
      <p className="mt-1 text-xl font-bold tabular-nums text-slate-950 dark:text-white">{item.value}</p>
      <p className="mt-1 text-[11px] leading-4 text-slate-500 dark:text-slate-400">{item.hint}</p>
    </div>)}
  </div>;
}

export function MeetingAnalyticsLoading() {
  return <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
    <div className="h-72 animate-pulse rounded-lg border border-slate-200 bg-surface-sunken dark:border-slate-800" />
    <div className="h-72 animate-pulse rounded-lg border border-slate-200 bg-surface-sunken dark:border-slate-800" />
  </div>;
}
