'use client';

import { useEffect, useState, type ElementType } from 'react';
import { AlertTriangle, Check, ChevronLeft, ChevronRight, CircleDollarSign, ClipboardCheck, FilePlus2, FileSignature, HelpCircle, MapPin, ReceiptText, ShieldCheck } from 'lucide-react';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';

export type MeetripGuideTopic = 'user-submission' | 'pemberi-tugas-review' | 'sdm-review' | 'kabag-review' | 'admin-dp' | 'admin-spdk' | 'admin-bte' | 'admin-payment' | 'admin-bte-payment';

type Instruction = { action: string; detail: string; result?: string };
type Chapter = {
  label: string;
  title: string;
  location: string;
  purpose: string;
  before?: string[];
  steps: Instruction[];
  problems?: Array<{ problem: string; solution: string }>;
};
type Guide = { role: string; title: string; summary: string; chapters: Chapter[] };

const USER_CHAPTERS: Chapter[] = [
  {
    label: 'Persiapan',
    title: 'Siapkan data sebelum membuat BTO',
    location: 'Dashboard → Manajemen Dinas → Pengajuan Dinas',
    purpose: 'Menghindari pengajuan tertahan karena tujuan, penugasan, atau dokumen belum lengkap.',
    before: ['Pastikan profil, unit, grade, dan penempatan sudah benar.', 'Siapkan memo/disposisi/percakapan penugasan.', 'Tentukan Pemberi Tugas, tanggal, tujuan, transportasi, dan kebutuhan DP.'],
    steps: [
      { action: 'Periksa Profil Saya', detail: 'Grade dan penempatan memengaruhi pagu, jarak, serta alur persetujuan. Jika salah, minta Admin Portal memperbaikinya.' },
      { action: 'Siapkan titik tujuan yang tepat', detail: 'Gunakan alamat/lokasi tujuan sebenarnya. Titik ini dipakai untuk wilayah, jarak, dan absensi GPS.' },
      { action: 'Siapkan lampiran penugasan', detail: 'Gunakan dokumen yang menjelaskan alasan Anda ditugaskan.', result: 'Semua informasi siap ketika form BTO dibuka.' },
    ],
  },
  {
    label: 'Buat BTO',
    title: 'Mengisi pengajuan perjalanan dinas',
    location: 'Pengajuan Dinas → Ajukan Dinas Baru',
    purpose: 'Membuat Business Travel Order (BTO) sebagai dasar seluruh proses perjalanan.',
    before: ['Klik Ajukan Dinas Baru.', 'Jangan menebak data wajib; gunakan informasi penugasan yang sudah disiapkan.'],
    steps: [
      { action: 'Isi tujuan dan pilih titik pada peta', detail: 'Masukkan nama/alamat tujuan lalu pastikan pin berada pada lokasi yang benar.', result: 'Wilayah dan jarak perjalanan dapat dihitung sistem.' },
      { action: 'Isi waktu perjalanan', detail: 'Tentukan estimasi berangkat, kembali, serta durasi hari/jam/menit.' },
      { action: 'Pilih moda transportasi', detail: 'Gunakan pilihan yang sesuai rencana perjalanan.' },
      { action: 'Pilih Pemberi Tugas', detail: 'Pilih orang yang benar-benar memberikan atau mengetahui penugasan Anda.' },
      { action: 'Isi kepentingan dan barang bawaan', detail: 'Tuliskan maksud perjalanan secara spesifik, bukan hanya “dinas”.' },
      { action: 'Unggah lampiran penugasan', detail: 'Lampirkan memo, disposisi, atau bukti penugasan yang dapat dibaca.' },
      { action: 'Simpan Draft bila belum final', detail: 'Klik Simpan Draft untuk melanjutkan nanti.', result: 'BTO berstatus Draft dan masih dapat diedit atau dihapus.' },
    ],
    problems: [{ problem: 'Tujuan atau pagu tidak muncul', solution: 'Periksa titik peta, tanggal, grade, penempatan, serta koneksi internet.' }],
  },
  {
    label: 'DP / panjar',
    title: 'Menentukan kebutuhan dana muka',
    location: 'Form BTO → bagian Panjar / DP',
    purpose: 'Menyatakan apakah perusahaan perlu memberikan dana sebelum perjalanan.',
    steps: [
      { action: 'Pilih apakah membutuhkan DP', detail: 'Aktifkan opsi panjar hanya jika membutuhkan dana muka.' },
      { action: 'Jika memakai DP, isi rincian biaya', detail: 'Isi setiap komponen, jumlah hari, dan nilai sesuai kebutuhan serta pagu. Untuk luar negeri, periksa mata uang dan kurs.' },
      { action: 'Periksa total DP', detail: 'Pastikan total bukan nol dan tidak ada komponen ganda atau salah jumlah hari.' },
      { action: 'Jika tanpa DP, lanjutkan tanpa rincian', detail: 'Saat submit, konfirmasikan bahwa perjalanan memang tidak membutuhkan panjar.', result: 'Dengan DP masuk Review Admin DP; tanpa DP langsung menuju Pemberi Tugas.' },
    ],
    problems: [{ problem: 'Nilai ditolak atau ditandai melebihi pagu', solution: 'Periksa komponen, jumlah hari, grade, wilayah tujuan, dan kebijakan biaya sebelum mengubah nilai.' }],
  },
  {
    label: 'Kirim & pantau',
    title: 'Mengirim BTO dan memahami status',
    location: 'Form BTO → Submit BTO; lalu Pengajuan Dinas → buka detail BTO',
    purpose: 'Mengirim pengajuan dan mengetahui siapa yang sedang menanganinya.',
    steps: [
      { action: 'Klik Submit BTO', detail: 'Baca ringkasan dan konfirmasi pengajuan.', result: 'Nomor BTO dibuat dan data terkunci selama proses persetujuan.' },
      { action: 'Pantau status pada daftar/detail', detail: 'Dengan DP: Review Admin DP → Pemberi Tugas → SDM. Tanpa DP: Pemberi Tugas → SDM.' },
      { action: 'Tunggu penerbitan SPDK', detail: 'Setelah SDM setuju, Admin menerbitkan SPDK dan Kabag memberi persetujuan akhir.' },
      { action: 'Baca Riwayat Persetujuan', detail: 'Detail BTO mencatat keputusan dan catatan setiap petugas.' },
    ],
  },
  {
    label: 'Revisi / batal',
    title: 'Menindaklanjuti revisi atau membatalkan pengajuan',
    location: 'Pengajuan Dinas → BTO berstatus Revisi → buka detail',
    purpose: 'Mengembalikan pengajuan ke antrean setelah ada data yang harus diperbaiki.',
    steps: [
      { action: 'Baca Catatan Revisi', detail: 'Cari bagian yang menyebut data, komponen biaya, atau lampiran yang harus diperbaiki.' },
      { action: 'Edit hanya bagian yang diminta', detail: 'Pada Revisi DP, perbaiki BTO/DP. Pada Revisi BTE, perbaiki realisasi atau lampiran.' },
      { action: 'Klik Submit Kembali', detail: 'Periksa ulang sebelum mengirim.', result: 'BTO kembali ke antrean petugas yang meminta revisi.' },
      { action: 'Gunakan Batalkan bila perjalanan tidak jadi', detail: 'Pembatalan mandiri hanya tersedia pada tahap awal tertentu dan alasan wajib diisi.' },
    ],
    problems: [{ problem: 'Tombol edit/batal tidak tersedia', solution: 'Tahap pengajuan sudah melewati batas perubahan mandiri. Hubungi Admin MeeTrip.' }],
  },
  {
    label: 'SPDK & GPS',
    title: 'Mengunduh SPDK dan melakukan absen',
    location: 'Pengajuan Dinas → detail BTO → tab SPDK & GPS',
    purpose: 'Membuktikan kedatangan di tujuan setelah SPDK aktif.',
    before: ['Status harus SPDK Aktif (ACTIVE).', 'Aktifkan GPS dan izin lokasi browser.', 'Lakukan absen saat sudah berada di sekitar titik tujuan.'],
    steps: [
      { action: 'Buka tab SPDK & GPS', detail: 'Periksa nomor SPDK, titik tujuan, tautan peta (link ke Google Maps), dan radius absen yang ditentukan sistem.' },
      { action: 'Unduh SPDK bila diperlukan', detail: 'Gunakan tombol dokumen SPDK yang tersedia pada detail. Dokumen dapat dicetak atau disimpan sebagai arsip.' },
      { action: 'Periksa posisi Anda pada peta', detail: 'Klik tautan peta untuk membuka lokasi tujuan di Google Maps. Bandingkan dengan posisi Anda saat ini.' },
      { action: 'Klik Absen Sekarang', detail: 'Izinkan browser membaca lokasi perangkat. Sistem membandingkan posisi GPS Anda dengan titik tujuan.', result: 'Jika berada dalam radius, status berubah menjadi Sudah Absen (ATTENDED).' },
    ],
    problems: [
      { problem: 'Lokasi tidak terbaca', solution: 'Aktifkan izin lokasi pada browser dan pastikan GPS perangkat menyala. Muat ulang halaman jika perlu.' },
      { problem: 'Di luar radius padahal sudah di lokasi', solution: 'Periksa titik tujuan pada peta. Jika kondisi sah dan Anda benar-benar di lokasi, hubungi Admin untuk verifikasi atau override manual.' },
      { problem: 'Tombol Absen tidak muncul', solution: 'Pastikan status BTO sudah ACTIVE. Absen hanya tersedia setelah Kabag menyetujui SPDK.' },
    ],
  },
  {
    label: 'Ajukan BTE',
    title: 'Mengisi realisasi dan pertanggungjawaban',
    location: 'Detail BTO → tab Realisasi BTE & Lampiran',
    purpose: 'Mencatat biaya aktual serta mengunggah bukti setelah perjalanan dilakukan.',
    before: ['Absensi sudah berhasil (status ATTENDED).', 'Siapkan laporan perjalanan dalam format PDF.', 'Siapkan kuitansi/bukti bayar dalam format PDF, JPG, atau PNG.'],
    steps: [
      { action: 'Isi realisasi setiap komponen', detail: 'Masukkan nilai aktual berdasarkan pengeluaran sebenarnya, bukan menyalin DP tanpa pemeriksaan.' },
      { action: 'Tambahkan biaya lain-lain bila sah', detail: 'Isi nilai dan keterangannya agar Admin memahami alasan biaya tambahan.' },
      { action: 'Unggah kuitansi dan bukti bayar', detail: 'Gunakan format PDF, JPG, atau PNG. Pastikan file terbaca jelas dan sesuai dengan komponen biaya.', result: 'File tercantum pada daftar lampiran BTE.' },
      { action: 'Unggah laporan perjalanan', detail: 'Upload laporan dalam format PDF. Laporan harus menjelaskan kegiatan selama perjalanan dinas.' },
      { action: 'Klik Simpan DRAFT BTE bila belum final', detail: 'Gunakan draft jika angka atau dokumen belum lengkap. Draft dapat diedit kapan saja.' },
      { action: 'Klik Simpan & Ajukan Klaim BTE', detail: 'Kirim setelah semua nilai dan lampiran diperiksa. BTE yang sudah diajukan tidak dapat diedit kecuali diminta revisi.', result: 'Status menjadi Review Admin BTE.' },
    ],
    problems: [
      { problem: 'BTE tidak dapat diajukan', solution: 'Pastikan sudah absen (ATTENDED), semua rincian tersimpan, laporan PDF dan kuitansi sudah diunggah.' },
      { problem: 'File ditolak saat upload', solution: 'Periksa ukuran dan format file. Gunakan PDF, JPG, atau PNG dengan ukuran sesuai batas sistem.' },
    ],
  },
  {
    label: 'Sampai selesai',
    title: 'Memantau review dan pembayaran akhir',
    location: 'Pengajuan Dinas / Riwayat Selesai-Batal → buka detail BTO',
    purpose: 'Memastikan klaim benar-benar selesai, bukan hanya sudah diajukan.',
    steps: [
      { action: 'Pantau Review Admin BTE', detail: 'Jika muncul Revisi BTE, baca catatan, perbaiki angka atau dokumen, lalu ajukan kembali.' },
      { action: 'Pantau status Pembayaran BTE', detail: 'Admin menyelesaikan kekurangan bayar, pengembalian sisa DP, atau kondisi nihil.' },
      { action: 'Pastikan status Selesai', detail: 'Setelah Admin mengonfirmasi pembayaran, BTO berubah menjadi COMPLETED.', result: 'Perjalanan tersedia pada Riwayat Selesai/Batal beserta dokumennya.' },
    ],
  },
];

