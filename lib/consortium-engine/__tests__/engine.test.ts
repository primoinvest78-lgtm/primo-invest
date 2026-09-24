import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { runBids, type BidsInput } from "../bids.ts";
import { runDraw } from "../draw.ts";
import { buildEligibilitySnapshot } from "../eligibility.ts";
import { applyEquivalence } from "../equivalence.ts";
import { canonicalJson, hashOf } from "../hash.ts";
import { buildNumbering, formatQuotaNumber, parseQuotaNumber } from "../numbering.ts";
import { compareRuns, validateRetificationRequest } from "../retification.ts";
import { expandCandidatePlan, validateRuleConfig } from "../rules.ts";
import { fallbackSequence } from "../sequences.ts";
import { detectDuplicateContest, validateLotteryResult } from "../source.ts";
import { canTransitionAssembly } from "../state-machine.ts";
import type { BidInput, QuotaRecord } from "../types.ts";
import { config, drawInput, fullRecords } from "./fixtures.ts";

const quotas = (out: { contemplations: { quotaNumber: number }[] }) => out.contemplations.map((c) => c.quotaNumber);
const codes = (out: { trace: { code: string }[] }) => out.trace.map((s) => s.code);

/** Todas inaptas (inadimplentes), exceto as indicadas. */
function onlyEligible(count: number, eligible: number[]): QuotaRecord[] {
  const set = new Set(eligible);
  const out: QuotaRecord[] = [];
  for (let n = 1; n <= count; n += 1) {
    out.push({ quotaNumber: n, status: "ACTIVE", paymentStatus: set.has(n) ? "UP_TO_DATE" : "DELINQUENT", contemplated: false });
  }
  return out;
}

describe("Number Engine", () => {
  it("representa 001…999 e 1000 sem perder zeros nem truncar", () => {
    const n = buildNumbering({ quotaCount: 1000 });
    assert.deepEqual(n, { numberStart: 1, numberEnd: 1000, displayDigits: 3 });
    assert.equal(formatQuotaNumber(1, n.displayDigits), "001");
    assert.equal(formatQuotaNumber(999, n.displayDigits), "999");
    assert.equal(formatQuotaNumber(1000, n.displayDigits), "1000");
    assert.equal(parseQuotaNumber("001"), 1);
    assert.throws(() => parseQuotaNumber("1a"));
  });

  it("9. grupo de 100 cotas: 01…99, 100", () => {
    const n = buildNumbering({ quotaCount: 100 });
    assert.equal(n.displayDigits, 2);
    assert.equal(formatQuotaNumber(1, n.displayDigits), "01");
    assert.equal(formatQuotaNumber(100, n.displayDigits), "100");
  });

  it("11. grupo acima de 1000 cotas usa 4 dígitos", () => {
    const n = buildNumbering({ quotaCount: 5000 });
    assert.equal(n.displayDigits, 4);
    assert.equal(formatQuotaNumber(7, n.displayDigits), "0007");
  });
});

