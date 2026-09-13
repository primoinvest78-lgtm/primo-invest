import Link from "next/link";
import { notFound } from "next/navigation";

import { BackLink } from "@/components/ui/back-link";
import { Badge } from "@/components/ui/badge";
import { AccountDeleteDialog } from "@/components/wealth/account-delete-dialog";
import { AccountEditDialog } from "@/components/wealth/account-edit-dialog";
import { AccountHoldingsTable } from "@/components/wealth/account-holdings-table";
import { AccountMovementsTable } from "@/components/wealth/account-movements-table";
import { AnimatedNumber } from "@/components/ui/animated-number";
import { WealthEvolutionSection } from "@/components/wealth/wealth-evolution-section";
import { listClients } from "@/lib/data/clients";
import {
  getAccountDetail,
  getAccountHistory,
  getAccountMovements,
} from "@/lib/data/wealth";
import { requireActiveMembership } from "@/lib/supabase/session";
import { computeAccountBalances, maskAccountId } from "@/lib/utils/account-helpers";
import { formatCurrencyBRL, formatDate } from "@/lib/utils/format";

function InfoField({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div>
      <p className="text-label font-bold uppercase text-secondary-foreground/60">{label}</p>
      <p className="mt-1 text-sm font-medium text-secondary-foreground">{value ?? "—"}</p>
    </div>
  );
}

function Kpi({ label, value }: { label: string; value: string }) {
  return (
    <div className="card-premium rounded-2xl p-4">
      <p className="text-label font-bold uppercase text-card-beige-muted-foreground">{label}</p>
      <p className="mt-2 text-lg font-bold text-foreground">
        <AnimatedNumber value={value} />
      </p>
    </div>
  );
}

export default async function AccountDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { organizationId } = await requireActiveMembership();
  const account = await getAccountDetail(organizationId, id);

  if (!account) {
    notFound();
  }

  const [movements, history, clients] = await Promise.all([
    getAccountMovements(organizationId, id),
    getAccountHistory(organizationId, id),
    listClients(organizationId),
  ]);

  const { balance, investedBalance, liquidBalance } = computeAccountBalances(account);
  const relatedClient = account.clientId ? clients.find((c) => c.id === account.clientId) : null;

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-4 block-navy-3d rounded-2xl p-5 md:flex-row md:items-end md:justify-between md:p-6">
        <div className="min-w-0">
          <p className="text-label font-bold uppercase text-primary">
            Contas · {account.institutionName ?? "—"}
          </p>
          <h1 className="mt-2 text-h1 font-bold tracking-[-0.04em] text-secondary-foreground">
            {account.accountName ?? "Conta"}
          </h1>
          <div className="mt-3 grid grid-cols-2 gap-4 sm:grid-cols-4">
            <InfoField label="Titular" value={account.clientName} />
            <InfoField label="Tipo" value={account.accountType} />
            <InfoField label="Identificação" value={maskAccountId(account.id)} />
            <InfoField label="Atualizada em" value={formatDate(account.updatedAt)} />
          </div>
        </div>

        <div className="flex shrink-0 flex-col items-end gap-3">
          <BackLink href="/patrimonio/contas" label="Voltar a Contas" />
          <div className="flex items-center gap-3">
            <Badge variant={account.status === "active" ? "default" : "outline"}>
              {account.status === "active" ? "Ativa" : "Inativa"}
            </Badge>
            <div className="flex items-center gap-2 rounded-lg bg-white/10 px-2 py-1">
              <AccountEditDialog account={account} clients={clients.map((c) => ({ id: c.id, fullName: c.fullName }))} />
              <AccountDeleteDialog account={account} />
            </div>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Kpi label="Saldo" value={formatCurrencyBRL(balance)} />
        <Kpi label="Liquidez" value={formatCurrencyBRL(liquidBalance)} />
        <Kpi label="Valor investido" value={formatCurrencyBRL(investedBalance)} />
        <Kpi
          label="Patrimônio relacionado (cliente)"
          value={relatedClient ? formatCurrencyBRL(relatedClient.netWorth) : "—"}
        />
      </div>

      {account.clientId ? (
        <div className="card-premium flex flex-wrap items-center justify-between gap-3 rounded-2xl p-4">
          <p className="text-sm text-card-beige-muted-foreground">
            Cliente vinculado: <span className="font-semibold text-foreground">{account.clientName}</span>
          </p>
          <Link
            href={`/clientes/${account.clientId}`}
            className="text-sm font-semibold text-primary hover:underline"
          >
            Abrir perfil do cliente →
          </Link>
        </div>
      ) : null}

      <div>
        <h3 className="mb-3 text-h2 font-bold text-foreground">Investimentos vinculados</h3>
        <AccountHoldingsTable holdings={account.holdings} />
      </div>

      <WealthEvolutionSection
        history={history}
        title="Evolução do saldo"
        emptyMessage="Sem transações suficientes registradas pra montar a evolução do saldo dessa conta."
      />

      <div>
        <h3 className="mb-3 text-h2 font-bold text-foreground">Movimentações</h3>
        <AccountMovementsTable movements={movements} />
      </div>
    </div>
  );
}
