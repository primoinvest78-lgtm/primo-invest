"use client";

import { Check, KeyRound, Loader2, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { setRolePermission } from "@/lib/actions/admin";
import {
  APP_ROLES,
  PERMISSION_MODULE_LABEL,
  PERMISSION_MODULE_ORDER,
  ROLE_LABEL,
  type AppRole,
} from "@/lib/admin/roles";
import type { RolePermissionGrant } from "@/lib/admin/types";

function GrantCell({
  role,
  code,
  granted,
  canManage,
}: {
  role: AppRole;
  code: string;
  granted: boolean;
  canManage: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function toggle() {
    if (!canManage) return;
    startTransition(async () => {
      await setRolePermission(role, code, !granted);
      router.refresh();
    });
  }

  return (
    <button
      type="button"
      disabled={!canManage || pending}
      onClick={toggle}
      className={[
        "flex h-8 w-8 items-center justify-center rounded-lg border transition-all duration-150",
        granted ? "border-primary/40 bg-primary/15 text-primary" : "border-border bg-muted/40 text-muted-foreground",
        canManage ? "cursor-pointer hover:opacity-80" : "cursor-default opacity-70",
      ].join(" ")}
      aria-label={granted ? "Concedida" : "Não concedida"}
    >
      {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : granted ? <Check className="h-3.5 w-3.5" /> : <X className="h-3.5 w-3.5" />}
    </button>
  );
}

/**
 * Grade de permissões granulares — mexe direto em `role_permissions`,
 * a tabela real já preparada no banco (17 códigos módulo.read/
 * módulo.write). Começa vazia hoje porque ninguém configurou ainda —
 * não preenchemos nada sozinhos, só damos o controle pra quem é
 * Administrador.
 */
export function PermissionGrid({ grants, canManage }: { grants: RolePermissionGrant[]; canManage: boolean }) {
  const [role, setRole] = useState<AppRole>("admin");

  const grantedSet = new Set(grants.filter((g) => g.role === role).map((g) => g.permissionCode));
  const configuredCount = grants.length;

  return (
    <section className="card-premium rounded-2xl p-5 md:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <KeyRound className="h-4 w-4 text-primary" />
          <div>
            <p className="text-label font-bold uppercase text-card-beige-muted-foreground">
              Permissões granulares
            </p>
            <h3 className="mt-0.5 text-h2 font-bold text-foreground">Matriz de permissões</h3>
          </div>
        </div>
        <span className="text-caption text-card-beige-muted-foreground">
          {configuredCount === 0
            ? "Nenhuma concessão configurada ainda"
            : `${configuredCount} ${configuredCount === 1 ? "concessão configurada" : "concessões configuradas"}`}
        </span>
      </div>

      <p className="mt-2 text-body-sm text-card-beige-muted-foreground">
        Controla, por perfil, se cada módulo é só de visualização ou também administrável. Módulos sem
        permissão granular (Leads, Oportunidades, Tarefas, Consórcios) seguem liberados para qualquer
        membro ativo — ver &ldquo;Acesso por módulo&rdquo; acima.
      </p>

      <div className="mt-4 flex flex-wrap gap-1.5">
        {APP_ROLES.map((r) => (
          <Button key={r} size="sm" variant={role === r ? "default" : "outline"} onClick={() => setRole(r)}>
            {ROLE_LABEL[r]}
          </Button>
        ))}
      </div>

      <div className="mt-4 overflow-x-auto rounded-2xl border border-black/10">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-black/10 bg-black/5 text-left">
              <th className="px-4 py-3 text-label font-bold uppercase text-card-beige-muted-foreground">Módulo</th>
              <th className="px-4 py-3 text-center text-label font-bold uppercase text-card-beige-muted-foreground">Visualizar</th>
              <th className="px-4 py-3 text-center text-label font-bold uppercase text-card-beige-muted-foreground">Administrar</th>
            </tr>
          </thead>
          <tbody>
            {PERMISSION_MODULE_ORDER.map((moduleKey) => (
              <tr key={moduleKey} className="border-b border-black/10 last:border-b-0">
                <td className="px-4 py-3 font-semibold text-foreground">{PERMISSION_MODULE_LABEL[moduleKey]}</td>
                <td className="px-4 py-3">
                  <div className="flex justify-center">
                    <GrantCell role={role} code={`${moduleKey}.read`} granted={grantedSet.has(`${moduleKey}.read`)} canManage={canManage} />
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="flex justify-center">
                    <GrantCell role={role} code={`${moduleKey}.write`} granted={grantedSet.has(`${moduleKey}.write`)} canManage={canManage} />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
