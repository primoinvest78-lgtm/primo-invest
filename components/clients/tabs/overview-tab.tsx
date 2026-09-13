import { AlertTriangle, Info, TriangleAlert } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { ScrollReveal } from "@/components/motion/scroll-reveal";
import { AnimatedNumber } from "@/components/ui/animated-number";
import { AllocationPieChart } from "@/components/wealth/allocation-pie-chart";
import { TopClientsBarChart } from "@/components/wealth/top-clients-bar-chart";
import { WealthLineChart } from "@/components/wealth/wealth-line-chart";
import type { ClientProfile, WealthHistoryPoint } from "@/lib/data/clients";
import { computeClientAlerts, isTaskOverdue } from "@/lib/utils/client-alerts";
import { formatCurrencyBRL, formatDate } from "@/lib/utils/format";

const LIQUID_KEYWORDS = ["corrente", "poupança", "poupanca", "checking", "savings", "caixa", "cash"];

const ALERT_ICON = { danger: AlertTriangle, warning: TriangleAlert, info: Info };
const ALERT_STYLE = {
  danger: "border-destructive/40 bg-destructive/10 text-destructive",
  warning: "border-warning/40 bg-warning/10 text-warning",
  info: "border-accent/30 bg-accent/10 text-accent",
};

function Kpi({
  label,
  value,
  valueClassName,
  animate = false,
}: {
  label: string;
  value: string;
  valueClassName?: string;
  animate?: boolean;
}) {
  return (
    <div className="card-premium rounded-2xl p-4 transition-all duration-200 hover:-translate-y-0.5">
      <p className="truncate text-label font-bold uppercase text-card-beige-muted-foreground">
        {label}
      </p>
      <p className={["mt-2 truncate text-lg font-bold", valueClassName ?? "text-foreground"].join(" ")}>
        {animate ? <AnimatedNumber value={value} /> : value}
      </p>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div>
      <p className="text-label font-bold uppercase text-card-beige-muted-foreground">{label}</p>
      <p className="mt-1 text-sm font-medium text-foreground">{value ?? "—"}</p>
    </div>
  );
}

