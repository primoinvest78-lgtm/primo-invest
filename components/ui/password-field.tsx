"use client";

import { Eye, EyeOff } from "lucide-react";
import { useState } from "react";

import { AUTH_INPUT_CLASS } from "@/lib/utils/auth-ui";

/**
 * Campo de senha com botão de mostrar/ocultar (ícone do olho) —
 * compartilhado entre login e redefinir-senha pra garantir que os
 * dois se comportam e aparecem exatamente igual.
 */
export function PasswordField({
  id,
  label,
  value,
  onChange,
  autoComplete,
  autoFocus,
  labelExtra,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  autoComplete: "current-password" | "new-password";
  autoFocus?: boolean;
  /** Ex.: o link "Esqueci minha senha" ao lado do rótulo, no login. */
  labelExtra?: React.ReactNode;
}) {
  const [visible, setVisible] = useState(false);

  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between gap-2">
        <label
          htmlFor={id}
          className="block text-label font-bold uppercase text-card-beige-muted-foreground"
        >
          {label}
        </label>
        {labelExtra}
      </div>
      <div className="relative">
        <input
          id={id}
          type={visible ? "text" : "password"}
          required
          autoComplete={autoComplete}
          autoFocus={autoFocus}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className={`${AUTH_INPUT_CLASS} pr-11`}
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? "Ocultar senha" : "Mostrar senha"}
          aria-pressed={visible}
          className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-card-beige-muted-foreground transition-colors hover:text-accent"
        >
          {visible ? <EyeOff className="h-[18px] w-[18px]" /> : <Eye className="h-[18px] w-[18px]" />}
        </button>
      </div>
    </div>
  );
}
