import React, { useEffect, useMemo, useState } from 'react';
import { FileText, Loader2, ReceiptText, Download } from 'lucide-react';
import Modal from '@/components/ui/Modal';
import { apiFetch, openDocument, getCachedUser } from '@/utils/api';
import DetailInfoDinas from './DetailInfoDinas';
import DocumentDownloadButton from './DocumentDownloadButton';

type DetailTab = 'info' | 'dp' | 'lampiran' | 'bte';

type Props = {
  bto: any | null;
  title?: string;
  onClose: () => void;
  onEdit?: (bto: any) => void;
  footer?: React.ReactNode;
  initialTab?: DetailTab;
  showBte?: boolean;
};

const statusBadge = (status: string) => {
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

const formatMoney = (value: any, useDollar = false) => {
  const num = Number(value) || 0;
  if (useDollar) {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(num);
  }
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(num);
};

const rowsOf = (payload: any, primary: string, fallback: string) => {
  const rows = payload?.[primary] || payload?.[fallback] || [];
  return Array.isArray(rows) ? rows : [];
};

function ReadOnlyCostTable({ rows, emptyText }: { rows: any[]; emptyText: string }) {
  if (!rows.length) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-200 p-8 text-center text-sm font-semibold text-slate-400 dark:border-slate-800">
        {emptyText}
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800 shadow-neu-sm">
      <table className="w-full">
        <thead>
          <tr className="bg-surface-sunken text-slate-500 dark:text-slate-400">
            <th className="px-3 py-2 text-left text-xs font-bold">Kategori</th>
            <th className="px-3 py-2 text-center text-xs font-bold">Hari</th>
            <th className="px-3 py-2 text-right text-xs font-bold">Nilai</th>
            <th className="px-3 py-2 text-right text-xs font-bold">Total</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((item, idx) => {
            const days = Number(item.jumlahHari) || 1;
            const total = Number(item.nilaiTotal ?? item.nilaiPerHari ?? 0);
            const perDay = Number(item.nilaiPerHari ?? (total / days)) || 0;
            return (
              <tr key={item.id || idx} className="border-t border-slate-200 dark:border-slate-800">
                <td className="px-3 py-2.5 text-xs font-semibold text-slate-800 dark:text-slate-200">{item.rincianLabel || item.keterangan || '-'}</td>
                <td className="px-3 py-2.5 text-center text-xs text-slate-500">{days}</td>
                <td className="px-3 py-2.5 text-right text-xs text-slate-600 dark:text-slate-300">{formatMoney(perDay, item.useDollar)}</td>
                <td className="px-3 py-2.5 text-right text-xs font-bold text-slate-900 dark:text-white">{formatMoney(total, item.useDollar)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export default function BusinessTripDetailModal({ bto, title = 'Detail Pengajuan Dinas', onClose, onEdit, footer, initialTab = 'info', showBte = true }: Props) {
  const [tab, setTab] = useState<DetailTab>(initialTab);
  const [detail, setDetail] = useState<any | null>(null);
  const [dp, setDp] = useState<any | null>(null);
  const [bte, setBte] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);

  const cachedUser = typeof window !== 'undefined' ? getCachedUser() : null;
  const isAdmin = cachedUser?.role?.split(',').some((r: string) => ['admin', 'super_admin'].includes(r));

  useEffect(() => {
    if (!bto?.id) return;
    let alive = true;
    setTab(initialTab);
    setLoading(true);
    setDetail(null);
    setDp(null);
    setBte(null);

    Promise.all([
      apiFetch(`/api/bto/${bto.id}`).catch(() => null),
      apiFetch(`/api/dp/bto/${bto.id}`).catch(() => null),
      apiFetch(`/api/bte/bto/${bto.id}`).catch(() => null),
    ]).then(([detailRes, dpRes, bteRes]) => {
      if (!alive) return;
      setDetail(detailRes);
      setDp(dpRes);
      setBte(bteRes);
    }).finally(() => {
      if (alive) setLoading(false);
    });

    return () => {
      alive = false;
    };
  }, [bto?.id, initialTab]);

  const mergedBto = useMemo(() => ({ ...(bto || {}), ...(detail || {}) }), [bto, detail]);
  const approvalLogs = detail?.approvalLogs || [];
  const dpRows = rowsOf(dp, 'rincian', 'dpRincian');
  const bteRows = rowsOf(bte, 'rincian', 'bteRincian');
  const bteOtherRows = rowsOf(bte, 'biayaLain', 'bteBiayaLain');
  const submittedOrLaterStatuses = ['SUBMITTED', 'ADMIN_DP_REVIEW', 'REVISION_DP', 'PT_REVIEW', 'SDM_REVIEW', 'SPDK_DRAFT', 'KABAG_REVIEW', 'ACTIVE', 'ATTENDED', 'REPORT_UPLOADED', 'BTE_DRAFT', 'ADMIN_BTE_REVIEW', 'BTE_PAYMENT', 'COMPLETED', 'REJECTED'];
  const spdkApprovedStatuses = ['ACTIVE', 'ATTENDED', 'REPORT_UPLOADED', 'BTE_DRAFT', 'ADMIN_BTE_REVIEW', 'BTE_PAYMENT', 'COMPLETED'];
  const bteApprovedStatuses = ['BTE_PAYMENT', 'COMPLETED'];
  const canDownloadBto = Boolean(mergedBto.nomorBto || submittedOrLaterStatuses.includes(mergedBto.status));
  const canDownloadDp = canDownloadBto && Boolean(mergedBto.butuhDp && dp);
  const canDownloadSpdk = spdkApprovedStatuses.includes(mergedBto.status) || mergedBto.status === 'KABAG_REVIEW';
  const canDownloadBte = Boolean(bte && (bteApprovedStatuses.includes(mergedBto.status) || ['PENDING_PAYMENT', 'PAID'].includes(bte.status)));

  return (
    <Modal isOpen={!!bto} onClose={onClose} title={title} widthClassName="w-full max-w-5xl">
      {bto && (
        <div className="flex min-h-0 max-h-[calc(82vh-5rem)] flex-col">
          <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden pr-1.5 pb-2">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-3 dark:border-slate-800">
              <div className="flex flex-wrap gap-2">
                {[
                  { id: 'info', label: 'Info & Log' },
                  { id: 'dp', label: 'Panjar / DP' },
                  ...(mergedBto.lampiranPath || bte?.laporanPath || bte?.kuitansiPath ? [{ id: 'lampiran', label: 'Lampiran' }] : []),
                  ...(showBte && ['ATTENDED', 'REPORT_UPLOADED', 'BTE_DRAFT', 'ADMIN_BTE_REVIEW', 'BTE_PAYMENT', 'COMPLETED', 'PAID', 'REVISION_BTE'].includes(mergedBto.status) ? [{ id: 'bte', label: 'Realisasi BTE' }] : []),
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setTab(item.id as DetailTab)}
                    className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-colors ${tab === item.id ? 'bg-teal-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'}`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
              <div className="flex flex-wrap gap-2">
                {canDownloadBto && (
                  <DocumentDownloadButton path={`/api/document/bto/${mergedBto.id}/pdf`} className="gap-1.5 text-xs">
                    BTO
                  </DocumentDownloadButton>
                )}
                {canDownloadDp && (
                  <DocumentDownloadButton path={`/api/document/dp/${mergedBto.id}/pdf`} className="gap-1.5 text-xs">
                    DP
                  </DocumentDownloadButton>
                )}
                {canDownloadSpdk && (
                  <DocumentDownloadButton path={`/api/document/spdk/${mergedBto.id}/pdf`} className="gap-1.5 text-xs">
                    SPDK
                  </DocumentDownloadButton>
                )}
                {canDownloadBte && (
                  <DocumentDownloadButton path={`/api/document/bte/${mergedBto.id}/pdf`} className="gap-1.5 text-xs">
                    BTE
                  </DocumentDownloadButton>
                )}
              </div>
            </div>

            {loading ? (
              <div className="flex items-center justify-center gap-2 py-16 text-sm font-semibold text-slate-400">
                <Loader2 className="h-5 w-5 animate-spin text-teal-600" />
                Memuat detail dinas...
              </div>
            ) : (
              <div className="space-y-4">
                {tab === 'info' && (
                  <DetailInfoDinas
                    selectedBto={mergedBto}
                    approvalLog={approvalLogs}
                    getStatusBadge={statusBadge}
                    bteDetails={bte}
                    dpDetails={dp}
                    hideLampiran={true}
                  />
                )}

                {tab === 'dp' && (
                  <div className="space-y-4">
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950/40 shadow-neu-sm">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Ringkasan Panjar</p>
                      <p className="mt-1 text-sm font-bold text-slate-800 dark:text-slate-200">
                        {mergedBto.butuhDp ? 'Pengajuan ini menggunakan DP / panjar.' : 'Pengajuan ini tidak menggunakan DP / panjar.'}
                      </p>
                      {dp && (
                        <p className="mt-1 text-xs text-slate-500">
                          Total DP: <span className="font-bold text-teal-600 dark:text-teal-400">{formatMoney(dp.totalIdr)}</span>
                        </p>
                      )}
                    </div>
                    <ReadOnlyCostTable rows={dpRows} emptyText="Tidak ada rincian DP untuk dinas ini." />
                  </div>
                )}

                {tab === 'bte' && (
                  <div className="space-y-4">
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950/40 shadow-neu-sm">
                      <div className="flex items-start gap-3">
                        <ReceiptText className="mt-0.5 h-5 w-5 text-teal-600 dark:text-teal-400" />
                        <div>
                          <p className="text-sm font-black text-slate-900 dark:text-white">Realisasi BTE</p>
                          <p className="mt-1 text-xs text-slate-500">
                            {bte ? <>Total realisasi: <span className="font-bold text-teal-600 dark:text-teal-400">{formatMoney(bte.totalIdr)}</span></> : 'Belum ada realisasi BTE untuk dinas ini.'}
                          </p>
                          {bte?.kuitansiPath && (
                            <button type="button" onClick={() => openDocument(`/uploads/${bte.kuitansiPath}`)} className="mt-2 inline-flex items-center gap-1.5 text-xs font-bold text-teal-600 hover:underline dark:text-teal-400">
                              <FileText className="h-3.5 w-3.5" />
                              {bte.kuitansiNama || 'Lihat kuitansi'}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                    <ReadOnlyCostTable rows={bteRows} emptyText="Tidak ada rincian realisasi BTE." />
                    <ReadOnlyCostTable rows={bteOtherRows} emptyText="Tidak ada biaya lain-lain." />
                  </div>
                )}

                {tab === 'lampiran' && (
                  <div className="space-y-4">
                    <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 overflow-hidden shadow-[0_0_20px_rgba(0,0,0,0.06)] dark:shadow-[0_0_30px_rgba(0,0,0,0.4)]">
                      <div className="bg-slate-50/80 dark:bg-slate-950/40 px-4 py-2 border-b border-slate-200 dark:border-slate-800">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Daftar Dokumen Lampiran</p>
                      </div>
                      <div className="divide-y divide-slate-100 dark:divide-slate-800/60 bg-white dark:bg-transparent">
                        {mergedBto.lampiranPath && (
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 gap-3 sm:gap-0">
                            <div className="flex items-center gap-3">
                              <div className="p-2 rounded-xl text-rose-500 bg-rose-50 dark:bg-rose-500/10">
                                <FileText className="h-5 w-5" />
                              </div>
                              <div>
                                <p className="text-xs font-bold text-slate-800 dark:text-slate-200">Surat Tugas / Memo</p>
                                <p className="text-[10px] text-slate-400">{mergedBto.lampiranNama || 'Dokumen PDF'}</p>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                const path = mergedBto.lampiranPath!;
                                const targetPath = path.startsWith('/api') || path.startsWith('/uploads/') ? path : `/uploads/${path}`;
                                void openDocument(targetPath);
                              }}
                              className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-4 py-2 sm:px-3 sm:py-1.5 text-[11px] sm:text-[10px] font-bold text-teal-600 bg-teal-50 hover:bg-teal-100 dark:text-teal-400 dark:bg-teal-500/10 dark:hover:bg-teal-500/20 rounded-lg transition-colors"
                            >
                              <Download className="h-4 w-4 sm:h-3.5 sm:w-3.5" /> Lihat / Unduh
                            </button>
                          </div>
                        )}
                        {bte?.laporanPath && (
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 gap-3 sm:gap-0">
                            <div className="flex items-center gap-3">
                              <div className="p-2 rounded-xl text-blue-500 bg-blue-50 dark:bg-blue-500/10">
                                <FileText className="h-5 w-5" />
                              </div>
                              <div>
                                <p className="text-xs font-bold text-slate-800 dark:text-slate-200">Laporan Dinas</p>
                                <p className="text-[10px] text-slate-400">Telah diunggah</p>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => openDocument(`/uploads/${bte.laporanPath}`)}
                              className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-4 py-2 sm:px-3 sm:py-1.5 text-[11px] sm:text-[10px] font-bold text-teal-600 bg-teal-50 hover:bg-teal-100 dark:text-teal-400 dark:bg-teal-500/10 dark:hover:bg-teal-500/20 rounded-lg transition-colors"
                            >
                              <Download className="h-4 w-4 sm:h-3.5 sm:w-3.5" /> Lihat / Unduh
                            </button>
                          </div>
                        )}
                        {bte?.kuitansiPath && (
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 gap-3 sm:gap-0">
                            <div className="flex items-center gap-3">
                              <div className="p-2 rounded-xl text-amber-500 bg-amber-50 dark:bg-amber-500/10">
                                <ReceiptText className="h-5 w-5" />
                              </div>
                              <div>
                                <p className="text-xs font-bold text-slate-800 dark:text-slate-200">Kuitansi / Bukti Bayar</p>
                                <p className="text-[10px] text-slate-400">Telah diunggah</p>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => openDocument(`/uploads/${bte.kuitansiPath}`)}
                              className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-4 py-2 sm:px-3 sm:py-1.5 text-[11px] sm:text-[10px] font-bold text-teal-600 bg-teal-50 hover:bg-teal-100 dark:text-teal-400 dark:bg-teal-500/10 dark:hover:bg-teal-500/20 rounded-lg transition-colors"
                            >
                              <Download className="h-4 w-4 sm:h-3.5 sm:w-3.5" /> Lihat / Unduh
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {footer && (
            <div className="shrink-0 border-t border-slate-200 bg-surface-card pt-3 pb-1 px-1 mt-2 dark:border-slate-800">
              {footer}
            </div>
          )}
        </div>
      )}
    </Modal>
  );
}
