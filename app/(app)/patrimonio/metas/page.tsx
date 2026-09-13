import { ScrollReveal } from "@/components/motion/scroll-reveal";
import { getGoalsDetail } from "@/lib/data/wealth";
import { requireActiveMembership } from "@/lib/supabase/session";
import { formatCurrencyBRL, formatDate } from "@/lib/utils/format";

export default async function MetasPage() {
  const { organizationId } = await requireActiveMembership();
  const goals = await getGoalsDetail(organizationId);

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-4 rounded-2xl border border-white/10 bg-secondary p-5 shadow-panel-3d md:flex-row md:items-end md:justify-between md:p-6">
        <div className="min-w-0">
          <p className="text-label font-bold uppercase text-primary">Patrimônio</p>
          <h1 className="mt-2 text-h1 font-bold tracking-[-0.04em] text-secondary-foreground">
            Metas Financeiras
          </h1>
          <p className="mt-2 max-w-2xl text-body text-secondary-foreground/75">
            {goals.length} {goals.length === 1 ? "meta" : "metas"} cadastradas.
          </p>
        </div>
      </section>

      {goals.length === 0 ? (
        <div className="card-premium rounded-2xl p-8 text-center">
          <p className="text-body-sm text-card-beige-muted-foreground">Nenhuma meta cadastrada.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {goals.map((goal, index) => {
            const pct = goal.targetAmount
              ? Math.min((goal.currentAmount / goal.targetAmount) * 100, 100)
              : 0;

            return (
              <ScrollReveal
                key={goal.id}
                delay={Math.min(index * 0.04, 0.2)}
                className="card-premium rounded-2xl p-5 transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/70"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-bold text-foreground">{goal.name}</p>
                    <p className="text-xs font-medium uppercase text-card-beige-muted-foreground">
                      {goal.goalType ?? "Meta"} · {goal.clientName ?? "—"}
                    </p>
                  </div>
                  <span className="shrink-0 rounded-full border border-primary/45 bg-primary/15 px-2.5 py-1 text-[11px] font-bold text-foreground">
                    {pct.toFixed(0)}%
                  </span>
                </div>

                <div className="mt-3 h-2 overflow-hidden rounded-full bg-black/10">
                  <div className="h-full rounded-full bg-primary" style={{ width: `${pct}%` }} />
                </div>

                <div className="mt-3 flex items-center justify-between text-sm">
                  <span className="font-semibold text-foreground">
                    {formatCurrencyBRL(goal.currentAmount)}
                  </span>
                  <span className="text-card-beige-muted-foreground">
                    de {formatCurrencyBRL(goal.targetAmount)}
                  </span>
                </div>

                {goal.targetDate ? (
                  <p className="mt-2 text-xs font-medium text-card-beige-muted-foreground">
                    Prazo: {formatDate(goal.targetDate)}
                  </p>
                ) : null}
              </ScrollReveal>
            );
          })}
        </div>
      )}
    </div>
  );
}
