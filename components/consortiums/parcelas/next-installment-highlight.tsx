import Link from "next/link";

import type { ConsortiumInstallment } from "@/lib/data/consortiums";
import { daysFromToday, isEffectivelyOverdue, installmentStatusLabel } from "@/lib/utils/installment-helpers";
import { formatCurrencyBRL, formatDate } from "@/lib/utils/format";

export function NextInstallmentHighlight({ installments }: { installments: ConsortiumInstallment[] }) {
  const overdue = installments
    .filter(isEffectivelyOverdue)
    .sort((a, b) => (a.dueDate ?? "").localeCompare(b.dueDate ?? ""));

  const upcoming = installments
    .filter((i) => i.status === "pending" && !isEffectivelyOverdue(i) && i.dueDate)
    .sort((a, b) => (a.dueDate as string).localeCompare(b.dueDate as string));

  const featured = overdue[0] ?? upcoming[0];

  if (!featured) {
    return (
      <div className="card-premium rounded-2xl p-5 md:p-6">
        <p className="text-body-sm text-card-beige-muted-foreground">
          Nenhuma parcela pendente registrada no momento.
        </p>
      </div>
    );
  }

  const isLate = overdue.length > 0 && featured.id === overdue[0].id;
  const days = featured.dueDate ? daysFromToday(featured.dueDate) : null;

  return (
    <div
      className={[
        "rounded-2xl p-5 md:p-6",
        isLate ? "border-2 border-destructive bg-destructive/10" : "card-premium",
      ].join(" ")}
    >
      <p
        className={[
          "text-label font-bold uppercase",
          isLate ? "text-destructive" : "text-primary",
        ].join(" ")}
      >
        {isLate ? "Parcela em atraso" : "Próxima parcela"}
      </p>

      <div className="mt-3 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-3xl font-bold text-foreground">{formatCurrencyBRL(featured.amount)}</p>
          <p className="mt-1 text-sm text-card-beige-muted-foreground">
            {featured.contractLabel} · parcela {featured.installmentNumber}
          </p>
        </div>

        <div className="text-right">
          <p className="text-sm font-semibold text-foreground">
            {featured.dueDate ? formatDate(featured.dueDate) : "Sem vencimento"}
          </p>
          {days !== null ? (
            <p className={["text-xs font-bold uppercase", isLate ? "text-destructive" : "text-card-beige-muted-foreground"].join(" ")}>
              {isLate ? `${Math.abs(days)} dias em atraso` : `em ${days} ${days === 1 ? "dia" : "dias"}`}
            </p>
          ) : null}
          <p className="mt-1 text-xs font-medium text-card-beige-muted-foreground">
            {installmentStatusLabel(isLate ? "overdue" : featured.status)}
          </p>
        </div>
      </div>

      {featured.clientId ? (
        <Link
          href={`/consorcios/contratos/${featured.contractId}`}
          className="mt-3 inline-block text-xs font-semibold text-primary hover:underline"
        >
          Abrir contrato →
        </Link>
      ) : null}
    </div>
  );
}
