"use client";

import { Download, Eye } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { NewTaskDialog } from "@/components/tasks/new-task-dialog";
import { RequestActions } from "@/components/documents/center/request-actions";
import { fetchVaultDocumentDetail, getDocumentSignedUrl, logDocumentAccess } from "@/lib/actions/documents";
import type { DocumentCenterRow } from "@/lib/data/document-center";
import { categoryLabel } from "@/lib/utils/document-helpers";
import {
  CENTER_STATUS_CLASS,
  CENTER_STATUS_LABEL,
  CENTER_STATUS_VARIANT,
  computeCenterStatus,
  requestStatusLabel,
  responsibleRoleLabel,
  typeLabel,
} from "@/lib/utils/document-center-helpers";
import { formatDate, formatDateTime } from "@/lib/utils/format";

function Field({ label, value }: { label: string; value: string | null }) {
  return (
    <div>
      <p className="text-[10px] font-bold uppercase text-card-beige-muted-foreground">{label}</p>
      <p className="mt-0.5 text-sm font-medium text-foreground">{value ?? "—"}</p>
    </div>
  );
}

function DetailBody({ row }: { row: DocumentCenterRow }) {
  const [storagePath, setStoragePath] = useState<string | null>(null);

  useEffect(() => {
    if (row.kind !== "document" || !row.documentId) return;
    let cancelled = false;
    fetchVaultDocumentDetail(row.documentId)
      .then((detail) => {
        if (cancelled) return;
        setStoragePath(detail?.versions[0]?.storagePath ?? null);
      })
      .catch(() => {
        if (!cancelled) setStoragePath(null);
      });
    return () => {
      cancelled = true;
    };
  }, [row.kind, row.documentId]);

  async function handleView() {
    if (!storagePath || !row.documentId) return;
    const { url } = await getDocumentSignedUrl(storagePath, false);
    await logDocumentAccess(row.documentId, "view");
    window.open(url, "_blank", "noopener,noreferrer");
  }

  async function handleDownload() {
    if (!storagePath || !row.documentId) return;
    const { url } = await getDocumentSignedUrl(storagePath, true);
    await logDocumentAccess(row.documentId, "download");
    window.open(url, "_blank", "noopener,noreferrer");
  }

  const status = computeCenterStatus(row);

  return (
    <>
      <DialogHeader>
        <DialogTitle className="flex flex-wrap items-center gap-2">
          {row.title}
          <Badge variant={CENTER_STATUS_VARIANT[status]} className={CENTER_STATUS_CLASS[status]}>
            {CENTER_STATUS_LABEL[status]}
          </Badge>
        </DialogTitle>
      </DialogHeader>

      <div className="flex flex-wrap gap-2">
        {row.kind === "document" && storagePath ? (
          <>
            <Button type="button" size="sm" variant="outline" onClick={handleView}>
              <Eye className="h-3.5 w-3.5" />
              Visualizar
            </Button>
            <Button type="button" size="sm" variant="outline" onClick={handleDownload}>
              <Download className="h-3.5 w-3.5" />
              Baixar
            </Button>
          </>
        ) : null}
        {row.documentId ? (
          <Link href={`/documentos/cofre?documento=${row.documentId}`}>
            <Button type="button" size="sm" variant="outline">
              Abrir no Cofre
            </Button>
          </Link>
        ) : null}
        {row.clientId ? (
          <Link href={`/clientes/${row.clientId}`}>
            <Button type="button" size="sm" variant="outline">
              Abrir cliente
            </Button>
          </Link>
        ) : null}
        <NewTaskDialog clientId={row.clientId ?? undefined} consortiumContractId={row.consortiumContractId ?? undefined} />
      </div>

      {row.requestId ? (
        <div className="rounded-xl border border-black/10 bg-black/5 p-3">
          <p className="mb-2 text-xs font-bold uppercase text-card-beige-muted-foreground">Fluxo da solicitação</p>
          <RequestActions request={{ id: row.requestId, status: row.requestStatus ?? "solicitado", clientId: row.clientId, category: row.category }} />
        </div>
      ) : null}

      <div className="grid grid-cols-2 gap-4 border-t border-black/10 pt-4 sm:grid-cols-3">
        <Field label="Cliente" value={row.clientName} />
        <Field label="Categoria" value={categoryLabel(row.category)} />
        <Field label="Tipo" value={typeLabel(row)} />
        <Field label="Origem" value={row.origin} />
        <Field label="Contrato" value={row.contractLabel} />
        <Field label="Responsável" value={row.responsibleName ?? responsibleRoleLabel(row.responsibleRole)} />
        <Field label="Validade" value={row.expiresAt ? formatDate(row.expiresAt) : null} />
        <Field label="Prazo da solicitação" value={row.dueDate ? formatDate(row.dueDate) : null} />
        <Field label="Status do fluxo" value={row.requestStatus ? requestStatusLabel(row.requestStatus) : null} />
        <Field label="Última atualização" value={formatDateTime(row.updatedAt)} />
        <Field label="Criado em" value={formatDateTime(row.createdAt)} />
      </div>

      {row.decisionNotes ? (
        <div className="border-t border-black/10 pt-4">
          <p className="mb-1 text-xs font-bold uppercase text-card-beige-muted-foreground">Observações da decisão</p>
          <p className="text-sm text-foreground">{row.decisionNotes}</p>
        </div>
      ) : null}
    </>
  );
}

export function CenterDetailDialog({ row, onClose }: { row: DocumentCenterRow | null; onClose: () => void }) {
  return (
    <Dialog open={row !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
        {row ? <DetailBody key={row.id} row={row} /> : null}
      </DialogContent>
    </Dialog>
  );
}