const GUIDES: Record<MeetripGuideTopic, Guide> = {
  'user-submission': { role: 'User / Karyawan', title: 'Perjalanan dinas dari pengajuan sampai selesai', summary: 'Ikuti bab secara berurutan. Alur utama: BTO → persetujuan → SPDK aktif → absen GPS → BTE → pembayaran → selesai.', chapters: USER_CHAPTERS },
  'pemberi-tugas-review': {
    role: 'Pemberi Tugas', title: 'Meninjau BTO karyawan', summary: 'Periksa dasar penugasan dan rencana perjalanan sebelum meneruskan BTO ke SDM.', chapters: [
      { label: 'Buka antrean', title: 'Menemukan BTO yang membutuhkan keputusan', location: 'Manajemen Dinas → Butuh Persetujuan → tab Tinjau BTO', purpose: 'Menampilkan BTO berstatus PT_REVIEW yang memilih Anda sebagai Pemberi Tugas.', steps: [{ action: 'Buka tab Tinjau BTO', detail: 'Gunakan pencarian nomor BTO, pelaksana, atau tujuan bila antrean panjang.' }, { action: 'Klik Tinjau & Setujui', detail: 'Detail pengajuan dan riwayat persetujuan akan terbuka.' }], problems: [{ problem: 'Antrean kosong', solution: 'Pastikan pengajuan sudah mencapai PT_REVIEW dan nama Anda dipilih sebagai Pemberi Tugas.' }] },
      { label: 'Periksa BTO', title: 'Memeriksa isi pengajuan', location: 'Butuh Persetujuan → detail BTO', purpose: 'Memastikan perjalanan benar-benar ditugaskan dan datanya masuk akal.', steps: [{ action: 'Periksa pelaksana dan unit', detail: 'Pastikan orang yang mengajukan memang pelaksana tugas.' }, { action: 'Periksa tujuan, tanggal, dan kepentingan', detail: 'Cocokkan dengan kebutuhan pekerjaan.' }, { action: 'Buka lampiran penugasan', detail: 'Pastikan dokumen dapat dibaca dan mendukung pengajuan.' }, { action: 'Periksa DP bila ada', detail: 'Tinjau komponen dan total dana muka serta catatan Admin DP.' }] },
      { label: 'Beri keputusan', title: 'Menyetujui atau menolak BTO', location: 'Detail BTO → Setujui & Approve / Tolak', purpose: 'Meneruskan BTO yang sah atau menghentikan pengajuan yang tidak sesuai.', steps: [{ action: 'Pilih keputusan', detail: 'Klik Setujui & Approve bila sesuai, atau Tolak bila perjalanan tidak dapat diteruskan.' }, { action: 'Isi catatan', detail: 'Tuliskan dasar persetujuan atau alasan penolakan secara spesifik.' }, { action: 'Klik Konfirmasi', detail: 'Periksa tindakan sebelum mengirim.', result: 'Setuju → SDM_REVIEW. Tolak → REJECTED.' }] },
    ]
  },
  'sdm-review': {
    role: 'SDM', title: 'Verifikasi organisasi sebelum penerbitan SPDK', summary: 'SDM memeriksa kelengkapan dan kesesuaian perjalanan setelah Pemberi Tugas menyetujui.', chapters: [
      { label: 'Buka antrean', title: 'Menemukan pengajuan SDM Review', location: 'Manajemen Dinas → Persetujuan SDM', purpose: 'Menampilkan BTO berstatus SDM_REVIEW.', steps: [{ action: 'Cari BTO', detail: 'Gunakan nomor BTO, tujuan, atau nama pelaksana.' }, { action: 'Buka detail', detail: 'Klik aksi pada baris pengajuan untuk melihat data lengkap.' }], problems: [{ problem: 'BTO milik sendiri', solution: 'SDM tidak boleh menyetujui pengajuan sendiri; minta pengguna SDM lain menanganinya.' }] },
      { label: 'Verifikasi', title: 'Memeriksa kelengkapan dan riwayat', location: 'Persetujuan SDM → Detail Persetujuan SDM', purpose: 'Memastikan perjalanan layak diteruskan menjadi SPDK.', steps: [{ action: 'Periksa identitas, unit, tujuan, dan periode', detail: 'Pastikan data konsisten dengan kebutuhan organisasi.' }, { action: 'Periksa Pemberi Tugas dan lampiran', detail: 'Pastikan penugasan sah dan dokumen dapat dibaca.' }, { action: 'Periksa DP dan riwayat', detail: 'Baca keputusan Admin DP serta Pemberi Tugas.' }] },
      { label: 'Beri keputusan', title: 'Menyetujui atau menolak sebagai SDM', location: 'Detail → Setujui SDM / Tolak', purpose: 'Meneruskan pengajuan ke penerbitan SPDK atau menghentikannya.', steps: [{ action: 'Klik Setujui SDM atau Tolak', detail: 'Pilih berdasarkan hasil verifikasi.' }, { action: 'Isi catatan wajib', detail: 'Jelaskan dasar tindakan.' }, { action: 'Konfirmasi', detail: 'Kirim keputusan setelah data diperiksa.', result: 'Setuju → SPDK_DRAFT. Tolak → REJECTED.' }] },
    ]
  },
  'kabag-review': {
    role: 'Kabag / Approver SPDK', title: 'Persetujuan akhir sebelum SPDK aktif', summary: 'Kabag memeriksa dokumen resmi yang diterbitkan Admin sebelum user dapat menjalankan perjalanan dan absen.', chapters: [
      { label: 'Buka antrean', title: 'Menemukan SPDK yang menunggu keputusan', location: 'Manajemen Dinas → Butuh Persetujuan → tab Tinjau SPDK', purpose: 'Menampilkan SPDK berstatus KABAG_REVIEW.', steps: [{ action: 'Buka tab Tinjau SPDK', detail: 'Cari berdasarkan nomor SPDK/BTO, pelaksana, atau tujuan.' }, { action: 'Buka rincian', detail: 'Klik aksi untuk memeriksa dokumen dan riwayat.' }], problems: [{ problem: 'Tidak ada antrean', solution: 'SPDK mungkin belum diterbitkan atau sudah auto-approved karena Pemberi Tugas dan approver adalah orang yang sama.' }] },
      { label: 'Periksa SPDK', title: 'Memeriksa dokumen sebelum aktivasi', location: 'Butuh Persetujuan → detail SPDK', purpose: 'Memastikan dokumen resmi cocok dengan BTO yang disetujui.', steps: [{ action: 'Periksa nomor, pelaksana, tujuan, dan periode', detail: 'Pastikan tidak ada perbedaan dengan BTO.' }, { action: 'Periksa transportasi, barang, dan kepentingan', detail: 'Pastikan data operasional sudah final.' }, { action: 'Baca riwayat persetujuan', detail: 'Pastikan Pemberi Tugas, SDM, dan Admin sudah menjalankan tahapnya.' }] },
      { label: 'Beri keputusan', title: 'Mengaktifkan atau menolak SPDK', location: 'Detail → Setujui & Approve / Tolak', purpose: 'Memberikan keputusan akhir perjalanan.', steps: [{ action: 'Pilih keputusan', detail: 'Setujui bila dokumen benar; tolak bila perjalanan tidak dapat dijalankan.' }, { action: 'Isi catatan lalu konfirmasi', detail: 'Catatan harus menjelaskan keputusan.', result: 'Setuju → ACTIVE dan user dapat absen. Tolak → REJECTED.' }] },
    ]
  },
  'admin-dp': {
    role: 'Admin MeeTrip', title: 'Review DP / panjar', summary: 'Periksa rincian dana muka, pagu, dan hubungan biaya dengan tujuan serta durasi perjalanan.', chapters: [
      { label: 'Buka antrean', title: 'Menemukan BTO yang memakai DP', location: 'Manajemen Dinas → Persetujuan DP', purpose: 'Menampilkan BTO berstatus ADMIN_DP_REVIEW.', steps: [{ action: 'Cari pengajuan', detail: 'Gunakan nomor BTO, pelaksana, atau tujuan.' }, { action: 'Klik Tinjau DP', detail: 'Buka detail perjalanan dan rincian dana muka.' }] },
      { label: 'Periksa biaya', title: 'Memverifikasi rencana panjar', location: 'Persetujuan DP → detail BTO/DP', purpose: 'Memastikan nilai dapat dipertanggungjawabkan sebelum diteruskan.', steps: [{ action: 'Cocokkan tujuan, wilayah, tanggal, dan durasi', detail: 'Data ini menentukan komponen serta jumlah hari.' }, { action: 'Periksa setiap komponen', detail: 'Bandingkan nilai, jumlah hari, kurs, dan batas pagu; jangan hanya melihat total.' }, { action: 'Periksa lampiran dan kepentingan', detail: 'Pastikan biaya berhubungan dengan penugasan.' }] },
      { label: 'Beri keputusan', title: 'Setujui, minta revisi, atau tolak', location: 'Detail DP → tombol keputusan', purpose: 'Menentukan kelanjutan pengajuan.', steps: [{ action: 'Pilih tindakan', detail: 'Setujui DP, Minta Revisi, atau Tolak DP.' }, { action: 'Isi catatan yang dapat ditindaklanjuti', detail: 'Untuk revisi, sebutkan komponen dan nilai yang harus diperbaiki.' }, { action: 'Konfirmasi tindakan', detail: 'Periksa kembali keputusan.', result: 'Setuju → PT_REVIEW. Revisi → REVISION_DP. Tolak → REJECTED.' }] },
    ]
  },
  'admin-spdk': {
    role: 'Admin MeeTrip', title: 'Menerbitkan SPDK', summary: 'Lengkapi dokumen resmi setelah Pemberi Tugas dan SDM menyetujui BTO.', chapters: [
      { label: 'Buka antrean', title: 'Menemukan draft SPDK', location: 'Manajemen Dinas → Penerbitan SPDK', purpose: 'Menampilkan BTO berstatus SPDK_DRAFT.', steps: [{ action: 'Pilih BTO', detail: 'Cari nomor BTO, pelaksana, atau tujuan.' }, { action: 'Buka form penerbitan', detail: 'Periksa data BTO dan field dokumen.' }] },
      { label: 'Lengkapi dokumen', title: 'Memeriksa isi SPDK', location: 'Penerbitan SPDK → detail/form SPDK', purpose: 'Mencegah dokumen resmi terbit dengan data salah.', steps: [{ action: 'Periksa nomor dan identitas', detail: 'Cocokkan nomor BTO, pelaksana, dan Pemberi Tugas.' }, { action: 'Periksa tujuan dan periode', detail: 'Pastikan tanggal, tujuan, dan transportasi sudah final.' }, { action: 'Periksa barang dan job description', detail: 'Gunakan uraian kepentingan yang jelas.' }] },
      { label: 'Terbitkan', title: 'Menerbitkan dan mengirim SPDK', location: 'Form SPDK → Terbitkan & Kirim SPDK', purpose: 'Mengirim dokumen ke Kabag atau mengaktifkannya melalui auto-approval yang sah.', steps: [{ action: 'Isi catatan', detail: 'Tambahkan keterangan penerbitan bila diperlukan.' }, { action: 'Klik Terbitkan & Kirim SPDK', detail: 'SPDK hanya dapat diterbitkan satu kali untuk satu BTO.', result: 'Normal → KABAG_REVIEW. Approver sama dengan Pemberi Tugas → ACTIVE otomatis.' }, { action: 'Gunakan Tolak Pengajuan bila tidak dapat diterbitkan', detail: 'Isi alasan yang jelas.', result: 'Status menjadi REJECTED.' }] },
    ]
  },
  'admin-bte': {
    role: 'Admin MeeTrip', title: 'Review realisasi BTE', summary: 'Bandingkan biaya aktual dengan DP dan verifikasi seluruh bukti sebelum pembayaran.', chapters: [
      { label: 'Buka antrean', title: 'Menemukan BTE yang menunggu review', location: 'Manajemen Dinas → Persetujuan BTE', purpose: 'Menampilkan BTE berstatus ADMIN_BTE_REVIEW.', steps: [{ action: 'Pilih item Menunggu Review', detail: 'Cari nomor BTO/SPDK, pelaksana, atau tujuan.' }, { action: 'Buka rincian BTE', detail: 'Tampilkan perbandingan DP, realisasi, dan lampiran.' }] },
      { label: 'Verifikasi', title: 'Memeriksa angka dan dokumen', location: 'Persetujuan BTE → detail realisasi', purpose: 'Memastikan klaim sesuai perjalanan dan didukung bukti.', steps: [{ action: 'Bandingkan DP dan realisasi per komponen', detail: 'Periksa selisih, biaya lain-lain, dan keterangannya.' }, { action: 'Buka kuitansi/bukti bayar', detail: 'Pastikan file terbaca dan nominalnya relevan.' }, { action: 'Buka laporan perjalanan', detail: 'Pastikan laporan sesuai tujuan dan pelaksanaan dinas.' }] },
      { label: 'Beri keputusan', title: 'Setujui, revisi, atau tolak BTE', location: 'Detail BTE → tombol keputusan', purpose: 'Meneruskan klaim ke pembayaran atau mengembalikannya untuk diperbaiki.', steps: [{ action: 'Pilih tindakan', detail: 'Setujui & Approve BTE, Minta Revisi, atau Tolak BTE.' }, { action: 'Isi catatan', detail: 'Untuk revisi, sebutkan angka atau dokumen yang harus diperbaiki.' }, { action: 'Konfirmasi', detail: 'Periksa kembali sebelum mengirim.', result: 'Setuju → BTE_PAYMENT. Revisi → REVISION_BTE. Tolak → REJECTED.' }] },
    ]
  },
  'admin-payment': {
    role: 'Admin MeeTrip', title: 'Menutup pembayaran BTE', summary: 'Konfirmasi hanya setelah transfer, pengembalian dana, atau kondisi nihil benar-benar selesai.', chapters: [
      { label: 'Periksa selisih', title: 'Menentukan penyelesaian pembayaran', location: 'Manajemen Dinas → Menunggu Pencairan', purpose: 'Memastikan pihak yang harus membayar dan nilai akhirnya benar.', steps: [{ action: 'Buka BTE berstatus BTE_PAYMENT', detail: 'Periksa DP, total BTE, dan selisih.' }, { action: 'Tentukan jenis penyelesaian', detail: 'BTE > DP: perusahaan membayar kekurangan. BTE < DP: karyawan mengembalikan sisa. Sama: nihil.' }, { action: 'Pastikan transaksi sudah terjadi', detail: 'Jangan konfirmasi berdasarkan rencana transfer.' }] },
      { label: 'Konfirmasi akhir', title: 'Mengubah perjalanan menjadi selesai', location: 'Detail pembayaran → Konfirmasi Bayar', purpose: 'Menutup proses perjalanan setelah kewajiban finansial selesai.', steps: [{ action: 'Klik Konfirmasi Bayar', detail: 'Baca ringkasan pada modal.' }, { action: 'Pilih konfirmasi yang sesuai', detail: 'Gunakan Sudah Ditransfer, Dana Diterima, atau Ya, Selesai sesuai kondisi.' }, { action: 'Konfirmasi tindakan', detail: 'Tindakan akhir tidak dapat dibatalkan melalui UI.', result: 'Status menjadi COMPLETED dan masuk Riwayat Selesai/Batal.' }] },
    ]
  },
  'admin-bte-payment': { role: 'Admin MeeTrip', title: 'BTE dan pembayaran sampai selesai', summary: 'Panduan gabungan untuk memeriksa klaim, meminta revisi bila perlu, lalu menyelesaikan selisih pembayaran.', chapters: [] },
};

