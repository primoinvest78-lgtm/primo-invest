"use client";

import { ArrowUpRight, type LucideIcon } from "lucide-react";
import { motion } from "motion/react";
import { useEffect, useState } from "react";

export type KpiCardProps = {
  title: string;
  value: string;
  change: string;
  delta: number;
  icon: LucideIcon;
  accent: string;
};

type Theme = "dark" | "light";

export function KpiCard({
  title,
  value,
  change,
  delta,
  icon: Icon,
}: KpiCardProps) {
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

  const formattedDelta = `${delta >= 0 ? "+" : ""}${delta
    .toFixed(delta % 1 === 0 ? 0 : 2)
    .replace(".", ",")}%`;

  return (
    <motion.article
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.3,
        ease: "easeOut",
      }}
      whileHover={{
        y: -2,
      }}
      className={[
        "group relative overflow-hidden rounded-2xl border p-5",
        "transition-all duration-200",
        isLight
          ? [
              "border-[#D7E1F2]",
              "bg-white",
              "shadow-[0_10px_30px_rgba(0,0,121,0.07)]",
              "hover:border-[#1707FA]/35",
              "hover:shadow-[0_16px_36px_rgba(0,0,121,0.10)]",
            ].join(" ")
          : [
              "border-white/10",
              "bg-[#060299]",
              "shadow-[0_14px_32px_rgba(0,0,40,0.22)]",
              "hover:border-[#1707FA]/45",
              "hover:shadow-[0_18px_38px_rgba(0,0,40,0.30)]",
            ].join(" "),
      ].join(" ")}
    >
      {/* TOP ACCENT */}
      <div
        className={[
          "absolute inset-x-0 top-0 h-[2px]",
          "transition-opacity duration-200",
          isLight
            ? "bg-[#1707FA] opacity-0 group-hover:opacity-100"
            : "bg-[#1707FA] opacity-0 group-hover:opacity-100",
        ].join(" ")}
      />

      {/* MAIN CONTENT */}
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <p
            className={[
              "truncate text-[10px] font-bold uppercase tracking-[0.22em]",
              isLight ? "text-[#526A91]" : "text-[#AFC1DF]",
            ].join(" ")}
          >
            {title}
          </p>

          <p
            className={[
              "mt-3 truncate text-[1.72rem] font-bold leading-none tracking-[-0.045em]",
              isLight ? "text-[#07143F]" : "text-white",
            ].join(" ")}
          >
            {value}
          </p>
        </div>

        {/* ICON */}
        <div
          className={[
            "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border",
            "transition-all duration-200",
            isLight
              ? [
                  "border-[#D5DFF0]",
                  "bg-[#EEF2FF]",
                  "text-[#0C04B9]",
                  "group-hover:border-[#1707FA]/40",
                  "group-hover:bg-[#E7EBFF]",
                ].join(" ")
              : [
                  "border-white/10",
                  "bg-[#000079]",
                  "text-[#7FC8FF]",
                  "group-hover:border-[#1707FA]/45",
                  "group-hover:bg-[#0C04B9]",
                  "group-hover:text-white",
                ].join(" "),
          ].join(" ")}
        >
          <Icon className="h-[18px] w-[18px]" strokeWidth={1.8} />
        </div>
      </div>

      {/* FOOTER */}
      <div className="mt-5 flex items-center justify-between gap-3">
        {/* CHANGE */}
        <span
          className={[
            "inline-flex min-w-0 items-center gap-1.5 rounded-full border px-2.5 py-1.5",
            "text-[11px] font-bold",
            isLight
              ? [
                  "border-[#C9D6F2]",
                  "bg-[#EEF3FF]",
                  "text-[#0C04B9]",
                ].join(" ")
              : [
                  "border-[#1707FA]/25",
                  "bg-[#1707FA]/15",
                  "text-[#BBD8FF]",
                ].join(" "),
          ].join(" ")}
        >
          <ArrowUpRight
            className="h-3.5 w-3.5 shrink-0"
            strokeWidth={2.2}
          />

          <span className="truncate">{change}</span>
        </span>

        {/* DELTA */}
        <span
          className={[
            "shrink-0 text-[10px] font-bold uppercase tracking-[0.14em]",
            isLight ? "text-[#607596]" : "text-[#AFC1DF]",
          ].join(" ")}
        >
          {formattedDelta}
        </span>
      </div>
    </motion.article>
  );
}