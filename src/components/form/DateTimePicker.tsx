'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Calendar, ChevronLeft, ChevronRight, X } from 'lucide-react';

interface DateTimePickerProps {
  value: string; // format: "YYYY-MM-DDTHH:mm" or "YYYY-MM-DD" when mode="date"
  onChange: (value: string) => void;
  placeholder?: string;
  min?: string; // format: "YYYY-MM-DDTHH:mm"
  required?: boolean;
  mode?: 'datetime' | 'date';
  error?: boolean;
}

const DAYS = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
const MONTHS = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

function parseValue(val: string): { date: Date | null; hour: number; minute: number } {
  if (!val) return { date: null, hour: 8, minute: 0 };
  if (/^\d{4}-\d{2}-\d{2}$/.test(val)) {
    const [year, month, day] = val.split('-').map(Number);
    const d = new Date(year, month - 1, day);
    if (isNaN(d.getTime())) return { date: null, hour: 8, minute: 0 };
    return { date: d, hour: 8, minute: 0 };
  }
  const d = new Date(val);
  if (isNaN(d.getTime())) return { date: null, hour: 8, minute: 0 };
  return { date: d, hour: d.getHours(), minute: d.getMinutes() };
}

function toLocalString(date: Date, hour: number, minute: number): string {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  const hh = String(hour).padStart(2, '0');
  const mn = String(minute).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}T${hh}:${mn}`;
}

function toLocalDateString(date: Date): string {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

function formatDisplay(val: string, mode: 'datetime' | 'date' = 'datetime'): string {
  if (!val) return '';
  const { date: d } = parseValue(val);
  if (!d) return '';
  const dayName = DAYS[d.getDay()];
  const dateStr = `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
  if (mode === 'date') return `${dayName}, ${dateStr}`;
  const h = String(d.getHours()).padStart(2, '0');
  const m = String(d.getMinutes()).padStart(2, '0');
  return `${dayName}, ${dateStr}  ·  ${h}:${m}`;
}

const HOUR_OPTIONS = Array.from({ length: 24 }, (_, i) => i);
const MINUTE_OPTIONS = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55];

