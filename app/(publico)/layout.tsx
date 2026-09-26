import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";

import { HelpSidebar, HelpTopNav } from "@/components/help/help-nav";
import styles from "@/components/help/help.module.css";
import { LOGO_SRC } from "@/lib/constants/brand";
import { HELP_GROUPS } from "@/lib/help/content";

/**
 * Área externa (sem login): Manual de uso, Política de Privacidade e
 * Termos de Uso. Liberada no proxy — ver PUBLIC_OPEN_PATHS em
 * lib/supabase/middleware.ts.
 */
export default function PublicLayout({ children }: { children: ReactNode }) {
  const groups = HELP_GROUPS.map((g) => ({ title: g.title, articles: g.articles.map((a) => ({ slug: a.slug, title: a.title })) }));
  return (
    <div className={styles.page}>
      <header className={styles.topbar}>
        <div className={styles.topbarInner}>
          <Link href="/ajuda" className={styles.brand}>
            <Image src={LOGO_SRC} alt="" width={36} height={36} style={{ borderRadius: 8, background: "#fff" }} />
            <span>
              <small>Primo Invest</small>
              Central de Ajuda
            </span>
          </Link>
          <HelpTopNav />
        </div>
      </header>
      <div className={styles.layout}>
        <HelpSidebar groups={groups} />
        <main className={styles.main}>{children}</main>
      </div>
      <footer className={styles.footer}>
        <Link href="/ajuda">Manual de uso</Link>·<Link href="/privacidade">Política de Privacidade</Link>·
        <Link href="/termos">Termos de Uso</Link>
        <p style={{ marginTop: 8 }}>Primo Invest · Central de Ajuda</p>
      </footer>
    </div>
  );
}
