"use client";

import Link from "next/link";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { Section, Stat, StatusBadge } from "@/components/consortium-engine/ui";
import { ASSEMBLY_PIPELINE, ASSEMBLY_STATUS_LABEL } from "@/lib/consortium-engine/state-machine.ts";
import { SEVERITY_LABEL } from "@/lib/consortium-intelligence/findings";
import type { CreditOperation } from "@/lib/data/consortium-credit";
import type { EngineAssembly, EngineEvent, EngineGroup } from "@/lib/data/consortium-engine";
import type { AutomationRow, FindingRow } from "@/lib/data/consortium-intelligence";
import { EVENT_TYPE_LABEL, labelOf } from "@/lib/consortium-engine/labels.ts";
import { formatCurrencyBRL, formatDate } from "@/lib/utils/format";

const TOOLTIP_STYLE = { borderRadius: 14, border: "1px solid var(--border)", background: "var(--popover)", color: "var(--popover-foreground)", fontSize: 12 };
const AXIS_TICK = { fill: "var(--card-beige-muted-foreground)", fontSize: 10 };

/**
 * Painel operacional de assembleias. O único gráfico responde a uma
 * pergunta de decisão: "em que etapa as assembleias estão paradas?".
 */
export function OperationalDashboard({
  assemblies,
  groups,
  findings,
  events,
  credits,
  automation,
  onShowFindings,
}: {
  assemblies: EngineAssembly[];
  groups: EngineGroup[];
  findings: FindingRow[];
  events: EngineEvent[];
  credits: CreditOperation[];
  automation: AutomationRow[];
  /** Abre a aba de achados logo abaixo. */
  onShowFindings?: () => void;
}) {
  const byStatus = ASSEMBLY_PIPELINE.map((s) => ({ label: ASSEMBLY_STATUS_LABEL[s], value: assemblies.filter((a) => a.status === s || (s === "DRAW_READY" && a.status === "DRAWING")).length }));
  const retified = assemblies.filter((a) => a.status === "RETIFIED").length;
  const inProgress = assemblies.filter((a) => !["COMPLETED", "LOCKED"].includes(a.status));
  const critical = findings.filter((f) => f.severity === "CRITICAL").length;
  const review = findings.filter((f) => f.requiresHumanReview).length;
  const creditsOpen = credits.filter((c) => !["CLOSED", "CANCELLED"].includes(c.status));
  const lastScan = automation.find((a) => a.job === "MONITORING_SCAN");
  const chain = lastScan?.details.chain as { ok: boolean; checked: number } | undefined;
  const groupById = new Map(groups.map((g) => [g.id, g]));
  const upcoming = inProgress.slice().sort((a, b) => (a.assemblyDate < b.assemblyDate ? -1 : 1)).slice(0, 6);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-6">
        <Stat label="Assembleias em andamento" value={String(inProgress.length)} href="/consorcios/motor?aba=assembleias" />
        <Stat label="Retificadas" value={String(retified)} tone={retified ? "warning" : "default"} delay={0.03} href="/consorcios/motor?aba=assembleias" />
        <Stat label="Achados abertos" value={String(findings.length)} delay={0.06} onClick={onShowFindings} />
        <Stat label="Críticos" value={String(critical)} tone={critical ? "danger" : "success"} delay={0.09} onClick={onShowFindings} />
        <Stat label="Exigem revisão humana" value={String(review)} tone={review ? "warning" : "default"} delay={0.12} onClick={onShowFindings} />
        <Stat label="Crédito líquido em aberto" value={formatCurrencyBRL(creditsOpen.reduce((s, c) => s + c.remainingCredit, 0))} delay={0.15} href="/consorcios/motor?aba=credito" />
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <Section title="Onde as assembleias estão" subtitle="Etapa atual de cada assembleia — mostra gargalos do ciclo." >
          {assemblies.length ? (
            <div className="h-[260px] w-full min-w-0">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={byStatus} layout="vertical" margin={{ left: 50, right: 12 }}>
                  <CartesianGrid horizontal={false} stroke="var(--border)" strokeDasharray="4 4" />
                  <XAxis type="number" allowDecimals={false} tickLine={false} axisLine={false} tick={AXIS_TICK} />
                  <YAxis type="category" dataKey="label" width={120} tickLine={false} axisLine={false} tick={AXIS_TICK} />
                  <Tooltip contentStyle={TOOLTIP_STYLE} cursor={{ fill: "rgba(46, 204, 155, 0.08)" }} />
                  <Bar dataKey="value" name="Assembleias" fill="var(--primary)" radius={[0, 6, 6, 0]} maxBarSize={16} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="text-sm text-card-beige-muted-foreground">Nenhuma assembleia.</p>
          )}
        </Section>

        <Section title="Próximas decisões" subtitle="Assembleias em andamento, por data.">
          <div className="space-y-2">
            {upcoming.length === 0 ? <p className="text-sm text-card-beige-muted-foreground">Nada pendente.</p> : null}
            {upcoming.map((a) => {
              const alerts = findings.filter((f) => f.assemblyId === a.id);
              return (
                <Link
                  key={a.id}
                  href={`/consorcios/motor/assembleias/${a.id}`}
                  className="block rounded-xl border border-black/10 px-3 py-2 text-sm transition-all duration-150 hover:-translate-y-0.5 hover:bg-black/5"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-semibold">
                      Nº {a.assemblyNumber} · {groupById.get(a.groupId)?.groupCode ?? "?"}
                    </span>
                    <StatusBadge status={a.status} label={ASSEMBLY_STATUS_LABEL[a.status]} />
                  </div>
                  <p className="text-xs text-card-beige-muted-foreground">
                    {formatDate(a.assemblyDate)}
                    {alerts.length ? ` · ${alerts.length} alerta(s): ${alerts.map((x) => SEVERITY_LABEL[x.severity]).join(", ")}` : ""}
                  </p>
                </Link>
              );
            })}
          </div>
        </Section>

        <Section title="Auditoria" subtitle={chain ? (chain.ok ? `Cadeia de eventos íntegra (${chain.checked} verificados na última varredura).` : "Cadeia de eventos QUEBRADA — ver achados.") : "Execute uma varredura para verificar a cadeia."}>
          <ol className="space-y-1.5">
            {events.slice(0, 8).map((e) => (
              <li key={e.id} className="rounded-lg border border-black/10 px-2.5 py-1.5 text-xs transition-colors hover:bg-black/5">
                <span className="font-semibold">{labelOf(EVENT_TYPE_LABEL, e.eventType)}</span>
                <span className="block text-card-beige-muted-foreground">
                  {new Date(e.createdAt).toLocaleString("pt-BR")} · {e.actorName ?? "sistema"}
                </span>
              </li>
            ))}
          </ol>
        </Section>
      </div>
    </div>
  );
}
