"use client";

import { FileText, Trash2, Upload } from "lucide-react";
import { useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { deleteContractDocument, recordContractDocument } from "@/lib/actions/consortiums";
import { createClient } from "@/lib/supabase/client";
import type { ContractDocument } from "@/lib/data/consortiums";
import { formatDate } from "@/lib/utils/format";

function formatBytes(bytes: number | null): string {
  if (!bytes) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function ContractDocumentsTab({
  contractId,
  clientId,
  organizationId,
  documents,
}: {
  contractId: string;
  clientId: string | null;
  organizationId: string;
  documents: ContractDocument[];
}) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deletedIds, setDeletedIds] = useState<Set<string>>(new Set());
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleDelete(doc: ContractDocument) {
    if (!window.confirm(`Excluir "${doc.name}"? Essa ação não pode ser desfeita.`)) return;

    setDeletedIds((prev) => new Set(prev).add(doc.id));
    await deleteContractDocument(doc.id, contractId, clientId, doc.storagePaths);
  }

  async function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError(null);

    try {
      const supabase = createClient();
      const storagePath = `${organizationId}/consorcios/${contractId}/${Date.now()}-${file.name}`;

      const { error: uploadError } = await supabase.storage.from("documents").upload(storagePath, file);
      if (uploadError) throw uploadError;

      await recordContractDocument({
        contractId,
        clientId,
        name: file.name,
        documentType: file.type || "outro",
        storagePath,
        fileSize: file.size,
        mimeType: file.type,
      });
    } catch {
      setError("Não foi possível enviar o documento. Tente novamente.");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  const visibleDocs = documents.filter((d) => !deletedIds.has(d.id));

  return (
    <div className="card-premium rounded-2xl p-5 md:p-6">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-h2 font-bold text-foreground">Documentos do contrato</h3>
        <Button size="sm" variant="outline" disabled={uploading} onClick={() => inputRef.current?.click()}>
          <Upload className="h-3.5 w-3.5" />
          {uploading ? "Enviando..." : "Enviar documento"}
        </Button>
        <input ref={inputRef} type="file" className="hidden" onChange={handleFileChange} />
      </div>

      <p className="mb-3 text-xs text-card-beige-muted-foreground">
        Contrato, aditivos, comprovantes, documentos de contemplação, garantia ou utilização do crédito —
        tudo fica vinculado direto a essa cota.
      </p>

      {error ? <p className="mb-3 text-xs font-medium text-destructive">{error}</p> : null}

      {visibleDocs.length === 0 ? (
        <p className="text-body-sm text-card-beige-muted-foreground">Nenhum documento enviado ainda.</p>
      ) : (
        <div className="space-y-2">
          {visibleDocs.map((doc) => (
            <div
              key={doc.id}
              className="flex items-center gap-3 rounded-xl border border-black/10 bg-black/5 px-3.5 py-3 transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/40 hover:bg-black/10"
            >
              <FileText className="h-4 w-4 shrink-0 text-accent" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-foreground">{doc.name}</p>
                <p className="text-xs text-card-beige-muted-foreground">
                  {formatDate(doc.createdAt)} · {formatBytes(doc.fileSize)}
                  {doc.versionCount > 1 ? ` · ${doc.versionCount} versões` : ""}
                </p>
              </div>
              <button
                type="button"
                aria-label="Excluir documento"
                onClick={() => handleDelete(doc)}
                className="shrink-0 text-card-beige-muted-foreground transition-colors hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
