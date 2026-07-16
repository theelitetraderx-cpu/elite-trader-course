"use client";

import { motion } from "framer-motion";
import { BrandLogo } from "@/components/shared/brand-logo";

export function LoadingScreen() {
  return (
    <div className="fixed inset-0 bg-[#050505] flex items-center justify-center z-50">
      <div className="text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex justify-center mb-6"
        >
          <BrandLogo
            size="xl"
            imageClassName="shadow-[0_0_30px_rgba(212,175,55,0.35)] animate-pulse"
          />
        </motion.div>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.6 }}
          transition={{ delay: 0.3 }}
          className="text-[#A8A8A8] text-sm mt-2 uppercase tracking-wider"
        >
          Loading Excellence...
        </motion.p>
      </div>
    </div>
  );
}
