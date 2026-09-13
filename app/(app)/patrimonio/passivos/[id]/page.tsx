import Link from "next/link";
import { notFound } from "next/navigation";

import { AnimatedNumber } from "@/components/ui/animated-number";
import { BackLink } from "@/components/ui/back-link";
import { Badge } from "@/components/ui/badge";
import { LiabilityDeleteDialog } from "@/components/wealth/liability-delete-dialog";
import { LiabilityEditDialog } from "@/components/wealth/liability-edit-dialog";
import { WealthEvolutionSection } from "@/components/wealth/wealth-evolution-section";
import { listClients } from "@/lib/data/clients";
import { getClientDocuments, getLiabilityDetail } from "@/lib/data/wealth";
import { requireActiveMembership } from "@/lib/supabase/session";
import { monthsToPayoff } from "@/lib/utils/liability-helpers";
import { formatCurrencyBRL, formatDate } from "@/lib/utils/format";

function InfoField({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div>
      <p className="text-label font-bold uppercase text-secondary-foreground/60">{label}</p>
      <p className="mt-1 text-sm font-medium text-secondary-foreground">{value ?? "—"}</p>
    </div>
  );
}

function Kpi({ label, value, valueClassName }: { label: string; value: string; valueClassName?: string }) {
  return (
    <div className="card-premium rounded-2xl p-4">
      <p className="text-label font-bold uppercase text-card-beige-muted-foreground">{label}</p>
      <p className={["mt-2 text-lg font-bold", valueClassName ?? "text-foreground"].join(" ")}>
        <AnimatedNumber value={value} />
      </p>
    </div>
  );
}

export default async function LiabilityDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { organizationId } = await requireActiveMembership();
  const liability = await getLiabilityDetail(organizationId, id);

  if (!liability) {
    notFound();
  }

  const [clients, documents] = await Promise.all([
    listClients(organizationId),
    liability.clientId ? getClientDocuments(organizationId, liability.clientId) : Promise.resolve([]),
  ]);

  const relatedClient = liability.clientId ? clients.find((c) => c.id === liability.clientId) : null;
  const months = monthsToPayoff(liability);

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-4 block-navy-3d rounded-2xl p-5 md:flex-row md:items-end md:justify-between md:p-6">
        <div className="min-w-0">
          <p className="text-label font-bold uppercase text-primary">
            Passivos · {liability.liabilityType ?? "—"}
          </p>
          <h1 className="mt-2 text-h1 font-bold tracking-[-0.04em] text-secondary-foreground">
            {liability.name}
          </h1>
          <div className="mt-3 grid grid-cols-2 gap-4 sm:grid-cols-4">
            <InfoField label="Titular" value={liability.clientName} />
            <InfoField label="Taxa" value={liability.interestRate !== null ? `${liability.interestRate}% a.m.` : null} />
            <InfoField label="Vencimento" value={formatDate(liability.maturityDate)} />
            <InfoField label="Atualizado em" value={formatDate(liability.updatedAt)} />
          </div>
        </div>

        <div className="flex shrink-0 flex-col items-end gap-3">
          <BackLink href="/patrimonio/passivos" label="Voltar a Passivos" />
          <div className="flex items-center gap-3">
            <Badge variant={liability.status === "active" ? "default" : "outline"}>
              {liability.status === "active" ? "Ativo" : "Inativo"}
            </Badge>
            <div className="flex items-center gap-2 rounded-lg bg-white/10 px-2 py-1">
              <LiabilityEditDialog liability={liability} clients={clients.map((c) => ({ id: c.id, fullName: c.fullName }))} />
              <LiabilityDeleteDialog liability={liability} />
            </div>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Kpi label="Saldo atual" value={formatCurrencyBRL(liability.outstandingAmount)} valueClassName="text-destructive" />
        <Kpi label="Parcela mensal" value={formatCurrencyBRL(liability.monthlyPayment)} />
        <Kpi
          label="Meses pra quitar"
          value={months !== null ? months.toFixed(0) : "—"}
        />
        <Kpi
          label="Patrimônio líquido (cliente)"
          value={relatedClient ? formatCurrencyBRL(relatedClient.netWorth) : "—"}
        />
      </div>

      {liability.clientId ? (
        <div className="card-premium flex flex-wrap items-center justify-between gap-3 rounded-2xl p-4">
          <p className="text-sm text-card-beige-muted-foreground">
            Cliente vinculado: <span className="font-semibold text-foreground">{liability.clientName}</span>
          </p>
          <Link
            href={`/clientes/${liability.clientId}`}
            className="text-sm font-semibold text-primary hover:underline"
          >
            Abrir perfil do cliente →
          </Link>
        </div>
      ) : null}

      <WealthEvolutionSection
        history={[]}
        title="Evolução do saldo"
        emptyMessage="Esse passivo ainda não tem histórico de saldo suficiente registrado pra montar a evolução."
      />

      <div className="card-premium rounded-2xl p-5 md:p-6">
        <h3 className="mb-4 text-h2 font-bold text-foreground">Documentos relacionados</h3>
        {!liability.clientId ? (
          <p className="text-body-sm text-card-beige-muted-foreground">
            Sem cliente vinculado — não há documentos pra relacionar.
          </p>
        ) : documents.length === 0 ? (
          <p className="text-body-sm text-card-beige-muted-foreground">
            Nenhum documento do titular cadastrado ainda.
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {documents.map((doc) => (
              <div
                key={doc.id}
                className="flex items-center justify-between gap-2 rounded-xl border border-black/10 bg-black/5 px-3.5 py-2.5 text-sm"
              >
                <div className="min-w-0">
                  <p className="truncate font-semibold text-foreground">{doc.name}</p>
                  <p className="text-xs text-card-beige-muted-foreground">
                    {doc.documentType ?? "—"} · {formatDate(doc.createdAt)}
                  </p>
                </div>
                <Badge variant="outline">{doc.status}</Badge>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
