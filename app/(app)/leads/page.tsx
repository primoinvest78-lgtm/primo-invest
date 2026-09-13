import { LeadsView } from "@/components/leads/leads-view";
import { listLeads } from "@/lib/data/leads";
import { requireActiveMembership } from "@/lib/supabase/session";

export default async function LeadsPage() {
  const { organizationId } = await requireActiveMembership();
  const leads = await listLeads(organizationId);

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-4 rounded-2xl border border-white/10 bg-secondary p-5 shadow-panel-3d md:flex-row md:items-end md:justify-between md:p-6">
        <div className="min-w-0">
          <p className="text-label font-bold uppercase text-primary">Aquisição</p>
          <h1 className="mt-2 text-h1 font-bold tracking-[-0.04em] text-secondary-foreground">
            Leads
          </h1>
          <p className="mt-2 max-w-2xl text-body text-secondary-foreground/75">
            Esteira de captação — {leads.length} {leads.length === 1 ? "lead" : "leads"}.
          </p>
        </div>
      </section>

      <LeadsView leads={leads} />
    </div>
  );
}
