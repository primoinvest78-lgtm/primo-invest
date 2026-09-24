import { formatQuotaNumber } from "@/lib/consortium-engine/numbering.ts";
import { formatBRL } from "@/lib/consortium-engine/trace.ts";
import { listCreditOperations } from "@/lib/data/consortium-credit";

import { AGENTS, type ToolName } from "./agents";
import { CATEGORY_LABEL, SEVERITY_LABEL, type FindingEvidence } from "./findings";
import {
  EXPLAIN,
  explainQuota,
  getAssembly,
  getAuditTrail,
  getCalculationTrace,
  getCreditPosition,
  getEligibilitySnapshot,
  getFindings,
  getRuleVersions,
  reproduceCalculation,
} from "./tools";

/**
 * Assistente do motor — responde SÓ com dado estruturado, via
 * ferramentas limitadas, e sempre mostra a evidência. Hoje o
 * entendimento da pergunta é determinístico (padrões de linguagem); o
 * ponto de integração pra um modelo de linguagem é trocar
 * `routeQuestion` por um planner que chame as MESMAS ferramentas.
 * O assistente não publica, não altera, não aprova, não libera.
 */

export type AssistantAnswer = {
  agent: string;
  intent: string;
  answer: string[];
  evidence: FindingEvidence[];
  tools: ToolName[];
  confidence: "HIGH" | "MEDIUM" | "LOW";
  method: "deterministic";
};

export const SUPPORTED_QUESTIONS = [
  "Por que a cota 940 não foi contemplada?",
  "Explique esta contemplação.",
  "Qual regra foi utilizada?",
  "Qual resultado da Loteria Federal foi utilizado?",
  "Mostre a sequência de cálculo.",
  "Quais cotas foram consideradas inelegíveis?",
  "Quantas contemplações ocorreram?",
  "Quanto recurso estava disponível?",
  "Existe alguma inconsistência nesta assembleia?",
  "Quem alterou essa regra? Quando? Qual versão estava publicada?",
  "Houve retificação?",
  "O cálculo pode ser reproduzido?",
  "Qual foi o crédito líquido? Quanto foi amortizado? Quanto falta para quitar?",
];

const norm = (s: string) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");

function agentFor(tool: ToolName): string {
  return AGENTS.find((a) => a.tools.includes(tool))?.id ?? "DATA_AGENT";
}

function ruleLine(rule: { name: string; ruleKey: string; version: number; regulationReference: string | null } | null) {
  return rule
    ? `De acordo com a regra "${rule.name}" (${rule.ruleKey}), versão ${rule.version}${rule.regulationReference ? `, fundamentada em ${rule.regulationReference}` : ""}:`
    : "A assembleia ainda não tem regra congelada.";
}

