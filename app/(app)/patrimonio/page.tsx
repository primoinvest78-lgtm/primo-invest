import { WealthOverviewView } from "@/components/wealth/wealth-overview-view";
import { getWealthHistory, getWealthOverview } from "@/lib/data/wealth";
import { requireActiveMembership } from "@/lib/supabase/session";

export default async function PatrimonioPage() {
  const { organizationId } = await requireActiveMembership();
  const [overview, history] = await Promise.all([
    getWealthOverview(organizationId),
    getWealthHistory(organizationId),
  ]);

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-4 block-navy-3d rounded-2xl p-5 md:flex-row md:items-end md:justify-between md:p-6">
        <div className="min-w-0">
          <p className="text-label font-bold uppercase text-primary">Patrimônio</p>
          <h1 className="mt-2 text-h1 font-bold tracking-[-0.04em] text-secondary-foreground">
            Visão Geral
          </h1>
          <p className="mt-2 max-w-2xl text-body text-secondary-foreground/75">
            Painel patrimonial consolidado — ativos, passivos e patrimônio líquido de toda a carteira.
          </p>
        </div>
      </section>

      <WealthOverviewView overview={overview} history={history} />
    </div>
  );
}