describe("Candidate + Draw Engine", () => {
  it("gera os candidatos do exemplo conceitual (posições configuráveis)", () => {
    const out = runDraw(drawInput({}));
    const cands = out.trace.find((s) => s.code === "CANDIDATES")!.data!.candidates as { raw: string }[];
    assert.deepEqual(cands.slice(0, 3).map((c) => c.raw), ["940", "294", "329"]);
  });

  it("1. número diretamente válido → contemplado", () => {
    const out = runDraw(drawInput({}));
    assert.equal(out.status, "COMPLETED");
    assert.deepEqual(quotas(out), [940]);
    assert.equal(out.contemplations[0].via, "DIRECT");
    assert.equal(out.contemplations[0].quotaLabel, "940");
  });

  it("2. número inexistente no grupo é eliminado e passa ao próximo candidato", () => {
    const out = runDraw(drawInput({ quotaCount: 500 }));
    assert.deepEqual(quotas(out), [294]);
    assert.ok(codes(out).includes("EQUIVALENCE_ELIMINATED"));
  });

  it("3. cota inadimplente → próximo candidato", () => {
    const out = runDraw(drawInput({ overrides: { 940: { paymentStatus: "DELINQUENT" } } }));
    assert.deepEqual(quotas(out), [294]);
    const inel = out.trace.find((s) => s.code === "QUOTA_INELIGIBLE")!;
    assert.match(inel.message, /940 INAPTA — inadimplente/);
  });

  it("15 da spec: 32940 → 940 inapta (inadimplente) → aproximação 941 CONTEMPLADA", () => {
    const cfg = config({ approximation: { method: "NEXT_HIGHER", maxSteps: 1, wrapAround: false } });
    const out = runDraw(drawInput({ cfg, overrides: { 940: { paymentStatus: "DELINQUENT" } } }));
    assert.deepEqual(quotas(out), [941]);
    assert.equal(out.contemplations[0].via, "APPROXIMATION");
    const text = out.trace.map((s) => s.message).join("\n");
    assert.match(text, /Regra "XYZ", versão 3/);
    assert.match(text, /posições 3,4,5 → 940/);
    assert.match(text, /cota 940 INAPTA — inadimplente/);
    assert.match(text, /cota 941 APTA/);
    assert.match(text, /Cota 941 CONTEMPLADA/);
  });

  it("4. cota já contemplada → próximo candidato", () => {
    const out = runDraw(drawInput({ overrides: { 940: { contemplated: true } } }));
    assert.deepEqual(quotas(out), [294]);
  });

  it("5. fallback superior depois de esgotar candidatos", () => {
    const cfg = config({ fallback: { method: "NEXT_HIGHER", wrapAround: false } });
    const out = runDraw(drawInput({ cfg, records: onlyEligible(1000, [950]) }));
    assert.deepEqual(quotas(out), [950]);
    assert.equal(out.contemplations[0].via, "FALLBACK");
    assert.ok(codes(out).includes("FALLBACK_START"));
  });

  it("6. fallback inferior", () => {
    const cfg = config({ fallback: { method: "NEXT_LOWER", wrapAround: false } });
    const out = runDraw(drawInput({ cfg, records: onlyEligible(1000, [930, 960]) }));
    assert.deepEqual(quotas(out), [930]);
  });

  it("7. wrap around: volta ao início só quando a regra autoriza", () => {
    const withWrap = config({ fallback: { method: "NEXT_HIGHER", wrapAround: true } });
    assert.deepEqual(quotas(runDraw(drawInput({ cfg: withWrap, records: onlyEligible(1000, [5]) }))), [5]);
    const noWrap = config({ fallback: { method: "NEXT_HIGHER", wrapAround: false } });
    const out = runDraw(drawInput({ cfg: noWrap, records: onlyEligible(1000, [5]) }));
    assert.deepEqual(quotas(out), []);
    assert.ok(codes(out).includes("POOL_EXHAUSTED"));
  });

  it("fallback alternado segue 60, 61, 59, 62, 58…", () => {
    const n = buildNumbering({ quotaCount: 540 });
    const seq = fallbackSequence(60, { method: "ALTERNATING_UP_FIRST", wrapAround: false }, n);
    assert.deepEqual(seq.slice(0, 7), [60, 61, 59, 62, 58, 63, 57]);
  });

  it("8. número 000: eliminado sem equivalência, cota 1000 com ZERO_AS_MAX", () => {
    const prizes = ["12000", "89423", "12345", "54321", "22334"];
    const plain = runDraw(drawInput({ prizes }));
    assert.notEqual(quotas(plain)[0], 1000);
    const cfg = config({ equivalence: { method: "ZERO_AS_MAX" } });
    const out = runDraw(drawInput({ cfg, prizes }));
    assert.deepEqual(quotas(out), [1000]);
    assert.equal(out.contemplations[0].via, "EQUIVALENCE");
    assert.equal(out.contemplations[0].quotaLabel, "1000");
  });

  it("9/10/11. grupos de 100, 1000 e 5000 com planos diferentes", () => {
    const c100 = config({ candidatePlan: [{ prize: 1, positions: [4, 5] }] });
    assert.deepEqual(quotas(runDraw(drawInput({ cfg: c100, quotaCount: 100 }))), [40]);
    assert.deepEqual(quotas(runDraw(drawInput({}))), [940]);
    const c5000 = config({ candidatePlan: [{ prize: 1, positions: [2, 3, 4, 5] }] });
    const out = runDraw(drawInput({ cfg: c5000, quotaCount: 5000 }));
    assert.deepEqual(quotas(out), [2940]);
    assert.equal(out.contemplations[0].quotaLabel, "2940");
  });

  it("12. equivalência: número equivalente aponta pra cota primária, nunca vira cota", () => {
    const n500 = buildNumbering({ quotaCount: 500 });
    const sub = applyEquivalence("940", n500, { method: "SUBTRACT_GROUP_SIZE" });
    assert.equal(sub.kind, "EQUIVALENT_NUMBER");
    assert.equal(sub.quotaNumber, 440);
    const mod = applyEquivalence("000", n500, { method: "MODULO" });
    assert.equal(mod.quotaNumber, 500);
    const map = applyEquivalence("000", n500, { method: "EXPLICIT_MAP", map: { "000": 250 } });
    assert.equal(map.quotaNumber, 250);
    const n1000 = buildNumbering({ quotaCount: 1000 });
    const e2940 = applyEquivalence("2940", n1000, { method: "MODULO" });
    assert.equal(e2940.kind, "EQUIVALENT_NUMBER");
    assert.equal(e2940.quotaNumber, 940);
    const direct = applyEquivalence("0940", n1000, { method: "MODULO" });
    assert.equal(direct.kind, "PRIMARY_QUOTA");
    const out = runDraw(drawInput({ cfg: config({ equivalence: { method: "SUBTRACT_GROUP_SIZE" } }), quotaCount: 500 }));
    assert.deepEqual(quotas(out), [440]);
  });

  it("14. múltiplas contemplações seguem a ordem dos candidatos", () => {
    const out = runDraw(drawInput({ planned: 3 }));
    assert.deepEqual(quotas(out), [940, 294, 329]);
    assert.deepEqual(out.contemplations.map((c) => c.sequence), [1, 2, 3]);
  });

  it("15. recursos insuficientes / parciais / fundo de reserva", () => {
    const none = runDraw(drawInput({ commonFund: 50_000 }));
    assert.equal(none.resources!.status, "INSUFFICIENT");
    assert.deepEqual(quotas(none), []);

    const partial = runDraw(drawInput({ planned: 3, commonFund: 200_000 }));
    assert.equal(partial.resources!.status, "PARTIAL");
    assert.equal(partial.contemplations.length, 2);

    const blocked = runDraw(drawInput({ commonFund: null }));
    assert.equal(blocked.status, "BLOCKED");

    const reserveDenied = runDraw(drawInput({ commonFund: 50_000, reserveFund: 60_000, reserveUsable: true }));
    assert.equal(reserveDenied.resources!.status, "INSUFFICIENT");
    const cfg = config({ resources: { reserveFundAllowed: true, bidFundsCountTowardResources: false } });
    const reserveOk = runDraw(drawInput({ cfg, commonFund: 50_000, reserveFund: 60_000, reserveUsable: true }));
    assert.equal(reserveOk.resources!.status, "AVAILABLE");
    assert.deepEqual(quotas(reserveOk), [940]);
  });

  it("snapshot parcial: bloqueia com política BLOCK, marca conferência com presunção", () => {
    const blockCfg = config({ eligibility: { requireUpToDate: true, excludeContemplated: true, unknownPolicy: "BLOCK" } });
    const records: QuotaRecord[] = [{ quotaNumber: 940, status: "ACTIVE", paymentStatus: "UP_TO_DATE", contemplated: false }];
    assert.equal(runDraw(drawInput({ cfg: blockCfg, records })).status, "BLOCKED");
    const presumed = runDraw(drawInput({ records }));
    assert.equal(presumed.status, "COMPLETED");
    assert.equal(presumed.official, false);
    assert.equal(runDraw(drawInput({})).official, true);
  });
});

