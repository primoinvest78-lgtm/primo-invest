"use client";

import { Search, X } from "lucide-react";
import { useMemo } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { ConsortiumContract } from "@/lib/data/consortiums";
import {
  CONTRACT_STATUS_OPTIONS,
  contractStatusLabel,
  DEFAULT_CONTRACT_FILTERS,
  hasActiveContractFilters,
  type ContractFilters,
} from "@/lib/utils/consortium-helpers";

function uniqueBy<T>(items: T[], keyFn: (item: T) => string | null): string[] {
  const set = new Set<string>();
  for (const item of items) {
    const key = keyFn(item);
    if (key) set.add(key);
  }
  return Array.from(set).sort();
}

export function ContractsFilterBar({
  contracts,
  filters,
  onChange,
}: {
  contracts: ConsortiumContract[];
  filters: ContractFilters;
  onChange: (filters: ContractFilters) => void;
}) {
  const types = useMemo(() => uniqueBy(contracts, (c) => c.consortiumType), [contracts]);
  const clients = useMemo(() => {
    const map = new Map<string, string>();
    for (const c of contracts) map.set(c.clientId ?? "none", c.clientName ?? "Sem cliente vinculado");
    return Array.from(map.entries()).sort((a, b) => a[1].localeCompare(b[1]));
  }, [contracts]);

  function set<K extends keyof ContractFilters>(key: K, value: ContractFilters[K]) {
    onChange({ ...filters, [key]: value });
  }

  return (
    <div className="card-premium flex flex-wrap items-end gap-2.5 rounded-2xl p-4">
      <div className="flex flex-col gap-1">
        <label className="text-[10px] font-bold uppercase text-card-beige-muted-foreground">Buscar</label>
        <div className="relative">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-card-beige-muted-foreground" />
          <Input
            placeholder="Contrato, grupo, cota, cliente ou bem..."
            value={filters.search}
            onChange={(e) => set("search", e.target.value)}
            className="h-7 w-[260px] pl-8 text-sm"
          />
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-[10px] font-bold uppercase text-card-beige-muted-foreground">Tipo</label>
        <Select value={filters.consortiumType} onValueChange={(v) => set("consortiumType", v ?? "all")}>
          <SelectTrigger className="w-[150px]" size="sm">
            <SelectValue placeholder="Todos" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            {types.map((value) => (
              <SelectItem key={value} value={value}>
                {value}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-[10px] font-bold uppercase text-card-beige-muted-foreground">Cliente</label>
        <Select value={filters.clientId} onValueChange={(v) => set("clientId", v ?? "all")}>
          <SelectTrigger className="w-[180px]" size="sm">
            <SelectValue placeholder="Todos" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            {clients.map(([id, name]) => (
              <SelectItem key={id} value={id}>
                {name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-[10px] font-bold uppercase text-card-beige-muted-foreground">Status</label>
        <Select value={filters.status} onValueChange={(v) => set("status", v ?? "all")}>
          <SelectTrigger className="w-[160px]" size="sm">
            <SelectValue placeholder="Todos" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            {CONTRACT_STATUS_OPTIONS.map((status) => (
              <SelectItem key={status} value={status}>
                {contractStatusLabel(status)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {hasActiveContractFilters(filters) ? (
        <Button
          type="button"
          size="sm"
          variant="ghost"
          onClick={() => onChange(DEFAULT_CONTRACT_FILTERS)}
          className="gap-1 text-xs"
        >
          <X className="h-3.5 w-3.5" />
          Limpar filtros
        </Button>
      ) : null}
    </div>
  );
}
