'use client';

import React, { useEffect, useState } from 'react';
import { apiFetch } from '@/utils/api';
import Modal from '@/components/ui/Modal';
import CustomCheckbox from '@/components/form/CustomCheckbox';
import Table from '@/components/ui/Table';
import SearchSelect from '@/components/form/SearchSelect';
import {
  CheckCircle2,
  Edit3,
  Plus,
  Save,
  ToggleLeft,
  ToggleRight,
  Coins,
  X,
} from 'lucide-react';

type RincianItem = {
  id: string;
  kode: string;
  label: string;
  kategori: string;
  hasPagu: boolean;
  perMalam: boolean;
  useDollarOverride: boolean;
  isActive: boolean;
};

type TipeRincianItem = {
  id: string;
  kode: string;
  label: string;
  isActive: boolean;
};

const emptyRincian = {
  kode: '',
  label: '',
  kategori: 'lain_lain',
  hasPagu: true,
  perMalam: false,
  useDollarOverride: false,
  isActive: true,
};

interface TabRincianProps {
  showToast: (msg: string, type: 'success' | 'error') => void;
}

export default function TabRincian({ showToast }: TabRincianProps) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [rincians, setRincians] = useState<RincianItem[]>([]);
  const [rincianForm, setRincianForm] = useState(emptyRincian);
  const [editingRincianId, setEditingRincianId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [tipeRincians, setTipeRincians] = useState<TipeRincianItem[]>([]);

  const rincianColumns = [
    {
      header: 'No',
      className: 'w-12',
      render: (_: any, index: number) => index + 1
    },
    {
      header: 'Kode',
      render: (item: RincianItem) => <span className="font-bold text-slate-850 dark:text-white">{item.kode}</span>
    },
    {
      header: 'Komponen Biaya',
      render: (item: RincianItem) => <span className="font-semibold text-slate-700 dark:text-slate-350">{item.label}</span>
    },
    {
      header: 'Kategori',
      render: (item: RincianItem) => {
        const catMap: Record<string, string> = {
          saku: 'Uang Saku',
          hotel: 'Hotel',
          laundry: 'Laundry',
          transport: 'Transportasi',
          lain_lain: 'Lain-lain',
        };
        tipeRincians.forEach(t => {
          catMap[t.kode] = t.label;
          catMap[t.kode.toLowerCase()] = t.label;
        });
        return <span className="font-semibold text-slate-650 dark:text-slate-400">{catMap[item.kategori] || catMap[item.kategori.toLowerCase()] || item.kategori || 'Lain-lain'}</span>;
      }
    },
    {
      header: 'Per Malam?',
      className: 'w-24',
      render: (item: RincianItem) => <BooleanBadge value={item.perMalam} />
    },
    {
      header: 'Status',
      className: 'w-28',
      render: (item: RincianItem) => <StatusBadge active={item.isActive} />
    },
    {
      header: 'Aksi',
      className: 'text-left w-28 whitespace-nowrap',
      render: (item: RincianItem) => (
        <div className="flex items-center justify-start gap-1.5 whitespace-nowrap">
          <button type="button" onClick={() => editRincian(item)} className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 dark:text-slate-500 hover:bg-amber-500/10 hover:text-amber-600 dark:hover:text-amber-450 transition-all cursor-pointer focus:outline-none" title="Edit">
            <Edit3 className="h-3.5 w-3.5" />
          </button>
          <button type="button" onClick={() => toggleRincian(item)} className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 dark:text-slate-500 hover:bg-teal-500/10 hover:text-teal-650 dark:hover:text-teal-450 transition-all cursor-pointer focus:outline-none" title={item.isActive ? 'Nonaktifkan' : 'Aktifkan'}>
            {item.isActive ? <ToggleRight className="h-5 w-5 text-teal-500" /> : <ToggleLeft className="h-5 w-5" />}
          </button>
        </div>
      )
    }
  ];

  useEffect(() => {
    loadRincians();
    loadTipeRincians();
  }, []);

  const loadTipeRincians = async () => {
    try {
      const data = await apiFetch('/api/master/ref-tipe-rincian');
      setTipeRincians(data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const loadRincians = async () => {
    try {
      setLoading(true);
      const data = await apiFetch('/api/master/ref-rincian-biaya');
      setRincians(data || []);
    } catch (err) {
      console.error(err);
      showToast('Gagal memuat data rincian biaya', 'error');
    } finally {
      setLoading(false);
    }
  };

  const resetRincianForm = () => {
    setRincianForm(emptyRincian);
    setEditingRincianId(null);
  };

  const saveRincian = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      setSaving(true);
      await apiFetch(editingRincianId ? `/api/master/ref-rincian-biaya/${editingRincianId}` : '/api/master/ref-rincian-biaya', {
        method: editingRincianId ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...rincianForm,
          kode: rincianForm.kode.trim().toUpperCase(),
          label: rincianForm.label.trim(),
        }),
      });
      showToast('Rincian biaya berhasil disimpan!', 'success');
      resetRincianForm();
      setIsModalOpen(false);
      await loadRincians();
    } catch (err: any) {
      showToast(err.message || 'Gagal menyimpan rincian biaya', 'error');
    } finally {
      setSaving(false);
    }
  };

  const editRincian = (item: RincianItem) => {
    setEditingRincianId(item.id);
    setRincianForm({
      kode: item.kode,
      label: item.label,
      kategori: item.kategori || 'lain_lain',
      hasPagu: item.hasPagu,
      perMalam: item.perMalam,
      useDollarOverride: item.useDollarOverride,
      isActive: item.isActive,
    });
    setIsModalOpen(true);
  };

  const toggleRincian = async (item: RincianItem) => {
    try {
      await apiFetch(`/api/master/ref-rincian-biaya/${item.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          kode: item.kode,
          label: item.label,
          kategori: item.kategori || 'lain_lain',
          hasPagu: item.hasPagu,
          perMalam: item.perMalam,
          useDollarOverride: item.useDollarOverride,
          isActive: !item.isActive,
        }),
      });
      showToast(`Status rincian biaya berhasil ${item.isActive ? 'dinonaktifkan' : 'diaktifkan'}!`, 'success');
      await loadRincians();
    } catch (err: any) {
      showToast(err.message || 'Gagal mengubah status rincian biaya', 'error');
    }
  };

  const StatusBadge = ({ active }: { active: boolean }) => (
    <span className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-semibold ${active ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300' : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-300'}`}>
      {active ? <CheckCircle2 className="h-3 w-3" /> : <X className="h-3 w-3" />}
      {active ? 'Aktif' : 'Nonaktif'}
    </span>
  );

  const BooleanBadge = ({ value }: { value: boolean }) => (
    value ? (
      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 border border-indigo-200/30">
        Ya
      </span>
    ) : (
      <span className="text-slate-400 dark:text-slate-600 font-medium">-</span>
    )
  );

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-300 border-t-slate-900 dark:border-slate-700 dark:border-t-white" />
      </div>
    );
  }

  return (
    <div className="w-full">
      <section className="glass-panel overflow-hidden">
        {/* Panel Header */}
        <div className="border-b border-slate-200 p-5 dark:border-slate-800 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="text-slate-850 dark:text-slate-200">
              <Coins className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Rincian Komponen Biaya</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">Komponen klaim (contoh: Uang Saku, Penginapan).</p>
            </div>
          </div>
          <button
            onClick={() => {
              resetRincianForm();
              setIsModalOpen(true);
            }}
            className="btn-primary flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah</span>
          </button>
        </div>

        <Table
          columns={rincianColumns}
          data={rincians}
          loading={loading}
          emptyMessage="Belum ada data rincian biaya."
        />
      </section>

      {/* Modal Add / Edit Rincian Biaya */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); resetRincianForm(); }}
        title={editingRincianId ? 'Edit Rincian Biaya' : 'Tambah Rincian Biaya'}
      >
        <form onSubmit={saveRincian} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-500 dark:text-slate-450 uppercase tracking-wider">Kode</label>
            <input 
              className="input-field w-full" 
              required 
              placeholder="Contoh: UANG_SAKU" 
              value={rincianForm.kode} 
              onChange={(e) => setRincianForm({ ...rincianForm, kode: e.target.value })} 
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-500 dark:text-slate-450 uppercase tracking-wider">Label Rincian</label>
            <input 
              className="input-field w-full" 
              required 
              placeholder="Contoh: Uang Saku Harian" 
              value={rincianForm.label} 
              onChange={(e) => setRincianForm({ ...rincianForm, label: e.target.value })} 
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-500 dark:text-slate-450 uppercase tracking-wider">Kategori Rincian</label>
            <SearchSelect
              options={
                tipeRincians.length > 0
                  ? tipeRincians.filter(t => t.isActive).map(t => ({ value: t.kode, label: t.label }))
                  : [
                      { value: 'saku', label: 'Uang Saku / Pocket Money' },
                      { value: 'hotel', label: 'Hotel / Akomodasi' },
                      { value: 'laundry', label: 'Laundry' },
                      { value: 'transport', label: 'Transportasi / Tiket' },
                      { value: 'lain_lain', label: 'Lain-lain' },
                    ]
              }
              value={
                tipeRincians.some(t => t.kode === rincianForm.kategori)
                  ? rincianForm.kategori
                  : tipeRincians.find(t => t.kode.toLowerCase() === (rincianForm.kategori || '').toLowerCase())?.kode || rincianForm.kategori
              }
              onChange={(val) => setRincianForm({ ...rincianForm, kategori: val })}
              placeholder="Pilih kategori rincian..."
            />
          </div>

          <div className="grid grid-cols-2 gap-3 pt-1">
            <div className="flex items-center justify-between rounded-xl border border-slate-200 dark:border-slate-850 bg-surface-sunken/50 px-4 py-3">
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-350">Per Malam?</span>
              <CustomCheckbox
                checked={rincianForm.perMalam}
                onChange={(checked) => setRincianForm({ ...rincianForm, perMalam: checked })}
              />
            </div>

            <div className="flex items-center justify-between rounded-xl border border-slate-200 dark:border-slate-850 bg-surface-sunken/50 px-4 py-3">
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-350">Status Aktif</span>
              <CustomCheckbox
                checked={rincianForm.isActive}
                onChange={(checked) => setRincianForm({ ...rincianForm, isActive: checked })}
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 flex-wrap">
            <button 
              type="button" 
              onClick={() => { setIsModalOpen(false); resetRincianForm(); }} 
              className="btn-secondary px-5 py-2.5 rounded-xl font-bold text-xs"
            >
              Batal
            </button>
            <button 
              type="submit" 
              disabled={saving} 
              className="btn-primary px-5 py-2.5 rounded-xl font-bold text-xs flex items-center gap-1.5"
            >
              {saving ? (
                <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              <span>{editingRincianId ? 'Simpan' : 'Tambah'}</span>
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
