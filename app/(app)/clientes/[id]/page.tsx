import { notFound } from "next/navigation";

import { ClientProfileTabs } from "@/components/clients/client-profile-tabs";
import { NewTaskDialog } from "@/components/tasks/new-task-dialog";
import { getClientProfile } from "@/lib/data/clients";
import { requireActiveMembership } from "@/lib/supabase/session";

export default async function ClientProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { organizationId } = await requireActiveMembership();
  const client = await getClientProfile(organizationId, id);

  if (!client) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-4 block-navy-3d rounded-2xl p-5 md:flex-row md:items-end md:justify-between md:p-6">
        <div className="min-w-0">
          <p className="text-label font-bold uppercase text-primary">Cliente</p>
          <h1 className="mt-2 text-h1 font-bold tracking-[-0.04em] text-secondary-foreground">
            {client.full_name}
          </h1>
          <p className="mt-2 max-w-2xl text-body text-secondary-foreground/75">
            {client.assigned_advisor?.full_name
              ? `Assessor responsável: ${client.assigned_advisor.full_name}`
              : "Sem assessor vinculado"}
          </p>
        </div>

        <NewTaskDialog clientId={client.id} />
      </section>

      <ClientProfileTabs client={client} />
    </div>
  );
}
