'use client';

import React from 'react';
import { MapPin, CheckCircle2, Navigation, Building2 } from 'lucide-react';
import { Map, Marker } from 'pigeon-maps';
import Input from './Input';

interface DestinasiPerjalananGroupProps {
  tujuanNama: string;
  onTujuanNamaChange: (val: string) => void;
  tujuanLat: number | null;
  tujuanLng: number | null;
  onMapPickerOpen: () => void;
  jarakKm: number | null;
  onJarakKmChange: (val: number | null) => void;
  wilayahTipe: string;
  onWilayahTipeChange: (val: string) => void;
  penempatanNama?: string;
  errorTujuanNama?: string;
  errorWilayahTipe?: boolean;
  errorTujuanLat?: string;
}

const googleRoadProvider = (x: number, y: number, z: number) =>
  `https://mt1.google.com/vt/lyrs=m&x=${x}&y=${y}&z=${z}`;

const WILAYAH_INFO: Record<string, { label: string; desc: string; color: string }> = {
  dalam_wilayah: {
    label: 'Dalam Wilayah',
    desc: 'Masih satu provinsi dengan lokasi penempatan',
    color: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20',
  },
  luar_wilayah: {
    label: 'Luar Wilayah',
    desc: 'Beda provinsi dengan lokasi penempatan (masih Indonesia)',
    color: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20',
  },
  luar_negeri: {
    label: 'Luar Negeri',
    desc: 'Tujuan berada di luar Indonesia',
    color: 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-500/10 dark:text-indigo-400 dark:border-indigo-500/20',
  },
};

export default function DestinasiPerjalananGroup({
  tujuanNama,
  onTujuanNamaChange,
  tujuanLat,
  tujuanLng,
  onMapPickerOpen,
  jarakKm,
  wilayahTipe,
  penempatanNama,
  errorTujuanNama,
  errorWilayahTipe,
  errorTujuanLat,
}: DestinasiPerjalananGroupProps) {
  const hasSelectedLocation = tujuanLat != null && tujuanLng != null;
  const wilayahInfo = wilayahTipe ? WILAYAH_INFO[wilayahTipe] : null;
  const previewCenter: [number, number] = hasSelectedLocation
    ? [Number(tujuanLat), Number(tujuanLng)]
    : [-6.2, 106.8166];

  return (
    <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 dark:bg-slate-950 space-y-4">
      <p className="text-xs font-bold text-teal-600 dark:text-teal-400 uppercase tracking-wider">Destinasi Perjalanan</p>

      {/* Nama Lokasi / Tujuan */}
      <Input
        label="Nama Lokasi / Tujuan"
        requiredStar
        placeholder="Contoh: Kantor Cabang Medan"
        value={tujuanNama}
        onChange={e => onTujuanNamaChange(e.target.value)}
        error={errorTujuanNama}
        required
      />

      {/* Pin Peta — Preview + Koordinat */}
      <div className="space-y-1.5">
        <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
          Titik Lokasi (PIN Maps) <span className="text-rose-500">*</span>
        </label>

        <button
          type="button"
          onClick={onMapPickerOpen}
          className={`group relative block w-full overflow-hidden rounded-xl border transition-colors ${
            errorTujuanLat
              ? 'border-rose-400'
              : 'border-slate-200 dark:border-slate-800 hover:border-teal-400 dark:hover:border-teal-600'
          }`}
        >
          {hasSelectedLocation ? (
            <div className="relative h-32 w-full pointer-events-none">
              <Map height={128} center={previewCenter} zoom={13} provider={googleRoadProvider}>
                <Marker width={30} anchor={previewCenter} color="#ef4444" />
              </Map>
            </div>
          ) : (
            <div className="flex h-32 w-full flex-col items-center justify-center gap-1.5 bg-surface-sunken/60 text-slate-400 dark:text-slate-500">
              <MapPin className="h-6 w-6" />
              <span className="text-[11px] font-semibold">Belum ada titik lokasi dipilih</span>
            </div>
          )}

          <div className="absolute inset-0 flex items-end justify-between bg-gradient-to-t from-black/60 via-black/0 to-black/0 p-2.5 opacity-0 transition-opacity group-hover:opacity-100">
            <span className="text-[11px] font-bold text-white">Klik untuk pilih / ubah titik lokasi</span>
          </div>

          <div className="flex items-center justify-between gap-2 border-t border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/80 px-3 py-2">
            <div className="flex items-center gap-1.5 min-w-0">
              <Navigation className="h-3.5 w-3.5 text-teal-600 shrink-0" />
              <span className="truncate text-[11px] font-bold text-slate-700 dark:text-slate-300">
                {hasSelectedLocation ? `${Number(tujuanLat).toFixed(6)}, ${Number(tujuanLng).toFixed(6)}` : 'Lokasi belum dipilih'}
              </span>
            </div>
            <span className="shrink-0 text-[10px] font-bold text-teal-600 dark:text-teal-400 group-hover:underline">
              {hasSelectedLocation ? 'Ubah Titik' : 'Pilih di Peta'}
            </span>
          </div>
        </button>
        {errorTujuanLat && (
          <p className="text-[10px] text-rose-500 font-semibold mt-0.5">{errorTujuanLat}</p>
        )}
      </div>

      {/* Jarak Perjalanan (KM) — Read-only, dihitung otomatis dari lokasi penempatan */}
      {hasSelectedLocation && (
        <Input
          label="Jarak Perjalanan (KM)"
          readOnly
          value={jarakKm !== null ? `${jarakKm.toLocaleString('id-ID', { maximumFractionDigits: 2 })} km` : 'Menghitung...'}
          className="bg-slate-100/50 dark:bg-slate-900/50 cursor-not-allowed font-semibold text-slate-800 dark:text-slate-100"
        />
      )}

      {/* Wilayah Tujuan — Auto-detected Read-only Badge */}
      {hasSelectedLocation && (
        <div className="space-y-1">
          <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            Wilayah Tujuan <span className="text-rose-500">*</span>
          </label>
          {wilayahInfo ? (
            <div className={`flex items-start gap-2 px-3.5 py-2.5 rounded-xl border text-xs font-bold ${wilayahInfo.color}`}>
              <CheckCircle2 className="w-3.5 h-3.5 shrink-0 mt-0.5" />
              <div className="min-w-0 flex-1">
                <p>{wilayahInfo.label}</p>
                <p className="mt-0.5 text-[10px] font-semibold opacity-75">{wilayahInfo.desc}</p>
                {penempatanNama && (
                  <p className="mt-1.5 flex items-center gap-1 text-[10px] font-semibold opacity-75">
                    <Building2 className="h-3 w-3 shrink-0" />
                    Acuan penempatan: {penempatanNama}
                  </p>
                )}
              </div>
              <span className="shrink-0 text-[9px] font-medium opacity-60 whitespace-nowrap">Otomatis</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 text-xs text-slate-400 italic animate-pulse">
              <span>Mendeteksi wilayah...</span>
            </div>
          )}
          {errorWilayahTipe && (
            <p className="text-[10px] text-rose-500 font-semibold mt-0.5">Wilayah tujuan wajib terdeteksi dari peta</p>
          )}
        </div>
      )}
    </div>
  );
}
