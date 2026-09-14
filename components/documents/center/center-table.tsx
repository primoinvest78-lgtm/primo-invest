"use client";

import { FileText, HelpCircle } from "lucide-react";
import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { CenterDetailDialog } from "@/components/documents/center/center-detail-dialog";
import type { DocumentCenterRow } from "@/lib/data/document-center";
import { categoryLabel } from "@/lib/utils/document-helpers";
import {
  CENTER_STATUS_CLASS,
  CENTER_STATUS_LABEL,
  CENTER_STATUS_VARIANT,
  computeCenterStatus,
  typeLabel,
} from "@/lib/utils/document-center-helpers";
import { formatDate, formatDateTime } from "@/lib/utils/format";

export function CenterTable({ rows }: { rows: DocumentCenterRow[] }) {
  const [selected, setSelected] = useState<DocumentCenterRow | null>(null);

  return (
    <div className="space-y-4">
      <div className="card-premium overflow-x-auto rounded-2xl">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-black/10 bg-black/5 text-left">
              <th className="px-4 py-3 text-label font-bold uppercase text-card-beige-muted-foreground">Documento</th>
              <th className="px-4 py-3 text-label font-bold uppercase text-card-beige-muted-foreground">Cliente</th>
              <th className="px-4 py-3 text-label font-bold uppercase text-card-beige-muted-foreground">Categoria</th>
              <th className="px-4 py-3 text-label font-bold uppercase text-card-beige-muted-foreground">Tipo</th>
              <th className="px-4 py-3 text-label font-bold uppercase text-card-beige-muted-foreground">Status</th>
              <th className="px-4 py-3 text-label font-bold uppercase text-card-beige-muted-foreground">Validade</th>
              <th className="px-4 py-3 text-label font-bold uppercase text-card-beige-muted-foreground">Responsável</th>
              <th className="px-4 py-3 text-label font-bold uppercase text-card-beige-muted-foreground">Última atualização</th>
              <th className="px-4 py-3 text-label font-bold uppercase text-card-beige-muted-foreground">Origem</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={9} className="px-4 py-10 text-center text-body-sm text-card-beige-muted-foreground">
                  Nenhum documento encontrado.
                </td>
              </tr>
            ) : (
              rows.map((row) => {
                const status = computeCenterStatus(row);
                return (
                  <tr
                    key={row.id}
                    onClick={() => setSelected(row)}
                    className="group cursor-pointer border-b border-black/10 border-l-2 border-l-transparent last:border-b-0 transition-all duration-200 hover:border-l-primary hover:bg-black/5"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {row.kind === "request" ? (
                          <HelpCircle className="h-4 w-4 shrink-0 text-primary" />
                        ) : (
                          <FileText className="h-4 w-4 shrink-0 text-accent" />
                        )}
                        <div className="min-w-0">
                          <p className="truncate font-semibold text-foreground">{row.title}</p>
                          {row.versionCount > 1 ? (
                            <p className="text-xs text-card-beige-muted-foreground">{row.versionCount} versões</p>
                          ) : null}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-card-beige-muted-foreground">{row.clientName ?? row.contractLabel ?? "—"}</td>
                    <td className="px-4 py-3">
                      <Badge variant="outline">{categoryLabel(row.category)}</Badge>
                    </td>
                    <td className="px-4 py-3 text-card-beige-muted-foreground">{typeLabel(row)}</td>
                    <td className="px-4 py-3">
                      <Badge variant={CENTER_STATUS_VARIANT[status]} className={CENTER_STATUS_CLASS[status]}>
                        {CENTER_STATUS_LABEL[status]}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-card-beige-muted-foreground">
                      {row.expiresAt ? formatDate(row.expiresAt) : row.dueDate ? `prazo ${formatDate(row.dueDate)}` : "—"}
                    </td>
                    <td className="px-4 py-3 text-card-beige-muted-foreground">{row.responsibleName ?? "—"}</td>
                    <td className="px-4 py-3 text-card-beige-muted-foreground">{formatDateTime(row.updatedAt)}</td>
                    <td className="px-4 py-3 text-card-beige-muted-foreground">{row.origin}</td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <CenterDetailDialog row={selected} onClose={() => setSelected(null)} />
    </div>
  );
}
