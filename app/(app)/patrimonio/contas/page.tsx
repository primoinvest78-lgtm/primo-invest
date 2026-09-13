import { getAccountsDetail } from "@/lib/data/wealth";
import { requireActiveMembership } from "@/lib/supabase/session";
import { formatCurrencyBRL } from "@/lib/utils/format";

export default async function ContasPage() {
  const { organizationId } = await requireActiveMembership();
  const accounts = await getAccountsDetail(organizationId);

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-4 rounded-2xl border border-white/10 bg-secondary p-5 shadow-panel-3d md:flex-row md:items-end md:justify-between md:p-6">
        <div className="min-w-0">
          <p className="text-label font-bold uppercase text-primary">Patrimônio</p>
          <h1 className="mt-2 text-h1 font-bold tracking-[-0.04em] text-secondary-foreground">
            Contas
          </h1>
          <p className="mt-2 max-w-2xl text-body text-secondary-foreground/75">
            {accounts.length} {accounts.length === 1 ? "conta" : "contas"} financeiras.
          </p>
        </div>
      </section>

      {accounts.length === 0 ? (
        <div className="card-premium rounded-2xl p-8 text-center">
          <p className="text-body-sm text-card-beige-muted-foreground">
            Nenhuma conta cadastrada.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {accounts.map((account) => {
            const balance = account.holdings.reduce((s, h) => s + Number(h.valuation ?? 0), 0);

            return (
              <div
                key={account.id}
                className="card-premium overflow-hidden rounded-2xl p-5 transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/70 md:p-6"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-bold text-foreground">
                      {account.accountName ?? account.institutionName ?? "Conta"}
                    </p>
                    <p className="text-xs font-medium uppercase text-card-beige-muted-foreground">
                      {account.accountType} · {account.clientName ?? "—"}
                    </p>
                  </div>
                  <p className="text-h2 font-bold text-foreground">
                    {formatCurrencyBRL(balance)}
                  </p>
                </div>

                {account.holdings.length > 0 ? (
                  <div className="mt-4 space-y-1.5 border-t border-black/10 pt-4">
                    {account.holdings.map((h) => (
                      <div key={h.id} className="flex items-center justify-between gap-2 text-sm">
                        <span className="truncate text-foreground">
                          {h.productName ?? "—"}{" "}
                          <span className="text-card-beige-muted-foreground">
                            ({h.productType ?? "—"})
                          </span>
                        </span>
                        <span className="shrink-0 font-semibold text-foreground">
                          {formatCurrencyBRL(h.valuation)}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
