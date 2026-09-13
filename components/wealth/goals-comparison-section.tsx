"use client";

import { motion } from "motion/react";

import type { GoalDetail } from "@/lib/data/wealth";
import { computeGoalStatus, progressPct, remainingAmount } from "@/lib/utils/goal-helpers";
import { formatCurrencyBRL } from "@/lib/utils/format";

const STATUS_BAR_COLOR: Record<string, string> = {
  em_dia: "bg-primary",
  atencao: "bg-warning",
  em_risco: "bg-destructive",
  concluida: "bg-secondary",
};

function ComparisonRow({ goal, delay }: { goal: GoalDetail; delay: number }) {
  const pct = progressPct(goal);
  const remaining = remainingAmount(goal);
  const status = computeGoalStatus(goal);

  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between gap-2 text-sm">
        <span className="min-w-0 truncate font-semibold text-foreground">{goal.name}</span>
        <span className="shrink-0 text-xs font-medium text-card-beige-muted-foreground">
          {remaining > 0 ? `faltam ${formatCurrencyBRL(remaining)}` : "concluída"}
        </span>
      </div>
      <div className="h-3 overflow-hidden rounded-full bg-muted">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.6, ease: "easeOut", delay }}
          className={["h-full rounded-full", STATUS_BAR_COLOR[status]].join(" ")}
        />
      </div>
    </div>
  );
}

export function GoalsComparisonSection({ goals }: { goals: GoalDetail[] }) {
  if (goals.length < 2) return null;

  const sorted = [...goals].sort((a, b) => progressPct(a) - progressPct(b));

  return (
    <div className="card-premium rounded-2xl p-5 md:p-6">
      <h3 className="mb-1 text-h2 font-bold text-foreground">Comparação entre metas</h3>
      <p className="mb-5 text-sm text-card-beige-muted-foreground">
        Ordenado da meta com menos progresso pra mais — identifique rápido quem precisa de ação.
      </p>

      <div className="space-y-4">
        {sorted.map((goal, index) => (
          <ComparisonRow key={goal.id} goal={goal} delay={index * 0.06} />
        ))}
      </div>
    </div>
  );
}
