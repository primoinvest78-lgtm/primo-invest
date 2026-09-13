import Link from "next/link";

import { AnimatedNumber } from "@/components/ui/animated-number";
import { Badge } from "@/components/ui/badge";
import { BackLink } from "@/components/ui/back-link";
import { getConsortiumBids } from "@/lib/data/consortiums";
import { requireActiveMembership } from "@/lib/supabase/session";
import { formatCurrencyBRL, formatDate } from "@/lib/utils/format";

const RESULT_LABEL: Record<string, string> = {
  pending: "Pendente",
  approved: "Aprovado",
  rejected: "Rejeitado",
};

const RESULT_VARIANT: Record<string, "default" | "destructive" | "outline"> = {
  pending: "outline",
  approved: "default",
  rejected: "destructive",
};

export default async function LancesPage() {
  const { organizationId } = await requireActiveMembership();
  const bids = await getConsortiumBids(organizationId);

  const approvedCount = bids.filter((b) => b.result === "approved").length;
  const highestBid = bids.reduce<number | null>((max, b) => {
    const value = Number(b.bidAmount ?? 0);
    return max === null || value > max ? value : max;
  }, null);

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-4 block-navy-3d rounded-2xl p-5 md:flex-row md:items-end md:justify-between md:p-6">
        <div className="min-w-0">
          <p className="text-label font-bold uppercase text-primary">Consórcios</p>
          <h1 className="mt-2 text-h1 font-bold tracking-[-0.04em] text-secondary-foreground">
            Lances
          </h1>
          <p className="mt-2 max-w-2xl text-body text-secondary-foreground/75">
            Gestão de lances registrados e seus resultados.
          </p>
        </div>
        <BackLink href="/consorcios" label="Voltar a Consórcios" />
      </section>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="card-premium rounded-2xl p-4">
          <p className="text-label font-bold uppercase text-card-beige-muted-foreground">
            Lances registrados
          </p>
          <h2 className="mt-3 text-3xl font-bold text-foreground">
            <AnimatedNumber value={String(bids.length)} />
          </h2>
        </div>
        <div className="card-premium rounded-2xl p-4">
          <p className="text-label font-bold uppercase text-card-beige-muted-foreground">
            Maior lance
          </p>
          <h2 className="mt-3 text-3xl font-bold text-foreground">
            {highestBid !== null ? formatCurrencyBRL(highestBid) : "—"}
          </h2>
        </div>
        <div className="card-premium rounded-2xl p-4">
          <p className="text-label font-bold uppercase text-card-beige-muted-foreground">Aprovados</p>
          <h2 className="mt-3 text-3xl font-bold text-foreground">
            <AnimatedNumber value={String(approvedCount)} />
          </h2>
        </div>
      </div>

      <div className="card-premium overflow-hidden rounded-2xl">
        {bids.length === 0 ? (
          <p className="p-8 text-center text-body-sm text-card-beige-muted-foreground">
            Nenhum lance registrado ainda.
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
                  Valor
                </th>
                <th className="px-4 py-3 text-label font-bold uppercase text-card-beige-muted-foreground">
                  Data
                </th>
                <th className="px-4 py-3 text-label font-bold uppercase text-card-beige-muted-foreground">
                  Resultado
                </th>
              </tr>
            </thead>
            <tbody>
              {bids.map((bid) => (
                <tr
                  key={bid.id}
                  className="border-b border-black/10 border-l-2 border-l-transparent last:border-b-0 transition-all duration-200 hover:border-l-primary hover:bg-black/5"
                >
                  <td className="px-4 py-3 font-semibold text-foreground">{bid.contractLabel}</td>
                  <td className="px-4 py-3">
                    {bid.clientId ? (
                      <Link href={`/clientes/${bid.clientId}`} className="text-accent hover:underline">
                        {bid.clientName}
                      </Link>
                    ) : (
                      <span className="text-card-beige-muted-foreground">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-card-beige-muted-foreground">{bid.bidType ?? "—"}</td>
                  <td className="px-4 py-3 font-semibold text-foreground">
                    {formatCurrencyBRL(bid.bidAmount)}
                    {bid.bidPercentage ? ` · ${bid.bidPercentage}%` : ""}
                  </td>
                  <td className="px-4 py-3 text-card-beige-muted-foreground">{formatDate(bid.bidDate)}</td>
                  <td className="px-4 py-3">
                    <Badge variant={RESULT_VARIANT[bid.result] ?? "outline"}>
                      {RESULT_LABEL[bid.result] ?? bid.result}
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
