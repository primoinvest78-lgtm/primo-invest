"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";

import { EmptyState, Feedback, Field, Hash, NativeSelect, Section, useEngineAction } from "@/components/consortium-engine/ui";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { runSimulationAction } from "@/lib/actions/consortium-intelligence";
import type { Scenario } from "@/lib/consortium-intelligence/simulation";
import type { SimulationRow } from "@/lib/data/consortium-intelligence";
import { formatCurrencyBRL } from "@/lib/utils/format";

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
    const patch = String(f.get("rulePatch") ?? "").trim();
    if (patch) {
      try {
        scenario.ruleConfigPatch = JSON.parse(patch);
      } catch {
        setPatchError("Ajuste de regra não é JSON válido.");
        return;
      }
    }
    execute(() => runSimulationAction(assemblyId, String(f.get("title") ?? ""), scenario));
  }

  return (
    <div className="space-y-6">
      <Section title="Simular cenário (what-if)" subtitle="Roda o mesmo motor sobre uma cópia dos snapshots da assembleia. Nunca altera o resultado oficial.">
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
            <Field label="Ajuste de regra (avançado, JSON)" hint='Ex.: {"candidatePlan":[{"prize":1,"positions":[2,3,4]}]} ou {"fallback":{"method":"NEXT_LOWER","wrapAround":false}}'>
              <Textarea name="rulePatch" rows={2} className="font-mono text-xs" />
            </Field>
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
                    <span className="font-mono text-[11px] text-card-beige-muted-foreground">{s.id.slice(0, 8)}</span>
                  </p>
                  <p className="text-xs text-card-beige-muted-foreground">
                    {new Date(s.createdAt).toLocaleString("pt-BR")} · {s.createdByName ?? "—"}
                  </p>
                </div>
                <p className="font-mono text-[11px]">{JSON.stringify(s.scenario)}</p>
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
