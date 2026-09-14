"use client";

import { motion } from "motion/react";

import { AnimatedNumber } from "@/components/ui/animated-number";
import type { DocumentCenterKpis } from "@/lib/utils/document-center-helpers";

function Kpi({
  label,
  value,
  valueClassName,
  index,
}: {
  label: string;
  value: number;
  valueClassName?: string;
  index: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.04, ease: "easeOut" }}
      whileHover={{ y: -2 }}
      className="card-premium rounded-2xl p-4 transition-all duration-200"
    >
      <p className="truncate text-label font-bold uppercase text-card-beige-muted-foreground">{label}</p>
      <p className={["mt-2 truncate text-lg font-bold", valueClassName ?? "text-foreground"].join(" ")}>
        <AnimatedNumber value={String(value)} />
      </p>
    </motion.div>
  );
}

export function CenterKpis({ kpis }: { kpis: DocumentCenterKpis }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
      <Kpi label="Total" value={kpis.total} index={0} />
      <Kpi label="Pendentes" value={kpis.pendentes} valueClassName={kpis.pendentes > 0 ? "text-primary" : "text-foreground"} index={1} />
      <Kpi label="Vencendo" value={kpis.vencendo} valueClassName={kpis.vencendo > 0 ? "text-warning" : "text-foreground"} index={2} />
      <Kpi label="Vencidos" value={kpis.vencidos} valueClassName={kpis.vencidos > 0 ? "text-destructive" : "text-foreground"} index={3} />
      <Kpi label="Aguardando aprovação" value={kpis.aguardandoAprovacao} valueClassName={kpis.aguardandoAprovacao > 0 ? "text-accent" : "text-foreground"} index={4} />
      <Kpi label="Atualizados (7 dias)" value={kpis.atualizadosRecentemente} index={5} />
    </div>
  );
}
