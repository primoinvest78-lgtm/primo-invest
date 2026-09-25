import Link from "next/link";
import { MessageSquareText, TrendingUp, Users } from "lucide-react";

import { AttentionFeed } from "@/components/crm/attention-feed";
import { CrmInsightSlot } from "@/components/crm/crm-insight-slot";
import { HubCharts } from "@/components/crm/hub-charts";
import { HubKpis } from "@/components/crm/hub-kpis";
import { BackButton } from "@/components/ui/back-button";
import { Button } from "@/components/ui/button";
import { getCrmActivityTrend, getCrmHubData } from "@/lib/data/crm";
import { requireActiveMembership } from "@/lib/supabase/session";

/**
 * Hub CRM — camada de ação que cruza Leads, Oportunidades, Tarefas e
 * Clientes num único feed priorizado. O Dashboard já mostra os números
 * agregados do pipeline e do relacionamento; este hub não repete isso —
 * ele responde "o que eu faço primeiro hoje", apontando cada sinal de
 * volta pro registro de origem.
 */
export default async function CrmHubPage() {
  const { organizationId } = await requireActiveMembership();

  const [{ bundle, kpis }, activity] = await Promise.all([
    getCrmHubData(organizationId),
    getCrmActivityTrend(organizationId),
  ]);

  return (
    <div className="space-y-6">
      <Header />

      <HubKpis kpis={kpis} />

      <div id="atencao">
        <AttentionFeed signals={bundle.signals} />
      </div>

      <HubCharts bundle={bundle} activity={activity} />

      <CrmInsightSlot bundle={bundle} />
    </div>
  );
}

function Header() {
  return (
    <section className="flex flex-col gap-4 block-navy-3d rounded-2xl p-5 md:flex-row md:items-end md:justify-between md:p-6">
      <div className="min-w-0">
        <BackButton className="mb-2 inline-flex items-center gap-1.5 text-xs font-semibold text-secondary-foreground/60 transition-colors hover:text-primary" />
        <p className="text-label font-bold uppercase text-primary">CRM</p>
        <h1 className="mt-2 text-h1 font-bold tracking-[-0.04em] text-secondary-foreground">Painel de Relacionamento</h1>
        <p className="mt-2 max-w-2xl text-body text-secondary-foreground/75">
          Leads, oportunidades, tarefas e clientes cruzados num único feed priorizado — o que precisa de
          ação hoje, em vez de checar quatro telas separadas.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button variant="outline" size="lg" nativeButton={false} render={<Link href="/leads" />}>
          <MessageSquareText className="h-4 w-4" />
          Leads
        </Button>
        <Button variant="outline" size="lg" nativeButton={false} render={<Link href="/oportunidades" />}>
          <TrendingUp className="h-4 w-4" />
          Oportunidades
        </Button>
        <Button variant="outline" size="lg" nativeButton={false} render={<Link href="/clientes" />}>
          <Users className="h-4 w-4" />
          Clientes
        </Button>
      </div>
    </section>
  );
}
