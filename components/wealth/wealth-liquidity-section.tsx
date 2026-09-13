"use client";

import Link from "next/link";

import type { WealthOverview } from "@/lib/data/wealth";
import { formatCurrencyBRL } from "@/lib/utils/format";
import { isLiquidAccountType } from "@/lib/utils/wealth-helpers";

export function WealthLiquiditySection({ overview }: { overview: WealthOverview }) {
  const liquidAccounts = overview.accounts.filter((a) => isLiquidAccountType(a.accountType));
  const liquidPct = overview.netWorth > 0 ? (overview.liquidTotal / overview.netWorth) * 100 : 0;

  return (
    <div className="card-premium rounded-2xl p-5 md:p-6">
      <div className="mb-1 flex items-center justify-between">
        <h3 className="text-h2 font-bold text-foreground">Liquidez</h3>
        <Link href="/patrimonio/contas" className="text-xs font-semibold text-accent hover:underline">
          Ver contas
        </Link>
      </div>
      <p className="mb-4 text-sm text-card-beige-muted-foreground">
        {liquidAccounts.length === 0
          ? "Sem contas de liquidez identificadas."
          : `${liquidPct.toFixed(1)}% do patrimônio líquido está disponível em caixa/liquidez.`}
      </p>

      <p className="mb-4 text-h2 font-bold text-foreground">{formatCurrencyBRL(overview.liquidTotal)}</p>

      {liquidAccounts.length === 0 ? null : (
        <div className="space-y-2">
          {liquidAccounts.map((account) => (
            <div
              key={account.id}
              className="flex items-center justify-between gap-2 rounded-xl border border-black/10 bg-black/5 px-3.5 py-3 transition-colors duration-150 hover:bg-black/10"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-foreground">
                  {account.accountName ?? account.institutionName ?? "Conta"}
                </p>
                {account.clientId ? (
                  <Link
                    href={`/clientes/${account.clientId}`}
                    className="text-xs font-medium text-accent hover:underline"
                  >
                    {account.clientName}
                  </Link>
                ) : (
                  <p className="text-xs font-medium text-card-beige-muted-foreground">
                    {account.clientName ?? "—"}
                  </p>
                )}
              </div>
              <p className="shrink-0 text-sm font-semibold text-foreground">
                {formatCurrencyBRL(account.balance)}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
