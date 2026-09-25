"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";

import { EmptyState, Feedback, Field, Hash, NativeSelect, Section, useEngineAction } from "@/components/consortium-engine/ui";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { runSimulationAction } from "@/lib/actions/consortium-intelligence";
import type { Scenario } from "@/lib/consortium-intelligence/simulation";
import type { SimulationRow } from "@/lib/data/consortium-intelligence";
import { formatCurrencyBRL } from "@/lib/utils/format";

const SEQ_OPTIONS = [
  { value: "", label: "Manter o da regra" },
  { value: "NONE", label: "Não prevista" },
  { value: "NEXT_HIGHER", label: "Imediatamente superior" },
  { value: "NEXT_LOWER", label: "Imediatamente inferior" },
  { value: "ALTERNATING_UP_FIRST", label: "Alternada (superior primeiro)" },
  { value: "ALTERNATING_DOWN_FIRST", label: "Alternada (inferior primeiro)" },
];
const EQ_OPTIONS = [
  { value: "", label: "Manter a da regra" },
  { value: "NONE", label: "Sem equivalência" },
  { value: "ZERO_AS_MAX", label: "Número zerado = última cota" },
  { value: "MODULO", label: "Resto da divisão pelo tamanho do grupo" },
  { value: "SUBTRACT_GROUP_SIZE", label: "Subtração do tamanho do grupo" },
];
const POSITION_OPTIONS: { value: string; label: string; positions: number[] }[] = [
  { value: "", label: "Manter as da regra", positions: [] },
  { value: "345", label: "3º, 4º e 5º algarismos (centena final)", positions: [3, 4, 5] },
  { value: "234", label: "2º, 3º e 4º algarismos", positions: [2, 3, 4] },
  { value: "123", label: "1º, 2º e 3º algarismos", positions: [1, 2, 3] },
  { value: "2345", label: "2º ao 5º algarismo (milhar)", positions: [2, 3, 4, 5] },
  { value: "45", label: "4º e 5º algarismos (dezena)", positions: [4, 5] },
];
const SEQ_LABEL = Object.fromEntries(SEQ_OPTIONS.map((o) => [o.value, o.label]));
const EQ_LABEL = Object.fromEntries(EQ_OPTIONS.map((o) => [o.value, o.label]));

/** Cenário em frases — nunca em código. */
function describeScenario(sc: Record<string, unknown>): string[] {
  const out: string[] = [];
  const brl = (n: unknown) => formatCurrencyBRL(Number(n));
  const nums = (v: unknown) => (Array.isArray(v) ? v.join(", ") : String(v));
  if (sc.commonFundBalance !== undefined) out.push(`Fundo comum de ${brl(sc.commonFundBalance)}`);
  if (sc.resourcesDeltaPercent !== undefined) out.push(`Recursos ${Number(sc.resourcesDeltaPercent) >= 0 ? "+" : ""}${sc.resourcesDeltaPercent}%`);
  if (sc.creditAmount !== undefined) out.push(`Crédito de ${brl(sc.creditAmount)}`);
  if (sc.plannedDrawContemplations !== undefined) out.push(`${sc.plannedDrawContemplations} contemplação(ões) prevista(s)`);
  if (sc.quotaCount !== undefined) out.push(`Grupo com ${sc.quotaCount} cotas`);
  if (sc.extraDelinquencyPercent !== undefined) out.push(`+${sc.extraDelinquencyPercent}% de inadimplência`);
  if (sc.forceDelinquent) out.push(`Cotas inadimplentes: ${nums(sc.forceDelinquent)}`);
  if (sc.forceUpToDate) out.push(`Cotas em dia: ${nums(sc.forceUpToDate)}`);
  if (sc.forceContemplated) out.push(`Cotas já contempladas: ${nums(sc.forceContemplated)}`);
  const patch = (sc.ruleConfigPatch ?? {}) as Record<string, { method?: string; positions?: number[] } | { prize: number; positions: number[] }[]>;
  if (Array.isArray(patch.candidatePlan) && patch.candidatePlan[0]) out.push(`Regra hipotética: algarismos ${patch.candidatePlan[0].positions.join(", ")} de cada prêmio`);
  const fb = patch.fallback as { method?: string } | undefined;
  if (fb?.method) out.push(`Substituição: ${SEQ_LABEL[fb.method] ?? fb.method}`);
  const ap = patch.approximation as { method?: string } | undefined;
  if (ap?.method) out.push(`Aproximação: ${SEQ_LABEL[ap.method] ?? ap.method}`);
  const eq = patch.equivalence as { method?: string } | undefined;
  if (eq?.method) out.push(`Equivalência: ${EQ_LABEL[eq.method] ?? eq.method}`);
  return out.length ? out : ["Mesmos dados da assembleia (sem alteração)"];
}

