import Link from "next/link";

import { AllocationBar } from "@/components/wealth/allocation-bar";
import { AllocationPieChart } from "@/components/wealth/allocation-pie-chart";
import { TopClientsBarChart } from "@/components/wealth/top-clients-bar-chart";
import { ScrollReveal } from "@/components/motion/scroll-reveal";
import { AnimatedNumber } from "@/components/ui/animated-number";
import { getWealthOverview } from "@/lib/data/wealth";
import { requireActiveMembership } from "@/lib/supabase/session";
import { formatCurrencyBRL, formatDate } from "@/lib/utils/format";
import { CHART_SEQUENCE } from "@/lib/design/chart-colors";

export default async function PatrimonioPage() {
  const { organizationId } = await requireActiveMembership();
  const wealth = await getWealthOverview(organizationId);

  const allocationTotal = wealth.allocation.reduce((sum, a) => sum + a.value, 0);

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-4 block-navy-3d rounded-2xl p-5 md:flex-row md:items-end md:justify-between md:p-6">
        <div className="min-w-0">
          <p className="text-label font-bold uppercase text-primary">Patrimônio</p>
          <h1 className="mt-2 text-h1 font-bold tracking-[-0.04em] text-secondary-foreground">
            Visão Geral
          </h1>
          <p className="mt-2 max-w-2xl text-body text-secondary-foreground/75">
            Net Worth Statement consolidado da carteira — ativos, passivos e patrimônio líquido.
          </p>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <ScrollReveal>
          <div className="card-premium rounded-2xl p-5 transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/70">
            <p className="text-label font-bold uppercase text-card-beige-muted-foreground">
              Total de Ativos
            </p>
            <p className="mt-2 text-h2 font-bold text-foreground">
              <AnimatedNumber value={formatCurrencyBRL(wealth.totalAssets)} />
            </p>
          </div>
        </ScrollReveal>
        <ScrollReveal delay={0.05}>
          <div className="card-premium rounded-2xl p-5 transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/70">
            <p className="text-label font-bold uppercase text-card-beige-muted-foreground">
              Total de Passivos
            </p>
            <p className="mt-2 text-h2 font-bold text-destructive">
              <AnimatedNumber value={formatCurrencyBRL(wealth.totalLiabilities)} />
            </p>
          </div>
        </ScrollReveal>
        <ScrollReveal delay={0.1}>
          <div className="card-premium rounded-2xl p-5 transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/70">
            <p className="text-label font-bold uppercase text-card-beige-muted-foreground">
              Patrimônio Líquido
            </p>
            <p className="mt-2 text-h2 font-bold text-foreground">
              <AnimatedNumber value={formatCurrencyBRL(wealth.netWorth)} />
            </p>
          </div>
        </ScrollReveal>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <ScrollReveal className="card-premium rounded-2xl p-5 md:p-6">
          <h3 className="mb-4 text-h2 font-bold text-foreground">Composição da carteira</h3>
          {wealth.allocation.length === 0 ? (
            <p className="text-body-sm text-card-beige-muted-foreground">Sem posições registradas.</p>
          ) : (
            <>
              <AllocationPieChart data={wealth.allocation} />
              <div className="mt-2 space-y-3">
              {wealth.allocation.map((item, index) => {
                const pct = allocationTotal > 0 ? (item.value / allocationTotal) * 100 : 0;
                const color = CHART_SEQUENCE[index % CHART_SEQUENCE.length];

                return (
                  <div key={item.productType}>
                    <div className="mb-1 flex items-center justify-between text-sm">
                      <span className="font-medium text-foreground">{item.productType}</span>
                      <span className="font-semibold text-foreground">{pct.toFixed(1)}%</span>
                    </div>
                    <AllocationBar percentage={pct} color={color} delay={index * 0.05} />
                  </div>
                );
              })}
              </div>
            </>
          )}
        </ScrollReveal>

        <ScrollReveal delay={0.1} className="card-premium rounded-2xl p-5 md:p-6">
          <h3 className="mb-4 text-h2 font-bold text-foreground">Metas vinculadas</h3>
          {wealth.goals.length === 0 ? (
            <p className="text-body-sm text-card-beige-muted-foreground">Nenhuma meta ativa.</p>
          ) : (
            <div className="space-y-3">
              {wealth.goals.slice(0, 5).map((goal) => {
                const pct = goal.targetAmount
                  ? Math.min((goal.currentAmount / goal.targetAmount) * 100, 100)
                  : 0;

                return (
                  <div key={goal.id} className="rounded-xl border border-black/10 bg-black/5 p-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className="truncate text-sm font-semibold text-foreground">
                        {goal.name}
                      </span>
                      <span className="shrink-0 text-xs font-medium text-card-beige-muted-foreground">
                        {pct.toFixed(0)}%
                      </span>
                    </div>
                    <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-black/10">
                      <div
                        className="h-full rounded-full bg-primary"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </ScrollReveal>
      </div>

      <ScrollReveal className="card-premium rounded-2xl p-5 md:p-6">
        <h3 className="mb-4 text-h2 font-bold text-foreground">Ranking de clientes por patrimônio</h3>
        {wealth.topClients.length === 0 ? (
          <p className="text-body-sm text-card-beige-muted-foreground">Sem dados suficientes.</p>
        ) : (
          <TopClientsBarChart data={wealth.topClients} />
        )}
      </ScrollReveal>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <ScrollReveal className="card-premium rounded-2xl p-5 md:p-6">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-h2 font-bold text-foreground">Contas</h3>
            <Link href="/patrimonio/contas" className="text-xs font-semibold text-accent hover:underline">
              Ver todas
            </Link>
          </div>
          {wealth.accounts.length === 0 ? (
            <p className="text-body-sm text-card-beige-muted-foreground">Nenhuma conta cadastrada.</p>
          ) : (
            <div className="space-y-2">
              {wealth.accounts.slice(0, 6).map((account) => (
                <div
                  key={account.id}
                  className="flex items-center justify-between gap-2 rounded-xl border border-black/10 bg-black/5 px-3.5 py-3 transition-colors duration-150 hover:bg-black/10"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-foreground">
                      {account.accountName ?? account.institutionName ?? "Conta"}
                    </p>
                    <p className="text-xs font-medium text-card-beige-muted-foreground">
                      {account.clientName ?? "—"}
                    </p>
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
          {wealth.liabilities.length === 0 ? (
            <p className="text-body-sm text-card-beige-muted-foreground">Nenhum passivo em aberto.</p>
          ) : (
            <div className="space-y-2">
              {wealth.liabilities.slice(0, 6).map((liability) => (
                <div
                  key={liability.id}
                  className="flex items-center justify-between gap-2 rounded-xl border border-black/10 bg-black/5 px-3.5 py-3 transition-colors duration-150 hover:bg-black/10"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-foreground">
                      {liability.name}
                    </p>
                    <p className="text-xs font-medium text-card-beige-muted-foreground">
                      {liability.clientName ?? "—"}
                      {liability.maturityDate ? ` · vence em ${formatDate(liability.maturityDate)}` : ""}
                    </p>
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
    </div>
  );
}
