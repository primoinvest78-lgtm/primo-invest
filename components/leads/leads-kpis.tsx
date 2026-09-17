"use client";

import { motion } from "motion/react";

import { AnimatedNumber } from "@/components/ui/animated-number";
import type { LeadListItem } from "@/lib/data/leads";
import type { LeadFilters } from "@/lib/utils/lead-filters";
import { computeLeadScore } from "@/lib/utils/lead-score";

function Kpi({
  label,
  value,
  valueClassName,
  animate = true,
  index,
  onClick,
}: {
  label: string;
  value: string;
  valueClassName?: string;
  animate?: boolean;
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
        {animate ? <AnimatedNumber value={value} /> : value}
      </p>
    </motion.button>
  );
}

export function LeadsKpis({
  leads,
  onApplyFilters,
}: {
  leads: LeadListItem[];
  /** Clicar num KPI aplica o mesmo recorte como filtro na lista abaixo. */
  onApplyFilters?: (patch: Partial<LeadFilters>) => void;
}) {
  const total = leads.length;
  const novos = leads.filter((l) => l.status === "Novo").length;
  const quentes = leads.filter(
    (l) =>
      l.status !== "Convertido" && l.status !== "Perdido" && computeLeadScore(l).tier === "Quente",
  ).length;
  const emNegociacao = leads.filter((l) => l.status === "Negociação").length;
  const convertidos = leads.filter((l) => l.status === "Convertido").length;
  const taxaConversao = total > 0 ? (convertidos / total) * 100 : 0;

  function apply(patch: Partial<LeadFilters>) {
    onApplyFilters?.({ stage: "all", status: "all", scoreTier: "all", signal: "all", ...patch });
  }

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
      <Kpi label="Total de leads" value={String(total)} index={0} onClick={onApplyFilters ? () => apply({}) : undefined} />
      <Kpi
        label="Leads novos"
        value={String(novos)}
        index={1}
        onClick={onApplyFilters ? () => apply({ stage: "Novo" }) : undefined}
      />
      <Kpi
        label="Leads quentes"
        value={String(quentes)}
        valueClassName="text-primary"
        index={2}
        onClick={onApplyFilters ? () => apply({ scoreTier: "Quente", status: "aberto" }) : undefined}
      />
      <Kpi
        label="Em negociação"
        value={String(emNegociacao)}
        index={3}
        onClick={onApplyFilters ? () => apply({ stage: "Negociação" }) : undefined}
      />
      <Kpi
        label="Convertidos"
        value={String(convertidos)}
        valueClassName="text-primary"
        index={4}
        onClick={onApplyFilters ? () => apply({ status: "Convertido" }) : undefined}
      />
      <Kpi
        label="Taxa de conversão"
        value={`${taxaConversao.toFixed(1).replace(".", ",")}%`}
        animate={false}
        index={5}
      />
    </div>
  );
}
