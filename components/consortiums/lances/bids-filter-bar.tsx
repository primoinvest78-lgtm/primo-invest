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
import type { ConsortiumBid } from "@/lib/data/consortiums";
import {
  BID_RESULT_OPTIONS,
  bidResultLabel,
  DEFAULT_BID_FILTERS,
  hasActiveBidFilters,
  type BidFilters,
} from "@/lib/utils/bid-helpers";

export function BidsFilterBar({
  bids,
  filters,
  onChange,
}: {
  bids: ConsortiumBid[];
  filters: BidFilters;
  onChange: (filters: BidFilters) => void;
}) {
  const contracts = useMemo(() => {
    const map = new Map<string, string>();
    for (const b of bids) map.set(b.contractId, b.contractLabel);
    return Array.from(map.entries()).sort((a, b) => a[1].localeCompare(b[1]));
  }, [bids]);

  const clients = useMemo(() => {
    const map = new Map<string, string>();
    for (const b of bids) map.set(b.clientId ?? "none", b.clientName ?? "Sem cliente vinculado");
    return Array.from(map.entries()).sort((a, b) => a[1].localeCompare(b[1]));
  }, [bids]);

  function set<K extends keyof BidFilters>(key: K, value: BidFilters[K]) {
    onChange({ ...filters, [key]: value });
  }

  return (
    <div className="card-premium flex flex-wrap items-end gap-2.5 rounded-2xl p-4">
      <div className="flex flex-col gap-1">
        <label className="text-[10px] font-bold uppercase text-card-beige-muted-foreground">Buscar</label>
        <div className="relative">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-card-beige-muted-foreground" />
          <Input
            placeholder="Contrato, cliente ou modalidade..."
            value={filters.search}
            onChange={(e) => set("search", e.target.value)}
            className="h-7 w-[220px] pl-8 text-sm"
          />
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-[10px] font-bold uppercase text-card-beige-muted-foreground">Contrato</label>
        <Select value={filters.contractId} onValueChange={(v) => set("contractId", v ?? "all")}>
          <SelectTrigger className="w-[190px]" size="sm">
            <SelectValue placeholder="Todos" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            {contracts.map(([id, label]) => (
              <SelectItem key={id} value={id}>
                {label}
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
        <label className="text-[10px] font-bold uppercase text-card-beige-muted-foreground">Resultado</label>
        <Select value={filters.result} onValueChange={(v) => set("result", v ?? "all")}>
          <SelectTrigger className="w-[160px]" size="sm">
            <SelectValue placeholder="Todos" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            {BID_RESULT_OPTIONS.map((result) => (
              <SelectItem key={result} value={result}>
                {bidResultLabel(result)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {hasActiveBidFilters(filters) ? (
        <Button
          type="button"
          size="sm"
          variant="ghost"
          onClick={() => onChange(DEFAULT_BID_FILTERS)}
          className="gap-1 text-xs"
        >
          <X className="h-3.5 w-3.5" />
          Limpar filtros
        </Button>
      ) : null}
    </div>
  );
}
