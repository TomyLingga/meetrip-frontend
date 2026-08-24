'use client';

import React, { useEffect, useState } from 'react';
import PageTemplate from '@/components/layout/PageTemplate';
import Button from '@/components/ui/Button';
import CustomSelect from '@/components/form/CustomSelect';
import UserSearchDropdown, { PortalUser } from '@/components/form/UserSearchDropdown';
import { apiFetch } from '@/utils/api';
import { Save } from 'lucide-react';
import { useAlert } from '@/context/FeedbackContext';


export default function KonfigurasiPemberiTugasPage() {
  const [loading, setLoading] = useState(true);
  const [ptConfig, setPtConfig] = useState({
    mode: 'grade_based',
    fixedEmployeeId: '',
    minGradeLevel: 5,
    keterangan: '',
  });

  const [selectedPtUser, setSelectedPtUser] = useState<PortalUser | null>(null);
  const [saving, setSaving] = useState(false);
  const { showAlert } = useAlert();

  useEffect(() => {
    loadConfigs();
  }, []);

  const loadConfigs = async () => {
    try {
      setLoading(true);
      const ptData = await apiFetch('/api/config/pemberi-tugas');
      const employees = await apiFetch('/api/portal/users?limit=500') || [];

      if (ptData) {
        setPtConfig(ptData);
        if (ptData.mode === 'fixed_person' && ptData.fixedEmployeeId) {
          const emp = employees.find((e: any) => e.portalUserId === ptData.fixedEmployeeId);
          if (emp) setSelectedPtUser(emp);
        } else {
          setSelectedPtUser(null);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handlePtSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      await apiFetch('/api/config/pemberi-tugas', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(ptConfig)
      });
      showAlert('Konfigurasi Ketentuan Pemberi Tugas berhasil disimpan!', 'success');
      loadConfigs();
    } catch (err: any) {
      showAlert(err.message || 'Gagal menyimpan konfigurasi', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="h-[50vh] flex items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-300 border-t-slate-900 dark:border-slate-700 dark:border-t-white" />
      </div>
    );
  }

  return (
    <PageTemplate
        title="Konfigurasi Pemberi Tugas"
        sectionTitle="Konfigurasi"
        description="Kelola alur penentuan atasan pemberi tugas dinas karyawan berdasarkan hirarki grade level atau personil tetap."
      >
        <div className="w-full md:max-w-xl animate-in fade-in slide-in-from-bottom-4 duration-300">
          <div className="glass-panel p-6 space-y-4 rounded-[24px]">
            <form onSubmit={handlePtSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Mode Penentuan</label>
                <CustomSelect
                  value={ptConfig.mode}
                  onChange={(val) => {
                    setPtConfig({ ...ptConfig, mode: val, fixedEmployeeId: '' });
                    setSelectedPtUser(null);
                  }}
                  options={[
                    { value: 'grade_based', label: 'Berdasarkan Grade Level (Hirarki)' },
                    { value: 'fixed_person', label: 'Spesifik 1 Orang Karyawan' },
                  ]}
                />
              </div>

              {ptConfig.mode === 'grade_based' ? (
                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Min. Grade Level Lebih Tinggi</label>
                  <input
                    type="number"
                    value={ptConfig.minGradeLevel}
                    onChange={e => setPtConfig({ ...ptConfig, minGradeLevel: Number(e.target.value) })}
                    className="input-field w-full"
                  />
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Pilih Pemberi Tugas</label>
                  <UserSearchDropdown
                    value={selectedPtUser}
                    onChange={u => {
                      setSelectedPtUser(u);
                      setPtConfig({ ...ptConfig, fixedEmployeeId: u?.portalUserId || '' });
                    }}
                    placeholder="Cari nama karyawan..."
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Catatan Ketentuan</label>
                <input
                  type="text"
                  value={ptConfig.keterangan || ''}
                  onChange={e => setPtConfig({ ...ptConfig, keterangan: e.target.value })}
                  className="input-field w-full"
                  placeholder="Opsional, misal: Berlaku untuk seluruh divisi"
                />
              </div>

              <Button type="submit" className="w-full" loading={saving} disabled={saving}>
                <Save className="w-4 h-4" />
                <span>{saving ? 'Menyimpan...' : 'Simpan Ketentuan PT'}</span>
              </Button>
            </form>
          </div>
        </div>

    </PageTemplate>
  );
}
