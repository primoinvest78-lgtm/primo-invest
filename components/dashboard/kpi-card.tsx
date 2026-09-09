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
      className="rounded-2xl border border-[#DCE3EA] bg-white p-4 shadow-[0_12px_28px_rgba(7,26,45,0.03)]"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-[#64748B]">{title}</p>
          <p className="mt-3 text-[1.7rem] font-bold tracking-[-0.05em] text-[#071A2D]">{value}</p>
        </div>
        <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${accent}`}>
          <Icon className="h-4 w-4" />
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between gap-3">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-[#18794E]/8 px-2 py-1 text-xs font-semibold text-[#18794E]">
          <ArrowUpRight className="h-3.5 w-3.5" />
          {change}
        </span>
        <span className="text-[10px] font-medium uppercase tracking-[0.13em] text-[#64748B]">
          +{delta.toFixed(delta % 1 === 0 ? 0 : 2).replace(".", ",")}%
        </span>
      </div>
    </motion.article>
  );
}
