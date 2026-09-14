"use client";

import { useMemo, useState } from "react";

import { VaultCategoriesGrid } from "@/components/documents/vault/vault-categories-grid";
import { VaultDocumentsTable } from "@/components/documents/vault/vault-documents-table";
import { VaultKpis } from "@/components/documents/vault/vault-kpis";
import { VaultPendingSection } from "@/components/documents/vault/vault-pending-section";
import { VaultSearchBar } from "@/components/documents/vault/vault-search-bar";
import { VaultUploadDialog } from "@/components/documents/vault/vault-upload-dialog";
import { WealthAlertsSection } from "@/components/wealth/wealth-alerts-section";
import type { VaultDocument } from "@/lib/data/documents";
import {
  applyVaultFilters,
  computeVaultAlerts,
  DEFAULT_VAULT_FILTERS,
  type VaultFilters,
} from "@/lib/utils/document-helpers";

export function VaultView({
  documents,
  clientsWithoutDocs,
  sharedCount,
  organizationId,
  clients,
}: {
  documents: VaultDocument[];
  clientsWithoutDocs: { id: string; fullName: string }[];
  sharedCount: number;
  organizationId: string;
  clients: { id: string; fullName: string }[];
}) {
  const [filters, setFilters] = useState<VaultFilters>(DEFAULT_VAULT_FILTERS);

  const filtered = useMemo(() => applyVaultFilters(documents, filters), [documents, filters]);
  const alerts = useMemo(() => computeVaultAlerts(documents, clientsWithoutDocs), [documents, clientsWithoutDocs]);

  return (
    <div className="space-y-6">
      <VaultKpis documents={documents} clientsWithoutDocsCount={clientsWithoutDocs.length} sharedCount={sharedCount} />

      <WealthAlertsSection alerts={alerts} />

      <VaultCategoriesGrid documents={documents} activeCategory={filters.category} onSelect={(category) => setFilters((f) => ({ ...f, category }))} />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-h2 font-bold text-foreground">Documentos</h3>
        <VaultUploadDialog organizationId={organizationId} clients={clients} />
      </div>

      <VaultSearchBar documents={documents} filters={filters} onChange={setFilters} />

      <VaultDocumentsTable documents={filtered} />

      <VaultPendingSection documents={documents} clientsWithoutDocs={clientsWithoutDocs} />
    </div>
  );
}
