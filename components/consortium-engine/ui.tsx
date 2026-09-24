"use client";

import { motion } from "motion/react";
import { useRouter } from "next/navigation";
import { useState, useTransition, type ReactNode } from "react";

import { AnimatedNumber } from "@/components/ui/animated-number";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

/**
 * Kit visual do motor de consórcios — reaproveita as classes do design
 * system (card-premium com glow, block-navy-3d, AnimatedNumber) e
 * padroniza o retorno das actions ({ ok, errors, message }).
 */

export type EngineResult = { ok: true; message?: string; data?: unknown } | { ok: false; errors: string[] };

export function useEngineAction() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [errors, setErrors] = useState<string[]>([]);
  const [message, setMessage] = useState<string | null>(null);

  function execute<R extends EngineResult>(fn: () => Promise<R>, onSuccess?: (r: Extract<R, { ok: true }>) => void) {
    setErrors([]);
    setMessage(null);
    startTransition(async () => {
      const r = await fn();
      if (r.ok) {
        setMessage(r.message ?? null);
        onSuccess?.(r as Extract<R, { ok: true }>);
        router.refresh();
      } else {
        setErrors(r.errors);
      }
    });
  }

  return { pending, errors, message, execute, reset: () => (setErrors([]), setMessage(null)) };
}

export function Feedback({ errors, message }: { errors: string[]; message?: string | null }) {
  if (errors.length === 0 && !message) return null;
  return (
    <div className="space-y-1">
      {errors.map((e) => (
        <p key={e} className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs font-medium text-destructive">
          {e}
        </p>
      ))}
      {message ? (
        <p className="rounded-lg border border-primary/30 bg-primary/10 px-3 py-2 text-xs font-medium text-foreground">{message}</p>
      ) : null}
    </div>
  );
}

/** Botão de ação com confirmação inline (nunca window.confirm). */
export function ActionButton({
  label,
  action,
  confirm,
  variant = "default",
  size = "sm",
  disabled,
}: {
  label: string;
  action: () => Promise<EngineResult>;
  confirm?: string;
  variant?: "default" | "outline" | "secondary" | "destructive" | "ghost";
  size?: "sm" | "default" | "xs";
  disabled?: boolean;
}) {
  const { pending, errors, message, execute } = useEngineAction();
  const [confirming, setConfirming] = useState(false);

  return (
    <div className="space-y-2">
      {confirming ? (
        <div className="space-y-2 rounded-lg border border-black/10 bg-black/5 p-3">
          <p className="text-xs font-medium text-foreground">{confirm}</p>
          <div className="flex gap-2">
            <Button
              size="xs"
              variant={variant === "destructive" ? "destructive" : "default"}
              disabled={pending}
              onClick={() => execute(action, () => setConfirming(false))}
            >
              {pending ? "Processando…" : "Confirmar"}
            </Button>
            <Button size="xs" variant="outline" onClick={() => setConfirming(false)} disabled={pending}>
              Cancelar
            </Button>
          </div>
        </div>
      ) : (
        <Button
          size={size}
          variant={variant}
          disabled={disabled || pending}
          onClick={() => (confirm ? setConfirming(true) : execute(action))}
        >
          {pending ? "Processando…" : label}
        </Button>
      )}
      <Feedback errors={errors} message={message} />
    </div>
  );
}

export function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <label className="block space-y-1">
      <span className="text-xs font-semibold text-foreground">{label}</span>
      {children}
      {hint ? <span className="block text-[11px] text-card-beige-muted-foreground">{hint}</span> : null}
    </label>
  );
}

export const selectClass =
  "h-8 w-full rounded-lg border border-input bg-card px-2.5 text-sm text-foreground outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

export function NativeSelect({
  name,
  value,
  defaultValue,
  onChange,
  options,
  required,
}: {
  name?: string;
  value?: string;
  defaultValue?: string;
  onChange?: (v: string) => void;
  options: { value: string; label: string }[];
  required?: boolean;
}) {
  return (
    <select
      name={name}
      value={value}
      defaultValue={defaultValue}
      required={required}
      onChange={(e) => onChange?.(e.target.value)}
      className={selectClass}
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}

export function Section({
  title,
  subtitle,
  actions,
  children,
  delay = 0,
  id,
}: {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  children: ReactNode;
  delay?: number;
  id?: string;
}) {
  return (
    <motion.section
      id={id}
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut", delay }}
      className="card-premium rounded-2xl p-4 md:p-6"
    >
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-h3 font-bold text-foreground">{title}</h2>
          {subtitle ? <p className="mt-0.5 text-xs text-card-beige-muted-foreground">{subtitle}</p> : null}
        </div>
        {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
      </div>
      {children}
    </motion.section>
  );
}

export function Stat({
  label,
  value,
  hint,
  tone = "default",
  delay = 0,
}: {
  label: string;
  value: string;
  hint?: string;
  tone?: "default" | "warning" | "danger" | "success";
  delay?: number;
}) {
  const toneClass =
    tone === "danger" ? "text-destructive" : tone === "warning" ? "text-amber-700" : tone === "success" ? "text-primary" : "text-foreground";
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay }}
      className="card-premium rounded-2xl p-4 transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/70"
    >
      <p className="text-label font-bold uppercase text-card-beige-muted-foreground">{label}</p>
      <p className={`mt-1.5 text-h2 font-bold ${toneClass}`}>
        <AnimatedNumber value={value} />
      </p>
      {hint ? <p className="mt-0.5 text-[11px] text-card-beige-muted-foreground">{hint}</p> : null}
    </motion.div>
  );
}

const STATUS_TONE: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  PUBLISHED: "default",
  VERIFIED: "default",
  ACTIVE: "default",
  COMPLETED: "default",
  LOCKED: "secondary",
  HOMOLOGATED: "default",
  APPROVED: "default",
  AVAILABLE: "default",
  SELECTED: "outline",
  DRAFT: "outline",
  REVIEW: "outline",
  PENDING: "outline",
  INVALID: "destructive",
  CANCELLED: "destructive",
  REJECTED: "destructive",
  RETIFIED: "destructive",
  SUPERSEDED: "secondary",
  ARCHIVED: "secondary",
};

export function StatusBadge({ status, label }: { status: string; label: string }) {
  return <Badge variant={STATUS_TONE[status] ?? "outline"}>{label}</Badge>;
}

export function EmptyState({ children }: { children: ReactNode }) {
  return <p className="rounded-xl border border-dashed border-black/15 px-4 py-6 text-center text-sm text-card-beige-muted-foreground">{children}</p>;
}

export function Hash({ value, label }: { value: string | null | undefined; label?: string }) {
  if (!value) return <span className="text-card-beige-muted-foreground">—</span>;
  return (
    <span title={value} className="font-mono text-[11px] text-card-beige-muted-foreground">
      {label ? `${label} ` : ""}
      {value.slice(0, 12)}…
    </span>
  );
}

export const tableClass = "w-full min-w-[640px] text-left text-sm";
export const thClass = "px-3 py-2 text-label font-bold uppercase text-card-beige-muted-foreground";
export const tdClass = "px-3 py-2 align-top";
export const trClass = "border-t border-black/10 transition-colors duration-150 hover:bg-black/5";
