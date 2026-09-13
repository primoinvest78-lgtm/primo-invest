import Link from "next/link";

import { AnimatedNumber } from "@/components/ui/animated-number";
import { Badge } from "@/components/ui/badge";
import { getConsortiumsOverview } from "@/lib/data/consortiums";
import { requireActiveMembership } from "@/lib/supabase/session";
import { CONTRACT_STATUS_VARIANT, contractStatusLabel } from "@/lib/utils/consortium-helpers";
import { formatCurrencyBRL, formatDate } from "@/lib/utils/format";

export default async function ConsorciosPage() {
  const { organizationId } = await requireActiveMembership();
  const overview = await getConsortiumsOverview(organizationId);

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-4 block-navy-3d rounded-2xl p-5 md:flex-row md:items-end md:justify-between md:p-6">
        <div className="min-w-0">
          <p className="text-label font-bold uppercase text-primary">Consórcios</p>
          <h1 className="mt-2 text-h1 font-bold tracking-[-0.04em] text-secondary-foreground">
            Consórcios
          </h1>
          <p className="mt-2 max-w-2xl text-body text-secondary-foreground/75">
            Gestão de contratos, parcelas e lances — {overview.contracts.length}{" "}
            {overview.contracts.length === 1 ? "contrato" : "contratos"}.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Link
            href="/consorcios/contratos"
            className="rounded-lg border border-white/20 bg-white/10 px-3.5 py-2 text-xs font-semibold text-secondary-foreground transition-colors hover:border-primary hover:bg-white/15"
          >
            Contratos
          </Link>
          <Link
            href="/consorcios/parcelas"
            className="rounded-lg border border-white/20 bg-white/10 px-3.5 py-2 text-xs font-semibold text-secondary-foreground transition-colors hover:border-primary hover:bg-white/15"
          >
            Parcelas
          </Link>
          <Link
            href="/consorcios/lances"
            className="rounded-lg border border-white/20 bg-white/10 px-3.5 py-2 text-xs font-semibold text-secondary-foreground transition-colors hover:border-primary hover:bg-white/15"
          >
            Lances
          </Link>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="card-premium rounded-2xl p-5 transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/70">
          <p className="text-label font-bold uppercase text-card-beige-muted-foreground">
            Contratos ativos
          </p>
          <p className="mt-2 text-h2 font-bold text-foreground">
            <AnimatedNumber value={String(overview.activeCount)} />
          </p>
        </div>
        <div className="card-premium rounded-2xl p-5 transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/70">
          <p className="text-label font-bold uppercase text-card-beige-muted-foreground">
            Crédito total ativo
          </p>
          <p className="mt-2 text-h2 font-bold text-foreground">
            <AnimatedNumber value={formatCurrencyBRL(overview.totalCreditAmount)} />
          </p>
        </div>
        <Link
          href="/consorcios/parcelas"
          className="card-premium block rounded-2xl p-5 transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/70"
        >
          <p className="text-label font-bold uppercase text-card-beige-muted-foreground">
            Parcelas em aberto
          </p>
          <p className="mt-2 text-h2 font-bold text-foreground">
            <AnimatedNumber value={String(overview.openInstallmentsCount)} />
          </p>
        </Link>
      </div>

      <div className="card-premium rounded-2xl p-5 md:p-6">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-h2 font-bold text-foreground">Contratos</h3>
          <Link href="/consorcios/contratos" className="text-xs font-semibold text-accent hover:underline">
            Ver detalhes
          </Link>
        </div>

        {overview.contracts.length === 0 ? (
          <p className="text-body-sm text-card-beige-muted-foreground">Nenhum contrato cadastrado.</p>
        ) : (
          <div className="space-y-2">
            {overview.contracts.map((contract) => (
              <Link
                key={contract.id}
                href={`/consorcios/contratos/${contract.id}`}
                className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-black/10 bg-black/5 px-3.5 py-3 transition-colors duration-150 hover:bg-black/10"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-foreground hover:text-primary">
                    {contract.administratorName ?? "—"} · {contract.contractNumber ?? "—"}
                  </p>
                  <div className="flex flex-wrap items-center gap-1.5 text-xs font-medium text-card-beige-muted-foreground">
                    <span>{contract.clientName ?? "—"}</span>
                    <span>
                      · {contract.consortiumType ?? "—"} · {contract.paidInstallments}/{contract.totalInstallments} parcelas
                    </span>
                    {contract.startDate ? <span>· desde {formatDate(contract.startDate)}</span> : null}
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  <span className="text-sm font-semibold text-foreground">
                    {formatCurrencyBRL(contract.creditAmount)}
                  </span>
                  <Badge variant={CONTRACT_STATUS_VARIANT[contract.status] ?? "outline"}>
                    {contractStatusLabel(contract.status)}
                  </Badge>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
