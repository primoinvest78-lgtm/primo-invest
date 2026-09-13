"use client";

import { useMemo, useState } from "react";

import { ContractsFilterBar } from "@/components/consortiums/contracts-filter-bar";
import { ContractsKpis } from "@/components/consortiums/contracts-kpis";
import { ContractsTable } from "@/components/consortiums/contracts-table";
import type { ConsortiumContract } from "@/lib/data/consortiums";
import {
  applyContractFilters,
  DEFAULT_CONTRACT_FILTERS,
  type ContractFilters,
} from "@/lib/utils/consortium-helpers";

export function ContractsView({
  contracts,
  clients,
}: {
  contracts: ConsortiumContract[];
  clients: { id: string; fullName: string }[];
}) {
  const [filters, setFilters] = useState<ContractFilters>(DEFAULT_CONTRACT_FILTERS);

  const filtered = useMemo(() => applyContractFilters(contracts, filters), [contracts, filters]);

  return (
    <div className="space-y-6">
      <ContractsKpis contracts={contracts} />

      <ContractsFilterBar contracts={contracts} filters={filters} onChange={setFilters} />

      <ContractsTable contracts={filtered} clients={clients} />
    </div>
  );
}
