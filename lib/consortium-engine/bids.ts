import { apurationOrder } from "./draw.ts";
import { eligibilityLookup, INELIGIBILITY_LABEL } from "./eligibility.ts";
import { hashOf } from "./hash.ts";
import { formatQuotaNumber } from "./numbering.ts";
import { computeRuleHash } from "./rules.ts";
import { formatBRL, TraceBuilder } from "./trace.ts";
import {
  ENGINE_VERSION,
  type BidInput,
  type BidType,
  type Contemplation,
  type DrawRule,
  type EligibilitySnapshot,
  type GroupNumbering,
  type LotteryResult,
  type RunOutput,
} from "./types.ts";

/**
 * Bid Engine — processado SEMPRE depois do sorteio (Res. BCB 285/2023,
 * art. 12), com os recursos que sobraram. Não sorteia nada: só valida,
 * ranqueia e desempata lances conforme a regra do grupo.
 */

export type BidsInput = {
  assembly: { id: string; number: number; date: string };
  group: { id: string; numbering: GroupNumbering };
  rule: DrawRule;
  lottery: LotteryResult;
  eligibility: EligibilitySnapshot;
  /** Cotas já contempladas por sorteio nesta assembleia. */
  drawContemplatedQuotas: number[];
  drawResultHash: string;
  remainingResources: number;
  creditAmount: number;
  bids: BidInput[];
};

const BID_METHOD: Record<BidType, Contemplation["method"]> = {
  FREE_BID: "BID_FREE",
  FIXED_BID: "BID_FIXED",
  EMBEDDED_BID: "BID_EMBEDDED",
};

const BID_LABEL: Record<BidType, string> = {
  FREE_BID: "lance livre",
  FIXED_BID: "lance fixo",
  EMBEDDED_BID: "lance embutido",
};

type ValidBid = BidInput & { effectivePercentage: number; ownFunds: number };

/** Arredondamento determinístico em 4 casas (evita 29.999999 ≠ 30). */
const round4 = (n: number) => Math.round(n * 10_000) / 10_000;

export function bidsInputHash(input: BidsInput): string {
  return hashOf({
    engineVersion: ENGINE_VERSION,
    assembly: input.assembly,
    group: input.group,
    lottery: input.lottery,
    drawContemplatedQuotas: input.drawContemplatedQuotas,
    drawResultHash: input.drawResultHash,
    remainingResources: input.remainingResources,
    creditAmount: input.creditAmount,
    bids: [...input.bids].sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0)),
  });
}

