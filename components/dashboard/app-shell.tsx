"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { X } from "lucide-react";
import { motion } from "motion/react";
import type { ReactNode } from "react";
import { useState } from "react";

import { navigationGroups } from "@/lib/mock/dashboard";
import { useTheme } from "@/lib/hooks/use-theme";

import { DashboardHeader } from "./dashboard-header";

function NavList({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <>
      {navigationGroups.map((group, groupIndex) => (
        <div key={`${group.title ?? "principal"}-${groupIndex}`} className="mb-6 last:mb-0">
          {group.title ? (
            <p className="mb-2 px-3 text-label font-bold uppercase text-muted-foreground">
              {group.title}
            </p>
          ) : null}

          <ul className="space-y-1">
            {group.items.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;

              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={onNavigate}
                    className={[
                      "group flex min-h-[46px] items-center gap-3 rounded-xl px-3 py-2.5",
                      "text-sm font-semibold transition-colors duration-150",
                      isActive
                        ? "bg-primary text-primary-foreground shadow-nav-active"
                        : "text-foreground/80 hover:bg-foreground/[0.06] hover:text-foreground",
                    ].join(" ")}
                  >
                    <span
                      className={[
                        "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border",
                        "transition-colors duration-150",
                        isActive
                          ? "border-primary-foreground/20 bg-primary-foreground/10 text-primary-foreground"
                          : "border-border bg-foreground/[0.04] text-muted-foreground group-hover:border-primary/50 group-hover:text-foreground",
                      ].join(" ")}
                    >
                      <Icon className="h-[17px] w-[17px]" strokeWidth={1.8} />
                    </span>

                    <span className="min-w-0 flex-1 truncate">{item.label}</span>

                    {item.badge ? (
                      <span
                        className={[
                          "shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-bold",
                          isActive
                            ? "border-primary-foreground/20 bg-primary-foreground/10 text-primary-foreground"
                            : "border-border bg-foreground/[0.04] text-muted-foreground",
                        ].join(" ")}
                      >
                        {item.badge}
                      </span>
                    ) : null}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </>
  );
}

function BrandMark({ compact = false }: { compact?: boolean }) {
  const size = compact ? 40 : 44;

  return (
    <div className="flex items-center gap-3">
      <div
        className="flex shrink-0 items-center justify-center overflow-hidden rounded-xl bg-white ring-1 ring-white/10"
        style={{ height: size, width: size }}
      >
        <Image
          src="/primo-invest-logo.png"
          alt="Primo Invest"
          width={size}
          height={size}
          className="object-contain"
          style={{ height: size, width: size }}
          priority
        />
      </div>

      <div className="min-w-0">
        <p className="text-label font-bold uppercase text-accent">Primo</p>
        <p className="mt-0.5 text-[18px] font-bold tracking-[0.12em] text-foreground">
          INVEST
        </p>
      </div>
    </div>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const { theme, mounted, toggleTheme } = useTheme();
  const [mobileMenu, setMobileMenu] = useState(false);

  return (
    <div className="min-h-screen w-full bg-background text-foreground">
      <div className="flex min-h-screen w-full">
        {/* SIDEBAR */}
        <aside className="hidden w-[272px] shrink-0 flex-col border-r border-border bg-background lg:flex">
          <div className="flex h-[76px] shrink-0 items-center border-b border-border px-6">
            <BrandMark />
          </div>

          <nav className="min-h-0 flex-1 overflow-y-auto px-4 py-5">
            <NavList />
          </nav>
        </aside>

        {/* MOBILE SIDEBAR */}
        {mobileMenu ? (
          <div className="fixed inset-0 z-50 lg:hidden">
            <button
              type="button"
              aria-label="Fechar menu"
              className="absolute inset-0 bg-black/50"
              onClick={() => setMobileMenu(false)}
            />

            <motion.aside
              initial={{ x: -24, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="relative flex h-full w-[290px] flex-col border-r border-border bg-background"
            >
              <div className="flex h-[76px] shrink-0 items-center justify-between border-b border-border px-5">
                <BrandMark compact />

                <button
                  type="button"
                  onClick={() => setMobileMenu(false)}
                  aria-label="Fechar menu"
                  className="rounded-lg p-2 text-foreground"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <nav className="min-h-0 flex-1 overflow-y-auto px-4 py-5">
                <NavList onNavigate={() => setMobileMenu(false)} />
              </nav>
            </motion.aside>
          </div>
        ) : null}

        {/* APPLICATION */}
        <div className="flex min-w-0 flex-1 flex-col">
          <DashboardHeader
            theme={theme}
            mounted={mounted}
            onToggleTheme={toggleTheme}
            onOpenMenu={() => setMobileMenu(true)}
          />

          <main className="min-w-0 flex-1 px-4 pb-10 pt-6 md:px-7 xl:px-9">
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              className="mx-auto w-full max-w-[1800px]"
            >
              {children}
            </motion.div>
          </main>
        </div>
      </div>
    </div>
  );
}
