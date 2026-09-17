"use client";

import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { ReviewDialog } from "@/components/payments/review-dialog";
import type { MatchableClient, MatchableInstallment } from "@/lib/payments/matching";
import { PAYMENT_STATUS_CLASS, PAYMENT_STATUS_LABEL, type PaymentEvidence, type PaymentStatus } from "@/lib/payments/types";
import { formatCurrencyBRL, formatDate, formatDateTime } from "@/lib/utils/format";

type TabKey = "todos" | "recebidos" | "conciliados" | "revisao" | "excecoes" | "duplicidades";

const TABS: { key: TabKey; label: string; statuses: PaymentStatus[] }[] = [
  { key: "todos", label: "Todos", statuses: [] },
  { key: "recebidos", label: "Recebidos", statuses: ["recebido", "processando", "identificado"] },
  { key: "conciliados", label: "Conciliados", statuses: ["conciliado"] },
  { key: "revisao", label: "Aguardando revisão", statuses: ["aguardando_revisao"] },
  { key: "excecoes", label: "Exceções", statuses: ["excecao"] },
  { key: "duplicidades", label: "Duplicidades", statuses: ["duplicado"] },
];

export function EvidenceQueue({
  evidences,
  clients,
  installments,
}: {
  evidences: PaymentEvidence[];
  clients: MatchableClient[];
  installments: MatchableInstallment[];
}) {
  const [tab, setTab] = useState<TabKey>("todos");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const counts = useMemo(() => {
    const map = new Map<TabKey, number>();
    for (const t of TABS) {
      map.set(t.key, t.key === "todos" ? evidences.length : evidences.filter((e) => t.statuses.includes(e.status)).length);
    }
    return map;
  }, [evidences]);

  const activeTab = TABS.find((t) => t.key === tab)!;
  const filtered = activeTab.statuses.length === 0 ? evidences : evidences.filter((e) => activeTab.statuses.includes(e.status));

  return (
    <section className="card-premium rounded-2xl p-5 md:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-label font-bold uppercase text-card-beige-muted-foreground">Fila</p>
          <h3 className="mt-0.5 text-h2 font-bold text-foreground">Comprovantes de pagamento</h3>
        </div>
        <span className="shrink-0 text-body-sm text-card-beige-muted-foreground">
          {filtered.length} {filtered.length === 1 ? "comprovante" : "comprovantes"}
        </span>
      </div>

      <div className="mt-4 flex flex-wrap gap-1.5">
        {TABS.map((t) => (
          <Button key={t.key} size="sm" variant={tab === t.key ? "default" : "outline"} onClick={() => setTab(t.key)}>
            {t.label} ({counts.get(t.key) ?? 0})
          </Button>
        ))}
      </div>

      <div className="mt-4 overflow-x-auto rounded-2xl border border-black/10">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-black/10 bg-black/5 text-left">
              <th className="px-4 py-3 text-label font-bold uppercase text-card-beige-muted-foreground">Comprovante</th>
              <th className="px-4 py-3 text-label font-bold uppercase text-card-beige-muted-foreground">Cliente informado</th>
              <th className="px-4 py-3 text-label font-bold uppercase text-card-beige-muted-foreground">Valor</th>
              <th className="px-4 py-3 text-label font-bold uppercase text-card-beige-muted-foreground">Data</th>
              <th className="px-4 py-3 text-label font-bold uppercase text-card-beige-muted-foreground">Status</th>
              <th className="px-4 py-3 text-label font-bold uppercase text-card-beige-muted-foreground">Recebido em</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-body-sm text-card-beige-muted-foreground">
                  Nenhum comprovante nessa categoria.
                </td>
              </tr>
            ) : (
              filtered.map((evidence) => (
                <tr key={evidence.id} className="border-b border-black/10 last:border-b-0">
                  <td className="max-w-[220px] truncate px-4 py-3 font-semibold text-foreground">{evidence.documentName ?? "Comprovante"}</td>
                  <td className="px-4 py-3 text-card-beige-muted-foreground">{evidence.clientHint ?? "Não informado"}</td>
                  <td className="px-4 py-3 text-foreground">{evidence.extractedAmount !== null ? formatCurrencyBRL(evidence.extractedAmount) : "—"}</td>
                  <td className="px-4 py-3 text-card-beige-muted-foreground">{evidence.extractedDate ? formatDate(evidence.extractedDate) : "—"}</td>
                  <td className="px-4 py-3">
                    <span className={["rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase", PAYMENT_STATUS_CLASS[evidence.status]].join(" ")}>
                      {PAYMENT_STATUS_LABEL[evidence.status]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-card-beige-muted-foreground">{formatDateTime(evidence.createdAt)}</td>
                  <td className="px-4 py-3 text-right">
                    <Button size="sm" variant="ghost" onClick={() => setSelectedId(evidence.id)}>
                      Revisar
                    </Button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <ReviewDialog key={selectedId ?? "none"} evidenceId={selectedId} clients={clients} installments={installments} onClose={() => setSelectedId(null)} />
    </section>
  );
}
