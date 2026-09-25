"use client";

import { ArrowRight } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

const CLASS =
  "group inline-flex shrink-0 items-center gap-1 rounded-lg px-2 py-1 text-xs font-bold text-accent transition-all hover:bg-primary/10 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary";

/**
 * "Ver detalhes →" no canto de um quadro ou gráfico. Com `href` navega
 * para outra tela; com `onClick` aplica um filtro na própria página.
 */
export function PanelAction({ href, onClick, children = "Ver detalhes" }: { href?: string; onClick?: () => void; children?: ReactNode }) {
  const content = (
    <>
      {children}
      <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
    </>
  );
  if (href) {
    return (
      <Link href={href} className={CLASS}>
        {content}
      </Link>
    );
  }
  return (
    <button type="button" onClick={onClick} className={CLASS}>
      {content}
    </button>
  );
}

/** Rola suavemente até a lista da página depois de aplicar um filtro. */
export function scrollToId(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
}
