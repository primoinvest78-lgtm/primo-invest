"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";

import { AuditTimeline } from "@/components/consortium-engine/audit-timeline";
import {
  ActionButton,
  EmptyState,
  Feedback,
  Field,
  NativeSelect,
  Section,
  Stat,
  StatusBadge,
  tableClass,
  tdClass,
  thClass,
  trClass,
  useEngineAction,
} from "@/components/consortium-engine/ui";
import { Button } from "@/components/ui/button";
import { HumanData } from "@/components/ui/human-data";
import { Input } from "@/components/ui/input";
import {
  addCreditRequirement,
  addGuarantee,
  decideCreditRequirement,
  decideGuarantee,
  recordAmortization,
  recordCreditMovement,
  recordSettlement,
  requestRequirementDocument,
  transitionCredit,
} from "@/lib/actions/consortium-credit";
import { CREDIT_STATUS_LABEL, CREDIT_TRANSITIONS, evaluateRequirementGate, type CreditStatus } from "@/lib/consortium-engine/credit.ts";
import {
  GUARANTEE_STATUS_LABEL,
  GUARANTEE_TYPE_LABEL,
  labelOf,
  MOVEMENT_TYPE_LABEL,
  REQUIREMENT_CLASS_LABEL,
  REQUIREMENT_STAGE_LABEL,
  REQUIREMENT_STATUS_LABEL,
} from "@/lib/consortium-engine/labels.ts";
import { QUOTA_FINANCIAL_STATUS_LABEL } from "@/lib/consortium-engine/settlement.ts";
import type { EngineEvent } from "@/lib/data/consortium-engine";
import type { CreditWorkspace } from "@/lib/data/consortium-credit";
import { formatCurrencyBRL, formatDate } from "@/lib/utils/format";

const GOVERN = ["admin", "manager", "compliance"];
const today = () => new Date().toISOString().slice(0, 10);
const opts = (m: Record<string, string>) => Object.entries(m).map(([value, label]) => ({ value, label }));

function RequirementForm({ operationId }: { operationId: string }) {
  const { pending, errors, message, execute } = useEngineAction();
  function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const f = new FormData(form);
    execute(
      () =>
        addCreditRequirement(operationId, {
          stage: String(f.get("stage")),
          classification: String(f.get("classification")),
          applies: f.get("applies") === "on",
          title: String(f.get("title") ?? ""),
          description: String(f.get("description") ?? ""),
          legalBasis: String(f.get("legalBasis") ?? ""),
        }),
      () => form.reset(),
    );
  }
  return (
    <form onSubmit={submit} className="space-y-2 rounded-xl border border-dashed border-black/15 p-3">
      <p className="text-sm font-semibold">Novo requisito</p>
      <div className="grid gap-2 sm:grid-cols-3">
        <Field label="Etapa">
          <NativeSelect name="stage" options={opts(REQUIREMENT_STAGE_LABEL)} />
        </Field>
        <Field label="Classificação" hint="Só obrigatório (ou condicional aplicável) bloqueia.">
          <NativeSelect name="classification" options={opts(REQUIREMENT_CLASS_LABEL)} />
        </Field>
        <label className="flex items-center gap-2 pt-6 text-sm">
          <input type="checkbox" name="applies" defaultChecked /> Aplica-se a este caso
        </label>
      </div>
      <div className="grid gap-2 sm:grid-cols-3">
        <Field label="Requisito">
          <Input name="title" required />
        </Field>
        <Field label="Descrição">
          <Input name="description" />
        </Field>
        <Field label="Fundamento" hint="Regulamento, contrato ou norma.">
          <Input name="legalBasis" />
        </Field>
      </div>
      <Feedback errors={errors} message={message} />
      <Button size="sm" type="submit" disabled={pending}>
        Adicionar
      </Button>
    </form>
  );
}

