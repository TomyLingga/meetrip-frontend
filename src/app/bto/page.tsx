'use client';

import React, { useEffect, useState, useRef } from 'react';
import { apiFetch, openDocument, downloadDocument, getCachedUser, apiFetchRaw } from '@/utils/api';
import {
  Plus, MapPin, Compass, Info, X, FileText, Upload, Locate, AlertTriangle, Layers, Pencil, Coins,
  Calendar, Clock, Briefcase, Car, Download, User, Printer, Trash2, RefreshCw, Loader2, Banknote, CheckCircle, FileSpreadsheet
} from 'lucide-react';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import DateTimePicker from '@/components/form/DateTimePicker';
import { todayStartInputValue, toLocalDateTimeInputValue } from '@/utils/dateInput';

import SearchSelect from '@/components/form/SearchSelect';
import MapPickerModal from '@/components/form/MapPickerModal';
import BarangInput from '@/components/form/BarangInput';
import Input from '@/components/form/Input';
import DragDropUpload from '@/components/form/DragDropUpload';
import { useAlert, useConfirm } from '@/context/FeedbackContext';
import Table from '@/components/ui/Table';
import SearchInput from '@/components/form/SearchInput';
import DestinasiPerjalananGroup from '@/components/form/DestinasiPerjalananGroup';
import DetailInfoDinas from './components/DetailInfoDinas';
import DetailPanjar from './components/DetailPanjar';
import DetailSPDKGPS from './components/DetailSPDKGPS';
import DetailBTE from './components/DetailBTE';
import DocumentDownloadButton from './components/DocumentDownloadButton';
import { InputUang, formatMoneyInput, parseMoneyInput } from './components/InputUang';
import CustomCheckbox from '@/components/form/CustomCheckbox';
import { MeetripHelpButton } from '@/components/help/MeetripHelpGuide';


interface BtoItem {
  id: string;
  nomorBto: string | null;
  employeeNama?: string | null;
  spdkNumber?: string | null;
  tujuanNama: string;
  tujuanAlamat: string | null;
  tujuanLat?: string | number;
  tujuanLng?: string | number;
  wilayahTipe: 'dalam_wilayah' | 'luar_wilayah' | 'luar_negeri' | null;
  kepentingan: string;
  status: string;
  estBerangkat: string;
  estKembali: string;
  jarakKm: string | null;
  butuhDp: boolean;
  pemberiTugasId?: string | null;
  pemberiTugasNama: string | null;
  employeeId: string;
  transportId?: string | null;
  estimasiWaktuMenit?: number | null;
  barang?: string | null;
  lampiranPath?: string | null;
  lampiranNama?: string | null;
}

const defaultTransports = [
  { id: '0b6f1b8d-85d2-41e9-a443-2845a428f391', tipe: 'perusahaan', label: 'Transportasi Perusahaan' },
  { id: '8e0c0b8e-4ce6-478b-9db2-98b5228b6f4c', tipe: 'publik', label: 'Transportasi Publik' },
  { id: 'cdd7f9b2-fc99-4cd8-b0d7-0fe5f17a5b1f', tipe: 'pesawat', label: 'Pesawat' },
];

const getWilayahLabel = (type: string) => {
  switch (type) {
    case 'dalam_wilayah': return 'Dalam Wilayah';
    case 'luar_wilayah': return 'Luar Wilayah';
    case 'luar_negeri': return 'Luar Negeri';
    default: return type || '-';
  }
};

const isPaguUnlimited = (pagu: any) => pagu?.isUnlimited === true || pagu?.nilaiLimit === null;

const hasEnforcedPaguLimit = (pagu: any) => (
  !isPaguUnlimited(pagu)
  && pagu?.hasPagu !== false
  && Number(pagu?.nilaiLimit) > 0
);

const parseMinutesToDetailedTime = (totalMinutes: number) => {
  if (!totalMinutes || totalMinutes <= 0) return '';
  const minutesInHour = 60;
  const minutesInDay = 24 * 60;
  const minutesInMonth = 30 * 24 * 60; // 30 hari

  let temp = totalMinutes;
  const months = Math.floor(temp / minutesInMonth);
  temp %= minutesInMonth;

  const days = Math.floor(temp / minutesInDay);
  temp %= minutesInDay;

  const hours = Math.floor(temp / minutesInHour);
  const minutes = temp % minutesInHour;

  const parts = [];
  if (months > 0) parts.push(`${months} Bulan`);
  if (days > 0) parts.push(`${days} Hari`);
  if (hours > 0) parts.push(`${hours} Jam`);
  if (minutes > 0) parts.push(`${minutes} Menit`);

  return parts.join(' ');
};

function DestinationPinPicker({
  lat,
  lng,
  onChange,
}: {
  lat: number;
  lng: number;
  onChange: (next: { lat: number; lng: number }) => void;
}) {
  const minLat = -11.2;
  const maxLat = 6.3;
  const minLng = 94.5;
  const maxLng = 141.1;
  const x = Math.min(100, Math.max(0, ((lng - minLng) / (maxLng - minLng)) * 100));
  const y = Math.min(100, Math.max(0, ((maxLat - lat) / (maxLat - minLat)) * 100));

  const handlePick = (event: React.MouseEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const clickX = Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width));
    const clickY = Math.min(1, Math.max(0, (event.clientY - rect.top) / rect.height));
    onChange({
      lat: Number((maxLat - clickY * (maxLat - minLat)).toFixed(6)),
      lng: Number((minLng + clickX * (maxLng - minLng)).toFixed(6)),
    });
  };

  return (
    <div className="space-y-2">
      <div
        role="button"
        tabIndex={0}
        onClick={handlePick}
        className="relative h-56 overflow-hidden rounded-xl border border-slate-200 bg-[#dfeee7] dark:border-slate-800 dark:bg-slate-900"
      >
        <div className="absolute inset-0 opacity-80">
          <div className="absolute left-[12%] top-[44%] h-14 w-44 rotate-[-10deg] rounded-full bg-emerald-300/70 blur-sm" />
          <div className="absolute left-[45%] top-[36%] h-10 w-56 rotate-[8deg] rounded-full bg-emerald-400/60 blur-sm" />
          <div className="absolute left-[24%] top-[62%] h-8 w-36 rotate-[16deg] rounded-full bg-emerald-500/50 blur-sm" />
          <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(15,23,42,.08)_1px,transparent_1px),linear-gradient(0deg,rgba(15,23,42,.08)_1px,transparent_1px)] bg-[size:32px_32px]" />
        </div>
        <div className="absolute left-3 top-3 rounded-md bg-white/90 px-3 py-2 text-xs font-semibold text-slate-700 shadow-neu-sm dark:bg-slate-950/90 dark:text-slate-200">
          Klik peta untuk memindahkan pin tujuan
        </div>
        <div
          className="absolute -translate-x-1/2 -translate-y-full text-red-600 drop-shadow"
          style={{ left: `${x}%`, top: `${y}%` }}
        >
          <MapPin className="h-9 w-9 fill-red-100" />
        </div>
      </div>
    </div>
  );
}

function PemberiTugasDropdown({
  options,
  value,
  onChange,
}: {
  options: Array<{ id: string; namaLengkap: string; gradeKode?: string; gradeLevel?: number }>;
  value: string;
  onChange: (id: string, nama: string) => void;
}) {
  const searchSelectOptions = options.map(o => ({
    value: o.id,
    label: o.namaLengkap,
    subLabel: o.gradeKode ? `Grade ${o.gradeKode}` : o.gradeLevel ? `Level ${o.gradeLevel}` : ''
  }));

  return (
    <SearchSelect
      options={searchSelectOptions}
      value={value}
      onChange={(val) => {
        const found = options.find(o => o.id === val);
        if (found) {
          onChange(found.id, found.namaLengkap);
        }
      }}
      placeholder="Cari & pilih Pemberi Tugas..."
    />
  );
}

function TransportDropdown({
  options,
  value,
  onChange,
}: {
  options: Array<{ id: string; tipe: string; nama?: string; label?: string }>;
  value: string;
  onChange: (id: string) => void;
}) {
  const searchSelectOptions = options.map(o => ({
    value: o.id,
    label: o.label || o.nama || '',
    subLabel: o.tipe.replace(/_/g, ' ')
  }));

  return (
    <SearchSelect
      options={searchSelectOptions}
      value={value}
      onChange={onChange}
      placeholder="Cari & pilih Transportasi..."
    />
  );
}

