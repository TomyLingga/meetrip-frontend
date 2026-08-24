/**
 * Formatter bersama — mata uang, tanggal, dan durasi.
 * Sebelumnya logika ini disalin puluhan kali secara inline di banyak halaman.
 */

/** Format angka menjadi Rupiah, mis. `Rp 1.500.000`. */
export function formatRupiah(value: number | string | null | undefined): string {
  const amount = Number(value || 0);
  return `Rp ${amount.toLocaleString('id-ID')}`;
}

/** Format angka menjadi Dollar AS, mis. `$1,500`. */
export function formatDollar(value: number | string | null | undefined): string {
  const amount = Number(value || 0);
  return `$${amount.toLocaleString('en-US')}`;
}

/** Pilih Rupiah/Dollar berdasarkan flag. */
export function formatCurrency(value: number | string | null | undefined, useDollar = false): string {
  return useDollar ? formatDollar(value) : formatRupiah(value);
}

/** Format tanggal-waktu lengkap ala Indonesia (mis. `Sen, 5 Jun 2026, 14.30`). */
export function formatDateTime(dateString: string | Date | null | undefined): string {
  if (!dateString) return '—';
  return new Date(dateString).toLocaleString('id-ID', {
    weekday: 'short', day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

/** Format tanggal saja (mis. `5 Juni 2026`). */
export function formatDate(dateString: string | Date | null | undefined): string {
  if (!dateString) return '—';
  return new Date(dateString).toLocaleDateString('id-ID', {
    day: 'numeric', month: 'long', year: 'numeric',
  });
}

/** Format jam saja (mis. `14.30`). */
export function formatTime(dateString: string | Date | null | undefined): string {
  if (!dateString) return '—';
  return new Date(dateString).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
}

/**
 * Hitung durasi perjalanan dinas dalam format "X Hari Y Malam".
 * Menghitung selisih hari (dibulatkan ke atas) lalu malam = hari − 1.
 */
export function calculateDuration(start: string | Date | null | undefined, end: string | Date | null | undefined): string {
  if (!start || !end) return '0 Hari 0 Malam';
  const berangkat = new Date(start);
  const kembali = new Date(end);
  const diff = kembali.getTime() - berangkat.getTime();
  if (diff <= 0) return '0 Hari 0 Malam';

  const hari = Math.ceil(diff / (1000 * 60 * 60 * 24));
  const malam = Math.max(0, hari - 1);
  return `${hari} Hari ${malam} Malam`;
}
