"use client";

import { useEffect, useState } from "react";

import type { PipelineStage } from "@/lib/mock/dashboard";

type Theme = "dark" | "light";

const PIPELINE_COLORS = [
  "#1707FA",
  "#1105D9",
  "#0C04B9",
  "#060299",
  "#000079",
];

export function PipelineSummary({
  stages,
}: {
  stages: PipelineStage[];
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
  const labelColor = isLight ? "#526A91" : "#AFC1DF";
  const valueColor = isLight ? "#07143F" : "#FFFFFF";

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
          Comercial
        </p>

        <h3
          className="mt-1 text-2xl font-bold tracking-[-0.04em]"
          style={{ color: titleColor }}
        >
          Pipeline comercial
        </h3>
      </div>

      <div className="flex min-w-0 gap-3 overflow-x-auto pb-1">
        {stages.map((stage, index) => {
          const accent =
            PIPELINE_COLORS[index % PIPELINE_COLORS.length];

          return (
            <div
              key={stage.name}
              className="min-w-[130px] flex-1"
            >
              <div className="mb-3 flex min-w-0 items-center gap-2">
                <span
                  className="h-2.5 w-2.5 shrink-0 rounded-full"
                  style={{
                    backgroundColor: accent,
                    boxShadow: isLight
                      ? `0 0 0 3px rgba(23,7,250,0.08)`
                      : `0 0 0 3px rgba(23,7,250,0.16)`,
                  }}
                />

                <span
                  className="truncate text-[11px] font-semibold"
                  style={{ color: labelColor }}
                >
                  {stage.name}
                </span>
              </div>

              <div
                className={[
                  "rounded-xl border p-3.5",
                  "transition-colors duration-150",
                  isLight
                    ? "border-[#E0E7F2] bg-[#F8FAFD] hover:border-[#1707FA]/30 hover:bg-white"
                    : "border-white/10 bg-[#000079]/55 hover:border-[#1707FA]/45 hover:bg-[#000079]/75",
                ].join(" ")}
              >
                <div
                  className="text-[10px] font-bold uppercase tracking-[0.15em]"
                  style={{ color: labelColor }}
                >
                  Valor
                </div>

                <div
                  className="mt-2 truncate text-sm font-bold"
                  style={{ color: valueColor }}
                >
                  {stage.value}
                </div>
              </div>

              {index < stages.length - 1 && (
                <div className="mt-3 flex items-center px-1">
                  <div
                    className={[
                      "h-px w-full",
                      isLight
                        ? "bg-[#DCE4F1]"
                        : "bg-white/10",
                    ].join(" ")}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}