'use client';

import React, { useEffect, useState } from 'react';
import PageTemplate from '@/components/layout/PageTemplate';
import Button from '@/components/ui/Button';
import { apiFetch } from '@/utils/api';
import { MapPin, RefreshCw, Save } from 'lucide-react';
import { useAlert } from '@/context/FeedbackContext';

export default function AttendRadiusConfigPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [attendRadiusMeter, setAttendRadiusMeter] = useState(500);
  const { showAlert } = useAlert();

  const loadConfig = async () => {
    try {
      setLoading(true);
      const systemConfigs = await apiFetch('/api/master/config-sistem').catch(() => []);
      const radiusConfig = Array.isArray(systemConfigs)
        ? systemConfigs.find((item: any) => item.kunci === 'attend_radius_meter')
        : null;
      const radius = Number(radiusConfig?.nilai || 500);
      setAttendRadiusMeter(Number.isFinite(radius) && radius > 0 ? radius : 500);
    } catch (err) {
      console.error(err);
      showAlert('Gagal memuat konfigurasi radius absen.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadConfig();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const radius = Math.round(Number(attendRadiusMeter));
    if (!Number.isFinite(radius) || radius < 1) {
      showAlert('Radius absen wajib lebih dari 0 meter.', 'error');
      return;
    }

    try {
      setSaving(true);
      await apiFetch('/api/master/config-sistem', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          key: 'attend_radius_meter',
          value: String(radius),
          label: 'Radius absen tujuan dinas (meter)',
        }),
      });
      setAttendRadiusMeter(radius);
      showAlert('Radius absen berhasil disimpan.', 'success');
      loadConfig();
    } catch (err: any) {
      showAlert(err.message || 'Gagal menyimpan radius absen.', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-300 border-t-slate-900 dark:border-slate-700 dark:border-t-white" />
      </div>
    );
  }

  return (
    <PageTemplate
      title="Radius Absen"
      sectionTitle="Konfigurasi"
      description="Atur batas jarak validasi GPS dari titik tujuan perjalanan dinas."
      headerActions={
        <Button variant="secondary" onClick={loadConfig} loading={loading} disabled={saving} className="gap-2">
          {!loading && <RefreshCw className="h-4 w-4" />}
          Refresh
        </Button>
      }
    >
      <div className="w-full md:max-w-xl">
        <form onSubmit={handleSubmit} className="glass-panel space-y-5 rounded-[24px] p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-teal-600 dark:text-teal-400">
              <MapPin className="h-7 w-7" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-850 dark:text-white">Radius dari Titik Tujuan</h3>
              <p className="mt-1 text-xs font-semibold leading-relaxed text-slate-500 dark:text-slate-400">
                Batas maksimum jarak GPS user dari koordinat tujuan saat melakukan absen dinas.
              </p>
            </div>
          </div>

          <div>
            <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-450">
              Radius Absen
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min={1}
                step={1}
                value={attendRadiusMeter}
                onChange={e => setAttendRadiusMeter(Number(e.target.value))}
                className="input-field w-full"
              />
              <span className="shrink-0 rounded-lg border border-slate-200 bg-surface-sunken px-3 py-2 text-xs font-bold text-slate-500 dark:border-slate-800 dark:text-slate-400">
                meter
              </span>
            </div>
          </div>

          <Button type="submit" className="w-full" loading={saving} loadingLabel="Menyimpan..." disabled={saving}>
            <Save className="h-4 w-4" />
            <span>Simpan Radius Absen</span>
          </Button>
        </form>
      </div>

    </PageTemplate>
  );
}