GUIDES['admin-bte-payment'].chapters = [...GUIDES['admin-bte'].chapters, ...GUIDES['admin-payment'].chapters];

function GuideContent({ topic }: { topic: MeetripGuideTopic }) {
  const [chapterIndex, setChapterIndex] = useState(0);
  const guide = GUIDES[topic];
  const chapter = guide.chapters[chapterIndex];
  useEffect(() => setChapterIndex(0), [topic]);

  return <div className="flex h-[min(720px,calc(100dvh-9rem))] min-h-[480px] flex-col overflow-hidden rounded-lg border border-slate-200 dark:border-slate-800">
    <header className="shrink-0 border-b border-slate-200 px-4 py-4 dark:border-slate-800 sm:px-5"><p className="text-xs font-semibold text-teal-700 dark:text-teal-400">{guide.role}</p><h2 className="mt-0.5 text-lg font-bold text-slate-950 dark:text-white">{guide.title}</h2><p className="mt-1 max-w-3xl text-xs leading-5 text-slate-600 dark:text-slate-400">{guide.summary}</p></header>
    <div className="min-h-0 flex flex-1 flex-col md:flex-row">
      <nav aria-label="Daftar bab" className="shrink-0 border-b border-slate-200 bg-slate-50 p-2 dark:border-slate-800 dark:bg-slate-950/60 md:w-56 md:border-b-0 md:border-r md:p-3"><p className="hidden px-3 pb-2 text-[11px] font-semibold uppercase tracking-wide text-slate-500 md:block">Pilih tahap</p><div className="flex gap-1 overflow-x-auto md:block md:space-y-1">{guide.chapters.map((item, index) => <button key={`${item.label}-${index}`} type="button" onClick={() => setChapterIndex(index)} className={`shrink-0 rounded-md px-3 py-2 text-left text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-teal-500/25 md:w-full ${index === chapterIndex ? 'bg-teal-600 text-white shadow-neu-sm dark:bg-teal-500 dark:text-slate-950' : 'text-slate-600 hover:bg-teal-500/10 hover:text-teal-700 dark:text-slate-300 dark:hover:bg-teal-500/10 dark:hover:text-teal-400'}`}>{index + 1}. {item.label}</button>)}</div></nav>
      <main className="min-h-0 flex-1 overflow-y-auto px-4 py-5 sm:px-7 sm:py-6"><div className="mx-auto max-w-3xl"><p className="text-xs font-semibold text-slate-500">Tahap {chapterIndex + 1} dari {guide.chapters.length}</p><h3 className="mt-1 text-xl font-bold tracking-tight text-slate-950 dark:text-white">{chapter.title}</h3><p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">{chapter.purpose}</p>
        <div className="mt-5 flex items-start gap-3 border-y border-slate-200 py-3 dark:border-slate-800"><MapPin className="mt-0.5 h-4 w-4 shrink-0 text-teal-600" /><div><p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Lokasi di aplikasi</p><p className="mt-0.5 text-sm font-semibold text-slate-900 dark:text-white">{chapter.location}</p></div></div>
        {chapter.before && <section className="mt-6"><h4 className="text-sm font-bold text-slate-900 dark:text-white">Sebelum mulai</h4><ul className="mt-2 space-y-1.5">{chapter.before.map(item => <li key={item} className="flex gap-2 text-sm leading-5 text-slate-600 dark:text-slate-300"><Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />{item}</li>)}</ul></section>}
        <section className="mt-7"><h4 className="text-sm font-bold text-slate-900 dark:text-white">Langkah penggunaan</h4><ol className="mt-4">{chapter.steps.map((step, index) => <li key={`${step.action}-${index}`} className="relative grid grid-cols-[2rem_1fr] gap-3 pb-6 last:pb-0"><div className="relative flex justify-center"><span className="relative z-10 flex h-7 w-7 items-center justify-center rounded-full border border-teal-500/40 bg-teal-500/10 text-xs font-bold text-teal-700 dark:border-teal-500/30 dark:text-teal-400">{index + 1}</span>{index < chapter.steps.length - 1 && <span className="absolute bottom-0 top-7 w-px bg-teal-500/20" />}</div><div><p className="text-sm font-bold text-slate-900 dark:text-white">{step.action}</p><p className="mt-1 text-sm leading-6 text-slate-600 dark:text-slate-300">{step.detail}</p>{step.result && <p className="mt-2 border-l-2 border-emerald-500 pl-3 text-xs leading-5 text-slate-600 dark:text-slate-400"><span className="font-semibold text-emerald-700 dark:text-emerald-400">Hasil:</span> {step.result}</p>}</div></li>)}</ol></section>
        {chapter.problems && <section className="mt-8 border-t border-slate-200 pt-6 dark:border-slate-800"><h4 className="flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-white"><AlertTriangle className="h-4 w-4 text-amber-600" />Jika terjadi masalah</h4><dl className="mt-3 divide-y divide-slate-200 border-y border-slate-200 dark:divide-slate-800 dark:border-slate-800">{chapter.problems.map(item => <div key={item.problem} className="py-3"><dt className="text-xs font-semibold text-slate-900 dark:text-white">{item.problem}</dt><dd className="mt-1 text-xs leading-5 text-slate-600 dark:text-slate-400">{item.solution}</dd></div>)}</dl></section>}
      </div></main>
    </div>
    <footer className="flex shrink-0 items-center justify-between border-t border-slate-200 px-4 py-3 dark:border-slate-800"><button type="button" disabled={chapterIndex === 0} onClick={() => setChapterIndex(value => value - 1)} className="inline-flex items-center gap-1 rounded-md px-3 py-2 text-xs font-semibold text-teal-700 hover:bg-teal-500/10 disabled:invisible dark:text-teal-400"><ChevronLeft className="h-4 w-4" />Sebelumnya</button><span className="text-[11px] text-slate-500">{chapterIndex + 1} / {guide.chapters.length}</span><button type="button" disabled={chapterIndex === guide.chapters.length - 1} onClick={() => setChapterIndex(value => value + 1)} className="inline-flex items-center gap-1 rounded-md bg-teal-600 px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-teal-700 disabled:invisible dark:bg-teal-500 dark:text-slate-950 dark:hover:bg-teal-600"><span>Berikutnya</span><ChevronRight className="h-4 w-4" /></button></footer>
  </div>;
}

