import { notFound } from "next/navigation";

import { ReportDocument } from "@/components/reports/document/report-document";
import { ReportActions } from "@/components/reports/viewer/report-actions";
import { ReportTraceability } from "@/components/reports/viewer/report-traceability";
import { ReportViewTracker } from "@/components/reports/viewer/report-view-tracker";
import { BackLink } from "@/components/ui/back-link";
import { getReport } from "@/lib/data/reports";
import { canDeleteReport } from "@/lib/reports/permissions";
import { REPORT_TYPE_LABEL } from "@/lib/reports/types";
import { requireActiveMembership } from "@/lib/supabase/session";
import { formatDateTime } from "@/lib/utils/format";

/**
 * Visualização de um relatório gerado.
 *
 * O que aparece aqui vem do SNAPSHOT gravado na emissão, não de uma
 * nova consulta — reabrir um relatório de três meses atrás mostra os
 * números daquele momento. Para ver a posição de hoje existe "Gerar
 * novamente", que cria uma nova versão sem apagar o retrato anterior.
 */
export default async function RelatorioPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { organizationId, userId, role } = await requireActiveMembership();
  const report = await getReport(organizationId, id);

  if (!report) {
    notFound();
  }

  const isScheduled = report.status === "agendado";

  return (
    <div className="space-y-6">
      <section
        data-print-hide
        className="flex flex-col gap-4 block-navy-3d rounded-2xl p-5 md:flex-row md:items-end md:justify-between md:p-6"
      >
        <div className="min-w-0">
          <p className="text-label font-bold uppercase text-primary">
            Relatório {REPORT_TYPE_LABEL[report.type]}
          </p>
          <h1 className="mt-2 text-h1 font-bold tracking-[-0.04em] text-secondary-foreground">
            {report.title}
          </h1>
          <p className="mt-2 max-w-2xl text-body text-secondary-foreground/75">
            {report.clientName ? `${report.clientName} · ` : ""}
            Emitido por {report.createdByName ?? "—"} em {formatDateTime(report.createdAt)} · versão{" "}
            {report.version}
          </p>
        </div>

        <BackLink href="/relatorios/historico" label="Voltar ao histórico" />
      </section>

      {isScheduled ? (
        <section data-print-hide className="card-premium rounded-2xl p-5">
          <p className="text-label font-bold uppercase text-warning">Agendado</p>
          <p className="mt-2 text-body text-card-beige-muted-foreground">
            Este relatório ainda não foi emitido — está registrado como recorrente
            {report.schedule ? `, com próxima emissão em ${report.schedule.nextRunOn}` : ""}. Use
            &ldquo;Gerar novamente&rdquo; para emitir agora com os dados atuais.
          </p>
        </section>
      ) : null}

      <ReportActions
        report={report}
        canDelete={canDeleteReport(role, userId, report.createdById)}
      />

      {report.payload && report.payload.sections?.length ? (
        <>
          <ReportViewTracker reportId={report.id} currentCount={report.viewCount} />
          <ReportDocument
            payload={report.payload}
            version={report.version}
            authorName={report.createdByName}
          />
        </>
      ) : (
        <section className="card-premium rounded-2xl p-8 text-center">
          <p className="text-body text-card-beige-muted-foreground">
            Este relatório ainda não tem conteúdo emitido.
          </p>
        </section>
      )}

      <ReportTraceability report={report} />
    </div>
  );
}
