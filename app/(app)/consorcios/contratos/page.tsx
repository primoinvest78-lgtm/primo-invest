import { BackLink } from "@/components/ui/back-link";
import { ContractsView } from "@/components/consortiums/contracts-view";
import { listClients } from "@/lib/data/clients";
import { getConsortiumContracts } from "@/lib/data/consortiums";
import { requireActiveMembership } from "@/lib/supabase/session";

export default async function ContratosPage() {
  const { organizationId } = await requireActiveMembership();
  const [contracts, clients] = await Promise.all([
    getConsortiumContracts(organizationId),
    listClients(organizationId),
  ]);

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-4 block-navy-3d rounded-2xl p-5 md:flex-row md:items-end md:justify-between md:p-6">
        <div className="min-w-0">
          <p className="text-label font-bold uppercase text-primary">Consórcios</p>
          <h1 className="mt-2 text-h1 font-bold tracking-[-0.04em] text-secondary-foreground">
            Contratos
          </h1>
          <p className="mt-2 max-w-2xl text-body text-secondary-foreground/75">
            Registro central da operação — {contracts.length}{" "}
            {contracts.length === 1 ? "contrato" : "contratos"}.
          </p>
        </div>
        <BackLink href="/consorcios" label="Voltar a Consórcios" />
      </section>

      {contracts.length === 0 ? (
        <div className="card-premium rounded-2xl p-8 text-center">
          <p className="text-body-sm text-card-beige-muted-foreground">Nenhum contrato cadastrado.</p>
        </div>
      ) : (
        <ContractsView contracts={contracts} clients={clients.map((c) => ({ id: c.id, fullName: c.fullName }))} />
      )}
    </div>
  );
}
