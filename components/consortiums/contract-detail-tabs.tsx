"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ContractBidsTab } from "@/components/consortiums/tabs/contract-bids-tab";
import { ContractContemplationTab } from "@/components/consortiums/tabs/contract-contemplation-tab";
import { ContractDataTab } from "@/components/consortiums/tabs/contract-data-tab";
import { ContractDocumentsTab } from "@/components/consortiums/tabs/contract-documents-tab";
import { ContractHistoryTab } from "@/components/consortiums/tabs/contract-history-tab";
import { ContractInstallmentsTab } from "@/components/consortiums/tabs/contract-installments-tab";
import { ContractNotesTab } from "@/components/consortiums/tabs/contract-notes-tab";
import { ContractOverviewTab } from "@/components/consortiums/tabs/contract-overview-tab";
import type {
  ConsortiumBid,
  ConsortiumContract,
  ConsortiumEvent,
  ConsortiumInstallment,
  ContractAuditEntry,
  ContractDocument,
} from "@/lib/data/consortiums";
import type { TaskItem } from "@/lib/data/tasks";

export function ContractDetailTabs({
  contract,
  organizationId,
  installments,
  bids,
  events,
  auditEntries,
  documents,
  tasks,
}: {
  contract: ConsortiumContract;
  organizationId: string;
  installments: ConsortiumInstallment[];
  bids: ConsortiumBid[];
  events: ConsortiumEvent[];
  auditEntries: ContractAuditEntry[];
  documents: ContractDocument[];
  tasks: TaskItem[];
}) {
  return (
    <Tabs defaultValue="overview">
      <TabsList variant="line" className="w-full justify-start overflow-x-auto">
        <TabsTrigger value="overview">Visão Geral</TabsTrigger>
        <TabsTrigger value="data">Dados do Contrato</TabsTrigger>
        <TabsTrigger value="installments">Parcelas</TabsTrigger>
        <TabsTrigger value="bids">Lances</TabsTrigger>
        <TabsTrigger value="contemplation">Contemplação</TabsTrigger>
        <TabsTrigger value="documents">Documentos</TabsTrigger>
        <TabsTrigger value="history">Histórico</TabsTrigger>
        <TabsTrigger value="notes">Observações</TabsTrigger>
      </TabsList>

      <TabsContent value="overview" className="mt-5">
        <ContractOverviewTab contract={contract} tasks={tasks} />
      </TabsContent>
      <TabsContent value="data" className="mt-5">
        <ContractDataTab contract={contract} />
      </TabsContent>
      <TabsContent value="installments" className="mt-5">
        <ContractInstallmentsTab contract={contract} installments={installments} />
      </TabsContent>
      <TabsContent value="bids" className="mt-5">
        <ContractBidsTab contract={contract} bids={bids} />
      </TabsContent>
      <TabsContent value="contemplation" className="mt-5">
        <ContractContemplationTab contract={contract} bids={bids} />
      </TabsContent>
      <TabsContent value="documents" className="mt-5">
        <ContractDocumentsTab
          contractId={contract.id}
          clientId={contract.clientId}
          organizationId={organizationId}
          documents={documents}
        />
      </TabsContent>
      <TabsContent value="history" className="mt-5">
        <ContractHistoryTab events={events} auditEntries={auditEntries} />
      </TabsContent>
      <TabsContent value="notes" className="mt-5">
        <ContractNotesTab contractId={contract.id} clientId={contract.clientId} notes={contract.notes} />
      </TabsContent>
    </Tabs>
  );
}
