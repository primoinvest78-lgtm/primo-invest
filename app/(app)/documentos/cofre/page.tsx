import { BackLink } from "@/components/ui/back-link";
import { VaultUploadDialog } from "@/components/documents/vault/vault-upload-dialog";
import { VaultView } from "@/components/documents/vault/vault-view";
import { listClients } from "@/lib/data/clients";
import { getClientsWithoutDocuments, getVaultDocuments, getVaultShareCount } from "@/lib/data/documents";
import { requireActiveMembership } from "@/lib/supabase/session";

export default async function CofrePage() {
  const { organizationId } = await requireActiveMembership();
  const [documents, clientsWithoutDocs, sharedCount, clients] = await Promise.all([
    getVaultDocuments(organizationId),
    getClientsWithoutDocuments(organizationId),
    getVaultShareCount(organizationId),
    listClients(organizationId),
  ]);

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-4 block-navy-3d rounded-2xl p-5 md:flex-row md:items-end md:justify-between md:p-6">
        <div className="min-w-0">
          <p className="text-label font-bold uppercase text-primary">Documentos</p>
          <h1 className="mt-2 text-h1 font-bold tracking-[-0.04em] text-secondary-foreground">
            Meu Cofre Digital
          </h1>
          <p className="mt-2 max-w-2xl text-body text-secondary-foreground/75">
            Ambiente seguro pra armazenar, organizar e acompanhar documentos de clientes, famílias e
            patrimônio — {documents.length} {documents.length === 1 ? "documento" : "documentos"}.
          </p>
        </div>
        <BackLink href="/documentos" label="Voltar a Documentos" />
      </section>

      {documents.length === 0 ? (
        <div className="card-premium flex flex-col items-center gap-4 rounded-2xl p-8 text-center">
          <p className="text-body-sm text-card-beige-muted-foreground">
            Nenhum documento no Cofre ainda. Envie o primeiro documento pra começar a organizar.
          </p>
          <VaultUploadDialog
            organizationId={organizationId}
            clients={clients.map((c) => ({ id: c.id, fullName: c.fullName }))}
          />
        </div>
      ) : (
        <VaultView
          documents={documents}
          clientsWithoutDocs={clientsWithoutDocs}
          sharedCount={sharedCount}
          organizationId={organizationId}
          clients={clients.map((c) => ({ id: c.id, fullName: c.fullName }))}
        />
      )}
    </div>
  );
}
