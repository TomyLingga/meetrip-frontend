'use client';

import React from 'react';
import { motion, type HTMLMotionProps } from 'motion/react';
import { cn } from '@/utils/cn';
import { SMOOTH_EASE } from '@/lib/motion';

/**
 * Primitif gerak bersama — disetarakan dengan portal-fe
 * (`app/components/motion/Animated.tsx`). Pakai `StaggerContainer` sebagai
 * induk lalu `AnimatedCard`/`AnimatedSection` sebagai anak agar item muncul
 * berurutan dengan halus.
 */

export function StaggerContainer({
  children,
  className,
  delay = 0,
  stagger = 0.07,
  ...props
}: HTMLMotionProps<'div'> & { delay?: number; stagger?: number }) {
  return (
    <motion.div
      className={className}
      initial="hidden"
      animate="show"
      variants={{
        hidden: {},
        show: { transition: { delayChildren: delay, staggerChildren: stagger } },
      }}
      {...props}
    >
      {children}
    </motion.div>
  );
}

export function AnimatedSection({ children, className, ...props }: HTMLMotionProps<'section'>) {
  return (
    <motion.section
      variants={{
        hidden: { opacity: 0, y: 18 },
        show: { opacity: 1, y: 0, transition: { duration: 0.38, ease: SMOOTH_EASE } },
      }}
      className={className}
      {...props}
    >
      {children}
    </motion.section>
  );
}

export function AnimatedCard({ children, className, ...props }: HTMLMotionProps<'div'>) {
  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 18 },
        show: { opacity: 1, y: 0, transition: { duration: 0.36, ease: SMOOTH_EASE } },
      }}
      className={cn('will-change-transform', className)}
      {...props}
    >
      {children}
    </motion.div>
  );
}

/** Bungkus konten halaman agar seluruh anaknya muncul dengan stagger. */
export function AnimatedPage({ children, className, ...props }: HTMLMotionProps<'div'>) {
  return (
    <StaggerContainer className={className} delay={0.05} stagger={0.08} {...props}>
      {children}
    </StaggerContainer>
  );
}
