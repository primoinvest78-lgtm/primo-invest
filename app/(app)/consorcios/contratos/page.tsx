import Link from "next/link";

import { AnimatedNumber } from "@/components/ui/animated-number";
import { Badge } from "@/components/ui/badge";
import { BackLink } from "@/components/ui/back-link";
import { getConsortiumsOverview } from "@/lib/data/consortiums";
import { requireActiveMembership } from "@/lib/supabase/session";
import { formatCurrencyBRL, formatDate } from "@/lib/utils/format";

const STATUS_LABEL: Record<string, string> = {
  active: "Ativo",
  contemplated: "Contemplado",
  cancelled: "Cancelado",
  completed: "Concluído",
};

const STATUS_VARIANT: Record<string, "default" | "destructive" | "outline"> = {
  active: "default",
  contemplated: "default",
  cancelled: "destructive",
  completed: "outline",
};

export default async function ContratosPage() {
  const { organizationId } = await requireActiveMembership();
  const overview = await getConsortiumsOverview(organizationId);

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-4 block-navy-3d rounded-2xl p-5 md:flex-row md:items-end md:justify-between md:p-6">
        <div className="min-w-0">
          <p className="text-label font-bold uppercase text-primary">Consórcios</p>
          <h1 className="mt-2 text-h1 font-bold tracking-[-0.04em] text-secondary-foreground">
            Contratos
          </h1>
          <p className="mt-2 max-w-2xl text-body text-secondary-foreground/75">
            Detalhamento de contratos por status, valor e maturidade financeira.
          </p>
        </div>
        <BackLink href="/consorcios" label="Voltar a Consórcios" />
      </section>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="card-premium rounded-2xl p-4">
          <p className="text-label font-bold uppercase text-card-beige-muted-foreground">Ativos</p>
          <h2 className="mt-3 text-3xl font-bold text-foreground">
            <AnimatedNumber value={String(overview.activeCount)} />
          </h2>
        </div>
        <div className="card-premium rounded-2xl p-4">
          <p className="text-label font-bold uppercase text-card-beige-muted-foreground">Crédito total</p>
          <h2 className="mt-3 text-3xl font-bold text-foreground">
            <AnimatedNumber value={formatCurrencyBRL(overview.totalCreditAmount)} />
          </h2>
        </div>
        <div className="card-premium rounded-2xl p-4">
          <p className="text-label font-bold uppercase text-card-beige-muted-foreground">Prazo médio</p>
          <h2 className="mt-3 text-3xl font-bold text-foreground">
            {overview.avgTermMonths !== null ? `${overview.avgTermMonths} meses` : "—"}
          </h2>
        </div>
      </div>

      <div className="card-premium overflow-hidden rounded-2xl">
        {overview.contracts.length === 0 ? (
          <p className="p-8 text-center text-body-sm text-card-beige-muted-foreground">
            Nenhum contrato cadastrado.
          </p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-black/10 bg-black/5 text-left">
                <th className="px-4 py-3 text-label font-bold uppercase text-card-beige-muted-foreground">
                  Contrato
                </th>
                <th className="px-4 py-3 text-label font-bold uppercase text-card-beige-muted-foreground">
                  Cliente
                </th>
                <th className="px-4 py-3 text-label font-bold uppercase text-card-beige-muted-foreground">
                  Tipo
                </th>
                <th className="px-4 py-3 text-label font-bold uppercase text-card-beige-muted-foreground">
                  Crédito
                </th>
                <th className="px-4 py-3 text-label font-bold uppercase text-card-beige-muted-foreground">
                  Parcelas
                </th>
                <th className="px-4 py-3 text-label font-bold uppercase text-card-beige-muted-foreground">
                  Início
                </th>
                <th className="px-4 py-3 text-label font-bold uppercase text-card-beige-muted-foreground">
                  Status
                </th>
              </tr>
            </thead>
            <tbody>
              {overview.contracts.map((contract) => (
                <tr
                  key={contract.id}
                  className="border-b border-black/10 border-l-2 border-l-transparent last:border-b-0 transition-all duration-200 hover:border-l-primary hover:bg-black/5"
                >
                  <td className="px-4 py-3 font-semibold text-foreground">
                    {contract.administratorName ?? "—"} · {contract.contractNumber ?? "—"}
                  </td>
                  <td className="px-4 py-3">
                    {contract.clientId ? (
                      <Link href={`/clientes/${contract.clientId}`} className="text-accent hover:underline">
                        {contract.clientName}
                      </Link>
                    ) : (
                      <span className="text-card-beige-muted-foreground">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-card-beige-muted-foreground">
                    {contract.consortiumType ?? "—"}
                  </td>
                  <td className="px-4 py-3 font-semibold text-foreground">
                    {formatCurrencyBRL(contract.creditAmount)}
                  </td>
                  <td className="px-4 py-3 text-card-beige-muted-foreground">
                    {contract.paidInstallments}/{contract.totalInstallments}
                  </td>
                  <td className="px-4 py-3 text-card-beige-muted-foreground">
                    {formatDate(contract.startDate)}
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={STATUS_VARIANT[contract.status] ?? "outline"}>
                      {STATUS_LABEL[contract.status] ?? contract.status}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
