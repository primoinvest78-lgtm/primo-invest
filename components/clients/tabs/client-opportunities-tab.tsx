import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import type { ClientProfile } from "@/lib/data/clients";
import { formatCurrencyBRL, formatDate } from "@/lib/utils/format";

export function ClientOpportunitiesTab({ client }: { client: ClientProfile }) {
  if (client.opportunities.length === 0) {
    return (
      <div className="card-premium rounded-2xl p-8 text-center">
        <p className="text-body-sm text-card-beige-muted-foreground">
          Nenhuma oportunidade vinculada a este cliente.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {client.opportunities.map((opp) => (
        <Link
          key={opp.id}
          href={`/oportunidades/${opp.id}`}
          className="card-premium flex items-center justify-between gap-3 rounded-xl p-4 transition-all duration-200 hover:-translate-y-0.5"
        >
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-foreground">{opp.title}</p>
            <p className="text-xs font-medium uppercase text-card-beige-muted-foreground">
              {opp.opportunity_type ?? "—"}
              {opp.expected_close_date ? ` · ${formatDate(opp.expected_close_date)}` : ""}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-3">
            <span className="text-sm font-bold text-foreground">
              {formatCurrencyBRL(opp.estimated_value)}
            </span>
            <Badge variant="outline">{opp.opportunity_stages?.name ?? opp.status}</Badge>
          </div>
        </Link>
      ))}
    </div>
  );
}
