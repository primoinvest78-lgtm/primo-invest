import { ScrollReveal } from "@/components/motion/scroll-reveal";
import { AnimatedNumber } from "@/components/ui/animated-number";
import { InvestmentsTable } from "@/components/wealth/investments-table";
import { ValueByTypeBarChart } from "@/components/wealth/value-by-type-bar-chart";
import { getInvestmentsDetail } from "@/lib/data/wealth";
import { requireActiveMembership } from "@/lib/supabase/session";
import { formatCurrencyBRL } from "@/lib/utils/format";

export default async function InvestimentosPage() {
  const { organizationId } = await requireActiveMembership();
  const holdings = await getInvestmentsDetail(organizationId);

  const totalInvested = holdings.reduce(
    (sum, h) => sum + Number(h.averagePrice ?? 0) * Number(h.quantity ?? 0),
    0,
  );
  const totalCurrent = holdings.reduce((sum, h) => sum + Number(h.valuation ?? 0), 0);
  const totalGainLoss = totalCurrent - totalInvested;
  const totalGainLossPct = totalInvested > 0 ? (totalGainLoss / totalInvested) * 100 : 0;

  const valueByTypeMap = new Map<string, number>();
  for (const h of holdings) {
    const type = h.productType ?? "Outros";
    valueByTypeMap.set(type, (valueByTypeMap.get(type) ?? 0) + Number(h.valuation ?? 0));
  }
  const valueByType = Array.from(valueByTypeMap.entries()).map(([type, value]) => ({
    type,
    value,
  }));

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-4 block-navy-3d rounded-2xl p-5 md:flex-row md:items-end md:justify-between md:p-6">
        <div className="min-w-0">
          <p className="text-label font-bold uppercase text-primary">Patrimônio</p>
          <h1 className="mt-2 text-h1 font-bold tracking-[-0.04em] text-secondary-foreground">
            Investimentos
          </h1>
          <p className="mt-2 max-w-2xl text-body text-secondary-foreground/75">
            {holdings.length} {holdings.length === 1 ? "posição" : "posições"} em carteira.
          </p>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <ScrollReveal className="card-premium rounded-2xl p-5">
          <p className="text-label font-bold uppercase text-card-beige-muted-foreground">
            Total investido
          </p>
          <p className="mt-2 text-h2 font-bold text-foreground">
            <AnimatedNumber value={formatCurrencyBRL(totalInvested)} />
          </p>
        </ScrollReveal>
        <ScrollReveal delay={0.05} className="card-premium rounded-2xl p-5">
          <p className="text-label font-bold uppercase text-card-beige-muted-foreground">
            Valor atual
          </p>
          <p className="mt-2 text-h2 font-bold text-foreground">
            <AnimatedNumber value={formatCurrencyBRL(totalCurrent)} />
          </p>
        </ScrollReveal>
        <ScrollReveal delay={0.1} className="card-premium rounded-2xl p-5">
          <p className="text-label font-bold uppercase text-card-beige-muted-foreground">
            Ganho/Perda
          </p>
          <p
            className={[
              "mt-2 text-h2 font-bold",
              totalGainLoss >= 0 ? "text-success" : "text-destructive",
            ].join(" ")}
          >
            {formatCurrencyBRL(totalGainLoss)} ({totalGainLossPct.toFixed(1)}%)
          </p>
        </ScrollReveal>
      </div>

      {valueByType.length > 0 ? (
        <ScrollReveal className="card-premium rounded-2xl p-5 md:p-6">
          <h3 className="mb-4 text-h2 font-bold text-foreground">Valor por tipo de produto</h3>
          <ValueByTypeBarChart data={valueByType} />
        </ScrollReveal>
      ) : null}

      <ScrollReveal>
        <InvestmentsTable holdings={holdings} />
      </ScrollReveal>
    </div>
  );
}
