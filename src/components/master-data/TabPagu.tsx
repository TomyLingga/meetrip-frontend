'use client';

import React, { useEffect, useState } from 'react';
import { apiFetch } from '@/utils/api';
import Modal from '@/components/ui/Modal';
import CustomSelect from '@/components/form/CustomSelect';
import CustomCheckbox from '@/components/form/CustomCheckbox';
import Table from '@/components/ui/Table';
import { Edit3, Save } from 'lucide-react';
import { InputUang } from '@/app/bto/components/InputUang';

type RincianItem = {
  id: string;
  kode: string;
  label: string;
  hasPagu: boolean;
  perMalam: boolean;
  useDollarOverride: boolean;
  isActive: boolean;
};

type GradeItem = {
  id: string;
  kode: string;
  label: string;
  level: number;
};

type PaguItem = {
  id: string;
  rincianId: string;
  gradeId: string;
  wilayahTipe: 'dalam_wilayah' | 'luar_wilayah' | 'luar_negeri';
  nilai: string;
  useDollar: boolean;
  isUnlimited: boolean;
};

interface TabPaguProps {
  showToast: (msg: string, type: 'success' | 'error') => void;
}

export default function TabPagu({ showToast }: TabPaguProps) {
  const [loading, setLoading] = useState(true);
  const [rincians, setRincians] = useState<RincianItem[]>([]);
  const [grades, setGrades] = useState<GradeItem[]>([]);
  const [pagus, setPagus] = useState<PaguItem[]>([]);

  // Filters State
  const [selectedGradeFilter, setSelectedGradeFilter] = useState<string>('');
  const [selectedWilayahFilter, setSelectedWilayahFilter] = useState<'dalam_wilayah' | 'luar_wilayah' | 'luar_negeri'>('dalam_wilayah');

  // Modal / Form States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRincian, setEditingRincian] = useState<RincianItem | null>(null);
  const [editingPagu, setEditingPagu] = useState<PaguItem | undefined>(undefined);
  
  const [nilai, setNilai] = useState<number>(0);
  const [useDollar, setUseDollar] = useState<boolean>(false);
  const [isUnlimited, setIsUnlimited] = useState<boolean>(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadPaguData();
  }, []);

  const loadPaguData = async () => {
    try {
      setLoading(true);
      const [rincianRows, gradeRows, paguRows] = await Promise.all([
        apiFetch('/api/master/ref-rincian-biaya'),
        apiFetch('/api/master/ref-grade'),
        apiFetch('/api/master/ref-pagu'),
      ]);
      setRincians(rincianRows || []);
      
      // Sort grades descending by level so BOD (highest) is first
      const sortedGrades = (gradeRows || []).sort((a: GradeItem, b: GradeItem) => b.level - a.level);
      setGrades(sortedGrades);
      
      setPagus(paguRows || []);

      if (sortedGrades && sortedGrades.length > 0) {
        setSelectedGradeFilter(current => current || sortedGrades[0].id);
      }
    } catch (err) {
      console.error(err);
      showToast('Gagal memuat data pagu limit', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleEditClick = (rincian: RincianItem, existing: PaguItem | undefined) => {
    setEditingRincian(rincian);
    setEditingPagu(existing);
    
    if (existing) {
      setNilai(Number(existing.nilai) || 0);
      setUseDollar(existing.useDollar || false);
      setIsUnlimited(existing.isUnlimited || false);
    } else {
      setNilai(0);
      setUseDollar(false);
      setIsUnlimited(false);
    }
    setIsModalOpen(true);
  };

  const handleSavePagu = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!editingRincian) return;

    try {
      setSaving(true);
      const url = editingPagu ? `/api/master/ref-pagu/${editingPagu.id}` : '/api/master/ref-pagu';
      const method = editingPagu ? 'PUT' : 'POST';

      await apiFetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rincianId: editingRincian.id,
          gradeId: selectedGradeFilter,
          wilayahTipe: selectedWilayahFilter,
          nilai: isUnlimited ? 0 : nilai,
          useDollar,
          isUnlimited,
        }),
      });

      showToast(`Pagu limit untuk ${editingRincian.label} berhasil disimpan!`, 'success');
      setIsModalOpen(false);
      
      // Reload only pagu list data
      const paguRows = await apiFetch('/api/master/ref-pagu');
      setPagus(paguRows || []);
    } catch (err: any) {
      showToast(err.message || 'Gagal menyimpan pagu limit', 'error');
    } finally {
      setSaving(false);
    }
  };

  const formatPaguValue = (pagu: PaguItem | undefined) => {
    if (!pagu) {
      return <span className="text-slate-400 dark:text-slate-600 font-medium">Rp 0 (Default)</span>;
    }
    if (pagu.isUnlimited) {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 border border-blue-200/30">
          Tanpa Batas
        </span>
      );
    }
    const formattedVal = new Intl.NumberFormat('id-ID').format(Number(pagu.nilai) || 0);
    if (pagu.useDollar) {
      return <span className="font-semibold text-slate-800 dark:text-slate-200">$ {formattedVal}</span>;
    }
    return <span className="font-semibold text-slate-800 dark:text-slate-200">Rp {formattedVal}</span>;
  };

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-300 border-t-slate-900 dark:border-slate-700 dark:border-t-white" />
      </div>
    );
  }

  const activePaguRincians = rincians.filter(r => r.isActive && r.hasPagu);

  const paguColumns = [
    {
      header: 'No',
      className: 'w-12',
      render: (_: any, index: number) => index + 1
    },
    {
      header: 'Komponen Biaya',
      render: (rincian: RincianItem) => (
        <>
          <span className="font-bold text-slate-800 dark:text-white">{rincian.label}</span>
          <span className="block text-xs font-normal text-slate-450 mt-0.5">Kode: {rincian.kode}</span>
        </>
      )
    },
    {
      header: 'Limit Pagu',
      render: (rincian: RincianItem) => {
        const existing = pagus.find(
          p => p.rincianId === rincian.id &&
          p.gradeId === selectedGradeFilter &&
          p.wilayahTipe === selectedWilayahFilter
        );
        return formatPaguValue(existing);
      }
    },
    {
      header: 'Aksi',
      className: 'text-left w-24 whitespace-nowrap',
      render: (rincian: RincianItem) => {
        const existing = pagus.find(
          p => p.rincianId === rincian.id &&
          p.gradeId === selectedGradeFilter &&
          p.wilayahTipe === selectedWilayahFilter
        );
        return (
          <div className="flex justify-start items-center">
            <button
              type="button"
              onClick={() => handleEditClick(rincian, existing)}
              className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 dark:text-slate-500 hover:bg-amber-500/10 hover:text-amber-600 dark:hover:text-amber-450 transition-all cursor-pointer focus:outline-none"
              title="Atur Pagu"
            >
              <Edit3 className="h-3.5 w-3.5" />
            </button>
          </div>
        );
      }
    }
  ];

  return (
    <div className="space-y-6 w-full">
      {/* Filter Card */}
      <div className="glass-panel p-5 grid gap-4 md:grid-cols-2 relative z-30">
        <div className="relative z-20">
          <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Grade / Golongan</label>
          <CustomSelect
            value={selectedGradeFilter}
            onChange={(val) => setSelectedGradeFilter(val)}
            options={grades.map((g) => ({ value: g.id, label: `${g.label} (${g.kode})` }))}
          />
        </div>
        <div className="relative z-20">
          <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Tipe Wilayah</label>
          <CustomSelect
            value={selectedWilayahFilter}
            onChange={(val) => setSelectedWilayahFilter(val as any)}
            options={[
              { value: 'dalam_wilayah', label: 'Dalam Wilayah' },
              { value: 'luar_wilayah', label: 'Luar Wilayah' },
              { value: 'luar_negeri', label: 'Luar Negeri' },
            ]}
          />
        </div>
      </div>

      {/* Components Pagu List Matrix */}
      <div className="space-y-4 relative z-10">
        <div className="flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/10 p-5 border border-slate-200 dark:border-slate-800 rounded-2xl">
          <div>
            <h2 className="text-lg font-bold text-slate-800 dark:text-slate-200">Konfigurasi Limit Pagu</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">Atur batasan maksimal biaya perjalanan dinas berdasarkan grade golongan & wilayah yang dipilih.</p>
          </div>
        </div>

        <Table
          columns={paguColumns}
          data={activePaguRincians}
          loading={loading}
          emptyMessage="Belum ada komponen biaya dengan status 'Punya Limit Pagu' aktif."
        />
      </div>

      {/* Modal Edit Pagu */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={`Atur Pagu: ${editingRincian?.label || ''}`}
      >
        <form onSubmit={handleSavePagu} className="space-y-4">
          <div className="p-3 bg-surface-sunken rounded-xl text-xs space-y-1 text-slate-500 dark:text-slate-400">
            <p><span className="font-bold text-slate-700 dark:text-slate-300">Grade:</span> {grades.find(g => g.id === selectedGradeFilter)?.label || ''}</p>
            <p><span className="font-bold text-slate-700 dark:text-slate-300">Wilayah:</span> <span className="capitalize">{selectedWilayahFilter.replace('_', ' ')}</span></p>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-1">
            <div className="flex items-center justify-between rounded-xl border border-slate-200 dark:border-slate-850 bg-surface-sunken/50 px-4 py-3">
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-350">Mata Uang USD</span>
              <CustomCheckbox
                checked={useDollar}
                disabled={isUnlimited}
                onChange={(checked) => setUseDollar(checked)}
              />
            </div>

            <div className="flex items-center justify-between rounded-xl border border-slate-200 dark:border-slate-850 bg-surface-sunken/50 px-4 py-3">
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-350">Tanpa Batas</span>
              <CustomCheckbox
                checked={isUnlimited}
                onChange={(checked) => {
                  setIsUnlimited(checked);
                  if (checked) {
                    setNilai(0);
                    setUseDollar(false);
                  }
                }}
              />
            </div>
          </div>

          {!isUnlimited && (
            <div className="space-y-1 animate-in fade-in slide-in-from-top-1 duration-150">
              <label className="text-xs font-bold text-slate-500 dark:text-slate-450 uppercase tracking-wider">
                Limit Pagu ({useDollar ? 'USD' : 'IDR'})
              </label>
              <div className="relative flex items-center">
                <span className="absolute left-4 z-10 text-sm font-semibold text-slate-400 select-none">
                  {useDollar ? '$' : 'Rp'}
                </span>
                <InputUang 
                  placeholder="Masukkan nilai limit pagu"
                  className="input-field w-full pl-12 text-slate-800 dark:text-slate-100 font-extrabold text-sm"
                  value={nilai === 0 ? undefined : nilai}
                  useDollar={useDollar}
                  onChange={(val) => setNilai(val ?? 0)}
                />
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-3 flex-wrap">
            <button 
              type="button" 
              onClick={() => setIsModalOpen(false)} 
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
              <span>Simpan</span>
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
