"use client";

import { motion } from "motion/react";

import { AnimatedNumber } from "@/components/ui/animated-number";
import type { InsightCounts, InsightType } from "@/lib/intelligence/types";

function Kpi({
  label,
  value,
  valueClassName,
  index,
  onClick,
}: {
  label: string;
  value: string;
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
      <p className="truncate text-label font-bold uppercase text-card-beige-muted-foreground">
        {label}
      </p>
      <p className={["mt-2 truncate text-lg font-bold", valueClassName ?? "text-foreground"].join(" ")}>
        <AnimatedNumber value={value} />
      </p>
    </motion.button>
  );
}

export function InsightKpis({
  counts,
  onSelectType,
}: {
  counts: InsightCounts;
  /** Clicar num KPI filtra o feed abaixo pelo mesmo tipo. */
  onSelectType?: (type: "all" | InsightType) => void;
}) {
  const total = counts.atencao + counts.oportunidade + counts.pendencia + counts.informacao;

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-5">
      <Kpi
        label="Em aberto"
        value={String(total)}
        valueClassName={total > 0 ? "text-destructive" : "text-foreground"}
        index={0}
        onClick={onSelectType ? () => onSelectType("all") : undefined}
      />
      <Kpi
        label="Atenção"
        value={String(counts.atencao)}
        valueClassName="text-warning"
        index={1}
        onClick={onSelectType ? () => onSelectType("atencao") : undefined}
      />
      <Kpi
        label="Oportunidade"
        value={String(counts.oportunidade)}
        valueClassName="text-primary"
        index={2}
        onClick={onSelectType ? () => onSelectType("oportunidade") : undefined}
      />
      <Kpi
        label="Pendência"
        value={String(counts.pendencia)}
        valueClassName="text-destructive"
        index={3}
        onClick={onSelectType ? () => onSelectType("pendencia") : undefined}
      />
      <Kpi
        label="Informação"
        value={String(counts.informacao)}
        index={4}
        onClick={onSelectType ? () => onSelectType("informacao") : undefined}
      />
    </div>
  );
}
