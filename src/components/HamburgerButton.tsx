import React from 'react';
import { motion } from 'motion/react';

interface HamburgerButtonProps {
  isOpen: boolean;
  onClick: () => void;
}

export default function HamburgerButton({ isOpen, onClick }: HamburgerButtonProps) {
  return (
    <button
      onClick={onClick}
      className="lg:hidden p-2 rounded-xl text-zinc-650 dark:text-zinc-300 hover:bg-rose-50/50 dark:hover:bg-zinc-800/50 hover:text-rose-600 dark:hover:text-rose-400 transition-colors focus:outline-none focus:ring-2 focus:ring-rose-500/40 relative z-50 flex flex-col justify-center items-center w-10 h-10 gap-[5px] cursor-pointer"
      aria-label={isOpen ? "Close navigation menu" : "Open navigation menu"}
      aria-expanded={isOpen}
      aria-controls="mobile-navigation-menu"
      id="hamburger-navigation-button"
    >
      <motion.span
        animate={isOpen ? { rotate: 45, y: 7 } : { rotate: 0, y: 0 }}
        transition={{ duration: 0.2, ease: 'easeInOut' }}
        className="w-5.5 h-[2px] bg-zinc-600 dark:bg-zinc-200 rounded-full origin-center"
      />
      <motion.span
        animate={isOpen ? { opacity: 0, scale: 0.8 } : { opacity: 1, scale: 1 }}
        transition={{ duration: 0.15, ease: 'easeInOut' }}
        className="w-5.5 h-[2px] bg-zinc-600 dark:bg-zinc-200 rounded-full"
      />
      <motion.span
        animate={isOpen ? { rotate: -45, y: -7 } : { rotate: 0, y: 0 }}
        transition={{ duration: 0.2, ease: 'easeInOut' }}
        className="w-5.5 h-[2px] bg-zinc-600 dark:bg-zinc-200 rounded-full origin-center"
      />
    </button>
  );
}