describe("Source Engine", () => {
  it("16. fonte inválida, formato inválido e prêmio duplicado", () => {
    const expected = { prizeDigits: 5, prizeCount: 5 };
    const bad = validateLotteryResult(
      { source: "OUTRA" as never, contestNumber: "1", drawDate: "2026-09-20", prizes: [] },
      expected,
      "2026-09-23",
    );
    assert.equal(bad.status, "INVALID_SOURCE");
    const fmt = validateLotteryResult(
      { source: "FEDERAL_LOTTERY", contestNumber: "1", drawDate: "2026-09-20", prizes: ["1234", "12345", "22222", "33333", "44444"] },
      expected,
      "2026-09-23",
    );
    assert.equal(fmt.status, "VALIDATION_FAILED");
    const dup = validateLotteryResult(
      { source: "FEDERAL_LOTTERY", contestNumber: "1", drawDate: "2026-09-20", prizes: ["12345", "12345", "22222", "33333", "44444"] },
      expected,
      "2026-09-23",
    );
    assert.match(dup.errors.join(), /duplicidade/);
    const out = runDraw(drawInput({ prizes: ["32940", "32940", "12345", "54321", "22334"] }));
    assert.equal(out.status, "VALIDATION_FAILED");
    assert.deepEqual(quotas(out), []);
  });

  it("extração fora da janela da regra e no futuro são rejeitadas", () => {
    assert.equal(runDraw(drawInput({ drawDate: "2026-08-01" })).status, "VALIDATION_FAILED");
    assert.equal(runDraw(drawInput({ drawDate: "2026-09-25" })).status, "VALIDATION_FAILED");
  });

  it("17. concurso duplicado: reimportação idêntica × conflito", () => {
    const a = { source: "FEDERAL_LOTTERY" as const, contestNumber: "6102", drawDate: "2026-09-20", prizes: ["32940", "89423", "12345", "54321", "22334"] };
    assert.equal(detectDuplicateContest([a], { ...a })!.kind, "IDENTICAL");
    assert.equal(detectDuplicateContest([a], { ...a, prizes: ["32941", "89423", "12345", "54321", "22334"] })!.kind, "CONFLICT");
    assert.equal(detectDuplicateContest([a], { ...a, contestNumber: "6103" }), null);
  });
});

