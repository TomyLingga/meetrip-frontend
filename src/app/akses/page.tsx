'use client';

import React, { useEffect, useState } from 'react';
import PageTemplate from '@/components/layout/PageTemplate';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import CustomSelect from '@/components/form/CustomSelect';
import UserSearchDropdown, { PortalUser } from '@/components/form/UserSearchDropdown';
import { apiFetch } from '@/utils/api';
import { Users, UserPlus, Trash2, KeyRound } from 'lucide-react';
import PaginationControls from '@/components/ui/PaginationControls';
import usePagination from '@/hooks/usePagination';
import { useAlert } from '@/context/FeedbackContext';


interface UserRoleItem {
  id: string;
  portalUserId: string;
  role: string;
  createdAt: string;
  nama?: string | null;
  email?: string | null;
  jabatan?: string | null;
}

export default function AdminConfigRolesPage() {
  const [loading, setLoading] = useState(true);
  const [roles, setRoles] = useState<UserRoleItem[]>([]);
  
  const [roleForm, setRoleForm] = useState({
    portalUserId: '',
  });

  const [selectedRoles, setSelectedRoles] = useState<string[]>(['sdm']);

  const [selectedAddRoleUser, setSelectedAddRoleUser] = useState<PortalUser | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const { showAlert } = useAlert();
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    message: string;
    onConfirm: () => Promise<void>;
  } | null>(null);
  const rolesPagination = usePagination(roles);

  useEffect(() => {
    loadRoles();
  }, []);

  const loadRoles = async () => {
    try {
      setLoading(true);
      const rolesData = await apiFetch('/api/config/users-role');
      setRoles(rolesData || []);
    } catch (err) {
      console.error(err);
      showAlert('Gagal memuat data hak akses', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleAddRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!roleForm.portalUserId) {
      showAlert('Pilih user terlebih dahulu.', 'error');
      return;
    }
    if (selectedRoles.length === 0) {
      showAlert('Pilih minimal satu role khusus.', 'error');
      return;
    }
    try {
      setSubmitting(true);
      await apiFetch('/api/config/users-role', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          portalUserId: roleForm.portalUserId,
          role: selectedRoles.join(','),
        })
      });
      showAlert('Role berhasil didaftarkan!', 'success');
      setRoleForm({ portalUserId: '' });
      setSelectedRoles(['sdm']);
      setSelectedAddRoleUser(null);
      loadRoles();
    } catch (err: any) {
      showAlert(err.message || 'Gagal menambahkan role', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteRole = (portalUserId: string) => {
    setConfirmModal({
      isOpen: true,
      message: 'Hapus role khusus user ini? User akan kembali ke role default (biasa).',
      onConfirm: async () => {
        try {
          setDeleting(true);
          await apiFetch(`/api/config/users-role/${portalUserId}`, {
            method: 'DELETE'
          });
          showAlert('Role khusus berhasil dihapus.', 'success');
          loadRoles();
        } catch (err: any) {
          showAlert(err.message || 'Gagal menghapus role', 'error');
        } finally {
          setDeleting(false);
        }
      }
    });
  };

  if (loading) {
    return (
      <div className="space-y-3">
        <div className="h-12 rounded-xl bg-slate-200 dark:bg-slate-800 animate-pulse" />
        <div className="h-12 rounded-xl bg-slate-200 dark:bg-slate-800 animate-pulse" />
        <div className="h-12 rounded-xl bg-slate-200 dark:bg-slate-800 animate-pulse" />
        <div className="h-12 rounded-xl bg-slate-200 dark:bg-slate-800 animate-pulse" />
        <div className="h-12 rounded-xl bg-slate-200 dark:bg-slate-800 animate-pulse" />
      </div>
    );
  }

  return (
    <PageTemplate
        title="Manajemen Hak Akses"
        sectionTitle="Hak Akses"
        description="Atur peran khusus pengguna untuk mengakses modul administrasi (Admin / SDM) MeeTrip."
      >
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start w-full animate-in fade-in slide-in-from-bottom-4 duration-300">
          {/* Add Role Form (1 Column) */}
          <div className="glass-panel p-6 space-y-4 rounded-[24px]">
            <h3 className="text-lg font-bold flex items-center space-x-2 text-slate-800 dark:text-slate-200">
              <UserPlus className="w-5 h-5 text-teal-600 dark:text-teal-400" />
              <span>Daftarkan Hak Akses</span>
            </h3>

            <form onSubmit={handleAddRole} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-450 uppercase tracking-wider mb-2">Pilih Karyawan</label>
                <UserSearchDropdown
                  value={selectedAddRoleUser}
                  onChange={u => {
                    setSelectedAddRoleUser(u);
                    setRoleForm({ ...roleForm, portalUserId: u?.portalUserId || '' });
                  }}
                  placeholder="Cari nama atau email..."
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-450 uppercase tracking-wider mb-2">Role Khusus</label>
                <div className="space-y-2.5 mt-2 bg-slate-50/50 dark:bg-slate-900/50 p-3 rounded-xl border border-slate-150 dark:border-white/[0.04]">
                  <label className="flex items-center space-x-3 text-sm text-slate-700 dark:text-slate-350 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedRoles.includes('admin')}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedRoles([...selectedRoles, 'admin']);
                        } else {
                          setSelectedRoles(selectedRoles.filter(r => r !== 'admin'));
                        }
                      }}
                      className="rounded text-teal-600 border-slate-300 focus:ring-teal-500 dark:bg-slate-950 dark:border-slate-800 h-4 w-4"
                    />
                    <span className="font-medium">Admin MeeTrip</span>
                  </label>
                  <label className="flex items-center space-x-3 text-sm text-slate-700 dark:text-slate-350 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedRoles.includes('sdm')}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedRoles([...selectedRoles, 'sdm']);
                        } else {
                          setSelectedRoles(selectedRoles.filter(r => r !== 'sdm'));
                        }
                      }}
                      className="rounded text-teal-600 border-slate-300 focus:ring-teal-500 dark:bg-slate-950 dark:border-slate-800 h-4 w-4"
                    />
                    <span className="font-medium">Tim Bagian SDM</span>
                  </label>
                </div>
              </div>

            <Button type="submit" className="w-full" loading={submitting} loadingLabel="Mendaftarkan..." disabled={submitting}>
              Daftarkan Role
              </Button>
            </form>
          </div>

          {/* Roles List (2 Columns) */}
          <div className="lg:col-span-2 glass-panel overflow-hidden rounded-[24px]">
            <div className="border-b border-slate-150 dark:border-white/[0.06] p-5 flex justify-between items-center bg-slate-50/10 dark:bg-slate-950/10">
              <div>
                <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                  <span>Daftar Hak Akses Aktif</span>
                </h3>
              </div>
            </div>

            <div className="overflow-x-auto hide-scrollbar">
              <table className="w-full border-collapse text-left">
                <thead>
                  <tr className="border-b border-slate-150 dark:border-white/[0.04] bg-slate-50/20 dark:bg-white/[0.01]">
                    <th className="py-3 px-5 text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 w-12">No</th>
                    <th className="py-3 px-5 text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">Karyawan</th>
                    <th className="py-3 px-5 text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 w-36">Role Khusus</th>
                    <th className="py-3 px-5 text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 text-right w-24">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-white/[0.03]">
                  {rolesPagination.pageItems.map((r, index) => (
                    <tr key={r.id} className="hover:bg-slate-50/20 dark:hover:bg-white/[0.01] transition-colors">
                      <td className="py-4 px-5 text-sm font-medium text-slate-500 dark:text-slate-400">{rolesPagination.absoluteIndex(index) + 1}</td>
                      <td className="py-4 px-5 text-sm">
                        {r.nama ? (
                          <>
                            <p className="font-bold text-slate-850 dark:text-white">{r.nama}</p>
                            <p className="text-xs text-slate-500 dark:text-slate-455 mt-0.5">
                              {[r.jabatan, r.email].filter(Boolean).join(' · ')}
                            </p>
                          </>
                        ) : (
                          <p className="font-bold text-slate-850 dark:text-white">ID Karyawan: {r.portalUserId}</p>
                        )}
                      </td>
                      <td className="py-4 px-5 text-sm">
                        <div className="flex flex-wrap gap-1.5">
                          {(r.role || '').split(',').map((role) => (
                            <span key={role} className={`inline-flex items-center gap-1 rounded-md px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider border ${
                              role === 'admin'
                                ? 'bg-indigo-50 border-indigo-200/50 text-indigo-700 dark:bg-indigo-950/40 dark:border-indigo-800/30 dark:text-indigo-300'
                                : 'bg-emerald-50 border-emerald-200/50 text-emerald-700 dark:bg-emerald-950/40 dark:border-emerald-800/30 dark:text-emerald-300'
                            }`}>
                              <KeyRound className="w-3 h-3" />
                              {role === 'admin' ? 'Admin' : 'SDM'}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="py-4 px-5 text-sm text-right">
                        <button
                          type="button"
                          onClick={() => handleDeleteRole(r.portalUserId)}
                          className="p-2 hover:bg-rose-500/10 rounded-xl text-slate-400 hover:text-rose-600 dark:hover:text-rose-455 transition-all cursor-pointer focus:outline-none"
                          title="Hapus Hak Akses"
                        >
                          <Trash2 className="h-4.5 w-4.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {roles.length === 0 && (
                    <tr>
                      <td colSpan={4} className="py-8 text-center text-slate-500 dark:text-slate-400">
                        Belum ada hak akses khusus yang didaftarkan.
                      </td>
                    </tr>
                  )}
                </tbody>
            </table>
            <PaginationControls
              currentPage={rolesPagination.currentPage}
              totalItems={roles.length}
              pageSize={rolesPagination.pageSize}
              onPageChange={rolesPagination.setCurrentPage}
              onPageSizeChange={rolesPagination.setPageSize}
            />
          </div>
          </div>
        </div>

        {/* Themed Confirmation Modal */}
        {confirmModal && confirmModal.isOpen && (
          <Modal
            isOpen={confirmModal.isOpen}
            onClose={() => setConfirmModal(null)}
            title="Konfirmasi Hapus"
          >
            <div className="space-y-4">
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                {confirmModal.message}
              </p>
              <div className="flex justify-end space-x-3 pt-2">
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
                onClick={async () => {
                  await confirmModal.onConfirm();
                  setConfirmModal(null);
                }}
                variant="danger"
                loading={deleting}
                loadingLabel="Menghapus..."
                disabled={deleting}
                  className="px-5 py-2.5 rounded-xl font-bold text-xs"
                >
                  Hapus
                </Button>
              </div>
            </div>
          </Modal>
        )}

    </PageTemplate>
  );
}
