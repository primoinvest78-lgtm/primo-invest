"use client";

import { useMemo, useState } from "react";

import { AccountsFilterBar } from "@/components/wealth/accounts-filter-bar";
import { AccountsInstitutionSection } from "@/components/wealth/accounts-institution-section";
import { AccountsKpis } from "@/components/wealth/accounts-kpis";
import { AccountsTable } from "@/components/wealth/accounts-table";
import { WealthAlertsSection } from "@/components/wealth/wealth-alerts-section";
import type { AccountDetail } from "@/lib/data/wealth";
import {
  type AccountFilters,
  applyAccountFilters,
  computeAccountAlerts,
  DEFAULT_ACCOUNT_FILTERS,
} from "@/lib/utils/account-helpers";

export function AccountsView({
  accounts,
  clients,
}: {
  accounts: AccountDetail[];
  clients: { id: string; fullName: string }[];
}) {
  const [filters, setFilters] = useState<AccountFilters>(DEFAULT_ACCOUNT_FILTERS);

  const filteredAccounts = useMemo(() => applyAccountFilters(accounts, filters), [accounts, filters]);
  const alerts = useMemo(() => computeAccountAlerts(accounts), [accounts]);

  return (
    <div className="space-y-6">
      <AccountsKpis
        accounts={accounts}
        onSelectAttention={() => setFilters((f) => ({ ...DEFAULT_ACCOUNT_FILTERS, attentionOnly: !f.attentionOnly }))}
      />

      <WealthAlertsSection
        alerts={alerts}
        hrefFor={(a) => {
          // Alertas de uma conta específica abrem a própria conta.
          const m = /^(inactive|stale|incomplete)-(.+)$/.exec(a.id);
          return m ? `/patrimonio/contas/${m[2]}` : null;
        }}
      />

      <AccountsInstitutionSection accounts={accounts} />

      <AccountsFilterBar accounts={accounts} filters={filters} onChange={setFilters} />

      <AccountsTable accounts={filteredAccounts} clients={clients} />
    </div>
  );
}
