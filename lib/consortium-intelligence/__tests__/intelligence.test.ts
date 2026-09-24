import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { runDraw } from "../../consortium-engine/draw.ts";
import { hashOf } from "../../consortium-engine/hash.ts";
import { validateRuleConfig } from "../../consortium-engine/rules.ts";
import { drawInput } from "../../consortium-engine/__tests__/fixtures.ts";
import { detectAssemblyAnomalies, detectOrganizationFindings, verifyEventChain, type AssemblyFacts } from "../detectors.ts";
import { extractRuleFromText } from "../document-extraction.ts";
import { analyzeNumbers, NUMBER_ANALYSIS_DISCLAIMER } from "../number-analysis.ts";
import { simulate } from "../simulation.ts";

function factsFrom(overrides: Partial<AssemblyFacts> = {}): AssemblyFacts {
  const input = drawInput({ planned: 1 });
  const out = runDraw(input);
  return {
    assembly: { id: "asm-1", number: 12, date: "2026-09-23", status: "COMPLETED" },
    group: { id: "grp-1", code: "G-100", administratorName: "Administradora Teste", numbering: input.group.numbering, quotaCount: 1000 },
    rule: { ...input.rule, ruleHash: input.frozenRuleHash },
    effectiveVersion: { id: input.rule.id, version: input.rule.version },
    lottery: { id: "lot-1", ...input.lottery, contentHash: hashOf({ source: input.lottery.source, contestNumber: input.lottery.contestNumber, drawDate: input.lottery.drawDate, prizes: input.lottery.prizes }), verificationStatus: "VERIFIED" },
    eligibility: { snapshot: input.eligibility, payloadHash: "x", storedHash: "x", ruleId: input.rule.id },
    runs: [
      {
        id: "run-1",
        phase: "DRAW",
        status: "CURRENT",
        ruleId: input.rule.id,
        hashes: out.hashes,
        official: out.official,
        remainingResources: out.remainingResources,
        available: out.resources?.available ?? null,
        contemplations: out.contemplations.map((c) => ({ quotaNumber: c.quotaNumber, method: c.method, creditAmount: c.creditAmount, via: c.via })),
      },
    ],
    reproduction: { "run-1": { identical: true, hashDiffs: [] } },
    snapshotHashes: [],
    pendingRetifications: 0,
    today: "2026-09-24",
    ...overrides,
  };
}

const codes = (fs: { code: string }[]) => fs.map((f) => f.code);