export default function BtoListPage() {
  const [btos, setBtos] = useState<BtoItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<{ id: string; role: string; nama: string } | null>(null);

  const [dateFromFilter, setDateFromFilter] = useState('');
  const [dateToFilter, setDateToFilter] = useState('');
  const { showAlert } = useAlert();
  const { confirm } = useConfirm();

  // Modals & Forms State
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formData, setFormData] = useState({
    tujuanNama: '',
    tujuanLat: null as number | null,
    tujuanLng: null as number | null,
    kepentingan: '',
    transportId: '',
    estBerangkat: '',
    estKembali: '',
    butuhDp: false,
    pemberiTugasId: '',
    pemberiTugasNama: '',
    estimasiWaktuMenit: 0,
    barang: '',
    jarakKm: null as number | null,
    isOverrideEmployee: false,
    targetEmployeeId: '',
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [existingLampiranNama, setExistingLampiranNama] = useState<string | null>(null);

  // Map picker state
  const [mapModalOpen, setMapModalOpen] = useState(false);

  const [transports, setTransports] = useState<{ id: string; tipe: string; nama?: string; label?: string }[]>([]);
  const [pemberiTugasOptions, setPemberiTugasOptions] = useState<{ id: string; namaLengkap: string; gradeLevel: number; gradeKode?: string }[]>([]);
  const [allEmployees, setAllEmployees] = useState<{ portalUserId: string; nama: string; jabatan?: string; unitNama?: string; }[]>([]);

  // Detail Modal State
  const [selectedBto, setSelectedBto] = useState<BtoItem | null>(null);
  const [approvalLog, setApprovalLog] = useState<any[]>([]);
  const [paguList, setPaguList] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'info' | 'dp' | 'spdk' | 'bte'>('info');

  // DP form / view state
  const [dpDetails, setDpDetails] = useState<any>(null);
  const [dpForm, setDpForm] = useState<any[]>([]);
  const [usdRate, setUsdRate] = useState(16500);

  // BTE form / view state
  const [bteDetails, setBteDetails] = useState<any>(null);
  const [bteForm, setBteForm] = useState<any[]>([]);
  const [bteBiayaLain, setBteBiayaLain] = useState<any[]>([]);
  const [editingBtoId, setEditingBtoId] = useState<string | null>(null);
  const [isSubmitDirectly, setIsSubmitDirectly] = useState(false);
  const [dpValues, setDpValues] = useState<Record<string, number>>({});
  const [bteValues, setBteValues] = useState<Record<string, number>>({});
  const [kuitansiFile, setKuitansiFile] = useState<File | null>(null);

  // Added Action Modal state
  const [actionModalOpen, setActionModalOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState<'approve' | 'reject' | 'revision' | 'issue_spdk' | 'submit_bto' | 'cancel_bto' | 'mark_paid' | null>(null);
  const [catatan, setCatatan] = useState('');
  const [pendingEndpoint, setPendingEndpoint] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Real-time BTO DP estimation states
  const [createPaguList, setCreatePaguList] = useState<any[]>([]);
  const [createDpValues, setCreateDpValues] = useState<Record<string, number>>({});
  const [createUsdRate, setCreateUsdRate] = useState<number | null>(null);
  const [createWilayahTipe, setCreateWilayahTipe] = useState<string>('');
  const [createPenempatanNama, setCreatePenempatanNama] = useState<string>('');
  const [createJumlahHari, setCreateJumlahHari] = useState<number>(0);
  const [createJumlahMalam, setCreateJumlahMalam] = useState<number>(0);
  const [createJarakKm, setCreateJarakKm] = useState<number | null>(null);
  const [noPenempatanError, setNoPenempatanError] = useState(false);
  const lastGeoCoordsRef = useRef({ lat: -999, lng: -999 });

  // Attend GPS state
  const [gpsLoading, setGpsLoading] = useState(false);
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [gpsSuccess, setGpsSuccess] = useState(false);

  // File Upload State
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [reportFile, setReportFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [detailLampiranNama, setDetailLampiranNama] = useState<string | null>(null);

  useEffect(() => {
    if (selectedBto) {
      setDetailLampiranNama(selectedBto.lampiranPath ? (selectedBto.lampiranNama || 'Dokumen Lampiran BTO') : null);
      setUploadFile(null);
    } else {
      setDetailLampiranNama(null);
      setUploadFile(null);
    }
  }, [selectedBto]);

  useEffect(() => {
    const cachedUser = getCachedUser();
    if (cachedUser) setUser(cachedUser);
    loadTransports();
  }, []);

  useEffect(() => {
    if (user !== null) loadBtos();
  }, [user, dateFromFilter, dateToFilter]);

  useEffect(() => {
    if (typeof window !== 'undefined' && btos.length > 0) {
      const searchParams = new URLSearchParams(window.location.search);
      const editId = searchParams.get('edit');
      if (editId) {
        const itemToEdit = btos.find(b => b.id === editId);
        if (itemToEdit) {
          handleOpenEditBto(itemToEdit);
          window.history.replaceState({}, '', '/bto');
        }
      }
    }
  }, [btos]);



  // Fetch real-time pagu limit calculations on form BTO changes
  useEffect(() => {
    if (!formData.estBerangkat || !formData.estKembali) {
      setCreatePaguList([]);
      setCreateDpValues({});
      setCreateJumlahHari(0);
      setCreateJumlahMalam(0);
      return;
    }
    const lat = formData.tujuanLat != null ? Number(formData.tujuanLat) : 0;
    const lng = formData.tujuanLng != null ? Number(formData.tujuanLng) : 0;
    const coordsChanged = lat !== lastGeoCoordsRef.current.lat || lng !== lastGeoCoordsRef.current.lng;

    const fetchEstimatedPagu = async () => {
      try {
        const res = await apiFetch('/api/bto/hitung-pagu', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            estBerangkat: new Date(formData.estBerangkat).toISOString(),
            estKembali: new Date(formData.estKembali).toISOString(),
            tujuanLat: lat,
            tujuanLng: lng,
          })
        });
        if (res && res.paguList) {
          setCreatePaguList(res.paguList);
          if (res.wilayahTipe) {
            setCreateWilayahTipe(res.wilayahTipe);
          }
          if (res.jarakKm !== null && res.jarakKm !== undefined) {
            setCreateJarakKm(res.jarakKm);
          }
          setCreateJumlahHari(res.jumlahHari || 0);
          setCreateJumlahMalam(res.jumlahMalam || 0);
          lastGeoCoordsRef.current = { lat, lng };
          setCreateDpValues(prev => {
            const next = { ...prev };
            res.paguList.forEach((p: any) => {
              if (next[p.rincianId] === undefined) {
                next[p.rincianId] = 0;
              }
            });
            return next;
          });
        }
      } catch (err) {
        console.error('Error fetching estimated pagu:', err);
      }
    };
    fetchEstimatedPagu();
  }, [formData.estBerangkat, formData.estKembali, formData.tujuanLat, formData.tujuanLng, createWilayahTipe, editingBtoId]);


  const loadBtos = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({ limit: '500' });

      const isAdmin = user?.role?.split(',').some(r => ['admin', 'super_admin', 'sdm'].includes(r)) ?? false;
      if (user?.id && !isAdmin) {
        params.set('employeeId', user.id);
      }

      if (dateFromFilter) params.set('dateFrom', `${dateFromFilter}T00:00:00`);
      if (dateToFilter) params.set('dateTo', `${dateToFilter}T23:59:59`);

      const url = `/api/bto?${params.toString()}`;
      const data = await apiFetch(url);
      const list = data.rows || data;
      // Exclude terminal status (already handled in completed trips page)
      let activeList = list.filter((b: any) => !['COMPLETED', 'PAID', 'REJECTED'].includes(b.status));
      if (user?.id && !isAdmin) {
        activeList = activeList.filter((b: any) => b.employeeId === user.id);
      }

      // Urutkan pengajuan dinas dari yang terbaru paling atas
      activeList.sort((a: any, b: any) => {
        const timeA = new Date(a.createdAt || a.estBerangkat || 0).getTime();
        const timeB = new Date(b.createdAt || b.estBerangkat || 0).getTime();
        return timeB - timeA;
      });

      setBtos(activeList);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadTransports = async () => {
    try {
      const data = await apiFetch('/api/master/ref-transport');
      setTransports(data?.length ? data : defaultTransports);
    } catch (err) {
      console.error(err);
      setTransports(defaultTransports);
    }
  };

  const loadPemberiTugas = async () => {
    try {
      const data = await apiFetch(`/api/bto/placeholder/pemberi-tugas-options`);
      setPemberiTugasOptions((data.options || []).filter((option: any) => option.id && option.namaLengkap));
    } catch (err) {
      console.error(err);
      setPemberiTugasOptions([]);
    }
  };

  const loadAllEmployees = async () => {
    try {
      const data = await apiFetch(`/api/portal/users?limit=1000`);
      setAllEmployees((data || []).filter((option: any) => option.portalUserId && option.nama));
    } catch (err) {
      console.error(err);
      setAllEmployees([]);
    }
  };

  const handleOpenEditBto = async (btoItem: BtoItem) => {
    loadPemberiTugas();
    if (btoItem.status === 'REVISION_DP' || btoItem.status === 'REVISION') {
      try {
        const res = await apiFetch(`/api/bto/${btoItem.id}`);
        setApprovalLog(res.approvalLogs || []);
      } catch (err) {
        console.error('Failed to load logs', err);
      }
    } else {
      setApprovalLog([]);
    }
    setFormData({
      tujuanNama: btoItem.tujuanNama,
      tujuanLat: Number(btoItem.tujuanLat || -6.2),
      tujuanLng: Number(btoItem.tujuanLng || 106.8),
      kepentingan: btoItem.kepentingan,
      transportId: btoItem.transportId || '',
      estBerangkat: toLocalDateTimeInputValue(new Date(btoItem.estBerangkat)),
      estKembali: toLocalDateTimeInputValue(new Date(btoItem.estKembali)),
      butuhDp: btoItem.butuhDp,
      pemberiTugasId: btoItem.pemberiTugasId || '',
      pemberiTugasNama: btoItem.pemberiTugasNama || '',
      estimasiWaktuMenit: btoItem.estimasiWaktuMenit || 0,
      barang: btoItem.barang || '',
      jarakKm: btoItem.jarakKm ? Number(btoItem.jarakKm) : null,
      isOverrideEmployee: btoItem.employeeId !== user?.id,
      targetEmployeeId: btoItem.employeeId !== user?.id ? btoItem.employeeId : '',
    });
    setCreateJarakKm(btoItem.jarakKm ? Number(btoItem.jarakKm) : null);
    setCreateWilayahTipe(btoItem.wilayahTipe || '');
    setCreatePenempatanNama('');
    setExistingLampiranNama(btoItem.lampiranNama || null);
    setEditingBtoId(btoItem.id);
    if (btoItem.butuhDp) {
      const dp = await apiFetch(`/api/dp/bto/${btoItem.id}`).catch(() => null);
      if (dp?.exchangeRateUsd) setCreateUsdRate(Number(dp.exchangeRateUsd)); else setCreateUsdRate(null);
      if (dp?.rincian?.length) {
        const saved: Record<string, number> = {};
        dp.rincian.forEach((r: any) => {
          saved[r.rincianId] = Number(r.nilaiPerHari ?? 0);
        });
        setCreateDpValues(saved);
      }
    }
    if (user?.role?.split(',').some(r => ['admin', 'super_admin'].includes(r))) {
      loadAllEmployees();
    }
    setIsCreateOpen(true);
  };

  const handleOpenCreate = async () => {
    setErrors({});
    setFormData({
      tujuanNama: '',
      tujuanLat: null,
      tujuanLng: null,
      kepentingan: '',
      transportId: '',
      estBerangkat: '',
      estKembali: '',
      butuhDp: false,
      pemberiTugasId: '',
      pemberiTugasNama: '',
      estimasiWaktuMenit: 0,
      barang: '',
      jarakKm: null,
      isOverrideEmployee: false,
      targetEmployeeId: '',
    });
    setEditingBtoId(null);
    setIsSubmitDirectly(false);
    setSelectedFile(null);
    setExistingLampiranNama(null);
    setCreatePaguList([]);
    setCreateDpValues({});
    setCreateUsdRate(null);
    setCreateWilayahTipe('');
    setCreatePenempatanNama('');
    setCreateJumlahHari(0);
    setCreateJumlahMalam(0);
    setCreateJarakKm(null);
    setNoPenempatanError(false);

    // Check if user has an official placement location
    try {
      const penempatanRes = await apiFetch('/api/bto/my-penempatan');
      if (penempatanRes && !penempatanRes.hasPenempatan) {
        setNoPenempatanError(true);
      }
    } catch (err) {
      console.error('Failed to fetch penempatan status:', err);
    }

    loadPemberiTugas();
    if (user?.role?.split(',').some(r => ['admin', 'super_admin'].includes(r))) {
      loadAllEmployees();
    }
    setIsCreateOpen(true);
  };

  const handleCloseCreate = () => {
    setIsCreateOpen(false);
    setErrors({});
    setEditingBtoId(null);
    setIsSubmitDirectly(false);
    setSelectedFile(null);
    setCreatePaguList([]);
    setCreateDpValues({});
    setCreateUsdRate(null);
    setCreateWilayahTipe('');
    setCreatePenempatanNama('');
    setCreateJumlahHari(0);
    setCreateJumlahMalam(0);
    setCreateJarakKm(null);
    setFormData({
      tujuanNama: '',
      tujuanLat: null,
      tujuanLng: null,
      kepentingan: '',
      transportId: '',
      estBerangkat: '',
      estKembali: '',
      butuhDp: false,
      pemberiTugasId: '',
      pemberiTugasNama: '',
      estimasiWaktuMenit: 0,
      barang: '',
      jarakKm: null,
      isOverrideEmployee: false,
      targetEmployeeId: '',
    });
  };



  const handleCreateSubmit = async (e: React.FormEvent, shouldSubmitDirectly = false) => {
    e.preventDefault();
    setErrors({});
    setSubmitting(true);
    const newErrors: Record<string, string> = {};

    // 1. Destinasi Perjalanan
    if (!formData.tujuanNama) newErrors.tujuanNama = 'Nama lokasi / tujuan wajib diisi';
    if (formData.tujuanLat == null || formData.tujuanLng == null) {
      newErrors.tujuanLat = 'Titik lokasi pada peta wajib dipilih';
    }
    if (!createWilayahTipe) newErrors.wilayahTipe = 'Wilayah tujuan wajib terdeteksi dari peta';

    // 2. Detail Perjalanan Dinas
    if (!formData.transportId) newErrors.transportId = 'Transportasi wajib dipilih';
    if (!formData.estBerangkat) newErrors.estBerangkat = 'Waktu berangkat wajib diisi';
    if (!formData.estKembali) newErrors.estKembali = 'Waktu kembali wajib diisi';
    if (!formData.pemberiTugasId) newErrors.pemberiTugasId = 'Pemberi tugas wajib dipilih';
    if (!formData.estimasiWaktuMenit || formData.estimasiWaktuMenit <= 0) {
      newErrors.estimasiWaktuMenit = 'Estimasi waktu perjalanan wajib diisi (minimal 1 menit)';
    }
    if (!formData.barang) {
      newErrors.barang = 'Barang yang dibawa wajib diisi';
    }
    if (!formData.kepentingan) newErrors.kepentingan = 'Kepentingan wajib diisi';

    // 3. Lampiran
    if (!selectedFile && !existingLampiranNama) {
      newErrors.lampiran = 'Lampiran dokumen wajib diunggah';
    }
    if (formData.isOverrideEmployee && !formData.targetEmployeeId) {
      newErrors.targetEmployeeId = 'Karyawan wajib dipilih untuk override dinas';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      showAlert('Harap lengkapi semua field yang wajib diisi.', 'warning');
      setSubmitting(false);
      return;
    }

    if (shouldSubmitDirectly && !formData.butuhDp) {
      const isConfirmed = await confirm('Anda memilih untuk TIDAK mengajukan panjar (DP). Yakin ingin melanjutkan pengajuan BTO tanpa panjar?');
      if (!isConfirmed) {
        setSubmitting(false);
        return;
      }
    }


    if (formData.butuhDp) {
      if (!formData.estBerangkat || !formData.estKembali) {
        showAlert('Harap isi estimasi tanggal berangkat dan kembali untuk memuat rincian panjar.', 'warning');
        setSubmitting(false);
        return;
      }
      if (createPaguList.length === 0) {
        showAlert('Rincian estimasi panjar belum dimuat. Harap periksa kembali tanggal dan lokasi tujuan.', 'warning');
        setSubmitting(false);
        return;
      }

      // Validasi Kurs USD jika wilayah tujuan luar_negeri atau terdapat komponen USD
      if (createPaguList.some(p => p.useDollar) || createWilayahTipe === 'luar_negeri') {
        if (!createUsdRate || Number(createUsdRate) <= 0) {
          newErrors.usdRate = 'Nilai Kurs USD → IDR wajib diisi saat menggunakan mata uang USD';
          setErrors(newErrors);
          showAlert('Nilai Kurs USD → IDR wajib diisi untuk perjalanan luar negeri.', 'warning');
          setSubmitting(false);
          return;
        }
      }

      // Validasi: Jika butuh panjar, total panjar yang diminta tidak boleh 0
      const totalRequestedDp = createPaguList.reduce((sum, p) => {
        const valPerHari = createDpValues[p.rincianId] ?? 0;
        const total = valPerHari * (p.jumlahHari || 1);
        return sum + total;
      }, 0);

      if (totalRequestedDp === 0) {
        showAlert('Anda memilih membutuhkan panjar, namun semua rincian biaya panjar diisi dengan 0. Harap isi nilai panjar yang dibutuhkan atau hilangkan centang "Membutuhkan Panjar".', 'warning');
        setSubmitting(false);
        return;
      }

      // Validasi Pagu Limit: tidak boleh melebihi pagu (jika belum dikonfigurasi / limit 0, maka maks = 0)
      for (const p of createPaguList) {
        const isUnlimited = isPaguUnlimited(p);
        const hasLimit = hasEnforcedPaguLimit(p);
        const isUnconfigured = !isUnlimited && !hasLimit;
        const valPerHari = createDpValues[p.rincianId] ?? 0;
        const totalRequested = valPerHari * (p.jumlahHari || 1);
        const maxLimit = (isUnlimited || !hasLimit || Number(p.nilaiLimit || 0) <= 0) ? 0 : Number(p.nilaiLimit);

        if (!isUnlimited) {
          if (isUnconfigured && valPerHari > 0) {
            showAlert(`Rincian biaya '${p.rincianLabel}' belum dikonfigurasi pagu limitnya (Limit = 0). Nominal panjar tidak dapat diisi (> 0).`, 'warning');
            setSubmitting(false);
            return;
          }
          if (hasLimit && totalRequested > maxLimit) {
            const formattedMax = p.useDollar ? `$${maxLimit.toLocaleString()}` : `Rp ${maxLimit.toLocaleString('id-ID')}`;
            const formattedReq = p.useDollar ? `$${totalRequested.toLocaleString()}` : `Rp ${totalRequested.toLocaleString('id-ID')}`;
            showAlert(`Pengajuan panjar '${p.rincianLabel}' sebesar ${formattedReq} melebihi pagu limit (Maksimal: ${formattedMax}). Harap sesuaikan nominal panjar.`, 'warning');
            setSubmitting(false);
            return;
          }
        }
      }
    }
    try {
      // Find PT Name
      const ptObj = pemberiTugasOptions.find(o => o.id === formData.pemberiTugasId);
      const completeData = {
        ...formData,
        pemberiTugasNama: ptObj ? ptObj.namaLengkap : formData.pemberiTugasNama,
        tujuanLat: Number(formData.tujuanLat),
        tujuanLng: Number(formData.tujuanLng),
        estimasiWaktuMenit: Number(formData.estimasiWaktuMenit),
        estBerangkat: new Date(formData.estBerangkat).toISOString(),
        estKembali: new Date(formData.estKembali).toISOString(),
        jarakKm: createJarakKm,
        wilayahTipe: createWilayahTipe || null,
        lampiranPath: existingLampiranNama ? undefined : null,
        lampiranNama: existingLampiranNama ? undefined : null,
        targetEmployeeId: formData.isOverrideEmployee ? formData.targetEmployeeId : undefined,
      };

      let btoId = editingBtoId;
      if (editingBtoId) {
        await apiFetch(`/api/bto/${editingBtoId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(completeData),
        });
      } else {
        const res = await apiFetch('/api/bto', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(completeData),
        });
        btoId = res.id;
        /*
         * Segera catat id-nya: kalau langkah setelah ini gagal (upload lampiran /
         * simpan DP), tombol Simpan berikutnya harus MEMPERBARUI draf yang sudah
         * terbuat, bukan membuat BTO kedua.
         */
        setEditingBtoId(btoId);
      }

      // If there is an attachment file to upload, do it now
      if (btoId && selectedFile) {
        const body = new FormData();
        body.append('file', selectedFile);

        // apiFetch: ikut auto-refresh 401 dan melempar bila gagal, sehingga
        // lampiran yang gagal terunggah tidak lagi dilaporkan sebagai sukses.
        await apiFetch(`/api/bto/${btoId}/lampiran`, { method: 'POST', body });
      }

      // If BTO DP is required, save DP details
      if (btoId && formData.butuhDp && createPaguList.length > 0) {
        const rincianPayload = createPaguList.map(p => {
          const isUnlimited = isPaguUnlimited(p);
          const hasLimit = hasEnforcedPaguLimit(p);
          const valPerHari = createDpValues[p.rincianId] ?? 0;
          const total = valPerHari * (p.jumlahHari || 1);
          return {
            rincianId: p.rincianId,
            rincianLabel: p.rincianLabel,
            kategori: p.kategori || 'lain_lain',
            jumlahHari: p.jumlahHari || 1,
            nilaiPerHari: valPerHari,
            nilaiTotal: total,
            useDollar: p.useDollar,
            paguSaatInput: hasLimit ? p.nilaiLimit : undefined,
            isUnlimited,
          };
        });

        await apiFetch(`/api/dp/bto/${btoId}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            exchangeRateUsd: createUsdRate || undefined,
            rincian: rincianPayload
          })
        });
      }

      // Auto submit BTO immediately if requested
      if (btoId && shouldSubmitDirectly) {
        await apiFetch(`/api/bto/${btoId}/submit`, { method: 'POST' });
        showAlert('BTO berhasil diajukan!', 'success');
      } else {
        showAlert('Draf BTO berhasil disimpan!', 'success');
      }

      setIsCreateOpen(false);
      setEditingBtoId(null);
      setSelectedFile(null);
      setCreatePaguList([]);
      setCreateDpValues({});
      setCreateUsdRate(null);
      loadBtos();
    } catch (err: any) {
      showAlert(err.message || 'Gagal menyimpan BTO', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteBto = (id: string) => {
    setPendingEndpoint(`/api/bto/${id}/cancel`);
    setPendingAction('cancel_bto');
    setCatatan('');
    setActionModalOpen(true);
  };

  const handleDeleteDraftBto = async (id: string) => {
    if (!await confirm('Apakah Anda yakin ingin menghapus draft BTO ini secara permanen?')) return;
    try {
      await apiFetch(`/api/bto/${id}`, {
        method: 'DELETE',
      });
      showAlert('Draft BTO berhasil dihapus secara permanen.', 'success');
      loadBtos();
    } catch (err: any) {
      showAlert(err.message || 'Gagal menghapus draft BTO', 'error');
    }
  };

  const handleBtoClick = async (btoItem: BtoItem) => {
    setSelectedBto(btoItem);
    setActiveTab('info');
    try {
      // Load details, approval log
      const res = await apiFetch(`/api/bto/${btoItem.id}`);
      setApprovalLog(res.approvalLogs || []);

      let currentPaguList = [];
      // Load pagu options
      try {
        const pagus = await apiFetch(`/api/bto/${btoItem.id}/pagu`);
        currentPaguList = pagus.paguList || [];
        setPaguList(currentPaguList);
      } catch (err) {
        console.error('Failed to load pagu:', err);
      }

      // Initialize DP/BTE values
      const initialDp: Record<string, number> = {};
      const initialBte: Record<string, number> = {};
      currentPaguList.forEach((p: any) => {
        initialDp[p.rincianId] = 0;
        initialBte[p.rincianId] = 0;
      });
      setDpValues(initialDp);
      setBteValues(initialBte);
      setUsdRate(16500);

      // Load DP
      let resolvedDpValues: Record<string, number> = {};
      if (btoItem.butuhDp) {
        const dp = await apiFetch(`/api/dp/bto/${btoItem.id}`).catch(() => null);
        setDpDetails(dp);
        if (dp && dp.rincian) {
          setDpForm(dp.rincian);
          const savedDp: Record<string, number> = {};
          dp.rincian.forEach((r: any) => {
            savedDp[r.rincianId] = Number(r.nilaiPerHari);
            resolvedDpValues[r.rincianId] = Number(r.nilaiTotal || (Number(r.nilaiPerHari) * (r.jumlahHari || 1)));
          });
          setDpValues(prev => ({ ...prev, ...savedDp }));
          if (dp.exchangeRateUsd) setUsdRate(Number(dp.exchangeRateUsd));
        }
      }

      // Load BTE details
      const bte = await apiFetch(`/api/bte/bto/${btoItem.id}`).catch(() => null);
      setBteDetails(bte);
      if (bte) {
        setBteForm(bte.rincian || []);
        setBteBiayaLain(bte.biayaLain || []);
        const savedBte: Record<string, number> = {};
        (bte.rincian || []).forEach((r: any) => {
          savedBte[r.rincianId] = Number(r.nilaiTotal);
        });
        setBteValues(prev => ({ ...prev, ...savedBte }));
        if (bte.exchangeRateUsd) setUsdRate(Number(bte.exchangeRateUsd));
      } else {
        // Default initial BTE values to empty (0) — user fills actuals
        const defaultBteFromDp: Record<string, number> = {};
        currentPaguList.forEach((p: any) => {
          defaultBteFromDp[p.rincianId] = 0;
        });
        setBteValues(prev => ({ ...prev, ...defaultBteFromDp }));
      }

    } catch (err) {
      console.error(err);
    }
  };

  const handleBtoSubmit = (id: string) => {
    setPendingEndpoint(`/api/bto/${id}/submit`);
    setPendingAction('submit_bto');
    setCatatan('');
    setActionModalOpen(true);
  };

  const handleApprove = (endpoint: string, action: 'approve' | 'reject' | 'revision') => {
    setPendingEndpoint(endpoint);
    setPendingAction(action);
    setCatatan('');
    setActionModalOpen(true);
  };

  const executeAction = async () => {
    if (!pendingAction || !pendingEndpoint) return;

    /*
     * Backend memanggil requireCatatanTindakan() pada SETIAP aksi persetujuan
     * (approve/reject/revision/issue_spdk), bukan hanya penolakan. Dulu FE
     * menandai catatan approve sebagai opsional sehingga approver selalu kena 400.
     */
    const actionsWithoutCatatan = ['submit_bto', 'mark_paid'];
    if (!actionsWithoutCatatan.includes(pendingAction || '') && !catatan.trim()) {
      showAlert('Catatan wajib diisi untuk tindakan ini.', 'warning');
      return;
    }

    try {
      setSubmitting(true);

      let body: any = undefined;
      if (pendingAction === 'issue_spdk') {
        body = JSON.stringify({ catatanAdmin: catatan });
      } else if (['approve', 'reject', 'revision'].includes(pendingAction)) {
        body = JSON.stringify({ aksi: pendingAction, catatan });
      } else if (pendingAction === 'cancel_bto') {
        body = JSON.stringify({ catatan });
      }

      await apiFetch(pendingEndpoint, {
        method: 'POST',
        headers: body ? { 'Content-Type': 'application/json' } : undefined,
        body,
      });

      let successMsg = 'Persetujuan berhasil dikirim!';
      if (pendingAction === 'issue_spdk') successMsg = 'Nomor SPDK berhasil diterbitkan.';
      if (pendingAction === 'submit_bto') successMsg = 'BTO berhasil diajukan.';
      if (pendingAction === 'mark_paid') successMsg = 'BTE ditandai sudah dibayar!';
      if (pendingAction === 'cancel_bto') successMsg = 'Pengajuan BTO berhasil dibatalkan.';

      showAlert(successMsg, 'success');
      setActionModalOpen(false);
      setSelectedBto(null);
      loadBtos();
    } catch (err: any) {
      showAlert(err.message || 'Gagal memproses aksi', 'error');
    } finally {
      setSubmitting(false);
      setPendingAction(null);
      setPendingEndpoint('');
    }
  };

  const handleIssueSpdk = (id: string) => {
    setPendingEndpoint(`/api/spdk/bto/${id}`);
    setPendingAction('issue_spdk');
    setCatatan('');
    setActionModalOpen(true);
  };

  const handleUploadFile = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!uploadFile || !selectedBto) return;
    try {
      setUploading(true);
      const body = new FormData();
      body.append('file', uploadFile);

      const res = await apiFetchRaw(`/api/bto/${selectedBto.id}/lampiran`, { method: 'POST', body
      });
      const data = await res.json();
      if (res.ok) {
        showAlert('File berhasil diupload!', 'success');
        setSelectedBto(null);
        loadBtos();
      } else {
        showAlert(data.error || 'Gagal mengupload file', 'error');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setUploading(false);
      setUploadFile(null);
    }
  };

  const handleUploadReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reportFile || !selectedBto) return;
    try {
      setUploading(true);
      const body = new FormData();
      body.append('file', reportFile);

      const res = await apiFetchRaw(`/api/bto/${selectedBto.id}/laporan`, { method: 'POST', body
      });
      const data = await res.json();
      if (res.ok) {
        showAlert('Laporan perjalanan dinas berhasil diupload.', 'success');
        setSelectedBto(null);
        loadBtos();
      } else {
        showAlert(data.error || 'Gagal mengupload laporan', 'error');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setUploading(false);
      setReportFile(null);
    }
  };

  const uploadKuitansiFile = async () => {
    if (!selectedBto || !kuitansiFile) return null;
    const body = new FormData();
    body.append('file', kuitansiFile);
    const res = await apiFetchRaw(`/api/bte/bto/${selectedBto.id}/upload-kuitansi`, { method: 'POST', body
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Gagal mengupload kuitansi/receipt BTE');
    }
    setKuitansiFile(null);
    return data;
  };

  const handleApproveBte = (action: 'approve' | 'revision') => {
    if (!bteDetails?.id) return;
    setPendingEndpoint(`/api/bte/${bteDetails.id}/approve`);
    setPendingAction(action);
    setCatatan('');
    setActionModalOpen(true);
  };

  const handleMarkBtePaid = () => {
    if (!bteDetails?.id) return;
    setPendingEndpoint(`/api/bte/${bteDetails.id}/mark-paid`);
    setPendingAction('mark_paid');
    setCatatan('');
    setActionModalOpen(true);
  };

  const handleSaveDp = async () => {
    if (!selectedBto) return;
    try {
      // Build rincian array from form input state
      const rincianPayload = paguList.map(p => {
        const isUnlimited = isPaguUnlimited(p);
        const hasLimit = hasEnforcedPaguLimit(p);
        const valPerHari = dpValues[p.rincianId] ?? 0;
        const total = valPerHari * (p.jumlahHari || 1);
        return {
          rincianId: p.rincianId,
          rincianLabel: p.rincianLabel,
          kategori: p.kategori || 'lain_lain',
          jumlahHari: p.jumlahHari || 1,
          nilaiPerHari: valPerHari,
          nilaiTotal: total,
          useDollar: p.useDollar,
          paguSaatInput: hasLimit ? p.nilaiLimit : undefined,
          isUnlimited,
        };
      });

      await apiFetch(`/api/dp/bto/${selectedBto.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          exchangeRateUsd: usdRate || undefined,
          rincian: rincianPayload
        })
      });

      showAlert('Rencana Down Payment berhasil disimpan!', 'success');
      setSelectedBto(null);
      loadBtos();
    } catch (err: any) {
      showAlert(err.message, 'error');
    }
  };

  const handleGPSCheckIn = async () => {
    if (!selectedBto) return;
    setGpsLoading(true);
    setGpsError(null);
    setGpsSuccess(false);

    if (!navigator.geolocation) {
      setGpsError('Browser Anda tidak mendukung geolokasi');
      setGpsLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const res = await apiFetch(`/api/spdk/bto/${selectedBto.id}/attend`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              latitude: pos.coords.latitude,
              longitude: pos.coords.longitude,
              isAdminOverride: false
            })
          });
          setGpsSuccess(true);
          showAlert(`Absen berhasil. Jarak terbaca ${Math.round(Number(res?.jarakMeter || 0)).toLocaleString('id-ID')}m dari tujuan.`, 'success');
          setSelectedBto(null);
          loadBtos();
        } catch (err: any) {
          const accuracy = pos.coords.accuracy ? ` Akurasi perangkat: ±${Math.round(pos.coords.accuracy)}m.` : '';
          setGpsError(`${err.message || 'Gagal memverifikasi lokasi GPS'}${accuracy}`);
        } finally {
          setGpsLoading(false);
        }
      },
      (err) => {
        setGpsError(`Error mendapatkan lokasi: ${err.message}`);
        setGpsLoading(false);
      },
      { enableHighAccuracy: true, maximumAge: 0, timeout: 20000 }
    );
  };

  const handleSaveBte = async (isDraft: boolean = false) => {
    if (!selectedBto) return;
    try {
      if (!isDraft) {
        if (!bteDetails?.kuitansiPath && !kuitansiFile) {
          showAlert('Upload kuitansi/receipt terlebih dahulu sebelum mengajukan BTE.', 'warning');
          return;
        }

        if (!bteDetails?.laporanPath && !reportFile) {
          showAlert('Unggah Laporan Perjalanan Dinas (PDF) terlebih dahulu sebelum mengajukan BTE.', 'warning');
          return;
        }

        if (reportFile && reportFile.type !== 'application/pdf' && !reportFile.name.toLowerCase().endsWith('.pdf')) {
          showAlert('Laporan Perjalanan Dinas harus berupa file PDF.', 'warning');
          return;
        }
      } else {
        if (reportFile && reportFile.type !== 'application/pdf' && !reportFile.name.toLowerCase().endsWith('.pdf')) {
          showAlert('Laporan Perjalanan Dinas harus berupa file PDF.', 'warning');
          return;
        }
      }

      if (kuitansiFile) {
        await uploadKuitansiFile();
        showAlert('Kuitansi/receipt berhasil diupload.', 'success');
      }

      if (reportFile) {
        const body = new FormData();
        body.append('file', reportFile);
        const res = await apiFetchRaw(`/api/bte/bto/${selectedBto.id}/upload-laporan`, { method: 'POST', body
        });
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || 'Gagal mengupload Laporan Perjalanan Dinas');
        }
        setReportFile(null);
        showAlert('Laporan perjalanan dinas berhasil diupload.', 'success');
      }

      const normalizedBiayaLain = bteBiayaLain
        .map(bl => ({
          ...bl,
          keterangan: (bl.keterangan || '').trim(),
          nilai: Number(bl.nilai || 0),
        }))
        .filter(bl => bl.keterangan || bl.nilai > 0);

      if (normalizedBiayaLain.some(bl => bl.nilai > 0 && !bl.keterangan)) {
        showAlert('Keterangan biaya lain-lain wajib diisi jika nominal diisi.', 'warning');
        return;
      }
      if (normalizedBiayaLain.some(bl => bl.keterangan && bl.nilai <= 0)) {
        showAlert('Nilai biaya lain-lain wajib lebih dari 0 jika keterangan diisi.', 'warning');
        return;
      }

      const rincianPayload = paguList.map(p => {
        const val = bteValues[p.rincianId] ?? 0;
        return {
          rincianId: p.rincianId,
          rincianLabel: p.rincianLabel,
          kategori: p.kategori || 'lain_lain',
          jumlahHari: p.jumlahHari || 1,
          nilaiPerHari: Math.round(val / (p.jumlahHari || 1)),
          nilaiTotal: val,
          useDollar: p.useDollar,
          paguSaatInput: p.nilaiLimit ?? 0
        };
      });

      await apiFetch(`/api/bte/bto/${selectedBto.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          exchangeRateUsd: usdRate || undefined,
          rincian: rincianPayload,
          biayaLain: normalizedBiayaLain
        })
      });

      if (!isDraft) {
        // Submit BTE directly
        const bteObj = await apiFetch(`/api/bte/bto/${selectedBto.id}`).catch(() => null);
        if (bteObj && bteObj.id) {
          await apiFetch(`/api/bte/${bteObj.id}/submit`, { method: 'POST' });
          showAlert('Realisasi BTE berhasil diajukan ke review admin.', 'success');
        }
        setSelectedBto(null);
      } else {
        showAlert('Draft BTE berhasil disimpan.', 'success');
      }
      loadBtos();
    } catch (err: any) {
      showAlert(err.message, 'error');
    }
  };

  // Get status color gradient
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'DRAFT': return 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200 border border-slate-300/30';
      case 'ADMIN_DP_REVIEW': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-950/40 dark:text-yellow-400 border border-yellow-200/30';
      case 'PT_REVIEW': return 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950/40 dark:text-indigo-400 border border-indigo-200/30';
      case 'SDM_REVIEW': return 'bg-blue-100 text-blue-800 dark:bg-blue-950/40 dark:text-blue-400 border border-blue-200/30';
      case 'SPDK_DRAFT': return 'bg-purple-100 text-purple-800 dark:bg-purple-950/40 dark:text-purple-400 border border-purple-200/30';
      case 'KABAG_REVIEW': return 'bg-violet-100 text-violet-800 dark:bg-violet-950/40 dark:text-violet-400 border border-violet-200/30';
      case 'ACTIVE': return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200/30';
      case 'ATTENDED': return 'bg-cyan-100 text-cyan-800 dark:bg-cyan-950/40 dark:text-cyan-400 border border-cyan-200/30';
      case 'REPORT_UPLOADED': return 'bg-orange-100 text-orange-800 dark:bg-orange-950/40 dark:text-orange-400 border border-orange-200/30';
      case 'BTE_DRAFT': return 'bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-400 border border-amber-200/30';
      case 'ADMIN_BTE_REVIEW': return 'bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-400 border border-amber-200/30';
      case 'BTE_PAYMENT': return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200/30';
      case 'COMPLETED': return 'bg-teal-500/10 text-teal-600 dark:text-teal-400 border border-teal-500/30';
      case 'REJECTED': return 'bg-red-100 text-red-800 dark:bg-red-950/40 dark:text-red-400 border border-red-200/30';
      default: return 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200';
    }
  };

  const getRegionBadge = (region: BtoItem['wilayahTipe']) => {
    switch (region) {
      case 'dalam_wilayah':
        return 'bg-gradient-to-r from-emerald-500/15 to-teal-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30';
      case 'luar_wilayah':
        return 'bg-gradient-to-r from-amber-500/15 to-orange-500/15 text-amber-600 dark:text-orange-400 border border-orange-500/30';
      case 'luar_negeri':
        return 'bg-gradient-to-r from-fuchsia-500/15 to-indigo-500/15 text-fuchsia-600 dark:text-indigo-400 border border-fuchsia-500/30';
      default:
        return 'bg-slate-100 text-slate-500';
    }
  };
  const isAdmin = user?.role?.split(',').some(r => ['admin', 'super_admin'].includes(r)) ?? false;

  const btoColumns = [
    {
      header: 'Nomor BTO',
      render: (btoItem: BtoItem) => (
        <span className="font-bold text-slate-900 dark:text-white whitespace-nowrap">
          {btoItem.nomorBto || <span className="text-slate-400 font-normal italic text-xs">DRAFT</span>}
        </span>
      )
    },
    {
      header: 'Pelaksana Dinas',
      render: (btoItem: BtoItem) => (
        <div className="min-w-[120px]">
          <p className="font-semibold text-slate-800 dark:text-slate-200 text-xs truncate max-w-[150px]">
            {(btoItem as any).employeeNama || '—'}
          </p>
        </div>
      )
    },
    {
      header: 'Tujuan',
      render: (btoItem: BtoItem) => (
        <div className="min-w-[200px] max-w-[280px]">
          <p className="font-semibold text-slate-800 dark:text-slate-200 text-xs">{btoItem.tujuanNama}</p>
          {btoItem.jarakKm && <p className="text-[10px] text-slate-400 mt-0.5">{btoItem.jarakKm} km</p>}
        </div>
      )
    },
    {
      header: 'Kepentingan',
      render: (btoItem: BtoItem) => (
        <div className="min-w-[250px] max-w-[360px]">
          <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">{btoItem.kepentingan}</p>
        </div>
      )
    },
    {
      header: 'Berangkat',
      render: (btoItem: BtoItem) => (
        <span className="whitespace-nowrap text-xs text-slate-600 dark:text-slate-400">
          {new Date(btoItem.estBerangkat).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
        </span>
      )
    },
    {
      header: 'Kembali',
      render: (btoItem: BtoItem) => (
        <span className="whitespace-nowrap text-xs text-slate-600 dark:text-slate-400">
          {new Date(btoItem.estKembali).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
        </span>
      )
    },
    {
      header: 'Wilayah',
      render: (btoItem: BtoItem) => (
        btoItem.wilayahTipe ? (
          <span className={`inline-flex px-2 py-0.5 text-[10px] font-bold rounded-full uppercase tracking-wider ${getRegionBadge(btoItem.wilayahTipe)}`}>
            {btoItem.wilayahTipe.replace(/_/g, ' ')}
          </span>
        ) : <span className="text-slate-400 dark:text-slate-600">—</span>
      )
    },
    {
      header: 'Status',
      render: (btoItem: BtoItem) => (
        <span className={`inline-flex items-center px-2.5 py-0.5 text-[10px] font-extrabold rounded-full ${getStatusBadge(btoItem.status)}`}>
          {btoItem.status}
        </span>
      )
    },
    {
      header: 'Aksi',
      className: 'text-left',
      render: (btoItem: BtoItem) => {
        const isAdminUser = user?.role?.split(',').some(r => ['admin', 'super_admin'].includes(r));
        const isOwner = btoItem.employeeId === user?.id;
        const canEdit = isAdminUser || (isOwner && (btoItem.status === 'DRAFT' || btoItem.status === 'REVISION_DP'));
        const isDraft = btoItem.status === 'DRAFT';
        const canDeleteDraft = isDraft && (isOwner || isAdminUser);
        const allowedCancelStatuses = ['SUBMITTED', 'ADMIN_DP_REVIEW', 'REVISION_DP', 'PT_REVIEW', 'SDM_REVIEW'];
        const canCancel = allowedCancelStatuses.includes(btoItem.status) && (isOwner || isAdminUser);

        return (
          <div className="flex items-center justify-start gap-2">
            {canEdit && (
              <button
                onClick={() => handleOpenEditBto(btoItem)}
                className="p-1.5 rounded-xl text-amber-600 hover:bg-amber-50 dark:text-amber-400 dark:hover:bg-amber-500/10 transition-colors group flex items-center justify-center relative"
                title="Edit"
              >
                <Pencil className="h-4 w-4" />
              </button>
            )}
            {canDeleteDraft && (
              <button
                onClick={() => handleDeleteDraftBto(btoItem.id)}
                className="p-1.5 rounded-xl text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-500/10 transition-colors group flex items-center justify-center relative"
                title="Hapus Draft BTO"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            )}
            {canCancel && (
              <button
                onClick={() => handleDeleteBto(btoItem.id)}
                className="p-1.5 rounded-xl text-rose-600 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-500/10 transition-colors group flex items-center justify-center relative"
                title="Batalkan BTO"
              >
                <X className="h-4 w-4" />
              </button>
            )}
            <button
              onClick={() => handleBtoClick(btoItem)}
              className="p-1.5 rounded-xl text-teal-600 hover:bg-teal-50 dark:text-teal-400 dark:hover:bg-teal-500/10 transition-colors group flex items-center justify-center relative"
              title="Detail"
            >
              <Info className="h-4 w-4" />
            </button>
          </div>
        );
      }
    }
  ];

  const filteredBtos = btos.filter((b) => {
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

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-300">
        {/* Header */}
        <div className="flex flex-col gap-4 border-b border-slate-200 pb-5 dark:border-slate-800 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="section-title">Business Trip Order</p>
            <h1 className="mt-1 text-2xl font-bold text-slate-950 dark:text-white">Perjalanan dinas</h1>
            <p className="text-slate-500 dark:text-slate-400 mt-1">
              Kelola penugasan, down payment, cetak SPDK, check-in lokasi dinas, dan pengeluaran dinas.
            </p>
           </div>
           <div className="flex items-center gap-3 flex-wrap">
             <MeetripHelpButton topic="user-submission" label="Panduan Ajukan Dinas" />
             <Button onClick={handleOpenCreate}>
              <Plus className="w-5 h-5" />
              <span>Ajukan Dinas Baru</span>
            </Button>
          </div>
        </div>

        {/* List BTO – Table */}
        <div className="mt-2 flex flex-col gap-3 rounded-xl border border-slate-200 bg-surface-card p-4 shadow-neu-sm dark:border-slate-800 md:flex-row md:items-center md:justify-between">
          <div className='items-center'>
            <p className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">Filter tanggal BTO</p>
            <p className="mt-1 text-xs text-slate-400">Saring berdasarkan tanggal pembuatan/pengajuan BTO.</p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
            <label className="w-full space-y-1 sm:w-56">
              <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Dari</span>
              <DateTimePicker
                mode="date"
                value={dateFromFilter}
                onChange={setDateFromFilter}
                placeholder="Tanggal awal"
              />
            </label>
            <label className="w-full space-y-1 sm:w-56">
              <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Sampai</span>
              <DateTimePicker
                mode="date"
                value={dateToFilter}
                onChange={setDateToFilter}
                placeholder="Tanggal akhir"
              />
            </label>
            {(dateFromFilter || dateToFilter) && (
              <button
                type="button"
                onClick={() => {
                  setDateFromFilter('');
                  setDateToFilter('');
                }}
                className="h-9 rounded-lg border border-slate-200 px-3 text-xs font-bold text-slate-500 transition-colors hover:bg-slate-50 hover:text-slate-700 dark:border-slate-800 dark:text-slate-400 dark:hover:bg-slate-950 dark:hover:text-slate-200"
              >
                Reset
              </button>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <span className="font-bold text-sm text-slate-500 dark:text-slate-400 uppercase tracking-wider shrink-0">
              Daftar Pengajuan Dinas ({filteredBtos.length})
            </span>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <SearchInput value={searchQuery} onChange={setSearchQuery} placeholder="Cari SPDK, BTO, tujuan..." className="w-full sm:w-96" />
              <Button variant="secondary" onClick={loadBtos} loading={loading} className="h-11 shrink-0 gap-2">
                {!loading && <RefreshCw className="h-3.5 w-3.5" />}
                Refresh
              </Button>
              {(user?.role?.split(',').some(r => ['admin', 'sdm', 'super_admin'].includes(r))) && (
                <button
                  type="button"
                  onClick={() => downloadDocument(`/api/dashboard/export-excel?${new URLSearchParams({
                    ...(dateFromFilter ? { dateFrom: dateFromFilter } : {}),
                    ...(dateToFilter ? { dateTo: dateToFilter } : {}),
                  }).toString()}`, 'rekap-dinas.xlsx').catch((err) => showAlert(err?.message || 'Gagal mengunduh rekap', 'error'))}
                  className="btn-secondary h-11 shrink-0 gap-2 border-teal-500/35 text-xs px-3 font-bold"
                >
                  <FileSpreadsheet className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                  Export Excel
                </button>
              )}
            </div>
          </div>
          <Table
            columns={btoColumns}
            data={filteredBtos}
            loading={loading}
            emptyMessage="Belum ada riwayat perjalanan dinas. Klik 'Ajukan Dinas Baru' untuk mulai."
            rowClassName={(btoItem) => {
              const isDraftLuarWilayah = btoItem.status === 'DRAFT' && btoItem.wilayahTipe === 'luar_wilayah';
              return `border-l-4 ${isDraftLuarWilayah
                  ? 'border-l-amber-500 bg-amber-50/20 dark:bg-amber-950/10 hover:bg-amber-50/30 dark:hover:bg-amber-950/20'
                  : btoItem.status === 'DRAFT'
                    ? 'border-l-slate-300 bg-slate-50/15 dark:bg-slate-900/5 hover:bg-slate-50/30 dark:hover:bg-slate-900/20'
                    : 'border-l-transparent hover:bg-teal-50/30 dark:hover:bg-teal-900/10'
                }`;
            }}
          />
        </div>

        {/* Create / Edit Modal */}
        <Modal
          isOpen={isCreateOpen}
          onClose={handleCloseCreate}
          title={editingBtoId ? 'Edit Pengajuan Dinas' : 'Ajukan Business Trip Order (BTO)'}
          widthClassName="max-w-2xl"
        >
          <form noValidate onSubmit={(e) => handleCreateSubmit(e, isSubmitDirectly)} className="flex flex-col max-h-[75vh]">
            <div className="flex-1 overflow-y-auto overflow-x-hidden pr-1.5 space-y-4 max-h-[55vh]">

              {editingBtoId && approvalLog.some(log => log.statusKe === 'REVISION_DP' || log.statusKe === 'REVISION') && (
                <div className="p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/50 rounded-xl flex gap-3">
                  <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0" />
                  <div>
                    <h4 className="text-sm font-bold text-amber-800 dark:text-amber-300">Catatan Revisi</h4>
                    <p className="text-xs text-amber-700 dark:text-amber-400 mt-1 whitespace-pre-line">
                      {[...approvalLog].reverse().find(log => log.statusKe === 'REVISION_DP' || log.statusKe === 'REVISION')?.catatan || 'Tidak ada catatan khusus.'}
                    </p>
                  </div>
                </div>
              )}

              {noPenempatanError && (
                <div className="p-4 mb-4 bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800/50 rounded-xl flex gap-3">
                  <AlertTriangle className="h-5 w-5 text-rose-600 dark:text-rose-400 shrink-0" />
                  <div>
                    <h4 className="text-sm font-bold text-rose-800 dark:text-rose-300">Lokasi Penempatan Belum Diatur</h4>
                    <p className="text-xs text-rose-700 dark:text-rose-400 mt-1">
                      Anda belum memiliki lokasi penempatan resmi (atau koordinatnya belum diatur). Silakan hubungi admin HR agar bisa mengajukan dinas.
                    </p>
                  </div>
                </div>
              )}

              {(() => {
                const editedBtoForm = editingBtoId ? btos.find(b => b.id === editingBtoId) : null;
                const isRevisionDpEmployeeForm = editedBtoForm?.status === 'REVISION_DP' && editedBtoForm?.employeeId === user?.id;

                if (isRevisionDpEmployeeForm) return null;

                return (
                  <>
                    {/* Kelompok 1: Destinasi Perjalanan */}
                    <DestinasiPerjalananGroup
                      tujuanNama={formData.tujuanNama}
                      onTujuanNamaChange={(val) => setFormData({ ...formData, tujuanNama: val })}
                      tujuanLat={formData.tujuanLat}
                      tujuanLng={formData.tujuanLng}
                      onMapPickerOpen={() => {
                        if (noPenempatanError) return;
                        setIsCreateOpen(false);
                        setTimeout(() => {
                          setMapModalOpen(true);
                        }, 150);
                      }}
                      jarakKm={createJarakKm}
                      onJarakKmChange={(val) => setCreateJarakKm(val)}
                      wilayahTipe={createWilayahTipe}
                      onWilayahTipeChange={(val) => setCreateWilayahTipe(val)}
                      penempatanNama={createPenempatanNama}
                      errorTujuanNama={errors.tujuanNama}
                      errorWilayahTipe={!!errors.wilayahTipe}
                      errorTujuanLat={errors.tujuanLat}
                    />

                    {/* Kelompok 2: Detail Perjalanan Dinas */}
                    <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/20 dark:bg-slate-950/20 space-y-4">
                      <p className="text-xs font-bold text-teal-600 dark:text-teal-400 uppercase tracking-wider">Detail Perjalanan Dinas</p>

                      {/* Transportasi */}
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Transportasi <span className="text-red-500">*</span></label>
                        <TransportDropdown
                          options={transports}
                          value={formData.transportId}
                          onChange={(val) => setFormData({ ...formData, transportId: val })}
                        />
                        {errors.transportId && <p className="text-[10px] text-red-500">{errors.transportId}</p>}
                      </div>

                      {/* Estimasi Berangkat & Kembali */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Estimasi Berangkat <span className="text-red-500">*</span></label>
                          <DateTimePicker
                            value={formData.estBerangkat}
                            onChange={(val) => setFormData({ ...formData, estBerangkat: val })}
                            placeholder="Pilih keberangkatan..."
                            min={todayStartInputValue()}
                            error={!!errors.estBerangkat}
                          />
                          {errors.estBerangkat && <p className="text-[10px] text-red-500 font-medium">{errors.estBerangkat}</p>}
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Estimasi Kembali <span className="text-red-500">*</span></label>
                          <DateTimePicker
                            value={formData.estKembali}
                            onChange={(val) => setFormData({ ...formData, estKembali: val })}
                            placeholder="Pilih kepulangan..."
                            min={formData.estBerangkat || todayStartInputValue()}
                            error={!!errors.estKembali}
                          />
                          {errors.estKembali && <p className="text-[10px] text-red-500 font-medium">{errors.estKembali}</p>}
                        </div>
                      </div>
                      {createJumlahHari > 0 && (
                        <div className="flex items-center gap-1.5 text-xs text-slate-500 font-semibold pt-1">
                          <span>Durasi Dinas mu adalah :</span>
                          <span className="bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400 px-2.5 py-1 rounded-xl text-[11px] font-bold">
                            {createJumlahHari} Hari {createJumlahMalam} Malam
                          </span>
                        </div>
                      )}

                      {/* Pemberi Tugas */}
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Pemberi Tugas <span className="text-red-500">*</span></label>
                        <PemberiTugasDropdown
                          options={pemberiTugasOptions}
                          value={formData.pemberiTugasId}
                          onChange={(id, nama) => setFormData({ ...formData, pemberiTugasId: id, pemberiTugasNama: nama })}
                        />
                        {errors.pemberiTugasId && <p className="text-[10px] text-red-500">{errors.pemberiTugasId}</p>}
                      </div>

                      {/* Estimasi Durasi */}
                      <div className="bg-surface-card/40 p-3.5 rounded-xl border border-slate-200/50 dark:border-slate-800/40 space-y-2">
                        <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Estimasi Waktu Perjalanan (Hari / Jam / Menit) <span className="text-red-500">*</span></label>
                        <div className="flex gap-2">
                          <div className="flex-1 flex items-center gap-1.5 bg-surface-sunken border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2">
                            <input
                              type="number" min={0} placeholder="Hari"
                              value={Math.floor((formData.estimasiWaktuMenit || 0) / (24 * 60)) || ''}
                              onChange={e => {
                                const d = Number(e.target.value);
                                const h = Math.floor(((formData.estimasiWaktuMenit || 0) % (24 * 60)) / 60);
                                const m = (formData.estimasiWaktuMenit || 0) % 60;
                                setFormData({ ...formData, estimasiWaktuMenit: d * 24 * 60 + h * 60 + m });
                              }}
                              className="w-full bg-transparent text-xs font-bold text-center outline-none border-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                            />
                            <span className="text-[10px] font-bold text-slate-400">h</span>
                          </div>
                          <div className="flex-1 flex items-center gap-1.5 bg-surface-sunken border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2">
                            <input
                              type="number" min={0} max={23} placeholder="Jam"
                              value={Math.floor(((formData.estimasiWaktuMenit || 0) % (24 * 60)) / 60) || ''}
                              onChange={e => {
                                const d = Math.floor((formData.estimasiWaktuMenit || 0) / (24 * 60));
                                const h = Number(e.target.value);
                                const m = (formData.estimasiWaktuMenit || 0) % 60;
                                setFormData({ ...formData, estimasiWaktuMenit: d * 24 * 60 + h * 60 + m });
                              }}
                              className="w-full bg-transparent text-xs font-bold text-center outline-none border-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                            />
                            <span className="text-[10px] font-bold text-slate-400">j</span>
                          </div>
                          <div className="flex-1 flex items-center gap-1.5 bg-surface-sunken border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2">
                            <input
                              type="number" min={0} max={59} placeholder="Menit"
                              value={(formData.estimasiWaktuMenit || 0) % 60 || ''}
                              onChange={e => {
                                const d = Math.floor((formData.estimasiWaktuMenit || 0) / (24 * 60));
                                const h = Math.floor(((formData.estimasiWaktuMenit || 0) % (24 * 60)) / 60);
                                const m = Number(e.target.value);
                                setFormData({ ...formData, estimasiWaktuMenit: d * 24 * 60 + h * 60 + m });
                              }}
                              className="w-full bg-transparent text-xs font-bold text-center outline-none border-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                            />
                            <span className="text-[10px] font-bold text-slate-400">m</span>
                          </div>
                        </div>
                        {formData.estimasiWaktuMenit > 0 && (
                          <div className="flex flex-wrap gap-x-4 gap-y-2 pt-2 border-t border-slate-100 dark:border-slate-800/60 mt-1.5">
                            <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                              <span>Konversi Waktu:</span>
                              <span className="bg-teal-500/10 text-teal-600 dark:bg-teal-500/20 dark:text-teal-400 px-2 py-0.5 rounded text-[11px] font-bold">
                                {parseMinutesToDetailedTime(formData.estimasiWaktuMenit)}
                              </span>
                            </div>
                          </div>
                        )}
                        {errors.estimasiWaktuMenit && <p className="text-[10px] text-red-500 mt-1">{errors.estimasiWaktuMenit}</p>}
                      </div>

                      {/* Barang yang Dibawa (Separated Component) */}
                      <BarangInput
                        value={formData.barang || ''}
                        onChange={val => setFormData({ ...formData, barang: val })}
                        error={errors.barang}
                        required={true}
                      />

                      {/* Kepentingan */}
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                          <FileText className="w-4 h-4 text-teal-600 dark:text-teal-400 shrink-0" />
                          Kepentingan / Maksud Perjalanan Dinas <span className="text-red-500">*</span>
                        </label>
                        <textarea
                          required
                          rows={2}
                          placeholder="Contoh: Rapat koordinasi evaluasi bulanan..."
                          value={formData.kepentingan}
                          onChange={e => setFormData({ ...formData, kepentingan: e.target.value })}
                          className={`input-field w-full resize-none rounded-xl border bg-slate-50/50 dark:bg-slate-950/80 p-3 text-xs leading-relaxed transition-all focus:bg-white dark:focus:bg-slate-950 ${
                            errors.kepentingan ? 'border-red-500 focus:ring-red-500/20' : 'border-slate-200 dark:border-slate-800 focus:ring-teal-500/20 focus:border-teal-500'
                          }`}
                        />
                        {errors.kepentingan && <p className="text-[10px] text-red-500 mt-1 font-medium">{errors.kepentingan}</p>}
                      </div>
                    </div>

                    {/* Lampiran */}
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Unggah Lampiran Dokumen (Memo, WA Chat, Disposisi, dll) <span className="text-red-500">*</span></label>
                      <DragDropUpload
                        selectedFile={selectedFile}
                        onFileSelect={file => setSelectedFile(file)}
                        existingFileName={existingLampiranNama}
                        onClearExisting={() => setExistingLampiranNama(null)}
                        accept=".pdf,image/*"
                      />
                      {errors.lampiran && <p className="text-[10px] text-red-500">{errors.lampiran}</p>}
                    </div>
                  </>
                );
              })()}

              {/* Butuh DP Toggle Card */}
              {(() => {
                const editedBtoForm = editingBtoId ? btos.find(b => b.id === editingBtoId) : null;
                const isRevisionDpEmployeeForm = editedBtoForm?.status === 'REVISION_DP' && editedBtoForm?.employeeId === user?.id;

                if (isRevisionDpEmployeeForm) return null;

                return (
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, butuhDp: !formData.butuhDp })}
                    className={`w-full flex items-center justify-between p-4 rounded-xl border transition-all text-left ${formData.butuhDp
                        ? 'border-teal-500 bg-teal-50/40 dark:bg-teal-950/20'
                        : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/20 hover:bg-slate-100/50 dark:hover:bg-slate-900/40'
                      }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`mt-0.5 w-4.5 h-4.5 rounded border flex items-center justify-center transition-all ${formData.butuhDp ? 'border-teal-500 bg-teal-500 text-white' : 'border-slate-300 dark:border-slate-700'
                        }`}>
                        {formData.butuhDp && (
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-800 dark:text-slate-100">Saya membutuhkan Panjar / Down Payment (DP)</p>
                        <p className="text-xs text-slate-400 mt-0.5">Dapatkan estimasi biaya perjalanan dinas berdasarkan pagu limit grade Anda.</p>
                      </div>
                    </div>
                  </button>
                );
              })()}              {/* Rincian Panjar (Muncul jika butuhDp centang) */}
              {formData.butuhDp && (
                <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-900/10 space-y-5 shadow-neu-sm">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-200/60 dark:border-slate-800/40">
                    <div>
                      <h4 className="text-xs font-extrabold text-teal-600 dark:text-teal-400 uppercase tracking-wider flex items-center gap-1.5">
                        <Coins className="w-4 h-4" />
                        Rincian Estimasi Panjar / DP
                      </h4>
                      <p className="text-[10px] text-slate-400 mt-0.5">Masukkan estimasi nominal panjar berdasarkan pagu limit.</p>
                    </div>
                    {createPaguList.length === 0 && (
                      <span className="text-[11px] bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 px-3 py-1 rounded-lg border border-amber-200/50 dark:border-amber-800/40 font-semibold animate-pulse">
                        Harap lengkapi lokasi &amp; tanggal perjalanan untuk memuat pagu
                      </span>
                    )}
                  </div>

                  {createPaguList.length > 0 && (
                    <div className="space-y-4">
                      {/* USD Rate Input if Luar Negeri or any item in master pagu uses USD */}
                      {(createWilayahTipe === 'luar_negeri' || createPaguList.some(p => p.useDollar)) && (
                        <div className="flex flex-col gap-2 p-4 rounded-2xl bg-amber-500/5 border border-amber-500/10 w-full">
                          <div className="flex items-center justify-between w-full gap-4">
                            <div className="flex items-center gap-2">
                              <Info className="w-4 h-4 text-amber-500 shrink-0" />
                              <div>
                                <p className="text-[10px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                                  Kurs Konversi USD → IDR <span className="text-rose-500 font-bold">*</span>
                                </p>
                                <p className="text-[9px] text-slate-500 dark:text-slate-400">Masukkan nilai kurs konversi real-time saat ini.</p>
                              </div>
                            </div>
                            <div className={`flex items-center gap-1.5 bg-surface-card border rounded-xl px-3 py-2 shadow-neu ${errors.usdRate ? 'border-rose-400 focus-within:ring-2 focus-within:ring-rose-500' : 'border-slate-200 dark:border-slate-800'}`}>
                              <span className="text-xs font-bold text-slate-400 select-none">Rp</span>
                              <InputUang
                                value={createUsdRate ?? undefined}
                                useDollar={false}
                                onChange={val => {
                                  setCreateUsdRate(val ?? null);
                                  if (val && val > 0) {
                                    setErrors(prev => { const n = { ...prev }; delete n.usdRate; return n; });
                                  }
                                }}
                                placeholder="Contoh: 16500"
                                className="w-28 bg-transparent text-xs font-extrabold text-right outline-none border-none text-slate-800 dark:text-slate-100"
                              />
                            </div>
                          </div>
                          {errors.usdRate && (
                            <p className="text-[10px] text-rose-500 font-semibold self-end">{errors.usdRate}</p>
                          )}
                        </div>
                      )}

                      {/* List of Pagu Inputs as Grid Cards */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-96 overflow-y-auto overflow-x-hidden pr-1">
                        {createPaguList.map((p) => {
                          const isUnlimited = isPaguUnlimited(p);
                          const hasLimit = hasEnforcedPaguLimit(p);
                          const isUnconfigured = !isUnlimited && !hasLimit;
                          const val = isUnconfigured ? 0 : (createDpValues[p.rincianId] ?? 0);
                          const totalRequested = val * (p.jumlahHari || 1);
                          const maxLimit = (isUnlimited || !hasLimit || Number(p.nilaiLimit || 0) <= 0) ? 0 : Number(p.nilaiLimit);
                          const isOverLimit = !isUnlimited && (isUnconfigured ? val > 0 : totalRequested > maxLimit);
                          return (
                            <div
                              key={p.rincianId}
                              className={`p-4 rounded-2xl border transition-all flex flex-col justify-between gap-3 ${isUnlimited
                                  ? 'border-teal-300/50 bg-teal-50/20 dark:border-teal-800/40 dark:bg-teal-950/10 shadow-neu-sm'
                                  : (isOverLimit || isUnconfigured)
                                    ? 'border-rose-300 bg-rose-50/30 dark:border-rose-950/20 dark:bg-rose-950/10 shadow-neu-sm'
                                    : 'border-slate-200 dark:border-slate-800/80 bg-surface-card/50 hover:border-teal-200 dark:hover:border-teal-900/60 shadow-neu-sm'
                                }`}
                            >
                              <div className="space-y-1">
                                <div className="flex justify-between items-start gap-2">
                                  <p className="text-xs font-extrabold text-slate-800 dark:text-slate-200 tracking-tight">{p.rincianLabel}</p>
                                  {isUnlimited ? (
                                    <span className="shrink-0 inline-flex px-1.5 py-0.5 rounded-md text-[9px] font-extrabold bg-teal-100 dark:bg-teal-950/80 text-teal-700 dark:text-teal-400 border border-teal-200 dark:border-teal-800/60">
                                      Unlimited
                                    </span>
                                  ) : isUnconfigured ? (
                                    <span className="shrink-0 inline-flex px-1.5 py-0.5 rounded-md text-[9px] font-extrabold bg-rose-100 dark:bg-rose-950/80 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-900/45">
                                      Limit 0 (Terkunci)
                                    </span>
                                  ) : isOverLimit ? (
                                    <span className="shrink-0 inline-flex px-1.5 py-0.5 rounded-md text-[9px] font-extrabold bg-rose-100 dark:bg-rose-950/80 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-900/45">
                                      Melebihi Limit
                                    </span>
                                  ) : null}
                                </div>
                                <p className="text-[10px] text-slate-400 font-semibold leading-relaxed">
                                  {isUnlimited ? (
                                    <span className="text-teal-600 dark:text-teal-400 font-bold">Tidak ada batasan pagu</span>
                                  ) : isUnconfigured ? (
                                    <span className="text-rose-600 dark:text-rose-400 font-bold">Limit belum dikonfigurasi (Maks: 0). Pengajuan tidak dapat diisi.</span>
                                  ) : (
                                    <>
                                      Pagu Limit: <span className="text-slate-600 dark:text-slate-400 font-bold">{p.useDollar ? `$${(p.nilaiPerHari || 0).toLocaleString()}` : `Rp ${(p.nilaiPerHari || 0).toLocaleString('id-ID')}`}</span> / {p.perMalam ? 'malam' : 'hari'}
                                      <span className="block text-[9px] text-slate-400 font-medium">Maks Total: {p.useDollar ? `$${(p.nilaiLimit || 0).toLocaleString()}` : `Rp ${(p.nilaiLimit || 0).toLocaleString('id-ID')}`}</span>
                                    </>
                                  )}
                                </p>
                              </div>

                              {/* Input Box */}
                              <div className="space-y-1.5">
                                {isUnlimited ? (
                                  <div className="flex items-center gap-2 px-3 py-2 rounded-xl border border-teal-200/60 dark:border-teal-800/40 bg-teal-50/30 dark:bg-teal-950/20">
                                    <span className="text-xs font-bold text-slate-400 select-none">{p.useDollar ? '$' : 'Rp'}</span>
                                    <InputUang
                                      value={val}
                                      useDollar={p.useDollar}
                                      onChange={newVal => setCreateDpValues({ ...createDpValues, [p.rincianId]: newVal })}
                                      className="w-full bg-transparent text-xs font-extrabold text-right outline-none border-none text-slate-800 dark:text-slate-100"
                                      placeholder="Nominal (bebas)..."
                                    />
                                  </div>
                                ) : (
                                  <div className={`flex items-center gap-2 px-3 py-2 rounded-xl border bg-slate-50/50 dark:bg-slate-950/80 transition-all focus-within:ring-2 focus-within:ring-offset-0 ${
                                    (isOverLimit || isUnconfigured) ? 'border-rose-400 focus-within:ring-rose-500 bg-rose-50/20' : 'border-slate-200 dark:border-slate-800 focus-within:ring-teal-500'
                                    }`}>
                                    <span className="text-xs font-bold text-slate-400 select-none">{p.useDollar ? '$' : 'Rp'}</span>
                                    <InputUang
                                      value={isUnconfigured ? 0 : val}
                                      useDollar={p.useDollar}
                                      onChange={newVal => {
                                        if (isUnconfigured) {
                                          showAlert(`Limit belum dikonfigurasi (Limit = 0). Nominal panjar tidak dapat diisi.`, 'warning');
                                          setCreateDpValues({ ...createDpValues, [p.rincianId]: 0 });
                                        } else {
                                          setCreateDpValues({ ...createDpValues, [p.rincianId]: newVal });
                                        }
                                      }}
                                      disabled={isUnconfigured}
                                      className="w-full bg-transparent text-xs font-extrabold text-right outline-none border-none text-slate-800 dark:text-slate-100 disabled:opacity-50 disabled:cursor-not-allowed"
                                      placeholder={isUnconfigured ? "Terkunci (0)..." : "Nominal per hari..."}
                                    />
                                  </div>
                                )}

                                {/* Preview Terformat di Bawah Input */}
                                <div className="flex flex-col gap-0.5 text-[10px] text-slate-400 font-semibold px-0.5 leading-normal">
                                  <div className="flex justify-between items-center">
                                    <span>Diajukan / {p.perMalam ? 'malam' : 'hari'}:</span>
                                    <span className="text-slate-700 dark:text-slate-200">
                                      {p.useDollar ? `$${val.toLocaleString()}` : `Rp ${val.toLocaleString('id-ID')}`}
                                    </span>
                                  </div>
                                  <div className="flex justify-between items-center border-t border-slate-100 dark:border-slate-800/40 pt-0.5">
                                    <span>Total ({p.jumlahHari || 1} {p.perMalam ? 'malam' : 'hari'}):</span>
                                    <span className={`font-bold ${isOverLimit ? 'text-rose-500' : 'text-slate-800 dark:text-slate-200'}`}>
                                      {isUnlimited && totalRequested === 0
                                        ? <span className="text-teal-500 dark:text-teal-400">Bebas</span>
                                        : p.useDollar ? `$${totalRequested.toLocaleString()}` : `Rp ${totalRequested.toLocaleString('id-ID')}`
                                      }
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* Total Preview */}
                      {(() => {
                        let totalUsd = 0, totalIdr = 0;
                        createPaguList.forEach(p => {
                          const valPerHari = createDpValues[p.rincianId] ?? 0;
                          const totalVal = valPerHari * (p.jumlahHari || 1);
                          if (p.useDollar) { totalUsd += totalVal; totalIdr += totalVal * (createUsdRate || 0); }
                          else { totalIdr += totalVal; }
                        });
                        return (
                          <div className="p-4 rounded-xl bg-teal-500/5 dark:bg-teal-500/[0.02] border border-teal-500/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div className="flex items-center gap-2">
                              <span className="p-2 rounded-lg text-teal-600 dark:text-teal-400 flex items-center justify-center">
                                <Coins className="w-5 h-5" />
                              </span>
                              <div>
                                <p className="text-[10px] font-extrabold text-teal-600 dark:text-teal-400 uppercase tracking-wider">Preview Total Panjar</p>
                                <p className="text-[10px] text-slate-400">Nilai total panjar perjalanan dinas Anda.</p>
                              </div>
                            </div>
                            <div className="flex flex-col items-end gap-0.5">
                              {totalUsd > 0 && (
                                <p className="text-xs font-bold text-slate-500 dark:text-slate-400">Total USD: ${totalUsd.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
                              )}
                              <p className="text-sm font-extrabold text-slate-900 dark:text-white">Total IDR: <span className="text-teal-600 dark:text-teal-400">Rp {Math.round(totalIdr).toLocaleString('id-ID')}</span></p>
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="shrink-0 pt-4 border-t border-slate-200/60 dark:border-slate-800/50 flex flex-wrap items-center justify-end gap-3 mt-4">
              {(() => {
                const editedBto = editingBtoId ? btos.find(b => b.id === editingBtoId) : null;
                const isRevisionDpEmployee = editedBto?.status === 'REVISION_DP' && editedBto?.employeeId === user?.id;

                return (
                  <>
                    <button
                      type="button"
                      onClick={handleCloseCreate}
                      disabled={submitting}
                      className="btn-secondary px-5 py-2 text-sm rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors disabled:opacity-50"
                    >
                      Batal
                    </button>

                    {!editingBtoId && !isRevisionDpEmployee && (
                      <Button
                        type="submit"
                        variant="amber"
                        disabled={submitting || noPenempatanError}
                        onClick={() => setIsSubmitDirectly(false)}
                        className="px-5 py-2 text-sm font-bold rounded-xl"
                      >
                        Simpan Draft
                      </Button>
                    )}

                    <Button
                      type="submit"
                      disabled={submitting || noPenempatanError}
                      onClick={() => setIsSubmitDirectly(true)}
                      className="px-5 py-2 text-sm font-bold rounded-xl"
                    >
                      {submitting ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin inline" />
                          Menyimpan...
                        </>
                      ) : isRevisionDpEmployee ? (
                        'Submit Kembali'
                      ) : editingBtoId ? (
                        'Simpan Perubahan'
                      ) : (
                        'Submit BTO'
                      )}
                    </Button>
                  </>
                );
              })()}
            </div>
          </form>
        </Modal>

        {/* Map Picker Modal */}
        <MapPickerModal
          isOpen={mapModalOpen}
          onClose={() => {
            setMapModalOpen(false);
            setTimeout(() => {
              setIsCreateOpen(true);
            }, 150);
          }}
          initialLatitude={formData.tujuanLat ?? ''}
          initialLongitude={formData.tujuanLng ?? ''}
          onSelect={async (lat, lng, addressName) => {
            setFormData(f => ({
              ...f,
              tujuanLat: lat,
              tujuanLng: lng,
              tujuanNama: f.tujuanNama || addressName || ''
            }));
            setMapModalOpen(false);
            setTimeout(() => {
              setIsCreateOpen(true);
            }, 150);

            try {
              const res = await apiFetch(`/api/bto/calculate-geo?lat=${lat}&lng=${lng}`);
              if (res) {
                setCreateJarakKm(res.jarakKm);
                setCreateWilayahTipe(res.wilayahTipe);
                setCreatePenempatanNama(res.penempatanNama || '');
                setFormData(f => ({
                  ...f,
                  tujuanLat: lat,
                  tujuanLng: lng,
                  tujuanNama: f.tujuanNama || addressName || res.alamat || ''
                }));
              }
            } catch (err) {
              console.error('Gagal menghitung jarak dan wilayah tujuan:', err);
            }
          }}
        />

        {/* Detail Modal */}
        <Modal
          isOpen={!!selectedBto}
          onClose={() => setSelectedBto(null)}
          title=""
          widthClassName="max-w-4xl"
        >
          {selectedBto && (
            <div className="flex max-h-[82vh] flex-col">
              {/* ── Modal custom header inside body ── */}
              <div className="mb-4 flex items-start justify-between gap-4 border-b border-slate-200/70 pb-4 pr-10 dark:border-slate-800">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center flex-wrap gap-2 mb-1">
                    <h3 className="text-lg font-black text-slate-900 dark:text-white tracking-tight truncate">
                      {selectedBto.nomorBto || 'Draft BTO'}
                    </h3>
                    <span className={`inline-flex shrink-0 px-2.5 py-0.5 text-[10px] font-extrabold rounded-full ${getStatusBadge(selectedBto.status)}`}>
                      {selectedBto.status}
                    </span>
                    {selectedBto.wilayahTipe && (
                      <span className={`inline-flex shrink-0 px-2 py-0.5 text-[10px] font-bold rounded-full uppercase tracking-wider ${getRegionBadge(selectedBto.wilayahTipe)}`}>
                        {selectedBto.wilayahTipe.replace(/_/g, ' ')}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-slate-500 dark:text-slate-400 font-medium truncate">{selectedBto.tujuanNama}</p>
                </div>
              </div>

              {/* Document Download Buttons */}
              {(() => {
                const submittedOrLaterStatuses = ['SUBMITTED', 'KABAG_REVIEW', 'SPDK_DRAFT', 'ACTIVE', 'ATTENDED', 'REPORT_UPLOADED', 'BTE_DRAFT', 'ADMIN_BTE_REVIEW', 'BTE_PAYMENT', 'COMPLETED'];
                const spdkApprovedStatuses = ['ACTIVE', 'ATTENDED', 'REPORT_UPLOADED', 'BTE_DRAFT', 'ADMIN_BTE_REVIEW', 'BTE_PAYMENT', 'COMPLETED'];
                const bteApprovedStatuses = ['BTE_PAYMENT', 'COMPLETED'];
                const canDownloadBto = Boolean(selectedBto.nomorBto || submittedOrLaterStatuses.includes(selectedBto.status));
                const canDownloadDp = canDownloadBto && Boolean(selectedBto.butuhDp && dpDetails);
                const canDownloadSpdk = spdkApprovedStatuses.includes(selectedBto.status);
                const canDownloadBte = Boolean(bteDetails && (bteApprovedStatuses.includes(selectedBto.status) || ['PENDING_PAYMENT', 'PAID'].includes(bteDetails.status)));

                if (!canDownloadBto && !canDownloadDp && !canDownloadSpdk && !canDownloadBte) return null;

                return (
                  <div className="mb-5 flex shrink-0 flex-wrap justify-end gap-2">
                    {canDownloadBto && (
                      <DocumentDownloadButton path={`/api/document/bto/${selectedBto.id}/pdf`} className="px-3 py-1.5 text-[10px]">
                        BTO
                      </DocumentDownloadButton>
                    )}
                    {canDownloadDp && (
                      <DocumentDownloadButton path={`/api/document/dp/${selectedBto.id}/pdf`} className="px-3 py-1.5 text-[10px]">
                        DP
                      </DocumentDownloadButton>
                    )}
                    {canDownloadSpdk && (
                      <DocumentDownloadButton path={`/api/document/spdk/${selectedBto.id}/pdf`} className="px-3 py-1.5 text-[10px]">
                        SPDK
                      </DocumentDownloadButton>
                    )}
                    {canDownloadBte && (
                      <DocumentDownloadButton path={`/api/document/bte/${selectedBto.id}/pdf`} className="px-3 py-1.5 text-[10px]">
                        BTE
                      </DocumentDownloadButton>
                    )}
                  </div>
                );
              })()}

              {/* ── Tab Navigation ── */}
              <div className="flex gap-1 mb-5 p-1 rounded-xl bg-slate-100/80 dark:bg-slate-800/50 shrink-0 relative items-center">
                <div className="flex flex-1 gap-1">
                  {[
                    { id: 'info', label: 'Info Dinas', always: true },
                    { id: 'dp', label: 'Panjar / DP', show: selectedBto.butuhDp },
                    { id: 'spdk', label: 'SPDK & GPS', show: ['SPDK_DRAFT', 'KABAG_REVIEW', 'ACTIVE', 'ATTENDED', 'REPORT_UPLOADED', 'BTE_DRAFT', 'ADMIN_BTE_REVIEW', 'REVISION_BTE', 'BTE_PAYMENT', 'COMPLETED'].includes(selectedBto.status) },
                    { id: 'bte', label: 'Realisasi BTE & Lampiran', show: ['ATTENDED', 'REPORT_UPLOADED', 'BTE_DRAFT', 'ADMIN_BTE_REVIEW', 'REVISION_BTE', 'BTE_PAYMENT', 'COMPLETED'].includes(selectedBto.status) },
                  ].filter(t => t.always || t.show).map(tab => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id as any)}
                      className={`flex-1 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${activeTab === tab.id
                        ? 'bg-white dark:bg-slate-700 text-teal-600 dark:text-teal-400 shadow-neu-sm'
                        : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                        }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
                {user?.role?.split?.(',').some((r: string) => ['admin', 'super_admin'].includes(r)) && (
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedBto(null);
                      handleOpenEditBto(selectedBto);
                    }}
                    className="flex-none px-4 py-1.5 rounded-lg text-xs font-bold bg-amber-100 text-amber-700 hover:bg-amber-200 dark:bg-amber-500/20 dark:text-amber-400 transition-colors flex items-center gap-2 ml-2 shadow-neu-sm"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                    Edit Data Dinas
                  </button>
                )}
              </div>

              {/* ── Scrollable tab content ── */}
              <div className="flex-1 overflow-y-auto pr-1 space-y-4 min-h-0">

                {/* ────────────── TAB: INFO ────────────── */}
                {activeTab === 'info' && (
                  <DetailInfoDinas
                    selectedBto={selectedBto}
                    approvalLog={approvalLog}
                    getStatusBadge={getStatusBadge}
                    bteDetails={bteDetails}
                    dpDetails={dpDetails}
                  />
                )}
                {activeTab === 'dp' && (
                  <DetailPanjar
                    selectedBto={selectedBto}
                    paguList={paguList}
                    dpValues={dpValues}
                    setDpValues={setDpValues}
                    usdRate={usdRate}
                    setUsdRate={setUsdRate}
                    user={user}
                    handleSaveDp={handleSaveDp}
                  />
                )}
                {activeTab === 'spdk' && (
                  <DetailSPDKGPS
                    selectedBto={selectedBto}
                    user={user}
                    gpsError={gpsError}
                    gpsLoading={gpsLoading}
                    setGpsLoading={setGpsLoading}
                    handleGPSCheckIn={handleGPSCheckIn}
                    apiFetch={apiFetch}
                    showAlert={showAlert}
                    confirm={confirm}
                    setSelectedBto={setSelectedBto}
                    loadBtos={loadBtos}
                    uploading={uploading}
                    handleUploadReport={handleUploadReport}
                    reportFile={reportFile}
                    setReportFile={setReportFile}
                  />
                )}
                {activeTab === 'bte' && (
                  <DetailBTE
                    selectedBto={selectedBto}
                    user={user}
                    bteDetails={bteDetails}
                    setBteDetails={setBteDetails}
                    bteValues={bteValues}
                    setBteValues={setBteValues}
                    paguList={paguList}
                    bteBiayaLain={bteBiayaLain}
                    setBteBiayaLain={setBteBiayaLain}
                    usdRate={usdRate}
                    setUsdRate={setUsdRate}
                    kuitansiFile={kuitansiFile}
                    setKuitansiFile={setKuitansiFile}
                    laporanFile={reportFile}
                    setLaporanFile={setReportFile}
                    handleSaveBte={handleSaveBte}
                    apiFetch={apiFetch}
                    showAlert={showAlert}
                    approvalLog={approvalLog}
                  />
                )}
              </div>
            </div>
          )}
        </Modal>

      {/* Catatan Action Modal */}
      <Modal
        isOpen={actionModalOpen}
        onClose={() => setActionModalOpen(false)}
        title={
          pendingAction === 'approve' ? 'Konfirmasi Persetujuan' :
            pendingAction === 'issue_spdk' ? 'Penerbitan Nomor SPDK' :
              pendingAction === 'submit_bto' ? 'Ajukan BTO' :
                pendingAction === 'mark_paid' ? 'Konfirmasi Pembayaran' :
                  pendingAction === 'revision' ? 'Permintaan Revisi' : 'Tolak Pengajuan'
        }
        widthClassName="max-w-md"
      >
        <div className="space-y-4 pt-1">
          {['submit_bto', 'mark_paid', 'cancel_bto'].includes(pendingAction || '') && (
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              {pendingAction === 'submit_bto' ? 'Apakah Anda yakin ingin mengajukan BTO ini ke tahap persetujuan? Data yang diajukan tidak dapat diubah kembali kecuali diminta revisi.' :
                pendingAction === 'cancel_bto' ? 'Apakah Anda yakin ingin membatalkan pengajuan dinas ini? Harap berikan alasan Anda.' :
                  'Apakah Anda yakin ingin menandai pengeluaran BTE ini sudah dibayar/ditransfer oleh Keuangan? Tindakan ini tidak dapat dibatalkan.'}
            </p>
          )}
          {!['submit_bto', 'mark_paid'].includes(pendingAction || '') && (
            <div className="space-y-1.5 mb-2">
              <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                Catatan / Keterangan <span className="text-slate-400 font-semibold">(Wajib)</span>
              </label>
              <textarea
                rows={3}
                className="input-field text-xs bg-surface-sunken border border-slate-200 dark:border-slate-800 rounded-xl p-3 w-full h-20 resize-none focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                placeholder={`Masukkan catatan atau alasan ${pendingAction === 'approve' ? 'setuju' : pendingAction === 'issue_spdk' ? 'penerbitan' : pendingAction === 'cancel_bto' ? 'pembatalan' : pendingAction === 'revision' ? 'revisi' : 'penolakan'}...`}
                value={catatan}
                onChange={e => setCatatan(e.target.value)}
              />
            </div>
          )}
          <div className="pt-2 flex justify-end gap-2.5 flex-wrap">
            <button
              type="button"
              onClick={() => setActionModalOpen(false)}
              className="btn-secondary px-5 py-2 text-xs font-bold rounded-xl transition-all"
              disabled={submitting}
            >
              Batal
            </button>
            <Button
              type="button"
              variant={pendingAction === 'reject' || pendingAction === 'cancel_bto' ? 'danger' : 'primary'}
              onClick={executeAction}
              disabled={submitting || (!['submit_bto', 'mark_paid'].includes(pendingAction || '') && !catatan.trim())}
            >
              {pendingAction === 'approve' ? 'Ya, Setujui' :
                pendingAction === 'issue_spdk' ? 'Ya, Terbitkan SPDK' :
                  pendingAction === 'submit_bto' ? 'Ya, Ajukan' :
                    pendingAction === 'mark_paid' ? 'Ya, Konfirmasi Lunas' :
                      pendingAction === 'revision' ? 'Kirim Revisi' : 'Ya, Tolak'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
