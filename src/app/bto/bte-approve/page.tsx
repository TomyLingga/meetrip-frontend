'use client';

import React, { useEffect, useState } from 'react';
import PageTemplate from '@/components/layout/PageTemplate';
import SearchInput from '@/components/form/SearchInput';
import Modal from '@/components/ui/Modal';
import Table from '@/components/ui/Table';
import Button from '@/components/ui/Button';
import { apiFetch, openDocument, refreshMeetripBadges } from '@/utils/api';
import { useAlert } from '@/context/FeedbackContext';
import { MeetripHelpButton } from '@/components/help/MeetripHelpGuide';
import {
  Check, X, RefreshCw, FileText, Clock, AlertCircle, Printer,
  ChevronRight, Banknote, Receipt, History
} from 'lucide-react';

type BteItem = {
  id: string;
  btoId: string;
  status: string;
  tujuanNama?: string | null;
  employeeNama?: string | null;
  spdkNumber?: string | null;
  nomorBto?: string | null;
  totalIdr?: string | null;
  totalUsd?: string | null;
  exchangeRateUsd?: string | null;
  laporanPath?: string | null;
  kuitansiPath?: string | null;
  submittedAt?: string | null;
  updatedAt?: string | null;
  bto?: {
    id: string;
    nomorBto?: string | null;
    employeeId: string;
    employeeNama?: string | null;
    tujuanNama: string;
    wilayahTipe?: string | null;
    estBerangkat: string;
    estKembali: string;
    status: string;
  };
  bteRincian?: Array<{
    id: string;
    rincianLabel: string;
    nilaiTotal: string;
    useDollar: boolean;
    paguSaatInput?: string | null;
  }>;
  bteBiayaLain?: Array<{
    id: string;
    keterangan: string;
    nilai: string;
    useDollar: boolean;
  }>;
  dp?: {
    id: string;
    totalIdr?: string | null;
    totalUsd?: string | null;
  } | null;
};

type ApprovalLog = {
  id: string;
  aksi: string;
  actorNama?: string | null;
  catatan?: string | null;
  createdAt: string;
};

