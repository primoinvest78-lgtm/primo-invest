"use client";

import { useEffect, useState } from "react";

import type { RecentActivityItem } from "@/lib/mock/dashboard";

type Theme = "dark" | "light";

const ACTIVITY_COLORS = [
  "#1707FA",
  "#1105D9",
  "#0C04B9",
  "#060299",
];

export function RecentActivity({
  items,
}: {
  items: RecentActivityItem[];
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
  const activityColor = isLight ? "#263D65" : "#E4ECFA";
  const timeColor = isLight ? "#607596" : "#AFC1DF";

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
          Movimento
        </p>

        <h3
          className="mt-1 text-2xl font-bold tracking-[-0.04em]"
          style={{ color: titleColor }}
        >
          Atividade recente
        </h3>
      </div>

      <div className="space-y-1">
        {items.map((item, index) => {
          const accent =
            ACTIVITY_COLORS[index % ACTIVITY_COLORS.length];

          return (
            <div
              key={item.title}
              className={[
                "flex items-start gap-3 rounded-xl px-2.5 py-3",
                "transition-colors duration-150",
                isLight
                  ? "hover:bg-[#F8FAFD]"
                  : "hover:bg-[#000079]/45",
              ].join(" ")}
            >
              <div className="relative mt-1 flex h-5 w-5 shrink-0 items-center justify-center">
                <span
                  className={[
                    "absolute h-5 w-5 rounded-full",
                    isLight
                      ? "bg-[#EEF2FF]"
                      : "bg-[#000079]",
                  ].join(" ")}
                />

                <span
                  className="relative h-2.5 w-2.5 rounded-full"
                  style={{
                    backgroundColor: accent,
                    boxShadow: isLight
                      ? "0 0 0 3px rgba(23,7,250,0.08)"
                      : "0 0 0 3px rgba(23,7,250,0.16)",
                  }}
                />
              </div>

              <div className="min-w-0 flex-1">
                <p
                  className="text-sm font-semibold leading-5"
                  style={{ color: activityColor }}
                >
                  {item.title}
                </p>

                <p
                  className="mt-1 text-xs font-medium"
                  style={{ color: timeColor }}
                >
                  {item.time}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}