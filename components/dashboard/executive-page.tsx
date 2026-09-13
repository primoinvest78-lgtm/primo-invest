import Link from "next/link";
import type { ReactNode } from "react";

export function ExecutivePage({
  title,
  subtitle,
  badge,
  context,
  children,
}: {
  title: string;
  subtitle: string;
  badge: string;
  context: string;
  children?: ReactNode;
}) {
  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-4 rounded-2xl border border-white/10 bg-secondary p-5 shadow-panel-3d md:flex-row md:items-end md:justify-between md:p-6">
        <div className="min-w-0">
          <p className="text-label font-bold uppercase text-primary">{badge}</p>
          <h1 className="mt-2 text-h1 font-bold tracking-[-0.04em] text-secondary-foreground">
            {title}
          </h1>
          <p className="mt-2 max-w-2xl text-body text-secondary-foreground/75">{subtitle}</p>
        </div>

        <Link
          href="/dashboard"
          className="inline-flex shrink-0 items-center justify-center rounded-full border border-border bg-primary px-4 py-2.5 text-xs font-semibold uppercase tracking-[0.12em] text-primary-foreground transition-opacity hover:opacity-90"
        >
          Voltar ao dashboard
        </Link>
      </section>

      <section className="card-premium rounded-2xl p-5 md:p-6">
        <p className="text-body text-card-beige-muted-foreground">{context}</p>
      </section>

      {children ? (
        <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">{children}</section>
      ) : null}
    </div>
  );
}
