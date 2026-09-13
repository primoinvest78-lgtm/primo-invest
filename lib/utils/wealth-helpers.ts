const LIQUID_KEYWORDS = ["corrente", "poupança", "poupanca", "checking", "savings", "caixa", "cash"];

export function isLiquidAccountType(accountType: string | null | undefined): boolean {
  if (!accountType) return false;
  const lower = accountType.toLowerCase();
  return LIQUID_KEYWORDS.some((k) => lower.includes(k));
}

export type WealthAlert = {
  id: string;
  severity: "danger" | "warning" | "info";
  message: string;
};

/**
 * Alertas patrimoniais — todos derivados de dado real já calculado
 * (nenhuma condição inventada). Só entra na lista o que de fato se
 * aplica ao estado atual do patrimônio da organização.
 */
export function computeWealthAlerts(input: {
  netWorth: number;
  liquidTotal: number;
  totalAssets: number;
  allocation: { label: string; value: number }[];
  history: { month: string; value: number }[];
  lastUpdatedAt: string | null;
}): WealthAlert[] {
  const alerts: WealthAlert[] = [];
  const now = Date.now();
  const DAY_MS = 1000 * 60 * 60 * 24;

  if (input.netWorth > 0) {
    const liquidPct = (input.liquidTotal / input.netWorth) * 100;
    if (liquidPct < 5) {
      alerts.push({
        id: "low-liquidity",
        severity: "warning",
        message: `Liquidez baixa: apenas ${liquidPct.toFixed(1)}% do patrimônio líquido está em caixa/liquidez.`,
      });
    }
  }

  if (input.totalAssets > 0) {
    for (const entry of input.allocation) {
      const pct = (entry.value / input.totalAssets) * 100;
      if (pct >= 60) {
        alerts.push({
          id: `concentration-${entry.label}`,
          severity: "warning",
          message: `Concentração elevada: ${pct.toFixed(0)}% dos ativos em "${entry.label}".`,
        });
      }
    }
  }

  if (input.history.length >= 2) {
    const last = input.history[input.history.length - 1];
    const prev = input.history[input.history.length - 2];
    if (prev.value > 0) {
      const change = ((last.value - prev.value) / prev.value) * 100;
      if (change <= -10) {
        alerts.push({
          id: "wealth-drop",
          severity: "danger",
          message: `Queda de ${Math.abs(change).toFixed(1)}% no patrimônio no último mês registrado.`,
        });
      }
    }
  }

  if (input.lastUpdatedAt && now - new Date(input.lastUpdatedAt).getTime() > 90 * DAY_MS) {
    alerts.push({
      id: "stale-data",
      severity: "info",
      message: "Posições de investimento não são atualizadas há mais de 90 dias.",
    });
  }

  return alerts;
}
