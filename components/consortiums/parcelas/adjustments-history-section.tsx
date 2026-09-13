import Link from "next/link";

import type { InstallmentAdjustmentEvent } from "@/lib/data/consortiums";
import { formatCurrencyBRL, formatDate, formatDateTime } from "@/lib/utils/format";

function AdjustmentRow({ event }: { event: InstallmentAdjustmentEvent }) {
  const meta = event.metadata ?? {};
  const isAdjustment = event.eventType === "adjustment";

  return (
    <div className="rounded-xl border border-black/10 bg-black/5 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-semibold text-foreground">
          {isAdjustment ? "Reajuste de valor" : "Negociação"} · {event.contractLabel}
          {typeof meta.installmentNumber === "number" ? ` · parcela ${meta.installmentNumber}` : ""}
        </p>
        <p className="text-xs font-medium text-card-beige-muted-foreground">{formatDateTime(event.createdAt)}</p>
      </div>

      {isAdjustment ? (
        <p className="mt-1 text-sm text-card-beige-muted-foreground">
          {typeof meta.previousAmount === "number" ? formatCurrencyBRL(meta.previousAmount) : "—"} →{" "}
          <span className="font-semibold text-foreground">
            {typeof meta.newAmount === "number" ? formatCurrencyBRL(meta.newAmount) : "—"}
          </span>
          {typeof meta.reason === "string" && meta.reason ? ` · ${meta.reason}` : ""}
          {typeof meta.contractualReference === "string" && meta.contractualReference
            ? ` · ref: ${meta.contractualReference}`
            : ""}
        </p>
      ) : (
        <p className="mt-1 text-sm text-card-beige-muted-foreground">
          {typeof meta.previousDueDate === "string" ? formatDate(meta.previousDueDate) : "—"} →{" "}
          <span className="font-semibold text-foreground">
            {typeof meta.newDueDate === "string" ? formatDate(meta.newDueDate) : "—"}
          </span>
          {typeof meta.condition === "string" && meta.condition ? ` · ${meta.condition}` : ""}
          {typeof meta.responsibleName === "string" && meta.responsibleName
            ? ` · responsável: ${meta.responsibleName}`
            : ""}
        </p>
      )}

      <Link
        href={`/consorcios/contratos/${event.contractId}`}
        className="mt-2 inline-block text-xs font-semibold text-primary hover:underline"
      >
        Abrir contrato →
      </Link>
    </div>
  );
}

export function AdjustmentsHistorySection({ events }: { events: InstallmentAdjustmentEvent[] }) {
  if (events.length === 0) return null;

  return (
    <div className="card-premium rounded-2xl p-5 md:p-6">
      <h3 className="mb-1 text-h2 font-bold text-foreground">Reajustes e negociações</h3>
      <p className="mb-4 text-sm text-card-beige-muted-foreground">
        Histórico preservado — a condição original de cada parcela fica registrada aqui, mesmo depois
        da alteração.
      </p>
      <div className="space-y-2">
        {events.slice(0, 10).map((event) => (
          <AdjustmentRow key={event.id} event={event} />
        ))}
      </div>
    </div>
  );
}
