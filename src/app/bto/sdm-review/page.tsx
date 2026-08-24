'use client';

import React, { useEffect, useState } from 'react';
import PageTemplate from '@/components/layout/PageTemplate';
import SearchInput from '@/components/form/SearchInput';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import { apiFetch, refreshMeetripBadges } from '@/utils/api';
import { useAlert } from '@/context/FeedbackContext';
import { AlertCircle, Check, Clock, FileText, Info, RefreshCw, X, Pencil } from 'lucide-react';
import BusinessTripDetailModal from '../components/BusinessTripDetailModal';
import EditBtoModal from '../components/EditBtoModal';
import PaginationControls from '@/components/ui/PaginationControls';
import usePagination from '@/hooks/usePagination';
import { MeetripHelpButton } from '@/components/help/MeetripHelpGuide';

type BtoItem = {
  id: string;
  nomorBto?: string | null;
  spdkNumber?: string | null;
  employeeNama?: string | null;
  pemberiTugasNama?: string | null;
  tujuanNama: string;
  wilayahTipe?: string | null;
  estBerangkat: string;
  estKembali: string;
  status: string;
};

const shortId = (val?: string | null) => (val ? val.slice(0, 8).toUpperCase() : null);
const docNumber = (val?: string | null, fallbackId?: string | null) => {
  if (val) return val;
  const compact = shortId(fallbackId);
  return compact ? `ID-${compact}` : 'Belum terbit';
};

const fmtDate = (iso: string) => {
  if (!iso) return '-';
  try {
    return new Date(iso).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
  } catch {
    return iso;
  }
};

