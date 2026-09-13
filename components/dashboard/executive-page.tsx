import type { ReactNode } from "react";

import { BackLink } from "@/components/ui/back-link";

export function ExecutivePage({
  title,
  subtitle,
  badge,
  context,
  children,
  backHref = "/dashboard",
  backLabel = "Voltar ao dashboard",
}: {
  title: string;
  subtitle: string;
  badge: string;
  context: string;
  children?: ReactNode;
  backHref?: string;
  backLabel?: string;
}) {
  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-4 block-navy-3d rounded-2xl p-5 md:flex-row md:items-end md:justify-between md:p-6">
        <div className="min-w-0">
          <p className="text-label font-bold uppercase text-primary">{badge}</p>
          <h1 className="mt-2 text-h1 font-bold tracking-[-0.04em] text-secondary-foreground">
            {title}
          </h1>
          <p className="mt-2 max-w-2xl text-body text-secondary-foreground/75">{subtitle}</p>
        </div>

        <BackLink href={backHref} label={backLabel} />
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
