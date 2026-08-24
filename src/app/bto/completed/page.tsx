'use client';

import React, { useEffect, useState } from 'react';
import PageTemplate from '@/components/layout/PageTemplate';
import SearchInput from '@/components/form/SearchInput';
import Modal from '@/components/ui/Modal';
import CustomSelect from '@/components/form/CustomSelect';
import DateTimePicker from '@/components/form/DateTimePicker';

import Button from '@/components/ui/Button';
import { apiFetch, downloadDocument, getCachedUser } from '@/utils/api';
import { useAlert } from '@/context/FeedbackContext';
import BusinessTripDetailModal from '../components/BusinessTripDetailModal';
import EditBtoModal from '../components/EditBtoModal';
import DocumentDownloadButton from '../components/DocumentDownloadButton';
import PaginationControls from '@/components/ui/PaginationControls';
import usePagination from '@/hooks/usePagination';
import CardListSkeleton from '@/components/ui/CardListSkeleton';
import EmptyState from '@/components/ui/EmptyState';
import {
  Check, RefreshCw, FileText, Info, Coins, CheckCircle2,
  MapPin, Calendar, AlertCircle, Pencil, FileSpreadsheet
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

export default function CompletedTripPage() {
  const [user, setUser] = useState<CachedUser | null>(null);
  const { showAlert } = useAlert();
  const [btoData, setBtoData] = useState<BtoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Detail & Edit Modal
  const [selectedBto, setSelectedBto] = useState<BtoItem | null>(null);
  const [editingBto, setEditingBto] = useState<BtoItem | null>(null);
  const [activeTab, setActiveTab] = useState<'info' | 'dp' | 'spdk' | 'bte'>('info');
  const [approvalLog, setApprovalLog] = useState<any[]>([]);
  const [dpDetails, setDpDetails] = useState<any>(null);
  const [dpForm, setDpForm] = useState<any[]>([]);
  const [bteDetails, setBteDetails] = useState<any>(null);
  const [usdRate, setUsdRate] = useState(16500);

  const [statusFilter, setStatusFilter] = useState<'ALL' | 'COMPLETED' | 'REJECTED'>('ALL');
  const [dateFromFilter, setDateFromFilter] = useState('');
  const [dateToFilter, setDateToFilter] = useState('');
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

  const statusOptions = [
    { value: 'ALL', label: 'Semua Riwayat' },
    { value: 'COMPLETED', label: 'Selesai' },
    { value: 'REJECTED', label: 'Ditolak / Dibatalkan' }
  ];

  useEffect(() => {
    const cachedUser = getCachedUser();
    if (cachedUser) setUser(cachedUser);
  }, []);

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user, dateFromFilter, dateToFilter, statusFilter]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const params = new URLSearchParams({ limit: '500' });
      const isAdmin = user?.role?.split(',').some(r => ['admin', 'super_admin', 'sdm'].includes(r)) ?? false;
      if (user?.id && !isAdmin) {
        params.set('employeeId', user.id);
      }
      if (dateFromFilter) params.set('dateFrom', `${dateFromFilter}T00:00:00`);
      if (dateToFilter) params.set('dateTo', `${dateToFilter}T23:59:59`);
      const data = await apiFetch(`/api/bto?${params.toString()}`);
      const list = Array.isArray(data) ? data : data.rows || [];

      const filteredList = list.filter((b: BtoItem) => {
        if (user?.id && !isAdmin && b.employeeId !== user.id) return false;
        const isTerminal = ['COMPLETED', 'PAID', 'REJECTED'].includes(b.status);
        if (!isTerminal) return false;
        if (statusFilter === 'COMPLETED') return ['COMPLETED', 'PAID'].includes(b.status);
        if (statusFilter === 'REJECTED') return b.status === 'REJECTED';
        return true; // 'ALL'
      });

      // Urutkan riwayat dinas dari yang terbaru paling atas
      filteredList.sort((a: any, b: any) => {
        const timeA = new Date(a.createdAt || a.estBerangkat || 0).getTime();
        const timeB = new Date(b.createdAt || b.estBerangkat || 0).getTime();
        return timeB - timeA;
      });

      setBtoData(filteredList);
    } catch (err: any) {
      console.error(err);
      setError('Gagal memuat daftar riwayat dinas.');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDetail = async (btoItem: BtoItem) => {
    setSelectedBto(btoItem);
    setActiveTab('info');
    setDpDetails(null);
    setDpForm([]);
    setBteDetails(null);

    // Load logs
    try {
      const detail = await apiFetch(`/api/bto/${btoItem.id}`);
      setApprovalLog(detail.approvalLogs || []);
    } catch (err) {
      console.error(err);
      setApprovalLog([]);
    }

    // Load DP and BTE if exist
    try {
      const [dp, bte] = await Promise.allSettled([
        apiFetch(`/api/dp/bto/${btoItem.id}`),
        apiFetch(`/api/bte/bto/${btoItem.id}`),
      ]);
      if (dp.status === 'fulfilled') {
        setDpDetails(dp.value);
        setDpForm(dp.value.dpRincian || []);
        setUsdRate(Number(dp.value.kursUsd) || 16500);
      }
      if (bte.status === 'fulfilled') {
        setBteDetails(bte.value);
      }
    } catch (err) {
      console.error(err);
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
      title="Riwayat Dinas & Selesai"
      sectionTitle="Manajemen Dinas"
      description="Riwayat seluruh perjalanan dinas karyawan PT. Industri Nabati Lestari yang telah selesai, dibatalkan, atau ditolak."
    >
      <div className="mb-6 flex flex-col sm:flex-row sm:flex-wrap items-start sm:items-center gap-4 bg-surface-card p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-neu-sm z-50 relative">
        <div className="w-full sm:w-[200px]">
          <CustomSelect
            value={statusFilter}
            onChange={(v) => setStatusFilter(v as any)}
            options={statusOptions}
            placeholder="Pilih Status"
          />
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-2 w-full sm:w-auto">
          <div className="w-full sm:w-[180px]">
            <DateTimePicker
              mode="date"
              value={dateFromFilter}
              onChange={setDateFromFilter}
              placeholder="Dari Tanggal"
            />
          </div>
          <span className="text-slate-400 hidden sm:block">-</span>
          <div className="w-full sm:w-[180px]">
            <DateTimePicker
              mode="date"
              value={dateToFilter}
              onChange={setDateToFilter}
              placeholder="Sampai Tanggal"
            />
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto sm:ml-auto">
          {(dateFromFilter || dateToFilter) && (
            <Button variant="secondary" onClick={() => { setDateFromFilter(''); setDateToFilter(''); }} className="flex-1 sm:flex-none px-4 py-2 border-slate-200 text-xs h-[42px]">
              Clear
            </Button>
          )}
          <Button variant="secondary" onClick={loadData} loading={loading} className="flex-1 sm:flex-none gap-2 border-slate-200 text-xs h-[42px]">
            {!loading && <RefreshCw className="h-4 w-4" />}
            Refresh
          </Button>
          {(user?.role?.split(',').some(r => ['admin', 'sdm', 'super_admin'].includes(r))) && (
            <button
              type="button"
              onClick={() => downloadDocument(`/api/dashboard/export-excel?${new URLSearchParams({
                ...(dateFromFilter ? { dateFrom: dateFromFilter } : {}),
                ...(dateToFilter ? { dateTo: dateToFilter } : {}),
                ...(statusFilter !== 'ALL' ? { status: statusFilter } : {}),
              }).toString()}`, 'riwayat-dinas.xlsx').catch((err) => showAlert(err?.message || 'Gagal mengunduh rekap', 'error'))}
              className="btn-secondary flex-1 sm:flex-none gap-2 border-teal-500/35 text-xs h-[42px] px-3 font-bold"
            >
              <FileSpreadsheet className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              Export Excel
            </button>
          )}
        </div>
      </div>

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/50 flex items-center gap-3 text-sm text-red-600 dark:text-red-400">
            <AlertCircle className="h-5 w-5 flex-shrink-0" />
            <p className="font-bold">{error}</p>
          </div>
        )}

        {loading ? (
          <CardListSkeleton count={5} />
        ) : (
          <>
            <div className="mb-4">
              <SearchInput value={searchQuery} onChange={setSearchQuery} placeholder="Cari SPDK, BTO, tujuan, pelaksana..." className="w-full sm:w-96" />
            </div>
            {filteredBtoData.length === 0 ? (
          <EmptyState
            icon={CheckCircle2}
            message="Belum ada riwayat dinas yang sesuai dengan filter."
            className="rounded-2xl border border-dashed border-slate-200 dark:border-slate-800"
          />
        ) : (
          <div className="overflow-x-auto rounded-xl border border-slate-200 bg-surface-card dark:border-slate-800 shadow-neu-sm">
            <table className="w-full min-w-[800px]">
              <thead>
                <tr className="bg-surface-sunken/50 text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
                  <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider">No. SPDK / BTO</th>
                  <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider">Pelaksana</th>
                  <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider">Tujuan</th>
                  <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider">Tanggal Dinas</th>
                  <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider">Status Akhir</th>
                  <th className="px-4 py-3 text-center text-xs font-bold uppercase tracking-wider">Detail</th>
                </tr>
              </thead>
              <tbody>
                {btoPagination.pageItems.map((btoItem) => (
                  <tr key={btoItem.id} className="border-b last:border-0 border-slate-100 dark:border-slate-800/60 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="px-4 py-3.5 text-sm font-bold text-slate-700 dark:text-slate-300">
                      {docNumber(btoItem.nomorBto, btoItem.id)}
                    </td>
                    <td className="px-4 py-3.5 text-sm">
                      <p className="font-bold text-slate-800 dark:text-slate-200">{btoItem.employeeNama || 'Karyawan'}</p>
                      <p className="text-[10px] text-slate-400 font-semibold">{btoItem.wilayahTipe?.replace('_', ' ').toUpperCase()}</p>
                    </td>
                    <td className="px-4 py-3.5 text-sm">
                      <p className="font-bold text-slate-700 dark:text-slate-300 truncate max-w-[200px]">{btoItem.tujuanNama}</p>
                    </td>
                    <td className="px-4 py-3.5 text-sm font-semibold text-slate-600 dark:text-slate-400">
                      {new Date(btoItem.estBerangkat).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })} - {new Date(btoItem.estKembali).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="px-4 py-3.5 text-sm">
                      {['COMPLETED', 'PAID'].includes(btoItem.status) ? (
                        <span className="inline-flex items-center gap-1 rounded bg-teal-50 px-2 py-1 text-xs font-bold text-teal-700 dark:bg-teal-900/30 dark:text-teal-400">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Selesai
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded bg-rose-50 px-2 py-1 text-xs font-bold text-rose-700 dark:bg-rose-900/30 dark:text-rose-400">
                          <AlertCircle className="w-3.5 h-3.5" /> Ditolak / Batal
                        </span>
                      )}
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
                        <Button variant="secondary" onClick={() => handleOpenDetail(btoItem)} className="gap-1.5 text-teal-600 border-teal-600/30 hover:bg-teal-50 dark:text-teal-400 dark:hover:bg-teal-900/20 h-8 px-3 text-xs">
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

        <BusinessTripDetailModal
          bto={selectedBto}
          title="Detail Dinas Selesai / Batal"
          initialTab="info"
          onClose={() => setSelectedBto(null)}
          onEdit={(bto) => setEditingBto(bto)}
          footer={selectedBto ? (
            <div className="flex justify-end">
              <Button variant="secondary" onClick={() => setSelectedBto(null)}>
                Tutup
              </Button>
            </div>
          ) : null}
        />

        <EditBtoModal
          btoItem={editingBto}
          isOpen={!!editingBto}
          onClose={() => setEditingBto(null)}
          onSuccess={() => {
            setEditingBto(null);
            loadData();
          }}
        />

        {/* Detail Modal */}
        {selectedBto && false && (
          <Modal isOpen={true} onClose={() => setSelectedBto(null)} title={selectedBto!.status === 'REJECTED' ? "Informasi Dinas Ditolak / Batal" : "Informasi Dinas Selesai"} widthClassName="max-w-3xl">
            {selectedBto!.status === 'REJECTED' && (
              <div className="flex items-center gap-3 p-4 bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900 rounded-xl mb-4 mt-2">
                <div className="w-10 h-10 rounded-full bg-rose-100 dark:bg-rose-900 flex items-center justify-center shrink-0">
                  <AlertCircle className="w-5 h-5 text-rose-600 dark:text-rose-400" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-rose-800 dark:text-rose-300">
                    Ditolak / Dibatalkan
                  </h4>
                  <p className="text-xs text-rose-600 dark:text-rose-400 mt-1">
                    Catatan: {approvalLog.find(l => l.aksi?.toLowerCase().includes('reject') || l.statusKe === 'REJECTED')?.catatan || 'Tidak ada catatan penolakan.'}
                  </p>
                </div>
              </div>
            )}
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
                className={`flex-1 py-2 text-center text-sm font-bold border-b-2 transition-all ${activeTab === 'spdk' ? 'border-teal-500 text-teal-600 dark:text-teal-400' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                onClick={() => setActiveTab('spdk')}
              >
                SPDK & GPS
              </button>
              <button
                className={`flex-1 py-2 text-center text-sm font-bold border-b-2 transition-all ${activeTab === 'bte' ? 'border-teal-500 text-teal-600 dark:text-teal-400' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                onClick={() => setActiveTab('bte')}
              >
                Realisasi Biaya (BTE)
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
                        <span className="text-slate-500">Status Dinas:</span>
                        <span className="font-bold text-emerald-600 dark:text-emerald-400">SELESAI / PAID</span>
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
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'dp' && (
                <div className="space-y-4">
                  {dpForm.length > 0 ? (
                    <div className="space-y-4">
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

              {activeTab === 'bte' && (
                <div className="space-y-4">
                  {bteDetails ? (
                    <div className="space-y-4">
                      {/* BTE Details view */}
                      <div className="rounded-lg border border-slate-200 dark:border-slate-800 overflow-hidden">
                        <table className="w-full">
                          <thead>
                            <tr className="bg-surface-sunken text-slate-500 dark:text-slate-400">
                              <th className="px-3 py-2 text-left text-xs font-bold">Kategori Realisasi</th>
                              <th className="px-3 py-2 text-center text-xs font-bold">Hari</th>
                              <th className="px-3 py-2 text-right text-xs font-bold">Nilai</th>
                            </tr>
                          </thead>
                          <tbody>
                            {(bteDetails.bteRincian || []).map((item: any, idx: number) => (
                              <tr key={item.id || idx} className="border-t border-slate-250 dark:border-slate-800">
                                <td className="px-3 py-2.5 text-xs font-semibold text-slate-800 dark:text-slate-200">{item.rincianLabel}</td>
                                <td className="px-3 py-2.5 text-xs text-center">{item.jumlahHari}</td>
                                <td className="px-3 py-2.5 text-xs text-right font-bold text-slate-900 dark:text-white">{formatMoney(item.nilaiTotal, item.useDollar)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ) : (
                    <div className="py-8 flex flex-col items-center justify-center text-slate-400">
                      <Info className="h-10 w-10 text-slate-300 mb-2" />
                      <p className="text-sm font-semibold">Belum ada realisasi BTE yang diunggah untuk dinas ini.</p>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'spdk' && (
                <div className="space-y-4">
                  <div className="p-4 rounded-xl border border-slate-100 bg-surface-sunken dark:border-slate-800 space-y-3">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Laporan & Kehadiran (GPS)</h3>
                    {selectedBto!.status !== 'REJECTED' ? (
                      <div className="space-y-4 mt-2">
                        <div className="flex items-center gap-2 text-sm">
                          <MapPin className="h-4 w-4 text-slate-400" />
                          <span className="font-semibold text-slate-700 dark:text-slate-300">
                            {['COMPLETED', 'PAID', 'ATTENDED'].includes(selectedBto!.status)
                              ? 'Telah melakukan absen GPS di lokasi dinas'
                              : 'Belum ada data absen GPS'}
                          </span>
                        </div>
                        {selectedBto!.status === 'COMPLETED' || selectedBto!.status === 'PAID' ? (
                          <button
                            type="button"
                            onClick={() => downloadDocument(`/api/document/report/${selectedBto!.id}/download`).catch((err) => showAlert(err?.message || 'Gagal mengunduh laporan', 'error'))}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 dark:border-slate-800 dark:hover:bg-slate-950 text-sm font-bold text-slate-700 dark:text-slate-300 transition-all"
                          >
                            <FileText className="h-4 w-4 text-teal-600" />
                            Unduh Laporan Perjalanan
                          </button>
                        ) : (
                          <p className="text-sm text-slate-500">Laporan belum diunggah.</p>
                        )}
                      </div>
                    ) : (
                      <div className="py-6 flex flex-col items-center justify-center text-slate-400">
                        <AlertCircle className="h-8 w-8 text-slate-300 mb-2" />
                        <p className="text-sm font-semibold">Dinas ini ditolak sehingga tidak ada data SPDK/GPS/Laporan.</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
              <div className="flex gap-2">
                {selectedBto!.nomorBto && (
                  <>
                    <DocumentDownloadButton
                      path={`/api/document/bte/${selectedBto!.id}/pdf`}
                      className="px-3 py-1.5 rounded-lg text-xs text-slate-600 dark:text-slate-400"
                    >
                      Cetak BTE PDF
                    </DocumentDownloadButton>
                    <DocumentDownloadButton
                      path={`/api/document/spdk/${selectedBto!.id}/pdf`}
                      className="px-3 py-1.5 rounded-lg text-xs text-slate-600 dark:text-slate-400"
                    >
                      Cetak SPDK PDF
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
    </PageTemplate>
  );
}
