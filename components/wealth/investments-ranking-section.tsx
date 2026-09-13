"use client";

import { motion } from "motion/react";
import { useMemo } from "react";

import { TopClientsBarChart } from "@/components/wealth/top-clients-bar-chart";
import type { HoldingDetail } from "@/lib/data/wealth";
import { computeGainLoss } from "@/lib/utils/investment-helpers";

export function InvestmentsRankingSection({ holdings }: { holdings: HoldingDetail[] }) {
  const topPositions = useMemo(
    () =>
      [...holdings]
        .filter((h) => h.valuation)
        .sort((a, b) => Number(b.valuation) - Number(a.valuation))
        .slice(0, 8)
        .map((h) => ({ name: h.productName ?? "Ativo", total: Number(h.valuation) })),
    [holdings],
  );

  const withGainLoss = useMemo(
    () =>
      holdings
        .map((h) => ({ holding: h, ...computeGainLoss(h) }))
        .filter((h): h is { holding: HoldingDetail; gainLoss: number; gainLossPct: number | null } => h.gainLoss !== null),
    [holdings],
  );

  const topGains = useMemo(
    () =>
      [...withGainLoss]
        .filter((h) => h.gainLoss > 0)
        .sort((a, b) => b.gainLoss - a.gainLoss)
        .slice(0, 6)
        .map((h) => ({ name: h.holding.productName ?? "Ativo", total: h.gainLoss })),
    [withGainLoss],
  );

  const topLosses = useMemo(
    () =>
      [...withGainLoss]
        .filter((h) => h.gainLoss < 0)
        .sort((a, b) => a.gainLoss - b.gainLoss)
        .slice(0, 6)
        .map((h) => ({ name: h.holding.productName ?? "Ativo", total: Math.abs(h.gainLoss) })),
    [withGainLoss],
  );

  return (
    <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
        className="card-premium rounded-2xl p-5 md:p-6 xl:col-span-2"
      >
        <h3 className="mb-4 text-h2 font-bold text-foreground">Maiores posições</h3>
        {topPositions.length === 0 ? (
          <p className="text-body-sm text-card-beige-muted-foreground">
            Sem posições suficientes pra montar o ranking.
          </p>
        ) : (
          <TopClientsBarChart data={topPositions} />
        )}
      </motion.div>

      {(topGains.length > 0 || topLosses.length > 0) && (
        <>
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.06, ease: "easeOut" }}
            className="card-premium rounded-2xl p-5 md:p-6"
          >
            <h3 className="mb-4 text-h2 font-bold text-foreground">Maiores ganhos</h3>
            {topGains.length === 0 ? (
              <p className="text-body-sm text-card-beige-muted-foreground">
                Sem ganhos suficientes registrados.
              </p>
            ) : (
              <TopClientsBarChart data={topGains} />
            )}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.12, ease: "easeOut" }}
            className="card-premium rounded-2xl p-5 md:p-6"
          >
            <h3 className="mb-4 text-h2 font-bold text-foreground">Maiores perdas</h3>
            {topLosses.length === 0 ? (
              <p className="text-body-sm text-card-beige-muted-foreground">
                Sem perdas registradas.
              </p>
            ) : (
              <TopClientsBarChart data={topLosses} />
            )}
          </motion.div>
        </>
      )}
    </div>
  );
}
