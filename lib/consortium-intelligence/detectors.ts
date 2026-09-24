import { daysBetween, lotteryContentHash } from "../consortium-engine/source.ts";
import { computeRuleHash } from "../consortium-engine/rules.ts";
import { formatBRL } from "../consortium-engine/trace.ts";
import { hashOf } from "../consortium-engine/hash.ts";
import type { DrawRule, EligibilitySnapshot, GroupNumbering, RunHashes } from "../consortium-engine/types.ts";
import { mustReview, type Finding, type FindingCategory, type FindingConfidence, type FindingSeverity } from "./findings.ts";

/**
 * Anomaly Engine — detectores determinísticos sobre FATOS já gravados
 * (snapshots, runs, auditoria). Cada detector tem nome estável, e cada
 * achado cita a evidência. Nenhum detector altera dado.
 */

export type AssemblyFacts = {
  assembly: { id: string; number: number; date: string; status: string };
  group: { id: string; code: string; administratorName: string; numbering: GroupNumbering; quotaCount: number };
  rule: (DrawRule & { ruleHash: string | null }) | null;
  /** Versão publicada da mesma chave vigente na data da assembleia (hoje). */
  effectiveVersion: { id: string; version: number } | null;
  lottery: { id: string; contestNumber: string; drawDate: string; prizes: string[]; source: string; contentHash: string; verificationStatus: string } | null;
  eligibility: { snapshot: EligibilitySnapshot; payloadHash: string; storedHash: string; ruleId: string } | null;
  runs: {
    id: string;
    phase: "DRAW" | "BIDS";
    status: "CURRENT" | "SUPERSEDED";
    ruleId: string;
    hashes: RunHashes;
    official: boolean;
    remainingResources: number;
    available: number | null;
    contemplations: { quotaNumber: number; method: string; creditAmount: number; via: string }[];
  }[];
  /** Resultado da reprodução por run (feita pelo chamador com o motor). */
  reproduction: Record<string, { identical: boolean; hashDiffs: string[] }>;
  snapshotHashes: { id: string; kind: string; payloadHash: string; recomputed: string }[];
  pendingRetifications: number;
  today: string;
};

function finding(
  base: Omit<Finding, "requiresHumanReview" | "fingerprint"> & { fingerprintKey: string },
): Finding {
  const { fingerprintKey, ...rest } = base;
  return { ...rest, fingerprint: `${base.code}:${fingerprintKey}`, requiresHumanReview: mustReview(base.category, base.severity, base.code) };
}

function mk(
  code: string,
  category: FindingCategory,
  severity: FindingSeverity,
  confidence: FindingConfidence,
  detector: string,
  facts: AssemblyFacts,
  title: string,
  explanation: string,
  evidence: Finding["evidence"],
  key = "",
): Finding {
  return finding({
    code,
    category,
    severity,
    confidence,
    detector,
    title,
    explanation,
    evidence,
    groupId: facts.group.id,
    assemblyId: facts.assembly.id,
    entityType: "assembly",
    entityId: facts.assembly.id,
    fingerprintKey: `${facts.assembly.id}:${key}`,
  });
}

