"use server";

import { revalidatePath } from "next/cache";

import { hashOf, lotteryContentHash, validateLotteryResult, type RunOutput } from "@/lib/consortium-engine/index.ts";
import { askAssistant, type AssistantAnswer } from "@/lib/consortium-intelligence/assistant";
import { detectOrganizationFindings } from "@/lib/consortium-intelligence/detectors";
import { extractRuleFromText, type RuleExtraction } from "@/lib/consortium-intelligence/document-extraction";
import { fetchFederalResult, normalizeFederalPayload } from "@/lib/consortium-intelligence/lottery-source";
import { logAutomation, persistFindings, runMonitoringScan } from "@/lib/consortium-intelligence/monitor";
import { simulate, type Scenario } from "@/lib/consortium-intelligence/simulation";
import { getAssembly as toolGetAssembly, getFindings as toolGetFindings } from "@/lib/consortium-intelligence/tools";
import {
  executeAssemblyDraw,
  lockAssemblyEligibility,
  lockAssemblyLottery,
  prepareAssemblyDraw,
  startAssemblyPreparation,
} from "@/lib/actions/consortium-engine";
import { getAssemblyWorkspace, listEngineRules, listLotteryResults } from "@/lib/data/consortium-engine";
import { currentRun, drawInputFromSnapshots, latestSet } from "@/lib/data/consortium-replay";
import { createClient } from "@/lib/supabase/server";
import { requireActiveMembership } from "@/lib/supabase/session";

/**
 * Actions da camada de inteligência. Pode LER, ANALISAR, EXPLICAR,
 * SUGERIR, ALERTAR, SIMULAR e propor RASCUNHO. Nada aqui publica
 * regra, altera resultado oficial, aprova retificação, mexe em
 * auditoria ou libera crédito.
 */

export type IntelResult<T = undefined> = { ok: true; data?: T; message?: string } | { ok: false; errors: string[] };

const OPERATE = ["admin", "manager", "operations", "advisor", "compliance", "finance"];
const GOVERN = ["admin", "manager", "compliance"];

async function guard(kind: "read" | "operate" | "govern") {
  const m = await requireActiveMembership();
  if (kind === "operate" && !OPERATE.includes(m.role)) throw new Error("Seu papel não permite esta operação.");
  if (kind === "govern" && !GOVERN.includes(m.role)) throw new Error("Esta ação exige papel de governança.");
  return m;
}

async function run<T>(fn: () => Promise<IntelResult<T>>): Promise<IntelResult<T>> {
  try {
    return await fn();
  } catch (e) {
    const message = e && typeof e === "object" && "message" in e ? String((e as { message: unknown }).message) : String(e);
    return { ok: false, errors: [message] };
  }
}

function revalidateIntel() {
  revalidatePath("/consorcios/motor/inteligencia");
  revalidatePath("/consorcios/motor");
}

export async function runMonitoringScanAction(): Promise<IntelResult> {
  return run(async () => {
    const { organizationId } = await guard("operate");
    const r = await runMonitoringScan(organizationId, "MANUAL");
    revalidateIntel();
    return r.ok ? { ok: true, message: r.summary } : { ok: false, errors: [r.summary] };
  });
}

/** Revisão humana do achado. Crítico/exige revisão: só governança (também no banco). */
export async function reviewFinding(findingId: string, status: "ACKNOWLEDGED" | "RESOLVED" | "DISMISSED", notes: string): Promise<IntelResult> {
  return run(async () => {
    const { organizationId, userId } = await guard("operate");
    const supabase = await createClient();
    const { error } = await supabase
      .from("consortium_intelligence_findings")
      .update({ status, review_notes: notes.trim() || null, reviewed_by: userId, reviewed_at: new Date().toISOString() })
      .eq("id", findingId)
      .eq("organization_id", organizationId);
    if (error) throw error;
    revalidateIntel();
    return { ok: true };
  });
}

/**
 * Coleta automática do resultado oficial. Entra como PENDENTE (com
 * evidência bruta) — a verificação continua sendo humana.
 */
