import Link from "next/link";

import type { ClientProfile } from "@/lib/data/clients";

export function HouseholdTab({ client }: { client: ClientProfile }) {
  if (!client.household) {
    return (
      <div className="rounded-2xl border border-border bg-card p-8 text-center">
        <p className="text-body-sm text-muted-foreground">
          Este cliente não está vinculado a nenhum núcleo familiar.
        </p>
      </div>
    );
  }

  const { household } = client;

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-border bg-card p-5 md:p-6">
        <h3 className="text-h2 font-bold text-foreground">{household.name}</h3>
        {household.description ? (
          <p className="mt-2 text-body-sm text-muted-foreground">{household.description}</p>
        ) : null}
      </div>

      <div className="rounded-2xl border border-border bg-card p-5 md:p-6">
        <h3 className="mb-4 text-h2 font-bold text-foreground">Membros</h3>
        {household.household_members.length === 0 ? (
          <p className="text-body-sm text-muted-foreground">Nenhum membro cadastrado.</p>
        ) : (
          <div className="space-y-2">
            {household.household_members.map((member) => (
              <div
                key={member.id}
                className="flex items-center justify-between rounded-xl border border-border bg-muted/60 px-3.5 py-3 transition-colors duration-150 hover:bg-muted"
              >
                <div>
                  <p className="text-sm font-semibold text-foreground">
                    {member.client?.full_name ?? "—"}
                  </p>
                  <p className="text-xs font-medium uppercase text-muted-foreground">
                    {member.relationship ?? "Relação não informada"}
                  </p>
                </div>
                {member.client && member.client.id !== client.id ? (
                  <Link
                    href={`/clientes/${member.client.id}`}
                    className="text-xs font-semibold text-primary hover:underline"
                  >
                    Ver perfil
                  </Link>
                ) : null}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
