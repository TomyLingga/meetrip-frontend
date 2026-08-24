// ─── Meeting status helpers ───────────────────────────────────────────────────
// The backend stores `status` but never transitions SCHEDULED → ONGOING → DONE, so
// the effective status is derived from the meeting's time window at render time.

export type MeetingEffectiveStatus = 'MENUNGGU' | 'BERLANGSUNG' | 'SELESAI' | 'DIBATALKAN';

export interface MeetingTimeLike {
  mulai: string | Date;
  selesai: string | Date;
  status?: string | null;
}

/**
 * Derive the effective status of a meeting from its time window.
 * - DIBATALKAN  : explicitly cancelled (persisted status)
 * - BERLANGSUNG : now is within [mulai, selesai]
 * - SELESAI     : selesai has passed
 * - MENUNGGU    : starts in the future
 */
export function getMeetingStatus(meeting: MeetingTimeLike, now: Date = new Date()): MeetingEffectiveStatus {
  if (meeting.status === 'CANCELLED') return 'DIBATALKAN';
  const mulai = new Date(meeting.mulai);
  const selesai = new Date(meeting.selesai);
  const t = now.getTime();
  if (t >= mulai.getTime() && t <= selesai.getTime()) return 'BERLANGSUNG';
  if (t > selesai.getTime()) return 'SELESAI';
  return 'MENUNGGU';
}

export const MEETING_STATUS_META: Record<MeetingEffectiveStatus, { label: string; badgeClass: string; dot?: boolean }> = {
  MENUNGGU: {
    label: 'Menunggu',
    badgeClass: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300',
  },
  BERLANGSUNG: {
    label: 'Berlangsung',
    badgeClass: 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300',
    dot: true,
  },
  SELESAI: {
    label: 'Selesai',
    badgeClass: 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400',
  },
  DIBATALKAN: {
    label: 'Dibatalkan',
    badgeClass: 'bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400',
  },
};

/** A meeting is finished (or cancelled) and can no longer be edited/cancelled. */
export function isMeetingFinished(meeting: MeetingTimeLike, now: Date = new Date()): boolean {
  const status = getMeetingStatus(meeting, now);
  return status === 'SELESAI' || status === 'DIBATALKAN';
}
