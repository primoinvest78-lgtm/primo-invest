import { IntegrationsAccessGate } from "@/components/integrations/access-gate";
import { HistoryView } from "@/components/integrations/history/history-view";
import { BackLink } from "@/components/ui/back-link";
import { listSyncRuns } from "@/lib/data/integrations";
import { canAccessIntegrations } from "@/lib/integrations/permissions";
import { requireActiveMembership } from "@/lib/supabase/session";

export default async function IntegracoesHistoricoPage() {
  const { organizationId, role } = await requireActiveMembership();

  const header = (
    <section className="flex flex-col gap-4 block-navy-3d rounded-2xl p-5 md:flex-row md:items-end md:justify-between md:p-6">
      <div className="min-w-0">
        <p className="text-label font-bold uppercase text-primary">Integrações</p>
        <h1 className="mt-2 text-h1 font-bold tracking-[-0.04em] text-secondary-foreground">
          Histórico de sincronização
        </h1>
        <p className="mt-2 max-w-2xl text-body text-secondary-foreground/75">
          Toda execução de sincronização registrada — início, duração, quantidade processada, quem
          disparou e o resultado.
        </p>
      </div>
      <BackLink href="/integracoes" label="Integrações" />
    </section>
  );

  if (!canAccessIntegrations(role)) {
    return (
      <div className="space-y-6">
        {header}
        <IntegrationsAccessGate />
      </div>
    );
  }

  const runs = await listSyncRuns(organizationId);

  return (
    <div className="space-y-6">
      {header}
      <HistoryView runs={runs} />
    </div>
  );
}
