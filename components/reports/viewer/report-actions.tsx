"use client";

import { Copy, Loader2, Printer, RefreshCw, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { ShareDialog } from "@/components/reports/viewer/share-dialog";
import { Button } from "@/components/ui/button";
import { deleteReport, regenerateReport } from "@/lib/actions/reports";
import type { ReportDetail } from "@/lib/data/reports";
import { generatorHref } from "@/lib/reports/generator-state";

export function ReportActions({ report, canDelete }: { report: ReportDetail; canDelete: boolean }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [regenerating, startRegenerate] = useTransition();
  const [deleting, startDelete] = useTransition();

  /**
   * PDF pelo diálogo de impressão do navegador. É o caminho que produz
   * um A4 real com as fontes e cores da marca (ver o bloco @media print
   * de globals.css) sem trazer uma biblioteca de PDF para o bundle —
   * que renderizaria um documento PARALELO, com risco de divergir do
   * que está na tela. Aqui, o que o usuário vê é o que sai no papel.
   */
  function handlePrint() {
    window.print();
  }

  function handleRegenerate() {
    setError(null);
    startRegenerate(async () => {
      try {
        await regenerateReport(report.id);
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Não foi possível reemitir.");
      }
    });
  }

  function handleDelete() {
    setError(null);
    startDelete(async () => {
      try {
        await deleteReport(report.id);
        router.push("/relatorios/historico");
      } catch (e) {
        setError(e instanceof Error ? e.message : "Não foi possível excluir.");
        setConfirmingDelete(false);
      }
    });
  }

  const duplicateHref = generatorHref({
    tipo: report.type,
    cliente: report.clientId,
    inicio: report.periodStart,
    fim: report.periodEnd,
    instituicao: (report.parameters.institution as string | null) ?? null,
    publico: report.audience,
  });

  return (
    <div data-print-hide className="card-premium rounded-2xl p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-label font-bold uppercase text-primary">Ações</p>
          <p className="mt-1 text-body-sm text-card-beige-muted-foreground">
            Reemitir recalcula com os dados de hoje e registra uma nova versão. O documento atual
            continua sendo o retrato do momento em que foi gerado.
          </p>
        </div>

        <div className="flex shrink-0 flex-wrap gap-2">
          <Button size="sm" onClick={handlePrint}>
            <Printer className="h-3.5 w-3.5" />
            Imprimir / PDF
          </Button>

          <ShareDialog report={report} />

          <Button variant="outline" size="sm" render={<Link href={duplicateHref} />}>
            <Copy className="h-3.5 w-3.5" />
            Duplicar configuração
          </Button>

          <Button variant="outline" size="sm" onClick={handleRegenerate} disabled={regenerating}>
            {regenerating ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <RefreshCw className="h-3.5 w-3.5" />
            )}
            {regenerating ? "Reemitindo..." : "Gerar novamente"}
          </Button>

          {canDelete ? (
            confirmingDelete ? (
              <div className="flex items-center gap-2">
                <Button variant="destructive" size="sm" onClick={handleDelete} disabled={deleting}>
                  {deleting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
                  Confirmar exclusão
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setConfirmingDelete(false)}>
                  Cancelar
                </Button>
              </div>
            ) : (
              <Button variant="destructive" size="sm" onClick={() => setConfirmingDelete(true)}>
                <Trash2 className="h-3.5 w-3.5" />
                Excluir
              </Button>
            )
          ) : null}
        </div>
      </div>

      {error ? (
        <p className="mt-3 rounded-xl border border-destructive/40 bg-destructive/10 px-3 py-2 text-body-sm font-semibold text-destructive">
          {error}
        </p>
      ) : null}
    </div>
  );
}
