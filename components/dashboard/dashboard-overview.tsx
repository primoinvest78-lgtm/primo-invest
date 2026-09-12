"use client";

import { ChevronDown } from "lucide-react";
import { useState } from "react";

import {
  allocationData,
  attentionItems,
  goals,
  kpis,
  pipelineStages,
  recentActivities,
  relationshipSummary,
  wealthTrend,
} from "@/lib/mock/dashboard";

import { AllocationChart } from "./allocation-chart";
import { AttentionPanel } from "./attention-panel";
import { GoalsSummary } from "./goals-summary";
import { KpiCard } from "./kpi-card";
import { PipelineSummary } from "./pipeline-summary";
import { RecentActivity } from "./recent-activity";
import { RelationshipSummary } from "./relationship-summary";
import { WealthChart } from "./wealth-chart";

const periods = ["Hoje", "7 dias", "30 dias", "90 dias", "12 meses"];

export function DashboardOverview() {
  const [selectedPeriod, setSelectedPeriod] = useState("12 meses");

  return (
    <div className="space-y-6">
      {/* PAGE HEADER */}
      <section className="flex min-w-0 flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
        <div className="min-w-0">
          <p className="text-label font-bold uppercase text-accent">Visão executiva</p>

          <h1 className="mt-2 text-display font-bold text-foreground">Dashboard</h1>

          <p className="mt-2 max-w-2xl text-body leading-6 text-muted-foreground">
            Patrimônio, relacionamento e operação em uma única visão.
          </p>
        </div>

        <div className="flex max-w-full flex-wrap items-center gap-2">
          {periods.map((period) => {
            const active = selectedPeriod === period;

            return (
              <button
                key={period}
                type="button"
                onClick={() => setSelectedPeriod(period)}
                className={[
                  "min-h-9 whitespace-nowrap rounded-full border px-3.5 py-2 text-xs font-semibold transition-colors duration-150",
                  active
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-card text-muted-foreground hover:border-primary/50 hover:text-foreground",
                ].join(" ")}
              >
                {period}
              </button>
            );
          })}
        </div>
      </section>

      {/* OPERATIONAL SUMMARY */}
      <section className="min-w-0 rounded-2xl border border-secondary-foreground/10 bg-secondary p-5 md:p-6">
        <div className="flex min-w-0 flex-col gap-5 md:flex-row md:items-center md:justify-between">
          <div className="min-w-0">
            <p className="text-label font-bold uppercase text-primary">Resumo operacional</p>

            <h2 className="mt-2 text-h2 font-bold text-secondary-foreground md:text-[27px]">
              Bom dia, Anderson
            </h2>

            <p className="mt-2 text-body leading-6 text-secondary-foreground/75">
              Veja o que precisa da sua atenção hoje ({selectedPeriod.toLowerCase()}).
            </p>
          </div>

          <div className="flex shrink-0 items-center gap-2 self-start rounded-full border border-border bg-background px-4 py-2.5 text-xs font-semibold text-foreground md:self-center">
            <span className="h-2 w-2 shrink-0 rounded-full bg-success" />
            <span>Ambiente: Produção</span>
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          </div>
        </div>
      </section>

      {/* KPI GRID */}
      <section className="grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {kpis.map((kpi) => (
          <div key={kpi.title} className="min-w-0">
            <KpiCard
              title={kpi.title}
              value={kpi.value}
              change={kpi.change}
              delta={kpi.delta}
              icon={kpi.icon}
            />
          </div>
        ))}
      </section>

      {/* MAIN ANALYTICS */}
      <section className="grid min-w-0 grid-cols-1 gap-6 2xl:grid-cols-[minmax(0,1.7fr)_minmax(380px,0.95fr)]">
        <div className="min-w-0 space-y-6">
          <WealthChart data={wealthTrend} />

          <div className="grid min-w-0 grid-cols-1 gap-6 2xl:grid-cols-2">
            <AttentionPanel items={attentionItems} />
            <RelationshipSummary items={relationshipSummary} />
          </div>
        </div>

        <div className="min-w-0 space-y-6">
          <AllocationChart data={allocationData} />
          <PipelineSummary stages={pipelineStages} />
          <GoalsSummary items={goals} />
          <RecentActivity items={recentActivities} />
        </div>
      </section>
    </div>
  );
}