export async function fetchLotteryFromOfficialSource(contest: string, prizeDigits: number): Promise<IntelResult<{ id: string }>> {
  return run(async () => {
    const { organizationId, userId } = await guard("operate");
    const startedAt = new Date().toISOString();
    const fetched = await fetchFederalResult(contest.trim() || undefined);
    if (fetched.error || !fetched.payload) {
      await logAutomation(organizationId, "LOTTERY_FETCH", "MANUAL", "FAILED", fetched.error ?? "Sem resposta.", { url: fetched.url }, startedAt);
      return { ok: false, errors: [fetched.error ?? "Sem resposta da fonte oficial."] };
    }
    const norm = normalizeFederalPayload(fetched.payload, prizeDigits);
    if (!norm.result) {
      await logAutomation(organizationId, "LOTTERY_FETCH", "MANUAL", "FAILED", norm.errors.join(" "), { url: fetched.url, notes: norm.notes }, startedAt);
      return { ok: false, errors: norm.errors };
    }
    const result = norm.result;
    const supabase = await createClient();
    const { data: existing, error: exError } = await supabase
      .from("consortium_lottery_results")
      .select("id, prizes")
      .eq("organization_id", organizationId)
      .eq("source", "FEDERAL_LOTTERY")
      .eq("contest_number", result.contestNumber)
      .maybeSingle();
    if (exError) throw exError;
    if (existing) {
      const same = (existing.prizes as string[]).join(",") === result.prizes.join(",");
      const summary = same
        ? `Concurso ${result.contestNumber} já registrado e confere com a fonte oficial.`
        : `Concurso ${result.contestNumber} já registrado com prêmios DIFERENTES da fonte oficial.`;
      await logAutomation(organizationId, "LOTTERY_FETCH", "MANUAL", same ? "SUCCESS" : "PARTIAL", summary, { url: fetched.url, stored: existing.prizes, official: result.prizes }, startedAt);
      if (!same) {
        await persistFindings(organizationId, detectOrganizationFindings({ rules: [], upcomingAssemblies: [], quotaIssues: [], legacyWonBids: [], events: [], chainVerified: null, today: startedAt.slice(0, 10), sourceChecks: [{ resultId: existing.id as string, contestNumber: result.contestNumber, stored: existing.prizes as string[], official: result.prizes, error: null }] }), new Set(["conferencia-fonte-oficial"]), `coleta de ${startedAt.slice(0, 10)}`);
        revalidateIntel();
        return { ok: false, errors: [summary, "Registrado como anomalia crítica para revisão humana."] };
      }
      return { ok: true, message: summary };
    }
    const validation = validateLotteryResult(result, { prizeDigits, prizeCount: result.prizes.length }, startedAt.slice(0, 10));
    const { data, error } = await supabase
      .from("consortium_lottery_results")
      .insert({
        organization_id: organizationId,
        source: "FEDERAL_LOTTERY",
        contest_number: result.contestNumber,
        draw_date: result.drawDate,
        prizes: result.prizes,
        prize_digits: prizeDigits,
        source_reference: fetched.url,
        retrieved_at: startedAt,
        evidence_notes: "Coleta automática da API pública da CAIXA — conteúdo bruto guardado.",
        verification_status: validation.status === "VALID" ? "PENDING" : "INVALID",
        validation_errors: validation.errors,
        content_hash: lotteryContentHash(result),
        origin: "AUTOMATED_FETCH",
        raw_payload: fetched.payload,
        normalization_notes: norm.notes.join(" ") || null,
        created_by: userId,
      })
      .select("id")
      .single();
    if (error) throw error;
    await supabase.from("consortium_engine_events").insert({
      organization_id: organizationId,
      entity_type: "lottery_result",
      entity_id: data.id,
      event_type: "LOTTERY_IMPORTED",
      payload: { contestNumber: result.contestNumber, origin: "AUTOMATED_FETCH", url: fetched.url, normalization: norm.notes, rawHash: hashOf(fetched.payload) },
    });
    await logAutomation(organizationId, "LOTTERY_FETCH", "MANUAL", "SUCCESS", `Concurso ${result.contestNumber} coletado da fonte oficial; aguarda verificação humana.`, { url: fetched.url, prizes: result.prizes, notes: norm.notes }, startedAt);
    revalidateIntel();
    return { ok: true, data: { id: data.id as string }, message: `Concurso ${result.contestNumber} (${result.drawDate}) coletado: ${result.prizes.join(" · ")}. ${norm.notes.length ? "Normalização registrada. " : ""}Aguarda verificação por governança.` };
  });
}

