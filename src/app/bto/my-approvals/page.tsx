'use client';

import React, { useEffect, useState, useRef } from 'react';
import PageTemplate from '@/components/layout/PageTemplate';
import SearchInput from '@/components/form/SearchInput';
import Modal from '@/components/ui/Modal';

import Button from '@/components/ui/Button';
import { apiFetch, refreshMeetripBadges, getCachedUser } from '@/utils/api';
import { useAlert } from '@/context/FeedbackContext';
import BusinessTripDetailModal from '../components/BusinessTripDetailModal';
import PaginationControls from '@/components/ui/PaginationControls';
import usePagination from '@/hooks/usePagination';
import { MeetripHelpButton } from '@/components/help/MeetripHelpGuide';
import {
  Check, RefreshCw, Info, Coins, History,
  MapPin, Clock, Briefcase, Calendar, AlertCircle
} from 'lucide-react';

type CachedUser = {
  id: string;
  nama?: string | null;
  role?: string | null;
  gradeLevel?: number | null;
  gradeKode?: string | null;
};

type BtoItem = {
  id: string;
  btoId?: string | null;
  nomorBto?: string | null;
  employeeId: string;
  employeeNama?: string | null;
  pemberiTugasId?: string | null;
  pemberiTugasNama?: string | null;
  tujuanNama: string;
  tujuanLat: string;
  tujuanLng: string;
  tujuanAlamat?: string | null;
  wilayahTipe?: 'dalam_wilayah' | 'luar_wilayah' | 'luar_negeri' | null;
  kepentingan: string;
  estBerangkat: string;
  estKembali: string;
  status: string;
  butuhDp: boolean;
  approvalRole?: string | null;
  approvalAction?: string | null;
  approvalCatatan?: string | null;
  approvedAt?: string | null;
  approvalActorNama?: string | null;
};

const shortId = (value?: string | null) => value ? value.slice(0, 8).toUpperCase() : null;

const docNumber = (value?: string | null, fallbackId?: string | null) => {
  if (value) return value;
  const compactId = shortId(fallbackId);
  return compactId ? `ID-${compactId}` : 'Belum terbit';
};

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number) {
  return new Date(year, month, 1).getDay();
}

