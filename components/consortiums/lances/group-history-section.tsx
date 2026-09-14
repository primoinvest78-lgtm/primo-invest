"use client";

import type { ConsortiumBid } from "@/lib/data/consortiums";
import { TopClientsBarChart } from "@/components/wealth/top-clients-bar-chart";
import { WealthEvolutionChart } from "@/components/wealth/wealth-evolution-chart";
import { formatMonthLabel } from "@/lib/utils/format";

function StatBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-black/5 p-3">
      <p className="text-[10px] font-bold uppercase text-card-beige-muted-foreground">{label}</p>
      <p className="mt-1 text-lg font-bold text-foreground">{value}</p>
    </div>
  );
}

export function GroupHistorySection({ bids }: { bids: ConsortiumBid[] }) {
  const won = bids.filter((b) => b.result === "won" && b.bidPercentage !== null && b.bidDate);

  if (won.length < 2) {
    return (
      <div className="card-premium rounded-2xl p-5 md:p-6">
        <h3 className="mb-1 text-h2 font-bold text-foreground">Histórico do grupo</h3>
        <p className="text-sm text-card-beige-muted-foreground">Histórico insuficiente para análise.</p>
      </div>
    );
  }

  const percentages = won.map((b) => Number(b.bidPercentage));
  const avg = percentages.reduce((sum, p) => sum + p, 0) / percentages.length;
  const min = Math.min(...percentages);
  const max = Math.max(...percentages);

  const sorted = [...won].sort((a, b) => (a.bidDate as string).localeCompare(b.bidDate as string));
  const lineData = sorted.map((b) => ({
    month: formatMonthLabel(String(b.bidDate).slice(0, 7)),
    value: Number(b.bidPercentage),
  }));

  const topBids = [...won]
    .sort((a, b) => Number(b.bidAmount ?? 0) - Number(a.bidAmount ?? 0))
    .slice(0, 8)
    .map((b) => ({ name: b.contractLabel, total: Number(b.bidAmount ?? 0) }));

  return (
    <div className="card-premium rounded-2xl p-5 md:p-6">
      <h3 className="mb-1 text-h2 font-bold text-foreground">Histórico do grupo</h3>
      <p className="mb-4 text-sm text-card-beige-muted-foreground">
        Derivado dos lances vencedores reais registrados — resultados passados não garantem resultado
        futuro.
      </p>

      <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatBox label="Contemplações por lance" value={String(won.length)} />
        <StatBox label="Média vencedora" value={`${avg.toFixed(1)}%`} />
        <StatBox label="Menor lance vencedor" value={`${min.toFixed(1)}%`} />
        <StatBox label="Maior lance vencedor" value={`${max.toFixed(1)}%`} />
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
        <div>
          <p className="mb-2 text-xs font-bold uppercase text-card-beige-muted-foreground">
            Evolução dos percentuais vencedores
          </p>
          <WealthEvolutionChart data={lineData} />
        </div>
        <div>
          <p className="mb-2 text-xs font-bold uppercase text-card-beige-muted-foreground">
            Maiores lances vencedores
          </p>
          <TopClientsBarChart data={topBids} />
        </div>
      </div>
    </div>
  );
}
