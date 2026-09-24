"use client";

import { Pencil } from "lucide-react";
import { useMemo, useState, type FormEvent } from "react";

import { Feedback, Field, NativeSelect, useEngineAction } from "@/components/consortium-engine/ui";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { createRuleDraft, updateRuleDraft } from "@/lib/actions/consortium-engine";
import {
  BID_TYPE_LABEL,
  EQUIVALENCE_LABEL,
  SEQUENCE_METHOD_LABEL,
  TIE_BREAK_LABEL,
  UNKNOWN_POLICY_LABEL,
} from "@/lib/consortium-engine/labels.ts";
import { blankRuleConfig, expandCandidatePlan } from "@/lib/consortium-engine/rule-config.ts";
import type { BidType, RuleConfig } from "@/lib/consortium-engine/types.ts";
import type { EngineGroup, EngineRule } from "@/lib/data/consortium-engine";

const opts = (m: Record<string, string>, keys?: string[]) => (keys ?? Object.keys(m)).map((k) => ({ value: k, label: m[k] }));

function planToText(plan: RuleConfig["candidatePlan"]) {
  return plan.map((s) => `${s.prize}: ${s.positions.join(",")}`).join("\n");
}

function parsePlan(text: string): { plan: RuleConfig["candidatePlan"]; error: string | null } {
  const plan: RuleConfig["candidatePlan"] = [];
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  for (const [i, line] of lines.entries()) {
    const m = line.match(/^(\d+)\s*[:;]\s*([\d,\s]+)$/);
    if (!m) return { plan, error: `Linha ${i + 1} do plano inválida — use "prêmio: posições", ex.: 1: 3,4,5` };
    plan.push({ prize: Number(m[1]), positions: m[2].split(",").map((p) => Number(p.trim())).filter((p) => p > 0) });
  }
  return { plan, error: null };
}

function mapToText(map: Record<string, number> | undefined) {
  return Object.entries(map ?? {}).map(([k, v]) => `${k}=${v}`).join("\n");
}

const numOrNull = (v: FormDataEntryValue | null) => {
  const s = String(v ?? "").trim();
  return s === "" ? null : Number(s.replace(",", "."));
};

/**
 * Formulário da regra. A regra é o regulamento do grupo transformado em
 * dado — nada aqui assume padrão de administradora: tudo começa vazio
 * e é preenchido a partir do regulamento.
 */