/** Confere resultados já verificados contra a fonte oficial (fonte divergente = anomalia crítica). */
export async function crossCheckLotterySources(): Promise<IntelResult> {
  return run(async () => {
    const { organizationId } = await guard("operate");
    const startedAt = new Date().toISOString();
    const results = (await listLotteryResults(organizationId)).filter((l) => l.source === "FEDERAL_LOTTERY" && l.verificationStatus === "VERIFIED").slice(0, 15);
    const checks: { resultId: string; contestNumber: string; stored: string[]; official: string[] | null; error: string | null }[] = [];
    for (const l of results) {
      const f = await fetchFederalResult(l.contestNumber);
      if (f.error || !f.payload) {
        checks.push({ resultId: l.id, contestNumber: l.contestNumber, stored: l.prizes, official: null, error: f.error });
        continue;
      }
      const n = normalizeFederalPayload(f.payload, l.prizeDigits);
      checks.push({ resultId: l.id, contestNumber: l.contestNumber, stored: l.prizes, official: n.result?.prizes ?? null, error: n.errors.join(" ") || null });
    }
    const findings = detectOrganizationFindings({ rules: [], upcomingAssemblies: [], quotaIssues: [], legacyWonBids: [], events: [], chainVerified: null, today: startedAt.slice(0, 10), sourceChecks: checks });
    const persisted = await persistFindings(organizationId, findings, new Set(["conferencia-fonte-oficial"]), `conferência de fonte de ${startedAt.slice(0, 10)}`);
    const divergent = checks.filter((c) => c.official && c.official.join() !== c.stored.join()).length;
    const failed = checks.filter((c) => !c.official).length;
    const summary = `${checks.length} resultado(s) conferido(s) com a fonte oficial: ${divergent} divergente(s), ${failed} sem resposta.`;
    await logAutomation(organizationId, "LOTTERY_CROSS_CHECK", "MANUAL", failed ? "PARTIAL" : "SUCCESS", summary, { checks, ...persisted }, startedAt);
    revalidateIntel();
    return { ok: true, message: summary };
  });
}

export async function runSimulationAction(assemblyId: string, title: string, scenario: Scenario): Promise<IntelResult<{ id: string }>> {
  return run(async () => {
    const { organizationId } = await guard("operate");
    const ws = await getAssemblyWorkspace(organizationId, assemblyId);
    if (!ws) return { ok: false, errors: ["Assembleia não encontrada."] };
    const set = latestSet(ws);
    if (!set) return { ok: false, errors: ["A assembleia ainda não tem regra, resultado, elegibilidade e recursos congelados — não há base para simular."] };
    const base = drawInputFromSnapshots(set);
    const official = currentRun(ws, "DRAW");
    const officialOut = official ? ({ hashes: official.hashes, contemplations: official.result.contemplations } as unknown as RunOutput) : null;
    const sim = simulate(base, scenario, officialOut);
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("consortium_simulations")
      .insert({
        organization_id: organizationId,
        assembly_id: assemblyId,
        base_run_id: official?.id ?? null,
        title: title.trim() || "Simulação",
        scenario,
        input: sim.input,
        rule: sim.input.rule,
        result: { status: sim.result.status, errors: sim.result.errors, contemplations: sim.result.contemplations, resources: sim.result.resources, remainingResources: sim.result.remainingResources, trace: sim.result.trace, notes: sim.notes },
        comparison: sim.comparison,
        input_hash: sim.inputHash,
        result_hash: sim.resultHash,
      })
      .select("id")
      .single();
    if (error) throw error;
    await supabase.from("consortium_engine_events").insert({
      organization_id: organizationId,
      group_id: ws.group.id,
      assembly_id: assemblyId,
      entity_type: "simulation",
      entity_id: data.id,
      event_type: "SIMULATION_RUN",
      payload: { scenario, resultHash: sim.resultHash },
    });
    revalidateIntel();
    return { ok: true, data: { id: data.id as string } };
  });
}

