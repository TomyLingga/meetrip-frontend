'use client';

import React, { useEffect, useState } from 'react';
import PageTemplate from '@/components/layout/PageTemplate';
import SearchInput from '@/components/form/SearchInput';
import Modal from '@/components/ui/Modal';

import Button from '@/components/ui/Button';
import { apiFetch, getCachedUser } from '@/utils/api';
import DocumentDownloadButton from '../components/DocumentDownloadButton';
import EditBtoModal from '../components/EditBtoModal';
import { useAlert } from '@/context/FeedbackContext';
import PaginationControls from '@/components/ui/PaginationControls';
import usePagination from '@/hooks/usePagination';
import { 
  Check, RefreshCw, FileText, Info, Coins, 
  MapPin, Clock, Briefcase, Calendar, Package, AlertCircle, Pencil
} from 'lucide-react';

type CachedUser = {
  id: string;
  nama?: string | null;
  role?: string | null;
};

type BtoItem = {
  id: string;
  nomorBto?: string | null;
  spdkNumber?: string | null;
  employeeId: string;
  employeeNama?: string | null;
  tujuanNama: string;
  tujuanAlamat?: string | null;
  wilayahTipe?: 'dalam_wilayah' | 'luar_wilayah' | 'luar_negeri' | null;
  kepentingan: string;
  estBerangkat: string;
  estKembali: string;
  status: string;
};

const shortId = (value?: string | null) => value ? value.slice(0, 8).toUpperCase() : null;

const docNumber = (value?: string | null, fallbackId?: string | null) => {
  if (value) return value;
  const compactId = shortId(fallbackId);
  return compactId ? `ID-${compactId}` : 'Belum terbit';
};

