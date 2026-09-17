import { EvidenceQueue } from "@/components/payments/evidence-queue";
import { PaymentsAccessGate } from "@/components/payments/payments-access-gate";
import { PaymentsCharts } from "@/components/payments/payments-charts";
import { PaymentsKpis } from "@/components/payments/payments-kpis";
import { UploadEvidenceDialog } from "@/components/payments/upload-evidence-dialog";
import { getPaymentDashboardData, listMatchableClients, listMatchableInstallments, listPaymentEvidences } from "@/lib/data/payments";
import { canAccessPayments } from "@/lib/payments/permissions";
import { requireActiveMembership } from "@/lib/supabase/session";

/**
 * Payment Intelligence Engine — recebimento, classificação, extração
 * (manual hoje — ver lib/payments/extraction.ts), identificação,
 * matching, score de confiança e conciliação de comprovantes.
 *
 * Reaproveita Clientes, Consórcios, Parcelas, Documentos/Cofre Digital
 * e Auditoria já existentes — nenhum banco ou armazenamento paralelo.
 */
export default async function PagamentosPage() {
  const { organizationId, role } = await requireActiveMembership();

  if (!canAccessPayments(role)) {
    return (
      <div className="space-y-6">
        <Header />
        <PaymentsAccessGate />
      </div>
    );
  }

  const [dashboardData, evidences, clients, installments] = await Promise.all([
    getPaymentDashboardData(organizationId),
    listPaymentEvidences(organizationId),
    listMatchableClients(organizationId),
    listMatchableInstallments(organizationId),
  ]);

  return (
    <div className="space-y-6">
      <Header organizationId={organizationId} clientNames={clients.map((c) => c.fullName)} />

      <PaymentsKpis data={dashboardData} />

      <PaymentsCharts data={dashboardData} />

      <EvidenceQueue evidences={evidences} clients={clients} installments={installments} />
    </div>
  );
}

function Header({ organizationId, clientNames }: { organizationId?: string; clientNames?: string[] }) {
  return (
    <section className="flex flex-col gap-4 block-navy-3d rounded-2xl p-5 md:flex-row md:items-end md:justify-between md:p-6">
      <div className="min-w-0">
        <p className="text-label font-bold uppercase text-primary">Pagamentos</p>
        <h1 className="mt-2 text-h1 font-bold tracking-[-0.04em] text-secondary-foreground">
          Payment Intelligence Engine
        </h1>
        <p className="mt-2 max-w-2xl text-body text-secondary-foreground/75">
          Recebimento, identificação, matching e conciliação de comprovantes — cada baixa rastreável até
          o comprovante e o critério que a gerou.
        </p>
      </div>
      {organizationId ? <UploadEvidenceDialog organizationId={organizationId} clientNames={clientNames ?? []} /> : null}
    </section>
  );
}
