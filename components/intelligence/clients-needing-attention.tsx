"use client";

import { ChevronRight, Users } from "lucide-react";
import Link from "next/link";
import { motion } from "motion/react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Insight } from "@/lib/intelligence/types";

type ClientGroup = {
  clientId: string;
  clientName: string;
  total: number;
  criticalCount: number;
};

function groupByClient(insights: Insight[]): ClientGroup[] {
  const map = new Map<string, ClientGroup>();

  for (const insight of insights) {
    if (insight.status !== "aberto" || !insight.clientId || !insight.clientName) continue;
    const existing = map.get(insight.clientId);
    const isCritical = insight.priority === "alta" && (insight.type === "pendencia" || insight.type === "atencao");
    if (existing) {
      existing.total += 1;
      if (isCritical) existing.criticalCount += 1;
    } else {
      map.set(insight.clientId, {
        clientId: insight.clientId,
        clientName: insight.clientName,
        total: 1,
        criticalCount: isCritical ? 1 : 0,
      });
    }
  }

  return Array.from(map.values()).sort((a, b) => b.criticalCount - a.criticalCount || b.total - a.total);
}

/**
 * Clientes com insight em aberto, ordenados pelos que têm mais sinais
 * críticos — é a porta de entrada pro Cliente 360 Inteligente de cada
 * um. Nenhum ranking novo, só agrupamento do que já está no feed.
 */
export function ClientsNeedingAttention({ insights }: { insights: Insight[] }) {
  const groups = groupByClient(insights).slice(0, 8);

  if (groups.length === 0) return null;

  return (
    <section className="card-premium rounded-2xl p-5 md:p-6">
      <div className="flex items-center gap-2">
        <Users className="h-4 w-4 text-primary" />
        <div>
          <p className="text-label font-bold uppercase text-card-beige-muted-foreground">
            Priorização por cliente
          </p>
          <h3 className="mt-0.5 text-h2 font-bold text-foreground">Clientes que precisam de atenção</h3>
        </div>
      </div>

      <ul className="mt-4 grid gap-2 sm:grid-cols-2">
        {groups.map((group, index) => (
          <motion.li
            key={group.clientId}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, delay: index * 0.03, ease: "easeOut" }}
            whileHover={{ y: -2 }}
          >
            <Button
              variant="outline"
              nativeButton={false}
              render={<Link href={`/inteligencia/${group.clientId}`} />}
              className="h-auto w-full justify-between gap-2 rounded-2xl px-4 py-3"
            >
              <span className="min-w-0 truncate text-left font-semibold text-foreground">{group.clientName}</span>
              <span className="flex shrink-0 items-center gap-2">
                {group.criticalCount > 0 ? (
                  <span className="rounded-full border border-destructive/40 bg-destructive/10 px-2 py-0.5 text-[10px] font-bold uppercase text-destructive">
                    {group.criticalCount} crítico{group.criticalCount === 1 ? "" : "s"}
                  </span>
                ) : null}
                <Badge variant="secondary">{group.total} insight{group.total === 1 ? "" : "s"}</Badge>
                <ChevronRight className="h-3.5 w-3.5 text-card-beige-muted-foreground" />
              </span>
            </Button>
          </motion.li>
        ))}
      </ul>
    </section>
  );
}
