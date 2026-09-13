"use client";

import { ChevronRight } from "lucide-react";
import Link from "next/link";
import { Fragment, useMemo, useState } from "react";

import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AccountDeleteDialog } from "@/components/wealth/account-delete-dialog";
import { AccountEditDialog } from "@/components/wealth/account-edit-dialog";
import type { AccountDetail } from "@/lib/data/wealth";
import {
  computeAccountBalances,
  computeAccountsNeedingAttention,
  maskAccountId,
} from "@/lib/utils/account-helpers";
import { formatCurrencyBRL, formatDate } from "@/lib/utils/format";

type SortKey = "balance" | "name" | "updated";
type GroupKey = "none" | "institution" | "client";

function AccountRow({
  account,
  needsAttention,
  clients,
}: {
  account: AccountDetail;
  needsAttention: boolean;
  clients: { id: string; fullName: string }[];
}) {
  const { balance, investedBalance, liquidBalance } = computeAccountBalances(account);

  return (
    <tr className="group border-b border-black/10 border-l-2 border-l-transparent last:border-b-0 transition-all duration-200 hover:border-l-primary hover:bg-black/5">
      <td className="px-4 py-3">
        <Link
          href={`/patrimonio/contas/${account.id}`}
          className="flex items-center gap-1.5 font-semibold text-foreground hover:text-primary"
        >
          {account.accountName ?? "Conta"}
          <ChevronRight className="h-3.5 w-3.5 opacity-0 transition-opacity group-hover:opacity-100" />
        </Link>
        <p className="text-xs text-card-beige-muted-foreground">{maskAccountId(account.id)}</p>
      </td>
      <td className="px-4 py-3 text-card-beige-muted-foreground">{account.institutionName ?? "—"}</td>
      <td className="px-4 py-3">
        {account.clientId ? (
          <Link href={`/clientes/${account.clientId}`} className="text-foreground hover:text-primary">
            {account.clientName}
          </Link>
        ) : (
          <span className="text-card-beige-muted-foreground">—</span>
        )}
      </td>
      <td className="px-4 py-3 text-card-beige-muted-foreground">{account.accountType}</td>
      <td className="px-4 py-3 font-semibold text-foreground">{formatCurrencyBRL(balance)}</td>
      <td className="px-4 py-3 text-card-beige-muted-foreground">{formatCurrencyBRL(investedBalance)}</td>
      <td className="px-4 py-3 text-card-beige-muted-foreground">{formatCurrencyBRL(liquidBalance)}</td>
      <td className="px-4 py-3 text-card-beige-muted-foreground">{account.holdings.length}</td>
      <td className="px-4 py-3 text-card-beige-muted-foreground">{formatDate(account.updatedAt)}</td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          <Badge variant={account.status === "active" ? "default" : "outline"}>
            {account.status === "active" ? "Ativa" : "Inativa"}
          </Badge>
          {needsAttention ? <Badge variant="destructive">Atenção</Badge> : null}
        </div>
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center justify-end gap-2 opacity-0 transition-opacity group-hover:opacity-100">
          <AccountEditDialog account={account} clients={clients} />
          <AccountDeleteDialog account={account} />
        </div>
      </td>
    </tr>
  );
}

function GroupHeaderRow({ label, count, balance }: { label: string; count: number; balance: number }) {
  return (
    <tr className="bg-primary/5">
      <td colSpan={11} className="px-4 py-2 text-xs font-bold uppercase tracking-wide text-primary">
        {label} · {count} {count === 1 ? "conta" : "contas"} · {formatCurrencyBRL(balance)}
      </td>
    </tr>
  );
}

