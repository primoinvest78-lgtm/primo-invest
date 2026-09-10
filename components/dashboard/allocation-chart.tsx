"use client";

import { Cell, Pie, PieChart, ResponsiveContainer } from "recharts";
import { useEffect, useState } from "react";

import type { AllocationItem } from "@/lib/mock/dashboard";

type Theme = "dark" | "light";

const PRIMO_BLUE = [
  "#1707FA",
  "#1105D9",
  "#0C04B9",
  "#060299",
  "#000079",
];

export function AllocationChart({
  data,
}: {
  data: AllocationItem[];
}) {
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

  const cardBackground = isLight ? "#FFFFFF" : "#060299";
  const cardBorder = isLight
    ? "#D7E1F2"
    : "rgba(255,255,255,0.10)";

  const titleColor = isLight ? "#07143F" : "#FFFFFF";
  const eyebrowColor = isLight ? "#526A91" : "#AFC1DF";
  const secondaryColor = isLight ? "#607596" : "#AFC1DF";

  const totalColor = isLight ? "#07143F" : "#FFFFFF";

  const chartColors = data.map(
    (_, index) => PRIMO_BLUE[index % PRIMO_BLUE.length],
  );

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
        borderColor: cardBorder,
      }}
    >
      {/* HEADER */}
      <div className="mb-4">
        <p
          className="text-[10px] font-bold uppercase tracking-[0.22em]"
          style={{ color: eyebrowColor }}
        >
          Alocação
        </p>

        <h3
          className="mt-1 text-2xl font-bold tracking-[-0.04em]"
          style={{ color: titleColor }}
        >
          Alocação patrimonial
        </h3>
      </div>

      {/* DONUT */}
      <div className="relative h-[250px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              innerRadius={62}
              outerRadius={88}
              paddingAngle={2}
              stroke={cardBackground}
              strokeWidth={3}
            >
              {data.map((entry, index) => (
                <Cell
                  key={entry.name}
                  fill={chartColors[index]}
                />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>

        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <div
              className="text-[10px] font-semibold uppercase tracking-[0.18em]"
              style={{ color: secondaryColor }}
            >
              Total
            </div>

            <div
              className="mt-1 text-xl font-bold tracking-[-0.04em]"
              style={{ color: totalColor }}
            >
              R$ 48,75 mi
            </div>
          </div>
        </div>
      </div>

      {/* LEGEND */}
      <div
        className={[
          "mt-2 space-y-1",
          "border-t pt-4",
          isLight ? "border-[#E4EAF4]" : "border-white/10",
        ].join(" ")}
      >
        {data.map((item, index) => (
          <div
            key={item.name}
            className="flex min-h-[38px] items-center justify-between gap-3"
          >
            <div className="flex min-w-0 items-center gap-2.5">
              <span
                className="h-2.5 w-2.5 shrink-0 rounded-full"
                style={{
                  backgroundColor:
                    chartColors[index],
                  boxShadow: isLight
                    ? "0 0 0 3px rgba(23,7,250,0.06)"
                    : "0 0 0 3px rgba(255,255,255,0.04)",
                }}
              />

              <span
                className="truncate text-sm font-medium"
                style={{ color: secondaryColor }}
              >
                {item.name}
              </span>
            </div>

            <span
              className="shrink-0 text-sm font-bold"
              style={{ color: titleColor }}
            >
              {item.value}%
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}