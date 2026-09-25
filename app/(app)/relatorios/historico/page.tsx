import Link from "next/link";
import { Plus } from "lucide-react";

import { HistoryView } from "@/components/reports/history/history-view";
import { BackLink } from "@/components/ui/back-link";
import { Button } from "@/components/ui/button";
import { listReports } from "@/lib/data/reports";
import { requireActiveMembership } from "@/lib/supabase/session";

export default async function HistoricoRelatoriosPage() {
  const { organizationId } = await requireActiveMembership();
  const reports = await listReports(organizationId);

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-4 block-navy-3d rounded-2xl p-5 md:flex-row md:items-end md:justify-between md:p-6">
        <div className="min-w-0">
          <p className="text-label font-bold uppercase text-primary">Central de Relatórios</p>
          <h1 className="mt-2 text-h1 font-bold tracking-[-0.04em] text-secondary-foreground">
            Relatórios gerados
          </h1>
          <p className="mt-2 max-w-2xl text-body text-secondary-foreground/75">
            Histórico completo com tipo, cliente, período, autor e versão de cada emissão.
          </p>
        </div>

        <div className="flex shrink-0 flex-wrap items-center gap-2">
          <Button nativeButton={false} render={<Link href="/relatorios/novo" />}>
            <Plus className="h-4 w-4" />
            Novo relatório
          </Button>
          <BackLink href="/relatorios" label="Central de Relatórios" />
        </div>
      </section>

      <HistoryView reports={reports} />
    </div>
  );
}