export function RuleFormDialog({ groups, rule }: { groups: EngineGroup[]; rule?: EngineRule }) {
  const initial = rule?.config ?? blankRuleConfig();
  const [open, setOpen] = useState(false);
  const [planText, setPlanText] = useState(planToText(initial.candidatePlan));
  const [genPrizes, setGenPrizes] = useState("1,2,3,4,5");
  const [genPatterns, setGenPatterns] = useState("3,4,5 | 2,3,4");
  const [genOrder, setGenOrder] = useState<"PRIZE_MAJOR" | "PATTERN_MAJOR">("PRIZE_MAJOR");
  const [equivalence, setEquivalence] = useState<string>(initial.equivalence.method);
  const [fallback, setFallback] = useState<string>(initial.fallback.method);
  const [bidsEnabled, setBidsEnabled] = useState(initial.bids.enabled);
  const [bidOrder, setBidOrder] = useState<BidType[]>(initial.bids.order);
  const { pending, errors, message, execute } = useEngineAction();
  const [localError, setLocalError] = useState<string | null>(null);

  const preview = useMemo(() => parsePlan(planText), [planText]);

  function generatePlan() {
    const prizes = genPrizes.split(",").map((p) => Number(p.trim())).filter((n) => n > 0);
    const patterns = genPatterns.split("|").map((p) => p.split(",").map((x) => Number(x.trim())).filter((n) => n > 0)).filter((p) => p.length);
    setPlanText(planToText(expandCandidatePlan(prizes, patterns, genOrder)));
  }

  function toggleBid(t: BidType) {
    setBidOrder((cur) => (cur.includes(t) ? cur.filter((x) => x !== t) : [...cur, t]));
  }

  function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLocalError(null);
    const f = new FormData(e.currentTarget);
    if (preview.error) return setLocalError(preview.error);
    const map: Record<string, number> = {};
    for (const line of String(f.get("equivalenceMap") ?? "").split(/\r?\n/).map((l) => l.trim()).filter(Boolean)) {
      const [k, v] = line.split("=").map((x) => x.trim());
      map[k] = Number(v);
    }
    const config: RuleConfig = {
      calculationMethod: "LOTTERY_DIGIT_EXTRACTION",
      prizeDigits: Number(f.get("prizeDigits")),
      prizeCount: Number(f.get("prizeCount")),
      candidatePlan: preview.plan,
      equivalence: equivalence === "EXPLICIT_MAP" ? { method: "EXPLICIT_MAP", map } : { method: equivalence as RuleConfig["equivalence"]["method"] },
      approximation: {
        method: String(f.get("approximation")) as RuleConfig["approximation"]["method"],
        maxSteps: Number(f.get("approximationSteps") || 1),
        wrapAround: f.get("approximationWrap") === "on",
      },
      fallback: {
        method: fallback as RuleConfig["fallback"]["method"],
        wrapAround: f.get("fallbackWrap") === "on",
        ...(fallback === "PREDEFINED_SEQUENCE"
          ? { sequence: String(f.get("fallbackSequence") ?? "").split(",").map((x) => Number(x.trim())).filter((n) => Number.isInteger(n)) }
          : {}),
      },
      eligibility: {
        requireUpToDate: f.get("requireUpToDate") === "on",
        excludeContemplated: f.get("excludeContemplated") === "on",
        unknownPolicy: String(f.get("unknownPolicy")) as RuleConfig["eligibility"]["unknownPolicy"],
      },
      resources: {
        reserveFundAllowed: f.get("reserveFundAllowed") === "on",
        bidFundsCountTowardResources: f.get("bidFundsCount") === "on",
      },
      cancelledQuotaDraws: Number(f.get("cancelledQuotaDraws") || 0),
      bids: {
        enabled: bidsEnabled,
        order: bidsEnabled ? bidOrder : [],
        fixedPercentage: numOrNull(f.get("fixedPercentage")),
        minPercentage: numOrNull(f.get("minPercentage")),
        maxPercentage: numOrNull(f.get("maxPercentage")),
        embeddedMaxPercentage: numOrNull(f.get("embeddedMaxPercentage")),
        overFixedCompetesAsFree: f.get("overFixed") === "on",
        tieBreak: String(f.get("tieBreak")) as RuleConfig["bids"]["tieBreak"],
        maxContemplations: numOrNull(f.get("maxBidContemplations")),
      },
      contingency: {
        method: String(f.get("contingency")) as RuleConfig["contingency"]["method"],
        maxDaysBeforeAssembly: Number(f.get("maxDays") || 0),
      },
    };
    const groupId = String(f.get("groupId") ?? "");
    const payload = {
      ruleKey: String(f.get("ruleKey") ?? rule?.ruleKey ?? ""),
      name: String(f.get("name") ?? ""),
      administratorName: String(f.get("administratorName") ?? ""),
      productType: String(f.get("productType") ?? ""),
      groupId: groupId || null,
      effectiveFrom: String(f.get("effectiveFrom") ?? ""),
      effectiveUntil: String(f.get("effectiveUntil") ?? "") || null,
      source: String(f.get("source")) as "FEDERAL_LOTTERY",
      regulationReference: String(f.get("regulationReference") ?? ""),
      config,
    };
    execute(() => (rule ? updateRuleDraft(rule.id, payload) : createRuleDraft(payload)), () => setOpen(false));
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {rule ? (
        <DialogTrigger render={<Button size="sm" variant="outline" />}>
          <Pencil className="h-3.5 w-3.5" /> Editar rascunho
        </DialogTrigger>
      ) : (
        <DialogTrigger render={<Button size="sm" />}>Nova regra</DialogTrigger>
      )}
      <DialogContent className="max-h-[88vh] overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>{rule ? `Editar rascunho — ${rule.name} v${rule.version}` : "Nova regra de apuração"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-5">
          <fieldset className="space-y-3">
            <legend className="text-label font-bold uppercase text-card-beige-muted-foreground">Identificação e fonte normativa</legend>
            <div className="grid gap-3 sm:grid-cols-3">
              <Field label="Chave da regra" hint="Estável entre versões, ex.: RULE-001">
                <Input name="ruleKey" defaultValue={rule?.ruleKey} disabled={Boolean(rule)} required={!rule} />
              </Field>
              <Field label="Nome">
                <Input name="name" defaultValue={rule?.name} required />
              </Field>
              <Field label="Administradora">
                <Input name="administratorName" defaultValue={rule?.administratorName} required />
              </Field>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <Field label="Produto">
                <Input name="productType" defaultValue={rule?.productType ?? ""} />
              </Field>
              <Field label="Grupo (opcional)" hint="Vazio = vale pra administradora.">
                <NativeSelect
                  name="groupId"
                  defaultValue={rule?.groupId ?? ""}
                  options={[{ value: "", label: "Todos os grupos da administradora" }, ...groups.map((g) => ({ value: g.id, label: `${g.administratorName} · ${g.groupCode}` }))]}
                />
              </Field>
              <Field label="Fonte oficial">
                <NativeSelect
                  name="source"
                  defaultValue={rule?.source ?? "FEDERAL_LOTTERY"}
                  options={[
                    { value: "FEDERAL_LOTTERY", label: "Loteria Federal" },
                    { value: "OTHER_REGULATED_SOURCE", label: "Outra fonte regulada" },
                  ]}
                />
              </Field>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <Field label="Vigente desde">
                <Input name="effectiveFrom" type="date" defaultValue={rule?.effectiveFrom} required />
              </Field>
              <Field label="Vigente até">
                <Input name="effectiveUntil" type="date" defaultValue={rule?.effectiveUntil ?? ""} />
              </Field>
              <Field label="Regulamento / cláusula">
                <Input name="regulationReference" defaultValue={rule?.regulationReference ?? ""} placeholder="Regulamento v3, cláusula 12" />
              </Field>
            </div>
          </fieldset>

          <fieldset className="space-y-3 border-t border-black/10 pt-4">
            <legend className="text-label font-bold uppercase text-card-beige-muted-foreground">Resultado oficial → candidatos</legend>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Dígitos por prêmio">
                <Input name="prizeDigits" type="number" min={3} max={8} defaultValue={initial.prizeDigits} required />
              </Field>
              <Field label="Quantidade de prêmios">
                <Input name="prizeCount" type="number" min={1} max={10} defaultValue={initial.prizeCount} required />
              </Field>
            </div>
            <Field
              label="Plano de candidatos (ordem de apuração)"
              hint='Uma linha por candidato: "prêmio: posições". Posições contam da esquerda, a partir de 1. Ex.: prêmio 32940 com "1: 3,4,5" gera 940.'
            >
              <Textarea value={planText} onChange={(e) => setPlanText(e.target.value)} rows={6} className="font-mono text-xs" />
            </Field>
            <div className="grid gap-2 rounded-xl border border-dashed border-black/15 p-3 sm:grid-cols-4">
              <Field label="Gerar: prêmios">
                <Input value={genPrizes} onChange={(e) => setGenPrizes(e.target.value)} />
              </Field>
              <Field label="Padrões (separe com |)">
                <Input value={genPatterns} onChange={(e) => setGenPatterns(e.target.value)} />
              </Field>
              <Field label="Ordem">
                <NativeSelect
                  value={genOrder}
                  onChange={(v) => setGenOrder(v as "PRIZE_MAJOR" | "PATTERN_MAJOR")}
                  options={[
                    { value: "PRIZE_MAJOR", label: "Por prêmio" },
                    { value: "PATTERN_MAJOR", label: "Por padrão" },
                  ]}
                />
              </Field>
              <div className="flex items-end">
                <Button type="button" size="sm" variant="outline" onClick={generatePlan}>
                  Gerar plano
                </Button>
              </div>
            </div>
            <p className="text-xs text-card-beige-muted-foreground">
              {preview.error ?? `${preview.plan.length} candidato(s) por extração.`}
            </p>
          </fieldset>

          <fieldset className="space-y-3 border-t border-black/10 pt-4">
            <legend className="text-label font-bold uppercase text-card-beige-muted-foreground">Equivalência, aproximação e substituição</legend>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Equivalência">
                <NativeSelect value={equivalence} onChange={setEquivalence} options={opts(EQUIVALENCE_LABEL)} />
              </Field>
              {equivalence === "EXPLICIT_MAP" ? (
                <Field label="Tabela (uma por linha: número=cota)">
                  <Textarea name="equivalenceMap" defaultValue={mapToText(initial.equivalence.map)} rows={3} className="font-mono text-xs" />
                </Field>
              ) : null}
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <Field label="Aproximação por candidato" hint="Aplicada antes de passar ao próximo candidato.">
                <NativeSelect
                  name="approximation"
                  defaultValue={initial.approximation.method}
                  options={opts(SEQUENCE_METHOD_LABEL, ["NONE", "NEXT_HIGHER", "NEXT_LOWER", "ALTERNATING_UP_FIRST", "ALTERNATING_DOWN_FIRST"])}
                />
              </Field>
              <Field label="Limite de passos">
                <Input name="approximationSteps" type="number" min={1} defaultValue={initial.approximation.maxSteps} />
              </Field>
              <label className="flex items-center gap-2 pt-6 text-sm">
                <input type="checkbox" name="approximationWrap" defaultChecked={initial.approximation.wrapAround} /> Volta ao início da faixa
              </label>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <Field label="Substituição (candidatos esgotados)">
                <NativeSelect value={fallback} onChange={setFallback} options={opts(SEQUENCE_METHOD_LABEL)} />
              </Field>
              {fallback === "PREDEFINED_SEQUENCE" ? (
                <Field label="Sequência (cotas separadas por vírgula)">
                  <Input name="fallbackSequence" defaultValue={(initial.fallback.sequence ?? []).join(",")} />
                </Field>
              ) : (
                <div />
              )}
              <label className="flex items-center gap-2 pt-6 text-sm">
                <input type="checkbox" name="fallbackWrap" defaultChecked={initial.fallback.wrapAround} /> Volta ao início da faixa
              </label>
            </div>
          </fieldset>

          <fieldset className="space-y-3 border-t border-black/10 pt-4">
            <legend className="text-label font-bold uppercase text-card-beige-muted-foreground">Elegibilidade e recursos</legend>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" name="requireUpToDate" defaultChecked={initial.eligibility.requireUpToDate} /> Exige adimplência (Res. BCB 285, art. 11)
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" name="excludeContemplated" defaultChecked={initial.eligibility.excludeContemplated} /> Exclui cotas já contempladas
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" name="reserveFundAllowed" defaultChecked={initial.resources.reserveFundAllowed} /> Regulamento permite usar fundo de reserva
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" name="bidFundsCount" defaultChecked={initial.resources.bidFundsCountTowardResources} /> Recursos próprios do lance entram no fundo
              </label>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Cotas sem dado no snapshot">
                <NativeSelect name="unknownPolicy" defaultValue={initial.eligibility.unknownPolicy} options={opts(UNKNOWN_POLICY_LABEL)} />
              </Field>
              <Field label="Sorteios de cotas canceladas por assembleia">
                <Input name="cancelledQuotaDraws" type="number" min={0} defaultValue={initial.cancelledQuotaDraws} />
              </Field>
            </div>
          </fieldset>

          <fieldset className="space-y-3 border-t border-black/10 pt-4">
            <legend className="text-label font-bold uppercase text-card-beige-muted-foreground">Lances (sempre depois do sorteio)</legend>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={bidsEnabled} onChange={(e) => setBidsEnabled(e.target.checked)} /> Regulamento prevê contemplação por lance
            </label>
            {bidsEnabled ? (
              <>
                <div className="flex flex-wrap gap-2">
                  {(["FIXED_BID", "FREE_BID", "EMBEDDED_BID"] as BidType[]).map((t) => (
                    <button
                      type="button"
                      key={t}
                      onClick={() => toggleBid(t)}
                      className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors ${bidOrder.includes(t) ? "border-primary bg-primary/15" : "border-black/15 hover:bg-black/5"}`}
                    >
                      {bidOrder.includes(t) ? `${bidOrder.indexOf(t) + 1}º · ` : ""}
                      {BID_TYPE_LABEL[t]}
                    </button>
                  ))}
                </div>
                <p className="text-[11px] text-card-beige-muted-foreground">A ordem dos cliques define a ordem de processamento.</p>
                <div className="grid gap-3 sm:grid-cols-4">
                  <Field label="Lance fixo (%)">
                    <Input name="fixedPercentage" type="number" step="0.01" defaultValue={initial.bids.fixedPercentage ?? ""} />
                  </Field>
                  <Field label="Mínimo (%)">
                    <Input name="minPercentage" type="number" step="0.01" defaultValue={initial.bids.minPercentage ?? ""} />
                  </Field>
                  <Field label="Máximo (%)">
                    <Input name="maxPercentage" type="number" step="0.01" defaultValue={initial.bids.maxPercentage ?? ""} />
                  </Field>
                  <Field label="Embutido máx. (% do crédito)">
                    <Input name="embeddedMaxPercentage" type="number" step="0.01" defaultValue={initial.bids.embeddedMaxPercentage ?? ""} />
                  </Field>
                </div>
                <div className="grid gap-3 sm:grid-cols-3">
                  <Field label="Desempate">
                    <NativeSelect name="tieBreak" defaultValue={initial.bids.tieBreak} options={opts(TIE_BREAK_LABEL)} />
                  </Field>
                  <Field label="Limite de contemplações por lance">
                    <Input name="maxBidContemplations" type="number" min={0} defaultValue={initial.bids.maxContemplations ?? ""} />
                  </Field>
                  <label className="flex items-center gap-2 pt-6 text-sm">
                    <input type="checkbox" name="overFixed" defaultChecked={initial.bids.overFixedCompetesAsFree} /> Fixo acima do % concorre como livre
                  </label>
                </div>
              </>
            ) : (
              <input type="hidden" name="tieBreak" value={initial.bids.tieBreak} />
            )}
          </fieldset>

          <fieldset className="space-y-3 border-t border-black/10 pt-4">
            <legend className="text-label font-bold uppercase text-card-beige-muted-foreground">Contingência</legend>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Se não houver extração">
                <NativeSelect
                  name="contingency"
                  defaultValue={initial.contingency.method}
                  options={[
                    { value: "NEXT_EXTRACTION", label: "Usar a próxima extração" },
                    { value: "MANUAL_REVIEW", label: "Revisão manual" },
                  ]}
                />
              </Field>
              <Field label="Janela máxima extração → assembleia (dias)">
                <Input name="maxDays" type="number" min={0} defaultValue={initial.contingency.maxDaysBeforeAssembly} />
              </Field>
            </div>
          </fieldset>

          <Feedback errors={localError ? [localError, ...errors] : errors} message={message} />
          <div className="flex justify-end">
            <Button type="submit" disabled={pending}>
              {pending ? "Salvando…" : rule ? "Salvar rascunho" : "Criar rascunho"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
