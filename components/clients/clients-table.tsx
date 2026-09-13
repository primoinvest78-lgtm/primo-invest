"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { ClientListItem } from "@/lib/data/clients";
import { formatCurrencyBRL } from "@/lib/utils/format";

const RISK_LABEL: Record<ClientListItem["riskProfile"], string> = {
  vigente: "Vigente",
  vencido: "Vencido",
  inexistente: "Não iniciado",
};

const RISK_VARIANT: Record<ClientListItem["riskProfile"], "default" | "destructive" | "outline"> =
  {
    vigente: "default",
    vencido: "destructive",
    inexistente: "outline",
  };

export function ClientsTable({ clients }: { clients: ClientListItem[] }) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [advisorFilter, setAdvisorFilter] = useState("all");

  const advisors = useMemo(() => {
    const names = new Set(clients.map((c) => c.assignedAdvisorName).filter(Boolean) as string[]);
    return Array.from(names).sort();
  }, [clients]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return clients.filter((client) => {
      if (term && !client.fullName.toLowerCase().includes(term)) return false;
      if (statusFilter !== "all" && client.status !== statusFilter) return false;
      if (advisorFilter !== "all" && client.assignedAdvisorName !== advisorFilter) return false;
      return true;
    });
  }, [clients, search, statusFilter, advisorFilter]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-center">
        <Input
          placeholder="Buscar por nome..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="md:max-w-xs"
        />

        <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value ?? "all")}>
          <SelectTrigger className="md:w-[180px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os status</SelectItem>
            <SelectItem value="active">Ativo</SelectItem>
            <SelectItem value="inactive">Inativo</SelectItem>
            <SelectItem value="prospect">Prospect</SelectItem>
          </SelectContent>
        </Select>

        <Select value={advisorFilter} onValueChange={(value) => setAdvisorFilter(value ?? "all")}>
          <SelectTrigger className="md:w-[220px]">
            <SelectValue placeholder="Assessor" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os assessores</SelectItem>
            {advisors.map((name) => (
              <SelectItem key={name} value={name}>
                {name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="overflow-hidden card-premium rounded-2xl">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-black/10 bg-black/5 text-left">
              <th className="px-4 py-3 text-label font-bold uppercase text-card-beige-muted-foreground">
                Cliente
              </th>
              <th className="px-4 py-3 text-label font-bold uppercase text-card-beige-muted-foreground">
                Patrimônio consolidado
              </th>
              <th className="px-4 py-3 text-label font-bold uppercase text-card-beige-muted-foreground">
                Perfil de Investidor
              </th>
              <th className="px-4 py-3 text-label font-bold uppercase text-card-beige-muted-foreground">
                Tags
              </th>
              <th className="px-4 py-3 text-label font-bold uppercase text-card-beige-muted-foreground">
                Assessor
              </th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-body-sm text-card-beige-muted-foreground">
                  Nenhum cliente encontrado.
                </td>
              </tr>
            ) : (
              filtered.map((client) => (
                <tr
                  key={client.id}
                  className="group border-b border-border border-l-2 border-l-transparent last:border-b-0 transition-all duration-200 hover:border-l-primary hover:bg-muted/60 hover:shadow-[inset_0_0_0_1px_var(--border)]"
                >
                  <td className="px-4 py-3">
                    <Link
                      href={`/clientes/${client.id}`}
                      className="font-semibold text-foreground hover:text-primary"
                    >
                      {client.fullName}
                    </Link>
                  </td>
                  <td className="px-4 py-3 font-medium text-foreground">
                    {formatCurrencyBRL(client.netWorth)}
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={RISK_VARIANT[client.riskProfile]}>
                      {RISK_LABEL[client.riskProfile]}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {client.tags.length === 0 ? (
                        <span className="text-card-beige-muted-foreground">—</span>
                      ) : (
                        client.tags.map((tag) => (
                          <Badge key={tag.id} variant="outline">
                            {tag.name}
                          </Badge>
                        ))
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-card-beige-muted-foreground">
                    {client.assignedAdvisorName ?? "—"}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
