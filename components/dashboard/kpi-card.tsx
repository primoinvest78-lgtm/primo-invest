import { ArrowUpRight, type LucideIcon } from "lucide-react";
import { motion } from "motion/react";

export type KpiCardProps = {
  title: string;
  value: string;
  change: string;
  delta: number;
  icon: LucideIcon;
  accent: string;
};

export function KpiCard({ title, value, change, delta, icon: Icon, accent }: KpiCardProps) {
  return (
    <motion.article
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      whileHover={{ y: -2 }}
      className="rounded-2xl border border-white/10 bg-[#0B2238] p-4 shadow-[0_12px_28px_rgba(0,0,0,0.12)]"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-white/55">{title}</p>
          <p className="mt-3 text-[1.7rem] font-bold tracking-[-0.05em] text-white">{value}</p>
        </div>
        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/10 ${accent}`}>
          <Icon className="h-4 w-4" />
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between gap-3">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-[#18794E]/15 px-2 py-1 text-xs font-semibold text-[#7ce6a8]">
          <ArrowUpRight className="h-3.5 w-3.5" />
          {change}
        </span>
        <span className="text-[10px] font-medium uppercase tracking-[0.15em] text-white/60">
          +{delta.toFixed(delta % 1 === 0 ? 0 : 2).replace(".", ",")}%
        </span>
      </div>
    </motion.article>
  );
}
