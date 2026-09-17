import Link from "next/link";

import type { SyncRun } from "@/lib/data/integrations";
import { syncRunStatusLabel, SYNC_TRIGGER_LABEL } from "@/lib/integrations/catalog";
import { formatDateTime } from "@/lib/utils/format";

const STATUS_CLASS: Record<string, string> = {
  completed: "border-primary/40 bg-primary/10 text-primary",
  failed: "border-destructive/40 bg-destructive/10 text-destructive",
  not_available: "border-border bg-muted text-muted-foreground",
  running: "border-accent/40 bg-accent/10 text-accent",
  started: "border-accent/40 bg-accent/10 text-accent",
  cancelled: "border-border bg-muted text-muted-foreground",
};

function durationLabel(startedAt: string, finishedAt: string | null): string {
  if (!finishedAt) return "—";
  const ms = new Date(finishedAt).getTime() - new Date(startedAt).getTime();
  if (ms < 1000) return "menos de 1s";
  const seconds = Math.round(ms / 1000);
  if (seconds < 60) return `${seconds}s`;
  return `${Math.floor(seconds / 60)}min ${seconds % 60}s`;
}

/**
 * Histórico e logs de erro desta integração — "Ver histórico" / "Ver
 * erros" do item 3 apontam pra esta mesma seção, dentro do detalhe.
 */
export function SyncHistorySection({ runs }: { runs: SyncRun[] }) {
  return (
    <section className="card-premium rounded-2xl p-5 md:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-label font-bold uppercase text-card-beige-muted-foreground">Logs</p>
          <h3 className="mt-1 text-h2 font-bold text-foreground">Histórico de sincronização</h3>
        </div>
        <Link
          href="/integracoes/historico"
          className="shrink-0 text-body-sm font-semibold text-primary underline-offset-4 hover:underline"
        >
          Ver histórico completo
        </Link>
      </div>

      {runs.length === 0 ? (
        <div className="mt-4 rounded-2xl border border-dashed border-border px-5 py-8 text-center">
          <p className="text-body font-bold text-foreground">Nenhuma execução registrada ainda</p>
          <p className="mt-1 text-body-sm text-card-beige-muted-foreground">
            Use “Testar conexão” ou “Sincronizar agora” acima para começar o histórico.
          </p>
        </div>
      ) : (
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[680px] border-collapse text-body-sm">
            <thead>
              <tr className="border-b border-border">
                {["Início", "Duração", "Disparado por", "Processados", "Situação", "Detalhe"].map((col) => (
                  <th key={col} className="px-3 py-2 text-left text-label font-bold uppercase text-card-beige-muted-foreground">
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {runs.map((run) => (
                <tr key={run.id} className="border-b border-border/60 last:border-b-0">
                  <td className="px-3 py-2 text-card-beige-muted-foreground">{formatDateTime(run.startedAt)}</td>
                  <td className="px-3 py-2 text-card-beige-muted-foreground">
                    {durationLabel(run.startedAt, run.finishedAt)}
                  </td>
                  <td className="px-3 py-2 text-card-beige-muted-foreground">
                    {SYNC_TRIGGER_LABEL[run.triggeredBy] ?? run.triggeredBy}
                    {run.triggeredByUserName ? ` · ${run.triggeredByUserName}` : ""}
                  </td>
                  <td className="px-3 py-2 text-card-beige-muted-foreground">
                    {run.recordsCreated + run.recordsUpdated}
                    {run.recordsFailed > 0 ? (
                      <span className="ml-1 text-destructive">({run.recordsFailed} com erro)</span>
                    ) : null}
                  </td>
                  <td className="px-3 py-2">
                    <span
                      className={[
                        "inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase",
                        STATUS_CLASS[run.status] ?? "border-border text-card-beige-muted-foreground",
                      ].join(" ")}
                    >
                      {syncRunStatusLabel(run.status)}
                    </span>
                  </td>
                  <td className="max-w-[260px] truncate px-3 py-2 text-caption text-card-beige-muted-foreground">
                    {run.errorMessage ?? "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
