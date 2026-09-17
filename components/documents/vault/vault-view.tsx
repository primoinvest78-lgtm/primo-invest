"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
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
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [filters, setFilters] = useState<VaultFilters>(DEFAULT_VAULT_FILTERS);

  // A categoria vive na URL (?categoria=financeiro) — é um caminho de
  // verdade (navegável, com "voltar" do navegador funcionando, e
  // compartilhável), não só um estado interno que some ao recarregar.
  // Ela é derivada direto da URL a cada render (sem useEffect + setState)
  // para não disparar renders em cascata.
  const categoryFromUrl = searchParams.get("categoria") ?? "all";
  const effectiveFilters = useMemo(
    () => ({ ...filters, category: categoryFromUrl }),
    [filters, categoryFromUrl],
  );

  function selectCategory(category: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (category === "all") params.delete("categoria");
    else params.set("categoria", category);
    const query = params.toString();
    router.push(query ? `${pathname}?${query}` : pathname, { scroll: false });
  }

  const filtered = useMemo(
    () => applyVaultFilters(documents, effectiveFilters),
    [documents, effectiveFilters],
  );

  // Deep link vindo da Central de Documentos (?documento=<id>) — abre
  // o detalhe direto, mesmo que o filtro de categoria ativo escondesse
  // a linha na tabela.
  const deepLinkedId = searchParams.get("documento");
  const deepLinkedDocument = deepLinkedId ? (documents.find((d) => d.id === deepLinkedId) ?? null) : null;
  const alerts = useMemo(() => computeVaultAlerts(documents, clientsWithoutDocs), [documents, clientsWithoutDocs]);

  return (
    <div className="space-y-6">
      <VaultKpis
        documents={documents}
        clientsWithoutDocsCount={clientsWithoutDocs.length}
        sharedCount={sharedCount}
        onSelectExpiry={(expiry) => setFilters((f) => ({ ...f, expiry }))}
      />

      <WealthAlertsSection alerts={alerts} />

      <VaultCategoriesGrid documents={documents} activeCategory={effectiveFilters.category} onSelect={selectCategory} />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-h2 font-bold text-foreground">Documentos</h3>
        <VaultUploadDialog organizationId={organizationId} clients={clients} />
      </div>

      <VaultSearchBar
        documents={documents}
        filters={effectiveFilters}
        onChange={setFilters}
        onClear={() => {
          setFilters(DEFAULT_VAULT_FILTERS);
          selectCategory("all");
        }}
      />

      <VaultDocumentsTable documents={filtered} initialSelected={deepLinkedDocument} />

      <VaultPendingSection documents={documents} clientsWithoutDocs={clientsWithoutDocs} />
    </div>
  );
}
