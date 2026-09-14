import { NewTaskDialog } from "@/components/tasks/new-task-dialog";
import type { VaultDocument } from "@/lib/data/documents";
import { isExpired, isExpiringSoon } from "@/lib/utils/document-helpers";
import { formatDate } from "@/lib/utils/format";

export function VaultPendingSection({
  documents,
  clientsWithoutDocs,
}: {
  documents: VaultDocument[];
  clientsWithoutDocs: { id: string; fullName: string }[];
}) {
  const expired = documents.filter(isExpired);
  const expiringSoon = documents.filter((d) => isExpiringSoon(d));

  if (expired.length === 0 && expiringSoon.length === 0 && clientsWithoutDocs.length === 0) {
    return null;
  }

  return (
    <div className="card-premium rounded-2xl p-5 md:p-6">
      <h3 className="mb-4 text-h2 font-bold text-foreground">Documentos pendentes</h3>

      <div className="space-y-4">
        {expired.length > 0 ? (
          <div>
            <p className="mb-2 text-xs font-bold uppercase text-destructive">Vencidos</p>
            <div className="space-y-1.5">
              {expired.map((doc) => (
                <div key={doc.id} className="flex items-center justify-between gap-2 rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm">
                  <span className="font-medium text-foreground">
                    {doc.name} {doc.clientName ? `· ${doc.clientName}` : ""} · venceu em {formatDate(doc.expiresAt)}
                  </span>
                  <NewTaskDialog clientId={doc.clientId ?? undefined} />
                </div>
              ))}
            </div>
          </div>
        ) : null}

        {expiringSoon.length > 0 ? (
          <div>
            <p className="mb-2 text-xs font-bold uppercase text-warning">Vencendo em breve</p>
            <div className="space-y-1.5">
              {expiringSoon.map((doc) => (
                <div key={doc.id} className="flex items-center justify-between gap-2 rounded-lg border border-warning/30 bg-warning/5 px-3 py-2 text-sm">
                  <span className="font-medium text-foreground">
                    {doc.name} {doc.clientName ? `· ${doc.clientName}` : ""} · vence em {formatDate(doc.expiresAt)}
                  </span>
                  <NewTaskDialog clientId={doc.clientId ?? undefined} />
                </div>
              ))}
            </div>
          </div>
        ) : null}

        {clientsWithoutDocs.length > 0 ? (
          <div>
            <p className="mb-2 text-xs font-bold uppercase text-card-beige-muted-foreground">
              Clientes sem nenhum documento
            </p>
            <div className="flex flex-wrap gap-2">
              {clientsWithoutDocs.map((client) => (
                <div key={client.id} className="flex items-center gap-2 rounded-full border border-black/10 bg-black/5 px-3 py-1.5 text-xs font-medium text-foreground">
                  {client.fullName}
                  <NewTaskDialog clientId={client.id} />
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
