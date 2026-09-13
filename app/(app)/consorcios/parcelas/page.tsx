import Link from "next/link";

import { AnimatedNumber } from "@/components/ui/animated-number";
import { Badge } from "@/components/ui/badge";
import { BackLink } from "@/components/ui/back-link";
import { getConsortiumInstallments, getConsortiumsOverview } from "@/lib/data/consortiums";
import { requireActiveMembership } from "@/lib/supabase/session";
import { formatCurrencyBRL, formatDate } from "@/lib/utils/format";

const STATUS_LABEL: Record<string, string> = {
  pending: "Pendente",
  paid: "Paga",
  overdue: "Atrasada",
  cancelled: "Cancelada",
};

const STATUS_VARIANT: Record<string, "default" | "destructive" | "outline"> = {
  pending: "outline",
  paid: "default",
  overdue: "destructive",
  cancelled: "outline",
};

export default async function ParcelasPage() {
  const { organizationId } = await requireActiveMembership();
  const [overview, installments] = await Promise.all([
    getConsortiumsOverview(organizationId),
    getConsortiumInstallments(organizationId),
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
            Fluxo de pagamentos e vencimentos dos contratos ativos.
          </p>
        </div>
        <BackLink href="/consorcios" label="Voltar a Consórcios" />
      </section>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="card-premium rounded-2xl p-4">
          <p className="text-label font-bold uppercase text-card-beige-muted-foreground">Em aberto</p>
          <h2 className="mt-3 text-3xl font-bold text-foreground">
            <AnimatedNumber value={String(overview.openInstallmentsCount)} />
          </h2>
        </div>
        <div className="card-premium rounded-2xl p-4">
          <p className="text-label font-bold uppercase text-card-beige-muted-foreground">
            Valor em aberto
          </p>
          <h2 className="mt-3 text-3xl font-bold text-foreground">
            <AnimatedNumber value={formatCurrencyBRL(overview.openInstallmentsValue)} />
          </h2>
        </div>
        <div className="card-premium rounded-2xl p-4">
          <p className="text-label font-bold uppercase text-card-beige-muted-foreground">
            Parcelas registradas individualmente
          </p>
          <h2 className="mt-3 text-3xl font-bold text-foreground">
            <AnimatedNumber value={String(installments.length)} />
          </h2>
        </div>
      </div>

      <div className="card-premium overflow-hidden rounded-2xl">
        {installments.length === 0 ? (
          <p className="p-8 text-center text-body-sm text-card-beige-muted-foreground">
            Nenhuma parcela individual registrada ainda — os números &ldquo;Em aberto&rdquo; acima vêm
            do saldo agregado de cada contrato (total − pagas). Registre parcelas individuais pra
            ver vencimento e status detalhados aqui.
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
                  Parcela
                </th>
                <th className="px-4 py-3 text-label font-bold uppercase text-card-beige-muted-foreground">
                  Vencimento
                </th>
                <th className="px-4 py-3 text-label font-bold uppercase text-card-beige-muted-foreground">
                  Valor
                </th>
                <th className="px-4 py-3 text-label font-bold uppercase text-card-beige-muted-foreground">
                  Status
                </th>
              </tr>
            </thead>
            <tbody>
              {installments.map((installment) => (
                <tr
                  key={installment.id}
                  className="border-b border-black/10 border-l-2 border-l-transparent last:border-b-0 transition-all duration-200 hover:border-l-primary hover:bg-black/5"
                >
                  <td className="px-4 py-3 font-semibold text-foreground">{installment.contractLabel}</td>
                  <td className="px-4 py-3">
                    {installment.clientId ? (
                      <Link href={`/clientes/${installment.clientId}`} className="text-accent hover:underline">
                        {installment.clientName}
                      </Link>
                    ) : (
                      <span className="text-card-beige-muted-foreground">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-card-beige-muted-foreground">
                    #{installment.installmentNumber}
                  </td>
                  <td className="px-4 py-3 text-card-beige-muted-foreground">
                    {formatDate(installment.dueDate)}
                  </td>
                  <td className="px-4 py-3 font-semibold text-foreground">
                    {formatCurrencyBRL(installment.amount)}
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={STATUS_VARIANT[installment.status] ?? "outline"}>
                      {STATUS_LABEL[installment.status] ?? installment.status}
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
