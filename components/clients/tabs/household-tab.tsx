"use client";

import Link from "next/link";
import { Trash2 } from "lucide-react";
import { useState } from "react";

import { removeHouseholdMember } from "@/lib/actions/household";
import type { ClientProfile } from "@/lib/data/clients";
import { formatCurrencyBRL } from "@/lib/utils/format";

function memberWealth(member: NonNullable<ClientProfile["household"]>["household_members"][number]) {
  if (!member.client) return 0;
  return member.client.financial_accounts.reduce(
    (sum, account) => sum + account.holdings.reduce((s, h) => s + Number(h.valuation ?? 0), 0),
    0,
  );
}

export function HouseholdTab({ client }: { client: ClientProfile }) {
  const [deletedIds, setDeletedIds] = useState<Set<string>>(new Set());

  if (!client.household) {
    return (
      <div className="card-premium rounded-2xl p-8 text-center">
        <p className="text-body-sm text-card-beige-muted-foreground">
          Este cliente não está vinculado a nenhum núcleo familiar. Use &quot;Novo membro
          familiar&quot; nas ações rápidas pra criar um.
        </p>
      </div>
    );
  }

  const { household } = client;
  const members = household.household_members.filter((m) => !deletedIds.has(m.id));
  const consolidatedWealth = members.reduce((sum, m) => sum + memberWealth(m), 0);
  const consolidatedGoals = members.reduce(
    (sum, m) => sum + (m.client?.wealth_goals.length ?? 0),
    0,
  );

  async function handleRemove(memberId: string) {
    if (!window.confirm("Remover este membro do núcleo familiar?")) return;
    setDeletedIds((prev) => new Set(prev).add(memberId));
    await removeHouseholdMember(memberId, client.id);
  }

  return (
    <div className="space-y-5">
      <div className="card-premium rounded-2xl p-5 md:p-6">
        <h3 className="text-h2 font-bold text-foreground">{household.name}</h3>
        {household.description ? (
          <p className="mt-2 text-body-sm text-card-beige-muted-foreground">{household.description}</p>
        ) : null}

        <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3">
          <div>
            <p className="text-label font-bold uppercase text-card-beige-muted-foreground">
              Patrimônio consolidado
            </p>
            <p className="mt-1 text-lg font-bold text-foreground">
              {formatCurrencyBRL(consolidatedWealth)}
            </p>
          </div>
          <div>
            <p className="text-label font-bold uppercase text-card-beige-muted-foreground">
              Membros
            </p>
            <p className="mt-1 text-lg font-bold text-foreground">{members.length}</p>
          </div>
          <div>
            <p className="text-label font-bold uppercase text-card-beige-muted-foreground">
              Metas da família
            </p>
            <p className="mt-1 text-lg font-bold text-foreground">{consolidatedGoals}</p>
          </div>
        </div>
      </div>

      <div className="card-premium rounded-2xl p-5 md:p-6">
        <h3 className="mb-4 text-h2 font-bold text-foreground">Membros</h3>
        {members.length === 0 ? (
          <p className="text-body-sm text-card-beige-muted-foreground">Nenhum membro cadastrado.</p>
        ) : (
          <div className="space-y-2">
            {members.map((member) => (
              <div
                key={member.id}
                className="flex items-center justify-between rounded-xl border border-black/10 bg-black/5 px-3.5 py-3 transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/40 hover:bg-black/10"
              >
                <div>
                  <p className="text-sm font-semibold text-foreground">
                    {member.client?.full_name ?? "—"}
                  </p>
                  <p className="text-xs font-medium uppercase text-card-beige-muted-foreground">
                    {member.relationship ?? "Relação não informada"}
                    {member.client ? ` · ${member.client.wealth_goals.length} meta(s)` : ""}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-semibold text-foreground">
                    {formatCurrencyBRL(memberWealth(member))}
                  </span>
                  {member.client && member.client.id !== client.id ? (
                    <Link
                      href={`/clientes/${member.client.id}`}
                      className="text-xs font-semibold text-accent hover:underline"
                    >
                      Ver perfil
                    </Link>
                  ) : null}
                  <button
                    type="button"
                    aria-label="Remover membro"
                    onClick={() => handleRemove(member.id)}
                    className="text-card-beige-muted-foreground transition-colors hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
