"use client";

import { motion } from "motion/react";

export function AllocationBar({
  percentage,
  color,
  delay = 0,
}: {
  percentage: number;
  color: string;
  delay?: number;
}) {
  return (
    <div className="h-2 overflow-hidden rounded-full bg-black/10">
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${percentage}%` }}
        transition={{ duration: 0.6, ease: "easeOut", delay }}
        className="h-full rounded-full"
        style={{ backgroundColor: color }}
      />
    </div>
  );
}
