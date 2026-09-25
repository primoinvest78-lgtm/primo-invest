import Link from "next/link";

import { EngineHub } from "@/components/consortium-engine/engine-hub";
import { listContemplationsWithoutCredit, listCreditOperations } from "@/lib/data/consortium-credit";
import {
  listAssemblies,
  listEngineEvents,
  listEngineGroups,
  listEngineRules,
  listLotteryResults,
} from "@/lib/data/consortium-engine";
import { requireActiveMembership } from "@/lib/supabase/session";

export default async function MotorConsorciosPage() {
  const { organizationId, role } = await requireActiveMembership();
  const [groups, rules, lottery, assemblies, events, credits, pendingCredit] = await Promise.all([
    listEngineGroups(organizationId),
    listEngineRules(organizationId),
    listLotteryResults(organizationId),
    listAssemblies(organizationId),
    listEngineEvents(organizationId, { limit: 60 }),
    listCreditOperations(organizationId),
    listContemplationsWithoutCredit(organizationId),
  ]);

  const inProgress = assemblies.filter((a) => !["COMPLETED", "LOCKED"].includes(a.status)).length;

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-4 rounded-2xl border border-white/10 p-5 shadow-panel-3d block-navy-3d md:flex-row md:items-end md:justify-between md:p-6">
        <div className="min-w-0">
          <p className="text-label font-bold uppercase text-primary">Consórcios</p>
          <h1 className="mt-2 text-h1 font-bold tracking-[-0.04em] text-secondary-foreground">Motor de apuração</h1>
          <p className="mt-2 max-w-3xl text-body text-secondary-foreground/75">
            Grupos, regras versionadas, resultado oficial da Loteria Federal, assembleias, contemplações e crédito. Com
            Loteria Federal, o sistema consome o resultado oficial; quando o contrato prevê sorteio próprio, usa a roleta auditável. Em
            ambos os casos aplica a regra publicada do grupo.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/consorcios/motor/treinamento"
            className="rounded-lg border border-amber-400/60 bg-amber-400/15 px-3.5 py-2 text-xs font-semibold text-secondary-foreground transition-colors hover:border-primary hover:bg-white/15"
          >
            Treinamento · Roleta
          </Link>
          <Link
            href="/consorcios/motor/inteligencia"
            className="rounded-lg border border-white/20 bg-white/10 px-3.5 py-2 text-xs font-semibold text-secondary-foreground transition-colors hover:border-primary hover:bg-white/15"
          >
            Inteligência
          </Link>
          <Link
            href="/consorcios"
            className="rounded-lg border border-white/20 bg-white/10 px-3.5 py-2 text-xs font-semibold text-secondary-foreground transition-colors hover:border-primary hover:bg-white/15"
          >
            Visão geral de consórcios
          </Link>
        </div>
      </section>

      <EngineHub
        role={role}
        groups={groups}
        rules={rules}
        lottery={lottery}
        assemblies={assemblies}
        events={events}
        credits={credits}
        pendingCredit={pendingCredit}
        inProgress={inProgress}
      />
    </div>
  );
}
