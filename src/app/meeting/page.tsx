'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import PageTemplate from '@/components/layout/PageTemplate';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import CustomCheckbox from '@/components/form/CustomCheckbox';
import CustomSelect from '@/components/form/CustomSelect';
import DateTimePicker from '@/components/form/DateTimePicker';
import { apiFetch, getCachedUser } from '@/utils/api';
import PaginationControls from '@/components/ui/PaginationControls';
import usePagination from '@/hooks/usePagination';
import { getMeetingStatus, MEETING_STATUS_META, isMeetingFinished } from '@/utils/meetingStatus';
import {
  CalendarDays,
  Clock,
  Plus,
  Users,
  Monitor,
  AlertTriangle,
  ShieldCheck,
  Video,
  Info,
  Calendar,
  Volume2,
  Mail,
  X,
} from 'lucide-react';
import { useAlert } from '@/context/FeedbackContext';

interface MeetingItem {
  id: string;
  topik: string;
  mulai: string;
  selesai: string;
  ruangId: string | null;
  ruangNama: string | null;
  zoomLink: string | null;
  needZoom: boolean;
  createdBy: string;
  status: 'SCHEDULED' | 'ONGOING' | 'DONE' | 'CANCELLED';
  createdByNama?: string;
  createdByJabatan?: string;
}

interface RoomItem {
  id: string;
  nama: string;
  kapasitas: number;
  lokasi: string | null;
}

const toIso = (value: string) => new Date(value).toISOString();

interface ParticipantDisplay {
  nama: string;
  email?: string | null;
  isExternal?: boolean;
}

function ParticipantChip({ participant, onRemove }: { participant: ParticipantDisplay; onRemove?: () => void }) {
  const triggerRef = useRef<HTMLSpanElement>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });

  const updatePosition = useCallback(() => {
    const rect = triggerRef.current?.getBoundingClientRect();
    if (!rect) return;
    setPosition({ top: rect.top - 8, left: rect.left + rect.width / 2 });
  }, []);

  const openDetails = () => {
    updatePosition();
    setShowDetails(true);
  };

  useEffect(() => {
    if (!showDetails) return;
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true);
    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
    };
  }, [showDetails, updatePosition]);

  return (
    <>
      <span
        ref={triggerRef}
        tabIndex={0}
        onMouseEnter={openDetails}
        onMouseLeave={() => setShowDetails(false)}
        onFocus={openDetails}
        onBlur={() => setShowDetails(false)}
        className={`inline-flex max-w-full cursor-default items-center gap-2 rounded-lg border px-2.5 py-1.5 text-xs font-bold outline-none transition-colors focus-visible:ring-2 focus-visible:ring-teal-500/40 ${
          participant.isExternal
            ? 'border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-400'
            : 'border-teal-500/20 bg-teal-500/10 text-teal-700 dark:text-teal-400'
        }`}
        aria-label={`Partisipan ${participant.nama}${participant.email ? `, ${participant.email}` : ''}`}
      >
        <span className="max-w-[180px] truncate">{participant.nama}</span>
        {onRemove && (
          <button
            type="button"
            onClick={onRemove}
            className="rounded p-0.5 text-rose-500 transition-colors hover:bg-rose-500/15"
            aria-label={`Hapus ${participant.nama}`}
          >
            <X className="h-3 w-3 stroke-[2.5]" />
          </button>
        )}
      </span>

      {showDetails && typeof document !== 'undefined' && createPortal(
        <div
          role="tooltip"
          style={{ top: position.top, left: position.left }}
          className="pointer-events-none fixed z-[200000] w-max max-w-[280px] -translate-x-1/2 -translate-y-full rounded-lg border border-slate-200 bg-surface-card px-3 py-2.5 text-left shadow-neu-pop dark:border-white/[0.1]"
        >
          <p className="max-w-[240px] break-words text-xs font-bold text-slate-900 dark:text-white">{participant.nama}</p>
          <div className="mt-1 flex items-start gap-1.5 text-[11px] text-slate-500 dark:text-slate-400">
            <Mail className="mt-0.5 h-3 w-3 shrink-0" />
            <span className="max-w-[230px] break-all">{participant.email || 'Email tidak dicantumkan'}</span>
          </div>
          <p className="mt-1.5 text-[9px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
            {participant.isExternal ? 'Tamu eksternal' : 'Partisipan internal'}
          </p>
          <span className="absolute left-1/2 top-full h-2 w-2 -translate-x-1/2 -translate-y-1/2 rotate-45 border-b border-r border-slate-200 bg-surface-card dark:border-white/[0.1]" />
        </div>,
        document.body
      )}
    </>
  );
}