export default function BteApprovePage() {
  const { showAlert } = useAlert();
  const [bteList, setBteList] = useState<BteItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBte, setSelectedBte] = useState<BteItem | null>(null);
  const [activeTab, setActiveTab] = useState<'info' | 'rincian' | 'biaya-lain' | 'logs'>('info');
  const [actionModalOpen, setActionModalOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState<'approve' | 'reject' | 'revision' | null>(null);
  const [catatan, setCatatan] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [logs, setLogs] = useState<ApprovalLog[]>([]);
  const [logLoading, setLogLoading] = useState(false);
  const [dpDetails, setDpDetails] = useState<any>(null);
  const [filter, setFilter] = useState<'pending' | 'all'>('pending');
  const [searchQuery, setSearchQuery] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const res = await apiFetch('/api/bte/admin/list?limit=100');
      setBteList(res || []);
    } catch {
      showAlert('Gagal memuat antrean persetujuan BTE', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const formatStatusName = (status: string) => {
    switch (status) {
      case 'DRAFT': return 'Draft';
      case 'SUBMITTED': return 'Submitted BTO';
      case 'ADMIN_DP_REVIEW': return 'Review Admin DP';
      case 'PT_REVIEW': return 'Pemberi Tugas Review';
      case 'KABAG_REVIEW': return 'Review Kabag / Kasi';
      case 'SDM_REVIEW': return 'Review SDM';
      case 'SPDK_DRAFT': return 'Draft SPDK';
      case 'REVISION': return 'Revisi BTO';
      case 'REVISION_DP': return 'Revisi DP / Panjar';
      case 'ACTIVE': return 'SPDK Aktif';
      case 'ATTENDED': return 'Sudah Absen';
      case 'REPORT_UPLOADED': return 'Laporan Diunggah';
      case 'BTE_DRAFT': return 'BTE Draft';
      case 'ADMIN_BTE_REVIEW': return 'Review Admin BTE';
      case 'BTE_PAYMENT': return 'Penyelesaian Keuangan BTE';
      case 'COMPLETED': return 'Selesai';
      case 'REJECTED': return 'Ditolak';
      default: return status;
    }
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

  const getStatusColorBadge = (status: string) => {
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

  const loadLogs = async (btoId: string) => {
    setLogLoading(true);
    try {
      const res = await apiFetch(`/api/bto/${btoId}`);
      const sorted = (res.approvalLogs || []).sort((a: any, b: any) => 
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      );
      setLogs(sorted);
    } catch {
      setLogs([]);
    } finally {
      setLogLoading(false);
    }
  };

  const handleOpen = async (bte: BteItem) => {
    setSelectedBte(bte);
    setActiveTab('info');
    const targetBtoId = bte.bto?.id || bte.btoId;
    loadLogs(targetBtoId);
    if (targetBtoId) {
      const dp = await apiFetch(`/api/dp/bto/${targetBtoId}`).catch(() => null);
      setDpDetails(dp);
    } else {
      setDpDetails(null);
    }
  };

  const confirmAction = (action: 'approve' | 'reject' | 'revision') => {
    setPendingAction(action);
    setCatatan('');
    setActionModalOpen(true);
  };

  const executeAction = async () => {
    if (!selectedBte || !pendingAction) return;
    if (!catatan.trim()) {
      showAlert('Catatan wajib diisi untuk persetujuan, penolakan, atau revisi.', 'warning');
      return;
    }
    setSubmitting(true);
    try {
      const payload = {
        aksi: pendingAction,
        catatan: catatan.trim() || undefined
      };
      await apiFetch(`/api/bte/${selectedBte.id}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      showAlert(`Aksi BTE ${pendingAction} berhasil dieksekusi!`, 'success');
      setActionModalOpen(false);
      setSelectedBte(null);
      load();
      refreshMeetripBadges();
    } catch (err: any) {
      showAlert(err.message || 'Gagal memproses aksi', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handlePrintBte = (btoId: string) => {
    openDocument(`/api/document/bte/${btoId}/pdf`);
  };

  const handlePrintDp = (btoId: string) => {
    openDocument(`/api/document/dp/${btoId}/pdf`);
  };

  const handlePrintBto = (btoId: string) => {
    openDocument(`/api/document/bto/${btoId}/pdf`);
  };

  const handlePrintSpdk = (btoId: string) => {
    openDocument(`/api/document/spdk/${btoId}/pdf`);
  };

  const fmtDate = (v: any) => v ? new Date(v).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) : '-';
  const formatMoney = (v: any, useDollar: boolean = false) => {
    const num = Number(v) || 0;
    if (useDollar) {
      return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(num);
    }
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(num);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'SUBMITTED':
      case 'ADMIN_REVIEW':
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400 border border-amber-250">Review Admin</span>;
      case 'PENDING_PAYMENT':
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400 border border-blue-250">Menunggu Bayar</span>;
      case 'PAID':
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400 border border-emerald-250">Lunas</span>;
      case 'REJECTED':
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-400 border border-red-250">Ditolak</span>;
      case 'REVISION':
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-purple-50 text-purple-700 dark:bg-purple-950/30 dark:text-purple-400 border border-purple-250">Revisi</span>;
      default:
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-surface-sunken text-slate-700 dark:text-slate-400 border border-slate-200">{status}</span>;
    }
  };

  const filteredData = (filter === 'pending'
    ? bteList.filter(b => ['ADMIN_REVIEW', 'SUBMITTED'].includes(b.status))
    : bteList).filter((b) => {
      if (!searchQuery) return true;
      const q = searchQuery.toLowerCase();
      return (
        b.tujuanNama?.toLowerCase().includes(q) ||
        b.employeeNama?.toLowerCase().includes(q) ||
        b.spdkNumber?.toLowerCase().includes(q) ||
        b.nomorBto?.toLowerCase().includes(q)
      );
    });

  const columns = [
    {
      header: 'Karyawan',
      render: (bte: BteItem) => (
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full overflow-hidden bg-teal-100 dark:bg-teal-900/30 shrink-0">
            <img
              src={`${process.env.NEXT_PUBLIC_PORTAL_URL || 'http://localhost:3002'}/uploads/profiles/${bte.bto?.employeeId}.jpg`}
              alt={bte.bto?.employeeNama || ''}
              onError={(e) => { e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(bte.bto?.employeeNama || 'U')}&background=0d9488&color=fff&bold=true`; }}
              className="w-full h-full object-cover"
            />
          </div>
          <div>
            <p className="text-sm font-bold text-slate-900 dark:text-white">{bte.bto?.employeeNama || '-'}</p>
            <p className="text-[10px] text-slate-400">{bte.bto?.nomorBto || 'Draft'}</p>
          </div>
        </div>
      )
    },
    {
      header: 'Tujuan & Periode',
      render: (bte: BteItem) => (
        <div>
          <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">{bte.bto?.tujuanNama}</p>
          <p className="text-[10px] text-slate-400 mt-0.5">{fmtDate(bte.bto?.estBerangkat)} — {fmtDate(bte.bto?.estKembali)}</p>
        </div>
      )
    },
    {
      header: 'Total Biaya BTE',
      render: (bte: BteItem) => (
        <span className="text-xs font-bold text-slate-800 dark:text-slate-200">{formatMoney(bte.totalIdr)}</span>
      )
    },
    {
      header: 'Status',
      render: (bte: BteItem) => getStatusBadge(bte.status)
    },
    {
      header: '',
      render: (bte: BteItem) => (
        <button
          onClick={() => handleOpen(bte)}
          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-[11px] font-bold bg-teal-50 text-teal-700 hover:bg-teal-100 dark:bg-teal-500/10 dark:text-teal-400 dark:hover:bg-teal-500/20 border border-teal-200/40 transition-colors"
        >
          <FileText className="h-3 w-3" /> Review
        </button>
      )
    }
  ];

  return (
    <PageTemplate
      title="Persetujuan BTE"
      sectionTitle="Manajemen Dinas"
      description="Tinjau dan verifikasi laporan realisasi pengeluaran perjalanan dinas karyawan (Business Trip Expenses)."
      headerActions={
        <div className="flex flex-wrap gap-2">
          <MeetripHelpButton topic="admin-bte" label="Panduan Review BTE" />
          <button
            onClick={() => setFilter('pending')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${filter === 'pending' ? 'bg-amber-500 text-white shadow-neu-sm' : 'btn-secondary'}`}
          >
            Menunggu Review {bteList.filter(b => ['ADMIN_REVIEW', 'SUBMITTED'].includes(b.status)).length > 0 && (
              <span className="ml-1 bg-white/30 px-1 rounded">{bteList.filter(b => ['ADMIN_REVIEW', 'SUBMITTED'].includes(b.status)).length}</span>
            )}
          </button>
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${filter === 'all' ? 'bg-slate-700 text-white shadow-neu-sm' : 'btn-secondary'}`}
          >
            Semua
          </button>
          <Button variant="secondary" onClick={load} loading={loading} className="gap-2">
            {!loading && <RefreshCw className="h-4 w-4" />}
            <span>Refresh</span>
          </Button>
        </div>
      }
    >
      <div className="space-y-6">
        {loading ? (
          <div className="flex items-center justify-center py-16 gap-3 text-slate-400">
            <RefreshCw className="h-5 w-5 animate-spin" />
            <p className="text-sm font-medium">Memuat data...</p>
          </div>
        ) : (
          <>
            <div className="mb-4">
              <SearchInput value={searchQuery} onChange={setSearchQuery} placeholder="Cari SPDK, BTO, tujuan, pelaksana..." className="w-full sm:w-96" />
            </div>
            {filteredData.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 text-slate-500">
            <Clock className="h-10 w-10 text-slate-400" />
            <p className="text-sm font-semibold">Tidak ada antrean klaim BTE pada filter ini.</p>
          </div>
        ) : (
          <Table columns={columns} data={filteredData} keyExtractor={(b) => b.id} />
        )}
        </>
        )}
      </div>

      <Modal
        isOpen={!!selectedBte}
        onClose={() => setSelectedBte(null)}
        title="Review Realisasi Pengeluaran (BTE)"
        widthClassName="w-full max-w-3xl max-h-[90vh]"
      >
        {selectedBte && (
          <div className="overflow-y-auto overflow-x-hidden max-h-[calc(90vh-130px)] space-y-5 pr-1 pt-1">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div className="flex gap-2">
                <button
                  className={`px-4 py-1.5 text-xs font-bold border-b-2 transition-all ${activeTab === 'info' ? 'border-teal-500 text-teal-600 dark:text-teal-400 font-extrabold' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                  onClick={() => setActiveTab('info')}
                >
                  Informasi Umum
                </button>
                <button
                  className={`px-4 py-1.5 text-xs font-bold border-b-2 transition-all ${activeTab === 'rincian' ? 'border-teal-500 text-teal-600 dark:text-teal-400 font-extrabold' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                  onClick={() => setActiveTab('rincian')}
                >
                  Rincian Biaya
                </button>
                <button
                  className={`px-4 py-1.5 text-xs font-bold border-b-2 transition-all ${activeTab === 'biaya-lain' ? 'border-teal-500 text-teal-600 dark:text-teal-400 font-extrabold' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                  onClick={() => setActiveTab('biaya-lain')}
                >
                  Biaya Lainnya
                </button>
                <button
                  className={`px-4 py-1.5 text-xs font-bold border-b-2 transition-all ${activeTab === 'logs' ? 'border-teal-500 text-teal-600 dark:text-teal-400 font-extrabold' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                  onClick={() => setActiveTab('logs')}
                >
                  History Log
                </button>
              </div>
            </div>

            {activeTab === 'info' && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="glass-panel p-4 space-y-1">
                    <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">Karyawan</p>
                    <p className="text-sm font-bold text-slate-800 dark:text-white">{selectedBte.bto?.employeeNama}</p>
                    <p className="text-[10px] text-slate-400">ID Karyawan: {selectedBte.bto?.employeeId}</p>
                  </div>
                  <div className="glass-panel p-4 space-y-1">
                    <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">Tujuan Dinas</p>
                    <p className="text-sm font-bold text-slate-800 dark:text-white">{selectedBte.bto?.tujuanNama}</p>
                    <p className="text-[10px] text-slate-400">Status Dinas: {selectedBte.bto?.status}</p>
                  </div>
                </div>

                <div className="glass-panel p-4 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <p className="text-xs font-bold text-slate-700 dark:text-slate-400">Informasi Pembiayaan & Lampiran</p>
                    <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-2 w-full sm:w-auto">
                      <button
                        type="button"
                        onClick={() => handlePrintBto(selectedBte.btoId)}
                        className="btn-secondary w-full sm:w-auto justify-center px-2.5 py-1.5 rounded-lg text-[10px] font-bold flex items-center gap-1"
                      >
                        <Printer className="h-3 w-3" /> Cetak BTO
                      </button>
                      {selectedBte.dp?.id && (
                        <button
                          type="button"
                          onClick={() => handlePrintDp(selectedBte.btoId)}
                          className="btn-secondary w-full sm:w-auto justify-center px-2.5 py-1.5 rounded-lg text-[10px] font-bold flex items-center gap-1"
                        >
                          <Printer className="h-3 w-3" /> Cetak DP
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => handlePrintSpdk(selectedBte.btoId)}
                        className="btn-secondary w-full sm:w-auto justify-center px-2.5 py-1.5 rounded-lg text-[10px] font-bold flex items-center gap-1"
                      >
                        <Printer className="h-3 w-3" /> Cetak SPDK
                      </button>
                      <button
                        type="button"
                        onClick={() => handlePrintBte(selectedBte.btoId)}
                        className="btn-secondary w-full sm:w-auto justify-center px-2.5 py-1.5 rounded-lg text-[10px] font-bold flex items-center gap-1"
                      >
                        <Printer className="h-3 w-3" /> Cetak BTE
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3 border-t border-slate-100 dark:border-slate-800 pt-3">
                    <div>
                      <p className="text-[9px] text-slate-500 uppercase font-bold tracking-widest">Total Klaim Realisasi</p>
                      <p className="text-sm font-black text-slate-900 dark:text-white">{formatMoney(selectedBte.totalIdr)}</p>
                    </div>
                    <div>
                      <p className="text-[9px] text-slate-500 uppercase font-bold tracking-widest">Panjar Diberikan (DP)</p>
                      <p className="text-sm font-black text-slate-900 dark:text-white">{formatMoney(selectedBte.dp?.totalIdr || 0)}</p>
                    </div>
                    <div>
                      <p className="text-[9px] text-slate-500 uppercase font-bold tracking-widest">Kurang / Lebih Bayar</p>
                      {(() => {
                        const diff = (Number(selectedBte.totalIdr) || 0) - (Number(selectedBte.dp?.totalIdr) || 0);
                        return (
                          <p className={`text-sm font-black ${diff > 0 ? 'text-rose-600' : diff < 0 ? 'text-emerald-600' : 'text-slate-500'}`}>
                            {diff > 0 ? `Kurang: ${formatMoney(diff)}` : diff < 0 ? `Lebih: ${formatMoney(Math.abs(diff))}` : 'Pas'}
                          </p>
                        );
                      })()}
                    </div>
                  </div>

                  {(() => {
                    const diff = (Number(selectedBte.totalIdr) || 0) - (Number(selectedBte.dp?.totalIdr) || 0);
                    if (diff > 0) {
                      return (
                        <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-800 dark:text-amber-300 font-semibold flex items-start gap-2">
                          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                          <span>
                            <strong>Kekurangan Pembayaran:</strong> Realisasi pengeluaran lebih besar dari panjar. Perusahaan wajib mentransfer kekurangan sebesar <strong>{formatMoney(diff)}</strong> kepada karyawan ({selectedBte.bto?.employeeNama}).
                          </span>
                        </div>
                      );
                    } else if (diff < 0) {
                      return (
                        <div className="p-3 rounded-xl bg-teal-500/10 border border-teal-500/20 text-xs text-teal-800 dark:text-teal-300 font-semibold flex items-start gap-2">
                          <Check className="w-4 h-4 shrink-0 mt-0.5" />
                          <span>
                            <strong>Kelebihan Pembayaran:</strong> Realisasi pengeluaran lebih kecil dari panjar. Karyawan ({selectedBte.bto?.employeeNama}) wajib mengembalikan kelebihan dana sebesar <strong>{formatMoney(Math.abs(diff))}</strong> ke kas perusahaan.
                          </span>
                        </div>
                      );
                    } else {
                      return (
                        <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs text-slate-600 dark:text-slate-400 font-semibold flex items-start gap-2">
                          <Check className="w-4 h-4 shrink-0 mt-0.5" />
                          <span>
                            <strong>Sudah Pas:</strong> Nilai realisasi pengeluaran sama persis dengan panjar yang diberikan. Tidak ada sisa dana yang harus ditransfer atau dikembalikan.
                          </span>
                        </div>
                      );
                    }
                  })()}

                  <div className="grid grid-cols-2 gap-3 border-t border-slate-100 dark:border-slate-800 pt-3">
                    <div>
                      <p className="text-[9px] text-slate-500 uppercase font-bold tracking-widest mb-1.5">Laporan Kegiatan</p>
                      {selectedBte.laporanPath ? (
                        <button
                          type="button"
                          onClick={() => openDocument(`/uploads/${selectedBte.laporanPath}`)}
                          className="text-xs text-teal-600 font-bold hover:underline inline-flex items-center gap-1 bg-teal-50 dark:bg-teal-500/10 dark:text-teal-400 px-2.5 py-1.5 rounded-lg"
                        >
                          <FileText className="h-3.5 w-3.5" /> Lihat Laporan
                        </button>
                      ) : (
                        <span className="text-xs text-slate-400 italic">Belum diupload</span>
                      )}
                    </div>
                    <div>
                      <p className="text-[9px] text-slate-500 uppercase font-bold tracking-widest mb-1.5">Kuitansi / Bukti Bayar</p>
                      {selectedBte.kuitansiPath ? (
                        <button
                          type="button"
                          onClick={() => openDocument(`/uploads/${selectedBte.kuitansiPath}`)}
                          className="text-xs text-teal-600 font-bold hover:underline inline-flex items-center gap-1 bg-teal-50 dark:bg-teal-500/10 dark:text-teal-400 px-2.5 py-1.5 rounded-lg"
                        >
                          <Receipt className="h-3.5 w-3.5" /> Lihat Bukti Kuitansi
                        </button>
                      ) : (
                        <span className="text-xs text-slate-400 italic">Belum diupload</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'rincian' && (
              <div className="space-y-3">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Detail Realisasi per Komponen Biaya</p>
                <div className="rounded-xl border border-slate-200 dark:border-slate-800 overflow-x-auto scrollbar-none bg-surface-card shadow-neu">
                  <style dangerouslySetInnerHTML={{__html: `
                    .scrollbar-none::-webkit-scrollbar {
                      display: none;
                    }
                    .scrollbar-none {
                      -ms-overflow-style: none;
                      scrollbar-width: none;
                    }
                  `}} />
                  <table className="w-full text-left text-xs border-collapse min-w-[500px]">
                    <thead>
                      <tr className="bg-surface-sunken text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
                        <th className="px-4 py-2.5 font-bold">Komponen Biaya</th>
                        <th className="px-4 py-2.5 font-bold text-right">Panjar Diajukan (DP)</th>
                        <th className="px-4 py-2.5 font-bold text-right">Realisasi BTE</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {selectedBte.bteRincian?.map((item) => {
                        const rId = (item as any).rincianId || item.id;
                        const dpMatch = dpDetails?.rincian?.find((r: any) => r.rincianId === rId);
                        const valPanjar = dpMatch ? Number(dpMatch.nilaiTotal ?? 0) : Number((item as any).paguSaatInput ?? 0);
                        const useDollarPanjar = dpMatch ? Boolean(dpMatch.useDollar) : Boolean(item.useDollar);

                        return (
                          <tr key={item.id} className="hover:bg-slate-100/50 dark:hover:bg-slate-800/40 transition-colors">
                            <td className="px-4 py-3 font-semibold text-slate-700 dark:text-slate-300">{item.rincianLabel}</td>
                            <td className="px-4 py-3 text-right text-amber-600 dark:text-amber-400 font-semibold">
                              {formatMoney(valPanjar, useDollarPanjar)}
                            </td>
                            <td className="px-4 py-3 text-right font-bold text-slate-900 dark:text-white">
                              {formatMoney(item.nilaiTotal, item.useDollar)}
                            </td>
                          </tr>
                        );
                      })}
                      {(!selectedBte.bteRincian || selectedBte.bteRincian.length === 0) && (
                        <tr>
                          <td colSpan={3} className="px-4 py-6 text-center text-slate-400 italic">Tidak ada rincian biaya</td>
                        </tr>
                      )}
                      {selectedBte?.bteRincian && selectedBte.bteRincian.length > 0 && (
                        <tr className="bg-surface-sunken font-extrabold border-t border-slate-200 dark:border-slate-800">
                          <td className="px-4 py-3 text-slate-900 dark:text-white">TOTAL</td>
                          <td className="px-4 py-3 text-right text-amber-600 dark:text-amber-400 font-bold">
                            {formatMoney(
                              dpDetails?.rincian && dpDetails.rincian.length > 0
                                ? dpDetails.rincian.reduce((acc: number, r: any) => acc + (Number(r.nilaiTotal) || 0), 0)
                                : selectedBte.bteRincian.reduce((acc: number, item: any) => acc + (Number(item.paguSaatInput) || 0), 0)
                            )}
                          </td>
                          <td className="px-4 py-3 text-right text-teal-600 dark:text-teal-400 font-bold">
                            {formatMoney(selectedBte.bteRincian.reduce((acc: number, item: any) => acc + (Number(item.nilaiTotal) || 0), 0))}
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeTab === 'biaya-lain' && (
              <div className="space-y-3">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Pengeluaran Lainnya (Non-Pagu)</p>
                <div className="rounded-xl border border-slate-200 dark:border-slate-800 overflow-x-auto scrollbar-none bg-surface-card shadow-neu">
                  <style dangerouslySetInnerHTML={{__html: `
                    .scrollbar-none::-webkit-scrollbar {
                      display: none;
                    }
                    .scrollbar-none {
                      -ms-overflow-style: none;
                      scrollbar-width: none;
                    }
                  `}} />
                  <table className="w-full text-left text-xs border-collapse min-w-[500px]">
                    <thead>
                      <tr className="bg-surface-sunken text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
                        <th className="px-4 py-2.5 font-bold">Deskripsi Pengeluaran</th>
                        <th className="px-4 py-2.5 font-bold text-right">Nilai</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {selectedBte.bteBiayaLain?.map((item) => (
                        <tr key={item.id} className="hover:bg-slate-100/50 dark:hover:bg-slate-800/40 transition-colors">
                          <td className="px-4 py-3 font-semibold text-slate-750 dark:text-slate-300">{item.keterangan}</td>
                          <td className="px-4 py-3 text-right font-bold text-slate-900 dark:text-white">{formatMoney(item.nilai)}</td>
                        </tr>
                      ))}
                      {(!selectedBte.bteBiayaLain || selectedBte.bteBiayaLain.length === 0) && (
                        <tr>
                          <td colSpan={2} className="px-4 py-6 text-center text-slate-400 italic">Tidak ada biaya lain-lain</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeTab === 'logs' && (
              <div className="space-y-3">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Riwayat Approval Log Perjalanan Dinas</p>
                {logLoading ? (
                  <div className="flex items-center justify-center py-6 gap-2 text-slate-400">
                    <RefreshCw className="h-4 w-4 animate-spin text-teal-600" />
                    <span className="text-xs">Memuat history log...</span>
                  </div>
                ) : logs.length === 0 ? (
                  <p className="text-xs text-slate-400 italic text-center py-6">Belum ada history log.</p>
                ) : (
                  <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-surface-card p-5 shadow-neu">
                    <div className="relative border-l-2 border-slate-200 dark:border-slate-800 ml-3 space-y-6 pb-2">
                      {logs.map((log: any, idx: number) => {
                        const isFirst = idx === logs.length - 1;
                        return (
                          <div key={idx} className="relative pl-6 text-xs text-left">
                            <div className={`absolute -left-[9px] top-1 h-4 w-4 rounded-full border-4 border-white dark:border-slate-900 ${isFirst ? 'bg-teal-500' : 'bg-slate-300 dark:bg-slate-600'}`} />
                            <div>
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-1">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <p className="font-extrabold text-slate-800 dark:text-slate-200">{formatStageName(log.tahap, log.aksi)}</p>
                                  <span className="font-semibold text-slate-500 dark:text-slate-400">{log.actorNama || 'Sistem'}</span>
                                  <span className="text-slate-500 hidden sm:inline">•</span>
                                  {log.statusKe && (
                                    <span className={`inline-flex shrink-0 px-2.5 py-0.5 text-[10px] font-extrabold rounded-full ${getStatusColorBadge(log.statusKe)}`}>
                                      {formatStatusName(log.statusKe)}
                                    </span>
                                  )}
                                </div>
                                <p className="text-[10px] font-bold text-slate-400 whitespace-nowrap">
                                  {new Date(log.createdAt).toLocaleString('id-ID', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                </p>
                              </div>
                              <p className="text-slate-600 dark:text-slate-400">
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
                                  <p className="leading-relaxed italic text-slate-700 dark:text-slate-300">{log.catatan}</p>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}

            {['ADMIN_REVIEW', 'SUBMITTED'].includes(selectedBte.status) && (
              <div className="flex justify-end gap-2.5 pt-4 border-t border-slate-200 dark:border-slate-800 flex-wrap">
                <Button variant="danger" onClick={() => confirmAction('reject')}>
                  Tolak BTE
                </Button>
                <Button variant="amber" onClick={() => confirmAction('revision')}>
                  Minta Revisi
                </Button>
                <Button variant="primary" onClick={() => confirmAction('approve')}>
                  Setujui & Approve BTE
                </Button>
              </div>
            )}
          </div>
        )}
      </Modal>

      <Modal
        isOpen={actionModalOpen}
        onClose={() => setActionModalOpen(false)}
        title="Konfirmasi Tindakan"
        widthClassName="w-full max-w-md"
      >
        <div className="space-y-4 pt-1">
          <div className="p-3.5 rounded-xl bg-teal-500/10 dark:bg-teal-950/40 border border-teal-500/20 dark:border-teal-500/30 text-xs text-slate-700 dark:text-slate-300 flex items-start gap-2.5 shadow-sm">
            <AlertCircle className="h-4 w-4 text-teal-600 dark:text-teal-400 flex-shrink-0 mt-0.5" />
            <p>
              Anda akan melakukan tindakan <strong className="text-teal-700 dark:text-teal-300 uppercase">{pendingAction}</strong> pada klaim realisasi BTE ini.
              {' Catatan tindakan wajib diisi.'}
            </p>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Catatan / Alasan (Wajib)</label>
            <textarea
              value={catatan}
              onChange={(e) => setCatatan(e.target.value)}
              placeholder={pendingAction === 'approve' ? 'Masukkan catatan persetujuan...' : 'Masukkan alasan...'}
              rows={3}
              className="w-full text-xs rounded-xl border border-slate-200 dark:border-slate-800 p-3 bg-surface-sunken resize-none focus:outline-none focus:ring-1 focus:ring-teal-500"
            />
          </div>

          <div className="pt-2 flex justify-end gap-2.5 flex-wrap">
            <button
              type="button"
              onClick={() => setActionModalOpen(false)}
              className="btn-secondary px-4 py-2 text-xs font-bold rounded-xl"
              disabled={submitting}
            >
              Batal
            </button>
            <Button
              type="button"
              variant={pendingAction === 'approve' ? 'primary' : pendingAction === 'revision' ? 'amber' : 'danger'}
              onClick={executeAction}
              loading={submitting}
              disabled={!catatan.trim()}
            >
              Konfirmasi
            </Button>
          </div>
        </div>
      </Modal>
    </PageTemplate>
  );
}
