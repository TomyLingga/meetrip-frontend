'use client';

import React from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { usePathname } from 'next/navigation';
import { SMOOTH_EASE } from '@/lib/motion';

/**
 * Transisi antar halaman — disetarakan dengan portal-fe
 * (`app/components/motion/PageTransition.tsx`). Di-key ke pathname sehingga
 * setiap navigasi memutar animasi masuk/keluar yang halus.
 */
export default function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={pathname}
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10, scale: 0.99 }}
        transition={{ duration: 0.32, ease: SMOOTH_EASE }}
        className="w-full"
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
