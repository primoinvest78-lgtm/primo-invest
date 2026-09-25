import Link from "next/link";
import { History, Plus } from "lucide-react";

import { CenterCharts } from "@/components/reports/center/center-charts";
import { CenterKpis } from "@/components/reports/center/center-kpis";
import { CenterPendingSection } from "@/components/reports/center/center-pending-section";
import { CenterRecentSection } from "@/components/reports/center/center-recent-section";
import { CenterTemplatesSection } from "@/components/reports/center/center-templates-section";
import { CenterTypeGrid } from "@/components/reports/center/center-type-grid";
import { Button } from "@/components/ui/button";
import { computeReportCenterKpis, listReports, listReportTemplates } from "@/lib/data/reports";
import { isManagementRole } from "@/lib/reports/permissions";
import { requireActiveMembership } from "@/lib/supabase/session";

/**
 * Report Center — home operacional.
 *
 * Todos os números desta tela vêm do histórico real de emissões. Não há
 * contador fixo: se a casa nunca emitiu um relatório, os KPIs mostram
 * zero e as listas mostram o estado vazio com o próximo passo.
 */
export default async function RelatoriosPage() {
  const { organizationId, role } = await requireActiveMembership();

  const [reports, templates] = await Promise.all([
    listReports(organizationId),
    listReportTemplates(organizationId),
  ]);

  const kpis = computeReportCenterKpis(reports, templates.length);
  const scheduled = reports.filter((r) => r.status === "agendado");

  const counts: Record<string, number> = {};
  for (const report of reports) {
    if (report.status !== "gerado") continue;
    counts[report.type] = (counts[report.type] ?? 0) + 1;
  }

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-4 block-navy-3d rounded-2xl p-5 md:flex-row md:items-end md:justify-between md:p-6">
        <div className="min-w-0">
          <p className="text-label font-bold uppercase text-primary">Relatórios</p>
          <h1 className="mt-2 text-h1 font-bold tracking-[-0.04em] text-secondary-foreground">
            Central de Relatórios
          </h1>
          <p className="mt-2 max-w-2xl text-body text-secondary-foreground/75">
            Criar, configurar, visualizar, validar, gerar, compartilhar e arquivar — com os mesmos
            dados que alimentam o restante da plataforma.
          </p>
        </div>

        <div className="flex shrink-0 flex-wrap items-center gap-2">
          <Button size="lg" nativeButton={false} render={<Link href="/relatorios/novo" />}>
            <Plus className="h-4 w-4" />
            Novo relatório
          </Button>
          <Button variant="outline" size="lg" nativeButton={false} render={<Link href="/relatorios/historico" />}>
            <History className="h-4 w-4" />
            Histórico
          </Button>
        </div>
      </section>

      <CenterKpis kpis={kpis} />

      <div id="pendentes">
        <CenterPendingSection scheduled={scheduled} />
      </div>

      <CenterTypeGrid counts={counts} canUseInternalTypes={isManagementRole(role)} />

      <CenterRecentSection reports={reports} />

      <CenterCharts reports={reports} />

      <div id="modelos">
        <CenterTemplatesSection templates={templates} />
      </div>
    </div>
  );
}
