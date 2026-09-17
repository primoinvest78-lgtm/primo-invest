"use client";

import { motion } from "motion/react";

import { AnimatedNumber } from "@/components/ui/animated-number";
import type { GoalDetail } from "@/lib/data/wealth";
import { computeGoalStatus, type GoalStatus } from "@/lib/utils/goal-helpers";
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

export function GoalsKpis({
  goals,
  onSelectStatus,
}: {
  goals: GoalDetail[];
  /** Clicar num KPI filtra a lista de metas abaixo pro mesmo status. */
  onSelectStatus?: (status: GoalStatus | "all") => void;
}) {
  const totalTarget = goals.reduce((sum, g) => sum + Number(g.targetAmount ?? 0), 0);

  let emDia = 0;
  let atencao = 0;
  let emRisco = 0;
  let concluida = 0;
  for (const goal of goals) {
    const status = computeGoalStatus(goal);
    if (status === "em_dia") emDia += 1;
    else if (status === "atencao") atencao += 1;
    else if (status === "em_risco") emRisco += 1;
    else concluida += 1;
  }

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
      <Kpi
        label="Total de metas"
        value={String(goals.length)}
        index={0}
        onClick={onSelectStatus ? () => onSelectStatus("all") : undefined}
      />
      <Kpi
        label="Em dia"
        value={String(emDia)}
        index={1}
        onClick={onSelectStatus ? () => onSelectStatus("em_dia") : undefined}
      />
      <Kpi
        label="Em atenção"
        value={String(atencao)}
        valueClassName="text-warning"
        animate={false}
        index={2}
        onClick={onSelectStatus ? () => onSelectStatus("atencao") : undefined}
      />
      <Kpi
        label="Em risco"
        value={String(emRisco)}
        valueClassName={emRisco > 0 ? "text-destructive" : "text-foreground"}
        animate={false}
        index={3}
        onClick={onSelectStatus ? () => onSelectStatus("em_risco") : undefined}
      />
      <Kpi
        label="Concluídas"
        value={String(concluida)}
        index={4}
        onClick={onSelectStatus ? () => onSelectStatus("concluida") : undefined}
      />
      <Kpi label="Valor total dos objetivos" value={formatCurrencyBRL(totalTarget)} index={5} />
    </div>
  );
}