export default function MeetingCalendarPage() {
  const [meetings, setMeetings] = useState<MeetingItem[]>([]);
  const [rooms, setRooms] = useState<RoomItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isBookOpen, setIsBookOpen] = useState(false);
  const [conflictWarning, setConflictWarning] = useState<string | null>(null);
  const [user, setUser] = useState<{ id: string; role: string; nama: string } | null>(null);
  const [editingMeetingId, setEditingMeetingId] = useState<string | null>(null);

  // Detail Modal States
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [detailData, setDetailData] = useState<any | null>(null);

  const [isCancelOpen, setIsCancelOpen] = useState(false);
  const [isTvConfirmOpen, setIsTvConfirmOpen] = useState(false);
  const [cancelMeetingId, setCancelMeetingId] = useState<string | null>(null);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelError, setCancelError] = useState<string | null>(null);

  const { showAlert } = useAlert();

  const [formData, setFormData] = useState({
    topik: '',
    mulai: '',
    selesai: '',
    ruangId: '',
    needSoundSystem: false,
    needZoom: false,
    zoomLink: '',
    catatan: '',
  });

  const [participants, setParticipants] = useState<{ nama: string; email: string; isExternal: boolean }[]>([]);
  const [newPart, setNewPart] = useState({ nama: '', email: '', isExternal: false });
  const [partError, setPartError] = useState<string | null>(null);
  const [minDateTime, setMinDateTime] = useState('');

  // Tab State
  const [activeTab, setActiveTab] = useState<'AGENDA' | 'HISTORY'>('AGENDA');

  // Agenda (bulan ini) filter states
  const [agendaSearch, setAgendaSearch] = useState('');
  const [agendaDateFrom, setAgendaDateFrom] = useState('');
  const [agendaDateTo, setAgendaDateTo] = useState('');

  // History States
  const [historySearch, setHistorySearch] = useState('');
  const [historyDateFrom, setHistoryDateFrom] = useState('');
  const [historyDateTo, setHistoryDateTo] = useState('');
  const [historyMeetings, setHistoryMeetings] = useState<MeetingItem[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const monthRange = useMemo(() => {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
    return { start, end };
  }, []);

  // Client-side filter for the "Agenda Bulan Ini" list (search + optional date range).
  const filteredAgenda = useMemo(() => {
    const lower = agendaSearch.trim().toLowerCase();
    const from = agendaDateFrom ? new Date(`${agendaDateFrom}T00:00:00`).getTime() : null;
    const to = agendaDateTo ? new Date(`${agendaDateTo}T23:59:59`).getTime() : null;
    return meetings.filter((m) => {
      if (lower && !(m.topik.toLowerCase().includes(lower) || (m.ruangNama || '').toLowerCase().includes(lower))) return false;
      const mulai = new Date(m.mulai).getTime();
      if (from !== null && mulai < from) return false;
      if (to !== null && mulai > to) return false;
      if (isMeetingFinished(m)) return false;
      return true;
    });
  }, [meetings, agendaSearch, agendaDateFrom, agendaDateTo]);

  const meetingPagination = usePagination(filteredAgenda);
  const historyPagination = usePagination(historyMeetings);

  // Update user session and min date limit
  useEffect(() => {
    const cachedUser = getCachedUser();
    if (cachedUser) setUser(cachedUser);
  }, []);

  useEffect(() => {
    if (isBookOpen) {
      const now = new Date();
      const yyyy = now.getFullYear();
      const mm = String(now.getMonth() + 1).padStart(2, '0');
      const dd = String(now.getDate()).padStart(2, '0');
      const hh = String(now.getHours()).padStart(2, '0');
      const minStr = `${yyyy}-${mm}-${dd}T${hh}:00`;
      setMinDateTime(minStr);
    }
  }, [isBookOpen]);

  useEffect(() => {
    loadMeetings();
    loadRooms();
  }, []);

  const [dayMeetings, setDayMeetings] = useState<any[]>([]);
  const [checkingRooms, setCheckingRooms] = useState(false);

  useEffect(() => {
    if (!formData.mulai || !formData.selesai) {
      setDayMeetings([]);
      return;
    }

    const fetchDayMeetings = async () => {
      try {
        setCheckingRooms(true);
        // Menggunakan rentang 3 hari (kemarin, hari ini, besok) untuk menghindari masalah perbedaan timezone
        const d = new Date(formData.mulai);
        const yesterday = new Date(d); yesterday.setDate(yesterday.getDate() - 1);
        const tomorrow = new Date(d); tomorrow.setDate(tomorrow.getDate() + 1);
        
        const res = await apiFetch(`/api/meeting?dateFrom=${yesterday.toISOString()}&dateTo=${tomorrow.toISOString()}`);
        // apiFetch already unwraps to json.data, so `res` is the array itself.
        if (Array.isArray(res)) {
          setDayMeetings(res);
        }
      } catch (err) {
        console.error('Gagal mengecek jadwal harian:', err);
      } finally {
        setCheckingRooms(false);
      }
    };

    const delay = setTimeout(fetchDayMeetings, 300);
    return () => clearTimeout(delay);
  }, [formData.mulai, formData.selesai]);

  const isRoomConflicted = (roomId: string) => {
    if (!formData.mulai || !formData.selesai) return false;
    const startSelected = new Date(formData.mulai).getTime();
    const endSelected = new Date(formData.selesai).getTime();

    return dayMeetings.some((m: any) => {
      if (m.status === 'CANCELLED') return false;
      if (m.ruangId !== roomId) return false;
      if (editingMeetingId && m.id === editingMeetingId) return false;

      const mStart = new Date(m.mulai).getTime();
      const mSelesai = new Date(m.selesai).getTime();

      // Overlap: mStart < endSelected && mSelesai > startSelected
      return mStart < endSelected && mSelesai > startSelected;
    });
  };

  const availableRooms = useMemo(() => {
    return rooms.map(room => ({
      ...room,
      disabled: isRoomConflicted(room.id)
    }));
  }, [rooms, dayMeetings, formData.mulai, formData.selesai, editingMeetingId]);

  // Reset selected room if it becomes conflicted
  useEffect(() => {
    if (formData.ruangId) {
      const selectedRoom = availableRooms.find(r => r.id === formData.ruangId);
      if (!selectedRoom || selectedRoom.disabled) {
        setFormData(prev => ({ ...prev, ruangId: '' }));
      }
    }
  }, [availableRooms, formData.ruangId]);

  const loadMeetings = async () => {
    try {
      setLoading(true);
      const data = await apiFetch(`/api/meeting?dateFrom=${monthRange.start.toISOString()}&dateTo=${monthRange.end.toISOString()}`);
      setMeetings(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadHistoryMeetings = async () => {
    try {
      setHistoryLoading(true);
      /*
       * Selalu kirim rentang tanggal. Tanpa filter, endpoint ini menarik SELURUH
       * tabel meeting lalu difilter di browser — dan karena `historySearch` ada di
       * dependency array, setiap ketikan mengulang tarikan itu.
       * Default: 90 hari terakhir.
       */
      const defaultFrom = new Date();
      defaultFrom.setDate(defaultFrom.getDate() - 90);
      const from = historyDateFrom ? new Date(historyDateFrom) : defaultFrom;
      const to = historyDateTo ? new Date(historyDateTo) : new Date();
      to.setHours(23, 59, 59, 999);

      let url = `/api/meeting?dateFrom=${from.toISOString()}&dateTo=${to.toISOString()}&`;
      
      const data = await apiFetch(url);
      // apiFetch already unwraps to json.data, so `data` is the array itself.
      if (Array.isArray(data)) {
        let filtered = data as MeetingItem[];
        filtered = filtered.filter(m => isMeetingFinished(m));
        if (historySearch) {
          const lower = historySearch.toLowerCase();
          filtered = filtered.filter(m => m.topik.toLowerCase().includes(lower) || (m.ruangNama && m.ruangNama.toLowerCase().includes(lower)));
        }
        setHistoryMeetings(filtered.sort((a, b) => new Date(b.mulai).getTime() - new Date(a.mulai).getTime())); // Terbaru di atas
      }
    } catch (err) {
      console.error('Gagal mengambil riwayat:', err);
    } finally {
      setHistoryLoading(false);
    }
  };

  // historySearch TIDAK ikut jadi dependency: penyaringannya client-side.
  useEffect(() => {
    if (activeTab === 'HISTORY') {
      const delay = setTimeout(loadHistoryMeetings, 500);
      return () => clearTimeout(delay);
    }
  }, [activeTab, historyDateFrom, historyDateTo]);

  const handleEdit = (m: MeetingItem) => {
    setEditingMeetingId(m.id);
    setFormData({
      topik: m.topik,
      mulai: m.mulai,
      selesai: m.selesai,
      ruangId: m.ruangId || '',
      needSoundSystem: false,
      needZoom: m.needZoom,
      zoomLink: m.zoomLink || '',
      catatan: '',
    });
    apiFetch(`/api/meeting/${m.id}`).then(res => {
      // apiFetch already unwraps to json.data, so `res` is the meeting object.
      if (res) {
        setFormData(prev => ({
          ...prev,
          needSoundSystem: res.needSoundSystem || false,
          catatan: res.catatan || '',
          ruangId: res.ruangId || ''
        }));
        if (res.meetingPartisipan) {
          setParticipants(res.meetingPartisipan.map((p: any) => ({
            nama: p.nama,
            email: p.email || '',
            isExternal: p.isExternal
          })));
        }
      }
    });
    setIsBookOpen(true);
  };

  const loadRooms = async () => {
    try {
      const data = await apiFetch('/api/master/ref-ruang-meeting');
      setRooms(data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const handleBookSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Past date check
    const now = new Date();
    if (new Date(formData.mulai) < now) {
      showAlert('Waktu mulai meeting tidak boleh di masa lalu.', 'warning');
      return;
    }

    if (conflictWarning) {
      showAlert(conflictWarning, 'error');
      return;
    }

    // Safety net: block submit if any participant email is malformed (empty is allowed).
    const invalidPart = participants.find((p) => !isValidEmail(p.email || ''));
    if (invalidPart) {
      showAlert(`Email partisipan "${invalidPart.nama}" tidak valid. Perbaiki atau kosongkan.`, 'error');
      return;
    }

    const selectedRoom = rooms.find((room) => room.id === formData.ruangId);
    const payload = {
      ...formData,
      ruangNama: selectedRoom?.nama || undefined,
      ruangId: formData.ruangId || undefined,
      zoomLink: formData.needZoom && formData.zoomLink.trim() ? formData.zoomLink.trim() : undefined,
      mulai: toIso(formData.mulai),
      selesai: toIso(formData.selesai),
      partisipan: participants.map((participant) => ({
        nama: participant.nama,
        email: participant.email?.trim() || undefined,
        isExternal: participant.isExternal,
      })),
    };

    try {
      if (editingMeetingId) {
        await apiFetch(`/api/meeting/${editingMeetingId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        showAlert('Meeting berhasil diperbarui!', 'success');
      } else {
        await apiFetch('/api/meeting', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        showAlert('Meeting berhasil disimpan!', 'success');
      }
      handleCloseModal();
      loadMeetings();
    } catch (err: any) {
      showAlert(err.message || 'Gagal menyimpan meeting', 'error');
    }
  };

  // Open Detail Modal
  const handleOpenDetail = async (meetingItem: MeetingItem) => {
    try {
      const details = await apiFetch(`/api/meeting/${meetingItem.id}`);
      setDetailData(details);
      setIsDetailOpen(true);
    } catch (err: any) {
      showAlert(err.message || 'Gagal memuat detail meeting', 'error');
    }
  };

  // Trigger Edit from Detail modal
  const handleEditFromDetail = (details: any) => {
    setIsDetailOpen(false);
    const formatLocalDate = (isoStr: string) => {
      const d = new Date(isoStr);
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      const hh = String(d.getHours()).padStart(2, '0');
      const min = String(d.getMinutes()).padStart(2, '0');
      return `${yyyy}-${mm}-${dd}T${hh}:${min}`;
    };

    setFormData({
      topik: details.topik,
      mulai: formatLocalDate(details.mulai),
      selesai: formatLocalDate(details.selesai),
      ruangId: details.ruangId || '',
      needSoundSystem: details.needSoundSystem,
      needZoom: details.needZoom,
      zoomLink: details.zoomLink || '',
      catatan: details.catatan || '',
    });
    setParticipants(details.meetingPartisipan || []);
    setEditingMeetingId(details.id);
    setIsBookOpen(true);
  };

  // Trigger Cancel from Detail modal
  const handleCancelFromDetail = (id: string) => {
    setIsDetailOpen(false);
    handleOpenCancelModal(id);
  };

  const handleOpenCancelModal = (meetingId: string) => {
    setCancelMeetingId(meetingId);
    setCancelReason('');
    setCancelError(null);
    setIsCancelOpen(true);
  };

  const handleCancelSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cancelReason.trim()) {
      setCancelError('Alasan pembatalan wajib diisi');
      return;
    }
    try {
      await apiFetch(`/api/meeting/${cancelMeetingId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: cancelReason }),
      });
      setIsCancelOpen(false);
      showAlert('Meeting berhasil dibatalkan!', 'success');
      loadMeetings();
    } catch (err: any) {
      setCancelError(err.message || 'Gagal membatalkan meeting');
      showAlert(err.message || 'Gagal membatalkan meeting', 'error');
    }
  };

  const handleCloseModal = () => {
    setIsBookOpen(false);
    setEditingMeetingId(null);
    setParticipants([]);
    setNewPart({ nama: '', email: '', isExternal: false });
    setPartError(null);
    setFormData({ topik: '', mulai: '', selesai: '', ruangId: '', needSoundSystem: false, needZoom: false, zoomLink: '', catatan: '' });
  };

  // Basic email format check. Email is optional — an empty value is always valid.
  const isValidEmail = (email: string) => {
    const trimmed = email.trim();
    if (!trimmed) return true;
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed);
  };

  const addParticipant = () => {
    if (!newPart.nama.trim()) {
      setPartError('Nama partisipan wajib diisi');
      return;
    }
    if (!isValidEmail(newPart.email)) {
      setPartError('Format email tidak valid. Kosongkan jika tidak ada.');
      return;
    }
    setPartError(null);
    setParticipants([...participants, { ...newPart, email: newPart.email.trim() }]);
    setNewPart({ nama: '', email: '', isExternal: false });
  };

  const removeParticipant = (index: number) => {
    setParticipants(participants.filter((_, i) => i !== index));
  };

  // Logic to calculate room meetings today
  const getRoomMeetingsToday = (roomId: string) => {
    const today = new Date();
    return meetings.filter(m => {
      if (!m.ruangId || m.ruangId !== roomId || m.status === 'CANCELLED') return false;
      const mDate = new Date(m.mulai);
      return mDate.getFullYear() === today.getFullYear() &&
             mDate.getMonth() === today.getMonth() &&
             mDate.getDate() === today.getDate();
    }).sort((a, b) => new Date(a.mulai).getTime() - new Date(b.mulai).getTime());
  };

  const handleOpenTvMode = () => {
    window.open('/meeting/tv', '_blank', 'noopener,noreferrer');
    setIsTvConfirmOpen(false);
  };

  const headerActions = (
    <div className="flex gap-2.5">
      <button
        type="button"
        onClick={() => setIsTvConfirmOpen(true)}
        className="btn-secondary flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold"
      >
        <Monitor className="h-4 w-4" />
        <span>Mode TV</span>
      </button>
      <Button onClick={() => setIsBookOpen(true)} className="px-4 py-2 text-xs font-bold rounded-xl">
        <Plus className="h-4 w-4" />
        <span>Booking Meeting</span>
      </Button>
    </div>
  );

  const isRoleAdmin = ['super_admin', 'admin', 'admin_meetrip'].some((r) => (user?.role || '').includes(r));

  return (
    <PageTemplate
      title="Jadwal Meeting"
      sectionTitle="Calendar of Meetings"
      description="Booking ruang, peserta internal/eksternal, Zoom, dan sound system."
      headerActions={headerActions}
    >
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3 w-full">
        {/* Table-based Agenda List (2 Columns) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
            <button 
              onClick={() => setActiveTab('AGENDA')}
              className={`px-4 py-2 text-sm font-bold border-b-2 transition-all ${activeTab === 'AGENDA' ? 'border-teal-500 text-teal-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
            >
              Agenda Bulan Ini
            </button>
            <button 
              onClick={() => setActiveTab('HISTORY')}
              className={`px-4 py-2 text-sm font-bold border-b-2 transition-all ${activeTab === 'HISTORY' ? 'border-teal-500 text-teal-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
            >
              Riwayat Meeting
            </button>
          </div>

          {activeTab === 'AGENDA' && (
            <div className="flex flex-col sm:flex-row gap-3 bg-surface-sunken/50 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
              <div className="flex-1">
                <input
                  type="text"
                  placeholder="Cari topik atau ruang..."
                  value={agendaSearch}
                  onChange={e => setAgendaSearch(e.target.value)}
                  className="w-full px-3 py-2 bg-surface-sunken border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:outline-none focus:border-teal-500 shadow-neu-in-sm"
                />
              </div>
              <div className="flex flex-1 flex-wrap items-center gap-2">
                <div className="min-w-[180px] flex-1">
                  <DateTimePicker
                    mode="date"
                    value={agendaDateFrom}
                    onChange={(value) => {
                      setAgendaDateFrom(value);
                      if (value && agendaDateTo && agendaDateTo < value) setAgendaDateTo(value);
                    }}
                    placeholder="Tanggal mulai"
                  />
                </div>
                <span className="self-center text-slate-500">-</span>
                <div className="min-w-[180px] flex-1">
                  <DateTimePicker
                    mode="date"
                    value={agendaDateTo}
                    onChange={setAgendaDateTo}
                    min={agendaDateFrom || undefined}
                    placeholder="Tanggal selesai"
                  />
                </div>
                {(agendaSearch || agendaDateFrom || agendaDateTo) && (
                  <button
                    type="button"
                    onClick={() => { setAgendaSearch(''); setAgendaDateFrom(''); setAgendaDateTo(''); }}
                    className="px-3 py-2 text-xs font-bold text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                  >
                    Reset
                  </button>
                )}
              </div>
            </div>
          )}

          {activeTab === 'HISTORY' && (
            <div className="flex flex-col sm:flex-row gap-3 bg-surface-sunken/50 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
              <div className="flex-1">
                <input
                  type="text"
                  placeholder="Cari topik atau ruang..."
                  value={historySearch}
                  onChange={e => setHistorySearch(e.target.value)}
                  className="w-full px-3 py-2 bg-surface-sunken border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:outline-none focus:border-teal-500 shadow-neu-in-sm"
                />
              </div>
              <div className="flex flex-1 flex-wrap items-center gap-2">
                <div className="min-w-[180px] flex-1">
                  <DateTimePicker
                    mode="date"
                    value={historyDateFrom}
                    onChange={(value) => {
                      setHistoryDateFrom(value);
                      if (value && historyDateTo && historyDateTo < value) setHistoryDateTo(value);
                    }}
                    placeholder="Tanggal mulai"
                  />
                </div>
                <span className="self-center text-slate-500">-</span>
                <div className="min-w-[180px] flex-1">
                  <DateTimePicker
                    mode="date"
                    value={historyDateTo}
                    onChange={setHistoryDateTo}
                    min={historyDateFrom || undefined}
                    placeholder="Tanggal selesai"
                  />
                </div>
              </div>
            </div>
          )}

          <div className="glass-panel overflow-hidden rounded-[24px]">
            <div className="border-b border-slate-200 p-5 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/10">
              <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
                {activeTab === 'AGENDA' ? `Agenda Bulan Ini (${filteredAgenda.length})` : `Riwayat Meeting (${historyMeetings.length})`}
              </h3>
            </div>

            {/* Scrollable Table Container */}
            <div className="overflow-x-auto hide-scrollbar w-full">
              <table className="w-full border-collapse text-left min-w-[950px]">
                <thead>
                  <tr className="border-b border-slate-150 dark:border-white/[0.04] bg-slate-50/20 dark:bg-white/[0.01]">
                    <th className="py-3 px-5 text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 w-12">No</th>
                    <th className="py-3 px-5 text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 w-32">Mulai</th>
                    <th className="py-3 px-5 text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 w-32">Selesai</th>
                    <th className="py-3 px-5 text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 w-48">Topik</th>
                    <th className="py-3 px-5 text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 w-48">Ruang / Link</th>
                    <th className="py-3 px-5 text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 w-40">Pendaftar</th>
                    <th className="py-3 px-5 text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 w-32">Status</th>
                    <th className="py-3 px-5 text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 text-center w-48">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-white/[0.03]">
                  {(activeTab === 'AGENDA' ? loading : historyLoading) ? (
                    Array.from({ length: 5 }).map((_, rIdx) => (
                      <tr key={`sk-${rIdx}`} className="border-b border-slate-100 dark:border-white/[0.03]">
                        {Array.from({ length: 8 }).map((__, cIdx) => {
                          const widths = ['w-6', 'w-20', 'w-20', 'w-40', 'w-28', 'w-28', 'w-20', 'w-32'];
                          return (
                            <td key={cIdx} className="py-4 px-5">
                              <div className={`h-3 rounded-full bg-slate-200 dark:bg-slate-800 animate-pulse ${widths[cIdx]}`} />
                            </td>
                          );
                        })}
                      </tr>
                    ))
                  ) : (activeTab === 'AGENDA' ? filteredAgenda : historyMeetings).length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-sm text-slate-500 dark:text-slate-400">
                        Belum ada data meeting.
                      </td>
                    </tr>
                  ) : (
                    (activeTab === 'AGENDA' ? meetingPagination : historyPagination).pageItems.map((meeting, index) => {
                      const absoluteIndex = (activeTab === 'AGENDA' ? meetingPagination : historyPagination).absoluteIndex(index);
                      const effectiveStatus = getMeetingStatus(meeting);
                      const statusMeta = MEETING_STATUS_META[effectiveStatus];
                      const finished = isMeetingFinished(meeting);

                      return (
                        <tr
                          key={meeting.id}
                          className={`hover:bg-slate-50/20 dark:hover:bg-white/[0.01] transition-colors ${
                            meeting.status === 'CANCELLED' ? 'opacity-50 line-through' : ''
                          }`}
                        >
                          <td className="py-4 px-5 text-sm font-medium text-slate-500 dark:text-slate-400">{absoluteIndex + 1}</td>
                          <td className="py-4 px-5 text-sm">
                            <div className="flex flex-col whitespace-normal">
                              <span className="font-bold text-slate-850 dark:text-white">
                                {new Date(meeting.mulai).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' })}
                              </span>
                              <span className="text-xs text-slate-500 mt-0.5 flex items-center gap-1">
                                <Clock className="h-3 w-3 shrink-0" />
                                <span>{new Date(meeting.mulai).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</span>
                              </span>
                            </div>
                          </td>
                          <td className="py-4 px-5 text-sm">
                            <div className="flex flex-col whitespace-normal">
                              <span className="font-bold text-slate-850 dark:text-white">
                                {new Date(meeting.selesai).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' })}
                              </span>
                              <span className="text-xs text-slate-500 mt-0.5 flex items-center gap-1">
                                <Clock className="h-3 w-3 shrink-0" />
                                <span>{new Date(meeting.selesai).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</span>
                              </span>
                            </div>
                          </td>
                          <td className="py-4 px-5 text-sm">
                            <div className="whitespace-normal break-words font-bold text-slate-900 dark:text-white">
                              {meeting.topik}
                            </div>
                          </td>
                          <td className="py-4 px-5 text-sm">
                            <div className="flex flex-col gap-1 whitespace-normal">
                              <span className="font-medium text-slate-700 dark:text-slate-350 line-clamp-2 break-words" title={meeting.ruangNama || 'Tanpa ruang'}>
                                {meeting.ruangNama || 'Tanpa ruang'}
                              </span>
                              {meeting.needZoom && meeting.zoomLink && (
                                <a
                                  href={meeting.zoomLink}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="inline-flex items-center gap-1 text-[11px] text-teal-600 hover:text-teal-700 dark:text-teal-400 font-semibold w-fit"
                                >
                                  <Video className="w-3.5 h-3.5" />
                                  <span>Link Zoom</span>
                                </a>
                              )}
                            </div>
                          </td>
                          <td className="py-4 px-5 text-sm">
                            <span className="text-slate-500 dark:text-slate-450 line-clamp-2 break-words" title={meeting.createdByNama || 'Karyawan Portal'}>
                              {meeting.createdByNama || 'Karyawan Portal'}
                            </span>
                          </td>
                          <td className="py-4 px-5 text-sm">
                            <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-bold ${statusMeta.badgeClass}`}>
                              {statusMeta.dot && <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-ping" />}
                              {statusMeta.label}
                            </span>
                          </td>
                          <td className="py-4 px-5 text-sm">
                            <div className="flex items-center justify-end gap-2 flex-wrap">
                              <button
                                onClick={() => handleOpenDetail(meeting)}
                                className="px-3 py-1.5 border border-slate-200/80 dark:border-white/[0.06] bg-surface-sunken text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-800 dark:hover:text-slate-200 rounded-lg text-[11px] font-black transition-all cursor-pointer focus:outline-none shadow-neu-in-sm"
                              >
                                Detail
                              </button>
                              {isRoleAdmin && !finished && (
                                <>
                                  <button
                                    onClick={() => handleEditFromDetail(meeting)}
                                    className="px-3 py-1.5 border border-amber-200/80 dark:border-amber-900/30 bg-amber-50 dark:bg-amber-900/10 text-amber-600 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-900/20 rounded-lg text-[11px] font-black transition-all cursor-pointer focus:outline-none"
                                  >
                                    Edit
                                  </button>
                                  <button
                                    onClick={() => handleOpenCancelModal(meeting.id)}
                                    className="px-3 py-1.5 border border-rose-200/80 dark:border-rose-900/30 bg-rose-50 dark:bg-rose-900/10 text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-900/20 rounded-lg text-[11px] font-black transition-all cursor-pointer focus:outline-none"
                                  >
                                    Batalkan
                                  </button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
            <PaginationControls
              currentPage={activeTab === 'AGENDA' ? meetingPagination.currentPage : historyPagination.currentPage}
              totalItems={activeTab === 'AGENDA' ? filteredAgenda.length : historyMeetings.length}
              pageSize={activeTab === 'AGENDA' ? meetingPagination.pageSize : historyPagination.pageSize}
              onPageChange={activeTab === 'AGENDA' ? meetingPagination.setCurrentPage : historyPagination.setCurrentPage}
              onPageSizeChange={activeTab === 'AGENDA' ? meetingPagination.setPageSize : historyPagination.setPageSize}
            />
          </div>
        </div>

        {/* Room Reference list (1 Column) - Only Available Rooms Today */}
        <div className="glass-panel p-5 rounded-[24px] space-y-4 h-fit">
          <div>
            <p className="text-base font-bold text-slate-800 dark:text-slate-200">Ketersediaan Ruang Hari Ini</p>
            <p className="text-xs text-slate-500 mt-0.5">Jadwal pemesanan ruangan untuk hari ini.</p>
          </div>
          <div className="space-y-3.5">
            {rooms.map((room) => {
              const todayMeetings = getRoomMeetingsToday(room.id);
              return (
                <div key={room.id} className="rounded-xl border border-slate-200 p-4 dark:border-slate-855 bg-slate-50/50 dark:bg-slate-955/30 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-bold text-sm text-slate-800 dark:text-white">{room.nama}</p>
                      <p className="mt-0.5 text-xs text-slate-500">{room.lokasi || 'Lokasi belum diisi'}</p>
                    </div>
                    <span className="inline-flex items-center gap-1 rounded-md bg-surface-card border border-slate-200 px-2 py-0.5 text-[10px] font-semibold dark:border-slate-800 text-slate-650 dark:text-slate-450 shrink-0 shadow-neu">
                      <Users className="h-3 w-3 text-teal-605" />
                      {room.kapasitas} orang
                    </span>
                  </div>

                  {/* Today's Schedule List */}
                  <div className="space-y-2 border-t border-slate-150 dark:border-slate-800/80 pt-2.5">
                    {todayMeetings.length === 0 ? (
                      <div className="inline-flex items-center gap-1.5 px-2 py-1 text-[10px] font-extrabold text-emerald-700 bg-emerald-50 dark:text-emerald-400 dark:bg-emerald-950/20 border border-emerald-250/20 rounded-lg">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-ping" />
                        Bebas Hari Ini
                      </div>
                    ) : (
                      <div className="space-y-1.5">
                        <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Jadwal Rapat:</p>
                        {todayMeetings.map((m) => {
                          const startT = new Date(m.mulai).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
                          const endT = new Date(m.selesai).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
                          return (
                            <div key={m.id} className="flex items-center justify-between text-xs bg-surface-card/60 p-2 rounded-lg border border-slate-100 dark:border-slate-850 shadow-neu-sm gap-2">
                              <span className="font-extrabold text-slate-800 dark:text-slate-200 truncate">{m.topik}</span>
                              <span className="font-black text-slate-505 dark:text-slate-405 shrink-0 font-mono text-[10px]">{startT} - {endT}</span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
            {rooms.length === 0 && (
              <div className="py-8 text-center text-xs text-slate-450 dark:text-slate-550 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50/30 dark:bg-slate-950/10">
                Tidak ada ruangan meeting terdaftar.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Detail Meeting Modal */}
      <Modal
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        title="Detail Jadwal Meeting"
        widthClassName="max-w-2xl"
      >
        {detailData && (
          <div className="space-y-5">
            <div className="space-y-2 border-b border-slate-200 dark:border-slate-850 pb-4">
              {(() => {
                const meta = MEETING_STATUS_META[getMeetingStatus(detailData)];
                return (
                  <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-bold ${meta.badgeClass}`}>
                    {meta.dot && <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-ping" />}
                    {meta.label}
                  </span>
                );
              })()}
              <h3 className="text-xl font-black text-slate-900 dark:text-white break-words">{detailData.topik}</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-start gap-3">
                <Clock className="h-5 w-5 text-slate-400 shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Waktu Meeting</p>
                  <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                    {new Date(detailData.mulai).toLocaleDateString('id-ID', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })}
                  </p>
                  <p className="text-xs text-slate-500">
                    {new Date(detailData.mulai).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} - {new Date(detailData.selesai).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Calendar className="h-5 w-5 text-slate-400 shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Ruang Pertemuan</p>
                  <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">{detailData.ruangNama || 'Tanpa ruang rapat'}</p>
                  {detailData.ruangLokasi && <p className="text-xs text-slate-500">{detailData.ruangLokasi}</p>}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-slate-100 dark:border-slate-850/40 pt-4">
              <div className="flex items-start gap-3">
                <Users className="h-5 w-5 text-slate-400 shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Didaftarkan Oleh</p>
                  <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">{detailData.createdByNama || 'Karyawan Portal'}</p>
                  {detailData.createdByJabatan && <p className="text-xs text-slate-500">{detailData.createdByJabatan}</p>}
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Info className="h-5 w-5 text-slate-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Fasilitas Tambahan</p>
                  <div className="flex flex-wrap gap-1.5">
                    {detailData.needZoom ? (
                      <span className="inline-flex items-center gap-1 rounded bg-teal-50 border border-teal-200 px-2 py-0.5 text-xs font-semibold text-teal-700 dark:bg-teal-950/40 dark:border-teal-800 dark:text-teal-300">
                        <Video className="w-3 h-3" /> Zoom Link
                      </span>
                    ) : null}
                    {detailData.needSoundSystem ? (
                      <span className="inline-flex items-center gap-1 rounded bg-indigo-50 border border-indigo-200 px-2 py-0.5 text-xs font-semibold text-indigo-700 dark:bg-indigo-950/40 dark:border-indigo-800 dark:text-indigo-300">
                        <Volume2 className="w-3 h-3" /> Sound System
                      </span>
                    ) : null}
                    {!detailData.needZoom && !detailData.needSoundSystem && (
                      <span className="text-xs text-slate-550 dark:text-slate-450">-</span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {detailData.zoomLink && (
              <div className="rounded-xl border border-teal-200 dark:border-teal-850/40 bg-teal-50/50 dark:bg-teal-950/10 p-3.5 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-[10px] font-bold text-teal-700 dark:text-teal-400 uppercase tracking-wider">Link Video Conference</p>
                  <p className="text-xs text-slate-600 dark:text-slate-400 truncate mt-0.5">{detailData.zoomLink}</p>
                </div>
                <a
                  href={detailData.zoomLink}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3.5 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold shrink-0 transition"
                >
                  Join Zoom
                </a>
              </div>
            )}

            {detailData.catatan && (
              <div className="space-y-1.5 border-t border-slate-100 dark:border-slate-850/40 pt-4">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Catatan Meeting</p>
                <p className="text-sm text-slate-650 dark:text-slate-350 bg-surface-sunken p-3 rounded-xl border border-slate-200 dark:border-slate-850/50 break-words whitespace-pre-wrap">
                  {detailData.catatan}
                </p>
              </div>
            )}

            {detailData.meetingPartisipan && detailData.meetingPartisipan.length > 0 && (
              <div className="space-y-2 border-t border-slate-100 dark:border-slate-850/40 pt-4">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Daftar Partisipan ({detailData.meetingPartisipan.length})</p>
                <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto overflow-x-hidden">
                  {detailData.meetingPartisipan.map((part: any, index: number) => (
                    <ParticipantChip key={`${part.nama}-${index}`} participant={part} />
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-end gap-2 border-t border-slate-200 dark:border-slate-850 pt-4 flex-wrap">
              {/* Tutup Button */}
              <Button type="button" onClick={() => setIsDetailOpen(false)} variant="secondary" className="px-5 py-2.5 rounded-xl font-bold text-xs">
                Tutup
              </Button>
              {/* Conditional Edit & Cancel buttons */}
              {user && (new Date(detailData.selesai) >= new Date()) && (detailData.status !== 'CANCELLED') && (isRoleAdmin || detailData.createdBy === user.id) && (
                <>
                  <Button
                    type="button"
                    onClick={() => handleCancelFromDetail(detailData.id)}
                    variant="danger"
                    className="px-5 py-2.5 rounded-xl font-bold text-xs"
                  >
                    Batalkan Meeting
                  </Button>
                  <Button
                    type="button"
                    onClick={() => handleEditFromDetail(detailData)}
                    className="px-5 py-2.5 rounded-xl font-bold text-xs"
                  >
                    Edit Jadwal
                  </Button>
                </>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* Booking Modal */}
      <Modal
        isOpen={isBookOpen}
        onClose={handleCloseModal}
        title={editingMeetingId ? 'Edit Jadwal Meeting' : 'Booking Meeting Baru'}
        widthClassName="max-w-2xl"
      >
        <form onSubmit={handleBookSubmit} className="flex flex-col max-h-[75vh]">
          <div className="flex-1 overflow-y-auto overflow-x-hidden pr-1.5 space-y-4 max-h-[55vh]">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 dark:text-slate-455 uppercase tracking-wider">Topik Meeting <span className="text-red-500">*</span></label>
              <input
                className="input-field"
                required
                placeholder="Contoh: Rapat Koordinasi Bulanan"
                value={formData.topik}
                onChange={(e) => setFormData({ ...formData, topik: e.target.value })}
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 dark:text-slate-455 uppercase tracking-wider">Deskripsi / Catatan Meeting</label>
              <textarea
                className="input-field min-h-[80px] resize-none"
                placeholder="Agenda rapat, link tautan eksternal, atau detail pendukung lainnya..."
                value={formData.catatan}
                onChange={(e) => setFormData({ ...formData, catatan: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 dark:text-slate-455 uppercase tracking-wider">Waktu Mulai <span className="text-red-500">*</span></label>
                <DateTimePicker
                  value={formData.mulai}
                  onChange={(val) => setFormData({ ...formData, mulai: val })}
                  min={minDateTime}
                  placeholder="Pilih tanggal & waktu mulai"
                  required
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 dark:text-slate-455 uppercase tracking-wider">Waktu Selesai <span className="text-red-500">*</span></label>
                <DateTimePicker
                  value={formData.selesai}
                  onChange={(val) => setFormData({ ...formData, selesai: val })}
                  min={formData.mulai || minDateTime}
                  placeholder="Pilih tanggal & waktu selesai"
                  required
                />
              </div>
            </div>

            {formData.mulai && formData.selesai ? (
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 dark:text-slate-455 uppercase tracking-wider">Pilih Ruang Rapat</label>
                {checkingRooms ? (
                  <div className="text-xs text-slate-400 italic py-2 animate-pulse">Mengecek ketersediaan ruangan...</div>
                ) : (
                  <CustomSelect
                    value={formData.ruangId}
                    onChange={(val) => setFormData({ ...formData, ruangId: val })}
                    options={[
                      { value: '', label: 'Tanpa ruang meeting (Online Only)' },
                      ...availableRooms.map(room => ({
                        value: room.id,
                        label: `${room.nama} - Kapasitas ${room.kapasitas} Orang (${room.lokasi || 'Lokasi belum diisi'})${room.disabled ? ' (Sudah dibooking pada jam tersebut)' : ''}`,
                        disabled: room.disabled
                      }))
                    ]}
                  />
                )}
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-slate-200 dark:border-slate-800 p-4 text-center bg-slate-50/50 dark:bg-slate-950/20">
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                  Silakan pilih tanggal & waktu mulai serta selesai terlebih dahulu untuk menampilkan daftar ruang rapat yang tersedia.
                </p>
              </div>
            )}

            {conflictWarning && (
              <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-bold text-red-700 dark:border-red-950/30 dark:bg-red-950/20 dark:text-red-400">
                <AlertTriangle className="h-4.5 w-4.5 shrink-0" />
                <span>{conflictWarning}</span>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3 pt-1">
              <div className="flex items-center justify-between rounded-xl border border-slate-200 dark:border-slate-855 bg-surface-sunken/50 px-4 py-3">
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-355">Gunakan Link Zoom</span>
                <CustomCheckbox
                  checked={formData.needZoom}
                  onChange={(checked) => setFormData({ ...formData, needZoom: checked })}
                />
              </div>

              <div className="flex items-center justify-between rounded-xl border border-slate-200 dark:border-slate-855 bg-surface-sunken/50 px-4 py-3">
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-355">Perlu Sound System</span>
                <CustomCheckbox
                  checked={formData.needSoundSystem}
                  onChange={(checked) => setFormData({ ...formData, needSoundSystem: checked })}
                />
              </div>
            </div>

            {formData.needZoom && (
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 dark:text-slate-455 uppercase tracking-wider">Link URL Zoom Meeting <span className="text-red-500">*</span></label>
                <input
                  className="input-field"
                  type="url"
                  required
                  placeholder="https://zoom.us/j/..."
                  value={formData.zoomLink}
                  onChange={(e) => setFormData({ ...formData, zoomLink: e.target.value })}
                />
              </div>
            )}

            <div className="space-y-3 border-t border-slate-200 dark:border-slate-855 pt-3">
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold text-slate-500 dark:text-slate-455 uppercase tracking-wider">Partisipan Meeting</p>
                <span className="text-[10px] font-bold text-slate-400">{participants.length} orang</span>
              </div>
              <div className="space-y-3">
                {/* Row 1: Nama & Email in a 2-column Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Nama Partisipan</label>
                    <input
                      className="input-field"
                      placeholder="Masukkan nama lengkap..."
                      value={newPart.nama}
                      onChange={(e) => { setNewPart({ ...newPart, nama: e.target.value }); if (partError) setPartError(null); }}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Email (Opsional)</label>
                    <input
                      className={`input-field ${partError && !isValidEmail(newPart.email) ? 'border-rose-400 focus:border-rose-500 dark:border-rose-500/60' : ''}`}
                      type="email"
                      placeholder="contoh: user@company.com..."
                      value={newPart.email}
                      onChange={(e) => { setNewPart({ ...newPart, email: e.target.value }); if (partError) setPartError(null); }}
                    />
                  </div>
                </div>

                {/* Row 2: External checkbox & Tambah Button */}
                <div className="flex items-center justify-between gap-3 pt-1">
                  <div className="flex items-center justify-between rounded-xl border border-slate-200 dark:border-slate-855 bg-slate-50 dark:bg-slate-955/50 px-4 py-2 h-10 w-fit">
                    <span className="text-xs font-semibold text-slate-705 dark:text-slate-355 mr-3">Tamu Eksternal</span>
                    <CustomCheckbox
                      checked={newPart.isExternal}
                      onChange={(checked) => setNewPart({ ...newPart, isExternal: checked })}
                    />
                  </div>
                  <Button
                    type="button"
                    onClick={addParticipant}
                    variant="secondary"
                    className="h-10 text-xs font-bold px-4 rounded-xl flex items-center gap-1.5 bg-surface-sunken hover:bg-slate-200 text-slate-700 dark:hover:bg-slate-850 dark:text-slate-300 border border-slate-200 dark:border-slate-800"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Tambah</span>
                  </Button>
                </div>

                {partError && (
                  <p className="text-[11px] font-semibold text-rose-500 dark:text-rose-400">{partError}</p>
                )}
              </div>

              {participants.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-100 dark:border-slate-850/50">
                  {participants.map((part, index) => (
                    <ParticipantChip
                      key={`${part.nama}-${index}`}
                      participant={part}
                      onRemove={() => removeParticipant(index)}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-2 border-t border-slate-200 dark:border-slate-855 pt-3 mt-4 shrink-0 flex-wrap">
            <Button type="button" onClick={handleCloseModal} variant="secondary" className="px-5 py-2.5 rounded-xl font-bold text-xs">
              Batal
            </Button>
            <Button type="submit" disabled={!!conflictWarning} className="px-5 py-2.5 rounded-xl font-bold text-xs">
              <CalendarDays className="h-4 w-4" />
              <span>{editingMeetingId ? 'Simpan Perubahan' : 'Booking Meeting'}</span>
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={isTvConfirmOpen}
        onClose={() => setIsTvConfirmOpen(false)}
        title="Buka Mode TV"
      >
        <div className="space-y-5">
          <div className="flex items-start gap-4">
            <Monitor className="mt-0.5 h-9 w-9 shrink-0 text-teal-600 dark:text-teal-400" />
            <div>
              <p className="text-sm font-bold text-slate-900 dark:text-white">Mode display publik akan dibuka di tab baru.</p>
              <p className="mt-1.5 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                Halaman ini tidak mengikuti sesi login MeeTrip maupun Portal. Jadwal akan tetap tampil dan diperbarui otomatis walaupun akun yang membukanya sudah logout.
              </p>
            </div>
          </div>

          <div className="border-y border-amber-200 bg-amber-50/70 px-1 py-3 text-sm text-amber-800 dark:border-amber-900/40 dark:bg-amber-950/20 dark:text-amber-300">
            <div className="flex items-start gap-2.5">
              <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" />
              <p>Mode TV dapat aktif 24/7. Tutup tab atau perangkat display secara manual saat tidak lagi digunakan.</p>
            </div>
          </div>

          <div className="flex justify-end gap-2 flex-wrap">
            <Button type="button" variant="secondary" onClick={() => setIsTvConfirmOpen(false)}>
              Batal
            </Button>
            <Button type="button" onClick={handleOpenTvMode}>
              <Monitor className="h-4 w-4" />
              Buka Mode TV
            </Button>
          </div>
        </div>
      </Modal>

      {/* Cancellation Modal */}
      <Modal
        isOpen={isCancelOpen}
        onClose={() => setIsCancelOpen(false)}
        title="Batalkan Jadwal Meeting"
      >
        <form onSubmit={handleCancelSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="block text-xs font-bold text-slate-500 dark:text-slate-450 uppercase tracking-wider mb-1.5">
              Mengapa meeting ini dibatalkan? <span className="text-red-500">*</span>
            </label>
            <textarea
              className="input-field min-h-[100px] resize-none"
              required
              placeholder="Contoh: Bentrok dengan agenda direksi / ditunda minggu depan..."
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
            />
          </div>

          {cancelError && (
            <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-bold text-red-700 dark:border-red-950/30 dark:bg-red-950/20 dark:text-red-400">
              <AlertTriangle className="h-4.5 w-4.5 shrink-0" />
              <span>{cancelError}</span>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2 flex-wrap">
            <Button type="button" onClick={() => setIsCancelOpen(false)} variant="secondary" className="px-5 py-2.5 rounded-xl font-bold text-xs">
              Kembali
            </Button>
            <Button type="submit" variant="danger" className="px-5 py-2.5 rounded-xl font-bold text-xs">
              Batalkan Jadwal
            </Button>
          </div>
        </form>
      </Modal>
    </PageTemplate>
  );
}
