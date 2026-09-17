"use client";

import { useMemo, useState } from "react";

import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { AccountMovement } from "@/lib/data/wealth";
import { formatCurrencyBRL, formatDate } from "@/lib/utils/format";
import { MOVEMENT_TYPE_LABEL } from "@/lib/utils/investment-helpers";

export function AccountMovementsTable({ movements }: { movements: AccountMovement[] }) {
  const [type, setType] = useState("all");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const types = useMemo(() => {
    const set = new Set(movements.map((m) => m.transactionType));
    return Array.from(set);
  }, [movements]);

  const filtered = useMemo(() => {
    return movements.filter((m) => {
      if (type !== "all" && m.transactionType !== type) return false;
      if (from && m.transactionDate.slice(0, 10) < from) return false;
      if (to && m.transactionDate.slice(0, 10) > to) return false;
      return true;
    });
  }, [movements, type, from, to]);

  if (movements.length === 0) {
    return (
      <div className="card-premium rounded-2xl p-8 text-center">
        <p className="text-body-sm text-card-beige-muted-foreground">
          Nenhuma movimentação registrada pra essa conta.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-end gap-2.5">
        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-bold uppercase text-card-beige-muted-foreground">Tipo</label>
          <Select value={type} onValueChange={(v) => setType(v ?? "all")}>
            <SelectTrigger className="w-[150px]" size="sm">
              <SelectValue placeholder="Todos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              {types.map((t) => (
                <SelectItem key={t} value={t}>
                  {MOVEMENT_TYPE_LABEL[t] ?? t}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-bold uppercase text-card-beige-muted-foreground">De</label>
          <Input type="date" className="h-7 w-[140px] text-sm" value={from} onChange={(e) => setFrom(e.target.value)} />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-bold uppercase text-card-beige-muted-foreground">Até</label>
          <Input type="date" className="h-7 w-[140px] text-sm" value={to} onChange={(e) => setTo(e.target.value)} />
        </div>
      </div>

      <div className="card-premium overflow-x-auto rounded-2xl">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-black/10 bg-black/5 text-left">
              <th className="px-4 py-3 text-label font-bold uppercase text-card-beige-muted-foreground">
                Data
              </th>
              <th className="px-4 py-3 text-label font-bold uppercase text-card-beige-muted-foreground">
                Tipo
              </th>
              <th className="px-4 py-3 text-label font-bold uppercase text-card-beige-muted-foreground">
                Descrição
              </th>
              <th className="px-4 py-3 text-label font-bold uppercase text-card-beige-muted-foreground">
                Categoria
              </th>
              <th className="px-4 py-3 text-label font-bold uppercase text-card-beige-muted-foreground">
                Valor
              </th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-body-sm text-card-beige-muted-foreground">
                  Nenhuma movimentação encontrada com esses filtros.
                </td>
              </tr>
            ) : (
              filtered.map((m) => (
                <tr
                  key={m.id}
                  className="border-b border-black/10 last:border-b-0 transition-colors duration-200 hover:bg-black/5"
                >
                  <td className="px-4 py-3 text-card-beige-muted-foreground">{formatDate(m.transactionDate)}</td>
                  <td className="px-4 py-3 font-semibold text-foreground">
                    {MOVEMENT_TYPE_LABEL[m.transactionType] ?? m.transactionType}
                  </td>
                  <td className="px-4 py-3 text-card-beige-muted-foreground">{m.description ?? "—"}</td>
                  <td className="px-4 py-3 text-card-beige-muted-foreground">{m.productName ?? "—"}</td>
                  <td className="px-4 py-3 font-semibold text-foreground">{formatCurrencyBRL(m.amount)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
