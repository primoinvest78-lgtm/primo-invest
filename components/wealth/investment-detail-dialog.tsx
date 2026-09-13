"use client";

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

function Field({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div>
      <p className="text-label font-bold uppercase text-card-beige-muted-foreground">{label}</p>
      <p className="mt-1 text-sm font-medium text-foreground">{value ?? "—"}</p>
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
                <Field label="Conta" value={holding.accountName} />
                <Field label="Quantidade" value={String(holding.quantity)} />
                <Field label="Valor atual" value={formatCurrencyBRL(holding.valuation)} />
                <Field label="Custo" value={cost !== null ? formatCurrencyBRL(cost) : null} />
                <Field label="Resultado" value={gainLoss !== null ? formatCurrencyBRL(gainLoss) : null} />
                <Field
                  label="Rentabilidade"
                  value={gainLossPct !== null ? `${gainLossPct >= 0 ? "+" : ""}${gainLossPct.toFixed(1)}%` : null}
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
