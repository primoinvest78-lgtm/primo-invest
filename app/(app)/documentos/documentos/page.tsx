import { BackLink } from "@/components/ui/back-link";
import { CenterView } from "@/components/documents/center/center-view";
import { RequestCreateDialog } from "@/components/documents/center/request-create-dialog";
import { getDocumentCenterRows, getDocumentRequests } from "@/lib/data/document-center";
import { getTaskFormOptions } from "@/lib/data/tasks";
import { requireActiveMembership } from "@/lib/supabase/session";

export default async function DocumentosListaPage() {
  const { organizationId } = await requireActiveMembership();
  const [rows, requests, formOptions] = await Promise.all([
    getDocumentCenterRows(organizationId),
    getDocumentRequests(organizationId),
    getTaskFormOptions(organizationId),
  ]);

  const clients = formOptions.clients;
  const advisors = formOptions.advisors;
  const consortiumContracts = formOptions.consortiumContracts;

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-4 block-navy-3d rounded-2xl p-5 md:flex-row md:items-end md:justify-between md:p-6">
        <div className="min-w-0">
          <p className="text-label font-bold uppercase text-primary">Documentos</p>
          <h1 className="mt-2 text-h1 font-bold tracking-[-0.04em] text-secondary-foreground">
            Central de Documentos
          </h1>
          <p className="mt-2 max-w-2xl text-body text-secondary-foreground/75">
            Gestão operacional dos documentos: pendências, prazos, aprovações e workflow —{" "}
            {rows.length} {rows.length === 1 ? "registro" : "registros"}. O armazenamento seguro continua no{" "}
            Cofre Digital.
          </p>
        </div>
        <BackLink href="/documentos" label="Voltar a Documentos" />
      </section>

      {rows.length === 0 ? (
        <div className="card-premium flex flex-col items-center gap-4 rounded-2xl p-8 text-center">
          <p className="text-body-sm text-card-beige-muted-foreground">
            Nenhum documento ou solicitação registrada ainda. Comece solicitando um documento a um cliente.
          </p>
          <RequestCreateDialog clients={clients} advisors={advisors} consortiumContracts={consortiumContracts} />
        </div>
      ) : (
        <CenterView
          rows={rows}
          requests={requests}
          clients={clients}
          advisors={advisors}
          consortiumContracts={consortiumContracts}
        />
      )}
    </div>
  );
}
