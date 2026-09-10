"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  BarChart3,
  Bell,
  BriefcaseBusiness,
  ChevronDown,
  CircleDollarSign,
  FileText,
  LayoutDashboard,
  Menu,
  Moon,
  PieChart as PieChartIcon,
  Search,
  Settings,
  ShieldCheck,
  Sun,
  Target,
  TrendingUp,
  Users,
  WalletCards,
  X,
} from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { motion } from "motion/react";

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

type Theme = "dark" | "light";

const BLUE = {
  deepest: "#000079",
  dark: "#060299",
  medium: "#0C04B9",
  strong: "#1105D9",
  electric: "#1707FA",
  light: "#E7FBFE",
  white: "#FFFFFF",
};

const chartColors = [
  BLUE.electric,
  BLUE.strong,
  BLUE.medium,
  BLUE.dark,
  BLUE.deepest,
];

const periodOptions = [
  "Hoje",
  "7 dias",
  "30 dias",
  "90 dias",
  "12 meses",
];

const navigationIcons = [
  LayoutDashboard,
  Users,
  FileText,
  TrendingUp,
  Activity,
  WalletCards,
  BriefcaseBusiness,
  CircleDollarSign,
  ShieldCheck,
  Settings,
];

function useTheme() {
  const [theme, setTheme] = useState<Theme>("dark");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const saved = window.localStorage.getItem(
      "primo-invest-theme",
    );

    const initial: Theme = saved === "light" ? "light" : "dark";

    setTheme(initial);
    setMounted(true);

    document.documentElement.dataset.theme = initial;

    if (initial === "light") {
      document.documentElement.classList.add("light");
    } else {
      document.documentElement.classList.remove("light");
    }
  }, []);

  function toggleTheme() {
    const next: Theme = theme === "dark" ? "light" : "dark";

    setTheme(next);
    document.documentElement.dataset.theme = next;

    if (next === "light") {
      document.documentElement.classList.add("light");
    } else {
      document.documentElement.classList.remove("light");
    }

    window.localStorage.setItem("primo-invest-theme", next);
  }

  return {
    theme,
    mounted,
    toggleTheme,
  };
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0,
  }).format(value);
}

