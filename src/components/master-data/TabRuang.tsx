'use client';

import React, { useEffect, useState } from 'react';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import CustomCheckbox from '@/components/form/CustomCheckbox';
import Table from '@/components/ui/Table';
import { apiFetch } from '@/utils/api';
import SearchInput from '@/components/form/SearchInput';
import {
  DoorOpen,
  Plus,
  Pencil,
  Trash2,
  Save,
  Volume2,
  VolumeX,
} from 'lucide-react';

interface RuangMeeting {
  id: string;
  nama: string;
  lokasi: string | null;
  kapasitas: number;
  hasSoundSystem: boolean;
  isActive: boolean;
}

const emptyForm = {
  nama: '',
  lokasi: '',
  kapasitas: 1,
  hasSoundSystem: false,
  isActive: true,
};

interface TabRuangProps {
  showToast: (message: string, type: 'success' | 'error') => void;
}

export default function TabRuang({ showToast }: TabRuangProps) {
  const [rooms, setRooms] = useState<RuangMeeting[]>([]);
  const [loading, setLoading] = useState(true);
  const [showInactive, setShowInactive] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const [isModalOpen, setIsModalOpen] = useState(false);

  const roomColumns = [
    {
      header: 'No',
      className: 'w-12',
      render: (_: any, index: number) => index + 1
    },
    {
      header: 'Nama Ruangan',
      render: (room: RuangMeeting) => <span className="font-bold text-slate-850 dark:text-white">{room.nama}</span>
    },
    {
      header: 'Lokasi / Lantai',
      render: (room: RuangMeeting) => <span>{room.lokasi || '—'}</span>
    },
    {
      header: 'Kapasitas',
      className: 'w-36',
      render: (room: RuangMeeting) => <span className="font-semibold text-slate-700 dark:text-slate-350">{room.kapasitas} Orang</span>
    },
    {
      header: 'Sound System',
      className: 'w-40',
      render: (room: RuangMeeting) => room.hasSoundSystem ? (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-teal-50 px-2.5 py-1 text-xs font-bold text-teal-750 dark:bg-teal-950/40 dark:text-teal-400">
          <Volume2 className="h-3.5 w-3.5 animate-pulse" />
          Tersedia
        </span>
      ) : (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-500 dark:bg-slate-800 dark:text-slate-400">
          <VolumeX className="h-3.5 w-3.5" />
          Tidak Ada
        </span>
      )
    },
    {
      header: 'Status',
      className: 'w-32',
      render: (room: RuangMeeting) => room.isActive ? (
        <span className="inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
          Aktif
        </span>
      ) : (
        <span className="inline-flex items-center rounded-full bg-rose-50 px-2.5 py-1 text-xs font-bold text-rose-700 dark:bg-rose-950/40 dark:text-rose-400">
          Nonaktif
        </span>
      )
    },
    {
      header: 'Aksi',
      className: 'text-left w-28 whitespace-nowrap',
      render: (room: RuangMeeting) => (
        <div className="flex items-center justify-start gap-1.5 whitespace-nowrap">
          <button
            onClick={() => openEdit(room)}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 dark:text-slate-500 hover:bg-amber-500/10 hover:text-amber-600 dark:hover:text-amber-450 transition-all cursor-pointer focus:outline-none"
            title="Edit"
          >
            <Pencil className="h-3.5 w-3.5" />
          </button>
          {room.isActive && (
            <button
              onClick={() => handleDeactivate(room)}
              className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 dark:text-slate-500 hover:bg-rose-500/10 hover:text-rose-600 dark:hover:text-rose-450 transition-all cursor-pointer focus:outline-none"
              title="Nonaktifkan"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      )
    }
  ];

  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ ...emptyForm });
  const [submitting, setSubmitting] = useState(false);

  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    message: string;
    onConfirm: () => void;
  } | null>(null);

  const loadRooms = async () => {
    try {
      setLoading(true);
      const data = await apiFetch(`/api/master/ref-ruang-meeting${showInactive ? '?includeInactive=1' : ''}`);
      setRooms(data || []);
    } catch (err: any) {
      showToast(err.message || 'Gagal memuat data ruangan', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRooms();
  }, [showInactive]);

  const openAdd = () => {
    setEditingId(null);
    setForm({ ...emptyForm });
    setIsModalOpen(true);
  };

  const openEdit = (room: RuangMeeting) => {
    setEditingId(room.id);
    setForm({
      nama: room.nama,
      lokasi: room.lokasi || '',
      kapasitas: room.kapasitas,
      hasSoundSystem: room.hasSoundSystem,
      isActive: room.isActive,
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = {
        ...form,
        kapasitas: Number(form.kapasitas),
        lokasi: form.lokasi || undefined,
      };
      if (editingId) {
        await apiFetch(`/api/master/ref-ruang-meeting/${editingId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        showToast('Ruangan berhasil diperbarui!', 'success');
      } else {
        await apiFetch('/api/master/ref-ruang-meeting', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        showToast('Ruangan berhasil ditambahkan!', 'success');
      }
      setIsModalOpen(false);
      loadRooms();
    } catch (err: any) {
      showToast(err.message || 'Gagal menyimpan data', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeactivate = (room: RuangMeeting) => {
    setConfirmModal({
      isOpen: true,
      message: `Nonaktifkan ruangan "${room.nama}"? Ruangan tidak akan muncul di pilihan booking baru.`,
      onConfirm: async () => {
        try {
          await apiFetch(`/api/master/ref-ruang-meeting/${room.id}`, { method: 'DELETE' });
          showToast('Ruangan berhasil dinonaktifkan.', 'success');
          loadRooms();
        } catch (err: any) {
          showToast(err.message || 'Gagal menonaktifkan ruangan', 'error');
        }
      },
    });
  };

  // Local filtering based on search search term
  const filteredRooms = rooms.filter((room) => {
    const searchLower = searchTerm.toLowerCase();
    const nameMatch = room.nama.toLowerCase().includes(searchLower);
    const locationMatch = (room.lokasi || '').toLowerCase().includes(searchLower);
    return nameMatch || locationMatch;
  });

  return (
    <div className="space-y-6">
      {/* Top Filter and Actions Row */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <Button onClick={openAdd} className="h-11 px-5 text-xs font-bold uppercase tracking-wider rounded-xl w-full sm:w-auto shrink-0">
          <Plus className="h-4.5 w-4.5" />
          <span>Tambah Ruangan</span>
        </Button>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 bg-surface-card p-3 rounded-2xl border border-slate-200 dark:border-slate-800 w-full sm:w-auto shrink-0 shadow-neu">
          <CustomCheckbox
            checked={showInactive}
            onChange={(checked) => setShowInactive(checked)}
            label="Tampilkan Nonaktif"
            className="scale-95 px-2"
          />
          <SearchInput
            value={searchTerm}
            onChange={setSearchTerm}
            placeholder="Cari nama atau lokasi ruangan..."
            className="sm:w-96"
          />
        </div>
      </div>

      {/* Rooms Table */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-teal-500 border-t-transparent" />
        </div>
      ) : filteredRooms.length === 0 ? (
        <div className="glass-panel flex flex-col items-center justify-center gap-3 py-20 text-center rounded-[24px]">
          <DoorOpen className="h-10 w-10 text-slate-300 dark:text-slate-700" />
          <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">Tidak ada ruang meeting ditemukan.</p>
          {rooms.length === 0 && (
            <Button onClick={openAdd} className="mt-2 px-4 py-2 text-xs font-bold rounded-xl">
              <Plus className="h-4 w-4" />
              <span>Tambah Ruangan Pertama</span>
            </Button>
          )}
        </div>
      ) : (
        <Table
          columns={roomColumns}
          data={filteredRooms}
          loading={loading}
          emptyMessage="Tidak ada ruang meeting ditemukan."
          rowClassName={(room) => (!room.isActive ? 'opacity-65 hover:bg-slate-50/20 dark:hover:bg-white/[0.01]' : 'hover:bg-slate-50/20 dark:hover:bg-white/[0.01]')}
        />
      )}

      {/* Modal Tambah / Edit */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingId ? 'Edit Ruang Meeting' : 'Tambah Ruang Meeting'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-500 dark:text-slate-450 uppercase tracking-wider">
              Nama Ruangan <span className="text-red-500">*</span>
            </label>
            <input
              className="input-field"
              required
              placeholder="Contoh: Ruang Rapat Utama"
              value={form.nama}
              onChange={(e) => setForm({ ...form, nama: e.target.value })}
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-500 dark:text-slate-450 uppercase tracking-wider">Lokasi / Lantai</label>
            <input
              className="input-field"
              placeholder="Contoh: Lantai 3, Gedung A"
              value={form.lokasi}
              onChange={(e) => setForm({ ...form, lokasi: e.target.value })}
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-500 dark:text-slate-450 uppercase tracking-wider">
              Kapasitas (orang) <span className="text-red-500">*</span>
            </label>
            <input
              className="input-field"
              type="number"
              min={1}
              required
              value={form.kapasitas}
              onChange={(e) => setForm({ ...form, kapasitas: Number(e.target.value) })}
            />
          </div>

          <div className="grid grid-cols-2 gap-3 pt-1">
            <div className="flex items-center justify-between rounded-xl border border-slate-200 dark:border-slate-850 bg-surface-sunken/50 px-4 py-3">
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-355">Sound System</span>
              <CustomCheckbox
                checked={form.hasSoundSystem}
                onChange={(checked) => setForm({ ...form, hasSoundSystem: checked })}
              />
            </div>

            <div className="flex items-center justify-between rounded-xl border border-slate-200 dark:border-slate-855 bg-slate-50 dark:bg-slate-955/50 px-4 py-3">
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-355">Status Aktif</span>
              <CustomCheckbox
                checked={form.isActive}
                onChange={(checked) => setForm({ ...form, isActive: checked })}
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 flex-wrap">
            <Button
              type="button"
              onClick={() => setIsModalOpen(false)}
              variant="secondary"
              className="px-5 py-2.5 rounded-xl font-bold text-xs"
            >
              Batal
            </Button>
            <Button type="submit" disabled={submitting} className="px-5 py-2.5 rounded-xl font-bold text-xs">
              {submitting ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              <span>{editingId ? 'Simpan' : 'Tambah'}</span>
            </Button>
          </div>
        </form>
      </Modal>

      {/* Confirm Modal */}
      {confirmModal?.isOpen && (
        <Modal
          isOpen={confirmModal.isOpen}
          onClose={() => setConfirmModal(null)}
          title="Konfirmasi Tindakan"
        >
          <div className="space-y-4">
            <p className="text-sm text-slate-650 dark:text-slate-400 leading-relaxed">
              {confirmModal.message}
            </p>
            <div className="flex justify-end gap-3 pt-2 flex-wrap">
              <Button
                type="button"
                onClick={() => setConfirmModal(null)}
                variant="secondary"
                className="px-5 py-2.5 rounded-xl font-bold text-xs"
              >
                Batal
              </Button>
              <Button
                type="button"
                onClick={() => {
                  confirmModal.onConfirm();
                  setConfirmModal(null);
                }}
                variant="danger"
                className="px-5 py-2.5 rounded-xl font-bold text-xs"
              >
                Nonaktifkan
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