export async function previewRuleExtraction(text: string): Promise<IntelResult<RuleExtraction>> {
  return run(async () => {
    await guard("read");
    if (text.trim().length < 40) return { ok: false, errors: ["Cole um trecho maior do regulamento."] };
    return { ok: true, data: extractRuleFromText(text) };
  });
}

/** Extração → regra em RASCUNHO. Nunca publicada automaticamente. */
export async function createRuleDraftFromDocument(input: {
  text: string;
  ruleKey: string;
  name: string;
  administratorName: string;
  effectiveFrom: string;
  regulationReference: string;
}): Promise<IntelResult<{ id: string }>> {
  return run(async () => {
    const { organizationId, userId } = await guard("operate");
    const startedAt = new Date().toISOString();
    const extraction = extractRuleFromText(input.text);
    const key = input.ruleKey.trim().toUpperCase();
    if (!key || !input.name.trim() || !input.administratorName.trim() || !input.effectiveFrom) return { ok: false, errors: ["Chave, nome, administradora e vigência são obrigatórios."] };
    const supabase = await createClient();
    const { data: existing } = await supabase.from("consortium_draw_rules").select("version").eq("organization_id", organizationId).eq("rule_key", key).order("version", { ascending: false }).limit(1);
    const version = existing && existing.length ? (existing[0].version as number) + 1 : 1;
    const { data, error } = await supabase
      .from("consortium_draw_rules")
      .insert({
        organization_id: organizationId,
        rule_key: key,
        version,
        name: input.name.trim(),
        administrator_name: input.administratorName.trim(),
        effective_from: input.effectiveFrom,
        regulation_reference: input.regulationReference.trim() || "Extraída de documento (revisar)",
        config: extraction.config,
        status: "DRAFT",
        created_by: userId,
      })
      .select("id")
      .single();
    if (error) throw error;
    await supabase.from("consortium_engine_events").insert({
      organization_id: organizationId,
      entity_type: "rule",
      entity_id: data.id,
      event_type: "RULE_EXTRACTION_DRAFTED",
      payload: { fields: extraction.fields, warnings: extraction.warnings, textHash: hashOf(input.text) },
    });
    await logAutomation(organizationId, "RULE_EXTRACTION", "MANUAL", extraction.warnings.length ? "PARTIAL" : "SUCCESS", `Regra ${key} v${version} extraída como RASCUNHO (${extraction.fields.length} campo(s), ${extraction.warnings.length} aviso(s)).`, { ruleId: data.id, warnings: extraction.warnings }, startedAt);
    revalidateIntel();
    return { ok: true, data: { id: data.id as string }, message: "Rascunho criado. Revise campo a campo antes de enviar para revisão." };
  });
}

export async function askAssistantAction(question: string, assemblyId: string | null): Promise<IntelResult<AssistantAnswer>> {
  return run(async () => {
    const { organizationId } = await guard("read");
    if (!question.trim()) return { ok: false, errors: ["Digite uma pergunta."] };
    return { ok: true, data: await askAssistant(organizationId, question, { assemblyId }) };
  });
}

/**
 * Preparação automática: avança a assembleia enquanto os insumos
 * estiverem inequívocos (uma regra aplicável, um resultado verificado
 * na janela, recursos já informados) e executa a apuração. Para na
 * primeira ambiguidade. NUNCA homologa — isso é decisão humana.
 */
