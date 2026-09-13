import { BackLink } from "@/components/ui/back-link";
import { InvestmentsView } from "@/components/wealth/investments-view";
import { getInvestmentsDetail, getWealthHistory } from "@/lib/data/wealth";
import { requireActiveMembership } from "@/lib/supabase/session";

export default async function InvestimentosPage() {
  const { organizationId } = await requireActiveMembership();
  const [holdings, history] = await Promise.all([
    getInvestmentsDetail(organizationId),
    getWealthHistory(organizationId),
  ]);

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

        <BackLink href="/patrimonio" label="Voltar a Patrimônio" />
      </section>

      <InvestmentsView holdings={holdings} history={history} />
    </div>
  );
}
