import { BackButton } from "@/components/ui/back-button";
import { ReportShortcutButton } from "@/components/reports/report-shortcut-button";
import { ClientsTable } from "@/components/clients/clients-table";
import { listClients } from "@/lib/data/clients";
import { requireActiveMembership } from "@/lib/supabase/session";

export default async function ClientesPage() {
  const { organizationId } = await requireActiveMembership();
  const clients = await listClients(organizationId);

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-4 block-navy-3d rounded-2xl p-5 md:flex-row md:items-end md:justify-between md:p-6">
        <div className="min-w-0">
          <BackButton className="mb-2 inline-flex items-center gap-1.5 text-xs font-semibold text-secondary-foreground/60 transition-colors hover:text-primary" />
          <p className="text-label font-bold uppercase text-primary">Relacionamento</p>
          <h1 className="mt-2 text-h1 font-bold tracking-[-0.04em] text-secondary-foreground">
            Clientes
          </h1>
          <p className="mt-2 max-w-2xl text-body text-secondary-foreground/75">
            Base de relacionamento e carteira ativa — {clients.length}{" "}
            {clients.length === 1 ? "cliente" : "clientes"}.
          </p>
        </div>

        <div className="flex shrink-0 flex-wrap items-center gap-2">
          <ReportShortcutButton type="executivo" label="Relatório executivo" />
        </div>
      </section>

      <ClientsTable clients={clients} />
    </div>
  );
}
