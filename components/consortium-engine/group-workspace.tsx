"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { AssemblyCreateDialog } from "@/components/consortium-engine/assembly-create-dialog";
import { AuditTimeline } from "@/components/consortium-engine/audit-timeline";
import {
  ActionButton,
  EmptyState,
  Feedback,
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
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { generateQuotaNumbering, importQuotaStatuses, linkContractQuotas } from "@/lib/actions/consortium-engine";
import {
  ELIGIBILITY_SOURCE_LABEL,
  formatQuota,
  labelOf,
  PAYMENT_STATUS_LABEL,
  QUOTA_STATUS_LABEL,
} from "@/lib/consortium-engine/labels.ts";
import type { NumberingIntegrity } from "@/lib/consortium-engine/numbering.ts";
import { ASSEMBLY_STATUS_LABEL } from "@/lib/consortium-engine/state-machine.ts";
import type { EngineAssembly, EngineEvent, EngineGroup, EngineQuota } from "@/lib/data/consortium-engine";
import { formatCurrencyBRL, formatDate } from "@/lib/utils/format";

function ImportQuotas({ groupId }: { groupId: string }) {
  const [text, setText] = useState("");
  const { pending, errors, message, execute } = useEngineAction();
  return (
    <div className="space-y-2">
      <Textarea
        rows={5}
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={"número;situação;pagamento;contemplada\n450;ativa;em dia;não\n451;ativa;inadimplente;não"}
        className="font-mono text-xs"
      />
      <p className="text-[11px] text-card-beige-muted-foreground">
        Situação: ativa, cancelada, excluída, disponível. Pagamento: em dia, inadimplente, desconhecido. Cotas vinculadas a contrato
        não são sobrescritas.
      </p>
      <Button size="sm" disabled={pending || !text.trim()} onClick={() => execute(() => importQuotaStatuses(groupId, text), () => setText(""))}>
        {pending ? "Importando…" : "Importar situação"}
      </Button>
      <Feedback errors={errors} message={message} />
    </div>
  );
}

export function GroupWorkspace({
  group,
  quotas,
  assemblies,
  events,
  integrity,
}: {
  group: EngineGroup;
  quotas: EngineQuota[];
  assemblies: EngineAssembly[];
  events: EngineEvent[];
  integrity: NumberingIntegrity;
}) {
  const [filter, setFilter] = useState("");
  const d = group.numbering.displayDigits;
  const counts = useMemo(() => {
    const active = quotas.filter((q) => q.status === "ACTIVE");
    return {
      known: quotas.length,
      active: active.length,
      delinquent: active.filter((q) => q.paymentStatus === "DELINQUENT").length,
      contemplated: quotas.filter((q) => q.contemplatedAt).length,
      linked: quotas.filter((q) => q.eligibilitySource === "CONTRACT").length,
    };
  }, [quotas]);
  const visible = quotas.filter((q) => !filter || formatQuota(q.quotaNumber, d).includes(filter.trim()) || (q.holderLabel ?? "").toLowerCase().includes(filter.toLowerCase()));

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        <Stat label="Cotas do grupo" value={String(group.quotaCount)} hint={`${formatQuota(group.numbering.numberStart, d)} a ${formatQuota(group.numbering.numberEnd, d)}`} />
        <Stat label="Cotas com dado" value={String(counts.known)} hint={counts.known < group.quotaCount ? "base parcial" : "base completa"} tone={counts.known < group.quotaCount ? "warning" : "success"} delay={0.05} />
        <Stat label="Ativas" value={String(counts.active)} delay={0.1} />
        <Stat label="Inadimplentes" value={String(counts.delinquent)} tone={counts.delinquent ? "danger" : "default"} delay={0.15} />
        <Stat label="Contempladas" value={String(counts.contemplated)} delay={0.2} />
      </div>

      <Section title="Parâmetros do grupo" subtitle={group.regulationReference ? `Regulamento: ${group.regulationReference}` : "Regulamento não referenciado."}>
        <dl className="grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-4">
          {[
            ["Crédito", group.creditAmount !== null ? formatCurrencyBRL(group.creditAmount) : "—"],
            ["Parcela", group.installmentAmount !== null ? formatCurrencyBRL(group.installmentAmount) : "—"],
            ["Prazo", group.termMonths ? `${group.termMonths} meses` : "—"],
            ["Constituição", group.constitutedAt ? formatDate(group.constitutedAt) : "—"],
            ["Participantes", group.participantsCount ?? "—"],
            ["Reajuste", group.adjustmentIndex ?? "—"],
            ["Taxa de administração", group.adminFeePercentage !== null ? `${group.adminFeePercentage}%` : "—"],
            ["Fundo de reserva", group.reserveFundPercentage !== null ? `${group.reserveFundPercentage}%` : "—"],
            ["Seguro", group.insuranceRequired ? "Obrigatório" : "Não obrigatório"],
            ["Cotas de clientes vinculadas", counts.linked],
          ].map(([k, v]) => (
            <div key={String(k)} className="rounded-xl border border-black/10 px-3 py-2">
              <dt className="text-label font-bold uppercase text-card-beige-muted-foreground">{k}</dt>
              <dd className="mt-0.5 font-semibold text-foreground">{v}</dd>
            </div>
          ))}
        </dl>
      </Section>

      <Section
        title="Numeração e cotas"
        subtitle="Número da cota ≠ número sorteado ≠ número equivalente. Só a faixa primária do grupo vira cota."
        actions={
          <>
            <ActionButton label="Vincular cotas de clientes" variant="outline" action={() => linkContractQuotas(group.id)} />
            <ActionButton
              label="Gerar numeração completa"
              variant="outline"
              confirm="Cria todos os números da faixa como 'não comercializada'. Use só se a alocação das cotas é feita aqui."
              action={() => generateQuotaNumbering(group.id)}
            />
          </>
        }
      >
        <div className="mb-4 grid gap-4 lg:grid-cols-2">
          <div className="rounded-xl border border-black/10 p-3 text-sm">
            <p className="font-semibold">Integridade da numeração</p>
            {integrity.duplicates.length || integrity.outOfRange.length ? (
              <p className="text-destructive">
                Duplicadas: {integrity.duplicates.join(", ") || "nenhuma"} · Fora da faixa: {integrity.outOfRange.join(", ") || "nenhuma"}
              </p>
            ) : (
              <p className="text-card-beige-muted-foreground">Sem duplicidade e sem número fora da faixa.</p>
            )}
            {quotas.length < group.quotaCount ? (
              <p className="mt-1 text-xs text-card-beige-muted-foreground">
                {group.quotaCount - quotas.length} número(s) sem dado. Normal quando o PRIMO acompanha só as cotas dos clientes — a
                apuração fica como conferência (base parcial) conforme a política da regra.
              </p>
            ) : null}
          </div>
          <div className="rounded-xl border border-black/10 p-3">
            <p className="mb-2 text-sm font-semibold">Importar situação das cotas</p>
            <ImportQuotas groupId={group.id} />
          </div>
        </div>
        <Input placeholder="Filtrar por número ou titular" value={filter} onChange={(e) => setFilter(e.target.value)} className="mb-3 max-w-xs" />
        {visible.length === 0 ? (
          <EmptyState>Nenhuma cota cadastrada.</EmptyState>
        ) : (
          <div className="max-h-[480px] overflow-auto">
            <table className={tableClass}>
              <thead className="sticky top-0 bg-card">
                <tr>
                  <th className={thClass}>Cota</th>
                  <th className={thClass}>Titular</th>
                  <th className={thClass}>Situação</th>
                  <th className={thClass}>Pagamento</th>
                  <th className={thClass}>Contemplada</th>
                  <th className={thClass}>Origem do dado</th>
                </tr>
              </thead>
              <tbody>
                {visible.slice(0, 500).map((q) => (
                  <tr key={q.id} className={trClass}>
                    <td className={`${tdClass} font-mono font-semibold`}>{formatQuota(q.quotaNumber, d)}</td>
                    <td className={tdClass}>
                      {q.contractId ? (
                        <Link href={`/consorcios/contratos/${q.contractId}`} className="hover:text-primary">
                          {q.holderLabel ?? "Contrato"}
                        </Link>
                      ) : (
                        (q.holderLabel ?? "—")
                      )}
                    </td>
                    <td className={tdClass}>{labelOf(QUOTA_STATUS_LABEL, q.status)}</td>
                    <td className={`${tdClass} ${q.paymentStatus === "DELINQUENT" ? "font-semibold text-destructive" : ""}`}>
                      {labelOf(PAYMENT_STATUS_LABEL, q.paymentStatus)}
                    </td>
                    <td className={tdClass}>{q.contemplatedAt ? (q.contemplatedAt === "1900-01-01" ? "Sim (importado)" : formatDate(q.contemplatedAt)) : "Não"}</td>
                    <td className={tdClass}>{labelOf(ELIGIBILITY_SOURCE_LABEL, q.eligibilitySource)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {visible.length > 500 ? <p className="mt-2 text-xs text-card-beige-muted-foreground">Mostrando 500 de {visible.length}. Use o filtro.</p> : null}
          </div>
        )}
      </Section>

      <Section title="Assembleias do grupo" actions={<AssemblyCreateDialog groups={[group]} fixedGroupId={group.id} />}>
        {assemblies.length === 0 ? (
          <EmptyState>Nenhuma assembleia.</EmptyState>
        ) : (
          <div className="space-y-2">
            {assemblies.map((a) => (
              <Link
                key={a.id}
                href={`/consorcios/motor/assembleias/${a.id}`}
                className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-black/10 bg-black/5 px-3.5 py-3 transition-all duration-150 hover:-translate-y-0.5 hover:bg-black/10"
              >
                <span className="text-sm font-semibold">
                  Assembleia nº {a.assemblyNumber} · {formatDate(a.assemblyDate)}
                </span>
                <StatusBadge status={a.status} label={ASSEMBLY_STATUS_LABEL[a.status]} />
              </Link>
            ))}
          </div>
        )}
      </Section>

      <Section title="Auditoria do grupo">
        <AuditTimeline events={events} />
      </Section>
    </div>
  );
}
