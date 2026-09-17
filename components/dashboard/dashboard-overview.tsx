"use client";

import {
  AlarmClock,
  BriefcaseBusiness,
  ChevronDown,
  FolderKanban,
  Landmark,
  TrendingUp,
  UserX,
  Users,
  type LucideIcon,
} from "lucide-react";
import { useState } from "react";

import type { DashboardData, DashboardIconKey } from "@/lib/data/dashboard";
import { ReportShortcutButton } from "@/components/reports/report-shortcut-button";
import { formatMonthLabel } from "@/lib/utils/format";

/**
 * Componentes de ícone não atravessam a fronteira Server -> Client
 * Component (React error #441) — por isso o dado do servidor carrega
 * só a chave (DashboardIconKey) e esse mapa resolve pro componente
 * real aqui, já do lado client.
 */
const DASHBOARD_ICONS: Record<DashboardIconKey, LucideIcon> = {
  landmark: Landmark,
  briefcase: BriefcaseBusiness,
  users: Users,
  "trending-up": TrendingUp,
  "folder-kanban": FolderKanban,
  "user-x": UserX,
  "alarm-clock": AlarmClock,
};

import { AllocationChart } from "./allocation-chart";
import { AttentionPanel } from "./attention-panel";
import { GoalsSummary } from "./goals-summary";
import { KpiCard } from "./kpi-card";
import { PipelineSummary } from "./pipeline-summary";
import { RecentActivity } from "./recent-activity";
import { RelationshipSummary } from "./relationship-summary";
import { WealthChart } from "./wealth-chart";

const periods = ["Hoje", "7 dias", "30 dias", "90 dias", "12 meses"];

export function DashboardOverview({ data }: { data: DashboardData }) {
  const [selectedPeriod, setSelectedPeriod] = useState("12 meses");

  const wealthTrend = data.wealthTrend.map((point) => ({
    ...point,
    month: formatMonthLabel(point.month),
  }));

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
          <ReportShortcutButton type="executivo" label="Relatório executivo" />
        </div>
      </section>

      {/* OPERATIONAL SUMMARY */}
      <section className="min-w-0 rounded-2xl border border-secondary-foreground/10 bg-secondary p-5 md:p-6">
        <div className="flex min-w-0 flex-col gap-5 md:flex-row md:items-center md:justify-between">
          <div className="min-w-0">
            <p className="text-label font-bold uppercase text-primary">Resumo operacional</p>

            <h2 className="mt-2 text-h2 font-bold text-secondary-foreground md:text-[27px]">
              {data.greetingName ? `Bom dia, ${data.greetingName}` : "Bom dia"}
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
        {data.kpis.map((kpi) => (
          <div key={kpi.title} className="min-w-0 h-full">
            <KpiCard
              title={kpi.title}
              value={kpi.value}
              change={kpi.change}
              delta={kpi.delta}
              icon={DASHBOARD_ICONS[kpi.icon]}
              href={kpi.href}
              animateValueWithGsap
            />
          </div>
        ))}
      </section>

      {/* MAIN ANALYTICS */}
      <section className="grid min-w-0 grid-cols-1 gap-6 2xl:grid-cols-[minmax(0,1.7fr)_minmax(380px,0.95fr)]">
        <div className="min-w-0 space-y-6">
          <WealthChart data={wealthTrend} />

          <div className="grid min-w-0 grid-cols-1 gap-6 2xl:grid-cols-2">
            <AttentionPanel
              items={data.attentionItems.map((item) => ({ ...item, icon: DASHBOARD_ICONS[item.icon] }))}
            />
            <RelationshipSummary items={data.relationshipSummary} />
          </div>
        </div>

        <div className="min-w-0 space-y-6">
          <AllocationChart data={data.allocationData} />
          <PipelineSummary stages={data.pipelineStages} />
          <GoalsSummary items={data.goals} />
          <RecentActivity items={data.recentActivities} />
        </div>
      </section>
    </div>
  );
}
