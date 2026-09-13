"use client";

import { gsap } from "gsap";
import { useEffect, useRef } from "react";

/**
 * Número que se autocarrega em contagem crescente via GSAP (0 até o
 * valor real) — efeito padrão em todo modal do site que exibe um
 * número de destaque. Ver components/dashboard/kpi-card.tsx pra a
 * versão original; este componente generaliza pra reuso.
 */
export function AnimatedNumber({
  value,
  className,
  duration = 1.2,
}: {
  /** Valor já formatado (ex: "R$ 48.750.320", "184", "72%"). */
  value: string;
  className?: string;
  duration?: number;
}) {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!ref.current) return;

    const prefixMatch = value.match(/^[^\d]*/);
    const prefix = prefixMatch ? prefixMatch[0] : "";
    const suffixMatch = value.match(/[^\d]*$/);
    const suffix = suffixMatch ? suffixMatch[0] : "";
    const numericTarget = Number(value.replace(/[^\d]/g, ""));

    if (!Number.isFinite(numericTarget) || numericTarget === 0) {
      ref.current.textContent = value;
      return;
    }

    const counter = { current: 0 };
    const tween = gsap.to(counter, {
      current: numericTarget,
      duration,
      ease: "power2.out",
      onUpdate: () => {
        if (!ref.current) return;
        ref.current.textContent = `${prefix}${new Intl.NumberFormat("pt-BR").format(
          Math.round(counter.current),
        )}${suffix}`;
      },
    });

    return () => {
      tween.kill();
    };
  }, [value, duration]);

  return (
    <span ref={ref} className={className}>
      {value}
    </span>
  );
}
