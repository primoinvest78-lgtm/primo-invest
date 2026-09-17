import { ReportShortcutButton } from "@/components/reports/report-shortcut-button";
import { OpportunitiesView } from "@/components/opportunities/opportunities-view";
import { listOpportunitiesByStage } from "@/lib/data/opportunities";
import { requireActiveMembership } from "@/lib/supabase/session";

export default async function OportunidadesPage() {
  const { organizationId } = await requireActiveMembership();
  const stages = await listOpportunitiesByStage(organizationId);
  const total = stages.reduce((sum, s) => sum + s.opportunities.length, 0);

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-4 block-navy-3d rounded-2xl p-5 md:flex-row md:items-end md:justify-between md:p-6">
        <div className="min-w-0">
          <p className="text-label font-bold uppercase text-primary">Comercial</p>
          <h1 className="mt-2 text-h1 font-bold tracking-[-0.04em] text-secondary-foreground">
            Oportunidades
          </h1>
          <p className="mt-2 max-w-2xl text-body text-secondary-foreground/75">
            {total} {total === 1 ? "oportunidade" : "oportunidades"} em andamento.
          </p>
        </div>

        <div className="flex shrink-0 flex-wrap items-center gap-2">
          <ReportShortcutButton type="operacional" label="Relatório operacional" />
        </div>
      </section>

      <OpportunitiesView stages={stages} />
    </div>
  );
}
