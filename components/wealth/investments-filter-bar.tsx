"use client";

import { X } from "lucide-react";
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
import type { HoldingDetail } from "@/lib/data/wealth";
import {
  DEFAULT_INVESTMENT_FILTERS,
  hasActiveInvestmentFilters,
  type InvestmentFilters,
} from "@/lib/utils/investment-helpers";

function uniqueBy<T>(items: T[], keyFn: (item: T) => string | null): [string, string][] {
  const map = new Map<string, string>();
  for (const item of items) {
    const key = keyFn(item);
    if (key) map.set(key, key);
  }
  return Array.from(map.entries());
}

export function InvestmentsFilterBar({
  holdings,
  filters,
  onChange,
}: {
  holdings: HoldingDetail[];
  filters: InvestmentFilters;
  onChange: (filters: InvestmentFilters) => void;
}) {
  const clients = useMemo(() => {
    const map = new Map<string, string>();
    for (const h of holdings) if (h.clientId) map.set(h.clientId, h.clientName ?? "—");
    return Array.from(map.entries());
  }, [holdings]);

  const accounts = useMemo(() => {
    const map = new Map<string, string>();
    for (const h of holdings) if (h.accountId) map.set(h.accountId, h.accountName ?? "Conta");
    return Array.from(map.entries());
  }, [holdings]);

  const institutions = useMemo(() => uniqueBy(holdings, (h) => h.institutionName), [holdings]);
  const assetClasses = useMemo(() => uniqueBy(holdings, (h) => h.productType), [holdings]);
  const products = useMemo(() => uniqueBy(holdings, (h) => h.productName), [holdings]);

  function set<K extends keyof InvestmentFilters>(key: K, value: InvestmentFilters[K]) {
    onChange({ ...filters, [key]: value });
  }

  return (
    <div className="card-premium flex flex-wrap items-end gap-2.5 rounded-2xl p-4">
      <div className="flex flex-col gap-1">
        <label className="text-[10px] font-bold uppercase text-card-beige-muted-foreground">Cliente</label>
        <Select value={filters.clientId} onValueChange={(v) => set("clientId", v ?? "all")}>
          <SelectTrigger className="w-[160px]" size="sm">
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
        <label className="text-[10px] font-bold uppercase text-card-beige-muted-foreground">Conta</label>
        <Select value={filters.accountId} onValueChange={(v) => set("accountId", v ?? "all")}>
          <SelectTrigger className="w-[160px]" size="sm">
            <SelectValue placeholder="Todas" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas</SelectItem>
            {accounts.map(([id, name]) => (
              <SelectItem key={id} value={id}>
                {name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-[10px] font-bold uppercase text-card-beige-muted-foreground">
          Instituição
        </label>
        <Select value={filters.institution} onValueChange={(v) => set("institution", v ?? "all")}>
          <SelectTrigger className="w-[160px]" size="sm">
            <SelectValue placeholder="Todas" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas</SelectItem>
            {institutions.map(([value]) => (
              <SelectItem key={value} value={value}>
                {value}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-[10px] font-bold uppercase text-card-beige-muted-foreground">
          Classe de ativo
        </label>
        <Select value={filters.assetClass} onValueChange={(v) => set("assetClass", v ?? "all")}>
          <SelectTrigger className="w-[160px]" size="sm">
            <SelectValue placeholder="Todas" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas</SelectItem>
            {assetClasses.map(([value]) => (
              <SelectItem key={value} value={value}>
                {value}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-[10px] font-bold uppercase text-card-beige-muted-foreground">
          Produto
        </label>
        <Select value={filters.product} onValueChange={(v) => set("product", v ?? "all")}>
          <SelectTrigger className="w-[170px]" size="sm">
            <SelectValue placeholder="Todos" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            {products.map(([value]) => (
              <SelectItem key={value} value={value}>
                {value}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-[10px] font-bold uppercase text-card-beige-muted-foreground">Status</label>
        <Select value={filters.status} onValueChange={(v) => set("status", v ?? "active")}>
          <SelectTrigger className="w-[130px]" size="sm">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="active">Ativas</SelectItem>
            <SelectItem value="inactive">Inativas</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-[10px] font-bold uppercase text-card-beige-muted-foreground">
          Posição de
        </label>
        <Input
          type="date"
          className="h-7 w-[140px] text-sm"
          value={filters.asOfFrom}
          onChange={(e) => set("asOfFrom", e.target.value)}
        />
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-[10px] font-bold uppercase text-card-beige-muted-foreground">até</label>
        <Input
          type="date"
          className="h-7 w-[140px] text-sm"
          value={filters.asOfTo}
          onChange={(e) => set("asOfTo", e.target.value)}
        />
      </div>

      {hasActiveInvestmentFilters(filters) ? (
        <Button
          type="button"
          size="sm"
          variant="ghost"
          onClick={() => onChange(DEFAULT_INVESTMENT_FILTERS)}
          className="gap-1 text-xs"
        >
          <X className="h-3.5 w-3.5" />
          Limpar filtros
        </Button>
      ) : null}
    </div>
  );
}
