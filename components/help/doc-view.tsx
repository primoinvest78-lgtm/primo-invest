import Link from "next/link";

import styles from "@/components/help/help.module.css";
import type { RenderedDoc } from "@/lib/help/content";

/** Página de um documento: título, índice lateral, texto e navegação anterior/próximo. */
export function DocView({
  crumb,
  title,
  doc,
  notice,
  prev,
  next,
}: {
  crumb: string;
  title: string;
  doc: RenderedDoc;
  notice?: string;
  prev?: { href: string; title: string } | null;
  next?: { href: string; title: string } | null;
}) {
  return (
    <article>
      <p className={styles.crumbs}>{crumb}</p>
      <h1 className={styles.title}>{title}</h1>
      {notice ? <p className={styles.notice}>{notice}</p> : null}
      <div className={styles.articleGrid}>
        {/* Conteúdo vem de docs/ versionado no repositório — fonte confiável. */}
        <div className={styles.prose} dangerouslySetInnerHTML={{ __html: doc.html }} />
        {doc.headings.length > 2 ? (
          <nav className={styles.toc} aria-label="Nesta página">
            <p>Nesta página</p>
            {doc.headings.map((h) => (
              <a key={h.id} href={`#${h.id}`}>
                {h.text}
              </a>
            ))}
          </nav>
        ) : null}
      </div>
      {prev || next ? (
        <nav className={styles.pager} aria-label="Outros manuais">
          {prev ? (
            <Link href={prev.href}>
              <span>← Anterior</span>
              <strong>{prev.title}</strong>
            </Link>
          ) : (
            <div />
          )}
          {next ? (
            <Link href={next.href} className={styles.pagerNext}>
              <span>Próximo →</span>
              <strong>{next.title}</strong>
            </Link>
          ) : null}
        </nav>
      ) : null}
    </article>
  );
}
