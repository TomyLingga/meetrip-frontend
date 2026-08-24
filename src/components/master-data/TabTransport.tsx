'use client';

import React, { useEffect, useState } from 'react';
import { apiFetch } from '@/utils/api';
import Modal from '@/components/ui/Modal';
import CustomSelect from '@/components/form/CustomSelect';
import CustomCheckbox from '@/components/form/CustomCheckbox';
import Table from '@/components/ui/Table';
import {
  CheckCircle2,
  Edit3,
  Plus,
  Save,
  ToggleLeft,
  ToggleRight,
  TrainFront,
  X,
} from 'lucide-react';

type TransportItem = {
  id: string;
  kode: string;
  label: string;
  tipe: string;
  isActive: boolean;
};

const emptyTransport = {
  kode: '',
  label: '',
  tipe: 'perusahaan',
  isActive: true,
};

interface TabTransportProps {
  showToast: (msg: string, type: 'success' | 'error') => void;
}

export default function TabTransport({ showToast }: TabTransportProps) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [transports, setTransports] = useState<TransportItem[]>([]);
  const [transportForm, setTransportForm] = useState(emptyTransport);
  const [editingTransportId, setEditingTransportId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const transportColumns = [
    {
      header: 'No',
      className: 'w-12',
      render: (_: any, index: number) => index + 1
    },
    {
      header: 'Kode',
      render: (item: TransportItem) => <span className="font-bold text-slate-850 dark:text-white">{item.kode}</span>
    },
    {
      header: 'Nama Moda',
      render: (item: TransportItem) => <span className="font-semibold text-slate-700 dark:text-slate-350">{item.label}</span>
    },
    {
      header: 'Tipe',
      render: (item: TransportItem) => <span className="text-slate-500 dark:text-slate-400 capitalize">{item.tipe}</span>
    },
    {
      header: 'Status',
      className: 'w-28',
      render: (item: TransportItem) => <StatusBadge active={item.isActive} />
    },
    {
      header: 'Aksi',
      className: 'text-left w-28 whitespace-nowrap',
      render: (item: TransportItem) => (
        <div className="flex items-center justify-start gap-1.5 whitespace-nowrap">
          <button type="button" onClick={() => editTransport(item)} className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 dark:text-slate-500 hover:bg-amber-500/10 hover:text-amber-600 dark:hover:text-amber-450 transition-all cursor-pointer focus:outline-none" title="Edit">
            <Edit3 className="h-3.5 w-3.5" />
          </button>
          <button type="button" onClick={() => toggleTransport(item)} className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 dark:text-slate-500 hover:bg-teal-500/10 hover:text-teal-600 dark:hover:text-teal-450 transition-all cursor-pointer focus:outline-none" title={item.isActive ? 'Nonaktifkan' : 'Aktifkan'}>
            {item.isActive ? <ToggleRight className="h-5 w-5 text-teal-500" /> : <ToggleLeft className="h-5 w-5" />}
          </button>
        </div>
      )
    }
  ];

  useEffect(() => {
    loadTransports();
  }, []);

  const loadTransports = async () => {
    try {
      setLoading(true);
      const data = await apiFetch('/api/master/ref-transport?includeInactive=1');
      setTransports(data || []);
    } catch (err) {
      console.error(err);
      showToast('Gagal memuat data transportasi', 'error');
    } finally {
      setLoading(false);
    }
  };

  const resetTransportForm = () => {
    setTransportForm(emptyTransport);
    setEditingTransportId(null);
  };

  const saveTransport = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      setSaving(true);
      await apiFetch(editingTransportId ? `/api/master/ref-transport/${editingTransportId}` : '/api/master/ref-transport', {
        method: editingTransportId ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...transportForm,
          kode: transportForm.kode.trim().toUpperCase(),
          label: transportForm.label.trim(),
          tipe: transportForm.tipe.trim(),
        }),
      });
      showToast('Moda transportasi berhasil disimpan!', 'success');
      resetTransportForm();
      setIsModalOpen(false);
      await loadTransports();
    } catch (err: any) {
      showToast(err.message || 'Gagal menyimpan transportasi', 'error');
    } finally {
      setSaving(false);
    }
  };

  const editTransport = (item: TransportItem) => {
    setEditingTransportId(item.id);
    setTransportForm({
      kode: item.kode,
      label: item.label,
      tipe: item.tipe,
      isActive: item.isActive,
    });
    setIsModalOpen(true);
  };

  const toggleTransport = async (item: TransportItem) => {
    try {
      if (item.isActive) {
        await apiFetch(`/api/master/ref-transport/${item.id}`, { method: 'DELETE' });
      } else {
        await apiFetch(`/api/master/ref-transport/${item.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ kode: item.kode, label: item.label, tipe: item.tipe, isActive: true }),
        });
      }
      showToast(`Status transportasi berhasil ${item.isActive ? 'dinonaktifkan' : 'diaktifkan'}!`, 'success');
      await loadTransports();
    } catch (err: any) {
      showToast(err.message || 'Gagal mengubah status transportasi', 'error');
    }
  };

  const StatusBadge = ({ active }: { active: boolean }) => (
    <span className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-semibold ${active ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300' : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-300'}`}>
      {active ? <CheckCircle2 className="h-3 w-3" /> : <X className="h-3 w-3" />}
      {active ? 'Aktif' : 'Nonaktif'}
    </span>
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
              <TrainFront className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Moda Transportasi</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">Dipakai di dropdown pembuatan BTO.</p>
            </div>
          </div>
          <button
            onClick={() => {
              resetTransportForm();
              setIsModalOpen(true);
            }}
            className="btn-primary flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah</span>
          </button>
        </div>

        <Table
          columns={transportColumns}
          data={transports}
          loading={loading}
          emptyMessage="Belum ada data moda transportasi."
        />
      </section>

      {/* Modal Add / Edit */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); resetTransportForm(); }}
        title={editingTransportId ? 'Edit Moda Transportasi' : 'Tambah Moda Transportasi'}
      >
        <form onSubmit={saveTransport} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-500 dark:text-slate-450 uppercase tracking-wider">Kode</label>
            <input 
              className="input-field w-full" 
              required 
              placeholder="Contoh: MOBIL_DINAS" 
              value={transportForm.kode} 
              onChange={(e) => setTransportForm({ ...transportForm, kode: e.target.value })} 
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-500 dark:text-slate-450 uppercase tracking-wider">Nama Moda</label>
            <input 
              className="input-field w-full" 
              required 
              placeholder="Contoh: Mobil Dinas Jabatan" 
              value={transportForm.label} 
              onChange={(e) => setTransportForm({ ...transportForm, label: e.target.value })} 
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-500 dark:text-slate-450 uppercase tracking-wider">Tipe</label>
            <CustomSelect
              value={transportForm.tipe}
              onChange={(val) => setTransportForm({ ...transportForm, tipe: val })}
              options={[
                { value: 'perusahaan', label: 'Perusahaan' },
                { value: 'publik', label: 'Publik' },
                { value: 'pesawat', label: 'Pesawat' },
              ]}
            />
          </div>

          <div className="flex items-center justify-between rounded-xl border border-slate-200 dark:border-slate-850 bg-surface-sunken/50 px-4 py-3">
            <span className="font-semibold text-slate-700 dark:text-slate-350">Status Aktif</span>
            <CustomCheckbox
              checked={transportForm.isActive}
              onChange={(checked) => setTransportForm({ ...transportForm, isActive: checked })}
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 flex-wrap">
            <button 
              type="button" 
              onClick={() => { setIsModalOpen(false); resetTransportForm(); }} 
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
              <span>{editingTransportId ? 'Simpan' : 'Tambah'}</span>
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
