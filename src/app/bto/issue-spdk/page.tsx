'use client';

import React, { useEffect, useState } from 'react';
import PageTemplate from '@/components/layout/PageTemplate';
import SearchInput from '@/components/form/SearchInput';
import Modal from '@/components/ui/Modal';
import Input from '@/components/form/Input';
import SearchSelect from '@/components/form/SearchSelect';

import Button from '@/components/ui/Button';
import { apiFetch, refreshMeetripBadges, getCachedUser, openDocument } from '@/utils/api';
import { useAlert } from '@/context/FeedbackContext';
import DocumentDownloadButton from '../components/DocumentDownloadButton';
import PaginationControls from '@/components/ui/PaginationControls';
import usePagination from '@/hooks/usePagination';
import { formatBtoStatusName, getBtoStatusBadgeClass } from '@/utils/btoStatus';
import { toLocalDateTimeInputValue } from '@/utils/dateInput';
import { MeetripHelpButton } from '@/components/help/MeetripHelpGuide';
import {
  Check, X, RefreshCw, FileText, Info, Coins, History, 
  MapPin, Clock, Briefcase, Car, Calendar, Package, AlertCircle,
  Paperclip, ExternalLink
} from 'lucide-react';

type CachedUser = {
  id: string;
  nama?: string | null;
  role?: string | null;
  gradeLevel?: number | null;
};

type BtoItem = {
  id: string;
  nomorBto?: string | null;
  spdkNumber?: string | null;
  employeeId: string;
  employeeNama?: string | null;
  pemberiTugasId?: string | null;
  pemberiTugasNama?: string | null;
  tujuanNama: string;
  tujuanLat: string;
  tujuanLng: string;
  tujuanAlamat?: string | null;
  tujuanProvinsi?: string | null;
  tujuanNegara?: string | null;
  wilayahTipe?: 'dalam_wilayah' | 'luar_wilayah' | 'luar_negeri' | null;
  jarakKm?: string | null;
  kepentingan: string;
  barang?: string | null;
  transportId?: string | null;
  transportLabel?: string | null;
  estBerangkat: string;
  estKembali: string;
  estimasiWaktuMenit?: number | null;
  butuhDp: boolean;
  lampiranPath?: string | null;
  lampiranNama?: string | null;
  status: string;
  catatanAdmin?: string | null;
  createdAt: string;
};

const isAdminRole = (role?: string | null) => role === 'admin' || role === 'super_admin' || role === 'sdm';

const shortId = (value?: string | null) => value ? value.slice(0, 8).toUpperCase() : null;

const docNumber = (value?: string | null, fallbackId?: string | null) => {
  if (value) return value;
  const compactId = shortId(fallbackId);
  return compactId ? `ID-${compactId}` : 'Belum terbit';
};