describe("Rule Engine", () => {
  it("18. regra expirada não é aplicada", () => {
    const out = runDraw(drawInput({ ruleOverrides: { effectiveUntil: "2026-06-30" } }));
    assert.equal(out.status, "VALIDATION_FAILED");
    assert.match(out.errors.join(), /não está vigente/);
  });

  it("regra não publicada não é aplicada", () => {
    const out = runDraw(drawInput({ ruleOverrides: { status: "APPROVED" } }));
    assert.equal(out.status, "VALIDATION_FAILED");
  });

  it("19. regra alterada depois da aprovação é detectada pelo hash", () => {
    const original = drawInput({});
    const tampered = { ...original, rule: { ...original.rule, config: { ...original.rule.config, candidatePlan: [{ prize: 1, positions: [1, 2, 3] }] } } };
    const out = runDraw(tampered);
    assert.equal(out.status, "VALIDATION_FAILED");
    assert.ok(codes(out).includes("RULE_HASH_MISMATCH"));
  });

  it("validação estrutural aponta posição fora do prêmio e plano vazio", () => {
    const errs = validateRuleConfig(config({ candidatePlan: [{ prize: 1, positions: [0, 6] }] }));
    assert.ok(errs.some((e) => e.includes("posições devem estar entre 1 e 5")));
    assert.ok(validateRuleConfig(config({ candidatePlan: [] })).length > 0);
    assert.deepEqual(validateRuleConfig(config()), []);
  });

  it("plano expandido por prêmio × por padrão", () => {
    const byPrize = expandCandidatePlan([1, 2], [[3, 4, 5], [2, 3, 4]], "PRIZE_MAJOR");
    assert.deepEqual(byPrize.map((s) => `${s.prize}:${s.positions.join("")}`), ["1:345", "1:234", "2:345", "2:234"]);
  });
});

