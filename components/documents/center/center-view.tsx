"use client";

import { useMemo, useState } from "react";

import { CenterCharts } from "@/components/documents/center/center-charts";
import { CenterCriticalSection } from "@/components/documents/center/center-critical-section";
import { CenterKpis } from "@/components/documents/center/center-kpis";
import { CenterRequestsSection } from "@/components/documents/center/center-requests-section";
import { CenterSearchBar } from "@/components/documents/center/center-search-bar";
import { CenterTable } from "@/components/documents/center/center-table";
import { RequestCreateDialog } from "@/components/documents/center/request-create-dialog";
import { scrollToId } from "@/components/ui/panel-action";
import type { DocumentCenterRow, DocumentRequestListItem } from "@/lib/data/document-center";
import {
  applyCenterFilters,
  computeCenterKpis,
  DEFAULT_CENTER_FILTERS,
} from "@/lib/utils/document-center-helpers";

export function CenterView({
  rows,
  requests,
  clients,
  advisors,
  consortiumContracts,
}: {
  rows: DocumentCenterRow[];
  requests: DocumentRequestListItem[];
  clients: { id: string; fullName: string }[];
  advisors: { id: string; fullName: string }[];
  consortiumContracts: { id: string; label: string }[];
}) {
  const [filters, setFilters] = useState(DEFAULT_CENTER_FILTERS);

  const filtered = useMemo(() => applyCenterFilters(rows, filters), [rows, filters]);
  const kpis = useMemo(() => computeCenterKpis(rows), [rows]);

  return (
    <div className="space-y-6">
      <CenterKpis kpis={kpis} onSelectStatus={(status) => setFilters((f) => ({ ...f, status }))} />

      <CenterCriticalSection rows={rows} />

      <CenterRequestsSection requests={requests} />

      <CenterCharts
        rows={rows}
        onSelectStatus={(status) => {
          setFilters({ ...DEFAULT_CENTER_FILTERS, status });
          scrollToId("lista-documentos");
        }}
        onSelectResponsible={(name) => {
          setFilters({ ...DEFAULT_CENTER_FILTERS, responsible: name === "Sem responsável" ? "none" : name });
          scrollToId("lista-documentos");
        }}
      />

      <div id="lista-documentos" className="flex scroll-mt-24 flex-wrap items-center justify-between gap-3">
        <h3 className="text-h2 font-bold text-foreground">Central de Documentos</h3>
        <RequestCreateDialog clients={clients} advisors={advisors} consortiumContracts={consortiumContracts} />
      </div>

      <CenterSearchBar
        rows={rows}
        filters={filters}
        onChange={setFilters}
        onClear={() => setFilters(DEFAULT_CENTER_FILTERS)}
      />

      <CenterTable rows={filtered} />
    </div>
  );
}
