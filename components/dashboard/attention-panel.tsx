"use client";

import { useEffect, useState } from "react";

import type { AttentionItem } from "@/lib/mock/dashboard";

type Theme = "dark" | "light";

export function AttentionPanel({
  items,
}: {
  items: AttentionItem[];
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
  const descriptionColor = isLight ? "#263D65" : "#E4ECFA";
  const secondaryColor = isLight ? "#607596" : "#AFC1DF";

  return (
    <section
      className={[
        "overflow-hidden rounded-2xl border p-5 md:p-6",
        "transition-colors duration-200",
        cardClass,
      ].join(" ")}
    >
      {/* HEADER */}
      <div className="mb-5">
        <p
          className="text-[10px] font-bold uppercase tracking-[0.22em]"
          style={{ color: eyebrowColor }}
        >
          Atenção
        </p>

        <h3
          className="mt-1 text-2xl font-bold tracking-[-0.04em]"
          style={{ color: titleColor }}
        >
          O que precisa da sua atenção
        </h3>
      </div>

      {/* ITEMS */}
      <div className="space-y-3">
        {items.map((item, index) => {
          const Icon = item.icon;

          const iconColors = [
            {
              background: isLight ? "#EEF2FF" : "#000079",
              foreground: "#1707FA",
            },
            {
              background: isLight ? "#E9F0FF" : "#0C04B9",
              foreground: isLight ? "#0C04B9" : "#DDE7FF",
            },
            {
              background: isLight ? "#E7FBFE" : "#060299",
              foreground: isLight ? "#060299" : "#A8E8FF",
            },
          ];

          const iconStyle =
            iconColors[index % iconColors.length];

          return (
            <article
              key={item.description}
              className={[
                "group flex items-start gap-3 rounded-xl border p-3.5",
                "transition-all duration-150",
                isLight
                  ? "border-[#E0E7F2] bg-[#F8FAFD] hover:border-[#1707FA]/30 hover:bg-white"
                  : "border-white/10 bg-[#000079]/55 hover:border-[#1707FA]/45 hover:bg-[#000079]/75",
              ].join(" ")}
            >
              {/* ICON */}
              <div
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border"
                style={{
                  backgroundColor: iconStyle.background,
                  color: iconStyle.foreground,
                  borderColor: isLight
                    ? "#D8E1F0"
                    : "rgba(255,255,255,0.10)",
                }}
              >
                <Icon
                  className="h-[17px] w-[17px]"
                  strokeWidth={1.9}
                />
              </div>

              {/* CONTENT */}
              <div className="min-w-0 flex-1">
                <p
                  className="text-sm font-semibold leading-5"
                  style={{ color: descriptionColor }}
                >
                  {item.description}
                </p>

                <div className="mt-3 flex items-center justify-between gap-2">
                  <span
                    className="text-[10px] font-bold uppercase tracking-[0.18em]"
                    style={{ color: secondaryColor }}
                  >
                    Prioridade {item.priority}
                  </span>

                  <span
                    className={[
                      "rounded-full border px-2.5 py-1",
                      "text-[11px] font-bold",
                      isLight
                        ? "border-[#CBD7EC] bg-white text-[#0C04B9]"
                        : "border-white/10 bg-[#060299] text-white",
                    ].join(" ")}
                  >
                    {item.quantity}
                  </span>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}