'use client';

import Image from 'next/image';
import { motion, useReducedMotion } from 'motion/react';

const PORTFOLIO_URL = 'https://jaineysshin.com';

/** Same mark and motion as the Poster Wall: a slow 40s turn with a gentle breath. */
export default function Logo() {
  const reduce = useReducedMotion();
  return (
    <a href={PORTFOLIO_URL} className="logo" aria-label="Jaine Shin — portfolio">
      <motion.div
        className="logo-mark"
        initial={{ scale: 0.9 }}
        animate={reduce ? { rotate: 0, scale: 0.9 } : {
          rotate: [0, 45, 90, 135, 180, 225, 270, 315, 360],
          scale: [0.9, 0.95, 0.9, 0.95, 0.9, 0.95, 0.9, 0.95, 0.9],
        }}
        transition={{
          repeat: Infinity,
          duration: 40,
          ease: 'linear',
          times: [0, 0.125, 0.25, 0.375, 0.5, 0.625, 0.75, 0.875, 1],
          scale: { repeat: Infinity, duration: 4, ease: 'backInOut' },
        }}
        whileHover={{ scale: 1, rotate: 15, transition: { type: 'spring', stiffness: 100, damping: 10 } }}
      >
        <Image src="/images/logo-white.svg" alt="" fill priority draggable={false} />
      </motion.div>
    </a>
  );
}
