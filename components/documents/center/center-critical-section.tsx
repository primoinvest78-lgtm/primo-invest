import Link from "next/link";

import { NewTaskDialog } from "@/components/tasks/new-task-dialog";
import type { DocumentCenterRow } from "@/lib/data/document-center";
import { daysUntil, isExpired, isExpiringSoon } from "@/lib/utils/document-helpers";
import { formatDate } from "@/lib/utils/format";

function CriticalRow({ row }: { row: DocumentCenterRow }) {
  const days = row.expiresAt ? daysUntil(row.expiresAt) : null;
  const expired = isExpired(row);

  return (
    <div
      className={[
        "flex flex-wrap items-center justify-between gap-2 rounded-lg border px-3 py-2 text-sm",
        expired ? "border-destructive/30 bg-destructive/5" : "border-warning/30 bg-warning/5",
      ].join(" ")}
    >
      <span className="font-medium text-foreground">
        {row.title}
        {row.clientName ? ` · ${row.clientName}` : ""}
        {" · "}
        {expired ? `venceu em ${formatDate(row.expiresAt)}` : `vence em ${days} ${days === 1 ? "dia" : "dias"}`}
      </span>
      <div className="flex items-center gap-2">
        {row.clientId ? (
          <Link href={`/clientes/${row.clientId}`} className="text-xs font-semibold text-primary hover:underline">
            Abrir cliente
          </Link>
        ) : null}
        <NewTaskDialog clientId={row.clientId ?? undefined} consortiumContractId={row.consortiumContractId ?? undefined} />
      </div>
    </div>
  );
}

export function CenterCriticalSection({ rows }: { rows: DocumentCenterRow[] }) {
  const expired = rows.filter((r) => r.kind === "document" && isExpired(r));
  const expiringSoon = rows.filter((r) => r.kind === "document" && isExpiringSoon(r));

  if (expired.length === 0 && expiringSoon.length === 0) return null;

  return (
    <div className="card-premium rounded-2xl p-5 md:p-6">
      <h3 className="mb-4 text-h2 font-bold text-foreground">Pendências críticas</h3>
      <div className="space-y-4">
        {expired.length > 0 ? (
          <div>
            <p className="mb-2 text-xs font-bold uppercase text-destructive">Vencidos</p>
            <div className="space-y-1.5">
              {expired.map((row) => (
                <CriticalRow key={row.id} row={row} />
              ))}
            </div>
          </div>
        ) : null}

        {expiringSoon.length > 0 ? (
          <div>
            <p className="mb-2 text-xs font-bold uppercase text-warning">Vencendo em breve</p>
            <div className="space-y-1.5">
              {expiringSoon.map((row) => (
                <CriticalRow key={row.id} row={row} />
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
