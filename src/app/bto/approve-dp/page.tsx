'use client';

import React, { useEffect, useState } from 'react';
import PageTemplate from '@/components/layout/PageTemplate';
import SearchInput from '@/components/form/SearchInput';
import Modal from '@/components/ui/Modal';

import Button from '@/components/ui/Button';
import { apiFetch, refreshMeetripBadges, getCachedUser } from '@/utils/api';
import { useAlert } from '@/context/FeedbackContext';
import BusinessTripDetailModal from '../components/BusinessTripDetailModal';
import DocumentDownloadButton from '../components/DocumentDownloadButton';
import PaginationControls from '@/components/ui/PaginationControls';
import usePagination from '@/hooks/usePagination';
import { MeetripHelpButton } from '@/components/help/MeetripHelpGuide';
import { 
  Check, X, RefreshCw, FileText, Info, Coins, History, 
  MapPin, Clock, Briefcase, Car, Calendar, Package, AlertCircle
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

export default function PersetujuanDpPage() {
  const [user, setUser] = useState<CachedUser | null>(null);
  const { showAlert } = useAlert();
  const [approvals, setApprovals] = useState<BtoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
  const [pendingAction, setPendingAction] = useState<'approve' | 'reject' | 'revision' | null>(null);
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
    }
  }, [user]);

  const loadApprovals = async () => {
    try {
      setLoading(true);
      setError(null);
      // Fetch BTO with status ADMIN_DP_REVIEW
      const data = await apiFetch('/api/bto?status=ADMIN_DP_REVIEW&limit=100');
      setApprovals(Array.isArray(data) ? data : data.rows || []);
    } catch (err: any) {
      console.error(err);
      setError('Gagal memuat daftar persetujuan DP.');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDetail = async (btoItem: BtoItem) => {
    setSelectedBto(btoItem);
    setActiveTab('info');
    setCatatan('');
    setDpDetails(null);
    setDpForm([]);
    
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

  const confirmAction = (action: 'approve' | 'reject' | 'revision') => {
    if (!selectedBto) return;
    setPendingAction(action);
    setCatatan('');
    setActionModalOpen(true);
  };

  const executeAction = async () => {
    if (!selectedBto || !pendingAction) return;
    
    if (!catatan.trim()) {
      showAlert('Catatan wajib diisi untuk persetujuan, penolakan, atau revisi.', 'warning');
      return;
    }

    try {
      setSubmitting(true);
      const endpoint = `/api/bto/${selectedBto!.id}/approve-dp`;
      const body = { aksi: pendingAction, catatan };

      await apiFetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      showAlert('Persetujuan DP berhasil diproses!', 'success');
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

  const calculateDpTotalIdr = () => {
    if (!dpForm.length) return 0;
    return dpForm.reduce((acc, item) => {
      const perDay = Number(item.nilaiPerHari) || 0;
      const days = Number(item.jumlahHari) || 1;
      const total = perDay * days;
      if (item.useDollar) {
        return acc + (total * usdRate);
      }
      return acc + total;
    }, 0);
  };

  return (
    <PageTemplate
      title="Persetujuan DP"
      sectionTitle="Manajemen Dinas"
      description="Antrean persetujuan panjar dinas (Down Payment) berstatus ADMIN_DP_REVIEW."
      headerActions={
        <>
          <MeetripHelpButton topic="admin-dp" label="Panduan Review DP" />
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
            <p className="text-sm font-semibold">Tidak ada BTO yang menunggu persetujuan DP saat ini.</p>
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
                  <th className="px-4 py-3 text-left text-xs font-bold uppercase">Panjar (DP)</th>
                  <th className="px-4 py-3 text-center text-xs font-bold uppercase">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {approvalsPagination.pageItems.map((btoItem) => (
                  <tr key={btoItem.id} className="border-t border-slate-200 dark:border-slate-800 hover:bg-slate-50/50 dark:hover:bg-slate-950/30">
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
                    <td className="px-4 py-3.5 text-sm font-semibold">
                      {btoItem.butuhDp ? (
                        <span className="inline-flex items-center gap-1 rounded bg-amber-50 px-2 py-0.5 text-xs font-bold text-amber-700 dark:bg-amber-950/30 dark:text-amber-400">
                          <Coins className="h-3.5 w-3.5" />
                          Butuh DP
                        </span>
                      ) : (
                        <span className="text-xs text-slate-400">Tanpa DP</span>
                      )}
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      <Button variant="secondary" onClick={() => handleOpenDetail(btoItem)} className="gap-1.5 text-teal-600 border-teal-600/30 hover:bg-teal-50 dark:text-teal-400 dark:hover:bg-teal-950/20">
                        <Info className="h-3.5 w-3.5" />
                        Tinjau DP
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

        <BusinessTripDetailModal
          bto={selectedBto}
          title="Detail Persetujuan DP"
          initialTab="dp"
          showBte={false}
          onClose={() => setSelectedBto(null)}
          footer={selectedBto ? (
            <div className="flex flex-wrap justify-end items-center gap-2">
              <Button variant="danger" onClick={() => confirmAction('reject')}>
                Tolak DP
              </Button>
              <Button variant="amber" onClick={() => confirmAction('revision')}>
                Minta Revisi
              </Button>
              <Button variant="primary" onClick={() => confirmAction('approve')}>
                Setujui DP
              </Button>
            </div>
          ) : null}
        />

        {/* Detail Modal */}
        {selectedBto && false && (
          <Modal isOpen={true} onClose={() => setSelectedBto(null)} title="Detail Persetujuan DP" widthClassName="max-w-3xl">
            <div className="flex border-b border-slate-200 dark:border-slate-800">
              <button
                className={`flex-1 py-2 text-center text-sm font-bold border-b-2 transition-all ${activeTab === 'info' ? 'border-teal-500 text-teal-600 dark:text-teal-400' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                onClick={() => setActiveTab('info')}
              >
                Informasi Dinas
              </button>
              <button
                className={`flex-1 py-2 text-center text-sm font-bold border-b-2 transition-all ${activeTab === 'dp' ? 'border-teal-500 text-teal-600 dark:text-teal-400' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                onClick={() => setActiveTab('dp')}
              >
                Rincian Panjar (DP)
              </button>
              <button
                className={`flex-1 py-2 text-center text-sm font-bold border-b-2 transition-all ${activeTab === 'logs' ? 'border-teal-500 text-teal-600 dark:text-teal-400' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                onClick={() => setActiveTab('logs')}
              >
                Log Persetujuan
              </button>
            </div>

            <div className="py-4 overflow-y-auto overflow-x-hidden max-h-[60vh] space-y-4">
              {activeTab === 'info' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl border border-slate-100 bg-surface-sunken dark:border-slate-800 space-y-3">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Data Pengajuan</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-slate-500">Nomor BTO:</span>
                        <span className="font-bold text-slate-800 dark:text-white">{docNumber(selectedBto!.nomorBto, selectedBto!.id)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Pelaksana:</span>
                        <span className="font-bold text-slate-800 dark:text-white">{selectedBto!.employeeNama || 'Karyawan'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Pemberi Tugas:</span>
                        <span className="font-semibold text-slate-800 dark:text-white">{selectedBto!.pemberiTugasNama || '-'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Tipe Wilayah:</span>
                        <span className="font-semibold uppercase text-slate-800 dark:text-white">{selectedBto!.wilayahTipe?.replace('_', ' ')}</span>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 rounded-xl border border-slate-100 bg-surface-sunken dark:border-slate-800 space-y-3">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Detail Perjalanan</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-start gap-2">
                        <MapPin className="h-4 w-4 text-slate-400 mt-0.5" />
                        <div>
                          <p className="font-bold text-slate-800 dark:text-white">{selectedBto!.tujuanNama}</p>
                          <p className="text-xs text-slate-500">{selectedBto!.tujuanAlamat}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-slate-400" />
                        <span className="text-slate-700 dark:text-slate-300">
                          {new Date(selectedBto!.estBerangkat).toLocaleString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })} - {new Date(selectedBto!.estKembali).toLocaleString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Briefcase className="h-4 w-4 text-slate-400" />
                        <span className="text-slate-700 dark:text-slate-300 truncate max-w-[200px]" title={selectedBto!.kepentingan}>
                          {selectedBto!.kepentingan}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'dp' && (
                <div className="space-y-4">
                  {selectedBto!.butuhDp ? (
                    <div className="space-y-4">
                      {dpDetails && (
                        <div className="flex flex-col md:flex-row md:items-center justify-between p-3 rounded-lg bg-teal-55/10 border border-teal-500/20 text-teal-800 dark:text-teal-400 gap-2">
                          <p className="text-xs font-semibold">Mata Uang Klaim: <span className="font-bold uppercase">{dpDetails.kursUsd ? 'USD (Luar Negeri)' : 'IDR (Domestik)'}</span></p>
                          {dpDetails.kursUsd && <p className="text-xs font-semibold">Kurs USD: <span className="font-bold">{formatMoney(dpDetails.kursUsd)}</span></p>}
                        </div>
                      )}

                      <div className="rounded-lg border border-slate-200 dark:border-slate-800 overflow-hidden">
                        <table className="w-full">
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
                          </tbody>
                        </table>
                      </div>

                      <div className="flex justify-end p-4 rounded-xl bg-surface-sunken border border-slate-100 dark:border-slate-800">
                        <div className="text-right">
                          <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Estimasi Total Panjar</p>
                          <p className="text-xl font-black text-teal-600 dark:text-teal-400 mt-1">
                            {formatMoney(calculateDpTotalIdr())}
                          </p>
                        </div>
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
                  {approvalLog.length === 0 ? (
                    <p className="text-sm text-slate-400 text-center py-4">Belum ada riwayat persetujuan.</p>
                  ) : (
                    <div className="relative border-l-2 border-slate-200 dark:border-slate-800 ml-4 pl-4 space-y-4">
                      {approvalLog.map((log: any, idx: number) => (
                        <div key={log.id || idx} className="relative">
                          <span className="absolute -left-[25px] top-1.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-slate-200 dark:bg-slate-800 ring-4 ring-white dark:ring-slate-900">
                            <span className="h-1.5 w-1.5 rounded-full bg-slate-500" />
                          </span>
                          <div className="text-xs">
                            <p className="font-bold text-slate-800 dark:text-slate-250">
                              {log.actorNama || 'Sistem'} &mdash; <span className="font-bold text-teal-600 dark:text-teal-400 uppercase">{log.aksi}</span>
                            </p>
                            <p className="text-[10px] text-slate-400 mt-0.5">
                              {new Date(log.createdAt).toLocaleString('id-ID')}
                            </p>
                            {log.catatan && (
                              <p className="mt-1 p-2 rounded-lg bg-surface-sunken border border-slate-100 dark:border-slate-800 text-slate-600 dark:text-slate-400 italic">
                                "{log.catatan}"
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
              <div className="flex gap-2">
                {selectedBto!.nomorBto && (
                  <DocumentDownloadButton
                    path={`/api/document/dp/${selectedBto!.id}/pdf`}
                    className="px-3 py-1.5 rounded-lg text-xs text-slate-600 dark:text-slate-400"
                  >
                    Cetak DP PDF
                  </DocumentDownloadButton>
                )}
              </div>

              <div className="flex gap-2">
                <Button variant="danger" onClick={() => confirmAction('reject')}>
                  Tolak DP
                </Button>
                <Button variant="amber" onClick={() => confirmAction('revision')}>
                  Minta Revisi
                </Button>
                <Button variant="primary" onClick={() => confirmAction('approve')}>
                  Setujui DP
                </Button>
              </div>
            </div>
          </Modal>
        )}

        {/* Action Confirmation Modal */}
        <Modal isOpen={actionModalOpen} onClose={() => setActionModalOpen(false)} title="Konfirmasi Aksi">
          <div className="space-y-4 pt-1">
            <div className="p-3.5 rounded-xl bg-teal-500/10 dark:bg-teal-950/40 border border-teal-500/20 dark:border-teal-500/30 text-xs text-slate-700 dark:text-slate-300 flex items-start gap-2.5 shadow-sm">
              <Info className="h-4 w-4 text-teal-600 dark:text-teal-400 flex-shrink-0 mt-0.5" />
              <p>
                Anda akan melakukan tindakan <strong className="text-teal-700 dark:text-teal-300 uppercase">{pendingAction}</strong> pada pengajuan DP ini.
                {' Catatan tindakan wajib diisi.'}
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Catatan Tindakan (Wajib)</label>
              <textarea
                value={catatan}
                onChange={(e) => setCatatan(e.target.value)}
                placeholder={pendingAction === 'approve' ? 'Masukkan catatan persetujuan...' : 'Masukkan alasan penolakan/revisi...'}
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
