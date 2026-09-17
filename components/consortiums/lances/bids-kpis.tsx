"use client";

import { motion } from "motion/react";

import { AnimatedNumber } from "@/components/ui/animated-number";
import type { ConsortiumBid, ConsortiumContract } from "@/lib/data/consortiums";
import { getBidRules } from "@/lib/utils/bid-helpers";
import { formatCurrencyBRL, formatDate } from "@/lib/utils/format";

function Kpi({
  label,
  value,
  valueClassName,
  animate = true,
  index,
  onClick,
}: {
  label: string;
  value: string;
  valueClassName?: string;
  animate?: boolean;
  index: number;
  onClick?: () => void;
}) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      disabled={!onClick}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.04, ease: "easeOut" }}
      whileHover={onClick ? { y: -2 } : undefined}
      className={[
        "card-premium rounded-2xl p-4 text-left transition-all duration-200",
        onClick ? "cursor-pointer hover:border-primary/60 hover:shadow-card" : "",
      ].join(" ")}
    >
      <p className="truncate text-label font-bold uppercase text-card-beige-muted-foreground">{label}</p>
      <p className={["mt-2 truncate text-lg font-bold", valueClassName ?? "text-foreground"].join(" ")}>
        {animate ? <AnimatedNumber value={value} /> : value}
      </p>
    </motion.button>
  );
}

export function BidsKpis({
  bids,
  contracts,
  onSelectResult,
}: {
  bids: ConsortiumBid[];
  contracts: ConsortiumContract[];
  /** Clicar num KPI filtra o histórico abaixo pelo mesmo resultado. */
  onSelectResult?: (result: string) => void;
}) {
  const won = bids.filter((b) => b.result === "won");
  const notContemplated = bids.filter((b) => b.result === "lost" || b.result === "expired");
  const withPct = bids.filter((b) => b.bidPercentage !== null);
  const avgPct = withPct.length > 0 ? withPct.reduce((sum, b) => sum + Number(b.bidPercentage), 0) / withPct.length : null;

  const lastBid = [...bids].sort((a, b) => (b.bidDate ?? "").localeCompare(a.bidDate ?? ""))[0] ?? null;

  const nextAssemblies = contracts
    .map((c) => getBidRules(c).nextAssemblyDate)
    .filter((d): d is string => Boolean(d))
    .sort();
  const nextAssembly = nextAssemblies[0] ?? null;

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-7">
      <Kpi
        label="Lances ofertados"
        value={String(bids.length)}
        animate={false}
        index={0}
        onClick={onSelectResult ? () => onSelectResult("all") : undefined}
      />
      <Kpi
        label="Vencedores"
        value={String(won.length)}
        index={1}
        onClick={onSelectResult ? () => onSelectResult("won") : undefined}
      />
      <Kpi label="Não contemplados" value={String(notContemplated.length)} animate={false} index={2} />
      <Kpi label="% médio ofertado" value={avgPct !== null ? `${avgPct.toFixed(1)}%` : "—"} animate={false} index={3} />
      <Kpi
        label="Último lance"
        value={lastBid ? formatCurrencyBRL(lastBid.bidAmount) : "—"}
        animate={false}
        index={4}
      />
      <Kpi label="Próxima assembleia" value={nextAssembly ? formatDate(nextAssembly) : "—"} animate={false} index={5} />
      <Kpi
        label="Contemplações por lance"
        value={String(won.length)}
        animate={false}
        index={6}
        onClick={onSelectResult ? () => onSelectResult("won") : undefined}
      />
    </div>
  );
}