const list = (s: string) => s.split(/[,;\s]+/).map((x) => Number(x)).filter((n) => Number.isInteger(n) && n >= 0);
const num = (s: FormDataEntryValue | null) => {
  const t = String(s ?? "").trim();
  return t === "" ? undefined : Number(t.replace(",", "."));
};

export function SimulationPanel({ assemblies, simulations }: { assemblies: { value: string; label: string }[]; simulations: SimulationRow[] }) {
  const [assemblyId, setAssemblyId] = useState(assemblies[0]?.value ?? "");
  const [patchError, setPatchError] = useState<string | null>(null);
  const { pending, errors, message, execute } = useEngineAction();

  function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPatchError(null);
    const f = new FormData(e.currentTarget);
    const scenario: Scenario = {};
    const set = <K extends keyof Scenario>(k: K, v: Scenario[K] | undefined) => {
      if (v !== undefined && !(Array.isArray(v) && v.length === 0)) scenario[k] = v;
    };
    set("commonFundBalance", num(f.get("commonFund")));
    set("resourcesDeltaPercent", num(f.get("delta")));
    set("creditAmount", num(f.get("credit")));
    set("plannedDrawContemplations", num(f.get("planned")));
    set("quotaCount", num(f.get("quotaCount")));
    set("extraDelinquencyPercent", num(f.get("extraDelinquency")));
    set("forceDelinquent", list(String(f.get("delinquent") ?? "")));
    set("forceUpToDate", list(String(f.get("upToDate") ?? "")));
    set("forceContemplated", list(String(f.get("contemplated") ?? "")));
    const patch: Record<string, unknown> = {};
    const pos = POSITION_OPTIONS.find((o) => o.value === String(f.get("positions") ?? ""));
    if (pos && pos.positions.length) {
      patch.candidatePlan = [1, 2, 3, 4, 5].map((prize) => ({ prize, positions: pos.positions }));
    }
    const fb = String(f.get("fallback") ?? "");
    if (fb) patch.fallback = { method: fb, wrapAround: false };
    const ap = String(f.get("approximation") ?? "");
    if (ap) patch.approximation = { method: ap, maxSteps: 3, wrapAround: false };
    const eq = String(f.get("equivalence") ?? "");
    if (eq) patch.equivalence = { method: eq };
    if (Object.keys(patch).length) scenario.ruleConfigPatch = patch as Scenario["ruleConfigPatch"];
    execute(() => runSimulationAction(assemblyId, String(f.get("title") ?? ""), scenario));
  }

  return (
    <div className="space-y-6">
      <Section title="Simular cenário (e se...?)" subtitle="Roda o mesmo motor sobre uma cópia dos dados congelados da assembleia. Nunca altera o resultado oficial.">
        {assemblies.length === 0 ? (
          <EmptyState>Nenhuma assembleia para simular.</EmptyState>
        ) : (
          <form onSubmit={submit} className="space-y-3">
            <div className="grid gap-3 md:grid-cols-2">
              <Field label="Assembleia base">
                <NativeSelect value={assemblyId} onChange={setAssemblyId} options={assemblies} />
              </Field>
              <Field label="Título">
                <Input name="title" placeholder="Ex.: +20% de recursos" />
              </Field>
            </div>
            <p className="text-label font-bold uppercase text-card-beige-muted-foreground">Recursos</p>
            <div className="grid gap-3 sm:grid-cols-4">
              <Field label="Fundo comum (valor)">
                <Input name="commonFund" type="number" step="0.01" />
              </Field>
              <Field label="Ajuste do fundo (%)" hint="Ex.: 20 ou -30">
                <Input name="delta" type="number" step="0.1" />
              </Field>
              <Field label="Valor do crédito">
                <Input name="credit" type="number" step="0.01" />
              </Field>
              <Field label="Contemplações previstas">
                <Input name="planned" type="number" min={0} />
              </Field>
            </div>
            <p className="text-label font-bold uppercase text-card-beige-muted-foreground">Cotas e grupo</p>
            <div className="grid gap-3 sm:grid-cols-3">
              <Field label="Cotas inadimplentes" hint="Números separados por vírgula">
                <Input name="delinquent" placeholder="940, 941" />
              </Field>
              <Field label="Cotas em dia">
                <Input name="upToDate" />
              </Field>
              <Field label="Cotas já contempladas">
                <Input name="contemplated" />
              </Field>
              <Field label="+ inadimplência (%)" hint="Espaçamento regular, sem sorteio">
                <Input name="extraDelinquency" type="number" min={0} max={100} />
              </Field>
              <Field label="Tamanho do grupo (cotas)">
                <Input name="quotaCount" type="number" min={1} />
              </Field>
            </div>
            <p className="text-label font-bold uppercase text-card-beige-muted-foreground">E se a regra fosse outra?</p>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <Field label="Algarismos usados de cada prêmio">
                <NativeSelect name="positions" defaultValue="" options={POSITION_OPTIONS.map(({ value, label }) => ({ value, label }))} />
              </Field>
              <Field label="Equivalência">
                <NativeSelect name="equivalence" defaultValue="" options={EQ_OPTIONS} />
              </Field>
              <Field label="Aproximação">
                <NativeSelect name="approximation" defaultValue="" options={SEQ_OPTIONS} />
              </Field>
              <Field label="Substituição">
                <NativeSelect name="fallback" defaultValue="" options={SEQ_OPTIONS} />
              </Field>
            </div>
            <Feedback errors={patchError ? [patchError, ...errors] : errors} message={message} />
            <Button type="submit" disabled={pending || !assemblyId}>
              {pending ? "Simulando…" : "Simular"}
            </Button>
          </form>
        )}
      </Section>

      <Section title="Simulações registradas" subtitle="Cada simulação tem identificador, entrada, regra, resultado, autor e data — separada do resultado oficial.">
        {simulations.length === 0 ? (
          <EmptyState>Nenhuma simulação.</EmptyState>
        ) : (
          <div className="space-y-3">
            {simulations.map((s) => (
              <div key={s.id} className="space-y-1.5 rounded-xl border border-dashed border-amber-500/60 bg-amber-500/5 p-3 text-sm transition-colors hover:bg-amber-500/10">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-semibold">
                    SIMULAÇÃO · {s.title}{" "}
                  </p>
                  <p className="text-xs text-card-beige-muted-foreground">
                    {new Date(s.createdAt).toLocaleString("pt-BR")} · {s.createdByName ?? "—"}
                  </p>
                </div>
                <ul className="flex flex-wrap gap-1.5">
                  {describeScenario(s.scenario).map((t) => (
                    <li key={t} className="rounded-full border border-amber-500/40 px-2 py-0.5 text-[11px]">
                      {t}
                    </li>
                  ))}
                </ul>
                <p>
                  Resultado ({s.result.status}): {s.result.contemplations.length ? s.result.contemplations.map((c) => `cota ${c.quotaLabel}`).join(", ") : "nenhuma contemplação"}
                  {s.result.resources ? ` · recursos ${formatCurrencyBRL(s.result.resources.available)}, capacidade ${s.result.resources.capacity}` : ""}
                </p>
                {s.comparison ? (
                  <p className="text-xs">
                    Comparado ao oficial: {s.comparison.identical ? "idêntico" : `entrariam ${s.comparison.added.join(", ") || "—"}; sairiam ${s.comparison.removed.join(", ") || "—"}`}
                  </p>
                ) : (
                  <p className="text-xs text-card-beige-muted-foreground">Sem resultado oficial para comparar.</p>
                )}
                {s.result.errors?.length ? <p className="text-xs text-destructive">{s.result.errors.join(" ")}</p> : null}
                <div className="flex flex-wrap gap-3 text-xs">
                  <Hash value={s.resultHash} label="resultado" />
                  {s.assemblyId ? (
                    <Link href={`/consorcios/motor/assembleias/${s.assemblyId}`} className="font-semibold text-accent hover:underline">
                      assembleia base
                    </Link>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        )}
      </Section>
    </div>
  );
}
