"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

import { AuditTimeline } from "@/components/consortium-engine/audit-timeline";
import { RuleFormDialog } from "@/components/consortium-engine/rule-form-dialog";
import { ActionButton, EmptyState, Hash, Section, StatusBadge } from "@/components/consortium-engine/ui";
import { createRuleVersion, deleteRuleDraft, transitionRule } from "@/lib/actions/consortium-engine";
import {
  BID_TYPE_LABEL,
  EQUIVALENCE_LABEL,
  labelOf,
  RULE_STATUS_LABEL,
  SEQUENCE_METHOD_LABEL,
  SOURCE_LABEL,
  TIE_BREAK_LABEL,
  UNKNOWN_POLICY_LABEL,
} from "@/lib/consortium-engine/labels.ts";
import type { RuleFieldChange } from "@/lib/consortium-engine/rule-diff.ts";
import { ASSEMBLY_STATUS_LABEL } from "@/lib/consortium-engine/state-machine.ts";
import type { EngineAssembly, EngineEvent, EngineGroup, EngineRule } from "@/lib/data/consortium-engine";
import { formatDate } from "@/lib/utils/format";

const GOVERN = ["admin", "manager", "compliance"];
const yes = (b: boolean) => (b ? "Sim" : "Não");
const pct = (n: number | null) => (n === null ? "—" : `${n}%`);

function show(v: unknown): string {
  if (v === null || v === undefined) return "—";
  if (typeof v === "boolean") return yes(v);
  if (Array.isArray(v)) return v.map((x) => (typeof x === "object" ? JSON.stringify(x) : String(x))).join(" · ");
  return String(v);
}

