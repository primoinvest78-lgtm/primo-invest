import Link from "next/link";
import { notFound } from "next/navigation";

import { GroupWorkspace } from "@/components/consortium-engine/group-workspace";
import { checkNumberingIntegrity } from "@/lib/consortium-engine/numbering.ts";
import { GROUP_STATUS_LABEL, labelOf } from "@/lib/consortium-engine/labels.ts";
import { getEngineGroup, listAssemblies, listEngineEvents, listGroupQuotas } from "@/lib/data/consortium-engine";
import { requireActiveMembership } from "@/lib/supabase/session";

export default async function GrupoMotorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { organizationId } = await requireActiveMembership();
  const group = await getEngineGroup(organizationId, id);
  if (!group) notFound();
  const [quotas, assemblies, events] = await Promise.all([
    listGroupQuotas(organizationId, id),
    listAssemblies(organizationId, id),
    listEngineEvents(organizationId, { groupId: id, limit: 40 }),
  ]);
  const integrity = checkNumberingIntegrity(
    group.numbering,
    quotas.map((q) => q.quotaNumber),
    quotas.length === group.quotaCount,
  );

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-3 rounded-2xl border border-white/10 p-5 shadow-panel-3d block-navy-3d md:flex-row md:items-end md:justify-between md:p-6">
        <div className="min-w-0">
          <Link href="/consorcios/motor" className="text-label font-bold uppercase text-primary hover:underline">
            Motor de apuração
          </Link>
          <h1 className="mt-2 text-h1 font-bold tracking-[-0.04em] text-secondary-foreground">
            Grupo {group.groupCode}
          </h1>
          <p className="mt-1 text-body text-secondary-foreground/75">
            {group.administratorName} {group.productType ? `· ${group.productType}` : ""} · {labelOf(GROUP_STATUS_LABEL, group.status)}
          </p>
        </div>
      </section>
      <GroupWorkspace group={group} quotas={quotas} assemblies={assemblies} events={events} integrity={integrity} />
    </div>
  );
}
