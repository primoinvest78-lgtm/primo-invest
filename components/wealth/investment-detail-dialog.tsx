"use client";

import Link from "next/link";

import { AnimatedNumber } from "@/components/ui/animated-number";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import type { HoldingDetail } from "@/lib/data/wealth";
import { formatCurrencyBRL, formatDate } from "@/lib/utils/format";
import { computeGainLoss, holdingCost } from "@/lib/utils/investment-helpers";

const MOVEMENT_LABEL: Record<string, string> = {
  buy: "Compra",
  sell: "Venda",
  dividend: "Dividendo",
  interest: "Juros",
  fee: "Taxa",
};

function Field({
  label,
  value,
  animate = false,
  valueClassName,
}: {
  label: string;
  value: string | null | undefined;
  animate?: boolean;
  valueClassName?: string;
}) {
  return (
    <div>
      <p className="text-label font-bold uppercase text-card-beige-muted-foreground">{label}</p>
      <p className={["mt-1 text-sm font-medium", valueClassName ?? "text-foreground"].join(" ")}>
        {animate && value ? <AnimatedNumber value={value} /> : value ?? "—"}
      </p>
    </div>
  );
}

export function InvestmentDetailDialog({
  holding,
  onClose,
}: {
  holding: HoldingDetail | null;
  onClose: () => void;
}) {
  const { gainLoss, gainLossPct } = holding ? computeGainLoss(holding) : { gainLoss: null, gainLossPct: null };
  const cost = holding ? holdingCost(holding) : null;

  return (
    <Dialog open={holding !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-xl">
        {holding ? (
          <>
            <DialogHeader>
              <DialogTitle>{holding.productName ?? "Ativo"}</DialogTitle>
            </DialogHeader>

            <div className="space-y-5">
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                <Field label="Categoria" value={holding.productType} />
                <Field label="Instituição" value={holding.institutionName} />
                <div>
                  <p className="text-label font-bold uppercase text-card-beige-muted-foreground">Conta</p>
                  <p className="mt-1 text-sm font-medium text-foreground">
                    {holding.accountId ? (
                      <Link href={`/patrimonio/contas/${holding.accountId}`} className="text-primary hover:underline">
                        {holding.accountName ?? "Ver conta"}
                      </Link>
                    ) : (
                      holding.accountName ?? "—"
                    )}
                  </p>
                </div>
                <Field label="Quantidade" value={String(holding.quantity)} animate />
                <Field label="Valor atual" value={formatCurrencyBRL(holding.valuation)} animate />
                <Field label="Custo" value={cost !== null ? formatCurrencyBRL(cost) : null} animate />
                <Field
                  label="Resultado"
                  value={gainLoss !== null ? formatCurrencyBRL(gainLoss) : null}
                  valueClassName={gainLoss !== null && gainLoss < 0 ? "text-destructive" : "text-foreground"}
                  animate
                />
                <Field
                  label="Rentabilidade"
                  value={gainLossPct !== null ? `${gainLossPct >= 0 ? "+" : ""}${gainLossPct.toFixed(1)}%` : null}
                  valueClassName={gainLossPct !== null && gainLossPct < 0 ? "text-destructive" : "text-primary"}
                />
                <Field label="Posição em" value={formatDate(holding.asOfDate)} />
              </div>

              <div>
                <h4 className="mb-2 text-sm font-bold text-foreground">Movimentações</h4>
                {holding.movements.length === 0 ? (
                  <p className="text-body-sm text-card-beige-muted-foreground">
                    Nenhuma movimentação registrada pra essa conta/produto.
                  </p>
                ) : (
                  <div className="max-h-[220px] space-y-1.5 overflow-y-auto">
                    {holding.movements.map((m) => (
                      <div
                        key={m.id}
                        className="flex items-center justify-between gap-2 rounded-lg border border-black/10 bg-black/5 px-3 py-2 text-sm"
                      >
                        <div className="min-w-0">
                          <p className="truncate font-semibold text-foreground">
                            {MOVEMENT_LABEL[m.transactionType] ?? m.transactionType}
                          </p>
                          <p className="text-xs text-card-beige-muted-foreground">
                            {formatDate(m.transactionDate)}
                            {m.description ? ` · ${m.description}` : ""}
                          </p>
                        </div>
                        <span className="shrink-0 font-semibold text-foreground">
                          {formatCurrencyBRL(m.amount)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