export function OverviewTab({
  client,
  wealthHistory,
}: {
  client: ClientProfile;
  wealthHistory: WealthHistoryPoint[];
}) {
  const holdingsFlat = client.financial_accounts.flatMap((account) =>
    account.holdings.map((h) => ({ ...h, accountType: account.account_type })),
  );

  const investmentsTotal = holdingsFlat.reduce((s, h) => s + Number(h.valuation ?? 0), 0);
  const liquidTotal = holdingsFlat
    .filter((h) => LIQUID_KEYWORDS.some((k) => h.accountType?.toLowerCase().includes(k)))
    .reduce((s, h) => s + Number(h.valuation ?? 0), 0);
  const consortiumTotal = client.consortium_contracts
    .filter((c) => c.status === "active")
    .reduce((s, c) => s + Number(c.credit_amount ?? 0), 0);
  const liabilitiesTotal = client.liabilities
    .filter((l) => l.status === "active")
    .reduce((s, l) => s + Number(l.outstanding_amount ?? 0), 0);
  const totalWealth = investmentsTotal + consortiumTotal - liabilitiesTotal;

  const activeGoals = client.wealth_goals.filter((g) => g.status === "active").length;
  const openOpportunities = client.opportunities.filter(
    (o) => o.status !== "won" && o.status !== "lost",
  ).length;
  const pendingTasks = client.tasks.filter((t) => t.status !== "completed" && t.status !== "cancelled");
  const overdueTasks = pendingTasks.filter((t) => isTaskOverdue(t.due_at)).length;

  const lastInteraction = [...client.interactions].sort((a, b) =>
    b.occurred_at.localeCompare(a.occurred_at),
  )[0];
  const nextTask = [...pendingTasks]
    .filter((t) => t.due_at)
    .sort((a, b) => (a.due_at ?? "").localeCompare(b.due_at ?? ""))[0];

  const alerts = computeClientAlerts(client);

  const allocationMap = new Map<string, number>();
  for (const h of holdingsFlat) {
    const type = h.investment_products?.product_type ?? "Outros";
    allocationMap.set(type, (allocationMap.get(type) ?? 0) + Number(h.valuation ?? 0));
  }
  const allocation = Array.from(allocationMap.entries()).map(([productType, value]) => ({
    productType,
    value,
  }));

  const topAssets = [...holdingsFlat]
    .filter((h) => h.valuation)
    .sort((a, b) => Number(b.valuation) - Number(a.valuation))
    .slice(0, 6)
    .map((h) => ({ name: h.investment_products?.name ?? "Ativo", total: Number(h.valuation) }));

  const primaryAddress =
    client.client_addresses.find((a) => a.is_primary) ?? client.client_addresses[0];

  return (
    <div className="space-y-5">
      {/* KPIs — painel 360º */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        <Kpi label="Patrimônio total" value={formatCurrencyBRL(totalWealth)} animate />
        <Kpi label="Investimentos" value={formatCurrencyBRL(investmentsTotal)} animate />
        <Kpi label="Liquidez" value={formatCurrencyBRL(liquidTotal)} animate />
        <Kpi
          label="Passivos"
          value={formatCurrencyBRL(liabilitiesTotal)}
          valueClassName="text-destructive"
          animate
        />
        <Kpi label="Consórcios" value={formatCurrencyBRL(consortiumTotal)} animate />
        <Kpi label="Metas ativas" value={String(activeGoals)} animate />
        <Kpi label="Oportunidades" value={String(openOpportunities)} animate />
        <Kpi
          label="Tarefas pendentes"
          value={String(pendingTasks.length)}
          valueClassName={overdueTasks > 0 ? "text-destructive" : "text-foreground"}
          animate
        />
        <Kpi
          label="Último contato"
          value={lastInteraction ? formatDate(lastInteraction.occurred_at) : "—"}
        />
        <Kpi label="Próximo contato" value={nextTask ? formatDate(nextTask.due_at) : "—"} />
      </div>

      {/* Alertas */}
      {alerts.length > 0 ? (
        <div className="card-premium rounded-2xl p-5 md:p-6">
          <h3 className="mb-3 text-h2 font-bold text-foreground">Alertas</h3>
          <div className="space-y-2">
            {alerts.map((alert) => {
              const Icon = ALERT_ICON[alert.severity];
              return (
                <div
                  key={alert.id}
                  className={[
                    "flex items-start gap-2 rounded-xl border px-3.5 py-2.5 text-sm font-medium",
                    ALERT_STYLE[alert.severity],
                  ].join(" ")}
                >
                  <Icon className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>{alert.message}</span>
                </div>
              );
            })}
          </div>
        </div>
      ) : null}

      {/* Evolução patrimonial + Composição */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <ScrollReveal className="card-premium rounded-2xl p-5 md:p-6">
          <h3 className="mb-4 text-h2 font-bold text-foreground">Evolução patrimonial</h3>
          {wealthHistory.length === 0 ? (
            <p className="text-body-sm text-card-beige-muted-foreground">
              Sem transações suficientes registradas pra montar a evolução ao longo do tempo.
            </p>
          ) : (
            <WealthLineChart data={wealthHistory} />
          )}
        </ScrollReveal>

        <ScrollReveal delay={0.1} className="card-premium rounded-2xl p-5 md:p-6">
          <h3 className="mb-4 text-h2 font-bold text-foreground">Composição patrimonial</h3>
          {allocation.length === 0 ? (
            <p className="text-body-sm text-card-beige-muted-foreground">
              Sem posições suficientes pra montar a composição.
            </p>
          ) : (
            <AllocationPieChart data={allocation} />
          )}
        </ScrollReveal>
      </div>

      {/* Ranking de ativos */}
      {topAssets.length > 0 ? (
        <ScrollReveal className="card-premium rounded-2xl p-5 md:p-6">
          <h3 className="mb-4 text-h2 font-bold text-foreground">Principais ativos</h3>
          <TopClientsBarChart data={topAssets} />
        </ScrollReveal>
      ) : null}

      {/* Dados cadastrais */}
      <div className="card-premium rounded-2xl p-5 md:p-6">
        <h3 className="mb-4 text-h2 font-bold text-foreground">Dados cadastrais</h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Field label="Nome completo" value={client.full_name} />
          <Field label="Nome preferido" value={client.preferred_name} />
          <Field label="Documento" value={client.document_number} />
          <Field label="Nascimento" value={formatDate(client.birth_date)} />
          <Field label="Status" value={client.status} />
          <Field
            label="Endereço principal"
            value={
              primaryAddress
                ? [primaryAddress.street, primaryAddress.number, primaryAddress.city, primaryAddress.state]
                    .filter(Boolean)
                    .join(", ")
                : null
            }
          />
        </div>
      </div>

      {/* Contatos */}
      <div className="card-premium rounded-2xl p-5 md:p-6">
        <h3 className="mb-4 text-h2 font-bold text-foreground">Contatos</h3>
        {client.client_contacts.length === 0 ? (
          <p className="text-body-sm text-card-beige-muted-foreground">Nenhum contato cadastrado.</p>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {client.client_contacts.map((contact) => (
              <div
                key={contact.id}
                className="flex items-center justify-between rounded-xl border border-black/10 bg-black/5 px-3.5 py-3"
              >
                <div>
                  <p className="text-label font-bold uppercase text-card-beige-muted-foreground">
                    {contact.contact_type}
                  </p>
                  <p className="mt-0.5 text-sm font-medium text-foreground">{contact.value}</p>
                </div>
                {contact.is_primary ? <Badge>Principal</Badge> : null}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Tags */}
      <div className="card-premium rounded-2xl p-5 md:p-6">
        <h3 className="mb-4 text-h2 font-bold text-foreground">Tags</h3>
        <div className="flex flex-wrap gap-2">
          {client.client_tags.length === 0 ? (
            <p className="text-body-sm text-card-beige-muted-foreground">Nenhuma tag associada.</p>
          ) : (
            client.client_tags.map((ct) =>
              ct.tags ? (
                <Badge key={ct.tags.id} variant="outline">
                  {ct.tags.name}
                </Badge>
              ) : null,
            )
          )}
        </div>
      </div>
    </div>
  );
}
