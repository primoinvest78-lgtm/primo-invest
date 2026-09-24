import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { applyCreditUsage, computeCreditEntitlement, evaluateRequirementGate, type Requirement } from "../credit.ts";
import { runDraw } from "../draw.ts";
import { buildNumbering, checkNumberingIntegrity } from "../numbering.ts";
import { planAmortization, planSettlement, settlementPosition, type InstallmentState } from "../settlement.ts";
import { config, drawInput } from "./fixtures.ts";

function schedule(n: number, amount: number, paid = 0): InstallmentState[] {
  return Array.from({ length: n }, (_, i) => ({
    id: `i${i + 1}`,
    number: i + 1,
    dueDate: `2027-${String((i % 12) + 1).padStart(2, "0")}-10`,
    amount,
    status: i < paid ? "paid" : "pending",
  }));
}

describe("Number Engine — integridade e registro de números", () => {
  it("detecta duplicado, fora da faixa e faltante", () => {
    const n = buildNumbering({ quotaCount: 5 });
    const r = checkNumberingIntegrity(n, [1, 2, 2, 7], true);
    assert.deepEqual(r.duplicates, [2]);
    assert.deepEqual(r.outOfRange, [7]);
    assert.deepEqual(r.missing, [3, 4, 5]);
    assert.equal(r.ok, false);
    assert.equal(checkNumberingIntegrity(n, [1, 2, 3], false).ok, true);
  });

  it("registra TODAS as tentativas: candidato, equivalente, aproximação, sem virar cota", () => {
    const cfg = config({ approximation: { method: "NEXT_HIGHER", maxSteps: 1, wrapAround: false } });
    const out = runDraw(drawInput({ cfg, overrides: { 940: { paymentStatus: "DELINQUENT" } } }));
    assert.deepEqual(
      out.attempts.map((a) => [a.numberText, a.numberType, a.quotaNumber, a.outcome, a.reason]),
      [
        ["940", "CANDIDATE", 940, "INELIGIBLE", "DELINQUENT"],
        ["941", "APPROXIMATION", 941, "SELECTED", null],
      ],
    );
    const eq = runDraw(drawInput({ cfg: config({ equivalence: { method: "ZERO_AS_MAX" } }), prizes: ["12000", "89423", "12345", "54321", "22334"] }));
    assert.deepEqual([eq.attempts[0].numberText, eq.attempts[0].numberType, eq.attempts[0].quotaNumber], ["000", "EQUIVALENT_NUMBER", 1000]);
    const out500 = runDraw(drawInput({ quotaCount: 500 }));
    assert.equal(out500.attempts[0].outcome, "ELIMINATED");
    assert.equal(out500.attempts[0].quotaNumber, null);
  });
});