describe("Bid Engine", () => {
  const base = (bids: BidInput[], overrides: Partial<BidsInput> = {}, cfgOverrides = {}): BidsInput => {
    const cfg = config({
      bids: {
        enabled: true,
        order: ["FIXED_BID", "FREE_BID", "EMBEDDED_BID"],
        fixedPercentage: 30,
        minPercentage: 5,
        maxPercentage: 90,
        embeddedMaxPercentage: 30,
        overFixedCompetesAsFree: true,
        tieBreak: "DRAW_ORDER",
        maxContemplations: null,
      },
      ...cfgOverrides,
    });
    const d = drawInput({ cfg });
    const draw = runDraw(d);
    return {
      assembly: d.assembly,
      group: { id: d.group.id, numbering: d.group.numbering },
      rule: d.rule,
      lottery: d.lottery,
      eligibility: d.eligibility,
      drawContemplatedQuotas: quotas(draw),
      drawResultHash: draw.hashes.resultHash,
      remainingResources: draw.remainingResources,
      creditAmount: 100_000,
      bids,
      ...overrides,
    };
  };
  const bid = (id: string, quotaNumber: number, type: BidInput["type"], percentage: number, extra: Partial<BidInput> = {}): BidInput => ({
    id,
    quotaNumber,
    type,
    percentage,
    amount: null,
    embeddedAmount: null,
    submittedAt: "2026-09-20T10:00:00Z",
    ...extra,
  });

  it("13. empate de lance livre desempata pela ordem da apuração", () => {
    // Ordem da apuração: 940, 294, 329, 423, … → 423 vem antes de 700.
    const out = runBids(base([bid("b-700", 700, "FREE_BID", 40), bid("b-423", 423, "FREE_BID", 40)], { remainingResources: 100_000 }));
    assert.deepEqual(quotas(out), [423]);
  });

  it("lance não mistura com sorteio: cota sorteada é desclassificada", () => {
    const out = runBids(base([bid("b-940", 940, "FREE_BID", 50), bid("b-10", 10, "FREE_BID", 20)]));
    assert.deepEqual(quotas(out), [10]);
    assert.ok(out.trace.some((s) => s.code === "BID_REJECTED" && s.message.includes("já contemplada no sorteio")));
  });

  it("modalidades na ordem da regra, embutido limitado e paralisação por recursos", () => {
    const out = runBids(
      base(
        [
          bid("f1", 11, "FIXED_BID", 30),
          bid("l1", 12, "FREE_BID", 60),
          bid("e1", 13, "EMBEDDED_BID", 50, { embeddedAmount: 40_000 }),
        ],
        { remainingResources: 200_000 },
      ),
    );
    assert.deepEqual(quotas(out), [11, 12]);
    assert.ok(out.trace.some((s) => s.message.includes("acima do limite de 30%")));
    const halted = runBids(base([bid("f1", 11, "FIXED_BID", 30), bid("l1", 12, "FREE_BID", 60)], { remainingResources: 100_000 }));
    assert.deepEqual(quotas(halted), [11]);
    assert.ok(halted.trace.some((s) => s.code === "BIDS_HALTED"));
  });

  it("lance fixo acima do percentual concorre também como livre", () => {
    const out = runBids(base([bid("f-high", 20, "FIXED_BID", 45), bid("l-low", 21, "FREE_BID", 40)], { remainingResources: 100_000 }, {
      bids: {
        enabled: true, order: ["FREE_BID", "FIXED_BID"], fixedPercentage: 30, minPercentage: null, maxPercentage: null,
        embeddedMaxPercentage: null, overFixedCompetesAsFree: true, tieBreak: "LOWEST_QUOTA", maxContemplations: null,
      },
    }));
    assert.deepEqual(quotas(out), [20]);
  });
});

