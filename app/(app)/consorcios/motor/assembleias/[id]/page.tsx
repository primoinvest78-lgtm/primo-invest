import Link from "next/link";
import { notFound } from "next/navigation";

import { AssemblyWorkspace } from "@/components/consortium-engine/assembly-workspace";
import { ASSEMBLY_STATUS_LABEL } from "@/lib/consortium-engine/state-machine.ts";
import {
  getAssemblyWorkspace,
  listAttachableBids,
  listDrawNumbers,
  listEngineRules,
  listLotteryResults,
  profileNames,
} from "@/lib/data/consortium-engine";
import { requireActiveMembership } from "@/lib/supabase/session";
import { formatDate } from "@/lib/utils/format";

export default async function AssembleiaMotorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { organizationId, role, userId } = await requireActiveMembership();
  const ws = await getAssemblyWorkspace(organizationId, id);
  if (!ws) notFound();

  const [rules, lottery, drawNumbers, attachable, names] = await Promise.all([
    listEngineRules(organizationId),
    listLotteryResults(organizationId),
    listDrawNumbers(organizationId, ws.runs.filter((r) => r.phase === "DRAW").map((r) => r.id)),
    listAttachableBids(ws.quotaByContract),
    profileNames([
      ...ws.runs.map((r) => r.createdBy),
      ...ws.retifications.flatMap((r) => [r.requestedBy, r.approvedBy]),
      ws.assembly.homologatedBy,
    ]),
  ]);
  const admin = ws.group.administratorName.trim().toLowerCase();
  const publishedRules = rules.filter(
    (r) => r.status === "PUBLISHED" && r.administratorName.trim().toLowerCase() === admin && (!r.groupId || r.groupId === ws.group.id),
  );
  const verifiedLottery = lottery.filter((l) => l.verificationStatus === "VERIFIED");

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-3 rounded-2xl border border-white/10 p-5 shadow-panel-3d block-navy-3d md:flex-row md:items-end md:justify-between md:p-6">
        <div className="min-w-0">
          <Link href="/consorcios/motor" className="text-label font-bold uppercase text-primary hover:underline">
            Motor de apuração
          </Link>
          <h1 className="mt-2 text-h1 font-bold tracking-[-0.04em] text-secondary-foreground">
            Assembleia nº {ws.assembly.assemblyNumber}
          </h1>
          <p className="mt-1 text-body text-secondary-foreground/75">
            <Link href={`/consorcios/motor/grupos/${ws.group.id}`} className="hover:underline">
              Grupo {ws.group.groupCode} · {ws.group.administratorName}
            </Link>{" "}
            · {formatDate(ws.assembly.assemblyDate)} · {ASSEMBLY_STATUS_LABEL[ws.assembly.status]}
          </p>
        </div>
      </section>
      <AssemblyWorkspace
        ws={ws}
        role={role}
        userId={userId}
        publishedRules={publishedRules}
        verifiedLottery={verifiedLottery}
        drawNumbers={drawNumbers}
        attachable={attachable}
        names={names}
      />
    </div>
  );
}