export function AccountsTable({
  accounts,
  clients,
}: {
  accounts: AccountDetail[];
  clients: { id: string; fullName: string }[];
}) {
  const [sortKey, setSortKey] = useState<SortKey>("balance");
  const [groupBy, setGroupBy] = useState<GroupKey>("none");

  const attentionIds = useMemo(() => computeAccountsNeedingAttention(accounts), [accounts]);

  const sorted = useMemo(() => {
    return [...accounts].sort((a, b) => {
      if (sortKey === "name") return (a.accountName ?? "").localeCompare(b.accountName ?? "");
      if (sortKey === "updated") return (b.updatedAt ?? "").localeCompare(a.updatedAt ?? "");
      return computeAccountBalances(b).balance - computeAccountBalances(a).balance;
    });
  }, [accounts, sortKey]);

  const groups = useMemo(() => {
    if (groupBy === "none") return [{ label: null, accounts: sorted }];

    const map = new Map<string, AccountDetail[]>();
    for (const account of sorted) {
      const key =
        groupBy === "institution"
          ? account.institutionName ?? "Sem instituição"
          : account.clientName ?? "Sem cliente vinculado";
      const list = map.get(key) ?? [];
      list.push(account);
      map.set(key, list);
    }
    return Array.from(map.entries()).map(([label, list]) => ({ label, accounts: list }));
  }, [sorted, groupBy]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h3 className="text-h2 font-bold text-foreground">Contas</h3>
        <div className="flex gap-2">
          <Select value={groupBy} onValueChange={(v) => setGroupBy((v as GroupKey) ?? "none")}>
            <SelectTrigger className="w-full sm:w-[180px]" size="sm">
              <SelectValue placeholder="Agrupar por" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Sem agrupamento</SelectItem>
              <SelectItem value="institution">Agrupar por instituição</SelectItem>
              <SelectItem value="client">Agrupar por cliente</SelectItem>
            </SelectContent>
          </Select>
          <Select value={sortKey} onValueChange={(v) => setSortKey((v as SortKey) ?? "balance")}>
            <SelectTrigger className="w-full sm:w-[170px]" size="sm">
              <SelectValue placeholder="Ordenar por" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="balance">Maior saldo</SelectItem>
              <SelectItem value="name">Nome (A-Z)</SelectItem>
              <SelectItem value="updated">Atualizadas recentemente</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="card-premium overflow-x-auto rounded-2xl">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-black/10 bg-black/5 text-left">
              <th className="px-4 py-3 text-label font-bold uppercase text-card-beige-muted-foreground">
                Conta
              </th>
              <th className="px-4 py-3 text-label font-bold uppercase text-card-beige-muted-foreground">
                Instituição
              </th>
              <th className="px-4 py-3 text-label font-bold uppercase text-card-beige-muted-foreground">
                Titular
              </th>
              <th className="px-4 py-3 text-label font-bold uppercase text-card-beige-muted-foreground">
                Tipo
              </th>
              <th className="px-4 py-3 text-label font-bold uppercase text-card-beige-muted-foreground">
                Saldo
              </th>
              <th className="px-4 py-3 text-label font-bold uppercase text-card-beige-muted-foreground">
                Investido
              </th>
              <th className="px-4 py-3 text-label font-bold uppercase text-card-beige-muted-foreground">
                Liquidez
              </th>
              <th className="px-4 py-3 text-label font-bold uppercase text-card-beige-muted-foreground">
                Investimentos
              </th>
              <th className="px-4 py-3 text-label font-bold uppercase text-card-beige-muted-foreground">
                Atualizada em
              </th>
              <th className="px-4 py-3 text-label font-bold uppercase text-card-beige-muted-foreground">
                Status
              </th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {accounts.length === 0 ? (
              <tr>
                <td colSpan={11} className="px-4 py-10 text-center text-body-sm text-card-beige-muted-foreground">
                  Nenhuma conta encontrada.
                </td>
              </tr>
            ) : (
              groups.map((group) => (
                <Fragment key={group.label ?? "all"}>
                  {group.label ? (
                    <GroupHeaderRow
                      label={group.label}
                      count={group.accounts.length}
                      balance={group.accounts.reduce((sum, a) => sum + computeAccountBalances(a).balance, 0)}
                    />
                  ) : null}
                  {group.accounts.map((account) => (
                    <AccountRow
                      key={account.id}
                      account={account}
                      needsAttention={attentionIds.has(account.id)}
                      clients={clients}
                    />
                  ))}
                </Fragment>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
