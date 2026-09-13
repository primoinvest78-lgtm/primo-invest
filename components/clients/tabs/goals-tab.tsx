import Link from "next/link";

import { AnimatedNumber } from "@/components/ui/animated-number";
import type { ClientProfile } from "@/lib/data/clients";
import { formatCurrencyBRL, formatDate } from "@/lib/utils/format";

export function GoalsTab({ client }: { client: ClientProfile }) {
  if (client.wealth_goals.length === 0) {
    return (
      <div className="card-premium rounded-2xl p-8 text-center">
        <p className="text-body-sm text-card-beige-muted-foreground">
          Nenhuma meta financeira cadastrada para este cliente.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      {client.wealth_goals.map((goal) => {
        const pct = goal.target_amount
          ? Math.min((goal.current_amount / goal.target_amount) * 100, 100)
          : 0;

        return (
          <Link
            key={goal.id}
            href={`/patrimonio/metas/${goal.id}`}
            className="card-premium block rounded-2xl p-5 transition-all duration-200 hover:-translate-y-0.5"
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-sm font-bold text-foreground">{goal.name}</p>
                <p className="text-xs font-medium uppercase text-card-beige-muted-foreground">
                  {goal.goal_type ?? "Meta"} · Prioridade {goal.priority}
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
                <AnimatedNumber value={formatCurrencyBRL(goal.current_amount)} />
              </span>
              <span className="text-card-beige-muted-foreground">
                de {formatCurrencyBRL(goal.target_amount)}
              </span>
            </div>

            {goal.target_date ? (
              <p className="mt-2 text-xs font-medium text-card-beige-muted-foreground">
                Prazo: {formatDate(goal.target_date)}
              </p>
            ) : null}

            {goal.wealth_goal_accounts.length > 0 ? (
              <div className="mt-3 border-t border-black/10 pt-3">
                {goal.wealth_goal_accounts.map((acc, i) => (
                  <div key={i} className="flex items-center justify-between text-xs">
                    <span className="text-card-beige-muted-foreground">
                      {acc.financial_accounts?.account_name ?? "Conta"}
                    </span>
                    <span className="font-medium text-foreground">
                      {acc.allocation_percentage ?? 0}%
                    </span>
                  </div>
                ))}
              </div>
            ) : null}
          </Link>
        );
      })}
    </div>
  );
}
