import Link from "next/link";

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
  children?: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#071A2D] text-white">
      <div className="mx-auto max-w-7xl px-4 py-8 md:px-6 lg:px-8">
        <div className="mb-6 flex flex-col gap-4 rounded-2xl border border-white/10 bg-[#0B2238] p-5 shadow-[0_12px_30px_rgba(0,0,0,0.12)] md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-white/55">{badge}</p>
            <h1 className="mt-2 text-3xl font-bold tracking-[-0.06em] text-white">{title}</h1>
            <p className="mt-2 text-sm text-white/70">{subtitle}</p>
          </div>

          <Link
            href="/dashboard"
            className="inline-flex items-center justify-center rounded-full border border-[#C9A45C]/40 bg-[#C9A45C] px-4 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-[#071A2D] transition-opacity hover:opacity-90"
          >
            Voltar ao dashboard
          </Link>
        </div>

        <div className="rounded-2xl border border-white/10 bg-[#0B2238] p-5">
          <p className="text-sm text-white/70">{context}</p>
        </div>

        {children ? <div className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-3">{children}</div> : null}
      </div>
    </div>
  );
}
