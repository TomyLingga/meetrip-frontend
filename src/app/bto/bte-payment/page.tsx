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
import { RefreshCw, Receipt, Banknote, CheckCircle, Clock, FileText, Printer } from 'lucide-react';

type BtePayItem = {
  id: string;
  btoId: string;
  status: string;
  tujuanNama?: string | null;
  employeeNama?: string | null;
  spdkNumber?: string | null;
  nomorBto?: string | null;
  totalIdr?: string | null;
  totalUsd?: string | null;
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
  };
  dp?: {
    totalIdr?: string | null;
    totalUsd?: string | null;
  } | null;
};

export default function BtePaymentPage() {
  const { showAlert } = useAlert();
  const [bteList, setBteList] = useState<BtePayItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<BtePayItem | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [filter, setFilter] = useState<'PENDING_PAYMENT' | 'PAID'>('PENDING_PAYMENT');
  const [searchQuery, setSearchQuery] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const res = await apiFetch('/api/bte/admin/list?limit=100');
      setBteList((res || []).filter((b: BtePayItem) => ['PENDING_PAYMENT', 'PAID'].includes(b.status)));
    } catch {
      try {
        const res = await apiFetch('/api/bto?status=BTE_PAYMENT&limit=200');
        const btos = res?.data || res || [];
        const result: BtePayItem[] = [];
        await Promise.allSettled(btos.map(async (b: any) => {
          try {
            const bte = await apiFetch(`/api/bte/bto/${b.id}`);
            if (bte?.id && ['PENDING_PAYMENT', 'PAID'].includes(bte.status)) {
              result.push({ ...bte, bto: b });
            }
          } catch {}
        }));
        setBteList(result);
      } catch {
        showAlert('Gagal memuat antrean pembayaran BTE', 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleMarkPaid = async () => {
    if (!selected) return;
    setSubmitting(true);
    try {
      await apiFetch(`/api/bte/${selected.id}/mark-paid`, { method: 'POST' });
      showAlert('Pembayaran berhasil dikonfirmasi!', 'success');
      setConfirmOpen(false);
      setSelected(null);
      load();
      refreshMeetripBadges();
    } catch (err: any) {
      showAlert(err.message || 'Gagal konfirmasi pembayaran', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handlePrintBte = (btoId: string) => {
    openDocument(`/api/document/bte/${btoId}/pdf`);
  };

  const fmtDate = (v: any) => v ? new Date(v).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) : '-';
  const formatMoney = (v: any) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(Number(v) || 0);

  const filteredData = bteList.filter(b => b.status === filter).filter((b) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      b.tujuanNama?.toLowerCase().includes(q) ||
      b.employeeNama?.toLowerCase().includes(q) ||
      b.spdkNumber?.toLowerCase().includes(q) ||
      b.nomorBto?.toLowerCase().includes(q)
    );
  });
  const totalPending = bteList.filter(b => b.status === 'PENDING_PAYMENT').length;
  const totalPaid = bteList.filter(b => b.status === 'PAID').length;

  const columns = [
    {
      header: 'Karyawan',
      render: (b: BtePayItem) => (
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full overflow-hidden bg-teal-100 dark:bg-teal-900/30 shrink-0">
            <img
              src={`${process.env.NEXT_PUBLIC_PORTAL_URL || 'http://localhost:3002'}/uploads/profiles/${b.bto?.employeeId}.jpg`}
              alt={b.bto?.employeeNama || ''}
              onError={(e) => { e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(b.bto?.employeeNama || 'U')}&background=0d9488&color=fff&bold=true`; }}
              className="w-full h-full object-cover"
            />
          </div>
          <div>
            <p className="text-sm font-bold text-slate-900 dark:text-white">{b.bto?.employeeNama || '-'}</p>
            <p className="text-[10px] text-slate-400">{b.bto?.nomorBto || 'Draft'}</p>
          </div>
        </div>
      )
    },
    {
      header: 'Tujuan & Periode',
      render: (b: BtePayItem) => (
        <div>
          <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">{b.bto?.tujuanNama}</p>
          <p className="text-[10px] text-slate-400 mt-0.5">{fmtDate(b.bto?.estBerangkat)} — {fmtDate(b.bto?.estKembali)}</p>
        </div>
      )
    },
    {
      header: 'Klaim BTE',
      render: (b: BtePayItem) => (
        <span className="text-xs font-bold text-slate-800 dark:text-slate-200">{formatMoney(b.totalIdr)}</span>
      )
    },
    {
      header: 'Sudah Dibayar DP',
      render: (b: BtePayItem) => (
        <span className="text-xs text-slate-500">{formatMoney(b.dp?.totalIdr || 0)}</span>
      )
    },
    {
      header: 'Kurang / Lebih',
      render: (b: BtePayItem) => {
        const diff = (Number(b.totalIdr) || 0) - (Number(b.dp?.totalIdr) || 0);
        return (
          <span className={`text-xs font-bold ${diff > 0 ? 'text-red-600' : diff < 0 ? 'text-emerald-600' : 'text-slate-500'}`}>
            {diff > 0 ? `Kurang: ${formatMoney(diff)}` : diff < 0 ? `Lebih: ${formatMoney(Math.abs(diff))}` : 'Pas'}
          </span>
        );
      }
    },
    {
      header: 'Aksi',
      render: (b: BtePayItem) => (
        <div className="flex items-center justify-end gap-2 flex-wrap">
          <button
            onClick={() => handlePrintBte(b.btoId)}
            className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-700 transition-colors"
            title="Cetak BTE"
          >
            <Printer className="h-4 w-4" />
          </button>
          {b.status === 'PENDING_PAYMENT' ? (
            <button
              onClick={() => { setSelected(b); setConfirmOpen(true); }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-400 dark:hover:bg-emerald-500/20 border border-emerald-200/40 transition-colors"
            >
              <CheckCircle className="h-3.5 w-3.5" /> Konfirmasi Bayar
            </button>
          ) : (
            <div className="flex items-center gap-1 text-teal-600 dark:text-teal-400 px-2 py-1">
              <CheckCircle className="h-3.5 w-3.5" />
              <span className="text-[10px] font-bold uppercase tracking-wider">Lunas</span>
            </div>
          )}
        </div>
      )
    }
  ];

  return (
    <PageTemplate
      title="Menunggu Pembayaran"
      sectionTitle="Manajemen Dinas"
      description="Konfirmasi realisasi pembayaran klaim biaya perjalanan dinas (BTE) yang telah disetujui."
      headerActions={
        <>
          <MeetripHelpButton topic="admin-payment" label="Panduan Pembayaran" />
          <Button variant="secondary" onClick={load} loading={loading} className="gap-2">
            {!loading && <RefreshCw className="h-4 w-4" />}
            <span>Refresh</span>
          </Button>
        </>
      }
    >
      <div className="space-y-6">
        <div className="flex items-center justify-between border-b border-slate-200/60 dark:border-slate-800/60 pb-1">
          <div className="flex gap-6 text-sm font-semibold">
            <button
              onClick={() => setFilter('PENDING_PAYMENT')}
              className={`relative pb-3 transition-colors ${
                filter === 'PENDING_PAYMENT'
                  ? 'text-amber-600 dark:text-amber-500 font-extrabold'
                  : 'text-slate-500 hover:text-slate-800 dark:text-slate-500 dark:hover:text-slate-200'
              }`}
            >
              <div className="flex items-center gap-2">
                <span>Menunggu Pembayaran</span>
                <span className={`inline-flex items-center justify-center px-2 py-0.5 text-[10px] font-black rounded-full transition-all ${
                  filter === 'PENDING_PAYMENT'
                    ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-400'
                    : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-500'
                }`}>
                  {totalPending}
                </span>
              </div>
              {filter === 'PENDING_PAYMENT' && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-amber-500 rounded-full" />
              )}
            </button>

            <button
              onClick={() => setFilter('PAID')}
              className={`relative pb-3 transition-colors ${
                filter === 'PAID'
                  ? 'text-teal-600 dark:text-teal-500 font-extrabold'
                  : 'text-slate-500 hover:text-slate-800 dark:text-slate-500 dark:hover:text-slate-200'
              }`}
            >
              <div className="flex items-center gap-2">
                <span>Sudah Dibayar (Lunas)</span>
                <span className={`inline-flex items-center justify-center px-2 py-0.5 text-[10px] font-black rounded-full transition-all ${
                  filter === 'PAID'
                    ? 'bg-teal-50 text-teal-850 dark:bg-teal-950/60 dark:text-teal-400'
                    : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-500'
                }`}>
                  {totalPaid}
                </span>
              </div>
              {filter === 'PAID' && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-teal-500 rounded-full" />
              )}
            </button>
          </div>
        </div>

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
                <Clock className="h-10 w-10 text-slate-300" />
                <p className="text-sm font-semibold">Tidak ada antrean klaim {filter === 'PENDING_PAYMENT' ? 'menunggu pembayaran' : 'yang sudah lunas'}.</p>
              </div>
            ) : (
              <Table columns={columns} data={filteredData} keyExtractor={(b) => b.id} />
            )}
          </>
        )}
      </div>

      <Modal
        isOpen={confirmOpen}
        onClose={() => { setConfirmOpen(false); setSelected(null); }}
        title="Konfirmasi Pembayaran BTE"
        widthClassName="w-full max-w-md"
      >
        {selected && (() => {
          const bteIdr = Number(selected.totalIdr || 0);
          const dpIdr = Number(selected.dp?.totalIdr || 0);
          const diff = bteIdr - dpIdr;
          const isPerusahaanBayar = diff > 0;
          const isKaryawanBayar = diff < 0;
          const absDiff = Math.abs(diff);

          return (
            <div className="space-y-4 pt-1">
              <div className={`flex flex-col gap-3 p-4 rounded-xl border ${
                isPerusahaanBayar ? 'bg-red-50/60 dark:bg-red-950/20 border-red-200/40 dark:border-red-900/30' :
                isKaryawanBayar ? 'bg-emerald-50/60 dark:bg-emerald-950/20 border-emerald-200/40 dark:border-emerald-900/30' :
                'bg-surface-sunken/40 border-slate-200/60 dark:border-slate-800/60'
              }`}>
                {/* BTE Total vs DP Total info */}
                <div className="flex justify-between items-center text-[11px] font-semibold text-slate-500">
                  <span>Realisasi BTE: <strong className="text-slate-800 dark:text-slate-200">{formatMoney(bteIdr)}</strong></span>
                  <span>Sudah DP: <strong className="text-slate-800 dark:text-slate-200">{formatMoney(dpIdr)}</strong></span>
                </div>
                
                <div className="h-px w-full bg-slate-200/60 dark:bg-slate-800/60" />

                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${
                    isPerusahaanBayar ? 'bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400' :
                    isKaryawanBayar ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400' :
                    'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                  }`}>
                    <Banknote className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">
                      {isPerusahaanBayar ? 'Perusahaan Bayar Kekurangan ke Karyawan' :
                       isKaryawanBayar ? 'Karyawan Mengembalikan Sisa ke Perusahaan' : 'Sesuai dengan DP (Nihil)'}
                    </p>
                    <p className={`text-xl font-black ${
                      isPerusahaanBayar ? 'text-red-700 dark:text-red-400' :
                      isKaryawanBayar ? 'text-emerald-700 dark:text-emerald-400' :
                      'text-slate-700 dark:text-slate-300'
                    }`}>
                      {formatMoney(absDiff)}
                    </p>
                  </div>
                </div>
              </div>

              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                Tindakan ini akan mencatat status klaim BTE untuk karyawan <strong>{selected.bto?.employeeNama}</strong> sebagai <strong>PAID</strong> (Lunas).
              </p>

              <div className="flex justify-end gap-2.5 pt-2 border-t border-slate-200/60 dark:border-slate-800/50 flex-wrap">
                <button
                  type="button"
                  onClick={() => { setConfirmOpen(false); setSelected(null); }}
                  className="btn-secondary px-4 py-2 text-xs font-bold rounded-xl"
                  disabled={submitting}
                >
                  Batal
                </button>
                <Button variant={isPerusahaanBayar ? 'danger' : 'primary'} onClick={handleMarkPaid} loading={submitting}>
                  <CheckCircle className="h-4 w-4" />
                  <span>
                    {isPerusahaanBayar ? 'Konfirmasi Sudah Ditransfer' :
                     isKaryawanBayar ? 'Konfirmasi Dana Diterima' : 'Ya, Selesai'}
                  </span>
                </Button>
              </div>
            </div>
          );
        })()}
      </Modal>
    </PageTemplate>
  );
}
