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
import type { VaultDocument } from "@/lib/data/documents";
import {
  documentStatusLabel,
  hasActiveVaultFilters,
  type VaultFilters,
} from "@/lib/utils/document-helpers";

export function VaultSearchBar({
  documents,
  filters,
  onChange,
  onClear,
}: {
  documents: VaultDocument[];
  filters: VaultFilters;
  onChange: (filters: VaultFilters) => void;
  onClear: () => void;
}) {
  const clients = useMemo(() => {
    const map = new Map<string, string>();
    for (const d of documents) if (d.clientId) map.set(d.clientId, d.clientName ?? "—");
    return Array.from(map.entries()).sort((a, b) => a[1].localeCompare(b[1]));
  }, [documents]);

  function set<K extends keyof VaultFilters>(key: K, value: VaultFilters[K]) {
    onChange({ ...filters, [key]: value });
  }

  return (
    <div className="card-premium flex flex-wrap items-end gap-2.5 rounded-2xl p-4">
      <div className="flex flex-col gap-1">
        <label className="text-[10px] font-bold uppercase text-card-beige-muted-foreground">
          Buscar por nome, cliente, contrato ou tag
        </label>
        <div className="relative">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-card-beige-muted-foreground" />
          <Input
            placeholder="Encontre qualquer documento em segundos..."
            value={filters.search}
            onChange={(e) => set("search", e.target.value)}
            className="h-8 w-[280px] pl-8 text-sm"
          />
        </div>
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
            <SelectItem value="active">{documentStatusLabel("active")}</SelectItem>
            <SelectItem value="archived">{documentStatusLabel("archived")}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {hasActiveVaultFilters(filters) ? (
        <Button type="button" size="sm" variant="ghost" onClick={onClear} className="gap-1 text-xs">
          <X className="h-3.5 w-3.5" />
          Limpar filtros
        </Button>
      ) : null}
    </div>
  );
}
