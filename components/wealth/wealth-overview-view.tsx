"use client";

import Link from "next/link";
import { useMemo } from "react";

import { ScrollReveal } from "@/components/motion/scroll-reveal";
import { WealthAlertsSection } from "@/components/wealth/wealth-alerts-section";
import { WealthComparisonBars } from "@/components/wealth/wealth-comparison-bars";
import { WealthCompositionSection } from "@/components/wealth/wealth-composition-section";
import { WealthEvolutionSection } from "@/components/wealth/wealth-evolution-section";
import { WealthKpis } from "@/components/wealth/wealth-kpis";
import { WealthLiquiditySection } from "@/components/wealth/wealth-liquidity-section";
import { WealthRankingSection } from "@/components/wealth/wealth-ranking-section";
import type { WealthHistoryPoint, WealthOverview } from "@/lib/data/wealth";
import { formatCurrencyBRL, formatDate } from "@/lib/utils/format";
import { computeWealthAlerts } from "@/lib/utils/wealth-helpers";

export function WealthOverviewView({
  overview,
  history,
}: {
  overview: WealthOverview;
  history: WealthHistoryPoint[];
}) {
  const alerts = useMemo(
    () =>
      computeWealthAlerts({
        netWorth: overview.netWorth,
        liquidTotal: overview.liquidTotal,
        totalAssets: overview.totalAssets,
        allocation: overview.allocation.map((a) => ({ label: a.productType, value: a.value })),
        history,
        lastUpdatedAt: overview.lastUpdatedAt,
      }),
    [overview, history],
  );

  return (
    <div className="space-y-6">
      <WealthKpis overview={overview} history={history} />

      <WealthAlertsSection alerts={alerts} />

      <WealthComparisonBars overview={overview} />

      <WealthEvolutionSection history={history} />

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
        <WealthCompositionSection overview={overview} />
        <WealthLiquiditySection overview={overview} />
      </div>

      <WealthRankingSection overview={overview} />

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <ScrollReveal className="card-premium rounded-2xl p-5 md:p-6">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-h2 font-bold text-foreground">Contas</h3>
            <Link href="/patrimonio/contas" className="text-xs font-semibold text-accent hover:underline">
              Ver todas
            </Link>
          </div>
          {overview.accounts.length === 0 ? (
            <p className="text-body-sm text-card-beige-muted-foreground">Nenhuma conta cadastrada.</p>
          ) : (
            <div className="space-y-2">
              {overview.accounts.slice(0, 6).map((account) => (
                <div
                  key={account.id}
                  className="flex items-center justify-between gap-2 rounded-xl border border-black/10 bg-black/5 px-3.5 py-3 transition-colors duration-150 hover:bg-black/10"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-foreground">
                      {account.accountName ?? account.institutionName ?? "Conta"}
                    </p>
                    {account.clientId ? (
                      <Link
                        href={`/clientes/${account.clientId}`}
                        className="text-xs font-medium text-accent hover:underline"
                      >
                        {account.clientName}
                      </Link>
                    ) : (
                      <p className="text-xs font-medium text-card-beige-muted-foreground">
                        {account.clientName ?? "—"}
                      </p>
                    )}
                  </div>
                  <p className="shrink-0 text-sm font-semibold text-foreground">
                    {formatCurrencyBRL(account.balance)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </ScrollReveal>

        <ScrollReveal delay={0.1} className="card-premium rounded-2xl p-5 md:p-6">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-h2 font-bold text-foreground">Passivos</h3>
            <Link href="/patrimonio/passivos" className="text-xs font-semibold text-accent hover:underline">
              Ver todos
            </Link>
          </div>
          {overview.liabilities.length === 0 ? (
            <p className="text-body-sm text-card-beige-muted-foreground">Nenhum passivo em aberto.</p>
          ) : (
            <div className="space-y-2">
              {overview.liabilities.slice(0, 6).map((liability) => (
                <div
                  key={liability.id}
                  className="flex items-center justify-between gap-2 rounded-xl border border-black/10 bg-black/5 px-3.5 py-3 transition-colors duration-150 hover:bg-black/10"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-foreground">{liability.name}</p>
                    <div className="flex flex-wrap items-center gap-1 text-xs font-medium text-card-beige-muted-foreground">
                      {liability.clientId ? (
                        <Link href={`/clientes/${liability.clientId}`} className="text-accent hover:underline">
                          {liability.clientName}
                        </Link>
                      ) : (
                        <span>{liability.clientName ?? "—"}</span>
                      )}
                      {liability.maturityDate ? <span>· vence em {formatDate(liability.maturityDate)}</span> : null}
                    </div>
                  </div>
                  <p className="shrink-0 text-sm font-semibold text-destructive">
                    {formatCurrencyBRL(liability.outstandingAmount)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </ScrollReveal>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <ScrollReveal className="card-premium rounded-2xl p-5 md:p-6">
          <h3 className="mb-4 text-h2 font-bold text-foreground">Metas vinculadas</h3>
          {overview.goals.length === 0 ? (
            <p className="text-body-sm text-card-beige-muted-foreground">Nenhuma meta ativa.</p>
          ) : (
            <div className="space-y-3">
              {overview.goals.slice(0, 5).map((goal) => {
                const pct = goal.targetAmount
                  ? Math.min((goal.currentAmount / goal.targetAmount) * 100, 100)
                  : 0;

                return (
                  <div key={goal.id} className="rounded-xl border border-black/10 bg-black/5 p-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className="truncate text-sm font-semibold text-foreground">{goal.name}</span>
                      <span className="shrink-0 text-xs font-medium text-card-beige-muted-foreground">
                        {pct.toFixed(0)}%
                      </span>
                    </div>
                    <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-black/10">
                      <div className="h-full rounded-full bg-primary" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </ScrollReveal>

        <ScrollReveal delay={0.1} className="card-premium rounded-2xl p-5 md:p-6">
          <h3 className="mb-4 text-h2 font-bold text-foreground">Ranking de clientes por patrimônio</h3>
          {overview.topClients.length === 0 ? (
            <p className="text-body-sm text-card-beige-muted-foreground">Sem dados suficientes.</p>
          ) : (
            <div className="space-y-2">
              {overview.topClients.map((client) => (
                <div
                  key={client.id ?? client.name}
                  className="flex items-center justify-between gap-2 rounded-xl border border-black/10 bg-black/5 px-3.5 py-3 transition-colors duration-150 hover:bg-black/10"
                >
                  {client.id ? (
                    <Link
                      href={`/clientes/${client.id}`}
                      className="truncate text-sm font-semibold text-accent hover:underline"
                    >
                      {client.name}
                    </Link>
                  ) : (
                    <span className="truncate text-sm font-semibold text-foreground">{client.name}</span>
                  )}
                  <span className="shrink-0 text-sm font-semibold text-foreground">
                    {formatCurrencyBRL(client.total)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </ScrollReveal>
      </div>
    </div>
  );
}
