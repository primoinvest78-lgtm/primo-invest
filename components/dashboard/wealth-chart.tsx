"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useEffect, useState } from "react";

import type { WealthPoint } from "@/lib/mock/dashboard";

type Theme = "dark" | "light";

export function WealthChart({ data }: { data: WealthPoint[] }) {
  const [theme, setTheme] = useState<Theme>("dark");

  useEffect(() => {
    const readTheme = () => {
      const current =
        document.documentElement.dataset.theme === "light"
          ? "light"
          : "dark";

      setTheme(current);
    };

    readTheme();

    const observer = new MutationObserver(readTheme);

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme", "class"],
    });

    return () => observer.disconnect();
  }, []);

  const isLight = theme === "light";

  const colors = {
    card: isLight ? "#FFFFFF" : "#060299",
    border: isLight ? "#D7E1F2" : "rgba(255,255,255,0.10)",
    title: isLight ? "#07143F" : "#FFFFFF",
    eyebrow: isLight ? "#526A91" : "#AFC1DF",
    secondary: isLight ? "#607596" : "#AFC1DF",
    grid: isLight
      ? "rgba(7,20,63,0.08)"
      : "rgba(255,255,255,0.08)",
    axis: isLight ? "#607596" : "#AFC1DF",
    primary: "#1707FA",
    primaryLight: isLight ? "#E8ECFF" : "#0C04B9",
    tooltipBackground: isLight ? "#FFFFFF" : "#000079",
    tooltipBorder: isLight
      ? "#D7E1F2"
      : "rgba(255,255,255,0.14)",
    tooltipText: isLight ? "#07143F" : "#FFFFFF",
  };

  return (
    <section
      className={[
        "overflow-hidden rounded-2xl border p-5 md:p-6",
        "transition-colors duration-200",
        isLight
          ? "bg-white shadow-[0_10px_30px_rgba(0,0,121,0.07)]"
          : "bg-[#060299] shadow-[0_14px_32px_rgba(0,0,40,0.22)]",
      ].join(" ")}
      style={{
        borderColor: colors.border,
      }}
    >
      <div className="mb-6 flex min-w-0 flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <p
            className="text-[10px] font-bold uppercase tracking-[0.22em]"
            style={{ color: colors.eyebrow }}
          >
            Patrimônio
          </p>

          <h3
            className="mt-1 truncate text-2xl font-bold tracking-[-0.04em]"
            style={{ color: colors.title }}
          >
            Patrimônio sob gestão
          </h3>
        </div>

        <p
          className="shrink-0 text-sm"
          style={{ color: colors.secondary }}
        >
          Evolução nos últimos 12 meses
        </p>
      </div>

      <div className="h-[330px] w-full min-w-0">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={data}
            margin={{
              top: 10,
              right: 12,
              left: -18,
              bottom: 0,
            }}
          >
            <defs>
              <linearGradient
                id="primoWealthArea"
                x1="0"
                y1="0"
                x2="0"
                y2="1"
              >
                <stop
                  offset="0%"
                  stopColor={colors.primary}
                  stopOpacity={isLight ? 0.18 : 0.28}
                />

                <stop
                  offset="100%"
                  stopColor={colors.primary}
                  stopOpacity={0}
                />
              </linearGradient>
            </defs>

            <CartesianGrid
              vertical={false}
              stroke={colors.grid}
              strokeDasharray="4 4"
            />

            <XAxis
              dataKey="month"
              tickLine={false}
              axisLine={false}
              tick={{
                fill: colors.axis,
                fontSize: 12,
              }}
              dy={10}
            />

            <YAxis
              tickLine={false}
              axisLine={false}
              tick={{
                fill: colors.axis,
                fontSize: 12,
              }}
              tickFormatter={(value: number) =>
                `R$ ${Math.round(value / 1000000)}M`
              }
            />

            <Tooltip
              cursor={{
                stroke: colors.primary,
                strokeOpacity: 0.18,
                strokeDasharray: "4 4",
              }}
              formatter={(
                value:
                  | string
                  | number
                  | readonly (string | number)[]
                  | undefined,
              ) => {
                const numericValue =
                  typeof value === "number"
                    ? value
                    : Number(
                        String(
                          Array.isArray(value)
                            ? value[0]
                            : value ?? 0,
                        ).replace(/[^0-9.-]/g, ""),
                      ) || 0;

                return [
                  `R$ ${new Intl.NumberFormat("pt-BR").format(
                    numericValue,
                  )}`,
                  "Patrimônio",
                ];
              }}
              labelFormatter={(label) => `${label}`}
              contentStyle={{
                borderRadius: 14,
                border: `1px solid ${colors.tooltipBorder}`,
                boxShadow: isLight
                  ? "0 16px 36px rgba(0, 0, 121, 0.12)"
                  : "0 16px 36px rgba(0, 0, 40, 0.30)",
                background: colors.tooltipBackground,
                color: colors.tooltipText,
              }}
              labelStyle={{
                color: colors.secondary,
                fontWeight: 600,
                marginBottom: 4,
              }}
              itemStyle={{
                color: colors.tooltipText,
                fontWeight: 700,
              }}
            />

            <Area
              type="monotone"
              dataKey="value"
              stroke={colors.primary}
              strokeWidth={3}
              fill="url(#primoWealthArea)"
              activeDot={{
                r: 6,
                fill: colors.primary,
                stroke: colors.card,
                strokeWidth: 3,
              }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div
        className={[
          "mt-4 flex items-center gap-2 border-t pt-4",
          isLight ? "border-[#E4EAF4]" : "border-white/10",
        ].join(" ")}
      >
        <span
          className="h-2.5 w-2.5 rounded-full"
          style={{
            background: colors.primary,
            boxShadow: isLight
              ? "0 0 0 4px rgba(23,7,250,0.08)"
              : "0 0 0 4px rgba(23,7,250,0.16)",
          }}
        />

        <span
          className="text-[11px] font-semibold"
          style={{ color: colors.secondary }}
        >
          Evolução do patrimônio
        </span>
      </div>
    </section>
  );
}