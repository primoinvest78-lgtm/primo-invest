"use client";

import { Check } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "cn";

import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

/** Rótulo + marcação de obrigatório/opcional + ajuda + erro, padrão de todos os campos do cadastro. */
export function Field({
  id,
  label,
  required,
  hint,
  error,
  className,
  children,
}: {
  id: string;
  label: string;
  required?: boolean;
  hint?: string;
  error?: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={cn("min-w-0 space-y-1.5", className)}>
      <label htmlFor={id} className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-card-beige-muted-foreground">
        {label}
        {required ? (
          <span className="text-destructive" aria-hidden>
            *
          </span>
        ) : (
          <span className="font-medium normal-case tracking-normal text-card-beige-muted-foreground/70">(opcional)</span>
        )}
      </label>
      {children}
      {error ? (
        <p id={`${id}-erro`} role="alert" className="text-xs font-medium text-destructive">
          {error}
        </p>
      ) : hint ? (
        <p className="text-xs text-card-beige-muted-foreground">{hint}</p>
      ) : null}
    </div>
  );
}

export function TextField({
  id,
  label,
  value,
  onChange,
  required,
  hint,
  error,
  placeholder,
  type = "text",
  inputMode,
  mask,
  className,
  autoComplete,
  maxLength,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  hint?: string;
  error?: string;
  placeholder?: string;
  type?: string;
  inputMode?: "text" | "numeric" | "email" | "tel" | "decimal" | "url";
  mask?: (value: string) => string;
  className?: string;
  autoComplete?: string;
  maxLength?: number;
}) {
  return (
    <Field id={id} label={label} required={required} hint={hint} error={error} className={className}>
      <Input
        id={id}
        type={type}
        value={value}
        inputMode={inputMode}
        placeholder={placeholder}
        autoComplete={autoComplete}
        maxLength={maxLength}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-erro` : undefined}
        aria-required={required}
        onChange={(e) => onChange(mask ? mask(e.target.value) : e.target.value)}
        className="h-9"
      />
    </Field>
  );
}

export function MoneyField(props: Omit<Parameters<typeof TextField>[0], "inputMode">) {
  return <TextField {...props} inputMode="numeric" placeholder={props.placeholder ?? "R$ 0,00"} />;
}

export function TextAreaField({
  id,
  label,
  value,
  onChange,
  hint,
  placeholder,
  className,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  hint?: string;
  placeholder?: string;
  className?: string;
}) {
  return (
    <Field id={id} label={label} hint={hint} className={className}>
      <Textarea id={id} value={value} placeholder={placeholder} rows={3} onChange={(e) => onChange(e.target.value)} />
    </Field>
  );
}

export type Option = { value: string; label: string };

export function toOptions(values: readonly string[]): Option[] {
  return values.map((v) => ({ value: v, label: v }));
}

export function SelectField({
  id,
  label,
  value,
  onChange,
  options,
  required,
  hint,
  error,
  placeholder = "Selecione",
  className,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: readonly Option[];
  required?: boolean;
  hint?: string;
  error?: string;
  placeholder?: string;
  className?: string;
}) {
  return (
    <Field id={id} label={label} required={required} hint={hint} error={error} className={className}>
      <Select
        value={value || null}
        onValueChange={(v) => onChange((v as string | null) ?? "")}
        items={options.map((o) => ({ value: o.value, label: o.label }))}
      >
        <SelectTrigger
          id={id}
          className="h-9 w-full"
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${id}-erro` : undefined}
        >
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {options.map((o) => (
            <SelectItem key={o.value} value={o.value}>
              {o.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </Field>
  );
}

/** Seleção múltipla em pílulas (fontes de renda, origem dos recursos). */
export function ChipGroup({
  label,
  options,
  selected,
  onToggle,
  hint,
}: {
  label: string;
  options: readonly string[];
  selected: string[];
  onToggle: (value: string) => void;
  hint?: string;
}) {
  return (
    <fieldset className="space-y-2">
      <legend className="text-[11px] font-bold uppercase tracking-wide text-card-beige-muted-foreground">
        {label} <span className="font-medium normal-case tracking-normal text-card-beige-muted-foreground/70">(opcional)</span>
      </legend>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => {
          const active = selected.includes(option);
          return (
            <button
              key={option}
              type="button"
              aria-pressed={active}
              onClick={() => onToggle(option)}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition-all duration-150 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
                active
                  ? "border-primary bg-primary text-primary-foreground shadow-sm"
                  : "border-black/15 bg-card text-foreground hover:border-primary/60 hover:bg-primary/5",
              )}
            >
              {active ? <Check className="size-3" aria-hidden /> : null}
              {option}
            </button>
          );
        })}
      </div>
      {hint ? <p className="text-xs text-card-beige-muted-foreground">{hint}</p> : null}
    </fieldset>
  );
}

export function SectionTitle({ title, description, action }: { title: string; description?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-2 border-b border-black/10 pb-2">
      <div>
        <h3 className="text-sm font-bold text-foreground">{title}</h3>
        {description ? <p className="mt-0.5 text-xs text-card-beige-muted-foreground">{description}</p> : null}
      </div>
      {action}
    </div>
  );
}

export function Toggle({
  id,
  checked,
  onChange,
  label,
  description,
}: {
  id: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  description?: string;
}) {
  return (
    <label htmlFor={id} className="flex cursor-pointer items-start gap-3">
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={cn(
          "relative mt-0.5 inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
          checked ? "bg-primary" : "bg-black/20",
        )}
      >
        <span
          className={cn(
            "inline-block size-4 rounded-full bg-white shadow transition-transform",
            checked ? "translate-x-[18px]" : "translate-x-0.5",
          )}
        />
      </button>
      <span>
        <span className="block text-sm font-semibold text-foreground">{label}</span>
        {description ? <span className="block text-xs text-card-beige-muted-foreground">{description}</span> : null}
      </span>
    </label>
  );
}
