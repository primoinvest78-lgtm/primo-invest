"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { HumanChanges } from "@/components/ui/human-data";
import type { AuditLogEntry } from "@/lib/admin/audit-labels";
import { auditActionLabel, moduleLabelForTable } from "@/lib/admin/audit-labels";
import { formatDateTime } from "@/lib/utils/format";

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
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
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
                <p className="text-label font-bold uppercase text-card-beige-muted-foreground">Registro</p>
                <p className="text-foreground">{entry.recordId ? `Registro de ${moduleLabelForTable(entry.tableName)}` : "Não disponível"}</p>
              </div>
              <div>
                <p className="text-label font-bold uppercase text-card-beige-muted-foreground">Resultado</p>
                <p className="text-foreground">Sucesso</p>
              </div>
            </div>

            <div>
              <p className="mb-1 text-label font-bold uppercase text-card-beige-muted-foreground">
                {entry.oldData && entry.newData ? "O que mudou" : entry.newData ? "Dados registrados" : "Dados removidos"}
              </p>
              <HumanChanges before={entry.oldData} after={entry.newData} />
            </div>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
