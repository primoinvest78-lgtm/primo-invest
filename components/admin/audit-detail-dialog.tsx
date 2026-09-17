"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import type { AuditLogEntry } from "@/lib/admin/audit-labels";
import { auditActionLabel, moduleLabelForTable } from "@/lib/admin/audit-labels";
import { formatDateTime } from "@/lib/utils/format";

function JsonBlock({ label, data }: { label: string; data: Record<string, unknown> | null }) {
  return (
    <div>
      <p className="text-label font-bold uppercase text-card-beige-muted-foreground">{label}</p>
      {data ? (
        <pre className="mt-1 max-h-64 overflow-auto rounded-xl border border-border bg-muted/40 p-3 text-caption text-foreground">
          {JSON.stringify(data, null, 2)}
        </pre>
      ) : (
        <p className="mt-1 text-body-sm text-card-beige-muted-foreground">Não disponível.</p>
      )}
    </div>
  );
}

export function AuditDetailDialog({
  entry,
  userName,
  onClose,
}: {
  entry: AuditLogEntry | null;
  userName: string;
  onClose: () => void;
}) {
  return (
    <Dialog open={entry !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Detalhe do evento</DialogTitle>
        </DialogHeader>
        {entry ? (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3 text-body-sm">
              <div>
                <p className="text-label font-bold uppercase text-card-beige-muted-foreground">Usuário</p>
                <p className="text-foreground">{userName}</p>
              </div>
              <div>
                <p className="text-label font-bold uppercase text-card-beige-muted-foreground">Ação</p>
                <p className="text-foreground">{auditActionLabel(entry.action)}</p>
              </div>
              <div>
                <p className="text-label font-bold uppercase text-card-beige-muted-foreground">Módulo</p>
                <p className="text-foreground">{moduleLabelForTable(entry.tableName)}</p>
              </div>
              <div>
                <p className="text-label font-bold uppercase text-card-beige-muted-foreground">Data/hora</p>
                <p className="text-foreground">{formatDateTime(entry.createdAt)}</p>
              </div>
              <div>
                <p className="text-label font-bold uppercase text-card-beige-muted-foreground">Objeto</p>
                <p className="truncate text-foreground">{entry.recordId ?? "Não disponível"}</p>
              </div>
              <div>
                <p className="text-label font-bold uppercase text-card-beige-muted-foreground">Origem</p>
                <p className="text-foreground">Não disponível</p>
              </div>
              <div>
                <p className="text-label font-bold uppercase text-card-beige-muted-foreground">Resultado</p>
                <p className="text-foreground">Sucesso</p>
              </div>
            </div>

            <JsonBlock label="Antes" data={entry.oldData} />
            <JsonBlock label="Depois" data={entry.newData} />
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