export async function askAssistant(organizationId: string, question: string, ctx: { assemblyId?: string | null }): Promise<AssistantAnswer> {
  const q = norm(question);
  const need = (): string => {
    if (!ctx.assemblyId) throw new Error("Selecione a assembleia a que a pergunta se refere.");
    return ctx.assemblyId;
  };
  const answer = (intent: string, tool: ToolName, lines: string[], evidence: FindingEvidence[], tools: ToolName[] = [tool]): AssistantAnswer => ({
    agent: agentFor(tool),
    intent,
    answer: lines,
    evidence: evidence.filter((e) => Object.values(e).some((v) => v !== undefined)),
    tools,
    confidence: "HIGH",
    method: "deterministic",
  });

  // 1. Por que a cota X (não) foi contemplada?
  const quotaMatch = q.match(/(?:cota|quota)\s*n?[ºo°]?\s*(\d{1,6})/);
  if (quotaMatch && /(por que|porque|motivo|contemplad|explique|elegiv|apta)/.test(q)) {
    const n = Number(quotaMatch[1]);
    const r = await explainQuota(organizationId, need(), n);
    const d = r.data;
    const lines: string[] = [];
    if (!d.drawRun) lines.push("O sorteio desta assembleia ainda não foi apurado.");
    if (!d.inRange) lines.push(`A cota ${d.label} não existe no grupo (faixa ${d.group.numbering.numberStart} a ${d.group.numbering.numberEnd}).`);
    if (d.contemplation) {
      lines.push(`A cota ${d.label} FOI contemplada: ${EXPLAIN.method(d.contemplation.method)}, via ${EXPLAIN.via(d.contemplation.via)}${d.contemplation.candidateRaw ? `, a partir do número apurado ${d.contemplation.candidateRaw}` : ""}.`);
    } else if (d.drawRun) {
      lines.push(`A cota ${d.label} NÃO foi contemplada nesta assembleia.`);
    }
    if (d.attempts.length) {
      for (const a of d.attempts) {
        lines.push(`Tentativa ${a.attempt}: número ${a.numberText} (${a.numberType === "EQUIVALENT_NUMBER" ? "equivalente" : a.numberType === "APPROXIMATION" ? "aproximação" : a.numberType === "FALLBACK" ? "substituição" : "candidato"}) → cota ${d.label} ${a.outcome === "SELECTED" ? "apta e contemplada" : `inapta — ${EXPLAIN.reason(a.reason)}`}.`);
      }
    } else if (d.drawRun && d.inRange) {
      lines.push(`A cota ${d.label} não chegou a ser testada: nenhum número apurado apontou pra ela antes de as contemplações possíveis serem preenchidas.`);
    }
    if (d.entry) {
      lines.push(`No snapshot de elegibilidade congelado ela estava ${d.entry.eligible ? "APTA" : `INAPTA (${EXPLAIN.reason(d.entry.reason)})`}.`);
    } else if (d.inRange) {
      lines.push(`O snapshot não tinha dado desta cota; a regra manda ${d.presumedPolicy === "ASSUME_ELIGIBLE" ? "presumi-la apta" : d.presumedPolicy === "ASSUME_INELIGIBLE" ? "presumi-la inapta" : "bloquear"} (resultado de conferência).`);
    }
    for (const s of d.bidSteps) lines.push(`Lances: ${s.message}`);
    return answer("explicar-cota", "explainQuota", lines, r.evidence);
  }

  // 2. Qual regra?
  if (/qual regra|regra (foi )?(usada|utilizada|aplicada)/.test(q) && !/(quem|alterou|publicou|aprovou)/.test(q)) {
    const r = await getAssembly(organizationId, need());
    const rule = r.data.workspace.rule;
    const lines = [ruleLine(rule)];
    if (rule) {
      lines.push(`Status ${rule.status}; vigência ${rule.effectiveFrom} a ${rule.effectiveUntil ?? "indeterminado"}; hash ${rule.ruleHash?.slice(0, 16) ?? "—"}…`);
      lines.push(`Plano: ${rule.config.candidatePlan.map((s) => `${s.prize}º prêmio [${s.positions.join(",")}]`).join(" → ")}.`);
    }
    return answer("regra-utilizada", "getRule", lines, r.evidence, ["getAssembly"]);
  }

  // 3. Resultado oficial.
  if (/(resultado|loteria|concurso|premios?)/.test(q) && !/(inconsist|anomal|calculo)/.test(q)) {
    const r = await getAssembly(organizationId, need());
    const l = r.data.workspace.lottery;
    const lines = l
      ? [`Resultado oficial usado: Loteria Federal, concurso ${l.contestNumber} de ${l.drawDate}.`, `Prêmios: ${l.prizes.map((p, i) => `${i + 1}º ${p}`).join(" · ")}.`, `Situação: ${l.verificationStatus}; referência: ${l.sourceReference ?? "—"}; hash ${l.contentHash.slice(0, 16)}…`]
      : ["Nenhum resultado oficial travado nesta assembleia."];
    return answer("resultado-oficial", "getLotteryResult", lines, r.evidence, ["getAssembly"]);
  }

  // 4. Inelegíveis.
  if (/(inelegiv|inaptas?|nao habilitad|nao eram aptas)/.test(q)) {
    const r = await getEligibilitySnapshot(organizationId, need());
    const snap = r.data.snapshot;
    if (!snap) return answer("inelegiveis", "getEligibilitySnapshot", ["A elegibilidade ainda não foi travada."], r.evidence);
    const bad = snap.entries.filter((e) => !e.eligible);
    const byReason = new Map<string, number[]>();
    for (const e of bad) byReason.set(e.reason ?? "UNKNOWN", [...(byReason.get(e.reason ?? "UNKNOWN") ?? []), e.quotaNumber]);
    const d = r.data.group.numbering.displayDigits;
    const lines = [`${bad.length} cota(s) inapta(s) no snapshot nº ${r.data.sequence} (de ${snap.entries.length} com dado; base ${snap.completeness === "COMPLETE" ? "completa" : "parcial"}).`];
    for (const [reason, list] of byReason) lines.push(`${EXPLAIN.reason(reason)}: ${list.slice(0, 40).map((n) => formatQuotaNumber(n, d)).join(", ")}${list.length > 40 ? ` e mais ${list.length - 40}` : ""}.`);
    return answer("inelegiveis", "getEligibilitySnapshot", lines, r.evidence);
  }

  // 5. Quantas contemplações / recursos.
  if (/(quantas contemplac|quantos contemplad|quanto recurso|recursos? disponive|contemplacoes possiveis)/.test(q)) {
    const r = await getAssembly(organizationId, need());
    const res = r.data.resources;
    const lines: string[] = [];
    if (res) {
      lines.push(`Recursos disponíveis: ${formatBRL(res.available)}; crédito ${formatBRL(res.creditAmount)} → capacidade de ${res.capacity} contemplação(ões); ${res.drawSlots} por sorteio (status ${res.status}).`);
      lines.push(...res.justification);
    } else lines.push("Recursos ainda não apurados (a assembleia não foi calculada).");
    const act = r.data.activeContemplations;
    lines.push(`Contemplações vigentes: ${act.length} (${act.filter((c) => c.method.startsWith("DRAW")).length} por sorteio, ${act.filter((c) => c.method.endsWith("_BID")).length} por lance).`);
    if (r.data.bidsRun) lines.push(`Saldo após contemplações: ${formatBRL(r.data.bidsRun.result.remainingResources)}.`);
    else if (r.data.drawRun) lines.push(`Saldo após o sorteio: ${formatBRL(r.data.drawRun.result.remainingResources)}.`);
    return answer("recursos-contemplacoes", "getAssembly", lines, r.evidence);
  }

  // 6. Sequência de cálculo / explicar contemplação.
  if (/(sequencia|calculo|explique (esta|a) contemplac|como foi apurad|trilha)/.test(q)) {
    const r = await getCalculationTrace(organizationId, need(), /lance/.test(q) ? "BIDS" : "DRAW");
    const t = r.data.trace;
    if (!t.length) return answer("sequencia-calculo", "getCalculationTrace", ["Nenhum cálculo vigente."], r.evidence);
    const key = t.filter((s) => ["RULE", "LOTTERY", "RESOURCES_AVAILABLE", "RESOURCES_PARTIAL", "RESOURCES_INSUFFICIENT", "CANDIDATE", "EQUIVALENCE_EQUIVALENT_NUMBER", "EQUIVALENCE_ELIMINATED", "QUOTA_INELIGIBLE", "QUOTA_ELIGIBLE", "FALLBACK_START", "CONTEMPLATED", "RESULT"].includes(s.code));
    return answer("sequencia-calculo", "getCalculationTrace", key.slice(0, 40).map((s) => `${s.step}. ${s.message}`), r.evidence);
  }

  // 7. Inconsistência / anomalia.
  if (/(inconsist|anomal|problema|divergen|alerta)/.test(q)) {
    const r = await getFindings(organizationId, ctx.assemblyId ?? undefined);
    const rows = r.data as { title: string; severity: keyof typeof SEVERITY_LABEL; category: keyof typeof CATEGORY_LABEL; detector: string; explanation: string }[];
    const lines = rows.length
      ? rows.slice(0, 12).map((f) => `[${SEVERITY_LABEL[f.severity]} · ${CATEGORY_LABEL[f.category]}] ${f.title} — ${f.explanation} (regra de detecção: ${f.detector})`)
      : ["Nenhum achado aberto. Execute uma varredura para atualizar a análise."];
    return answer("anomalias", "getFindings", lines, r.evidence);
  }

  // 8. Auditoria de regra.
  if (/(quem|quando|versao estava publicada|qual versao)/.test(q) && /regra|versao/.test(q)) {
    const a = await getAssembly(organizationId, need());
    const rule = a.data.workspace.rule;
    if (!rule) return answer("auditoria-regra", "getRuleVersions", ["A assembleia não tem regra vinculada."], a.evidence);
    const v = await getRuleVersions(organizationId, rule.ruleKey);
    const lines = v.data.map(
      (x) =>
        `v${x.version} (${x.status}): criada por ${x.createdByName ?? "—"} em ${x.createdAt.slice(0, 10)}` +
        `${x.approvedByName ? `, aprovada por ${x.approvedByName} em ${x.approvedAt?.slice(0, 10)}` : ""}` +
        `${x.publishedByName ? `, publicada por ${x.publishedByName} em ${x.publishedAt?.slice(0, 10)}` : ""}` +
        `${x.usedBy.length ? `; usada nas assembleias ${x.usedBy.map((u) => `nº ${u.number}`).join(", ")}` : ""}.`,
    );
    lines.unshift(`Esta assembleia usou a v${rule.version} de ${rule.ruleKey}.`);
    return answer("auditoria-regra", "getRuleVersions", lines, v.evidence, ["getAssembly", "getRuleVersions"]);
  }

  // 9. Retificação.
  if (/retific/.test(q)) {
    const r = await getAssembly(organizationId, need());
    const rets = r.data.workspace.retifications;
    const lines = rets.length
      ? rets.map((x) => `Retificação ${x.status} (${x.requestedAt.slice(0, 10)}): ${x.reason}. Resultado original ${x.originalResultHash.slice(0, 12)}… → novo ${x.newResultHash?.slice(0, 12) ?? "—"}…`)
      : ["Não houve retificação nesta assembleia."];
    return answer("retificacao", "getAuditTrail", lines, r.evidence, ["getAssembly"]);
  }

  // 10. Reprodução.
  if (/reproduz|replay|reexecut/.test(q)) {
    const a = await getAssembly(organizationId, need());
    const runs = a.data.workspace.runs.filter((r) => r.status === "CURRENT");
    const lines: string[] = [];
    for (const run of runs) {
      const rep = await reproduceCalculation(organizationId, need(), run.id);
      lines.push(rep.data?.identical ? `Cálculo de ${run.phase === "DRAW" ? "sorteio" : "lances"} nº ${run.runNumber}: reproduzido com os mesmos 5 hashes.` : `Cálculo de ${run.phase === "DRAW" ? "sorteio" : "lances"} nº ${run.runNumber}: DIVERGENTE (${rep.data?.hashDiffs.join(", ")}) — anomalia crítica.`);
    }
    return answer("reproducao", "reproduceCalculation", lines.length ? lines : ["Nenhum cálculo para reproduzir."], a.evidence);
  }

  // 11. Crédito / amortização / quitação.
  if (/(credito liquido|amortiz|quitar|quitac|saldo devedor|lance embutido)/.test(q)) {
    const ops = await listCreditOperations(organizationId);
    const scoped = ctx.assemblyId ? ops.filter((o) => o.assemblyId === ctx.assemblyId) : ops;
    const lines: string[] = [];
    const evidence: FindingEvidence[] = [];
    for (const o of scoped.slice(0, 5)) {
      const p = await getCreditPosition(organizationId, o.id);
      const w = p.data;
      const amort = w.movements.filter((m) => m.movementType === "AMORTIZATION").reduce((s, m) => s + m.amount, 0);
      lines.push(`Cota ${o.quotaLabel ?? o.quotaNumber}: crédito ${formatBRL(o.updatedCredit)} − embutido ${formatBRL(o.embeddedBidAmount)} = líquido ${formatBRL(o.netAvailableCredit)}; lance ${formatBRL(o.bidAmount)}; utilizado ${formatBRL(o.usedCredit)}; saldo de crédito ${formatBRL(o.remainingCredit)}.`);
      if (w.position) lines.push(`  Amortizado ${formatBRL(amort)}; saldo devedor ${formatBRL(w.position.outstanding)} em ${w.position.openInstallments} parcela(s) — situação: ${w.position.status}.`);
      evidence.push(...p.evidence);
    }
    return answer("credito", "getCreditPosition", lines.length ? lines : ["Nenhuma operação de crédito para esta assembleia."], evidence);
  }

  // 12. Auditoria geral.
  if (/(quem|auditoria|historico|quando)/.test(q)) {
    const r = await getAuditTrail(organizationId, { assemblyId: ctx.assemblyId ?? undefined });
    return answer("auditoria", "getAuditTrail", r.data.slice(0, 15).map((e) => `${e.createdAt.slice(0, 16).replace("T", " ")} · ${e.eventType} · ${e.actorName ?? "sistema"}`), r.evidence);
  }

  return {
    agent: "DATA_AGENT",
    intent: "desconhecida",
    answer: ["Não encontrei essa resposta nos dados estruturados do motor — e não respondo sem evidência. Perguntas suportadas:", ...SUPPORTED_QUESTIONS.map((s) => `• ${s}`)],
    evidence: [],
    tools: [],
    confidence: "LOW",
    method: "deterministic",
  };
}
