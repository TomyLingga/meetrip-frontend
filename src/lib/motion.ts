import type { Transition, Variants } from 'motion/react';

/**
 * Token gerak bersama untuk MeeTrip — disetarakan dengan portal-fe
 * (`app/components/motion/Animated.tsx`) agar kedua aplikasi terasa satu sistem.
 * Kurva easing "smooth" yang sama, durasi standar yang sama.
 */
export const SMOOTH_EASE = [0.22, 1, 0.36, 1] as const;

export const DURATION = {
  fast: 0.18,
  base: 0.28,
  slow: 0.38,
} as const;

/** Transisi standar untuk elemen yang muncul/hilang. */
export const smoothTransition: Transition = {
  duration: DURATION.base,
  ease: SMOOTH_EASE,
};

/** Varian fade + naik halus — dipakai kartu, section, list item. */
export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: DURATION.slow, ease: SMOOTH_EASE } },
};

/** Container stagger untuk memunculkan anak-anaknya berurutan. */
export const staggerContainer = (stagger = 0.06, delay = 0): Variants => ({
  hidden: {},
  show: { transition: { delayChildren: delay, staggerChildren: stagger } },
});

/** Enter/exit untuk panel modal (dipakai Modal + AnimatePresence). */
export const modalPanel: Variants = {
  hidden: { opacity: 0, y: 12, scale: 0.97 },
  show: { opacity: 1, y: 0, scale: 1, transition: { duration: DURATION.base, ease: SMOOTH_EASE } },
  exit: { opacity: 0, y: 8, scale: 0.98, transition: { duration: DURATION.fast, ease: 'easeIn' } },
};

/** Enter/exit untuk backdrop modal. */
export const backdrop: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { duration: DURATION.base } },
  exit: { opacity: 0, transition: { duration: DURATION.fast } },
};

/** Enter/exit untuk panel dropdown (fade + geser sedikit). */
export const dropdownPanel: Variants = {
  hidden: { opacity: 0, y: -6, scale: 0.98 },
  show: { opacity: 1, y: 0, scale: 1, transition: { duration: DURATION.fast, ease: SMOOTH_EASE } },
  exit: { opacity: 0, y: -6, scale: 0.98, transition: { duration: 0.12, ease: 'easeIn' } },
};