describe("Credit Engine", () => {
  it("crédito líquido com lance embutido registra todas as origens", () => {
    const c = computeCreditEntitlement({ contractedCredit: 500_000, bidAmount: 150_000, embeddedBidAmount: 100_000 });
    assert.equal(c.netAvailableCredit, 400_000);
    assert.equal(c.ownFundsBidAmount, 50_000);
    assert.match(c.explanation.join(" "), /R\$ 500\.000,00 − R\$ 100\.000,00 embutido = R\$ 400\.000,00/);
    assert.throws(() => computeCreditEntitlement({ contractedCredit: 100, bidAmount: 10, embeddedBidAmount: 20 }));
  });

  it("crédito atualizado entra no líquido", () => {
    assert.equal(computeCreditEntitlement({ contractedCredit: 500_000, updatedCredit: 520_000, embeddedBidAmount: 0 }).netAvailableCredit, 520_000);
  });

  it("utilização parcial e total, sem ultrapassar o líquido", () => {
    const p = applyCreditUsage({ netAvailableCredit: 400_000, usedCredit: 0, amount: 150_000 });
    assert.equal(p.status, "PARTIALLY_USED");
    assert.equal(p.remainingAfter, 250_000);
    assert.equal(applyCreditUsage({ netAvailableCredit: 400_000, usedCredit: 150_000, amount: 250_000 }).status, "USED");
    assert.throws(() => applyCreditUsage({ netAvailableCredit: 400_000, usedCredit: 150_000, amount: 250_001 }));
  });

  it("compliance by design: só obrigatório bloqueia; recomendado alerta", () => {
    const reqs: Requirement[] = [
      { title: "Documento de identidade", stage: "CONTEMPLATION", classification: "MANDATORY", applies: true, status: "APPROVED" },
      { title: "Matrícula do imóvel", stage: "GUARANTEE", classification: "CONDITIONAL", applies: false, status: "PENDING" },
      { title: "Comprovante de renda atualizado", stage: "ANALYSIS", classification: "RECOMMENDED", applies: true, status: "PENDING" },
      { title: "Nota fiscal do bem", stage: "RELEASE", classification: "MANDATORY", applies: true, status: "PENDING" },
    ];
    const toApprove = evaluateRequirementGate(reqs, "APPROVED");
    assert.equal(toApprove.canAdvance, true);
    assert.equal(toApprove.warnings.length, 1);
    const toRelease = evaluateRequirementGate(reqs, "AVAILABLE");
    assert.equal(toRelease.canAdvance, false);
    assert.equal(toRelease.blocking[0].title, "Nota fiscal do bem");
    const conditional = evaluateRequirementGate([{ ...reqs[1], applies: true }], "APPROVED");
    assert.equal(conditional.canAdvance, false);
  });
});

describe("Amortization + Settlement Engine", () => {
  it("amortização por redução de prazo quita as últimas parcelas", () => {
    const plan = planAmortization(schedule(10, 1000, 2), 2500, "REDUCE_TERM");
    assert.deepEqual(plan.changes.map((c) => [c.number, c.after.status, c.after.amount]), [
      [10, "amortized", 1000],
      [9, "amortized", 1000],
      [8, "pending", 500],
    ]);
    assert.equal(plan.balanceBefore, 8000);
    assert.equal(plan.balanceAfter, 5500);
    assert.equal(plan.openInstallmentsAfter, 6);
  });

  it("amortização por redução de parcela distribui com centavos exatos", () => {
    const plan = planAmortization(schedule(3, 1000), 100, "REDUCE_INSTALLMENT");
    assert.deepEqual(plan.changes.map((c) => c.after.amount), [966.67, 966.67, 966.66]);
    assert.equal(plan.balanceAfter, 2900);
    assert.equal(plan.applied, 100);
  });

  it("amortização acima do saldo aplica só o saldo", () => {
    const plan = planAmortization(schedule(2, 100), 500, "REDUCE_TERM");
    assert.equal(plan.applied, 200);
    assert.equal(plan.unapplied, 300);
    assert.equal(plan.balanceAfter, 0);
  });

  it("quitação parcial × total", () => {
    const inst = schedule(4, 1000, 1);
    const partial = planSettlement(inst, 1500);
    assert.equal(partial.kind, "SETTLEMENT_PARTIAL");
    assert.equal(partial.balanceAfter, 1500);
    const total = planSettlement(inst, 3000);
    assert.equal(total.kind, "SETTLEMENT_TOTAL");
    assert.equal(total.installmentIds.length, 3);
  });

  it("contemplação não é quitação: posição distingue os estados", () => {
    const inst = schedule(4, 1000, 1);
    assert.equal(settlementPosition({ installments: inst, contemplated: false, contractStatus: "active", asOf: "2027-01-01" }).status, "ACTIVE");
    const c = settlementPosition({ installments: inst, contemplated: true, contractStatus: "active", asOf: "2027-01-01" });
    assert.equal(c.status, "CONTEMPLATED_WITH_BALANCE");
    assert.equal(c.outstanding, 3000);
    const paidAll = inst.map((i) => ({ ...i, status: "paid" as const }));
    assert.equal(settlementPosition({ installments: paidAll, contemplated: true, contractStatus: "active", asOf: "2027-01-01" }).status, "PAID_OFF");
    assert.equal(settlementPosition({ installments: inst, contemplated: true, contractStatus: "cancelled", asOf: "2027-01-01" }).status, "CANCELLED");
  });
});
