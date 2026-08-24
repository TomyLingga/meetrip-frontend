'use client';

import React, { useEffect, useState } from 'react';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import SearchSelect from '@/components/form/SearchSelect';
import DateTimePicker from '@/components/form/DateTimePicker';
import BarangInput from '@/components/form/BarangInput';
import DragDropUpload from '@/components/form/DragDropUpload';
import { apiFetch } from '@/utils/api';
import { useAlert } from '@/context/FeedbackContext';
import { todayStartInputValue, toLocalDateTimeInputValue } from '@/utils/dateInput';
import { FileText, MapPin } from 'lucide-react';

import DetailPanjar from './DetailPanjar';

interface EditBtoModalProps {
  btoItem: any | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  user?: any;
}

const defaultTransports = [
  { id: '0b6f1b8d-85d2-41e9-a443-2845a428f391', tipe: 'perusahaan', label: 'Transportasi Perusahaan' },
  { id: '8e0c0b8e-4ce6-478b-9db2-98b5228b6f4c', tipe: 'publik', label: 'Transportasi Publik' },
  { id: 'cdd7f9b2-fc99-4cd8-b0d7-0fe5f17a5b1f', tipe: 'pesawat', label: 'Pesawat' },
];

const parseMinutesToDetailedTime = (totalMinutes: number) => {
  if (!totalMinutes || totalMinutes <= 0) return '';
  const minutesInHour = 60;
  const minutesInDay = 24 * 60;
  const minutesInMonth = 30 * 24 * 60;

  let temp = totalMinutes;
  const months = Math.floor(temp / minutesInMonth);
  temp %= minutesInMonth;
  const days = Math.floor(temp / minutesInDay);
  temp %= minutesInDay;
  const hours = Math.floor(temp / minutesInHour);
  const minutes = temp % minutesInHour;

  const parts = [];
  if (months > 0) parts.push(`${months} Bulan`);
  if (days > 0) parts.push(`${days} Hari`);
  if (hours > 0) parts.push(`${hours} Jam`);
  if (minutes > 0) parts.push(`${minutes} Menit`);

  return parts.join(' ');
};

