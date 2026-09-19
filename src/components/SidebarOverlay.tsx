import React from 'react';
import { motion } from 'motion/react';

interface SidebarOverlayProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SidebarOverlay({ isOpen, onClose }: SidebarOverlayProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2, ease: 'easeInOut' }}
      className="fixed inset-0 bg-zinc-950/40 backdrop-blur-sm z-40 lg:hidden cursor-pointer"
      onClick={onClose}
      aria-hidden="true"
      id="mobile-navigation-overlay"
    />
  );
}
