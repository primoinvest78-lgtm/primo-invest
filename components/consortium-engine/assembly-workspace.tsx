"use client";

import { motion } from "motion/react";
import Link from "next/link";
import { useState } from "react";
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { AssemblySteps } from "@/components/consortium-engine/assembly-steps";
import { AuditTimeline } from "@/components/consortium-engine/audit-timeline";
import { CalculationView } from "@/components/consortium-engine/calculation-view";
import { RetificationPanel } from "@/components/consortium-engine/retification-panel";
import {
  EmptyState,
  Feedback,
  Hash,
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
import { reproduceRun, type ReproductionReport } from "@/lib/actions/consortium-engine";
import {
  CONTEMPLATION_METHOD_LABEL,
  CONTEMPLATION_STATUS_LABEL,
  formatQuota,
  labelOf,
  NUMBER_TYPE_LABEL,
  OUTCOME_LABEL,
  REASON_LABEL,
  SOURCE_LABEL,
  VIA_LABEL,
} from "@/lib/consortium-engine/labels.ts";
import { ASSEMBLY_PIPELINE, ASSEMBLY_STATUS_LABEL, pipelineIndex } from "@/lib/consortium-engine/state-machine.ts";
import type { EligibilitySnapshot, ResourceAssessment } from "@/lib/consortium-engine/types.ts";
import type {
  AssemblyWorkspace as WS,
  DrawNumberRecord,
  DrawRunRecord,
  EngineLotteryResult,
  EngineRule,
} from "@/lib/data/consortium-engine";
import { CHART_SEQUENCE } from "@/lib/design/chart-colors";
import { SEAL_LABEL } from "@/lib/consortium-intelligence/findings";
import { formatCurrencyBRL, formatDate } from "@/lib/utils/format";

const GOVERN = ["admin", "manager", "compliance"];
const TOOLTIP_STYLE = {
  borderRadius: 14,
  border: "1px solid var(--border)",
  background: "var(--popover)",
  color: "var(--popover-foreground)",
  fontSize: 12,
};

function Pipeline({ status }: { status: WS["assembly"]["status"] }) {
  const current = pipelineIndex(status);
  return (
    <div className="overflow-x-auto pb-1">
      <ol className="flex min-w-max gap-1.5">
        {ASSEMBLY_PIPELINE.map((s, i) => (
          <motion.li
            key={s}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.03 }}
            className={`rounded-lg border px-2.5 py-1.5 text-[11px] font-semibold ${
              i < current
                ? "border-primary/40 bg-primary/10 text-foreground"
                : i === current
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-white/10 bg-secondary text-secondary-foreground/85"
            }`}
          >
            {i + 1}. {ASSEMBLY_STATUS_LABEL[s]}
          </motion.li>
        ))}
        {status === "RETIFIED" ? (
          <li className="rounded-lg border border-destructive bg-destructive/10 px-2.5 py-1.5 text-[11px] font-semibold text-destructive">Retificada</li>
        ) : null}
      </ol>
    </div>
  );
}

function ReproduceButton({ assemblyId, runId }: { assemblyId: string; runId: string }) {
  const { pending, errors, execute } = useEngineAction();
  const [report, setReport] = useState<ReproductionReport | null>(null);
  return (
    <div className="space-y-1">
      <Button size="xs" variant="outline" disabled={pending} onClick={() => execute(() => reproduceRun(assemblyId, runId), (r) => setReport(r.data ?? null))}>
        {pending ? "Reproduzindo…" : "Reproduzir cálculo"}
      </Button>
      {report ? (
        report.identical ? (
          <p className="text-xs font-semibold text-primary">Reprodução idêntica: os 5 selos de integridade conferem e o resultado é o mesmo.</p>
        ) : (
          <p className="text-xs font-semibold text-destructive">
            ANOMALIA CRÍTICA: a reprodução não conferiu ({report.hashDiffs.map((h) => SEAL_LABEL[h] ?? h).join(", ")}). Cotas a mais: {report.added.join(", ") || "—"} · cotas a menos:{" "}
            {report.removed.join(", ") || "—"}. Registrado na auditoria.
          </p>
        )
      ) : null}
      <Feedback errors={errors} />
    </div>
  );
}