export function RuleWorkspace({
  rule,
  role,
  groups,
  versions,
  previous,
  diff,
  usedBy,
  events,
  validationErrors,
  hashCheck,
}: {
  rule: EngineRule;
  role: string;
  groups: EngineGroup[];
  versions: EngineRule[];
  previous: EngineRule | null;
  diff: RuleFieldChange[];
  usedBy: (EngineAssembly & { version: number })[];
  events: EngineEvent[];
  validationErrors: string[];
  hashCheck: boolean | null;
}) {
  const router = useRouter();
  const c = rule.config;
  const canGovern = GOVERN.includes(role);

  const lifecycle = (
    <div className="flex flex-wrap items-start gap-2">
      {rule.status === "DRAFT" ? (
        <>
          <RuleFormDialog groups={groups} rule={rule} />
          <ActionButton label="Enviar para revisão" action={() => transitionRule(rule.id, "REVIEW")} disabled={validationErrors.length > 0} />
          <ActionButton label="Excluir rascunho" variant="destructive" confirm="Excluir este rascunho?" action={async () => {
            const r = await deleteRuleDraft(rule.id);
            if (r.ok) router.push("/consorcios/motor");
            return r;
          }} />
        </>
      ) : null}
      {rule.status === "REVIEW" ? (
        <>
          <ActionButton label="Devolver para rascunho" variant="outline" action={() => transitionRule(rule.id, "DRAFT")} />
          {canGovern ? <ActionButton label="Aprovar" confirm="Aprovar esta versão? O conteúdo fica congelado pelo hash." action={() => transitionRule(rule.id, "APPROVED")} /> : null}
        </>
      ) : null}
      {rule.status === "APPROVED" && canGovern ? (
        <ActionButton label="Publicar" confirm="Publicar? A versão publicada anterior desta chave será substituída." action={() => transitionRule(rule.id, "PUBLISHED")} />
      ) : null}
      {["PUBLISHED", "SUPERSEDED"].includes(rule.status) ? (
        <ActionButton label="Arquivar" variant="outline" confirm="Arquivar esta versão?" action={() => transitionRule(rule.id, "ARCHIVED")} />
      ) : null}
      {rule.status !== "DRAFT" ? (
        <ActionButton label="Criar nova versão" variant="outline" action={async () => {
          const r = await createRuleVersion(rule.id);
          if (r.ok && r.data) router.push(`/consorcios/motor/regras/${r.data.id}`);
          return r;
        }} />
      ) : null}
    </div>
  );

  return (
    <div className="space-y-6">
      <Section
        title="Situação da regra"
        subtitle={`Vigência ${formatDate(rule.effectiveFrom)} a ${rule.effectiveUntil ? formatDate(rule.effectiveUntil) : "indeterminado"} · ${labelOf(SOURCE_LABEL, rule.source)}`}
        actions={<StatusBadge status={rule.status} label={labelOf(RULE_STATUS_LABEL, rule.status)} />}
      >
        <div className="space-y-3">
          <div className="flex flex-wrap gap-4 text-xs">
            <span>
              Hash: <Hash value={rule.ruleHash} />
            </span>
            {hashCheck === false ? <span className="font-semibold text-destructive">Conteúdo NÃO confere com o hash registrado.</span> : null}
            {hashCheck === true ? <span className="text-primary">Conteúdo confere com o hash.</span> : null}
            {rule.approvedAt ? <span>Aprovada em {formatDate(rule.approvedAt)}</span> : null}
            {rule.publishedAt ? <span>Publicada em {formatDate(rule.publishedAt)}</span> : null}
          </div>
          {validationErrors.length ? (
            <ul className="list-disc space-y-0.5 pl-5 text-xs text-destructive">
              {validationErrors.map((e) => (
                <li key={e}>{e}</li>
              ))}
            </ul>
          ) : null}
          {lifecycle}
        </div>
      </Section>

      <Section title="Configuração" subtitle="Exatamente o que o motor executa.">
        <div className="grid gap-4 text-sm lg:grid-cols-2">
          <div className="space-y-1 rounded-xl border border-black/10 p-3">
            <p className="font-semibold">Resultado oficial → candidatos</p>
            <p>
              {c.prizeCount} prêmio(s) de {c.prizeDigits} dígitos.
            </p>
            <ol className="mt-1 list-decimal space-y-0.5 pl-5 font-mono text-xs">
              {c.candidatePlan.map((s, i) => (
                <li key={i}>
                  {s.prize}º prêmio · posições {s.positions.join(",")}
                </li>
              ))}
            </ol>
          </div>
          <div className="space-y-1 rounded-xl border border-black/10 p-3">
            <p className="font-semibold">Equivalência e substituição</p>
            <p>Equivalência: {labelOf(EQUIVALENCE_LABEL, c.equivalence.method)}</p>
            {c.equivalence.map ? <p className="font-mono text-xs">{Object.entries(c.equivalence.map).map(([k, v]) => `${k}→${v}`).join(" · ")}</p> : null}
            <p>
              Aproximação: {labelOf(SEQUENCE_METHOD_LABEL, c.approximation.method)}
              {c.approximation.method !== "NONE" ? ` (até ${c.approximation.maxSteps} passo(s)${c.approximation.wrapAround ? ", com volta" : ""})` : ""}
            </p>
            <p>
              Substituição: {labelOf(SEQUENCE_METHOD_LABEL, c.fallback.method)}
              {c.fallback.wrapAround ? " (com volta ao início)" : ""}
              {c.fallback.sequence ? ` · ${c.fallback.sequence.join(", ")}` : ""}
            </p>
          </div>
          <div className="space-y-1 rounded-xl border border-black/10 p-3">
            <p className="font-semibold">Elegibilidade e recursos</p>
            <p>Exige adimplência: {yes(c.eligibility.requireUpToDate)}</p>
            <p>Exclui já contempladas: {yes(c.eligibility.excludeContemplated)}</p>
            <p>Cotas sem dado: {labelOf(UNKNOWN_POLICY_LABEL, c.eligibility.unknownPolicy)}</p>
            <p>Fundo de reserva permitido: {yes(c.resources.reserveFundAllowed)}</p>
            <p>Recursos do lance entram no fundo: {yes(c.resources.bidFundsCountTowardResources)}</p>
            <p>Sorteios de canceladas: {c.cancelledQuotaDraws}</p>
          </div>
          <div className="space-y-1 rounded-xl border border-black/10 p-3">
            <p className="font-semibold">Lances e contingência</p>
            {c.bids.enabled ? (
              <>
                <p>Ordem: {c.bids.order.map((t) => BID_TYPE_LABEL[t]).join(" → ")}</p>
                <p>
                  Fixo {pct(c.bids.fixedPercentage)} · mínimo {pct(c.bids.minPercentage)} · máximo {pct(c.bids.maxPercentage)} · embutido até{" "}
                  {pct(c.bids.embeddedMaxPercentage)}
                </p>
                <p>Desempate: {labelOf(TIE_BREAK_LABEL, c.bids.tieBreak)}</p>
              </>
            ) : (
              <p>Lances não previstos.</p>
            )}
            <p>
              Contingência: {c.contingency.method === "NEXT_EXTRACTION" ? "próxima extração" : "revisão manual"} · janela de{" "}
              {c.contingency.maxDaysBeforeAssembly} dia(s)
            </p>
          </div>
        </div>
      </Section>

      <Section
        title={previous ? `Comparação com a v${previous.version}` : "Comparação entre versões"}
        subtitle="Campos alterados e impacto de cada mudança."
      >
        {!previous ? (
          <EmptyState>Primeira versão desta regra.</EmptyState>
        ) : diff.length === 0 ? (
          <EmptyState>Nenhuma diferença de conteúdo em relação à v{previous.version}.</EmptyState>
        ) : (
          <div className="space-y-2">
            {diff.map((d) => (
              <div
                key={d.path}
                className={`rounded-xl border px-3 py-2 text-sm ${d.severity === "HIGH" ? "border-destructive/40 bg-destructive/5" : "border-black/10"}`}
              >
                <p className="font-semibold">
                  {d.label} <span className="font-mono text-[11px] text-card-beige-muted-foreground">{d.path}</span>
                </p>
                <p className="font-mono text-xs">
                  <span className="text-destructive line-through">{show(d.before)}</span> → <span className="text-primary">{show(d.after)}</span>
                </p>
                <p className="text-xs text-card-beige-muted-foreground">{d.impact}</p>
              </div>
            ))}
          </div>
        )}
      </Section>

      <Section title="Versões e assembleias que as utilizaram">
        <div className="space-y-2">
          {versions.map((v) => {
            const used = usedBy.filter((a) => a.version === v.version);
            return (
              <div key={v.id} className="rounded-xl border border-black/10 px-3 py-2 text-sm transition-colors hover:bg-black/5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <Link href={`/consorcios/motor/regras/${v.id}`} className={`font-semibold hover:text-primary ${v.id === rule.id ? "text-primary" : ""}`}>
                    v{v.version}
                  </Link>
                  <StatusBadge status={v.status} label={labelOf(RULE_STATUS_LABEL, v.status)} />
                </div>
                {used.length ? (
                  <p className="mt-1 text-xs">
                    Usada em:{" "}
                    {used.map((a, i) => (
                      <span key={a.id}>
                        {i ? ", " : ""}
                        <Link href={`/consorcios/motor/assembleias/${a.id}`} className="text-accent hover:underline">
                          assembleia nº {a.assemblyNumber} ({ASSEMBLY_STATUS_LABEL[a.status]})
                        </Link>
                      </span>
                    ))}
                  </p>
                ) : (
                  <p className="mt-1 text-xs text-card-beige-muted-foreground">Nenhuma assembleia usou esta versão.</p>
                )}
              </div>
            );
          })}
        </div>
      </Section>

      <Section title="Auditoria da regra" subtitle="Quem criou, alterou, aprovou e publicou — e quando.">
        <AuditTimeline events={events} />
      </Section>
    </div>
  );
}