describe("Retificação, reprodução e determinismo", () => {
  it("20. retificação: compara original × novo e exige duas pessoas", () => {
    const original = runDraw(drawInput({}));
    const corrected = runDraw(drawInput({ overrides: { 940: { paymentStatus: "DELINQUENT" } } }));
    const cmp = compareRuns(original, corrected);
    assert.equal(cmp.identical, false);
    assert.deepEqual(cmp.added, [294]);
    assert.deepEqual(cmp.removed, [940]);
    assert.ok(cmp.hashDiffs.includes("eligibilityHash"));
    assert.ok(validateRetificationRequest({ reason: "curto", requestedBy: "u1", hasEvidence: false }).length === 2);
    assert.match(
      validateRetificationRequest({ reason: "Inadimplência registrada com atraso", requestedBy: "u1", approvedBy: "u1", hasEvidence: true }).join(),
      /duas pessoas/,
    );
  });

  it("21. reprodução histórica: snapshot serializado (jsonb) reproduz o mesmo resultado", () => {
    const input = drawInput({ planned: 2, overrides: { 940: { paymentStatus: "DELINQUENT" } } });
    const original = runDraw(input);
    // Simula o que volta do banco: JSON com chaves em outra ordem.
    const shuffle = (v: unknown): unknown =>
      Array.isArray(v) ? v.map(shuffle) : v && typeof v === "object"
        ? Object.fromEntries(Object.entries(v as Record<string, unknown>).reverse().map(([k, x]) => [k, shuffle(x)]))
        : v;
    const restored = shuffle(JSON.parse(JSON.stringify(input))) as typeof input;
    const reproduced = runDraw(restored);
    assert.deepEqual(reproduced.hashes, original.hashes);
    assert.equal(compareRuns(original, reproduced).identical, true);
  });

  it("MESMO INPUT + MESMA VERSÃO + MESMO SNAPSHOT = MESMO RESULTADO (100 execuções)", () => {
    const input = drawInput({ planned: 3, cfg: config({ fallback: { method: "ALTERNATING_UP_FIRST", wrapAround: true } }) });
    const first = runDraw(input);
    for (let i = 0; i < 100; i += 1) assert.deepEqual(runDraw(input).hashes, first.hashes);
  });

  it("snapshot de elegibilidade não depende do estado atual das cotas", () => {
    const numbering = buildNumbering({ quotaCount: 1000 });
    const records = fullRecords(numbering);
    const snapshot = buildEligibilitySnapshot(numbering, records, config().eligibility);
    records[939].paymentStatus = "DELINQUENT"; // estado "atual" muda depois
    assert.equal(snapshot.entries[939].eligible, true);
  });

  it("hash canônico ignora ordem de chaves", () => {
    assert.equal(canonicalJson({ b: 1, a: [2, { d: 1, c: 2 }] }), '{"a":[2,{"c":2,"d":1}],"b":1}');
    assert.equal(hashOf({ a: 1, b: 2 }), hashOf({ b: 2, a: 1 }));
  });

  it("máquina de estados impede operações incompatíveis", () => {
    assert.equal(canTransitionAssembly("SCHEDULED", "DRAWING"), false);
    assert.equal(canTransitionAssembly("DRAW_READY", "DRAWING"), true);
    assert.equal(canTransitionAssembly("COMPLETED", "RETIFIED"), true);
    assert.equal(canTransitionAssembly("LOCKED", "DRAWING"), false);
  });
});
