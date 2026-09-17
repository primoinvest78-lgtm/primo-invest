"use client";

import { motion } from "motion/react";

import { AnimatedNumber } from "@/components/ui/animated-number";
import type { OpportunityCard } from "@/lib/data/opportunities";
import type { OpportunityFilters } from "@/lib/utils/opportunity-filters";
import { effectiveProbability, isOpenOpportunity } from "@/lib/utils/opportunity-helpers";
import { formatCurrencyBRL } from "@/lib/utils/format";

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

export function OpportunitiesKpis({
  opportunities,
  stageProbabilityById,
  onApplyFilters,
}: {
  opportunities: OpportunityCard[];
  stageProbabilityById: Map<string, number | null>;
  /** Clicar num KPI aplica o mesmo recorte como filtro na lista abaixo. */
  onApplyFilters?: (patch: Partial<OpportunityFilters>) => void;
}) {
  const open = opportunities.filter((o) => isOpenOpportunity(o.status));
  const won = opportunities.filter((o) => o.status === "won");
  const lost = opportunities.filter((o) => o.status === "lost");

  const pipelineValue = open.reduce((s, o) => s + Number(o.estimatedValue ?? 0), 0);
  const decided = won.length + lost.length;
  const conversionRate = decided > 0 ? (won.length / decided) * 100 : 0;
  const avgTicket =
    won.length > 0 ? won.reduce((s, o) => s + Number(o.estimatedValue ?? 0), 0) / won.length : 0;

  const forecast = open.reduce((sum, o) => {
    const prob = effectiveProbability(o, stageProbabilityById.get(o.stageId) ?? null);
    if (prob === null) return sum;
    return sum + Number(o.estimatedValue ?? 0) * (prob / 100);
  }, 0);

  function apply(patch: Partial<OpportunityFilters>) {
    onApplyFilters?.({ status: "all", signal: "all", ...patch });
  }

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-7">
      <Kpi
        label="Valor do pipeline"
        value={formatCurrencyBRL(pipelineValue)}
        index={0}
        onClick={onApplyFilters ? () => apply({ status: "open" }) : undefined}
      />
      <Kpi
        label="Abertas"
        value={String(open.length)}
        index={1}
        onClick={onApplyFilters ? () => apply({ status: "open" }) : undefined}
      />
      <Kpi
        label="Ganhas"
        value={String(won.length)}
        valueClassName="text-primary"
        index={2}
        onClick={onApplyFilters ? () => apply({ status: "won" }) : undefined}
      />
      <Kpi
        label="Perdidas"
        value={String(lost.length)}
        valueClassName="text-destructive"
        index={3}
        onClick={onApplyFilters ? () => apply({ status: "lost" }) : undefined}
      />
      <Kpi
        label="Taxa de conversão"
        value={`${conversionRate.toFixed(1).replace(".", ",")}%`}
        animate={false}
        index={4}
      />
      <Kpi
        label="Ticket médio"
        value={won.length > 0 ? formatCurrencyBRL(avgTicket) : "—"}
        animate={false}
        index={5}
      />
      <Kpi
        label="Previsão ponderada"
        value={formatCurrencyBRL(forecast)}
        index={6}
        onClick={onApplyFilters ? () => apply({ status: "open" }) : undefined}
      />
    </div>
  );
}
