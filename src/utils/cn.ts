import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Gabungkan className secara kondisional lalu rapikan konflik util Tailwind.
 * Dipakai seluruh komponen bersama agar penggabungan class konsisten.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