export function runBids(input: BidsInput): RunOutput {
  const t = new TraceBuilder();
  const cfg = input.rule.config.bids;
  const numbering = input.group.numbering;
  const label = (n: number) => formatQuotaNumber(n, numbering.displayDigits);
  const contemplations: Contemplation[] = [];
  let remaining = input.remainingResources;

  const done = (): RunOutput => {
    const trace = t.toArray();
    return {
      engineVersion: ENGINE_VERSION,
      phase: "BIDS",
      status: "COMPLETED",
      errors: [],
      contemplations,
      official: input.eligibility.completeness === "COMPLETE",
      resources: null,
      remainingResources: remaining,
      trace,
      hashes: {
        inputHash: bidsInputHash(input),
        ruleHash: computeRuleHash(input.rule),
        eligibilityHash: hashOf(input.eligibility),
        calculationHash: hashOf(trace),
        resultHash: hashOf({ status: "COMPLETED", errors: [], contemplations }),
      },
    };
  };

  t.add("BIDS_START", `Processamento de lances da assembleia nº ${input.assembly.number}, depois do sorteio.`, {
    drawResultHash: input.drawResultHash,
    remainingResources: remaining,
  });
  if (!cfg.enabled) {
    t.add("BIDS_DISABLED", "A regra não habilita contemplação por lance.");
    return done();
  }
  t.add("BIDS_RESOURCES", `Recursos após o sorteio: ${formatBRL(remaining)}; crédito ${formatBRL(input.creditAmount)}.`);

  // 1. Validação individual
  const lookup = eligibilityLookup(input.eligibility);
  const drawn = new Set(input.drawContemplatedQuotas);
  const valid: ValidBid[] = [];
  const sortedBids = [...input.bids].sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));

  for (const bid of sortedBids) {
    const who = `Lance ${bid.id.slice(0, 8)} (cota ${label(bid.quotaNumber)}, ${BID_LABEL[bid.type]})`;
    const reject = (why: string) => t.add("BID_REJECTED", `${who} desclassificado: ${why}.`, { bidId: bid.id, reason: why });

    if (drawn.has(bid.quotaNumber)) {
      reject("cota já contemplada no sorteio desta assembleia");
      continue;
    }
    const elig = lookup.check(bid.quotaNumber, "ACTIVE");
    if (!elig.eligible) {
      reject(INELIGIBILITY_LABEL[elig.reason ?? "UNKNOWN"]);
      continue;
    }
    const pct =
      bid.percentage ?? (bid.amount !== null && input.creditAmount > 0 ? (bid.amount / input.creditAmount) * 100 : null);
    if (pct === null) {
      reject("sem percentual nem valor");
      continue;
    }
    const effectivePercentage = round4(pct);
    const inFreePool = bid.type === "FIXED_BID" && cfg.overFixedCompetesAsFree && cfg.fixedPercentage !== null && effectivePercentage > cfg.fixedPercentage;
    if (!cfg.order.includes(bid.type) && !inFreePool) {
      reject("modalidade não prevista na regra");
      continue;
    }
    if (bid.type === "FIXED_BID" && cfg.fixedPercentage !== null && effectivePercentage < cfg.fixedPercentage) {
      reject(`percentual abaixo do fixo de ${cfg.fixedPercentage}%`);
      continue;
    }
    if (bid.type !== "FIXED_BID") {
      if (cfg.minPercentage !== null && effectivePercentage < cfg.minPercentage) {
        reject(`percentual ${effectivePercentage}% abaixo do mínimo de ${cfg.minPercentage}%`);
        continue;
      }
      if (cfg.maxPercentage !== null && effectivePercentage > cfg.maxPercentage) {
        reject(`percentual ${effectivePercentage}% acima do máximo de ${cfg.maxPercentage}%`);
        continue;
      }
    }
    const embedded = bid.embeddedAmount ?? 0;
    if (bid.type === "EMBEDDED_BID" && embedded <= 0) {
      reject("lance embutido sem parcela embutida");
      continue;
    }
    if (embedded > 0) {
      const limit = cfg.embeddedMaxPercentage === null ? null : (input.creditAmount * cfg.embeddedMaxPercentage) / 100;
      if (limit === null) {
        reject("a regra não autoriza lance embutido");
        continue;
      }
      if (embedded > limit + 0.005) {
        reject(`parcela embutida ${formatBRL(embedded)} acima do limite de ${cfg.embeddedMaxPercentage}% do crédito`);
        continue;
      }
    }
    const totalAmount = (effectivePercentage / 100) * input.creditAmount;
    valid.push({ ...bid, effectivePercentage, ownFunds: Math.max(totalAmount - embedded, 0) });
    t.add("BID_ACCEPTED", `${who} válido: ${effectivePercentage}%.`, { bidId: bid.id, percentage: effectivePercentage });
  }

  // 2. Desempate
  const order = cfg.tieBreak === "DRAW_ORDER" ? apurationOrder(input.lottery.prizes, input.rule, numbering) : null;
  const tieKey = (b: ValidBid): [number, string, number] => {
    if (cfg.tieBreak === "DRAW_ORDER") return [order!.get(b.quotaNumber) ?? Number.MAX_SAFE_INTEGER, "", b.quotaNumber];
    if (cfg.tieBreak === "EARLIEST_SUBMISSION") return [0, b.submittedAt, b.quotaNumber];
    return [0, "", b.quotaNumber];
  };
  const compareTie = (a: ValidBid, b: ValidBid) => {
    const [a1, a2, a3] = tieKey(a);
    const [b1, b2, b3] = tieKey(b);
    return a1 - b1 || (a2 < b2 ? -1 : a2 > b2 ? 1 : 0) || a3 - b3;
  };
  t.add("BIDS_TIE_BREAK", `Critério de desempate da regra: ${cfg.tieBreak === "DRAW_ORDER" ? "ordem da apuração do sorteio" : cfg.tieBreak === "EARLIEST_SUBMISSION" ? "oferta mais antiga" : "menor número de cota"}.`);

  // 3. Processamento por modalidade, na ordem da regra
  const contemplated = new Set<number>();
  let halted = false;
  for (const type of cfg.order) {
    if (halted) break;
    const pool = valid.filter(
      (b) =>
        !contemplated.has(b.quotaNumber) &&
        (b.type === type ||
          (type === "FREE_BID" &&
            b.type === "FIXED_BID" &&
            cfg.overFixedCompetesAsFree &&
            cfg.fixedPercentage !== null &&
            b.effectivePercentage > cfg.fixedPercentage)),
    );
    const ranked = [...pool].sort((a, b) =>
      type === "FIXED_BID" ? compareTie(a, b) : b.effectivePercentage - a.effectivePercentage || compareTie(a, b),
    );
    t.add("BIDS_POOL", `Modalidade ${BID_LABEL[type]}: ${ranked.length} lance(s) válido(s).`, {
      ranking: ranked.map((b) => ({ bidId: b.id, quotaNumber: b.quotaNumber, percentage: b.effectivePercentage })),
    });

    for (const bid of ranked) {
      if (contemplated.has(bid.quotaNumber)) continue;
      if (cfg.maxContemplations !== null && contemplations.length >= cfg.maxContemplations) {
        t.add("BIDS_LIMIT", `Limite de ${cfg.maxContemplations} contemplação(ões) por lance atingido.`);
        halted = true;
        break;
      }
      const required = input.rule.config.resources.bidFundsCountTowardResources
        ? input.creditAmount - bid.ownFunds
        : input.creditAmount;
      if (required > remaining + 0.005) {
        t.add(
          "BIDS_HALTED",
          `Recursos insuficientes para a cota ${label(bid.quotaNumber)} (necessário ${formatBRL(required)}, disponível ${formatBRL(remaining)}) — contemplação por lance paralisada.`,
        );
        halted = true;
        break;
      }
      remaining -= required;
      contemplated.add(bid.quotaNumber);
      const method = bid.type === type ? BID_METHOD[bid.type] : BID_METHOD[type];
      contemplations.push({
        sequence: contemplations.length + 1,
        quotaNumber: bid.quotaNumber,
        quotaLabel: label(bid.quotaNumber),
        method,
        candidateRaw: null,
        bidId: bid.id,
        creditAmount: input.creditAmount,
        via: "BID",
      });
      t.add("CONTEMPLATED", `Cota ${label(bid.quotaNumber)} CONTEMPLADA por ${BID_LABEL[type]} (${bid.effectivePercentage}%).`, {
        quotaNumber: bid.quotaNumber,
        bidId: bid.id,
      });
    }
  }

  t.add("RESULT", `Resultado: ${contemplations.length} contemplação(ões) por lance.`, {
    quotas: contemplations.map((c) => c.quotaNumber),
    remainingResources: remaining,
  });
  return done();
}
