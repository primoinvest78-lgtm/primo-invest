"use client";

import { gsap } from "gsap";
import { ArrowUpRight, type LucideIcon } from "lucide-react";
import { motion } from "motion/react";
import { useEffect, useRef } from "react";

export type KpiCardProps = {
  title: string;
  value: string;
  change: string;
  delta: number;
  icon: LucideIcon;
  /**
   * DEMO — mostra o GSAP em ação animando o valor em contagem crescente.
   * Só o card "Patrimônio total" usa isso por enquanto (ver
   * dashboard-overview.tsx), pra validação visual antes de aplicarmos
   * GSAP em outros lugares.
   */
  animateValueWithGsap?: boolean;
};

export function KpiCard({
  title,
  value,
  change,
  delta,
  icon: Icon,
  animateValueWithGsap = false,
}: KpiCardProps) {
  const formattedDelta = `${delta >= 0 ? "+" : ""}${delta
    .toFixed(delta % 1 === 0 ? 0 : 2)
    .replace(".", ",")}%`;

  const valueRef = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    if (!animateValueWithGsap || !valueRef.current) return;

    const prefixMatch = value.match(/^[^\d]*/);
    const prefix = prefixMatch ? prefixMatch[0] : "";
    const numericTarget = Number(value.replace(/[^\d]/g, ""));

    const counter = { current: 0 };
    const tween = gsap.to(counter, {
      current: numericTarget,
      duration: 1.4,
      ease: "power2.out",
      onUpdate: () => {
        if (!valueRef.current) return;
        valueRef.current.textContent = `${prefix}${new Intl.NumberFormat("pt-BR").format(
          Math.round(counter.current),
        )}`;
      },
    });

    return () => {
      tween.kill();
    };
  }, [animateValueWithGsap, value]);

  return (
    <motion.article
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      whileHover={{ y: -2 }}
      className="group relative overflow-hidden rounded-2xl border border-border bg-card p-5 shadow-card transition-all duration-200 hover:border-primary/40 hover:shadow-card-hover"
    >
      {/* TOP ACCENT */}
      <div className="absolute inset-x-0 top-0 h-[2px] bg-primary opacity-0 transition-opacity duration-200 group-hover:opacity-100" />

      {/* MAIN CONTENT */}
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <p className="truncate text-label font-bold uppercase text-muted-foreground">
            {title}
          </p>

          <p
            ref={valueRef}
            className="mt-3 truncate text-kpi font-heading font-bold text-foreground"
          >
            {animateValueWithGsap ? `${value.match(/^[^\d]*/)?.[0] ?? ""}0` : value}
          </p>
        </div>

        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-border bg-background text-accent transition-all duration-200 group-hover:border-primary/45 group-hover:bg-secondary group-hover:text-secondary-foreground">
          <Icon className="h-[18px] w-[18px]" strokeWidth={1.8} />
        </div>
      </div>

      {/* FOOTER */}
      <div className="mt-5 flex items-center justify-between gap-3">
        <span className="inline-flex min-w-0 items-center gap-1.5 rounded-full border border-primary/25 bg-primary/15 px-2.5 py-1.5 text-[11px] font-bold text-foreground">
          <ArrowUpRight className="h-3.5 w-3.5 shrink-0" strokeWidth={2.2} />
          <span className="truncate">{change}</span>
        </span>

        <span className="shrink-0 text-label font-bold uppercase text-muted-foreground">
          {formattedDelta}
        </span>
      </div>
    </motion.article>
  );
}
