import React from 'react';
import { Coins, Info } from 'lucide-react';
import { InputUang } from './InputUang';
import Button from '@/components/ui/Button';
import DocumentDownloadButton from './DocumentDownloadButton';

export default function DetailPanjar({
  selectedBto,
  paguList,
  dpValues,
  setDpValues,
  usdRate,
  setUsdRate,
  user,
  handleSaveDp
}: {
  selectedBto: any;
  paguList: any[];
  dpValues: Record<string, number>;
  setDpValues: (val: Record<string, number>) => void;
  usdRate: number;
  setUsdRate: (val: number) => void;
  user: any;
  handleSaveDp: () => Promise<void>;
}) {
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

  const onSaveClick = async () => {
    let totalRequestedDp = 0;
    paguList.forEach(p => {
      const valPerHari = dpValues[p.rincianId] ?? 0;
      totalRequestedDp += valPerHari * (p.jumlahHari || 1);
    });

    if (totalRequestedDp === 0) {
      alert('Anda memilih membutuhkan panjar, namun semua rincian biaya panjar diisi dengan 0. Harap isi nilai panjar yang dibutuhkan.');
      return;
    }

    await handleSaveDp();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800/60 pb-2">
        <div className="flex items-center gap-2">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Estimasi Rincian &amp; Limit Pagu</p>
        </div>
      </div>

      {paguList.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-8 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl bg-surface-card text-center space-y-2 shadow-neu">
          <Coins className="h-8 w-8 text-amber-500 animate-pulse" />
          <p className="text-sm font-bold text-slate-700 dark:text-slate-200">Belum Ada Estimasi Panjar / Pagu</p>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md">
            Detail rincian pagu belum tersedia untuk BTO ini. Harap pastikan Tanggal Keberangkatan, Tanggal Kepulangan, dan Wilayah Perjalanan dinas sudah diisi dengan lengkap melalui tombol **Edit Detail BTO**.
          </p>
        </div>
      ) : (
        <>
          {selectedBto.wilayahTipe === 'luar_negeri' && (
            <div className="flex items-center justify-between p-4 rounded-2xl bg-amber-500/5 border border-amber-500/10 w-full gap-4 shadow-neu-sm">
              <div className="flex items-center gap-2">
                <Info className="w-4 h-4 text-amber-500 shrink-0" />
                <div>
                  <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Kurs Konversi USD → IDR</p>
                  <p className="text-[9px] text-slate-500 dark:text-slate-400">Gunakan nilai kurs real-time.</p>
                </div>
              </div>
              <div className="flex items-center gap-1.5 bg-surface-card border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 shadow-neu">
                <span className="text-xs font-bold text-slate-400">Rp</span>
                <InputUang
                  value={usdRate}
                  disabled={!(((selectedBto.status === 'DRAFT' || selectedBto.status === 'REVISION_DP') && selectedBto.employeeId === user?.id) || user?.role === 'admin')}
                  onChange={val => setUsdRate(val ?? 0)}
                  className="w-28 bg-transparent text-xs font-extrabold text-right outline-none border-none text-slate-800 dark:text-slate-100 disabled:opacity-60"
                  placeholder=""
                />
              </div>
            </div>
          )}
          {/* Grouped DP Rincian */}
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
                      const val = dpValues[p.rincianId] ?? 0;
                      const totalRequested = val * (p.jumlahHari || 1);
                      const isUnlimited = p.isUnlimited === true || p.nilaiLimit === null;
                      const hasLimit = !isUnlimited && p.hasPagu !== false && Number(p.nilaiLimit) > 0;
                      const isUnconfigured = !isUnlimited && !hasLimit;
                      const isOverLimit = hasLimit && totalRequested > Number(p.nilaiLimit);
                      const canEditDp = ((selectedBto.status === 'DRAFT' || selectedBto.status === 'REVISION_DP') && selectedBto.employeeId === user?.id) || user?.role === 'admin';
                      return (
                        <div key={p.rincianId} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-4 py-4 bg-surface-card hover:bg-slate-100/50 dark:hover:bg-slate-800/50 transition-colors">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-bold text-slate-900 dark:text-slate-200">{p.rincianLabel}</p>
                              {isOverLimit && (
                                <span className="inline-flex px-1.5 py-0.5 rounded-md text-[9px] font-extrabold bg-rose-100 dark:bg-rose-950/80 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-900/45">
                                  Melebihi Limit
                                </span>
                              )}
                              {isUnconfigured && (
                                <span className="inline-flex px-1.5 py-0.5 rounded-md text-[9px] font-extrabold bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60">
                                  Belum Disetel
                                </span>
                              )}
                            </div>
                            <span className="text-[11px] text-slate-400 block leading-normal">
                              {hasLimit && <>Pagu Limit: <span className="font-semibold">{p.useDollar ? `$${(p.nilaiPerHari || 0).toLocaleString()}` : `Rp ${(p.nilaiPerHari || 0).toLocaleString('id-ID')}`}</span> / {p.perMalam ? 'malam' : 'hari'}</>}
                              {hasLimit && (
                                <span className="block text-[10px]">Maks Total: {p.useDollar ? `$${p.nilaiLimit.toLocaleString()}` : `Rp ${p.nilaiLimit.toLocaleString('id-ID')}`}</span>
                              )}
                              {isUnlimited && (
                                <span className="block text-[10px] text-teal-500 dark:text-teal-400 font-bold">Tidak ada batas maksimal</span>
                              )}
                              {isUnconfigured && (
                                <span className="block text-[10px] text-amber-600 dark:text-amber-300 font-bold">Limit belum dikonfigurasi. Nominal kebutuhan tetap dapat disimpan.</span>
                              )}
                            </span>
                          </div>
                          <div className="flex flex-col items-end gap-1.5 shrink-0">
                            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border bg-slate-50/50 dark:bg-slate-950/80 transition-all focus-within:ring-2 focus-within:ring-offset-0 ${
                              isOverLimit ? 'border-rose-400 focus-within:ring-rose-500' : 'border-slate-200 dark:border-slate-800 focus-within:ring-teal-500'
                            }`}>
                              <span className="text-xs font-bold text-slate-400 select-none">{p.useDollar ? '$' : 'Rp'}</span>
                              <InputUang
                                value={val}
                                useDollar={p.useDollar}
                                disabled={!canEditDp}
                                onChange={newVal => setDpValues({ ...dpValues, [p.rincianId]: newVal })}
                              />
                            </div>
                            <div className="text-[10px] text-slate-500 dark:text-slate-500 font-semibold">
                              Total: {p.useDollar ? `$${totalRequested.toLocaleString()}` : `Rp ${totalRequested.toLocaleString('id-ID')}`} ({p.jumlahHari || 1} {p.perMalam ? 'malam' : 'hari'})
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Total DP */}
          {(() => {
            let totalUsd = 0, totalIdr = 0;
            paguList.forEach(p => {
              const valPerHari = dpValues[p.rincianId] ?? 0;
              const totalVal = valPerHari * (p.jumlahHari || 1);
              if (p.useDollar) { totalUsd += totalVal; totalIdr += totalVal * usdRate; }
              else totalIdr += totalVal;
            });
            return (
              <div className="rounded-2xl border border-indigo-200/60 dark:border-indigo-500/20 bg-indigo-50/40 dark:bg-indigo-500/5 p-4 space-y-2">
                <p className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest">Preview Pengajuan DP</p>
                {totalUsd > 0 && (
                  <div className="flex justify-between text-sm"><span className="text-slate-500">Total USD</span><span className="font-bold text-slate-900 dark:text-white">${totalUsd.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span></div>
                )}
                <div className="flex justify-between text-sm"><span className="text-slate-500">Total IDR</span><span className="font-bold text-teal-600 dark:text-teal-400">Rp {Math.round(totalIdr).toLocaleString('id-ID')}</span></div>
              </div>
            );
          })()}

          {(((selectedBto.status === 'DRAFT' || selectedBto.status === 'REVISION_DP') && selectedBto.employeeId === user?.id) || user?.role === 'admin') && (
            <div className="flex justify-end">
              <Button onClick={onSaveClick}>Simpan Pengajuan DP</Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
