"use client";

import { motion } from "motion/react";
import Image from "next/image";
import { ChevronDown } from "lucide-react";
import { useState } from "react";
import {
  allocationData,
  attentionItems,
  goals,
  kpis,
  navigationGroups,
  pipelineStages,
  recentActivities,
  relationshipSummary,
  wealthTrend,
} from "@/lib/mock/dashboard";
import { AllocationChart } from "./allocation-chart";
import { AttentionPanel } from "./attention-panel";
import { DashboardHeader } from "./dashboard-header";
import { GoalsSummary } from "./goals-summary";
import { KpiCard } from "./kpi-card";
import { PipelineSummary } from "./pipeline-summary";
import { RecentActivity } from "./recent-activity";
import { RelationshipSummary } from "./relationship-summary";
import { WealthChart } from "./wealth-chart";

const periods = ["Hoje", "7 dias", "30 dias", "90 dias", "12 meses", "Personalizado"];

export function DashboardShell() {
  const [selectedPeriod, setSelectedPeriod] = useState("12 meses");

  return (
    <div className="min-h-screen bg-[#F5F7FA] text-[#142235]">
      <div className="flex min-h-screen">
        <aside className="hidden w-[280px] shrink-0 flex-col bg-[#071A2D] text-white lg:flex">
          <div className="flex items-center gap-3 border-b border-white/10 px-5 py-5">
            <div className="relative h-11 w-11 overflow-hidden rounded-lg bg-white/5 ring-1 ring-white/10">
              <Image src="/primo-invest-logo.png" alt="Primo Invest" width={44} height={44} />
            </div>
            <div>
              <div className="text-[10px] font-semibold uppercase tracking-[0.25em] text-[#E3C982]">
                Primo
              </div>
              <div className="text-lg font-semibold tracking-[0.12em] text-white">INVEST</div>
            </div>
          </div>

          <nav className="flex-1 overflow-y-auto px-3 py-4">
            {navigationGroups.map((group, groupIndex) => (
              <div key={`${group.title ?? "general"}-${groupIndex}`} className="mb-5">
                {group.title ? (
                  <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-[#9AA9B8]">
                    {group.title}
                  </p>
                ) : null}

                <ul className="space-y-1">
                  {group.items.map((item) => {
                    const Icon = item.icon;
                    return (
                      <li key={item.label}>
                        <button
                          type="button"
                          className={[
                            "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition-all duration-200",
                            item.active
                              ? "bg-[linear-gradient(90deg,rgba(18,62,104,0.20),rgba(201,164,92,0.18))] text-white ring-1 ring-[#C9A45C]/30"
                              : "text-[#D5E0EC] hover:bg-white/5 hover:text-white",
                          ].join(" ")}
                        >
                          <span
                            className={[
                              "flex h-8 w-8 items-center justify-center rounded-lg border",
                              item.active
                                ? "border-[#C9A45C]/35 bg-[#123E68]/30 text-[#E3C982]"
                                : "border-white/10 bg-white/5 text-[#D5E0EC]",
                            ].join(" ")}
                          >
                            <Icon className="h-4 w-4" />
                          </span>
                          <span className="flex-1 font-medium">{item.label}</span>
                          {item.badge ? (
                            <span className="rounded-full border border-white/10 bg-white/5 px-1.5 py-0.5 text-[9px] font-semibold text-[#E3C982]">
                              {item.badge}
                            </span>
                          ) : null}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </nav>
        </aside>

        <div className="flex-1">
          <DashboardHeader />

          <main className="px-4 pb-8 pt-5 md:px-6 xl:px-8">
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, ease: "easeOut" }}>
              <div className="mb-6 flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#64748B]">Dashboard</p>
                  <h1 className="mt-2 text-3xl font-bold tracking-[-0.06em] text-[#071A2D]">Dashboard</h1>
                  <p className="mt-1 text-sm text-[#64748B]">Visão consolidada da operação e do patrimônio</p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {periods.map((period) => (
                    <button
                      key={period}
                      type="button"
                      onClick={() => setSelectedPeriod(period)}
                      className={[
                        "rounded-full border px-3 py-1.5 text-xs font-medium transition-all duration-200",
                        selectedPeriod === period
                          ? "border-[#071A2D] bg-[#071A2D] text-white shadow-[0_8px_18px_rgba(7,26,45,0.12)]"
                          : "border-[#DCE3EA] bg-white text-[#64748B] hover:border-[#1F5F96] hover:text-[#071A2D]",
                      ].join(" ")}
                    >
                      {period}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mb-6 rounded-2xl border border-[#DCE3EA] bg-white p-4 shadow-[0_12px_30px_rgba(7,26,45,0.03)] md:p-5">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#64748B]">Resumo operacional</p>
                    <h2 className="mt-2 text-2xl font-bold tracking-[-0.05em] text-[#071A2D]">Bom dia, Anderson</h2>
                    <p className="mt-1 text-sm text-[#64748B]">Veja o que precisa da sua atenção hoje.</p>
                  </div>

                  <div className="inline-flex items-center gap-2 self-start rounded-full border border-[#DCE3EA] bg-[#F5F7FA] px-3 py-2 text-xs font-medium text-[#071A2D]">
                    <span className="h-2 w-2 rounded-full bg-[#18794E]" />
                    Ambiente: Produção
                    <ChevronDown className="h-3.5 w-3.5 text-[#64748B]" />
                  </div>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                {kpis.map((kpi) => (
                  <KpiCard key={kpi.title} {...kpi} />
                ))}
              </div>

              <div className="mt-6 grid gap-6 xl:grid-cols-[1.7fr_0.95fr]">
                <div className="space-y-6">
                  <WealthChart data={wealthTrend} />

                  <div className="grid gap-6 lg:grid-cols-2">
                    <AttentionPanel items={attentionItems} />
                    <RelationshipSummary items={relationshipSummary} />
                  </div>
                </div>

                <div className="space-y-6">
                  <AllocationChart data={allocationData} />
                  <PipelineSummary stages={pipelineStages} />
                  <GoalsSummary items={goals} />
                  <RecentActivity items={recentActivities} />
                </div>
              </div>
            </motion.div>
          </main>
        </div>
      </div>
    </div>
  );
}
