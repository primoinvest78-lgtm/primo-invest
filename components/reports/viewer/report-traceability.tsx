import { Eye, Share2 } from "lucide-react";
import Link from "next/link";

import type { ReportDetail } from "@/lib/data/reports";
import { buildPeriodLabel } from "@/lib/reports/period";
import {
  REPORT_AUDIENCE_LABEL,
  REPORT_TYPE_LABEL,
  REPORT_TYPE_SECTIONS,
  SHARE_AUDIENCE_LABEL,
} from "@/lib/reports/types";
import { formatDateTime } from "@/lib/utils/format";

/**
 * Rastreabilidade da emissão.
 *
 * Um relatório financeiro só é confiável se dá pra reconstruir como ele
 * foi produzido: com quais parâmetros, por quem, quando, em que versão e
 * de onde vieram os números. Tudo aqui sai da própria linha gravada —
 * nada é reconstruído na hora de exibir.
 *
 * Fica fora do documento impresso (`data-print-hide`): o PDF já carrega
 * a rastreabilidade essencial no rodapé; esta é a visão de auditoria de
 * dentro do sistema.
 */
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="min-w-0">
      <dt className="text-label font-bold uppercase text-card-beige-muted-foreground">{label}</dt>
      <dd className="mt-1 break-words text-body-sm font-semibold text-foreground">{children}</dd>
    </div>
  );
}

export function ReportTraceability({ report }: { report: ReportDetail }) {
  const sectionLabels = new Map(
    REPORT_TYPE_SECTIONS[report.type].map((s) => [s.id, s.label] as const),
  );
  const institution = (report.parameters.institution as string | null) ?? null;
  const dataSource = (report.parameters.dataSource as string | null) ?? null;

  return (
    <section data-print-hide className="card-premium rounded-2xl p-5 md:p-6">
      <div className="min-w-0">
        <p className="text-label font-bold uppercase text-card-beige-muted-foreground">Auditoria</p>
        <h3 className="mt-1 text-h2 font-bold text-foreground">Rastreabilidade da emissão</h3>
      </div>

      <dl className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Field label="Tipo">{REPORT_TYPE_LABEL[report.type]}</Field>
        <Field label="Público">{REPORT_AUDIENCE_LABEL[report.audience]}</Field>
        <Field label="Versão">{report.version}</Field>
        <Field label="Emitido por">{report.createdByName ?? "—"}</Field>

        <Field label="Emitido em">{formatDateTime(report.createdAt)}</Field>
        <Field label="Última atualização">
          {report.updatedAt ? formatDateTime(report.updatedAt) : "—"}
        </Field>
        <Field label="Período">
          {buildPeriodLabel(report.periodStart, report.periodEnd) ?? "Posição atual (sem recorte)"}
        </Field>
        <Field label="Cliente">
          {report.clientId ? (
            <Link
              href={`/clientes/${report.clientId}`}
              className="underline-offset-4 hover:text-primary hover:underline"
            >
              {report.clientName ?? report.clientId}
            </Link>
          ) : (
            "Toda a carteira"
          )}
        </Field>

        {institution ? <Field label="Instituição">{institution}</Field> : null}

        <Field label="Aberturas">
          <span className="inline-flex items-center gap-1">
            <Eye className="h-3.5 w-3.5 text-card-beige-muted-foreground" />
            {report.viewCount}
          </span>
        </Field>

        <Field label="Compartilhamentos">
          <span className="inline-flex items-center gap-1">
            <Share2 className="h-3.5 w-3.5 text-card-beige-muted-foreground" />
            {report.shares.length}
          </span>
        </Field>

        {dataSource ? <Field label="Origem dos dados">{dataSource}</Field> : null}
      </dl>

      <div className="mt-4">
        <p className="text-label font-bold uppercase text-card-beige-muted-foreground">
          Seções incluídas
        </p>
        <div className="mt-2 flex flex-wrap gap-2">
          {report.sections.map((id) => (
            <span
              key={id}
              className="rounded-full border border-border px-2.5 py-0.5 text-caption font-semibold text-card-beige-muted-foreground"
            >
              {sectionLabels.get(id) ?? id}
            </span>
          ))}
        </div>
      </div>

      {report.shares.length > 0 ? (
        <div className="mt-4">
          <p className="text-label font-bold uppercase text-card-beige-muted-foreground">
            Histórico de compartilhamento
          </p>
          <ul className="mt-2 space-y-1">
            {report.shares.map((share) => (
              <li key={share.id} className="text-body-sm text-card-beige-muted-foreground">
                <span className="font-semibold text-foreground">
                  {share.sharedWithName ?? SHARE_AUDIENCE_LABEL[share.audience]}
                </span>{" "}
                ({SHARE_AUDIENCE_LABEL[share.audience]}
                {share.canDownload ? ", pode baixar" : ""}) · por {share.createdByName ?? "—"} em{" "}
                {formatDateTime(share.createdAt)}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <p className="mt-4 text-caption text-card-beige-muted-foreground">
        O conteúdo exibido é o snapshot gravado nesta emissão. Para ver a posição atual, use
        &ldquo;Gerar novamente&rdquo; — a versão anterior permanece registrada.
      </p>
    </section>
  );
}
