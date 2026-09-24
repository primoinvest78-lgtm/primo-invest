import Link from "next/link";

import { IntelligenceHub } from "@/components/consortium-engine/intelligence/intelligence-hub";
import { analyzeNumbers } from "@/lib/consortium-intelligence/number-analysis";
import { ensureRecentScan } from "@/lib/consortium-intelligence/monitor";
import { listCreditOperations } from "@/lib/data/consortium-credit";
import { listAssemblies, listEngineEvents, listEngineGroups, listEngineRules } from "@/lib/data/consortium-engine";
import { listAttemptRowsForGroup, listAutomationRuns, listFindings, listSimulations } from "@/lib/data/consortium-intelligence";
import { requireActiveMembership } from "@/lib/supabase/session";

const OPERATE = ["admin", "manager", "operations", "advisor", "compliance", "finance"];

export default async function InteligenciaMotorPage({ searchParams }: { searchParams: Promise<{ grupo?: string }> }) {
  const { grupo } = await searchParams;
  const { organizationId, role } = await requireActiveMembership();

  // Monitoramento contínuo: reexecuta a varredura se a última tiver
  // mais de 30 minutos (registrada como ON_VIEW no log).
  if (OPERATE.includes(role)) await ensureRecentScan(organizationId);

  const [groups, assemblies, rules, findings, simulations, automation, events, credits] = await Promise.all([
    listEngineGroups(organizationId),
    listAssemblies(organizationId),
    listEngineRules(organizationId),
    listFindings(organizationId),
    listSimulations(organizationId),
    listAutomationRuns(organizationId),
    listEngineEvents(organizationId, { limit: 30 }),
    listCreditOperations(organizationId),
  ]);
  const group = groups.find((g) => g.id === grupo) ?? groups[0] ?? null;
  const analysis = group ? analyzeNumbers(await listAttemptRowsForGroup(organizationId, group.id), group.numbering, group.quotaCount > 2000 ? 500 : group.quotaCount > 200 ? 100 : 10) : null;

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-3 rounded-2xl border border-white/10 p-5 shadow-panel-3d block-navy-3d md:flex-row md:items-end md:justify-between md:p-6">
        <div className="min-w-0">
          <Link href="/consorcios/motor" className="text-label font-bold uppercase text-primary hover:underline">
            Motor de apuração
          </Link>
          <h1 className="mt-2 text-h1 font-bold tracking-[-0.04em] text-secondary-foreground">Inteligência de consórcios</h1>
          <p className="mt-2 max-w-3xl text-body text-secondary-foreground/75">
            Monitora, explica, detecta e simula em cima do motor determinístico — nunca decide contemplação, nunca altera resultado
            oficial. Toda análise vem de regra determinística identificada e aponta a evidência.
          </p>
        </div>
      </section>
      <IntelligenceHub
        role={role}
        groups={groups}
        selectedGroupId={group?.id ?? null}
        assemblies={assemblies}
        rules={rules}
        findings={findings}
        simulations={simulations}
        automation={automation}
        events={events}
        credits={credits}
        analysis={analysis}
      />
    </div>
  );
}
