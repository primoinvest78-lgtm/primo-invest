"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Check, Pencil, Trash2, X } from "lucide-react";
import { useState } from "react";

import { removeHouseholdMember, updateHouseholdMemberRelationship } from "@/lib/actions/household";
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
  const router = useRouter();
  const [deletedIds, setDeletedIds] = useState<Set<string>>(new Set());
  const [editingId, setEditingId] = useState<string | null>(null);
  const [relationshipDraft, setRelationshipDraft] = useState("");
  const [savingRelationship, setSavingRelationship] = useState(false);

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

  async function handleSaveRelationship(memberId: string) {
    setSavingRelationship(true);
    try {
      await updateHouseholdMemberRelationship(memberId, client.id, relationshipDraft);
      setEditingId(null);
      router.refresh();
    } finally {
      setSavingRelationship(false);
    }
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
                  {editingId === member.id ? (
                    <div className="mt-1 flex items-center gap-1.5">
                      <input
                        autoFocus
                        value={relationshipDraft}
                        onChange={(e) => setRelationshipDraft(e.target.value)}
                        placeholder="Ex.: Cônjuge, Filho(a)"
                        className="h-6 rounded-md border border-input bg-card px-1.5 text-xs text-foreground outline-none focus-visible:border-ring"
                      />
                      <button
                        type="button"
                        aria-label="Salvar relação"
                        disabled={savingRelationship}
                        onClick={() => handleSaveRelationship(member.id)}
                        className="text-primary hover:text-primary/70"
                      >
                        <Check className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        aria-label="Cancelar"
                        onClick={() => setEditingId(null)}
                        className="text-card-beige-muted-foreground hover:text-destructive"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ) : (
                    <p className="flex items-center gap-1.5 text-xs font-medium uppercase text-card-beige-muted-foreground">
                      {member.relationship ?? "Relação não informada"}
                      {member.client ? ` · ${member.client.wealth_goals.length} meta(s)` : ""}
                      <button
                        type="button"
                        aria-label="Editar relação"
                        onClick={() => {
                          setEditingId(member.id);
                          setRelationshipDraft(member.relationship ?? "");
                        }}
                        className="text-card-beige-muted-foreground/70 transition-colors hover:text-accent"
                      >
                        <Pencil className="h-3 w-3" />
                      </button>
                    </p>
                  )}
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
