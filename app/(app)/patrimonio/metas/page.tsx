import { BackLink } from "@/components/ui/back-link";
import { GoalsView } from "@/components/wealth/goals-view";
import { listClients } from "@/lib/data/clients";
import { getGoalsDetail } from "@/lib/data/wealth";
import { requireActiveMembership } from "@/lib/supabase/session";

export default async function MetasPage() {
  const { organizationId } = await requireActiveMembership();
  const [goals, clients] = await Promise.all([
    getGoalsDetail(organizationId),
    listClients(organizationId),
  ]);

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-4 block-navy-3d rounded-2xl p-5 md:flex-row md:items-end md:justify-between md:p-6">
        <div className="min-w-0">
          <p className="text-label font-bold uppercase text-primary">Patrimônio</p>
          <h1 className="mt-2 text-h1 font-bold tracking-[-0.04em] text-secondary-foreground">
            Metas Financeiras
          </h1>
          <p className="mt-2 max-w-2xl text-body text-secondary-foreground/75">
            Planejamento patrimonial — {goals.length} {goals.length === 1 ? "meta" : "metas"}{" "}
            cadastradas.
          </p>
        </div>

        <BackLink href="/patrimonio" label="Voltar a Patrimônio" />
      </section>

      {goals.length === 0 ? (
        <div className="card-premium rounded-2xl p-8 text-center">
          <p className="text-body-sm text-card-beige-muted-foreground">Nenhuma meta cadastrada.</p>
        </div>
      ) : (
        <GoalsView goals={goals} clients={clients.map((c) => ({ id: c.id, fullName: c.fullName }))} />
      )}
    </div>
  );
}
