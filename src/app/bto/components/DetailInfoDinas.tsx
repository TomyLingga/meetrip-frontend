import React from 'react';
import { Compass, MapPin, Clock, Layers, User, FileText, Download } from 'lucide-react';
import { formatDateTime, calculateDuration } from '@/utils/format';
import { openDocument } from '@/utils/api';

export default function DetailInfoDinas({
  selectedBto,
  approvalLog,
  getStatusBadge,
  bteDetails,
  dpDetails,
  hideLampiran
}: {
  selectedBto: any;
  approvalLog: any[];
  getStatusBadge: (status: string) => React.ReactNode;
  bteDetails?: any;
  dpDetails?: any;
  hideLampiran?: boolean;
}) {
  const parseMinutesToDetailedTime = (totalMinutes: number) => {
    const d = Math.floor(totalMinutes / (24 * 60));
    const h = Math.floor((totalMinutes % (24 * 60)) / 60);
    const m = totalMinutes % 60;
    const parts = [];
    if (d > 0) parts.push(`${d} hari`);
    if (h > 0) parts.push(`${h} jam`);
    if (m > 0) parts.push(`${m} menit`);
    return parts.length > 0 ? parts.join(' ') : '0 menit';
  };

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
      case 'BTE_PAYMENT': return 'Pembayaran BTE';
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

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Info Utama */}
        <div className="rounded-2xl border border-slate-200 bg-surface-card p-5 shadow-neu-sm dark:border-slate-800 space-y-4">
          <div className="flex items-center gap-2 text-slate-400 dark:text-slate-500 border-b border-slate-200 dark:border-slate-800 pb-2">
            <Compass className="h-4.5 w-4.5" />
            <p className="text-[10px] font-bold uppercase tracking-widest">Detail Perjalanan</p>
          </div>
          <div className="space-y-3.5">
            <div>
              <p className="text-[10px] text-slate-400">Tujuan</p>
              <p className="text-xs font-extrabold text-slate-900 dark:text-slate-200 mt-0.5">{selectedBto.tujuanNama}</p>
              {selectedBto.tujuanAlamat && (
                <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-2 leading-relaxed">{selectedBto.tujuanAlamat}</p>
              )}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-[10px] text-slate-400">Berangkat</p>
                <p className="text-[11px] font-bold text-slate-900 dark:text-slate-200 mt-0.5">
                  {formatDateTime(selectedBto.estBerangkat)}
                </p>
              </div>
              <div>
                <p className="text-[10px] text-slate-400">Kembali</p>
                <p className="text-[11px] font-bold text-slate-900 dark:text-slate-200 mt-0.5">
                  {formatDateTime(selectedBto.estKembali)}
                </p>
              </div>
            </div>
            <div>
              <p className="text-[10px] text-slate-400">Durasi Kegiatan</p>
              <p className="text-[11px] font-bold text-slate-900 dark:text-slate-200 mt-0.5 flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                {calculateDuration(selectedBto.estBerangkat, selectedBto.estKembali)}
              </p>
            </div>
            {selectedBto.jarakKm && (
              <div>
                <p className="text-[10px] text-slate-400">Jarak Tempuh</p>
                <p className="text-xs font-extrabold text-slate-900 dark:text-slate-200 mt-0.5 flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                  {selectedBto.jarakKm} km dari Kantor
                </p>
              </div>
            )}
            {selectedBto.estimasiWaktuMenit ? (
              <div>
                <p className="text-[10px] text-slate-400">Estimasi Perjalanan</p>
                <p className="text-xs font-extrabold text-slate-900 dark:text-slate-200 mt-0.5 flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                  {parseMinutesToDetailedTime(selectedBto.estimasiWaktuMenit)}
                </p>
              </div>
            ) : null}
          </div>
        </div>

        {/* Pemberi Tugas & Bawaan */}
        <div className="rounded-2xl border border-slate-200 bg-surface-card p-5 shadow-neu-sm dark:border-slate-800 space-y-3.5">
          <div className="flex items-center gap-2 text-slate-400 dark:text-slate-500 border-b border-slate-200 dark:border-slate-800 pb-2">
            <Layers className="h-4.5 w-4.5" />
            <p className="text-[10px] font-bold uppercase tracking-widest">Administrasi &amp; Barang</p>
          </div>
          <div className="space-y-3">
            <div>
              <p className="text-[10px] text-slate-400 flex items-center gap-1">
                <User className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                Pelaksana Dinas
              </p>
              <p className="text-xs font-extrabold text-slate-900 dark:text-slate-200 mt-0.5 ml-5">
                {selectedBto.employeeNama || '—'}
              </p>
            </div>
            <div>
              <p className="text-[10px] text-slate-400 flex items-center gap-1">
                <User className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                Pemberi Tugas
              </p>
              <p className="text-xs font-extrabold text-slate-900 dark:text-slate-200 mt-0.5 ml-5">
                {selectedBto.pemberiTugasNama || '—'}
              </p>
            </div>
            <div>
              <p className="text-[10px] text-slate-400 flex items-center gap-1 mb-1">
                <Layers className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                Barang yang Dibawa
              </p>
              <div className="ml-5">
                {selectedBto.barang ? (
                  <div className="flex flex-wrap gap-1">
                    {selectedBto.barang.split(',').map((item: string, idx: number) => (
                      <span key={idx} className="inline-flex items-center px-2 py-0.5 rounded-lg text-[10px] font-bold bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-400 border border-teal-200/20">
                        {item.trim()}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 italic">—</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Realisasi & Penyelesaian Biaya (BTE vs DP) */}
      {['REPORT_UPLOADED', 'BTE_DRAFT', 'ADMIN_BTE_REVIEW', 'BTE_PAYMENT', 'COMPLETED', 'PAID'].includes(selectedBto.status) && (dpDetails || bteDetails) && (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-surface-card shadow-neu-sm dark:border-slate-800">
          <div className="border-b border-slate-200 bg-slate-50 px-4 py-2 dark:border-slate-800 dark:bg-slate-950/60">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Realisasi &amp; Penyelesaian Biaya (BTE vs DP)</p>
          </div>
          <div className="p-4 grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 shadow-neu-sm dark:border-slate-800 dark:bg-slate-950/60">
              <p className="text-[10px] text-slate-400 font-semibold">Panjar Diterima (DP)</p>
              <div className="text-sm font-extrabold text-slate-900 dark:text-slate-200 mt-1">
                {dpDetails ? (
                  dpDetails.totalUsd && Number(dpDetails.totalUsd) > 0 ? (
                    <>
                      {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(Number(dpDetails.totalUsd))}
                      <span className="text-[10px] text-slate-500 block font-semibold">
                        ({new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(Number(dpDetails.totalIdr))})
                      </span>
                    </>
                  ) : (
                    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(Number(dpDetails.totalIdr || 0))
                  )
                ) : 'Tidak menerima Panjar'}
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 shadow-neu-sm dark:border-slate-800 dark:bg-slate-950/60">
              <p className="text-[10px] text-slate-400 font-semibold">Realisasi Pengeluaran (BTE)</p>
              <div className="text-sm font-extrabold text-slate-900 dark:text-slate-200 mt-1">
                {bteDetails ? (
                  bteDetails.totalUsd && Number(bteDetails.totalUsd) > 0 ? (
                    <>
                      {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(Number(bteDetails.totalUsd))}
                      <span className="text-[10px] text-slate-500 block font-semibold">
                        ({new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(Number(bteDetails.totalIdr))})
                      </span>
                    </>
                  ) : (
                    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(Number(bteDetails.totalIdr || 0))
                  )
                ) : 'Belum mengunggah BTE'}
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 shadow-neu-sm dark:border-slate-800 dark:bg-slate-950/60 sm:col-span-1">
              <p className="text-[10px] text-slate-400 font-semibold">Status Penyelesaian Selisih</p>
              <div className="mt-1">
                {(() => {
                  if (!bteDetails) {
                    return <span className="text-xs font-semibold text-slate-500 italic">Menunggu Realisasi</span>;
                  }

                  const isUsd = bteDetails.totalUsd && Number(bteDetails.totalUsd) > 0;
                  const dpAmt = isUsd ? Number(dpDetails?.totalUsd || 0) : Number(dpDetails?.totalIdr || 0);
                  const bteAmt = isUsd ? Number(bteDetails.totalUsd || 0) : Number(bteDetails.totalIdr || 0);
                  const difference = bteAmt - dpAmt;

                  if (difference > 0) {
                    return (
                      <div>
                        <span className="inline-flex px-2 py-0.5 text-[10px] font-bold rounded-lg bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 border border-amber-200/30 mb-1">
                          Perusahaan Harus Membayar (Kurang Bayar)
                        </span>
                        <p className="text-xs font-extrabold text-amber-600 dark:text-amber-400">
                          {isUsd
                            ? new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(difference)
                            : new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(difference)
                          }
                        </p>
                      </div>
                    );
                  } else if (difference < 0) {
                    return (
                      <div>
                        <span className="inline-flex px-2 py-0.5 text-[10px] font-bold rounded-lg bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400 border border-rose-200/30 mb-1">
                          Karyawan Harus Mengembalikan (Lebih Bayar)
                        </span>
                        <p className="text-xs font-extrabold text-rose-600 dark:text-rose-400">
                          {isUsd
                            ? new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(Math.abs(difference))
                            : new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(Math.abs(difference))
                          }
                        </p>
                      </div>
                    );
                  } else {
                    return <span className="text-xs font-extrabold text-teal-600 dark:text-teal-400">Sesuai (Lunas/Tidak ada selisih)</span>;
                  }
                })()}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Data Absensi Lokasi GPS */}
      {(() => {
        const absenLog = approvalLog.find((log) => log.tahap === 'absen');
        if (!absenLog) return null;
        return (
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-surface-card shadow-neu-sm dark:border-slate-800">
            <div className="border-b border-slate-200 bg-slate-50 px-4 py-2 dark:border-slate-800 dark:bg-slate-950/60">
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Informasi Absensi GPS Kedatangan</p>
            </div>
            <div className="p-4 grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 shadow-neu-sm dark:border-slate-800 dark:bg-slate-950/60">
                <p className="text-[10px] text-slate-400 font-semibold">Status Absen</p>
                <p className="text-xs font-extrabold text-slate-900 dark:text-slate-200 mt-1">
                  {absenLog.aksi === 'override_absen' ? 'Dilewati/Override oleh Admin' : 'Absen Berhasil (Mandiri)'}
                </p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 shadow-neu-sm dark:border-slate-800 dark:bg-slate-950/60">
                <p className="text-[10px] text-slate-400 font-semibold">Koordinat GPS</p>
                <p className="text-xs font-extrabold text-slate-900 dark:text-slate-200 mt-1">
                  {absenLog.stampLat && absenLog.stampLng ? (
                    <span className="font-mono text-[11px]">
                      {Number(absenLog.stampLat).toFixed(6)}, {Number(absenLog.stampLng).toFixed(6)}
                    </span>
                  ) : '—'}
                </p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 shadow-neu-sm dark:border-slate-800 dark:bg-slate-950/60">
                <p className="text-[10px] text-slate-400 font-semibold">Keterangan / Jarak</p>
                <p className="text-xs font-extrabold text-slate-900 dark:text-slate-200 mt-1">
                  {absenLog.catatan || '—'}
                </p>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Lampiran Dokumen */}
      {!hideLampiran && (selectedBto.lampiranPath || bteDetails?.laporanPath || bteDetails?.kuitansiPath) && (
        <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 overflow-hidden shadow-[0_0_20px_rgba(0,0,0,0.06)] dark:shadow-[0_0_30px_rgba(0,0,0,0.4)]">
          <div className="bg-slate-50/80 dark:bg-slate-950/40 px-4 py-2 border-b border-slate-200 dark:border-slate-800">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Lampiran Dokumen</p>
          </div>
          <div className="divide-y divide-slate-100 dark:divide-slate-800/60 bg-white dark:bg-transparent">
            {selectedBto.lampiranPath && (
              <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 gap-3 sm:gap-0">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl text-rose-500">
                    <FileText className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-800 dark:text-slate-200">Surat Tugas / Memo</p>
                    <p className="text-[10px] text-slate-400">{selectedBto.lampiranNama || 'Dokumen PDF'}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const path = selectedBto.lampiranPath!;
                    const targetPath = path.startsWith('/api') || path.startsWith('/uploads/') ? path : `/uploads/${path}`;
                    void openDocument(targetPath);
                  }}
                  className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-4 py-2 sm:px-3 sm:py-1.5 text-[11px] sm:text-[10px] font-bold text-teal-600 bg-teal-50 hover:bg-teal-100 dark:text-teal-400 dark:bg-teal-500/10 dark:hover:bg-teal-500/20 rounded-lg transition-colors"
                >
                  <Download className="h-4 w-4 sm:h-3.5 sm:w-3.5" /> Unduh Lampiran
                </button>
              </div>
            )}
            {bteDetails?.laporanPath && (
              <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 gap-3 sm:gap-0">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl text-blue-500">
                    <FileText className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-800 dark:text-slate-200">Laporan Dinas</p>
                    <p className="text-[10px] text-slate-400">Telah diunggah</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => openDocument(`/uploads/${bteDetails.laporanPath}`)}
                  className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-4 py-2 sm:px-3 sm:py-1.5 text-[11px] sm:text-[10px] font-bold text-teal-600 bg-teal-50 hover:bg-teal-100 dark:text-teal-400 dark:bg-teal-500/10 dark:hover:bg-teal-500/20 rounded-lg transition-colors"
                >
                  <Download className="h-3.5 w-3.5" /> Lihat / Unduh
                </button>
              </div>
            )}
            {bteDetails?.kuitansiPath && (
              <div className="flex items-center justify-between p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl text-amber-500">
                    <FileText className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-800 dark:text-slate-200">Kuitansi / Bukti Bayar</p>
                    <p className="text-[10px] text-slate-400">Telah diunggah</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => openDocument(`/uploads/${bteDetails.kuitansiPath}`)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-bold text-teal-600 bg-teal-50 hover:bg-teal-100 dark:text-teal-400 dark:bg-teal-500/10 dark:hover:bg-teal-500/20 rounded-lg transition-colors"
                >
                  <Download className="h-3.5 w-3.5" /> Lihat / Unduh
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Timeline Approval */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-surface-card shadow-neu-sm dark:border-slate-800">
        <div className="border-b border-slate-200 bg-slate-50 px-4 py-2 dark:border-slate-800 dark:bg-slate-950/60">
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Lacak Status Persetujuan</p>
        </div>
        <div className="p-5">
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
                        <div className="mt-2 p-3 bg-surface-sunken/50 rounded-xl border border-slate-200 dark:border-slate-800">
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
      </div>
    </div>
  );
}