export default function EditBtoModal({ btoItem, isOpen, onClose, onSuccess, user }: EditBtoModalProps) {
  const { showAlert } = useAlert();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [transports, setTransports] = useState<any[]>(defaultTransports);
  const [pemberiTugasOptions, setPemberiTugasOptions] = useState<any[]>([]);

  const [formData, setFormData] = useState({
    tujuanNama: '',
    tujuanAlamat: '',
    transportId: '',
    estBerangkat: '',
    estKembali: '',
    estimasiWaktuMenit: 0,
    pemberiTugasId: '',
    pemberiTugasNama: '',
    barang: '',
    kepentingan: '',
  });

  const [isButuhDp, setIsButuhDp] = useState(false);
  const [paguList, setPaguList] = useState<any[]>([]);
  const [dpValues, setDpValues] = useState<Record<string, number>>({});
  const [usdRate, setUsdRate] = useState(15500);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [existingLampiranNama, setExistingLampiranNama] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (isOpen && btoItem) {
      loadMasterData();
      loadBtoDetails(btoItem.id);
    }
  }, [isOpen, btoItem]);

  const loadMasterData = async () => {
    try {
      const resT = await apiFetch('/api/master/ref-transport').catch(() => null);
      if (resT && Array.isArray(resT) && resT.length > 0) {
        setTransports(resT.map((t: any) => ({ ...t, label: t.nama || t.label || t.tipe })));
      }
    } catch (err) {
      console.error('Failed to load transport master', err);
    }
  };

  const loadBtoDetails = async (id: string) => {
    setLoading(true);
    try {
      const btoDetail = await apiFetch(`/api/bto/${id}`);
      const ptRes = await apiFetch(`/api/bto/${id}/pemberi-tugas-options`).catch(() => null);
      let optionsList: any[] = [];
      if (Array.isArray(ptRes)) {
        optionsList = ptRes;
      } else if (ptRes && Array.isArray(ptRes.options)) {
        optionsList = ptRes.options;
      }

      let resolvedPtId = btoDetail.pemberiTugasId || '';
      if (btoDetail.pemberiTugasId) {
        const found = optionsList.find(
          (o: any) =>
            String(o.id) === String(btoDetail.pemberiTugasId) ||
            String(o.employeeId) === String(btoDetail.pemberiTugasId) ||
            String(o.portalUserId) === String(btoDetail.pemberiTugasId)
        );
        if (found) {
          resolvedPtId = String(found.id || found.portalUserId || found.employeeId || btoDetail.pemberiTugasId);
        } else {
          optionsList.unshift({
            id: btoDetail.pemberiTugasId,
            employeeId: btoDetail.pemberiTugasId,
            namaLengkap: btoDetail.pemberiTugasNama || 'Pemberi Tugas saat ini',
          });
          resolvedPtId = String(btoDetail.pemberiTugasId);
        }
      }

      setPemberiTugasOptions(optionsList);

      setFormData({
        tujuanNama: btoDetail.tujuanNama || '',
        tujuanAlamat: btoDetail.tujuanAlamat || '',
        transportId: btoDetail.transportId || '',
        estBerangkat: btoDetail.estBerangkat ? toLocalDateTimeInputValue(new Date(btoDetail.estBerangkat)) : '',
        estKembali: btoDetail.estKembali ? toLocalDateTimeInputValue(new Date(btoDetail.estKembali)) : '',
        estimasiWaktuMenit: btoDetail.estimasiWaktuMenit || 0,
        pemberiTugasId: resolvedPtId,
        pemberiTugasNama: btoDetail.pemberiTugasNama || '',
        barang: btoDetail.barang || '',
        kepentingan: btoDetail.kepentingan || '',
      });
      setExistingLampiranNama(btoDetail.lampiranNama || null);
      setSelectedFile(null);
      setIsButuhDp(Boolean(btoDetail.isButuhDp));

      // Load DP data & calculate pagu
      const dpData = await apiFetch(`/api/dp/bto/${id}`).catch(() => null);
      const savedDp: Record<string, number> = {};
      if (dpData && dpData.rincian) {
        dpData.rincian.forEach((r: any) => {
          savedDp[r.rincianId] = Number(r.nilaiPerHari ?? 0);
        });
        if (dpData.exchangeRateUsd) setUsdRate(Number(dpData.exchangeRateUsd));
      }
      setDpValues(savedDp);

      let fetchedPagu: any[] = [];
      if (btoDetail.estBerangkat && btoDetail.estKembali) {
        const paguRes = await apiFetch('/api/bto/hitung-pagu', {
          method: 'POST',
          body: JSON.stringify({
            estBerangkat: btoDetail.estBerangkat,
            estKembali: btoDetail.estKembali,
            wilayahTipe: btoDetail.wilayahTipe,
            btoId: id,
          }),
        }).catch(() => null);
        if (paguRes && Array.isArray(paguRes.paguList)) {
          fetchedPagu = paguRes.paguList;
        }
      }
      setPaguList(fetchedPagu);
      setErrors({});
    } catch (err: any) {
      showAlert(err.message || 'Gagal memuat detail data dinas', 'error');
    } finally {
      setLoading(false);
    }
  };

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!formData.tujuanNama) errs.tujuanNama = 'Tujuan perjalanan wajib diisi';
    if (!formData.transportId) errs.transportId = 'Transportasi wajib dipilih';
    if (!formData.estBerangkat) errs.estBerangkat = 'Estimasi keberangkatan wajib diisi';
    if (!formData.estKembali) errs.estKembali = 'Estimasi kepulangan wajib diisi';
    if (!formData.pemberiTugasId) errs.pemberiTugasId = 'Pemberi Tugas wajib dipilih';
    if (!formData.estimasiWaktuMenit || formData.estimasiWaktuMenit <= 0) {
      errs.estimasiWaktuMenit = 'Estimasi waktu perjalanan wajib diisi';
    }
    if (!formData.barang) errs.barang = 'Barang yang dibawa wajib diisi';
    if (!formData.kepentingan) errs.kepentingan = 'Kepentingan wajib diisi';

    if (formData.estBerangkat && formData.estKembali) {
      if (new Date(formData.estKembali) <= new Date(formData.estBerangkat)) {
        errs.estKembali = 'Estimasi kembali harus lebih setelah waktu berangkat';
      }
    }

    // Hanya periksa rincian panjar jika centang "Membutuhkan Panjar" diaktifkan
    if (isButuhDp && paguList.length > 0) {
      const totalRequestedDp = paguList.reduce((sum, p) => {
        const valPerHari = dpValues[p.rincianId] ?? 0;
        return sum + (valPerHari * (p.jumlahHari || 1));
      }, 0);
      if (totalRequestedDp === 0) {
        showAlert('Anda memilih membutuhkan panjar, namun semua rincian diisi 0. Harap isi nominal panjar atau hilangkan centang Panjar.', 'warning');
        errs.dp = 'Nominal panjar wajib diisi jika membutuhkan panjar';
      }
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate() || !btoItem) return;

    setSaving(true);
    try {
      const payload = {
        tujuanNama: formData.tujuanNama,
        tujuanAlamat: formData.tujuanAlamat || undefined,
        transportId: formData.transportId || undefined,
        estBerangkat: formData.estBerangkat ? new Date(formData.estBerangkat).toISOString() : undefined,
        estKembali: formData.estKembali ? new Date(formData.estKembali).toISOString() : undefined,
        estimasiWaktuMenit: formData.estimasiWaktuMenit ? Number(formData.estimasiWaktuMenit) : undefined,
        pemberiTugasId: formData.pemberiTugasId || undefined,
        pemberiTugasNama: formData.pemberiTugasNama || undefined,
        barang: formData.barang || undefined,
        kepentingan: formData.kepentingan,
        isButuhDp: isButuhDp,
      };

      await apiFetch(`/api/bto/${btoItem.id}`, {
        method: 'PUT',
        body: JSON.stringify(payload),
      });

      if (isButuhDp && paguList.length > 0) {
        const rincianPayload = paguList.map((p: any) => {
          const valPerHari = dpValues[p.rincianId] ?? 0;
          return {
            rincianId: p.rincianId,
            rincianLabel: p.rincianLabel,
            kategori: p.kategori,
            jumlahHari: p.jumlahHari || 1,
            nilaiPerHari: valPerHari,
            nilaiTotal: valPerHari * (p.jumlahHari || 1),
            useDollar: Boolean(p.useDollar),
            nilaiUsd: p.useDollar ? valPerHari * (p.jumlahHari || 1) : undefined,
            paguSaatInput: p.nominalPaguMax || 0,
            isUnlimited: Boolean(p.isUnlimited),
          };
        });

        await apiFetch(`/api/dp/bto/${btoItem.id}`, {
          method: 'POST',
          body: JSON.stringify({
            exchangeRateUsd: usdRate,
            rincian: rincianPayload,
          }),
        });
      }

      if (selectedFile) {
        const fileData = new FormData();
        fileData.append('lampiran', selectedFile);
        await apiFetch(`/api/bto/${btoItem.id}/lampiran`, {
          method: 'POST',
          body: fileData,
        });
      }

      showAlert('Data perjalanan dinas berhasil diperbarui', 'success');
      onSuccess();
    } catch (err: any) {
      showAlert(err.message || 'Gagal menyelaraskan perubahan data dinas', 'error');
    } finally {
      setSaving(false);
    }
  };

  const pemberiTugasSelectOptions = pemberiTugasOptions.map(o => ({
    value: String(o.id || o.portalUserId || o.employeeId || ''),
    label: o.namaLengkap || o.nama || '',
    subLabel: o.gradeKode ? `Grade ${o.gradeKode}` : o.gradeLevel ? `Level ${o.gradeLevel}` : ''
  }));

  const transportSelectOptions = transports.map(o => ({
    value: o.id,
    label: o.label || o.nama || '',
    subLabel: (o.tipe || '').replace(/_/g, ' ')
  }));

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Edit Data Perjalanan Dinas (Admin)"
      widthClassName="max-w-3xl"
    >
      {loading ? (
        <div className="py-12 flex flex-col items-center justify-center space-y-3">
          <div className="w-8 h-8 border-4 border-teal-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs font-semibold text-slate-500">Memuat data dinas...</p>
        </div>
      ) : (
        <form noValidate onSubmit={handleSubmit} className="space-y-4 pt-2">
          {/* Destinasi Perjalanan */}
          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30 space-y-3">
            <p className="text-xs font-bold text-teal-600 dark:text-teal-400 uppercase tracking-wider flex items-center gap-1.5">
              <MapPin className="w-4 h-4" /> Destinasi Perjalanan
            </p>
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Nama Lokasi / Instansi Tujuan <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.tujuanNama}
                onChange={e => setFormData({ ...formData, tujuanNama: e.target.value })}
                placeholder="Contoh: Kantor Direksi PTPN I, Jakarta"
                className={`input-field w-full ${errors.tujuanNama ? 'border-red-500' : ''}`}
                required
              />
              {errors.tujuanNama && <p className="text-[10px] text-red-500">{errors.tujuanNama}</p>}
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Alamat Lengkap Tujuan
              </label>
              <input
                type="text"
                value={formData.tujuanAlamat}
                onChange={e => setFormData({ ...formData, tujuanAlamat: e.target.value })}
                placeholder="Jalan, Kota, Provinsi..."
                className="input-field w-full"
              />
            </div>
          </div>

          {/* Detail Perjalanan Dinas */}
          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/20 dark:bg-slate-950/20 space-y-4">
            <p className="text-xs font-bold text-teal-600 dark:text-teal-400 uppercase tracking-wider">Detail Perjalanan Dinas</p>

            {/* Transportasi */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Transportasi <span className="text-red-500">*</span>
              </label>
              <SearchSelect
                options={transportSelectOptions}
                value={formData.transportId}
                onChange={val => setFormData({ ...formData, transportId: val })}
                placeholder="Cari & pilih Transportasi..."
              />
              {errors.transportId && <p className="text-[10px] text-red-500">{errors.transportId}</p>}
            </div>

            {/* Estimasi Berangkat & Kembali */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Estimasi Berangkat <span className="text-red-500">*</span>
                </label>
                <DateTimePicker
                  value={formData.estBerangkat}
                  onChange={val => setFormData({ ...formData, estBerangkat: val })}
                  placeholder="Pilih keberangkatan..."
                  min={todayStartInputValue()}
                  error={!!errors.estBerangkat}
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Estimasi Kembali <span className="text-red-500">*</span>
                </label>
                <DateTimePicker
                  value={formData.estKembali}
                  onChange={val => setFormData({ ...formData, estKembali: val })}
                  placeholder="Pilih kepulangan..."
                  min={formData.estBerangkat || todayStartInputValue()}
                  error={!!errors.estKembali}
                />
              </div>
            </div>

            {/* Pemberi Tugas */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Pemberi Tugas <span className="text-red-500">*</span>
              </label>
              <SearchSelect
                options={pemberiTugasSelectOptions}
                value={formData.pemberiTugasId}
                onChange={val => {
                  const found = pemberiTugasOptions.find(o => (o.id || o.portalUserId) === val);
                  setFormData({
                    ...formData,
                    pemberiTugasId: val,
                    pemberiTugasNama: found ? (found.namaLengkap || found.nama) : formData.pemberiTugasNama
                  });
                }}
                placeholder="Cari & pilih Pemberi Tugas..."
              />
              {errors.pemberiTugasId && <p className="text-[10px] text-red-500">{errors.pemberiTugasId}</p>}
            </div>

            {/* Estimasi Durasi */}
            <div className="bg-surface-card/40 p-3.5 rounded-xl border border-slate-200/50 dark:border-slate-800/40 space-y-2">
              <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Estimasi Waktu Perjalanan (Hari / Jam / Menit)
              </label>
              <div className="flex gap-2">
                <div className="flex-1 flex items-center gap-1.5 bg-surface-sunken border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2">
                  <input
                    type="number" min={0} placeholder="Hari"
                    value={Math.floor((formData.estimasiWaktuMenit || 0) / (24 * 60)) || ''}
                    onChange={e => {
                      const d = Number(e.target.value);
                      const h = Math.floor(((formData.estimasiWaktuMenit || 0) % (24 * 60)) / 60);
                      const m = (formData.estimasiWaktuMenit || 0) % 60;
                      setFormData({ ...formData, estimasiWaktuMenit: d * 24 * 60 + h * 60 + m });
                    }}
                    className="w-full bg-transparent text-xs font-bold text-center outline-none border-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                  <span className="text-[10px] font-bold text-slate-400">h</span>
                </div>
                <div className="flex-1 flex items-center gap-1.5 bg-surface-sunken border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2">
                  <input
                    type="number" min={0} max={23} placeholder="Jam"
                    value={Math.floor(((formData.estimasiWaktuMenit || 0) % (24 * 60)) / 60) || ''}
                    onChange={e => {
                      const d = Math.floor((formData.estimasiWaktuMenit || 0) / (24 * 60));
                      const h = Number(e.target.value);
                      const m = (formData.estimasiWaktuMenit || 0) % 60;
                      setFormData({ ...formData, estimasiWaktuMenit: d * 24 * 60 + h * 60 + m });
                    }}
                    className="w-full bg-transparent text-xs font-bold text-center outline-none border-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                  <span className="text-[10px] font-bold text-slate-400">j</span>
                </div>
                <div className="flex-1 flex items-center gap-1.5 bg-surface-sunken border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2">
                  <input
                    type="number" min={0} max={59} placeholder="Menit"
                    value={(formData.estimasiWaktuMenit || 0) % 60 || ''}
                    onChange={e => {
                      const d = Math.floor((formData.estimasiWaktuMenit || 0) / (24 * 60));
                      const h = Math.floor(((formData.estimasiWaktuMenit || 0) % (24 * 60)) / 60);
                      const m = Number(e.target.value);
                      setFormData({ ...formData, estimasiWaktuMenit: d * 24 * 60 + h * 60 + m });
                    }}
                    className="w-full bg-transparent text-xs font-bold text-center outline-none border-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                  <span className="text-[10px] font-bold text-slate-400">m</span>
                </div>
              </div>
              {formData.estimasiWaktuMenit > 0 && (
                <div className="flex flex-wrap gap-x-4 gap-y-2 pt-2 border-t border-slate-100 dark:border-slate-800/60 mt-1.5">
                  <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                    <span>Konversi Waktu:</span>
                    <span className="bg-teal-500/10 text-teal-600 dark:bg-teal-500/20 dark:text-teal-400 px-2 py-0.5 rounded text-[11px] font-bold">
                      {parseMinutesToDetailedTime(formData.estimasiWaktuMenit)}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Barang yang Dibawa */}
            <BarangInput
              value={formData.barang || ''}
              onChange={val => setFormData({ ...formData, barang: val })}
              error={errors.barang}
              required={true}
            />

            {/* Kepentingan */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-teal-600 dark:text-teal-400 shrink-0" />
                Kepentingan / Maksud Perjalanan Dinas <span className="text-red-500">*</span>
              </label>
              <textarea
                required
                rows={2}
                placeholder="Contoh: Rapat koordinasi evaluasi bulanan..."
                value={formData.kepentingan}
                onChange={e => setFormData({ ...formData, kepentingan: e.target.value })}
                className={`input-field w-full resize-none rounded-xl border bg-slate-50/50 dark:bg-slate-950/80 p-3 text-xs leading-relaxed transition-all focus:bg-white dark:focus:bg-slate-950 ${
                  errors.kepentingan ? 'border-red-500 focus:ring-red-500/20' : 'border-slate-200 dark:border-slate-800 focus:ring-teal-500/20 focus:border-teal-500'
                }`}
              />
              {errors.kepentingan && <p className="text-[10px] text-red-500 mt-1 font-medium">{errors.kepentingan}</p>}
            </div>
          </div>

          {/* Section Pengajuan Panjar (DP) */}
          <div className="p-4 rounded-xl border border-amber-200 dark:border-amber-900/50 bg-amber-50/30 dark:bg-amber-950/20 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <div>
                <label className="text-xs font-bold text-amber-800 dark:text-amber-300 uppercase tracking-wider block">
                  Pengajuan Panjar / Uang Muka (DP)
                </label>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Aktifkan jika perjalanan dinas ini membutuhkan uang muka/panjar biaya dinas.
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={isButuhDp}
                  onChange={e => setIsButuhDp(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:after:border-slate-600 peer-checked:bg-amber-500" />
              </label>
            </div>

            {isButuhDp && (
              <div className="pt-2 border-t border-amber-200/60 dark:border-amber-900/40">
                <DetailPanjar
                  selectedBto={btoItem}
                  paguList={paguList}
                  dpValues={dpValues}
                  setDpValues={setDpValues}
                  usdRate={usdRate}
                  setUsdRate={setUsdRate}
                  user={user}
                  handleSaveDp={async () => {}}
                />
              </div>
            )}
          </div>

          {/* Unggah Lampiran Dokumen */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Unggah Lampiran Dokumen Baru (Opsional)
            </label>
            <DragDropUpload
              selectedFile={selectedFile}
              onFileSelect={file => setSelectedFile(file)}
              existingFileName={existingLampiranNama}
              onClearExisting={() => setExistingLampiranNama(null)}
              accept=".pdf,image/*"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
            <Button type="button" variant="secondary" onClick={onClose} disabled={saving}>
              Batal
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? 'Menyimpan...' : 'Simpan Perubahan'}
            </Button>
          </div>
        </form>
      )}
    </Modal>
  );
}
