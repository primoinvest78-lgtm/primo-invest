import { formatBRL } from "./trace.ts";

/**
 * Amortization + Settlement Engine.
 *
 * Contemplação NÃO é quitação. O saldo devedor aqui é o que o PRIMO
 * consegue afirmar com os dados que tem: soma das parcelas registradas
 * ainda em aberto. A regra de amortização (reduzir prazo ou parcela) é
 * escolhida por quem registra, conforme contrato — nunca presumida.
 */

export type InstallmentState = {
  id: string;
  number: number;
  dueDate: string;
  amount: number;
  status: "pending" | "paid" | "overdue" | "negotiated" | "exempt" | "cancelled" | "amortized";
};

const OPEN = new Set(["pending", "overdue", "negotiated"]);
const cents = (n: number) => Math.round(n * 100) / 100;

export type QuotaFinancialStatus =
  | "ACTIVE"
  | "CONTEMPLATED"
  | "CONTEMPLATED_WITH_BALANCE"
  | "PAID_OFF"
  | "CANCELLED"
  | "EXCLUDED"
  | "CLOSED";

export const QUOTA_FINANCIAL_STATUS_LABEL: Record<QuotaFinancialStatus, string> = {
  ACTIVE: "Ativa",
  CONTEMPLATED: "Contemplada",
  CONTEMPLATED_WITH_BALANCE: "Contemplada com saldo devedor",
  PAID_OFF: "Quitada",
  CANCELLED: "Cancelada",
  EXCLUDED: "Excluída",
  CLOSED: "Encerrada",
};

export type SettlementPosition = {
  status: QuotaFinancialStatus;
  totalScheduled: number;
  paid: number;
  amortized: number;
  outstanding: number;
  overdue: number;
  openInstallments: number;
  paidInstallments: number;
  explanation: string[];
};

/** Posição financeira derivada — não é coluna, é cálculo sobre parcelas + razão. */
export function settlementPosition(input: {
  installments: InstallmentState[];
  contemplated: boolean;
  contractStatus: string;
  asOf: string;
  settledTotal?: boolean;
}): SettlementPosition {
  const open = input.installments.filter((i) => OPEN.has(i.status));
  const paid = input.installments.filter((i) => i.status === "paid");
  const amortized = input.installments.filter((i) => i.status === "amortized");
  const outstanding = cents(open.reduce((s, i) => s + i.amount, 0));
  const overdue = cents(open.filter((i) => i.status === "overdue" || i.dueDate < input.asOf).reduce((s, i) => s + i.amount, 0));
  const paidValue = cents(paid.reduce((s, i) => s + i.amount, 0));
  const amortizedValue = cents(amortized.reduce((s, i) => s + i.amount, 0));

  let status: QuotaFinancialStatus;
  if (input.contractStatus === "cancelled") status = "CANCELLED";
  else if (input.contractStatus === "closed") status = "CLOSED";
  else if (input.settledTotal || (input.installments.length > 0 && open.length === 0)) status = "PAID_OFF";
  else if (input.contemplated) status = outstanding > 0 ? "CONTEMPLATED_WITH_BALANCE" : "CONTEMPLATED";
  else status = "ACTIVE";

  return {
    status,
    totalScheduled: cents(input.installments.reduce((s, i) => s + i.amount, 0)),
    paid: paidValue,
    amortized: amortizedValue,
    outstanding,
    overdue,
    openInstallments: open.length,
    paidInstallments: paid.length,
    explanation: [
      `${paid.length} parcela(s) paga(s) (${formatBRL(paidValue)}), ${amortized.length} amortizada(s) (${formatBRL(amortizedValue)}).`,
      `${open.length} parcela(s) em aberto — saldo devedor registrado ${formatBRL(outstanding)}${overdue > 0 ? `, dos quais ${formatBRL(overdue)} vencidos` : ""}.`,
    ],
  };
}

export type AmortizationMode = "REDUCE_TERM" | "REDUCE_INSTALLMENT";

export type AmortizationPlan = {
  mode: AmortizationMode;
  amount: number;
  applied: number;
  /** Troco não aplicado (ex.: valor maior que o saldo). */
  unapplied: number;
  changes: { id: string; number: number; before: { amount: number; status: string }; after: { amount: number; status: string } }[];
  balanceBefore: number;
  balanceAfter: number;
  openInstallmentsBefore: number;
  openInstallmentsAfter: number;
  explanation: string[];
};

