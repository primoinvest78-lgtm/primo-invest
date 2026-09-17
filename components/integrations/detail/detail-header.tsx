import type { IntegrationRow } from "@/lib/data/integrations";
import {
  ENVIRONMENT_LABEL,
  INTEGRATION_CATEGORY_LABEL,
  SYNC_FREQUENCY_LABEL,
  type Environment,
  type IntegrationCategory,
  type SyncFrequency,
  integrationStatusLabel,
} from "@/lib/integrations/catalog";
import { formatDateTime } from "@/lib/utils/format";

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <dt className="text-label font-bold uppercase text-card-beige-muted-foreground">{label}</dt>
      <dd className="mt-1 truncate text-body-sm font-semibold text-foreground">{value}</dd>
    </div>
  );
}

/**
 * Status da conexão + configuração — nunca mostra credencial. O único
 * dado sobre credencial é o sinalizador booleano "Credenciais
 * configuradas por fora" — nunca um valor de token/senha, porque este
 * nunca é gravado em lugar nenhum do sistema.
 */
export function DetailHeader({ integration }: { integration: IntegrationRow }) {
  return (
    <section className="card-premium rounded-2xl p-5 md:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-label font-bold uppercase text-primary">
            {INTEGRATION_CATEGORY_LABEL[integration.category as IntegrationCategory] ?? integration.category}
          </p>
          <h2 className="mt-1 text-h2 font-bold text-foreground">{integration.name}</h2>
          <p className="mt-1 text-body-sm text-card-beige-muted-foreground">{integration.description}</p>
        </div>
        <span className="shrink-0 rounded-full border border-border px-3 py-1 text-caption font-bold uppercase text-card-beige-muted-foreground">
          {integrationStatusLabel(integration.status)}
        </span>
      </div>

      {!integration.available ? (
        <p className="mt-4 rounded-xl border border-dashed border-border px-4 py-3 text-body-sm text-card-beige-muted-foreground">
          Disponível para configuração futura — nenhum conector real está implementado para este item do
          catálogo ainda. O cadastro abaixo é administrativo (planejamento e governança); nenhuma
          sincronização de dados de verdade acontece hoje.
        </p>
      ) : null}

      <dl className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4">
        <Field
          label="Ambiente"
          value={integration.environment ? ENVIRONMENT_LABEL[integration.environment as Environment] : "—"}
        />
        <Field label="Frequência" value={SYNC_FREQUENCY_LABEL[integration.syncFrequency as SyncFrequency] ?? "—"} />
        <Field label="Credenciais" value={integration.hasCredentials ? "Configuradas por fora" : "Não configuradas"} />
        <Field label="Responsável" value={integration.responsibleName ?? "—"} />
        <Field label="Última execução" value={integration.lastSyncedAt ? formatDateTime(integration.lastSyncedAt) : "—"} />
        <Field label="Próxima execução" value={integration.nextSyncAt ? formatDateTime(integration.nextSyncAt) : "—"} />
        <Field
          label="Ativada em"
          value={integration.activatedAt ? formatDateTime(integration.activatedAt) : "—"}
        />
        <Field label="Ativada por" value={integration.activatedByName ?? "—"} />
        <Field label="Registros sincronizados" value={String(integration.recordsSyncedTotal)} />
        <Field label="Execuções com erro" value={String(integration.errorRunCount)} />
      </dl>
    </section>
  );
}
