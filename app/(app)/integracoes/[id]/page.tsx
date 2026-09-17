import { notFound } from "next/navigation";

import { IntegrationsAccessGate } from "@/components/integrations/access-gate";
import { CalendarFeedSection } from "@/components/integrations/detail/calendar-feed-section";
import { CenterAttentionPanel } from "@/components/integrations/center/center-attention-panel";
import { DetailActions } from "@/components/integrations/detail/detail-actions";
import { DetailHeader } from "@/components/integrations/detail/detail-header";
import { FieldMappingSection } from "@/components/integrations/detail/field-mapping-section";
import { SyncHistorySection } from "@/components/integrations/detail/sync-history-section";
import { BackLink } from "@/components/ui/back-link";
import { getCalendarFeedToken } from "@/lib/data/calendar-feed";
import {
  getIntegration,
  getResponsibleOptions,
  listAlertsForIntegration,
  listFieldMappings,
  listSyncRunsForIntegration,
} from "@/lib/data/integrations";
import { canAccessIntegrations } from "@/lib/integrations/permissions";
import { requireActiveMembership } from "@/lib/supabase/session";
import { getRequestOrigin } from "@/lib/utils/request-origin";

export default async function IntegracaoDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { organizationId, role, userId } = await requireActiveMembership();

  const header = (backHref = "/integracoes") => (
    <section className="flex flex-col gap-4 block-navy-3d rounded-2xl p-5 md:flex-row md:items-end md:justify-between md:p-6">
      <div className="min-w-0">
        <p className="text-label font-bold uppercase text-primary">Integrações</p>
        <h1 className="mt-2 text-h1 font-bold tracking-[-0.04em] text-secondary-foreground">
          Detalhe da integração
        </h1>
      </div>
      <BackLink href={backHref} label="Centro de Integrações" />
    </section>
  );

  if (!canAccessIntegrations(role)) {
    return (
      <div className="space-y-6">
        {header()}
        <IntegrationsAccessGate />
      </div>
    );
  }

  const integration = await getIntegration(organizationId, id);
  if (!integration) {
    notFound();
  }

  const isCalendarFeed = integration.providerKey === "calendario";

  const [responsibleOptions, alerts, mappings, runs, calendarToken, origin] = await Promise.all([
    getResponsibleOptions(organizationId),
    listAlertsForIntegration(organizationId, id),
    listFieldMappings(organizationId, id),
    listSyncRunsForIntegration(organizationId, id),
    isCalendarFeed ? getCalendarFeedToken(organizationId, userId) : null,
    isCalendarFeed ? getRequestOrigin() : Promise.resolve(""),
  ]);

  return (
    <div className="space-y-6">
      {header()}

      <DetailHeader integration={integration} />
      {isCalendarFeed ? (
        <CalendarFeedSection
          token={calendarToken?.token ?? null}
          lastAccessedAt={calendarToken?.lastAccessedAt ?? null}
          origin={origin}
        />
      ) : null}
      <DetailActions integration={integration} responsibleOptions={responsibleOptions} />
      <CenterAttentionPanel alerts={alerts} />
      <SyncHistorySection runs={runs} />
      <FieldMappingSection integrationId={integration.id} mappings={mappings} />
    </div>
  );
}
