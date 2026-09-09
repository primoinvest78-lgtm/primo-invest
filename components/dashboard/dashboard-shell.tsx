"use client";

import { motion } from "motion/react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
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
  const pathname = usePathname();
  const [selectedPeriod, setSelectedPeriod] = useState("12 meses");

  return (
    <div className="min-h-screen bg-[#071A2D] text-white">
      <div className="flex min-h-screen">
        <aside className="hidden w-[280px] shrink-0 flex-col border-r border-white/10 bg-[#061827] lg:flex">
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
                  <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-white/45">
                    {group.title}
                  </p>
                ) : null}

                <ul className="space-y-1">
                  {group.items.map((item) => {
                    const Icon = item.icon;
                    const isActive = pathname === item.href || (item.href === "/dashboard" && pathname === "/");

                    return (
                      <li key={item.label}>
                        <Link
                          href={item.href}
                          className={[
                            "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition-all duration-200",
                            isActive
                              ? "bg-[linear-gradient(90deg,rgba(18,62,104,0.55),rgba(201,164,92,0.12))] text-white ring-1 ring-[#C9A45C]/30"
                              : "text-white/75 hover:bg-white/5 hover:text-white",
                          ].join(" ")}
                        >
                          <span
                            className={[
                              "flex h-8 w-8 items-center justify-center rounded-lg border",
                              isActive
                                ? "border-[#C9A45C]/30 bg-[#123E68]/30 text-[#E3C982]"
                                : "border-white/10 bg-white/5 text-white/70",
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
                        </Link>
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
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, ease: "easeOut" }} className="space-y-6">
              <div className="mb-2 flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-white/55">Dashboard</p>
                  <h1 className="mt-2 text-3xl font-bold tracking-[-0.06em] text-white">Dashboard</h1>
                  <p className="mt-1 text-sm text-white/70">Visão consolidada da operação e do patrimônio</p>
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
                          ? "border-[#C9A45C] bg-[#C9A45C] text-[#071A2D] shadow-[0_8px_18px_rgba(201,164,92,0.2)]"
                          : "border-white/10 bg-[#0B2238] text-white/70 hover:border-[#1F5F96] hover:text-white",
                      ].join(" ")}
                    >
                      {period}
                    </button>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-[#0B2238] p-4 shadow-[0_12px_30px_rgba(0,0,0,0.18)] md:p-5">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-white/55">Resumo operacional</p>
                    <h2 className="mt-2 text-2xl font-bold tracking-[-0.05em] text-white">Bom dia, Anderson</h2>
                    <p className="mt-1 text-sm text-white/70">Veja o que precisa da sua atenção hoje.</p>
                  </div>

                  <div className="inline-flex items-center gap-2 self-start rounded-full border border-white/10 bg-[#122b43] px-3 py-2 text-xs font-medium text-white">
                    <span className="h-2 w-2 rounded-full bg-[#18794E]" />
                    Ambiente: Produção
                    <ChevronDown className="h-3.5 w-3.5 text-white/60" />
                  </div>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                {kpis.map((kpi) => (
                  <KpiCard key={kpi.title} {...kpi} />
                ))}
              </div>

              <div className="mt-2 grid gap-6 xl:grid-cols-[1.7fr_0.95fr]">
                <div className="space-y-6">
                  <WealthChart data={wealthTrend} />

                  <div className="grid gap-6 xl:grid-cols-2">
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