export function detectAssemblyAnomalies(f: AssemblyFacts): Finding[] {
  const out: Finding[] = [];
  const label = `assembleia nº ${f.assembly.number} (grupo ${f.group.code})`;
  const ruleEv = f.rule ? { rule: `${f.rule.name} (${f.rule.ruleKey})`, version: f.rule.version } : {};
  const current = f.runs.filter((r) => r.status === "CURRENT");

  // 1. Reprodução divergente = anomalia crítica.
  for (const r of f.runs) {
    const rep = f.reproduction[r.id];
    if (rep && !rep.identical) {
      out.push(
        mk("CALCULATION_REPRODUCTION_MISMATCH", "ANOMALY", "CRITICAL", "HIGH", "reproducao-deterministica", f,
          `Reprodução divergente na ${label}`,
          `Reexecutar o cálculo ${r.phase === "DRAW" ? "do sorteio" : "dos lances"} com a mesma entrada, a mesma versão da regra e o mesmo snapshot NÃO reproduziu o resultado gravado. Hashes divergentes: ${rep.hashDiffs.join(", ")}.`,
          { ...ruleEv, calculation: `run ${r.id}`, data: { storedHashes: r.hashes, divergent: rep.hashDiffs } }, r.id),
      );
    }
  }

  // 2. Snapshot alterado depois de gravado.
  for (const s of f.snapshotHashes) {
    if (s.payloadHash !== s.recomputed) {
      out.push(
        mk("CALCULATION_SNAPSHOT_TAMPERED", "ANOMALY", "CRITICAL", "HIGH", "integridade-snapshot", f,
          `Snapshot de ${s.kind.toLowerCase()} não confere com o hash`,
          "O conteúdo do snapshot mudou depois de congelado — o hash gravado não corresponde ao conteúdo atual.",
          { calculation: `snapshot ${s.id}`, data: { stored: s.payloadHash, recomputed: s.recomputed } }, s.id),
      );
    }
  }

  // 3. Regra alterada depois de aprovada.
  if (f.rule?.ruleHash && computeRuleHash(f.rule) !== f.rule.ruleHash) {
    out.push(
      mk("RULE_CONTENT_CHANGED", "ANOMALY", "CRITICAL", "HIGH", "integridade-regra", f,
        `Regra usada na ${label} não confere com o hash de aprovação`,
        "O conteúdo da regra não corresponde ao hash registrado na aprovação — alteração posterior.",
        { ...ruleEv, data: { storedHash: f.rule.ruleHash } }),
    );
  }

  // 4. Regra usada ≠ versão vigente.
  if (f.rule && f.effectiveVersion && f.effectiveVersion.id !== f.rule.id) {
    out.push(
      mk("RULE_VERSION_NOT_CURRENT", "INCONSISTENCY", "HIGH", "HIGH", "versao-vigente", f,
        `Regra utilizada não corresponde à versão vigente`,
        `A ${label} usa a v${f.rule.version}, mas a versão publicada vigente em ${f.assembly.date} é a v${f.effectiveVersion.version}.`,
        { ...ruleEv, data: { effectiveVersion: f.effectiveVersion.version } }),
    );
  }

  // 5. Resultado oficial com hash divergente / não verificado usado.
  if (f.lottery) {
    const recomputed = lotteryContentHash({ source: f.lottery.source as "FEDERAL_LOTTERY", contestNumber: f.lottery.contestNumber, drawDate: f.lottery.drawDate, prizes: f.lottery.prizes });
    if (recomputed !== f.lottery.contentHash) {
      out.push(
        mk("SOURCE_CONTENT_TAMPERED", "ANOMALY", "CRITICAL", "HIGH", "integridade-fonte", f,
          `Resultado oficial do concurso ${f.lottery.contestNumber} não confere com o hash`,
          "Os prêmios gravados não correspondem ao hash registrado na importação.",
          { source: `Loteria Federal · concurso ${f.lottery.contestNumber}`, data: { prizes: f.lottery.prizes } }),
      );
    }
    if (f.lottery.verificationStatus !== "VERIFIED") {
      out.push(
        mk("SOURCE_NOT_VERIFIED", "ANOMALY", "HIGH", "HIGH", "fonte-verificada", f,
          `Assembleia usa resultado não verificado`,
          `O concurso ${f.lottery.contestNumber} vinculado à ${label} está como ${f.lottery.verificationStatus}.`,
          { source: `Loteria Federal · concurso ${f.lottery.contestNumber}` }),
      );
    }
  }

  // 6. Snapshot × resultado: contemplada precisa ter sido apta no snapshot.
  if (f.eligibility) {
    const byNumber = new Map(f.eligibility.snapshot.entries.map((e) => [e.quotaNumber, e]));
    for (const r of current.filter((x) => x.phase === "DRAW" || x.phase === "BIDS")) {
      for (const c of r.contemplations) {
        const inRange = c.quotaNumber >= f.group.numbering.numberStart && c.quotaNumber <= f.group.numbering.numberEnd;
        if (!inRange) {
          out.push(
            mk("CALCULATION_QUOTA_OUT_OF_UNIVERSE", "ANOMALY", "CRITICAL", "HIGH", "universo-numerico", f,
              `Cota ${c.quotaNumber} contemplada fora do universo do grupo`,
              `O grupo vai de ${f.group.numbering.numberStart} a ${f.group.numbering.numberEnd}.`,
              { ...ruleEv, calculation: `run ${r.id}`, data: { quotaNumber: c.quotaNumber } }, `${r.id}:${c.quotaNumber}`),
          );
          continue;
        }
        const entry = byNumber.get(c.quotaNumber);
        if (entry && !entry.eligible && !(c.method === "DRAW_CANCELLED" && entry.cancelled && !entry.alreadyContemplated)) {
          out.push(
            mk("CALCULATION_INELIGIBLE_CONTEMPLATED", "ANOMALY", "CRITICAL", "HIGH", "snapshot-vs-resultado", f,
              `Cota ${c.quotaNumber} contemplada estando inapta no snapshot`,
              `O snapshot congelado marca a cota como inapta (${entry.reason}), mas ela aparece contemplada.`,
              { ...ruleEv, calculation: `run ${r.id}`, data: { entry } }, `${r.id}:${c.quotaNumber}`),
          );
        }
      }
    }
    if (f.eligibility.snapshot.completeness === "PARTIAL") {
      out.push(
        mk("ELIGIBILITY_PARTIAL_BASE", "RISK", "MEDIUM", "HIGH", "base-parcial", f,
          `Apuração da ${label} sobre base parcial`,
          `O snapshot tem dado de ${f.eligibility.snapshot.entries.length} de ${f.group.quotaCount} cotas. O resultado é de conferência; o oficial é o da administradora.`,
          { data: { known: f.eligibility.snapshot.entries.length, total: f.group.quotaCount, policy: f.eligibility.snapshot.unknownPolicy } }),
      );
    }
    if (f.rule && f.eligibility.ruleId !== f.rule.id) {
      out.push(
        mk("RULE_ELIGIBILITY_MISMATCH", "INCONSISTENCY", "HIGH", "HIGH", "regra-snapshot", f,
          "Snapshot de elegibilidade feito com outra regra",
          "A regra da assembleia não é a mesma usada para gerar o snapshot de elegibilidade.",
          { ...ruleEv, data: { snapshotRuleId: f.eligibility.ruleId } }),
      );
    }
  }

  // 7. Duplicidade de contemplação e consistência financeira.
  const all = current.flatMap((r) => r.contemplations.map((c) => ({ ...c, runId: r.id })));
  const seen = new Map<number, number>();
  for (const c of all) seen.set(c.quotaNumber, (seen.get(c.quotaNumber) ?? 0) + 1);
  for (const [q, n] of seen) {
    if (n > 1) {
      out.push(
        mk("CALCULATION_DUPLICATE_CONTEMPLATION", "ANOMALY", "CRITICAL", "HIGH", "duplicidade-contemplacao", f,
          `Cota ${q} contemplada ${n} vezes na mesma assembleia`,
          "A mesma cota aparece em mais de uma contemplação vigente.",
          { data: { quotaNumber: q, occurrences: n } }, String(q)),
      );
    }
  }
  const draw = current.find((r) => r.phase === "DRAW");
  if (draw && draw.available !== null) {
    const used = draw.contemplations.reduce((s, c) => s + c.creditAmount, 0);
    if (used > draw.available + 0.01) {
      out.push(
        mk("FINANCIAL_RESOURCES_EXCEEDED", "ANOMALY", "CRITICAL", "HIGH", "recursos-vs-contemplacoes", f,
          `Contemplações acima dos recursos na ${label}`,
          `Créditos contemplados somam ${formatBRL(used)}, mas havia ${formatBRL(draw.available)} disponíveis.`,
          { calculation: `run ${draw.id}`, data: { used, available: draw.available } }),
      );
    }
    if (!draw.official) {
      out.push(
        mk("PATTERN_CONFERENCE_ONLY", "PATTERN", "LOW", "HIGH", "resultado-conferencia", f,
          `Resultado da ${label} é de conferência`,
          "O cálculo presumiu elegibilidade de cotas sem dado. Compare com a ata da administradora.",
          { calculation: `run ${draw.id}` }),
      );
    }
  }

  // 8. Operacionais: resultado oficial não encontrado, retificação pendente.
  const gap = daysBetween(f.today, f.assembly.date);
  const early = ["SCHEDULED", "PREPARING", "ELIGIBILITY_LOCKED"].includes(f.assembly.status);
  if (early && !f.lottery && gap <= 3) {
    out.push(
      mk("ALERT_LOTTERY_MISSING", "ALERT", gap < 0 ? "HIGH" : "MEDIUM", "HIGH", "resultado-pendente", f,
        "Resultado oficial ainda não encontrado",
        gap < 0
          ? `A ${label} era em ${f.assembly.date} e ainda não tem resultado oficial travado.`
          : `A ${label} é em ${gap} dia(s) e ainda não tem resultado oficial travado.`,
        { data: { assemblyDate: f.assembly.date } }),
    );
  }
  if (early && !f.rule && gap <= 7) {
    out.push(
      mk("ALERT_RULE_MISSING", "ALERT", "MEDIUM", "HIGH", "regra-pendente", f,
        "Assembleia sem regra definida",
        `A ${label} ainda não tem regra publicada vinculada.`,
        {}),
    );
  }
  if (f.pendingRetifications > 0) {
    out.push(
      mk("RETIFICATION_PENDING", "ALERT", "HIGH", "HIGH", "retificacao-pendente", f,
        "Retificação aguardando decisão",
        `Há ${f.pendingRetifications} retificação(ões) solicitada(s) ou aprovada(s) sem aplicação na ${label}.`,
        {}),
    );
  }
  return out;
}