describe("Anomaly Engine", () => {
  it("assembleia íntegra não gera anomalia", () => {
    assert.deepEqual(codes(detectAssemblyAnomalies(factsFrom())), []);
  });

  it("reprodução divergente = anomalia CRÍTICA com revisão humana", () => {
    const f = detectAssemblyAnomalies(factsFrom({ reproduction: { "run-1": { identical: false, hashDiffs: ["resultHash"] } } }));
    const a = f.find((x) => x.code === "CALCULATION_REPRODUCTION_MISMATCH")!;
    assert.equal(a.severity, "CRITICAL");
    assert.equal(a.requiresHumanReview, true);
    assert.ok(a.evidence.rule && a.evidence.version);
  });

  it("contemplada inapta no snapshot e fora do universo", () => {
    const base = factsFrom();
    const run = { ...base.runs[0], contemplations: [{ quotaNumber: 940, method: "DRAW", creditAmount: 100000, via: "DIRECT" }, { quotaNumber: 1500, method: "DRAW", creditAmount: 100000, via: "DIRECT" }] };
    const snapshot = { ...base.eligibility!.snapshot, entries: base.eligibility!.snapshot.entries.map((e) => (e.quotaNumber === 940 ? { ...e, eligible: false, reason: "DELINQUENT" as const } : e)) };
    const f = codes(detectAssemblyAnomalies({ ...base, runs: [run], eligibility: { ...base.eligibility!, snapshot } }));
    assert.ok(f.includes("CALCULATION_INELIGIBLE_CONTEMPLATED"));
    assert.ok(f.includes("CALCULATION_QUOTA_OUT_OF_UNIVERSE"));
  });

  it("regra alterada, versão não vigente, fonte adulterada e recursos excedidos", () => {
    const base = factsFrom();
    const f = codes(
      detectAssemblyAnomalies({
        ...base,
        rule: { ...base.rule!, config: { ...base.rule!.config, prizeDigits: 6 } },
        effectiveVersion: { id: "outra", version: 4 },
        lottery: { ...base.lottery!, prizes: ["11111", "22222", "33333", "44444", "55555"] },
        runs: [{ ...base.runs[0], available: 50_000 }],
      }),
    );
    for (const c of ["RULE_CONTENT_CHANGED", "RULE_VERSION_NOT_CURRENT", "SOURCE_CONTENT_TAMPERED", "FINANCIAL_RESOURCES_EXCEEDED"]) assert.ok(f.includes(c), c);
  });

  it("alertas operacionais: resultado oficial ausente perto da assembleia", () => {
    const f = detectAssemblyAnomalies(factsFrom({ assembly: { id: "a", number: 13, date: "2026-09-25", status: "ELIGIBILITY_LOCKED" }, lottery: null, runs: [], reproduction: {} }));
    const a = f.find((x) => x.code === "ALERT_LOTTERY_MISSING")!;
    assert.match(a.title, /Resultado oficial ainda não encontrado/);
  });

  it("nível organização: fonte divergente, cadastro inconsistente, cadeia quebrada", () => {
    const f = detectOrganizationFindings({
      rules: [],
      upcomingAssemblies: [{ id: "a", number: 1, date: "2026-10-01", groupId: "g", groupCode: "G1", administratorName: "Adm", hasRule: false }],
      quotaIssues: Array.from({ length: 12 }, (_, i) => ({ groupId: "g", groupCode: "G1", quotaNumber: i + 1, issue: "contrato contemplado, cota não" })),
      legacyWonBids: [],
      sourceChecks: [{ resultId: "r", contestNumber: "6102", stored: ["83520"], official: ["83521"], error: null }],
      events: [],
      chainVerified: verifyEventChain([
        { id: "1", prevHash: null, eventHash: "a" },
        { id: "2", prevHash: "x", eventHash: "b" },
      ]),
      today: "2026-09-24",
    });
    const map = new Map(f.map((x) => [x.code, x]));
    assert.match(map.get("INCONSISTENCY_QUOTA_REGISTRY")!.title, /^12 cota\(s\) com inconsistência cadastral/);
    assert.equal(map.get("SOURCE_DIVERGENCE")!.severity, "CRITICAL");
    assert.equal(map.get("AUDIT_CHAIN_BROKEN")!.requiresHumanReview, true);
    assert.match(map.get("ALERT_UPCOMING_RULE_UNPUBLISHED")!.title, /Regra da próxima assembleia está sem publicação/);
  });

  it("impressão digital é estável (deduplicação)", () => {
    const a = detectAssemblyAnomalies(factsFrom({ reproduction: { "run-1": { identical: false, hashDiffs: ["resultHash"] } } }));
    const b = detectAssemblyAnomalies(factsFrom({ reproduction: { "run-1": { identical: false, hashDiffs: ["resultHash"] } } }));
    assert.deepEqual(a.map((x) => x.fingerprint), b.map((x) => x.fingerprint));
  });
});

describe("Simulation / What-if Engine", () => {
  const base = drawInput({ planned: 1 });
  const official = runDraw(base);

  it("não altera o input oficial e marca simulação", () => {
    const before = JSON.stringify(base);
    const s = simulate(base, { forceDelinquent: [940] }, official);
    assert.equal(JSON.stringify(base), before);
    assert.match(s.notes[0], /SIMULAÇÃO/);
    assert.deepEqual(s.result.contemplations.map((c) => c.quotaNumber), [294]);
    assert.deepEqual(s.comparison!.removed, [940]);
  });

  it("mais recursos → mais contemplações; menos → insuficiente", () => {
    const more = simulate(drawInput({ planned: 5 }), { commonFundBalance: 1_000_000 }, null);
    assert.equal(more.result.contemplations.length, 5);
    const less = simulate(base, { resourcesDeltaPercent: -90 }, official);
    assert.equal(less.result.resources!.status, "INSUFFICIENT");
  });

  it("regra diferente (hipotética) e grupo com outro tamanho", () => {
    const r = simulate(base, { ruleConfigPatch: { candidatePlan: [{ prize: 1, positions: [1, 2, 3] }] } }, official);
    assert.equal(r.result.status, "COMPLETED");
    assert.deepEqual(r.result.contemplations.map((c) => c.quotaNumber), [329]);
    const g = simulate(base, { quotaCount: 500 }, official);
    assert.notEqual(g.result.contemplations[0].quotaNumber, 940);
  });

  it("mais inadimplência é determinística (sem sorteio)", () => {
    const a = simulate(base, { extraDelinquencyPercent: 50 }, official);
    const b = simulate(base, { extraDelinquencyPercent: 50 }, official);
    assert.equal(a.resultHash, b.resultHash);
  });
});

