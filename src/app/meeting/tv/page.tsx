'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, RefreshCw } from 'lucide-react';
import { API_URL, fetchWithTimeout } from '@/utils/api';
import { getMeetingStatus, type MeetingEffectiveStatus, type MeetingTimeLike } from '@/utils/meetingStatus';

interface MeetingItem {
  id: string;
  topik: string;
  mulai: string;
  selesai: string;
  ruangNama: string | null;
  status?: string | null;
}

const WEEKDAYS = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'];

const STATUS_STYLES: Record<MeetingEffectiveStatus, string> = {
  BERLANGSUNG: 'border-emerald-600 bg-emerald-50 text-emerald-950',
  MENUNGGU: 'border-[#13746f] bg-[#eef8f6] text-slate-950',
  SELESAI: 'border-slate-400 bg-slate-100 text-slate-700',
  DIBATALKAN: 'border-red-600 bg-red-50 text-red-900',
};

const STATUS_LABELS: Record<MeetingEffectiveStatus, string> = {
  BERLANGSUNG: 'Berlangsung',
  MENUNGGU: 'Terjadwal',
  SELESAI: 'Selesai',
  DIBATALKAN: 'Dibatalkan',
};

const formatTime = (value: string) => new Date(value).toLocaleTimeString('id-ID', {
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
});

const isSameDay = (left: Date, right: Date) => (
  left.getFullYear() === right.getFullYear()
  && left.getMonth() === right.getMonth()
  && left.getDate() === right.getDate()
);

function getCalendarRange(month: Date) {
  const start = new Date(month.getFullYear(), month.getMonth(), 1);
  const mondayOffset = (start.getDay() + 6) % 7;
  start.setDate(start.getDate() - mondayOffset);
  start.setHours(0, 0, 0, 0);

  const days = Array.from({ length: 42 }, (_, index) => {
    const date = new Date(start);
    date.setDate(start.getDate() + index);
    return date;
  });

  const end = new Date(days[41]);
  end.setHours(23, 59, 59, 999);
  return { start, end, days };
}

