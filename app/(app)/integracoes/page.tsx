import Link from "next/link";
import { History } from "lucide-react";

import { IntegrationsAccessGate } from "@/components/integrations/access-gate";
import { CatalogGrid } from "@/components/integrations/center/catalog-grid";
import { CenterAttentionPanel } from "@/components/integrations/center/center-attention-panel";
import { CenterCharts } from "@/components/integrations/center/center-charts";
import { CenterKpis } from "@/components/integrations/center/center-kpis";
import { Button } from "@/components/ui/button";
import { computeIntegrationsKpis, listAlerts, listIntegrations, listSyncRuns } from "@/lib/data/integrations";
import { canAccessIntegrations } from "@/lib/integrations/permissions";
import { requireActiveMembership } from "@/lib/supabase/session";

/**
 * Centro de Integrações — dashboard operacional.
 *
 * Todo número desta tela vem do cadastro e do histórico reais. Nenhuma
 * integração do catálogo tem conector implementado hoje — os KPIs de
 * sincronização começam em zero e só crescem quando alguém usa
 * "Testar conexão" / "Sincronizar agora" numa integração (que grava
 * uma execução honesta, marcada como indisponível).
 */
export default async function IntegracoesPage() {
  const { organizationId, role } = await requireActiveMembership();

  if (!canAccessIntegrations(role)) {
    return (
      <div className="space-y-6">
        <Header />
        <IntegrationsAccessGate />
      </div>
    );
  }

  const integrations = await listIntegrations(organizationId);
  const syncRuns = await listSyncRuns(organizationId);
  const alerts = await listAlerts(organizationId);
  const kpis = computeIntegrationsKpis(integrations, syncRuns);

  return (
    <div className="space-y-6">
      <Header />

      <CenterKpis kpis={kpis} />

      <CenterAttentionPanel alerts={alerts} />

      <section>
        <div className="mb-4">
          <p className="text-label font-bold uppercase text-card-beige-muted-foreground">Catálogo</p>
          <h2 className="mt-1 text-h2 font-bold text-foreground">Integrações disponíveis</h2>
        </div>
        <CatalogGrid integrations={integrations} />
      </section>

      <CenterCharts integrations={integrations} syncRuns={syncRuns} />
    </div>
  );
}

function Header() {
  return (
    <section className="flex flex-col gap-4 block-navy-3d rounded-2xl p-5 md:flex-row md:items-end md:justify-between md:p-6">
      <div className="min-w-0">
        <p className="text-label font-bold uppercase text-primary">Integrações</p>
        <h1 className="mt-2 text-h1 font-bold tracking-[-0.04em] text-secondary-foreground">
          Centro de Integrações
        </h1>
        <p className="mt-2 max-w-2xl text-body text-secondary-foreground/75">
          Ponto central para conectar a Primo Invest a fontes externas e controlar o fluxo de dados —
          cadastro, sincronização, alertas e mapeamento de campos.
        </p>
      </div>

      <Button variant="outline" size="lg" nativeButton={false} render={<Link href="/integracoes/historico" />}>
        <History className="h-4 w-4" />
        Histórico de sincronização
      </Button>
    </section>
  );
}