export function AssemblyWorkspace({
  ws,
  role,
  userId,
  publishedRules,
  verifiedLottery,
  drawNumbers,
  attachable,
  names,
}: {
  ws: WS;
  role: string;
  userId: string;
  publishedRules: EngineRule[];
  verifiedLottery: EngineLotteryResult[];
  drawNumbers: DrawNumberRecord[];
  attachable: { id: string; quotaNumber: number; bidType: string; bidPercentage: number | null; bidAmount: number | null; embeddedAmount: number | null; bidDate: string }[];
  names: Record<string, string>;
}) {
  const { assembly, group } = ws;
  const d = group.numbering.displayDigits;
  const canGovern = GOVERN.includes(role);
  const [selectedRunId, setSelectedRunId] = useState<string | null>(null);

  const eligSnap = ws.snapshots.filter((s) => s.kind === "ELIGIBILITY").sort((a, b) => b.sequence - a.sequence)[0];
  const snapshot = (eligSnap?.payload as { snapshot?: EligibilitySnapshot } | undefined)?.snapshot ?? null;
  const drawRun = ws.runs.find((r) => r.phase === "DRAW" && r.status === "CURRENT") ?? null;
  const bidsRun = ws.runs.find((r) => r.phase === "BIDS" && r.status === "CURRENT") ?? null;
  const resources = (drawRun?.result.resources as ResourceAssessment | null) ?? null;
  const currentNumbers = drawRun ? drawNumbers.filter((n) => n.runId === drawRun.id) : [];
  const activeContemplations = ws.contemplations.filter((c) => c.status !== "CANCELLED");
  const shownRun = ws.runs.find((r) => r.id === selectedRunId) ?? drawRun ?? ws.runs[ws.runs.length - 1] ?? null;

  const m = (() => {
    if (!snapshot) return null;
    const e = snapshot.entries;
    const unknown = group.quotaCount - e.length;
    return {
      active: e.filter((x) => x.active).length,
      paidUp: e.filter((x) => x.paidUp === true).length,
      delinquent: e.filter((x) => x.delinquent === true).length,
      contemplated: e.filter((x) => x.alreadyContemplated).length,
      excluded: e.filter((x) => x.excluded || x.cancelled).length,
      eligible: e.filter((x) => x.eligible).length,
      unknown,
      presumed: snapshot.unknownPolicy === "ASSUME_ELIGIBLE" ? unknown : 0,
    };
  })();

  const chartData = m
    ? [
        { label: "Aptas", value: m.eligible + m.presumed },
        { label: "Inadimplentes", value: m.delinquent },
        { label: "Já contempladas", value: m.contemplated },
        { label: "Canceladas/excluídas", value: m.excluded },
        { label: "Sem dado", value: m.unknown },
      ]
    : [];

  const usedResources = activeContemplations.reduce((s, c) => s + (c.creditAmount ?? 0), 0);
  const balanceAfter = bidsRun ? bidsRun.result.remainingResources : drawRun ? drawRun.result.remainingResources : null;

  return (
    <div className="space-y-6">
      <Section title="Etapa atual" subtitle="O sistema só oferece a operação compatível com o estado da assembleia.">
        <div className="space-y-4">
          <Pipeline status={assembly.status} />
          <AssemblySteps
            assembly={assembly}
            group={group}
            canGovern={canGovern}
            publishedRules={publishedRules}
            verifiedLottery={verifiedLottery}
            attachable={attachable}
            bidsCount={ws.bids.length}
            bidsEnabled={Boolean(ws.rule?.config.bids.enabled)}
          />
        </div>
      </Section>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4 xl:grid-cols-8">
        <Stat label="Cotas" value={String(group.quotaCount)} />
        <Stat label="Ativas" value={m ? String(m.active) : "—"} delay={0.03} />
        <Stat label="Adimplentes" value={m ? String(m.paidUp) : "—"} delay={0.06} />
        <Stat label="Inadimplentes" value={m ? String(m.delinquent) : "—"} tone={m?.delinquent ? "danger" : "default"} delay={0.09} />
        <Stat label="Já contempladas" value={m ? String(m.contemplated) : "—"} delay={0.12} />
        <Stat label="Aptas" value={m ? String(m.eligible) : "—"} hint={m?.presumed ? `+${m.presumed} presumidas` : undefined} tone="success" delay={0.15} />
        <Stat label="Recursos disponíveis" value={resources ? formatCurrencyBRL(resources.available) : "—"} delay={0.18} />
        <Stat
          label="Contemplações possíveis"
          value={resources ? String(resources.drawSlots) : "—"}
          hint={resources ? `capacidade ${resources.capacity}` : undefined}
          delay={0.21}
        />
      </div>

      {snapshot?.completeness === "PARTIAL" ? (
        <p className="rounded-xl border border-amber-500/50 bg-amber-500/10 px-4 py-3 text-sm">
          <strong>Apuração de conferência.</strong> O snapshot tem dado de {snapshot.entries.length} de {group.quotaCount} cotas; as demais
          seguiram a política da regra ({snapshot.unknownPolicy === "ASSUME_ELIGIBLE" ? "presumidas aptas" : snapshot.unknownPolicy === "ASSUME_INELIGIBLE" ? "presumidas inaptas" : "bloqueio"}).
          O resultado oficial é o da administradora.
        </p>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-2">
        <Section title="Elegibilidade congelada" subtitle={eligSnap ? `Snapshot nº ${eligSnap.sequence} · ${formatDate(eligSnap.createdAt)}` : "Ainda não travada."}>
          {chartData.length && chartData.filter((x) => x.value > 0).length >= 2 ? (
            <div className="h-[220px] w-full min-w-0">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} layout="vertical" margin={{ left: 40, right: 16 }}>
                  <CartesianGrid horizontal={false} stroke="var(--border)" strokeDasharray="4 4" />
                  <XAxis type="number" allowDecimals={false} tickLine={false} axisLine={false} tick={{ fill: "var(--card-beige-muted-foreground)", fontSize: 11 }} />
                  <YAxis type="category" dataKey="label" width={130} tickLine={false} axisLine={false} tick={{ fill: "var(--card-beige-muted-foreground)", fontSize: 11 }} />
                  <Tooltip contentStyle={TOOLTIP_STYLE} cursor={{ fill: "rgba(46, 204, 155, 0.08)" }} />
                  <Bar dataKey="value" name="Cotas" radius={[0, 6, 6, 0]} maxBarSize={22}>
                    {chartData.map((_, i) => (
                      <Cell key={i} fill={CHART_SEQUENCE[i % CHART_SEQUENCE.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <EmptyState>{snapshot ? "Distribuição sem variação suficiente para gráfico." : "Trave a elegibilidade para ver a distribuição."}</EmptyState>
          )}
          {eligSnap ? (
            <p className="mt-2">
              <Hash value={eligSnap.payloadHash} label="hash do snapshot" />
            </p>
          ) : null}
        </Section>

        <Section title="Resultado oficial" subtitle={ws.lottery ? `${labelOf(SOURCE_LABEL, ws.lottery.source)} · concurso ${ws.lottery.contestNumber} · ${formatDate(ws.lottery.drawDate)}` : "Ainda não travado."}>
          {ws.lottery ? (
            <div className="space-y-3">
              <div className="grid grid-cols-5 gap-2">
                {ws.lottery.prizes.map((p, i) => (
                  <div key={i} className="rounded-xl border border-black/10 px-2 py-2 text-center transition-transform hover:-translate-y-0.5">
                    <p className="text-[10px] font-bold uppercase text-card-beige-muted-foreground">{i + 1}º prêmio</p>
                    <p className="font-mono text-base font-bold tracking-wider">{p}</p>
                  </div>
                ))}
              </div>
              <p className="text-xs text-card-beige-muted-foreground">
                Referência: {ws.lottery.sourceReference ?? "—"} · <Hash value={ws.lottery.contentHash} label="hash" />
              </p>
              {ws.rule ? (
                <p className="text-xs">
                  Regra aplicada:{" "}
                  <Link href={`/consorcios/motor/regras/${ws.rule.id}`} className="font-semibold text-accent hover:underline">
                    {ws.rule.name} v{ws.rule.version}
                  </Link>
                </p>
              ) : null}
            </div>
          ) : (
            <EmptyState>Nenhum resultado oficial travado.</EmptyState>
          )}
        </Section>
      </div>

      <Section
        title="Contemplações"
        subtitle={`Recursos utilizados: ${formatCurrencyBRL(usedResources)} · saldo após contemplações: ${balanceAfter !== null ? formatCurrencyBRL(balanceAfter) : "—"}`}
      >
        {ws.contemplations.length === 0 ? (
          <EmptyState>Nenhuma contemplação apurada.</EmptyState>
        ) : (
          <div className="overflow-x-auto">
            <table className={tableClass}>
              <thead>
                <tr>
                  <th className={thClass}>Ordem</th>
                  <th className={thClass}>Cota</th>
                  <th className={thClass}>Tipo</th>
                  <th className={thClass}>Número apurado</th>
                  <th className={thClass}>Crédito</th>
                  <th className={thClass}>Status</th>
                </tr>
              </thead>
              <tbody>
                {ws.contemplations.map((c) => {
                  const run = ws.runs.find((r) => r.id === c.runId);
                  const detail = run?.result.contemplations.find((x) => x.sequence === c.sequence);
                  return (
                    <tr key={c.id} className={`${trClass} ${c.status === "CANCELLED" ? "opacity-50" : ""}`}>
                      <td className={tdClass}>
                        {c.sequence}º <span className="text-xs text-card-beige-muted-foreground">({run?.phase === "BIDS" ? "lances" : "sorteio"} · cálculo {run?.runNumber})</span>
                      </td>
                      <td className={`${tdClass} font-mono font-bold`}>{formatQuota(c.quotaNumber, d)}</td>
                      <td className={tdClass}>
                        {labelOf(CONTEMPLATION_METHOD_LABEL, c.method)}
                        {detail ? <span className="block text-xs text-card-beige-muted-foreground">via {labelOf(VIA_LABEL, detail.via)}</span> : null}
                      </td>
                      <td className={`${tdClass} font-mono`}>{c.candidateRaw ?? "—"}</td>
                      <td className={tdClass}>{c.creditAmount !== null ? formatCurrencyBRL(c.creditAmount) : "—"}</td>
                      <td className={tdClass}>
                        <StatusBadge status={c.status} label={labelOf(CONTEMPLATION_STATUS_LABEL, c.status)} />
                        {c.statusReason ? <span className="block text-[11px] text-card-beige-muted-foreground">{c.statusReason}</span> : null}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Section>

      <Section title="Números apurados" subtitle="Toda tentativa: número → cota → elegibilidade → motivo. Número equivalente aponta para a cota primária, nunca vira cota.">
        {currentNumbers.length === 0 ? (
          <EmptyState>Sem apuração vigente.</EmptyState>
        ) : (
          <div className="max-h-[420px] overflow-auto">
            <table className={tableClass}>
              <thead className="sticky top-0 bg-card">
                <tr>
                  <th className={thClass}>#</th>
                  <th className={thClass}>Número</th>
                  <th className={thClass}>Tipo</th>
                  <th className={thClass}>Cota</th>
                  <th className={thClass}>Resultado</th>
                  <th className={thClass}>Motivo</th>
                </tr>
              </thead>
              <tbody>
                {currentNumbers.map((n) => (
                  <tr key={n.attempt} className={trClass}>
                    <td className={tdClass}>{n.attempt}</td>
                    <td className={`${tdClass} font-mono`}>{n.numberText}</td>
                    <td className={tdClass}>{labelOf(NUMBER_TYPE_LABEL, n.numberType)}</td>
                    <td className={`${tdClass} font-mono`}>{formatQuota(n.quotaNumber, d)}</td>
                    <td className={`${tdClass} font-semibold ${n.outcome === "SELECTED" ? "text-primary" : n.outcome === "INELIGIBLE" || n.outcome === "ELIMINATED" ? "text-destructive" : ""}`}>
                      {labelOf(OUTCOME_LABEL, n.outcome)}
                    </td>
                    <td className={tdClass}>{n.reason ? labelOf(REASON_LABEL, n.reason) : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Section>

      <Section
        id="ver-calculo"
        title="Ver cálculo"
        subtitle="Resultado oficial → regra → versão → número apurado → cota → elegibilidade → motivo → substituição → resultado."
        actions={
          ws.runs.length > 1 ? (
            <select
              className="h-8 rounded-lg border border-input bg-card px-2 text-xs"
              value={shownRun?.id ?? ""}
              onChange={(e) => setSelectedRunId(e.target.value)}
            >
              {ws.runs.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.phase === "DRAW" ? "Sorteio" : "Lances"} · cálculo {r.runNumber} · {r.runKind === "RETIFICATION" ? "retificação" : "original"} ·{" "}
                  {r.status === "CURRENT" ? "vigente" : "substituído"}
                </option>
              ))}
            </select>
          ) : null
        }
      >
        {shownRun ? <CalculationView run={shownRun} /> : <EmptyState>Nenhum cálculo executado.</EmptyState>}
      </Section>

      <Section title="Cálculos e reprodução" subtitle="Executa de novo com a mesma entrada, a mesma versão da regra e o mesmo snapshot. Divergência = anomalia crítica.">
        {ws.runs.length === 0 ? (
          <EmptyState>Nenhum cálculo.</EmptyState>
        ) : (
          <div className="space-y-2">
            {ws.runs.map((r: DrawRunRecord) => (
              <div key={r.id} className="flex flex-wrap items-start justify-between gap-3 rounded-xl border border-black/10 px-3 py-2 text-sm transition-colors hover:bg-black/5">
                <div>
                  <p className="font-semibold">
                    {r.phase === "DRAW" ? "Sorteio" : "Lances"} · cálculo {r.runNumber} · {r.runKind === "RETIFICATION" ? "retificação" : "original"}
                  </p>
                  <p className="text-xs text-card-beige-muted-foreground">
                    {formatDate(r.createdAt)} · {r.createdBy ? (names[r.createdBy] ?? "—") : "—"} · {r.status === "CURRENT" ? "vigente" : "substituído"} ·{" "}
                    {r.result.official ? "base completa" : "conferência (base parcial)"}
                  </p>
                  <Hash value={r.hashes.resultHash} label="resultado" />
                </div>
                <ReproduceButton assemblyId={assembly.id} runId={r.id} />
              </div>
            ))}
          </div>
        )}
      </Section>

      <Section title="Retificação" subtitle="Nunca sobrescreve: o original fica preservado e vinculado ao novo resultado.">
        <RetificationPanel
          assemblyId={assembly.id}
          status={assembly.status}
          retifications={ws.retifications}
          canGovern={canGovern}
          userId={userId}
          names={names}
        />
      </Section>

      <Section title="Auditoria da assembleia">
        <AuditTimeline events={ws.events} />
      </Section>
    </div>
  );
}