export default function MeetingTvPage() {
  const [currentMonth, setCurrentMonth] = useState(() => {
    const today = new Date();
    return new Date(today.getFullYear(), today.getMonth(), 1);
  });
  const [clockTime, setClockTime] = useState(new Date());
  const [meetings, setMeetings] = useState<MeetingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastSynced, setLastSynced] = useState<Date | null>(null);
  const [connectionError, setConnectionError] = useState(false);

  const calendar = useMemo(() => getCalendarRange(currentMonth), [currentMonth]);

  const loadMeetings = useCallback(async () => {
    try {
      setLoading(true);
      const query = new URLSearchParams({
        dateFrom: calendar.start.toISOString(),
        dateTo: calendar.end.toISOString(),
      });
      const response = await fetchWithTimeout(`${API_URL}/api/meeting/public?${query}`, {
        cache: 'no-store',
        headers: { Accept: 'application/json' },
      }, 30000);
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || 'Gagal memuat jadwal publik');

      setMeetings((body.data || []).filter((meeting: MeetingItem) => meeting.status !== 'CANCELLED'));
      setLastSynced(new Date());
      setConnectionError(false);
    } catch (error) {
      console.error('Failed to load meetings for TV mode:', error);
      setConnectionError(true);
    } finally {
      setLoading(false);
    }
  }, [calendar.end, calendar.start]);

  useEffect(() => {
    loadMeetings();
  }, [loadMeetings]);

  useEffect(() => {
    const timer = setInterval(() => setClockTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const timer = setInterval(loadMeetings, 180000);
    return () => clearInterval(timer);
  }, [loadMeetings]);

  const meetingsByDay = useMemo(() => {
    const grouped = new Map<string, MeetingItem[]>();
    [...meetings]
      .sort((a, b) => new Date(a.mulai).getTime() - new Date(b.mulai).getTime())
      .forEach((meeting) => {
        const date = new Date(meeting.mulai);
        const key = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
        const entries = grouped.get(key) || [];
        entries.push(meeting);
        grouped.set(key, entries);
      });
    return grouped;
  }, [meetings]);

  const moveMonth = (offset: number) => {
    setCurrentMonth((value) => new Date(value.getFullYear(), value.getMonth() + offset, 1));
  };

  const goToToday = () => {
    const today = new Date();
    setCurrentMonth(new Date(today.getFullYear(), today.getMonth(), 1));
  };

  const monthLabel = currentMonth.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
  const dateLabel = clockTime.toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
  const timeLabel = clockTime.toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });

  return (
    <main className="flex h-screen w-screen select-none flex-col overflow-hidden bg-[#edf1f0] font-sans text-slate-950 antialiased" aria-label="Kalender jadwal rapat">
      <header className="grid h-[104px] shrink-0 grid-cols-[minmax(250px,1fr)_auto_minmax(330px,1fr)] items-center border-b-4 border-[#56c8bb] bg-[#0f6863] px-6 text-white 2xl:h-[120px] 2xl:px-9">
        <div className="min-w-0">
          <h1 className="truncate text-3xl font-bold leading-none 2xl:text-4xl">Calendar of Meetings</h1>
          <p className="mt-2 truncate text-base font-semibold text-teal-100 2xl:text-lg">PT Industri Nabati Lestari</p>
        </div>

        <div className="flex items-center gap-2" aria-label="Navigasi bulan">
          <button type="button" onClick={() => moveMonth(-1)} className="grid h-11 w-11 place-items-center rounded-full border border-white/20 bg-[#0f6863] shadow-[4px_4px_9px_#09514d,-4px_-4px_9px_#16807a] focus:outline-none focus-visible:ring-2 focus-visible:ring-white" aria-label="Bulan sebelumnya">
            <ChevronLeft className="h-6 w-6" aria-hidden="true" />
          </button>
          <button type="button" onClick={goToToday} className="min-w-[238px] px-4 py-2 text-center focus:outline-none focus-visible:ring-2 focus-visible:ring-white 2xl:min-w-[290px]">
            <span className="block text-sm font-bold uppercase text-teal-100">Hari ini</span>
            <span className="mt-1 block text-2xl font-bold capitalize leading-none 2xl:text-3xl">{monthLabel}</span>
          </button>
          <button type="button" onClick={() => moveMonth(1)} className="grid h-11 w-11 place-items-center rounded-full border border-white/20 bg-[#0f6863] shadow-[4px_4px_9px_#09514d,-4px_-4px_9px_#16807a] focus:outline-none focus-visible:ring-2 focus-visible:ring-white" aria-label="Bulan berikutnya">
            <ChevronRight className="h-6 w-6" aria-hidden="true" />
          </button>
        </div>

        <div className="flex items-center justify-end gap-5 2xl:gap-7 flex-wrap">
          <button
            type="button"
            onClick={loadMeetings}
            disabled={loading}
            className="grid h-12 w-12 shrink-0 place-items-center rounded-full border border-white/20 bg-[#0f6863] shadow-[5px_5px_10px_#09514d,-5px_-5px_10px_#16807a] focus:outline-none focus-visible:ring-2 focus-visible:ring-white disabled:cursor-wait"
            aria-label="Perbarui kalender"
            title={lastSynced ? `Terakhir diperbarui ${lastSynced.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}` : 'Perbarui kalender'}
          >
            <RefreshCw className="h-6 w-6 animate-spin" aria-hidden="true" />
          </button>
          <div className="min-w-0 text-right">
            <p suppressHydrationWarning className="truncate text-sm font-semibold text-teal-100 2xl:text-base">{dateLabel}</p>
            <p suppressHydrationWarning className="mt-1 font-mono text-4xl font-bold leading-none tabular-nums 2xl:text-5xl">{timeLabel}</p>
          </div>
        </div>
      </header>

      <section className="flex min-h-0 flex-1 flex-col px-4 pb-4 pt-3 2xl:px-6 2xl:pb-6 2xl:pt-4" aria-label={`Kalender ${monthLabel}`}>
        <div className="grid h-11 shrink-0 grid-cols-7 border border-b-0 border-slate-300 bg-white 2xl:h-12">
          {WEEKDAYS.map((weekday, index) => (
            <div key={weekday} className={`flex items-center justify-center border-r border-slate-300 text-base font-bold uppercase last:border-r-0 2xl:text-lg ${index === 6 ? 'text-red-700' : 'text-slate-700'}`}>
              {weekday}
            </div>
          ))}
        </div>

        <div className="grid min-h-0 flex-1 grid-cols-7 grid-rows-6 border-l border-t border-slate-300 bg-slate-300">
          {calendar.days.map((date) => {
            const key = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
            const dayMeetings = meetingsByDay.get(key) || [];
            const isToday = isSameDay(date, clockTime);
            const isCurrentMonth = date.getMonth() === currentMonth.getMonth();

            return (
              <article
                key={date.toISOString()}
                className={`flex flex-col min-h-0 overflow-hidden border-b border-r border-slate-300 p-1.5 2xl:p-2 ${isToday ? 'bg-[#e8f7f4] shadow-[inset_0_0_0_3px_#0f6863]' : isCurrentMonth ? 'bg-white' : 'bg-slate-100'}`}
                aria-label={`${date.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long' })}, ${dayMeetings.length} rapat`}
              >
                <div className="mb-1 flex shrink-0 h-6 items-center justify-between gap-2 px-0.5 2xl:h-7">
                  <span className={`grid h-6 min-w-6 place-items-center text-base font-bold tabular-nums 2xl:h-7 2xl:min-w-7 2xl:text-lg ${isToday ? 'rounded-full bg-[#0f6863] text-white' : isCurrentMonth ? 'text-slate-900' : 'text-slate-400'}`}>
                    {date.getDate()}
                  </span>
                  {dayMeetings.length > 0 && (
                    <span className="truncate text-[11px] font-bold text-slate-500 2xl:text-sm">{dayMeetings.length} rapat</span>
                  )}
                </div>

                {dayMeetings.length > 0 && (
                  <div className="space-y-1 flex-1 overflow-y-auto overflow-x-hidden no-scrollbar">
                    {dayMeetings.map((meeting) => (
                      <CalendarMeeting key={meeting.id} meeting={meeting} now={clockTime} />
                    ))}
                  </div>
                )}
              </article>
            );
          })}
        </div>

        <div className="mt-2 flex h-5 shrink-0 items-center justify-between text-xs font-semibold text-slate-600 2xl:mt-3 2xl:text-sm">
          <p>{connectionError ? 'Koneksi terputus, menampilkan data terakhir' : loading ? 'Memperbarui kalender...' : 'Kalender diperbarui otomatis setiap 3 menit'}</p>
          <p>{meetings.length} rapat pada rentang kalender</p>
        </div>
      </section>
    </main>
  );
}

function CalendarMeeting({ meeting, now }: { meeting: MeetingItem; now: Date }) {
  const status = getMeetingStatus(meeting as MeetingTimeLike, now);

  return (
    <div className={`min-w-0 overflow-hidden border-l-4 px-1.5 py-1 shadow-sm 2xl:px-2 2xl:py-1.5 ${STATUS_STYLES[status]}`}>
      <div className="flex min-w-0 items-center justify-between gap-1.5">
        <p className="shrink-0 font-mono text-[11px] font-bold tabular-nums 2xl:text-sm">{formatTime(meeting.mulai)}-{formatTime(meeting.selesai)}</p>
        <span className="truncate text-[10px] font-bold 2xl:text-xs">{STATUS_LABELS[status]}</span>
      </div>
      <p className="mt-0.5 truncate text-xs font-bold leading-tight 2xl:text-base">{meeting.topik}</p>
      <p className="mt-0.5 hidden truncate text-sm font-semibold text-slate-600 2xl:block">{meeting.ruangNama || 'Ruang belum ditentukan'}</p>
    </div>
  );
}
