'use client';

import React, { useEffect, useState } from 'react';
import PageTemplate from '@/components/layout/PageTemplate';
import Button from '@/components/ui/Button';
import CustomSelect from '@/components/form/CustomSelect';
import UserSearchDropdown, { PortalUser } from '@/components/form/UserSearchDropdown';
import { apiFetch } from '@/utils/api';
import { Save } from 'lucide-react';
import { useAlert } from '@/context/FeedbackContext';


export default function KonfigurasiApproverSpdkPage() {
  const [loading, setLoading] = useState(true);
  const [spdkConfig, setSpdkConfig] = useState({
    mode: 'unit_head',
    fixedEmployeeId: '',
    keterangan: '',
  });

  const [selectedSpdkUser, setSelectedSpdkUser] = useState<PortalUser | null>(null);
  const [saving, setSaving] = useState(false);
  const { showAlert } = useAlert();

  useEffect(() => {
    loadConfigs();
  }, []);

  const loadConfigs = async () => {
    try {
      setLoading(true);
      const spdkData = await apiFetch('/api/config/approver-spdk');
      const employees = await apiFetch('/api/portal/users?limit=500') || [];

      if (spdkData) {
        setSpdkConfig(spdkData);
        if (spdkData.mode === 'fixed_person' && spdkData.fixedEmployeeId) {
          const emp = employees.find((e: any) => e.portalUserId === spdkData.fixedEmployeeId);
          if (emp) setSelectedSpdkUser(emp);
        } else {
          setSelectedSpdkUser(null);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSpdkSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      await apiFetch('/api/config/approver-spdk', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(spdkConfig)
      });
      showAlert('Konfigurasi Ketentuan Approver SPDK berhasil disimpan!', 'success');
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
        title="Konfigurasi Approver SPDK"
        sectionTitle="Konfigurasi"
        description="Kelola ketentuan penentuan atasan penyetuju lembar SPDK (Kepala Bagian Divisi atau personil tertentu)."
      >
        <div className="w-full md:max-w-xl animate-in fade-in slide-in-from-bottom-4 duration-300">
          <div className="glass-panel p-6 space-y-4 rounded-[24px]">
            <form onSubmit={handleSpdkSubmit} className="space-y-4">
              <div className="w-full">
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Mode Penentuan</label>
                <CustomSelect
                  value={spdkConfig.mode}
                  onChange={(val) => {
                    setSpdkConfig({ ...spdkConfig, mode: val, fixedEmployeeId: '' });
                    setSelectedSpdkUser(null);
                  }}
                  options={[
                    { value: 'unit_head', label: 'Kepala Bagian / Manager Unit' },
                    { value: 'fixed_person', label: 'Spesifik 1 Orang Karyawan' },
                  ]}
                />
              </div>

              {spdkConfig.mode === 'fixed_person' && (
                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Pilih Penyetuju</label>
                  <UserSearchDropdown
                    value={selectedSpdkUser}
                    onChange={u => {
                      setSelectedSpdkUser(u);
                      setSpdkConfig({ ...spdkConfig, fixedEmployeeId: u?.portalUserId || '' });
                    }}
                    placeholder="Cari nama karyawan..."
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Catatan Ketentuan</label>
                <input
                  type="text"
                  value={spdkConfig.keterangan || ''}
                  onChange={e => setSpdkConfig({ ...spdkConfig, keterangan: e.target.value })}
                  className="input-field w-full"
                  placeholder="Opsional, misal: Persetujuan akhir divisi SDM"
                />
              </div>

              <Button type="submit" className="w-full" loading={saving} disabled={saving}>
                <Save className="w-4 h-4" />
                <span>{saving ? 'Menyimpan...' : 'Simpan Ketentuan SPDK'}</span>
              </Button>
            </form>
          </div>
        </div>

    </PageTemplate>
  );
}
