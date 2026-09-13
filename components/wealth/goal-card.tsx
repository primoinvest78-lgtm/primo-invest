"use client";

import { ChevronRight } from "lucide-react";
import Link from "next/link";
import { motion } from "motion/react";

import { AnimatedNumber } from "@/components/ui/animated-number";
import { GoalDeleteDialog } from "@/components/wealth/goal-delete-dialog";
import { GoalEditDialog } from "@/components/wealth/goal-edit-dialog";
import { GoalStatusBadge } from "@/components/wealth/goal-status-badge";
import type { GoalDetail } from "@/lib/data/wealth";
import {
  computeGoalStatus,
  daysRemaining,
  progressPct,
  remainingAmount,
  requiredMonthlyContribution,
} from "@/lib/utils/goal-helpers";
import { formatCurrencyBRL, formatDate } from "@/lib/utils/format";

const BAR_COLOR: Record<string, string> = {
  em_dia: "bg-primary",
  atencao: "bg-warning",
  em_risco: "bg-destructive",
  concluida: "bg-secondary",
};

export function GoalCard({
  goal,
  clients,
  index,
}: {
  goal: GoalDetail;
  clients: { id: string; fullName: string }[];
  index: number;
}) {
  const status = computeGoalStatus(goal);
  const pct = progressPct(goal);
  const remaining = remainingAmount(goal);
  const days = daysRemaining(goal);
  const monthlyNeeded = requiredMonthlyContribution(goal);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: Math.min(index * 0.05, 0.25), ease: "easeOut" }}
      whileHover={{ y: -2 }}
      className="card-premium group relative flex flex-col gap-4 rounded-2xl p-5 transition-all duration-200 md:p-6"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <Link
            href={`/patrimonio/metas/${goal.id}`}
            className="group flex items-center gap-1.5 text-h2 font-bold text-foreground hover:text-primary"
          >
            <span className="truncate">{goal.name}</span>
            <ChevronRight className="h-4 w-4 shrink-0 opacity-0 transition-opacity group-hover:opacity-100" />
          </Link>
          <p className="mt-1 text-xs font-medium uppercase text-card-beige-muted-foreground">
            {goal.goalType ?? "Meta"}
            {goal.clientName ? ` · ${goal.clientName}` : ""}
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <GoalStatusBadge status={status} />
          <div className="flex items-center gap-1.5 opacity-0 transition-opacity group-hover:opacity-100 hover:opacity-100 focus-within:opacity-100">
            <GoalEditDialog goal={goal} clients={clients} />
            <GoalDeleteDialog goal={goal} />
          </div>
        </div>
      </div>

      {/* BARRA DE PROGRESSO — grande e explícita, não escondida num % pequeno */}
      <div>
        <div className="mb-2 flex items-end justify-between gap-2">
          <span className="text-2xl font-bold text-foreground">
            <AnimatedNumber value={formatCurrencyBRL(goal.currentAmount)} />
          </span>
          <span className="text-sm font-semibold text-card-beige-muted-foreground">
            de {formatCurrencyBRL(goal.targetAmount)}
          </span>
        </div>
        <div className="h-4 overflow-hidden rounded-full bg-black/10">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${pct}%` }}
            transition={{ duration: 0.7, ease: "easeOut" }}
            className={["h-full rounded-full", BAR_COLOR[status]].join(" ")}
          />
        </div>
        <p className="mt-1.5 text-xs font-bold text-card-beige-muted-foreground">{pct.toFixed(0)}% concluído</p>
      </div>

      <div className="grid grid-cols-2 gap-3 border-t border-black/10 pt-4 sm:grid-cols-4">
        <div>
          <p className="text-[10px] font-bold uppercase text-card-beige-muted-foreground">Falta</p>
          <p className="mt-0.5 text-sm font-semibold text-foreground">{formatCurrencyBRL(remaining)}</p>
        </div>
        <div>
          <p className="text-[10px] font-bold uppercase text-card-beige-muted-foreground">Prazo</p>
          <p className="mt-0.5 text-sm font-semibold text-foreground">
            {goal.targetDate ? formatDate(goal.targetDate) : "—"}
            {days !== null ? (
              <span className="ml-1 text-xs font-medium text-card-beige-muted-foreground">
                ({days >= 0 ? `${days}d` : "vencida"})
              </span>
            ) : null}
          </p>
        </div>
        <div>
          <p className="text-[10px] font-bold uppercase text-card-beige-muted-foreground">
            Aporte realizado
          </p>
          <p className="mt-0.5 text-sm font-semibold text-foreground">
            {formatCurrencyBRL(goal.contributedTotal)}
          </p>
        </div>
        <div>
          <p className="text-[10px] font-bold uppercase text-card-beige-muted-foreground">
            Aporte necessário/mês
          </p>
          <p className="mt-0.5 text-sm font-semibold text-foreground">
            {monthlyNeeded !== null ? `${formatCurrencyBRL(monthlyNeeded)}*` : "—"}
          </p>
        </div>
      </div>

      {monthlyNeeded !== null ? (
        <p className="text-[10px] text-card-beige-muted-foreground/70">
          *Projeção matemática (valor restante ÷ meses até o prazo), não é uma estimativa garantida.
        </p>
      ) : null}
    </motion.div>
  );
}
