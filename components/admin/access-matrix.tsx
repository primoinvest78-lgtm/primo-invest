import { Layers } from "lucide-react";

import { APP_ROLES, MODULE_ACCESS, ROLE_LABEL } from "@/lib/admin/roles";

/**
 * Acesso real por módulo — não é uma intenção, é o que o código hoje
 * aplica (ver `lib/admin/roles.ts` → `MODULE_ACCESS`, levantado direto
 * dos arquivos de permissão e das páginas de cada módulo). A maioria
 * dos módulos não tem checagem de perfil: qualquer membro ativo
 * acessa, e a única fronteira real é `is_org_member` no RLS.
 */
export function AccessMatrix() {
  return (
    <section className="card-premium rounded-2xl p-5 md:p-6">
      <div className="flex items-center gap-2">
        <Layers className="h-4 w-4 text-primary" />
        <div>
          <p className="text-label font-bold uppercase text-card-beige-muted-foreground">
            Como o acesso funciona hoje
          </p>
          <h3 className="mt-0.5 text-h2 font-bold text-foreground">Acesso por módulo</h3>
        </div>
      </div>

      <div className="mt-4 overflow-x-auto rounded-2xl border border-black/10">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-black/10 bg-black/5 text-left">
              <th className="px-4 py-3 text-label font-bold uppercase text-card-beige-muted-foreground">Módulo</th>
              <th className="px-4 py-3 text-label font-bold uppercase text-card-beige-muted-foreground">Quem acessa</th>
              <th className="px-4 py-3 text-label font-bold uppercase text-card-beige-muted-foreground">Observação</th>
            </tr>
          </thead>
          <tbody>
            {MODULE_ACCESS.map((row) => (
              <tr key={row.module} className="border-b border-black/10 last:border-b-0">
                <td className="px-4 py-3 font-semibold text-foreground">{row.module}</td>
                <td className="px-4 py-3">
                  {row.allowedRoles === "all" ? (
                    <span className="rounded-full border border-primary/30 bg-primary/10 px-2 py-0.5 text-[10px] font-bold uppercase text-primary">
                      Qualquer membro ativo
                    </span>
                  ) : (
                    <div className="flex flex-wrap gap-1">
                      {row.allowedRoles.map((role) => (
                        <span
                          key={role}
                          className="rounded-full border border-warning/40 bg-warning/15 px-2 py-0.5 text-[10px] font-bold uppercase text-warning"
                        >
                          {ROLE_LABEL[role]}
                        </span>
                      ))}
                    </div>
                  )}
                </td>
                <td className="px-4 py-3 text-caption text-card-beige-muted-foreground">
                  {row.note ?? "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="mt-3 text-caption text-card-beige-muted-foreground">
        Perfis existentes: {APP_ROLES.map((r) => ROLE_LABEL[r]).join(", ")}.
      </p>
    </section>
  );
}
