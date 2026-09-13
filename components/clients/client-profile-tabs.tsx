"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ClientOpportunitiesTab } from "@/components/clients/tabs/client-opportunities-tab";
import { DocumentsTab } from "@/components/clients/tabs/documents-tab";
import { GoalsTab } from "@/components/clients/tabs/goals-tab";
import { HouseholdTab } from "@/components/clients/tabs/household-tab";
import { OverviewTab } from "@/components/clients/tabs/overview-tab";
import { RelationshipTab } from "@/components/clients/tabs/relationship-tab";
import { RiskProfileTab } from "@/components/clients/tabs/risk-profile-tab";
import type { ClientProfile, WealthHistoryPoint } from "@/lib/data/clients";

export function ClientProfileTabs({
  client,
  organizationId,
  wealthHistory,
}: {
  client: ClientProfile;
  organizationId: string;
  wealthHistory: WealthHistoryPoint[];
}) {
  return (
    <Tabs defaultValue="overview">
      <TabsList variant="line" className="w-full justify-start overflow-x-auto">
        <TabsTrigger value="overview">Visão Geral</TabsTrigger>
        <TabsTrigger value="household">Núcleo Familiar</TabsTrigger>
        <TabsTrigger value="risk">Perfil de Investidor</TabsTrigger>
        <TabsTrigger value="goals">Metas Financeiras</TabsTrigger>
        <TabsTrigger value="relationship">Relacionamento</TabsTrigger>
        <TabsTrigger value="documents">Documentos</TabsTrigger>
        <TabsTrigger value="opportunities">Oportunidades</TabsTrigger>
      </TabsList>

      <TabsContent value="overview" className="mt-5">
        <OverviewTab client={client} wealthHistory={wealthHistory} />
      </TabsContent>
      <TabsContent value="household" className="mt-5">
        <HouseholdTab client={client} />
      </TabsContent>
      <TabsContent value="risk" className="mt-5">
        <RiskProfileTab client={client} />
      </TabsContent>
      <TabsContent value="goals" className="mt-5">
        <GoalsTab client={client} />
      </TabsContent>
      <TabsContent value="relationship" className="mt-5">
        <RelationshipTab client={client} />
      </TabsContent>
      <TabsContent value="documents" className="mt-5">
        <DocumentsTab client={client} organizationId={organizationId} />
      </TabsContent>
      <TabsContent value="opportunities" className="mt-5">
        <ClientOpportunitiesTab client={client} />
      </TabsContent>
    </Tabs>
  );
}
