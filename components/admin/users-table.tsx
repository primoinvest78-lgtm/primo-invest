"use client";

import { Loader2, Power, PowerOff } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { AddUserDialog } from "@/components/admin/add-user-dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { setMemberStatus, updateMemberRole } from "@/lib/actions/admin";
import type { OrgMember } from "@/lib/admin/types";
import { APP_ROLES, MEMBER_STATUS_BADGE_CLASS, MEMBER_STATUS_LABEL, ROLE_LABEL, type AppRole } from "@/lib/admin/roles";
import { formatDate, formatDateTime } from "@/lib/utils/format";

function RoleSelect({ member, disabled }: { member: OrgMember; disabled: boolean }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleChange(value: string | null) {
    if (!value || value === member.role) return;
    setError(null);
    startTransition(async () => {
      const result = await updateMemberRole(member.memberId, value as AppRole);
      if (result.message) setError(result.message);
      router.refresh();
    });
  }

  return (
    <div className="min-w-[160px]">
      <Select value={member.role} onValueChange={handleChange} disabled={disabled || pending}>
        <SelectTrigger className="w-full">
          <SelectValue>{() => ROLE_LABEL[member.role]}</SelectValue>
        </SelectTrigger>
        <SelectContent>
          {APP_ROLES.map((role) => (
            <SelectItem key={role} value={role}>
              {ROLE_LABEL[role]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {error ? <p className="mt-1 text-caption text-destructive">{error}</p> : null}
    </div>
  );
}

function StatusToggle({ member, disabled }: { member: OrgMember; disabled: boolean }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  if (member.status === "invited") {
    return (
      <span className={["inline-flex rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase", MEMBER_STATUS_BADGE_CLASS.invited].join(" ")}>
        {MEMBER_STATUS_LABEL.invited}
      </span>
    );
  }

  const nextStatus = member.status === "active" ? "inactive" : "active";

  function handleToggle() {
    setError(null);
    startTransition(async () => {
      const result = await setMemberStatus(member.memberId, nextStatus);
      if (result.message) setError(result.message);
      router.refresh();
    });
  }

  return (
    <div className="flex items-center gap-2">
      <span className={["inline-flex rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase", MEMBER_STATUS_BADGE_CLASS[member.status]].join(" ")}>
        {MEMBER_STATUS_LABEL[member.status]}
      </span>
      <Button size="icon-sm" variant="ghost" disabled={disabled || pending} onClick={handleToggle} aria-label={nextStatus === "active" ? "Ativar" : "Desativar"}>
        {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : nextStatus === "active" ? <Power className="h-3.5 w-3.5" /> : <PowerOff className="h-3.5 w-3.5" />}
      </Button>
      {error ? <p className="text-caption text-destructive">{error}</p> : null}
    </div>
  );
}

export function UsersTable({
  members,
  addedByNames,
  canManage,
  onViewActivities,
}: {
  members: OrgMember[];
  addedByNames: Map<string, string>;
  canManage: boolean;
  onViewActivities: (userId: string) => void;
}) {
  return (
    <section className="card-premium rounded-2xl p-5 md:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-label font-bold uppercase text-card-beige-muted-foreground">Usuários</p>
          <h3 className="mt-0.5 text-h2 font-bold text-foreground">Usuários da organização</h3>
        </div>
        {canManage ? <AddUserDialog /> : null}
      </div>

      <div className="mt-4 overflow-x-auto rounded-2xl border border-black/10">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-black/10 bg-black/5 text-left">
              <th className="px-4 py-3 text-label font-bold uppercase text-card-beige-muted-foreground">Nome</th>
              <th className="px-4 py-3 text-label font-bold uppercase text-card-beige-muted-foreground">E-mail</th>
              <th className="px-4 py-3 text-label font-bold uppercase text-card-beige-muted-foreground">Perfil</th>
              <th className="px-4 py-3 text-label font-bold uppercase text-card-beige-muted-foreground">Status</th>
              <th className="px-4 py-3 text-label font-bold uppercase text-card-beige-muted-foreground">Último acesso</th>
              <th className="px-4 py-3 text-label font-bold uppercase text-card-beige-muted-foreground">Criado em</th>
              <th className="px-4 py-3 text-label font-bold uppercase text-card-beige-muted-foreground">Responsável</th>
              <th className="px-4 py-3 text-label font-bold uppercase text-card-beige-muted-foreground">Atividades</th>
            </tr>
          </thead>
          <tbody>
            {members.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-10 text-center text-body-sm text-card-beige-muted-foreground">
                  Nenhum usuário encontrado.
                </td>
              </tr>
            ) : (
              members.map((member) => (
                <tr key={member.memberId} className="border-b border-black/10 last:border-b-0">
                  <td className="px-4 py-3 font-semibold text-foreground">{member.fullName ?? "Sem nome"}</td>
                  <td className="px-4 py-3 text-card-beige-muted-foreground">{member.email}</td>
                  <td className="px-4 py-3">
                    <RoleSelect member={member} disabled={!canManage} />
                  </td>
                  <td className="px-4 py-3">
                    <StatusToggle member={member} disabled={!canManage} />
                  </td>
                  <td className="px-4 py-3 text-card-beige-muted-foreground">
                    {member.lastSignInAt ? formatDateTime(member.lastSignInAt) : "Não disponível"}
                  </td>
                  <td className="px-4 py-3 text-card-beige-muted-foreground">{formatDate(member.memberCreatedAt)}</td>
                  <td className="px-4 py-3 text-card-beige-muted-foreground">
                    {addedByNames.get(member.memberId) ?? "Não disponível"}
                  </td>
                  <td className="px-4 py-3">
                    <Button size="sm" variant="ghost" onClick={() => onViewActivities(member.userId)}>
                      Ver atividades
                    </Button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
