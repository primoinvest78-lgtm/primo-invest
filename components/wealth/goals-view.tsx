"use client";

import { useMemo, useState } from "react";

import { GoalCard } from "@/components/wealth/goal-card";
import { GoalsComparisonSection } from "@/components/wealth/goals-comparison-section";
import { GoalsFilterBar } from "@/components/wealth/goals-filter-bar";
import { GoalsKpis } from "@/components/wealth/goals-kpis";
import { WealthAlertsSection } from "@/components/wealth/wealth-alerts-section";
import type { GoalDetail } from "@/lib/data/wealth";
import {
  applyGoalFilters,
  computeGoalAlerts,
  computeGoalStatus,
  DEFAULT_GOAL_FILTERS,
  type GoalFilters,
} from "@/lib/utils/goal-helpers";

export function GoalsView({
  goals,
  clients,
}: {
  goals: GoalDetail[];
  clients: { id: string; fullName: string }[];
}) {
  const [filters, setFilters] = useState<GoalFilters>(DEFAULT_GOAL_FILTERS);

  const filtered = useMemo(
    () => applyGoalFilters(goals, filters, computeGoalStatus),
    [goals, filters],
  );
  const alerts = useMemo(() => computeGoalAlerts(goals), [goals]);

  return (
    <div className="space-y-6">
      <GoalsKpis goals={goals} onSelectStatus={(status) => setFilters((f) => ({ ...f, status }))} />

      <WealthAlertsSection alerts={alerts} />

      <GoalsComparisonSection goals={goals} />

      <GoalsFilterBar goals={goals} filters={filters} onChange={setFilters} />

      {filtered.length === 0 ? (
        <div className="card-premium rounded-2xl p-8 text-center">
          <p className="text-body-sm text-card-beige-muted-foreground">
            Nenhuma meta encontrada com esses filtros.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
          {filtered.map((goal, index) => (
            <GoalCard key={goal.id} goal={goal} clients={clients} index={index} />
          ))}
        </div>
      )}
    </div>
  );
}
