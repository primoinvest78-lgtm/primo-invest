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

const periods = [
  "Hoje",
  "7 dias",
  "30 dias",
  "90 dias",
  "12 meses",
  "Personalizado",
];

export function DashboardShell() {
  const pathname = usePathname();
  const [selectedPeriod, setSelectedPeriod] = useState("12 meses");

  return (
    <div className="min-h-screen w-full bg-[#000079] text-white">
      <div className="flex min-h-screen w-full">
        {/* SIDEBAR */}
        <aside className="hidden w-[288px] shrink-0 flex-col border-r border-white/10 bg-[#000079] lg:flex">
          {/* BRAND */}
          <div className="flex h-[76px] shrink-0 items-center gap-3 border-b border-white/10 px-6">
            <div className="relative flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-white ring-1 ring-white/10">
              <Image
                src="/primo-invest-logo.png"
                alt="Primo Invest"
                width={44}
                height={44}
                className="h-11 w-11 object-contain"
              />
            </div>

            <div className="min-w-0">
              <div className="text-[10px] font-semibold uppercase tracking-[0.24em] text-[#E7FBFE]">
                Primo
              </div>

              <div className="text-[18px] font-bold tracking-[0.12em] text-white">
                INVEST
              </div>
            </div>
          </div>

          {/* NAVIGATION */}
          <nav className="min-h-0 flex-1 overflow-y-auto px-4 py-5">
            {navigationGroups.map((group, groupIndex) => (
              <div
                key={`${group.title ?? "general"}-${groupIndex}`}
                className="mb-6 last:mb-0"
              >
                {group.title ? (
                  <p className="mb-2 px-3 text-[10px] font-bold uppercase tracking-[0.18em] text-[#9BB5E5]">
                    {group.title}
                  </p>
                ) : null}

                <ul className="space-y-1">
                  {group.items.map((item) => {
                    const Icon = item.icon;

                    const isActive =
                      pathname === item.href ||
                      (item.href === "/dashboard" && pathname === "/");

                    return (
                      <li key={item.label}>
                        <Link
                          href={item.href}
                          className={[
                            "group flex min-h-[46px] w-full items-center gap-3 rounded-xl px-3 py-2.5",
                            "text-left text-[14px] font-medium",
                            "transition-colors duration-150",
                            isActive
                              ? "bg-[#1707FA] text-white shadow-[0_8px_24px_rgba(23,7,250,0.22)]"
                              : "text-[#DDE7FA] hover:bg-white/[0.06] hover:text-white",
                          ].join(" ")}
                        >
                          <span
                            className={[
                              "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border",
                              "transition-colors duration-150",
                              isActive
                                ? "border-white/20 bg-white/10 text-white"
                                : "border-white/10 bg-white/[0.04] text-[#B9CBEA] group-hover:border-[#1707FA]/50 group-hover:text-white",
                            ].join(" ")}
                          >
                            <Icon className="h-[17px] w-[17px]" />
                          </span>

                          <span className="min-w-0 flex-1 truncate">
                            {item.label}
                          </span>

                          {item.badge ? (
                            <span
                              className={[
                                "shrink-0 rounded-full border px-2 py-0.5",
                                "text-[10px] font-semibold",
                                isActive
                                  ? "border-white/20 bg-white/10 text-white"
                                  : "border-white/10 bg-white/[0.04] text-[#B9CBEA]",
                              ].join(" ")}
                            >
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

        {/* APPLICATION */}
        <div className="flex min-w-0 flex-1 flex-col bg-[#000079]">
          <DashboardHeader />

          <main className="min-w-0 flex-1 px-5 pb-10 pt-6 md:px-7 xl:px-9">
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.25,
                ease: "easeOut",
              }}
              className="mx-auto w-full max-w-[1800px] space-y-6"
            >
              {/* PAGE HEADER */}
              <section className="flex min-w-0 flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
                <div className="min-w-0">
                  <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#9BB5E5]">
                    Dashboard
                  </p>

                  <h1 className="mt-2 text-[32px] font-bold leading-tight tracking-[-0.04em] text-white md:text-[36px]">
                    Dashboard
                  </h1>

                  <p className="mt-2 max-w-2xl text-[14px] leading-6 text-[#DDE7FA]">
                    Visão consolidada da operação e do patrimônio.
                  </p>
                </div>

                {/* PERIOD FILTER */}
                <div className="flex max-w-full flex-wrap items-center gap-2">
                  {periods.map((period) => {
                    const active = selectedPeriod === period;

                    return (
                      <button
                        key={period}
                        type="button"
                        onClick={() => setSelectedPeriod(period)}
                        className={[
                          "min-h-9 rounded-full border px-3.5 py-2",
                          "text-xs font-semibold whitespace-nowrap",
                          "transition-colors duration-150",
                          active
                            ? "border-[#1707FA] bg-[#1707FA] text-white"
                            : "border-white/10 bg-[#060299] text-[#DDE7FA] hover:border-[#1707FA]/60 hover:text-white",
                        ].join(" ")}
                      >
                        {period}
                      </button>
                    );
                  })}
                </div>
              </section>

              {/* OPERATIONAL SUMMARY */}
              <section className="min-w-0 rounded-2xl border border-white/10 bg-[#060299] p-5 md:p-6">
                <div className="flex min-w-0 flex-col gap-5 md:flex-row md:items-center md:justify-between">
                  <div className="min-w-0">
                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#E7FBFE]">
                      Resumo operacional
                    </p>

                    <h2 className="mt-2 text-[24px] font-bold leading-tight tracking-[-0.035em] text-white md:text-[27px]">
                      Bom dia, Anderson
                    </h2>

                    <p className="mt-2 text-[14px] leading-6 text-[#DDE7FA]">
                      Veja o que precisa da sua atenção hoje.
                    </p>
                  </div>

                  <div className="flex shrink-0 items-center gap-2 self-start rounded-full border border-white/10 bg-[#000079] px-4 py-2.5 text-xs font-semibold text-white md:self-center">
                    <span className="h-2 w-2 shrink-0 rounded-full bg-[#35C98A]" />

                    <span>Ambiente: Produção</span>

                    <ChevronDown className="h-4 w-4 text-[#B9CBEA]" />
                  </div>
                </div>
              </section>

              {/* KPI GRID */}
              <section className="grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {kpis.map((kpi) => (
                  <div key={kpi.title} className="min-w-0">
                    <KpiCard {...kpi} />
                  </div>
                ))}
              </section>

              {/* MAIN ANALYTICS */}
              <section className="grid min-w-0 grid-cols-1 gap-6 2xl:grid-cols-[minmax(0,1.7fr)_minmax(380px,0.95fr)]">
                {/* PRIMARY COLUMN */}
                <div className="min-w-0 space-y-6">
                  <div className="min-w-0">
                    <WealthChart data={wealthTrend} />
                  </div>

                  {/* ATTENTION + RELATIONSHIP */}
                  <div className="grid min-w-0 grid-cols-1 gap-6 2xl:grid-cols-2">
                    <div className="min-w-0">
                      <AttentionPanel items={attentionItems} />
                    </div>

                    <div className="min-w-0">
                      <RelationshipSummary items={relationshipSummary} />
                    </div>
                  </div>
                </div>

                {/* SECONDARY COLUMN */}
                <div className="min-w-0 space-y-6">
                  <div className="min-w-0">
                    <AllocationChart data={allocationData} />
                  </div>

                  <div className="min-w-0">
                    <PipelineSummary stages={pipelineStages} />
                  </div>

                  <div className="min-w-0">
                    <GoalsSummary items={goals} />
                  </div>

                  <div className="min-w-0">
                    <RecentActivity items={recentActivities} />
                  </div>
                </div>
              </section>
            </motion.div>
          </main>
        </div>
      </div>
    </div>
  );
}