export default function DateTimePicker({
  value,
  onChange,
  placeholder = 'Pilih tanggal dan waktu',
  min,
  required,
  mode = 'datetime',
  error = false,
}: DateTimePickerProps) {
  const { date: parsedDate, hour: parsedHour, minute: parsedMinute } = parseValue(value);

  const [open, setOpen] = useState(false);
  const [viewYear, setViewYear] = useState(() => parsedDate?.getFullYear() ?? new Date().getFullYear());
  const [viewMonth, setViewMonth] = useState(() => parsedDate?.getMonth() ?? new Date().getMonth());
  const [selectedDate, setSelectedDate] = useState<Date | null>(parsedDate);
  const [hour, setHour] = useState(parsedHour);
  const [minute, setMinute] = useState(parsedMinute);

  const triggerRef = useRef<HTMLButtonElement>(null);
  const popupRef = useRef<HTMLDivElement>(null);
  const hourRef = useRef<HTMLDivElement>(null);
  const minuteRef = useRef<HTMLDivElement>(null);

  const [coords, setCoords] = useState<{ top: number; left: number } | null>(null);

  // Update popup coordinates based on trigger button position
  const updateCoords = useCallback(() => {
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      const popupWidth = mode === 'date' ? 280 : 440; // width of left calendar + optional time panel
      const popupHeight = mode === 'date' ? 310 : 360;

      let top = rect.bottom + window.scrollY + 6;
      let left = rect.left + window.scrollX;

      // Prevent overflow right side of screen
      if (left + popupWidth > window.innerWidth + window.scrollX) {
        left = window.innerWidth + window.scrollX - popupWidth - 16;
      }
      if (left < 16) left = 16;

      // Prevent overflow bottom side of screen
      if (rect.bottom + popupHeight > window.innerHeight) {
        // Show above trigger if there is space
        top = rect.top + window.scrollY - popupHeight - 6;
      }

      setCoords({ top, left });
    }
  }, [mode]);

  const handleToggleOpen = () => {
    if (!open) {
      updateCoords();
    }
    setOpen(o => !o);
  };

  // Update coords when opening or window changes
  useEffect(() => {
    if (open) {
      updateCoords();
      window.addEventListener('resize', updateCoords);
      window.addEventListener('scroll', updateCoords, true);
    }
    return () => {
      window.removeEventListener('resize', updateCoords);
      window.removeEventListener('scroll', updateCoords, true);
    };
  }, [open, updateCoords]);

  // Close on click outside popup or trigger
  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (
        triggerRef.current && !triggerRef.current.contains(e.target as Node) &&
        popupRef.current && !popupRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  // Sync from external value changes
  useEffect(() => {
    const { date, hour: h, minute: m } = parseValue(value);
    setSelectedDate(date);
    setHour(h);
    setMinute(m);
    if (date) {
      setViewYear(date.getFullYear());
      setViewMonth(date.getMonth());
    }
  }, [value]);

  // Scroll hour/minute into view when opening
  useEffect(() => {
    if (open) {
      setTimeout(() => {
        hourRef.current?.children[hour]?.scrollIntoView({ block: 'nearest' });
        const minuteIdx = MINUTE_OPTIONS.indexOf(minute);
        if (minuteIdx >= 0) minuteRef.current?.children[minuteIdx]?.scrollIntoView({ block: 'nearest' });
      }, 50);
    }
  }, [open, hour, minute]);

  const minDate = min ? new Date(min) : null;

  const isDateDisabled = useCallback((date: Date): boolean => {
    if (!minDate) return false;
    const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const md = new Date(minDate.getFullYear(), minDate.getMonth(), minDate.getDate());
    return d < md;
  }, [minDate]);

  // Cek apakah jam+menit tertentu berada sebelum minDate (untuk kolom menit)
  const isTimeDisabled = useCallback((h: number, m: number): boolean => {
    if (!minDate || !selectedDate) return false;
    const selected = new Date(
      selectedDate.getFullYear(),
      selectedDate.getMonth(),
      selectedDate.getDate(),
      h,
      m
    );
    return selected < minDate;
  }, [minDate, selectedDate]);

  // Cek apakah SELURUH slot menit dalam jam h sudah lewat minDate (untuk kolom jam)
  const isHourFullyDisabled = useCallback((h: number): boolean => {
    if (!minDate || !selectedDate) return false;
    // Jam dianggap disabled jika bahkan menit terakhir (55) masih sebelum minDate
    const lastSlot = new Date(
      selectedDate.getFullYear(),
      selectedDate.getMonth(),
      selectedDate.getDate(),
      h,
      MINUTE_OPTIONS[MINUTE_OPTIONS.length - 1]
    );
    return lastSlot < minDate;
  }, [minDate, selectedDate]);

  const handleSelectDate = (date: Date) => {
    if (isDateDisabled(date)) return;

    let nextHour = hour;
    let nextMinute = minute;

    if (minDate) {
      const selectedWithCurrentTime = new Date(
        date.getFullYear(),
        date.getMonth(),
        date.getDate(),
        hour,
        minute
      );

      if (selectedWithCurrentTime < minDate) {
        nextHour = minDate.getHours();

        const minMinute = minDate.getMinutes();
        nextMinute = MINUTE_OPTIONS.find((m) => m >= minMinute) ?? 55;
      }
    }

    setSelectedDate(date);
    setHour(nextHour);
    setMinute(nextMinute);

    onChange(
      mode === 'date'
        ? toLocalDateString(date)
        : toLocalString(date, nextHour, nextMinute)
    );

    if (mode === 'date') setOpen(false);
  };

  const handleHourChange = (h: number) => {
    if (isTimeDisabled(h, minute)) return;

    setHour(h);
    if (selectedDate) onChange(toLocalString(selectedDate, h, minute));
  };

  const handleMinuteChange = (m: number) => {
    if (isTimeDisabled(hour, m)) return;

    setMinute(m);
    if (selectedDate) onChange(toLocalString(selectedDate, hour, m));
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedDate(null);
    onChange('');
    setOpen(false);
  };

  // Build calendar grid
  const firstDayOfMonth = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const today = new Date();

  const prevMonth = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); }
    else setViewMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); }
    else setViewMonth(m => m + 1);
  };

  const isSelected = (day: number) => {
    if (!selectedDate) return false;
    return selectedDate.getFullYear() === viewYear &&
      selectedDate.getMonth() === viewMonth &&
      selectedDate.getDate() === day;
  };

  const isToday = (day: number) =>
    today.getFullYear() === viewYear &&
    today.getMonth() === viewMonth &&
    today.getDate() === day;

  const cells: (number | null)[] = [
    ...Array(firstDayOfMonth).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1)
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  return (
    <div className="relative w-full">
      {/* Trigger button */}
      <button
        ref={triggerRef}
        type="button"
        onClick={handleToggleOpen}
        className={`input-field w-full flex items-center gap-2.5 text-left cursor-pointer transition-all ${open ? 'border-teal-500/50 ring-2 ring-teal-500/10' : ''
          } ${!value ? 'text-slate-400 dark:text-slate-500' : 'text-slate-800 dark:text-slate-200'} ${error ? 'border-rose-500 focus:ring-rose-500/20 focus:border-rose-500' : ''
          }`}
      >
        <Calendar className={`h-4 w-4 shrink-0 ${error ? 'text-rose-500' : 'text-teal-500'}`} />
        <span className="flex-1 text-sm truncate">
          {value ? formatDisplay(value, mode) : placeholder}
        </span>
        {value && (
          <span
            role="button"
            onClick={handleClear}
            className="ml-1 p-0.5 rounded text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors shrink-0"
          >
            <X className="h-3.5 w-3.5" />
          </span>
        )}
      </button>

      {/* Hidden native input for HTML5 form validation */}
      <input type="hidden" value={value} required={required} />

      {/* Popup — Rendered outside via React Portal */}
      {open && coords && typeof document !== 'undefined' && createPortal(
        <>
          {/* Backdrop overlay 100% viewport */}
          <div
            className="fixed inset-0 z-[99999] bg-slate-950/20 dark:bg-slate-950/40 backdrop-blur-[1px] transition-opacity"
            onClick={() => setOpen(false)}
          />

          {/* Popup Container */}
          <div
            ref={popupRef}
            style={{
              position: 'absolute',
              top: `${coords.top}px`,
              left: `${coords.left}px`
            }}
            className="z-[100000] flex flex-row rounded-2xl border border-slate-200/80 dark:border-white/[0.07] bg-surface-card shadow-neu-pop overflow-hidden min-w-max animate-in fade-in-0 zoom-in-95 duration-200 ease-out origin-top-left datetime-picker-zoom"
          >
            {/* ── LEFT: Calendar ── */}
            <div className="p-4 w-[280px] shrink-0 select-none">
              {/* Month/Year nav */}
              <div className="flex items-center justify-between mb-3">
                <button
                  type="button"
                  onClick={prevMonth}
                  className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-white/[0.06] hover:text-slate-700 dark:hover:text-slate-200 transition-all"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <span className="text-sm font-bold text-slate-800 dark:text-slate-200">
                  {MONTHS[viewMonth]} {viewYear}
                </span>
                <button
                  type="button"
                  onClick={nextMonth}
                  className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-white/[0.06] hover:text-slate-700 dark:hover:text-slate-200 transition-all"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>

              {/* Day headers */}
              <div className="grid grid-cols-7 mb-1">
                {DAYS.map(d => (
                  <div key={d} className="py-1 text-center text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">
                    {d}
                  </div>
                ))}
              </div>

              {/* Day cells */}
              <div className="grid grid-cols-7 gap-0.5">
                {cells.map((day, idx) => {
                  if (day === null) return <div key={`e-${idx}`} />;
                  const thisDate = new Date(viewYear, viewMonth, day);
                  const disabled = isDateDisabled(thisDate);
                  const selected = isSelected(day);
                  const todayMark = isToday(day);
                  return (
                    <button
                      key={day}
                      type="button"
                      disabled={disabled}
                      onClick={() => !disabled && handleSelectDate(thisDate)}
                      className={[
                        'h-8 w-full flex items-center justify-center rounded-lg text-sm font-medium transition-all',
                        disabled
                          ? 'cursor-not-allowed opacity-40'
                          : 'cursor-pointer',
                        selected
                          ? 'bg-teal-500 text-white font-bold shadow-neu-accent'
                          : todayMark && !disabled
                            ? 'border border-teal-400/60 text-teal-600 dark:text-teal-400 hover:bg-teal-50 dark:hover:bg-teal-500/10'
                            : !disabled
                              ? 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/[0.06]'
                              : 'text-slate-300 dark:text-slate-600',
                      ].join(' ')}
                    >
                      {day}
                    </button>
                  );
                })}
              </div>

              {/* Selected preview */}
              <div className="mt-3 pt-3 border-t border-slate-100 dark:border-white/[0.04]">
                <p className="text-[11px] text-slate-400 dark:text-slate-500 text-center truncate">
                  {selectedDate ? formatDisplay(mode === 'date' ? toLocalDateString(selectedDate) : toLocalString(selectedDate, hour, minute), mode) : 'Pilih tanggal di atas'}
                </p>
              </div>
            </div>

            {/* ── Vertical Divider ── */}
            {mode === 'datetime' && (
              <>
                <div className="w-px bg-slate-100 dark:bg-white/[0.04] self-stretch" />

                {/* ── RIGHT: Time Picker ── */}
                <div className="p-4 w-[160px] shrink-0 flex flex-col select-none">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">Waktu</span>
                  </div>

                  {/* Digital clock display */}
                  <div className="text-center mb-3 py-2 rounded-xl bg-teal-50 dark:bg-teal-500/10">
                    <span className="text-2xl font-black tabular-nums text-teal-600 dark:text-teal-400 tracking-tight">
                      {String(hour).padStart(2, '0')}:{String(minute).padStart(2, '0')}
                    </span>
                  </div>

                  {/* Jam + Menit side by side scroll lists */}
                  <div className="flex gap-2 flex-1">
                    <div className="flex-1 flex flex-col">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1.5 text-center">Jam</p>
                      <div
                        ref={hourRef}
                        className="flex-1 overflow-y-auto overflow-x-hidden rounded-xl border border-slate-200/80 dark:border-white/[0.06] bg-surface-sunken shadow-neu-in-sm max-h-40"
                      >
                        {HOUR_OPTIONS.map(h => {
                          // Jam disabled hanya jika SEMUA slot menit di jam ini sudah lewat minDate
                          const disabled = isHourFullyDisabled(h);

                          return (
                            <button
                              key={h}
                              type="button"
                              disabled={disabled}
                              onClick={() => !disabled && handleHourChange(h)}
                              className={`w-full py-1.5 text-center text-sm font-medium transition-colors ${
                                disabled
                                  ? 'cursor-not-allowed opacity-40'
                                  : h === hour
                                    ? 'bg-teal-500 text-white font-bold'
                                    : 'text-slate-600 dark:text-slate-400 hover:bg-teal-50 dark:hover:bg-teal-500/10 hover:text-teal-700 dark:hover:text-teal-300'
                              }`}
                            >
                              {String(h).padStart(2, '0')}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div className="flex-1 flex flex-col">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1.5 text-center">Menit</p>
                      <div
                        ref={minuteRef}
                        className="flex-1 overflow-y-auto overflow-x-hidden rounded-xl border border-slate-200/80 dark:border-white/[0.06] bg-surface-sunken shadow-neu-in-sm max-h-40"
                      >
                        {MINUTE_OPTIONS.map(m => {
                          const disabled = isTimeDisabled(hour, m);

                          return (
                            <button
                              key={m}
                              type="button"
                              disabled={disabled}
                              onClick={() => !disabled && handleMinuteChange(m)}
                              className={`w-full py-1.5 text-center text-sm font-medium transition-colors ${disabled
                                  ? 'cursor-not-allowed text-slate-300 dark:text-slate-700 bg-slate-100/50 dark:bg-slate-950/40'
                                  : m === minute
                                    ? 'bg-teal-500 text-white font-bold'
                                    : 'text-slate-600 dark:text-slate-400 hover:bg-teal-50 dark:hover:bg-teal-500/10 hover:text-teal-700 dark:hover:text-teal-300'
                                }`}
                            >
                              {String(m).padStart(2, '0')}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Done button */}
                  <button
                    type="button"
                    onClick={() => setOpen(false)}
                    className="mt-3 w-full py-1.5 bg-teal-500 hover:bg-teal-600 text-white text-xs font-bold rounded-lg transition-all duration-150 shadow-neu-accent active:translate-y-px active:shadow-neu-in-sm"
                  >
                    Selesai
                  </button>
                </div>
              </>
            )}
          </div>
        </>
        , document.body
      )}
    </div>
  );
}