// ── Nível da organização ─────────────────────────────────────────

export type OrgFacts = {
  rules: { id: string; ruleKey: string; version: number; name: string; administratorName: string; status: string; effectiveFrom: string; effectiveUntil: string | null }[];
  upcomingAssemblies: { id: string; number: number; date: string; groupId: string; groupCode: string; administratorName: string; hasRule: boolean }[];
  quotaIssues: { groupId: string; groupCode: string; quotaNumber: number; issue: string }[];
  legacyWonBids: { bidId: string; contractId: string; bidDate: string | null }[];
  sourceChecks: { resultId: string; contestNumber: string; stored: string[]; official: string[] | null; error: string | null }[];
  events: { id: string; prevHash: string | null; eventHash: string; eventType: string; entityType: string; entityId: string | null; payload: unknown; createdAt: string }[];
  chainVerified: { ok: boolean; brokenAt: string | null; checked: number } | null;
  today: string;
};

function org(
  code: string,
  category: FindingCategory,
  severity: FindingSeverity,
  confidence: FindingConfidence,
  detector: string,
  key: string,
  title: string,
  explanation: string,
  evidence: Finding["evidence"],
  extra: Partial<Finding> = {},
): Finding {
  return finding({ code, category, severity, confidence, detector, title, explanation, evidence, fingerprintKey: key, ...extra });
}

