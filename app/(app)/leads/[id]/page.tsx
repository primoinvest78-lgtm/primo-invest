import { notFound } from "next/navigation";

import { LeadProfileView } from "@/components/leads/lead-profile";
import { getLeadProfile } from "@/lib/data/leads";
import { requireActiveMembership } from "@/lib/supabase/session";

export default async function LeadProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { organizationId } = await requireActiveMembership();
  const lead = await getLeadProfile(organizationId, id);

  if (!lead) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-4 block-navy-3d rounded-2xl p-5 md:flex-row md:items-end md:justify-between md:p-6">
        <div className="min-w-0">
          <p className="text-label font-bold uppercase text-primary">Lead</p>
          <h1 className="mt-2 text-h1 font-bold tracking-[-0.04em] text-secondary-foreground">
            {lead.name}
          </h1>
          <p className="mt-2 max-w-2xl text-body text-secondary-foreground/75">
            {lead.assigned_advisor?.full_name
              ? `Assessor responsável: ${lead.assigned_advisor.full_name}`
              : "Sem assessor vinculado"}
          </p>
        </div>
      </section>

      <LeadProfileView lead={lead} />
    </div>
  );
}
