"use client";

import { useRouter } from "next/navigation";

import { TopClientsBarChart } from "@/components/wealth/top-clients-bar-chart";
import { ValueByTypeBarChart } from "@/components/wealth/value-by-type-bar-chart";
import type { LiabilityDetail } from "@/lib/data/wealth";
import { groupLiabilitiesByCategory } from "@/lib/utils/liability-helpers";

export function LiabilitiesChartsSection({ liabilities }: { liabilities: LiabilityDetail[] }) {
  const router = useRouter();
  const topLiabilities = [...liabilities]
    .sort((a, b) => Number(b.outstandingAmount ?? 0) - Number(a.outstandingAmount ?? 0))
    .slice(0, 8)
    .map((l) => ({ id: l.id, name: l.name, total: Number(l.outstandingAmount ?? 0) }));

  const categories = groupLiabilitiesByCategory(liabilities);
  const showCategoryChart = categories.length >= 2;

  if (topLiabilities.length === 0) return null;

  return (
    <div className={["grid grid-cols-1 gap-5", showCategoryChart ? "xl:grid-cols-2" : ""].join(" ")}>
      <div className="card-premium rounded-2xl p-5 md:p-6">
        <h3 className="mb-4 text-h2 font-bold text-foreground">Maiores passivos</h3>
        <TopClientsBarChart data={topLiabilities} onSelect={(i) => router.push(`/patrimonio/passivos/${topLiabilities[i].id}`)} />
        <p className="mt-2 text-[11px] text-card-beige-muted-foreground">Clique numa barra para abrir o passivo.</p>
      </div>

      {showCategoryChart ? (
        <div className="card-premium rounded-2xl p-5 md:p-6">
          <h3 className="mb-4 text-h2 font-bold text-foreground">Passivos por categoria</h3>
          <ValueByTypeBarChart data={categories.map((c) => ({ type: c.category, value: c.total }))} />
        </div>
      ) : null}
    </div>
  );
}
