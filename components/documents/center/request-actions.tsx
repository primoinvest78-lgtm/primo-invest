"use client";

import { useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { advanceRequestStatus, linkDocumentToRequest } from "@/lib/actions/document-requests";
import { recordVaultDocument } from "@/lib/actions/documents";
import { createClient } from "@/lib/supabase/client";
import type { DocumentRequestListItem } from "@/lib/data/document-center";

type RequestActionsInput = Pick<DocumentRequestListItem, "id" | "status" | "clientId" | "category">;

export function RequestActions({ request }: { request: RequestActionsInput }) {
  const [loading, setLoading] = useState<string | null>(null);
  const [reproving, setReproving] = useState(false);
  const [reason, setReason] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleReceive(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setLoading("recebendo");
    try {
      const supabase = createClient();
      const storagePath = `requests/${request.id}/${Date.now()}-${file.name}`;
      const { error } = await supabase.storage.from("documents").upload(storagePath, file);
      if (error) throw error;

      const { id: documentId } = await recordVaultDocument({
        name: file.name,
        documentType: file.type,
        storagePath,
        fileSize: file.size,
        mimeType: file.type,
        clientId: request.clientId,
        consortiumContractId: null,
        category: request.category,
        expiresAt: null,
        tags: [],
      });

      await linkDocumentToRequest(request.id, documentId, request.clientId);
    } finally {
      setLoading(null);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  async function handleAdvance(status: "em_analise" | "aprovado" | "arquivado", notes?: string) {
    setLoading(status);
    try {
      await advanceRequestStatus(request.id, status, notes ?? null, request.clientId);
    } finally {
      setLoading(null);
    }
  }

  async function handleReprove() {
    setLoading("reprovado");
    try {
      await advanceRequestStatus(request.id, "reprovado", reason || null, request.clientId);
      setReproving(false);
      setReason("");
    } finally {
      setLoading(null);
    }
  }

  if (request.status === "solicitado") {
    return (
      <div className="flex items-center gap-2">
        <input ref={inputRef} type="file" className="hidden" onChange={handleReceive} />
        <Button type="button" size="sm" variant="outline" disabled={loading !== null} onClick={() => inputRef.current?.click()}>
          {loading === "recebendo" ? "Enviando..." : "Receber documento"}
        </Button>
      </div>
    );
  }

  if (request.status === "recebido") {
    return (
      <Button type="button" size="sm" variant="outline" disabled={loading !== null} onClick={() => handleAdvance("em_analise")}>
        {loading === "em_analise" ? "Enviando..." : "Enviar para análise"}
      </Button>
    );
  }

  if (request.status === "em_analise") {
    if (reproving) {
      return (
        <div className="flex flex-col gap-1.5 sm:flex-row sm:items-center">
          <input
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Motivo da reprovação"
            className="h-8 w-full rounded-lg border border-black/10 bg-white px-2 text-xs sm:w-48"
          />
          <div className="flex gap-1.5">
            <Button type="button" size="sm" variant="destructive" disabled={loading !== null} onClick={handleReprove}>
              Confirmar
            </Button>
            <Button type="button" size="sm" variant="ghost" onClick={() => setReproving(false)}>
              Cancelar
            </Button>
          </div>
        </div>
      );
    }
    return (
      <div className="flex items-center gap-2">
        <Button type="button" size="sm" disabled={loading !== null} onClick={() => handleAdvance("aprovado")}>
          {loading === "aprovado" ? "Aprovando..." : "Aprovar"}
        </Button>
        <Button type="button" size="sm" variant="destructive" disabled={loading !== null} onClick={() => setReproving(true)}>
          Reprovar
        </Button>
      </div>
    );
  }

  if (request.status === "aprovado" || request.status === "reprovado") {
    return (
      <Button type="button" size="sm" variant="ghost" disabled={loading !== null} onClick={() => handleAdvance("arquivado")}>
        {loading === "arquivado" ? "Arquivando..." : "Arquivar"}
      </Button>
    );
  }

  return null;
}
