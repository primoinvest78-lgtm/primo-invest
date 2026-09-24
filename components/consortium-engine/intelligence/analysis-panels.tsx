"use client";

import Link from "next/link";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { EmptyState, Section, Stat } from "@/components/consortium-engine/ui";
import { REASON_LABEL, NUMBER_TYPE_LABEL, labelOf } from "@/lib/consortium-engine/labels.ts";
import { AGENTS, FORBIDDEN_FOR_AI, TOOL_EFFECT, TOOL_SCHEMAS } from "@/lib/consortium-intelligence/agents";
import { NUMBER_ANALYSIS_DISCLAIMER, type NumberAnalysis } from "@/lib/consortium-intelligence/number-analysis";
import type { EngineGroup } from "@/lib/data/consortium-engine";

const TOOLTIP_STYLE = { borderRadius: 14, border: "1px solid var(--border)", background: "var(--popover)", color: "var(--popover-foreground)", fontSize: 12 };
const AXIS_TICK = { fill: "var(--card-beige-muted-foreground)", fontSize: 10 };

export function NumberAnalysisPanel({ groups, selectedGroupId, analysis }: { groups: EngineGroup[]; selectedGroupId: string | null; analysis: NumberAnalysis | null }) {
  return (
    <Section title="Análise do algoritmo" subtitle={NUMBER_ANALYSIS_DISCLAIMER}>
      <div className="space-y-4">
        <div className="flex flex-wrap gap-1.5">
          {groups.map((g) => (
            <Link
              key={g.id}
              href={`/consorcios/motor/inteligencia?grupo=${g.id}`}
              className={`rounded-lg border px-3 py-1 text-xs font-semibold transition-colors ${g.id === selectedGroupId ? "border-primary bg-primary/15" : "border-black/15 hover:bg-black/5"}`}
            >
              {g.groupCode}
            </Link>
          ))}
        </div>
        {!analysis || analysis.attempts === 0 ? (
          <EmptyState>Sem apurações vigentes neste grupo para analisar.</EmptyState>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
              <Stat label="Assembleias" value={String(analysis.assemblies)} />
              <Stat label="Números testados" value={String(analysis.attempts)} />
              <Stat label="Tentativas até contemplar" value={analysis.avgAttemptsToSelect !== null ? String(analysis.avgAttemptsToSelect).replace(".", ",") : "—"} hint="média" />
              <Stat label="Com substituição" value={analysis.substitutionRate !== null ? `${String(analysis.substitutionRate).replace(".", ",")}%` : "—"} hint="aproximação/fallback" />
              <Stat label="Distância média" value={analysis.avgSubstitutionDistance !== null ? String(analysis.avgSubstitutionDistance).replace(".", ",") : "—"} hint="1º candidato → contemplada" />
              <Stat label="Cobertura da faixa" value={`${String(analysis.coverage).replace(".", ",")}%`} />
            </div>
            <div>
              <p className="mb-1 text-sm font-semibold">Cotas testadas por faixa numérica</p>
              <p className="mb-2 text-xs text-card-beige-muted-foreground">
                Serve para ver se a regra (posições + equivalência) concentra testes em alguma faixa
                {analysis.concentration ? ` — faixa mais testada: ${analysis.concentration.topBlockShare}% dos testes (distribuição uniforme seria ${analysis.concentration.expectedShare}%).` : "."}
              </p>
              <div className="h-[240px] w-full min-w-0">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={analysis.byBlock} margin={{ left: -18, right: 8 }}>
                    <CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="4 4" />
                    <XAxis dataKey="label" tickLine={false} axisLine={false} tick={AXIS_TICK} interval="preserveStartEnd" />
                    <YAxis tickLine={false} axisLine={false} tick={AXIS_TICK} allowDecimals={false} />
                    <Tooltip contentStyle={TOOLTIP_STYLE} cursor={{ fill: "rgba(46, 204, 155, 0.08)" }} />
                    <Bar dataKey="tested" name="Testadas" fill="var(--secondary)" radius={[4, 4, 0, 0]} maxBarSize={22} />
                    <Bar dataKey="selected" name="Contempladas" fill="var(--primary)" radius={[4, 4, 0, 0]} maxBarSize={22} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-xl border border-black/10 p-3 text-sm">
                <p className="mb-1 font-semibold">Tipos de número</p>
                {Object.entries(analysis.byType).map(([k, v]) => (
                  <p key={k}>
                    {labelOf(NUMBER_TYPE_LABEL, k)}: {v}
                  </p>
                ))}
              </div>
              <div className="rounded-xl border border-black/10 p-3 text-sm">
                <p className="mb-1 font-semibold">Motivos de inaptidão</p>
                {Object.keys(analysis.reasons).length === 0 ? <p className="text-card-beige-muted-foreground">Nenhum.</p> : null}
                {Object.entries(analysis.reasons).map(([k, v]) => (
                  <p key={k}>
                    {labelOf(REASON_LABEL, k)}: {v}
                  </p>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </Section>
  );
}

export function AgentsPanel() {
  return (
    <div className="space-y-6">
      <Section title="Agentes especializados" subtitle="Cada agente tem ferramentas limitadas e só pode ler, analisar, explicar, sugerir, alertar, simular ou propor rascunho.">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {AGENTS.map((a) => (
            <div key={a.id} className="card-premium space-y-2 rounded-xl p-3 text-sm transition-all duration-200 hover:-translate-y-0.5">
              <p className="font-semibold">{a.name}</p>
              <p className="font-mono text-[11px] text-card-beige-muted-foreground">{a.id}</p>
              <p className="text-xs">{a.mission}</p>
              <div className="flex flex-wrap gap-1">
                {a.tools.map((t) => (
                  <span key={t} title={TOOL_SCHEMAS[t].description} className="rounded-md border border-black/15 px-1.5 py-0.5 font-mono text-[10px]">
                    {t} · {TOOL_EFFECT[t] === "READ" ? "leitura" : TOOL_EFFECT[t] === "SIMULATE" ? "simulação" : "rascunho"}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </Section>
      <Section title="Governança da inteligência" subtitle="Ações que nenhuma ferramenta executa — portanto nenhum agente nem modelo futuro consegue.">
        <ul className="grid gap-2 text-sm sm:grid-cols-2">
          {FORBIDDEN_FOR_AI.map((f) => (
            <li key={f} className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2">
              {f}
            </li>
          ))}
        </ul>
        <p className="mt-3 text-xs text-card-beige-muted-foreground">
          Hoje as respostas são determinísticas. Para plugar um modelo de linguagem, ele recebe exatamente estas ferramentas (esquemas prontos em
          <span className="font-mono"> lib/consortium-intelligence/agents.ts</span>) e continua sujeito às mesmas proibições.
        </p>
      </Section>
    </div>
  );
}
