"use client";

import { AlarmClock, Clock, ListChecks, Target, TrendingUp, type LucideIcon } from "lucide-react";
import { motion } from "motion/react";
import Link from "next/link";

import type { OpportunityCard } from "@/lib/data/opportunities";
import { computeOpportunityPriorities } from "@/lib/utils/opportunity-helpers";
import { formatCurrencyBRL } from "@/lib/utils/format";

const MAX_VISIBLE = 5;

function PriorityColumn({
  title,
  icon: Icon,
  opportunities,
  index,
}: {
  title: string;
  icon: LucideIcon;
  opportunities: OpportunityCard[];
  index: number;
}) {
  const visible = opportunities.slice(0, MAX_VISIBLE);
  const remaining = opportunities.length - visible.length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05, ease: "easeOut" }}
      className="min-w-[220px] flex-1 rounded-xl border border-border bg-muted/60 p-3.5 transition-colors duration-150 hover:border-primary/40 hover:bg-muted"
    >
      <div className="mb-3 flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-1.5">
          <Icon className="h-3.5 w-3.5 shrink-0 text-accent" strokeWidth={2} />
          <span className="truncate text-[11px] font-bold uppercase text-card-beige-muted-foreground">
            {title}
          </span>
        </div>
        <span className="shrink-0 rounded-full border border-primary/40 bg-primary/15 px-2 py-0.5 text-[11px] font-bold text-foreground">
          {opportunities.length}
        </span>
      </div>

      {visible.length === 0 ? (
        <p className="text-xs text-card-beige-muted-foreground">Nenhuma oportunidade nesta categoria.</p>
      ) : (
        <div className="space-y-1.5">
          {visible.map((opp) => (
            <Link
              key={opp.id}
              href={`/oportunidades/${opp.id}`}
              className="block truncate rounded-lg px-2 py-1.5 text-xs font-semibold text-foreground transition-colors duration-150 hover:bg-black/10 hover:text-primary"
            >
              {opp.title}
              {opp.estimatedValue ? (
                <span className="ml-1 font-normal text-card-beige-muted-foreground">
                  · {formatCurrencyBRL(opp.estimatedValue)}
                </span>
              ) : null}
            </Link>
          ))}
          {remaining > 0 ? (
            <p className="px-2 text-[11px] font-medium text-card-beige-muted-foreground">
              +{remaining} mais
            </p>
          ) : null}
        </div>
      )}
    </motion.div>
  );
}

export function OpportunitiesPriorityPanel({ opportunities }: { opportunities: OpportunityCard[] }) {
  const priorities = computeOpportunityPriorities(opportunities);

  return (
    <div className="card-premium rounded-2xl p-5 md:p-6">
      <div className="mb-4">
        <p className="text-label font-bold uppercase text-card-beige-muted-foreground">Ação</p>
        <h3 className="mt-1 text-h2 font-bold text-foreground">Oportunidades prioritárias</h3>
      </div>

      <div className="flex gap-3 overflow-x-auto pb-1">
        <PriorityColumn title="Maior valor" icon={TrendingUp} opportunities={priorities.highValue} index={0} />
        <PriorityColumn
          title="Maior probabilidade"
          icon={Target}
          opportunities={priorities.highProbability}
          index={1}
        />
        <PriorityColumn
          title="Fechamento próximo"
          icon={Clock}
          opportunities={priorities.closingSoon}
          index={2}
        />
        <PriorityColumn title="Paradas" icon={AlarmClock} opportunities={priorities.stalled} index={3} />
        <PriorityColumn
          title="Sem próxima ação"
          icon={ListChecks}
          opportunities={priorities.noNextAction}
          index={4}
        />
      </div>
    </div>
  );
}
