import React, { useState } from 'react';
import { Info, Plus, Trash2 } from 'lucide-react';
import { InputUang } from './InputUang';
import DragDropUpload from '@/components/form/DragDropUpload';
import Button from '@/components/ui/Button';
import { openDocument, apiFetchRaw } from '@/utils/api';

export default function DetailBTE({
  selectedBto,
  user,
  bteDetails,
  setBteDetails,
  bteValues,
  setBteValues,
  paguList,
  bteBiayaLain,
  setBteBiayaLain,
  usdRate,
  setUsdRate,
  kuitansiFile,
  setKuitansiFile,
  laporanFile,
  setLaporanFile,
  handleSaveBte,
  apiFetch,
  showAlert,
  approvalLog
}: {
  selectedBto: any;
  user: any;
  bteDetails: any;
  setBteDetails: (val: any) => void;
  bteValues: Record<string, number>;
  setBteValues: (val: Record<string, number>) => void;
  paguList: any[];
  bteBiayaLain: any[];
  setBteBiayaLain: (val: any[]) => void;
  usdRate: number;
  setUsdRate: (val: number) => void;
  kuitansiFile: File | null;
  setKuitansiFile: (val: File | null) => void;
  laporanFile: File | null;
  setLaporanFile: (val: File | null) => void;
  handleSaveBte: (isDraft?: boolean) => Promise<void>;
  apiFetch: (url: string, options?: any) => Promise<any>;
  showAlert: (msg: string, type: 'success' | 'error' | 'warning' | 'info') => void;
  approvalLog?: any[];
}) {
  const [uploading, setUploading] = useState(false);
  const [bteValidationErrors, setBteValidationErrors] = useState<string[]>([]);

  const canEditBte =
    ((selectedBto.status === 'ATTENDED' || selectedBto.status === 'REPORT_UPLOADED' || selectedBto.status === 'BTE_DRAFT' || selectedBto.status === 'REVISION_BTE' || bteDetails?.status === 'REVISION') && selectedBto.employeeId === user?.id) ||
    user?.role?.split?.(',').some((r: string) => ['admin', 'super_admin'].includes(r));

  // Validate before submitting BTE
  const handleValidatedSaveBte = async () => {
    const errs: string[] = [];

    // Check kuitansi uploaded
    if (!bteDetails?.kuitansiPath && !kuitansiFile) {
      errs.push('Kuitansi / Bukti Bayar wajib diupload');
    }

    // Check laporan uploaded
    if (!bteDetails?.laporanPath && !laporanFile) {
      errs.push('Laporan Perjalanan Dinas (PDF) wajib diupload');
    }

    if (errs.length > 0) {
      setBteValidationErrors(errs);
      showAlert('Harap lengkapi semua dokumen wajib sebelum mengajukan BTE.', 'warning');
      return;
    }

    setBteValidationErrors([]);
    await handleSaveBte(false);
  };

  const handleSaveDraftBte = async () => {
    setBteValidationErrors([]);
    await handleSaveBte(true);
  };

  // Find the latest revision note if the BTO is in REVISION_BTE status
  const bteRevisionLog = selectedBto.status === 'REVISION_BTE' && approvalLog 
    ? approvalLog.find(log => log.tahap === 'bte' && log.aksi === 'revision')
    : null;

  const categoryLabels: Record<string, string> = {
    saku: 'Uang Saku / Pocket Money',
    hotel: 'Akomodasi / Hotel',
    laundry: 'Laundry',
    transport: 'Transportasi / Travel',
    meal: 'Uang Makan / Meal Allowance',
    lain_lain: 'Lain-lain / Others',
  };

  const groupedPaguList = React.useMemo(() => {
    const groups: Record<string, any[]> = {};
    paguList.forEach(p => {
      const cat = p.kategori || 'lain_lain';
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(p);
    });
    return groups;
  }, [paguList]);

  return (
    <div className="space-y-4">
      {selectedBto.status === 'REVISION_BTE' && bteRevisionLog && (
        <div className="p-4 bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 rounded-xl mb-4">
          <p className="text-sm font-bold text-rose-700 dark:text-rose-400 mb-1">Admin Meminta Revisi Realisasi BTE</p>
          <p className="text-xs text-rose-600 dark:text-rose-300 break-words whitespace-pre-wrap">{bteRevisionLog.catatan || 'Mohon perbaiki isian Realisasi BTE atau Kuitansi Anda.'}</p>
        </div>
      )}

      {selectedBto.wilayahTipe === 'luar_negeri' && (
        <div className="flex items-center justify-between p-4 rounded-2xl bg-amber-500/5 border border-amber-500/10 w-full gap-4">
          <div className="flex items-center gap-2">
            <Info className="w-4 h-4 text-amber-500 shrink-0" />
            <div>
              <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Kurs Konversi USD → IDR</p>
              <p className="text-[9px] text-slate-500 dark:text-slate-400">Gunakan nilai kurs real-time saat realisasi.</p>
            </div>
          </div>
          <input
            type="number"
            value={usdRate}
            disabled={!canEditBte}
            onChange={e => setUsdRate(Number(e.target.value))}
            className="input-field max-w-xs"
          />
        </div>
      )}

      {/* Kuitansi */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-surface-card p-4 space-y-3 shadow-neu-sm">
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Upload Kuitansi / Receipts</p>
        {bteDetails?.kuitansiPath ? (
          <p className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold">
            ✓ Sudah diupload — <button type="button" onClick={() => openDocument(`/uploads/${bteDetails.kuitansiPath}`)} className="underline">{bteDetails.kuitansiNama || 'Download'}</button>
          </p>
        ) : (
          <p className="text-xs text-slate-400 italic">Belum ada kuitansi diupload.</p>
        )}

        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-4">Upload Laporan Perjalanan Dinas</p>
        {bteDetails?.laporanPath ? (
          <p className="text-xs text-blue-600 dark:text-blue-400 font-semibold">
            ✓ Sudah diupload - <button type="button" onClick={() => openDocument(`/uploads/${bteDetails.laporanPath}`)} className="underline">{bteDetails.laporanNama || 'Download'}</button>
          </p>
        ) : (
          <p className="text-xs text-slate-400 italic">Belum ada laporan diupload.</p>
        )}

        {canEditBte && (
          <div className="flex flex-col gap-3 mt-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
                  Kuitansi / Bukti Bayar <span className="text-red-500">*</span>
                </p>
                <DragDropUpload
                  selectedFile={kuitansiFile}
                  onFileSelect={(file) => setKuitansiFile(file)}
                  accept=".pdf,image/png,image/jpeg,image/webp"
                  maxSizeMB={5}
                />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
                  Laporan Perjalanan Dinas (PDF) <span className="text-red-500">*</span>
                </p>
                <DragDropUpload
                  selectedFile={laporanFile}
                  onFileSelect={(file) => setLaporanFile(file)}
                  accept=".pdf"
                  maxSizeMB={10}
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Rincian BTE (Grouped by Category) */}
      <div className="space-y-4">
        {Object.entries(groupedPaguList).map(([catKey, items]) => {
          const catLabel = categoryLabels[catKey] || catKey.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
          return (
            <div key={catKey} className="rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden bg-surface-card shadow-neu-sm">
              <div className="bg-surface-sunken/60 px-4 py-2 border-b border-slate-100 dark:border-slate-800/60 flex items-center justify-between">
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">{catLabel}</p>
                <span className="text-[9px] bg-slate-200/60 dark:bg-slate-950 px-2 py-0.5 rounded text-slate-500 font-semibold">{items.length} item</span>
              </div>
              <div className="divide-y divide-slate-200/40 dark:divide-white/[0.04]">
                {items.map((p) => {
                  const val = bteValues[p.rincianId] ?? 0;
                  const maxPagu = (p.isUnlimited || p.nilaiLimit == null) ? null : ((p.nilaiLimit || 0) * (p.jumlahHari || 1));
                  const isOverLimit = maxPagu !== null && val > maxPagu;

                  return (
                    <div key={p.rincianId} className={`flex flex-col px-4 py-3 bg-surface-card hover:bg-slate-100/50 dark:hover:bg-slate-800/50 transition-colors ${isOverLimit ? 'bg-amber-50/30 dark:bg-amber-950/10' : ''}`}>
                      <div className="flex items-center justify-between gap-4">
                        <div>
                          <p className="text-sm font-bold text-slate-800 dark:text-slate-200">{p.rincianLabel}</p>
                          <span className="text-[11px] text-slate-400">
                            Limit: {maxPagu === null ? 'Sesuai Kuitansi' : (p.useDollar ? `$${maxPagu}` : `Rp ${maxPagu.toLocaleString('id-ID')}`)}
                            {maxPagu !== null && (p.jumlahHari || 1) > 1 && ` (x${p.jumlahHari} hr)`}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className={`text-xs font-bold ${isOverLimit ? 'text-amber-500' : 'text-slate-400'}`}>{p.useDollar ? '$' : 'Rp'}</span>
                          <InputUang
                            value={val}
                            useDollar={p.useDollar}
                            disabled={!canEditBte}
                            onChange={newVal => setBteValues({ ...bteValues, [p.rincianId]: newVal })}
                            className={`w-52 input-field text-right text-sm disabled:opacity-60 font-semibold transition-colors ${
                              isOverLimit 
                                ? 'border-amber-300 bg-amber-50 text-amber-700 focus:border-amber-500 focus:ring-amber-500/20 dark:border-amber-700 dark:bg-amber-950/30 dark:text-amber-400' 
                                : ''
                            }`}
                          />
                        </div>
                      </div>
                      {isOverLimit && (
                        <div className="flex items-start gap-1.5 mt-2 justify-end animate-in fade-in slide-in-from-top-1">
                          <Info className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                          <p className="text-[10px] text-amber-600 dark:text-amber-400 max-w-[260px] text-right font-medium leading-tight">
                            Melebihi maksimal limit pagu. Nilai berlebih akan ditinjau ulang oleh verifikator (At Cost).
                          </p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Biaya Lain-Lain */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-surface-card p-4 space-y-3 shadow-neu-sm">
        <div className="flex items-center justify-between">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Biaya Lain-Lain</p>
          {canEditBte && (
            <button
              type="button"
              onClick={() => setBteBiayaLain([...bteBiayaLain, { keterangan: '', nilai: 0, useDollar: selectedBto.wilayahTipe === 'luar_negeri', nilaiUsd: 0 }])}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-indigo-600 dark:text-indigo-400 text-xs font-bold hover:bg-indigo-50 dark:hover:bg-indigo-500/10 transition-colors"
            >
              <Plus className="h-3.5 w-3.5" />
              Tambah
            </button>
          )}
        </div>
        <p className="text-[10px] text-slate-400">
          Gunakan bagian ini untuk biaya tambahan yang tidak ada di rincian utama, misalnya parkir, tol, materai, atau kebutuhan perjalanan lain yang sah.
        </p>
        {bteBiayaLain.length === 0 && <p className="text-xs text-slate-400 italic">Tidak ada biaya lain-lain.</p>}
        <div className="space-y-2">
          {bteBiayaLain.map((bl, idx) => {
            return (
              <div key={idx} className="flex flex-wrap items-center gap-2 p-2 rounded-xl bg-surface-card border border-slate-200/40 dark:border-slate-800/60 hover:bg-slate-100/50 dark:hover:bg-slate-800/50 transition-colors shadow-neu">
                <input type="text" placeholder="Keterangan biaya, misal Parkir / Tol / Materai" value={bl.keterangan || ''} disabled={!canEditBte}
                  onChange={e => { const n = [...bteBiayaLain]; n[idx] = { ...n[idx], keterangan: e.target.value }; setBteBiayaLain(n); }}
                  className="flex-1 min-w-[140px] input-field text-xs py-1.5" />
                <div className="flex items-center gap-1">
                  <span className="text-xs text-slate-400">{bl.useDollar ? '$' : 'Rp'}</span>
                  <InputUang
                    value={bl.nilai || 0}
                    useDollar={bl.useDollar}
                    disabled={!canEditBte}
                    onChange={newVal => {
                      const n = [...bteBiayaLain];
                      n[idx] = { ...n[idx], nilai: newVal };
                      setBteBiayaLain(n);
                    }}
                    className="w-48 input-field text-xs text-right py-1.5 font-semibold"
                  />
                </div>
                {canEditBte && (
                  <button type="button" onClick={() => setBteBiayaLain(bteBiayaLain.filter((_, i) => i !== idx))}
                    className="inline-flex items-center gap-1 text-xs font-bold text-red-500 hover:text-red-600 px-2 py-1 rounded">
                    <Trash2 className="h-3.5 w-3.5" />
                    Hapus
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Total BTE */}
      {(() => {
        let totalUsd = 0, totalIdr = 0;
        paguList.forEach(p => {
          const val = bteValues[p.rincianId] ?? 0;
          if (p.useDollar) { totalUsd += val; totalIdr += val * usdRate; }
          else totalIdr += val;
        });
        bteBiayaLain.forEach(bl => {
          const val = Number(bl.nilai || 0);
          if (bl.useDollar) { totalUsd += val; totalIdr += val * usdRate; }
          else totalIdr += val;
        });
        return (
          <div className="rounded-2xl border border-teal-200/60 dark:border-teal-500/20 bg-teal-50/40 dark:bg-teal-500/5 p-4 space-y-2">
            <p className="text-[10px] font-bold text-teal-500 uppercase tracking-widest">Preview Realisasi BTE</p>
            {totalUsd > 0 && (
              <div className="flex justify-between text-sm"><span className="text-slate-500">Total USD</span><span className="font-bold text-slate-900 dark:text-white">${totalUsd.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span></div>
            )}
            <div className="flex justify-between text-sm"><span className="text-slate-500">Total IDR</span><span className="font-bold text-teal-600 dark:text-teal-400">Rp {Math.round(totalIdr).toLocaleString('id-ID')}</span></div>
          </div>
        );
      })()}

      {bteValidationErrors.length > 0 && (
        <div className="p-4 rounded-xl border border-rose-200 dark:border-rose-500/30 bg-rose-50 dark:bg-rose-500/10 space-y-1">
          <p className="text-xs font-bold text-rose-700 dark:text-rose-400 mb-1">Harap perbaiki sebelum mengajukan:</p>
          <ul className="list-disc list-inside space-y-0.5">
            {bteValidationErrors.map((err, i) => (
              <li key={i} className="text-xs text-rose-600 dark:text-rose-300">{err}</li>
            ))}
          </ul>
        </div>
      )}

      {(() => {
        const isAdminUser = user?.role?.split?.(',').some((r: string) => ['admin', 'super_admin'].includes(r));
        const isKuitansiReady = Boolean(bteDetails?.kuitansiPath || kuitansiFile);
        const isLaporanReady = Boolean(bteDetails?.laporanPath || laporanFile);
        const isReadyToSubmit = isAdminUser || (isKuitansiReady && isLaporanReady);

        if (!canEditBte && !isAdminUser) return null;
        if (selectedBto.status === 'BTE_PAYMENT' || selectedBto.status === 'COMPLETED') return null;

        return (
          <div className="space-y-3 pt-2">
            {!isAdminUser && !isReadyToSubmit && (
              <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 text-xs text-amber-800 dark:text-amber-300 flex items-start gap-2.5">
                <Info className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold">Lengkapi Dokumen Sebelum Mengajukan BTE:</p>
                  <ul className="list-disc list-inside mt-1 space-y-0.5 text-[11px]">
                    {!isKuitansiReady && <li>Wajib mengunggah Kuitansi / Bukti Bayar</li>}
                    {!isLaporanReady && <li>Wajib mengunggah Laporan Perjalanan Dinas (PDF)</li>}
                  </ul>
                </div>
              </div>
            )}

            <div className="flex flex-wrap items-center justify-end gap-3">
              <Button
                type="button"
                variant="amber"
                onClick={handleSaveDraftBte}
                className="px-5 py-2 text-xs font-bold rounded-xl"
              >
                {isAdminUser ? 'Simpan Perubahan DRAFT (Admin)' : 'Simpan DRAFT BTE'}
              </Button>
              <Button
                type="button"
                variant="primary"
                onClick={handleValidatedSaveBte}
                disabled={!isReadyToSubmit || uploading}
                className="px-5 py-2 text-xs font-bold rounded-xl"
              >
                {uploading ? 'Mengunggah...' : 'Upload BTE (Ajukan ke Admin)'}
              </Button>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
