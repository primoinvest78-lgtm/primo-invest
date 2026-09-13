import { AlertTriangle } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import type { ClientProfile } from "@/lib/data/clients";
import { formatDate } from "@/lib/utils/format";

export function RiskProfileTab({ client }: { client: ClientProfile }) {
  const sorted = [...client.client_risk_profiles].sort((a, b) =>
    a.valid_from < b.valid_from ? 1 : -1,
  );
  const current = sorted[0];
  const history = sorted.slice(1);
  const today = new Date().toISOString().slice(0, 10);
  const isExpired = current?.valid_until ? current.valid_until < today : false;

  if (!current) {
    return (
      <div className="card-premium rounded-2xl p-8 text-center">
        <p className="text-body-sm text-card-beige-muted-foreground">
          Nenhuma avaliação de suitability registrada para este cliente ainda.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div
        className={[
          "rounded-2xl border p-5 md:p-6",
          isExpired ? "border-destructive/40 bg-destructive/5" : "card-premium",
        ].join(" ")}
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-label font-bold uppercase text-card-beige-muted-foreground">
              Perfil vigente
            </p>
            <h3 className="mt-1 text-h2 font-bold text-foreground">{current.risk_tolerance}</h3>
          </div>
          <Badge variant={isExpired ? "destructive" : "default"}>
            {isExpired ? "Vencido" : "Vigente"}
          </Badge>
        </div>

        {isExpired ? (
          <div className="mt-4 flex items-start gap-2 rounded-xl border border-destructive/30 bg-destructive/10 px-3.5 py-3 text-sm font-medium text-destructive">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>
              Avaliação vencida em {formatDate(current.valid_until)}. É necessário reavaliar o
              perfil de suitability deste cliente antes de novas recomendações de investimento.
            </span>
          </div>
        ) : null}

        <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <p className="text-label font-bold uppercase text-card-beige-muted-foreground">Objetivo</p>
            <p className="mt-1 text-sm font-medium text-foreground">
              {current.investment_objective}
            </p>
          </div>
          <div>
            <p className="text-label font-bold uppercase text-card-beige-muted-foreground">Horizonte</p>
            <p className="mt-1 text-sm font-medium text-foreground">
              {current.investment_horizon}
            </p>
          </div>
          <div>
            <p className="text-label font-bold uppercase text-card-beige-muted-foreground">Score</p>
            <p className="mt-1 text-sm font-medium text-foreground">{current.score ?? "—"}</p>
          </div>
        </div>

        <p className="mt-4 text-xs font-medium text-card-beige-muted-foreground">
          Válido de {formatDate(current.valid_from)}
          {current.valid_until ? ` até ${formatDate(current.valid_until)}` : " (sem prazo definido)"}
        </p>
      </div>

      <div className="card-premium rounded-2xl p-5 md:p-6">
        <h3 className="mb-4 text-h2 font-bold text-foreground">Histórico de avaliações</h3>
        {history.length === 0 ? (
          <p className="text-body-sm text-card-beige-muted-foreground">
            Esta é a primeira avaliação registrada — sem histórico anterior.
          </p>
        ) : (
          <div className="space-y-2">
            {history.map((item) => (
              <div
                key={item.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border bg-muted/60 px-3.5 py-3"
              >
                <div>
                  <p className="text-sm font-semibold text-foreground">{item.risk_tolerance}</p>
                  <p className="text-xs font-medium text-card-beige-muted-foreground">
                    {item.investment_objective} · {item.investment_horizon}
                  </p>
                </div>
                <p className="text-xs font-medium text-card-beige-muted-foreground">
                  {formatDate(item.valid_from)}
                  {item.valid_until ? ` – ${formatDate(item.valid_until)}` : ""}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