function CustomDatePicker({
  value,
  onChange,
  placeholder
}: {
  value: string;
  onChange: (val: string) => void;
  placeholder: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentDate, setCurrentDate] = useState(() => {
    return value ? new Date(value) : new Date();
  });

  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handlePrevMonth = () => {
    setCurrentDate(prev => {
      const next = new Date(prev);
      next.setMonth(next.getMonth() - 1);
      return next;
    });
  };

  const handleNextMonth = () => {
    setCurrentDate(prev => {
      const next = new Date(prev);
      next.setMonth(next.getMonth() + 1);
      return next;
    });
  };

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const totalDays = getDaysInMonth(year, month);
  const firstDayIndex = getFirstDayOfMonth(year, month);

  const daysArray = [];
  for (let i = 0; i < firstDayIndex; i++) {
    daysArray.push(null);
  }
  for (let i = 1; i <= totalDays; i++) {
    daysArray.push(i);
  }

  const monthsList = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];

  const handleSelectDay = (day: number) => {
    const selectedDate = new Date(year, month, day);
    const offset = selectedDate.getTimezoneOffset();
    const formatted = new Date(selectedDate.getTime() - (offset * 60 * 1000)).toISOString().split('T')[0];
    onChange(formatted);
    setIsOpen(false);
  };

  const formattedValue = value
    ? new Date(value).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
    : '';

  return (
    <div className="relative w-full" ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between text-xs rounded-xl border border-slate-200 dark:border-slate-800 p-2.5 bg-surface-sunken text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-amber-500 cursor-pointer transition-all hover:bg-slate-50 dark:hover:bg-slate-950 shadow-neu-in-sm"
      >
        <span className={formattedValue ? 'font-semibold text-slate-800 dark:text-slate-200' : 'text-slate-400'}>
          {formattedValue || placeholder}
        </span>
        <Calendar className="h-4 w-4 text-slate-400" />
      </button>

      {isOpen && (
        <div className="absolute z-50 mt-2 p-3 bg-surface-card border border-slate-200 dark:border-slate-800 rounded-2xl shadow-neu-pop w-64 right-0 sm:left-0">
          <div className="flex items-center justify-between mb-3">
            <button
              type="button"
              onClick={handlePrevMonth}
              className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 cursor-pointer"
            >
              &lt;
            </button>
            <span className="text-xs font-bold text-slate-750 dark:text-slate-300">
              {monthsList[month]} {year}
            </span>
            <button
              type="button"
              onClick={handleNextMonth}
              className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 cursor-pointer"
            >
              &gt;
            </button>
          </div>

          <div className="grid grid-cols-7 gap-1 text-center mb-1 text-[10px] font-bold text-slate-400">
            <div>S</div><div>M</div><div>T</div><div>W</div><div>T</div><div>F</div><div>S</div>
          </div>

          <div className="grid grid-cols-7 gap-1">
            {daysArray.map((day, idx) => {
              if (day === null) {
                return <div key={idx} />;
              }
              const isSelected = value === `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSelectDay(day)}
                  className={`py-1 text-xs rounded-lg font-semibold text-center cursor-pointer transition-all hover:bg-amber-500/10 hover:text-amber-500 ${isSelected
                    ? 'bg-amber-500 text-white font-bold'
                    : 'text-slate-700 dark:text-slate-300'
                    }`}
                >
                  {day}
                </button>
              );
            })}
          </div>

          {value && (
            <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-800 flex justify-end">
              <button
                type="button"
                onClick={() => { onChange(''); setIsOpen(false); }}
                className="text-[10px] font-bold text-red-500 hover:text-red-655 cursor-pointer"
              >
                Hapus Filter
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function PersetujuanSayaPage() {
  const [user, setUser] = useState<any>(null);
  const [isSpdkApprover, setIsSpdkApprover] = useState<boolean>(false);
  const { showAlert } = useAlert();
  const [approvals, setApprovals] = useState<BtoItem[]>([]);
  const [historyApprovals, setHistoryApprovals] = useState<BtoItem[]>([]);
  const [myEmployeesTrips, setMyEmployeesTrips] = useState<BtoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterTab, setFilterTab] = useState<'bto' | 'spdk' | 'active' | 'history'>('active');
  const [hasDefaulted, setHasDefaulted] = useState(false);

  // Filters for Riwayat Dinas Approveku tab
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  // Detail Modal
  const [selectedBto, setSelectedBto] = useState<BtoItem | null>(null);
  const [activeTab, setActiveTab] = useState<'info' | 'dp' | 'logs'>('info');
  const [approvalLog, setApprovalLog] = useState<any[]>([]);
  const [dpDetails, setDpDetails] = useState<any>(null);
  const [dpForm, setDpForm] = useState<any[]>([]);
  const [usdRate, setUsdRate] = useState(16500);

  // Actions
  const [catatan, setCatatan] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [actionModalOpen, setActionModalOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState<'approve' | 'reject' | null>(null);

  useEffect(() => {
    const cachedUser = getCachedUser();
    if (cachedUser) setUser(cachedUser);
  }, []);

  useEffect(() => {
    if (user) {
      loadApprovals();
    }
  }, [user]);

  const loadApprovals = async () => {
    try {
      setLoading(true);
      setError(null);
      // Fetch user's personal approvals queue (PT_REVIEW or KABAG_REVIEW)
      const data = await apiFetch('/api/bto/approvals?all=false');
      setApprovals(data || []);

      // Fetch approval history
      const historyData = await apiFetch('/api/bto/approvals/history');
      setHistoryApprovals(historyData || []);

      const currentUser = user || getCachedUser();
      if (currentUser) {
        // Fetch BTOs list to get subordinates' BTOs
        const allBtoRes = await apiFetch('/api/bto?limit=1000');
        if (allBtoRes && allBtoRes.rows) {
          const subordinatesBtos = allBtoRes.rows.filter((b: any) => b.employeeId !== currentUser.id);
          setMyEmployeesTrips(subordinatesBtos);
        }

        try {
          const approverRes = await apiFetch('/api/spdk/is-approver');
          if (approverRes && typeof approverRes.isApprover === 'boolean') {
            setIsSpdkApprover(approverRes.isApprover);
          }
        } catch (e) {
          console.error("Gagal mengecek status approver SPDK", e);
        }
      }
    } catch (err: any) {
      console.error(err);
      setError('Gagal memuat daftar persetujuan Anda.');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDetail = async (btoItem: BtoItem) => {
    const targetBtoId = btoItem.btoId || btoItem.id;
    setSelectedBto(btoItem);
    setActiveTab('info');
    setCatatan('');
    setDpDetails(null);
    setDpForm([]);

    // Load logs
    try {
      const detail = await apiFetch(`/api/bto/${targetBtoId}`);
      setApprovalLog(detail.approvalLogs || []);
      // If BTO detail has butuhDp, update select state if missing in log item
      if (detail && detail.butuhDp) {
        btoItem.butuhDp = true;
      }
    } catch (err) {
      console.error(err);
      setApprovalLog([]);
    }

    // Load DP if exists
    if (btoItem.butuhDp) {
      try {
        const dp = await apiFetch(`/api/dp/bto/${targetBtoId}`);
        setDpDetails(dp);
        setDpForm(dp.dpRincian || []);
        setUsdRate(Number(dp.kursUsd) || 16500);
      } catch (err) {
        console.error(err);
        setDpDetails(null);
        setDpForm([]);
      }
    }
  };

  const confirmAction = (action: 'approve' | 'reject') => {
    if (!selectedBto) return;
    setPendingAction(action);
    setCatatan('');
    setActionModalOpen(true);
  };

  const executeAction = async () => {
    if (!selectedBto || !pendingAction) return;

    if (!catatan.trim()) {
      showAlert('Catatan wajib diisi untuk persetujuan atau penolakan.', 'warning');
      return;
    }

    try {
      setSubmitting(true);
      let endpoint = '';

      if (selectedBto!.status === 'PT_REVIEW') {
        endpoint = `/api/bto/${selectedBto!.id}/approve-pt`;
      } else if (selectedBto!.status === 'KABAG_REVIEW') {
        const spdkRow = await apiFetch(`/api/spdk/bto/${selectedBto!.id}`);
        endpoint = `/api/spdk/${spdkRow.id}/approve-kabag`;
      } else {
        showAlert('Status tidak valid untuk persetujuan personal.', 'error');
        return;
      }

      const body = {
        aksi: pendingAction,
        catatan
      };

      await apiFetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      showAlert('Persetujuan berhasil diproses!', 'success');
      setActionModalOpen(false);
      setSelectedBto(null);
      loadApprovals();
      refreshMeetripBadges();
    } catch (err: any) {
      console.error(err);
      showAlert(err.message || 'Gagal memproses persetujuan.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const formatMoney = (val: any, useDollar: boolean = false) => {
    const num = Number(val) || 0;
    if (useDollar) {
      return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(num);
    }
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(num);
  };

  // Merge approvals queue and all BTOs (excluding user's own BTOs)
  const allSubordinateTripsMap: Record<string, BtoItem> = {};

  approvals.forEach(b => {
    if (b.employeeId !== user?.id) {
      allSubordinateTripsMap[b.id] = b;
    }
  });

  myEmployeesTrips.forEach(b => {
    if (b.employeeId !== user?.id) {
      allSubordinateTripsMap[b.id] = b;
    }
  });

  historyApprovals.forEach(b => {
    const targetId = b.btoId || b.id;
    if (targetId && b.employeeId !== user?.id) {
      allSubordinateTripsMap[targetId] = {
        ...b,
        id: targetId,
      };
    }
  });

  const allSubordinateTrips = Object.values(allSubordinateTripsMap);

  const tinjauBtoList = approvals.filter(b => b.status === 'PT_REVIEW');
  const tinjauSpdkList = approvals.filter(b => b.status === 'KABAG_REVIEW');
  const dinasAktif = allSubordinateTrips.filter((b) =>
    b.status !== 'COMPLETED' &&
    b.status !== 'CANCELLED' &&
    b.status !== 'REJECTED' &&
    b.status !== 'DRAFT' &&
    b.status !== 'PT_REVIEW' &&
    b.status !== 'KABAG_REVIEW'
  );

  const userRoles = (user?.role || 'user').split(',');
  const isBom1 = user?.gradeKode === 'BOM-1';

  const showTinjauBto = true;
  const showTinjauSpdk = isSpdkApprover || tinjauSpdkList.length > 0;

  useEffect(() => {
    if (user && !hasDefaulted && approvals.length >= 0) {
      if (tinjauSpdkList.length > 0 && tinjauBtoList.length === 0) {
        setFilterTab('spdk');
      } else if (showTinjauBto) {
        setFilterTab('bto');
      } else if (showTinjauSpdk) {
        setFilterTab('spdk');
      } else {
        setFilterTab('active');
      }
      setHasDefaulted(true);
    }
  }, [user, approvals, hasDefaulted, showTinjauBto, showTinjauSpdk, tinjauSpdkList.length, tinjauBtoList.length]);

  const riwayatDinasRaw = allSubordinateTrips.filter((b) =>
    b.status === 'COMPLETED' ||
    b.status === 'CANCELLED' ||
    b.status === 'REJECTED'
  );

  const riwayatDinasFiltered = riwayatDinasRaw.filter(btoItem => {
    // Search filter
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchEmp = (btoItem.employeeNama || '').toLowerCase().includes(q);
      const matchDest = (btoItem.tujuanNama || '').toLowerCase().includes(q);
      const matchNo = (btoItem.nomorBto || '').toLowerCase().includes(q);
      if (!matchEmp && !matchDest && !matchNo) return false;
    }
    // Date filter
    if (filterStartDate) {
      const bDate = new Date(btoItem.estBerangkat);
      const sDate = new Date(filterStartDate);
      sDate.setHours(0, 0, 0, 0);
      if (bDate < sDate) return false;
    }
    if (filterEndDate) {
      const bDate = new Date(btoItem.estBerangkat);
      const eDate = new Date(filterEndDate);
      eDate.setHours(23, 59, 59, 999);
      if (bDate > eDate) return false;
    }
    // Status filter
    if (filterStatus) {
      if (btoItem.status !== filterStatus) return false;
    }
    return true;
  });

  const displayedApprovals = filterTab === 'bto'
    ? tinjauBtoList
    : filterTab === 'spdk'
      ? tinjauSpdkList
      : filterTab === 'active'
        ? dinasAktif
        : riwayatDinasFiltered;

  const searchedApprovals = displayedApprovals.filter((b: any) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      b.tujuanNama?.toLowerCase().includes(q) ||
      b.kepentingan?.toLowerCase().includes(q) ||
      b.employeeNama?.toLowerCase().includes(q) ||
      b.spdkNumber?.toLowerCase().includes(q) ||
      b.nomorBto?.toLowerCase().includes(q)
    );
  });

  const approvalsPagination = usePagination(searchedApprovals);

  return (
    <PageTemplate
      title="Butuh Persetujuan"
      sectionTitle="Manajemen Dinas"
      description="Antrean persetujuan dinas yang memerlukan tindakan Anda sebagai Pemberi Tugas atau Approver SPDK."
      headerActions={
        <div className="flex flex-wrap gap-2">
          <MeetripHelpButton topic="pemberi-tugas-review" label="Panduan Pemberi Tugas" />
          {isSpdkApprover && <MeetripHelpButton topic="kabag-review" label="Panduan Review SPDK" />}
          <Button variant="secondary" onClick={loadApprovals} loading={loading} className="gap-2">
            {!loading && <RefreshCw className="h-4 w-4" />}
            Refresh
          </Button>
        </div>
      }
    >

      {error && (
        <div className="mb-6 p-4 rounded-xl bg-red-55/15 dark:bg-red-950/20 border border-red-500/30 flex items-center gap-3 text-sm text-red-600 dark:text-red-400">
          <AlertCircle className="h-5 w-5 flex-shrink-0" />
          <p>{error}</p>
        </div>
      )}

      {loading ? (
        <div className="space-y-3">
          <div className="h-12 rounded-xl bg-slate-200 dark:bg-slate-800 animate-pulse" />
          <div className="h-12 rounded-xl bg-slate-200 dark:bg-slate-800 animate-pulse" />
          <div className="h-12 rounded-xl bg-slate-200 dark:bg-slate-800 animate-pulse" />
          <div className="h-12 rounded-xl bg-slate-200 dark:bg-slate-800 animate-pulse" />
          <div className="h-12 rounded-xl bg-slate-200 dark:bg-slate-800 animate-pulse" />
        </div>
      ) : (
        <>
          {/* Tab Filter */}
          <div className="flex border-b border-slate-200 dark:border-slate-800 mb-6 gap-2 overflow-x-auto scrollbar-none animate-in fade-in duration-200">
            {showTinjauBto && (
              <button
                type="button"
                className={`py-2.5 px-5 text-sm font-semibold border-b-2 transition-all duration-200 cursor-pointer ${filterTab === 'bto'
                    ? 'border-amber-500 text-amber-600 dark:text-amber-400'
                    : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
                  }`}
                onClick={() => setFilterTab('bto')}
              >
                Tinjau BTO
                <span className="ml-2 px-2 py-0.5 text-xs rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                  {tinjauBtoList.length}
                </span>
              </button>
            )}
            {showTinjauSpdk && (
              <button
                type="button"
                className={`py-2.5 px-5 text-sm font-semibold border-b-2 transition-all duration-200 cursor-pointer ${filterTab === 'spdk'
                    ? 'border-amber-500 text-amber-600 dark:text-amber-400'
                    : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
                  }`}
                onClick={() => setFilterTab('spdk')}
              >
                Tinjau SPDK
                <span className="ml-2 px-2 py-0.5 text-xs rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                  {tinjauSpdkList.length}
                </span>
              </button>
            )}
            <button
              type="button"
              className={`py-2.5 px-5 text-sm font-semibold border-b-2 transition-all duration-200 cursor-pointer ${filterTab === 'active'
                  ? 'border-amber-500 text-amber-600 dark:text-amber-400'
                  : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
                }`}
              onClick={() => setFilterTab('active')}
            >
              Dinas Aktif
              <span className="ml-2 px-2 py-0.5 text-xs rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                {dinasAktif.length}
              </span>
            </button>
            <button
              type="button"
              className={`py-2.5 px-5 text-sm font-semibold border-b-2 transition-all duration-200 cursor-pointer ${filterTab === 'history'
                  ? 'border-amber-500 text-amber-600 dark:text-amber-400'
                  : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
                }`}
              onClick={() => setFilterTab('history')}
            >
              Riwayat
              <span className="ml-2 px-2 py-0.5 text-xs rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                {riwayatDinasFiltered.length}
              </span>
            </button>
          </div>

          {/* Content Pane */}
          <div className="w-full space-y-4">
            {/* Custom Filter Bar for Riwayat (Tab 4) */}
            {filterTab === 'history' && (
              <div className="mb-4 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-surface-sunken/50 grid grid-cols-1 md:grid-cols-4 gap-4 items-end animate-in fade-in duration-200">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Cari Pelaksana / Tujuan</label>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Masukkan nama / tujuan..."
                    className="w-full text-xs rounded-xl border border-slate-200 dark:border-slate-800 p-2.5 bg-surface-sunken focus:outline-none focus:ring-1 focus:ring-amber-500 shadow-neu-in-sm"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Mulai Tanggal</label>
                  <CustomDatePicker
                    value={filterStartDate}
                    onChange={(val) => setFilterStartDate(val)}
                    placeholder="Pilih tanggal mulai"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Sampai Tanggal</label>
                  <CustomDatePicker
                    value={filterEndDate}
                    onChange={(val) => setFilterEndDate(val)}
                    placeholder="Pilih tanggal akhir"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Status Dinas</label>
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="w-full text-xs rounded-xl border border-slate-200 dark:border-slate-800 p-2.5 bg-surface-sunken text-slate-900 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-amber-500 cursor-pointer shadow-neu-in-sm"
                  >
                    <option value="">Semua Status Selesai</option>
                    <option value="COMPLETED">Selesai (Completed)</option>
                    <option value="CANCELLED">Dibatalkan (Cancelled)</option>
                    <option value="REJECTED">Ditolak (Rejected)</option>
                  </select>
                </div>
              </div>
            )}

            <div className="mb-4">
              <SearchInput value={searchQuery} onChange={setSearchQuery} placeholder="Cari SPDK, BTO, tujuan, pelaksana..." className="w-full sm:w-96" />
            </div>

            {searchedApprovals.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 gap-3 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 text-slate-400">
                <Check className="h-10 w-10 text-emerald-500" />
                <p className="text-sm font-semibold">Tidak ada pengajuan dinas yang ditemukan di tab ini.</p>
              </div>
            ) : (
              <div className="overflow-hidden rounded-xl border border-slate-200 bg-surface-card dark:border-slate-800 shadow-neu-sm">
                <table className="w-full">
                  <thead>
                    <tr className="bg-surface-sunken text-slate-500 dark:text-slate-400">
                      <th className="px-4 py-3 text-left text-xs font-bold uppercase">No. BTO</th>
                      <th className="px-4 py-3 text-left text-xs font-bold uppercase">Pelaksana</th>
                      <th className="px-4 py-3 text-left text-xs font-bold uppercase">Tujuan</th>
                      <th className="px-4 py-3 text-left text-xs font-bold uppercase">Tanggal Dinas</th>
                      <th className="px-4 py-3 text-left text-xs font-bold uppercase font-sans">Status Dinas</th>
                      <th className="px-4 py-3 text-center text-xs font-bold uppercase">Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {approvalsPagination.pageItems.map((btoItem) => {
                      const isPendingAction = btoItem.status === 'PT_REVIEW' || btoItem.status === 'KABAG_REVIEW';
                      return (
                        <tr key={btoItem.id} className="border-t border-slate-200 dark:border-slate-800 hover:bg-slate-100/50 dark:hover:bg-slate-950/30">
                          <td className="px-4 py-3.5 text-sm font-semibold text-slate-700 dark:text-slate-300">
                            {docNumber(btoItem.nomorBto, btoItem.btoId || btoItem.id)}
                          </td>
                          <td className="px-4 py-3.5 text-sm">
                            <p className="font-bold text-slate-800 dark:text-slate-200">{btoItem.employeeNama || 'Karyawan'}</p>
                            <p className="text-[10px] text-slate-400">{btoItem.wilayahTipe?.replace('_', ' ').toUpperCase()}</p>
                          </td>
                          <td className="px-4 py-3.5 text-sm">
                            <p className="font-bold text-slate-800 dark:text-slate-250 truncate max-w-[200px]">{btoItem.tujuanNama}</p>
                          </td>
                          <td className="px-4 py-3.5 text-sm text-slate-600 dark:text-slate-400">
                            {new Date(btoItem.estBerangkat).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })} - {new Date(btoItem.estKembali).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </td>
                          <td className="px-4 py-3.5 text-sm">
                            {isPendingAction ? (
                              <span className="inline-flex items-center gap-1 rounded bg-amber-500/10 px-2 py-0.5 text-xs font-black text-amber-600 dark:text-amber-400 border border-amber-500/20 animate-pulse">
                                Butuh Persetujuan
                              </span>
                            ) : (
                              <span className={`inline-flex items-center gap-1 rounded px-2 py-0.5 text-xs font-bold ${btoItem.status === 'COMPLETED' || btoItem.status === 'ATTENDED' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30' :
                                btoItem.status === 'REJECTED' || btoItem.status === 'CANCELLED' ? 'bg-red-50 text-red-700 dark:bg-red-950/30' :
                                  'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                                }`}>
                                {btoItem.status.replace('_', ' ')}
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3.5 text-center">
                            {isPendingAction ? (
                              <Button variant="primary" onClick={() => handleOpenDetail(btoItem)} className="gap-1.5 py-1.5 px-3 text-xs">
                                <Check className="h-3.5 w-3.5" />
                                Tinjau & Setujui
                              </Button>
                            ) : (
                              <Button variant="secondary" onClick={() => handleOpenDetail(btoItem)} className="gap-1.5 py-1.5 px-3 text-xs">
                                <Info className="h-3.5 w-3.5" />
                                Detail
                              </Button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                <PaginationControls
                  currentPage={approvalsPagination.currentPage}
                  totalItems={searchedApprovals.length}
                  pageSize={approvalsPagination.pageSize}
                  onPageChange={approvalsPagination.setCurrentPage}
                  onPageSizeChange={approvalsPagination.setPageSize}
                />
              </div>
            )}
          </div>
        </>
      )}

      <BusinessTripDetailModal
        bto={selectedBto}
        title={selectedBto && (selectedBto.status === 'PT_REVIEW' || selectedBto.status === 'KABAG_REVIEW') ? "Rincian Pengajuan Persetujuan" : "Detail Perjalanan Dinas"}
        onClose={() => setSelectedBto(null)}
        footer={selectedBto && (selectedBto.status === 'PT_REVIEW' || selectedBto.status === 'KABAG_REVIEW') ? (
          <div className="flex flex-col-reverse sm:flex-row justify-end items-center gap-2 w-full">
            <Button variant="danger" onClick={() => confirmAction('reject')} className="w-full sm:w-auto py-2">
              Tolak
            </Button>
            <Button variant="primary" onClick={() => confirmAction('approve')} className="w-full sm:w-auto py-2">
              Setujui & Approve
            </Button>
          </div>
        ) : (
          <div className="flex justify-end items-center">
            <Button variant="secondary" onClick={() => setSelectedBto(null)}>
              Tutup
            </Button>
          </div>
        )}
      />


      {/* Action Confirmation Modal */}
      <Modal isOpen={actionModalOpen} onClose={() => setActionModalOpen(false)} title="Konfirmasi Tindakan">
        <div className="space-y-4 pt-1">
          <div className="p-3.5 rounded-xl bg-teal-500/10 dark:bg-teal-950/40 border border-teal-500/20 dark:border-teal-500/30 text-xs text-slate-700 dark:text-slate-300 flex items-start gap-2.5 shadow-sm">
            <Info className="h-4 w-4 text-teal-600 dark:text-teal-400 flex-shrink-0 mt-0.5" />
            <p>
              Anda akan memberikan tindakan <strong className="text-teal-700 dark:text-teal-300 uppercase">{pendingAction}</strong> pada pengajuan BTO ini.
              {' Catatan tindakan wajib diisi.'}
            </p>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Catatan Tindakan (Wajib)</label>
            <textarea
              value={catatan}
              onChange={(e) => setCatatan(e.target.value)}
              placeholder={pendingAction === 'approve' ? 'Masukkan catatan persetujuan...' : 'Masukkan alasan penolakan...'}
              rows={3}
              className="w-full text-xs rounded-xl border border-slate-200 dark:border-slate-800 p-3 bg-surface-sunken resize-none focus:outline-none focus:ring-1 focus:ring-teal-500"
            />
          </div>

          <div className="pt-2 flex justify-end gap-2.5 flex-wrap">
            <Button variant="secondary" onClick={() => setActionModalOpen(false)} disabled={submitting}>
              Batal
            </Button>
            <Button variant="primary" onClick={executeAction} loading={submitting} disabled={!catatan.trim()}>
              Konfirmasi
            </Button>
          </div>
        </div>
      </Modal>
    </PageTemplate>
  );
}
