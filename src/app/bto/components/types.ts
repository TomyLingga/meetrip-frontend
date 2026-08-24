export interface BtoItem {
  id: string;
  nomorBto: string | null;
  tujuanNama: string;
  tujuanAlamat: string | null;
  tujuanLat?: string | number;
  tujuanLng?: string | number;
  wilayahTipe: 'dalam_wilayah' | 'luar_wilayah' | 'luar_negeri' | null;
  kepentingan: string;
  status: string;
  estBerangkat: string;
  estKembali: string;
  jarakKm: string | null;
  butuhDp: boolean;
  pemberiTugasId?: string | null;
  pemberiTugasNama: string | null;
  employeeId: string;
  transportId?: string | null;
  estimasiWaktuMenit?: number | null;
  barang?: string | null;
  lampiranPath?: string | null;
  lampiranNama?: string | null;
}