export function detectOrganizationFindings(f: OrgFacts): Finding[] {
  const out: Finding[] = [];

  // Regras publicadas sobrepostas na mesma chave.
  const byKey = new Map<string, OrgFacts["rules"]>();
  for (const r of f.rules.filter((x) => x.status === "PUBLISHED")) byKey.set(r.ruleKey, [...(byKey.get(r.ruleKey) ?? []), r]);
  for (const [key, list] of byKey) {
    if (list.length > 1) {
      out.push(org("RULE_MULTIPLE_PUBLISHED", "INCONSISTENCY", "HIGH", "HIGH", "unicidade-publicacao", key,
        `Mais de uma versão publicada de ${key}`,
        `Versões publicadas ao mesmo tempo: ${list.map((r) => `v${r.version}`).join(", ")}.`,
        { rule: key, data: { versions: list.map((r) => r.version) } }));
    }
  }

  // Próxima assembleia sem regra publicada da administradora.
  for (const a of f.upcomingAssemblies) {
    const hasPublished = f.rules.some(
      (r) => r.status === "PUBLISHED" && r.administratorName.trim().toLowerCase() === a.administratorName.trim().toLowerCase() &&
        r.effectiveFrom <= a.date && (!r.effectiveUntil || r.effectiveUntil >= a.date),
    );
    if (!hasPublished && !a.hasRule) {
      out.push(org("ALERT_UPCOMING_RULE_UNPUBLISHED", "ALERT", "MEDIUM", "HIGH", "regra-proxima-assembleia", a.id,
        "Regra da próxima assembleia está sem publicação",
        `Assembleia nº ${a.number} do grupo ${a.groupCode} (${a.date}) não tem regra publicada e vigente de ${a.administratorName}.`,
        { data: { assemblyDate: a.date } }, { assemblyId: a.id, groupId: a.groupId, entityType: "assembly", entityId: a.id }));
    }
  }

  // Inconsistência cadastral de cotas (agregada por grupo).
  const byGroup = new Map<string, OrgFacts["quotaIssues"]>();
  for (const q of f.quotaIssues) byGroup.set(q.groupId, [...(byGroup.get(q.groupId) ?? []), q]);
  for (const [groupId, list] of byGroup) {
    out.push(org("INCONSISTENCY_QUOTA_REGISTRY", "INCONSISTENCY", list.length > 10 ? "HIGH" : "MEDIUM", "HIGH", "cadastro-cotas", groupId,
      `${list.length} cota(s) com inconsistência cadastral no grupo ${list[0].groupCode}`,
      list.slice(0, 8).map((q) => `cota ${q.quotaNumber}: ${q.issue}`).join("; ") + (list.length > 8 ? "…" : "."),
      { data: { issues: list.slice(0, 50) } }, { groupId, entityType: "group", entityId: groupId }));
  }

  // Lance "vencedor" no módulo Lances sem contemplação no motor.
  for (const b of f.legacyWonBids) {
    out.push(org("INCONSISTENCY_BID_WON_WITHOUT_CONTEMPLATION", "INCONSISTENCY", "MEDIUM", "MEDIUM", "lance-sem-apuracao", b.bidId,
      "Lance marcado como contemplado sem apuração no motor",
      `O lance ${b.bidId.slice(0, 8)} (${b.bidDate ?? "sem data"}) foi marcado como vencedor manualmente, sem contemplação homologada correspondente no motor.`,
      { data: b }, { entityType: "bid", entityId: b.bidId }));
  }

  // Fonte oficial diverge do resultado importado.
  for (const s of f.sourceChecks) {
    if (s.official && s.official.join(",") !== s.stored.join(",")) {
      out.push(org("SOURCE_DIVERGENCE", "ANOMALY", "CRITICAL", "HIGH", "conferencia-fonte-oficial", s.resultId,
        `Fonte oficial diverge do resultado importado (concurso ${s.contestNumber})`,
        `Gravado: ${s.stored.join(", ")}. Fonte oficial agora: ${s.official.join(", ")}.`,
        { source: `Loteria Federal · concurso ${s.contestNumber}`, data: s }, { entityType: "lottery_result", entityId: s.resultId }));
    }
  }

  // Cadeia de auditoria.
  if (f.chainVerified && !f.chainVerified.ok) {
    out.push(org("AUDIT_CHAIN_BROKEN", "ANOMALY", "CRITICAL", "HIGH", "cadeia-auditoria", "chain",
      "Cadeia de eventos de auditoria quebrada",
      `O evento ${f.chainVerified.brokenAt} não referencia o hash do evento anterior — possível remoção ou alteração de histórico.`,
      { data: f.chainVerified }));
  }

  // Padrão: reproduções divergentes recorrentes / conflitos de fonte na auditoria.
  const conflicts = f.events.filter((e) => e.eventType === "SOURCE_CONFLICT_DETECTED");
  if (conflicts.length) {
    out.push(org("SOURCE_CONFLICT_ATTEMPTS", "ALERT", "HIGH", "HIGH", "tentativas-fonte-divergente", "conflicts",
      `${conflicts.length} tentativa(s) de importar resultado divergente`,
      "Houve tentativa de importar um concurso já registrado com prêmios diferentes. Confirme qual é o publicado pela fonte oficial.",
      { data: { events: conflicts.map((e) => ({ id: e.id, at: e.createdAt, payload: e.payload })) } }));
  }
  return out;
}

/**
 * Verifica a cadeia de hashes dos eventos (ordem cronológica). O banco
 * calcula event_hash; aqui só se confere o encadeamento prev → atual.
 */
export function verifyEventChain(events: { id: string; prevHash: string | null; eventHash: string }[]) {
  for (let i = 1; i < events.length; i += 1) {
    if (events[i].prevHash !== events[i - 1].eventHash) return { ok: false, brokenAt: events[i].id, checked: i + 1 };
  }
  return { ok: true, brokenAt: null, checked: events.length };
}

export function recomputeSnapshotHash(payload: unknown): string {
  return hashOf(payload);
}
