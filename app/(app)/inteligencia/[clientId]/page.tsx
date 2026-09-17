import Link from "next/link";
import { notFound } from "next/navigation";
import { UserRound } from "lucide-react";

import { InsightFeed } from "@/components/intelligence/insight-feed";
import { MeetingPrepPanel } from "@/components/intelligence/meeting-prep-panel";
import { BackLink } from "@/components/ui/back-link";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getClientIntelligence } from "@/lib/data/intelligence";
import { buildMeetingPreparation } from "@/lib/intelligence/meeting";
import { requireActiveMembership } from "@/lib/supabase/session";

/**
 * Cliente 360 Inteligente — não repete o que `/clientes/[id]` já
 * mostra (patrimônio, alertas, histórico). Aqui só o que é específico
 * da Central: os insights deste cliente (tipados, com ação) e a
 * preparação de reunião.
 */
export default async function ClienteInteligenciaPage({
  params,
}: {
  params: Promise<{ clientId: string }>;
}) {
  const { clientId } = await params;
  const { organizationId } = await requireActiveMembership();

  const data = await getClientIntelligence(organizationId, clientId);
  if (!data) notFound();

  const { client, insights, goals } = data;
  const prep = buildMeetingPreparation(client, insights, goals);
  const openCount = insights.filter((i) => i.status === "aberto").length;

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-4 block-navy-3d rounded-2xl p-5 md:flex-row md:items-end md:justify-between md:p-6">
        <div className="min-w-0">
          <p className="text-label font-bold uppercase text-primary">Inteligência · Cliente 360</p>
          <h1 className="mt-2 text-h1 font-bold tracking-[-0.04em] text-secondary-foreground">
            {client.full_name}
          </h1>
          <p className="mt-2 max-w-2xl text-body text-secondary-foreground/75">
            {openCount} {openCount === 1 ? "insight em aberto" : "insights em aberto"} para este cliente.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <BackLink href="/inteligencia" label="Central de Inteligência" />
          <Button variant="outline" nativeButton={false} render={<Link href={`/clientes/${client.id}`} />}>
            <UserRound className="h-4 w-4" />
            Perfil completo do cliente
          </Button>
        </div>
      </section>

      <Tabs defaultValue="insights">
        <TabsList variant="line" className="w-full justify-start overflow-x-auto">
          <TabsTrigger value="insights">Insights do cliente</TabsTrigger>
          <TabsTrigger value="meeting">Preparação de reunião</TabsTrigger>
        </TabsList>

        <TabsContent value="insights" className="mt-5">
          <InsightFeed insights={insights} />
        </TabsContent>
        <TabsContent value="meeting" className="mt-5">
          <MeetingPrepPanel prep={prep} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
