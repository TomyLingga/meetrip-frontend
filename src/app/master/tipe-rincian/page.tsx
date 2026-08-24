'use client';

import React, { useEffect, useState } from 'react';
import PageTemplate from '@/components/layout/PageTemplate';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import CustomCheckbox from '@/components/form/CustomCheckbox';
import Table from '@/components/ui/Table';
import { apiFetch } from '@/utils/api';
import { useAlert } from '@/context/FeedbackContext';
import {
  CheckCircle2,
  Edit3,
  Layers,
  Plus,
  RotateCcw,
  Save,
  ToggleLeft,
  ToggleRight,
  X,
} from 'lucide-react';

type TipeRincianItem = {
  id: string;
  kode: string;
  label: string;
  isActive: boolean;
};

const emptyForm = {
  kode: '',
  label: '',
  isActive: true,
};

export default function MasterTipeRincianPage() {
  const { showAlert } = useAlert();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [tipeRincians, setTipeRincians] = useState<TipeRincianItem[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await apiFetch('/api/master/ref-tipe-rincian');
      setTipeRincians(data || []);
    } catch (err) {
      console.error(err);
      showAlert('Gagal memuat data tipe rincian', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    loadData();
  };

  const resetForm = () => {
    setForm(emptyForm);
    setEditingId(null);
  };

  const openAddModal = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const openEditModal = (item: TipeRincianItem) => {
    setEditingId(item.id);
    setForm({
      kode: item.kode,
      label: item.label,
      isActive: item.isActive,
    });
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      await apiFetch(editingId ? `/api/master/ref-tipe-rincian/${editingId}` : '/api/master/ref-tipe-rincian', {
        method: editingId ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          kode: form.kode.trim().toUpperCase(),
          label: form.label.trim(),
          isActive: form.isActive,
        }),
      });
      showAlert(`Tipe rincian berhasil ${editingId ? 'diperbarui' : 'ditambahkan'}!`, 'success');
      setIsModalOpen(false);
      resetForm();
      await loadData();
    } catch (err: any) {
      showAlert(err.message || 'Gagal menyimpan tipe rincian', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleStatus = async (item: TipeRincianItem) => {
    try {
      await apiFetch(`/api/master/ref-tipe-rincian/${item.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          kode: item.kode,
          label: item.label,
          isActive: !item.isActive,
        }),
      });
      showAlert(`Status tipe rincian berhasil ${item.isActive ? 'dinonaktifkan' : 'diaktifkan'}!`, 'success');
      await loadData();
    } catch (err: any) {
      showAlert(err.message || 'Gagal mengubah status tipe rincian', 'error');
    }
  };

  const StatusBadge = ({ active }: { active: boolean }) => (
    <span className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-semibold ${active ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300' : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-300'}`}>
      {active ? <CheckCircle2 className="h-3 w-3" /> : <X className="h-3 w-3" />}
      {active ? 'Aktif' : 'Nonaktif'}
    </span>
  );

  const columns = [
    {
      header: 'No',
      className: 'w-12',
      render: (_: any, index: number) => index + 1
    },
    {
      header: 'Kode',
      render: (item: TipeRincianItem) => <span className="font-bold text-slate-850 dark:text-white">{item.kode}</span>
    },
    {
      header: 'Nama Kategori',
      render: (item: TipeRincianItem) => <span className="font-semibold text-slate-700 dark:text-slate-350">{item.label}</span>
    },
    {
      header: 'Status',
      className: 'w-28',
      render: (item: TipeRincianItem) => <StatusBadge active={item.isActive} />
    },
    {
      header: 'Aksi',
      className: 'text-left w-28 whitespace-nowrap',
      render: (item: TipeRincianItem) => (
        <div className="flex items-center justify-start gap-1.5 whitespace-nowrap">
          <button
            type="button"
            onClick={() => openEditModal(item)}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 dark:text-slate-500 hover:bg-amber-500/10 hover:text-amber-600 dark:hover:text-amber-450 transition-all cursor-pointer focus:outline-none"
            title="Edit"
          >
            <Edit3 className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={() => handleToggleStatus(item)}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 dark:text-slate-500 hover:bg-teal-500/10 hover:text-teal-650 dark:hover:text-teal-450 transition-all cursor-pointer focus:outline-none"
            title={item.isActive ? 'Nonaktifkan' : 'Aktifkan'}
          >
            {item.isActive ? <ToggleRight className="h-5 w-5 text-teal-500" /> : <ToggleLeft className="h-5 w-5" />}
          </button>
        </div>
      )
    }
  ];

  const headerActions = (
    <div className="flex gap-2 w-full sm:w-auto">
      <Button onClick={handleRefresh} variant="secondary" className="px-4 py-2 text-xs font-bold rounded-xl flex-1 sm:flex-none justify-center">
        <RotateCcw className="h-4 w-4" />
        <span>Refresh</span>
      </Button>
      <Button onClick={openAddModal} variant="primary" className="px-4 py-2 text-xs font-bold rounded-xl flex-1 sm:flex-none justify-center">
        <Plus className="h-4 w-4" />
        <span>Tambah Tipe</span>
      </Button>
    </div>
  );

  return (
    <PageTemplate
      title="Master Tipe Rincian"
      sectionTitle="Master Data"
      description="Kelola tipe / kategori rincian biaya perjalanan dinas."
      headerActions={headerActions}
    >
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
        <section className="glass-panel overflow-hidden">
          <div className="border-b border-slate-200 p-5 dark:border-slate-800 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="text-slate-850 dark:text-slate-200">
                <Layers className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">Daftar Tipe Rincian</h2>
                <p className="text-sm text-slate-500 dark:text-slate-400">Pengelompokan kategori biaya (contoh: Harian, Akomodasi, Transportasi).</p>
              </div>
            </div>
            <button
              onClick={openAddModal}
              className="btn-primary flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Tipe</span>
            </button>
          </div>

          <Table
            columns={columns}
            data={tipeRincians}
            loading={loading}
            emptyMessage="Belum ada data tipe rincian."
          />
        </section>
      </div>

      {/* Modal Form Add / Edit */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); resetForm(); }}
        title={editingId ? 'Edit Tipe Rincian' : 'Tambah Tipe Rincian'}
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-500 dark:text-slate-450 uppercase tracking-wider">Kode</label>
            <input
              className="input-field w-full"
              required
              placeholder="Contoh: HOTEL"
              value={form.kode}
              onChange={(e) => setForm({ ...form, kode: e.target.value })}
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-500 dark:text-slate-450 uppercase tracking-wider">Nama Kategori</label>
            <input
              className="input-field w-full"
              required
              placeholder="Contoh: Akomodasi / Penginapan"
              value={form.label}
              onChange={(e) => setForm({ ...form, label: e.target.value })}
            />
          </div>

          <div className="flex items-center justify-between rounded-xl border border-slate-200 dark:border-slate-850 bg-surface-sunken/50 px-4 py-3">
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-350">Status Aktif</span>
            <CustomCheckbox
              checked={form.isActive}
              onChange={(checked) => setForm({ ...form, isActive: checked })}
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 flex-wrap">
            <button
              type="button"
              onClick={() => { setIsModalOpen(false); resetForm(); }}
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
              <span>{editingId ? 'Simpan' : 'Tambah'}</span>
            </button>
          </div>
        </form>
      </Modal>
    </PageTemplate>
  );
}