/**
 * REDUCE_TERM: quita as ÚLTIMAS parcelas em aberto (de trás pra
 * frente); a última atingida parcialmente só tem o valor reduzido.
 * REDUCE_INSTALLMENT: distribui a redução igualmente entre as parcelas
 * em aberto (centavos residuais na última).
 */
export function planAmortization(installments: InstallmentState[], amount: number, mode: AmortizationMode): AmortizationPlan {
  const value = cents(amount);
  if (value <= 0) throw new Error("Valor de amortização deve ser positivo.");
  const open = installments.filter((i) => OPEN.has(i.status)).sort((a, b) => a.number - b.number);
  if (open.length === 0) throw new Error("Não há parcelas em aberto para amortizar.");
  const balanceBefore = cents(open.reduce((s, i) => s + i.amount, 0));
  const changes: AmortizationPlan["changes"] = [];
  let left = Math.min(value, balanceBefore);

  if (mode === "REDUCE_TERM") {
    for (const inst of [...open].reverse()) {
      if (left <= 0) break;
      if (left >= inst.amount - 0.001) {
        changes.push({ id: inst.id, number: inst.number, before: { amount: inst.amount, status: inst.status }, after: { amount: inst.amount, status: "amortized" } });
        left = cents(left - inst.amount);
      } else {
        changes.push({ id: inst.id, number: inst.number, before: { amount: inst.amount, status: inst.status }, after: { amount: cents(inst.amount - left), status: inst.status } });
        left = 0;
      }
    }
  } else {
    // Não dá pra reduzir abaixo de zero: se o valor cobre tudo, vira quitação por prazo.
    const perInstallment = Math.floor((left / open.length) * 100) / 100;
    let distributed = 0;
    open.forEach((inst, idx) => {
      const isLast = idx === open.length - 1;
      const reduction = isLast ? cents(left - distributed) : perInstallment;
      const newAmount = cents(Math.max(inst.amount - reduction, 0));
      const effective = cents(inst.amount - newAmount);
      distributed = cents(distributed + effective);
      changes.push({
        id: inst.id,
        number: inst.number,
        before: { amount: inst.amount, status: inst.status },
        after: { amount: newAmount, status: newAmount === 0 ? "amortized" : inst.status },
      });
    });
    left = cents(left - distributed);
  }

  const applied = cents(Math.min(value, balanceBefore) - left);
  const byId = new Map(changes.map((c) => [c.id, c.after]));
  const after = open.map((i) => byId.get(i.id) ?? { amount: i.amount, status: i.status });
  const stillOpen = after.filter((a) => OPEN.has(a.status));
  const balanceAfter = cents(stillOpen.reduce((s, a) => s + a.amount, 0));
  return {
    mode,
    amount: value,
    applied,
    unapplied: cents(value - applied),
    changes,
    balanceBefore,
    balanceAfter,
    openInstallmentsBefore: open.length,
    openInstallmentsAfter: stillOpen.length,
    explanation: [
      `Amortização de ${formatBRL(value)} por ${mode === "REDUCE_TERM" ? "redução de prazo" : "redução do valor das parcelas"}.`,
      `Saldo devedor ${formatBRL(balanceBefore)} → ${formatBRL(balanceAfter)}; parcelas em aberto ${open.length} → ${stillOpen.length}.`,
      ...(value > applied ? [`${formatBRL(cents(value - applied))} excedem o saldo e não foram aplicados.`] : []),
    ],
  };
}

/** Quitação: TOTAL exige cobrir todo o saldo; PARCIAL vira amortização por prazo. */
export function planSettlement(installments: InstallmentState[], amount: number) {
  const open = installments.filter((i) => OPEN.has(i.status));
  const balance = cents(open.reduce((s, i) => s + i.amount, 0));
  const value = cents(amount);
  if (value <= 0) throw new Error("Valor de quitação deve ser positivo.");
  if (value + 0.001 >= balance) {
    return {
      kind: "SETTLEMENT_TOTAL" as const,
      balanceBefore: balance,
      balanceAfter: 0,
      change: cents(value - balance),
      installmentIds: open.map((i) => i.id),
      explanation: [`Quitação total: saldo ${formatBRL(balance)} coberto por ${formatBRL(value)}.`],
    };
  }
  const plan = planAmortization(installments, value, "REDUCE_TERM");
  return {
    kind: "SETTLEMENT_PARTIAL" as const,
    balanceBefore: balance,
    balanceAfter: plan.balanceAfter,
    change: 0,
    installmentIds: plan.changes.map((c) => c.id),
    plan,
    explanation: [`Quitação parcial de ${formatBRL(value)} aplicada às últimas parcelas.`, ...plan.explanation],
  };
}
