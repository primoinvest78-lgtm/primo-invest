import { notFound } from "next/navigation";

import { BackLink } from "@/components/ui/back-link";
import { Badge } from "@/components/ui/badge";
import { ContractDeleteDialog } from "@/components/consortiums/contract-delete-dialog";
import { ContractDetailTabs } from "@/components/consortiums/contract-detail-tabs";
import { ContractEditDialog } from "@/components/consortiums/contract-edit-dialog";
import { NewTaskDialog } from "@/components/tasks/new-task-dialog";
import { listClients } from "@/lib/data/clients";
import {
  getConsortiumBids,
  getConsortiumContractDetail,
  getConsortiumInstallments,
  getContractAuditEntries,
  getContractDocuments,
  getContractEvents,
} from "@/lib/data/consortiums";
import { listTasks } from "@/lib/data/tasks";
import { requireActiveMembership } from "@/lib/supabase/session";
import { CONTRACT_STATUS_VARIANT, contractStatusLabel } from "@/lib/utils/consortium-helpers";

export default async function ContractDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { organizationId } = await requireActiveMembership();
  const contract = await getConsortiumContractDetail(organizationId, id);

  if (!contract) {
    notFound();
  }

  const [clients, allInstallments, allBids, events, auditEntries, documents, allTasks] = await Promise.all([
    listClients(organizationId),
    getConsortiumInstallments(organizationId),
    getConsortiumBids(organizationId),
    getContractEvents(organizationId, id),
    getContractAuditEntries(organizationId, id),
    getContractDocuments(organizationId, id),
    listTasks(organizationId),
  ]);

  const installments = allInstallments.filter((i) => i.contractId === id);
  const bids = allBids.filter((b) => b.contractId === id);
  const tasks = allTasks.filter((t) => t.consortiumContractId === id);
  const clientOptions = clients.map((c) => ({ id: c.id, fullName: c.fullName }));

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-4 block-navy-3d rounded-2xl p-5 md:flex-row md:items-end md:justify-between md:p-6">
        <div className="min-w-0">
          <p className="text-label font-bold uppercase text-primary">
            Consórcios · {contract.consortiumType ?? "—"}
          </p>
          <h1 className="mt-2 text-h1 font-bold tracking-[-0.04em] text-secondary-foreground">
            {contract.administratorName ?? "Contrato"}
          </h1>
          <p className="mt-2 text-body text-secondary-foreground/75">
            {contract.contractNumber ?? "Sem número"}
            {contract.groupNumber ? ` · Grupo ${contract.groupNumber}` : ""}
            {contract.quotaNumber ? ` · Cota ${contract.quotaNumber}` : ""}
          </p>
        </div>

        <div className="flex shrink-0 flex-col items-end gap-3">
          <BackLink href="/consorcios/contratos" label="Voltar a Contratos" />
          <div className="flex items-center gap-3">
            <Badge variant={CONTRACT_STATUS_VARIANT[contract.status] ?? "outline"}>
              {contractStatusLabel(contract.status)}
            </Badge>
            <div className="flex items-center gap-2">
              <NewTaskDialog
                consortiumContractId={contract.id}
                clientId={contract.clientId ?? undefined}
              />
              <div className="flex items-center gap-2 rounded-lg bg-white/10 px-2 py-1">
                <ContractEditDialog contract={contract} clients={clientOptions} />
                <ContractDeleteDialog contract={contract} />
              </div>
            </div>
          </div>
        </div>
      </section>

      <ContractDetailTabs
        contract={contract}
        organizationId={organizationId}
        installments={installments}
        bids={bids}
        events={events}
        auditEntries={auditEntries}
        documents={documents}
        tasks={tasks}
      />
    </div>
  );
}
