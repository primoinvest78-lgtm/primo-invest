"use client";

import { useState } from "react";

import { ActionButton, EmptyState, Feedback, Field, Hash, StatusBadge, useEngineAction } from "@/components/consortium-engine/ui";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { applyRetification, decideRetification, requestRetification } from "@/lib/actions/consortium-engine";
import type { RetificationRecord } from "@/lib/data/consortium-engine";
import { formatDate } from "@/lib/utils/format";

const RET_STATUS: Record<string, string> = {
  REQUESTED: "Solicitada",
  APPROVED: "Aprovada",
  REJECTED: "Rejeitada",
  APPLIED: "Aplicada",
};

/**
 * Retificação: ORIGINAL → RETIFICAÇÃO → NOVO RESULTADO. Quem pede não
 * decide (duas pessoas); o original nunca é apagado; o novo resultado
 * ainda passa por homologação.
 */
export function RetificationPanel({
  assemblyId,
  status,
  retifications,
  canGovern,
  userId,
  names,
}: {
  assemblyId: string;
  status: string;
  retifications: RetificationRecord[];
  canGovern: boolean;
  userId: string;
  names: Record<string, string>;
}) {
  const [reason, setReason] = useState("");
  const [evidence, setEvidence] = useState("");
  const [decisionNotes, setDecisionNotes] = useState("");
  const [refresh, setRefresh] = useState(true);
  const { pending, errors, message, execute } = useEngineAction();
  const open = retifications.find((r) => r.status === "REQUESTED" || r.status === "APPROVED");
  const canRequest = ["COMPLETED", "LOCKED"].includes(status) && !open;

  return (
    <div className="space-y-4">
      {retifications.length === 0 ? <EmptyState>Nenhuma retificação.</EmptyState> : null}
      {retifications.map((r) => (
        <div key={r.id} className="space-y-2 rounded-xl border border-black/10 p-3 text-sm">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="font-semibold">Solicitada em {formatDate(r.requestedAt)} por {r.requestedBy ? (names[r.requestedBy] ?? "—") : "—"}</p>
            <StatusBadge status={r.status === "APPLIED" ? "COMPLETED" : r.status} label={RET_STATUS[r.status]} />
          </div>
          <p>
            <span className="font-semibold">Motivo:</span> {r.reason}
          </p>
          <p>
            <span className="font-semibold">Evidência:</span> {r.evidenceNotes ?? "—"}
          </p>
          <div className="flex flex-wrap gap-4">
            <Hash value={r.originalResultHash} label="resultado original" />
            <Hash value={r.newResultHash} label="novo resultado" />
          </div>
          {r.approvedBy ? (
            <p className="text-xs text-card-beige-muted-foreground">
              Decidida por {names[r.approvedBy] ?? "—"} {r.approvedAt ? `em ${formatDate(r.approvedAt)}` : ""} {r.decisionNotes ? `— ${r.decisionNotes}` : ""}
            </p>
          ) : null}
          {r.status === "REQUESTED" && canGovern ? (
            r.requestedBy === userId ? (
              <p className="text-xs text-amber-700">Aguardando decisão de outra pessoa com papel de governança.</p>
            ) : (
              <div className="space-y-2">
                <Input placeholder="Observação da decisão" value={decisionNotes} onChange={(e) => setDecisionNotes(e.target.value)} />
                <div className="flex gap-2">
                  <ActionButton label="Aprovar retificação" action={() => decideRetification(r.id, true, decisionNotes)} />
                  <ActionButton label="Rejeitar" variant="destructive" action={() => decideRetification(r.id, false, decisionNotes)} />
                </div>
              </div>
            )
          ) : null}
          {r.status === "APPROVED" && canGovern ? (
            <div className="space-y-2 rounded-lg bg-black/5 p-2">
              <label className="flex items-center gap-2 text-xs">
                <input type="checkbox" checked={refresh} onChange={(e) => setRefresh(e.target.checked)} />
                Gerar novo snapshot de elegibilidade com os dados corrigidos (o anterior é preservado)
              </label>
              <ActionButton
                label="Aplicar retificação"
                confirm="O cálculo original será marcado como substituído (nunca apagado) e um novo cálculo será gerado. Confirmar?"
                action={() => applyRetification(r.id, refresh)}
              />
            </div>
          ) : null}
        </div>
      ))}

      {canRequest ? (
        <div className="space-y-2 rounded-xl border border-dashed border-black/15 p-3">
          <p className="text-sm font-semibold">Solicitar retificação</p>
          <Field label="Motivo (mínimo 10 caracteres)">
            <Textarea rows={2} value={reason} onChange={(e) => setReason(e.target.value)} />
          </Field>
          <Field label="Evidência" hint="Documento, protocolo ou descrição objetiva do que comprova o erro.">
            <Input value={evidence} onChange={(e) => setEvidence(e.target.value)} />
          </Field>
          <Button size="sm" variant="destructive" disabled={pending} onClick={() => execute(() => requestRetification(assemblyId, { reason, evidenceNotes: evidence }), () => { setReason(""); setEvidence(""); })}>
            {pending ? "Enviando…" : "Solicitar retificação"}
          </Button>
          <Feedback errors={errors} message={message} />
        </div>
      ) : null}
    </div>
  );
}