export default function ActiveSpdkPage() {
  const [user, setUser] = useState<CachedUser | null>(null);
  const { showAlert } = useAlert();
  const [btoData, setBtoData] = useState<BtoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Detail & Edit Modal
  const [selectedBto, setSelectedBto] = useState<BtoItem | null>(null);
  const [editingBto, setEditingBto] = useState<BtoItem | null>(null);
  const [activeTab, setActiveTab] = useState<'info' | 'dp' | 'logs'>('info');
  const [approvalLog, setApprovalLog] = useState<any[]>([]);
  const [dpDetails, setDpDetails] = useState<any>(null);
  const [dpForm, setDpForm] = useState<any[]>([]);
  const [usdRate, setUsdRate] = useState(16500);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredBtoData = btoData.filter((b) => {
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

  const btoPagination = usePagination(filteredBtoData);

  useEffect(() => {
    const cachedUser = getCachedUser();
    if (cachedUser) setUser(cachedUser);
  }, []);

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const params = new URLSearchParams({ limit: '200' });
      if (user?.id) {
        params.set('employeeId', user.id);
      }
      const data = await apiFetch(`/api/bto?${params.toString()}`);
      const list = Array.isArray(data) ? data : data.rows || [];
      const activeList = list.filter((b: BtoItem) => 
        ['ACTIVE', 'ATTENDED', 'REPORT_UPLOADED', 'BTE_DRAFT'].includes(b.status)
      );
      setBtoData(activeList);
    } catch (err: any) {
      console.error(err);
      setError('Gagal memuat daftar SPDK aktif.');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDetail = async (btoItem: BtoItem) => {
    setSelectedBto(btoItem);
    setActiveTab('info');
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
  };

  const formatMoney = (val: any, useDollar: boolean = false) => {
    const num = Number(val) || 0;
    if (useDollar) {
      return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(num);
    }
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(num);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return <span className="inline-flex items-center gap-1 rounded bg-teal-50 px-2 py-0.5 text-xs font-bold text-teal-700 dark:bg-teal-950/30 dark:text-teal-400">Aktif</span>;
      case 'ATTENDED':
        return <span className="inline-flex items-center gap-1 rounded bg-indigo-50 px-2 py-0.5 text-xs font-bold text-indigo-700 dark:bg-indigo-950/30 dark:text-indigo-400">Hadir</span>;
      case 'REPORT_UPLOADED':
        return <span className="inline-flex items-center gap-1 rounded bg-sky-50 px-2 py-0.5 text-xs font-bold text-sky-700 dark:bg-sky-950/30 dark:text-sky-400">Laporan Terunggah</span>;
      case 'BTE_DRAFT':
        return <span className="inline-flex items-center gap-1 rounded bg-amber-50 px-2 py-0.5 text-xs font-bold text-amber-700 dark:bg-amber-950/30 dark:text-amber-400">BTE Draft</span>;
      default:
        return <span className="text-xs text-slate-500 uppercase">{status}</span>;
    }
  };

  return (
    <PageTemplate
      title="Daftar SPDK Aktif"
      sectionTitle="Manajemen Dinas"
      description="Daftar seluruh perjalanan dinas karyawan yang sedang berlangsung atau siap diverifikasi kehadiran/laporannya."
      headerActions={
        <Button variant="secondary" onClick={loadData} loading={loading} className="gap-2">
          {!loading && <RefreshCw className="h-4 w-4" />}
          Refresh
        </Button>
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
            {filteredBtoData.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 text-slate-400">
            <Info className="h-10 w-10 text-slate-400" />
            <p className="text-sm font-semibold">Tidak ada SPDK aktif saat ini.</p>
          </div>
        ) : (
          <div className="overflow-x-auto hide-scrollbar rounded-xl border border-slate-200 bg-surface-card dark:border-slate-800 shadow-neu-sm">
            <table className="w-full min-w-[800px]">
              <thead>
                <tr className="bg-surface-sunken text-slate-500 dark:text-slate-400">
                  <th className="px-4 py-3 text-left text-xs font-bold uppercase">No. SPDK / BTO</th>
                  <th className="px-4 py-3 text-left text-xs font-bold uppercase">Pelaksana</th>
                  <th className="px-4 py-3 text-left text-xs font-bold uppercase">Tujuan</th>
                  <th className="px-4 py-3 text-left text-xs font-bold uppercase">Tanggal Dinas</th>
                  <th className="px-4 py-3 text-left text-xs font-bold uppercase">Status</th>
                  <th className="px-4 py-3 text-center text-xs font-bold uppercase">Detail</th>
                </tr>
              </thead>
              <tbody>
                {btoPagination.pageItems.map((btoItem) => (
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
                    <td className="px-4 py-3.5 text-sm">
                      {getStatusBadge(btoItem.status)}
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      <div className="flex items-center justify-center gap-1.5 whitespace-nowrap">
                        {user?.role?.split(',').some((r: string) => ['admin', 'super_admin'].includes(r)) && (
                          <button
                            type="button"
                            onClick={() => setEditingBto(btoItem)}
                            className="p-1.5 rounded-xl text-amber-600 hover:bg-amber-50 dark:text-amber-400 dark:hover:bg-amber-500/10 transition-colors group flex items-center justify-center"
                            title="Edit Data Dinas (Admin)"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                        )}
                        <Button variant="secondary" onClick={() => handleOpenDetail(btoItem)} className="gap-1.5 text-teal-600 border-teal-600/30 hover:bg-teal-50 dark:text-teal-400 dark:hover:bg-teal-950/20">
                          <Info className="h-3.5 w-3.5" />
                          Tinjau
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <PaginationControls
              currentPage={btoPagination.currentPage}
              totalItems={filteredBtoData.length}
              pageSize={btoPagination.pageSize}
              onPageChange={btoPagination.setCurrentPage}
              onPageSizeChange={btoPagination.setPageSize}
            />
          </div>
        )}
        </>
        )}

        {/* Detail Modal */}
        {selectedBto && (
          <Modal isOpen={true} onClose={() => setSelectedBto(null)} title="Informasi SPDK Aktif" widthClassName="max-w-3xl">
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
                Uang Panjar (DP)
              </button>
              <button
                className={`flex-1 py-2 text-center text-sm font-bold border-b-2 transition-all ${activeTab === 'logs' ? 'border-teal-500 text-teal-600 dark:text-teal-400' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                onClick={() => setActiveTab('logs')}
              >
                Log Pengajuan
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
                        <span className="font-bold text-slate-800 dark:text-white">{docNumber(selectedBto.nomorBto, selectedBto.id)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Pelaksana:</span>
                        <span className="font-bold text-slate-800 dark:text-white">{selectedBto.employeeNama || 'Karyawan'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Status SPDK:</span>
                        <span>{getStatusBadge(selectedBto.status)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 rounded-xl border border-slate-100 bg-surface-sunken dark:border-slate-800 space-y-3">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Detail Perjalanan</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-start gap-2">
                        <MapPin className="h-4 w-4 text-slate-400 mt-0.5" />
                        <div>
                          <p className="font-bold text-slate-800 dark:text-white">{selectedBto.tujuanNama}</p>
                          <p className="text-xs text-slate-500">{selectedBto.tujuanAlamat}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-slate-400" />
                        <span className="text-slate-700 dark:text-slate-300">
                          {new Date(selectedBto.estBerangkat).toLocaleString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })} - {new Date(selectedBto.estKembali).toLocaleString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'dp' && (
                <div className="space-y-4">
                  {dpForm.length > 0 ? (
                    <div className="space-y-4">
                      {dpDetails && (
                        <div className="flex flex-col md:flex-row md:items-center justify-between p-3 rounded-lg bg-teal-55/10 border border-teal-500/20 text-teal-800 dark:text-teal-400 gap-2">
                          <p className="text-xs font-semibold">Mata Uang Panjar: <span className="font-bold uppercase">{dpDetails.kursUsd ? 'USD' : 'IDR'}</span></p>
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
                    <p className="text-sm text-slate-400 text-center py-4">Belum ada riwayat persetujuan BTO.</p>
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
                {selectedBto.nomorBto && (
                  <>
                    <DocumentDownloadButton
                      path={`/api/document/spdk/${selectedBto.id}/pdf`}
                      className="px-3 py-1.5 rounded-lg text-xs text-slate-600 dark:text-slate-400"
                    >
                      Cetak SPDK PDF
                    </DocumentDownloadButton>
                    <DocumentDownloadButton
                      path={`/api/document/bto/${selectedBto.id}/pdf`}
                      className="px-3 py-1.5 rounded-lg text-xs text-slate-600 dark:text-slate-400"
                    >
                      Cetak BTO PDF
                    </DocumentDownloadButton>
                  </>
                )}
              </div>
              <Button variant="secondary" onClick={() => setSelectedBto(null)}>
                Tutup
              </Button>
            </div>
          </Modal>
        )}

        <EditBtoModal
          btoItem={editingBto}
          isOpen={!!editingBto}
          onClose={() => setEditingBto(null)}
          onSuccess={() => {
            setEditingBto(null);
            loadData();
          }}
        />
    </PageTemplate>
  );
}