export default function SdmReviewPage() {
  const { showAlert } = useAlert();
  const [items, setItems] = useState<BtoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<BtoItem | null>(null);
  const [editingBto, setEditingBto] = useState<BtoItem | null>(null);

  // Filter & Search state
  const [searchQuery, setSearchQuery] = useState('');

  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [confirmActionType, setConfirmActionType] = useState<'approve' | 'reject' | null>(null);
  const [catatan, setCatatan] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const searchedItems = items.filter((item) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      item.tujuanNama?.toLowerCase().includes(q) ||
      item.employeeNama?.toLowerCase().includes(q) ||
      item.pemberiTugasNama?.toLowerCase().includes(q) ||
      item.nomorBto?.toLowerCase().includes(q)
    );
  });

  const sdmPagination = usePagination(searchedItems);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await apiFetch('/api/bto?status=SDM_REVIEW&limit=100');
      const list = Array.isArray(res) ? res : res.rows || [];
      setItems(list.filter((b: any) => b.status === 'SDM_REVIEW'));
    } catch (err: any) {
      console.error(err);
      setError('Gagal memuat data review SDM');
    } finally {
      setLoading(false);
    }
  };

  const openDetail = async (item: BtoItem) => {
    setSelected(item);
  };

  const confirmAction = (type: 'approve' | 'reject') => {
    setConfirmActionType(type);
    setCatatan('');
    setConfirmModalOpen(true);
  };

  const handleExecuteAction = async () => {
    if (!selected || !confirmActionType) return;
    // Backend mewajibkan catatan pada approve maupun reject (requireCatatanTindakan).
    if (!catatan.trim()) {
      showAlert('Catatan wajib diisi untuk persetujuan maupun penolakan.', 'warning');
      return;
    }
    try {
      setSubmitting(true);
      await apiFetch(`/api/bto/${selected.id}/approve-sdm`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          aksi: confirmActionType,
          catatan: catatan.trim(),
        }),
      });
      showAlert(
        confirmActionType === 'approve'
          ? 'Persetujuan SDM berhasil!'
          : 'Pengajuan BTO berhasil ditolak.',
        'success'
      );
      setConfirmModalOpen(false);
      setSelected(null);
      loadData();
      refreshMeetripBadges();
    } catch (err: any) {
      showAlert(err.message || 'Gagal memproses tindakan', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <PageTemplate
      title="Persetujuan SDM"
      sectionTitle="Manajemen Dinas"
      description="Verifikasi dan berikan persetujuan akhir SDM/HR untuk pengajuan dinas yang memerlukan SPDK."
      headerActions={
        <div className="flex gap-2 items-center">
          <MeetripHelpButton topic="sdm-review" />
          <Button variant="secondary" onClick={loadData} loading={loading} className="gap-2">
            {!loading && <RefreshCw className="h-4 w-4" />}
            Refresh
          </Button>
        </div>
      }
    >
      <div className="space-y-6">
        {error && (
          <div className="flex items-center gap-3 rounded-xl border border-rose-500/30 bg-rose-50/20 p-4 text-xs font-semibold text-rose-600 dark:bg-rose-950/20 dark:text-rose-400">
            <AlertCircle className="h-5 w-5 flex-shrink-0" />
            <p>{error}</p>
          </div>
        )}

        {loading ? (
          <div className="space-y-3">
            <div className="h-12 rounded-xl bg-slate-200 animate-pulse dark:bg-slate-800" />
            <div className="h-12 rounded-xl bg-slate-200 animate-pulse dark:bg-slate-800" />
            <div className="h-12 rounded-xl bg-slate-200 animate-pulse dark:bg-slate-800" />
          </div>
        ) : (
          <>
            <div className="mb-4">
              <SearchInput value={searchQuery} onChange={setSearchQuery} placeholder="Cari SPDK, BTO, tujuan, pelaksana..." className="w-full sm:w-96" />
            </div>
            {searchedItems.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-slate-200 py-16 text-slate-400 dark:border-slate-800">
                <Check className="h-10 w-10 text-emerald-500" />
                <p className="text-sm font-semibold">Tidak ada dinas yang menunggu persetujuan SDM.</p>
              </div>
            ) : (
              <div className="overflow-hidden rounded-xl border border-slate-200 bg-surface-card shadow-neu-sm dark:border-slate-800">
                <table className="w-full">
                  <thead>
                    <tr className="bg-surface-sunken text-slate-500 dark:text-slate-400">
                      <th className="px-4 py-3 text-left text-xs font-bold uppercase">No. BTO</th>
                      <th className="px-4 py-3 text-left text-xs font-bold uppercase">Pelaksana</th>
                      <th className="px-4 py-3 text-left text-xs font-bold uppercase">Tujuan</th>
                      <th className="px-4 py-3 text-left text-xs font-bold uppercase">Tanggal Dinas</th>
                      <th className="px-4 py-3 text-center text-xs font-bold uppercase">Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sdmPagination.pageItems.map((item) => (
                      <tr key={item.id} className="border-t border-slate-200 hover:bg-slate-50/60 dark:border-slate-800 dark:hover:bg-slate-950/30">
                        <td className="px-4 py-3.5 text-sm font-bold text-slate-750 dark:text-slate-250">
                          {docNumber(item.nomorBto, item.id)}
                        </td>
                        <td className="px-4 py-3.5 text-sm">
                          <p className="font-bold text-slate-800 dark:text-slate-200">{item.employeeNama || 'Karyawan'}</p>
                          <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">PT: {item.pemberiTugasNama || '-'}</p>
                        </td>
                        <td className="px-4 py-3.5 text-sm">
                          <p className="max-w-[240px] truncate font-bold text-slate-800 dark:text-slate-200">{item.tujuanNama}</p>
                          <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">{item.wilayahTipe?.replace(/_/g, ' ') || '-'}</p>
                        </td>
                        <td className="px-4 py-3.5 text-sm text-slate-600 dark:text-slate-400">
                          {fmtDate(item.estBerangkat)} - {fmtDate(item.estKembali)}
                        </td>
                        <td className="px-4 py-3.5 text-center">
                          <div className="flex items-center justify-center gap-1.5 whitespace-nowrap">
                            <button
                              type="button"
                              onClick={() => setEditingBto(item)}
                              className="p-1.5 rounded-xl text-amber-600 hover:bg-amber-50 dark:text-amber-400 dark:hover:bg-amber-500/10 transition-colors group flex items-center justify-center"
                              title="Edit Data Dinas (Admin)"
                            >
                              <Pencil className="h-4 w-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => openDetail(item)}
                              className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold text-teal-600 transition-colors hover:bg-teal-50 dark:text-teal-400 dark:hover:bg-teal-950/30"
                            >
                              <Info className="h-4 w-4" />
                              Detail
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <PaginationControls
                  currentPage={sdmPagination.currentPage}
                  totalItems={searchedItems.length}
                  pageSize={sdmPagination.pageSize}
                  onPageChange={sdmPagination.setCurrentPage}
                  onPageSizeChange={sdmPagination.setPageSize}
                />
              </div>
            )}
          </>
        )}
      </div>

      <BusinessTripDetailModal
        bto={selected}
        title="Detail Persetujuan SDM"
        onClose={() => setSelected(null)}
        onEdit={(bto) => setEditingBto(bto)}
        footer={selected ? (
          <div className="flex justify-end items-center gap-2 flex-wrap">
            <Button variant="danger" onClick={() => confirmAction('reject')}>
              <X className="h-4 w-4" />
              Tolak
            </Button>
            <Button onClick={() => confirmAction('approve')}>
              <Check className="h-4 w-4" />
              Setujui SDM
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

      <Modal
        isOpen={confirmModalOpen}
        onClose={() => setConfirmModalOpen(false)}
        title={confirmActionType === 'approve' ? 'Konfirmasi Persetujuan SDM' : 'Penolakan Pengajuan BTO'}
        widthClassName="max-w-md"
      >
        <div className="space-y-4 pt-1">
          <div className="p-3.5 rounded-xl bg-teal-500/10 dark:bg-teal-950/40 border border-teal-500/20 dark:border-teal-500/30 text-xs text-slate-700 dark:text-slate-300 flex items-start gap-2.5 shadow-sm">
            <Info className="h-4 w-4 text-teal-600 dark:text-teal-400 flex-shrink-0 mt-0.5" />
            <p>
              {confirmActionType === 'approve'
                ? 'Anda akan menyetujui pengajuan perjalanan dinas ini. Catatan SDM wajib diisi.'
                : 'Harap masukkan alasan penolakan pengajuan BTO ini. Catatan SDM wajib diisi.'}
            </p>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
              Catatan SDM (Wajib)
            </label>
            <textarea
              rows={3}
              className="input-field text-xs bg-surface-sunken border border-slate-200 dark:border-slate-800 rounded-xl p-3 w-full resize-none focus:outline-none focus:ring-1 focus:ring-teal-500"
              placeholder="Masukkan catatan..."
              value={catatan}
              onChange={(e) => setCatatan(e.target.value)}
            />
          </div>
          <div className="pt-2 flex justify-end gap-2.5 flex-wrap">
            <Button variant="secondary" onClick={() => setConfirmModalOpen(false)} disabled={submitting}>
              Batal
            </Button>
            <Button
              variant={confirmActionType === 'reject' ? 'danger' : 'primary'}
              onClick={handleExecuteAction}
              disabled={submitting}
            >
              {confirmActionType === 'approve' ? 'Ya, Setujui' : 'Ya, Tolak'}
            </Button>
          </div>
        </div>
      </Modal>
    </PageTemplate>
  );
}