export async function autoPrepareAssembly(assemblyId: string): Promise<IntelResult> {
  return run(async () => {
    const { organizationId } = await guard("operate");
    const startedAt = new Date().toISOString();
    const steps: string[] = [];
    const stop = async (reason: string, status: "PARTIAL" | "FAILED" = "PARTIAL") => {
      steps.push(`Parou: ${reason}`);
      await logAutomation(organizationId, "ASSEMBLY_PREPARATION", "MANUAL", status, steps.join(" → "), { assemblyId, steps }, startedAt);
      revalidateIntel();
      revalidatePath(`/consorcios/motor/assembleias/${assemblyId}`);
      return { ok: true as const, message: steps.join(" → ") };
    };

    for (let guardLoop = 0; guardLoop < 8; guardLoop += 1) {
      const ws = await getAssemblyWorkspace(organizationId, assemblyId);
      if (!ws) return { ok: false, errors: ["Assembleia não encontrada."] };
      const s = ws.assembly.status;
      if (s === "SCHEDULED") {
        const r = await startAssemblyPreparation(assemblyId);
        if (!r.ok) return stop(r.errors.join(" "), "FAILED");
        steps.push("Preparação iniciada");
      } else if (s === "PREPARING") {
        const admin = ws.group.administratorName.trim().toLowerCase();
        const rules = (await listEngineRules(organizationId)).filter(
          (r) => r.status === "PUBLISHED" && r.administratorName.trim().toLowerCase() === admin && (!r.groupId || r.groupId === ws.group.id) &&
            r.effectiveFrom <= ws.assembly.assemblyDate && (!r.effectiveUntil || r.effectiveUntil >= ws.assembly.assemblyDate),
        );
        if (rules.length !== 1) return stop(rules.length === 0 ? "nenhuma regra publicada e vigente" : `${rules.length} regras aplicáveis — escolha manualmente`);
        const r = await lockAssemblyEligibility(assemblyId, rules[0].id);
        if (!r.ok) return stop(r.errors.join(" "), "FAILED");
        steps.push(`Elegibilidade travada com ${rules[0].name} v${rules[0].version}`);
      } else if (s === "ELIGIBILITY_LOCKED") {
        const window = ws.rule?.config.contingency.maxDaysBeforeAssembly ?? 7;
        const date = ws.assembly.assemblyDate;
        const minDate = new Date(Date.parse(`${date}T00:00:00Z`) - window * 86_400_000).toISOString().slice(0, 10);
        const candidates = (await listLotteryResults(organizationId)).filter((l) => l.verificationStatus === "VERIFIED" && l.drawDate <= date && l.drawDate >= minDate);
        const latest = candidates.sort((a, b) => (a.drawDate < b.drawDate ? 1 : -1))[0];
        if (!latest) return stop("nenhum resultado oficial verificado dentro da janela da regra");
        if (candidates.filter((c) => c.drawDate === latest.drawDate).length > 1) return stop("mais de um resultado verificado na mesma data — escolha manualmente");
        const r = await lockAssemblyLottery(assemblyId, latest.id);
        if (!r.ok) return stop(r.errors.join(" "), "FAILED");
        steps.push(`Resultado oficial travado: concurso ${latest.contestNumber}`);
      } else if (s === "LOTTERY_LOCKED") {
        const a = ws.assembly;
        if (a.commonFundBalance === null || (a.creditAmount ?? ws.group.creditAmount) === null) return stop("recursos da assembleia não informados (fundo comum e crédito)");
        const r = await prepareAssemblyDraw(assemblyId, {
          commonFundBalance: a.commonFundBalance,
          reserveFundBalance: a.reserveFundBalance,
          reserveFundUsable: a.reserveFundUsable,
          creditAmount: a.creditAmount ?? ws.group.creditAmount,
          plannedDrawContemplations: a.plannedDrawContemplations,
        });
        if (!r.ok) return stop(r.errors.join(" "), "FAILED");
        steps.push("Regra e recursos congelados");
      } else if (s === "DRAW_READY") {
        const r = await executeAssemblyDraw(assemblyId);
        if (!r.ok) return stop(r.errors.join(" "), "FAILED");
        steps.push("Apuração do sorteio executada");
      } else {
        steps.push(`Estado ${s}: próximos passos (lances, homologação) são decisão humana`);
        await logAutomation(organizationId, "ASSEMBLY_PREPARATION", "MANUAL", "SUCCESS", steps.join(" → "), { assemblyId, steps }, startedAt);
        revalidateIntel();
        revalidatePath(`/consorcios/motor/assembleias/${assemblyId}`);
        return { ok: true, message: steps.join(" → ") };
      }
    }
    return stop("limite de passos atingido");
  });
}