export default function DashboardPage() {
  const { theme, mounted, toggleTheme } = useTheme();
  const [selectedPeriod, setSelectedPeriod] = useState("12 meses");
  const [mobileMenu, setMobileMenu] = useState(false);

  const isLight = theme === "light";

  const surface = "#FFFFFF";
  const surfaceStrong = isLight ? "#FFFFFF" : BLUE.dark;
  const border = isLight ? "#D7E1F2" : "rgba(255,255,255,0.10)";
  const text = isLight ? BLUE.deepest : BLUE.white;
  const muted = isLight ? BLUE.dark : BLUE.light;
  const secondary = isLight ? BLUE.dark : BLUE.light;

  const allocationTotal = useMemo(
    () =>
      allocationData.reduce(
        (total, item) => total + item.value,
        0,
      ),
    [],
  );

  const totalPipeline = useMemo(() => {
    return pipelineStages.reduce((total, stage) => {
      const numeric = Number(
        String(stage.value)
          .replace(/[^\d,.-]/g, "")
          .replace(/\./g, "")
          .replace(",", "."),
      );

      return total + (Number.isFinite(numeric) ? numeric : 0);
    }, 0);
  }, []);

  return (
    <div
      className="min-h-screen w-full"
      style={{
        backgroundColor: isLight ? "#FFFFFF" : BLUE.deepest,
        color: text,
      }}
    >
      <div className="flex min-h-screen">
        {/* SIDEBAR */}
        <aside
          className={[
            "hidden w-[264px] shrink-0 border-r lg:flex",
            "flex-col",
            isLight ? "bg-white" : "bg-[#000079]",
          ].join(" ")}
          style={{ borderColor: border }}
        >
          <div
            className="flex h-[76px] shrink-0 items-center gap-3 border-b px-5"
            style={{ borderColor: border }}
          >
            <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-white">
              <Image
                src="/primo-invest-logo.png"
                alt="Primo Invest"
                width={44}
                height={44}
                className="h-11 w-11 object-contain"
                priority
              />
            </div>

            <div className="min-w-0">
              <p
                className="text-[10px] font-bold uppercase tracking-[0.28em]"
                style={{
                  color: isLight ? BLUE.medium : BLUE.light,
                }}
              >
                Primo
              </p>

              <p
                className="mt-0.5 text-[18px] font-bold tracking-[0.12em]"
                style={{ color: text }}
              >
                INVEST
              </p>
            </div>
          </div>

          <nav className="flex-1 overflow-y-auto px-3 py-5">
            {navigationGroups.map((group, groupIndex) => (
              <div
                key={`${group.title ?? "principal"}-${groupIndex}`}
                className="mb-6 last:mb-0"
              >
                {group.title ? (
                  <p
                    className="mb-2 px-3 text-[10px] font-bold uppercase tracking-[0.18em]"
                    style={{ color: muted }}
                  >
                    {group.title}
                  </p>
                ) : null}

                <div className="space-y-1">
                  {group.items.map((item, itemIndex) => {
                    const Icon =
                      navigationIcons[
                        (groupIndex + itemIndex) %
                          navigationIcons.length
                      ];

                    const isActive =
                      item.href === "/dashboard" ||
                      (item.href === "/" &&
                        typeof window !== "undefined" &&
                        window.location.pathname === "/");

                    return (
                      <Link
                        key={item.label}
                        href={item.href}
                        className={[
                          "flex min-h-[44px] items-center gap-3 rounded-xl px-3",
                          "text-sm font-semibold transition-colors duration-150",
                          isActive
                            ? "text-white"
                            : isLight
                              ? "text-[#53698E] hover:bg-[#F3F6FC] hover:text-[#07143F]"
                              : "text-[#DDE7FA] hover:bg-white/[0.06] hover:text-white",
                        ].join(" ")}
                        style={
                          isActive
                            ? {
                                backgroundColor:
                                  BLUE.electric,
                              }
                            : undefined
                        }
                      >
                        <span
                          className={[
                            "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
                            isActive
                              ? "bg-white/10 text-white"
                              : isLight
                                ? "bg-[#EEF2FF] text-[#0C04B9]"
                                : "bg-[#060299] text-[#B9CBEA]",
                          ].join(" ")}
                        >
                          <Icon
                            className="h-4 w-4"
                            strokeWidth={1.8}
                          />
                        </span>

                        <span className="min-w-0 flex-1 truncate">
                          {item.label}
                        </span>

                        {item.badge ? (
                          <span
                            className={[
                              "rounded-full px-2 py-0.5 text-[9px] font-bold",
                              isActive
                                ? "bg-white/10 text-white"
                                : isLight
                                  ? "bg-[#E8EDFF] text-[#0C04B9]"
                                  : "bg-white/10 text-[#BBD8FF]",
                            ].join(" ")}
                          >
                            {item.badge}
                          </span>
                        ) : null}
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>
        </aside>

        {/* MOBILE SIDEBAR */}
        {mobileMenu ? (
          <div className="fixed inset-0 z-50 lg:hidden">
            <button
              type="button"
              aria-label="Fechar menu"
              className="absolute inset-0 bg-black/50"
              onClick={() => setMobileMenu(false)}
            />

            <aside
              className="relative flex h-full w-[290px] flex-col border-r"
              style={{
                backgroundColor: isLight
                  ? "#FFFFFF"
                  : BLUE.deepest,
                borderColor: border,
              }}
            >
              <div
                className="flex h-[76px] items-center justify-between border-b px-5"
                style={{ borderColor: border }}
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-xl bg-white">
                    <Image
                      src="/primo-invest-logo.png"
                      alt="Primo Invest"
                      width={40}
                      height={40}
                      className="h-10 w-10 object-contain"
                    />
                  </div>

                  <span
                    className="font-bold tracking-[0.12em]"
                    style={{ color: text }}
                  >
                    INVEST
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => setMobileMenu(false)}
                  className="rounded-lg p-2"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <nav className="flex-1 overflow-y-auto px-3 py-5">
                {navigationGroups.flatMap((group) =>
                  group.items.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMobileMenu(false)}
                      className="flex min-h-[44px] items-center rounded-xl px-3 text-sm font-semibold"
                    >
                      {item.label}
                    </Link>
                  )),
                )}
              </nav>
            </aside>
          </div>
        ) : null}

        {/* MAIN */}
        <div className="min-w-0 flex-1">
          {/* HEADER */}
          <header
            className="sticky top-0 z-40 border-b"
            style={{
              backgroundColor: isLight
                ? "rgba(255,255,255,0.96)"
                : "rgba(0,0,121,0.96)",
              borderColor: border,
              backdropFilter: "blur(14px)",
            }}
          >
            <div className="mx-auto flex min-h-[76px] max-w-[1800px] items-center gap-3 px-4 md:px-7 xl:px-9">
              <button
                type="button"
                aria-label="Abrir menu"
                onClick={() => setMobileMenu(true)}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border lg:hidden"
                style={{
                  borderColor: border,
                  backgroundColor: surface,
                }}
              >
                <Menu className="h-5 w-5" />
              </button>

              <div className="hidden min-w-0 shrink-0 lg:block">
                <p
                  className="text-[10px] font-bold uppercase tracking-[0.25em]"
                  style={{
                    color: isLight ? BLUE.medium : BLUE.light,
                  }}
                >
                  Primo Invest
                </p>

                <p
                  className="mt-1 text-[15px] font-semibold"
                  style={{ color: text }}
                >
                  Dashboard executivo
                </p>
              </div>

              <div className="min-w-0 flex-1 lg:ml-auto lg:max-w-[560px]">
                <div className="relative">
                  <Search
                    className="pointer-events-none absolute left-4 top-1/2 h-[17px] w-[17px] -translate-y-1/2"
                    style={{ color: muted }}
                  />

                  <input
                    type="search"
                    placeholder="Buscar clientes, investimentos e documentos..."
                    className="h-11 w-full rounded-xl border pl-11 pr-4 text-sm font-medium outline-none transition-all focus:ring-4"
                    style={{
                      borderColor: border,
                      backgroundColor: isLight
                        ? "#F7F9FC"
                        : BLUE.dark,
                      color: text,
                    }}
                  />
                </div>
              </div>

              <div className="flex shrink-0 items-center gap-2">
                {mounted ? (
                  <motion.button
                    type="button"
                    whileTap={{ scale: 0.96 }}
                    onClick={toggleTheme}
                    aria-label={
                      isLight
                        ? "Ativar tema escuro"
                        : "Ativar tema claro"
                    }
                    className="flex h-11 w-11 items-center justify-center rounded-xl border"
                    style={{
                      borderColor: border,
                      backgroundColor: surface,
                      color: isLight
                        ? BLUE.medium
                        : BLUE.light,
                    }}
                  >
                    {isLight ? (
                      <Moon className="h-[17px] w-[17px]" />
                    ) : (
                      <Sun className="h-[17px] w-[17px]" />
                    )}
                  </motion.button>
                ) : null}

                <button
                  type="button"
                  className="hidden h-11 items-center gap-2 rounded-xl border px-3 text-xs font-semibold sm:flex"
                  style={{
                    borderColor: border,
                    backgroundColor: surface,
                    color: text,
                  }}
                >
                  <span className="h-2 w-2 rounded-full bg-[#19B878]" />
                  ProduÃ§Ã£o
                  <ChevronDown className="h-4 w-4" />
                </button>

                <button
                  type="button"
                  aria-label="NotificaÃ§Ãµes"
                  className="relative flex h-11 w-11 items-center justify-center rounded-xl border"
                  style={{
                    borderColor: border,
                    backgroundColor: surface,
                    color: text,
                  }}
                >
                  <Bell className="h-[18px] w-[18px]" />

                  <span
                    className="absolute right-1.5 top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[8px] font-bold text-white"
                    style={{ backgroundColor: BLUE.electric }}
                  >
                    3
                  </span>
                </button>

                <button
                  type="button"
                  className="flex h-11 items-center gap-2 rounded-xl border px-2.5 sm:px-3"
                  style={{
                    borderColor: border,
                    backgroundColor: surface,
                  }}
                >
                  <span
                    className="flex h-8 w-8 items-center justify-center rounded-lg text-[13px] font-bold text-white"
                    style={{ backgroundColor: BLUE.electric }}
                  >
                    A
                  </span>

                  <span className="hidden text-left sm:block">
                    <span
                      className="block text-[13px] font-semibold"
                      style={{ color: text }}
                    >
                      Anderson
                    </span>

                    <span
                      className="mt-0.5 block text-[9px] font-bold uppercase tracking-[0.16em]"
                      style={{ color: muted }}
                    >
                      Diretor
                    </span>
                  </span>

                  <ChevronDown
                    className="hidden h-4 w-4 sm:block"
                    style={{ color: muted }}
                  />
                </button>
              </div>
            </div>
          </header>

          {/* CONTENT */}
          <main className="mx-auto w-full max-w-[1800px] px-4 pb-10 pt-6 md:px-7 xl:px-9">
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.22,
                ease: "easeOut",
              }}
              className="space-y-6"
            >
              {/* TITLE + PERIOD */}
              <section className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
                <div>
                  <p
                    className="text-[10px] font-bold uppercase tracking-[0.24em]"
                    style={{
                      color: isLight
                        ? BLUE.medium
                        : BLUE.light,
                    }}
                  >
                    VisÃ£o executiva
                  </p>

                  <h1
                    className="mt-2 text-[34px] font-bold leading-none tracking-[-0.045em] md:text-[40px]"
                    style={{ color: text }}
                  >
                    Dashboard
                  </h1>

                  <p
                    className="mt-2 text-sm leading-6"
                    style={{ color: muted }}
                  >
                    PatrimÃ´nio, relacionamento e operaÃ§Ã£o em uma
                    Ãºnica visÃ£o.
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  {periodOptions.map((period) => {
                    const active = selectedPeriod === period;

                    return (
                      <button
                        key={period}
                        type="button"
                        onClick={() =>
                          setSelectedPeriod(period)
                        }
                        className="min-h-9 rounded-full border px-3.5 text-xs font-semibold transition-colors"
                        style={{
                          borderColor: active
                            ? BLUE.electric
                            : border,
                          backgroundColor: active
                            ? BLUE.electric
                            : surface,
                          color: active ? "#FFFFFF" : secondary,
                        }}
                      >
                        {period}
                      </button>
                    );
                  })}
                </div>
              </section>

              {/* KPI */}
              <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {kpis.map((kpi, index) => {
                  const Icon =
                    index === 0
                      ? WalletCards
                      : index === 1
                        ? BriefcaseBusiness
                        : index === 2
                          ? Users
                          : TrendingUp;

                  return (
                    <motion.article
                      key={kpi.title}
                      whileHover={{ y: -2 }}
                      transition={{ duration: 0.15 }}
                      className="rounded-2xl border p-5"
                      style={{
                        borderColor: border,
                        backgroundColor: surface,
                        boxShadow: isLight
                          ? "0 10px 30px rgba(0,0,121,0.06)"
                          : "0 14px 32px rgba(0,0,40,0.20)",
                      }}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0">
                          <p
                            className="truncate text-[10px] font-bold uppercase tracking-[0.20em]"
                            style={{ color: muted }}
                          >
                            {kpi.title}
                          </p>

                          <p
                            className="mt-3 truncate text-[27px] font-bold leading-none tracking-[-0.045em]"
                            style={{ color: text }}
                          >
                            {kpi.value}
                          </p>
                        </div>

                        <div
                          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
                          style={{
                            backgroundColor: isLight
                              ? "#EEF2FF"
                              : BLUE.deepest,
                            color: BLUE.electric,
                          }}
                        >
                          <Icon
                            className="h-[18px] w-[18px]"
                            strokeWidth={1.8}
                          />
                        </div>
                      </div>

                      <div className="mt-5 flex items-center justify-between gap-3">
                        <span
                          className="rounded-full px-2.5 py-1.5 text-[11px] font-bold"
                          style={{
                            backgroundColor: isLight
                              ? "#EEF2FF"
                              : "rgba(23,7,250,0.18)",
                            color: isLight
                              ? BLUE.medium
                              : "#BBD8FF",
                          }}
                        >
                          {kpi.change}
                        </span>

                        <span
                          className="text-[10px] font-bold uppercase tracking-[0.12em]"
                          style={{ color: muted }}
                        >
                          {kpi.delta >= 0 ? "+" : ""}
                          {kpi.delta}%
                        </span>
                      </div>
                    </motion.article>
                  );
                })}
              </section>

              {/* MAIN ANALYTICS */}
              <section className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1.65fr)_minmax(360px,0.8fr)]">
                {/* WEALTH */}
                <article
                  className="min-w-0 rounded-2xl border p-5 md:p-6"
                  style={{
                    borderColor: border,
                    backgroundColor: surface,
                    boxShadow: isLight
                      ? "0 10px 30px rgba(0,0,121,0.06)"
                      : "0 14px 32px rgba(0,0,40,0.20)",
                  }}
                >
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                      <p
                        className="text-[10px] font-bold uppercase tracking-[0.20em]"
                        style={{ color: muted }}
                      >
                        PatrimÃ´nio
                      </p>

                      <h2
                        className="mt-1 text-2xl font-bold tracking-[-0.04em]"
                        style={{ color: text }}
                      >
                        EvoluÃ§Ã£o patrimonial
                      </h2>
                    </div>

                    <div
                      className="flex items-center gap-2 text-xs font-semibold"
                      style={{ color: muted }}
                    >
                      <span
                        className="h-2.5 w-2.5 rounded-full"
                        style={{
                          backgroundColor:
                            BLUE.electric,
                        }}
                      />
                      Ãšltimos 12 meses
                    </div>
                  </div>

                  <div className="mt-5 h-[330px] w-full min-w-0">
                    <ResponsiveContainer
                      width="100%"
                      height="100%"
                    >
                      <AreaChart
                        data={wealthTrend}
                        margin={{
                          top: 10,
                          right: 8,
                          left: -18,
                          bottom: 0,
                        }}
                      >
                        <defs>
                          <linearGradient
                            id="singleDashboardArea"
                            x1="0"
                            y1="0"
                            x2="0"
                            y2="1"
                          >
                            <stop
                              offset="0%"
                              stopColor={BLUE.electric}
                              stopOpacity={
                                isLight ? 0.20 : 0.28
                              }
                            />
                            <stop
                              offset="100%"
                              stopColor={BLUE.electric}
                              stopOpacity={0}
                            />
                          </linearGradient>
                        </defs>

                        <CartesianGrid
                          vertical={false}
                          stroke={
                            isLight
                              ? "rgba(7,20,63,0.08)"
                              : "rgba(255,255,255,0.08)"
                          }
                          strokeDasharray="4 4"
                        />

                        <XAxis
                          dataKey="month"
                          tickLine={false}
                          axisLine={false}
                          tick={{
                            fill: muted,
                            fontSize: 12,
                          }}
                          dy={10}
                        />

                        <YAxis
                          tickLine={false}
                          axisLine={false}
                          tick={{
                            fill: muted,
                            fontSize: 12,
                          }}
                          tickFormatter={(value) =>
                            `R$ ${Math.round(
                              Number(value) / 1000000,
                            )}M`
                          }
                        />

                        <Tooltip
                          contentStyle={{
                            borderRadius: 14,
                            border: `1px solid ${border}`,
                            backgroundColor: surfaceStrong,
                            color: text,
                            boxShadow:
                              "0 16px 36px rgba(0,0,40,0.18)",
                          }}
                          labelStyle={{
                            color: muted,
                            fontWeight: 600,
                          }}
                          formatter={(value) => [
                            formatCurrency(Number(value)),
                            "PatrimÃ´nio",
                          ]}
                        />

                        <Area
                          type="monotone"
                          dataKey="value"
                          stroke={BLUE.electric}
                          strokeWidth={3}
                          fill="url(#singleDashboardArea)"
                          activeDot={{
                            r: 6,
                            fill: BLUE.electric,
                            stroke: surface,
                            strokeWidth: 3,
                          }}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </article>

                {/* ALLOCATION */}
                <article
                  className="min-w-0 rounded-2xl border p-5 md:p-6"
                  style={{
                    borderColor: border,
                    backgroundColor: surface,
                    boxShadow: isLight
                      ? "0 10px 30px rgba(0,0,121,0.06)"
                      : "0 14px 32px rgba(0,0,40,0.20)",
                  }}
                >
                  <p
                    className="text-[10px] font-bold uppercase tracking-[0.20em]"
                    style={{ color: muted }}
                  >
                    AlocaÃ§Ã£o
                  </p>

                  <h2
                    className="mt-1 text-2xl font-bold tracking-[-0.04em]"
                    style={{ color: text }}
                  >
                    PatrimÃ´nio por classe
                  </h2>

                  <div className="relative mt-2 h-[245px]">
                    <ResponsiveContainer
                      width="100%"
                      height="100%"
                    >
                      <PieChart>
                        <Pie
                          data={allocationData}
                          dataKey="value"
                          innerRadius={62}
                          outerRadius={88}
                          paddingAngle={2}
                          stroke={surface}
                          strokeWidth={3}
                        >
                          {allocationData.map(
                            (item, index) => (
                              <Cell
                                key={item.name}
                                fill={
                                  chartColors[
                                    index %
                                      chartColors.length
                                  ]
                                }
                              />
                            ),
                          )}
                        </Pie>

                        <Tooltip
                          formatter={(value) => [
                            `${value}%`,
                            "AlocaÃ§Ã£o",
                          ]}
                          contentStyle={{
                            borderRadius: 12,
                            border: `1px solid ${border}`,
                            backgroundColor:
                              surfaceStrong,
                            color: text,
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>

                    <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                      <div className="text-center">
                        <p
                          className="text-[9px] font-bold uppercase tracking-[0.18em]"
                          style={{ color: muted }}
                        >
                          Total
                        </p>

                        <p
                          className="mt-1 text-xl font-bold"
                          style={{ color: text }}
                        >
                          R$ 48,75 mi
                        </p>
                      </div>
                    </div>
                  </div>

                  <div
                    className="space-y-1 border-t pt-3"
                    style={{ borderColor: border }}
                  >
                    {allocationData.map(
                      (item, index) => (
                        <div
                          key={item.name}
                          className="flex items-center justify-between gap-3 py-1.5"
                        >
                          <div className="flex min-w-0 items-center gap-2">
                            <span
                              className="h-2.5 w-2.5 shrink-0 rounded-full"
                              style={{
                                backgroundColor:
                                  chartColors[
                                    index %
                                      chartColors.length
                                  ],
                              }}
                            />

                            <span
                              className="truncate text-xs font-medium"
                              style={{ color: secondary }}
                            >
                              {item.name}
                            </span>
                          </div>

                          <span
                            className="text-xs font-bold"
                            style={{ color: text }}
                          >
                            {item.value}%
                          </span>
                        </div>
                      ),
                    )}
                  </div>
                </article>
              </section>

              {/* OPERATIONAL ROW */}
              <section className="grid grid-cols-1 gap-6 xl:grid-cols-3">
                {/* ATTENTION */}
                <article
                  className="rounded-2xl border p-5"
                  style={{
                    borderColor: border,
                    backgroundColor: surface,
                  }}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p
                        className="text-[10px] font-bold uppercase tracking-[0.20em]"
                        style={{ color: muted }}
                      >
                        Prioridades
                      </p>

                      <h2
                        className="mt-1 text-xl font-bold tracking-[-0.035em]"
                        style={{ color: text }}
                      >
                        AtenÃ§Ã£o
                      </h2>
                    </div>

                    <Bell
                      className="h-5 w-5"
                      style={{ color: BLUE.electric }}
                    />
                  </div>

                  <div className="mt-4 space-y-2.5">
                    {attentionItems.map((item, index) => (
                      <div
                        key={item.description}
                        className="flex items-center gap-3 rounded-xl border p-3"
                        style={{
                          borderColor: border,
                          backgroundColor:
                            isLight
                              ? "#F8FAFD"
                              : BLUE.deepest,
                        }}
                      >
                        <span
                          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
                          style={{
                            backgroundColor: isLight
                              ? "#EEF2FF"
                              : BLUE.dark,
                            color: BLUE.electric,
                          }}
                        >
                          <span
                            className="h-2.5 w-2.5 rounded-full"
                            style={{
                              backgroundColor:
                                chartColors[
                                  index %
                                    chartColors.length
                                ],
                            }}
                          />
                        </span>

                        <div className="min-w-0 flex-1">
                          <p
                            className="text-xs font-semibold leading-5"
                            style={{ color: secondary }}
                          >
                            {item.description}
                          </p>
                        </div>

                        <span
                          className="shrink-0 rounded-full px-2 py-1 text-[10px] font-bold"
                          style={{
                            backgroundColor:
                              isLight
                                ? "#EEF2FF"
                                : "rgba(23,7,250,0.18)",
                            color: isLight
                              ? BLUE.medium
                              : "#BBD8FF",
                          }}
                        >
                          {item.quantity}
                        </span>
                      </div>
                    ))}
                  </div>
                </article>

                {/* PIPELINE */}
                <article
                  className="rounded-2xl border p-5"
                  style={{
                    borderColor: border,
                    backgroundColor: surface,
                  }}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p
                        className="text-[10px] font-bold uppercase tracking-[0.20em]"
                        style={{ color: muted }}
                      >
                        Comercial
                      </p>

                      <h2
                        className="mt-1 text-xl font-bold tracking-[-0.035em]"
                        style={{ color: text }}
                      >
                        Pipeline
                      </h2>
                    </div>

                    <BarChart3
                      className="h-5 w-5"
                      style={{ color: BLUE.electric }}
                    />
                  </div>

                  <div className="mt-4 h-[210px]">
                    <ResponsiveContainer
                      width="100%"
                      height="100%"
                    >
                      <BarChart
                        data={pipelineStages}
                        margin={{
                          top: 10,
                          right: 0,
                          left: -25,
                          bottom: 0,
                        }}
                      >
                        <CartesianGrid
                          vertical={false}
                          stroke={
                            isLight
                              ? "rgba(7,20,63,0.07)"
                              : "rgba(255,255,255,0.07)"
                          }
                          strokeDasharray="4 4"
                        />

                        <XAxis
                          dataKey="name"
                          tickLine={false}
                          axisLine={false}
                          tick={{
                            fill: muted,
                            fontSize: 10,
                          }}
                          interval={0}
                          angle={-18}
                          textAnchor="end"
                          height={48}
                        />

                        <YAxis
                          tickLine={false}
                          axisLine={false}
                          tick={{
                            fill: muted,
                            fontSize: 10,
                          }}
                        />

                        <Tooltip
                          cursor={{
                            fill: isLight
                              ? "rgba(23,7,250,0.05)"
                              : "rgba(255,255,255,0.04)",
                          }}
                          contentStyle={{
                            borderRadius: 12,
                            border: `1px solid ${border}`,
                            backgroundColor:
                              surfaceStrong,
                            color: text,
                          }}
                        />

                        <Bar
                          dataKey={(stage) => {
                            const numeric =
                              Number(
                                String(stage.value)
                                  .replace(
                                    /[^\d,.-]/g,
                                    "",
                                  )
                                  .replace(/\./g, "")
                                  .replace(
                                    ",",
                                    ".",
                                  ),
                              );

                            return Number.isFinite(numeric)
                              ? numeric
                              : 0;
                          }}
                          radius={[6, 6, 0, 0]}
                          fill={BLUE.electric}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                  <div
                    className="mt-2 border-t pt-3"
                    style={{ borderColor: border }}
                  >
                    <span
                      className="text-[10px] font-bold uppercase tracking-[0.14em]"
                      style={{ color: muted }}
                    >
                      {totalPipeline > 0
                        ? "Volume comercial ativo"
                        : "Pipeline comercial"}
                    </span>
                  </div>
                </article>

                {/* GOALS */}
                <article
                  className="rounded-2xl border p-5"
                  style={{
                    borderColor: border,
                    backgroundColor: surface,
                  }}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p
                        className="text-[10px] font-bold uppercase tracking-[0.20em]"
                        style={{ color: muted }}
                      >
                        PatrimÃ´nio
                      </p>

                      <h2
                        className="mt-1 text-xl font-bold tracking-[-0.035em]"
                        style={{ color: text }}
                      >
                        Metas
                      </h2>
                    </div>

                    <Target
                      className="h-5 w-5"
                      style={{ color: BLUE.electric }}
                    />
                  </div>

                  <div className="mt-4 space-y-4">
                    {goals.map((goal, index) => {
                      const progress = Math.min(
                        Math.max(goal.progress, 0),
                        100,
                      );

                      return (
                        <div key={goal.label}>
                          <div className="flex items-center justify-between gap-3">
                            <span
                              className="min-w-0 truncate text-xs font-semibold"
                              style={{ color: secondary }}
                            >
                              {goal.label}
                            </span>

                            <span
                              className="shrink-0 text-[10px] font-bold"
                              style={{ color: muted }}
                            >
                              {progress}%
                            </span>
                          </div>

                          <div
                            className="mt-2 h-2 overflow-hidden rounded-full"
                            style={{
                              backgroundColor: isLight
                                ? "#E5EAF3"
                                : "rgba(255,255,255,0.10)",
                            }}
                          >
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{
                                width: `${progress}%`,
                              }}
                              transition={{
                                duration: 0.55,
                                delay: index * 0.05,
                                ease: "easeOut",
                              }}
                              className="h-full rounded-full"
                              style={{
                                backgroundColor:
                                  chartColors[
                                    index %
                                      chartColors.length
                                  ],
                              }}
                            />
                          </div>

                          <div className="mt-1.5 flex justify-between gap-3">
                            <span
                              className="text-[10px]"
                              style={{ color: muted }}
                            >
                              {goal.value}
                            </span>

                            <span
                              className="text-[10px]"
                              style={{ color: muted }}
                            >
                              {goal.target}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </article>
              </section>

              {/* RELATIONSHIP + ACTIVITY */}
              <section className="grid grid-cols-1 gap-6 xl:grid-cols-2">
                <article
                  className="rounded-2xl border p-5"
                  style={{
                    borderColor: border,
                    backgroundColor: surface,
                  }}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p
                        className="text-[10px] font-bold uppercase tracking-[0.20em]"
                        style={{ color: muted }}
                      >
                        Relacionamento
                      </p>

                      <h2
                        className="mt-1 text-xl font-bold tracking-[-0.035em]"
                        style={{ color: text }}
                      >
                        Indicadores
                      </h2>
                    </div>

                    <Users
                      className="h-5 w-5"
                      style={{ color: BLUE.electric }}
                    />
                  </div>

                  <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
                    {relationshipSummary.map((item) => (
                      <div
                        key={item.label}
                        className="rounded-xl border p-3.5"
                        style={{
                          borderColor: border,
                          backgroundColor:
                            isLight
                              ? "#F8FAFD"
                              : BLUE.deepest,
                        }}
                      >
                        <p
                          className="text-xs font-medium"
                          style={{ color: muted }}
                        >
                          {item.label}
                        </p>

                        <p
                          className="mt-1 text-lg font-bold"
                          style={{ color: text }}
                        >
                          {item.value}
                        </p>
                      </div>
                    ))}
                  </div>
                </article>

                <article
                  className="rounded-2xl border p-5"
                  style={{
                    borderColor: border,
                    backgroundColor: surface,
                  }}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p
                        className="text-[10px] font-bold uppercase tracking-[0.20em]"
                        style={{ color: muted }}
                      >
                        Movimento
                      </p>

                      <h2
                        className="mt-1 text-xl font-bold tracking-[-0.035em]"
                        style={{ color: text }}
                      >
                        Atividade recente
                      </h2>
                    </div>

                    <Activity
                      className="h-5 w-5"
                      style={{ color: BLUE.electric }}
                    />
                  </div>

                  <div className="mt-4 space-y-1">
                    {recentActivities.map(
                      (item, index) => (
                        <div
                          key={item.title}
                          className="flex items-center gap-3 rounded-xl px-2 py-2.5"
                        >
                          <span
                            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full"
                            style={{
                              backgroundColor: isLight
                                ? "#EEF2FF"
                                : BLUE.deepest,
                            }}
                          >
                            <span
                              className="h-2.5 w-2.5 rounded-full"
                              style={{
                                backgroundColor:
                                  chartColors[
                                    index %
                                      chartColors.length
                                  ],
                              }}
                            />
                          </span>

                          <div className="min-w-0 flex-1">
                            <p
                              className="truncate text-xs font-semibold"
                              style={{ color: secondary }}
                            >
                              {item.title}
                            </p>

                            <p
                              className="mt-0.5 text-[10px]"
                              style={{ color: muted }}
                            >
                              {item.time}
                            </p>
                          </div>
                        </div>
                      ),
                    )}
                  </div>
                </article>
              </section>
            </motion.div>
          </main>
        </div>
      </div>
    </div>
  );
}
