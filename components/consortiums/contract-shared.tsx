import { AnimatedNumber } from "@/components/ui/animated-number";

export function InfoField({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div>
      <p className="text-label font-bold uppercase text-card-beige-muted-foreground">{label}</p>
      <p className="mt-1 text-sm font-medium text-foreground">{value ?? "Não informado"}</p>
    </div>
  );
}

export function InfoFieldNavy({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div>
      <p className="text-label font-bold uppercase text-secondary-foreground/60">{label}</p>
      <p className="mt-1 text-sm font-medium text-secondary-foreground">{value ?? "Não informado"}</p>
    </div>
  );
}

export function Kpi({
  label,
  value,
  valueClassName,
  animate = true,
}: {
  label: string;
  value: string;
  valueClassName?: string;
  animate?: boolean;
}) {
  return (
    <div className="card-premium rounded-2xl p-4">
      <p className="truncate text-label font-bold uppercase text-card-beige-muted-foreground">{label}</p>
      <p className={["mt-2 truncate text-lg font-bold", valueClassName ?? "text-foreground"].join(" ")}>
        {animate ? <AnimatedNumber value={value} /> : value}
      </p>
    </div>
  );
}
