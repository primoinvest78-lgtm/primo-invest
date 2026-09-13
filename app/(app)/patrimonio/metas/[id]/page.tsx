import Link from "next/link";
import { notFound } from "next/navigation";

import { AnimatedNumber } from "@/components/ui/animated-number";
import { BackLink } from "@/components/ui/back-link";
import { GoalDeleteDialog } from "@/components/wealth/goal-delete-dialog";
import { GoalEditDialog } from "@/components/wealth/goal-edit-dialog";
import { GoalStatusBadge } from "@/components/wealth/goal-status-badge";
import { WealthEvolutionSection } from "@/components/wealth/wealth-evolution-section";
import { listClients } from "@/lib/data/clients";
import { getGoalContributionHistory, getGoalDetail } from "@/lib/data/wealth";
import { requireActiveMembership } from "@/lib/supabase/session";
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

function InfoField({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div>
      <p className="text-label font-bold uppercase text-secondary-foreground/60">{label}</p>
      <p className="mt-1 text-sm font-medium text-secondary-foreground">{value ?? "—"}</p>
    </div>
  );
}

function Kpi({ label, value, valueClassName }: { label: string; value: string; valueClassName?: string }) {
  return (
    <div className="card-premium rounded-2xl p-4">
      <p className="text-label font-bold uppercase text-card-beige-muted-foreground">{label}</p>
      <p className={["mt-2 text-lg font-bold", valueClassName ?? "text-foreground"].join(" ")}>
        <AnimatedNumber value={value} />
      </p>
    </div>
  );
}

export default async function GoalDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { organizationId } = await requireActiveMembership();
  const goal = await getGoalDetail(organizationId, id);

  if (!goal) {
    notFound();
  }

  const [clients, history] = await Promise.all([
    listClients(organizationId),
    getGoalContributionHistory(organizationId, goal),
  ]);

  const status = computeGoalStatus(goal);
  const pct = progressPct(goal);
  const remaining = remainingAmount(goal);
  const days = daysRemaining(goal);
  const monthlyNeeded = requiredMonthlyContribution(goal);

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-4 block-navy-3d rounded-2xl p-5 md:flex-row md:items-end md:justify-between md:p-6">
        <div className="min-w-0">
          <p className="text-label font-bold uppercase text-primary">
            Metas · {goal.goalType ?? "—"}
          </p>
          <h1 className="mt-2 text-h1 font-bold tracking-[-0.04em] text-secondary-foreground">
            {goal.name}
          </h1>
          <div className="mt-3 grid grid-cols-2 gap-4 sm:grid-cols-4">
            <InfoField label="Titular" value={goal.clientName} />
            <InfoField label="Prioridade" value={goal.priority} />
            <InfoField label="Prazo" value={formatDate(goal.targetDate)} />
            <InfoField
              label="Dias restantes"
              value={days === null ? "—" : days >= 0 ? `${days} dias` : "Prazo vencido"}
            />
          </div>
        </div>

        <div className="flex shrink-0 flex-col items-end gap-3">
          <BackLink href="/patrimonio/metas" label="Voltar a Metas" />
          <div className="flex items-center gap-3">
            <GoalStatusBadge status={status} />
            <div className="flex items-center gap-2 rounded-lg bg-white/10 px-2 py-1">
              <GoalEditDialog goal={goal} clients={clients.map((c) => ({ id: c.id, fullName: c.fullName }))} />
              <GoalDeleteDialog goal={goal} />
            </div>
          </div>
        </div>
      </section>

      {/* OBJETIVO */}
      <div className="card-premium rounded-2xl p-5 md:p-6">
        <h3 className="mb-4 text-h2 font-bold text-foreground">Objetivo</h3>
        <div className="mb-2 flex flex-wrap items-end justify-between gap-2">
          <span className="text-3xl font-bold text-foreground">
            <AnimatedNumber value={formatCurrencyBRL(goal.currentAmount)} />
          </span>
          <span className="text-sm font-semibold text-card-beige-muted-foreground">
            de {formatCurrencyBRL(goal.targetAmount)}
          </span>
        </div>
        <div className="h-5 overflow-hidden rounded-full bg-black/10">
          <div className={["h-full rounded-full", BAR_COLOR[status]].join(" ")} style={{ width: `${pct}%` }} />
        </div>
        <p className="mt-2 text-sm font-bold text-card-beige-muted-foreground">{pct.toFixed(0)}% concluído</p>

        <div className="mt-5 grid grid-cols-2 gap-3 border-t border-black/10 pt-5 sm:grid-cols-3">
          <Kpi label="Valor restante" value={formatCurrencyBRL(remaining)} />
          <Kpi label="Aporte realizado" value={formatCurrencyBRL(goal.contributedTotal)} />
          <Kpi
            label="Aporte necessário/mês*"
            value={monthlyNeeded !== null ? formatCurrencyBRL(monthlyNeeded) : "—"}
          />
        </div>
        {monthlyNeeded !== null ? (
          <p className="mt-3 text-[11px] text-card-beige-muted-foreground/70">
            *Projeção matemática (valor restante ÷ meses até o prazo) pra referência do assessor — não é
            uma estimativa garantida.
          </p>
        ) : null}
      </div>

      {/* PATRIMÔNIO RELACIONADO */}
      <div className="card-premium rounded-2xl p-5 md:p-6">
        <h3 className="mb-4 text-h2 font-bold text-foreground">Patrimônio relacionado</h3>
        {goal.accounts.length === 0 ? (
          <p className="text-body-sm text-card-beige-muted-foreground">
            Nenhuma conta ou investimento vinculado a essa meta ainda.
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {goal.accounts.map((account) => (
              <Link
                key={account.accountId}
                href={`/patrimonio/contas/${account.accountId}`}
                className="flex items-center justify-between gap-3 rounded-xl border border-black/10 bg-black/5 px-4 py-3 transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/40"
              >
                <div className="min-w-0">
                  <p className="truncate font-semibold text-foreground">
                    {account.accountName ?? "Conta"}
                  </p>
                  <p className="text-xs text-card-beige-muted-foreground">
                    {account.institutionName ?? "—"} · {account.accountType ?? "—"}
                    {account.allocationPercentage !== null ? ` · ${account.allocationPercentage}% alocado` : ""}
                  </p>
                </div>
                <span className="shrink-0 font-semibold text-foreground">
                  {formatCurrencyBRL(account.balance)}
                </span>
              </Link>
            ))}
          </div>
        )}
      </div>

      <WealthEvolutionSection
        history={history}
        title="Aportes acumulados"
        emptyMessage="Sem transações de aporte suficientes registradas nas contas vinculadas pra montar a evolução."
      />
    </div>
  );
}
