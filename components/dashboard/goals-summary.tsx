"use client";

import { useEffect, useState } from "react";

import type { GoalItem } from "@/lib/mock/dashboard";

type Theme = "dark" | "light";

const PROGRESS_COLORS = [
  "#1707FA",
  "#1105D9",
  "#0C04B9",
  "#060299",
];

export function GoalsSummary({
  items,
}: {
  items: GoalItem[];
}) {
  const [theme, setTheme] = useState<Theme>("dark");

  useEffect(() => {
    const readTheme = () => {
      setTheme(
        document.documentElement.dataset.theme === "light"
          ? "light"
          : "dark",
      );
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

  const titleColor = isLight ? "#07143F" : "#FFFFFF";
  const eyebrowColor = isLight ? "#526A91" : "#AFC1DF";
  const labelColor = isLight ? "#263D65" : "#E4ECFA";
  const secondaryColor = isLight ? "#607596" : "#AFC1DF";

  return (
    <section
      className={[
        "overflow-hidden rounded-2xl border p-5 md:p-6",
        "transition-colors duration-200",
        isLight
          ? "border-[#D7E1F2] bg-white shadow-[0_10px_30px_rgba(0,0,121,0.07)]"
          : "border-white/10 bg-[#060299] shadow-[0_14px_32px_rgba(0,0,40,0.22)]",
      ].join(" ")}
    >
      <div className="mb-5">
        <p
          className="text-[10px] font-bold uppercase tracking-[0.22em]"
          style={{ color: eyebrowColor }}
        >
          Patrimônio
        </p>

        <h3
          className="mt-1 text-2xl font-bold tracking-[-0.04em]"
          style={{ color: titleColor }}
        >
          Metas patrimoniais
        </h3>
      </div>

      <div className="space-y-4">
        {items.map((item, index) => {
          const progressColor =
            PROGRESS_COLORS[index % PROGRESS_COLORS.length];

          return (
            <div
              key={item.label}
              className={[
                "rounded-xl border p-3.5",
                "transition-colors duration-150",
                isLight
                  ? "border-[#E0E7F2] bg-[#F8FAFD] hover:border-[#1707FA]/30 hover:bg-white"
                  : "border-white/10 bg-[#000079]/55 hover:border-[#1707FA]/45 hover:bg-[#000079]/75",
              ].join(" ")}
            >
              <div className="flex min-w-0 items-center justify-between gap-4">
                <span
                  className="min-w-0 truncate text-sm font-semibold"
                  style={{ color: labelColor }}
                >
                  {item.label}
                </span>

                <span
                  className="shrink-0 text-xs font-semibold"
                  style={{ color: secondaryColor }}
                >
                  {item.value} / {item.target}
                </span>
              </div>

              <div
                className={[
                  "mt-3 h-2.5 overflow-hidden rounded-full",
                  isLight ? "bg-[#E4EAF4]" : "bg-white/10",
                ].join(" ")}
              >
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${Math.min(
                      Math.max(item.progress, 0),
                      100,
                    )}%`,
                    backgroundColor: progressColor,
                  }}
                />
              </div>

              <div className="mt-2 flex justify-end">
                <span
                  className="text-[10px] font-bold uppercase tracking-[0.14em]"
                  style={{ color: secondaryColor }}
                >
                  {item.progress}% concluído
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}