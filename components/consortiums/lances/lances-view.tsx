"use client";

import { useMemo, useState } from "react";

import { BidOfferDialog } from "@/components/consortiums/lances/bid-offer-dialog";
import { BidSimulator } from "@/components/consortiums/lances/bid-simulator";
import { BidsFilterBar } from "@/components/consortiums/lances/bids-filter-bar";
import { BidsKpis } from "@/components/consortiums/lances/bids-kpis";
import { BidsNextActions } from "@/components/consortiums/lances/bids-next-actions";
import { BidsTable } from "@/components/consortiums/lances/bids-table";
import { GroupHistorySection } from "@/components/consortiums/lances/group-history-section";
import { NextAssemblyHighlight } from "@/components/consortiums/lances/next-assembly-highlight";
import { WealthAlertsSection } from "@/components/wealth/wealth-alerts-section";
import type { ConsortiumBid, ConsortiumContract } from "@/lib/data/consortiums";
import type { TaskItem } from "@/lib/data/tasks";
import {
  applyBidFilters,
  computeBidAlerts,
  DEFAULT_BID_FILTERS,
  type BidFilters,
} from "@/lib/utils/bid-helpers";

export function LancesView({
  bids,
  contracts,
  tasks,
}: {
  bids: ConsortiumBid[];
  contracts: ConsortiumContract[];
  tasks: TaskItem[];
}) {
  const [filters, setFilters] = useState<BidFilters>(DEFAULT_BID_FILTERS);

  const filtered = useMemo(() => applyBidFilters(bids, filters), [bids, filters]);
  const alerts = useMemo(() => computeBidAlerts(bids, contracts), [bids, contracts]);

  return (
    <div className="space-y-6">
      <BidsKpis
        bids={bids}
        contracts={contracts}
        onSelectResult={(result) => setFilters((f) => ({ ...f, result }))}
      />

      <WealthAlertsSection alerts={alerts} />

      <NextAssemblyHighlight contracts={contracts} />

      <BidSimulator contracts={contracts} bids={bids} />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-h2 font-bold text-foreground">Histórico de lances</h3>
        <BidOfferDialog contracts={contracts} />
      </div>

      <BidsFilterBar bids={bids} filters={filters} onChange={setFilters} />

      <BidsTable bids={filtered} contracts={contracts} />

      <GroupHistorySection bids={bids} />

      <BidsNextActions tasks={tasks} />
    </div>
  );
}
