"use client";

import { useState } from "react";

import { AiNarrativeSlot } from "@/components/intelligence/ai-narrative-slot";
import { ClientsNeedingAttention } from "@/components/intelligence/clients-needing-attention";
import { InsightFeed } from "@/components/intelligence/insight-feed";
import { InsightKpis } from "@/components/intelligence/insight-kpis";
import type { Insight, InsightType } from "@/lib/intelligence/types";
import type { InsightCounts } from "@/lib/intelligence/types";

/**
 * Liga os KPIs ao feed abaixo: clicar em "Pendência", por exemplo,
 * filtra o feed pro mesmo tipo, sem duplicar o estado de filtro.
 */
export function IntelligenceView({ insights, counts }: { insights: Insight[]; counts: InsightCounts }) {
  const [typeFilter, setTypeFilter] = useState<"all" | InsightType>("all");

  return (
    <>
      <InsightKpis counts={counts} onSelectType={setTypeFilter} />

      <ClientsNeedingAttention insights={insights} />

      <InsightFeed insights={insights} typeFilter={typeFilter} onTypeFilterChange={setTypeFilter} />

      <AiNarrativeSlot insights={insights} />
    </>
  );
}