/** Relatório interno da assembleia (publicação interna), com log. */
export async function generateInternalReport(assemblyId: string): Promise<IntelResult<{ lines: string[] }>> {
  return run(async () => {
    const { organizationId } = await guard("read");
    const startedAt = new Date().toISOString();
    const a = await toolGetAssembly(organizationId, assemblyId);
    const f = await toolGetFindings(organizationId, assemblyId);
    const w = a.data.workspace;
    const d = w.group.numbering.displayDigits;
    const lines = [
      `RELATÓRIO INTERNO — Assembleia nº ${w.assembly.assemblyNumber} · grupo ${w.group.groupCode} (${w.group.administratorName}) · ${w.assembly.assemblyDate}`,
      `Etapa: ${({ SCHEDULED: "agendada", PREPARING: "em preparação", ELIGIBILITY_LOCKED: "elegibilidade travada", LOTTERY_LOCKED: "resultado travado", DRAW_READY: "pronta para apuração", DRAWING: "apurando", DRAW_COMPLETED: "sorteio apurado", BID_PROCESSING: "lances apurados", HOMOLOGATION: "em homologação", COMPLETED: "homologada", LOCKED: "travada", RETIFIED: "retificada" } as Record<string, string>)[w.assembly.status] ?? w.assembly.status}.`,
      w.rule ? `Regra: ${w.rule.name} (${w.rule.ruleKey}) v${w.rule.version}. Selo de integridade ${w.rule.ruleHash ? "registrado" : "ausente"}.` : "Regra: não definida.",
      w.lottery ? `Resultado oficial: concurso ${w.lottery.contestNumber} de ${w.lottery.drawDate} — ${w.lottery.prizes.join(" · ")}.` : "Resultado oficial: não travado.",
      a.data.resources ? `Recursos: ${a.data.resources.justification.join(" ")}` : "Recursos: não apurados.",
      `Contemplações vigentes: ${a.data.activeContemplations.map((c) => `cota ${String(c.quotaNumber).padStart(d, "0")} (${({ DRAW: "sorteio", DRAW_CANCELLED: "sorteio de cancelada", FREE_BID: "lance livre", FIXED_BID: "lance fixo", EMBEDDED_BID: "lance embutido" } as Record<string, string>)[c.method] ?? c.method}, ${({ SELECTED: "apurada", HOMOLOGATED: "homologada", PENDING: "pendente", RETAINED: "retida", RETIRED: "baixada" } as Record<string, string>)[c.status] ?? c.status})`).join("; ") || "nenhuma"}.`,
      a.data.drawRun ? `Cálculo do sorteio nº ${a.data.drawRun.runNumber} gravado com os 5 selos de integridade.` : "",
      `Retificações: ${w.retifications.length}.`,
      `Achados abertos: ${(f.data as unknown[]).length}.`,
    ].filter(Boolean);
    await logAutomation(organizationId, "INTERNAL_REPORT", "MANUAL", "SUCCESS", `Relatório interno da assembleia nº ${w.assembly.assemblyNumber}.`, { assemblyId, lines }, startedAt);
    revalidateIntel();
    return { ok: true, data: { lines } };
  });
}