export function MeetripHelpButton({ topic, label = 'Bantuan', className = '' }: { topic: MeetripGuideTopic; label?: string; className?: string }) {
  const [open, setOpen] = useState(false);
  return <><Button type="button" variant="primary" onClick={() => setOpen(true)} className={`gap-2 ${className}`}><HelpCircle className="h-4 w-4" />{label}</Button><Modal isOpen={open} onClose={() => setOpen(false)} title="Panduan penggunaan MeeTrip" widthClassName="max-w-6xl"><GuideContent topic={topic} /></Modal></>;
}

type HelpLink = { topic: MeetripGuideTopic; title: string; description: string; icon: ElementType };
export function MeetripDashboardHelp({ isAdmin, isSdm = false, isKabag = false, isPemberiTugas = false }: { isAdmin: boolean; isSdm?: boolean; isKabag?: boolean; isPemberiTugas?: boolean }) {
  const [topic, setTopic] = useState<MeetripGuideTopic | null>(null);
  const links: HelpLink[] = isAdmin ? [
    { topic: 'admin-dp', title: '1. Review DP', description: 'Periksa panjar dan pagu.', icon: CircleDollarSign },
    { topic: 'admin-spdk', title: '2. Terbitkan SPDK', description: 'Lengkapi dokumen resmi.', icon: FileSignature },
    { topic: 'admin-bte-payment', title: '3. BTE & pembayaran', description: 'Review klaim sampai selesai.', icon: ReceiptText },
  ] : [
    { topic: 'user-submission', title: 'Ajukan perjalanan dinas', description: 'BTO sampai BTE selesai.', icon: FilePlus2 },
    ...(isPemberiTugas ? [{ topic: 'pemberi-tugas-review' as const, title: 'Tugas sebagai Pemberi Tugas', description: 'Putuskan pengajuan BTO.', icon: ClipboardCheck }] : []),
    ...(isSdm ? [{ topic: 'sdm-review' as const, title: 'Tugas sebagai SDM', description: 'Verifikasi sebelum SPDK.', icon: ShieldCheck }] : []),
    ...(isKabag ? [{ topic: 'kabag-review' as const, title: 'Tugas sebagai Kabag', description: 'Persetujuan akhir SPDK.', icon: FileSignature }] : []),
  ];
  return <><section className="border-y border-teal-500/25 py-5"><div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between"><div className="max-w-md"><div className="flex items-center gap-2"><HelpCircle className="h-4 w-4 text-teal-600 dark:text-teal-400" /><p className="text-xs font-semibold text-slate-900 dark:text-white">Panduan penggunaan</p></div><p className="mt-1.5 text-xs leading-5 text-slate-500 dark:text-slate-400">Pilih pekerjaan yang akan dilakukan. Panduan menunjukkan lokasi menu, urutan klik, dan hasil setiap tindakan.</p></div><div className={`grid w-full gap-2 ${links.length >= 3 ? 'sm:grid-cols-3' : 'sm:grid-cols-2'} lg:max-w-3xl`}>{links.map(link => { const Icon = link.icon; return <button key={link.topic} type="button" onClick={() => setTopic(link.topic)} className="flex items-start gap-3 rounded-lg border border-teal-500/25 bg-surface-card p-3 text-left transition-colors hover:border-teal-500/60 hover:bg-teal-500/5 focus:outline-none focus:ring-2 focus:ring-teal-500/20 dark:hover:bg-teal-500/10 shadow-neu"><Icon className="mt-0.5 h-4 w-4 shrink-0 text-teal-600 dark:text-teal-400" /><span><span className="block text-xs font-semibold text-slate-900 dark:text-white">{link.title}</span><span className="mt-1 block text-[11px] leading-4 text-slate-500 dark:text-slate-400">{link.description}</span></span></button>; })}</div></div></section><Modal isOpen={topic !== null} onClose={() => setTopic(null)} title="Panduan penggunaan MeeTrip" widthClassName="max-w-6xl">{topic && <GuideContent topic={topic} />}</Modal></>;
}
