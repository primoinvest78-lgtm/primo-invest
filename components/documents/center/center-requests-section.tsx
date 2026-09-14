import Link from "next/link";

import { RequestActions } from "@/components/documents/center/request-actions";
import type { DocumentRequestListItem } from "@/lib/data/document-center";
import { categoryLabel } from "@/lib/utils/document-helpers";
import { requestStatusLabel, responsibleRoleLabel } from "@/lib/utils/document-center-helpers";
import { formatDate } from "@/lib/utils/format";

const STATUS_DOT: Record<string, string> = {
  solicitado: "bg-primary",
  recebido: "bg-accent",
  em_analise: "bg-warning",
  aprovado: "bg-success",
  reprovado: "bg-destructive",
};

export function CenterRequestsSection({ requests }: { requests: DocumentRequestListItem[] }) {
  const open = requests.filter((r) => r.status !== "arquivado");

  if (open.length === 0) return null;

  return (
    <div className="card-premium rounded-2xl p-5 md:p-6">
      <h3 className="mb-4 text-h2 font-bold text-foreground">Solicitações em andamento</h3>
      <div className="space-y-2">
        {open.map((request) => (
          <div
            key={request.id}
            className="flex flex-col gap-2 rounded-xl border border-black/10 bg-black/5 p-3 sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className={["h-2 w-2 shrink-0 rounded-full", STATUS_DOT[request.status] ?? "bg-muted-foreground"].join(" ")} />
                <p className="truncate text-sm font-semibold text-foreground">{request.title}</p>
                <span className="shrink-0 text-xs font-medium text-card-beige-muted-foreground">
                  {requestStatusLabel(request.status)}
                </span>
              </div>
              <p className="mt-0.5 text-xs text-card-beige-muted-foreground">
                {request.clientId ? (
                  <Link href={`/clientes/${request.clientId}`} className="hover:underline">
                    {request.clientName}
                  </Link>
                ) : (
                  request.clientName ?? "Sem cliente"
                )}
                {request.category ? ` · ${categoryLabel(request.category)}` : ""}
                {request.dueDate ? ` · prazo ${formatDate(request.dueDate)}` : ""}
                {request.responsibleName ? ` · ${request.responsibleName}` : request.responsibleRole ? ` · ${responsibleRoleLabel(request.responsibleRole)}` : ""}
              </p>
            </div>
            <RequestActions request={request} />
          </div>
        ))}
      </div>
    </div>
  );
}