function GuaranteeForm({ operationId }: { operationId: string }) {
  const { pending, errors, message, execute } = useEngineAction();
  function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const f = new FormData(form);
    const n = (k: string) => (String(f.get(k) ?? "").trim() ? Number(f.get(k)) : null);
    execute(
      () =>
        addGuarantee(operationId, {
          guaranteeType: String(f.get("type")),
          required: f.get("required") === "on",
          assetDescription: String(f.get("asset") ?? ""),
          appraisalValue: n("appraisal"),
          appraisalDate: String(f.get("appraisalDate") ?? "") || null,
          validUntil: String(f.get("validUntil") ?? "") || null,
          pendingNotes: String(f.get("notes") ?? ""),
        }),
      () => form.reset(),
    );
  }
  return (
    <form onSubmit={submit} className="space-y-2 rounded-xl border border-dashed border-black/15 p-3">
      <p className="text-sm font-semibold">Nova garantia</p>
      <div className="grid gap-2 sm:grid-cols-3">
        <Field label="Tipo">
          <NativeSelect name="type" options={opts(GUARANTEE_TYPE_LABEL)} />
        </Field>
        <Field label="Bem / descrição">
          <Input name="asset" />
        </Field>
        <label className="flex items-center gap-2 pt-6 text-sm">
          <input type="checkbox" name="required" defaultChecked /> Exigida para liberar
        </label>
      </div>
      <div className="grid gap-2 sm:grid-cols-4">
        <Field label="Valor de avaliação">
          <Input name="appraisal" type="number" step="0.01" />
        </Field>
        <Field label="Data da avaliação">
          <Input name="appraisalDate" type="date" />
        </Field>
        <Field label="Validade">
          <Input name="validUntil" type="date" />
        </Field>
        <Field label="Pendências">
          <Input name="notes" />
        </Field>
      </div>
      <Feedback errors={errors} message={message} />
      <Button size="sm" type="submit" disabled={pending}>
        Adicionar
      </Button>
    </form>
  );
}

function MovementForm({ operationId, canGovern }: { operationId: string; canGovern: boolean }) {
  const { pending, errors, message, execute } = useEngineAction();
  const [type, setType] = useState<"CREDIT_USAGE" | "CREDIT_USAGE_REVERSAL" | "CREDIT_UPDATE">("CREDIT_USAGE");
  function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const f = new FormData(form);
    execute(
      () =>
        recordCreditMovement(operationId, {
          type,
          amount: Number(f.get("amount")),
          effectiveDate: String(f.get("date")),
          reference: String(f.get("reference") ?? ""),
          description: String(f.get("description") ?? ""),
        }),
      () => form.reset(),
    );
  }
  return (
    <form onSubmit={submit} className="space-y-2">
      <div className="grid gap-2 sm:grid-cols-4">
        <Field label="Movimento">
          <NativeSelect
            value={type}
            onChange={(v) => setType(v as typeof type)}
            options={[
              { value: "CREDIT_USAGE", label: "Utilização" },
              { value: "CREDIT_USAGE_REVERSAL", label: "Estorno de utilização" },
              ...(canGovern ? [{ value: "CREDIT_UPDATE", label: "Atualização do crédito (novo valor)" }] : []),
            ]}
          />
        </Field>
        <Field label={type === "CREDIT_UPDATE" ? "Novo crédito atualizado" : "Valor"}>
          <Input name="amount" type="number" step="0.01" min="0.01" required />
        </Field>
        <Field label="Data">
          <Input name="date" type="date" defaultValue={today()} required />
        </Field>
        <Field label="Referência" hint="NF, contrato de compra, índice.">
          <Input name="reference" />
        </Field>
      </div>
      <Field label="Descrição">
        <Input name="description" />
      </Field>
      <Feedback errors={errors} message={message} />
      <Button size="sm" type="submit" disabled={pending}>
        Registrar
      </Button>
    </form>
  );
}

function AmortizationForm({ contractId, operationId }: { contractId: string; operationId: string }) {
  const { pending, errors, message, execute } = useEngineAction();
  const [kind, setKind] = useState<"REDUCE_TERM" | "REDUCE_INSTALLMENT" | "SETTLEMENT">("REDUCE_TERM");
  function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const base = { amount: Number(f.get("amount")), effectiveDate: String(f.get("date")), reference: String(f.get("reference") ?? ""), creditOperationId: operationId };
    execute(() => (kind === "SETTLEMENT" ? recordSettlement(contractId, base) : recordAmortization(contractId, { ...base, mode: kind })));
  }
  return (
    <form onSubmit={submit} className="space-y-2">
      <div className="grid gap-2 sm:grid-cols-4">
        <Field label="Operação" hint="A regra (prazo ou parcela) vem do contrato.">
          <NativeSelect
            value={kind}
            onChange={(v) => setKind(v as typeof kind)}
            options={[
              { value: "REDUCE_TERM", label: "Amortizar reduzindo prazo" },
              { value: "REDUCE_INSTALLMENT", label: "Amortizar reduzindo parcela" },
              { value: "SETTLEMENT", label: "Quitação (parcial ou total)" },
            ]}
          />
        </Field>
        <Field label="Valor">
          <Input name="amount" type="number" step="0.01" min="0.01" required />
        </Field>
        <Field label="Data">
          <Input name="date" type="date" defaultValue={today()} required />
        </Field>
        <Field label="Referência">
          <Input name="reference" />
        </Field>
      </div>
      <Feedback errors={errors} message={message} />
      <Button size="sm" type="submit" disabled={pending}>
        {pending ? "Aplicando…" : "Calcular e aplicar"}
      </Button>
    </form>
  );
}

