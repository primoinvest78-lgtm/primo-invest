"use client";

import { motion } from "motion/react";

import { AnimatedNumber } from "@/components/ui/animated-number";
import type { DocumentCenterKpis } from "@/lib/utils/document-center-helpers";

function Kpi({
  label,
  value,
  valueClassName,
  index,
  onClick,
}: {
  label: string;
  value: number;
  valueClassName?: string;
  index: number;
  onClick?: () => void;
}) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      disabled={!onClick}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.04, ease: "easeOut" }}
      whileHover={onClick ? { y: -2 } : undefined}
      className={[
        "card-premium rounded-2xl p-4 text-left transition-all duration-200",
        onClick ? "cursor-pointer hover:border-primary/60 hover:shadow-card" : "",
      ].join(" ")}
    >
      <p className="truncate text-label font-bold uppercase text-card-beige-muted-foreground">{label}</p>
      <p className={["mt-2 truncate text-lg font-bold", valueClassName ?? "text-foreground"].join(" ")}>
        <AnimatedNumber value={String(value)} />
      </p>
    </motion.button>
  );
}

export function CenterKpis({
  kpis,
  onSelectStatus,
}: {
  kpis: DocumentCenterKpis;
  /** Clicar num KPI filtra a tabela abaixo pelo mesmo status. */
  onSelectStatus?: (status: string) => void;
}) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
      <Kpi label="Total" value={kpis.total} index={0} onClick={onSelectStatus ? () => onSelectStatus("all") : undefined} />
      <Kpi
        label="Pendentes"
        value={kpis.pendentes}
        valueClassName={kpis.pendentes > 0 ? "text-primary" : "text-foreground"}
        index={1}
        onClick={onSelectStatus ? () => onSelectStatus("pendente") : undefined}
      />
      <Kpi
        label="Vencendo"
        value={kpis.vencendo}
        valueClassName={kpis.vencendo > 0 ? "text-warning" : "text-foreground"}
        index={2}
        onClick={onSelectStatus ? () => onSelectStatus("vencendo") : undefined}
      />
      <Kpi
        label="Vencidos"
        value={kpis.vencidos}
        valueClassName={kpis.vencidos > 0 ? "text-destructive" : "text-foreground"}
        index={3}
        onClick={onSelectStatus ? () => onSelectStatus("vencido") : undefined}
      />
      <Kpi
        label="Aguardando aprovação"
        value={kpis.aguardandoAprovacao}
        valueClassName={kpis.aguardandoAprovacao > 0 ? "text-accent" : "text-foreground"}
        index={4}
        onClick={onSelectStatus ? () => onSelectStatus("em_analise") : undefined}
      />
      <Kpi label="Atualizados (7 dias)" value={kpis.atualizadosRecentemente} index={5} />
    </div>
  );
}
