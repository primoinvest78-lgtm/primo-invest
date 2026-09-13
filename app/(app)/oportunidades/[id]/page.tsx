import { notFound } from "next/navigation";

import { OpportunityProfileView } from "@/components/opportunities/opportunity-profile";
import { BackLink } from "@/components/ui/back-link";
import { getClientSummaryForOpportunity, getOpportunityProfile } from "@/lib/data/opportunities";
import { createClient } from "@/lib/supabase/server";
import { requireActiveMembership } from "@/lib/supabase/session";

export default async function OpportunityProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { organizationId } = await requireActiveMembership();
  const opportunity = await getOpportunityProfile(organizationId, id);

  if (!opportunity) {
    notFound();
  }

  const supabase = await createClient();
  const { data: stages } = await supabase
    .from("opportunity_stages")
    .select("id, stage_key")
    .eq("organization_id", organizationId);

  const wonStageId = stages?.find((s) => s.stage_key === "ganha")?.id ?? opportunity.stage_id;
  const lostStageId = stages?.find((s) => s.stage_key === "perdida")?.id ?? opportunity.stage_id;

  const clientSummary = opportunity.client
    ? await getClientSummaryForOpportunity(organizationId, opportunity.client.id, opportunity.id)
    : null;

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-4 block-navy-3d rounded-2xl p-5 md:flex-row md:items-end md:justify-between md:p-6">
        <div className="min-w-0">
          <p className="text-label font-bold uppercase text-primary">Oportunidade</p>
          <h1 className="mt-2 text-h1 font-bold tracking-[-0.04em] text-secondary-foreground">
            {opportunity.title}
          </h1>
          <p className="mt-2 max-w-2xl text-body text-secondary-foreground/75">
            {opportunity.assigned_advisor?.full_name
              ? `Assessor responsável: ${opportunity.assigned_advisor.full_name}`
              : "Sem assessor vinculado"}
          </p>
        </div>

        <BackLink href="/oportunidades" label="Voltar a Oportunidades" />
      </section>

      <OpportunityProfileView
        opportunity={opportunity}
        wonStageId={wonStageId}
        lostStageId={lostStageId}
        clientSummary={clientSummary}
      />
    </div>
  );
}