const nomorSpdkFromBto = (nomorBto?: string | null) => {
  if (!nomorBto) return '';
  const parts = nomorBto.split('/').map((part) => part.trim()).filter(Boolean);
  if (parts.length >= 5) return `${parts[0]}/${parts[1]}/SPDK/${parts[3]}/${parts[4]}`;
  return nomorBto.replace(/\/BTO\//i, '/SPDK/');
};

const formatStageName = (stage?: string, action?: string) => {
  if (stage === 'user' && action === 'submit') return 'Submitted BTO';
  switch (stage) {
    case 'admin_dp': return 'Review Admin DP';
    case 'pemberi_tugas': return 'Pemberi Tugas Review';
    case 'sdm': return 'Review SDM';
    case 'admin_spdk': return 'Penerbitan SPDK';
    case 'persetujuan_spdk': return 'Review KABAG SPDK';
    case 'absen': return 'Absen Kedatangan';
    case 'laporan': return 'Upload Laporan Perjalanan';
    case 'bte': return 'Realisasi BTE';
    case 'bte_payment': return 'Pembayaran BTE';
    case 'user': return 'Pengajuan BTO';
    default: return stage ? stage.replace(/_/g, ' ') : 'Aktivitas';
  }
};

const formatActionName = (action?: string) => {
  switch (action) {
    case 'submit': return 'Mengajukan';
    case 'approve': return 'Menyetujui';
    case 'reject': return 'Menolak';
    case 'revision': return 'Meminta revisi';
    case 'issue': return 'Menerbitkan';
    case 'upload': return 'Mengunggah';
    case 'absen': return 'Melakukan absen';
    case 'override_absen': return 'Override absen';
    case 'mark_paid': return 'Mengonfirmasi pembayaran';
    default: return action ? action.replace(/_/g, ' ') : 'Memproses';
  }
};

const formatStatusName = formatBtoStatusName;

const getStatusBadge = getBtoStatusBadgeClass;

export default function PenerbitanSpdkPage() {
  const [user, setUser] = useState<CachedUser | null>(null);
  const { showAlert } = useAlert();
  const [approvals, setApprovals] = useState<BtoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Detail Modal
  const [selectedBto, setSelectedBto] = useState<BtoItem | null>(null);
  const [activeTab, setActiveTab] = useState<'info' | 'dp' | 'logs' | 'documents'>('info');
  const [approvalLog, setApprovalLog] = useState<any[]>([]);
  const [dpDetails, setDpDetails] = useState<any>(null);
  const [dpForm, setDpForm] = useState<any[]>([]);
  const [usdRate, setUsdRate] = useState(16500);

  // SPDK Form
  const [nomorSpdk, setNomorSpdk] = useState('');
  const [spdkBtoEdit, setSpdkBtoEdit] = useState({
    tujuanNama: '',
    estBerangkat: '',
    estKembali: '',
    kepentingan: '',
    barang: '',
    pemberiTugasId: '',
    pemberiTugasNama: '',
    transportId: '',
  });

  // Options
  const [pemberiTugasOptions, setPemberiTugasOptions] = useState<any[]>([]);
  const [transports, setTransports] = useState<any[]>([]);

  // Actions
  const [catatan, setCatatan] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [actionModalOpen, setActionModalOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState<'approve' | 'reject' | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const searchedApprovals = approvals.filter((b) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      b.tujuanNama?.toLowerCase().includes(q) ||
      b.kepentingan?.toLowerCase().includes(q) ||
      b.employeeNama?.toLowerCase().includes(q) ||
      b.employeeNama?.toLowerCase().includes(q) ||
      b.spdkNumber?.toLowerCase().includes(q) ||
      b.nomorBto?.toLowerCase().includes(q)
    );
  });

  const approvalsPagination = usePagination(searchedApprovals);

  useEffect(() => {
    const cachedUser = getCachedUser();
    if (cachedUser) setUser(cachedUser);
  }, []);

  useEffect(() => {
    if (user) {
      loadApprovals();
      loadMasterData();
    }
  }, [user]);

  const loadApprovals = async () => {
    try {
      setLoading(true);
      setError(null);
      // Fetch BTO with status SPDK_DRAFT
      const data = await apiFetch('/api/bto?status=SPDK_DRAFT&limit=100');
      setApprovals(Array.isArray(data) ? data : data.rows || []);
    } catch (err: any) {
      console.error(err);
      setError('Gagal memuat daftar antrean SPDK.');
    } finally {
      setLoading(false);
    }
  };

  const loadMasterData = async () => {
    try {
      const ptData = await apiFetch('/api/bto/placeholder/pemberi-tugas-options');
      setPemberiTugasOptions((ptData.options || []).map((o: any) => ({
        value: o.id,
        label: o.namaLengkap,
        subLabel: o.jabatan || 'Karyawan',
      })));

      const transportData = await apiFetch('/api/master/ref-transport');
      setTransports((transportData || []).map((t: any) => ({
        value: t.id,
        label: t.label || t.tipe,
      })));
    } catch (err) {
      console.error('Failed to load master options:', err);
    }
  };

  const handleOpenDetail = async (btoItem: BtoItem) => {
    setSelectedBto(btoItem);
    setActiveTab('info');
    setCatatan('');
    setNomorSpdk(nomorSpdkFromBto(btoItem.nomorBto));
    setDpDetails(null);
    setDpForm([]);

    setSpdkBtoEdit({
      tujuanNama: btoItem.tujuanNama,
      estBerangkat: btoItem.estBerangkat ? toLocalDateTimeInputValue(new Date(btoItem.estBerangkat)) : '',
      estKembali: btoItem.estKembali ? toLocalDateTimeInputValue(new Date(btoItem.estKembali)) : '',
      kepentingan: btoItem.kepentingan,
      barang: btoItem.barang || '',
      pemberiTugasId: btoItem.pemberiTugasId || '',
      pemberiTugasNama: btoItem.pemberiTugasNama || '',
      transportId: btoItem.transportId || '',
    });
    
    // Load logs
    try {
      const detail = await apiFetch(`/api/bto/${btoItem.id}`);
      setApprovalLog(detail.approvalLogs || []);
    } catch (err) {
      console.error(err);
      setApprovalLog([]);
    }

    // Load DP if exists
    if (btoItem.butuhDp) {
      try {
        const dp = await apiFetch(`/api/dp/bto/${btoItem.id}`);
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
    
    if (action === 'approve' && !nomorSpdkFromBto(selectedBto.nomorBto)) {
      showAlert('Nomor BTO belum tersedia, sehingga Nomor SPDK belum bisa diturunkan otomatis.', 'warning');
      return;
    }

    setPendingAction(action);
    setCatatan('');
    setActionModalOpen(true);
  };

  const executeAction = async () => {
    if (!selectedBto || !pendingAction) return;

    if (!catatan.trim()) {
      showAlert('Catatan wajib diisi untuk penerbitan atau penolakan SPDK.', 'warning');
      return;
    }

    try {
      setSubmitting(true);
      let endpoint = '';
      let body: any = {};

      if (pendingAction === 'approve') {
        endpoint = `/api/spdk/bto/${selectedBto.id}`;
        body = {
          catatanAdmin: catatan,
          nomorSpdk: nomorSpdk || nomorSpdkFromBto(selectedBto.nomorBto) || undefined,
          btoUpdateData: {
            ...spdkBtoEdit,
            pemberiTugasId: selectedBto.pemberiTugasId || spdkBtoEdit.pemberiTugasId,
            pemberiTugasNama: selectedBto.pemberiTugasNama || spdkBtoEdit.pemberiTugasNama,
          }
        };
      } else {
        endpoint = `/api/spdk/bto/${selectedBto.id}/reject`;
        body = { catatan };
      }

      await apiFetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      showAlert(pendingAction === 'approve' ? 'SPDK berhasil diterbitkan dan dikirim.' : 'Pengajuan SPDK berhasil ditolak.', 'success');
      setActionModalOpen(false);
      setSelectedBto(null);
      loadApprovals();
      refreshMeetripBadges();
    } catch (err: any) {
      console.error(err);
      showAlert(err.message || 'Gagal memproses tindakan.', 'error');
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

  return (
    <PageTemplate
      title="Penerbitan SPDK"
      sectionTitle="Manajemen Dinas"
      description="Antrean penerbitan Surat Perintah Perjalanan Dinas Karyawan (SPDK) berstatus SPDK_DRAFT."
      headerActions={
        <>
          <MeetripHelpButton topic="admin-spdk" label="Panduan Terbitkan SPDK" />
          <Button variant="secondary" onClick={loadApprovals} loading={loading} className="gap-2">
            {!loading && <RefreshCw className="h-4 w-4" />}
            Refresh
          </Button>
        </>
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
            <div className="mb-4">
              <SearchInput value={searchQuery} onChange={setSearchQuery} placeholder="Cari SPDK, tujuan, pelaksana..." className="w-full sm:w-96" />
            </div>
            {searchedApprovals.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 text-slate-400">
            <Check className="h-10 w-10 text-emerald-500" />
            <p className="text-sm font-semibold">Tidak ada BTO yang menunggu penerbitan SPDK saat ini.</p>
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
                  <th className="px-4 py-3 text-left text-xs font-bold uppercase">Keperluan</th>
                  <th className="px-4 py-3 text-center text-xs font-bold uppercase">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {approvalsPagination.pageItems.map((btoItem) => (
                  <tr key={btoItem.id} className="border-t border-slate-200 dark:border-slate-800 hover:bg-slate-100/50 dark:hover:bg-slate-950/30">
                    <td className="px-4 py-3.5 text-sm font-semibold text-slate-700 dark:text-slate-300">
                      {docNumber(btoItem.nomorBto, btoItem.id)}
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
                    <td className="px-4 py-3.5 text-sm text-slate-600 dark:text-slate-400 truncate max-w-[200px]" title={btoItem.kepentingan}>
                      {btoItem.kepentingan}
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      <Button variant="primary" onClick={() => handleOpenDetail(btoItem)} className="gap-1.5">
                        <FileText className="h-3.5 w-3.5" />
                        Terbitkan SPDK
                      </Button>
                    </td>
                  </tr>
                ))}
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
        </>
        )}

        {/* Detail Modal */}
        {selectedBto && (
          <Modal isOpen={true} onClose={() => setSelectedBto(null)} title="Penerbitan SPDK" widthClassName="max-w-3xl">
            <div className="flex border-b border-slate-200 dark:border-slate-800">
              <button
                className={`flex-1 py-2 text-center text-sm font-bold border-b-2 transition-all ${activeTab === 'info' ? 'border-teal-500 text-teal-600 dark:text-teal-400' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                onClick={() => setActiveTab('info')}
              >
                Formulir Penerbitan
              </button>
              <button
                className={`flex-1 py-2 text-center text-sm font-bold border-b-2 transition-all ${activeTab === 'dp' ? 'border-teal-500 text-teal-600 dark:text-teal-400' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                onClick={() => setActiveTab('dp')}
              >
                Rincian Panjar (DP)
              </button>
              <button
                className={`flex-1 py-2 text-center text-sm font-bold border-b-2 transition-all ${activeTab === 'documents' ? 'border-teal-500 text-teal-600 dark:text-teal-400' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                onClick={() => setActiveTab('documents')}
              >
                Lampiran & Dokumen
              </button>
              <button
                className={`flex-1 py-2 text-center text-sm font-bold border-b-2 transition-all ${activeTab === 'logs' ? 'border-teal-500 text-teal-600 dark:text-teal-400' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                onClick={() => setActiveTab('logs')}
              >
                Log Pengajuan
              </button>
            </div>

            <div className="py-4 overflow-y-auto overflow-x-hidden max-h-[60vh] space-y-4 scrollbar-none">
              <style dangerouslySetInnerHTML={{__html: `
                .scrollbar-none::-webkit-scrollbar {
                  display: none;
                }
                .scrollbar-none {
                  -ms-overflow-style: none;
                  scrollbar-width: none;
                }
              `}} />
              {activeTab === 'info' && (
                <div className="space-y-4">
                  {/* SPDK Fields Editor */}
                  <div className="p-4 rounded-xl border border-slate-100 bg-surface-sunken dark:border-slate-800 space-y-3">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Lengkapi Informasi SPDK</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-500">Nomor SPDK (Otomatis)</label>
                        <input
                          type="text"
                          value={nomorSpdk}
                          readOnly
                          placeholder="Mengikuti Nomor BTO"
                          className="w-full text-sm rounded-lg border border-slate-200 dark:border-slate-800 p-2.5 bg-surface-sunken text-slate-700 dark:text-slate-300 focus:outline-none"
                        />
                      </div>
                      
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-500">Moda Transportasi</label>
                        <SearchSelect
                          options={transports}
                          value={spdkBtoEdit.transportId}
                          onChange={(val) => setSpdkBtoEdit(prev => ({ ...prev, transportId: val }))}
                          placeholder="Pilih moda transport..."
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-500">Nama Tujuan</label>
                        <input
                          type="text"
                          value={spdkBtoEdit.tujuanNama}
                          onChange={(e) => setSpdkBtoEdit(prev => ({ ...prev, tujuanNama: e.target.value }))}
                          className="w-full text-sm rounded-lg border border-slate-200 dark:border-slate-800 p-2.5 bg-surface-sunken focus:outline-none focus:ring-1 focus:ring-teal-500 shadow-neu-in-sm"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-500">Barang Bawaan</label>
                        <input
                          type="text"
                          value={spdkBtoEdit.barang}
                          onChange={(e) => setSpdkBtoEdit(prev => ({ ...prev, barang: e.target.value }))}
                          placeholder="Opsional..."
                          className="w-full text-sm rounded-lg border border-slate-200 dark:border-slate-800 p-2.5 bg-surface-sunken focus:outline-none focus:ring-1 focus:ring-teal-500 shadow-neu-in-sm"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-555">Tanggal Berangkat</label>
                        <input
                          type="datetime-local"
                          value={spdkBtoEdit.estBerangkat}
                          onChange={(e) => setSpdkBtoEdit(prev => ({ ...prev, estBerangkat: e.target.value }))}
                          className="w-full text-sm rounded-lg border border-slate-200 dark:border-slate-800 p-2.5 bg-surface-sunken focus:outline-none shadow-neu-in-sm"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-555">Tanggal Kembali</label>
                        <input
                          type="datetime-local"
                          value={spdkBtoEdit.estKembali}
                          onChange={(e) => setSpdkBtoEdit(prev => ({ ...prev, estKembali: e.target.value }))}
                          className="w-full text-sm rounded-lg border border-slate-200 dark:border-slate-800 p-2.5 bg-surface-sunken focus:outline-none shadow-neu-in-sm"
                        />
                      </div>

                      <div className="space-y-1 md:col-span-2">
                        <label className="text-xs font-bold text-slate-555">Pemberi Tugas</label>
                        <input
                          type="text"
                          value={selectedBto.pemberiTugasNama || spdkBtoEdit.pemberiTugasNama || 'Belum tersedia'}
                          readOnly
                          className="w-full text-sm rounded-lg border border-slate-200 dark:border-slate-800 p-2.5 bg-surface-sunken text-slate-700 dark:text-slate-300 focus:outline-none"
                        />
                      </div>

                      <div className="space-y-1 md:col-span-2">
                        <label className="text-xs font-bold text-slate-555">Keperluan Dinas / Job Description</label>
                        <textarea
                          value={spdkBtoEdit.kepentingan}
                          onChange={(e) => setSpdkBtoEdit(prev => ({ ...prev, kepentingan: e.target.value }))}
                          rows={2}
                          className="w-full text-sm rounded-lg border border-slate-200 dark:border-slate-800 p-2.5 bg-surface-sunken focus:outline-none focus:ring-1 focus:ring-teal-500 shadow-neu-in-sm"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'dp' && (
                <div className="space-y-4">
                  {selectedBto.butuhDp ? (
                    <div className="space-y-4">
                      {dpDetails && (
                        <div className="flex flex-col md:flex-row md:items-center justify-between p-3 rounded-lg bg-teal-55/10 border border-teal-500/20 text-teal-800 dark:text-teal-400 gap-2">
                          <p className="text-xs font-semibold">Mata Uang Panjar: <span className="font-bold uppercase">{dpDetails.kursUsd ? 'USD' : 'IDR'}</span></p>
                          {dpDetails.kursUsd && <p className="text-xs font-semibold">Kurs USD: <span className="font-bold">{formatMoney(dpDetails.kursUsd)}</span></p>}
                        </div>
                      )}

                      <div className="rounded-lg border border-slate-200 dark:border-slate-800 overflow-x-auto scrollbar-none">
                        <table className="w-full min-w-[600px]">
                          <thead>
                            <tr className="bg-surface-sunken text-slate-500 dark:text-slate-400">
                              <th className="px-3 py-2 text-left text-xs font-bold">Kategori</th>
                              <th className="px-3 py-2 text-center text-xs font-bold">Hari</th>
                              <th className="px-3 py-2 text-right text-xs font-bold">Biaya/Hari</th>
                              <th className="px-3 py-2 text-right text-xs font-bold">Total</th>
                            </tr>
                          </thead>  
                          <tbody>
                            {dpForm.map((item: any, idx: number) => {
                              const total = (Number(item.nilaiPerHari) || 0) * (Number(item.jumlahHari) || 1);
                              return (
                                <tr key={item.id || idx} className="border-t border-slate-250 dark:border-slate-800">
                                  <td className="px-3 py-2.5 text-xs font-semibold text-slate-800 dark:text-slate-200">{item.rincianLabel}</td>
                                  <td className="px-3 py-2.5 text-xs text-center">{item.jumlahHari}</td>
                                  <td className="px-3 py-2.5 text-xs text-right">{formatMoney(item.nilaiPerHari, item.useDollar)}</td>
                                  <td className="px-3 py-2.5 text-xs text-right font-bold text-slate-900 dark:text-white">{formatMoney(total, item.useDollar)}</td>
                                </tr>
                              );
                            })}
                            {(() => {
                              const totalSum = dpForm.reduce((acc: number, item: any) => {
                                return acc + ((Number(item.nilaiPerHari) || 0) * (Number(item.jumlahHari) || 1));
                              }, 0);
                              const useDollar = dpForm[0]?.useDollar;
                              return (
                                <tr className="border-t-2 border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50">
                                  <td colSpan={3} className="px-3 py-2.5 text-xs font-bold text-slate-800 dark:text-slate-200 text-left">TOTAL PANJAR (DP)</td>
                                  <td className="px-3 py-2.5 text-xs text-right font-black text-teal-600 dark:text-teal-400">
                                    {formatMoney(totalSum, useDollar)}
                                  </td>
                                </tr>
                              );
                            })()}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ) : (
                    <div className="py-8 flex flex-col items-center justify-center text-slate-400">
                      <Coins className="h-10 w-10 text-slate-300 mb-2" />
                      <p className="text-sm font-semibold">Dinas ini tidak mengajukan Uang Panjar (DP).</p>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'logs' && (
                <div className="space-y-4">
                  {approvalLog.length > 0 ? (
                    <div className="relative border-l-2 border-slate-200 dark:border-slate-800 ml-3 space-y-6 pb-2">
                      {approvalLog.map((log: any, idx: number) => {
                        const isFirst = idx === 0;
                        return (
                          <div key={idx} className="relative pl-6">
                            <div className={`absolute -left-[9px] top-1 h-4 w-4 rounded-full border-4 border-white dark:border-slate-900 ${isFirst ? 'bg-teal-500' : 'bg-slate-300 dark:bg-slate-600'}`} />
                            <div>
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-1">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <p className="text-sm font-extrabold text-slate-800 dark:text-slate-200">{formatStageName(log.tahap, log.aksi)}</p>
                                  <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">{log.actorNama || 'Sistem'}</span>
                                  <span className="text-[11px] text-slate-500 hidden sm:inline">•</span>
                                  {log.statusKe && (
                                    <span className={`inline-flex shrink-0 px-2.5 py-0.5 text-[10px] font-extrabold rounded-full ${getStatusBadge(log.statusKe)}`}>
                                      {formatStatusName(log.statusKe)}
                                    </span>
                                  )}
                                </div>
                                <p className="text-[10px] font-bold text-slate-400 whitespace-nowrap">
                                  {new Date(log.createdAt).toLocaleString('id-ID', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                </p>
                              </div>
                              <p className="text-xs text-slate-600 dark:text-slate-400">
                                {formatActionName(log.aksi)}
                                {log.statusDari && log.statusKe ? (
                                  <>
                                    {' '}dari <span className="font-bold">{formatStatusName(log.statusDari)}</span> ke <span className="font-bold">{formatStatusName(log.statusKe)}</span>
                                  </>
                                ) : log.statusKe ? (
                                  <> ke <span className="font-bold">{formatStatusName(log.statusKe)}</span></>
                                ) : null}
                              </p>
                              {log.catatan && (
                                <div className="mt-2 p-3 bg-surface-sunken/50 rounded-xl border border-slate-100 dark:border-slate-800/60">
                                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Catatan</p>
                                  <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed italic">{log.catatan}</p>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400 text-center py-4">Belum ada riwayat persetujuan</p>
                  )}
                </div>
              )}
              {activeTab === 'documents' && (
                <div className="space-y-4">
                  <div className="divide-y divide-slate-100 dark:divide-slate-800 border border-slate-200/80 dark:border-slate-800 rounded-xl overflow-hidden bg-slate-50/20 dark:bg-slate-950/20">
                    {/* BTO Printout */}
                    <div className="flex items-center justify-between p-3.5 text-xs">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-teal-50 dark:bg-teal-950/40 text-teal-600 flex items-center justify-center">
                          <FileText className="w-4 h-4" />
                        </div>
                        <span className="font-semibold text-slate-700 dark:text-slate-200">Form Cetak BTO (PDF)</span>
                      </div>
                      <DocumentDownloadButton
                        path={`/api/document/bto/${selectedBto.id}/pdf`}
                        className="px-3 py-1.5 rounded-lg font-bold text-teal-600 dark:text-teal-400"
                      >
                        Cetak PDF
                      </DocumentDownloadButton>
                    </div>

                    {/* DP Printout */}
                    {selectedBto.butuhDp && (
                      <div className="flex items-center justify-between p-3.5 text-xs">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-600 flex items-center justify-center">
                            <Coins className="w-4 h-4" />
                          </div>
                          <span className="font-semibold text-slate-700 dark:text-slate-200">Form Cetak DP / Panjar (PDF)</span>
                        </div>
                        <DocumentDownloadButton
                          path={`/api/document/dp/${selectedBto.id}/pdf`}
                          className="px-3 py-1.5 rounded-lg font-bold text-amber-600 dark:text-amber-400"
                        >
                          Cetak PDF
                        </DocumentDownloadButton>
                      </div>
                    )}

                    {/* SPDK Printout */}
                    <div className="flex items-center justify-between p-3.5 text-xs">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-cyan-50 dark:bg-cyan-950/40 text-cyan-600 flex items-center justify-center">
                          <FileText className="w-4 h-4" />
                        </div>
                        <span className="font-semibold text-slate-700 dark:text-slate-200">Form Cetak SPDK (PDF)</span>
                      </div>
                      <DocumentDownloadButton
                        path={`/api/document/spdk/${selectedBto.id}/pdf`}
                        className="px-3 py-1.5 rounded-lg font-bold text-cyan-600 dark:text-cyan-400"
                      >
                        Cetak PDF
                      </DocumentDownloadButton>
                    </div>

                    {/* BTO Uploaded Attachment */}
                    {selectedBto.lampiranPath && (
                      <div className="flex items-center justify-between p-3.5 text-xs">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-purple-50 dark:bg-purple-950/40 text-purple-600 flex items-center justify-center">
                            <Paperclip className="w-4 h-4" />
                          </div>
                          <span className="font-semibold text-slate-700 dark:text-slate-200 truncate max-w-[220px]" title={selectedBto.lampiranNama || 'Lampiran'}>
                            {selectedBto.lampiranNama || 'Dokumen Lampiran BTO'}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => openDocument(`/uploads/${selectedBto.lampiranPath}`)}
                          className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 font-bold text-purple-600 dark:text-purple-400 transition-colors"
                        >
                          Lihat File
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
              <div className="flex gap-2">
                <Button variant="danger" onClick={() => confirmAction('reject')}>
                  Tolak Pengajuan
                </Button>
                <Button variant="primary" onClick={() => confirmAction('approve')}>
                  Terbitkan & Kirim SPDK
                </Button>
              </div>
            </div>
          </Modal>
        )}

        {/* Action Confirmation Modal */}
        <Modal isOpen={actionModalOpen} onClose={() => setActionModalOpen(false)} title="Konfirmasi Tindakan">
          <div className="space-y-4 pt-1">
            <div className="p-3.5 rounded-xl bg-teal-500/10 dark:bg-teal-950/40 border border-teal-500/20 dark:border-teal-500/30 text-xs text-slate-700 dark:text-slate-300 flex items-start gap-2.5 shadow-sm">
              <Info className="h-4 w-4 text-teal-600 dark:text-teal-400 flex-shrink-0 mt-0.5" />
              <div>
                {pendingAction === 'approve' ? (
                  <p>SPDK akan diterbitkan secara resmi dengan nomor <strong className="text-teal-700 dark:text-teal-300">{nomorSpdk}</strong> dan dikirim ke tahap persetujuan KABAG SPDK. Catatan penerbitan wajib diisi.</p>
                ) : (
                  <p>Anda akan menolak pengajuan pada tahap penerbitan SPDK. Alasan wajib diisi pada kolom catatan.</p>
                )}
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">Catatan Tindakan (Wajib)</label>
              <textarea
                value={catatan}
                onChange={(e) => setCatatan(e.target.value)}
                placeholder={pendingAction === 'approve' ? 'Masukkan catatan penerbitan SPDK...' : 'Masukkan alasan penolakan SPDK...'}
                rows={3}
                className="w-full text-xs rounded-xl border border-slate-200 dark:border-slate-800 p-3 bg-surface-sunken resize-none focus:outline-none focus:ring-1 focus:ring-teal-500"
              />
            </div>

            <div className="pt-2 flex justify-end gap-2.5 flex-wrap">
              <Button variant="secondary" onClick={() => setActionModalOpen(false)} disabled={submitting}>
                Batal
              </Button>
              <Button variant={pendingAction === 'approve' ? 'primary' : 'danger'} onClick={executeAction} loading={submitting} disabled={!catatan.trim()}>
                Konfirmasi
              </Button>
            </div>
          </div>
        </Modal>
    </PageTemplate>
  );
}
