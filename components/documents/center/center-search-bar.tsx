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
import type { DocumentCenterRow } from "@/lib/data/document-center";
import { categoryLabel, DOCUMENT_CATEGORIES } from "@/lib/utils/document-helpers";
import {
  CENTER_STATUS_LABEL,
  hasActiveCenterFilters,
  type DocumentCenterFilters,
} from "@/lib/utils/document-center-helpers";

export function CenterSearchBar({
  rows,
  filters,
  onChange,
  onClear,
}: {
  rows: DocumentCenterRow[];
  filters: DocumentCenterFilters;
  onChange: (filters: DocumentCenterFilters) => void;
  onClear: () => void;
}) {
  const clients = useMemo(() => {
    const map = new Map<string, string>();
    for (const r of rows) if (r.clientId) map.set(r.clientId, r.clientName ?? "—");
    return Array.from(map.entries()).sort((a, b) => a[1].localeCompare(b[1]));
  }, [rows]);

  const responsibles = useMemo(() => {
    const set = new Set<string>();
    for (const r of rows) if (r.responsibleName) set.add(r.responsibleName);
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [rows]);

  const origins = useMemo(() => {
    const set = new Set<string>();
    for (const r of rows) set.add(r.origin);
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [rows]);

  function set<K extends keyof DocumentCenterFilters>(key: K, value: DocumentCenterFilters[K]) {
    onChange({ ...filters, [key]: value });
  }

  return (
    <div className="card-premium flex flex-wrap items-end gap-2.5 rounded-2xl p-4">
      <div className="flex flex-col gap-1">
        <label className="text-[10px] font-bold uppercase text-card-beige-muted-foreground">Buscar</label>
        <div className="relative">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-card-beige-muted-foreground" />
          <Input
            placeholder="Documento, cliente, contrato..."
            value={filters.search}
            onChange={(e) => set("search", e.target.value)}
            className="h-8 w-[240px] pl-8 text-sm"
          />
        </div>
      </div>

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
        <label className="text-[10px] font-bold uppercase text-card-beige-muted-foreground">Categoria</label>
        <Select value={filters.category} onValueChange={(v) => set("category", v ?? "all")}>
          <SelectTrigger className="w-[150px]" size="sm">
            <SelectValue placeholder="Todas" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas</SelectItem>
            {DOCUMENT_CATEGORIES.map((c) => (
              <SelectItem key={c} value={c}>
                {categoryLabel(c)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-[10px] font-bold uppercase text-card-beige-muted-foreground">Status</label>
        <Select value={filters.status} onValueChange={(v) => set("status", v ?? "all")}>
          <SelectTrigger className="w-[150px]" size="sm">
            <SelectValue placeholder="Todos" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            {Object.entries(CENTER_STATUS_LABEL).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-[10px] font-bold uppercase text-card-beige-muted-foreground">Responsável</label>
        <Select value={filters.responsible} onValueChange={(v) => set("responsible", v ?? "all")}>
          <SelectTrigger className="w-[160px]" size="sm">
            <SelectValue placeholder="Todos" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            {responsibles.map((name) => (
              <SelectItem key={name} value={name}>
                {name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-[10px] font-bold uppercase text-card-beige-muted-foreground">Origem</label>
        <Select value={filters.origin} onValueChange={(v) => set("origin", v ?? "all")}>
          <SelectTrigger className="w-[150px]" size="sm">
            <SelectValue placeholder="Todas" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas</SelectItem>
            {origins.map((origin) => (
              <SelectItem key={origin} value={origin}>
                {origin}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-[10px] font-bold uppercase text-card-beige-muted-foreground">Período</label>
        <Select value={filters.period} onValueChange={(v) => set("period", v ?? "all")}>
          <SelectTrigger className="w-[150px]" size="sm">
            <SelectValue placeholder="Sempre" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Sempre</SelectItem>
            <SelectItem value="7d">Últimos 7 dias</SelectItem>
            <SelectItem value="30d">Últimos 30 dias</SelectItem>
            <SelectItem value="90d">Últimos 90 dias</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {hasActiveCenterFilters(filters) ? (
        <Button type="button" size="sm" variant="ghost" onClick={onClear} className="gap-1 text-xs">
          <X className="h-3.5 w-3.5" />
          Limpar filtros
        </Button>
      ) : null}
    </div>
  );
}
