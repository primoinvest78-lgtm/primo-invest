"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { HouseholdTab } from "@/components/clients/tabs/household-tab";
import { OverviewTab } from "@/components/clients/tabs/overview-tab";
import { RiskProfileTab } from "@/components/clients/tabs/risk-profile-tab";
import type { ClientProfile } from "@/lib/data/clients";

function ComingSoon({ label }: { label: string }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-8 text-center">
      <p className="text-body-sm text-muted-foreground">{label} — em construção.</p>
    </div>
  );
}

export function ClientProfileTabs({ client }: { client: ClientProfile }) {
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
        <OverviewTab client={client} />
      </TabsContent>
      <TabsContent value="household" className="mt-5">
        <HouseholdTab client={client} />
      </TabsContent>
      <TabsContent value="risk" className="mt-5">
        <RiskProfileTab client={client} />
      </TabsContent>
      <TabsContent value="goals" className="mt-5">
        <ComingSoon label="Metas Financeiras" />
      </TabsContent>
      <TabsContent value="relationship" className="mt-5">
        <ComingSoon label="Relacionamento" />
      </TabsContent>
      <TabsContent value="documents" className="mt-5">
        <ComingSoon label="Documentos" />
      </TabsContent>
      <TabsContent value="opportunities" className="mt-5">
        <ComingSoon label="Oportunidades" />
      </TabsContent>
    </Tabs>
  );
}
