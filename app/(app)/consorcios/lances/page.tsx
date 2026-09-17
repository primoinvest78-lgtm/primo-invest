import { ReportShortcutButton } from "@/components/reports/report-shortcut-button";
import { BackLink } from "@/components/ui/back-link";
import { LancesView } from "@/components/consortiums/lances/lances-view";
import { getConsortiumBids, getConsortiumContracts } from "@/lib/data/consortiums";
import { listTasks } from "@/lib/data/tasks";
import { requireActiveMembership } from "@/lib/supabase/session";

export default async function LancesPage() {
  const { organizationId } = await requireActiveMembership();
  const [bids, contracts, tasks] = await Promise.all([
    getConsortiumBids(organizationId),
    getConsortiumContracts(organizationId),
    listTasks(organizationId),
  ]);

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-4 block-navy-3d rounded-2xl p-5 md:flex-row md:items-end md:justify-between md:p-6">
        <div className="min-w-0">
          <p className="text-label font-bold uppercase text-primary">Consórcios</p>
          <h1 className="mt-2 text-h1 font-bold tracking-[-0.04em] text-secondary-foreground">
            Lances
          </h1>
          <p className="mt-2 max-w-2xl text-body text-secondary-foreground/75">
            Estratégia de contemplação — {bids.length} {bids.length === 1 ? "lance registrado" : "lances registrados"}.
            Lance não garante contemplação; as regras dependem do grupo/contrato.
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          <ReportShortcutButton type="consorcios" label="Relatório de consórcios" />
          <BackLink href="/consorcios" label="Voltar a Consórcios" />
        </div>
      </section>

      {contracts.length === 0 ? (
        <div className="card-premium rounded-2xl p-8 text-center">
          <p className="text-body-sm text-card-beige-muted-foreground">
            Nenhum contrato cadastrado ainda — cadastre um contrato em Contratos pra poder ofertar lances.
          </p>
        </div>
      ) : (
        <LancesView bids={bids} contracts={contracts} tasks={tasks} />
      )}
    </div>
  );
}