describe("Number analysis", () => {
  it("mede comportamento do algoritmo e sempre traz o aviso", () => {
    const rows = [
      { assemblyId: "a", numberText: "940", numberType: "CANDIDATE", quotaNumber: 940, outcome: "INELIGIBLE", reason: "DELINQUENT", candidateOrder: 1 },
      { assemblyId: "a", numberText: "941", numberType: "APPROXIMATION", quotaNumber: 941, outcome: "SELECTED", reason: null, candidateOrder: 1 },
      { assemblyId: "b", numberText: "123", numberType: "CANDIDATE", quotaNumber: 123, outcome: "SELECTED", reason: null, candidateOrder: 1 },
    ];
    const r = analyzeNumbers(rows, { numberStart: 1, numberEnd: 1000, displayDigits: 3 });
    assert.equal(r.selected, 2);
    assert.equal(r.substitutionRate, 50);
    assert.equal(r.avgSubstitutionDistance, 0.5);
    assert.equal(r.coverage, 0.3);
    assert.match(NUMBER_ANALYSIS_DISCLAIMER, /NÃO alteram a aleatoriedade/);
  });
});

describe("Document Intelligence (extração → rascunho)", () => {
  const unifisa = `Serão formados 10 (dez) centenas a partir desse resultado, sendo:
    a) 1ª (primeira) a junção dos 3 º, 4 º e 5 º algarismos do 1° prêmio = 060;
    b) 2ª (segunda) a junção dos 2 º, 3 º e 4 º algarismos do 1° prêmio = 206;
    c) 3ª (terceira) a junção dos 3 º, 4 º e 5 º algarismos do 2º prêmio = 423;
    d) e demais combinações, sucessivamente até o 5° prêmio.
    São eliminadas as combinações: Dos consorciados já contemplados; Dos consorciados que não estiverem em dia com suas obrigações;
    as centenas entre 541 e 999 e a 000 (zero, zero, zero) serão eliminadas.
    Se todas as 10 (dez) centenas forem eliminadas, tomar-se-á por base a 1ª centena formada, partindo-se daí em ordem crescente e decrescente, alternada e sucessivamente.
    Esse sistema de apuração é também considerado para realizarmos o desempate dos lances livres.
    Livre: O consorciado vencedor é aquele que ofertar o maior percentual.
    Fixo: O percentual ofertado é fixo em 30%, e quando o consorciado ofertar lance superior ao fixo, este será automaticamente ofertado como lance livre.
    Utilizando uma parte do crédito (limitado a 30%), lance embutido.`;

  it("regulamento com 10 centenas vira rascunho válido", () => {
    const x = extractRuleFromText(unifisa);
    assert.equal(x.config.candidatePlan.length, 10);
    assert.deepEqual(x.config.candidatePlan.slice(0, 3), [
      { prize: 1, positions: [3, 4, 5] },
      { prize: 1, positions: [2, 3, 4] },
      { prize: 2, positions: [3, 4, 5] },
    ]);
    assert.equal(x.config.fallback.method, "ALTERNATING_UP_FIRST");
    assert.equal(x.config.equivalence.method, "NONE");
    assert.equal(x.config.bids.fixedPercentage, 30);
    assert.equal(x.config.bids.embeddedMaxPercentage, 30);
    assert.equal(x.config.bids.overFixedCompetesAsFree, true);
    assert.equal(x.config.bids.tieBreak, "DRAW_ORDER");
    assert.deepEqual(validateRuleConfig(x.config), []);
    assert.ok(x.fields.every((f) => ["HIGH", "MEDIUM", "LOW"].includes(f.confidence)));
  });

  it("regulamento com 15 centenas (3 por prêmio) e cota imediatamente superior", () => {
    const mycon = `Para grupos até 1000 participantes, utilizamos 5 prêmios, 15 centenas, 3 por prêmio:
      o 3º, 4º e 5º número que formará a primeira centena, seguido pelo 2º, 3º e 4º número que formará a segunda centena,
      seguido pelo 1º, 2° e 3º número que formará a terceira centena. Este processo repete-se para os demais prêmios.
      Se nenhuma das 15 centenas for contemplável, será declarada contemplada a cota imediatamente superior a ela.`;
    const x = extractRuleFromText(mycon);
    assert.equal(x.config.candidatePlan.length, 15);
    assert.equal(x.expectedCandidates, 15);
    assert.equal(x.config.fallback.method, "NEXT_HIGHER");
    assert.equal(x.warnings.some((w) => w.includes("fala em")), false);
  });
});
