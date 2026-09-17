import { ShieldCheck } from "lucide-react";

import { APP_ROLES, ROLE_DESCRIPTION, ROLE_LABEL } from "@/lib/admin/roles";
import type { OrgMember } from "@/lib/admin/types";

/**
 * Os 7 perfis reais do sistema (`app_role`, o mesmo enum que a RLS do
 * banco usa) — não existe "Cliente" nem "Super Admin" como perfil de
 * usuário aqui: cliente é um registro de negócio (tabela `clients`),
 * separado de quem acessa a plataforma.
 */
export function RolesOverview({ members }: { members: OrgMember[] }) {
  const countByRole = new Map<string, number>();
  for (const m of members) countByRole.set(m.role, (countByRole.get(m.role) ?? 0) + 1);

  return (
    <section className="card-premium rounded-2xl p-5 md:p-6">
      <div className="flex items-center gap-2">
        <ShieldCheck className="h-4 w-4 text-primary" />
        <div>
          <p className="text-label font-bold uppercase text-card-beige-muted-foreground">Perfis</p>
          <h3 className="mt-0.5 text-h2 font-bold text-foreground">Perfis do sistema</h3>
        </div>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {APP_ROLES.map((role) => (
          <div key={role} className="rounded-2xl border border-black/10 p-4">
            <div className="flex items-center justify-between gap-2">
              <p className="font-bold text-foreground">{ROLE_LABEL[role]}</p>
              <span className="shrink-0 rounded-full border border-border bg-muted px-2 py-0.5 text-[10px] font-bold uppercase text-muted-foreground">
                {countByRole.get(role) ?? 0} {(countByRole.get(role) ?? 0) === 1 ? "usuário" : "usuários"}
              </span>
            </div>
            <p className="mt-1 text-body-sm text-card-beige-muted-foreground">{ROLE_DESCRIPTION[role]}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
