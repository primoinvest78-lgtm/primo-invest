import { BackLink } from "@/components/ui/back-link";
import { AccountsView } from "@/components/wealth/accounts-view";
import { listClients } from "@/lib/data/clients";
import { getAccountsDetail } from "@/lib/data/wealth";
import { requireActiveMembership } from "@/lib/supabase/session";

export default async function ContasPage() {
  const { organizationId } = await requireActiveMembership();
  const [accounts, clients] = await Promise.all([
    getAccountsDetail(organizationId),
    listClients(organizationId),
  ]);

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-4 block-navy-3d rounded-2xl p-5 md:flex-row md:items-end md:justify-between md:p-6">
        <div className="min-w-0">
          <p className="text-label font-bold uppercase text-primary">Patrimônio</p>
          <h1 className="mt-2 text-h1 font-bold tracking-[-0.04em] text-secondary-foreground">
            Contas
          </h1>
          <p className="mt-2 max-w-2xl text-body text-secondary-foreground/75">
            Consolidação de contas — {accounts.length} {accounts.length === 1 ? "conta" : "contas"} de
            clientes.
          </p>
        </div>

        <BackLink href="/patrimonio" label="Voltar a Patrimônio" />
      </section>

      {accounts.length === 0 ? (
        <div className="card-premium rounded-2xl p-8 text-center">
          <p className="text-body-sm text-card-beige-muted-foreground">
            Nenhuma conta cadastrada.
          </p>
        </div>
      ) : (
        <AccountsView
          accounts={accounts}
          clients={clients.map((c) => ({ id: c.id, fullName: c.fullName }))}
        />
      )}
    </div>
  );
}
