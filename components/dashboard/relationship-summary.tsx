"use client";

import { useEffect, useState } from "react";

import type { RelationshipSummaryData } from "@/lib/mock/dashboard";

type Theme = "dark" | "light";

export function RelationshipSummary({
  items,
}: {
  items: RelationshipSummaryData[];
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

  const cardClass = isLight
    ? "bg-white border-[#D7E1F2] shadow-[0_10px_30px_rgba(0,0,121,0.07)]"
    : "bg-[#060299] border-white/10 shadow-[0_14px_32px_rgba(0,0,40,0.22)]";

  const titleColor = isLight ? "#07143F" : "#FFFFFF";
  const eyebrowColor = isLight ? "#526A91" : "#AFC1DF";
  const labelColor = isLight ? "#263D65" : "#E4ECFA";
  const valueColor = isLight ? "#0C04B9" : "#FFFFFF";

  return (
    <section
      className={[
        "overflow-hidden rounded-2xl border p-5 md:p-6",
        "transition-colors duration-200",
        cardClass,
      ].join(" ")}
    >
      <div className="mb-5">
        <p
          className="text-[10px] font-bold uppercase tracking-[0.22em]"
          style={{ color: eyebrowColor }}
        >
          Relacionamento
        </p>

        <h3
          className="mt-1 text-2xl font-bold tracking-[-0.04em]"
          style={{ color: titleColor }}
        >
          Relacionamento
        </h3>
      </div>

      <div className="space-y-3">
        {items.map((item) => (
          <div
            key={item.label}
            className={[
              "flex min-h-[54px] items-center justify-between gap-4",
              "rounded-xl border p-3.5",
              "transition-colors duration-150",
              isLight
                ? "border-[#E0E7F2] bg-[#F8FAFD] hover:border-[#1707FA]/30 hover:bg-white"
                : "border-white/10 bg-[#000079]/55 hover:border-[#1707FA]/45 hover:bg-[#000079]/75",
            ].join(" ")}
          >
            <span
              className="min-w-0 flex-1 truncate text-sm font-medium"
              style={{ color: labelColor }}
            >
              {item.label}
            </span>

            <span
              className="shrink-0 text-base font-bold tracking-[-0.02em]"
              style={{ color: valueColor }}
            >
              {item.value}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}