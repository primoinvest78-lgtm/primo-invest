import Link from "next/link";
import { notFound } from "next/navigation";

import { CreditWorkspaceView } from "@/components/consortium-engine/credit-workspace";
import { listEngineEvents } from "@/lib/data/consortium-engine";
import { getCreditWorkspace } from "@/lib/data/consortium-credit";
import { requireActiveMembership } from "@/lib/supabase/session";

export default async function CreditoMotorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { organizationId, role } = await requireActiveMembership();
  const ws = await getCreditWorkspace(organizationId, id);
  if (!ws) notFound();
  const events = await listEngineEvents(organizationId, { entityId: id, limit: 40 });
  const op = ws.operation;

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-3 rounded-2xl border border-white/10 p-5 shadow-panel-3d block-navy-3d md:p-6">
        <Link href="/consorcios/motor" className="text-label font-bold uppercase text-primary hover:underline">
          Motor de apuração · Crédito
        </Link>
        <h1 className="text-h1 font-bold tracking-[-0.04em] text-secondary-foreground">Cota {op.quotaLabel ?? op.quotaNumber ?? "—"}</h1>
        <p className="text-body text-secondary-foreground/75">
          {op.administratorName} · grupo {op.groupCode}
          {op.holderLabel ? ` · ${op.holderLabel}` : ""}
          {op.assemblyId ? (
            <>
              {" · "}
              <Link href={`/consorcios/motor/assembleias/${op.assemblyId}`} className="hover:underline">
                contemplada na assembleia nº {op.assemblyNumber}
              </Link>
            </>
          ) : null}
        </p>
      </section>
      <CreditWorkspaceView ws={ws} role={role} events={events} />
    </div>
  );
}
