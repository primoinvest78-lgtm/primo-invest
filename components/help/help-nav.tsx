"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import styles from "@/components/help/help.module.css";

export type NavGroup = { title: string; articles: { slug: string; title: string }[] };

const TOP_LINKS = [
  { href: "/ajuda", label: "Manual de uso" },
  { href: "/privacidade", label: "Política de Privacidade" },
  { href: "/termos", label: "Termos de Uso" },
];

export function HelpTopNav() {
  const pathname = usePathname();
  return (
    <nav className={styles.topnav} aria-label="Central de Ajuda">
      {TOP_LINKS.map((l) => {
        const active = l.href === "/ajuda" ? pathname.startsWith("/ajuda") : pathname === l.href;
        return (
          <Link key={l.href} href={l.href} aria-current={active ? "page" : undefined}>
            {l.label}
          </Link>
        );
      })}
      <Link href="/dashboard" className={styles.back}>
        Voltar ao sistema
      </Link>
    </nav>
  );
}

function Groups({ groups }: { groups: NavGroup[] }) {
  const pathname = usePathname();
  return (
    <>
      {groups.map((g) => (
        <div key={g.title} className={styles.sideGroup}>
          <p className={styles.sideTitle}>{g.title}</p>
          {g.articles.map((a) => {
            const href = `/ajuda/${a.slug}`;
            return (
              <Link key={a.slug} href={href} className={styles.sideLink} aria-current={pathname === href ? "page" : undefined}>
                {a.title}
              </Link>
            );
          })}
        </div>
      ))}
      <div className={styles.sideGroup}>
        <p className={styles.sideTitle}>Documentos legais</p>
        <Link href="/privacidade" className={styles.sideLink} aria-current={pathname === "/privacidade" ? "page" : undefined}>
          Política de Privacidade
        </Link>
        <Link href="/termos" className={styles.sideLink} aria-current={pathname === "/termos" ? "page" : undefined}>
          Termos de Uso
        </Link>
      </div>
    </>
  );
}

export function HelpSidebar({ groups }: { groups: NavGroup[] }) {
  return (
    <>
      <aside className={styles.sidebar} aria-label="Módulos">
        <Link href="/ajuda" className={styles.sideLink} style={{ fontWeight: 800, marginBottom: 12 }}>
          Início da ajuda
        </Link>
        <Groups groups={groups} />
      </aside>
      <details className={styles.mobileNav}>
        <summary>Módulos e documentos</summary>
        <div style={{ marginTop: 12 }}>
          <Groups groups={groups} />
        </div>
      </details>
    </>
  );
}
