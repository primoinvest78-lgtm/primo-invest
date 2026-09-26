import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { DocView } from "@/components/help/doc-view";
import { ALL_ARTICLES, loadArticle } from "@/lib/help/content";

export const dynamicParams = false;

export function generateStaticParams() {
  return ALL_ARTICLES.map((a) => ({ slug: a.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const article = ALL_ARTICLES.find((a) => a.slug === slug);
  return { title: article ? `${article.title} · Ajuda | Primo Invest` : "Ajuda | Primo Invest" };
}

export default async function ManualPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const loaded = loadArticle(slug);
  if (!loaded) notFound();
  const index = ALL_ARTICLES.findIndex((a) => a.slug === slug);
  const prev = ALL_ARTICLES[index - 1];
  const next = ALL_ARTICLES[index + 1];

  return (
    <DocView
      crumb={`Manual de uso · ${loaded.article.group}`}
      title={loaded.article.title}
      doc={loaded.doc}
      prev={prev ? { href: `/ajuda/${prev.slug}`, title: prev.title } : null}
      next={next ? { href: `/ajuda/${next.slug}`, title: next.title } : { href: "/privacidade", title: "Política de Privacidade" }}
    />
  );
}
