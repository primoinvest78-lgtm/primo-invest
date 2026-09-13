import { ScrollReveal } from "@/components/motion/scroll-reveal";
import { getLiabilitiesDetail } from "@/lib/data/wealth";
import { requireActiveMembership } from "@/lib/supabase/session";
import { formatCurrencyBRL, formatDate } from "@/lib/utils/format";

export default async function PassivosPage() {
  const { organizationId } = await requireActiveMembership();
  const liabilities = await getLiabilitiesDetail(organizationId);

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-4 block-navy-3d rounded-2xl p-5 md:flex-row md:items-end md:justify-between md:p-6">
        <div className="min-w-0">
          <p className="text-label font-bold uppercase text-primary">Patrimônio</p>
          <h1 className="mt-2 text-h1 font-bold tracking-[-0.04em] text-secondary-foreground">
            Passivos
          </h1>
          <p className="mt-2 max-w-2xl text-body text-secondary-foreground/75">
            {liabilities.length} {liabilities.length === 1 ? "passivo" : "passivos"} registrados.
          </p>
        </div>
      </section>

      <ScrollReveal className="card-premium overflow-hidden rounded-2xl">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-black/10 bg-black/5 text-left">
              <th className="px-4 py-3 text-label font-bold uppercase text-card-beige-muted-foreground">
                Nome
              </th>
              <th className="px-4 py-3 text-label font-bold uppercase text-card-beige-muted-foreground">
                Cliente
              </th>
              <th className="px-4 py-3 text-label font-bold uppercase text-card-beige-muted-foreground">
                Valor em aberto
              </th>
              <th className="px-4 py-3 text-label font-bold uppercase text-card-beige-muted-foreground">
                Parcela mensal
              </th>
              <th className="px-4 py-3 text-label font-bold uppercase text-card-beige-muted-foreground">
                Vencimento
              </th>
            </tr>
          </thead>
          <tbody>
            {liabilities.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-body-sm text-card-beige-muted-foreground">
                  Nenhum passivo registrado.
                </td>
              </tr>
            ) : (
              liabilities.map((liability) => (
                <tr
                  key={liability.id}
                  className="border-b border-black/10 border-l-2 border-l-transparent last:border-b-0 transition-all duration-200 hover:border-l-destructive hover:bg-black/5"
                >
                  <td className="px-4 py-3">
                    <p className="font-semibold text-foreground">{liability.name}</p>
                    <p className="text-xs text-card-beige-muted-foreground">
                      {liability.liabilityType ?? "—"}
                    </p>
                  </td>
                  <td className="px-4 py-3 text-card-beige-muted-foreground">
                    {liability.clientName ?? "—"}
                  </td>
                  <td className="px-4 py-3 font-semibold text-destructive">
                    {formatCurrencyBRL(liability.outstandingAmount)}
                  </td>
                  <td className="px-4 py-3 text-foreground">
                    {formatCurrencyBRL(liability.monthlyPayment)}
                  </td>
                  <td className="px-4 py-3 text-card-beige-muted-foreground">
                    {formatDate(liability.maturityDate)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </ScrollReveal>
    </div>
  );
}