export function CreditWorkspaceView({ ws, role, events }: { ws: CreditWorkspace; role: string; events: EngineEvent[] }) {
  const op = ws.operation;
  const canGovern = GOVERN.includes(role);
  const [decisionNotes, setDecisionNotes] = useState<Record<string, string>>({});
  const next = CREDIT_TRANSITIONS[op.status as CreditStatus].filter((s) => !["PARTIALLY_USED", "USED"].includes(s));
  const gateApprove = evaluateRequirementGate(ws.requirements, "APPROVED");
  const gateRelease = evaluateRequirementGate(ws.requirements, "AVAILABLE");

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4 xl:grid-cols-7">
        <Stat label="Crédito contratado" value={formatCurrencyBRL(op.contractedCredit)} />
        <Stat label="Crédito atualizado" value={formatCurrencyBRL(op.updatedCredit)} delay={0.03} />
        <Stat label="Lance" value={formatCurrencyBRL(op.bidAmount)} delay={0.06} />
        <Stat label="Lance embutido" value={formatCurrencyBRL(op.embeddedBidAmount)} delay={0.09} />
        <Stat label="Crédito líquido" value={formatCurrencyBRL(op.netAvailableCredit)} tone="success" delay={0.12} />
        <Stat label="Utilizado" value={formatCurrencyBRL(op.usedCredit)} delay={0.15} />
        <Stat label="Saldo de crédito" value={formatCurrencyBRL(op.remainingCredit)} delay={0.18} />
      </div>

      <Section
        title="Fluxo do crédito"
        subtitle="Contemplado → documentação → análise → garantia → aprovação → crédito disponível → utilização. Disponível não é pagamento."
        actions={<StatusBadge status={op.status} label={CREDIT_STATUS_LABEL[op.status as CreditStatus]} />}
      >
        <div className="space-y-3">
          <p className="text-xs text-card-beige-muted-foreground">
            Crédito líquido = atualizado {formatCurrencyBRL(op.updatedCredit)} − embutido {formatCurrencyBRL(op.embeddedBidAmount)} ={" "}
            {formatCurrencyBRL(op.netAvailableCredit)}. Lance com recursos próprios: {formatCurrencyBRL(op.bidAmount - op.embeddedBidAmount)}.
          </p>
          {gateApprove.blocking.length ? (
            <p className="text-xs text-destructive">Bloqueia aprovação: {gateApprove.blocking.map((r) => r.title).join(", ")}.</p>
          ) : null}
          {gateRelease.blocking.length ? (
            <p className="text-xs text-destructive">Bloqueia liberação: {gateRelease.blocking.map((r) => r.title).join(", ")}.</p>
          ) : null}
          {gateRelease.warnings.length ? (
            <p className="text-xs text-amber-700">Recomendado (não bloqueia): {gateRelease.warnings.map((r) => r.title).join(", ")}.</p>
          ) : null}
          <div className="flex flex-wrap gap-2">
            {next.map((to) => (
              <ActionButton
                key={to}
                label={CREDIT_STATUS_LABEL[to]}
                variant={to === "CANCELLED" ? "destructive" : "default"}
                confirm={to === "AVAILABLE" ? "Disponibilizar o crédito? Documentação e garantias obrigatórias são conferidas." : to === "CANCELLED" ? "Cancelar a operação de crédito?" : undefined}
                action={() => transitionCredit(op.id, to)}
                disabled={["APPROVED", "AVAILABLE", "CANCELLED"].includes(to) && !canGovern}
              />
            ))}
          </div>
        </div>
      </Section>

      <Section title="Documentação da contemplação e da liberação" subtitle="Separada do cadastro do cliente. Classificada: obrigatório, condicional, recomendado, informativo.">
        <div className="space-y-4">
          {ws.requirements.length === 0 ? (
            <EmptyState>Nenhum requisito cadastrado. Cadastre os exigidos pelo regulamento e contrato.</EmptyState>
          ) : (
            (["CONTEMPLATION", "ANALYSIS", "GUARANTEE", "RELEASE"] as const).map((stage) => {
              const items = ws.requirements.filter((r) => r.stage === stage);
              if (!items.length) return null;
              return (
                <div key={stage}>
                  <p className="mb-1 text-label font-bold uppercase text-card-beige-muted-foreground">{REQUIREMENT_STAGE_LABEL[stage]}</p>
                  <div className="space-y-2">
                    {items.map((r) => (
                      <div key={r.id} className="space-y-2 rounded-xl border border-black/10 px-3 py-2 text-sm transition-colors hover:bg-black/5">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <p className="font-semibold">
                            {r.title}{" "}
                            <span className={`text-xs ${r.classification === "MANDATORY" ? "text-destructive" : "text-card-beige-muted-foreground"}`}>
                              · {REQUIREMENT_CLASS_LABEL[r.classification]}
                              {r.classification === "CONDITIONAL" ? (r.applies ? " (aplica-se)" : " (não se aplica)") : ""}
                            </span>
                          </p>
                          <StatusBadge status={r.status} label={REQUIREMENT_STATUS_LABEL[r.status]} />
                        </div>
                        {r.description || r.legalBasis ? (
                          <p className="text-xs text-card-beige-muted-foreground">
                            {r.description} {r.legalBasis ? `· Fundamento: ${r.legalBasis}` : ""}
                          </p>
                        ) : null}
                        <div className="flex flex-wrap items-start gap-2">
                          <Input
                            className="h-7 max-w-[220px] text-xs"
                            placeholder="Observação"
                            value={decisionNotes[r.id] ?? ""}
                            onChange={(e) => setDecisionNotes((s) => ({ ...s, [r.id]: e.target.value }))}
                          />
                          <ActionButton size="xs" variant="outline" label="Recebido" action={() => decideCreditRequirement(op.id, r.id, { status: "RECEIVED", applies: r.applies, notes: decisionNotes[r.id] ?? "" })} />
                          {canGovern ? (
                            <>
                              <ActionButton size="xs" label="Aprovar" action={() => decideCreditRequirement(op.id, r.id, { status: "APPROVED", applies: r.applies, notes: decisionNotes[r.id] ?? "" })} />
                              <ActionButton size="xs" variant="destructive" label="Reprovar" action={() => decideCreditRequirement(op.id, r.id, { status: "REJECTED", applies: r.applies, notes: decisionNotes[r.id] ?? "" })} />
                              <ActionButton size="xs" variant="outline" label="Dispensar" confirm="Dispensar este requisito? A decisão fica registrada." action={() => decideCreditRequirement(op.id, r.id, { status: "WAIVED", applies: r.applies, notes: decisionNotes[r.id] ?? "" })} />
                            </>
                          ) : null}
                          {r.classification === "CONDITIONAL" ? (
                            <ActionButton size="xs" variant="ghost" label={r.applies ? "Marcar não aplicável" : "Marcar aplicável"} action={() => decideCreditRequirement(op.id, r.id, { status: r.status, applies: !r.applies, notes: decisionNotes[r.id] ?? "" })} />
                          ) : null}
                          {!r.documentRequestId ? (
                            <ActionButton size="xs" variant="ghost" label="Solicitar documento" action={() => requestRequirementDocument(op.id, r.id)} />
                          ) : (
                            <Link href="/documentos/documentos" className="pt-1 text-xs font-semibold text-accent hover:underline">
                              ver solicitação
                            </Link>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })
          )}
          <RequirementForm operationId={op.id} />
        </div>
      </Section>

      <Section title="Garantias">
        <div className="space-y-3">
          {ws.guarantees.length === 0 ? <EmptyState>Nenhuma garantia cadastrada.</EmptyState> : null}
          {ws.guarantees.map((g) => (
            <div key={g.id} className="space-y-1 rounded-xl border border-black/10 px-3 py-2 text-sm transition-colors hover:bg-black/5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-semibold">
                  {labelOf(GUARANTEE_TYPE_LABEL, g.guaranteeType)} {g.assetDescription ? `· ${g.assetDescription}` : ""}{" "}
                  {g.required ? <span className="text-xs text-destructive">· exigida</span> : null}
                </p>
                <StatusBadge status={g.status} label={labelOf(GUARANTEE_STATUS_LABEL, g.status)} />
              </div>
              <p className="text-xs text-card-beige-muted-foreground">
                Avaliação {g.appraisalValue !== null ? formatCurrencyBRL(g.appraisalValue) : "—"} {g.appraisalDate ? `em ${formatDate(g.appraisalDate)}` : ""} ·
                validade {g.validUntil ? formatDate(g.validUntil) : "—"} {g.pendingNotes ? `· ${g.pendingNotes}` : ""}
              </p>
              <div className="flex flex-wrap gap-2">
                {g.status === "PENDING" ? <ActionButton size="xs" variant="outline" label="Em análise" action={() => decideGuarantee(op.id, g.id, "UNDER_ANALYSIS", "")} /> : null}
                {canGovern && ["PENDING", "UNDER_ANALYSIS"].includes(g.status) ? (
                  <>
                    <ActionButton size="xs" label="Aprovar" action={() => decideGuarantee(op.id, g.id, "APPROVED", "")} />
                    <ActionButton size="xs" variant="destructive" label="Reprovar" action={() => decideGuarantee(op.id, g.id, "REJECTED", "")} />
                  </>
                ) : null}
              </div>
            </div>
          ))}
          <GuaranteeForm operationId={op.id} />
        </div>
      </Section>

      <Section title="Utilização do crédito" subtitle="Nunca ultrapassa o crédito líquido. Todo movimento vai para o razão.">
        {["AVAILABLE", "PARTIALLY_USED", "USED", "APPROVED", "PENDING_DOCUMENTS", "UNDER_ANALYSIS"].includes(op.status) ? (
          <MovementForm operationId={op.id} canGovern={canGovern} />
        ) : (
          <EmptyState>Crédito encerrado.</EmptyState>
        )}
      </Section>

      <Section
        title="Saldo devedor, amortização e quitação"
        subtitle="Contemplação não é quitação. Saldo calculado sobre as parcelas registradas do contrato."
      >
        {ws.contract && ws.position ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
              <Stat label="Situação da cota" value={QUOTA_FINANCIAL_STATUS_LABEL[ws.position.status]} href="/consorcios/parcelas" />
              <Stat label="Saldo devedor" value={formatCurrencyBRL(ws.position.outstanding)} tone={ws.position.outstanding > 0 ? "warning" : "success"} href="/consorcios/parcelas" />
              <Stat label="Pago" value={formatCurrencyBRL(ws.position.paid)} />
              <Stat label="Amortizado" value={formatCurrencyBRL(ws.position.amortized)} />
              <Stat label="Parcelas em aberto" value={String(ws.position.openInstallments)} />
            </div>
            <p className="text-xs text-card-beige-muted-foreground">
              {ws.position.explanation.join(" ")}{" "}
              <Link href={`/consorcios/contratos/${ws.contract.id}`} className="font-semibold text-accent hover:underline">
                Contrato {ws.contract.label}
              </Link>
            </p>
            {ws.position.openInstallments > 0 ? (
              <AmortizationForm contractId={ws.contract.id} operationId={op.id} />
            ) : (
              <p className="text-sm font-semibold text-primary">Sem saldo devedor registrado.</p>
            )}
          </div>
        ) : (
          <EmptyState>Cota sem contrato de cliente vinculado — saldo devedor não acompanhado aqui.</EmptyState>
        )}
      </Section>

      <Section title="Razão financeiro" subtitle="Somente inclusão: nada é editado ou apagado.">
        {ws.movements.length === 0 ? (
          <EmptyState>Nenhum movimento.</EmptyState>
        ) : (
          <div className="overflow-x-auto">
            <table className={tableClass}>
              <thead>
                <tr>
                  <th className={thClass}>Data</th>
                  <th className={thClass}>Movimento</th>
                  <th className={thClass}>Valor</th>
                  <th className={thClass}>Referência</th>
                  <th className={thClass}>Cálculo</th>
                </tr>
              </thead>
              <tbody>
                {ws.movements.map((mv) => (
                  <tr key={mv.id} className={trClass}>
                    <td className={tdClass}>{formatDate(mv.effectiveDate)}</td>
                    <td className={tdClass}>{labelOf(MOVEMENT_TYPE_LABEL, mv.movementType)}</td>
                    <td className={tdClass}>{formatCurrencyBRL(mv.amount)}</td>
                    <td className={tdClass}>{mv.reference ?? "—"}</td>
                    <td className={tdClass}>
                      <details>
                        <summary className="cursor-pointer text-xs font-semibold text-accent">Ver detalhes</summary>
                        <div className="mt-1 max-w-md rounded-lg bg-black/5 p-2">
                          <HumanData data={mv.details} />
                        </div>
                      </details>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Section>

      <Section title="Auditoria do crédito">
        <AuditTimeline events={events} />
      </Section>
    </div>
  );
}
