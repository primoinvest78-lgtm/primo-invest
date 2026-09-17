"use client";

import { AlertTriangle, Check, ExternalLink, Loader2, Link as LinkIcon, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { getDocumentSignedUrl } from "@/lib/actions/documents";
import {
  confirmManualLink,
  confirmPaymentMatch,
  createTaskFromPaymentException,
  fetchEvidenceDetail,
  markPaymentDuplicate,
  rejectPaymentEvidence,
  resolvePaymentException,
} from "@/lib/actions/payments";
import type { MatchableClient, MatchableInstallment } from "@/lib/payments/matching";
import {
  PAYMENT_CONFIDENCE_CLASS,
  PAYMENT_CONFIDENCE_LABEL,
  PAYMENT_EXCEPTION_LABEL,
  PAYMENT_METHOD_LABEL,
  PAYMENT_STATUS_CLASS,
  PAYMENT_STATUS_LABEL,
  type PaymentEvidenceDetail,
} from "@/lib/payments/types";
import { formatCurrencyBRL, formatDate, formatDateTime } from "@/lib/utils/format";

function StatusPill({ status, label, className }: { status: string; label: string; className: string }) {
  return (
    <span key={status} className={["rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase", className].join(" ")}>
      {label}
    </span>
  );
}

export function ReviewDialog({
  evidenceId,
  clients,
  installments,
  onClose,
}: {
  evidenceId: string | null;
  clients: MatchableClient[];
  installments: MatchableInstallment[];
  onClose: () => void;
}) {
  const router = useRouter();
  const [detail, setDetail] = useState<PaymentEvidenceDetail | null>(null);
  const [loading, startLoading] = useTransition();
  const [pending, startTransition] = useTransition();
  const [manualClientId, setManualClientId] = useState("none");
  const [manualInstallmentId, setManualInstallmentId] = useState("none");
  const [rejectionReason, setRejectionReason] = useState("");
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    if (!evidenceId) return;
    startLoading(async () => {
      const d = await fetchEvidenceDetail(evidenceId);
      setDetail(d);
    });
  }, [evidenceId]);

  const clientInstallments = installments.filter(
    (i) => i.clientId === manualClientId && i.status !== "paid" && i.status !== "exempt" && i.status !== "cancelled",
  );

  function refresh() {
    if (evidenceId) fetchEvidenceDetail(evidenceId).then(setDetail);
    router.refresh();
  }

  function handleConfirmMatch(matchId: string, amount: number) {
    if (!evidenceId) return;
    setActionError(null);
    startTransition(async () => {
      const result = await confirmPaymentMatch({ evidenceId, matchId, amount });
      if (result.status !== "confirmed") setActionError(friendlyConfirmError(result.status));
      else refresh();
    });
  }

  function handleManualLink() {
    if (!evidenceId || manualClientId === "none" || !detail) return;
    setActionError(null);
    startTransition(async () => {
      const amount = detail.evidence.extractedAmount ?? 0;
      const result = await confirmManualLink({
        evidenceId,
        clientId: manualClientId,
        consortiumContractId: installments.find((i) => i.id === manualInstallmentId)?.contractId ?? null,
        consortiumInstallmentId: manualInstallmentId === "none" ? null : manualInstallmentId,
        amount,
      });
      if (result.status !== "confirmed") setActionError(friendlyConfirmError(result.status));
      else refresh();
    });
  }

  function handleReject() {
    if (!evidenceId) return;
    startTransition(async () => {
      await rejectPaymentEvidence(evidenceId, rejectionReason || "Sem motivo informado.");
      refresh();
    });
  }

  function handleDuplicate() {
    if (!evidenceId) return;
    startTransition(async () => {
      await markPaymentDuplicate(evidenceId, "Marcado manualmente como duplicado pelo operador.");
      refresh();
    });
  }

  function handleResolveException(exceptionId: string) {
    startTransition(async () => {
      await resolvePaymentException(exceptionId);
      refresh();
    });
  }

  function handleCreateTask() {
    if (!detail) return;
    const clientId = detail.matches[0]?.clientId ?? null;
    startTransition(async () => {
      await createTaskFromPaymentException({
        title: `Revisar comprovante de pagamento — ${detail.evidence.documentName ?? "sem nome"}`,
        description: detail.exceptions.map((e) => PAYMENT_EXCEPTION_LABEL[e.exceptionType]).join(", ") || "Comprovante precisa de revisão manual.",
        clientId,
      });
    });
  }

  return (
    <Dialog open={evidenceId !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Revisão de comprovante</DialogTitle>
        </DialogHeader>

        {loading || !detail ? (
          <div className="flex justify-center py-10">
            <Loader2 className="h-6 w-6 animate-spin text-card-beige-muted-foreground" />
          </div>
        ) : (
          <div className="max-h-[70vh] space-y-4 overflow-y-auto pr-1">
            <div className="flex flex-wrap items-center gap-2">
              <StatusPill status={detail.evidence.status} label={PAYMENT_STATUS_LABEL[detail.evidence.status]} className={PAYMENT_STATUS_CLASS[detail.evidence.status]} />
              <DocumentLink storagePath={detail.evidence.documentStoragePath} />
            </div>

            <section>
              <p className="text-label font-bold uppercase text-card-beige-muted-foreground">Dados extraídos</p>
              <div className="mt-2 grid grid-cols-2 gap-3 rounded-2xl border border-border p-3 text-body-sm sm:grid-cols-3">
                <Field label="Valor" value={detail.evidence.extractedAmount !== null ? formatCurrencyBRL(detail.evidence.extractedAmount) : "Não informado"} />
                <Field label="Data" value={detail.evidence.extractedDate ? formatDate(detail.evidence.extractedDate) : "Não informado"} />
                <Field label="Hora" value={detail.evidence.extractedTime ?? "Não informado"} />
                <Field label="Método" value={detail.evidence.extractedMethod ? PAYMENT_METHOD_LABEL[detail.evidence.extractedMethod as keyof typeof PAYMENT_METHOD_LABEL] ?? detail.evidence.extractedMethod : "Não informado"} />
                <Field label="Banco" value={detail.evidence.extractedBank ?? "Não informado"} />
                <Field label="Beneficiário" value={detail.evidence.extractedBeneficiary ?? "Não informado"} />
                <Field label="Identificador" value={detail.evidence.extractedTransactionId ?? "Não informado"} />
                <Field label="Cliente informado" value={detail.evidence.clientHint ?? "Não informado"} />
                <Field label="Enviado por" value={detail.evidence.uploadedByName ?? "Não disponível"} />
              </div>
            </section>

            {detail.transaction ? (
              <section className="rounded-2xl border border-primary/30 bg-primary/[0.05] p-3">
                <p className="text-label font-bold uppercase text-primary">Pagamento confirmado</p>
                <p className="mt-1 text-body-sm text-foreground">
                  {detail.transaction.clientName} · {formatCurrencyBRL(detail.transaction.amount)} · {detail.transaction.contractLabel ?? "Sem contrato"}
                </p>
                <p className="text-caption text-card-beige-muted-foreground">
                  {detail.transaction.autoConfirmed ? "Baixa automática" : `Confirmado por ${detail.transaction.confirmedByName ?? "—"}`} em{" "}
                  {formatDateTime(detail.transaction.confirmedAt)}
                </p>
              </section>
            ) : null}

            {detail.exceptions.length > 0 ? (
              <section>
                <p className="text-label font-bold uppercase text-card-beige-muted-foreground">Exceções</p>
                <ul className="mt-2 space-y-2">
                  {detail.exceptions.map((exception) => (
                    <li key={exception.id} className="flex items-center justify-between gap-2 rounded-2xl border border-destructive/40 bg-destructive/[0.06] px-3 py-2">
                      <div className="min-w-0">
                        <p className="text-body-sm font-semibold text-destructive">{PAYMENT_EXCEPTION_LABEL[exception.exceptionType]}</p>
                        {exception.details ? <p className="truncate text-caption text-card-beige-muted-foreground">{exception.details}</p> : null}
                      </div>
                      {exception.status === "aberta" ? (
                        <Button size="sm" variant="outline" disabled={pending} onClick={() => handleResolveException(exception.id)}>
                          <Check className="h-3.5 w-3.5" />
                          Resolver
                        </Button>
                      ) : (
                        <span className="shrink-0 text-caption text-card-beige-muted-foreground">Resolvida</span>
                      )}
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}

            {detail.evidence.status === "aguardando_revisao" || detail.evidence.status === "excecao" ? (
              <>
                <section>
                  <p className="text-label font-bold uppercase text-card-beige-muted-foreground">Possíveis correspondências</p>
                  {detail.matches.length === 0 ? (
                    <p className="mt-2 text-body-sm text-card-beige-muted-foreground">Nenhum candidato encontrado.</p>
                  ) : (
                    <ul className="mt-2 space-y-2">
                      {detail.matches.map((match) => (
                        <li key={match.id} className="rounded-2xl border border-border p-3">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <p className="font-semibold text-foreground">{match.clientName ?? "Cliente não identificado"}</p>
                            <StatusPill status={match.confidence} label={`${PAYMENT_CONFIDENCE_LABEL[match.confidence]} (${match.score})`} className={PAYMENT_CONFIDENCE_CLASS[match.confidence]} />
                          </div>
                          {match.installmentLabel ? <p className="text-body-sm text-card-beige-muted-foreground">{match.installmentLabel} · {match.contractLabel}</p> : null}
                          {match.reasons.length > 0 ? <p className="mt-1 text-caption text-card-beige-muted-foreground">{match.reasons.join(" ")}</p> : null}
                          {match.divergences.length > 0 ? (
                            <p className="mt-1 flex items-center gap-1 text-caption font-semibold text-destructive">
                              <AlertTriangle className="h-3 w-3" />
                              {match.divergences.map((d) => PAYMENT_EXCEPTION_LABEL[d as keyof typeof PAYMENT_EXCEPTION_LABEL] ?? d).join(", ")}
                            </p>
                          ) : null}
                          {match.consortiumInstallmentId ? (
                            <Button
                              size="sm"
                              className="mt-2"
                              disabled={pending}
                              onClick={() => handleConfirmMatch(match.id, detail.evidence.extractedAmount ?? 0)}
                            >
                              {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                              Confirmar
                            </Button>
                          ) : null}
                        </li>
                      ))}
                    </ul>
                  )}
                </section>

                <section className="rounded-2xl border border-border p-3">
                  <p className="text-label font-bold uppercase text-card-beige-muted-foreground">Vincular manualmente</p>
                  <div className="mt-2 grid gap-2 sm:grid-cols-2">
                    <Select value={manualClientId} onValueChange={(v) => { setManualClientId(v ?? "none"); setManualInstallmentId("none"); }}>
                      <SelectTrigger className="w-full">
                        <SelectValue>{() => (manualClientId === "none" ? "Selecionar cliente" : clients.find((c) => c.id === manualClientId)?.fullName ?? "Cliente")}</SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Selecionar cliente</SelectItem>
                        {clients.map((c) => (
                          <SelectItem key={c.id} value={c.id}>
                            {c.fullName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Select value={manualInstallmentId} onValueChange={(v) => setManualInstallmentId(v ?? "none")} disabled={manualClientId === "none"}>
                      <SelectTrigger className="w-full">
                        <SelectValue>
                          {() => {
                            if (manualInstallmentId === "none") return "Selecionar parcela";
                            const found = clientInstallments.find((i) => i.id === manualInstallmentId);
                            return found ? `Parcela ${found.installmentNumber} — ${found.contractLabel}` : "Parcela";
                          }}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Selecionar parcela</SelectItem>
                        {clientInstallments.map((i) => (
                          <SelectItem key={i.id} value={i.id}>
                            Parcela {i.installmentNumber} — {i.contractLabel}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Button size="sm" className="mt-2" disabled={pending || manualClientId === "none"} onClick={handleManualLink}>
                    <LinkIcon className="h-3.5 w-3.5" />
                    Vincular e confirmar
                  </Button>
                </section>
              </>
            ) : null}

            {actionError ? <p className="text-body-sm font-semibold text-destructive">{actionError}</p> : null}

            {detail.evidence.status !== "conciliado" && detail.evidence.status !== "rejeitado" ? (
              <section>
                <Textarea value={rejectionReason} onChange={(e) => setRejectionReason(e.target.value)} placeholder="Motivo da rejeição (opcional)" rows={2} />
              </section>
            ) : null}
          </div>
        )}

        <DialogFooter>
          {detail && detail.evidence.status !== "conciliado" && detail.evidence.status !== "rejeitado" ? (
            <>
              <Button variant="outline" disabled={pending} onClick={handleCreateTask}>
                Criar tarefa
              </Button>
              <Button variant="outline" disabled={pending} onClick={handleDuplicate}>
                Marcar como duplicado
              </Button>
              <Button variant="destructive" disabled={pending} onClick={handleReject}>
                <X className="h-3.5 w-3.5" />
                Rejeitar
              </Button>
            </>
          ) : null}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <p className="text-caption font-bold uppercase text-card-beige-muted-foreground">{label}</p>
      <p className="truncate text-foreground">{value}</p>
    </div>
  );
}

function DocumentLink({ storagePath }: { storagePath: string | null }) {
  const [loading, setLoading] = useState(false);

  if (!storagePath) return null;

  async function openDocument() {
    setLoading(true);
    try {
      const { url } = await getDocumentSignedUrl(storagePath as string, false);
      window.open(url, "_blank", "noopener,noreferrer");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button size="sm" variant="outline" disabled={loading} onClick={openDocument}>
      {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ExternalLink className="h-3.5 w-3.5" />}
      Ver comprovante
    </Button>
  );
}

function friendlyConfirmError(status: string): string {
  if (status === "already_paid") return "Essa parcela já estava paga — não foi possível confirmar de novo.";
  if (status === "installment_not_found") return "Parcela não encontrada.";
  if (status === "evidence_not_found") return "Comprovante não encontrado.";
  return "Não foi possível confirmar.";
}
