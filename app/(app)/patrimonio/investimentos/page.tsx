import { getInvestmentsDetail } from "@/lib/data/wealth";
import { requireActiveMembership } from "@/lib/supabase/session";
import { formatCurrencyBRL } from "@/lib/utils/format";

export default async function InvestimentosPage() {
  const { organizationId } = await requireActiveMembership();
  const holdings = await getInvestmentsDetail(organizationId);

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-4 rounded-2xl border border-white/10 bg-secondary p-5 shadow-panel-3d md:flex-row md:items-end md:justify-between md:p-6">
        <div className="min-w-0">
          <p className="text-label font-bold uppercase text-primary">Patrimônio</p>
          <h1 className="mt-2 text-h1 font-bold tracking-[-0.04em] text-secondary-foreground">
            Investimentos
          </h1>
          <p className="mt-2 max-w-2xl text-body text-secondary-foreground/75">
            {holdings.length} {holdings.length === 1 ? "posição" : "posições"} em carteira.
          </p>
        </div>
      </section>

      <div className="card-premium overflow-hidden rounded-2xl">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-black/10 bg-black/5 text-left">
              <th className="px-4 py-3 text-label font-bold uppercase text-card-beige-muted-foreground">
                Produto
              </th>
              <th className="px-4 py-3 text-label font-bold uppercase text-card-beige-muted-foreground">
                Tipo
              </th>
              <th className="px-4 py-3 text-label font-bold uppercase text-card-beige-muted-foreground">
                Conta / Cliente
              </th>
              <th className="px-4 py-3 text-label font-bold uppercase text-card-beige-muted-foreground">
                Quantidade
              </th>
              <th className="px-4 py-3 text-label font-bold uppercase text-card-beige-muted-foreground">
                Valor atual
              </th>
            </tr>
          </thead>
          <tbody>
            {holdings.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-body-sm text-card-beige-muted-foreground">
                  Nenhuma posição registrada.
                </td>
              </tr>
            ) : (
              holdings.map((h) => (
                <tr
                  key={h.id}
                  className="border-b border-black/10 border-l-2 border-l-transparent last:border-b-0 transition-all duration-200 hover:border-l-primary hover:bg-black/5"
                >
                  <td className="px-4 py-3 font-semibold text-foreground">
                    {h.productName ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-card-beige-muted-foreground">
                    {h.productType ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-card-beige-muted-foreground">
                    {h.accountName ?? "—"} {h.clientName ? `· ${h.clientName}` : ""}
                  </td>
                  <td className="px-4 py-3 text-foreground">{h.quantity}</td>
                  <td className="px-4 py-3 font-semibold text-foreground">
                    {formatCurrencyBRL(h.valuation)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
