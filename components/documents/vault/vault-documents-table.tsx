"use client";

import { FileText } from "lucide-react";
import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { VaultDocumentDetailDialog } from "@/components/documents/vault/vault-document-detail-dialog";
import type { VaultDocument } from "@/lib/data/documents";
import { categoryLabel, documentStatusLabel, formatBytes, isExpired, isExpiringSoon } from "@/lib/utils/document-helpers";
import { formatDate } from "@/lib/utils/format";

export function VaultDocumentsTable({
  documents,
  initialSelected,
}: {
  documents: VaultDocument[];
  initialSelected?: VaultDocument | null;
}) {
  const [selected, setSelected] = useState<VaultDocument | null>(initialSelected ?? null);

  return (
    <div className="space-y-4">
      <div className="card-premium overflow-x-auto rounded-2xl">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-black/10 bg-black/5 text-left">
              <th className="px-4 py-3 text-label font-bold uppercase text-card-beige-muted-foreground">Documento</th>
              <th className="px-4 py-3 text-label font-bold uppercase text-card-beige-muted-foreground">Categoria</th>
              <th className="px-4 py-3 text-label font-bold uppercase text-card-beige-muted-foreground">
                Cliente / Contrato
              </th>
              <th className="px-4 py-3 text-label font-bold uppercase text-card-beige-muted-foreground">Tamanho</th>
              <th className="px-4 py-3 text-label font-bold uppercase text-card-beige-muted-foreground">Validade</th>
              <th className="px-4 py-3 text-label font-bold uppercase text-card-beige-muted-foreground">Enviado em</th>
              <th className="px-4 py-3 text-label font-bold uppercase text-card-beige-muted-foreground">Status</th>
            </tr>
          </thead>
          <tbody>
            {documents.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-body-sm text-card-beige-muted-foreground">
                  Nenhum documento encontrado.
                </td>
              </tr>
            ) : (
              documents.map((doc) => {
                const expired = isExpired(doc);
                const expiringSoon = isExpiringSoon(doc);

                return (
                  <tr
                    key={doc.id}
                    onClick={() => setSelected(doc)}
                    className={[
                      "group cursor-pointer border-b border-black/10 border-l-2 last:border-b-0 transition-all duration-200 hover:bg-black/5",
                      expired ? "border-l-destructive bg-destructive/5" : "border-l-transparent hover:border-l-primary",
                    ].join(" ")}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 shrink-0 text-accent" />
                        <div className="min-w-0">
                          <p className="truncate font-semibold text-foreground">{doc.name}</p>
                          {doc.versionCount > 1 ? (
                            <p className="text-xs text-card-beige-muted-foreground">{doc.versionCount} versões</p>
                          ) : null}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant="outline">{categoryLabel(doc.category)}</Badge>
                    </td>
                    <td className="px-4 py-3 text-card-beige-muted-foreground">
                      {doc.clientName ?? doc.contractLabel ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-card-beige-muted-foreground">{formatBytes(doc.latestFileSize)}</td>
                    <td className="px-4 py-3">
                      {doc.expiresAt ? (
                        <span className={expired ? "font-semibold text-destructive" : expiringSoon ? "font-semibold text-warning" : "text-card-beige-muted-foreground"}>
                          {formatDate(doc.expiresAt)}
                        </span>
                      ) : (
                        <span className="text-card-beige-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-card-beige-muted-foreground">{formatDate(doc.createdAt)}</td>
                    <td className="px-4 py-3">
                      <Badge variant={doc.status === "active" ? "default" : "outline"}>{documentStatusLabel(doc.status)}</Badge>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <VaultDocumentDetailDialog documentId={selected?.id ?? null} onClose={() => setSelected(null)} />
    </div>
  );
}
