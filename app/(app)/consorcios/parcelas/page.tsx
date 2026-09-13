import { BackLink } from "@/components/ui/back-link";
import { ParcelasView } from "@/components/consortiums/parcelas/parcelas-view";
import {
  getConsortiumAdjustmentEvents,
  getConsortiumContracts,
  getConsortiumInstallments,
} from "@/lib/data/consortiums";
import { requireActiveMembership } from "@/lib/supabase/session";

export default async function ParcelasPage() {
  const { organizationId } = await requireActiveMembership();
  const [installments, contracts, adjustmentEvents] = await Promise.all([
    getConsortiumInstallments(organizationId),
    getConsortiumContracts(organizationId),
    getConsortiumAdjustmentEvents(organizationId),
  ]);

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-4 block-navy-3d rounded-2xl p-5 md:flex-row md:items-end md:justify-between md:p-6">
        <div className="min-w-0">
          <p className="text-label font-bold uppercase text-primary">Consórcios</p>
          <h1 className="mt-2 text-h1 font-bold tracking-[-0.04em] text-secondary-foreground">
            Parcelas
          </h1>
          <p className="mt-2 max-w-2xl text-body text-secondary-foreground/75">
            Acompanhamento financeiro das cotas — {installments.length}{" "}
            {installments.length === 1 ? "parcela detalhada" : "parcelas detalhadas"}.
          </p>
        </div>
        <BackLink href="/consorcios" label="Voltar a Consórcios" />
      </section>

      {installments.length === 0 ? (
        <div className="card-premium rounded-2xl p-8 text-center">
          <p className="text-body-sm text-card-beige-muted-foreground">
            Nenhuma parcela individual registrada ainda. Abra um contrato em{" "}
            <strong className="text-foreground">Contratos</strong> e use a aba Parcelas pra começar o
            detalhamento — os saldos agregados de cada contrato continuam disponíveis lá até então.
          </p>
        </div>
      ) : (
        <ParcelasView installments={installments} contracts={contracts} adjustmentEvents={adjustmentEvents} />
      )}
    </div>
  );
}
