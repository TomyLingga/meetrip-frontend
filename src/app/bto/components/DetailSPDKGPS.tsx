import React, { useEffect, useState } from 'react';
import { AlertTriangle, CheckCircle2, Loader2, Locate, MapPin, Navigation, ShieldCheck, Upload } from 'lucide-react';
import DragDropUpload from '@/components/form/DragDropUpload';

export default function DetailSPDKGPS({
  selectedBto,
  user,
  gpsError,
  gpsLoading,
  setGpsLoading,
  handleGPSCheckIn,
  apiFetch,
  showAlert,
  confirm,
  setSelectedBto,
  loadBtos,
  uploading,
  handleUploadReport,
  setReportFile,
  reportFile
}: any) {
  const [radiusMeter, setRadiusMeter] = useState(500);
  const canAttend = selectedBto.status === 'ACTIVE';
  const isOwner = selectedBto.employeeId === user?.id;
  const isAdmin = user?.role?.split?.(',').some((r: string) => ['admin', 'super_admin'].includes(r));
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${selectedBto.tujuanLat},${selectedBto.tujuanLng}`;

  useEffect(() => {
    let alive = true;
    apiFetch('/api/spdk/attend-config')
      .then((res: any) => {
        if (alive && res?.radiusMeter) setRadiusMeter(Number(res.radiusMeter));
      })
      .catch(() => undefined);
    return () => {
      alive = false;
    };
  }, [apiFetch]);

  return (
    <div className="space-y-4">
      {/* GPS Attend */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800 bg-surface-card shadow-neu-sm">
        <div className="border-b border-slate-100 dark:border-slate-800 bg-surface-sunken/60 p-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-teal-600 dark:text-teal-400">
                <Locate className="h-7 w-7" />
              </div>
              <div>
                <p className="text-base font-black text-slate-900 dark:text-white">Absen Kedatangan</p>
                <p className="mt-1 max-w-xl text-xs font-medium leading-relaxed text-slate-500 dark:text-slate-400">
                  Aktifkan GPS perangkat Anda. Sistem akan membandingkan posisi saat ini dengan titik tujuan dinas.
                </p>
              </div>
            </div>
            <span className={`inline-flex w-fit items-center gap-1.5 rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-wider ${
              canAttend
                ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400'
                : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
            }`}>
              <CheckCircle2 className="h-3.5 w-3.5" />
              {canAttend ? 'Siap Absen' : 'Menunggu SPDK Aktif'}
            </span>
          </div>
        </div>

        <div className="space-y-4 p-5">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-900/40">
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Radius Absen</p>
              <p className="mt-1 text-lg font-black text-slate-900 dark:text-white">{Number(radiusMeter).toLocaleString('id-ID')} m</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-900/40">
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Tujuan</p>
              <p className="mt-1 truncate text-sm font-bold text-slate-800 dark:text-slate-200">{selectedBto.tujuanNama}</p>
              <p className="mt-0.5 text-[10px] font-semibold text-slate-400">
                {Number(selectedBto.tujuanLat).toFixed(6)}, {Number(selectedBto.tujuanLng).toFixed(6)}
              </p>
            </div>
            <a
              href={mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-xl border border-slate-200 bg-slate-50 p-3 transition-colors hover:border-teal-300 hover:bg-teal-50/50 dark:border-slate-800 dark:bg-slate-900/40 dark:hover:border-teal-800 dark:hover:bg-teal-950/20"
            >
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Peta Tujuan</p>
              <p className="mt-1 inline-flex items-center gap-1.5 text-sm font-bold text-teal-600 dark:text-teal-400">
                <MapPin className="h-4 w-4" />
                Buka Maps
              </p>
            </a>
          </div>

          <div className="rounded-xl border border-teal-200/70 bg-teal-50/50 p-3 text-xs font-semibold leading-relaxed text-teal-800 dark:border-teal-500/20 dark:bg-teal-500/10 dark:text-teal-300">
            Pastikan Anda sudah berada di lokasi dinas. Absen akan diterima jika posisi perangkat berada dalam radius yang dikonfigurasi dari titik tujuan.
          </div>

          {gpsError && (
            <div className="flex items-start gap-2 rounded-xl border border-red-200/60 bg-red-50 p-3 text-xs font-semibold text-red-600 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-400">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{gpsError}</span>
            </div>
          )}

          <div className="flex flex-col gap-2 sm:flex-row">
            <button
              onClick={handleGPSCheckIn}
              disabled={gpsLoading || !canAttend || !isOwner}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-teal-600 px-5 py-2.5 text-xs font-black text-white transition-colors hover:bg-teal-700 disabled:cursor-not-allowed disabled:bg-slate-300 dark:disabled:bg-slate-800"
            >
              {gpsLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Navigation className="h-4 w-4" />}
              {gpsLoading ? 'Membaca Lokasi...' : canAttend ? 'Absen Sekarang' : 'Belum Bisa Absen'}
            </button>

            {isAdmin && selectedBto.status === 'ACTIVE' && (
              <button
                onClick={async () => {
                  if (!await confirm('Override absen untuk karyawan ini? Sistem akan memakai koordinat tujuan sebagai lokasi absen.')) return;
                  try {
                    setGpsLoading(true);
                    await apiFetch(`/api/spdk/bto/${selectedBto.id}/attend`, {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ latitude: Number(selectedBto.tujuanLat), longitude: Number(selectedBto.tujuanLng), isAdminOverride: true })
                    });
                    showAlert('Override absen berhasil.', 'success');
                    setSelectedBto(null);
                    loadBtos();
                  } catch (err: any) {
                    showAlert(err.message || 'Gagal override absen', 'error');
                  } finally {
                    setGpsLoading(false);
                  }
                }}
                disabled={gpsLoading}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-5 py-2.5 text-xs font-black text-rose-700 transition-colors hover:bg-rose-100 disabled:opacity-50 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-400 dark:hover:bg-rose-500/20"
              >
                {gpsLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
                {gpsLoading ? 'Memproses Override...' : 'Override Absen'}
              </button>
            )}
          </div>
        </div>
      </div>


    </div>
  );
}
