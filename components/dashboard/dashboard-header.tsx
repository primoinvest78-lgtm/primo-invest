"use client";

import { Bell, ChevronDown, Menu, Moon, Search, Sun } from "lucide-react";
import { motion } from "motion/react";

import type { Theme } from "@/lib/hooks/use-theme";

export function DashboardHeader({
  theme,
  mounted,
  onToggleTheme,
  onOpenMenu,
}: {
  theme: Theme;
  mounted: boolean;
  onToggleTheme: () => void;
  onOpenMenu: () => void;
}) {
  const isLight = theme === "light";

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur-md">
      <div className="flex min-h-[76px] items-center gap-3 px-4 md:px-6 xl:px-8">
        <button
          type="button"
          onClick={onOpenMenu}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-border bg-card text-foreground lg:hidden"
          aria-label="Abrir menu"
        >
          <Menu className="h-5 w-5" />
        </button>

        <div className="hidden min-w-0 shrink-0 lg:block">
          <p className="text-label font-bold uppercase text-accent">
            Primo Invest
          </p>

          <h2 className="mt-1 text-[15px] font-semibold text-foreground">
            Dashboard executivo
          </h2>
        </div>

        <div className="min-w-0 flex-1 lg:ml-auto lg:max-w-[520px]">
          <label className="relative flex items-center">
            <Search className="pointer-events-none absolute left-4 h-[17px] w-[17px] text-muted-foreground" />

            <input
              type="search"
              placeholder="Buscar clientes, investimentos e documentos..."
              className="h-11 w-full rounded-xl border border-border bg-muted pl-11 pr-4 text-sm font-medium text-foreground outline-none transition-shadow focus:ring-4 focus:ring-ring/20"
            />
          </label>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          {mounted ? (
            <motion.button
              type="button"
              whileTap={{ scale: 0.96 }}
              onClick={onToggleTheme}
              aria-label={isLight ? "Ativar tema escuro" : "Ativar tema claro"}
              className="flex h-11 w-11 items-center justify-center rounded-xl border border-border bg-card text-accent"
            >
              {isLight ? (
                <Moon className="h-[17px] w-[17px]" />
              ) : (
                <Sun className="h-[17px] w-[17px]" />
              )}
            </motion.button>
          ) : (
            <span className="hidden h-11 w-11 sm:block" aria-hidden="true" />
          )}

          <div className="hidden h-11 items-center gap-2 rounded-xl border border-border bg-card px-3 text-xs font-semibold text-foreground sm:flex">
            <span className="h-2 w-2 rounded-full bg-success" />
            Produção
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          </div>

          <button
            type="button"
            aria-label="Notificações"
            className="relative flex h-11 w-11 items-center justify-center rounded-xl border border-border bg-card text-foreground"
          >
            <Bell className="h-[18px] w-[18px]" />

            <span className="absolute right-1.5 top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[8px] font-bold text-primary-foreground">
              3
            </span>
          </button>

          <button
            type="button"
            className="flex h-11 items-center gap-2 rounded-xl border border-border bg-card px-2.5 sm:px-3"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-[13px] font-bold text-primary-foreground">
              A
            </span>

            <span className="hidden text-left sm:block">
              <span className="block text-[13px] font-semibold text-foreground">
                Anderson
              </span>

              <span className="mt-0.5 block text-label font-bold uppercase text-muted-foreground">
                Diretor
              </span>
            </span>

            <ChevronDown className="hidden h-4 w-4 text-muted-foreground sm:block" />
          </button>
        </div>
      </div>
    </header>
  );
}
