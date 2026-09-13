import type { ConsortiumEvent, ContractAuditEntry } from "@/lib/data/consortiums";
import { AUDIT_ACTION_LABEL, EVENT_TYPE_LABEL } from "@/lib/utils/consortium-helpers";
import { formatDateTime } from "@/lib/utils/format";

type TimelineEntry = {
  id: string;
  date: string;
  label: string;
  description: string | null;
  source: "event" | "audit";
};

export function ContractHistoryTab({
  events,
  auditEntries,
}: {
  events: ConsortiumEvent[];
  auditEntries: ContractAuditEntry[];
}) {
  const timeline: TimelineEntry[] = [
    ...events.map((e) => ({
      id: `event-${e.id}`,
      date: e.createdAt,
      label: EVENT_TYPE_LABEL[e.eventType] ?? e.eventType,
      description: e.description,
      source: "event" as const,
    })),
    ...auditEntries.map((a) => ({
      id: `audit-${a.id}`,
      date: a.createdAt,
      label: `${AUDIT_ACTION_LABEL[a.action] ?? a.action} (registro técnico)`,
      description: a.userId ? null : "Responsável não identificado pelo sistema.",
      source: "audit" as const,
    })),
  ].sort((a, b) => b.date.localeCompare(a.date));

  if (timeline.length === 0) {
    return (
      <div className="card-premium rounded-2xl p-8 text-center">
        <p className="text-body-sm text-card-beige-muted-foreground">
          Nenhum evento registrado ainda para este contrato.
        </p>
      </div>
    );
  }

  return (
    <div className="card-premium rounded-2xl p-5 md:p-6">
      <h3 className="mb-4 text-h2 font-bold text-foreground">Histórico do contrato</h3>
      <div className="space-y-3">
        {timeline.map((entry) => (
          <div key={entry.id} className="flex gap-3 border-l-2 border-primary/30 pl-3.5">
            <div className="flex-1">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm font-semibold text-foreground">{entry.label}</p>
                <p className="text-xs font-medium text-card-beige-muted-foreground">
                  {formatDateTime(entry.date)}
                </p>
              </div>
              {entry.description ? (
                <p className="mt-0.5 text-xs text-card-beige-muted-foreground">{entry.description}</p>
              ) : null}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
